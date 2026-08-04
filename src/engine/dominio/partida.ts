import { embaralhar } from '../aleatorio/embaralhar.ts'
import { mulberry32 } from '../aleatorio/mulberry32.ts'
import { baralhoCanonico } from './carta.ts'
import type { Carta } from './carta.ts'
// A H1 tinha `type Jogo = never` aqui, e a nota daquela linha prometia que a
// forma real — com os invariantes do domain.md §4 — a substituiria na H4. É esta
// importação. O ciclo entre os dois módulos é só de tipos, portanto apagado na
// compilação: `jogo.ts` importa `JogadorId` daqui pelo mesmo caminho.
import type { Jogo } from './jogo.ts'

/** S11 — o humano é sempre `0`. */
export type JogadorId = 0 | 1

/**
 * R3.1, colapsado em duas fases pelo domain.md §2, mais o estado terminal.
 *
 * S112 — `RodadaEncerrada` existia no diagrama do `domain.md` §1.3 desde a Onda 1
 * e não existia aqui: a H11 é a primeira fatia que o alcança. O tipo mudou de
 * nome junto (era `FaseDoTurno`) porque um valor chamado `RodadaEncerrada` num
 * tipo chamado "fase do turno" é uma mentira que alguém acredita.
 *
 * O terceiro valor obriga **todo lugar que enumera `fase` a virar `switch`
 * exaustivo**. Não é estilo: um `if (fase === 'Compra') … else` compila com três
 * valores e cai no ramo errado, que é o achado da H7 aplicado antes do erro.
 */
export type FaseDaRodada = 'Compra' | 'Acao' | 'RodadaEncerrada'

/**
 * S105 — **não** existe campo `mortosPegos`.
 *
 * O `domain.md` §3 previa um, e a H10 o removeu: `Morto.reclamadoPor` já diz a
 * mesma coisa, e dois lugares para a mesma verdade divergem. Quantos mortos um
 * jogador pegou é `mortos.filter((morto) => morto.reclamadoPor === quem).length`
 * — derivado, como a janela da S71 e a categoria da S85.
 *
 * A R9.3 continua garantida sem contador: o limite de dois é o número de mortos
 * que existem, não uma validação.
 */
export type Jogador = {
  readonly id: JogadorId
  readonly mao: readonly Carta[]
  readonly jogos: readonly Jogo[]
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
  readonly fase: FaseDaRodada
  /**
   * S131 — quem **começou** esta rodada, para a alternância da R2.6.
   *
   * Guardado, e não derivado, porque não sobra no estado: `jogadorDaVez` no fim
   * da rodada diz onde ela parou, nunca onde começou. Depois de uma batida por
   * descarte final ele aponta para o adversário do batedor (S113); depois de uma
   * batida ao baixar, para o batedor.
   *
   * É o mesmo critério do `placar` (S122): derive o que o estado atual ainda
   * contém, guarde o que a próxima rodada apagaria.
   */
  readonly iniciante: JogadorId
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
  // S7 — a chamada **adicional** que decide quem começa, depois da distribuição.
  // Movê-la para antes muda tudo o que vem depois.
  const sorteado: JogadorId = Math.floor(aleatorio() * 2) === 0 ? 0 : 1

  // S5 — as faixas de índice são a especificação, não uma escolha de
  // implementação: "distribuir 11 cartas para cada" admitiria alternar entre
  // jogadores ou repartir de trás para frente, e cada variante daria outra mesa
  // para a mesma semente.
  return {
    semente,
    jogadores: [
      { id: 0, mao: baralho.slice(0, 11), jogos: [] },
      { id: 1, mao: baralho.slice(11, 22), jogos: [] },
    ],
    mortos: [
      { id: 'A', cartas: baralho.slice(22, 33), reclamadoPor: null },
      { id: 'B', cartas: baralho.slice(33, 44), reclamadoPor: null },
    ],
    monte: baralho.slice(44, 104),
    lixo: [],
    jogadorDaVez: sorteado,
    fase: 'Compra',
    // R2.6 — a primeira rodada é sorteada, e é este valor que a alternância da
    // `novaRodada` inverte.
    iniciante: sorteado,
    placar: [0, 0],
    numeroDaRodada: 1,
  }
}

/**
 * R2.6 e R12 — a rodada seguinte da mesma partida.
 *
 * S129 — **função**, não um sétimo comando. Pegar o morto e bater não são
 * comandos porque são automáticos (M3, M4); começar a rodada seguinte não é
 * comando porque não é **jogada** — é ação de sessão, como iniciar a partida. A
 * tabela de seis comandos do `domain.md` §6 continua fechada e
 * `movimentosValidos` não muda.
 *
 * S130 — a semente vem de fora, pelo mesmo caminho da primeira rodada: a A5
 * proíbe a engine de ser fonte de aleatoriedade, e a S8 põe `Math.random` em
 * `estado/`.
 *
 * Só **duas** coisas atravessam a rodada — o placar acumulado e a alternância do
 * iniciante. Os outros sete campos são exatamente o que `iniciarPartida` produz,
 * e é por isso que ela é reusada em vez de reescrita.
 */
export function novaRodada(partida: Partida, semente: number): Partida {
  const comeca: JogadorId = partida.iniciante === 0 ? 1 : 0

  return {
    ...iniciarPartida(semente),
    jogadorDaVez: comeca,
    iniciante: comeca,
    placar: partida.placar,
    numeroDaRodada: partida.numeroDaRodada + 1,
  }
}

/**
 * R12.1 e R12.2 — quem venceu a partida, ou `null` se ela continua.
 *
 * S132 — a R12.2 inteira cabe numa frase: **vence quem tem mais pontos, se o
 * maior alcançou 3000 e não há empate**. Lida como três casos ela pediria três
 * `if`; lida junto, nenhum.
 *
 * Confere: se só um passou de 3000, ele é necessariamente o de mais pontos, e o
 * máximo já o escolhe. Se os dois passaram, o máximo é o que a R12.2 manda. E o
 * empate exato devolve `null` — que é precisamente *"joga-se mais uma rodada"*,
 * não um caso à parte.
 *
 * S133 — não existe fase `PartidaEncerrada`. A partida acabou quando a rodada
 * está encerrada **e** esta função devolve alguém. A R12.2 verifica ao **fim** da
 * rodada, nunca no meio, e é a fase que diz isso.
 */
export function vencedorDa(partida: Partida): JogadorId | null {
  const [zero, um] = partida.placar

  if (partida.fase !== 'RodadaEncerrada' || Math.max(zero, um) < PONTOS_PARA_VENCER) {
    return null
  }

  return zero === um ? null : zero > um ? 0 : 1
}

/** R12.1 — o alvo da partida. */
export const PONTOS_PARA_VENCER = 3000
