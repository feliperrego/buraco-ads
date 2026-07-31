import { describe, expect, it } from 'vitest'

/**
 * Contraparte do teste em tests/configuracao.test.ts.
 *
 * O projeto "interface" precisa de DOM. Se o ambiente cair para Node, os testes
 * de componente falhariam com erros confusos em vez de uma mensagem clara.
 */
describe('projeto interface', () => {
  it('roda em ambiente jsdom, com DOM disponível', () => {
    expect(typeof document).toBe('object')
    expect(document.createElement('div').tagName).toBe('DIV')
  })
})
