import { movimentosValidos } from '../engine/index.ts'
import type { Comando, VisaoDoJogador } from '../engine/index.ts'
import { chaveDe, comparar, pontuar } from './pontuar.ts'
import type { Nota } from './pontuar.ts'

/**
 * O `argmax` da IA2, separado de `decidir` por uma razão de teste: a S150 diz
 * que a escolha **não** depende da ordem da lista, e provar isso exige poder
 * embaralhá-la. `decidir` chamando `movimentosValidos` internamente (S29) não
 * deixaria nenhum teste tocar essa ordem.
 *
 * O empate é resolvido pela **chave**, e a menor vence. Qual das duas pontas é
 * indiferente; o que não é indiferente é a chave não depender da posição.
 */
export function escolher(visao: VisaoDoJogador, movimentos: readonly Comando[]): Comando | null {
  let melhor: { comando: Comando; nota: Nota; chave: string } | null = null

  for (const comando of movimentos) {
    const nota = pontuar(visao, comando)
    const chave = chaveDe(comando)

    if (melhor === null) {
      melhor = { comando, nota, chave }
      continue
    }

    const ordem = comparar(nota, melhor.nota)

    if (ordem > 0 || (ordem === 0 && chave < melhor.chave)) {
      melhor = { comando, nota, chave }
    }
  }

  return melhor?.comando ?? null
}

/**
 * A IA por heurística da H15 (RF5.1, RF5.2, RF5.3).
 *
 * IA2 — a forma é **pontuação com `argmax`**, e não cascata de `if`. A cascata
 * lê como as regras do Buraco e por isso mesmo engana: a ordem dos `if` **é** a
 * estratégia, e fica escrita em lugar nenhum. Aqui a estratégia está em
 * `pontuar`, item por item, com o `rules.md` citado ao lado de cada parcela.
 *
 * **A RF5.2 é garantia estrutural, não política.** A função recebe só a
 * `VisaoDoJogador` e chama `movimentosValidos` ela mesma (S29): não existe
 * caminho por onde o conteúdo do monte, dos mortos ou da mão do adversário
 * chegue até esta decisão. A IA não escolhe não trapacear — ela não tem por onde.
 *
 * S144 — não recebe `Aleatorio`. O empate sai de chave estável do comando
 * (IA3/S150), então a heurística é determinística sem depender de semente, e a
 * E7 mantém a aleatória viva em `porSorteio` como linha de base.
 *
 * S31 — `null` quando não há jogada: fora da vez (S20) e na rodada encerrada.
 */
export function decidir(visao: VisaoDoJogador): Comando | null {
  return escolher(visao, movimentosValidos(visao))
}
