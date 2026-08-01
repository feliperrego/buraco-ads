import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { criarRoteador } from './roteador.tsx'

/**
 * A RD2 cria as quatro rotas vazias, então não há conteúdo a verificar. O que se
 * verifica é que a árvore resolve cada caminho de docs/screens.md §1.
 *
 * Vale um teste porque **o tipo não pega este erro**: uma rota que ninguém
 * registrou, ou um caminho escrito errado, falha só em runtime, ao abrir a URL.
 * Sem isto, a 0.7 dependeria de alguém visitar as quatro telas à mão.
 *
 * A limpeza é explícita porque o Vitest deste projeto roda sem `globals`, e sem
 * ela a Testing Library não registra o afterEach automático — as árvores de cada
 * caso ficariam empilhadas no mesmo document.
 */
afterEach(cleanup)

/**
 * O jsdom não implementa window.scrollTo, e o roteador o chama ao navegar. Sem
 * este stub cada caso imprime "Not implemented" — quatro linhas benignas que
 * treinam a ignorar a saída do teste, que é onde os avisos reais aparecem.
 */
beforeAll(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

const telas = [
  { caminho: '/', titulo: 'Inicial' },
  { caminho: '/partida', titulo: 'Partida' },
  { caminho: '/fim', titulo: 'Fim de partida' },
  { caminho: '/regras', titulo: 'Regras' },
]

describe('as quatro rotas de screens.md §1', () => {
  it.each(telas)('resolve $caminho e renderiza $titulo', async ({ caminho, titulo }) => {
    const roteador = criarRoteador(createMemoryHistory({ initialEntries: [caminho] }))

    render(<RouterProvider router={roteador} />)

    expect(await screen.findByRole('heading', { name: titulo, level: 1 })).toBeDefined()
  })
})
