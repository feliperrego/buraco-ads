/**
 * A8 — API pública única da engine. Nada fora de `engine/` importa de subpastas
 * internas, e a regra de dependência do ESLint recusa quem tentar.
 *
 * A spec 0001 §2 fixa o que a H1 acrescenta aqui: duas funções, e nada mais.
 * `movimentosValidos` entra na H2, junto com o primeiro comando.
 */
export { iniciarPartida } from './dominio/partida.ts'
export { visaoDe } from './consultas/visao-de.ts'
export { movimentosValidos } from './consultas/movimentos-validos.ts'
export { aplicar } from './comandos/aplicar.ts'

export type { Comando, Resultado } from './comandos/comando.ts'

export type { Carta, Naipe, Valor } from './dominio/carta.ts'

export type { FaseDoTurno, Jogador, JogadorId, Jogo, Morto, Partida } from './dominio/partida.ts'

export type { VisaoDoJogador } from './consultas/visao-de.ts'
