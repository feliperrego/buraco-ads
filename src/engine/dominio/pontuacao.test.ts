import { describe, expect, it } from 'vitest'
import type { Posicao } from './jogo.ts'
import type { JogadorId, Morto, Partida } from './partida.ts'
import { cartas, construirPartida, outrasCartas, posicoes } from '../testing/construtor.ts'
import type { Carta } from './carta.ts'
import { apurar, totalDe, valorDaCarta } from './pontuacao.ts'

/**
 * Critérios de aceite da spec 0012 §8.1 e §8.2 — a apuração da rodada.
 *
 * S120 — a apuração é derivada do estado, e não de eventos. Todo teste aqui
 * monta um estado com o construtor da C4 e pergunta quanto vale; nenhum deles
 * precisa saber como o estado chegou ali, e isso é o que a decisão afirma.
 */

/**
 * Uma partida com os jogos e a mão do humano descritos, e os mortos no estado
 * pedido — `null` para intacto, `JogadorId` para quem o pegou.
 *
 * As cartas do morto reclamado voltam para o monte, pelo mesmo motivo da H11: a
 * M9 exige que as 104 continuem existindo.
 */
function comEstado(
  mao: readonly Carta[],
  meus: readonly (readonly Posicao[])[],
  donos: readonly [JogadorId | null, JogadorId | null] = [0, 1],
  maoDoAdversario = 11,
): Partida {
  const naMesa = meus.flat().map((posicao) => posicao.carta)
  const base = construirPartida({
    maos: [mao, outrasCartas([...mao, ...naMesa], maoDoAdversario)],
    jogos: [meus, []],
    jogadorDaVez: 0,
    fase: 'Acao',
  })

  const reclamar = (morto: Morto, dono: JogadorId | null): Morto =>
    dono === null ? morto : { ...morto, cartas: [], destino: dono }

  return {
    ...base,
    mortos: [reclamar(base.mortos[0], donos[0]), reclamar(base.mortos[1], donos[1])],
    monte: [
      ...base.monte,
      ...(donos[0] === null ? [] : base.mortos[0].cartas),
      ...(donos[1] === null ? [] : base.mortos[1].cartas),
    ],
  }
}

/** A canastra limpa de 5♥ a J♥ — 7 cartas, 200 de categoria e 55 de valor. */
const LIMPA_5_A_J = posicoes('5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥')

describe('R11.2 — o valor individual das cartas', () => {
  it('CA-R11.2-1 — Ás vale 15, figuras e dezenas valem 10, do 3 ao 7 valem 5', () => {
    expect(valorDaCarta('A')).toBe(15)
    expect(valorDaCarta('K')).toBe(10)
    expect(valorDaCarta('10')).toBe(10)
    expect(valorDaCarta('8')).toBe(10)
    expect(valorDaCarta('7')).toBe(5)
    expect(valorDaCarta('3')).toBe(5)
  })

  it('CA-S124-1 — o 2 vale 10, e o valor não depende do papel', () => {
    // S124 — o valor é propriedade da carta (M1); "curinga" é papel (M2). A
    // função nem recebe o papel, e é essa a forma da decisão: não há por onde
    // um curinga valer diferente.
    expect(valorDaCarta('2')).toBe(10)
  })
})

describe('R11.1 e R11.3 — canastras, mesa e mão', () => {
  it('CA-R11.1-1 — uma canastra de cada categoria conta uma em cada e soma 1800', () => {
    const partida = comEstado(cartas('3♦'), [
      posicoes('A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥ Q♥ K♥ A♥'),
      posicoes('A♠ 2♠ 3♠ 4♠ 5♠ 6♠ 7♠ 8♠ 9♠ 10♠ J♠ Q♠ K♠'),
      posicoes('5♣ 6♣ 7♣ 8♣ 9♣ 10♣ J♣'),
      posicoes('5♦ 6♦ 7♦ 8♦ 9♦ 10♦ 2♣>J'),
    ])
    const [minha] = apurar(partida)

    expect(minha.canastras).toEqual({ DE_1000: 1, DE_500: 1, LIMPA: 1, SUJA: 1 })
    expect(minha.pontosDeCanastra).toBe(1800)
  })

  it('CA-R11.3-1 — as mesmas cartas valem positivo na mesa e negativo na mão', () => {
    // A♥ K♥ 5♥ = 15 + 10 + 5 = 30, e o sinal é a única diferença.
    const naMao = apurar(comEstado(cartas('A♥ K♥ 5♥'), []))[0]

    expect(naMao.cartasNaMao).toBe(-30)
    expect(naMao.cartasNaMesa).toBe(0)

    const naMesa = apurar(comEstado(cartas('3♦'), [posicoes('A♥ 2♥ 3♥')]))[0]

    // A + 2 + 3 = 15 + 10 + 5 = 30, o mesmo total, com o sinal trocado.
    expect(naMesa.cartasNaMesa).toBe(30)
    expect(naMesa.cartasNaMao).toBe(-5)
  })

  it('CA-S123-1 — as cartas dentro da canastra contam também pelo valor', () => {
    // A decisão de domínio da fatia: a R11.1 premia a estrutura e a R11.3 conta
    // o material. 200 da categoria mais 55 das sete cartas.
    const [minha] = apurar(comEstado([], [LIMPA_5_A_J]))

    expect(minha.pontosDeCanastra).toBe(200)
    expect(minha.cartasNaMesa).toBe(55)
    expect(totalDe(minha)).toBe(255 + 100)
  })
})

