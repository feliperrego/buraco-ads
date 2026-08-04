import { describe, expect, it } from 'vitest'
import { bateCom } from './bate-com.ts'
import { movimentosValidos } from './movimentos-validos.ts'
import { visaoDe } from './visao-de.ts'
import { aplicar } from '../comandos/aplicar.ts'
import type { Comando } from '../comandos/comando.ts'
import { criarAleatorio } from '../aleatorio/criar-aleatorio.ts'
import { iniciarPartida } from '../dominio/partida.ts'
import type { JogadorId, Morto, Partida } from '../dominio/partida.ts'
import type { Carta } from '../dominio/carta.ts'
import type { Posicao } from '../dominio/jogo.ts'
import { cartas, construirPartida, outrasCartas, posicoes } from '../testing/construtor.ts'

/**
 * Critérios de aceite da spec 0015 §8 — a consulta da S145.
 *
 * O que ela responde é uma pergunta de **regra**: este comando encerra a rodada
 * pela R10.3? A `ia/` precisa dela por causa da IA10, e não consegue respondê-la
 * sozinha — a S115 já mediu que a resposta depende do jogo **resultante**.
 */

const LIMPA_NA_MESA = posicoes('5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥')
const SUJA_NA_MESA = posicoes('5♥ 6♥ 7♥ 8♥ 9♥ 10♥ 2♠>J')

/**
 * Um estado com os mortos já resolvidos, como o `comMortos` da suíte de
 * `movimentosValidos`. As cartas do morto reclamado voltam ao monte para a M9
 * continuar valendo.
 */
