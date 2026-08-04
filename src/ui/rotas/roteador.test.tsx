import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

// O título é um **padrão**, e não texto exato, pelo mesmo motivo da nota acima:
// a H17 trocou o `<h1>Regras</h1>` do esqueleto por "Regras do Buraco", e o
// critério fala de registro de rota, não da redação do título.
const telas = [
  { caminho: '/', titulo: /^buraco$/i },
  { caminho: '/regras', titulo: /regras/i },
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

describe('S161, S162 e S163 — as regras, a volta e o 404', () => {
  it('CA-S161-1 — as três telas do jogo oferecem caminho para as regras', async () => {
    // S161 — o link mora na moldura da rota raiz, não em cada tela: elas são
    // componentes puros, testados sem roteador (spec 0001 §4.2). O critério fala
    // do que o jogador alcança de cada tela, e é isto que se mede.
    render(<Aplicacao historico={createMemoryHistory({ initialEntries: ['/'] })} />)

    expect(await screen.findByRole('button', { name: /iniciar partida/i })).toBeDefined()
    expect(screen.getByRole('link', { name: /regras/i })).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: /iniciar partida/i }))

    expect(await screen.findByRole('region', { name: /minha mão/i })).toBeDefined()
    expect(screen.getByRole('link', { name: /regras/i })).toBeDefined()
  })

  it('CA-S161-2 — a tela de regras oferece caminho de volta, como conteúdo da página', async () => {
    render(<Aplicacao historico={createMemoryHistory({ initialEntries: ['/regras'] })} />)

    expect(await screen.findByRole('heading', { level: 1, name: /regras/i })).toBeDefined()

    // São dois: um no topo e um no fim. A página é longa, e obrigar a rolar até
    // o fim para voltar seria a RNF3.4 pela metade.
    expect(screen.getAllByRole('link', { name: /voltar ao início/i }).length).toBeGreaterThan(0)
  })

  it('CA-S162-1 — iniciar, ir às regras e voltar mantém a mesma partida', async () => {
    render(<Aplicacao historico={createMemoryHistory({ initialEntries: ['/'] })} />)

    fireEvent.click(await screen.findByRole('button', { name: /iniciar partida/i }))

    const antes = (await screen.findByRole('region', { name: /minha mão/i })).textContent

    expect(antes).toBeTruthy()

    fireEvent.click(screen.getByRole('link', { name: /regras/i }))

    expect(await screen.findByRole('heading', { level: 1, name: /regras/i })).toBeDefined()

    // S161 — com partida em curso o rótulo diz **jogo**, e não "início". O link
    // apontando para `/` funcionava, porque a RotaInicial redireciona; o que
    // estava errado era a frase, e quem achou foi rodar o app.
    fireEvent.click(screen.getAllByRole('link', { name: /voltar ao jogo/i })[0] as HTMLElement)

    // S162 — a partida sobrevive porque o provedor fica acima do roteador. Um
    // refactor que o descesse para dentro da rota raiz quebraria só isto.
    expect((await screen.findByRole('region', { name: /minha mão/i })).textContent).toBe(antes)
  })

  it('CA-S162-2 — ir às regras sem partida e voltar não cria partida nenhuma', async () => {
    render(<Aplicacao historico={createMemoryHistory({ initialEntries: ['/regras'] })} />)

    await screen.findByRole('heading', { level: 1, name: /regras/i })
    fireEvent.click(screen.getAllByRole('link', { name: /voltar ao início/i })[0] as HTMLElement)

    expect(await screen.findByRole('button', { name: /iniciar partida/i })).toBeDefined()
    expect(screen.queryByRole('region', { name: /minha mão/i })).toBeNull()
  })

  it('CA-S161-2 — sem partida o link diz "início"; com partida, diz "jogo"', async () => {
    // O par que a H7 ensinou a exigir: conferir o **texto**, não só o destino.
    render(<Aplicacao historico={createMemoryHistory({ initialEntries: ['/regras'] })} />)

    await screen.findByRole('heading', { level: 1, name: /regras/i })

    expect(screen.getAllByRole('link', { name: /voltar ao início/i }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: /voltar ao jogo/i })).toBeNull()
  })

  it('CA-S163-1 — um caminho inexistente mostra tela em português com volta', async () => {
    render(<Aplicacao historico={createMemoryHistory({ initialEntries: ['/nao-existe'] })} />)

    const titulo = await screen.findByRole('heading', { level: 1 })

    expect(titulo.textContent).toMatch(/página não encontrada/i)
    expect(screen.getByRole('link', { name: /voltar ao início/i })).toBeDefined()
  })

  it('CA-S163-2 — o "Not Found" padrão do TanStack não aparece', async () => {
    render(<Aplicacao historico={createMemoryHistory({ initialEntries: ['/nao-existe'] })} />)

    await screen.findByRole('heading', { level: 1 })

    expect(document.body.textContent).not.toMatch(/not found/i)
  })
})
