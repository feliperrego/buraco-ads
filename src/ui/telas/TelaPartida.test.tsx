import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import TelaPartida from './TelaPartida.tsx'
import type { VisaoDoJogador } from '../../engine/index.ts'

/**
 * Critérios de interface da spec 0001 §6, nível 4 da testing-strategy.md:
 * comportamento, nunca aparência (RNF2.2).
 *
 * A visão é montada à mão em vez de vir de `iniciarPartida`, e isso é
 * deliberado: a tela recebe `VisaoDoJogador` por propriedade (spec §4.2), então
 * o teste dela não deve depender da engine estar pronta. Quando um segundo teste
 * precisar da mesma visão, ela vira construtor em `engine/testing/` (C6).
 */
afterEach(cleanup)

function visaoInicial(): VisaoDoJogador {
  return {
    eu: 0,
    mao: Array.from({ length: 11 }, (_, i) => ({
      id: `COPAS-${String(i + 2)}-1`,
      naipe: 'COPAS',
      valor: '3',
    })),
    lixo: [],
    meusJogos: [],
    jogosDoAdversario: [],
    cartasNoMonte: 60,
    cartasNaMaoDoAdversario: 11,
    mortosRestantes: 2,
    placar: [0, 0],
    jogadorDaVez: 0,
    fase: 'Compra',
    numeroDaRodada: 1,
  }
}

describe('S1 — a mesa da H1 não é interativa', () => {
  it('CA-S1-1 — nenhum elemento da mesa responde a clique', () => {
    render(<TelaPartida visao={visaoInicial()} />)

    // A âncora positiva vem primeiro, e é o que dá sentido ao resto: sem ela,
    // um componente que não renderiza nada passaria neste critério de graça.
    // Só faz sentido afirmar que a mesa não responde depois de provar que a
    // mesa existe.
    expect(screen.getAllByRole('region').length).toBeGreaterThan(0)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })

  it('CA-S1-2 — a contagem do monte mostra 60 e o lixo indica vazio', () => {
    render(<TelaPartida visao={visaoInicial()} />)

    expect(screen.getByRole('region', { name: /monte/i }).textContent).toContain('60')
    expect(screen.getByRole('region', { name: /lixo/i }).textContent).toMatch(/vazio/i)
  })
})
