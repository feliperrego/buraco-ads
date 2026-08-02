import { describe, expect, it } from 'vitest'
import type { Carta } from '../dominio/carta.ts'
import { iniciarPartida } from '../dominio/partida.ts'
import type { Partida } from '../dominio/partida.ts'
import { cartas, construirPartida } from '../testing/construtor.ts'
import { aplicar } from './aplicar.ts'
import type { Comando } from './comando.ts'

/**
 * Critérios de aceite da spec 0002 §6.
 *
 * A M9 deixa de ser propriedade de um estado e passa a ser invariante de
 * movimento: toda transição preserva as 104 cartas. Comprar e descartar são as
 * duas operações mais simples do jogo, e é por isso que valem como piso — se a
 * conservação quebra aqui, nada mais complexo tem chance.
 */

const SEMENTE = 7

/** As cartas de uma lista de jogos, achatando as posições (M2). */
function cartasDosJogos(jogador: Partida['jogadores'][number]): readonly Carta[] {
  return jogador.jogos.flatMap((jogo) => jogo.posicoes.map((posicao) => posicao.carta))
}

function todasAsCartas(partida: Partida): readonly Carta[] {
  return [
    ...partida.jogadores[0].mao,
    ...partida.jogadores[1].mao,
    ...cartasDosJogos(partida.jogadores[0]),
    ...cartasDosJogos(partida.jogadores[1]),
    ...partida.monte,
    ...partida.lixo,
    ...partida.mortos[0].cartas,
    ...partida.mortos[1].cartas,
  ]
}

/** Desembrulha o resultado, falhando alto se o comando foi recusado. */
function aplicado(partida: Partida, comando: Comando): Partida {
  const resultado = aplicar(partida, comando)

  if (resultado.tipo !== 'sucesso') {
    throw new Error(`esperava sucesso em ${comando.tipo}, veio recusa: ${resultado.motivo}`)
  }

  return resultado.partida
}

describe('R3.1 — a compra move a fase', () => {
  it('CA-R3.1-2 — após comprarDoMonte, a fase é Acao', () => {
    const antes = iniciarPartida(SEMENTE)
    const depois = aplicado(antes, { tipo: 'comprarDoMonte' })

    expect(antes.fase).toBe('Compra')
    expect(depois.fase).toBe('Acao')
    expect(depois.jogadorDaVez).toBe(antes.jogadorDaVez)
    expect(depois.jogadores[antes.jogadorDaVez].mao).toHaveLength(12)
    expect(depois.monte).toHaveLength(59)
  })

  it('CA-R3.1-2 — a carta comprada sai do topo do monte e entra no fim da mão', () => {
    const antes = iniciarPartida(SEMENTE)
    const topo = antes.monte[0]
    const depois = aplicado(antes, { tipo: 'comprarDoMonte' })
    const mao = depois.jogadores[antes.jogadorDaVez].mao

    // S6 — monte[0] é o topo. S23 — a carta entra no fim, e a engine nunca
    // reordena a mão.
    expect(topo).toBeDefined()
    expect(mao[mao.length - 1]).toEqual(topo)
    expect(depois.monte[0]).toEqual(antes.monte[1])
  })
})

describe('M9 — conservação em toda transição', () => {
  it('CA-M9-4 — após comprarDoMonte, as 104 cartas se conservam', () => {
    const depois = aplicado(iniciarPartida(SEMENTE), { tipo: 'comprarDoMonte' })
    const ids = todasAsCartas(depois).map((carta) => carta.id)

    expect(ids).toHaveLength(104)
    expect(new Set(ids).size).toBe(104)
  })
})

describe('M8 — a partida recebida nunca é alterada', () => {
  it('CA-M9-4 — aplicar não muta a partida de entrada', () => {
    const antes = iniciarPartida(SEMENTE)
    const copia = JSON.parse(JSON.stringify(antes)) as Partida

    aplicado(antes, { tipo: 'comprarDoMonte' })

    expect(antes).toEqual(copia)
  })
})

/** A mão de quem está jogando agora. */
function maoDaVez(partida: Partida): readonly Carta[] {
  return partida.jogadores[partida.jogadorDaVez].mao
}

/** Compra e descarta, devolvendo a partida com a vez já passada. */
function turnoCompleto(partida: Partida, escolher: (mao: readonly Carta[]) => Carta): Partida {
  const comprou = aplicado(partida, { tipo: 'comprarDoMonte' })

  return aplicado(comprou, { tipo: 'descartar', carta: escolher(maoDaVez(comprou)).id })
}

function primeira(mao: readonly Carta[]): Carta {
  const carta = mao[0]

  if (carta === undefined) {
    throw new Error('cenário impossível: mão vazia')
  }

  return carta
}

