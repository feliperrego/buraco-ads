import { describe, expect, it } from 'vitest'
import { aplicar } from '../comandos/aplicar.ts'
import type { Comando } from '../comandos/comando.ts'
import { iniciarPartida } from '../dominio/partida.ts'
import type { Partida } from '../dominio/partida.ts'
import { apurar } from '../dominio/pontuacao.ts'
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

/**
 * Critérios de aceite da spec 0012 §8.3 — a fronteira da apuração.
 *
 * S125 — `apuracao` é o primeiro campo da visão que expõe algo do adversário
 * além de contagem: os pontos dele saem das cartas dele. Está certo porque a
 * rodada acabou e a R11 é pública, mas o `null` durante a rodada **é** a
 * fronteira: preenchê-lo em `Acao` deixaria a IA ler a mão do adversário pela
 * pontuação, furando a RF5.2.
 */
describe('S125 — a apuração só existe com a rodada encerrada', () => {
  it('CA-S125-1 — durante a rodada, apuracao é null', () => {
    // A âncora positiva vem no critério seguinte: sem ela, uma visão que nunca
    // preenchesse o campo passaria aqui de graça.
    expect(visaoDe(iniciarPartida(SEMENTE), 0).apuracao).toBeNull()
    expect(
      visaoDe(aplicado(iniciarPartida(SEMENTE), { tipo: 'comprarDoMonte' }), 0).apuracao,
    ).toBeNull()
  })

  it('CA-S125-2 — encerrada a rodada, apuracao traz os dois jogadores, e o meu está no índice eu', () => {
    const encerrada: Partida = { ...iniciarPartida(SEMENTE), fase: 'RodadaEncerrada' }

    for (const eu of [0, 1] as const) {
      const apuracao = visaoDe(encerrada, eu).apuracao

      expect(apuracao).not.toBeNull()
      expect(apuracao).toHaveLength(2)
      // O índice é o `JogadorId`, como no placar (RF4.1): a visão não reordena.
      expect(apuracao?.[eu]).toEqual(apurar(encerrada)[eu])
    }
  })
})
