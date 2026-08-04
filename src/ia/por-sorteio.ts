import { movimentosValidos } from '../engine/index.ts'
import type { Aleatorio } from '../engine/index.ts'
import type { Politica } from './politica.ts'

/**
 * A IA da H3, agora como **fábrica** de política (S144).
 *
 * A E7 decidiu que ela é permanente: depois da H15 é a linha de base contra a
 * qual a heurística é medida, e o adversário do nível 2 de teste. O que mudou
 * foi só onde o gerador entra — antes em cada chamada, agora fechado aqui
 * dentro. A S34 continua valendo, e fica mais forte: o gerador é de vida longa
 * porque a política **é** o gerador mais a regra de escolha.
 *
 * A RF5.2 continua sendo garantia estrutural: a política recebe só a
 * `VisaoDoJogador` e chama `movimentosValidos` ela mesma (S29).
 */
export function porSorteio(aleatorio: Aleatorio): Politica {
  return (visao) => {
    const movimentos = movimentosValidos(visao)

    // S31 — `null` em vez de exceção. Acontece fora da vez (S20) e na rodada
    // encerrada, e devolver null deixa a decisão com quem chamou.
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
}
