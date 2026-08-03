import type { Carta } from '../dominio/carta.ts'
import type { Jogo } from '../dominio/jogo.ts'
import type { FaseDaRodada, JogadorId, Partida } from '../dominio/partida.ts'

/**
 * M11 — projeção de `Partida`. A IA recebe isto e **nunca** a `Partida`, e a
 * interface renderiza exatamente isto (spec §4.2).
 *
 * A garantia da RF5.2 é estrutural: mão do adversário, conteúdo do monte e
 * conteúdo dos mortos não estão aqui de forma alguma — só as suas contagens. Se
 * o dado não chega, não pode ser usado, nem por bug nem por atalho.
 */
export type VisaoDoJogador = {
  readonly eu: JogadorId
  readonly mao: readonly Carta[]
  /** Integralmente público (R4.3, RF3.1). */
  readonly lixo: readonly Carta[]
  readonly meusJogos: readonly Jogo[]
  readonly jogosDoAdversario: readonly Jogo[]
  /** Contagem, nunca o conteúdo (RF3.3). */
  readonly cartasNoMonte: number
  /** Contagem (RF3.2). */
  readonly cartasNaMaoDoAdversario: number
  /** Não reclamados (RF3.4). */
  readonly mortosRestantes: number
  /**
   * S115 — quantos mortos **eu** peguei, que é a primeira condição da R10.1.
   *
   * Só o meu. O do adversário não é exigido por nenhuma regra desta fatia, e a
   * RF5.2 é mais barata de manter quando o campo não existe.
   */
  readonly meusMortos: number
  /** Índice = `JogadorId` (RF4.1). */
  readonly placar: readonly [number, number]
  readonly jogadorDaVez: JogadorId
  readonly fase: FaseDaRodada
  readonly numeroDaRodada: number
}

export function visaoDe(partida: Partida, jogador: JogadorId): VisaoDoJogador {
  const eu = partida.jogadores[jogador]
  const adversario = partida.jogadores[jogador === 0 ? 1 : 0]

  return {
    eu: jogador,
    mao: eu.mao,
    lixo: partida.lixo,
    meusJogos: eu.jogos,
    jogosDoAdversario: adversario.jogos,
    // As três contagens abaixo são o que substitui o conteúdo oculto. Trocar
    // qualquer uma pelo array correspondente vazaria informação e quebraria a
    // RF5.2 — que aqui é garantia estrutural, não política.
    cartasNoMonte: partida.monte.length,
    cartasNaMaoDoAdversario: adversario.mao.length,
    mortosRestantes: partida.mortos.filter((morto) => morto.reclamadoPor === null).length,
    meusMortos: partida.mortos.filter((morto) => morto.reclamadoPor === jogador).length,
    placar: partida.placar,
    jogadorDaVez: partida.jogadorDaVez,
    fase: partida.fase,
    numeroDaRodada: partida.numeroDaRodada,
  }
}
