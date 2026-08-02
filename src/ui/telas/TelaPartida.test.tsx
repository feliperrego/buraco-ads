import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TelaPartida from './TelaPartida.tsx'
import type { Carta, Comando, VisaoDoJogador } from '../../engine/index.ts'

/**
 * Critérios de interface das specs 0001 §6 e 0002 §6, nível 4 da
 * testing-strategy.md: comportamento, nunca aparência (RNF2.2).
 *
 * A visão é montada à mão em vez de vir de `iniciarPartida`, e isso é
 * deliberado: a tela recebe `VisaoDoJogador` por propriedade (spec 0001 §4.2),
 * então o teste dela não deve depender da engine. A lista de movimentos entra
 * pelo mesmo caminho — a tela **filtra** por ela e nunca valida (T6).
 */
afterEach(cleanup)

type Naipe = Carta['naipe']
type Valor = Carta['valor']

/**
 * Cartas com valores distintos de propósito: a tela rotula cada botão pelo nome
 * legível da carta, e um fixture com onze "3 de copas" tornaria os rótulos
 * ambíguos — o teste passaria a depender da ordem de renderização.
 */
function carta(naipe: Naipe, valor: Valor, copia = 1): Carta {
  return { id: `${naipe}-${valor}-${String(copia)}`, naipe, valor }
}

const ONZE_VALORES: readonly Valor[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J']

function visaoInicial(ajustes: Partial<VisaoDoJogador> = {}): VisaoDoJogador {
  return {
    eu: 0,
    mao: ONZE_VALORES.map((valor) => carta('COPAS', valor)),
    lixo: [],
    meusJogos: [],
    jogosDoAdversario: [],
    cartasNoMonte: 60,
    cartasNaMaoDoAdversario: 11,
    mortosRestantes: 2,
    placar: [0, 0],
    jogadorDaVez: 0,
    fase: 'Compra',
    numeroDaRodada: 1,
    ...ajustes,
  }
}

function descartesDe(visao: VisaoDoJogador): readonly Comando[] {
  return visao.mao.map((daMao) => ({ tipo: 'descartar', carta: daMao.id }))
}

/**
 * Os dois critérios abaixo se parecem e cobrem coisas diferentes, de propósito.
 *
 * O CA-S1-1 nasceu na H1, quando a mesa nunca respondia. Depois da H2 ele passou
 * a valer como caso de **componente**: dada uma lista de movimentos vazia, a
 * tela não oferece nada. O CA-S18-1 cobre o caso de **turno**, que é a razão
 * pela qual a lista chega vazia na prática.
 *
 * Mantê-los separados foi decisão explícita: se um dia a tela passar a inventar
 * interatividade que não veio da lista, é o CA-S1-1 que reprova — e ele reprova
 * mesmo que a regra de vez esteja certa.
 */
describe('S1 e S18 — quando a mesa não responde', () => {
  it('CA-S1-1 — sem movimentos disponíveis, nenhum elemento da mesa responde a clique', () => {
    render(<TelaPartida visao={visaoInicial()} movimentos={[]} aoJogar={vi.fn()} />)

    // A âncora positiva vem primeiro, e é o que dá sentido ao resto: sem ela,
    // um componente que não renderiza nada passaria neste critério de graça.
    expect(screen.getAllByRole('region').length).toBeGreaterThan(0)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })

  it('CA-S18-1 — na vez do adversário, nenhum elemento da mesa responde a clique', () => {
    const visao = visaoInicial({ jogadorDaVez: 1 })

    // A S20 já garante que `movimentosValidos` devolve vazio aqui. A tela não
    // reimplementa isso: ela simplesmente não tem o que oferecer.
    render(<TelaPartida visao={visao} movimentos={[]} aoJogar={vi.fn()} />)

    expect(screen.getAllByRole('region').length).toBeGreaterThan(0)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})

describe('RF3.3 e R4.3 — o que a mesa mostra', () => {
  it('CA-S1-2 — a contagem do monte mostra 60 e o lixo indica vazio', () => {
    render(<TelaPartida visao={visaoInicial()} movimentos={[]} aoJogar={vi.fn()} />)

    expect(screen.getByRole('region', { name: /monte/i }).textContent).toContain('60')
    expect(screen.getByRole('region', { name: /lixo/i }).textContent).toMatch(/vazio/i)
  })

  it('CA-R4.3-2 — com três cartas no lixo, a tela mostra as três, não só a contagem', () => {
    const lixo = [carta('COPAS', 'K'), carta('OUROS', '7', 2), carta('PAUS', 'A')]

    render(<TelaPartida visao={visaoInicial({ lixo })} movimentos={[]} aoJogar={vi.fn()} />)

    const painel = screen.getByRole('region', { name: /lixo/i })

    // R4.3 é a característica central do Buraco Aberto: o lixo inteiro é
    // público. Mostrar "3 cartas" satisfaria uma contagem e violaria a regra.
    expect(painel.textContent).toMatch(/k de copas/i)
    expect(painel.textContent).toMatch(/7 de ouros/i)
    expect(painel.textContent).toMatch(/a de paus/i)
  })

  it('CA-RF2.2-1 — de quem é a vez e qual a fase estão sempre indicados', () => {
    render(<TelaPartida visao={visaoInicial({ fase: 'Acao' })} movimentos={[]} aoJogar={vi.fn()} />)

    const painel = screen.getByRole('region', { name: /vez e fase/i })

    expect(painel.textContent).toMatch(/vez/i)
    expect(painel.textContent).toMatch(/ação|acao/i)
  })
})

describe('S27 — descartar exige selecionar e confirmar', () => {
  it('CA-S27-1 — sem carta selecionada, não existe ação de confirmar descarte', () => {
    const visao = visaoInicial({ fase: 'Acao' })

    render(<TelaPartida visao={visao} movimentos={descartesDe(visao)} aoJogar={vi.fn()} />)

    // Âncora positiva: a mão precisa estar selecionável antes de fazer sentido
    // afirmar que o confirmar está ausente. Sem isto, uma tela que não renderiza
    // botão nenhum passaria neste critério de graça — foi o que aconteceu na
    // primeira execução deste teste.
    expect(screen.getAllByRole('button')).toHaveLength(visao.mao.length)

    expect(screen.queryByRole('button', { name: /descartar/i })).toBeNull()
  })

  it('CA-S27-2 — com uma carta selecionada, confirmar descarta aquela carta', () => {
    const visao = visaoInicial({ fase: 'Acao' })
    const aoJogar = vi.fn()

    render(<TelaPartida visao={visao} movimentos={descartesDe(visao)} aoJogar={aoJogar} />)

    // "4 de copas" — quarto valor da lista, e único na mão.
    const alvo = visao.mao[3]
    expect(alvo).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: /^4 de copas$/i }))

    // A RF2.3 não tem desfazer: o primeiro toque seleciona e não descarta.
    expect(aoJogar).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /descartar/i }))

    expect(aoJogar).toHaveBeenCalledWith({ tipo: 'descartar', carta: alvo?.id })
  })
})

