import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TelaFim from './TelaFim.tsx'

/**
 * Critérios de interface da spec 0013 §8.3 — a tela de fim de partida.
 *
 * S135 — a `screens.md` §1 chama a `/fim` de **tela** e a apuração de painel, e
 * a diferença sobrevive aqui: a apuração é da rodada e acontece com a partida
 * atrás dela; o fim é da partida e não tem mesa para mostrar.
 */
afterEach(cleanup)

describe('S135 e RF1.5 — vencedor, placar e nova partida', () => {
  it('CA-S135-1 — quando o humano vence, a tela diz que foi você', () => {
    render(<TelaFim vencedor={0} placar={[3010, 500]} aoJogarDeNovo={vi.fn()} />)

    expect(screen.getByRole('heading').textContent).toMatch(/você venceu/i)
    expect(document.body.textContent).toContain('3010')
    expect(document.body.textContent).toContain('500')
  })

  it('CA-S135-2 — quando a IA vence, a tela diz que foi o adversário', () => {
    render(<TelaFim vencedor={1} placar={[500, 3010]} aoJogarDeNovo={vi.fn()} />)

    expect(screen.getByRole('heading').textContent).toMatch(/adversário venceu/i)
    expect(screen.getByRole('heading').textContent).not.toMatch(/você venceu/i)
  })

  it('CA-S135-1 — a RF1.5 exige oferecer nova partida, e o clique avisa', () => {
    const aoJogarDeNovo = vi.fn()

    render(<TelaFim vencedor={0} placar={[3010, 500]} aoJogarDeNovo={aoJogarDeNovo} />)

    const botao = screen.getByRole('button', { name: /nova partida/i })

    botao.click()

    expect(aoJogarDeNovo).toHaveBeenCalledTimes(1)
  })
})
