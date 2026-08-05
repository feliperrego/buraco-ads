import { bateCom, casasDe, janelaDe, valorDa, valorDaCarta, zeraAMao } from '../engine/index.ts'
import type { CartaBaixada, Carta, Comando, Jogo, VisaoDoJogador } from '../engine/index.ts'

/**
 * S146 — a nota de um comando, em **duas dimensões** e não numa.
 *
 * A IA10 diz "bate assim que pode", e num número só isso exigiria um peso que
 * domine **qualquer soma** das outras parcelas. Isso é demonstrável hoje — a mão
 * tem teto e o valor da carta tem teto — e é exatamente o tipo de propriedade
 * que se perde em silêncio quando alguém acrescenta uma parcela. Peso que
 * precisa dominar é peso que pode deixar de dominar.
 *
 * Com o par, a separação é estrutural: `bate` decide primeiro, sempre, e nenhuma
 * parcela nova pode furá-la.
 *
 * Isto **não** é a cascata de `if` que a IA2 recusou. A cascata põe toda a
 * estratégia na ordem das linhas; aqui há **uma** classe, ela vem de uma regra
 * (R10.3), e as outras parcelas continuam sendo números que se comparam.
 */
export type Nota = {
  readonly bate: boolean
  readonly valor: number
}

/** IA5 — a R11.3 conta a carta baixada como positiva e a da mão como negativa. */
export const DOBRO_DA_MESA = 2

/** IA6 — a R6.5 só deixa regularizar o `2` do próprio naipe; a R8.2 põe 100 na diferença. */
export const CURINGA_DO_NAIPE = 50

/** R8.2 — suja para limpa é exatamente 100. */
export const LIMPAR_A_CANASTRA = 100

/** IA8 — a R9.2 entrega 11 cartas a quem zera a mão. */
export const CORRER_PARA_O_MORTO = 200

/** IA7 — a R4.2 manda o lixo **inteiro** a quem o pegar, e a R4.3 o deixa visível. */
export const PERIGO_DO_DESCARTE = 100

/** S149 — a sequência mínima é de três (R5.2) e um buraco admite curinga (R5.5). */
export const DISTANCIA_DE_ENCAIXE = 2

/** S146 — a ordem: `bate` primeiro, `valor` depois. Positivo quando `uma` vence. */
export function comparar(uma: Nota, outra: Nota): number {
  if (uma.bate !== outra.bate) {
    return uma.bate ? 1 : -1
  }

  return uma.valor - outra.valor
}

export function pontuar(visao: VisaoDoJogador, comando: Comando): Nota {
  return { bate: bateCom(visao, comando), valor: valorDe(visao, comando) }
}

/**
 * As oito parcelas da spec 0015 §5. Cada uma cita a regra de onde saiu, e é essa
 * citação que faz delas política revisável em vez de número mágico.
 */
function valorDe(visao: VisaoDoJogador, comando: Comando): number {
  const morto = bonusDoMorto(visao, comando)

  switch (comando.tipo) {
    case 'comprarDoMonte':
      // A linha de base contra a qual o lixo é medido. Não é "não fazer nada":
      // é o zero de onde o saldo da IA9 sai positivo ou negativo.
      return 0
    case 'pegarLixo':
      return saldoDoLixo(visao)
    case 'descartar':
      return descarte(visao, comando.carta) + morto
    case 'baixar':
    case 'aumentar':
      return (
        DOBRO_DA_MESA * valorDasCitadas(visao, comando.cartas) +
        bonusDoCuringa(visao, comando) +
        morto
      )
    case 'regularizarCuringa':
      return (
        DOBRO_DA_MESA *
          valorDasCitadas(
            visao,
            comando.cartas.map((carta) => ({ carta })),
          ) +
        LIMPAR_A_CANASTRA +
        morto
      )
  }
}

/**
 * IA8 — a R9.2 entrega 11 cartas a quem zera a mão, e a R10.1 faz do morto
 * pré-requisito da batida. Chegar lá é ganho material e habilitação ao mesmo
 * tempo, e **zero** depois que não houver morto: aí a mão vazia é batida, e a
 * batida já decide pela outra dimensão da nota.
 */
