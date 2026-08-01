import { useState } from 'react'
import type { Carta, Comando, VisaoDoJogador } from '../../engine/index.ts'

/**
 * Tela de partida (screens.md §1, layout da Opção B em T2). Sem estilo — o
 * acabamento é a H19.
 *
 * Recebe a `VisaoDoJogador` e a lista de movimentos por propriedade. A tela
 * **filtra** pela lista e nunca valida (T6): se um comando não está lá, o
 * elemento correspondente não responde. Isso é a RF2.1 — jogada inválida não é
 * recusada com mensagem, ela não existe.
 *
 * Cada área é uma `<section aria-label>`, o que lhe dá `role="region"` com nome
 * acessível. É como os testes encontram as áreas, e atende a RNF3.4 de graça.
 */
type Props = {
  readonly visao: VisaoDoJogador
  readonly movimentos: readonly Comando[]
  readonly aoJogar: (comando: Comando) => void
}

function nomeDa(carta: Carta): string {
  return `${carta.valor} de ${carta.naipe.toLowerCase()}`
}

export default function TelaPartida({ visao, movimentos, aoJogar }: Props) {
  // T5 — a máquina de estados de seleção vive em `ui/`, separada do domínio. A
  // engine não sabe o que é "carta selecionada": para ela só existe o descarte.
  const [selecionada, setSelecionada] = useState<string | null>(null)

  const podeComprar = movimentos.some((comando) => comando.tipo === 'comprarDoMonte')

  const descartaveis = new Set(
    movimentos.flatMap((comando) => (comando.tipo === 'descartar' ? [comando.carta] : [])),
  )

  // Uma seleção só vale enquanto aquela carta continuar descartável. Assim a
  // troca de fase ou de vez invalida a seleção sozinha, sem efeito colateral.
  const selecaoValida = selecionada !== null && descartaveis.has(selecionada)

  function descartar() {
    if (selecionada === null) {
      return
    }

    aoJogar({ tipo: 'descartar', carta: selecionada })
    setSelecionada(null)
  }

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
          {visao.jogadorDaVez === visao.eu ? 'Sua vez' : 'Vez do adversário'} — fase de{' '}
          {visao.fase === 'Compra' ? 'compra' : 'ação'}
        </p>
      </section>

      <section aria-label="Mão do adversário">
        <p>{visao.cartasNaMaoDoAdversario} cartas viradas</p>
      </section>

      <section aria-label="Jogos do adversário">
        <p>{visao.jogosDoAdversario.length === 0 ? 'Nenhum jogo na mesa' : ''}</p>
      </section>

      <section aria-label="Monte">
        {podeComprar ? (
          <button
            type="button"
            onClick={() => {
              aoJogar({ tipo: 'comprarDoMonte' })
            }}
          >
            Comprar do monte — {visao.cartasNoMonte} cartas
          </button>
        ) : (
          <p>{visao.cartasNoMonte} cartas</p>
        )}
      </section>

      <section aria-label="Lixo">
        {/* R4.3 — o lixo inteiro é público, e é a característica central do
            Buraco Aberto. Mostrar só a contagem violaria a regra. */}
        {visao.lixo.length === 0 ? (
          <p>Vazio</p>
        ) : (
          <ol>
            {visao.lixo.map((carta) => (
              <li key={carta.id}>{nomeDa(carta)}</li>
            ))}
          </ol>
        )}
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
              {descartaveis.has(carta.id) ? (
                <button
                  type="button"
                  aria-pressed={selecionada === carta.id}
                  onClick={() => {
                    setSelecionada(carta.id)
                  }}
                >
                  {nomeDa(carta)}
                </button>
              ) : (
                // T9 — na fase de compra a mão fica visível e inerte. A R3.2 é
                // ausência de afetação, não mensagem de erro.
                nomeDa(carta)
              )}
            </li>
          ))}
        </ul>

        {/* S27 — dois passos. A RF2.3 não tem desfazer, e um descarte errado num
            toque acidental é irreversível. */}
        {selecaoValida && (
          <button type="button" onClick={descartar}>
            Descartar a carta selecionada
          </button>
        )}
      </section>
    </>
  )
}