/**
 * Critérios de interface da spec 0004 §6, nível 4.
 *
 * A H2 tinha seleção de **uma** carta. A S48 troca isso por um **conjunto**, e o
 * botão de confirmar aparece para todo comando cujas cartas sejam exatamente a
 * seleção. Com isso `descartar` vira o caso unitário e perde o caminho próprio:
 * a interface filtra a lista e continua sem saber o que é uma sequência (T6).
 */

const SEQUENCIA: readonly Valor[] = ['5', '6', '7']

function baixarDe(valores: readonly Valor[]): Comando {
  return { tipo: 'baixar', cartas: valores.map((valor) => ({ carta: carta('COPAS', valor).id })) }
}

describe('S48 e S49 — seleção por conjunto', () => {
  it('CA-S48-1 — três cartas que formam sequência oferecem Baixar, e ele baixa aquelas três', () => {
    const visao = visaoInicial({ fase: 'Acao' })
    const baixar = baixarDe(SEQUENCIA)
    const aoJogar = vi.fn()

    render(
      <TelaPartida visao={visao} movimentos={[...descartesDe(visao), baixar]} aoJogar={aoJogar} />,
    )

    for (const valor of SEQUENCIA) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${valor} de copas$`, 'i') }))
    }

    fireEvent.click(screen.getByRole('button', { name: /^baixar$/i }))

    expect(aoJogar).toHaveBeenCalledWith(baixar)
  })

  it('CA-S48-2 — com uma carta selecionada, aparece Descartar e não aparece Baixar', () => {
    const visao = visaoInicial({ fase: 'Acao' })

    render(
      <TelaPartida
        visao={visao}
        movimentos={[...descartesDe(visao), baixarDe(SEQUENCIA)]}
        aoJogar={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^5 de copas$/i }))

    // Nenhum dos dois botões é decidido pela interface: os dois saem do mesmo
    // filtro sobre `movimentos`. O conjunto unitário casa com `descartar`, e não
    // com o `baixar` de três cartas.
    expect(screen.getByRole('button', { name: /descartar/i })).toBeDefined()
    expect(screen.queryByRole('button', { name: /^baixar$/i })).toBeNull()
  })

  it('CA-S49-1 — com uma carta selecionada, as que não a acompanham ficam inertes', () => {
    const visao = visaoInicial({ fase: 'Acao' })

    render(
      <TelaPartida
        visao={visao}
        movimentos={[...descartesDe(visao), baixarDe(SEQUENCIA)]}
        aoJogar={vi.fn()}
      />,
    )

    // Âncora positiva: antes de selecionar, a mão inteira responde.
    expect(screen.getAllByRole('button')).toHaveLength(visao.mao.length)

    fireEvent.click(screen.getByRole('button', { name: /^5 de copas$/i }))

    // Só 6 e 7 acompanham o 5 em algum comando. O 5 continua respondendo, para
    // que dê para desfazer a seleção.
    expect(screen.getByRole('button', { name: /^6 de copas$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^7 de copas$/i })).toBeDefined()
    expect(screen.queryByRole('button', { name: /^a de copas$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^j de copas$/i })).toBeNull()
  })
})

describe('R6.1 — o jogo baixado fica visível na mesa', () => {
  it('CA-R6.1-1 — com um jogo em meusJogos, a área mostra as cartas dele', () => {
    const meusJogos = [
      {
        id: 'J0-COPAS-5-1',
        dono: 0 as const,
        naipe: 'COPAS' as const,
        posicoes: SEQUENCIA.map((valor) => ({
          tipo: 'Natural' as const,
          carta: carta('COPAS', valor),
        })),
      },
    ]

    render(<TelaPartida visao={visaoInicial({ meusJogos })} movimentos={[]} aoJogar={vi.fn()} />)

    const painel = screen.getByRole('region', { name: /meus jogos/i })

    // A metade observável da CA-R6.1-1: a engine põe o jogo em `meusJogos`, e
    // sem isto o jogador não teria como saber o que baixou. A U5 exige as duas
    // coisas — regra com teste **e** comportamento observável.
    expect(painel.textContent).toMatch(/5 de copas/i)
    expect(painel.textContent).toMatch(/6 de copas/i)
    expect(painel.textContent).toMatch(/7 de copas/i)
    expect(painel.textContent).not.toMatch(/nenhum jogo/i)
  })
})

/**
 * Critérios de interface da spec 0005 §6.3.
 *
 * S60 — as mesmas três cartas podem formar dois jogos diferentes (spec 0005
 * §2.1), então dois comandos passam a casar com a mesma seleção. O rótulo é o
 * que os distingue, e a tela o monta lendo `representa` — sem saber o que é uma
 * sequência (T6).
 */
describe('S60 — dois comandos para a mesma seleção', () => {
  const SEM_CURINGA: Comando = {
    tipo: 'baixar',
    cartas: [
      { carta: carta('COPAS', '2').id },
      { carta: carta('COPAS', '3').id },
      { carta: carta('COPAS', '4').id },
    ],
  }

  const COM_CURINGA: Comando = {
    tipo: 'baixar',
    cartas: [
      { carta: carta('COPAS', '3').id },
      { carta: carta('COPAS', '4').id },
      { carta: carta('COPAS', '2').id, representa: '5' },
    ],
  }

  function selecionarAsTres() {
    for (const valor of ['2', '3', '4'] as const) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${valor} de copas$`, 'i') }))
    }
  }

  it('CA-S60-1 — com as duas leituras disponíveis, aparecem dois botões com rótulos diferentes', () => {
    const visao = visaoInicial({ fase: 'Acao' })

    render(
      <TelaPartida
        visao={visao}
        movimentos={[...descartesDe(visao), SEM_CURINGA, COM_CURINGA]}
        aoJogar={vi.fn()}
      />,
    )

    selecionarAsTres()

    const confirmacoes = screen
      .getAllByRole('button')
      .map((botao) => botao.textContent)
      .filter((texto) => /^baixar/i.test(texto))

    expect(confirmacoes).toHaveLength(2)
    expect(new Set(confirmacoes).size).toBe(2)
  })

  it('CA-S60-2 — o botão da leitura com curinga baixa o jogo com a posição Curinga', () => {
    const visao = visaoInicial({ fase: 'Acao' })
    const aoJogar = vi.fn()

    render(
      <TelaPartida
        visao={visao}
        movimentos={[...descartesDe(visao), SEM_CURINGA, COM_CURINGA]}
        aoJogar={aoJogar}
      />,
    )

    selecionarAsTres()

    // O rótulo nomeia o que distingue: qual carta é o curinga e o que ela vale.
    fireEvent.click(screen.getByRole('button', { name: /2 de copas valendo 5/i }))

    expect(aoJogar).toHaveBeenCalledWith(COM_CURINGA)
  })
})

