import { describe, expect, it } from 'vitest'
import {
  aplicar,
  criarAleatorio,
  iniciarPartida,
  movimentosValidos,
  visaoDe,
} from '../engine/index.ts'
import type { Comando, Partida, VisaoDoJogador } from '../engine/index.ts'
import { decidir } from './decidir.ts'

/**
 * Critérios de aceite da spec 0003 §6, nível 3 da testing-strategy.md.
 *
 * A E6 lista quatro propriedades da IA. Duas cabem aqui — legalidade e
 * determinismo. Força relativa e orçamento de 100 ms precisam de duas IAs para
 * comparar, e ficam na H15.
 */

const SEMENTE = 7

function visaoDaVez(partida: Partida): VisaoDoJogador {
  return visaoDe(partida, partida.jogadorDaVez)
}

/** Leva a partida à fase de ação, onde a lista de movimentos é longa. */
function emAcao(semente = SEMENTE): Partida {
  const resultado = aplicar(iniciarPartida(semente), { tipo: 'comprarDoMonte' })

  if (resultado.tipo !== 'sucesso') {
    throw new Error(`cenário impossível: ${resultado.motivo}`)
  }

  return resultado.partida
}

describe('RF5.1 — a IA joga sozinha, dentro das regras', () => {
  it('CA-RF5.1-1 — a escolha da IA está sempre em movimentosValidos', () => {
    for (let semente = 1; semente <= 30; semente += 1) {
      const partida = emAcao(semente)
      const visao = visaoDaVez(partida)
      const escolha = decidir(visao, criarAleatorio(semente))

      expect(movimentosValidos(visao)).toContainEqual(escolha)
    }
  })

  it('CA-RF5.1-2 — sem movimento algum, decidir devolve null', () => {
    const partida = emAcao()

    // A visão de quem NÃO é da vez tem lista vazia (S20). É o único jeito de
    // chegar nesse estado antes da H14, onde o monte esgota.
    const visaoDoOutro = visaoDe(partida, partida.jogadorDaVez === 0 ? 1 : 0)

    expect(movimentosValidos(visaoDoOutro)).toHaveLength(0)
    expect(decidir(visaoDoOutro, criarAleatorio(1))).toBeNull()
  })
})

describe('RF5.2 e M11 — a IA não pode trapacear', () => {
  it('CA-RF5.2-1 — mudar o monte sem mudar a visão não muda a escolha', () => {
    const partida = emAcao()
    const deCabecaParaBaixo: Partida = { ...partida, monte: [...partida.monte].reverse() }

    const original = decidir(visaoDaVez(partida), criarAleatorio(99))
    const embaralhada = decidir(visaoDaVez(deCabecaParaBaixo), criarAleatorio(99))

    expect(original).toEqual(embaralhada)

    // Âncora positiva, e é ela que dá sentido ao resto: uma IA que devolvesse
    // sempre a mesma coisa passaria na asserção acima. O par prova que a escolha
    // **é** sensível ao que a visão mostra, e insensível ao que ela esconde.
    const maoMenor: Partida = {
      ...partida,
      jogadores:
        partida.jogadorDaVez === 0
          ? [
              { ...partida.jogadores[0], mao: partida.jogadores[0].mao.slice(0, 2) },
              partida.jogadores[1],
            ]
          : [
              partida.jogadores[0],
              { ...partida.jogadores[1], mao: partida.jogadores[1].mao.slice(0, 2) },
            ],
    }

    expect(movimentosValidos(visaoDaVez(maoMenor))).toHaveLength(2)
    expect(decidir(visaoDaVez(maoMenor), criarAleatorio(99))).not.toEqual(original)
  })

  it('CA-M11-1 — a visão da IA não contém a mão do adversário, o monte nem os mortos', () => {
    const partida = iniciarPartida(SEMENTE)
    const ia = partida.jogadorDaVez === 0 ? 1 : 0
    const humano = ia === 0 ? 1 : 0
    const serializada = JSON.stringify(visaoDe(partida, ia))

    const ocultas = [
      ...partida.jogadores[humano].mao,
      ...partida.monte,
      ...partida.mortos[0].cartas,
      ...partida.mortos[1].cartas,
    ]

    // Âncora: a visão precisa conter alguma coisa antes de a ausência valer.
    expect(serializada).toContain(partida.jogadores[ia].mao[0]?.id ?? 'sem-mao')

    for (const carta of ocultas) {
      expect(serializada, `vazou ${carta.id}`).not.toContain(carta.id)
    }

    expect(ocultas).toHaveLength(93)
  })
})

describe('M12 — o determinismo da escolha', () => {
  it('CA-M12-1 — a mesma visão e a mesma semente produzem a mesma escolha', () => {
    const visao = visaoDaVez(emAcao())

    expect(decidir(visao, criarAleatorio(123))).toEqual(decidir(visao, criarAleatorio(123)))
  })

  it('CA-M12-2 — a mesma visão com sementes diferentes produz escolhas diferentes', () => {
    const visao = visaoDaVez(emAcao())

    const escolhas = new Set(
      Array.from({ length: 30 }, (_, i) => JSON.stringify(decidir(visao, criarAleatorio(i + 1)))),
    )

    // Sem isto, "sorteia uniformemente" seria indistinguível de "devolve sempre
    // o primeiro" — que passaria em todos os outros critérios desta fatia.
    expect(escolhas.size).toBeGreaterThan(1)
  })
})

describe('S31 — a assinatura aguenta o caso da H14', () => {
  it('CA-RF5.1-2 — decidir devolve Comando ou null, nunca lança em estado legal', () => {
    const partida = emAcao()
    const escolha: Comando | null = decidir(visaoDaVez(partida), criarAleatorio(5))

    expect(escolha).not.toBeNull()
  })
})
