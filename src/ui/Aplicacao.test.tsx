import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import Aplicacao from './Aplicacao.tsx'

afterEach(cleanup)

beforeAll(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

/**
 * S14. Este caso só passou a ser alcançável por causa do ADR-0008: o *rewrite*
 * de SPA faz qualquer URL devolver a aplicação, então digitar `/partida` direto
 * no navegador é real, não hipótese. Sem persistência (RNF1.4), não há partida
 * em memória nessa situação.
 *
 * O critério é sobre **onde a navegação termina**, e não sobre como. Serve tanto
 * para um `beforeLoad` que redireciona quanto para um componente que navega —
 * a escolha do mecanismo é do passo 4, e este teste não a prende.
 */
describe('S14 — /partida exige partida em memória', () => {
  it('CA-S14-1 — abrir /partida sem partida em memória termina em /', async () => {
    const historico = createMemoryHistory({ initialEntries: ['/partida'] })

    render(<Aplicacao historico={historico} />)

    await waitFor(() => {
      expect(historico.location.pathname).toBe('/')
    })
  })
})
