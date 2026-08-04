import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Aplicacao from '../Aplicacao.tsx'

/**
 * Critérios de interface da spec 0017 §7 — a H17.
 *
 * O que estes testes **não** verificam é o mais importante desta fatia: se o
 * texto resume a regra certa. A S160 é explícita — a citação prova cobertura,
 * não fidelidade, e a leitura humana continua sendo o único juiz disso.
 *
 * O que dá para verificar aqui é o par da S159: as seções estão lá, e o que é
 * documento de engenharia **não** está.
 *
 * A tela é montada **pelo roteador**, e não isolada como as outras: ela tem um
 * `Link` de volta, que é conteúdo da página pela S161, e `Link` exige o
 * `RouterProvider` acima.
 */
afterEach(cleanup)

async function renderizar() {
  render(<Aplicacao historico={createMemoryHistory({ initialEntries: ['/regras'] })} />)

  // O roteador resolve a rota de forma assíncrona no primeiro quadro.
  await screen.findByRole('heading', { level: 1 })
}

const SECOES = [
  /componentes/i,
  /preparação/i,
  /turno/i,
  /compra/i,
  /sequências/i,
  /baixar/i,
  /descarte/i,
  /canastras/i,
  /morto/i,
  /batida/i,
  /pontuação/i,
  /fim da partida/i,
]

describe('S159 — a tela mostra as regras em português de jogador', () => {
  it('CA-S159-1 — as doze seções aparecem, com título', async () => {
    await renderizar()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/regras/i)

    for (const secao of SECOES) {
      expect(screen.getByRole('heading', { name: secao }), String(secao)).toBeDefined()
    }
  })

  it('CA-S159-2 — nenhum identificador de regra nem marca de origem chega à tela', async () => {
    await renderizar()

    const texto = document.body.textContent

    // Âncora positiva: a tela **tem** conteúdo, e bastante. Sem isto, "não há
    // `R8.3`" seria verdade numa tela vazia — a armadilha da CA-S1-1.
    expect(texto.length).toBeGreaterThan(2000)

    expect(texto).not.toMatch(/\bR\d+(\.\d+)+/)
    expect(texto).not.toMatch(/\[[DFP]\]/)
    expect(texto).not.toMatch(/histórico das decisões/i)
  })

  it('CA-S159-1 — os quatro valores de canastra aparecem como o jogador precisa deles', async () => {
    await renderizar()

    const texto = document.body.textContent

    for (const pontos of ['1000', '500', '200', '100']) {
      expect(texto, pontos).toContain(pontos)
    }

    // R12.1 — o número que decide a partida.
    expect(texto).toContain('3000')
  })
})
