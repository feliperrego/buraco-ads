import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TelaPartida from './TelaPartida.tsx'
import type { Carta, Comando, Pontuacao, VisaoDoJogador } from '../../engine/index.ts'

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

/** O nome que a tela dá a uma carta, para achar o botão dela. */
function nomeLegivel(uma: Carta): string {
  return `${uma.valor} de ${uma.naipe.toLowerCase()}`
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
    meusMortos: 0,
    algumMortoVirouMonte: false,
    apuracao: null,
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
    render(
      <TelaPartida visao={visaoInicial()} movimentos={[]} aoJogar={vi.fn()} aoSeguir={vi.fn()} />,
    )

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
    render(<TelaPartida visao={visao} movimentos={[]} aoJogar={vi.fn()} aoSeguir={vi.fn()} />)

    expect(screen.getAllByRole('region').length).toBeGreaterThan(0)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})

describe('RF3.3 e R4.3 — o que a mesa mostra', () => {
  it('CA-S1-2 — a contagem do monte mostra 60 e o lixo indica vazio', () => {
    render(
      <TelaPartida visao={visaoInicial()} movimentos={[]} aoJogar={vi.fn()} aoSeguir={vi.fn()} />,
    )

    expect(screen.getByRole('region', { name: /monte/i }).textContent).toContain('60')
    expect(screen.getByRole('region', { name: /lixo/i }).textContent).toMatch(/vazio/i)
  })

  it('CA-R4.3-2 — com três cartas no lixo, a tela mostra as três, não só a contagem', () => {
    const lixo = [carta('COPAS', 'K'), carta('OUROS', '7', 2), carta('PAUS', 'A')]

    render(
      <TelaPartida
        visao={visaoInicial({ lixo })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /lixo/i })

    // R4.3 é a característica central do Buraco Aberto: o lixo inteiro é
    // público. Mostrar "3 cartas" satisfaria uma contagem e violaria a regra.
    expect(painel.textContent).toMatch(/k de copas/i)
    expect(painel.textContent).toMatch(/7 de ouros/i)
    expect(painel.textContent).toMatch(/a de paus/i)
  })

  it('CA-RF2.2-1 — de quem é a vez e qual a fase estão sempre indicados', () => {
    render(
      <TelaPartida
        visao={visaoInicial({ fase: 'Acao' })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /vez e fase/i })

    expect(painel.textContent).toMatch(/vez/i)
    expect(painel.textContent).toMatch(/ação|acao/i)
  })
})