describe('R11.4, R11.5 e R11.6 — bônus, penalidade e saldo negativo', () => {
  it('CA-R11.4-1 — quem bateu recebe +100, e o adversário não', () => {
    const [minha, dele] = apurar(comEstado([], [LIMPA_5_A_J]))

    expect(minha.bonusDeBatida).toBe(100)
    expect(dele.bonusDeBatida).toBe(0)
  })

  it('CA-R11.5.2-1 — R9.6: quem terminou sem morto leva -100', () => {
    // R9.6 remete à R11.5, e é aqui que ela vira número: terminar a rodada sem
    // ter pegado morto acarreta a penalidade.
    // R11.5.2 — o adversário levou os dois, e a penalidade se aplica normalmente.
    const [minha, dele] = apurar(comEstado(cartas('5♥'), [], [1, 1]))

    expect(minha.penalidadeDeMorto).toBe(-100)
    expect(dele.penalidadeDeMorto).toBe(0)
  })

  it('CA-R11.6-1 — sem jogos, com cartas caras na mão e sem morto, o saldo é negativo', () => {
    const [minha] = apurar(comEstado(cartas('A♥ A♠ K♥ K♠'), [], [1, 1]))

    // -50 das cartas, -100 da penalidade.
    expect(totalDe(minha)).toBe(-150)
  })

  it('CA-S121-1 — o total é a soma dos cinco números, e não existe campo total', () => {
    // O 3♦ e não o 5♥: o construtor da C4 recusou a primeira escrita, porque
    // o 5♥ já está na canastra. É a quinta colisão de fixture que ele pega.
    const [minha] = apurar(comEstado(cartas('3♦'), [LIMPA_5_A_J]))
    const soma =
      minha.pontosDeCanastra +
      minha.cartasNaMesa +
      minha.cartasNaMao +
      minha.bonusDeBatida +
      minha.penalidadeDeMorto

    expect(totalDe(minha)).toBe(soma)
    expect(Object.keys(minha)).not.toContain('total')
  })
})

describe('S121 — os sinais e o zero', () => {
  it('CA-S121-2 — a mão vazia dá 0, e não -0', () => {
    const [minha] = apurar(comEstado([], [LIMPA_5_A_J]))

    // Não é preciosismo. `expect(-0).toBe(0)` reprova — o Vitest compara com
    // `Object.is` —, e `JSON.stringify(-0)` devolve `"0"`, o que muda o valor no
    // trajeto que a RNF1.2 exige preservar.
    expect(Object.is(minha.cartasNaMao, -0)).toBe(false)
    expect(minha.cartasNaMao).toBe(0)
    // A âncora: com cartas na mão, o sinal continua negativo.
    expect(apurar(comEstado(cartas('A♦'), [LIMPA_5_A_J]))[0].cartasNaMao).toBe(-15)
  })
})

describe('R8.5 — a categoria é recalculada, e a apuração acompanha', () => {
  it('CA-R8.5-1 — a canastra suja regularizada vale 200 na mesma rodada', () => {
    const suja = apurar(comEstado([], [posicoes('5♥ 6♥ 7♥ 8♥ 9♥ 10♥ 2♠>J')]))[0]

    expect(suja.canastras.SUJA).toBe(1)
    expect(suja.pontosDeCanastra).toBe(100)

    // O mesmo jogo com o curinga regularizado — o J♥ no lugar do 2♠.
    const limpa = apurar(comEstado([], [LIMPA_5_A_J]))[0]

    expect(limpa.canastras.LIMPA).toBe(1)
    expect(limpa.pontosDeCanastra).toBe(200)
  })
})

/**
 * Critério de aceite da spec 0014 §8.3 — a R11.5.1.
 *
 * S141 — a mesma derivação da R10.1.1, pelo outro lado. Quem ficou sem morto
 * porque um virou monte não é punido; quem ficou sem porque o adversário levou
 * os dois é, e a `CA-R11.5.2-1` acima é a âncora que separa os dois casos.
 */
describe('R11.5.1 — sem penalidade para quem não teve chance de pegar morto', () => {
  it('CA-S141-1 — com um morto convertido em monte, não há penalidade', () => {
    const base = comEstado(cartas('5♥'), [], [1, 1])
    const comConversao: Partida = {
      ...base,
      mortos: [{ ...base.mortos[0], destino: 'Monte' }, base.mortos[1]],
    }
    const [minha] = apurar(comConversao)

    expect(minha.penalidadeDeMorto).toBe(0)
    // A âncora, no mesmo estado sem a conversão: a R11.5.2 continua punindo.
    expect(apurar(base)[0].penalidadeDeMorto).toBe(-100)
  })
})
