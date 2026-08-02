import { describe, expect, it } from 'vitest'
import { aplicar } from '../comandos/aplicar.ts'
import type { Comando } from '../comandos/comando.ts'
import { iniciarPartida } from '../dominio/partida.ts'
import type { JogadorId, Partida } from '../dominio/partida.ts'
import { carta, cartas, construirPartida, naipeInteiro } from '../testing/construtor.ts'
import { movimentosValidos } from './movimentos-validos.ts'
import { visaoDe } from './visao-de.ts'

/**
 * Critérios de aceite da spec 0002 §6. Cada nome cita o `CA-` que valida, e cada
 * `CA-` cita a regra de rules.md de onde veio (RNF2.1).
 */

const SEMENTE = 7

function adversarioDe(jogador: JogadorId): JogadorId {
  return jogador === 0 ? 1 : 0
}

/** A visão de quem está jogando agora. */
function visaoDaVez(partida: Partida) {
  return visaoDe(partida, partida.jogadorDaVez)
}

/**
 * Leva a partida até a fase de ação pelo único caminho que a H2 conhece.
 *
 * Usar o próprio `comprarDoMonte` para montar o cenário é aceitável porque a
 * CA-R3.1-2 prova, em separado, que ele leva mesmo a `Acao`. Se aquele critério
 * cair, este cenário cai junto — e é o que se quer.
 */
function emAcao(semente = SEMENTE): Partida {
  const resultado = aplicar(iniciarPartida(semente), { tipo: 'comprarDoMonte' })

  if (resultado.tipo !== 'sucesso') {
    throw new Error(`cenário impossível: comprarDoMonte recusado — ${resultado.motivo}`)
  }

  return resultado.partida
}

describe('R4.1 — comprar do monte', () => {
  it('CA-R4.1-1 — na fase Compra com monte não vazio, comprarDoMonte está disponível', () => {
    const movimentos = movimentosValidos(visaoDaVez(iniciarPartida(SEMENTE)))

    expect(movimentos).toContainEqual({ tipo: 'comprarDoMonte' })
  })

  it('CA-R4.1-2 — na fase Acao, comprarDoMonte não está disponível', () => {
    const movimentos = movimentosValidos(visaoDaVez(emAcao()))

    // O par que trava a interpretação: sem este caso, devolver sempre a lista
    // completa passaria na CA-R4.1-1 e estaria errado.
    expect(movimentos).not.toContainEqual({ tipo: 'comprarDoMonte' })
  })
})

describe('R3.2 — não se joga antes de comprar', () => {
  it('CA-R3.2-1 — na fase Compra, nenhum descartar está disponível', () => {
    const movimentos = movimentosValidos(visaoDaVez(iniciarPartida(SEMENTE)))

    expect(movimentos.filter((comando) => comando.tipo === 'descartar')).toHaveLength(0)
  })
})

describe('M10 — a lista é a única fonte do que pode ser jogado', () => {
  it('CA-M10-1 — para quem não é da vez, a lista é vazia', () => {
    const partida = iniciarPartida(SEMENTE)
    const visaoDoOutro = visaoDe(partida, adversarioDe(partida.jogadorDaVez))

    // É daqui que a mesa inerte da S18 sai de graça: a interface só mostra o que
    // está na lista, então "não é sua vez" não precisa de código de interface.
    expect(movimentosValidos(visaoDoOutro)).toHaveLength(0)
  })

  it('CA-M10-2 — na fase Acao com 12 cartas, há 12 comandos descartar, um por carta', () => {
    const partida = emAcao()
    const mao = partida.jogadores[partida.jogadorDaVez].mao
    const movimentos = movimentosValidos(visaoDaVez(partida))

    const descartes = movimentos.filter((comando) => comando.tipo === 'descartar')

    expect(mao).toHaveLength(12)
    expect(descartes).toHaveLength(12)
    expect(descartes.map((comando) => comando.carta).sort()).toEqual(
      mao.map((carta) => carta.id).sort(),
    )
  })
})

/**
 * Critérios de aceite da spec 0004 §6.2 e §6.3 — a enumeração dos `baixar`.
 *
 * S46 — a enumeração é por **corridas de casas**, não por subconjuntos da mão. A
 * intuição de "todos os subconjuntos" dá `2^22`, e foi ela que assustou a T7. Mas
 * sequência é trecho contíguo de uma linha de 14 casas, e o espaço real é de
 * centenas.
 */

/** A mão de quem joga, com a fase de ação já posta. */
function emAcaoCom(notacao: string): Partida {
  return construirPartida({
    // A mão do adversário evita os naipes usados pelas mãos descritas acima: o
    // construtor recusa a mesma carta em dois lugares, e é ele que apanha um
    // fixture com colisão antes que ele vire um teste enganoso.
    maos: [cartas(notacao), cartas('A♠ 4♠ 7♠ 9♠ J♠ 2♠ 6♠ 10♠ Q♠ K♠ 3♠')],
    jogadorDaVez: 0,
    fase: 'Acao',
  })
}

function baixaresDe(partida: Partida): readonly Comando[] {
  return movimentosValidos(visaoDaVez(partida)).filter((comando) => comando.tipo === 'baixar')
}

