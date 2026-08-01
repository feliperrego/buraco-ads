import { mulberry32 } from './mulberry32.ts'

/**
 * A5 — a fonte de aleatoriedade é **injetada**, nunca chamada de dentro de quem
 * decide. Uma função sem argumentos que devolve `[0, 1)`.
 */
export type Aleatorio = () => number

/**
 * S30 — utilitário público da engine, para que `estado/` possa semear a IA.
 *
 * Existe porque a A8 proíbe alcançar `engine/aleatorio/` de fora, e as
 * alternativas eram piores: duplicar o gerador dentro de `ia/`, ou deixar a IA
 * usar `Math.random()` e perder o determinismo que a E6 exige.
 *
 * O nome é estável de propósito. O `mulberry32` por trás é decisão congelada
 * pela S4 e só muda por ADR — quem chama isto aqui não deveria nem saber qual é.
 */
export function criarAleatorio(semente: number): Aleatorio {
  return mulberry32(semente)
}
