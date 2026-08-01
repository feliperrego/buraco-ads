import { describe, expect, it } from 'vitest'
import type { Carta } from '../dominio/carta.ts'
import { iniciarPartida } from '../dominio/partida.ts'
import type { Partida } from '../dominio/partida.ts'
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

function todasAsCartas(partida: Partida): readonly Carta[] {
  return [
    ...partida.jogadores[0].mao,
    ...partida.jogadores[1].mao,
    ...partida.jogadores[0].jogos,
    ...partida.jogadores[1].jogos,
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
