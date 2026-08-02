import { describe, expect, it } from 'vitest'
import { cartas } from '../testing/construtor.ts'
import { criarJogo } from './jogo.ts'
import type { Invariante, ResultadoDeJogo } from './jogo.ts'

/**
 * Critérios de aceite da spec 0004 §6.1 e §6.2. Os oito da §6.1 vêm do
 * acceptance-tests.md §4.1 **como estão** — é a primeira vez que uma spec herda
 * critérios em vez de criar.
 *
 * O par decisivo é CA-R5.3-2 contra CA-R5.3-4. Quem implementar a ordem dos
 * valores como anel faz o primeiro passar e o segundo falhar; os dois juntos
 * travam a linha de 14 casas da S41.
 */

const DONO = 0

function jogoDe(notacao: string): ResultadoDeJogo {
  return criarJogo(DONO, cartas(notacao))
}

/** Desembrulha o sucesso, falhando alto com os invariantes violados. */
function valido(notacao: string) {
  const resultado = jogoDe(notacao)

  if (resultado.tipo !== 'valido') {
    throw new Error(`esperava jogo válido em '${notacao}', veio ${resultado.violados.join(', ')}`)
  }

  return resultado.jogo
}

function violados(notacao: string): readonly Invariante[] {
  const resultado = jogoDe(notacao)

  if (resultado.tipo !== 'invalido') {
    throw new Error(`esperava jogo inválido em '${notacao}', veio um jogo`)
  }

  return resultado.violados
}

const QUATORZE = 'A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥ Q♥ K♥ A♥'

describe('R5.1 — um jogo é uma sequência do mesmo naipe', () => {
  it('CA-R5.1-1 — 5♥ 6♥ 7♥ forma jogo válido de 3 posições', () => {
    const jogo = valido('5♥ 6♥ 7♥')

    expect(jogo.naipe).toBe('COPAS')
    expect(jogo.dono).toBe(DONO)
    expect(jogo.posicoes).toHaveLength(3)
    expect(jogo.posicoes.map((posicao) => posicao.carta.valor)).toEqual(['5', '6', '7'])

    // "toda posição é Natural" não vira asserção aqui: o `no-unnecessary-condition`
    // reprovou a comparação porque ela é **sempre verdadeira**. É a S39 dando
    // certo — `Posicao` nasce com uma variante só, e quem garante que a H4 não
    // cria curinga por acidente é o compilador, não um teste.
  })

  it('CA-R5.1-2 — 5♥ 6♠ 7♥ é inválido: naipes misturados (I2)', () => {
    expect(violados('5♥ 6♠ 7♥')).toContain('I2')
  })

  it('CA-R5.1-3 — 5♥ 6♥ é inválido: o mínimo é três (I1)', () => {
    expect(violados('5♥ 6♥')).toContain('I1')
  })

  it('CA-R5.1-4 — 5♥ 7♥ 8♥ é inválido: a casa do 6 está vazia (I3)', () => {
    expect(violados('5♥ 7♥ 8♥')).toContain('I3')
  })
})

describe('R5.2 e R5.3 — a linha de catorze casas, e o Ás nas duas pontas', () => {
  it('CA-R5.3-1 — 5♥ 6♥ 7♥ é válida', () => {
    expect(jogoDe('5♥ 6♥ 7♥').tipo).toBe('valido')
  })

  it('CA-R5.3-2 — Q♥ K♥ A♥ é válida: Ás alto', () => {
    const jogo = valido('Q♥ K♥ A♥')

    // O Ás fecha a linha na casa 13. Metade do par decisivo: sozinho, ele passa
    // também numa implementação circular — é a CA-R5.3-4 que separa as duas.
    expect(jogo.posicoes.map((posicao) => posicao.carta.valor)).toEqual(['Q', 'K', 'A'])
  })

  it('CA-R5.3-3 — A♥ 2♥ 3♥ é válida: Ás baixo, e o 2♥ é natural (R1.3)', () => {
    const jogo = valido('A♥ 2♥ 3♥')

    // S38 — o 2 do próprio naipe é carta natural na casa dele. Na H5, o mesmo 2♥
    // poderá ser curinga em outro jogo, e é isso que a CA-R1.3-2 vai cobrar.
    expect(jogo.posicoes.map((posicao) => posicao.carta.valor)).toEqual(['A', '2', '3'])
  })

  it('CA-R5.3-4 — K♥ A♥ 2♥ é inválida: a sequência não passa do Ás alto (I6)', () => {
    // A outra metade do par. Uma ordem circular aceitaria isto, e a R5.3 proíbe.
    expect(violados('K♥ A♥ 2♥')).toContain('I6')
  })

  it('CA-R5.3-5 — A♥ 2♥ … K♥ A♥ é válida, com Ás nas duas pontas', () => {
    const jogo = valido(QUATORZE)

    expect(jogo.posicoes).toHaveLength(14)
    expect(jogo.posicoes[0]?.carta.valor).toBe('A')
    expect(jogo.posicoes[13]?.carta.valor).toBe('A')
    // S42 — são cartas diferentes: a mesma carta não ocupa as duas pontas.
    expect(jogo.posicoes[0]?.carta.id).not.toBe(jogo.posicoes[13]?.carta.id)
  })

  it('CA-R5.3-6 — 15 cartas em sequência é inválido: excede o máximo (I1)', () => {
    expect(violados(`${QUATORZE} 2♥`)).toContain('I1')
  })
})

describe('R5.6 — valores repetidos, e a única exceção', () => {
  it('CA-R5.6-1 — 5♥ 6♥ 6♥ 7♥ é inválida: valor repetido (I5)', () => {
    expect(violados('5♥ 6♥ 6♥ 7♥')).toContain('I5')
  })

  it('CA-R5.6-2 — os dois Ases da sequência de 14 são a exceção, e ela é válida', () => {
    const jogo = valido(QUATORZE)
    const ases = jogo.posicoes.filter((posicao) => posicao.carta.valor === 'A')

    expect(ases).toHaveLength(2)
    expect(jogoDe(QUATORZE).tipo).toBe('valido')
  })

  it('CA-R5.6-2 — dois Ases fora da sequência de 14 continuam repetição (I5)', () => {
    // A âncora que dá sentido à exceção: sem ela, aceitar qualquer par de Ases
    // passaria na CA-R5.6-2 e estaria errado.
    expect(violados('A♥ A♥ 2♥ 3♥')).toContain('I5')
  })
})

describe('S43 — a engine ordena as cartas', () => {
  it('CA-S43-1 — 7♥ 5♥ 6♥, nesta ordem, é válida', () => {
    const jogo = valido('7♥ 5♥ 6♥')

    // A T8 fixou "tocar e confirmar", então a ordem da seleção é acidental.
    // Exigir ordem faria a interface ordenar — e ordenar exige saber onde o Ás
    // vai, que é regra (S43).
    expect(jogo.posicoes.map((posicao) => posicao.carta.valor)).toEqual(['5', '6', '7'])
  })
})
