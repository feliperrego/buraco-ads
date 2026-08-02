import { VALORES } from './carta.ts'
import type { Carta, Naipe, Valor } from './carta.ts'
import type { JogadorId } from './partida.ts'

/**
 * S39 — `Posicao` nasce com **só** `Natural`. A variante `Curinga` entra na H5 e
 * alarga o tipo.
 *
 * A estrutura já é lista de posições, não de cartas (M2): é o que torna a R6.5
 * exprimível na H9 sem reescrever o modelo.
 */
export type Posicao = { readonly tipo: 'Natural'; readonly carta: Carta }

export type Jogo = {
  readonly id: string
  readonly dono: JogadorId
  readonly naipe: Naipe
  readonly posicoes: readonly Posicao[]
}

/** Os cinco invariantes de domain.md §4 que a H4 alcança. I4 e I7 chegam com o curinga. */
export type Invariante = 'I1' | 'I2' | 'I3' | 'I5' | 'I6'

/**
 * S40/M6 — sucesso com o jogo, ou a lista de invariantes violadas. Nunca um
 * `Jogo` inválido, e nunca um `Jogo` "a validar depois".
 */
export type ResultadoDeJogo =
  | { readonly tipo: 'valido'; readonly jogo: Jogo }
  | { readonly tipo: 'invalido'; readonly violados: readonly Invariante[] }

/**
 * S41 — as catorze casas. **Linha, não anel:**
 *
 * ```
 * casa:   0  1  2  3  4  5  6  7  8  9 10 11 12 13
 * valor:  A  2  3  4  5  6  7  8  9 10  J  Q  K  A
 * ```
 *
 * Uma sequência é um trecho contíguo desta linha. Tratar a ordem como circular
 * faria `K-A-2` passar, e a R5.3 a proíbe — é o erro que o par
 * CA-R5.3-2 / CA-R5.3-4 existe para travar.
 */
export const CASAS = 14

/** S42 — o `A` pode ocupar a casa 0 **ou** a 13; os demais valores têm casa única. */
export function casasDe(valor: Valor): readonly number[] {
  return valor === 'A' ? [0, CASAS - 1] : [VALORES.indexOf(valor)]
}

/**
 * S42 — as combinações de casa para os Ases. Um Ás pode ir para a casa 0 ou para
 * a 13; dois Ases ocupam necessariamente as duas pontas.
 *
 * Com no máximo dois Ases do mesmo naipe são no máximo duas combinações, e é por
 * isso que "tentar" é barato. A alternativa — pedir ao jogador que diga qual
 * ponta — seria interface decidindo regra (T6).
 */
function combinacoesDeAses(quantos: number): readonly (readonly number[])[] {
  switch (quantos) {
    case 0:
      return [[]]
    case 1:
      return [[0], [CASAS - 1]]
    case 2:
      return [[0, CASAS - 1]]
    default:
      // Mais de dois Ases do mesmo naipe não existe no baralho (R1.2), e a
      // repetição já é apanhada pela I5. Não há combinação a tentar.
      return []
  }
}

/** As casas ocupadas, para uma dada escolha de pontas dos Ases. */
function casasDa(cartas: readonly Carta[], pontas: readonly number[]): readonly number[] {
  let proximaPonta = 0

  return cartas.map((carta) =>
    carta.valor === 'A' ? (pontas[proximaPonta++] ?? -1) : (casasDe(carta.valor)[0] ?? -1),
  )
}

function ehTrechoContiguo(casas: readonly number[]): boolean {
  const ordenadas = [...casas].sort((uma, outra) => uma - outra)
  const primeira = ordenadas[0]
  const ultima = ordenadas[ordenadas.length - 1]

  if (primeira === undefined || ultima === undefined) {
    return false
  }

  // Distintas **e** sem buraco: o intervalo cobre exatamente tantas casas
  // quantas cartas há.
  return new Set(ordenadas).size === ordenadas.length && ultima - primeira === ordenadas.length - 1
}

/**
 * A leitura **circular** dos treze valores, que é a intuição errada da S41.
 *
 * Serve para distinguir I6 de I3: `K-A-2` fecha no anel e não fecha na linha, e
 * é exatamente esse o defeito que a R5.3 nomeia. Já `5-7-8` não fecha de jeito
 * nenhum, e aí o que falta é a casa do meio (I3).
 */
