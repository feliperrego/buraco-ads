import { movimentosValidos } from '../engine/index.ts'
import type { Aleatorio, Comando, VisaoDoJogador } from '../engine/index.ts'

/**
 * A IA da H3 escolhe **por sorteio** dentro de `movimentosValidos` (S28).
 *
 * Isto não é um rascunho: a testing-strategy.md E7 decidiu que a IA aleatória é
 * permanente. Depois da H15 ela vira a linha de base contra a qual a heurística
 * é medida, e o adversário do nível 2 de teste.
 *
 * **A RF5.2 é garantia estrutural aqui, não política.** A função recebe só a
 * `VisaoDoJogador` e chama `movimentosValidos` ela mesma (S29): não existe
 * caminho por onde o conteúdo do monte, dos mortos ou da mão do adversário
 * chegue até esta decisão. A IA não escolhe não trapacear — ela não tem por onde.
 */
export function decidir(visao: VisaoDoJogador, aleatorio: Aleatorio): Comando | null {
  const movimentos = movimentosValidos(visao)

  // S31 — `null` em vez de exceção. Acontece com o monte esgotado (R4.6/R4.8),
  // que é a H14, e devolver null deixa a decisão com quem chamou.
  if (movimentos.length === 0) {
    return null
  }

  const indice = Math.floor(aleatorio() * movimentos.length)
  const escolhido = movimentos[indice]

  if (escolhido === undefined) {
    // Só acontece se o `Aleatorio` violar o contrato devolvendo fora de [0, 1).
    throw new Error(
      `aleatório fora da faixa: índice ${String(indice)} de ${String(movimentos.length)}`,
    )
  }

  return escolhido
}
