import { describe, expect, it } from 'vitest'
import type { Carta } from '../dominio/carta.ts'
import { iniciarPartida } from '../dominio/partida.ts'
import type { FaseDoTurno, Partida } from '../dominio/partida.ts'
import type { Jogo, Posicao } from '../dominio/jogo.ts'
import { carta, cartas, construirPartida, outrasCartas, posicoes } from '../testing/construtor.ts'
import { aplicar } from './aplicar.ts'
import type { CartaBaixada, Comando } from './comando.ts'

/**
 * Critérios de aceite da spec 0002 §6.
 *
 * A M9 deixa de ser propriedade de um estado e passa a ser invariante de
 * movimento: toda transição preserva as 104 cartas. Comprar e descartar são as
 * duas operações mais simples do jogo, e é por isso que valem como piso — se a
 * conservação quebra aqui, nada mais complexo tem chance.
 */

const SEMENTE = 7

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

/** Desembrulha o resultado, falhando alto se o comando foi recusado. */
function aplicado(partida: Partida, comando: Comando): Partida {
  const resultado = aplicar(partida, comando)

  if (resultado.tipo !== 'sucesso') {
    throw new Error(`esperava sucesso em ${comando.tipo}, veio recusa: ${resultado.motivo}`)
  }

  return resultado.partida
}

describe('R3.1 — a compra move a fase', () => {
  it('CA-R3.1-2 — após comprarDoMonte, a fase é Acao', () => {
    const antes = iniciarPartida(SEMENTE)
    const depois = aplicado(antes, { tipo: 'comprarDoMonte' })

    expect(antes.fase).toBe('Compra')
    expect(depois.fase).toBe('Acao')
    expect(depois.jogadorDaVez).toBe(antes.jogadorDaVez)
    expect(depois.jogadores[antes.jogadorDaVez].mao).toHaveLength(12)
    expect(depois.monte).toHaveLength(59)
  })

  it('CA-R3.1-2 — a carta comprada sai do topo do monte e entra no fim da mão', () => {
    const antes = iniciarPartida(SEMENTE)
    const topo = antes.monte[0]
    const depois = aplicado(antes, { tipo: 'comprarDoMonte' })
    const mao = depois.jogadores[antes.jogadorDaVez].mao

    // S6 — monte[0] é o topo. S23 — a carta entra no fim, e a engine nunca
    // reordena a mão.
    expect(topo).toBeDefined()
    expect(mao[mao.length - 1]).toEqual(topo)
    expect(depois.monte[0]).toEqual(antes.monte[1])
  })
})

describe('M9 — conservação em toda transição', () => {
  it('CA-M9-4 — após comprarDoMonte, as 104 cartas se conservam', () => {
    const depois = aplicado(iniciarPartida(SEMENTE), { tipo: 'comprarDoMonte' })
    const ids = todasAsCartas(depois).map((carta) => carta.id)

    expect(ids).toHaveLength(104)
    expect(new Set(ids).size).toBe(104)
  })
})

describe('M8 — a partida recebida nunca é alterada', () => {
  it('CA-M9-4 — aplicar não muta a partida de entrada', () => {
    const antes = iniciarPartida(SEMENTE)
    const copia = JSON.parse(JSON.stringify(antes)) as Partida

    aplicado(antes, { tipo: 'comprarDoMonte' })

    expect(antes).toEqual(copia)
  })
})

/** A mão de quem está jogando agora. */
function maoDaVez(partida: Partida): readonly Carta[] {
  return partida.jogadores[partida.jogadorDaVez].mao
}

/** Compra e descarta, devolvendo a partida com a vez já passada. */
function turnoCompleto(partida: Partida, escolher: (mao: readonly Carta[]) => Carta): Partida {
  const comprou = aplicado(partida, { tipo: 'comprarDoMonte' })

  return aplicado(comprou, { tipo: 'descartar', carta: escolher(maoDaVez(comprou)).id })
}

