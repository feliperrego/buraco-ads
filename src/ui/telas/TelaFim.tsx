import type { JogadorId } from '../../engine/index.ts'

/**
 * Tela de fim de partida (RF1.5, screens.md §1).
 *
 * S135 — a `screens.md` chama a `/fim` de **tela** e a apuração de painel, e a
 * diferença sobrevive aqui: a apuração é da rodada e acontece com a partida
 * atrás dela; o fim é da partida e não tem mesa para mostrar.
 *
 * Recebe o vencedor já decidido, e não a `Partida`: quem lê a R12.2 é
 * `vencedorDa`, na engine (S132). A tela não sabe o que são 3000 pontos.
 */
type Props = {
  readonly vencedor: JogadorId
  readonly placar: readonly [number, number]
  readonly aoJogarDeNovo: () => void
}

export default function TelaFim({ vencedor, placar, aoJogarDeNovo }: Props) {
  // S11 — o humano é sempre `0`.
  return (
    <>
      <h1>{vencedor === 0 ? 'Você venceu' : 'O adversário venceu'}</h1>

      <section aria-label="Placar final">
        <p>
          Você: {placar[0]} — Adversário: {placar[1]}
        </p>
      </section>

      {/* RF1.5 — ao fim da partida o jogo **oferece** nova partida. */}
      <button type="button" onClick={aoJogarDeNovo}>
        Nova partida
      </button>
    </>
  )
}
