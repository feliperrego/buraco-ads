import { visaoDe } from '../engine/index.ts'
import type { Aleatorio, Comando, JogadorId, Partida } from '../engine/index.ts'
import { decidir } from '../ia/decidir.ts'

/** S11 — o humano é sempre `0`, então a IA é sempre `1`. */
export const IA: JogadorId = 1

/**
 * S35 — a pausa entre comandos da IA, primeira metade da RF5.3.
 *
 * Sem ela o turno inteiro acontece entre dois quadros: o jogador confirma o
 * descarte e a mesa volta a ser dele, com duas cartas a mais no lixo e nenhuma
 * pista de que houve um turno. A apresentação refinada é a H15.
 */
export const PAUSA_DA_IA_MS = 700

/**
 * Um passo do turno da IA — **um comando por vez** (S33), nunca o turno inteiro.
 *
 * Devolve `null` quando não é a vez da IA ou quando não há jogada. Repetir a
 * chamada até `null` percorre o turno completo, e é assim que o efeito em
 * `ProvedorDaPartida` conduz: cada comando muda o estado, o efeito roda de novo.
 *
 * A alternativa — executar o turno completo numa chamada — quebraria na H4, onde
 * o turno tem quantas descidas o jogador quiser (R3.3).
 */
export function comandoDaIa(partida: Partida, aleatorio: Aleatorio): Comando | null {
  if (partida.jogadorDaVez !== IA) {
    return null
  }

  // A IA recebe a projeção, nunca a `Partida` (S29, M11). Esta linha é a
  // fronteira da RF5.2, e é a única do projeto onde ela pode ser furada.
  return decidir(visaoDe(partida, IA), aleatorio)
}
