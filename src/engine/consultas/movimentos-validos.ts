import type { CartaBaixada, Comando } from '../comandos/comando.ts'
import { NAIPES } from '../dominio/carta.ts'
import type { Carta, Naipe } from '../dominio/carta.ts'
import {
  CASAS,
  CASA_DO_DOIS,
  casasDe,
  contaComoLimpa,
  janelaDe,
  regularizarJogo,
  valorDaCasa,
} from '../dominio/jogo.ts'
import type { Posicao } from '../dominio/jogo.ts'
import type { VisaoDoJogador } from './visao-de.ts'

/**
 * M10 — enumera **todos** os comandos legais no estado atual, e é o único lugar
 * onde "o que pode ser jogado" é decidido. A interface filtra por esta lista
 * (RF2.1), a IA escolhe dentro dela (RF5.2), e os testes a leem diretamente.
 *
 * M12/S19 — recebe a **visão**, nunca a `Partida`. Não é preferência de estilo:
 * é o que torna impossível, por construção, um movimento calculado a partir de
 * informação oculta. E é a visão que carrega o `eu`, então a pergunta "quais são
 * os movimentos de quem?" nunca fica ambígua.
 */
export function movimentosValidos(visao: VisaoDoJogador): readonly Comando[] {
  // S20 — fora da sua vez não há jogada nenhuma. A mesa inerte da S18 é este
  // `[]`, e não código de interface.
  if (visao.jogadorDaVez !== visao.eu) {
    return []
  }

  // S112 — `switch`, e não `if … else`. Com três valores de fase, um `else`
  // deixaria a `RodadaEncerrada` cair no ramo de ação, oferecendo jogada numa
  // rodada acabada — e compilaria. Esta forma **não** compila quando um estado
  // novo aparece, que é a lição da H7 aplicada antes do erro.
  switch (visao.fase) {
    case 'RodadaEncerrada':
      // R10.3 — a rodada encerra imediatamente, para os dois jogadores.
      return []
    case 'Compra':
      return compras(visao)
    case 'Acao':
      return acoes(visao)
  }
}

/**
 * R3.2 — descartar não aparece aqui. A ausência da aresta é a regra
 * (domain.md §1.3), não uma validação.
 *
 * R4.1 — as duas opções de compra são exclusivas entre si, e a exclusividade
 * também é ausência de aresta (S78): as duas levam a `Acao`, e de lá não se
 * volta. Nada aqui precisa saber que o jogador "já comprou".
 */
function compras(visao: VisaoDoJogador): readonly Comando[] {
  const comandos: Comando[] = []

  if (visao.cartasNoMonte > 0) {
    comandos.push({ tipo: 'comprarDoMonte' })
  }

  // S79/R4.5 — espelho exato do bloco acima. Com o lixo vazio, a única opção é
  // o monte, e isso é a **ausência** do comando, não uma recusa com mensagem.
  if (visao.lixo.length > 0) {
    comandos.push({ tipo: 'pegarLixo' })
  }

  return comandos
}

function acoes(visao: VisaoDoJogador): readonly Comando[] {
  // R7.1, R7.2 — qualquer carta da mão pode ser descartada, inclusive a que
  // acabou de ser comprada. A T7 pediu enumeração completa antes de otimizar.
  //
  // O descarte **também** esvazia a mão, e é o caminho que a guarda nunca cobriu
  // até a H10: a S70 afirmou que nenhuma sequência de jogadas oferecidas zerava
  // a mão, e isso era falso em 58 de 200 partidas medidas. O descarte não muda
  // os jogos da mesa, então a pergunta da R10.1 é feita sobre `SEM_JOGO_NOVO`.
  const descartes =
    visao.mao.length === 1 && !podeZerar(visao, SEM_JOGO_NOVO)
      ? []
      : visao.mao.map((carta): Comando => ({ tipo: 'descartar', carta: carta.id }))

  return [...descartes, ...baixares(visao), ...aumentares(visao), ...regularizacoes(visao)]
}

/** O resultado de um comando que não muda jogo nenhum da mesa. */
const SEM_JOGO_NOVO: readonly Posicao[] = []

