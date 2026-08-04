import { useState } from 'react'
import { PONTOS_PARA_VENCER, categoriaDe, totalDe, valorDa } from '../../engine/index.ts'
import type {
  Carta,
  CartaBaixada,
  CategoriaCanastra,
  Comando,
  Jogo,
  Pontuacao,
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
  /**
   * S134 — o que fazer depois de ler a apuração. A tela não sabe redistribuir
   * nem navegar (T6): ela avisa, e `estado/` decide entre a rodada seguinte e a
   * tela de fim.
   */
  readonly aoSeguir: () => void
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
 * S108 — "nenhum morto por pegar", "1 morto por pegar", "2 mortos por pegar".
 *
 * O zero ganha palavra em vez de algarismo porque *"0 mortos por pegar"* lê como
 * defeito de contagem. É o mesmo cuidado do `quantasCartas`, que nasceu de um
 * *"1 cartas"* achado no navegador.
 */
function quantosMortos(quantos: number): string {
  if (quantos === 0) {
    return 'nenhum morto por pegar'
  }

  return `${String(quantos)} ${quantos === 1 ? 'morto' : 'mortos'} por pegar`
}

/**
 * O nome de uma posição na mesa, com o papel visível.
 *
 * Sem isto, o jogo baixado com curinga é indistinguível do mesmo conjunto de
 * cartas baixado sem — e a escolha entre as duas leituras é a decisão central da
 * H5 (spec 0005 §2.1). O jogador escolheria e não veria o resultado.
 */
/**
 * S93 — a categoria em português, e **nada** para jogo de menos de sete.
 *
 * A ausência é a R8.1, não uma omissão: escrever "sem categoria" faria a tela
 * afirmar algo que a R8.2 não define, e a R8.1 é justamente sobre o limiar em
 * que a categoria passa a existir.
 *
 * A tela chama `categoriaDe` e traduz. Ela continua sem saber o que é uma
 * canastra (T6): para ela, categoria é um de quatro rótulos ou nada — o mesmo
 * arranjo do `valorDa` na H6.
 */
const NOME_DA_CATEGORIA: Readonly<Record<CategoriaCanastra, string>> = {
  DE_1000: 'canastra de 1000',
  DE_500: 'canastra de 500',
  LIMPA: 'canastra limpa',
  SUJA: 'canastra suja',
}

/** O plural de cada categoria, para a contagem da RF4.2. */
const PLURAL_DA_CATEGORIA: Readonly<Record<CategoriaCanastra, string>> = {
  DE_1000: 'canastras de 1000',
  DE_500: 'canastras de 500',
  LIMPA: 'canastras limpas',
  SUJA: 'canastras sujas',
}

const CATEGORIAS: readonly CategoriaCanastra[] = ['DE_1000', 'DE_500', 'LIMPA', 'SUJA']

/**
 * S126 — a apuração da R11, item por item, para os dois jogadores (RF4.2).
 *
 * A RF4.2 pede "canastras **por categoria**", e é a parte fácil de perder: um
 * total de 400 não diz se são duas limpas ou quatro sujas. Por isso a contagem
 * aparece antes dos pontos, com o plural certo — a `CA-S126-1` cobra as duas
 * coisas, e o par "1 canastra limpa" / "1 canastras limpas" é a lição da H7.
 */
function ApuracaoDoJogador({ pontuacao, nome }: { pontuacao: Pontuacao; nome: string }) {
  const linhas = CATEGORIAS.flatMap((categoria) => {
    const quantas = pontuacao.canastras[categoria]

    return quantas === 0
      ? []
      : [
          `${String(quantas)} ${quantas === 1 ? NOME_DA_CATEGORIA[categoria] : PLURAL_DA_CATEGORIA[categoria]}`,
        ]
  })

  return (
    <li>
      <h3>{nome}</h3>
      <ul>
        <li>
          Canastras: {linhas.length === 0 ? 'nenhuma' : linhas.join(', ')} —{' '}
          {pontuacao.pontosDeCanastra}
        </li>
        <li>Cartas na mesa: {pontuacao.cartasNaMesa}</li>
        <li>Cartas na mão: {pontuacao.cartasNaMao}</li>
        <li>Bônus de batida: {pontuacao.bonusDeBatida}</li>
        <li>Penalidade por não pegar morto: {pontuacao.penalidadeDeMorto}</li>
        <li>
          <strong>Total: {totalDe(pontuacao)}</strong>
        </li>
      </ul>
    </li>
  )
}

/**
 * Um jogo na mesa, com as posições nomeadas e a categoria quando houver.
 *
 * S92 — serve aos **dois** painéis. A RF3.5 fala dos jogos dos dois jogadores, e
 * até a H7 o painel do adversário renderizava um parágrafo vazio quando ele
 * tinha jogos. Uma função só é o que impede os dois lados de divergirem de novo.
 */
function ListaDeJogos({ jogos }: { readonly jogos: readonly Jogo[] }) {
  if (jogos.length === 0) {
    return <p>Nenhum jogo na mesa</p>
  }

  return (
    <ul>
      {jogos.map((jogo) => {
        const categoria = categoriaDe(jogo)

        return (
          <li key={jogo.id}>
            {jogo.posicoes.map(nomeDaPosicao).join(', ')}
            {categoria === null ? null : ` — ${NOME_DA_CATEGORIA[categoria]}`}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * S117 — o painel que já existia passa a dizer também que a rodada acabou.
 *
 * `switch`, e não ternário (S112): com três fases, `fase === 'Compra' ? … : …`
 * mostraria *"fase de ação"* numa rodada encerrada, e compilaria. Este é o lugar
 * onde a H11 mediu esse erro acontecendo — os dois primeiros testes da S117
 * reprovaram com exatamente aquele texto.
 *
 * S113 — quem bateu é lido pela **mão vazia**, nunca por `jogadorDaVez`: a
 * batida por descarte final acontece depois de a vez já ter passado, e ler por
 * ela daria sempre a resposta trocada.
 */
function estadoDaRodada(visao: VisaoDoJogador): string {
  switch (visao.fase) {
    case 'RodadaEncerrada':
      return visao.mao.length === 0
        ? 'Você bateu — rodada encerrada'
        : 'O adversário bateu — rodada encerrada'
    case 'Compra':
      return `${nomeDaVez(visao)} — fase de compra`
    case 'Acao':
      return `${nomeDaVez(visao)} — fase de ação`
  }
}

/**
 * R12.1 — a tela precisa saber se a partida acabou para rotular o botão, e não
 * pode ler a R12.2: quem a lê é `vencedorDa`, na engine (S132).
 *
 * Aqui basta a metade que a interface consegue afirmar sem regra — o placar
 * chegou ao alvo. O desempate da R12.2 não muda o rótulo: em empate exato joga-se
 * mais uma rodada, e é isso que o botão diria de qualquer forma.
 */
function haVencedor(placar: readonly [number, number]): boolean {
  return Math.max(placar[0], placar[1]) >= PONTOS_PARA_VENCER && placar[0] !== placar[1]
}

function nomeDaVez(visao: VisaoDoJogador): string {
  return visao.jogadorDaVez === visao.eu ? 'Sua vez' : 'Vez do adversário'
}

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

/**
 * S101 — o rótulo usa o nome que a própria R6.5 dá à operação — "limpar a
 * canastra" — e nomeia a carta **reposta**.
 *
 * É ela que distingue esta jogada de um `aumentar` sobre o mesmo jogo, e os dois
 * comandos nunca têm o mesmo conjunto de cartas: um `aumentar` que incluísse a
 * carta reposta violaria a I5, porque o curinga ainda ocuparia aquele valor.
 *
 * A tela acha a reposta cruzando o valor que o curinga representa com a seleção.
 * Continua sem saber o que é uma sequência (T6) — ela lê `representa`, como já
 * fazia no `nomeDaPosicao` desde a H5.
 */
function rotuloDoRegularizar(
  alvo: string,
  cartas: readonly string[],
  mao: readonly Carta[],
  meusJogos: readonly Jogo[],
): string {
  const jogo = meusJogos.find((umJogo) => umJogo.id === alvo)
  const curinga = jogo?.posicoes.find((posicao) => posicao.tipo === 'Curinga')
  const reposta = mao.find(
    (daMao) => cartas.includes(daMao.id) && daMao.valor === curinga?.representa,
  )

  return reposta === undefined ? 'Limpar a canastra' : `Limpar a canastra com ${nomeDa(reposta)}`
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
      case 'regularizarCuringa': {
        const rotulo = rotuloDoRegularizar(comando.jogo, comando.cartas, mao, meusJogos)

        return [
          {
            comando,
            cartas: new Set(comando.cartas),
            rotulo,
            chave: `${comando.jogo}|${rotulo}`,
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

export default function TelaPartida({ visao, movimentos, aoJogar, aoSeguir }: Props) {
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
        <p>{estadoDaRodada(visao)}</p>
      </section>

      {/* S126 — só existe na rodada encerrada, e a ausência é o `null` da S125,
          não uma condição de interface. "Sobreposto" (screens.md §1) é
          apresentação; a RNF2.2 fixou que o critério é comportamento. */}
      {visao.apuracao === null ? null : (
        <section aria-label="Apuração da rodada">
          <ul>
            <ApuracaoDoJogador pontuacao={visao.apuracao[visao.eu]} nome="Você" />
            <ApuracaoDoJogador
              pontuacao={visao.apuracao[visao.eu === 0 ? 1 : 0]}
              nome="Adversário"
            />
          </ul>

          {/* S134 — **um** botão, com rótulo conforme haja vencedor. Não dois,
              nem um que às vezes desaparece: qual caminho seguir é decisão do
              jogo, e o jogador só confirma que viu a apuração. */}
          <button type="button" onClick={aoSeguir}>
            {haVencedor(visao.placar) ? 'Ver o resultado' : 'Próxima rodada'}
          </button>
        </section>
      )}

      <section aria-label="Mão do adversário">
        <p>{visao.cartasNaMaoDoAdversario} cartas viradas</p>
      </section>

      {/* RF3.5 — os jogos dos **dois** jogadores, com categoria. Até a H7 este
          painel renderizava um parágrafo vazio quando o adversário tinha jogos,
          e a IA baixa em toda partida: estava errado desde a H4 (S92). */}
      <section aria-label="Jogos do adversário">
        <ListaDeJogos jogos={visao.jogosDoAdversario} />
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
        <p>{quantosMortos(visao.mortosRestantes)}</p>
      </section>

      <section aria-label="Meus jogos">
        <ListaDeJogos jogos={visao.meusJogos} />
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