function daVoltaPeloAs(cartas: readonly Carta[]): boolean {
  const indices = [...new Set(cartas.map((carta) => VALORES.indexOf(carta.valor)))].sort(
    (um, outro) => um - outro,
  )

  if (indices.length !== cartas.length) {
    return false
  }

  // Contígua no anel de treze valores: entre casas vizinhas, todo salto vale 1,
  // exceto o único que fecha a volta. Como o anel só se fecha passando pelo
  // índice do Ás, "dá a volta" e "passa do Ás alto" são a mesma coisa.
  const saltos = indices.map(
    (valor, posicao) =>
      ((indices[(posicao + 1) % indices.length] ?? valor) - valor + VALORES.length) %
      VALORES.length,
  )

  return saltos.filter((salto) => salto !== 1).length <= 1
}

function violacoesDeRepeticao(cartas: readonly Carta[]): readonly Invariante[] {
  const porValor = new Map<Valor, number>()

  for (const carta of cartas) {
    porValor.set(carta.valor, (porValor.get(carta.valor) ?? 0) + 1)
  }

  for (const [valor, quantas] of porValor) {
    if (quantas === 1) {
      continue
    }

    // R5.6 — a única exceção são os dois Ases da sequência de 14, que ocupam
    // pontas distintas. Fora dela, valor repetido é valor repetido.
    if (valor === 'A' && quantas === 2 && cartas.length === CASAS) {
      continue
    }

    return ['I5']
  }

  return []
}

/**
 * S40 — sucesso com o jogo, ou a lista de invariantes violadas.
 *
 * S43 — as cartas chegam em qualquer ordem, e são as casas que dão a ordem final
 * das posições.
 */
export function criarJogo(dono: JogadorId, cartas: readonly Carta[]): ResultadoDeJogo {
  const naipe = cartas[0]?.naipe

  if (naipe === undefined) {
    return { tipo: 'invalido', violados: ['I1'] }
  }

  const violados: Invariante[] = []

  // I1 — entre 3 e 14 posições (R5.1, R5.3).
  if (cartas.length < 3 || cartas.length > CASAS) {
    violados.push('I1')
  }

  // I2 — um jogo tem um naipe só (R5.1).
  if (cartas.some((carta) => carta.naipe !== naipe)) {
    violados.push('I2')
  }

  violados.push(...violacoesDeRepeticao(cartas))

  const ases = cartas.filter((carta) => carta.valor === 'A').length
  let contiguo = false

  for (const pontas of combinacoesDeAses(ases)) {
    const casas = casasDa(cartas, pontas)

    if (!ehTrechoContiguo(casas)) {
      continue
    }

    contiguo = true

    // As casas fecham, mas algo mais não: I1 ou I2 já foram registrados, e um
    // jogo inválido não é representável (M6). A ordem das posições seria válida,
    // e é justamente por isso que não devolvemos o jogo.
    if (violados.length > 0) {
      break
    }

    const posicoes = cartas
      .map((carta, indice) => ({ carta, casa: casas[indice] ?? -1 }))
      .sort((uma, outra) => uma.casa - outra.casa)
      .map(({ carta }): Posicao => ({ tipo: 'Natural', carta }))

    return {
      tipo: 'valido',
      jogo: {
        // Derivado do conteúdo, como o `id` da carta (S3): uma carta só está em
        // um jogo, então a primeira posição já identifica o jogo sem contador.
        id: `J${String(dono)}-${posicoes[0]?.carta.id ?? ''}`,
        dono,
        naipe,
        posicoes,
      },
    }
  }

  // Nenhuma escolha de pontas fechou um trecho. I6 quando o defeito é passar do
  // Ás alto — a sequência fecha no anel e não fecha na linha —, I3 quando falta
  // casa no meio. É a distinção que separa `K-A-2` de `5-7-8`.
  if (!contiguo) {
    violados.push(daVoltaPeloAs(cartas) ? 'I6' : 'I3')
  }

  return { tipo: 'invalido', violados }
}