/**
 * R9.2 e R10.1 — as duas continuações legais da mão vazia, e a pergunta que a
 * guarda faz antes de oferecer uma jogada que a esvazie.
 *
 * S115 — a segunda condição é avaliada **sobre o resultado**, e não sobre o
 * estado atual: a jogada que zera a mão pode ser exatamente a que fecha a
 * canastra limpa. Ler a R10.1 antes do comando recusaria a jogada mais bonita
 * do jogo — baixar as últimas cartas e bater com elas.
 *
 * A R10.1.2 não precisa de código: quando o adversário levou os dois mortos,
 * `meusMortos` é zero e a primeira condição já é falsa.
 */
function podeZerar(visao: VisaoDoJogador, jogoResultante: readonly Posicao[]): boolean {
  if (visao.mortosRestantes > 0) {
    return true
  }

  return (
    visao.meusMortos > 0 &&
    (visao.meusJogos.some((jogo) => contaComoLimpa(jogo.posicoes)) ||
      contaComoLimpa(jogoResultante))
  )
}

/**
 * As cartas da mão indexadas por casa, cada lista ordenada por `id`.
 *
 * S47 — cartas repetidas geram um comando só, e a canônica de cada casa é a de
 * menor `id`. A M1 diz que as regras comparam só naipe e valor, então as cópias
 * são intercambiáveis: oferecer as duas seria ruído na interface sem escolha
 * real por trás. A lista completa fica porque o Ás precisa dela — ele aparece na
 * casa 0 e na 13, e um trecho que use as duas pontas precisa de dois Ases.
 */
function porCasa(doNaipe: readonly Carta[]): ReadonlyMap<number, readonly Carta[]> {
  const mapa = new Map<number, Carta[]>()

  for (const carta of [...doNaipe].sort((uma, outra) => uma.id.localeCompare(outra.id))) {
    for (const casa of casasDe(carta.valor)) {
      const lista = mapa.get(casa) ?? []

      lista.push(carta)
      mapa.set(casa, lista)
    }
  }

  return mapa
}

type Resolucao = {
  /** Uma entrada por casa pedida, na mesma ordem. */
  readonly naturais: readonly (Carta | undefined)[]
  /** A única casa sem carta natural — a casa, não o índice. */
  readonly casaVazia: number | null
}

/** As casas de `inicio` a `fim`, vazio quando o trecho não existe. */
function casasEntre(inicio: number, fim: number): readonly number[] {
  const casas: number[] = []

  for (let casa = inicio; casa <= fim; casa++) {
    casas.push(casa)
  }

  return casas
}

/**
 * Resolve uma lista de casas contra a mão: quem preenche cada uma com carta
 * natural, e qual fica vazia.
 *
 * Devolve `null` quando sobra mais de uma casa vazia — a I4 admite **um**
 * curinga por jogo, então duas lacunas não viram jogada nenhuma. É o corte que
 * mantém o espaço de busca pequeno.
 *
 * Recebe uma **lista** de casas, e não um par início/fim, porque o `aumentar` da
 * H6 pede casas de dois trechos separados: as que ficam à esquerda do jogo e as
 * que ficam à direita, sem as que ele já ocupa.
 */
function resolverCasas(
  casas: readonly number[],
  mapa: ReadonlyMap<number, readonly Carta[]>,
): Resolucao | null {
  const usadas = new Set<string>()
  const naturais: (Carta | undefined)[] = []
  let casaVazia: number | null = null

  for (const casa of casas) {
    const candidata = (mapa.get(casa) ?? []).find((carta) => !usadas.has(carta.id))

    if (candidata === undefined) {
      if (casaVazia !== null) {
        return null
      }

      casaVazia = casa
      naturais.push(undefined)
      continue
    }

    usadas.add(candidata.id)
    naturais.push(candidata)
  }

  return { naturais, casaVazia }
}

/**
 * S56 — um curinga candidato por **naipe de `2`**, e não um só.
 *
 * A S47 continua valendo dentro do naipe: as duas cópias do `2♠` são
 * intercambiáveis, e a canônica é a de menor `id`. Entre naipes ela deixa de
 * valer, porque a R6.5 só deixa regularizar o `2` do naipe da própria sequência
 * — então `2♥` e `2♠` numa sequência de copas valem o mesmo hoje e valem
 * diferente na H9. Oferecer um só esconderia a jogada melhor.
 *
 * O teto é 4, não 8.
 */
