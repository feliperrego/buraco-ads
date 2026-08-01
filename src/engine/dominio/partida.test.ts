import { describe, expect, it } from 'vitest'
import { NAIPES, VALORES } from './carta.ts'
import type { Carta } from './carta.ts'
import { iniciarPartida } from './partida.ts'
import type { Partida } from './partida.ts'

/**
 * Critérios de aceite da spec 0001 §6, níveis 1 e 2 da testing-strategy.md.
 *
 * Cada nome de teste cita o `CA-` que valida, e cada `CA-` cita a regra de
 * rules.md de onde veio (RNF2.1). Nenhum destes casos foi inventado aqui: todos
 * estão escritos na spec, aprovados antes de existir código. É por isso que o
 * passo 3 do ciclo é transcrição, e não invenção.
 */

const SEMENTE_QUALQUER = 7

/**
 * M9 conta mãos + jogos + monte + lixo + mortos. Os jogos entram por fidelidade
 * ao invariante, ainda que na H1 sejam vazios por construção do tipo (`Jogo` é
 * `never` até a H4).
 */
function todasAsCartas(partida: Partida): readonly Carta[] {
  return [
    ...partida.jogadores[0].mao,
    ...partida.jogadores[1].mao,
    ...partida.jogadores[0].jogos,
    ...partida.jogadores[1].jogos,
    ...partida.monte,
    ...partida.lixo,
    ...partida.mortos[0].cartas,
    ...partida.mortos[1].cartas,
  ]
}

function ids(cartas: readonly Carta[]): readonly string[] {
  return cartas.map((carta) => carta.id)
}

describe('R1 — o baralho', () => {
  it('CA-R1.1-1 — o total de cartas em jogo é 104', () => {
    expect(todasAsCartas(iniciarPartida(SEMENTE_QUALQUER))).toHaveLength(104)
  })

  it('CA-R1.2-1 — cada par naipe+valor aparece exatamente 2 vezes', () => {
    const cartas = todasAsCartas(iniciarPartida(SEMENTE_QUALQUER))

    for (const naipe of NAIPES) {
      for (const valor of VALORES) {
        const ocorrencias = cartas.filter((carta) => carta.naipe === naipe && carta.valor === valor)
        expect(ocorrencias, `${naipe}-${valor}`).toHaveLength(2)
      }
    }
  })

  it('CA-R1.2-2 — os 104 id são distintos', () => {
    const todos = ids(todasAsCartas(iniciarPartida(SEMENTE_QUALQUER)))

    expect(new Set(todos).size).toBe(104)
  })
})

describe('R2 — preparação da rodada', () => {
  it('CA-R2.1-1 — a mesma semente produz distribuições idênticas, carta por carta', () => {
    const uma = iniciarPartida(42)
    const outra = iniciarPartida(42)

    expect(ids(todasAsCartas(uma))).toEqual(ids(todasAsCartas(outra)))
  })

  it('CA-R2.2-1 — cada jogador tem 11 cartas na mão', () => {
    const partida = iniciarPartida(SEMENTE_QUALQUER)

    expect(partida.jogadores[0].mao).toHaveLength(11)
    expect(partida.jogadores[1].mao).toHaveLength(11)
  })

  it('CA-R2.3-1 — há dois mortos de 11 cartas, ambos com reclamadoPor nulo', () => {
    const partida = iniciarPartida(SEMENTE_QUALQUER)

    expect(partida.mortos).toHaveLength(2)
    expect(partida.mortos[0].cartas).toHaveLength(11)
    expect(partida.mortos[1].cartas).toHaveLength(11)
    expect(partida.mortos[0].reclamadoPor).toBeNull()
    expect(partida.mortos[1].reclamadoPor).toBeNull()
  })

  it('CA-R2.4-1 — o lixo começa vazio', () => {
    expect(iniciarPartida(SEMENTE_QUALQUER).lixo).toHaveLength(0)
  })

  it('CA-R2.5-1 — o monte tem 60 cartas', () => {
    expect(iniciarPartida(SEMENTE_QUALQUER).monte).toHaveLength(60)
  })

  it('CA-R2.6-1 — a mesma semente produz o mesmo jogadorDaVez', () => {
    expect(iniciarPartida(42).jogadorDaVez).toBe(iniciarPartida(42).jogadorDaVez)
  })

  it('CA-R2.6-2 — nas sementes 1 a 20, os dois jogadores aparecem como inicial', () => {
    const sorteados = new Set(
      Array.from({ length: 20 }, (_, indice) => iniciarPartida(indice + 1).jogadorDaVez),
    )

    // Não verifica *qual* jogador começa, e sim que os dois são possíveis: uma
    // implementação que sempre devolvesse 0 passaria por todos os outros critérios.
    expect(sorteados).toEqual(new Set([0, 1]))
  })
})

describe('R3 — estrutura do turno', () => {
  it('CA-R3.1-1 — a partida começa na fase Compra', () => {
    expect(iniciarPartida(SEMENTE_QUALQUER).fase).toBe('Compra')
  })
})

