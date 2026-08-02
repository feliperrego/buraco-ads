import { describe, expect, it } from 'vitest'
import { aplicar, criarAleatorio, iniciarPartida } from '../engine/index.ts'
import type { Aleatorio, Carta, Comando, Partida } from '../engine/index.ts'
import { IA, comandoDaIa } from './turno-da-ia.ts'

/**
 * Critérios de integração da spec 0003 §6, nível 5 da testing-strategy.md.
 *
 * Aqui o turno da IA é percorrido **sem React**: repetir `comandoDaIa` até
 * `null` é exatamente o que o efeito faz, uma passagem por vez. O que o efeito
 * acrescenta — a pausa e o disparo — é testado com temporizador falso em
 * `ProvedorDaPartida.test.tsx`.
 */

/** Semente em que o humano começa, para o turno da IA vir depois do dele. */
const SEMENTE_HUMANO_COMECA = 3

function aplicado(partida: Partida, comando: Comando): Partida {
  const resultado = aplicar(partida, comando)

  if (resultado.tipo !== 'sucesso') {
    throw new Error(`esperava sucesso em ${comando.tipo}: ${resultado.motivo}`)
  }

  return resultado.partida
}

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

/** Joga o turno do humano: compra e descarta a primeira carta da mão. */
function turnoDoHumano(partida: Partida): Partida {
  const comprou = aplicado(partida, { tipo: 'comprarDoMonte' })
  const primeira = comprou.jogadores[0].mao[0]

  if (primeira === undefined) {
    throw new Error('cenário impossível: mão vazia')
  }

  return aplicado(comprou, { tipo: 'descartar', carta: primeira.id })
}

/** Percorre o turno da IA como o efeito faz: um comando por passagem. */
function turnoDaIa(partida: Partida, aleatorio: Aleatorio) {
  const comandos: Comando[] = []
  let atual = partida

  // O limite existe para o teste falhar em vez de travar se o turno não
  // terminar. Um turno da H3 tem dois comandos.
  for (let passagem = 0; passagem < 10; passagem += 1) {
    const comando = comandoDaIa(atual, aleatorio)

    if (comando === null) {
      break
    }

    comandos.push(comando)
    atual = aplicado(atual, comando)
  }

  return { partida: atual, comandos }
}

describe('S33 — o turno da IA, um comando por vez', () => {
  it('CA-S33-1 — o turno da IA são exatamente dois comandos: compra e depois descarte', () => {
    const aposHumano = turnoDoHumano(iniciarPartida(SEMENTE_HUMANO_COMECA))

    // Âncora: só faz sentido contar os comandos da IA se for mesmo a vez dela.
    expect(aposHumano.jogadorDaVez).toBe(IA)

    const { comandos } = turnoDaIa(aposHumano, criarAleatorio(1))

    expect(comandos.map((comando) => comando.tipo)).toEqual(['comprarDoMonte', 'descartar'])
  })

  it('CA-RF5.1-3 — depois do turno da IA a vez volta ao humano, na fase de compra', () => {
    const aposHumano = turnoDoHumano(iniciarPartida(SEMENTE_HUMANO_COMECA))
    const { partida } = turnoDaIa(aposHumano, criarAleatorio(1))

    expect(partida.jogadorDaVez).toBe(0)
    expect(partida.fase).toBe('Compra')
    // A IA comprou uma e descartou uma: a mão dela volta ao tamanho de antes.
    expect(partida.jogadores[IA].mao).toHaveLength(11)
    expect(partida.lixo).toHaveLength(2)
  })
})

describe('M9 — conservação através do turno da IA', () => {
  it('CA-M9-6 — após o turno completo da IA, as 104 cartas se conservam', () => {
    const aposHumano = turnoDoHumano(iniciarPartida(SEMENTE_HUMANO_COMECA))
    const { partida } = turnoDaIa(aposHumano, criarAleatorio(1))
    const ids = todasAsCartas(partida).map((carta) => carta.id)

    expect(ids).toHaveLength(104)
    expect(new Set(ids).size).toBe(104)
  })
})

describe('S33 — fora da vez da IA não há comando', () => {
  it('CA-S33-1 — com a vez do humano, comandoDaIa devolve null', () => {
    const partida = iniciarPartida(SEMENTE_HUMANO_COMECA)

    // Âncora: a vez precisa ser mesmo do humano para a ausência significar algo.
    expect(partida.jogadorDaVez).toBe(0)
    expect(comandoDaIa(partida, criarAleatorio(1))).toBeNull()
  })
})
