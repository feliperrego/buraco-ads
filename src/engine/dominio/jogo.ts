import { VALORES } from './carta.ts'
import type { Carta, Naipe, Valor } from './carta.ts'
import type { JogadorId } from './partida.ts'

/**
 * M2 — o jogo é lista de **posições**, não de cartas, e "curinga" é papel que a
 * carta exerce dentro da sequência, nunca atributo dela. É o que torna a R6.5
 * exprimível na H9: regularizar é converter `Curinga` em `Natural`, no lugar.
 *
 * A H4 nasceu só com `Natural` (S39) para o compilador garantir que ela não
 * criava curinga por acidente. A H5 alarga o tipo, como aquela nota prometia.
 */
export type Posicao =
  | { readonly tipo: 'Natural'; readonly carta: Carta }
  | { readonly tipo: 'Curinga'; readonly carta: Carta; readonly representa: Valor }

/**
 * O valor que a posição ocupa na sequência — impresso na carta se `Natural`,
 * representado se `Curinga`.
 *
 * S55 — **todo** invariante de casa e de repetição lê isto, não `carta.valor`.
 * É a diferença que faz `A♥ 2♥ 3♥ 4♥ 5♥ 6♥ [2♥→7♥]` ser válido: as duas cópias
 * do `2♥` estão lá, uma na casa 1 e outra na casa 6.
 */
export function valorDa(posicao: Posicao): Valor {
  return posicao.tipo === 'Natural' ? posicao.carta.valor : posicao.representa
}

export type Jogo = {
  readonly id: string
  readonly dono: JogadorId
  readonly naipe: Naipe
  readonly posicoes: readonly Posicao[]
}

/** S53 — os **sete** invariantes de domain.md §4. A H4 alcançava cinco; I4 e I7 chegam aqui. */
export type Invariante = 'I1' | 'I2' | 'I3' | 'I4' | 'I5' | 'I6' | 'I7'

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

/** O valor que ocupa cada casa. As casas 0 e 13 são as duas pontas do Ás (S41). */
export function valorDaCasa(casa: number): Valor {
  return casa === CASAS - 1 ? 'A' : (VALORES[casa] ?? 'A')
}

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
function casasDa(posicoes: readonly Posicao[], pontas: readonly number[]): readonly number[] {
  let proximaPonta = 0

  return posicoes.map((posicao) => {
    const valor = valorDa(posicao)

    return valor === 'A' ? (pontas[proximaPonta++] ?? -1) : (casasDe(valor)[0] ?? -1)
  })
}

function ehTrechoContiguo(casas: readonly number[]): boolean {
  const ordenadas = [...casas].sort((uma, outra) => uma - outra)
  const primeira = ordenadas[0]
  const ultima = ordenadas[ordenadas.length - 1]

  if (primeira === undefined || ultima === undefined) {
    return false
  }

  // Distintas **e** sem buraco: o intervalo cobre exatamente tantas casas
  // quantas posições há.
  return new Set(ordenadas).size === ordenadas.length && ultima - primeira === ordenadas.length - 1
}

/**
 * A leitura **circular** dos treze valores, que é a intuição errada da S41.
 *
 * Serve para distinguir I6 de I3: `K-A-2` fecha no anel e não fecha na linha, e
 * é exatamente esse o defeito que a R5.3 nomeia. Já `5-7-8` não fecha de jeito
 * nenhum, e aí o que falta é a casa do meio (I3).
 */
