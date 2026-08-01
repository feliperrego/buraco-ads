import { embaralhar } from '../aleatorio/embaralhar.ts'
import { mulberry32 } from '../aleatorio/mulberry32.ts'
import { baralhoCanonico } from './carta.ts'
import type { Carta } from './carta.ts'

/** S11 — o humano é sempre `0`. */
export type JogadorId = 0 | 1

/** R3.1, colapsado em duas fases pelo domain.md §2. */
export type FaseDoTurno = 'Compra' | 'Acao'

/**
 * A H1 não cria jogos: as duas listas nascem vazias e ficam vazias (S1).
 *
 * `never` não é esperteza — é o tipo que torna essa afirmação verificável pelo
 * compilador, já que `readonly never[]` só aceita `[]`. A forma real, com os sete
 * invariantes do domain.md §4, nasce na H4 e substitui esta linha.
 */
export type Jogo = never

export type Jogador = {
  readonly id: JogadorId
  readonly mao: readonly Carta[]
  readonly jogos: readonly Jogo[]
  /** R9.3 — no máximo dois. */
  readonly mortosPegos: 0 | 1 | 2
}

/**
 * R2.3 — os mortos **não têm dono**. `reclamadoPor` é nulo até alguém pegar.
 * Os identificadores `A` e `B` são posicionais, não de propriedade.
 */
export type Morto = {
  readonly id: 'A' | 'B'
  readonly cartas: readonly Carta[]
  readonly reclamadoPor: JogadorId | null
}

/**
 * M7 — raiz do agregado. M8 — imutável.
 *
 * Tudo é `readonly` e nada aqui é `Map`, `Set`, `Date` ou instância de classe:
 * a CA-RNF1.2-1 reprova qualquer um deles, porque a RNF1.2 exige que este estado
 * atravesse `JSON` sem perder tipo nem conteúdo.
 */
export type Partida = {
  readonly semente: number
  readonly jogadores: readonly [Jogador, Jogador]
  readonly monte: readonly Carta[]
  readonly lixo: readonly Carta[]
  readonly mortos: readonly [Morto, Morto]
  readonly jogadorDaVez: JogadorId
  readonly fase: FaseDoTurno
  readonly placar: readonly [number, number]
  readonly numeroDaRodada: number
}

/**
 * S2 — a única forma de criar uma `Partida` fora de `engine/testing/`.
 *
 * Função pura da semente: a A5 proíbe a engine de ser fonte de aleatoriedade, e
 * a semente é gerada em `estado/` (S8).
 */
export function iniciarPartida(semente: number): Partida {
  const aleatorio = mulberry32(semente)
  const baralho = embaralhar(baralhoCanonico(), aleatorio)

  // S5 — as faixas de índice são a especificação, não uma escolha de
  // implementação: "distribuir 11 cartas para cada" admitiria alternar entre
  // jogadores ou repartir de trás para frente, e cada variante daria outra mesa
  // para a mesma semente.
  return {
    semente,
    jogadores: [
      { id: 0, mao: baralho.slice(0, 11), jogos: [], mortosPegos: 0 },
      { id: 1, mao: baralho.slice(11, 22), jogos: [], mortosPegos: 0 },
    ],
    mortos: [
      { id: 'A', cartas: baralho.slice(22, 33), reclamadoPor: null },
      { id: 'B', cartas: baralho.slice(33, 44), reclamadoPor: null },
    ],
    monte: baralho.slice(44, 104),
    lixo: [],
    // S7 — uma chamada **adicional**, depois da distribuição. Movê-la para antes
    // muda tudo o que vem depois.
    jogadorDaVez: Math.floor(aleatorio() * 2) === 0 ? 0 : 1,
    fase: 'Compra',
    placar: [0, 0],
    numeroDaRodada: 1,
  }
}
