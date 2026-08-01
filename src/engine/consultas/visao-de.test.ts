import { describe, expect, it } from 'vitest'
import { aplicar } from '../comandos/aplicar.ts'
import type { Comando } from '../comandos/comando.ts'
import { iniciarPartida } from '../dominio/partida.ts'
import type { Partida } from '../dominio/partida.ts'
import { visaoDe } from './visao-de.ts'

/**
 * Critério de aceite da spec 0002 §6.
 *
 * A R4.3 é a característica central do Buraco Aberto: o lixo inteiro é público
 * durante toda a rodada, para os dois jogadores. Na H1 o lixo estava sempre
 * vazio, então esta era a única regra da visão que não dava para verificar.
 */

const SEMENTE = 7

function aplicado(partida: Partida, comando: Comando): Partida {
  const resultado = aplicar(partida, comando)

  if (resultado.tipo !== 'sucesso') {
    throw new Error(`esperava sucesso em ${comando.tipo}, veio recusa: ${resultado.motivo}`)
  }

  return resultado.partida
}

describe('R4.3 — o lixo é público para os dois', () => {
  it('CA-R4.3-1 — a visão de ambos os jogadores contém o lixo inteiro', () => {
    const comprou = aplicado(iniciarPartida(SEMENTE), { tipo: 'comprarDoMonte' })
    const mao = comprou.jogadores[comprou.jogadorDaVez].mao
    const escolhida = mao[0]

    expect(escolhida).toBeDefined()

    const depois = aplicado(comprou, { tipo: 'descartar', carta: escolhida?.id ?? '' })

    expect(visaoDe(depois, 0).lixo).toEqual(depois.lixo)
    expect(visaoDe(depois, 1).lixo).toEqual(depois.lixo)
    expect(visaoDe(depois, 0).lixo).toHaveLength(1)
  })
})