describe('S27 — descartar exige selecionar e confirmar', () => {
  it('CA-S27-1 — sem carta selecionada, não existe ação de confirmar descarte', () => {
    const visao = visaoInicial({ fase: 'Acao' })

    render(
      <TelaPartida
        visao={visao}
        movimentos={descartesDe(visao)}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

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

    render(
      <TelaPartida
        visao={visao}
        movimentos={descartesDe(visao)}
        aoJogar={aoJogar}
        aoSeguir={vi.fn()}
      />,
    )

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
      <TelaPartida
        visao={visao}
        movimentos={[...descartesDe(visao), baixar]}
        aoJogar={aoJogar}
        aoSeguir={vi.fn()}
      />,
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
        aoSeguir={vi.fn()}
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
        aoSeguir={vi.fn()}
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

    render(
      <TelaPartida
        visao={visaoInicial({ meusJogos })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

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
        aoSeguir={vi.fn()}
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
        aoSeguir={vi.fn()}
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

    render(
      <TelaPartida
        visao={visaoInicial({ meusJogos })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

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
        aoSeguir={vi.fn()}
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
    expect(confirmacoes.some((texto) => /de a a 3 de copas/i.test(texto))).toBe(true)
    expect(confirmacoes.some((texto) => /de 5 a 7 de copas/i.test(texto))).toBe(true)
  })

  it('CA-S74-2 — o botão do jogo alto envia o comando daquele jogo', () => {
    const visao = visaoComDoisJogos()
    const aoJogar = vi.fn()

    render(
      <TelaPartida
        visao={visao}
        movimentos={[...descartesDe(visao), AUMENTAR_BAIXO, AUMENTAR_ALTO]}
        aoJogar={aoJogar}
        aoSeguir={vi.fn()}
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

    render(<TelaPartida visao={visao} movimentos={[]} aoJogar={vi.fn()} aoSeguir={vi.fn()} />)

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
      <TelaPartida
        visao={visao}
        movimentos={[...descartesDe(visao), segundo]}
        aoJogar={aoJogar}
        aoSeguir={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^8 de copas$/i }))
    fireEvent.click(screen.getByRole('button', { name: /de 4 a 7 de copas/i }))

    expect(aoJogar).toHaveBeenCalledWith(segundo)
  })
})

/**
 * Critérios de interface da spec 0007 §6.3.
 *
 * S83 — o risco desta fatia é o **oposto** do da H4 e da H5. Lá faltava a metade
 * observável; aqui ela já existe desde a H1 — a R4.3 exige o lixo inteiro
 * visível — e a implementação de menor esforço a destrói: copiar o painel do
 * monte, que mostra só a contagem porque o monte é oculto (RF3.3).
 */
describe('S83 — o lixo fica acionável sem deixar de ser visível', () => {
  const LIXO = [carta('COPAS', 'K'), carta('OUROS', '7', 2), carta('PAUS', 'A')]
  const PEGAR: Comando = { tipo: 'pegarLixo' }

  it('CA-S83-1 — com pegarLixo na lista, o painel do lixo tem um botão que o envia', () => {
    const aoJogar = vi.fn()

    render(
      <TelaPartida
        visao={visaoInicial({ lixo: LIXO })}
        movimentos={[{ tipo: 'comprarDoMonte' }, PEGAR]}
        aoJogar={aoJogar}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /lixo/i })
    const botao = within(painel).getByRole('button', { name: /pegar o lixo/i })

    fireEvent.click(botao)

    expect(aoJogar).toHaveBeenCalledWith(PEGAR)
  })

  it('CA-S84-1 — o rótulo diz quantas cartas vêm junto', () => {
    render(
      <TelaPartida
        visao={visaoInicial({ lixo: LIXO })}
        movimentos={[PEGAR]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /lixo/i })

    // É a informação que decide a jogada, e repeti-la no botão é o que permite
    // decidir sem contar as cartas na lista ao lado.
    expect(within(painel).getByRole('button', { name: /pegar o lixo/i }).textContent).toContain(
      '3 cartas',
    )
  })

  it('CA-S84-1 — com uma carta só no lixo, o rótulo diz "1 carta"', () => {
    // O defeito que a suíte deixou passar e o navegador achou: o rótulo dizia
    // *"Pegar o lixo — 1 cartas"*. A asserção acima conferia que o número
    // aparecia, não que o texto fosse português. É a terceira fatia seguida em
    // que rodar o app encontra o que teste nenhum pegaria.
    render(
      <TelaPartida
        visao={visaoInicial({ lixo: [carta('COPAS', 'K')] })}
        movimentos={[PEGAR]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /lixo/i })
    const rotulo = within(painel).getByRole('button', { name: /pegar o lixo/i }).textContent

    expect(rotulo).toContain('1 carta')
    expect(rotulo).not.toContain('1 cartas')
  })

  it('CA-S83-2 — sem pegarLixo na lista, o painel do lixo não tem botão', () => {
    // O par negativo. A âncora positiva é a CA-S83-1 acima: sem ela, um painel
    // que nunca renderiza botão passaria aqui de graça — o modo de falha que já
    // aconteceu duas vezes neste projeto (CA-S1-1 e CA-S27-1).
    render(
      <TelaPartida
        visao={visaoInicial({ lixo: LIXO })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /lixo/i })

    expect(within(painel).queryAllByRole('button')).toHaveLength(0)
  })

  it('CA-S83-3 — com o botão presente, as cartas continuam todas listadas (R4.3)', () => {
    render(
      <TelaPartida
        visao={visaoInicial({ lixo: LIXO })}
        movimentos={[PEGAR]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /lixo/i })

    // O erro provável é o painel virar `Pegar o lixo — 3 cartas` e nada mais,
    // que é exatamente o painel do monte. O monte pode: ele é oculto (RF3.3).
    // O lixo não pode: a R4.3 é a característica central do Buraco Aberto.
    expect(painel.textContent).toMatch(/k de copas/i)
    expect(painel.textContent).toMatch(/7 de ouros/i)
    expect(painel.textContent).toMatch(/a de paus/i)
  })

  it('CA-S84-1 — depois do aumento do lixo na mão, o painel indica vazio', () => {
    // A metade observável: o estado seguinte ao clique. A tela é controlada por
    // propriedade, então o que se verifica é que ela **sabe** desenhar o depois.
    render(
      <TelaPartida
        visao={visaoInicial({
          lixo: [],
          mao: [...ONZE_VALORES.map((valor) => carta('COPAS', valor)), ...LIXO],
        })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    expect(screen.getByRole('region', { name: /lixo/i }).textContent).toMatch(/vazio/i)

    const mao = screen.getByRole('region', { name: /minha mão/i })

    expect(mao.textContent).toMatch(/k de copas/i)
    expect(mao.textContent).toMatch(/a de paus/i)
  })
})

/**
 * Critérios de interface da spec 0008 §9.2.
 *
 * S92 — a RF3.5 fala dos jogos **dos dois jogadores**, e metade dela nunca foi
 * implementada: quando o adversário tinha jogos, o painel dele renderizava um
 * parágrafo vazio. Em 40 de 40 partidas simuladas entre IAs a mesa termina com
 * jogo baixado, então isso estava errado em toda partida já jogada.
 */
function jogoDe(
  id: string,
  dono: 0 | 1,
  naipe: Carta['naipe'],
  valores: readonly Valor[],
  curingaEm?: Valor,
) {
  return {
    id,
    dono,
    naipe,
    posicoes: valores.map((valor) =>
      valor === curingaEm
        ? { tipo: 'Curinga' as const, carta: carta('ESPADAS', '2'), representa: valor }
        : { tipo: 'Natural' as const, carta: carta(naipe, valor) },
    ),
  }
}

const SETE: readonly Valor[] = ['5', '6', '7', '8', '9', '10', 'J']

describe('RF3.5 — os jogos dos dois jogadores, com categoria', () => {
  it('CA-S92-2 — sem jogos, o painel do adversário diz que a mesa dele está vazia', () => {
    // A âncora do outro lado, e ela já passava: o defeito só aparecia com jogos.
    render(
      <TelaPartida visao={visaoInicial()} movimentos={[]} aoJogar={vi.fn()} aoSeguir={vi.fn()} />,
    )

    expect(screen.getByRole('region', { name: /jogos do adversário/i }).textContent).toMatch(
      /nenhum jogo/i,
    )
  })

  it('CA-S92-1 — com um jogo, o painel do adversário mostra as cartas dele', () => {
    const jogosDoAdversario = [jogoDe('J1-COPAS-5-1', 1, 'COPAS', ['5', '6', '7'])]

    render(
      <TelaPartida
        visao={visaoInicial({ jogosDoAdversario })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /jogos do adversário/i })

    // O defeito de quatro fatias: aqui a tela renderizava `<p></p>`.
    expect(painel.textContent).toMatch(/5 de copas/i)
    expect(painel.textContent).toMatch(/6 de copas/i)
    expect(painel.textContent).toMatch(/7 de copas/i)
    expect(painel.textContent).not.toMatch(/nenhum jogo/i)
  })

  it('CA-S93-4 — a categoria do jogo do adversário também aparece', () => {
    const jogosDoAdversario = [jogoDe('J1-COPAS-5-1', 1, 'COPAS', SETE)]

    render(
      <TelaPartida
        visao={visaoInicial({ jogosDoAdversario })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    expect(screen.getByRole('region', { name: /jogos do adversário/i }).textContent).toMatch(
      /canastra limpa/i,
    )
  })
})

describe('S93 — o rótulo de categoria na mesa', () => {
  it('CA-S93-1 — sete posições sem curinga aparecem como canastra limpa', () => {
    const meusJogos = [jogoDe('J0-COPAS-5-1', 0, 'COPAS', SETE)]

    render(
      <TelaPartida
        visao={visaoInicial({ meusJogos })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    expect(screen.getByRole('region', { name: /meus jogos/i }).textContent).toMatch(
      /canastra limpa/i,
    )
  })

  it('CA-S93-2 — sete posições com curinga aparecem como canastra suja', () => {
    const meusJogos = [jogoDe('J0-COPAS-5-1', 0, 'COPAS', SETE, '8')]

    render(
      <TelaPartida
        visao={visaoInicial({ meusJogos })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /meus jogos/i })

    // O par que trava a interpretação: as mesmas sete casas, e só o papel de uma
    // carta muda a categoria. A tela lê `categoriaDe` e traduz (T6).
    expect(painel.textContent).toMatch(/canastra suja/i)
    expect(painel.textContent).not.toMatch(/canastra limpa/i)
  })

  it('CA-S93-3 — um jogo de seis posições não ganha rótulo nenhum', () => {
    const meusJogos = [jogoDe('J0-COPAS-5-1', 0, 'COPAS', ['5', '6', '7', '8', '9', '10'])]

    render(
      <TelaPartida
        visao={visaoInicial({ meusJogos })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /meus jogos/i })

    // A ausência **é** a R8.1. Escrever "sem categoria" faria a tela afirmar
    // algo que a R8.2 não define. A âncora positiva é a CA-S93-1 acima.
    expect(painel.textContent).toMatch(/5 de copas/i)
    expect(painel.textContent).not.toMatch(/canastra/i)
  })
})

/**
 * Critérios de interface da spec 0009 §8.2.
 *
 * S101 — o rótulo usa o nome que a própria R6.5 dá à operação, e nomeia a carta
 * **reposta**, que é a que distingue esta jogada de um `aumentar` qualquer sobre
 * o mesmo jogo.
 */
describe('S101 — limpar a canastra', () => {
  const SUJO = {
    id: 'J0-COPAS-5-1',
    dono: 0 as const,
    naipe: 'COPAS' as const,
    posicoes: [
      { tipo: 'Natural' as const, carta: carta('COPAS', '5') },
      { tipo: 'Natural' as const, carta: carta('COPAS', '6') },
      { tipo: 'Natural' as const, carta: carta('COPAS', '7') },
      { tipo: 'Curinga' as const, carta: carta('COPAS', '2'), representa: '8' as const },
      { tipo: 'Natural' as const, carta: carta('COPAS', '9') },
      { tipo: 'Natural' as const, carta: carta('COPAS', '10') },
      { tipo: 'Natural' as const, carta: carta('COPAS', 'J') },
    ],
  }

  const REPOSTAS = [carta('COPAS', '3'), carta('COPAS', '4'), carta('COPAS', '8')]

  const LIMPAR: Comando = {
    tipo: 'regularizarCuringa',
    jogo: SUJO.id,
    cartas: REPOSTAS.map((uma) => uma.id),
  }

  it('CA-S101-1 — o botão nomeia a carta reposta', () => {
    const visao = visaoInicial({
      fase: 'Acao',
      mao: [...REPOSTAS, carta('OUROS', 'K')],
      meusJogos: [SUJO],
    })
    const aoJogar = vi.fn()

    render(
      <TelaPartida
        visao={visao}
        movimentos={[...descartesDe(visao), LIMPAR]}
        aoJogar={aoJogar}
        aoSeguir={vi.fn()}
      />,
    )

    for (const uma of REPOSTAS) {
      fireEvent.click(
        screen.getByRole('button', { name: new RegExp(`^${nomeLegivel(uma)}$`, 'i') }),
      )
    }

    // "Limpar a canastra" é o apelido que a própria R6.5 dá à operação, e o 8 de
    // copas é a carta reposta — a que o curinga estava representando.
    fireEvent.click(screen.getByRole('button', { name: /limpar a canastra com 8 de copas/i }))

    expect(aoJogar).toHaveBeenCalledWith(LIMPAR)
  })

  it('CA-S101-2 — depois de limpar, a mesa mostra a canastra sem "valendo"', () => {
    // A metade observável: o jogo deixa de ter posição com papel declarado, e a
    // categoria muda junto — que é a R8.5 vista da tela.
    const limpo = {
      ...SUJO,
      posicoes: [
        { tipo: 'Natural' as const, carta: carta('COPAS', '2') },
        { tipo: 'Natural' as const, carta: carta('COPAS', '3') },
        { tipo: 'Natural' as const, carta: carta('COPAS', '4') },
        ...SUJO.posicoes.filter((posicao) => posicao.tipo === 'Natural'),
        { tipo: 'Natural' as const, carta: carta('COPAS', '8') },
      ],
    }

    render(
      <TelaPartida
        visao={visaoInicial({ meusJogos: [limpo] })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /meus jogos/i })

    expect(painel.textContent).not.toMatch(/valendo/i)
    expect(painel.textContent).toMatch(/canastra limpa/i)
  })
})

/**
 * Critério de interface da spec 0010 §8.3.
 *
 * S108 — a metade observável de pegar o morto não precisa de elemento novo: o
 * painel de mortos já existe desde a H1 e passa a mudar sozinho.
 */
describe('S108 — o painel de mortos', () => {
  it('CA-S108-1 — com um morto reclamado, o painel fala no singular', () => {
    render(
      <TelaPartida
        visao={visaoInicial({ mortosRestantes: 1 })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /mortos/i })

    expect(painel.textContent).toContain('1 morto por pegar')
    expect(painel.textContent).not.toContain('1 mortos')
  })

  it('CA-S108-2 — com os dois reclamados, o painel não mostra um zero solto', () => {
    render(
      <TelaPartida
        visao={visaoInicial({ mortosRestantes: 0 })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /mortos/i })

    expect(painel.textContent).toMatch(/nenhum morto/i)
    expect(painel.textContent).not.toContain('0 mortos')
  })
})

/**
 * Critérios de interface da spec 0011 §9.4 — o fim da rodada.
 *
 * S117 — o encerramento aparece no painel que já existe. Sem ele, a mesa fica
 * inerte **e sem explicação**: `movimentosValidos` devolve `[]`, a IA para, e
 * nada na tela diz por quê. É o modo de falha que o roadmap.md §3 já registra
 * para a R4.8, e repeti-lo de propósito seria pior.
 */
describe('S117 — a rodada encerrada aparece na tela', () => {
  it('CA-S117-1 — quando o humano bate, o painel diz que foi ele', () => {
    render(
      <TelaPartida
        visao={visaoInicial({ fase: 'RodadaEncerrada', mao: [], jogadorDaVez: 1 })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /vez e fase/i })

    // S113 — quem bateu é a mão vazia. `jogadorDaVez` aponta para o adversário
    // depois do descarte final, e ler por ele daria a resposta trocada.
    expect(painel.textContent).toMatch(/você bateu/i)
    expect(painel.textContent).toMatch(/rodada encerrada/i)
  })

  it('CA-S117-2 — quando a IA bate, o painel diz que foi o adversário', () => {
    render(
      <TelaPartida
        visao={visaoInicial({ fase: 'RodadaEncerrada', cartasNaMaoDoAdversario: 0 })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /vez e fase/i })

    expect(painel.textContent).toMatch(/adversário bateu/i)
    expect(painel.textContent).not.toMatch(/você bateu/i)
  })

  it('CA-S117-3 — durante a rodada o painel continua falando de vez e fase', () => {
    // A âncora positiva das duas acima: sem ela, um painel que dissesse "bateu"
    // o tempo todo passaria nas duas.
    render(
      <TelaPartida
        visao={visaoInicial({ fase: 'Acao' })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /vez e fase/i })

    expect(painel.textContent).toMatch(/fase de ação/i)
    expect(painel.textContent).not.toMatch(/bateu/i)
  })

  it('CA-S117-3 — encerrada a rodada, nenhuma carta da mão é selecionável', () => {
    const visao = visaoInicial({ fase: 'RodadaEncerrada', cartasNaMaoDoAdversario: 0 })

    // A âncora positiva vem primeiro: com movimentos, as cartas são botões.
    render(
      <TelaPartida
        visao={visaoInicial({ fase: 'Acao' })}
        movimentos={descartesDe(visaoInicial())}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    expect(
      within(screen.getByRole('region', { name: /minha mão/i })).getAllByRole('button').length,
    ).toBeGreaterThan(0)

    cleanup()
    render(<TelaPartida visao={visao} movimentos={[]} aoJogar={vi.fn()} aoSeguir={vi.fn()} />)

    expect(
      within(screen.getByRole('region', { name: /minha mão/i })).queryAllByRole('button'),
    ).toHaveLength(0)
  })
})

/**
 * Critérios de interface da spec 0012 §8.4 — o painel de apuração.
 *
 * S126 — a `screens.md` §1 já decidiu que a apuração não é tela: é painel
 * sobreposto à partida. "Sobreposto" é apresentação, e a RNF2.2 fixou que os
 * testes falam de comportamento — o critério é o painel existir com os itens
 * certos, não onde ele flutua.
 */
function pontuacao(ajustes: Partial<Pontuacao> = {}): Pontuacao {
  return {
    canastras: { DE_1000: 0, DE_500: 0, LIMPA: 0, SUJA: 0 },
    pontosDeCanastra: 0,
    cartasNaMesa: 0,
    cartasNaMao: 0,
    bonusDeBatida: 0,
    penalidadeDeMorto: 0,
    ...ajustes,
  }
}

describe('S126 — o painel de apuração', () => {
  it('CA-S126-2 — durante a rodada o painel não existe', () => {
    // A âncora positiva é o critério seguinte, que monta a mesma tela encerrada
    // e acha o painel. Sem ela, uma tela que nunca o renderiza passaria aqui.
    render(
      <TelaPartida
        visao={visaoInicial({ fase: 'Acao' })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    expect(screen.queryByRole('region', { name: /apuração/i })).toBeNull()
  })

  it('CA-S126-1 — encerrada a rodada, o painel diz a categoria e a contagem', () => {
    render(
      <TelaPartida
        visao={visaoInicial({
          fase: 'RodadaEncerrada',
          mao: [],
          apuracao: [
            pontuacao({
              canastras: { DE_1000: 0, DE_500: 0, LIMPA: 2, SUJA: 0 },
              pontosDeCanastra: 400,
            }),
            pontuacao({ cartasNaMao: -55, penalidadeDeMorto: -100 }),
          ],
        })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /apuração/i })

    // RF4.2 — "canastras **por categoria**". Um total de 400 não diz se são
    // duas limpas ou quatro sujas, e é essa a diferença que o critério cobra.
    expect(painel.textContent).toMatch(/2 canastras limpas/i)
    expect(painel.textContent).toContain('400')
    // E o adversário aparece no mesmo painel, com os itens dele.
    expect(painel.textContent).toContain('-55')
    expect(painel.textContent).toContain('-100')
  })

  it('CA-S126-1 — o painel fala no singular com uma canastra só', () => {
    render(
      <TelaPartida
        visao={visaoInicial({
          fase: 'RodadaEncerrada',
          mao: [],
          apuracao: [
            pontuacao({
              canastras: { DE_1000: 0, DE_500: 0, LIMPA: 1, SUJA: 0 },
              pontosDeCanastra: 200,
            }),
            pontuacao(),
          ],
        })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /apuração/i })

    // A lição da H7: um critério que confere o número sem conferir o texto
    // passa com a tela errada. "1 canastras limpas" foi exatamente o defeito.
    expect(painel.textContent).toMatch(/1 canastra limpa/i)
    expect(painel.textContent).not.toMatch(/1 canastras/i)
  })

  it('CA-S126-3 — o placar na tela mostra o total novo, e não 0 × 0', () => {
    render(
      <TelaPartida
        visao={visaoInicial({ fase: 'RodadaEncerrada', mao: [], placar: [455, -155] })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const placar = screen.getByRole('region', { name: /placar/i })

    expect(placar.textContent).toContain('455')
    expect(placar.textContent).toContain('-155')
  })
})

/**
 * Critérios de interface da spec 0013 §8.3 — o botão que faltava.
 *
 * S134 — **um** botão, com rótulo que muda conforme haja vencedor. Não dois, nem
 * um que às vezes desaparece: a decisão de qual caminho seguir é do jogo, e o
 * jogador só confirma que viu a apuração.
 */
describe('S134 — o botão do painel de apuração', () => {
  const apurada: readonly [Pontuacao, Pontuacao] = [pontuacao(), pontuacao()]

  it('CA-S134-1 — sem vencedor, o painel oferece a próxima rodada', () => {
    render(
      <TelaPartida
        visao={visaoInicial({ fase: 'RodadaEncerrada', mao: [], apuracao: apurada })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /apuração/i })

    expect(within(painel).getByRole('button', { name: /próxima rodada/i })).toBeDefined()
    expect(within(painel).queryByRole('button', { name: /ver o resultado/i })).toBeNull()
  })

  it('CA-S134-2 — com vencedor, o painel oferece ver o resultado', () => {
    render(
      <TelaPartida
        visao={visaoInicial({
          fase: 'RodadaEncerrada',
          mao: [],
          apuracao: apurada,
          placar: [3010, 500],
        })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /apuração/i })

    expect(within(painel).getByRole('button', { name: /ver o resultado/i })).toBeDefined()
    expect(within(painel).queryByRole('button', { name: /próxima rodada/i })).toBeNull()
  })

  it('CA-S134-3 — o clique avisa quem cuida da transição', () => {
    // A tela não sabe redistribuir nem navegar (T6): ela chama `aoSeguir`, e
    // `estado/` decide entre nova rodada e tela de fim.
    const aoSeguir = vi.fn()

    render(
      <TelaPartida
        visao={visaoInicial({ fase: 'RodadaEncerrada', mao: [], apuracao: apurada })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={aoSeguir}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /próxima rodada/i }))

    expect(aoSeguir).toHaveBeenCalledTimes(1)
  })
})

/**
 * Critérios de interface da spec 0014 §8.4 — a rodada que acaba sem batida.
 *
 * S142 — a S117 decidiu o texto do painel quando **toda** rodada encerrada era
 * uma batida. A R4.8 acrescenta a segunda saída, e nela ninguém tem a mão vazia:
 * sem este caso a tela diria "O adversário bateu" numa rodada em que ninguém
 * bateu, e as CA-S117-1/2 continuariam verdes.
 */
describe('S142 e S143 — o fim sem batida, e o morto que virou monte', () => {
  it('CA-S142-1 — sem batedor, o painel diz que o monte acabou', () => {
    render(
      <TelaPartida
        visao={visaoInicial({
          fase: 'RodadaEncerrada',
          cartasNaMaoDoAdversario: 7,
          mortosRestantes: 0,
          algumMortoVirouMonte: true,
        })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /vez e fase/i })

    expect(painel.textContent).toMatch(/monte acabou/i)
    expect(painel.textContent).not.toMatch(/bateu/i)
  })

  it('CA-S142-2 — com batedor, o painel continua dizendo quem foi', () => {
    // A âncora que a S117 já tinha, e que este critério não pode derrubar.
    render(
      <TelaPartida
        visao={visaoInicial({ fase: 'RodadaEncerrada', mao: [] })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    expect(screen.getByRole('region', { name: /vez e fase/i }).textContent).toMatch(/você bateu/i)
  })

  it('CA-S143-1 — o painel de mortos distingue convertido de pego', () => {
    render(
      <TelaPartida
        visao={visaoInicial({ mortosRestantes: 0, algumMortoVirouMonte: true })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /mortos/i })

    // Para quem decide se dá para bater, os dois estados são muito diferentes:
    // com conversão a R10.1.1 dispensa a exigência do morto, sem ela não.
    expect(painel.textContent).toMatch(/virou monte/i)
  })

  it('CA-S143-1 — sem conversão, o painel continua contando só os que restam', () => {
    render(
      <TelaPartida
        visao={visaoInicial({ mortosRestantes: 0 })}
        movimentos={[]}
        aoJogar={vi.fn()}
        aoSeguir={vi.fn()}
      />,
    )

    const painel = screen.getByRole('region', { name: /mortos/i })

    expect(painel.textContent).toMatch(/nenhum morto/i)
    expect(painel.textContent).not.toMatch(/virou monte/i)
  })
})