function primeira(mao: readonly Carta[]): Carta {
  const carta = mao[0]

  if (carta === undefined) {
    throw new Error('cenário impossível: mão vazia')
  }

  return carta
}

describe('R7 — o descarte encerra o turno', () => {
  it('CA-R7.1-1 — descartar deixa 11 na mão e 1 no lixo', () => {
    const comprou = aplicado(iniciarPartida(SEMENTE), { tipo: 'comprarDoMonte' })
    const quem = comprou.jogadorDaVez
    const escolhida = primeira(maoDaVez(comprou))

    const depois = aplicado(comprou, { tipo: 'descartar', carta: escolhida.id })

    expect(comprou.jogadores[quem].mao).toHaveLength(12)
    expect(depois.jogadores[quem].mao).toHaveLength(11)
    expect(depois.lixo).toHaveLength(1)
    expect(depois.lixo[0]).toEqual(escolhida)
    expect(depois.jogadores[quem].mao).not.toContainEqual(escolhida)
  })

  it('CA-R7.1-2 — após descartar, a vez é do outro jogador e a fase volta a Compra', () => {
    const comprou = aplicado(iniciarPartida(SEMENTE), { tipo: 'comprarDoMonte' })
    const quem = comprou.jogadorDaVez

    const depois = aplicado(comprou, { tipo: 'descartar', carta: primeira(maoDaVez(comprou)).id })

    expect(depois.jogadorDaVez).not.toBe(quem)
    expect(depois.fase).toBe('Compra')
  })

  it('CA-R7.2-1 — a carta recém-comprada pode ser descartada no mesmo turno', () => {
    const antes = iniciarPartida(SEMENTE)
    const comprada = antes.monte[0]
    const comprou = aplicado(antes, { tipo: 'comprarDoMonte' })

    expect(comprada).toBeDefined()

    // A S23 põe a carta comprada no fim da mão; a R7.2 diz que ela é descartável
    // como qualquer outra. É o tipo de regra que uma implementação "esperta"
    // quebraria ao proteger a carta recém-adquirida.
    const depois = aplicado(comprou, { tipo: 'descartar', carta: comprada?.id ?? '' })

    expect(depois.lixo[0]).toEqual(comprada)
  })
})

describe('S24 — a ordem do lixo', () => {
  it('CA-S24-1 — após dois descartes, lixo[0] é o último descartado', () => {
    const primeiroTurno = turnoCompleto(iniciarPartida(SEMENTE), primeira)
    const descartadaPrimeiro = primeiroTurno.lixo[0]

    const segundoTurno = turnoCompleto(primeiroTurno, primeira)

    expect(segundoTurno.lixo).toHaveLength(2)
    expect(segundoTurno.lixo[1]).toEqual(descartadaPrimeiro)
    expect(segundoTurno.lixo[0]).not.toEqual(descartadaPrimeiro)
  })
})

describe('R3.2 e S22 — comandos que a engine recusa', () => {
  it('CA-R3.2-2 — descartar na fase Compra é recusado', () => {
    const partida = iniciarPartida(SEMENTE)
    const resultado = aplicar(partida, { tipo: 'descartar', carta: primeira(maoDaVez(partida)).id })

    expect(resultado.tipo).toBe('recusa')
  })

  it('CA-S22-1 — descartar carta que não está na mão é recusado', () => {
    const comprou = aplicado(iniciarPartida(SEMENTE), { tipo: 'comprarDoMonte' })
    const doMonte = comprou.monte[0]

    expect(doMonte).toBeDefined()

    // A RF2.1 garante que a interface nunca envia isto. A recusa protege a
    // engine de um chamador com bug — o caso da IA da H15 (S22).
    const resultado = aplicar(comprou, { tipo: 'descartar', carta: doMonte?.id ?? '' })

    expect(resultado.tipo).toBe('recusa')
  })
})

