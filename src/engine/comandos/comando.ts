import type { Valor } from '../dominio/carta.ts'
import type { Partida } from '../dominio/partida.ts'

/**
 * S51 — uma carta que vai para a mesa, **com o papel que ela exerce**.
 *
 * Sem `representa`, a carta é natural. Com, ela é curinga fazendo papel daquele
 * valor (R5.5). O campo existe porque um conjunto de cartas **não determina um
 * jogo**: `2♥ 3♥ 4♥` é `2-3-4` com o 2 natural, ou `3-4-[5]` com o 2 de curinga,
 * e as duas são legais. Escolher é do jogador — pela R8.5 uma vira canastra limpa
 * e a outra suja, e pela R6.5 só a segunda tem curinga para regularizar depois.
 */
export type CartaBaixada = {
  readonly carta: string
  readonly representa?: Valor
}

/**
 * Os comandos da H2, mais o `baixar` da H4. O domain.md §6 prevê seis ao todo;
 * `aumentar` e `regularizarCuringa` chegam da H6 e da H9.
 *
 * A carta é identificada por `id` e não por posição na mão (S25): a S23 deixa a
 * interface livre para reordenar, e posição mudaria de significado junto.
 *
 * S43 — `baixar` aceita as cartas em **qualquer ordem**, e a engine ordena.
 * Exigir ordem faria a interface ordenar, e ordenar exige saber onde o Ás vai —
 * que é regra, não apresentação (T6). O que a interface **precisa** dizer é o
 * papel de cada carta (S51), e só isso.
 */
export type Comando =
  | { readonly tipo: 'comprarDoMonte' }
  | { readonly tipo: 'descartar'; readonly carta: string }
  | { readonly tipo: 'baixar'; readonly cartas: readonly CartaBaixada[] }
  /**
   * S65 — o `aumentar` aponta o jogo alvo pelo `id` e reusa `CartaBaixada`.
   *
   * `jogo` é o campo que nenhum comando anterior tinha: é a primeira vez que um
   * comando aponta para algo que **já está na mesa**. É por isso que a S63
   * precisou vir antes — um `id` recalculado a cada crescimento faria o alvo
   * sumir entre duas jogadas do mesmo turno, que é o que a R3.3 autoriza.
   */
  | { readonly tipo: 'aumentar'; readonly jogo: string; readonly cartas: readonly CartaBaixada[] }

/**
 * S21 — `sucesso` carrega só a partida nova. O M8 previu também uma lista de
 * eventos, e ela foi adiada até existir quem os leia: o candidato real é a
 * apuração da H12. Gatilho registrado no roadmap.md §3.
 *
 * S22 — `recusa` existe mesmo com a RF2.1 garantindo que a interface só oferece
 * jogadas válidas. A RF2.1 protege o jogador; isto protege a engine de um
 * chamador com bug, que é o caso da IA da H15.
 */
export type Resultado =
  | { readonly tipo: 'sucesso'; readonly partida: Partida }
  | { readonly tipo: 'recusa'; readonly motivo: string }
