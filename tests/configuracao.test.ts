import { describe, expect, it } from 'vitest'

/**
 * Testes sobre a própria infraestrutura de teste.
 *
 * O projeto "nucleo" roda em Node, sem DOM. Se alguém trocar o ambiente por
 * engano, a engine passaria a ter acesso a `document` — e a RNF1.1 (engine sem
 * dependência de DOM) deixaria de ser verificável pelos testes.
 */
describe('projeto nucleo', () => {
  it('roda em ambiente Node, sem DOM', () => {
    expect('document' in globalThis).toBe(false)
    expect('window' in globalThis).toBe(false)
  })
})
