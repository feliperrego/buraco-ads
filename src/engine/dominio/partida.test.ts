import { describe, expect, it } from 'vitest'
import { NAIPES, VALORES } from './carta.ts'
import type { Carta } from './carta.ts'
import { iniciarPartida, novaRodada, vencedorDa } from './partida.ts'
import type { JogadorId, Partida } from './partida.ts'

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
 * M9 conta mãos + jogos + monte + lixo + mortos.
 *
 * Na H1 os jogos entravam por fidelidade ao invariante, e eram vazios por
 * construção do tipo — `Jogo` era `never`. A H4 lhes deu forma, e a soma passou
 * a atravessar as posições: uma carta baixada continua existindo, só mudou de
 * lugar.
 */
/** As cartas de uma lista de jogos, achatando as posições (M2). */
function cartasDosJogos(jogador: Partida['jogadores'][number]): readonly Carta[] {
  return jogador.jogos.flatMap((jogo) => jogo.posicoes.map((posicao) => posicao.carta))
}

function todasAsCartas(partida: Partida): readonly Carta[] {
  return [
    ...partida.jogadores[0].mao,
    ...partida.jogadores[1].mao,
    ...cartasDosJogos(partida.jogadores[0]),
    ...cartasDosJogos(partida.jogadores[1]),
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

  it('CA-R2.3-1 — há dois mortos de 11 cartas, ambos com destino nulo', () => {
    const partida = iniciarPartida(SEMENTE_QUALQUER)

    expect(partida.mortos).toHaveLength(2)
    expect(partida.mortos[0].cartas).toHaveLength(11)
    expect(partida.mortos[1].cartas).toHaveLength(11)
    expect(partida.mortos[0].destino).toBeNull()
    expect(partida.mortos[1].destino).toBeNull()
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

/**
 * Critérios de aceite da spec 0013 §8.1 e §8.2 — várias rodadas.
 *
 * S129 — `novaRodada` é função, não comando. Só **duas** coisas atravessam a
 * rodada: o placar acumulado e a alternância do iniciante (R2.6). Os outros sete
 * campos são o que `iniciarPartida` produz, e é por isso que ela é reusada.
 */

/** A partida da semente, levada ao fim da rodada com o placar pedido. */
function encerradaCom(placar: readonly [number, number], semente = 7): Partida {
  return { ...iniciarPartida(semente), fase: 'RodadaEncerrada', placar }
}

describe('R2.6 — o início alterna entre rodadas', () => {
  it('CA-R2.6-3 — a rodada 2 começa pelo outro, e a 3 volta ao primeiro', () => {
    const primeira = iniciarPartida(7)
    const segunda = novaRodada(primeira, 8)
    const terceira = novaRodada(segunda, 9)

    expect(segunda.iniciante).not.toBe(primeira.iniciante)
    expect(terceira.iniciante).toBe(primeira.iniciante)
  })

  it('CA-S131-1 — na rodada nova, iniciante e jogadorDaVez coincidem', () => {
    // Se o campo fosse decorativo, este critério passaria com ele fixo em 0.
    // A CA-R2.6-3 é a âncora que impede isso.
    const segunda = novaRodada(iniciarPartida(7), 8)

    expect(segunda.jogadorDaVez).toBe(segunda.iniciante)
  })

  it('CA-S131-3 — a alternância parte do iniciante, não de onde a rodada parou', () => {
    // O critério que **justifica** o campo, e que faltava: numa rodada encerrada
    // por descarte final a vez já passou para o adversário do batedor (S113).
    // Alternar a partir dela daria o mesmo jogador de novo.
    //
    // Achado por mutação: trocar `partida.iniciante` por `partida.jogadorDaVez`
    // em `novaRodada` não reprovava **nenhum** dos 296 testes, porque em todas as
    // outras fixtures os dois coincidem.
    const primeira = iniciarPartida(7)
    const parouNoOutro: Partida = {
      ...primeira,
      fase: 'RodadaEncerrada',
      jogadorDaVez: primeira.iniciante === 0 ? 1 : 0,
    }

    expect(parouNoOutro.jogadorDaVez).not.toBe(parouNoOutro.iniciante)
    expect(novaRodada(parouNoOutro, 8).iniciante).not.toBe(primeira.iniciante)
  })

  it('CA-S131-2 — durante a rodada, iniciante não acompanha a vez', () => {
    const primeira = iniciarPartida(7)
    const outro: JogadorId = primeira.jogadorDaVez === 0 ? 1 : 0
    const meio: Partida = { ...primeira, jogadorDaVez: outro }

    // É a razão de o campo existir: `jogadorDaVez` diz onde a rodada parou,
    // nunca onde ela começou (S113).
    expect(meio.iniciante).toBe(primeira.iniciante)
    expect(meio.iniciante).not.toBe(meio.jogadorDaVez)
  })
})

describe('S129 — o que a rodada nova preserva e o que ela refaz', () => {
  it('CA-S129-1 — mãos de 11, mesas vazias e os dois mortos intactos', () => {
    const gasta: Partida = {
      ...iniciarPartida(7),
      fase: 'RodadaEncerrada',
      jogadores: [
        { id: 0, mao: [], jogos: [] },
        { id: 1, mao: iniciarPartida(7).jogadores[1].mao, jogos: [] },
      ],
      mortos: [
        { ...iniciarPartida(7).mortos[0], cartas: [], destino: 0 },
        iniciarPartida(7).mortos[1],
      ],
    }
    const nova = novaRodada(gasta, 8)

    expect(nova.jogadores[0].mao).toHaveLength(11)
    expect(nova.jogadores[1].mao).toHaveLength(11)
    expect(nova.jogadores[0].jogos).toHaveLength(0)
    expect(nova.mortos.map((morto) => morto.destino)).toEqual([null, null])
    expect(nova.mortos.map((morto) => morto.cartas.length)).toEqual([11, 11])
    expect(nova.lixo).toHaveLength(0)
  })

  it('CA-S129-2 — o número da rodada avança e a fase volta a Compra', () => {
    const segunda = novaRodada(encerradaCom([0, 0]), 8)

    expect(segunda.numeroDaRodada).toBe(2)
    expect(segunda.fase).toBe('Compra')
    expect(novaRodada(segunda, 9).numeroDaRodada).toBe(3)
  })

  it('CA-S129-3 — o placar acumulado atravessa a rodada', () => {
    expect(novaRodada(encerradaCom([430, -120]), 8).placar).toEqual([430, -120])
  })

  it('CA-S129-1 — a semente nova é a que redistribui', () => {
    // A âncora da S130: a rodada nova é a partida da semente recebida, não uma
    // repetição da anterior.
    const comOito = novaRodada(encerradaCom([0, 0]), 8)
    const comNove = novaRodada(encerradaCom([0, 0]), 9)

    expect(comOito.semente).toBe(8)
    expect(comOito.jogadores[0].mao).toEqual(iniciarPartida(8).jogadores[0].mao)
    expect(comOito.jogadores[0].mao).not.toEqual(comNove.jogadores[0].mao)
  })
})

describe('R12 — o fim da partida', () => {
  it('CA-R12.1-1 — com 3010 contra 500 e a rodada encerrada, vence o 0', () => {
    expect(vencedorDa(encerradaCom([3010, 500]))).toBe(0)
    expect(vencedorDa(encerradaCom([500, 3010]))).toBe(1)
  })

  it('CA-R12.1-2 — com 2990 o maior ainda não chegou: a partida continua', () => {
    expect(vencedorDa(encerradaCom([2990, 500]))).toBeNull()
  })

  it('CA-R12.2-1 — os dois acima de 3000: vence quem tem mais', () => {
    expect(vencedorDa(encerradaCom([3200, 3100]))).toBe(0)
    expect(vencedorDa(encerradaCom([3100, 3200]))).toBe(1)
  })

  it('CA-R12.2-2 — empate exato acima de 3000 joga mais uma rodada', () => {
    // O `null` **é** a regra, não um caso não tratado.
    expect(vencedorDa(encerradaCom([3100, 3100]))).toBeNull()
  })

  it('CA-S132-1 — a verificação é ao fim da rodada, nunca no meio', () => {
    const emAndamento: Partida = { ...iniciarPartida(7), placar: [3010, 500] }

    expect(emAndamento.fase).toBe('Compra')
    expect(vencedorDa(emAndamento)).toBeNull()
    // A âncora: o mesmo placar com a rodada encerrada decide.
    expect(vencedorDa({ ...emAndamento, fase: 'RodadaEncerrada' })).toBe(0)
  })

  it('CA-S133-1 — partida decidida continua na fase RodadaEncerrada', () => {
    const decidida = encerradaCom([3010, 500])

    expect(vencedorDa(decidida)).toBe(0)
    // Não existe quarto valor de fase: o fim da partida é rodada encerrada com
    // vencedor, e não um estado próprio.
    expect(decidida.fase).toBe('RodadaEncerrada')
  })
})

describe('M9 — conservação na rodada nova', () => {
  it('CA-M9-14 — a rodada nova tem as 104 cartas, sem id repetido', () => {
    const nova = novaRodada(encerradaCom([100, 200]), 8)
    const ids = [
      ...nova.jogadores[0].mao,
      ...nova.jogadores[1].mao,
      ...nova.monte,
      ...nova.lixo,
      ...nova.mortos.flatMap((morto) => morto.cartas),
    ].map((carta) => carta.id)

    expect(ids).toHaveLength(104)
    expect(new Set(ids).size).toBe(104)
  })
})
