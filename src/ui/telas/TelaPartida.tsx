import { useState } from 'react'
import { valorDa } from '../../engine/index.ts'
import type {
  Carta,
  CartaBaixada,
  Comando,
  Jogo,
  Posicao,
  VisaoDoJogador,
} from '../../engine/index.ts'

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
 * "1 carta" e "2 cartas".
 *
 * Existe porque a verificação no navegador da H7 mostrou *"Pegar o lixo — 1
 * cartas"*, e a suíte estava verde: os testes conferiam que o rótulo trazia o
 * número, não que ele fosse português. É a terceira vez que rodar o app acha o
 * que teste nenhum pegaria.
 */
function quantasCartas(quantas: number): string {
  return `${String(quantas)} ${quantas === 1 ? 'carta' : 'cartas'}`
}

/**
 * O nome de uma posição na mesa, com o papel visível.
 *
 * Sem isto, o jogo baixado com curinga é indistinguível do mesmo conjunto de
 * cartas baixado sem — e a escolha entre as duas leituras é a decisão central da
 * H5 (spec 0005 §2.1). O jogador escolheria e não veria o resultado.
 */
function nomeDaPosicao(posicao: Posicao): string {
  return posicao.tipo === 'Natural'
    ? nomeDa(posicao.carta)
    : `${nomeDa(posicao.carta)} valendo ${posicao.representa}`
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
  /**
   * A chave de renderização. Era o próprio rótulo até a H6, e isso bastava
   * enquanto nenhum comando tinha alvo. Com dois jogos de **mesmas pontas** na
   * mesa — possível com o baralho duplo (R1.2) —, dois rótulos coincidem, e a
   * chave passa a incluir o `id` do jogo, que é a identidade que a S63 criou.
   */
  readonly chave: string
}

/**
 * S60 — quando mais de um comando casa com a seleção, cada botão se nomeia pelo
 * que o distingue.
 *
 * É consequência direta da §2.1 da spec 0005: as mesmas três cartas podem formar
 * dois jogos diferentes, e o jogador precisa poder pedir um deles. A tela
 * continua sem saber o que é uma sequência — ela lê `representa` do comando e
 * monta o rótulo (T6).
 */
function rotuloDoBaixar(cartas: readonly CartaBaixada[], mao: readonly Carta[]): string {
  const curinga = cartas.find((baixada) => baixada.representa !== undefined)
  const carta = mao.find((daMao) => daMao.id === curinga?.carta)

  if (curinga?.representa === undefined || carta === undefined) {
    return 'Baixar'
  }

  // O naipe do jogo vem de uma posição natural: a do curinga pode ser outra, e é
  // justamente isso que torna a canastra permanentemente suja na R6.5.
  const natural = mao.find(
    (daMao) => daMao.id === cartas.find((baixada) => baixada.representa === undefined)?.carta,
  )

  return `Baixar com ${nomeDa(carta)} valendo ${curinga.representa} de ${
    natural?.naipe.toLowerCase() ?? carta.naipe.toLowerCase()
  }`
}

/**
 * S74 — o rótulo do `aumentar` nomeia o jogo alvo pelas **pontas**, porque com
 * dois jogos do mesmo naipe a mesma carta aumenta os dois e a seleção não os
 * distingue.
 *
 * A S60 continua valendo por cima, e fecha o que a S74 sozinha deixaria aberto:
 * `[2♠→4]` e `[2♠→8]` sobre `5♥ 6♥ 7♥` têm as mesmas cartas **e** o mesmo alvo,
 * e só o papel do curinga os separa. Por isso o rótulo é composto.
 *
 * A tela lê as pontas de `meusJogos` e continua sem saber o que é uma sequência
 * (T6): para ela, "ponta" é a primeira e a última entrada de uma lista.
 */
function rotuloDoAumentar(
  alvo: string,
  cartas: readonly CartaBaixada[],
  mao: readonly Carta[],
  meusJogos: readonly Jogo[],
): string {
  const jogo = meusJogos.find((umJogo) => umJogo.id === alvo)
  const pontas =
    jogo === undefined ? [] : [jogo.posicoes[0], jogo.posicoes[jogo.posicoes.length - 1]]
  const [primeira, ultima] = pontas

  const base =
    jogo === undefined || primeira === undefined || ultima === undefined
      ? 'Aumentar'
      : `Aumentar o jogo de ${valorDa(primeira)} a ${valorDa(ultima)} de ${jogo.naipe.toLowerCase()}`

  const curinga = cartas.find((baixada) => baixada.representa !== undefined)
  const carta = mao.find((daMao) => daMao.id === curinga?.carta)

  return curinga?.representa === undefined || carta === undefined
    ? base
    : `${base} com ${nomeDa(carta)} valendo ${curinga.representa}`
}

function jogadasDe(
  movimentos: readonly Comando[],
  mao: readonly Carta[],
  meusJogos: readonly Jogo[],
): readonly Jogada[] {
  return movimentos.flatMap((comando): Jogada[] => {
    switch (comando.tipo) {
      case 'comprarDoMonte':
      case 'pegarLixo':
        // Comandos **diretos**: não passam pela seleção de cartas da S48, porque
        // não têm cartas a selecionar. Cada um tem seu botão no painel próprio.
        return []
      case 'descartar':
        return [
          { comando, cartas: new Set([comando.carta]), rotulo: 'Descartar', chave: 'Descartar' },
        ]
      case 'baixar': {
        const rotulo = rotuloDoBaixar(comando.cartas, mao)

        return [
          {
            comando,
            cartas: new Set(comando.cartas.map((baixada) => baixada.carta)),
            rotulo,
            chave: rotulo,
          },
        ]
      }
      case 'aumentar': {
        const rotulo = rotuloDoAumentar(comando.jogo, comando.cartas, mao, meusJogos)

        return [
          {
            comando,
            cartas: new Set(comando.cartas.map((baixada) => baixada.carta)),
            rotulo,
            chave: `${comando.jogo}|${rotulo}`,
          },
        ]
      }
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
  const podePegarLixo = movimentos.some((comando) => comando.tipo === 'pegarLixo')
  const jogadas = jogadasDe(movimentos, visao.mao, visao.meusJogos)

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
            Comprar do monte — {quantasCartas(visao.cartasNoMonte)}
          </button>
        ) : (
          <p>{quantasCartas(visao.cartasNoMonte)}</p>
        )}
      </section>

      <section aria-label="Lixo">
        {/* S83/S84 — o botão vem **ao lado** da listagem, nunca no lugar dela.
            Copiar o painel do monte seria o caminho de menor esforço e o erro:
            lá a contagem basta porque o monte é oculto (RF3.3), aqui ela
            violaria a R4.3. O rótulo diz o tamanho porque é o que decide a
            jogada — 3 cartas e 30 cartas são decisões diferentes. */}
        {podePegarLixo ? (
          <button
            type="button"
            onClick={() => {
              aoJogar({ tipo: 'pegarLixo' })
            }}
          >
            Pegar o lixo — {quantasCartas(visao.lixo.length)}
          </button>
        ) : null}

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
              <li key={jogo.id}>{jogo.posicoes.map(nomeDaPosicao).join(', ')}</li>
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
            key={jogada.chave}
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