describe('M9 — conservação após o descarte', () => {
  it('CA-M9-5 — após descartar, as 104 cartas se conservam', () => {
    const depois = turnoCompleto(iniciarPartida(SEMENTE), primeira)
    const ids = todasAsCartas(depois).map((carta) => carta.id)

    expect(ids).toHaveLength(104)
    expect(new Set(ids).size).toBe(104)
  })
})

/**
 * Critérios de aceite da spec 0004 §6.2.
 *
 * A partir daqui o cenário vem do construtor validado de `engine/testing/`
 * (C4), e não de `iniciarPartida`: uma mão com sequência dentro é estado
 * específico, e alcançá-lo por sorteio faria o teste falhar por motivos que não
 * têm nada a ver com baixar.
 */

/** A mão do adversário sai do resto do baralho, nunca de uma lista escrita à mão. */
function comAdversarioDoResto(
  mao: readonly Carta[],
): readonly [readonly Carta[], readonly Carta[]] {
  return [mao, outrasCartas(mao, 11)]
}

const SEQUENCIA = '5♥ 6♥ 7♥'
const RESTO = '9♠ J♦ 4♣ K♠ 2♦ 8♣ 10♠ Q♦ 3♣'

function comSequenciaNaMao(): Partida {
  return construirPartida({
    maos: comAdversarioDoResto(cartas(`${SEQUENCIA} ${RESTO}`)),
    jogadorDaVez: 0,
    fase: 'Acao',
  })
}

/**
 * S51 — o comando passa a carregar o papel de cada carta. Sem `representa`, a
 * carta é natural, que é o caso inteiro da H4.
 */
function baixadasDe(notacao: string): readonly CartaBaixada[] {
  return cartas(notacao).map((carta) => ({ carta: carta.id }))
}

describe('R6.1 e R3.4 — baixar um jogo novo na mesa', () => {
  it('CA-R6.1-1 — as cartas saem da mão e o jogo aparece em meusJogos', () => {
    const antes = comSequenciaNaMao()
    const depois = aplicado(antes, { tipo: 'baixar', cartas: baixadasDe(SEQUENCIA) })

    expect(antes.jogadores[0].mao).toHaveLength(12)
    expect(depois.jogadores[0].mao).toHaveLength(9)

    for (const id of baixadasDe(SEQUENCIA)) {
      expect(depois.jogadores[0].mao.map((carta) => carta.id)).not.toContain(id)
    }

    const jogos = depois.jogadores[0].jogos

    expect(jogos).toHaveLength(1)
    expect(jogos[0]?.dono).toBe(0)
    expect(jogos[0]?.naipe).toBe('COPAS')
    expect(jogos[0]?.posicoes.map((posicao) => posicao.carta.valor)).toEqual(['5', '6', '7'])
  })

  it('CA-R6.1-2 — a fase continua Acao e a vez não passa', () => {
    const antes = comSequenciaNaMao()
    const depois = aplicado(antes, { tipo: 'baixar', cartas: baixadasDe(SEQUENCIA) })

    // S44/R3.3 — "quantas ações quiser, em qualquer ordem". Só o descarte
    // encerra o turno, e é a diferença que a H2 não tinha como mostrar.
    expect(depois.fase).toBe('Acao')
    expect(depois.jogadorDaVez).toBe(antes.jogadorDaVez)
  })

  it('CA-R6.1-3 — baixar cartas que não estão na mão é recusado', () => {
    // A carta existe no baralho e a sequência é válida; o que falha é a posse.
    // A RF2.1 garante que a interface nunca envia isto (S22).
    const resultado = aplicar(comSequenciaNaMao(), {
      tipo: 'baixar',
      cartas: baixadasDe('5♦ 6♦ 7♦'),
    })

    expect(resultado.tipo).toBe('recusa')
  })

  it('CA-R6.1-3 — baixar uma sequência inválida é recusado', () => {
    const resultado = aplicar(comSequenciaNaMao(), {
      tipo: 'baixar',
      cartas: baixadasDe('5♥ 7♥ 9♠'),
    })

    expect(resultado.tipo).toBe('recusa')
  })

  it('CA-R3.4-1 — sem nenhum jogo na mesa, o primeiro pode ser baixado sem mínimo', () => {
    const antes = comSequenciaNaMao()

    // R3.4 — não existe pontuação mínima para a primeira descida. O critério
    // parece vazio e não é: é a ausência de uma regra que quase todo baralho tem.
    expect(antes.jogadores[0].jogos).toHaveLength(0)

    const depois = aplicado(antes, { tipo: 'baixar', cartas: baixadasDe(SEQUENCIA) })

    expect(depois.jogadores[0].jogos).toHaveLength(1)
  })

  it('CA-R6.1-3 — baixar na fase de compra é recusado (R3.2)', () => {
    const naCompra = construirPartida({
      maos: comAdversarioDoResto(cartas(`${SEQUENCIA} ${RESTO}`)),
      jogadorDaVez: 0,
      fase: 'Compra',
    })

    expect(aplicar(naCompra, { tipo: 'baixar', cartas: baixadasDe(SEQUENCIA) }).tipo).toBe('recusa')
  })
})