describe('M9 — conservação das cartas', () => {
  it('CA-M9-3 — mãos, jogos, monte, lixo e mortos somam 104 sem id repetido', () => {
    const todos = ids(todasAsCartas(iniciarPartida(SEMENTE_QUALQUER)))

    expect(todos).toHaveLength(104)
    expect(new Set(todos).size).toBe(104)
  })
})

describe('RNF1.2 — o estado é serializável', () => {
  it('CA-RNF1.2-1 — a partida atravessa JSON sem perder tipo nem conteúdo', () => {
    const partida = iniciarPartida(SEMENTE_QUALQUER)

    // Reprova Map, Set, Date e instâncias de classe, que atravessam o JSON
    // virando {} ou string. A H1 é onde a forma nasce; descobrir na H13 que ela
    // não serializa custaria reescrever a engine.
    expect(JSON.parse(JSON.stringify(partida))).toEqual(partida)
  })
})

describe('RNF1.3 — a engine é determinística', () => {
  it('CA-RNF1.3-1 — duas partidas com a mesma semente são profundamente iguais', () => {
    expect(iniciarPartida(2026)).toEqual(iniciarPartida(2026))
  })

  it('CA-RNF1.3-2 — sementes diferentes produzem distribuições diferentes', () => {
    expect(ids(todasAsCartas(iniciarPartida(1)))).not.toEqual(ids(todasAsCartas(iniciarPartida(2))))
  })
})

/**
 * S4 congela o embaralhamento. Este é o único critério que reprova quando o
 * gerador é trocado, a direção do Fisher-Yates é invertida ou a chamada da S7 sai
 * do lugar — todos os outros continuariam passando.
 *
 * Os valores vêm da spec §6.1, derivados por `scripts/baralho-dourado.py`, uma
 * transcrição independente em Python. Se tivessem sido gravados a partir desta
 * implementação, o teste provaria apenas que ela concorda consigo mesma.
 *
 * O que ele detecta é **mudança**, não correção: não existe "embaralhamento
 * certo" contra o qual comparar. A corretude vem dos critérios acima.
 */
describe('S4 — o embaralhamento está congelado', () => {
  const SEMENTE_DOURADA = 20260731

  const DOURADO = {
    jogadorDaVez: 1,
    maoDoJogador0: [
      'ESPADAS-9-2',
      'OUROS-J-1',
      'COPAS-4-2',
      'OUROS-6-1',
      'ESPADAS-K-2',
      'COPAS-K-1',
      'OUROS-9-1',
      'ESPADAS-4-1',
      'ESPADAS-5-2',
      'PAUS-K-2',
      'ESPADAS-5-1',
    ],
    maoDoJogador1: [
      'OUROS-3-2',
      'OUROS-9-2',
      'COPAS-9-1',
      'COPAS-3-1',
      'COPAS-J-1',
      'OUROS-4-2',
      'ESPADAS-7-1',
      'COPAS-2-2',
      'COPAS-7-1',
      'ESPADAS-4-2',
      'OUROS-8-1',
    ],
    mortoA: [
      'OUROS-6-2',
      'OUROS-3-1',
      'COPAS-J-2',
      'ESPADAS-6-2',
      'ESPADAS-2-2',
      'ESPADAS-9-1',
      'OUROS-Q-1',
      'ESPADAS-J-1',
      'PAUS-8-1',
      'OUROS-7-1',
      'ESPADAS-3-1',
    ],
    mortoB: [
      'PAUS-7-2',
      'PAUS-A-2',
      'COPAS-8-2',
      'PAUS-J-2',
      'PAUS-5-2',
      'PAUS-Q-2',
      'PAUS-A-1',
      'PAUS-6-1',
      'COPAS-5-1',
      'OUROS-10-1',
      'PAUS-J-1',
    ],
    montePrimeiras5: ['PAUS-Q-1', 'COPAS-8-1', 'OUROS-K-2', 'ESPADAS-10-2', 'PAUS-9-2'],
    monteUltimas5: ['COPAS-9-2', 'OUROS-4-1', 'PAUS-K-1', 'OUROS-8-2', 'COPAS-A-2'],
  }

  it('CA-S4-1 — a semente 20260731 produz exatamente a distribuição registrada', () => {
    const partida = iniciarPartida(SEMENTE_DOURADA)

    expect(ids(partida.jogadores[0].mao)).toEqual(DOURADO.maoDoJogador0)
    expect(ids(partida.jogadores[1].mao)).toEqual(DOURADO.maoDoJogador1)
    expect(ids(partida.mortos[0].cartas)).toEqual(DOURADO.mortoA)
    expect(ids(partida.mortos[1].cartas)).toEqual(DOURADO.mortoB)
    expect(ids(partida.monte).slice(0, 5)).toEqual(DOURADO.montePrimeiras5)
    expect(ids(partida.monte).slice(-5)).toEqual(DOURADO.monteUltimas5)
    expect(partida.jogadorDaVez).toBe(DOURADO.jogadorDaVez)
  })
})