describe('R7 — o descarte encerra o turno', () => {
  it('CA-R7.1-1 — descartar deixa 11 na mão e 1 no lixo', () => {
    const comprou = aplicado(iniciarPartida(SEMENTE), { tipo: 'comprarDoMonte' })
    const quem = comprou.jogadorDaVez
    const escolhida = primeira(maoDaVez(comprou))

    const depois = aplicado(comprou, { tipo: 'descartar', carta: escolhida.id })

    expect(comprou.jogadores[quem].mao).toHaveLength(12)
    expect(depois.jogadores[quem].mao).toHaveLength(11)
    expect(depois.lixo).toHaveLength(1)
    expect(depois.lixo[0]).toEqual(escolhida)
    expect(depois.jogadores[quem].mao).not.toContainEqual(escolhida)
  })

  it('CA-R7.1-2 — após descartar, a vez é do outro jogador e a fase volta a Compra', () => {
    const comprou = aplicado(iniciarPartida(SEMENTE), { tipo: 'comprarDoMonte' })
    const quem = comprou.jogadorDaVez

    const depois = aplicado(comprou, { tipo: 'descartar', carta: primeira(maoDaVez(comprou)).id })

    expect(depois.jogadorDaVez).not.toBe(quem)
    expect(depois.fase).toBe('Compra')
  })

  it('CA-R7.2-1 — a carta recém-comprada pode ser descartada no mesmo turno', () => {
    const antes = iniciarPartida(SEMENTE)
    const comprada = antes.monte[0]
    const comprou = aplicado(antes, { tipo: 'comprarDoMonte' })

    expect(comprada).toBeDefined()

    // A S23 põe a carta comprada no fim da mão; a R7.2 diz que ela é descartável
    // como qualquer outra. É o tipo de regra que uma implementação "esperta"
    // quebraria ao proteger a carta recém-adquirida.
    const depois = aplicado(comprou, { tipo: 'descartar', carta: comprada?.id ?? '' })

    expect(depois.lixo[0]).toEqual(comprada)
  })
})

describe('S24 — a ordem do lixo', () => {
  it('CA-S24-1 — após dois descartes, lixo[0] é o último descartado', () => {
    const primeiroTurno = turnoCompleto(iniciarPartida(SEMENTE), primeira)
    const descartadaPrimeiro = primeiroTurno.lixo[0]

    const segundoTurno = turnoCompleto(primeiroTurno, primeira)

    expect(segundoTurno.lixo).toHaveLength(2)
    expect(segundoTurno.lixo[1]).toEqual(descartadaPrimeiro)
    expect(segundoTurno.lixo[0]).not.toEqual(descartadaPrimeiro)
  })
})

describe('R3.2 e S22 — comandos que a engine recusa', () => {
  it('CA-R3.2-2 — descartar na fase Compra é recusado', () => {
    const partida = iniciarPartida(SEMENTE)
    const resultado = aplicar(partida, { tipo: 'descartar', carta: primeira(maoDaVez(partida)).id })

    expect(resultado.tipo).toBe('recusa')
  })

  it('CA-S22-1 — descartar carta que não está na mão é recusado', () => {
    const comprou = aplicado(iniciarPartida(SEMENTE), { tipo: 'comprarDoMonte' })
    const doMonte = comprou.monte[0]

    expect(doMonte).toBeDefined()

    // A RF2.1 garante que a interface nunca envia isto. A recusa protege a
    // engine de um chamador com bug — o caso da IA da H15 (S22).
    const resultado = aplicar(comprou, { tipo: 'descartar', carta: doMonte?.id ?? '' })

    expect(resultado.tipo).toBe('recusa')
  })
})

describe('M9 — conservação após o descarte', () => {
  it('CA-M9-5 — após descartar, as 104 cartas se conservam', () => {
    const depois = turnoCompleto(iniciarPartida(SEMENTE), primeira)
    const ids = todasAsCartas(depois).map((carta) => carta.id)

    expect(ids).toHaveLength(104)
    expect(new Set(ids).size).toBe(104)
  })
})

/**
 * Critérios de aceite da spec 0004 §6.2.
 *
 * A partir daqui o cenário vem do construtor validado de `engine/testing/`
 * (C4), e não de `iniciarPartida`: uma mão com sequência dentro é estado
 * específico, e alcançá-lo por sorteio faria o teste falhar por motivos que não
 * têm nada a ver com baixar.
 */

const SEQUENCIA = '5♥ 6♥ 7♥'
const RESTO = '9♠ J♦ 4♣ K♠ 2♦ 8♣ 10♠ Q♦ 3♣'

