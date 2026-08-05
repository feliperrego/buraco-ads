import { describe, expect, it } from 'vitest'
import {
  aplicar,
  criarAleatorio,
  iniciarPartida,
  movimentosValidos,
  visaoDe,
} from '../src/engine/index.ts'
import type {
  Carta,
  Comando,
  JogadorId,
  Morto,
  Naipe,
  Partida,
  Posicao,
  Valor,
} from '../src/engine/index.ts'
import {
  NAIPES,
  VALORES,
  cartas,
  carta as cartaDe,
  construirPartida,
  outrasCartas,
  posicoes,
} from '../src/engine/testing/construtor.ts'
import { decidir, escolher } from '../src/ia/decidir.ts'
import { chaveDe, comparar, encaixa, pontuar } from '../src/ia/pontuar.ts'
import { porSorteio } from '../src/ia/por-sorteio.ts'

/**
 * Critérios de aceite da spec 0015 §8 — o comportamento da heurística.
 *
 * Estes testes moram em `tests/` e não em `src/ia/` por causa da C4: a regra de
 * dependência proíbe `ia/` de importar o construtor validado, e sem ele não há
 * como montar a mesa exata que cada parcela precisa. `tests/` é a pasta que pode
 * importar os dois, e o `verificar-fronteiras.py` prova isso a cada execução.
 */

function visaoDaVez(partida: Partida) {
  return visaoDe(partida, partida.jogadorDaVez)
}

type Mesa = {
  readonly mao: readonly Carta[]
  readonly meusJogos?: readonly (readonly Posicao[])[]
  readonly jogosDoAdversario?: readonly (readonly Posicao[])[]
  readonly lixo?: readonly Carta[]
  readonly fase?: 'Compra' | 'Acao'
  /** `null` = morto ainda na mesa. */
  readonly donosDosMortos?: readonly [JogadorId | null, JogadorId | null]
}

function mesa(descricao: Mesa): Partida {
  const meus = descricao.meusJogos ?? []
  const dele = descricao.jogosDoAdversario ?? []
  const lixo = descricao.lixo ?? []
  const naMesa = [...meus, ...dele].flat().map((posicao) => posicao.carta)
  const usadas = [...descricao.mao, ...naMesa, ...lixo]

  const base = construirPartida({
    maos: [descricao.mao, outrasCartas(usadas, 11)],
    jogos: [meus, dele],
    lixo,
    jogadorDaVez: 0,
    fase: descricao.fase ?? 'Acao',
  })

  const donos = descricao.donosDosMortos ?? [null, null]
  const reclamar = (morto: Morto, dono: JogadorId | null): Morto =>
    dono === null ? morto : { ...morto, cartas: [], destino: dono }

  return {
    ...base,
    mortos: [reclamar(base.mortos[0], donos[0]), reclamar(base.mortos[1], donos[1])],
    monte: [
      ...base.monte,
      ...(donos[0] === null ? [] : base.mortos[0].cartas),
      ...(donos[1] === null ? [] : base.mortos[1].cartas),
    ],
  }
}

const LIMPA_NA_MESA = posicoes('5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥')

// ---------------------------------------------------------------------------
// S146 — a nota em duas dimensões
// ---------------------------------------------------------------------------