function comMortos(
  mao: readonly Carta[],
  meus: readonly (readonly Posicao[])[],
  donos: readonly [JogadorId | null, JogadorId | null],
): Partida {
  const naMesa = meus.flat().map((posicao) => posicao.carta)
  const base = construirPartida({
    maos: [mao, outrasCartas([...mao, ...naMesa], 11)],
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

function visaoDaVez(partida: Partida) {
  return visaoDe(partida, partida.jogadorDaVez)
}

const BAIXAR_TRINCA: Comando = {
  tipo: 'baixar',
  cartas: cartas('5♠ 6♠ 7♠').map((carta) => ({ carta: carta.id })),
}

describe('S145 — bateCom responde sobre o resultado do comando', () => {
  it('CA-S145-1 — com canastra limpa e morto pego, o baixar que zera a mão bate', () => {
    const partida = comMortos(cartas('5♠ 6♠ 7♠'), [LIMPA_NA_MESA], [0, 1])

    expect(bateCom(visaoDaVez(partida), BAIXAR_TRINCA)).toBe(true)
  })

  it('CA-S145-2 — no mesmo estado com canastra suja, nenhum comando bate', () => {
    // Muda **só** o curinga do jogo na mesa, como na CA-R10.1-2.
    const partida = comMortos(cartas('5♠ 6♠ 7♠'), [SUJA_NA_MESA], [0, 1])
    const visao = visaoDaVez(partida)

    expect(bateCom(visao, BAIXAR_TRINCA)).toBe(false)

    for (const comando of movimentosValidos(visao)) {
      expect(bateCom(visao, comando), `${comando.tipo} não deveria bater`).toBe(false)
    }
  })

  it('CA-S145-2 — com morto ainda por pegar, zerar a mão não é batida', () => {
    // R9.2 antes de R10.1 (S111): quem zera a mão com morto na mesa pega o morto,
    // e a rodada continua. `aplicar` decide isso pela ordem; aqui a consulta
    // precisa dizer o mesmo, e é a `CA-S145-3` que cobra a concordância.
    const partida = comMortos(cartas('5♠ 6♠ 7♠'), [LIMPA_NA_MESA], [0, null])

    expect(bateCom(visaoDaVez(partida), BAIXAR_TRINCA)).toBe(false)
  })
})

/** Joga a partida inteira com escolhas sorteadas, conferindo `bateCom` a cada passo. */
function conferirPartida(
  semente: number,
  inicial?: Partida,
): { comandos: number; batidas: number } {
  const aleatorio = criarAleatorio(semente)
  let partida = inicial ?? iniciarPartida(semente)
  let comandos = 0
  let batidas = 0

  for (let passo = 0; passo < 2000 && partida.fase !== 'RodadaEncerrada'; passo += 1) {
    const visao = visaoDaVez(partida)
    const movimentos = movimentosValidos(visao)

    if (movimentos.length === 0) {
      break
    }

    // A conferência é sobre **todos** os comandos oferecidos, não só o jogado:
    // o defeito que a S140 pegou vivia num comando que a partida não escolheu.
    const previstos = movimentos.map((comando) => bateCom(visao, comando))
    const escolhido = movimentos[Math.floor(aleatorio() * movimentos.length)]

    if (escolhido === undefined) {
      break
    }

    const quem = partida.jogadorDaVez
    const resultado = aplicar(partida, escolhido)

    if (resultado.tipo !== 'sucesso') {
      throw new Error(`comando oferecido e recusado: ${escolhido.tipo} — ${resultado.motivo}`)
    }

    const bateuDeFato =
      resultado.partida.fase === 'RodadaEncerrada' &&
      resultado.partida.jogadores[quem].mao.length === 0

    expect(
      previstos[movimentos.indexOf(escolhido)],
      `${escolhido.tipo} na semente ${String(semente)}`,
    ).toBe(bateuDeFato)

    comandos += movimentos.length
    batidas += previstos.filter(Boolean).length
    partida = resultado.partida
  }

  return { comandos, batidas }
}

describe('S145 — a duplicação da construção vive sob medição', () => {
  it('CA-S145-3 — em 30 partidas, bateCom concorda com o que aplicar faz', () => {
    let comandos = 0
    let batidas = 0

    for (let semente = 1; semente <= 30; semente += 1) {
      const medido = conferirPartida(semente)

      comandos += medido.comandos
      batidas += medido.batidas
    }

    console.log(`CA-S145-3: ${String(comandos)} comandos conferidos, ${String(batidas)} batidas`)

    expect(comandos).toBeGreaterThan(1000)

    // Âncora positiva, e ela **não** vem das partidas acima: medido, a batida
    // aparece em 1 de 60 partidas sorteadas, então esperá-la do acaso deixaria a
    // concordância ser "false === false" repetido 250 mil vezes — que passa com
    // `bateCom` devolvendo sempre `false`. É a armadilha da CA-S1-1 e da
    // CA-S27-1, e o conserto é começar de um estado onde a batida está à mão.
    const daBatida = conferirPartida(1, comMortos(cartas('5♠ 6♠ 7♠'), [LIMPA_NA_MESA], [0, 1]))

    expect(daBatida.batidas).toBeGreaterThan(0)
  })

  it('CA-S145-4 — a rodada encerrada pelo monte esgotado (R4.8) não é batida', () => {
    const mao = cartas('5♠ 6♠ K♦')
    const base = comMortos(mao, [LIMPA_NA_MESA], [0, 1])

    // Monte vazio, com as cartas dele estacionadas na mão do adversário para a
    // M9 continuar valendo. Sem monte e sem morto, o descarte encerra a rodada
    // pela R4.8 — e a mão de quem jogou **não** está vazia.
    const partida: Partida = {
      ...base,
      monte: [],
      jogadores: [
        base.jogadores[0],
        { ...base.jogadores[1], mao: [...base.jogadores[1].mao, ...base.monte] },
      ],
    }

    const descarte: Comando = { tipo: 'descartar', carta: 'OUROS-K-1' }
    const resultado = aplicar(partida, descarte)

    expect(resultado.tipo).toBe('sucesso')

    if (resultado.tipo === 'sucesso') {
      expect(resultado.partida.fase).toBe('RodadaEncerrada')
    }

    expect(bateCom(visaoDaVez(partida), descarte)).toBe(false)
  })
})