function comSequenciaNaMao(): Partida {
  return construirPartida({
    maos: [cartas(`${SEQUENCIA} ${RESTO}`), cartas('A♠ 4♦ 7♣ 9♥ J♠ 2♣ 6♦ 10♣ Q♠ K♦ 3♥')],
    jogadorDaVez: 0,
    fase: 'Acao',
  })
}

function idsDe(notacao: string): readonly string[] {
  return cartas(notacao).map((carta) => carta.id)
}

describe('R6.1 e R3.4 — baixar um jogo novo na mesa', () => {
  it('CA-R6.1-1 — as cartas saem da mão e o jogo aparece em meusJogos', () => {
    const antes = comSequenciaNaMao()
    const depois = aplicado(antes, { tipo: 'baixar', cartas: idsDe(SEQUENCIA) })

    expect(antes.jogadores[0].mao).toHaveLength(12)
    expect(depois.jogadores[0].mao).toHaveLength(9)

    for (const id of idsDe(SEQUENCIA)) {
      expect(depois.jogadores[0].mao.map((carta) => carta.id)).not.toContain(id)
    }

    const jogos = depois.jogadores[0].jogos

    expect(jogos).toHaveLength(1)
    expect(jogos[0]?.dono).toBe(0)
    expect(jogos[0]?.naipe).toBe('COPAS')
    expect(jogos[0]?.posicoes.map((posicao) => posicao.carta.valor)).toEqual(['5', '6', '7'])
  })

  it('CA-R6.1-2 — a fase continua Acao e a vez não passa', () => {
    const antes = comSequenciaNaMao()
    const depois = aplicado(antes, { tipo: 'baixar', cartas: idsDe(SEQUENCIA) })

    // S44/R3.3 — "quantas ações quiser, em qualquer ordem". Só o descarte
    // encerra o turno, e é a diferença que a H2 não tinha como mostrar.
    expect(depois.fase).toBe('Acao')
    expect(depois.jogadorDaVez).toBe(antes.jogadorDaVez)
  })

  it('CA-R6.1-3 — baixar cartas que não estão na mão é recusado', () => {
    // A carta existe no baralho e a sequência é válida; o que falha é a posse.
    // A RF2.1 garante que a interface nunca envia isto (S22).
    const resultado = aplicar(comSequenciaNaMao(), { tipo: 'baixar', cartas: idsDe('5♦ 6♦ 7♦') })

    expect(resultado.tipo).toBe('recusa')
  })

  it('CA-R6.1-3 — baixar uma sequência inválida é recusado', () => {
    const resultado = aplicar(comSequenciaNaMao(), { tipo: 'baixar', cartas: idsDe('5♥ 7♥ 9♠') })

    expect(resultado.tipo).toBe('recusa')
  })

  it('CA-R3.4-1 — sem nenhum jogo na mesa, o primeiro pode ser baixado sem mínimo', () => {
    const antes = comSequenciaNaMao()

    // R3.4 — não existe pontuação mínima para a primeira descida. O critério
    // parece vazio e não é: é a ausência de uma regra que quase todo baralho tem.
    expect(antes.jogadores[0].jogos).toHaveLength(0)

    const depois = aplicado(antes, { tipo: 'baixar', cartas: idsDe(SEQUENCIA) })

    expect(depois.jogadores[0].jogos).toHaveLength(1)
  })

  it('CA-R6.1-3 — baixar na fase de compra é recusado (R3.2)', () => {
    const naCompra = construirPartida({
      maos: [cartas(`${SEQUENCIA} ${RESTO}`), cartas('A♠ 4♦ 7♣ 9♥ J♠ 2♣ 6♦ 10♣ Q♠ K♦ 3♥')],
      jogadorDaVez: 0,
      fase: 'Compra',
    })

    expect(aplicar(naCompra, { tipo: 'baixar', cartas: idsDe(SEQUENCIA) }).tipo).toBe('recusa')
  })
})

describe('M9 — conservação após baixar', () => {
  it('CA-M9-7 — após baixar, as 104 cartas se conservam', () => {
    const depois = aplicado(comSequenciaNaMao(), { tipo: 'baixar', cartas: idsDe(SEQUENCIA) })
    const ids = todasAsCartas(depois).map((carta) => carta.id)

    // As cartas mudaram de lugar, não de existência: saíram da mão e entraram
    // nas posições de um jogo. É a primeira transição do projeto em que a M9
    // atravessa uma estrutura aninhada.
    expect(ids).toHaveLength(104)
    expect(new Set(ids).size).toBe(104)
  })

  it('CA-M9-7 — baixar não muta a partida de entrada', () => {
    const antes = comSequenciaNaMao()
    const copia = JSON.parse(JSON.stringify(antes)) as Partida

    aplicado(antes, { tipo: 'baixar', cartas: idsDe(SEQUENCIA) })

    expect(antes).toEqual(copia)
  })
})
