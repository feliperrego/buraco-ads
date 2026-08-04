import { contaComoLimpa } from './jogo.ts'
import type { Posicao } from './jogo.ts'

/**
 * O que a R10.1 precisa saber, e nada além.
 *
 * S140 — a condição da batida existia em **dois** lugares: em `aplicar`, sobre a
 * `Partida`, e em `movimentosValidos`, sobre a `VisaoDoJogador`. Elas concordavam
 * por acaso de escrita, não por construção.
 *
 * A R10.1.1 acrescenta uma ressalva à primeira metade, e pô-la em só um dos dois
 * produziria o pior tipo de defeito: `movimentosValidos` recusaria a jogada que
 * `aplicar` aceitaria, e o jogador nunca veria a batida que a regra lhe dá. É a
 * duplicação de intenção que a H9 mediu como decisão sem rede, agora espalhada
 * por dois módulos.
 *
 * O tipo é o **mínimo comum** entre os dois chamadores, e é por isso que ele
 * recebe posições em vez de `Jogo`: a S115 pergunta sobre um jogo que ainda não
 * foi construído.
 */
export type CondicaoDaBatida = {
  /** Quantos mortos **eu** peguei (R9.5). */
  readonly meusMortos: number
  /** R4.6 — se algum morto virou monte, ninguém teve chance de pegá-lo. */
  readonly algumMortoVirouMonte: boolean
}

/**
 * R10.1 — as duas condições da batida, num lugar só.
 *
 * A primeira é a R9.5: só bate quem já pegou morto. Duas ressalvas a cercam, e
 * as duas caem desta expressão sem `if` próprio:
 *
 * - **R10.1.1** — se um morto virou monte, a exigência **cai**: quem ficou sem
 *   morto não teve chance de pegar nenhum.
 * - **R10.1.2** — se o adversário levou os dois, a exigência **continua**. Não
 *   precisa de código: `algumMortoVirouMonte` é falso e `meusMortos` é zero.
 *
 * A segunda é a R10.2, e ela mora inteira em `contaComoLimpa` (S114).
 *
 * A mão vazia não aparece aqui: quem chama já a garantiu, ou está perguntando
 * sobre o resultado de um comando que a zeraria (S115).
 */
export function podeBater(
  condicao: CondicaoDaBatida,
  jogos: readonly (readonly Posicao[])[],
): boolean {
  const temMorto = condicao.meusMortos > 0 || condicao.algumMortoVirouMonte

  return temMorto && jogos.some(contaComoLimpa)
}