function curingasDisponiveis(mao: readonly Carta[], usadas: ReadonlySet<string>): readonly Carta[] {
  const porNaipe = new Map<Naipe, Carta>()

  for (const carta of [...mao].sort((uma, outra) => uma.id.localeCompare(outra.id))) {
    if (carta.valor !== '2' || usadas.has(carta.id) || porNaipe.has(carta.naipe)) {
      continue
    }

    porNaipe.set(carta.naipe, carta)
  }

  return [...porNaipe.values()]
}

/**
 * S46 e S57 — a enumeração percorre **janelas de casas**, não subconjuntos da
 * mão.
 *
 * A intuição de "todos os subconjuntos" dá `2^22`, mais de quatro milhões, e foi
 * ela que assustou a T7. Mas sequência é trecho contíguo de uma linha de catorze
 * casas: são 78 janelas por naipe, 312 ao todo, e cada uma rende no máximo um
 * comando natural mais quatro com curinga.
 *
 * A janela também é o que dispensa tratar as três formas da S57 — tapar buraco,
 * estender à esquerda, estender à direita — como casos diferentes. Numa janela,
 * as três são a mesma coisa: a casa vazia está no meio ou numa ponta, e o código
 * não precisa saber qual.
 */
function baixares(visao: VisaoDoJogador): readonly Comando[] {
  const mao = visao.mao
  const comandos: Comando[] = []

  for (const naipe of NAIPES) {
    const mapa = porCasa(mao.filter((carta) => carta.naipe === naipe))

    if (mapa.size === 0) {
      continue
    }

    for (let inicio = 0; inicio < CASAS; inicio++) {
      for (let fim = inicio + 2; fim < CASAS; fim++) {
        for (const leitura of leiturasDe(casasEntre(inicio, fim), mapa, mao, true)) {
          // O jogo resultante **é** a leitura: baixar cria um jogo novo.
          adicionar(comandos, visao, { tipo: 'baixar', cartas: leitura.cartas }, leitura.posicoes)
        }
      }
    }
  }

  return comandos
}

/**
 * S72 — a enumeração do `aumentar` percorre as janelas que **contêm** a janela
 * atual do jogo e diferem dela: `0 ≤ i' ≤ inicio` e `fim ≤ f' ≤ 13`.
 *
 * É a mesma escolha da S46 aplicada a outro ponto de partida. Um jogo ocupa um
 * trecho contíguo das catorze casas (S41) e não tem buraco para tapar, então
 * aumentar é **alargar o trecho** — e na janela, "estender à esquerda",
 * "estender à direita" e "os dois" deixam de ser casos diferentes. É por isso
 * que a extensão das duas pontas sai como **um** comando: quem selecionou as
 * duas cartas fez uma jogada só, e a S48 casa botão com seleção exata.
 *
 * A S66 vale aqui pelo mesmo motivo que em `aplicar`: só chegam os jogos
 * próprios, porque é isso que `visao.meusJogos` carrega. Nenhuma checagem de
 * dono é escrita, e nenhuma pode ser esquecida.
 */
function aumentares(visao: VisaoDoJogador): readonly Comando[] {
  const mao = visao.mao
  const comandos: Comando[] = []

  for (const jogo of visao.meusJogos) {
    const { inicio, fim } = janelaDe(jogo)
    const mapa = porCasa(mao.filter((carta) => carta.naipe === jogo.naipe))

    // S69 — jogo que já tem curinga só recebe naturais. A I4 recusaria de todo
    // modo; não oferecer é o que impede a interface de exibir a jogada morta.
    const admiteCuringa = !jogo.posicoes.some((posicao) => posicao.tipo === 'Curinga')

    for (let novoInicio = 0; novoInicio <= inicio; novoInicio++) {
      for (let novoFim = fim; novoFim < CASAS; novoFim++) {
        if (novoInicio === inicio && novoFim === fim) {
          continue
        }

        const casasNovas = [...casasEntre(novoInicio, inicio - 1), ...casasEntre(fim + 1, novoFim)]

        for (const leitura of leiturasDe(casasNovas, mapa, mao, admiteCuringa)) {
          adicionar(
            comandos,
            visao,
            { tipo: 'aumentar', jogo: jogo.id, cartas: leitura.cartas },
            // O mesmo multiconjunto que `aumentarJogo` monta antes de `criarJogo`
            // reordenar. A R10.2 só olha tamanho e curinga, então a ordem não
            // muda a resposta — e derivá-la aqui seria repetir a regra.
            [...jogo.posicoes, ...leitura.posicoes],
          )
        }
      }
    }
  }

  return comandos
}

