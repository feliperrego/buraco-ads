import type { Carta } from '../dominio/carta.ts'
import { criarJogo } from '../dominio/jogo.ts'
import type { Posicao } from '../dominio/jogo.ts'
import type { Jogador, JogadorId, Partida } from '../dominio/partida.ts'
import type { CartaBaixada, Comando, Resultado } from './comando.ts'

/**
 * M8 — comandos são funções puras: `aplicar(partida, comando)` devolve uma
 * partida nova, nunca muda a recebida.
 *
 * M9 vale em **toda** transição: a soma das cartas em mãos, jogos, monte, lixo e
 * mortos é sempre 104, sem `id` repetido. A H1 provou isso num estado; a partir
 * daqui é invariante de movimento.
 */
export function aplicar(partida: Partida, comando: Comando): Resultado {
  switch (comando.tipo) {
    case 'comprarDoMonte':
      return comprarDoMonte(partida)
    case 'descartar':
      return descartar(partida, comando.carta)
    case 'baixar':
      return baixar(partida, comando.cartas)
  }
}

/**
 * R6.1 — baixar é colocar um jogo novo na mesa, válido no momento em que é
 * baixado (R5).
 *
 * S44 — e só isso: a fase continua `Acao` e a vez não passa. É a R3.3 — "quantas
 * ações quiser, em qualquer ordem" —, e a diferença que a H2 não tinha como
 * mostrar, porque tinha um comando só na fase de ação.
 */
function baixar(partida: Partida, baixadas: readonly CartaBaixada[]): Resultado {
  if (partida.fase !== 'Acao') {
    return { tipo: 'recusa', motivo: 'R3.2: não se baixa antes de comprar' }
  }

  const quem = partida.jogadorDaVez
  const mao = partida.jogadores[quem].mao
  const pedidos = new Set(baixadas.map((baixada) => baixada.carta))

  if (pedidos.size !== baixadas.length) {
    return { tipo: 'recusa', motivo: 'R6.1: a mesma carta foi pedida duas vezes' }
  }

  // S52 — a conversão para posições acontece aqui, junto com a checagem de posse.
  // `criarJogo` recebe as posições prontas e passa a conferir, não a inferir.
  const posicoes: Posicao[] = []

  for (const baixada of baixadas) {
    const carta = mao.find((daMao) => daMao.id === baixada.carta)

    if (carta === undefined) {
      return { tipo: 'recusa', motivo: `R6.1: a carta ${baixada.carta} não está na mão` }
    }

    posicoes.push(
      baixada.representa === undefined
        ? { tipo: 'Natural', carta }
        : { tipo: 'Curinga', carta, representa: baixada.representa },
    )
  }

  const resultado = criarJogo(quem, posicoes)

  if (resultado.tipo !== 'valido') {
    return { tipo: 'recusa', motivo: `R5: jogo inválido — ${resultado.violados.join(', ')}` }
  }

  const jogador = partida.jogadores[quem]
  const atualizado: Jogador = {
    ...jogador,
    mao: mao.filter((daMao) => !pedidos.has(daMao.id)),
    jogos: [...jogador.jogos, resultado.jogo],
  }

  return {
    tipo: 'sucesso',
    partida: {
      ...partida,
      jogadores:
        quem === 0 ? [atualizado, partida.jogadores[1]] : [partida.jogadores[0], atualizado],
    },
  }
}

/** Substitui a mão de um jogador, preservando a tupla de dois. */
function comMao(
  partida: Partida,
  quem: JogadorId,
  mao: readonly Carta[],
): readonly [Jogador, Jogador] {
  const atualizado: Jogador = { ...partida.jogadores[quem], mao }

  return quem === 0 ? [atualizado, partida.jogadores[1]] : [partida.jogadores[0], atualizado]
}

function comprarDoMonte(partida: Partida): Resultado {
  if (partida.fase !== 'Compra') {
    return { tipo: 'recusa', motivo: 'R3.1: comprar só acontece na fase de compra' }
  }

  // S6 — o topo é monte[0].
  const topo = partida.monte[0]

  if (topo === undefined) {
    // A R4.6 converte um morto em monte e a R4.8 encerra a rodada. Nenhuma das
    // duas é da H2: aqui a recusa apenas impede um estado impossível.
    return { tipo: 'recusa', motivo: 'R4.6/R4.8: monte vazio, e a H2 não trata esse caso' }
  }

  const quem = partida.jogadorDaVez

  return {
    tipo: 'sucesso',
    partida: {
      ...partida,
      // S23 — entra no fim da mão, e a engine nunca reordena.
      jogadores: comMao(partida, quem, [...partida.jogadores[quem].mao, topo]),
      monte: partida.monte.slice(1),
      fase: 'Acao',
    },
  }
}

function descartar(partida: Partida, cartaId: string): Resultado {
  if (partida.fase !== 'Acao') {
    // R3.2 — não se descarta antes de comprar. Na interface isso é a ausência do
    // comando na lista (RF2.1); aqui é a recusa que protege a engine (S22).
    return { tipo: 'recusa', motivo: 'R3.2: descartar só depois de comprar' }
  }

  const quem = partida.jogadorDaVez
  const mao = partida.jogadores[quem].mao
  const carta = mao.find((daMao) => daMao.id === cartaId)

  if (carta === undefined) {
    return { tipo: 'recusa', motivo: `R7.1: a carta ${cartaId} não está na mão de quem joga` }
  }

  return {
    tipo: 'sucesso',
    partida: {
      ...partida,
      jogadores: comMao(
        partida,
        quem,
        mao.filter((daMao) => daMao.id !== cartaId),
      ),
      // S24 — lixo[0] é o topo, isto e' a carta descartada mais recentemente.
      lixo: [carta, ...partida.lixo],
      // R7.1 — o descarte encerra o turno.
      fase: 'Compra',
      jogadorDaVez: quem === 0 ? 1 : 0,
    },
  }
}
