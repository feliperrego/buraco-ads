import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import Aplicacao from '../Aplicacao.tsx'

/**
 * Nascido na tarefa 0.7, quando as quatro rotas eram esqueleto vazio (RD2), e
 * ajustado pela H1, que preencheu duas delas.
 *
 * O que se verifica continua sendo o mesmo, e é o que o tipo não pega: uma rota
 * que ninguém registrou, ou um caminho escrito errado, só falha em runtime.
 *
 * `/partida` saiu desta lista porque o que ela renderiza passou a depender do
 * estado. A CA-S14-1 cobre o registro dela: se o caminho não existisse, o
 * roteador mostraria "Not Found" em vez de redirecionar.
 */
afterEach(cleanup)

beforeAll(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

const telas = [
  { caminho: '/', titulo: 'Buraco' },
  { caminho: '/fim', titulo: 'Fim de partida' },
  { caminho: '/regras', titulo: 'Regras' },
]

describe('as rotas de screens.md §1', () => {
  it.each(telas)('resolve $caminho e renderiza $titulo', async ({ caminho, titulo }) => {
    render(<Aplicacao historico={createMemoryHistory({ initialEntries: [caminho] })} />)

    expect(await screen.findByRole('heading', { name: titulo, level: 1 })).toBeDefined()
  })
})