describe('S146 — bate decide antes de valor', () => {
  it('CA-S146-1 — a nota que bate vence a que tem valor maior', () => {
    expect(comparar({ bate: true, valor: 0 }, { bate: false, valor: 1_000_000 })).toBeGreaterThan(0)
    expect(comparar({ bate: false, valor: 1_000_000 }, { bate: true, valor: 0 })).toBeLessThan(0)
  })

  it('CA-S146-2 — entre duas que batem, o desempate cai para valor', () => {
    expect(comparar({ bate: true, valor: 10 }, { bate: true, valor: -5 })).toBeGreaterThan(0)
    expect(comparar({ bate: false, valor: 10 }, { bate: false, valor: -5 })).toBeGreaterThan(0)
    expect(comparar({ bate: true, valor: 7 }, { bate: true, valor: 7 })).toBe(0)
  })

  it('CA-S146-2 — na mesa, entre descartar e aumentar que batem, ganha o de valor maior', () => {
    // Mão de uma carta, canastra limpa na mesa e os dois mortos resolvidos: as
    // duas jogadas oferecidas zeram a mão, e as duas batem. Só o valor separa —
    // o descarte entrega a carta (`−5`) e o aumento a põe na mesa (`+10`).
    const partida = mesa({
      mao: cartas('4♥'),
      meusJogos: [LIMPA_NA_MESA],
      donosDosMortos: [0, 1],
    })

    const visao = visaoDaVez(partida)
    const movimentos = movimentosValidos(visao)

    expect(movimentos).toHaveLength(2)
    expect(movimentos.every((comando) => pontuar(visao, comando).bate)).toBe(true)
    expect(decidir(visao)?.tipo).toBe('aumentar')
  })

  it('CA-S146-3 — nenhuma parcela de valor altera a decisão de bater', () => {
    // A pergunta que a forma de um número só teria de responder: existe soma de
    // parcelas capaz de superar a batida? Aqui a resposta é estrutural. O que
    // este teste mede é o outro lado — **com que frequência a classe é usada de
    // fato** —, e a resposta medida é: quase nunca, porque a jogada que bate
    // consome a mão inteira, e o valor cresce com as cartas movidas.
    let comBatida = 0
    let soAClasseEscolheria = 0

    const partidaDaBatida = mesa({
      mao: cartas('5♠ 6♠ 7♠'),
      meusJogos: [LIMPA_NA_MESA],
      donosDosMortos: [0, 1],
    })

    const aleatorio = criarAleatorio(3)
    let partida = partidaDaBatida

    for (let passo = 0; passo < 2000 && partida.fase !== 'RodadaEncerrada'; passo += 1) {
      const visao = visaoDaVez(partida)
      const movimentos = movimentosValidos(visao)

      if (movimentos.length === 0) {
        break
      }

      const notas = movimentos.map((comando) => pontuar(visao, comando))

      if (notas.some((nota) => nota.bate)) {
        comBatida += 1

        const melhorPorValor = Math.max(...notas.map((nota) => nota.valor))
        const batidaMaisValiosa = Math.max(
          ...notas.filter((nota) => nota.bate).map((nota) => nota.valor),
        )

        if (batidaMaisValiosa < melhorPorValor) {
          soAClasseEscolheria += 1
        }
      }

      const escolhido = movimentos[Math.floor(aleatorio() * movimentos.length)]

      if (escolhido === undefined) {
        break
      }

      const resultado = aplicar(partida, escolhido)

      if (resultado.tipo !== 'sucesso') {
        break
      }

      partida = resultado.partida
    }

    console.log(
      `CA-S146-3: ${String(comBatida)} estados com batida disponível, ` +
        `${String(soAClasseEscolheria)} em que só a classe a escolheria`,
    )

    expect(comBatida).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// S147 — as parcelas
// ---------------------------------------------------------------------------

describe('S147 — as parcelas da pontuação', () => {
  it('CA-S147-1 — entre três cartas de 5 e três de 10, a IA baixa as de 10', () => {
    const partida = mesa({ mao: cartas('5♠ 6♠ 7♠ 9♥ 10♥ J♥ 3♣ 8♦') })
    const escolha = decidir(visaoDaVez(partida))

    expect(escolha?.tipo).toBe('baixar')

    const citadas = escolha?.tipo === 'baixar' ? escolha.cartas.map((uma) => uma.carta) : []

    expect(citadas).toEqual(cartas('9♥ 10♥ J♥').map((uma) => uma.id))
  })

  it('CA-S147-2 — entre dois curingas, a IA usa o 2 do naipe da sequência', () => {
    // A sequência é de **espadas**, e o curinga do outro naipe é de **copas**,
    // de propósito: sem o bônus da IA6 os dois candidatos empatam, e o desempate
    // por chave (S150) escolheria `COPAS` pela ordem alfabética. Com a fixture
    // ao contrário — sequência de copas — o teste passava com o bônus zerado,
    // pelo motivo errado. É a lição da H12: contar quantos testes uma mutação
    // reprova não basta; vale conferir se ela reprova por onde deveria.
    const partida = mesa({ mao: cartas('5♠ 6♠ 2♠ 2♥ 3♣ 9♦') })
    const escolha = decidir(visaoDaVez(partida))

    expect(escolha?.tipo).toBe('baixar')

    const curinga =
      escolha?.tipo === 'baixar' ? escolha.cartas.find((uma) => uma.representa !== undefined) : null

    expect(curinga?.carta).toBe(cartaDe('ESPADAS', '2').id)
  })

  it('CA-S147-3 — zerar a mão com morto por pegar vale 200 a mais', () => {
    const comMorto = mesa({ mao: cartas('5♠ 6♠ 7♠') })
    const semMorto = mesa({ mao: cartas('5♠ 6♠ 7♠'), donosDosMortos: [0, 1] })

    const baixar: Comando = {
      tipo: 'baixar',
      cartas: cartas('5♠ 6♠ 7♠').map((uma) => ({ carta: uma.id })),
    }

    expect(visaoDaVez(comMorto).mortosRestantes).toBe(2)
    expect(visaoDaVez(semMorto).mortosRestantes).toBe(0)

    const diferenca =
      pontuar(visaoDaVez(comMorto), baixar).valor - pontuar(visaoDaVez(semMorto), baixar).valor

    expect(diferenca).toBe(200)
  })

  it('CA-S147-4 — o lixo que encaixa é pego, e o que não encaixa não', () => {
    const encaixando = mesa({
      mao: cartas('5♥ 6♥ 8♠ 9♠'),
      lixo: cartas('7♥ 4♥ 10♠'),
      fase: 'Compra',
    })

    const naoEncaixando = mesa({
      mao: cartas('5♥ 6♥ 8♠ 9♠'),
      lixo: cartas('K♣ Q♦ 3♣'),
      fase: 'Compra',
    })

    expect(decidir(visaoDaVez(encaixando))?.tipo).toBe('pegarLixo')
    expect(decidir(visaoDaVez(naoEncaixando))?.tipo).toBe('comprarDoMonte')
  })
})

// ---------------------------------------------------------------------------
// S148 — o descarte
// ---------------------------------------------------------------------------

describe('S148 — o descarte é pontuado pelo que entrega', () => {
  it('CA-S148-1 — entre duas cartas de mesmo valor, larga a que não estende jogo dele', () => {
    const partida = mesa({
      mao: cartas('9♦ 9♣'),
      jogosDoAdversario: [posicoes('5♦ 6♦ 7♦ 8♦')],
    })

    const escolha = decidir(visaoDaVez(partida))

    expect(escolha).toEqual({ tipo: 'descartar', carta: cartaDe('PAUS', '9').id })
  })

  it('CA-S148-1 — sem jogo do adversário no naipe, as duas valem o mesmo', () => {
    // Âncora positiva do critério acima: o que separa as duas cartas é o jogo
    // dele, não a carta.
    const partida = mesa({
      mao: cartas('9♦ 9♣'),
      jogosDoAdversario: [posicoes('5♥ 6♥ 7♥ 8♥')],
    })

    const visao = visaoDaVez(partida)
    const notas = movimentosValidos(visao).map((comando) => pontuar(visao, comando).valor)

    expect(new Set(notas).size).toBe(1)
  })

  it('CA-S148-2 — entre cartas que não estendem nada, larga a de menor valor', () => {
    const partida = mesa({ mao: cartas('3♠ K♠') })

    expect(decidir(visaoDaVez(partida))).toEqual({
      tipo: 'descartar',
      carta: cartaDe('ESPADAS', '3').id,
    })
  })

  it('CA-S148-3 — a carta perigosa é preterida mesmo sendo a de menor valor', () => {
    const partida = mesa({
      mao: cartas('3♦ K♠'),
      jogosDoAdversario: [posicoes('4♦ 5♦ 6♦ 7♦')],
    })

    expect(decidir(visaoDaVez(partida))).toEqual({
      tipo: 'descartar',
      carta: cartaDe('ESPADAS', 'K').id,
    })
  })
})

// ---------------------------------------------------------------------------
// S149 — o encaixe
// ---------------------------------------------------------------------------

describe('S149 — o que "encaixa" quer dizer', () => {
  const comMao = mesa({ mao: cartas('7♥ 8♠') })
  const visao = visaoDaVez(comMao)

  it('CA-S149-1 — irmã de mesmo naipe a uma e a duas casas encaixa', () => {
    expect(encaixa(visao, cartaDe('COPAS', '6'))).toBe(true)
    expect(encaixa(visao, cartaDe('COPAS', '9'))).toBe(true)
    expect(encaixa(visao, cartaDe('COPAS', '5'))).toBe(true)
  })

  it('CA-S149-2 — a três casas, não encaixa', () => {
    expect(encaixa(visao, cartaDe('COPAS', '4'))).toBe(false)
    expect(encaixa(visao, cartaDe('COPAS', '10'))).toBe(false)
  })

  it('CA-S149-3 — mesma casa e naipe diferente não encaixa', () => {
    expect(encaixa(visao, cartaDe('OUROS', '7'))).toBe(false)
    expect(encaixa(visao, cartaDe('OUROS', '8'))).toBe(false)
  })

  it('CA-S149-3 — a cópia idêntica não encaixa: distância zero não constrói nada', () => {
    // A S149 diz "distância ≤ 2", e ler isso ao pé da letra inclui o **zero** —
    // a segunda cópia da mesma carta. Duas cartas iguais não entram na mesma
    // sequência (I1), então a distância mínima é **um**. É leitura minha do
    // texto confirmado, apoiada no argumento que a própria S149 dá, e sem este
    // critério a mutação que troca `>= 1` por `>= 0` passa em silêncio.
    expect(encaixa(visao, cartaDe('COPAS', '7', 2))).toBe(false)
    expect(encaixa(visao, cartaDe('ESPADAS', '8', 2))).toBe(false)
  })

  it('CA-S149-1 — o encaixe também olha os meus jogos, não só a mão', () => {
    const comJogo = mesa({ mao: cartas('K♣'), meusJogos: [LIMPA_NA_MESA] })

    expect(encaixa(visaoDaVez(comJogo), cartaDe('COPAS', 'Q'))).toBe(true)
    expect(encaixa(visaoDaVez(comJogo), cartaDe('OUROS', 'Q'))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// S150 — o empate
// ---------------------------------------------------------------------------

describe('S150 — o empate não olha a ordem da lista', () => {
  it('CA-S150-1 — embaralhar movimentosValidos não muda a escolha', () => {
    const partida = mesa({ mao: cartas('5♠ 6♠ 7♠ 9♥ 10♥ J♥ 3♣ 8♦') })
    const visao = visaoDaVez(partida)
    const movimentos = movimentosValidos(visao)
    const referencia = escolher(visao, movimentos)

    expect(movimentos.length).toBeGreaterThan(5)
    expect(referencia).not.toBeNull()

    const aleatorio = criarAleatorio(11)

    for (let vez = 0; vez < 20; vez += 1) {
      const embaralhados = [...movimentos].sort(() => aleatorio() - 0.5)

      expect(escolher(visao, embaralhados)).toEqual(referencia)
    }
  })

  it('CA-S150-1 — a chave é estável e distingue comandos diferentes', () => {
    const umDescarte: Comando = { tipo: 'descartar', carta: cartaDe('COPAS', '5').id }
    const outroDescarte: Comando = { tipo: 'descartar', carta: cartaDe('COPAS', '6').id }

    expect(chaveDe(umDescarte)).toBe(chaveDe({ ...umDescarte }))
    expect(chaveDe(umDescarte)).not.toBe(chaveDe(outroDescarte))
    expect(chaveDe({ tipo: 'comprarDoMonte' })).not.toBe(chaveDe({ tipo: 'pegarLixo' }))
  })
})

// ---------------------------------------------------------------------------
// S151 e S152 — a heurística joga partida inteira
// ---------------------------------------------------------------------------

describe('S152 — a heurística sustenta a partida inteira', () => {
  it('CA-S152-1 — 20 rodadas heurística contra aleatória terminam sem travar', () => {
    let terminadas = 0

    for (let semente = 1; semente <= 20; semente += 1) {
      const sorteio = porSorteio(criarAleatorio(semente + 1))
      let partida = iniciarPartida(semente)

      for (let passo = 0; passo < 5000 && partida.fase !== 'RodadaEncerrada'; passo += 1) {
        const visao = visaoDaVez(partida)
        const comando = partida.jogadorDaVez === 0 ? decidir(visao) : sorteio(visao)

        if (comando === null) {
          break
        }

        const resultado = aplicar(partida, comando)

        if (resultado.tipo !== 'sucesso') {
          throw new Error(`comando recusado: ${comando.tipo} — ${resultado.motivo}`)
        }

        partida = resultado.partida
      }

      if (partida.fase === 'RodadaEncerrada') {
        terminadas += 1
      }
    }

    expect(terminadas).toBe(20)
  })
})

// ---------------------------------------------------------------------------
// S152 — a T7 remedida, agora com a pontuação por cima da enumeração
// ---------------------------------------------------------------------------

/** O mesmo pior caso construível da `CA-S80-1`: quatro naipes quase cheios, sem o 8. */
function maoDeQuatroNaipesSemO8(): readonly Carta[] {
  const mao: Carta[] = []

  for (const naipe of NAIPES) {
    for (const valor of VALORES) {
      if (valor !== '8') {
        mao.push(cartaDe(naipe, valor))
      }
    }
  }

  for (const naipe of NAIPES) {
    mao.push(cartaDe(naipe, '2', 2))
  }

  return mao
}

function naturaisDe(naipe: Naipe, valores: readonly Valor[], copia: 1 | 2 = 1): readonly Posicao[] {
  return valores.map((valor) => ({ tipo: 'Natural', carta: cartaDe(naipe, valor, copia) }))
}

describe('S152 — a T7 remedida com a decisão inteira', () => {
  it('CA-S152-3 — no pior caso construível, decidir fica abaixo dos 100 ms da E6', () => {
    const partida = mesa({
      mao: maoDeQuatroNaipesSemO8(),
      meusJogos: [
        naturaisDe('COPAS', ['5', '6', '7'], 2),
        naturaisDe('OUROS', ['5', '6', '7'], 2),
        naturaisDe('ESPADAS', ['5', '6', '7'], 2),
        naturaisDe('PAUS', ['5', '6', '7'], 2),
        naturaisDe('COPAS', ['10', 'J', 'Q'], 2),
        naturaisDe('OUROS', ['10', 'J', 'Q'], 2),
      ],
    })

    const visao = visaoDaVez(partida)
    const enumerados = movimentosValidos(visao)

    const inicio = performance.now()
    const escolha = decidir(visao)
    const decorrido = performance.now() - inicio

    console.log(
      `CA-S152-3: ${String(enumerados.length)} comandos enumerados e pontuados ` +
        `em ${decorrido.toFixed(2)} ms`,
    )

    // A âncora: sem ela, um cenário pequeno tornaria a medição sem sentido. O
    // limiar de ~2000 da T7 continua sendo o que reabriria a consulta `validar`.
    expect(enumerados.length).toBeGreaterThan(1000)
    expect(enumerados.length).toBeLessThan(2000)
    expect(decorrido).toBeLessThan(100)
    expect(enumerados).toContainEqual(escolha)
  })
})

// ---------------------------------------------------------------------------
// S178 — a trava do lixo (spec 0020)
// ---------------------------------------------------------------------------

/** O humano do roteiro do navegador: compra do monte e descarta. Nunca pega o lixo. */
function guloso(visao: Parameters<typeof decidir>[0]): Comando | null {
  const movimentos = movimentosValidos(visao)

  return (
    movimentos.find((comando) => comando.tipo === 'comprarDoMonte') ??
    movimentos.find((comando) => comando.tipo === 'descartar') ??
    movimentos[0] ??
    null
  )
}

describe('S178 — o lixo é vizinho de si mesmo', () => {
  const MAO_LONGE = cartas('5♠ 6♠ 7♠ Q♣ J♣')

  it('CA-S178-1 — lixo que se encadeia sozinho é pego, mesmo sem vizinha na mão', () => {
    // Nenhuma carta de copas na mão: pela definição antiga **nenhuma** delas
    // encaixava, e o saldo dava −30. Elas encaixam umas nas outras.
    const partida = mesa({
      mao: MAO_LONGE,
      lixo: cartas('3♥ 4♥ 5♥ 6♥ 7♥ 8♥'),
      fase: 'Compra',
    })

    expect(decidir(visaoDaVez(partida))?.tipo).toBe('pegarLixo')
  })

  it('CA-S178-2 — lixo do mesmo tamanho, com cartas espalhadas, não é pego', () => {
    // O par: muda **só** quais cartas estão no lixo, não quantas.
    const partida = mesa({
      mao: MAO_LONGE,
      lixo: cartas('3♥ 10♥ 9♦ A♦ K♠ 4♣'),
      fase: 'Compra',
    })

    expect(decidir(visaoDaVez(partida))?.tipo).toBe('comprarDoMonte')
  })

  it('CA-S178-3 — a carta não é vizinha de si mesma, nem da própria cópia', () => {
    const partida = mesa({ mao: MAO_LONGE, lixo: cartas('7♥'), fase: 'Compra' })
    const visao = visaoDaVez(partida)

    expect(encaixa(visao, cartaDe('COPAS', '7', 2))).toBe(false)

    // Âncora positiva: a vizinha de verdade encaixa pelo lixo.
    expect(encaixa(visao, cartaDe('COPAS', '8'))).toBe(true)
  })
})

describe('S180 — a trava não volta', () => {
  it('CA-S180-1 — contra quem nunca pega o lixo, ele não estoura', () => {
    let maiorLixo = 0

    for (let semente = 60; semente < 80; semente += 1) {
      let partida = iniciarPartida(semente)

      for (let passo = 0; passo < 20000 && partida.fase !== 'RodadaEncerrada'; passo += 1) {
        const quem = partida.jogadorDaVez
        const visao = visaoDe(partida, quem)

        maiorLixo = Math.max(maiorLixo, visao.lixo.length)

        const comando = quem === 0 ? guloso(visao) : decidir(visao)

        if (comando === null) {
          break
        }

        const resultado = aplicar(partida, comando)

        if (resultado.tipo !== 'sucesso') {
          break
        }

        partida = resultado.partida
      }
    }

    console.log(`CA-S180-1: maior lixo em 20 rodadas contra o guloso — ${String(maiorLixo)}`)

    // O teto é folgado de propósito: o que se prende é a **ausência da trava**,
    // não o número. Medido em 70 antes do conserto e em 13 depois — e o arnês da
    // S151 nunca viu isso, porque a aleatória pega o lixo em metade das compras.
    expect(maiorLixo).toBeLessThanOrEqual(20)
  })
})
