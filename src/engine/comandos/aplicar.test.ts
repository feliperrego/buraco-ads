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
