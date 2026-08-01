import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TelaInicial from './TelaInicial.tsx'

afterEach(cleanup)

describe('RF1.2 — a tela inicial tem uma ação só', () => {
  it('CA-S1-3 — existe exatamente uma ação: iniciar partida', () => {
    render(<TelaInicial aoIniciar={vi.fn()} />)

    const acoes = [...screen.queryAllByRole('button'), ...screen.queryAllByRole('link')]

    // "Uma única ação relevante" (RF1.2) é uma afirmação de contagem, não de
    // presença: um botão a mais quebra o critério tanto quanto um a menos.
    expect(acoes).toHaveLength(1)
    expect(screen.getByRole('button', { name: /iniciar partida/i })).toBeDefined()
  })
})
