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
 * S71 — o trecho contíguo das catorze casas (S41) que o jogo ocupa.
 *
 * **Derivada, nunca armazenada.** A R8.5 fixou isso para a categoria da
 * canastra, e o motivo vale igual aqui: campo derivado em `Jogo` seria um
 * segundo lugar para a mesma verdade, e o jogo cresce a partir da H6.
 */
export type Janela = { readonly inicio: number; readonly fim: number }

export function janelaDe(jogo: Jogo): Janela {
  const primeira = jogo.posicoes[0]
  const ultima = jogo.posicoes[jogo.posicoes.length - 1]

  if (primeira === undefined || ultima === undefined) {
    // A I1 garante ao menos três posições, e `Jogo` só nasce de `criarJogo`.
    // Este ramo existe para o compilador, e devolve a linha inteira — a janela
    // que não admite crescimento nenhum.
    return { inicio: 0, fim: CASAS - 1 }
  }

  // A regra do Ás, e é a única sutileza daqui: **Ás na frente está na casa 0,
  // Ás no fim está na casa 13.** Não é escolha — como o jogo tem ao menos três
  // posições e está ordenado, um Ás na frente não caberia na casa 13, porque
  // não haveria casa acima dele para as outras duas. O jogo de 14 tem os dois,
  // e é justamente o que não pode crescer.
  const naFrente = casasDe(valorDa(primeira))
  const atras = casasDe(valorDa(ultima))

  return {
    inicio: naFrente[0] ?? 0,
    fim: atras[atras.length - 1] ?? CASAS - 1,
  }
}

/** R8.2 — as quatro categorias, **mutuamente exclusivas**. Não há uma quinta. */
export type CategoriaCanastra = 'DE_1000' | 'DE_500' | 'LIMPA' | 'SUJA'

/** R8.1 — uma canastra é um jogo que atingiu **sete ou mais** cartas. */
export const CANASTRA = 7

/**
 * S85 — a categoria é **função derivada**, nunca campo (R8.5).
 *
 * A alternativa tentadora era guardá-la em `Jogo`, preenchida por `criarJogo`:
 * ela funcionaria até a H9, que é exatamente quando o conteúdo do jogo muda sem
 * passar pelo construtor. É o mesmo formato do erro que a S63 corrigiu na H6 —
 * uma escolha que só quebra na fatia seguinte.
 *
 * S87 — a R8.6 é lida pela **janela**, não pelo tamanho. `DE_500` e `DE_1000`
 * dependem de **posição**: `A…K` vale 500 e `2…K-A` — as mesmas treze cartas —
 * vale 200. Uma implementação por tamanho erraria exatamente esse caso, que é o
 * que a R8.6 nasceu para resolver.
 *
 * S88/R8.3 — **a ordem destes `if` é a precedência**, e não há como torná-la
 * estrutural: `DE_1000 → DE_500 → LIMPA → SUJA`. A R8.4 ("as especiais admitem
 * curinga") não é uma verificação, é o que acontece porque o curinga só é
 * consultado depois das especiais. Subir essa checagem para o topo parece
 * simplificação e quebra as duas.
 */
export function categoriaDe(jogo: Jogo): CategoriaCanastra | null {
  // R8.1 — abaixo de sete não é canastra, e a R8.2 não define categoria para
  // isso. `null` em vez de uma quinta variante: o tipo diz quatro porque a regra
  // diz quatro (S86).
  if (jogo.posicoes.length < CANASTRA) {
    return null
  }

  const { inicio, fim } = janelaDe(jogo)

  if (inicio === 0 && fim === CASAS - 1) {
    return 'DE_1000'
  }

  if (inicio === 0 && fim === CASAS - 2) {
    return 'DE_500'
  }

  return jogo.posicoes.some((posicao) => posicao.tipo === 'Curinga') ? 'SUJA' : 'LIMPA'
}

/** R8.1 — sete ou mais posições. Sem segunda travessia: é a categoria existir. */
export function ehCanastra(jogo: Jogo): boolean {
  return categoriaDe(jogo) !== null
}

/**
 * S64 — aumentar passa pela **mesma porta** que baixar.
 *
 * `criarJogo` é a única porta de `Jogo` (S40, S52), e um `Jogo` inválido não é
 * representável. Ou o aumento passa por ela, ou existe uma segunda porta com os
 * sete invariantes copiados. O jogo inteiro é revalidado, não só o pedaço novo,
 * e os sete caem de graça sobre o `aumentar` — I1 pelo limite de 14 (R6.3), I3
 * pelo buraco, I5 pelo valor repetido, I6 pelo Ás alto.
 *
 * Isto só é seguro por causa da S52. Se `criarJogo` ainda inferisse as casas a
 * partir das cartas, revalidar o conjunto inteiro desfaria em silêncio escolhas
 * que o jogador já fez — qual carta é curinga, qual ponta o Ás ocupa. Como ela
 * **confere em vez de inferir**, as posições antigas atravessam intactas.
 *
 * S63 — e o `id` é restaurado. Ele nasce no `baixar` e é identidade, não resumo
 * do conteúdo: sem isto, crescer pela esquerda trocaria a primeira posição e o
 * jogo alvo sumiria entre duas jogadas do mesmo turno (R3.3).
 */
export function aumentarJogo(jogo: Jogo, novas: readonly Posicao[]): ResultadoDeJogo {
  const resultado = criarJogo(jogo.dono, [...jogo.posicoes, ...novas])

  return resultado.tipo === 'valido'
    ? { tipo: 'valido', jogo: { ...resultado.jogo, id: jogo.id } }
    : resultado
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
        // S63 — atribuído **uma vez**, no instante em que o jogo é baixado, e
        // preservado por `aumentarJogo` a partir daí. Continua saindo da
        // primeira posição daquele momento; o que mudou na H6 é que ele para de
        // ser recalculado. Um identificador que muda quando o objeto cresce pela
        // esquerda e não muda quando cresce pela direita não é identidade.
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