describe('M9 — conservação após baixar', () => {
  it('CA-M9-7 — após baixar, as 104 cartas se conservam', () => {
    const depois = aplicado(comSequenciaNaMao(), { tipo: 'baixar', cartas: baixadasDe(SEQUENCIA) })
    const ids = todasAsCartas(depois).map((carta) => carta.id)

    // As cartas mudaram de lugar, não de existência: saíram da mão e entraram
    // nas posições de um jogo. É a primeira transição do projeto em que a M9
    // atravessa uma estrutura aninhada.
    expect(ids).toHaveLength(104)
    expect(new Set(ids).size).toBe(104)
  })

  it('CA-M9-7 — baixar não muta a partida de entrada', () => {
    const antes = comSequenciaNaMao()
    const copia = JSON.parse(JSON.stringify(antes)) as Partida

    aplicado(antes, { tipo: 'baixar', cartas: baixadasDe(SEQUENCIA) })

    expect(antes).toEqual(copia)
  })
})

/**
 * Critérios de aceite da spec 0005 §6.2 — baixar com curinga.
 */

const COM_CURINGA = '5♥ 6♥ 2♠'
const RESTO_H5 = 'K♦ 9♣ 3♣ J♦ 4♣ Q♦ 8♣ 10♦ A♣'

function comCuringaNaMao(): Partida {
  return construirPartida({
    maos: comAdversarioDoResto(cartas(`${COM_CURINGA} ${RESTO_H5}`)),
    jogadorDaVez: 0,
    fase: 'Acao',
  })
}

/** O `baixar` de `5♥ 6♥` com o `2♠` fazendo papel de `7♥` (S51). */
function baixarComCuringa(): readonly CartaBaixada[] {
  return [{ carta: 'COPAS-5-1' }, { carta: 'COPAS-6-1' }, { carta: 'ESPADAS-2-1', representa: '7' }]
}

describe('S51 — o comando carrega o papel de cada carta', () => {
  it('CA-S51-1 — baixar sem representa produz jogo só de posições naturais', () => {
    const depois = aplicado(comSequenciaNaMao(), { tipo: 'baixar', cartas: baixadasDe(SEQUENCIA) })
    const jogo = depois.jogadores[0].jogos[0]

    expect(jogo?.posicoes.filter((posicao) => posicao.tipo === 'Curinga')).toHaveLength(0)
  })

  it('CA-S51-2 — baixar com representa produz uma posição Curinga', () => {
    const depois = aplicado(comCuringaNaMao(), { tipo: 'baixar', cartas: baixarComCuringa() })
    const jogo = depois.jogadores[0].jogos[0]

    // O par decisivo da §2.1: as mesmas cartas, papéis diferentes, jogos
    // diferentes. É a razão pela qual o comando precisou crescer.
    expect(jogo?.naipe).toBe('COPAS')
    expect(jogo?.posicoes).toHaveLength(3)
    expect(jogo?.posicoes[2]?.tipo).toBe('Curinga')
    expect(depois.jogadores[0].mao).toHaveLength(9)
  })

  it('CA-S51-3 — baixar com representa numa carta que não está na mão é recusado', () => {
    const resultado = aplicar(comCuringaNaMao(), {
      tipo: 'baixar',
      cartas: [
        { carta: 'COPAS-5-1' },
        { carta: 'COPAS-6-1' },
        { carta: 'PAUS-2-1', representa: '7' },
      ],
    })

    expect(resultado.tipo).toBe('recusa')
  })
})

