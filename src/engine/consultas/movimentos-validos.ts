import type { CartaBaixada, Comando } from '../comandos/comando.ts'
import { NAIPES } from '../dominio/carta.ts'
import type { Carta, Naipe } from '../dominio/carta.ts'
import { CASAS, casasDe, valorDaCasa } from '../dominio/jogo.ts'
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

  if (visao.fase === 'Compra') {
    // R3.2 — descartar não aparece aqui. A ausência da aresta é a regra
    // (domain.md §1.3), não uma validação.
    return visao.cartasNoMonte > 0 ? [{ tipo: 'comprarDoMonte' }] : []
  }

  // R7.1, R7.2 — qualquer carta da mão pode ser descartada, inclusive a que
  // acabou de ser comprada. A T7 pediu enumeração completa antes de otimizar.
  return [
    ...visao.mao.map((carta): Comando => ({ tipo: 'descartar', carta: carta.id })),
    ...baixares(visao.mao),
  ]
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

type Janela = {
  /** Uma entrada por casa da janela, na ordem das casas. */
  readonly naturais: readonly (Carta | undefined)[]
  /** Índice, dentro da janela, da única casa sem carta natural. */
  readonly buraco: number | null
}

/**
 * Resolve uma janela de casas contra a mão: quem preenche cada casa com carta
 * natural, e qual casa fica vazia.
 *
 * Devolve `null` quando sobra mais de uma casa vazia — a I4 admite **um**
 * curinga por jogo, então duas lacunas não viram jogada nenhuma. É o corte que
 * mantém o espaço de busca pequeno.
 */
function resolverJanela(
  inicio: number,
  fim: number,
  mapa: ReadonlyMap<number, readonly Carta[]>,
): Janela | null {
  const usadas = new Set<string>()
  const naturais: (Carta | undefined)[] = []
  let buraco: number | null = null

  for (let casa = inicio; casa <= fim; casa++) {
    const candidata = (mapa.get(casa) ?? []).find((carta) => !usadas.has(carta.id))

    if (candidata === undefined) {
      if (buraco !== null) {
        return null
      }

      buraco = casa - inicio
      naturais.push(undefined)
      continue
    }

    usadas.add(candidata.id)
    naturais.push(candidata)
  }

  return { naturais, buraco }
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
function baixares(mao: readonly Carta[]): readonly Comando[] {
  const comandos: Comando[] = []

  for (const naipe of NAIPES) {
    const mapa = porCasa(mao.filter((carta) => carta.naipe === naipe))

    if (mapa.size === 0) {
      continue
    }

    for (let inicio = 0; inicio < CASAS; inicio++) {
      for (let fim = inicio + 2; fim < CASAS; fim++) {
        const janela = resolverJanela(inicio, fim, mapa)

        if (janela === null) {
          continue
        }

        if (janela.buraco === null) {
          adicionar(
            comandos,
            mao,
            janela.naturais.flatMap((carta) => (carta ? [{ carta: carta.id }] : [])),
          )
          continue
        }

        const usadas = new Set(janela.naturais.flatMap((carta) => (carta ? [carta.id] : [])))
        const representa = valorDaCasa(inicio + janela.buraco)

        // A casa vazia nunca é a do `2` do próprio naipe com aquele `2` na mão:
        // se estivesse, ela teria sido preenchida como natural acima. É por isso
        // que a S54 não precisa de guarda aqui — ela vive em `criarJogo`, onde
        // protege a engine de um chamador com bug (S22).
        for (const curinga of curingasDisponiveis(mao, usadas)) {
          adicionar(
            comandos,
            mao,
            janela.naturais.map((carta) =>
              carta ? { carta: carta.id } : { carta: curinga.id, representa },
            ),
          )
        }
      }
    }
  }

  return comandos
}

/**
 * S45 — a única decisão do projeto que restringe o jogo além das regras.
 *
 * Baixar tudo deixaria o jogador sem carta para descartar, e a R7.1 exige o
 * descarte; a exceção é a batida (R7.3), que é a H10. Sem a guarda, a partida
 * alcança um estado sem especificação. Sai junto com a batida.
 */
function adicionar(comandos: Comando[], mao: readonly Carta[], cartas: readonly CartaBaixada[]) {
  if (cartas.length === mao.length) {
    return
  }

  comandos.push({ tipo: 'baixar', cartas })
}
