import { describe, expect, it } from 'vitest'
import {
  aplicar,
  criarAleatorio,
  iniciarPartida,
  movimentosValidos,
  visaoDe,
} from '../engine/index.ts'
import type { Comando, Partida, VisaoDoJogador } from '../engine/index.ts'
import { decidir } from './decidir.ts'
import { porSorteio } from './por-sorteio.ts'
import type { Politica } from './politica.ts'

/**
 * Critérios de aceite das specs 0003 §6 e 0015 §8, nível 3 da testing-strategy.md.
 *
 * S152 — a legalidade e o determinismo da E6 passam a valer para **as duas**
 * políticas, na mesma tabela de casos. A E7 mantém a aleatória viva como linha
 * de base, e uma linha de base que não é testada não serve de referência.
 */

const SEMENTE = 7

/** As duas políticas da S144, para os critérios que valem para ambas. */
const POLITICAS: readonly (readonly [string, Politica])[] = [
  ['heurística', decidir],
  ['sorteio', porSorteio(criarAleatorio(SEMENTE))],
]

function visaoDaVez(partida: Partida): VisaoDoJogador {
  return visaoDe(partida, partida.jogadorDaVez)
}

/** Leva a partida à fase de ação, onde a lista de movimentos é longa. */
function emAcao(semente = SEMENTE): Partida {
  const resultado = aplicar(iniciarPartida(semente), { tipo: 'comprarDoMonte' })

  if (resultado.tipo !== 'sucesso') {
    throw new Error(`cenário impossível: ${resultado.motivo}`)
  }

  return resultado.partida
}

describe('RF5.1 — a IA joga sozinha, dentro das regras', () => {
  it.each(POLITICAS)(
    'CA-S152-1 — a escolha da política %s está sempre em movimentosValidos',
    (_nome, politica) => {
      for (let semente = 1; semente <= 30; semente += 1) {
        const partida = emAcao(semente)
        const visao = visaoDaVez(partida)
        const escolha = politica(visao)

        expect(movimentosValidos(visao)).toContainEqual(escolha)
      }
    },
  )

  it.each(POLITICAS)(
    'CA-S144-4 — sem movimento algum, a política %s devolve null',
    (_nome, politica) => {
      const partida = emAcao()

      // A visão de quem NÃO é da vez tem lista vazia (S20).
      const visaoDoOutro = visaoDe(partida, partida.jogadorDaVez === 0 ? 1 : 0)

      expect(movimentosValidos(visaoDoOutro)).toHaveLength(0)
      expect(politica(visaoDoOutro)).toBeNull()
    },
  )

  it('CA-RF5.1-2 — decidir devolve Comando ou null, nunca lança em estado legal', () => {
    const escolha: Comando | null = decidir(visaoDaVez(emAcao()))

    expect(escolha).not.toBeNull()
  })
})

describe('S144 — as duas políticas e suas assinaturas', () => {
  it('CA-S144-1 — decidir não recebe gerador, e repetir a chamada repete a escolha', () => {
    const visao = visaoDaVez(emAcao())

    // A heurística é determinística **sem semente**: o empate sai de chave
    // estável do comando (IA3/S150), não de sorteio. É o que dispensa o
    // `Aleatorio` da assinatura da `Politica`.
    expect(decidir).toHaveLength(1)
    expect(decidir(visao)).toEqual(decidir(visao))
  })

  it('CA-S144-2 — porSorteio devolve uma Politica, e a mesma semente repete a sequência', () => {
    const visao = visaoDaVez(emAcao())
    const uma = porSorteio(criarAleatorio(123))
    const outra = porSorteio(criarAleatorio(123))

    const sequenciaDe = (politica: Politica) =>
      Array.from({ length: 5 }, () => JSON.stringify(politica(visao)))

    const primeira = sequenciaDe(uma)

    expect(primeira).toEqual(sequenciaDe(outra))

    // Âncora positiva: sem isto, "a mesma semente repete" passaria com uma
    // política que devolvesse sempre o mesmo comando — que é justamente o que a
    // heurística faz, e o que a aleatória não pode fazer.
    expect(new Set(primeira).size).toBeGreaterThan(1)
  })

  it('CA-S144-2 — sementes diferentes produzem escolhas diferentes', () => {
    const visao = visaoDaVez(emAcao())

    const escolhas = new Set(
      Array.from({ length: 30 }, (_, i) =>
        JSON.stringify(porSorteio(criarAleatorio(i + 1))(visao)),
      ),
    )

    expect(escolhas.size).toBeGreaterThan(1)
  })
})

