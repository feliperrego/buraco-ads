import { describe, expect, it } from 'vitest'
import { aplicar, iniciarPartida } from '../engine/index.ts'
import type { Partida } from '../engine/index.ts'
import { INICIAL, emAndamento, reduzir } from './partida-em-curso.ts'

/**
 * Critérios da spec 0016 §7 — a RF1.3 no reducer, e a definição da S157.
 *
 * O reducer é puro (S8), então ele se testa sem React. O efeito que consome a
 * `emAndamento` é testado em `ProvedorDaPartida.test.tsx`; aqui está a
 * **definição**, que é a decisão. É a mesma divisão do `podeBater`: a regra num
 * lugar, a aplicação em outro.
 */

const SEMENTE = 7

function jogada(partida: Partida): Partida {
  const resultado = aplicar(partida, { tipo: 'comprarDoMonte' })

  if (resultado.tipo !== 'sucesso') {
    throw new Error(`cenário impossível: ${resultado.motivo}`)
  }

  return resultado.partida
}

describe('S155 — abandonar zera a partida e não conhece rota', () => {
  it('CA-S155-3 — a ação abandonar devolve partida nula', () => {
    const comPartida = reduzir(INICIAL, { tipo: 'iniciar', semente: SEMENTE })

    // Âncora positiva: sem ela, "ficou null" passaria com um estado que já era
    // null. É o par que a S158 exige.
    expect(comPartida.partida).not.toBeNull()

    expect(reduzir(comPartida, { tipo: 'abandonar' }).partida).toBeNull()
  })

  it('CA-S155-3 — abandonar sem partida alguma não quebra', () => {
    expect(reduzir(INICIAL, { tipo: 'abandonar' }).partida).toBeNull()
  })

  it('CA-S158-1 — abandonar e iniciar de novo entrega partida nova, sem resto', () => {
    const emCurso = reduzir(reduzir(INICIAL, { tipo: 'iniciar', semente: SEMENTE }), {
      tipo: 'jogar',
      comando: { tipo: 'comprarDoMonte' },
    })

    expect(emCurso.partida?.fase).toBe('Acao')

    const depois = reduzir(reduzir(emCurso, { tipo: 'abandonar' }), {
      tipo: 'iniciar',
      semente: SEMENTE,
    })

    expect(depois.partida?.fase).toBe('Compra')
    expect(depois.partida?.placar).toEqual([0, 0])
    expect(depois.partida?.numeroDaRodada).toBe(1)
  })
})

describe('S157 — o que conta como partida em andamento', () => {
  it('CA-S157-1 — sem partida, não há andamento', () => {
    expect(emAndamento(null)).toBe(false)
  })

  it('CA-S157-1 — partida recém-iniciada está em andamento', () => {
    expect(emAndamento(iniciarPartida(SEMENTE))).toBe(true)
    expect(emAndamento(jogada(iniciarPartida(SEMENTE)))).toBe(true)
  })

  it('CA-S157-2 — rodada encerrada no meio da partida continua em andamento', () => {
    // O placar acumulado se perde igual se a janela fechar aqui. O que separa
    // este caso do de baixo é só o placar ter decidido ou não.
    const noMeio: Partida = {
      ...iniciarPartida(SEMENTE),
      fase: 'RodadaEncerrada',
      placar: [400, 250],
      numeroDaRodada: 2,
    }

    expect(emAndamento(noMeio)).toBe(true)
  })

  it('CA-S157-1 — partida decidida não está em andamento', () => {
    const decidida: Partida = {
      ...iniciarPartida(SEMENTE),
      fase: 'RodadaEncerrada',
      placar: [3200, 900],
      numeroDaRodada: 5,
    }

    expect(emAndamento(decidida)).toBe(false)
  })
})