/** As cartas de um `baixar`, ordenadas, para comparar sem depender da ordem. */
function cartasDo(comando: Comando | undefined): readonly string[] {
  if (comando?.tipo !== 'baixar') {
    throw new Error(`esperava um comando baixar, veio ${comando?.tipo ?? 'nenhum'}`)
  }

  return [...comando.cartas].sort()
}

function idsOrdenados(notacao: string): readonly string[] {
  return cartas(notacao)
    .map((carta) => carta.id)
    .sort()
}

/**
 * Os dois casos abaixo são a **forma** da enumeração, e a CA-S46-1 mede o custo
 * dela. Ficam sob o mesmo identificador de propósito: a T7 pediu um número, e um
 * número sobre uma enumeração cuja forma ninguém verificou não diz nada.
 */
describe('S46 — a enumeração por corridas de casas', () => {
  it('CA-S46-1 — uma mão com 5♥ 6♥ 7♥ oferece o baixar daquela sequência', () => {
    const baixares = baixaresDe(emAcaoCom('5♥ 6♥ 7♥ 8♠ K♦ 2♣'))

    expect(baixares).toHaveLength(1)
    expect(cartasDo(baixares[0])).toEqual(idsOrdenados('5♥ 6♥ 7♥'))
  })

  it('CA-S46-1 — uma corrida de quatro casas oferece os três trechos de tamanho >= 3', () => {
    // 5-6-7, 6-7-8 e 5-6-7-8. Não é subconjunto: 5-6-8 não aparece, porque a
    // casa do 7 ficaria vazia no meio. É a diferença entre `2^n` e `n²`.
    const baixares = baixaresDe(emAcaoCom('5♥ 6♥ 7♥ 8♥ K♦ 2♣'))

    expect(baixares).toHaveLength(3)
    expect(baixares.map((comando) => cartasDo(comando).length).sort()).toEqual([3, 3, 4])
  })
})

describe('S47 — cartas repetidas geram um comando só', () => {
  it('CA-S47-1 — com dois 5♥ na mão e 6♥ 7♥, há um baixar para 5-6-7, não dois', () => {
    const baixares = baixaresDe(emAcaoCom('5♥ 5♥ 6♥ 7♥'))

    // A M1 diz que as regras comparam só naipe e valor, então as cópias são
    // intercambiáveis: oferecer as duas seria ruído sem escolha real por trás.
    expect(baixares).toHaveLength(1)

    const escolhidas = cartasDo(baixares[0])

    // A carta canônica de cada casa é a de menor id (S47).
    expect(escolhidas).toContain('COPAS-5-1')
    expect(escolhidas).not.toContain('COPAS-5-2')
  })
})

describe('S45 — o baixar que esvaziaria a mão não é oferecido', () => {
  it('CA-S45-1 — com uma carta a mais na mão, o baixar aparece', () => {
    // A âncora positiva. Sem ela, uma enumeração que nunca oferece `baixar`
    // passaria no critério negativo abaixo de graça — foi o modo de falha
    // medido na H2, em CA-S1-1 e CA-S27-1.
    expect(baixaresDe(emAcaoCom('5♥ 6♥ 7♥ 8♠'))).toHaveLength(1)
  })

  it('CA-S45-1 — com a mão contendo só a sequência, o baixar não é oferecido', () => {
    // R7.1 exige o descarte, e a exceção é a batida (R7.3), que é a H10. Sem
    // esta guarda a partida alcançaria um estado sem especificação: mão vazia e
    // descarte obrigatório. Sai junto com a batida.
    expect(baixaresDe(emAcaoCom('5♥ 6♥ 7♥'))).toHaveLength(0)
  })
})

describe('T7 — o custo da enumeração, medido', () => {
  it('CA-S46-1 — com 22 cartas na mão, movimentosValidos responde em menos de 50 ms', () => {
    // O pior caso plausível: um naipe ocupando as catorze casas (treze valores
    // mais o segundo Ás) e oito casas de outro naipe. 22 cartas é a mão máxima —
    // onze da distribuição mais onze de um morto (R9.1).
    const mao = [
      ...naipeInteiro('COPAS'),
      carta('COPAS', 'A', 2),
      ...cartas('A♦ 2♦ 3♦ 4♦ 5♦ 6♦ 7♦ 8♦'),
    ]

    expect(mao).toHaveLength(22)

    const partida = construirPartida({
      maos: [mao, cartas('K♠ Q♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠')],
      jogadorDaVez: 0,
      fase: 'Acao',
    })
    const visao = visaoDaVez(partida)

    const inicio = performance.now()
    const movimentos = movimentosValidos(visao)
    const decorrido = performance.now() - inicio

    const baixares = movimentos.filter((comando) => comando.tipo === 'baixar')

    // O número de comandos importa mais que o tempo, e é ele que vai para o
    // roteiro: é quem diz se a T6 se sustenta ou se a consulta `validar` da
    // screens.md §3.1 vai ser preciso.
    console.log(
      `CA-S46-1: ${String(movimentos.length)} comandos (${String(baixares.length)} baixar) em ${decorrido.toFixed(2)} ms`,
    )

    expect(decorrido).toBeLessThan(50)
    expect(baixares.length).toBeGreaterThan(0)
  })
})
