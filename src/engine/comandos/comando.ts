import type { Partida } from '../dominio/partida.ts'

/**
 * Os comandos que a H2 introduz. O domain.md §6 prevê seis ao todo; `baixar`,
 * `aumentar` e `regularizarCuringa` chegam da H4 em diante.
 *
 * A carta é identificada por `id` e não por posição na mão (S25): a S23 deixa a
 * interface livre para reordenar, e posição mudaria de significado junto.
 */
export type Comando =
  { readonly tipo: 'comprarDoMonte' } | { readonly tipo: 'descartar'; readonly carta: string }

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