function bonusDoMorto(visao: VisaoDoJogador, comando: Comando): number {
  return visao.mortosRestantes > 0 && zeraAMao(visao, comando) ? CORRER_PARA_O_MORTO : 0
}

/**
 * IA7 — o descarte é pontuado pelo que **entrega**.
 *
 * O sinal negativo faz o `argmax` escolher a **menor**, que é o que a IA7 pede.
 * E a diferença de escala — 100 contra no máximo 15 (R11.2) — é o que codifica o
 * "entre descartes equivalentes" sem precisar de uma segunda classe: o valor da
 * carta nunca supera o perigo, só desempata dentro dele.
 *
 * A outra metade da IA7 — a carta por que o adversário "mostrou interesse" — não
 * está aqui (S148): ela exige memória entre turnos, e a `ia-strategy.md` §5 a
 * excluiu. O lixo (R4.3) diz o que foi **descartado**, não o que foi **pego**.
 */
function descarte(visao: VisaoDoJogador, id: string): number {
  const carta = visao.mao.find((daMao) => daMao.id === id)

  if (carta === undefined) {
    return 0
  }

  return -valorDaCarta(carta.valor) - (entregaAoAdversario(visao, carta) ? PERIGO_DO_DESCARTE : 0)
}

/** A carta cai numa das pontas de um jogo que ele já mostrou (RF3.5). */
function entregaAoAdversario(visao: VisaoDoJogador, carta: Carta): boolean {
  return visao.jogosDoAdversario.some((jogo) => encosta(jogo, carta))
}

function encosta(jogo: Jogo, carta: Carta): boolean {
  if (jogo.naipe !== carta.naipe) {
    return false
  }

  const { inicio, fim } = janelaDe(jogo)

  return casasDe(carta.valor).some((casa) => casa === inicio - 1 || casa === fim + 1)
}

/**
 * IA9 — o lixo vale o que dele encaixa, menos o peso do que não encaixa.
 *
 * Um limiar, não uma regra: pegar sempre e nunca pegar são os dois extremos
 * ruins. O saldo positivo é o que supera o zero do `comprarDoMonte`.
 */
function saldoDoLixo(visao: VisaoDoJogador): number {
  return visao.lixo.reduce(
    (soma, carta) =>
      encaixa(visao, carta) ? soma + valorDaCarta(carta.valor) : soma - valorDaCarta(carta.valor),
    0,
  )
}

/**
 * S149 — a carta **encaixa** quando há, na mão, nos meus jogos **ou no próprio
 * lixo**, outra do mesmo naipe a uma ou duas casas dela (S41).
 *
 * A distância mínima é **um**, e não zero: a carta idêntica não constrói
 * sequência nenhuma. Duas é o teto porque a sequência mínima tem três (R5.2) e
 * um buraco admite curinga (R5.5) — mais que isso não é encaixe, é esperança.
 *
 * **A terceira fonte é o conserto da S178, e ela é a causa da trava do lixo.** A
 * definição original só olhava a minha mão e os meus jogos, e com isso avaliava
 * cada carta do lixo como se ela fosse chegar **sozinha**. Mas a R4.2 manda o
 * lixo inteiro de uma vez: as cartas dele chegam juntas e são vizinhas umas das
 * outras. O erro crescia com o tamanho do lixo — que é exatamente a forma da
 * trava, medida chegando a 70 cartas contra um oponente que nunca o pegava.
 *
 * O conserto **não** foi pôr piso no termo negativo (a alternativa C da spec
 * 0020): aquilo trata o sintoma e só deixa a trava mais lenta — 24 em vez de 70.
 */