function daVoltaPeloAs(posicoes: readonly Posicao[]): boolean {
  const indices = [...new Set(posicoes.map((posicao) => VALORES.indexOf(valorDa(posicao))))].sort(
    (um, outro) => um - outro,
  )

  if (indices.length !== posicoes.length) {
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

function violacoesDeRepeticao(posicoes: readonly Posicao[]): readonly Invariante[] {
  const porValor = new Map<Valor, number>()

  for (const posicao of posicoes) {
    const valor = valorDa(posicao)

    porValor.set(valor, (porValor.get(valor) ?? 0) + 1)
  }

  for (const [valor, quantas] of porValor) {
    if (quantas === 1) {
      continue
    }

    // R5.6 — a única exceção são os dois Ases da sequência de 14, que ocupam
    // pontas distintas. Fora dela, valor repetido é valor repetido.
    if (valor === 'A' && quantas === 2 && posicoes.length === CASAS) {
      continue
    }

    return ['I5']
  }

  return []
}

/**
 * O naipe do jogo sai da primeira posição **natural** (I2).
 *
 * Não pode sair de uma `Curinga`: um curinga de outro naipe é legal, e é ele que
 * torna a canastra permanentemente suja da R6.5. Como I4 limita a um curinga e I1
 * exige três posições, sempre há natural — o `undefined` só aparece em entrada
 * degenerada, e cai na I1.
 */
function naipeDo(posicoes: readonly Posicao[]): Naipe | undefined {
  return posicoes.find((posicao) => posicao.tipo === 'Natural')?.carta.naipe
}

/**
 * S52 — `criarJogo` recebe as **posições prontas** e passa a conferir, não a
 * inferir. Um conjunto de cartas não determina um jogo quando há curinga
 * (spec 0005 §2.1): `2♥ 3♥ 4♥` tem duas leituras válidas, e escolher entre elas
 * é decisão do jogador, não da engine.
 *
 * S40/M6 — sucesso com o jogo, ou a lista de invariantes violadas. Nunca um
 * `Jogo` inválido, e nunca um `Jogo` "a validar depois".
 *
 * S43 — as posições chegam em qualquer ordem, e são as casas que dão a ordem
 * final.
 */
export function criarJogo(dono: JogadorId, posicoes: readonly Posicao[]): ResultadoDeJogo {
  const naipe = naipeDo(posicoes)

  if (naipe === undefined) {
    return { tipo: 'invalido', violados: ['I1'] }
  }

  const violados: Invariante[] = []

  // I1 — entre 3 e 14 posições (R5.1, R5.3).
  if (posicoes.length < 3 || posicoes.length > CASAS) {
    violados.push('I1')
  }

  // I2 — só as posições **naturais** precisam ser do naipe do jogo (R5.1). O
  // curinga de outro naipe é legal, e a impossibilidade de regularizá-lo na H9
  // é consequência estrutural disso, não uma verificação extra.
  if (posicoes.some((posicao) => posicao.tipo === 'Natural' && posicao.carta.naipe !== naipe)) {
    violados.push('I2')
  }

  const curingas = posicoes.filter((posicao) => posicao.tipo === 'Curinga')

  // I4 — no máximo um curinga por jogo (R1.4, R5.4).
  if (curingas.length > 1) {
    violados.push('I4')
  }

  // I7 — só o `2` é curinga (R1.3).
  if (curingas.some((posicao) => posicao.carta.valor !== '2')) {
    violados.push('I7')
  }

  // S54 — e o `2` do próprio naipe, na própria casa, **é natural**, não curinga.
  // R1.3 na letra: declarar aquele 2♥ como curinga de `2` numa sequência de
  // copas é descrever a mesma casa por um caminho que a regra não abre.
  if (
    curingas.some(
      (posicao) => posicao.carta.naipe === naipe && valorDa(posicao) === posicao.carta.valor,
    )
  ) {
    violados.push('I7')
  }

  violados.push(...violacoesDeRepeticao(posicoes))

  const ases = posicoes.filter((posicao) => valorDa(posicao) === 'A').length
  let contiguo = false

  for (const pontas of combinacoesDeAses(ases)) {
    const casas = casasDa(posicoes, pontas)

    if (!ehTrechoContiguo(casas)) {
      continue
    }

    contiguo = true

    // As casas fecham, mas algo mais não. A ordem das posições seria válida, e é
    // justamente por isso que não devolvemos o jogo (M6).
    if (violados.length > 0) {
      break
    }

    const ordenadas = posicoes
      .map((posicao, indice) => ({ posicao, casa: casas[indice] ?? -1 }))
      .sort((uma, outra) => uma.casa - outra.casa)
      .map(({ posicao }) => posicao)

    return {
      tipo: 'valido',
      jogo: {
        // Derivado do conteúdo, como o `id` da carta (S3): uma carta só está em
        // um jogo, então a primeira posição já identifica o jogo sem contador.
        id: `J${String(dono)}-${ordenadas[0]?.carta.id ?? ''}`,
        dono,
        naipe,
        posicoes: ordenadas,
      },
    }
  }

  // Nenhuma escolha de pontas fechou um trecho. I6 quando o defeito é passar do
  // Ás alto — a sequência fecha no anel e não fecha na linha —, I3 quando falta
  // casa no meio. É a distinção que separa `K-A-2` de `5-7-8`.
  if (!contiguo) {
    violados.push(daVoltaPeloAs(posicoes) ? 'I6' : 'I3')
  }

  return { tipo: 'invalido', violados: [...new Set(violados)] }
}
