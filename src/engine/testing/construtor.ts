import { NAIPES, VALORES, baralhoCanonico } from '../dominio/carta.ts'
import type { Carta, Naipe, Valor } from '../dominio/carta.ts'
import { criarJogo } from '../dominio/jogo.ts'
import type { Jogo, Posicao } from '../dominio/jogo.ts'
import type { FaseDoTurno, Jogador, JogadorId, Partida } from '../dominio/partida.ts'

/**
 * C4 — o construtor **validado** de estado, e a Alternativa C do
 * acceptance-tests.md §3: legível como o construtor livre, e incapaz de produzir
 * estado impossível. Descrição impossível não devolve estado ruim: ela lança.
 *
 * C6 — mora em `engine/testing/`, fora de `engine/index.ts`, e o ESLint proíbe
 * `ui/`, `ia/` e `estado/` de importá-lo. Sem isso ele viraria porta dos fundos
 * para fabricar `Partida` que a M8 diz não existir.
 *
 * A alcançabilidade fica por conta do outro lado (C5): as partidas aleatórias
 * entre IAs só percorrem estados alcançáveis por construção.
 */

const SIMBOLOS: Readonly<Record<string, Naipe>> = {
  '♥': 'COPAS',
  '♦': 'OUROS',
  '♠': 'ESPADAS',
  '♣': 'PAUS',
}

const VALORES_VALIDOS: ReadonlySet<string> = new Set(VALORES)

/**
 * Lê `'5♥ 6♥ 7♥'` como cartas de verdade, na notação em que os critérios de
 * aceite estão escritos. Repetir a mesma carta pega a segunda cópia: `'6♥ 6♥'`
 * são `COPAS-6-1` e `COPAS-6-2`, que é o fixture da CA-R5.6-1.
 */
export function cartas(notacao: string): readonly Carta[] {
  const usos = new Map<string, number>()

  return notacao
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => {
      const simbolo = token.slice(-1)
      const valor = token.slice(0, -1)
      const naipe = SIMBOLOS[simbolo]

      if (naipe === undefined) {
        throw new Error(`notação inválida: '${token}' não termina em ♥ ♦ ♠ ♣`)
      }

      if (!VALORES_VALIDOS.has(valor)) {
        throw new Error(`notação inválida: '${valor}' não é um valor de carta`)
      }

      const chave = `${naipe}-${valor}`
      const copia = (usos.get(chave) ?? 0) + 1
      usos.set(chave, copia)

      if (copia > 2) {
        throw new Error(`descrição impossível: '${token}' aparece ${String(copia)} vezes (R1.2)`)
      }

      return { id: `${chave}-${String(copia)}`, naipe, valor: valor as Valor }
    })
}

/**
 * Lê `'5♥ 6♥ 2♠>7'` como posições, na notação em que os critérios da H5 estão
 * escritos: `carta>valor` é a carta fazendo papel daquele valor (S51). Sem `>`,
 * a posição é natural.
 *
 * As cópias são contadas sobre a notação inteira, então `'2♥ ... 2♥>7'` produz
 * `COPAS-2-1` natural e `COPAS-2-2` curinga — o fixture da CA-S55-1.
 */
export function posicoes(notacao: string): readonly Posicao[] {
  const semPapel = notacao.replace(/>[^\s]+/g, '')
  const cartasDaNotacao = cartas(semPapel)

  return notacao
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token, indice): Posicao => {
      const carta = cartasDaNotacao[indice]

      if (carta === undefined) {
        throw new Error(`notação inválida: sem carta na posição ${String(indice)}`)
      }

      const papel = token.split('>')[1]

      if (papel === undefined) {
        return { tipo: 'Natural', carta }
      }

      if (!VALORES_VALIDOS.has(papel)) {
        throw new Error(`notação inválida: '${papel}' não é um valor de carta`)
      }

      return { tipo: 'Curinga', carta, representa: papel as Valor }
    })
}

/** Uma carta por naipe e valor, sem passar pela notação. */
export function carta(naipe: Naipe, valor: Valor, copia: 1 | 2 = 1): Carta {
  return { id: `${naipe}-${valor}-${String(copia)}`, naipe, valor }
}

export type DescricaoDaPartida = {
  /** Índice = `JogadorId`. */
  readonly maos: readonly [readonly Carta[], readonly Carta[]]
  /** Cada jogo é descrito pelas posições; o construtor o valida com `criarJogo`. */
  readonly jogos?: readonly [readonly (readonly Posicao[])[], readonly (readonly Posicao[])[]]
  readonly lixo?: readonly Carta[]
  readonly jogadorDaVez?: JogadorId
  readonly fase?: FaseDoTurno
  readonly semente?: number
}