/**
 * S99 — a enumeração de `regularizarCuringa`.
 *
 * Regularizar é alargar a janela **para baixo** até a casa do `2`, e por isso
 * `novoInicio` tem dois valores e não catorze: a casa 1 é obrigatória — é para
 * lá que o curinga vai — e a casa 0 é opcional, se o jogador tiver o Ás.
 * Começar em 2 ou mais deixaria a casa 1 vazia.
 *
 * `novoFim` varia porque a S48 casa botão com a **seleção exata**: quem
 * selecionou o Ás, as cartas do caminho, a reposta **e** uma carta para a outra
 * ponta fez uma jogada só, e sem o comando correspondente aquela seleção não
 * teria botão. É o mesmo argumento da S72.
 *
 * **Nenhuma casa pode ficar vazia**, porque o curinga foi gasto na própria
 * operação (I4) — daí `casaVazia !== null` cortar o candidato.
 *
 * A validade é conferida **construindo**: o candidato passa por
 * `regularizarJogo`, e é a I2 que recusa o curinga de outro naipe. Nenhuma
 * checagem de naipe é escrita aqui, que é o que a `CA-S98-2` cobra.
 */
function regularizacoes(visao: VisaoDoJogador): readonly Comando[] {
  const mao = visao.mao
  const comandos: Comando[] = []

  for (const jogo of visao.meusJogos) {
    if (!jogo.posicoes.some((posicao) => posicao.tipo === 'Curinga')) {
      continue
    }

    const { inicio, fim } = janelaDe(jogo)
    const mapa = porCasa(mao.filter((carta) => carta.naipe === jogo.naipe))

    // As casas que já têm carta natural. A do curinga fica de fora de propósito:
    // ela precisa ser preenchida pela carta reposta.
    const ocupadas = new Set(
      jogo.posicoes.flatMap((posicao, indice) =>
        posicao.tipo === 'Natural' ? [inicio + indice] : [],
      ),
    )

    // A única escolha do jogador na ponta de baixo é **levar o Ás junto ou não**.
    // A casa 1 nunca entra aqui: é para lá que o curinga vai, e a casa 0 é a
    // única acima dela. Escrever isto como um intervalo `[novoInicio, …]` era
    // dizer a mesma coisa duas vezes — e uma mutação proposital mostrou que
    // trocar o `novoInicio` não mudava nada, porque o filtro já resolvia.
    for (const comAs of [false, true]) {
      for (let novoFim = fim; novoFim < CASAS; novoFim++) {
        const casasNovas = [
          ...(comAs ? [0] : []),
          ...casasEntre(CASA_DO_DOIS + 1, novoFim).filter((casa) => !ocupadas.has(casa)),
        ]

        const resolvida = resolverCasas(casasNovas, mapa)

        if (resolvida === null || resolvida.casaVazia !== null) {
          continue
        }

        const escolhidas = resolvida.naturais.flatMap((carta) => (carta ? [carta] : []))

        const regularizado = regularizarJogo(jogo, escolhidas)

        if (regularizado.tipo !== 'valido') {
          continue
        }

        adicionar(
          comandos,
          visao,
          {
            tipo: 'regularizarCuringa',
            jogo: jogo.id,
            cartas: escolhidas.map((carta) => carta.id),
          },
          // Aqui o jogo resultante já existe: a validade foi conferida
          // construindo-o (S98).
          regularizado.jogo.posicoes,
        )
      }
    }
  }

  return comandos
}

/**
 * Uma forma de preencher um conjunto de casas, nas duas linguagens de que a
 * enumeração precisa: as **cartas** que o comando cita e as **posições** que o
 * jogo terá. As duas descrevem a mesma jogada, e ter as posições aqui é o que
 * dispensa a guarda de reconstruir o resultado (S115).
 */
