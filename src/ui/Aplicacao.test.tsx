import { createMemoryHistory } from '@tanstack/react-router'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
      // O rótulo encurtou na H4: a S48 passou a nomear o botão pelo comando que
      // ele confirma, e "Descartar" é agora o caso de conjunto unitário.
      fireEvent.click(screen.getByRole('button', { name: /^descartar$/i }))

      // Âncora: a vez precisa ter passado para a IA, senão o resto não prova nada.
      expect(screen.getByRole('region', { name: /vez e fase/i }).textContent).toMatch(
        /vez do adversário/i,
      )
      // S153 — o botão de abandonar (RF1.3) responde sempre, inclusive na vez do
      // adversário, então a âncora conta os botões **das regiões** da mesa. Era
      // `queryAllByRole('button')` até a H16, e a asserção era mais específica
      // que o critério: o que ela prova é que a mesa ficou inerte.
      expect(
        screen.getAllByRole('region').flatMap((regiao) => within(regiao).queryAllByRole('button')),
      ).toHaveLength(0)

      // As pausas são avançadas **uma por vez**. A S33 aplica um comando por
      // passagem, e o temporizador seguinte só é agendado depois de o React
      // re-renderizar com o estado novo — um avanço único pularia o resto.
      //
      // Eram duas voltas fixas até a H15, e o número era o turno da IA aleatória,
      // que quase nunca baixava. Com a heurística o turno passou a ter jogadas
      // de mesa no meio (R3.3), e o que este critério prova não é quantas: é que
      // o ciclo fecha e a mesa volta ao humano.
      for (let passagem = 0; passagem < 40; passagem += 1) {
        if (/sua vez/i.test(screen.getByRole('region', { name: /vez e fase/i }).textContent)) {
          break
        }

        await act(async () => {
          await vi.advanceTimersByTimeAsync(PAUSA_DA_IA_MS + 10)
        })
      }

      expect(screen.getByRole('region', { name: /vez e fase/i }).textContent).toMatch(/sua vez/i)
      expect(await screen.findByRole('button', { name: /comprar do monte/i })).toBeDefined()

      // "Lixo maior" contra o começo da rodada, que é **vazio** (R2.4). O número
      // exato passou a depender da compra que a IA sorteou na H7: comprando do
      // monte o lixo fica com duas, pegando o lixo ele fica com uma — a dela.
      // As duas provam a mesma coisa, que é o que este critério existe para
      // provar: as quatro camadas fecharam o ciclo e a mesa voltou ao humano.
      expect(
        screen.getByRole('region', { name: /^lixo$/i }).querySelectorAll('li').length,
      ).toBeGreaterThan(0)
    } finally {
      vi.useRealTimers()
      vi.restoreAllMocks()
    }
  })
})
