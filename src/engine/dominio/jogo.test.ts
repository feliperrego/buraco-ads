import { describe, expect, it } from 'vitest'
import { posicoes } from '../testing/construtor.ts'
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
  return criarJogo(DONO, posicoes(notacao))
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

/**
 * Critérios de aceite da spec 0005 §6.1 e §6.2 — o `2` como curinga.
 *
 * A notação `2♠>7` é o `[2♠→7♥]` dos critérios: a carta à esquerda fazendo papel
 * do valor à direita. Sem `>`, a posição é natural.
 */

function curingasDe(notacao: string) {
  return valido(notacao).posicoes.filter((posicao) => posicao.tipo === 'Curinga')
}

describe('R1.3 — o mesmo 2 com papéis opostos', () => {
  it('CA-R1.3-1 — A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥ é válida e não tem nenhuma posição Curinga', () => {
    // A asserção original pedia canastra LIMPA, que é R8 e chega na H8 (S50/S61).
    // Aqui ela vira asserção de posição, que é o que a H5 tem — e o que os dois
    // critérios provam continua intacto: o 2♥ está na casa dele.
    expect(curingasDe('A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥')).toHaveLength(0)
  })

  it('CA-R1.3-2 — 5♥ 6♥ 7♥ [2♥→8] 9♥ 10♥ J♥ é válida e tem exatamente uma posição Curinga', () => {
    const curingas = curingasDe('5♥ 6♥ 7♥ 2♥>8 9♥ 10♥ J♥')

    // O par decisivo do M2: **a mesma carta** com resultados opostos. Se a
    // implementação guardasse `ehCuringa` na carta, um dos dois falharia.
    expect(curingas).toHaveLength(1)
    expect(curingas[0]?.carta.id).toBe('COPAS-2-1')
  })
})

describe('R1.4 e R5.4 — no máximo um curinga', () => {
  it('CA-R1.4-1 — sequência com 2♠ e 2♦ como curingas é inválida (I4)', () => {
    expect(violados('5♥ 2♠>6 2♦>7')).toContain('I4')
  })

  it('CA-R1.4-2 — A♥ 2♥ 3♥ mais 2♠ como curinga é válida: o 2♥ é natural', () => {
    const curingas = curingasDe('A♥ 2♥ 3♥ 2♠>4')

    // Só o 2♠ conta. É a diferença entre olhar o valor impresso e olhar o papel.
    expect(curingas).toHaveLength(1)
    expect(curingas[0]?.carta.naipe).toBe('ESPADAS')
  })

  it('CA-R5.4-1 — 5♥ [2♠→6] [2♦→7] é inválida por dois curingas (I4)', () => {
    expect(violados('5♥ 2♠>6 2♦>7')).toContain('I4')
  })
})

describe('R5.5 — o curinga em qualquer posição, inclusive as pontas', () => {
  it('CA-R5.5-1 — 5♥ 6♥ [2♠→7] é válida: curinga na ponta direita', () => {
    const jogo = valido('5♥ 6♥ 2♠>7')

    expect(jogo.posicoes).toHaveLength(3)
    expect(jogo.posicoes[2]?.tipo).toBe('Curinga')
  })

  it('CA-R5.5-2 — [2♠→4] 5♥ 6♥ é válida: curinga na ponta esquerda', () => {
    const jogo = valido('2♠>4 5♥ 6♥')

    // A S43 ordena por casa, então o curinga da casa 3 vem primeiro mesmo tendo
    // sido descrito primeiro por acaso.
    expect(jogo.posicoes[0]?.tipo).toBe('Curinga')
    expect(jogo.naipe).toBe('COPAS')
  })
})

describe('I7 e S54 — quem pode ser curinga', () => {
  it('CA-I7-1 — 5♥ 6♥ [7♥→8] é inválida: só o 2 é curinga (I7)', () => {
    expect(violados('5♥ 6♥ 7♥>8')).toContain('I7')
  })

  it('CA-S54-1 — A♥ [2♥→2] 3♥ é inválida: aquele 2 é natural, não curinga (R1.3)', () => {
    // S54 — declarar o 2 do próprio naipe como curinga da própria casa descreve
    // a mesma casa por um caminho que a R1.3 não abre.
    expect(violados('A♥ 2♥>2 3♥')).toContain('I7')
  })

  it('CA-S54-1 — o mesmo 2♥ como curinga de outra casa continua válido', () => {
    // A âncora: sem ela, um validador que recusasse todo 2♥ curinga passaria no
    // critério acima e estaria errado.
    expect(curingasDe('5♥ 6♥ 2♥>7')).toHaveLength(1)
  })
})

describe('S55 — I5 olha o valor representado', () => {
  it('CA-S55-1 — A♥ 2♥ 3♥ 4♥ 5♥ 6♥ [2♥→7] é válida com as duas cópias do 2♥', () => {
    const jogo = valido('A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 2♥>7')
    const dois = jogo.posicoes.filter((posicao) => posicao.carta.valor === '2')

    // As duas cópias no mesmo jogo, uma na casa 1 e outra na casa 6. Pelo M2 não
    // há repetição de **valor na sequência**, que é o que a R5.6 proíbe.
    expect(dois).toHaveLength(2)
    expect(dois.map((posicao) => posicao.tipo).sort()).toEqual(['Curinga', 'Natural'])
    expect(jogo.posicoes).toHaveLength(7)
  })

  it('CA-S55-1 — dois curingas representando o mesmo valor continuam repetição (I5)', () => {
    // A âncora do outro lado: a S55 afrouxa a leitura de I5, não a desliga.
    expect(violados('5♥ 6♥ 2♠>7 2♦>7')).toContain('I5')
  })
})
