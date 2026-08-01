import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TelaPartida from './TelaPartida.tsx'
import type { Carta, Comando, VisaoDoJogador } from '../../engine/index.ts'

/**
 * Critérios de interface das specs 0001 §6 e 0002 §6, nível 4 da
 * testing-strategy.md: comportamento, nunca aparência (RNF2.2).
 *
 * A visão é montada à mão em vez de vir de `iniciarPartida`, e isso é
 * deliberado: a tela recebe `VisaoDoJogador` por propriedade (spec 0001 §4.2),
 * então o teste dela não deve depender da engine. A lista de movimentos entra
 * pelo mesmo caminho — a tela **filtra** por ela e nunca valida (T6).
 */
afterEach(cleanup)

type Naipe = Carta['naipe']
type Valor = Carta['valor']

/**
 * Cartas com valores distintos de propósito: a tela rotula cada botão pelo nome
 * legível da carta, e um fixture com onze "3 de copas" tornaria os rótulos
 * ambíguos — o teste passaria a depender da ordem de renderização.
 */
function carta(naipe: Naipe, valor: Valor, copia = 1): Carta {
  return { id: `${naipe}-${valor}-${String(copia)}`, naipe, valor }
}

const ONZE_VALORES: readonly Valor[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J']

function visaoInicial(ajustes: Partial<VisaoDoJogador> = {}): VisaoDoJogador {
  return {
    eu: 0,
    mao: ONZE_VALORES.map((valor) => carta('COPAS', valor)),
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
    ...ajustes,
  }
}

function descartesDe(visao: VisaoDoJogador): readonly Comando[] {
  return visao.mao.map((daMao) => ({ tipo: 'descartar', carta: daMao.id }))
}

/**
 * Os dois critérios abaixo se parecem e cobrem coisas diferentes, de propósito.
 *
 * O CA-S1-1 nasceu na H1, quando a mesa nunca respondia. Depois da H2 ele passou
 * a valer como caso de **componente**: dada uma lista de movimentos vazia, a
 * tela não oferece nada. O CA-S18-1 cobre o caso de **turno**, que é a razão
 * pela qual a lista chega vazia na prática.
 *
 * Mantê-los separados foi decisão explícita: se um dia a tela passar a inventar
 * interatividade que não veio da lista, é o CA-S1-1 que reprova — e ele reprova
 * mesmo que a regra de vez esteja certa.
 */
describe('S1 e S18 — quando a mesa não responde', () => {
  it('CA-S1-1 — sem movimentos disponíveis, nenhum elemento da mesa responde a clique', () => {
    render(<TelaPartida visao={visaoInicial()} movimentos={[]} aoJogar={vi.fn()} />)

    // A âncora positiva vem primeiro, e é o que dá sentido ao resto: sem ela,
    // um componente que não renderiza nada passaria neste critério de graça.
    expect(screen.getAllByRole('region').length).toBeGreaterThan(0)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })

  it('CA-S18-1 — na vez do adversário, nenhum elemento da mesa responde a clique', () => {
    const visao = visaoInicial({ jogadorDaVez: 1 })

    // A S20 já garante que `movimentosValidos` devolve vazio aqui. A tela não
    // reimplementa isso: ela simplesmente não tem o que oferecer.
    render(<TelaPartida visao={visao} movimentos={[]} aoJogar={vi.fn()} />)

    expect(screen.getAllByRole('region').length).toBeGreaterThan(0)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})

describe('RF3.3 e R4.3 — o que a mesa mostra', () => {
  it('CA-S1-2 — a contagem do monte mostra 60 e o lixo indica vazio', () => {
    render(<TelaPartida visao={visaoInicial()} movimentos={[]} aoJogar={vi.fn()} />)

    expect(screen.getByRole('region', { name: /monte/i }).textContent).toContain('60')
    expect(screen.getByRole('region', { name: /lixo/i }).textContent).toMatch(/vazio/i)
  })

  it('CA-R4.3-2 — com três cartas no lixo, a tela mostra as três, não só a contagem', () => {
    const lixo = [carta('COPAS', 'K'), carta('OUROS', '7', 2), carta('PAUS', 'A')]

    render(<TelaPartida visao={visaoInicial({ lixo })} movimentos={[]} aoJogar={vi.fn()} />)

    const painel = screen.getByRole('region', { name: /lixo/i })

    // R4.3 é a característica central do Buraco Aberto: o lixo inteiro é
    // público. Mostrar "3 cartas" satisfaria uma contagem e violaria a regra.
    expect(painel.textContent).toMatch(/k de copas/i)
    expect(painel.textContent).toMatch(/7 de ouros/i)
    expect(painel.textContent).toMatch(/a de paus/i)
  })

  it('CA-RF2.2-1 — de quem é a vez e qual a fase estão sempre indicados', () => {
    render(<TelaPartida visao={visaoInicial({ fase: 'Acao' })} movimentos={[]} aoJogar={vi.fn()} />)

    const painel = screen.getByRole('region', { name: /vez e fase/i })

    expect(painel.textContent).toMatch(/vez/i)
    expect(painel.textContent).toMatch(/ação|acao/i)
  })
})

describe('S27 — descartar exige selecionar e confirmar', () => {
  it('CA-S27-1 — sem carta selecionada, não existe ação de confirmar descarte', () => {
    const visao = visaoInicial({ fase: 'Acao' })

    render(<TelaPartida visao={visao} movimentos={descartesDe(visao)} aoJogar={vi.fn()} />)

    // Âncora positiva: a mão precisa estar selecionável antes de fazer sentido
    // afirmar que o confirmar está ausente. Sem isto, uma tela que não renderiza
    // botão nenhum passaria neste critério de graça — foi o que aconteceu na
    // primeira execução deste teste.
    expect(screen.getAllByRole('button')).toHaveLength(visao.mao.length)

    expect(screen.queryByRole('button', { name: /descartar/i })).toBeNull()
  })

  it('CA-S27-2 — com uma carta selecionada, confirmar descarta aquela carta', () => {
    const visao = visaoInicial({ fase: 'Acao' })
    const aoJogar = vi.fn()

    render(<TelaPartida visao={visao} movimentos={descartesDe(visao)} aoJogar={aoJogar} />)

    // "4 de copas" — quarto valor da lista, e único na mão.
    const alvo = visao.mao[3]
    expect(alvo).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: /^4 de copas$/i }))

    // A RF2.3 não tem desfazer: o primeiro toque seleciona e não descarta.
    expect(aoJogar).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /descartar/i }))

    expect(aoJogar).toHaveBeenCalledWith({ tipo: 'descartar', carta: alvo?.id })
  })
})
