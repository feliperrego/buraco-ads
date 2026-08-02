import { describe, expect, it } from 'vitest'
import { carta, cartas, posicoes } from '../testing/construtor.ts'
import {
  aumentarJogo,
  categoriaDe,
  criarJogo,
  ehCanastra,
  janelaDe,
  regularizarJogo,
} from './jogo.ts'
import type { Invariante, Posicao, ResultadoDeJogo } from './jogo.ts'

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
  it('CA-R1.3-1 — A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥ é canastra LIMPA: o 2♥ está na casa dele', () => {
    // S90 — o gatilho da S61 disparou na H8. Da H5 até aqui este critério
    // verificava a **posição** (nenhuma `Curinga`), porque `LIMPA` não existia.
    // A asserção de categoria voltou, e a de posição fica: ela é o que explica
    // **por que** a categoria é essa.
    expect(categoriaDe(valido('A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥'))).toBe('LIMPA')
    expect(curingasDe('A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥')).toHaveLength(0)
  })

  it('CA-R1.3-2 — 5♥ 6♥ 7♥ [2♥→8] 9♥ 10♥ J♥ é canastra SUJA: o mesmo 2♥ agora é curinga', () => {
    const curingas = curingasDe('5♥ 6♥ 7♥ 2♥>8 9♥ 10♥ J♥')

    // O par decisivo do M2: **a mesma carta** com resultados opostos. Se a
    // implementação guardasse `ehCuringa` na carta, um dos dois falharia — e
    // agora a diferença aparece onde a regra a nomeia, que é a categoria.
    expect(categoriaDe(valido('5♥ 6♥ 7♥ 2♥>8 9♥ 10♥ J♥'))).toBe('SUJA')
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

/**
 * Critérios de aceite da spec 0006 §6.1 e §6.2 — aumentar um jogo na mesa.
 *
 * S64 — `aumentarJogo` é implementada **sobre `criarJogo`**, com o conjunto
 * inteiro. O jogo é revalidado, não só o pedaço novo, e os sete invariantes
 * caem de graça sobre o `aumentar`. É o retorno do investimento da S52: como
 * `criarJogo` **confere em vez de inferir**, revalidar não desfaz em silêncio as
 * escolhas que o jogador já fez — qual carta é curinga, qual ponta o Ás ocupa.
 */

function aumentado(base: string, novas: readonly Posicao[]): ResultadoDeJogo {
  return aumentarJogo(valido(base), novas)
}

/** Desembrulha o aumento bem-sucedido, falhando alto com os invariantes. */
function cresceu(base: string, novas: readonly Posicao[]) {
  const resultado = aumentado(base, novas)

  if (resultado.tipo !== 'valido') {
    throw new Error(`esperava aumentar '${base}', veio ${resultado.violados.join(', ')}`)
  }

  return resultado.jogo
}

/** As posições naturais descritas na notação dos critérios. */
function naturais(notacao: string): readonly Posicao[] {
  return posicoes(notacao)
}

function violadosAoAumentar(base: string, novas: readonly Posicao[]): readonly Invariante[] {
  const resultado = aumentado(base, novas)

  if (resultado.tipo !== 'invalido') {
    throw new Error(`esperava recusa ao aumentar '${base}', veio um jogo`)
  }

  return resultado.violados
}

describe('S63 — o id do jogo é identidade estável', () => {
  it('CA-S63-1 — aumentar pela esquerda preserva o id do jogo', () => {
    const antes = valido('5♥ 6♥ 7♥')
    const depois = cresceu('5♥ 6♥ 7♥', naturais('4♥'))

    // O caso que quebra o `id` derivado do conteúdo: crescer pela esquerda troca
    // a primeira posição. Um identificador que muda quando o objeto cresce de um
    // lado e não muda quando cresce do outro não é identidade — é resumo.
    expect(depois.posicoes.map((posicao) => posicao.carta.valor)).toEqual(['4', '5', '6', '7'])
    expect(depois.id).toBe(antes.id)
  })

  it('CA-S63-1 — aumentar pela direita também preserva o id', () => {
    // A âncora do outro lado. Sem ela, um `id` que continua derivado do conteúdo
    // passaria neste par por metade, e é justamente a metade que engana.
    const antes = valido('5♥ 6♥ 7♥')
    const depois = cresceu('5♥ 6♥ 7♥', naturais('8♥'))

    expect(depois.id).toBe(antes.id)
  })
})

describe('R6.4 — não se reorganiza carta já baixada', () => {
  it('CA-R6.4-1 — as posições anteriores continuam lá, na mesma ordem relativa', () => {
    const antes = valido('5♥ 6♥ 7♥')
    const depois = cresceu('5♥ 6♥ 7♥', naturais('4♥'))

    // A parte **positiva** do critério, e ela não é decorativa: `criarJogo`
    // ordena as posições (S43), então o jogo aumentado pela esquerda tem
    // primeira posição nova. Provar que as antigas seguem lá, na mesma ordem
    // entre si e com o mesmo papel, é o que distingue "cresceu" de "foi
    // remontado".
    const antigas = depois.posicoes.filter((posicao) =>
      antes.posicoes.some((anterior) => anterior.carta.id === posicao.carta.id),
    )

    expect(antigas).toEqual(antes.posicoes)
    expect(depois.posicoes).toHaveLength(4)
  })
})

describe('S64 — aumentar revalida o jogo inteiro', () => {
  it('CA-S64-1 — 9♥ num jogo 5♥ 6♥ 7♥ é recusado: a casa do 8 ficaria vazia (I3)', () => {
    expect(violadosAoAumentar('5♥ 6♥ 7♥', naturais('9♥'))).toContain('I3')
  })

  it('CA-R6.3-3 — 2♥ num jogo 10♥ J♥ Q♥ K♥ A♥ é recusado: não se passa do Ás alto (I6)', () => {
    // R5.3 na linha, não no anel: a sequência termina no Ás alto e não continua
    // além dele. É o mesmo defeito que o par CA-R5.3-2 / CA-R5.3-4 trava no
    // `baixar`, e a S64 o herda sem uma linha de código nova.
    expect(violadosAoAumentar('10♥ J♥ Q♥ K♥ A♥', naturais('2♥'))).toContain('I6')
  })

  it('CA-S68-1 — repor a carta natural do curinga é recusado por I5, e isso é da fatia', () => {
    // Pela R6.5 isto é **regularizar**, e chega na H9. Aqui a recusa vem da I5
    // (valor repetido), sem tratamento especial: o `7♥` e o `[2♠→7♥]` ocupariam
    // a mesma casa. O critério existe para que a H9 não encontre um
    // comportamento que **parece** decidido.
    expect(violadosAoAumentar('5♥ 6♥ 2♠>7', naturais('7♥'))).toContain('I5')
  })

  it('CA-S68-1 — o mesmo jogo aceita a carta que apenas o estende', () => {
    // A âncora: sem ela, um `aumentarJogo` que recusasse tudo passaria acima.
    expect(cresceu('5♥ 6♥ 2♠>7', naturais('4♥')).posicoes).toHaveLength(4)
  })
})

describe('S71 — a janela do jogo é derivada das pontas', () => {
  it('CA-S71-1 — Q♥ K♥ A♥ ocupa até a casa 13, a ponta alta do Ás', () => {
    // A regra do Ás é a única sutileza da S71, e não é arbitrária: como o jogo
    // tem ao menos três posições ordenadas, um Ás no fim não pode estar na casa
    // 0 — não haveria casa abaixo dele para as outras duas.
    expect(janelaDe(valido('Q♥ K♥ A♥'))).toEqual({ inicio: 11, fim: 13 })
  })

  it('CA-S71-2 — A♥ 2♥ 3♥ começa na casa 0, a ponta baixa do Ás', () => {
    expect(janelaDe(valido('A♥ 2♥ 3♥'))).toEqual({ inicio: 0, fim: 2 })
  })

  it('CA-S71-1 — o jogo de 14 ocupa a linha inteira, e é o que não pode crescer', () => {
    expect(janelaDe(valido(QUATORZE))).toEqual({ inicio: 0, fim: 13 })
  })

  it('CA-S71-2 — a janela lê o valor representado, não o impresso no curinga', () => {
    // S55 outra vez: `[2♠→7]` na ponta direita põe o fim na casa 6, não na 1.
    expect(janelaDe(valido('5♥ 6♥ 2♠>7'))).toEqual({ inicio: 4, fim: 6 })
  })
})

/**
 * Critérios de aceite da spec 0008 §9.1, mais os **doze herdados** do
 * acceptance-tests.md §4.2 e §4.3. É a segunda vez que uma spec herda critérios
 * em vez de criar — a primeira foi a H4 —, e desta vez a herança é quase total.
 *
 * S88 — a precedência da R8.3 **é** a ordem dos `if`. Não há como torná-la
 * estrutural, como a S66 fez com a posse e a S76 com a R4.2; o que resta é rede
 * de teste, e é por isso que os seis casos entram inteiros.
 */

const QUATORZE_COM_CURINGA = 'A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥ Q♥ 2♠>K A♥'
const AS_ATE_REI = 'A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥ Q♥ K♥'
const AS_ATE_REI_COM_CURINGA = 'A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥ Q♥ 2♠>K'
const DOIS_ATE_AS = '2♥ 3♥ 4♥ 5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥ Q♥ K♥ A♥'
const DOIS_ATE_AS_COM_CURINGA = '2♥ 3♥ 4♥ 5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥ Q♥ 2♠>K A♥'
const SETE_LIMPA = 'A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥'
const SETE_SUJA = '5♥ 6♥ 7♥ 2♥>8 9♥ 10♥ J♥'

function categoria(notacao: string) {
  return categoriaDe(valido(notacao))
}

describe('R8.3 — a precedência das quatro categorias', () => {
  it('CA-R8.3-1 — 14 cartas sem curinga são DE_1000, não LIMPA', () => {
    expect(categoria(QUATORZE)).toBe('DE_1000')
  })

  it('CA-R8.3-2 — 14 cartas com curinga são DE_1000, não SUJA', () => {
    // R8.4 — as especiais **admitem** curinga, e isso não é uma verificação: é o
    // que acontece quando o `if` do curinga vem por último. Este critério e o
    // CA-R8.3-4 são os únicos que reprovam se alguém subir a checagem de curinga
    // para o topo achando que simplifica.
    expect(categoria(QUATORZE_COM_CURINGA)).toBe('DE_1000')
  })

  it('CA-R8.3-3 — A até K sem curinga é DE_500', () => {
    expect(categoria(AS_ATE_REI)).toBe('DE_500')
  })

  it('CA-R8.3-4 — A até K com curinga continua DE_500 (R8.4)', () => {
    expect(categoria(AS_ATE_REI_COM_CURINGA)).toBe('DE_500')
  })

  it('CA-R8.3-5 — sete cartas sem curinga são LIMPA', () => {
    expect(categoria(SETE_LIMPA)).toBe('LIMPA')
  })

  it('CA-R8.3-6 — sete cartas com curinga são SUJA', () => {
    expect(categoria(SETE_SUJA)).toBe('SUJA')
  })

  it('CA-R8.3-7 — seis cartas não são canastra, e não têm categoria', () => {
    expect(categoria('5♥ 6♥ 7♥ 8♥ 9♥ 10♥')).toBeNull()
  })
})

describe('R8.6 — DE_500 e DE_1000 dependem da posição, não do tamanho', () => {
  /**
   * **S94 — `2…K-A` não é representável, e isso agora é decidido.**
   *
   * `criarJogo` fica com a primeira combinação de pontas que fecha trecho
   * contíguo (S42), e a ponta baixa vem primeiro. As mesmas treze cartas
   * descritas como `2…K-A` saem como `A…K`. Nenhum caminho produz o outro
   * arranjo: o `aumentar` revalida pelo mesmo `criarJogo` (S64), e o curinga
   * fazendo papel de Ás cai na mesma resolução.
   *
   * A ponta baixa **domina** — 500 contra 200, e as duas leituras alcançam 1000
   * depois —, então não se oferece a escolha. Estes dois critérios afirmam o que
   * é verificável, e a `CA-S94-1` mantém a leitura posicional da R8.6 viva com
   * um caso alcançável.
   */
  it('CA-R8.6-1 — as treze cartas de 2 ao Ás alto produzem A…K, e valem DE_500', () => {
    expect(valido(DOIS_ATE_AS).posicoes.map((posicao) => posicao.carta.valor)).toEqual([
      'A',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K',
    ])
    expect(janelaDe(valido(DOIS_ATE_AS))).toEqual({ inicio: 0, fim: 12 })
    expect(categoria(DOIS_ATE_AS)).toBe('DE_500')
  })

  it('CA-R8.6-2 — o mesmo conjunto com curinga continua DE_500 (R8.4)', () => {
    expect(categoria(DOIS_ATE_AS_COM_CURINGA)).toBe('DE_500')
  })

  it('CA-S94-1 — uma canastra terminada no Ás alto que não começa na casa 0 é LIMPA', () => {
    // O caso **alcançável** que impede a R8.6 de virar letra morta. Oito cartas
    // do 7 ao Ás: a ponta baixa não cabe — o Ás na casa 0 deixaria as casas de 1
    // a 5 vazias —, então ele é forçado ao alto e a janela é [6, 13]. Sete ou
    // mais, logo é canastra; não começa na casa 0, logo não é especial.
    const jogo = valido('7♥ 8♥ 9♥ 10♥ J♥ Q♥ K♥ A♥')

    expect(janelaDe(jogo)).toEqual({ inicio: 6, fim: 13 })
    expect(categoriaDe(jogo)).toBe('LIMPA')
  })

  it('CA-R8.6-3 — A até K mais o segundo Ás passa de DE_500 a DE_1000', () => {
    const deQuinhentos = valido(AS_ATE_REI)
    const resultado = aumentarJogo(deQuinhentos, [
      { tipo: 'Natural', carta: carta('COPAS', 'A', 2) },
    ])

    if (resultado.tipo !== 'valido') {
      throw new Error(`esperava aumentar, veio ${resultado.violados.join(', ')}`)
    }

    // A categoria é **derivada** (R8.5): o mesmo jogo, com identidade preservada
    // pela S63, muda de categoria porque o conteúdo mudou. Nada foi recalculado
    // à mão, porque não há campo a recalcular.
    expect(categoriaDe(deQuinhentos)).toBe('DE_500')
    expect(categoriaDe(resultado.jogo)).toBe('DE_1000')
    expect(resultado.jogo.id).toBe(deQuinhentos.id)
  })
})

describe('R8.1 — o limiar de sete cartas', () => {
  it('CA-S86-1 — um jogo de seis não é canastra', () => {
    const jogo = valido('5♥ 6♥ 7♥ 8♥ 9♥ 10♥')

    expect(categoriaDe(jogo)).toBeNull()
    expect(ehCanastra(jogo)).toBe(false)
  })

  it('CA-S86-2 — um jogo de sete é canastra', () => {
    // O par do limiar. Sem ele, um `categoriaDe` que devolvesse sempre `null`
    // passaria no critério acima de graça.
    const jogo = valido('5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥')

    expect(categoriaDe(jogo)).toBe('LIMPA')
    expect(ehCanastra(jogo)).toBe(true)
  })
})

describe('S87 — a janela lê o valor representado', () => {
  it('CA-S87-1 — A até K com o curinga na ponta do Rei é DE_500', () => {
    // A S55 outra vez: a ponta é lida pelo valor **representado**, não pelo
    // impresso. Sem isso, a janela terminaria na casa do `2` e a categoria seria
    // outra — e este é o caso em que a R8.4 e a R8.6 se cruzam.
    expect(janelaDe(valido(AS_ATE_REI_COM_CURINGA))).toEqual({ inicio: 0, fim: 12 })
    expect(categoria(AS_ATE_REI_COM_CURINGA)).toBe('DE_500')
  })
})

describe('R8.5 — a categoria é derivada, nunca um campo', () => {
  it('CA-S85-1 — o Jogo não tem campo de categoria', () => {
    // A R8.5 é a única regra do projeto que descreve uma **não-implementação**.
    // Ausência não aparece em `grep`, então ela vira asserção de forma: quatro
    // campos, e um quinto reprova. A Alternativa C da §2 morre aqui.
    expect(Object.keys(valido(SETE_LIMPA)).sort()).toEqual(['dono', 'id', 'naipe', 'posicoes'])
  })
})

/**
 * Critérios de aceite da spec 0009 §8.1 — regularizar o curinga.
 *
 * S97 — a operação é converter uma posição `Curinga` em `Natural` e passar tudo
 * pela porta única de sempre. As **três** condições da R6.5 caem dos
 * invariantes: mesmo naipe é I2, alcançar a casa do 2 é I3, repor a carta
 * substituída é I3 de novo. Nenhuma vira verificação nova, e é isso que o
 * gatilho do roadmap.md §3 pediu para medir.
 */

/** O jogo de sete com o `2♥` fazendo papel de `8♥` — o cenário da CA-R6.5-1. */
const SUJA_REGULARIZAVEL = '5♥ 6♥ 7♥ 2♥>8 9♥ 10♥ J♥'

function regularizado(base: string, novas: string) {
  return regularizarJogo(valido(base), cartas(novas))
}

describe('R6.5 e R6.6 — o curinga ocupa sua casa e deixa de ser curinga', () => {
  it('CA-R6.6-1 — o 2♥ vai para a casa 1 e o 8♥ reposto fecha o buraco', () => {
    const resultado = regularizado(SUJA_REGULARIZAVEL, 'A♥ 3♥ 4♥ 8♥')

    if (resultado.tipo !== 'valido') {
      throw new Error(`esperava regularizar, veio ${resultado.violados.join(', ')}`)
    }

    const jogo = resultado.jogo

    // Onze posições, da casa 0 à 10, e **nenhuma** curinga: o 2♥ passou a
    // natural na casa dele, e o 8♥ ocupou a casa que ele deixou.
    expect(jogo.posicoes).toHaveLength(11)
    expect(jogo.posicoes.filter((posicao) => posicao.tipo === 'Curinga')).toHaveLength(0)
    expect(jogo.posicoes.map((posicao) => posicao.carta.valor)).toEqual([
      'A',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
    ])
    expect(janelaDe(jogo)).toEqual({ inicio: 0, fim: 10 })

    // R8.5 — a categoria muda sem que nada seja recalculado, porque não há campo.
    expect(categoriaDe(valido(SUJA_REGULARIZAVEL))).toBe('SUJA')
    expect(categoriaDe(jogo)).toBe('LIMPA')
  })

  it('CA-R6.6-2 — as cartas que já estavam lá continuam na mesma ordem relativa', () => {
    const antes = valido(SUJA_REGULARIZAVEL)
    const resultado = regularizado(SUJA_REGULARIZAVEL, 'A♥ 3♥ 4♥ 8♥')

    if (resultado.tipo !== 'valido') {
      throw new Error('esperava regularizar')
    }

    // A R6.6 é exceção à R6.4 **só** para o curinga. Todas as outras posições
    // seguem na mesma ordem entre si — o que muda é onde o 2♥ está.
    const naturaisAntes = antes.posicoes
      .filter((posicao) => posicao.tipo === 'Natural')
      .map((posicao) => posicao.carta.id)
    const depois = resultado.jogo.posicoes.map((posicao) => posicao.carta.id)

    expect(depois.filter((id) => naturaisAntes.includes(id))).toEqual(naturaisAntes)
  })

  it('CA-S100-1 — o jogo regularizado preserva o id', () => {
    const antes = valido(SUJA_REGULARIZAVEL)
    const resultado = regularizado(SUJA_REGULARIZAVEL, 'A♥ 3♥ 4♥ 8♥')

    // A S63 na fatia que a H6 previu: a primeira posição do jogo muda — a janela
    // cresce para baixo — e mesmo assim é o mesmo jogo.
    expect(resultado.tipo === 'valido' ? resultado.jogo.id : '').toBe(antes.id)
  })

  it('CA-S99-1 — sem a carta reposta, a casa do curinga fica vazia (I3)', () => {
    const resultado = regularizado(SUJA_REGULARIZAVEL, 'A♥ 3♥ 4♥')

    expect(resultado.tipo === 'invalido' ? resultado.violados : []).toContain('I3')
  })

  it('CA-S98-2 — um curinga de outro naipe não se regulariza, e é a I2 que impede', () => {
    // A previsão do domain.md §2, cobrada: *"a impossibilidade é estrutural, não
    // uma verificação extra"*. Não existe checagem de naipe escrita em lugar
    // nenhum — o `2♠` virando `Natural` numa sequência de copas é uma carta de
    // espadas num jogo de copas, e a I2 recusa.
    const resultado = regularizado('5♥ 6♥ 7♥ 2♠>8 9♥ 10♥ J♥', 'A♥ 3♥ 4♥ 8♥')

    expect(resultado.tipo === 'invalido' ? resultado.violados : []).toContain('I2')
  })

  it('CA-S98-1 — com a casa 1 ocupada pela outra cópia, não há como regularizar', () => {
    // O fixture da CA-S55-1: as duas cópias do 2♥ no mesmo jogo, uma natural na
    // casa 1 e outra de curinga na casa 6. O curinga é do naipe **certo** e
    // mesmo assim a canastra é permanentemente suja — a casa dele está tomada.
    const resultado = regularizado('A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 2♥>7', '7♥ 8♥ 9♥')

    expect(resultado.tipo === 'invalido' ? resultado.violados : []).toContain('I5')
  })
})