describe('R1.3 — o papel do curinga é visível na mesa', () => {
  it('CA-R1.3-2 — um jogo com curinga mostra o que a carta está valendo', () => {
    const meusJogos = [
      {
        id: 'J0-OUROS-3-1',
        dono: 0 as const,
        naipe: 'OUROS' as const,
        posicoes: [
          { tipo: 'Natural' as const, carta: carta('OUROS', '3') },
          { tipo: 'Natural' as const, carta: carta('OUROS', '4') },
          { tipo: 'Curinga' as const, carta: carta('OUROS', '2'), representa: '5' as const },
        ],
      },
    ]

    render(<TelaPartida visao={visaoInicial({ meusJogos })} movimentos={[]} aoJogar={vi.fn()} />)

    const painel = screen.getByRole('region', { name: /meus jogos/i })

    // Sem isto, este jogo é indistinguível de `2-3-4` baixado sem curinga — e
    // escolher entre os dois é a decisão central da fatia. A verificação no
    // navegador foi o que encontrou a falta: a mesa mostrava as três cartas e
    // nada mais.
    expect(painel.textContent).toMatch(/2 de ouros valendo 5/i)
    expect(painel.textContent).toMatch(/3 de ouros/i)
  })
})

/**
 * Critérios de interface da spec 0006 §6.3.
 *
 * S74 — o `aumentar` é o primeiro comando que aponta para algo **já na mesa**, e
 * com dois jogos do mesmo naipe a mesma carta aumenta os dois. O rótulo nomeia o
 * alvo pelas pontas do jogo; a tela lê `meusJogos` e monta o texto, continuando
 * sem saber o que é uma sequência (T6).
 */