export function encaixa(visao: VisaoDoJogador, carta: Carta): boolean {
  const naMao = visao.mao.some((outra) => vizinhas(outra.naipe, casasDe(outra.valor), carta))

  if (naMao) {
    return true
  }

  const nosJogos = visao.meusJogos.some((jogo) =>
    // O valor **representado** (S55): o curinga ocupa a casa do que ele faz, não
    // a do `2` que ele é.
    jogo.posicoes.some((posicao) => vizinhas(jogo.naipe, casasDe(valorDa(posicao)), carta)),
  )

  if (nosJogos) {
    return true
  }

  // **Sem filtro pela própria carta, e isso é decisão medida.** A primeira
  // escrita tinha um `outra.id !== carta.id`, e a mutação que o removeu **não
  // reprovou nada**: `vizinhas` exige distância de ao menos uma casa, e nenhum
  // valor do baralho é vizinho de si mesmo — conferido para os treze, incluindo
  // o Ás, que ocupa duas casas. O filtro dizia a mesma coisa duas vezes, que é o
  // defeito que a H9 mediu: duplicação de intenção, não de código.
  return visao.lixo.some((outra) => vizinhas(outra.naipe, casasDe(outra.valor), carta))
}

function vizinhas(naipe: string, casas: readonly number[], carta: Carta): boolean {
  if (naipe !== carta.naipe) {
    return false
  }

  return casas.some((casa) =>
    casasDe(carta.valor).some((outra) => {
      const distancia = Math.abs(casa - outra)

      return distancia >= 1 && distancia <= DISTANCIA_DE_ENCAIXE
    }),
  )
}

/**
 * IA6 — entre dois curingas possíveis, o `2` do **próprio naipe** vale mais.
 *
 * A R6.5 só deixa regularizar esse, e a diferença é de 100 pontos por canastra
 * (R8.2). Metade aqui, porque regularizar ainda exige ter as cartas depois.
 */
function bonusDoCuringa(
  visao: VisaoDoJogador,
  comando: Extract<Comando, { readonly cartas: readonly CartaBaixada[] }>,
): number {
  const curinga = comando.cartas.find((citada) => citada.representa !== undefined)

  if (curinga === undefined) {
    return 0
  }

  const carta = visao.mao.find((daMao) => daMao.id === curinga.carta)
  const naipe = naipeDaSequencia(visao, comando)

  return carta !== undefined && carta.naipe === naipe ? CURINGA_DO_NAIPE : 0
}

/** R5.1 — a sequência é de um naipe só, então qualquer natural dela o revela. */
function naipeDaSequencia(
  visao: VisaoDoJogador,
  comando: Extract<Comando, { readonly cartas: readonly CartaBaixada[] }>,
): string | null {
  if (comando.tipo === 'aumentar') {
    return visao.meusJogos.find((jogo) => jogo.id === comando.jogo)?.naipe ?? null
  }

  const natural = comando.cartas.find((citada) => citada.representa === undefined)

  if (natural === undefined) {
    return null
  }

  return visao.mao.find((daMao) => daMao.id === natural.carta)?.naipe ?? null
}

function valorDasCitadas(visao: VisaoDoJogador, citadas: readonly CartaBaixada[]): number {
  return citadas.reduce((soma, citada) => {
    const carta = visao.mao.find((daMao) => daMao.id === citada.carta)

    return carta === undefined ? soma : soma + valorDaCarta(carta.valor)
  }, 0)
}

/**
 * S150 — a chave estável do comando, que resolve o empate da IA3.
 *
 * Tipo, alvo e cartas citadas, em ordem. A posição em `movimentosValidos` não
 * entra aqui nem em lugar nenhum da `ia/`: usá-la devolveria pela porta dos
 * fundos o contrato que o gatilho da H10 acabou de recusar.
 */
export function chaveDe(comando: Comando): string {
  switch (comando.tipo) {
    case 'comprarDoMonte':
    case 'pegarLixo':
      return comando.tipo
    case 'descartar':
      return `descartar:${comando.carta}`
    case 'baixar':
      return `baixar:${citadas(comando.cartas)}`
    case 'aumentar':
      return `aumentar:${comando.jogo}:${citadas(comando.cartas)}`
    case 'regularizarCuringa':
      return `regularizarCuringa:${comando.jogo}:${[...comando.cartas].sort().join(',')}`
  }
}

/** O papel entra na chave: a S51 diz que a mesma carta em papéis diferentes é jogada diferente. */
function citadas(cartas: readonly CartaBaixada[]): string {
  return cartas
    .map((citada) =>
      citada.representa === undefined ? citada.carta : `${citada.carta}>${citada.representa}`,
    )
    .sort()
    .join(',')
}