describe('RF5.2 e M11 — a IA não pode trapacear', () => {
  it('CA-RF5.2-1 — mudar o monte sem mudar a visão não muda a escolha', () => {
    const partida = emAcao()
    const deCabecaParaBaixo: Partida = { ...partida, monte: [...partida.monte].reverse() }

    const original = decidir(visaoDaVez(partida))

    expect(original).toEqual(decidir(visaoDaVez(deCabecaParaBaixo)))

    // Âncora positiva: uma IA que devolvesse sempre a mesma coisa passaria na
    // asserção acima. O par prova que a escolha **é** sensível ao que a visão
    // mostra, e insensível ao que ela esconde.
    const maoMenor: Partida = {
      ...partida,
      jogadores:
        partida.jogadorDaVez === 0
          ? [
              { ...partida.jogadores[0], mao: partida.jogadores[0].mao.slice(0, 2) },
              partida.jogadores[1],
            ]
          : [
              partida.jogadores[0],
              { ...partida.jogadores[1], mao: partida.jogadores[1].mao.slice(0, 2) },
            ],
    }

    expect(movimentosValidos(visaoDaVez(maoMenor))).toHaveLength(2)
    expect(decidir(visaoDaVez(maoMenor))).not.toEqual(original)
  })

  it('CA-M11-1 — a visão da IA não contém a mão do adversário, o monte nem os mortos', () => {
    const partida = iniciarPartida(SEMENTE)
    const ia = partida.jogadorDaVez === 0 ? 1 : 0
    const humano = ia === 0 ? 1 : 0
    const serializada = JSON.stringify(visaoDe(partida, ia))

    const ocultas = [
      ...partida.jogadores[humano].mao,
      ...partida.monte,
      ...partida.mortos[0].cartas,
      ...partida.mortos[1].cartas,
    ]

    expect(serializada).toContain(partida.jogadores[ia].mao[0]?.id ?? 'sem-mao')

    for (const carta of ocultas) {
      expect(serializada, `vazou ${carta.id}`).not.toContain(carta.id)
    }

    expect(ocultas).toHaveLength(93)
  })
})

/**
 * Critério de aceite das specs 0007 §6.2 e 0015 §8 — o custo da decisão.
 *
 * O estado é montado jogando de verdade, e não com o construtor da C4 — que a
 * regra de dependência proíbe `ia/` de importar, e com razão. O efeito colateral
 * é bom: este cenário é **alcançável** por construção.
 */
function aplicado(partida: Partida, comando: Comando): Partida {
  const resultado = aplicar(partida, comando)

  if (resultado.tipo !== 'sucesso') {
    throw new Error(`cenário impossível: ${comando.tipo} recusado — ${resultado.motivo}`)
  }

  return resultado.partida
}

/** Deixa os dois jogadores comprando e descartando até o lixo crescer, e então o pega. */
function comMaoInchada(voltas: number): Partida {
  let partida = iniciarPartida(SEMENTE)

  for (let volta = 0; volta < voltas; volta += 1) {
    partida = aplicado(partida, { tipo: 'comprarDoMonte' })

    const primeira = partida.jogadores[partida.jogadorDaVez].mao[0]

    if (primeira === undefined) {
      throw new Error('cenário impossível: mão vazia')
    }

    partida = aplicado(partida, { tipo: 'descartar', carta: primeira.id })
  }

  return aplicado(partida, { tipo: 'pegarLixo' })
}

describe('S152 — o orçamento de tempo da E6', () => {
  it('CA-S152-2 — uma decisão da heurística no pior caso fica abaixo de 100 ms', () => {
    const partida = comMaoInchada(40)
    const visao = visaoDaVez(partida)

    // A âncora: sem ela, um cenário que não inchasse a mão tornaria a medição
    // abaixo indistinguível da CA-S152-1, que já roda com 12 cartas.
    expect(visao.mao.length).toBeGreaterThan(40)

    const inicio = performance.now()
    const escolha = decidir(visao)
    const decorrido = performance.now() - inicio

    console.log(
      `CA-S152-2: decidir com mão de ${String(visao.mao.length)} em ${decorrido.toFixed(2)} ms`,
    )

    expect(decorrido).toBeLessThan(100)
    expect(movimentosValidos(visao)).toContainEqual(escolha)
  })

  it('CA-S82-1 — a política aleatória continua dentro do teto antigo', () => {
    const visao = visaoDaVez(comMaoInchada(40))

    const inicio = performance.now()
    const escolha = porSorteio(criarAleatorio(SEMENTE))(visao)
    const decorrido = performance.now() - inicio

    expect(decorrido).toBeLessThan(50)
    expect(movimentosValidos(visao)).toContainEqual(escolha)
  })
})
