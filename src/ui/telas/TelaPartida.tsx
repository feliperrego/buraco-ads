import type { VisaoDoJogador } from '../../engine/index.ts'

/**
 * Tela de partida (screens.md §1, layout da Opção B em T2). Sem estilo — o
 * acabamento é a H19.
 *
 * Recebe a `VisaoDoJogador` por propriedade, e não a `Partida`: a spec §4.2 é
 * explícita em que a interface nunca vê o estado completo. Componente
 * apresentacional puro — não conhece contexto nem roteador.
 *
 * Cada área é uma `<section aria-label>`, o que lhe dá `role="region"` com nome
 * acessível. Isso não é enfeite: é como a CA-S1-1 e a CA-S1-2 encontram as
 * áreas, e atende a RNF3.4 de graça.
 *
 * **Nada aqui responde a clique** (S1). A H1 é a prova de que engine → estado →
 * interface funciona; a interatividade nasce na H2.
 */
export default function TelaPartida({ visao }: { visao: VisaoDoJogador }) {
  return (
    <>
      <h1>Partida</h1>

      <section aria-label="Placar">
        <p>
          {visao.placar[0]} × {visao.placar[1]}
        </p>
      </section>

      <section aria-label="Vez e fase">
        <p>
          Vez do jogador {visao.jogadorDaVez} — fase de {visao.fase}
        </p>
      </section>

      <section aria-label="Mão do adversário">
        <p>{visao.cartasNaMaoDoAdversario} cartas viradas</p>
      </section>

      <section aria-label="Jogos do adversário">
        <p>{visao.jogosDoAdversario.length === 0 ? 'Nenhum jogo na mesa' : ''}</p>
      </section>

      <section aria-label="Monte">
        <p>{visao.cartasNoMonte} cartas</p>
      </section>

      <section aria-label="Lixo">
        <p>{visao.lixo.length === 0 ? 'Vazio' : `${String(visao.lixo.length)} cartas`}</p>
      </section>

      <section aria-label="Mortos">
        <p>{visao.mortosRestantes} mortos por pegar</p>
      </section>

      <section aria-label="Meus jogos">
        <p>{visao.meusJogos.length === 0 ? 'Nenhum jogo na mesa' : ''}</p>
      </section>

      <section aria-label="Minha mão">
        <ul>
          {visao.mao.map((carta) => (
            <li key={carta.id}>
              {carta.valor} de {carta.naipe.toLowerCase()}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
