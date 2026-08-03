import type { Valor } from './carta.ts'
import { categoriaDe } from './jogo.ts'
import type { CategoriaCanastra } from './jogo.ts'
import type { JogadorId, Partida } from './partida.ts'

/**
 * M5 — a apuração de um jogador, **um campo por componente da R11**, e o total
 * como função.
 *
 * A RF4.2 exige a apuração *item por item*, e o `domain.md` M5 diz por quê: "um
 * único número tornaria a regra mais complexa do sistema impossível de auditar".
 * A contagem **por categoria** está aqui pelo mesmo motivo — a RF4.2 pede
 * "canastras por categoria", e um total de 400 não diz se são duas limpas ou
 * quatro sujas.
 *
 * S121 — os sinais moram **no valor**: `cartasNaMao` e `penalidadeDeMorto` já
 * chegam negativos, e `totalDe` é uma soma sem subtração. Guardar positivo e
 * subtrair na soma espalharia a R11.3 por dois lugares.
 */
export type Pontuacao = {
  /** Quantas canastras de cada categoria (R11.1, RF4.2). */
  readonly canastras: Readonly<Record<CategoriaCanastra, number>>
  /** A soma da tabela da R8.2 (R11.1). */
  readonly pontosDeCanastra: number
  /** R11.2 e R11.3 — as cartas baixadas, positivo. */
  readonly cartasNaMesa: number
  /** R11.2 e R11.3 — as cartas que sobraram na mão, **negativo**. */
  readonly cartasNaMao: number
  /** R11.4 — `+100` para quem bateu, `0` para o resto. */
  readonly bonusDeBatida: number
  /** R11.5, R11.5.2 — `-100` para quem terminou sem morto. */
  readonly penalidadeDeMorto: number
}

/** R8.2 — a tabela de pontos por categoria. */
export const PONTOS_DA_CATEGORIA: Readonly<Record<CategoriaCanastra, number>> = {
  DE_1000: 1000,
  DE_500: 500,
  LIMPA: 200,
  SUJA: 100,
}

export const BONUS_DE_BATIDA = 100
export const PENALIDADE_SEM_MORTO = -100

/**
 * R11.2 — o valor individual de uma carta.
 *
 * S124 — o `2` vale **10 sempre**, natural ou curinga. O valor é propriedade da
 * carta (M1) e "curinga" é papel (M2): deixar o papel mexer no valor faria a
 * mesma carta valer coisas diferentes em duas casas do mesmo jogo, e o fixture
 * da `CA-S55-1` tem exatamente esse jogo. O texto da R11.2 foi corrigido junto
 * (S127) — o parêntese "(curinga)" descrevia o caso comum e lia-se como
 * condição.
 */
export function valorDaCarta(valor: Valor): number {
  return PONTOS_POR_VALOR[valor]
}

/** A tabela da R11.2, escrita como tabela. */
const PONTOS_POR_VALOR: Readonly<Record<Valor, number>> = {
  A: 15,
  K: 10,
  Q: 10,
  J: 10,
  '10': 10,
  '9': 10,
  '8': 10,
  '7': 5,
  '6': 5,
  '5': 5,
  '4': 5,
  '3': 5,
  '2': 10,
}

/**
 * M5 — o total é **função**, nunca campo.
 *
 * Guardá-lo criaria duas verdades sobre o mesmo fato, que é o defeito medido na
 * H9 como "decisão sem rede" e que a S105 já removeu uma vez do `Jogador`.
 */
export function totalDe(pontuacao: Pontuacao): number {
  return (
    pontuacao.pontosDeCanastra +
    pontuacao.cartasNaMesa +
    pontuacao.cartasNaMao +
    pontuacao.bonusDeBatida +
    pontuacao.penalidadeDeMorto
  )
}

/**
 * R11 inteira, para os dois jogadores.
 *
 * S120 — a apuração é **derivada do estado**, e foi esta a resposta ao gatilho
 * do `eventos[]` no `roadmap.md` §3: o estado no fim da rodada já contém tudo.
 * Os jogos estão na mesa com suas posições, as mãos estão como ficaram,
 * `reclamadoPor` diz quem pegou morto, e a mão vazia diz quem bateu (S113).
 * Nenhum item da R11 pede informação que só um histórico teria.
 *
 * Mora em `dominio/` e não em `consultas/` por uma razão de módulo, não de
 * conceito: `aplicar` precisa dela para somar o placar (S122), e `consultas/` já
 * depende de `comandos/` para tipos. Pô-la lá fecharia um ciclo.
 */
export function apurar(partida: Partida): readonly [Pontuacao, Pontuacao] {
  return [pontuacaoDe(partida, 0), pontuacaoDe(partida, 1)]
}

function pontuacaoDe(partida: Partida, quem: JogadorId): Pontuacao {
  const jogador = partida.jogadores[quem]
  const canastras: Record<CategoriaCanastra, number> = { DE_1000: 0, DE_500: 0, LIMPA: 0, SUJA: 0 }
  let pontosDeCanastra = 0
  let cartasNaMesa = 0

  for (const jogo of jogador.jogos) {
    // R8.5 — a categoria é derivada do conteúdo, recalculada a cada leitura. A
    // canastra suja que teve o curinga regularizado vale 200 na mesma rodada
    // sem que ninguém precise avisar a apuração (CA-R8.5-1).
    const categoria = categoriaDe(jogo)

    if (categoria !== null) {
      canastras[categoria] += 1
      pontosDeCanastra += PONTOS_DA_CATEGORIA[categoria]
    }

    // S123 — as cartas contam **também** quando estão dentro de uma canastra: a
    // R11.1 premia a estrutura e a R11.3 conta o material. O valor lido é o da
    // carta, não o do papel (S124), então o curinga vale o `2` que ele é.
    for (const posicao of jogo.posicoes) {
      cartasNaMesa += valorDaCarta(posicao.carta.valor)
    }
  }

  return {
    canastras,
    pontosDeCanastra,
    cartasNaMesa,
    // R11.3 — o sinal mora no valor (S121), e `totalDe` é uma soma sem subtração.
    //
    // A subtração acontece **dentro** do `reduce`, e não como `-soma` depois: com
    // a mão vazia, negar zero dá `-0`. Ele imprime como "0" na tela e mente em
    // dois lugares — `expect(-0).toBe(0)` reprova, porque o Vitest compara com
    // `Object.is`, e `JSON.stringify` o converte para `0`, mudando o valor no
    // trajeto que a RNF1.2 exige preservar. Achado na verificação da H12 no
    // navegador, onde a mão do batedor sempre é vazia.
    cartasNaMao: jogador.mao.reduce((soma, carta) => soma - valorDaCarta(carta.valor), 0),
    // R11.4 e S113 — quem bateu é quem está sem cartas na mão. Ler `jogadorDaVez`
    // daria a resposta trocada na batida por descarte final.
    bonusDeBatida: jogador.mao.length === 0 ? BONUS_DE_BATIDA : 0,
    // R11.5.2 — a penalidade vale para quem ficou sem morto porque o adversário
    // levou os dois. A R11.5.1, que a dispensa quando um morto virou monte,
    // depende da R4.6 e é da H14 (S119).
    penalidadeDeMorto: partida.mortos.some((morto) => morto.reclamadoPor === quem)
      ? 0
      : PENALIDADE_SEM_MORTO,
  }
}