describe('S74 — o rótulo nomeia o jogo alvo', () => {
  const JOGO_BAIXO = {
    id: 'J0-COPAS-A-1',
    dono: 0 as const,
    naipe: 'COPAS' as const,
    posicoes: [
      { tipo: 'Natural' as const, carta: carta('COPAS', 'A') },
      { tipo: 'Natural' as const, carta: carta('COPAS', '2') },
      { tipo: 'Natural' as const, carta: carta('COPAS', '3') },
    ],
  }

  const JOGO_ALTO = {
    id: 'J0-COPAS-5-1',
    dono: 0 as const,
    naipe: 'COPAS' as const,
    posicoes: [
      { tipo: 'Natural' as const, carta: carta('COPAS', '5') },
      { tipo: 'Natural' as const, carta: carta('COPAS', '6') },
      { tipo: 'Natural' as const, carta: carta('COPAS', '7') },
    ],
  }

  const QUATRO = carta('COPAS', '4')

  const AUMENTAR_BAIXO: Comando = {
    tipo: 'aumentar',
    jogo: JOGO_BAIXO.id,
    cartas: [{ carta: QUATRO.id }],
  }

  const AUMENTAR_ALTO: Comando = {
    tipo: 'aumentar',
    jogo: JOGO_ALTO.id,
    cartas: [{ carta: QUATRO.id }],
  }

  function visaoComDoisJogos(): VisaoDoJogador {
    return visaoInicial({
      fase: 'Acao',
      mao: [QUATRO, carta('OUROS', 'K'), carta('PAUS', '9')],
      meusJogos: [JOGO_BAIXO, JOGO_ALTO],
    })
  }

  it('CA-S74-1 — com dois jogos aumentáveis, aparecem dois botões com rótulos diferentes', () => {
    const visao = visaoComDoisJogos()

    render(
      <TelaPartida
        visao={visao}
        movimentos={[...descartesDe(visao), AUMENTAR_BAIXO, AUMENTAR_ALTO]}
        aoJogar={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^4 de copas$/i }))

    const confirmacoes = screen
      .getAllByRole('button')
      .map((botao) => botao.textContent)
      .filter((texto) => /^aumentar/i.test(texto))

    // As mesmas cartas, dois alvos. Sem as pontas no rótulo, os dois botões
    // seriam "Aumentar" e "Aumentar", e o jogador escolheria no escuro — a mesma
    // falha que a S60 corrigiu na H5 para as duas leituras do mesmo conjunto.
    expect(confirmacoes).toHaveLength(2)
    expect(confirmacoes.some((texto) => /de a a 3 de copas/i.test(texto ?? ''))).toBe(true)
    expect(confirmacoes.some((texto) => /de 5 a 7 de copas/i.test(texto ?? ''))).toBe(true)
  })

  it('CA-S74-2 — o botão do jogo alto envia o comando daquele jogo', () => {
    const visao = visaoComDoisJogos()
    const aoJogar = vi.fn()

    render(
      <TelaPartida
        visao={visao}
        movimentos={[...descartesDe(visao), AUMENTAR_BAIXO, AUMENTAR_ALTO]}
        aoJogar={aoJogar}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^4 de copas$/i }))
    fireEvent.click(screen.getByRole('button', { name: /de 5 a 7 de copas/i }))

    expect(aoJogar).toHaveBeenCalledWith(AUMENTAR_ALTO)
  })

  it('CA-S74-2 — depois do aumento, a mesa mostra o jogo maior e a mão perde a carta', () => {
    // A metade **observável**, e é a que escapou duas vezes seguidas: na H4 o
    // jogo baixado não aparecia na mesa, na H5 o jogo com curinga aparecia
    // idêntico ao sem. Nos dois casos a suíte estava verde.
    const crescido = {
      ...JOGO_ALTO,
      posicoes: [{ tipo: 'Natural' as const, carta: QUATRO }, ...JOGO_ALTO.posicoes],
    }

    const visao = visaoInicial({
      fase: 'Acao',
      mao: [carta('OUROS', 'K'), carta('PAUS', '9')],
      meusJogos: [crescido],
    })

    render(<TelaPartida visao={visao} movimentos={[]} aoJogar={vi.fn()} />)

    const mesa = screen.getByRole('region', { name: /meus jogos/i })
    const mao = screen.getByRole('region', { name: /minha mão/i })

    expect(mesa.textContent).toMatch(/4 de copas/i)
    expect(mesa.textContent).toMatch(/7 de copas/i)
    expect(mao.textContent).not.toMatch(/4 de copas/i)
  })

  it('CA-S74-2 — o id do jogo é preservado, e é o que o segundo aumento aponta', () => {
    // A consequência da S63 vista da tela: o botão continua apontando o mesmo
    // jogo depois de ele crescer, que é o que a R3.3 autoriza no mesmo turno.
    const crescido = {
      ...JOGO_ALTO,
      posicoes: [{ tipo: 'Natural' as const, carta: QUATRO }, ...JOGO_ALTO.posicoes],
    }

    const oito = carta('COPAS', '8')
    const visao = visaoInicial({
      fase: 'Acao',
      mao: [oito, carta('OUROS', 'K')],
      meusJogos: [crescido],
    })
    const segundo: Comando = {
      tipo: 'aumentar',
      jogo: JOGO_ALTO.id,
      cartas: [{ carta: oito.id }],
    }
    const aoJogar = vi.fn()

    render(
      <TelaPartida visao={visao} movimentos={[...descartesDe(visao), segundo]} aoJogar={aoJogar} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^8 de copas$/i }))
    fireEvent.click(screen.getByRole('button', { name: /de 4 a 7 de copas/i }))

    expect(aoJogar).toHaveBeenCalledWith(segundo)
  })
})
