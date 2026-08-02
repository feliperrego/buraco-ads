import { describe, expect, it } from 'vitest'
import { aplicar } from '../comandos/aplicar.ts'
import type { Comando } from '../comandos/comando.ts'
import { iniciarPartida } from '../dominio/partida.ts'
import type { JogadorId, Partida } from '../dominio/partida.ts'
import {
  carta,
  cartas,
  construirPartida,
  naipeInteiro,
  outrasCartas,
} from '../testing/construtor.ts'
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
  const mao = cartas(notacao)

  // A mão do adversário sai do que sobrou, e não de uma lista escrita à mão: o
  // construtor recusa a mesma carta em dois lugares, e três fixtures desta
  // suíte já bateram nele antes de virarem teste enganoso.
  return construirPartida({
    maos: [mao, outrasCartas(mao, 11)],
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

  return comando.cartas.map((baixada) => baixada.carta).sort()
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
 *
 * As mãos perderam o `2` na H5, e o motivo importa: com um `2` na mão, estes
 * dois passariam a contar também os `baixar` com curinga, e deixariam de falar
 * da enumeração natural que eles existem para descrever. A contagem com curinga
 * é da CA-S56-1 e da CA-S59-1.
 */
describe('S46 — a enumeração por corridas de casas', () => {
  it('CA-S46-1 — uma mão com 5♥ 6♥ 7♥ oferece o baixar daquela sequência', () => {
    const baixares = baixaresDe(emAcaoCom('5♥ 6♥ 7♥ 8♠ K♦ 9♣'))

    expect(baixares).toHaveLength(1)
    expect(cartasDo(baixares[0])).toEqual(idsOrdenados('5♥ 6♥ 7♥'))
  })

  it('CA-S46-1 — uma corrida de quatro casas oferece os três trechos de tamanho >= 3', () => {
    // 5-6-7, 6-7-8 e 5-6-7-8. Não é subconjunto: 5-6-8 não aparece, porque a
    // casa do 7 ficaria vazia no meio. É a diferença entre `2^n` e `n²`.
    const baixares = baixaresDe(emAcaoCom('5♥ 6♥ 7♥ 8♥ K♦ 9♣'))

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
      maos: [mao, outrasCartas(mao, 11)],
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

/**
 * Critérios de aceite da spec 0005 §6.2 e §6.3 — a enumeração com curinga.
 *
 * S56 — a S47 continua valendo **dentro** do naipe e deixa de valer entre
 * naipes: um `2♠` e um `2♦` como curinga numa sequência de copas valem o mesmo
 * hoje e valem diferente na H9, porque a R6.5 só deixa regularizar o `2` do
 * naipe da própria sequência.
 */

function comCuringa(comando: Comando): readonly string[] {
  if (comando.tipo !== 'baixar') {
    return []
  }

  return comando.cartas.flatMap((baixada) =>
    baixada.representa === undefined ? [] : [baixada.carta],
  )
}

describe('S56 — um comando por naipe de 2', () => {
  it('CA-S56-1 — com 2♠ e 2♦ na mão e 5♥ 6♥, há dois baixares, um por naipe de 2', () => {
    const baixares = baixaresDe(emAcaoCom('5♥ 6♥ 2♠ 2♦ K♥ 9♣'))
    const curingas = baixares.map(comCuringa).flat()

    // Duas jogadas diferentes, e não duas cópias da mesma: a escolha de qual 2
    // usar é tática, porque só o do naipe da sequência é regularizável (R6.5).
    expect(curingas).toContain('ESPADAS-2-1')
    expect(curingas).toContain('OUROS-2-1')
  })

  it('CA-S56-2 — com as duas cópias de 2♠ e 5♥ 6♥, há um comando por trecho, com a de menor id', () => {
    const curingas = baixaresDe(emAcaoCom('5♥ 6♥ 2♠ 2♠ K♥ 9♣')).map(comCuringa).flat()

    // Dentro do naipe a S47 continua: as cópias são intercambiáveis.
    expect(curingas).toContain('ESPADAS-2-1')
    expect(curingas).not.toContain('ESPADAS-2-2')
  })
})

describe('S57 — o curinga nas três formas', () => {
  it('CA-R5.5-1 — a enumeração oferece o curinga tapando buraco e nas duas pontas', () => {
    // Casas 4, 5, 7 e 8 ocupadas, com um 2♠ de curinga. As três formas da S57
    // aparecem numa mão só: [2♠→4] estende à esquerda, [2♠→7] tapa o buraco
    // entre 6♥ e 8♥, e [2♠→10] estende à direita.
    //
    // O primeiro fixture que escrevi — 5♥ e 7♥ apenas — só produzia a forma do
    // buraco: estender ponta exige **dois** naturais vizinhos, e ali não havia.
    const papeis = baixaresDe(emAcaoCom('5♥ 6♥ 8♥ 9♥ 2♠ K♦ 3♣'))
      .filter((comando) => comCuringa(comando).length === 1)
      .map((comando) => (comando.tipo === 'baixar' ? comando.cartas : []))
      .map((cartas) => cartas.find((baixada) => baixada.representa !== undefined)?.representa)

    expect(papeis).toContain('4')
    expect(papeis).toContain('7')
    expect(papeis).toContain('10')
  })
})

describe('S59 — o custo da enumeração com curinga, medido', () => {
  it('CA-S59-1 — com 22 cartas na mão, movimentosValidos responde em menos de 50 ms', () => {
    // O pior caso **medido**, e ele não é o que eu tinha escrito primeiro. Uma
    // mão com naipes esparsos rende menos que a da CA-S46-1: o que explode a
    // enumeração é um naipe **quase cheio, com um buraco só** — aqui, copas sem
    // o 7 —, porque aí quase toda janela tem exatamente uma lacuna, e cada
    // lacuna rende um comando por naipe de 2 disponível.
    //
    // Foi escolhido por sondagem entre cinco formatos de mão, não por
    // argumento. É o maior entre os cinco, não um máximo provado.
    const mao = [
      ...cartas('A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 8♥ 9♥ 10♥ J♥ Q♥ K♥'),
      carta('COPAS', 'A', 2),
      ...cartas('2♦ 2♠ 2♣ A♦ 3♦ 4♦ 5♦ 6♦ 7♦'),
    ]

    expect(mao).toHaveLength(22)

    const partida = construirPartida({
      maos: [mao, outrasCartas(mao, 11)],
      jogadorDaVez: 0,
      fase: 'Acao',
    })

    const inicio = performance.now()
    const movimentos = movimentosValidos(visaoDaVez(partida))
    const decorrido = performance.now() - inicio

    const baixares = movimentos.filter((comando) => comando.tipo === 'baixar')
    const comCuringas = baixares.filter((comando) => comCuringa(comando).length === 1)

    // O número importa mais que o tempo: é ele que diz se a T6 se sustenta. Os
    // 99 baixares da CA-S46-1 são a linha de base, e a H5 multiplica o espaço.
    console.log(
      `CA-S59-1: ${String(movimentos.length)} comandos, ${String(baixares.length)} baixar ` +
        `(${String(comCuringas.length)} com curinga) em ${decorrido.toFixed(2)} ms`,
    )

    expect(decorrido).toBeLessThan(50)
    expect(comCuringas.length).toBeGreaterThan(0)
  })
})