describe('M9 — conservação após baixar com curinga', () => {
  it('CA-M9-8 — após baixar com curinga, as 104 cartas se conservam', () => {
    const depois = aplicado(comCuringaNaMao(), { tipo: 'baixar', cartas: baixarComCuringa() })
    const ids = todasAsCartas(depois).map((carta) => carta.id)

    expect(ids).toHaveLength(104)
    expect(new Set(ids).size).toBe(104)
  })
})

/**
 * Critérios de aceite da spec 0006 §6.1 — o comando `aumentar`.
 *
 * S66 — a posse da R6.2 é **estrutural**: `aplicar` procura o jogo alvo somente
 * entre os jogos de quem está jogando. Um `id` do adversário não é recusado por
 * uma checagem de dono; ele simplesmente não é encontrado. Uma segunda checagem
 * — "achei o jogo, agora confiro o dono" — é uma linha a mais que um refactor
 * pode esquecer; uma busca na lista errada não tem como estar certa por acaso.
 */

const QUATORZE = 'A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥ Q♥ K♥ A♥'

/** Uma partida em ação com jogos **já na mesa**, dos dois lados. */
function comJogosNaMesa(
  mao: readonly Carta[],
  meus: readonly (readonly Posicao[])[],
  doAdversario: readonly (readonly Posicao[])[] = [],
): Partida {
  const naMesa = [...meus, ...doAdversario].flatMap((jogo) => jogo.map((posicao) => posicao.carta))

  return construirPartida({
    maos: [mao, outrasCartas([...mao, ...naMesa], 11)],
    jogos: [meus, doAdversario],
    jogadorDaVez: 0,
    fase: 'Acao',
  })
}

/** O jogo de um jogador, falhando alto em vez de devolver `undefined`. */
function jogoNaMesa(partida: Partida, quem: 0 | 1, indice = 0): Jogo {
  const jogo = partida.jogadores[quem].jogos[indice]

  if (jogo === undefined) {
    throw new Error(`cenário impossível: jogador ${String(quem)} sem jogo ${String(indice)}`)
  }

  return jogo
}

function aumentar(jogo: string, cartas: readonly CartaBaixada[]): Comando {
  return { tipo: 'aumentar', jogo, cartas }
}

