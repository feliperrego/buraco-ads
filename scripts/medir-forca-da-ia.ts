/**
 * S151 — a força relativa da heurística contra a aleatória (E6, IA11).
 *
 * Roda fora do `npm run verificar`: 600 partidas custam minutos, e o
 * `verificar` fecha em segundos e roda antes de cada commit.
 *
 *     node scripts/medir-forca-da-ia.ts [partidas]
 *
 * A IA11 fixou 600 partidas **antes** de ver o resultado, e mandou reportar
 * intervalo em vez de ponto: a E6 é cumprida quando o **limite inferior** passa
 * de 70%. Escolher o `N` depois é o que faz a medição virar argumento.
 *
 * **O arnês copia o app, não a engine.** Foi a lição mais cara da H14: o
 * `ProvedorDaPartida` sorteia a semente de cada rodada por fora (S130), e um
 * arnês que use uma semente só para a partida inteira mede outra coisa. Aqui a
 * corrente de sementes sai de um gerador só, como o `sortearSemente` do app.
 */

import {
  aplicar,
  criarAleatorio,
  iniciarPartida,
  movimentosValidos,
  novaRodada,
  vencedorDa,
  visaoDe,
} from '../src/engine/index.ts'
import type { JogadorId, Partida } from '../src/engine/index.ts'
import { decidir } from '../src/ia/decidir.ts'
import { porSorteio } from '../src/ia/por-sorteio.ts'
import type { Politica } from '../src/ia/politica.ts'

const PARTIDAS = Number(process.argv[2] ?? '600')
const PASSOS_POR_RODADA = 20_000
const RODADAS_POR_PARTIDA = 200

type Resultado = {
  readonly vencedor: JogadorId | null
  readonly rodadas: number
  readonly placar: readonly [number, number]
}

/** Uma rodada inteira, com uma política por jogador. */
function jogarRodada(inicial: Partida, politicas: readonly [Politica, Politica]): Partida {
  let partida = inicial

  for (let passo = 0; passo < PASSOS_POR_RODADA && partida.fase !== 'RodadaEncerrada'; passo += 1) {
    const comando = politicas[partida.jogadorDaVez](visaoDe(partida, partida.jogadorDaVez))

    if (comando === null) {
      if (movimentosValidos(visaoDe(partida, partida.jogadorDaVez)).length > 0) {
        throw new Error('política devolveu null com movimento disponível')
      }

      break
    }

    const resultado = aplicar(partida, comando)

    if (resultado.tipo !== 'sucesso') {
      throw new Error(`comando oferecido e recusado: ${comando.tipo} — ${resultado.motivo}`)
    }

    partida = resultado.partida
  }

  return partida
}

function jogarPartida(semente: number, heuristicaEm: JogadorId): Resultado {
  // A corrente de sementes do app: uma fonte, uma semente por rodada (S130).
  const fonte = criarAleatorio(semente)
  const proxima = () => Math.floor(fonte() * 2 ** 31)

  const sorteio = porSorteio(criarAleatorio(semente + 1))
  const politicas: readonly [Politica, Politica] =
    heuristicaEm === 0 ? [decidir, sorteio] : [sorteio, decidir]

  let partida = jogarRodada(iniciarPartida(proxima()), politicas)
  let rodadas = 1

  while (vencedorDa(partida) === null && rodadas < RODADAS_POR_PARTIDA) {
    if (partida.fase !== 'RodadaEncerrada') {
      break
    }

    partida = jogarRodada(novaRodada(partida, proxima()), politicas)
    rodadas += 1
  }

  return { vencedor: vencedorDa(partida), rodadas, placar: partida.placar }
}

function main() {
  let vitoriasDaHeuristica = 0
  let decididas = 0
  let rodadas = 0
  const inicio = performance.now()

  for (let partida = 0; partida < PARTIDAS; partida += 1) {
    // A heurística alterna de lado: a linha de base mediu que não há vantagem
    // posicional detectável, e alternar mantém isso verdadeiro por construção.
    const heuristicaEm: JogadorId = partida % 2 === 0 ? 0 : 1
    const resultado = jogarPartida(partida + 1, heuristicaEm)

    rodadas += resultado.rodadas

    if (resultado.vencedor === null) {
      continue
    }

    decididas += 1

    if (resultado.vencedor === heuristicaEm) {
      vitoriasDaHeuristica += 1
    }
  }

  const proporcao = decididas === 0 ? 0 : vitoriasDaHeuristica / decididas
  // Intervalo normal de 95% (IA11). A aproximação basta: com 600 partidas e uma
  // proporção longe de 0 e de 1, a diferença para o intervalo exato é de
  // décimos de ponto percentual.
  const margem = decididas === 0 ? 0 : 1.96 * Math.sqrt((proporcao * (1 - proporcao)) / decididas)
  const emPorcento = (valor: number) => `${(valor * 100).toFixed(1)}%`

  console.log(`partidas jogadas       ${String(PARTIDAS)}`)
  console.log(`partidas decididas     ${String(decididas)}`)
  console.log(`rodadas por partida    ${(rodadas / PARTIDAS).toFixed(1)} na média`)
  console.log(`vitórias da heurística ${String(vitoriasDaHeuristica)}`)
  console.log(
    `força relativa         ${emPorcento(proporcao)} — ` +
      `intervalo de 95%: ${emPorcento(proporcao - margem)} a ${emPorcento(proporcao + margem)}`,
  )
  console.log(
    `custo                  ${((performance.now() - inicio) / PARTIDAS).toFixed(0)} ms por partida`,
  )
  console.log(
    `\nE6 (≥70% pelo limite inferior): ${proporcao - margem > 0.7 ? 'CUMPRIDA' : 'NÃO CUMPRIDA'}`,
  )
}

main()
