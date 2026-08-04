import type { Comando, VisaoDoJogador } from '../engine/index.ts'

/**
 * S144 — a forma que as duas políticas compartilham.
 *
 * O `Aleatorio` **não** está aqui, e a ausência é a decisão. A heurística não
 * sorteia nada — a IA3 resolveu o empate por chave estável do comando justamente
 * para não precisar de gerador —, então mantê-lo na assinatura deixaria um
 * parâmetro morto na política que o projeto usa de verdade. A aleatória, que
 * precisa dele, o recebe na fábrica `porSorteio` e fecha sobre ele.
 *
 * O tipo comum existe por causa da E7: a aleatória continua viva como **linha de
 * base**, e o arnês da S151 precisa tratar as duas como intercambiáveis.
 */
export type Politica = (visao: VisaoDoJogador) => Comando | null
