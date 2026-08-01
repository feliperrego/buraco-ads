import { createMemoryHistory } from '@tanstack/react-router'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import Aplicacao from './Aplicacao.tsx'
import { PAUSA_DA_IA_MS } from '../estado/turno-da-ia.ts'

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

/**
 * S37 — o critério de ponta a ponta, aberto desde a H1 e adiado na H2.
 *
 * É o único teste do projeto que exercita as quatro camadas numa asserção só:
 * clique → `estado/` → `engine/` → `ia/` → mesa. Por isso ele **não substitui**
 * nenhum outro: quando falha, não diz onde.
 *
 * Duas fontes de instabilidade estão desarmadas de propósito. A semente vem de
 * `Math.random()` (S8), então ela é fixada; e a pausa da S35 é temporizada,
 * então o tempo é falso. Um teste que espera de verdade é um teste que um dia
 * falha sozinho.
 */
describe('S37 — a partida continua depois do turno da IA', () => {
  it('CA-S37-1 — iniciar, comprar e descartar devolve a mesa ao humano, com o lixo maior', async () => {
    // Semente 3: o humano começa, então o turno da IA vem depois do dele.
    vi.spyOn(Math, 'random').mockReturnValue(3 / 2 ** 32)
    vi.useFakeTimers({ shouldAdvanceTime: true })

    try {
      render(<Aplicacao historico={createMemoryHistory({ initialEntries: ['/'] })} />)

      fireEvent.click(await screen.findByRole('button', { name: /iniciar partida/i }))
      fireEvent.click(await screen.findByRole('button', { name: /comprar do monte/i }))

      const mao = screen.getByRole('region', { name: /minha mão/i })
      const primeira = mao.querySelectorAll('button')[0]
      expect(primeira).toBeDefined()
      fireEvent.click(primeira as HTMLElement)
      fireEvent.click(screen.getByRole('button', { name: /descartar a carta selecionada/i }))

      // Âncora: a vez precisa ter passado para a IA, senão o resto não prova nada.
      expect(screen.getByRole('region', { name: /vez e fase/i }).textContent).toMatch(
        /vez do adversário/i,
      )
      expect(screen.queryAllByRole('button')).toHaveLength(0)

      // Duas pausas, avançadas **uma por vez**. A S33 aplica um comando por
      // passagem, e o temporizador seguinte só é agendado depois de o React
      // re-renderizar com o estado novo — um avanço único pularia o segundo.
      for (let passagem = 0; passagem < 2; passagem += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(PAUSA_DA_IA_MS + 10)
        })
      }

      expect(screen.getByRole('region', { name: /vez e fase/i }).textContent).toMatch(/sua vez/i)
      expect(await screen.findByRole('button', { name: /comprar do monte/i })).toBeDefined()
      expect(screen.getByRole('region', { name: /^lixo$/i }).querySelectorAll('li')).toHaveLength(2)
    } finally {
      vi.useRealTimers()
      vi.restoreAllMocks()
    }
  })
})
