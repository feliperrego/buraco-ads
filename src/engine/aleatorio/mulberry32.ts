/**
 * Gerador pseudoaleatório fixado **literalmente** pela spec 0001 §3.2 (S9).
 *
 * Este código é especificação, não implementação: trocá-lo muda toda
 * distribuição semeada e reprova a CA-S4-1, sem que nenhuma regra do jogo tenha
 * mudado. Se um dia for trocado, é ADR — nunca refatoração.
 *
 * A A5 permite isto aqui porque não é fonte de aleatoriedade: é uma função pura
 * da semente, e a semente vem de fora da engine (S8).
 */
export function mulberry32(semente: number): () => number {
  let a = semente >>> 0

  return function proximo(): number {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