describe('R6.2 — aumentar é acrescentar carta a um jogo próprio', () => {
  it('CA-R6.2-1 — a carta sai da mão e o jogo passa a ter quatro posições', () => {
    const antes = comJogosNaMesa(cartas('8♥ K♦ 9♣ 3♣'), [posicoes('5♥ 6♥ 7♥')])
    const alvo = jogoNaMesa(antes, 0)
    const depois = aplicado(antes, aumentar(alvo.id, [{ carta: 'COPAS-8-1' }]))

    expect(jogoNaMesa(antes, 0).posicoes).toHaveLength(3)
    expect(jogoNaMesa(depois, 0).posicoes).toHaveLength(4)
    expect(jogoNaMesa(depois, 0).posicoes.map((posicao) => posicao.carta.valor)).toEqual([
      '5',
      '6',
      '7',
      '8',
    ])
    expect(depois.jogadores[0].mao).toHaveLength(3)
    expect(depois.jogadores[0].mao.map((umaCarta) => umaCarta.id)).not.toContain('COPAS-8-1')
  })

  it('CA-R6.2-2 — aumentar um jogo do adversário é recusado, e o jogo dele não muda', () => {
    const antes = comJogosNaMesa(cartas('8♦ K♠ 9♣'), [], [posicoes('5♦ 6♦ 7♦')])
    const dele = jogoNaMesa(antes, 1)

    const resultado = aplicar(antes, aumentar(dele.id, [{ carta: 'OUROS-8-1' }]))

    // S66 — a recusa não vem de uma checagem de dono. O `id` existe, e mesmo
    // assim não é encontrado, porque a busca acontece na lista de quem joga.
    expect(resultado.tipo).toBe('recusa')
    expect(jogoNaMesa(antes, 1).posicoes).toHaveLength(3)
  })

  it('CA-R6.2-2 — aumentar um jogo que não existe é recusado pelo mesmo caminho', () => {
    const antes = comJogosNaMesa(cartas('8♥ K♦ 9♣'), [posicoes('5♥ 6♥ 7♥')])

    expect(aplicar(antes, aumentar('J0-INEXISTENTE', [{ carta: 'COPAS-8-1' }])).tipo).toBe('recusa')
  })

  it('CA-R6.2-1 — aumentar na fase de compra é recusado (R3.2)', () => {
    const emAcao = comJogosNaMesa(cartas('8♥ K♦ 9♣'), [posicoes('5♥ 6♥ 7♥')])
    const naCompra: Partida = { ...emAcao, fase: 'Compra' }

    expect(
      aplicar(naCompra, aumentar(jogoNaMesa(naCompra, 0).id, [{ carta: 'COPAS-8-1' }])).tipo,
    ).toBe('recusa')
  })
})

describe('R6.3 — sete cartas não fecham o jogo, catorze fecham', () => {
  it('CA-R6.3-1 — um jogo de sete posições aceita a oitava', () => {
    // R6.3 vista pelo tamanho (S62): a palavra "canastra" não existe no código
    // até a H8, e não precisa existir. O que a regra acrescenta à R5.3 não é um
    // limite novo — é a negação de uma regra que **não** existe, a de que a
    // canastra fecharia ao completar sete.
    const antes = comJogosNaMesa(cartas('Q♥ K♦ 9♣'), [posicoes('5♥ 6♥ 7♥ 8♥ 9♥ 10♥ J♥')])
    const depois = aplicado(antes, aumentar(jogoNaMesa(antes, 0).id, [{ carta: 'COPAS-Q-1' }]))

    expect(jogoNaMesa(antes, 0).posicoes).toHaveLength(7)
    expect(jogoNaMesa(depois, 0).posicoes).toHaveLength(8)
  })

  it('CA-R6.3-2 — um jogo de catorze posições recusa a décima quinta (I1)', () => {
    const antes = comJogosNaMesa([carta('COPAS', '5', 2), ...cartas('K♦ 9♣')], [posicoes(QUATORZE)])

    const resultado = aplicar(antes, aumentar(jogoNaMesa(antes, 0).id, [{ carta: 'COPAS-5-2' }]))

    expect(jogoNaMesa(antes, 0).posicoes).toHaveLength(14)
    expect(resultado.tipo).toBe('recusa')
    expect(resultado.tipo === 'recusa' ? resultado.motivo : '').toContain('I1')
  })
})

