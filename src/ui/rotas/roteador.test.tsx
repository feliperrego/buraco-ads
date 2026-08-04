import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
 *
 * `/fim` saiu na H13, pelo mesmo motivo e com a mesma cobertura: ela deixou de
 * ser `<h1>Fim de partida</h1>` e passou a depender de haver partida **com
 * vencedor** (S135). A `CA-S135-3` é a equivalente da CA-S14-1 para ela.
 *
 * A asserção antiga (`renderiza "Fim de partida"`) era mais específica que o
 * critério, que fala de **registro** de rota. É o mesmo acoplamento que a H7
 * achou nos testes da H2, e o sinal para reconhecê-lo é este: o teste que quebra
 * não é sobre a fatia nova.
 */
afterEach(cleanup)

beforeAll(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

const telas = [
  { caminho: '/', titulo: 'Buraco' },
  { caminho: '/regras', titulo: 'Regras' },
]

describe('as rotas de screens.md §1', () => {
  it.each(telas)('resolve $caminho e renderiza $titulo', async ({ caminho, titulo }) => {
    render(<Aplicacao historico={createMemoryHistory({ initialEntries: [caminho] })} />)

    expect(await screen.findByRole('heading', { name: titulo, level: 1 })).toBeDefined()
  })

  it('CA-S135-3 — abrir /fim sem partida em memória termina em /', async () => {
    // Prova o registro da rota **e** o redirecionamento: com o caminho ausente o
    // roteador mostraria "Not Found" e o `pathname` ficaria em `/fim`.
    const historico = createMemoryHistory({ initialEntries: ['/fim'] })

    render(<Aplicacao historico={historico} />)

    await waitFor(() => {
      expect(historico.location.pathname).toBe('/')
    })
  })
})