type Leitura = {
  readonly cartas: readonly CartaBaixada[]
  readonly posicoes: readonly Posicao[]
}

/**
 * As formas de preencher um conjunto de casas com cartas da mão: nenhuma, uma
 * (todas naturais) ou uma por naipe de `2` disponível quando sobra uma casa.
 *
 * S56 — um curinga candidato por **naipe de `2`**, e não um só. A S47 continua
 * valendo dentro do naipe e deixa de valer entre naipes, porque a R6.5 só deixa
 * regularizar o `2` do naipe da própria sequência.
 */
function leiturasDe(
  casas: readonly number[],
  mapa: ReadonlyMap<number, readonly Carta[]>,
  mao: readonly Carta[],
  admiteCuringa: boolean,
): readonly Leitura[] {
  const resolvida = resolverCasas(casas, mapa)

  if (resolvida === null) {
    return []
  }

  if (resolvida.casaVazia === null) {
    const naturais = resolvida.naturais.flatMap((carta) => (carta ? [carta] : []))

    return [
      {
        cartas: naturais.map((carta) => ({ carta: carta.id })),
        posicoes: naturais.map((carta) => ({ tipo: 'Natural', carta })),
      },
    ]
  }

  if (!admiteCuringa) {
    return []
  }

  const usadas = new Set(resolvida.naturais.flatMap((carta) => (carta ? [carta.id] : [])))
  const representa = valorDaCasa(resolvida.casaVazia)

  // A casa vazia nunca é a do `2` do próprio naipe com aquele `2` na mão: se
  // estivesse, ela teria sido preenchida como natural acima. É por isso que a
  // S54 não precisa de guarda aqui — ela vive em `criarJogo`, onde protege a
  // engine de um chamador com bug (S22).
  return curingasDisponiveis(mao, usadas).map((curinga) => ({
    cartas: resolvida.naturais.map((carta) =>
      carta ? { carta: carta.id } : { carta: curinga.id, representa },
    ),
    posicoes: resolvida.naturais.map((carta): Posicao =>
      carta ? { tipo: 'Natural', carta } : { tipo: 'Curinga', carta: curinga, representa },
    ),
  }))
}

/**
 * S106, S109 e S115 — quanto uma jogada precisa deixar na mão.
 *
 * Duas cartas bastam **sempre**, e o número cai da R7.1: o turno termina com o
 * descarte obrigatório, então antes dele são uma para descartar e uma para
 * ficar. A S45 dizia uma, e uma trava a mesa — `movimentosValidos` devolvia `[]`
 * em fase `Acao` em 15 de 200 partidas simuladas, todas em `mão=1, sem morto`.
 * O erro foi contar cartas quando a condição é sobre o **fim do turno**, e a
 * R10.1.3 foi corrigida junto (S118).
 *
 * Abaixo de duas, a jogada só é legal se a mão puder zerar — e aí a pergunta
 * passa a depender do **resultado** do comando, não do estado atual (S115). É a
 * única pergunta cara desta enumeração, e ela só é feita aqui, para os poucos
 * candidatos que chegam a este ponto.
 *
 * A propriedade que isso preserva é a mesma que a S70 buscava, agora verdadeira:
 * nenhuma sequência de jogadas oferecidas fecha o caminho do descarte — nem
 * baixar seguido de dois aumentos, que é o que a R3.3 autoriza. A guarda não
 * olha o histórico.
 */
function adicionar(
  comandos: Comando[],
  visao: VisaoDoJogador,
  comando: Extract<Comando, { readonly cartas: readonly (CartaBaixada | string)[] }>,
  jogoResultante: readonly Posicao[],
) {
  // Duas cartas de sobra bastam sempre: uma para o descarte da R7.1 e uma para
  // ficar. Abaixo disso, a jogada só é legal se a mão puder zerar (S115), e é
  // esse o único caso que paga a pergunta cara sobre o resultado.
  if (visao.mao.length - comando.cartas.length < 2 && !podeZerar(visao, jogoResultante)) {
    return
  }

  comandos.push(comando)
}