describe('R3.3 — quantas ações quiser, no mesmo turno', () => {
  it('CA-R3.3-1 — dois aumentar seguidos são aceitos e a vez não passa', () => {
    const antes = comJogosNaMesa(cartas('4♥ 8♥ K♦ 9♣'), [posicoes('5♥ 6♥ 7♥')])
    const alvo = jogoNaMesa(antes, 0).id

    const primeiro = aplicado(antes, aumentar(alvo, [{ carta: 'COPAS-8-1' }]))

    // O segundo comando aponta o **mesmo** `id`. É aqui que a S63 deixa de ser
    // teoria: com o `id` derivado do conteúdo, o jogo alvo teria sumido entre as
    // duas jogadas, e a R3.3 é exatamente o que autoriza as duas.
    const segundo = aplicado(primeiro, aumentar(alvo, [{ carta: 'COPAS-4-1' }]))

    expect(jogoNaMesa(segundo, 0).posicoes).toHaveLength(5)
    expect(jogoNaMesa(segundo, 0).posicoes.map((posicao) => posicao.carta.valor)).toEqual([
      '4',
      '5',
      '6',
      '7',
      '8',
    ])
    expect(segundo.fase).toBe('Acao')
    expect(segundo.jogadorDaVez).toBe(0)
    expect(segundo.jogadores[0].jogos).toHaveLength(1)
  })

  it('CA-S72-1 — as duas pontas num comando só são aceitas por aplicar', () => {
    const antes = comJogosNaMesa(cartas('4♥ 8♥ K♦ 9♣'), [posicoes('5♥ 6♥ 7♥')])

    const depois = aplicado(
      antes,
      aumentar(jogoNaMesa(antes, 0).id, [{ carta: 'COPAS-4-1' }, { carta: 'COPAS-8-1' }]),
    )

    expect(jogoNaMesa(depois, 0).posicoes).toHaveLength(5)
    expect(depois.jogadores[0].mao).toHaveLength(2)
  })
})

describe('M9 — conservação após aumentar', () => {
  it('CA-M9-9 — após aumentar, as 104 cartas se conservam sem id repetido', () => {
    const antes = comJogosNaMesa(cartas('8♥ K♦ 9♣ 3♣'), [posicoes('5♥ 6♥ 7♥')])
    const depois = aplicado(antes, aumentar(jogoNaMesa(antes, 0).id, [{ carta: 'COPAS-8-1' }]))
    const ids = todasAsCartas(depois).map((umaCarta) => umaCarta.id)

    expect(ids).toHaveLength(104)
    expect(new Set(ids).size).toBe(104)
  })

  it('CA-M9-9 — aumentar não muta a partida de entrada', () => {
    const antes = comJogosNaMesa(cartas('8♥ K♦ 9♣ 3♣'), [posicoes('5♥ 6♥ 7♥')])
    const copia = JSON.parse(JSON.stringify(antes)) as Partida

    aplicado(antes, aumentar(jogoNaMesa(antes, 0).id, [{ carta: 'COPAS-8-1' }]))

    expect(antes).toEqual(copia)
  })
})

/**
 * Critérios de aceite da spec 0007 §6.1 — o comando `pegarLixo`.
 *
 * S76 — o comando não tem carga, e é assim que a R4.2 ("todas, nunca uma parte")
 * e a R4.4 ("não há condição") deixam de poder ser esquecidas: elas são a
 * ausência de dois campos, não duas validações.
 */

const LIXO = 'K♠ 7♦ 3♣'
const MAO_H7 = '5♥ 6♥ 9♠ J♦ 4♣ Q♦ 8♣ 10♠ A♣ 2♦ 6♠'

/** Uma partida na fase de compra, com lixo. */
function comLixo(notacaoDaMao: string, notacaoDoLixo: string, fase: FaseDoTurno = 'Compra') {
  const mao = cartas(notacaoDaMao)
  const lixo = cartas(notacaoDoLixo)

  return construirPartida({
    maos: [mao, outrasCartas([...mao, ...lixo], 11)],
    lixo,
    jogadorDaVez: 0,
    fase,
  })
}

