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

/**
 * S48 — o comando visto como conjunto de cartas. É o que unifica o que a H2
 * fazia à mão: `descartar` vira o caso de conjunto unitário e perde o caminho
 * próprio.
 */
type Jogada = {
  readonly comando: Comando
  readonly cartas: ReadonlySet<string>
  readonly rotulo: string
}

function jogadasDe(movimentos: readonly Comando[]): readonly Jogada[] {
  return movimentos.flatMap((comando): Jogada[] => {
    switch (comando.tipo) {
      case 'comprarDoMonte':
        return []
      case 'descartar':
        return [{ comando, cartas: new Set([comando.carta]), rotulo: 'Descartar' }]
      case 'baixar':
        return [{ comando, cartas: new Set(comando.cartas), rotulo: 'Baixar' }]
    }
  })
}

function contem(cartas: ReadonlySet<string>, ids: readonly string[]): boolean {
  return ids.every((id) => cartas.has(id))
}

export default function TelaPartida({ visao, movimentos, aoJogar }: Props) {
  // T5 — a máquina de estados de seleção vive em `ui/`, separada do domínio. A
  // engine não sabe o que é "carta selecionada": para ela só existem comandos.
  const [selecionadas, setSelecionadas] = useState<readonly string[]>([])

  const podeComprar = movimentos.some((comando) => comando.tipo === 'comprarDoMonte')
  const jogadas = jogadasDe(movimentos)

  // Uma seleção só vale enquanto alguma jogada ainda a contiver. Assim a troca
  // de fase ou de vez a invalida sozinha, sem efeito colateral.
  const validas = jogadas.filter((jogada) => contem(jogada.cartas, selecionadas))
  const selecao = validas.length > 0 ? selecionadas : []

  /**
   * S49 — uma carta é selecionável quando participa de ao menos um comando
   * **compatível com a seleção atual**. Ao selecionar, as que deixam de poder
   * acompanhar ficam inertes.
   *
   * O efeito colateral é bom: o jogador descobre as sequências possíveis pela
   * própria mesa, sem o jogo explicar nada. E a tela continua sem saber o que é
   * uma sequência — ela só cruza conjuntos (T6).
   */
  const selecionaveis = new Set(
    jogadas
      .filter((jogada) => contem(jogada.cartas, selecao))
      .flatMap((jogada) => [...jogada.cartas]),
  )

  // S48 — confirma quem casar **exatamente** com a seleção. Nenhum dos botões é
  // decidido pela interface: os dois saem deste mesmo filtro.
  const confirmaveis =
    selecao.length > 0 ? validas.filter((jogada) => jogada.cartas.size === selecao.length) : []

  function alternar(id: string) {
    setSelecionadas((antes) =>
      antes.includes(id) ? antes.filter((outro) => outro !== id) : [...antes, id],
    )
  }

  function confirmar(jogada: Jogada) {
    aoJogar(jogada.comando)
    setSelecionadas([])
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
        {visao.meusJogos.length === 0 ? (
          <p>Nenhum jogo na mesa</p>
        ) : (
          <ul>
            {visao.meusJogos.map((jogo) => (
              <li key={jogo.id}>
                {jogo.posicoes.map((posicao) => nomeDa(posicao.carta)).join(', ')}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Minha mão">
        <ul>
          {visao.mao.map((carta) => (
            <li key={carta.id}>
              {selecionaveis.has(carta.id) ? (
                <button
                  type="button"
                  aria-pressed={selecao.includes(carta.id)}
                  onClick={() => {
                    alternar(carta.id)
                  }}
                >
                  {nomeDa(carta)}
                </button>
              ) : (
                // T9 — na fase de compra a mão fica visível e inerte, e a S49
                // estende isso: carta que não acompanha a seleção também é
                // inerte. A R3.2 é ausência de afetação, não mensagem de erro.
                nomeDa(carta)
              )}
            </li>
          ))}
        </ul>

        {/* S27 — dois passos. A RF2.3 não tem desfazer, e uma jogada errada num
            toque acidental é irreversível. */}
        {confirmaveis.map((jogada) => (
          <button
            key={jogada.rotulo}
            type="button"
            onClick={() => {
              confirmar(jogada)
            }}
          >
            {jogada.rotulo}
          </button>
        ))}
      </section>
    </>
  )
}