function montarJogos(dono: JogadorId, descritos: readonly (readonly Posicao[])[]): readonly Jogo[] {
  return descritos.map((doJogo) => {
    const resultado = criarJogo(dono, doJogo)

    if (resultado.tipo !== 'valido') {
      const cartasDoJogo = doJogo.map((posicao) => posicao.carta.id).join(' ')

      throw new Error(
        `descrição impossível: [${cartasDoJogo}] viola ${resultado.violados.join(', ')}`,
      )
    }

    return resultado.jogo
  })
}

function cartasDe(jogos: readonly Jogo[]): readonly Carta[] {
  return jogos.flatMap((jogo) => jogo.posicoes.map((posicao) => posicao.carta))
}

/**
 * Monta a `Partida` descrita e completa o resto do baralho, em ordem canônica,
 * entre mortos e monte.
 *
 * A validação final é a M9 aplicada ao próprio construtor: 104 cartas, nenhum
 * `id` repetido. Um teste que descreva três Ases de copas falha aqui, e não
 * dentro da engine.
 */
export function construirPartida(descricao: DescricaoDaPartida): Partida {
  const jogos: readonly [readonly Jogo[], readonly Jogo[]] = [
    montarJogos(0, descricao.jogos?.[0] ?? []),
    montarJogos(1, descricao.jogos?.[1] ?? []),
  ]

  const lixo = descricao.lixo ?? []
  const usadas = [
    ...descricao.maos[0],
    ...descricao.maos[1],
    ...cartasDe(jogos[0]),
    ...cartasDe(jogos[1]),
    ...lixo,
  ]

  const baralho = baralhoCanonico()
  const existentes = new Set(baralho.map((umaCarta) => umaCarta.id))
  const reservadas = new Set<string>()

  for (const umaCarta of usadas) {
    if (!existentes.has(umaCarta.id)) {
      throw new Error(`descrição impossível: '${umaCarta.id}' não existe no baralho (R1.1)`)
    }

    if (reservadas.has(umaCarta.id)) {
      throw new Error(`descrição impossível: '${umaCarta.id}' aparece em dois lugares (M9)`)
    }

    reservadas.add(umaCarta.id)
  }

  const restantes = baralho.filter((umaCarta) => !reservadas.has(umaCarta.id))

  // R2.3 — onze cartas em cada morto. Não é arredondamento: é a regra.
  if (restantes.length < 22) {
    throw new Error(
      `descrição impossível: sobram ${String(restantes.length)} cartas, e os dois mortos exigem 22 (R2.3)`,
    )
  }

  const jogador = (id: JogadorId): Jogador => ({
    id,
    mao: descricao.maos[id],
    jogos: jogos[id],
  })

  const partida: Partida = {
    semente: descricao.semente ?? 0,
    jogadores: [jogador(0), jogador(1)],
    mortos: [
      { id: 'A', cartas: restantes.slice(0, 11), reclamadoPor: null },
      { id: 'B', cartas: restantes.slice(11, 22), reclamadoPor: null },
    ],
    monte: restantes.slice(22),
    lixo,
    jogadorDaVez: descricao.jogadorDaVez ?? 0,
    fase: descricao.fase ?? 'Compra',
    placar: [0, 0],
    numeroDaRodada: 1,
  }

  const todas = [
    ...partida.jogadores[0].mao,
    ...partida.jogadores[1].mao,
    ...cartasDe(partida.jogadores[0].jogos),
    ...cartasDe(partida.jogadores[1].jogos),
    ...partida.monte,
    ...partida.lixo,
    ...partida.mortos[0].cartas,
    ...partida.mortos[1].cartas,
  ].map((umaCarta) => umaCarta.id)

  if (todas.length !== 104 || new Set(todas).size !== 104) {
    throw new Error(
      `construtor com defeito: ${String(todas.length)} cartas, ${String(new Set(todas).size)} distintas (M9)`,
    )
  }

  return partida
}

/**
 * Cartas do baralho que a descrição ainda não usou.
 *
 * Existe porque escrever a mão do adversário à mão é um gerador de colisão: três
 * fixtures desta suíte já bateram com ela, e o construtor reprovou os três. A
 * mão do adversário quase nunca é o objeto do teste — quando não é, ela deve
 * sair daqui e parar de participar.
 */
export function outrasCartas(usadas: readonly Carta[], quantas: number): readonly Carta[] {
  const reservadas = new Set(usadas.map((umaCarta) => umaCarta.id))
  const resto = baralhoCanonico().filter((umaCarta) => !reservadas.has(umaCarta.id))

  if (resto.length < quantas) {
    throw new Error(
      `descrição impossível: pedidas ${String(quantas)}, sobram ${String(resto.length)}`,
    )
  }

  return resto.slice(0, quantas)
}

/** Todos os valores de um naipe, em ordem, para montar mãos longas. */
export function naipeInteiro(naipe: Naipe): readonly Carta[] {
  return VALORES.map((valor) => carta(naipe, valor))
}

export { NAIPES, VALORES }