describe('R4.1 e R4.2 — pegar o lixo inteiro', () => {
  it('CA-R4.2-1 — todas as cartas do lixo vão para a mão, e o lixo fica vazio', () => {
    const antes = comLixo(MAO_H7, 'K♠ 7♦ 3♣ 9♥ Q♣')
    const depois = aplicado(antes, { tipo: 'pegarLixo' })

    expect(antes.jogadores[0].mao).toHaveLength(11)
    expect(antes.lixo).toHaveLength(5)

    // R4.2 — "todas as cartas dele. Nunca uma parte." Onze mais cinco.
    expect(depois.jogadores[0].mao).toHaveLength(16)
    expect(depois.lixo).toHaveLength(0)
  })

  it('CA-R3.1-3 — após pegarLixo, a fase é Acao e a vez não passa', () => {
    const antes = comLixo(MAO_H7, LIXO)
    const depois = aplicado(antes, { tipo: 'pegarLixo' })

    expect(depois.fase).toBe('Acao')
    expect(depois.jogadorDaVez).toBe(antes.jogadorDaVez)
  })

  it('CA-S77-1 — as cartas entram no fim da mão, na ordem do lixo', () => {
    const antes = comLixo(MAO_H7, LIXO)
    const depois = aplicado(antes, { tipo: 'pegarLixo' })

    // S77, Alternativa A — a pilha entra como está, topo primeiro. É a única
    // opção em que a engine literalmente não toca na ordem, prolongando a S23
    // sem exceção. A escolha é observável: a mão é renderizada nesta ordem.
    expect(depois.jogadores[0].mao.slice(0, 11)).toEqual(antes.jogadores[0].mao)
    expect(depois.jogadores[0].mao.slice(11).map((umaCarta) => umaCarta.id)).toEqual([
      'ESPADAS-K-1',
      'OUROS-7-1',
      'PAUS-3-1',
    ])
  })

  it('CA-R4.1-5 — depois de comprar do monte, pegar o lixo é recusado', () => {
    // A exclusividade da R4.1, e ela é a **aresta ausente** (S78): não existe
    // checagem de "já comprou". A fase saiu de `Compra` e a `Acao` não tem
    // aresta de volta para nenhuma das duas opções de compra.
    const comprou = aplicado(comLixo(MAO_H7, LIXO), { tipo: 'comprarDoMonte' })

    expect(comprou.fase).toBe('Acao')
    expect(aplicar(comprou, { tipo: 'pegarLixo' }).tipo).toBe('recusa')
  })

  it('CA-R4.5-1 — pegar o lixo vazio é recusado', () => {
    expect(aplicar(comLixo(MAO_H7, ''), { tipo: 'pegarLixo' }).tipo).toBe('recusa')
  })

  it('CA-R7.2-2 — uma carta que veio do lixo pode ser descartada no mesmo turno', () => {
    const pegou = aplicado(comLixo(MAO_H7, LIXO), { tipo: 'pegarLixo' })

    // A R7.2 nomeia este caso: "inclusive uma que tenha acabado de comprar **ou
    // de pegar do lixo** no mesmo turno". Uma implementação "esperta" que
    // protegesse a carta recém-adquirida quebraria a regra.
    const depois = aplicado(pegou, { tipo: 'descartar', carta: 'ESPADAS-K-1' })

    expect(depois.lixo).toHaveLength(1)
    expect(depois.lixo[0]?.id).toBe('ESPADAS-K-1')
    expect(depois.jogadores[0].mao).toHaveLength(13)
  })
})

describe('M9 — conservação após pegar o lixo', () => {
  it('CA-M9-10 — após pegarLixo, as 104 cartas se conservam sem id repetido', () => {
    const depois = aplicado(comLixo(MAO_H7, LIXO), { tipo: 'pegarLixo' })
    const ids = todasAsCartas(depois).map((umaCarta) => umaCarta.id)

    expect(ids).toHaveLength(104)
    expect(new Set(ids).size).toBe(104)
  })

  it('CA-M9-10 — pegarLixo não muta a partida de entrada', () => {
    const antes = comLixo(MAO_H7, LIXO)
    const copia = JSON.parse(JSON.stringify(antes)) as Partida

    aplicado(antes, { tipo: 'pegarLixo' })

    expect(antes).toEqual(copia)
  })
})
