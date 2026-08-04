import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ProvedorDaPartida from './ProvedorDaPartida.tsx'
import { usePartidaEmCurso } from './partida-em-curso.ts'

/**
 * Critérios da spec 0016 §7 — a RF1.4.
 *
 * A S156 decidiu que o ouvinte é **registrado e removido**, e não que ele existe
 * sempre com um `if` dentro. A diferença só aparece num teste que conte
 * registros, e é por isso que estes espionam `addEventListener` em vez de
 * disparar o evento e olhar o resultado: um ouvinte permanente que decide na
 * hora passaria em qualquer teste do segundo tipo.
 */
afterEach(cleanup)

/** Um consumidor mínimo do contexto, para dirigir o provedor de fora. */
function Sonda() {
  const { partida, iniciar, abandonar } = usePartidaEmCurso()

  return (
    <>
      <p>{partida === null ? 'sem partida' : `rodada ${String(partida.numeroDaRodada)}`}</p>
      <button type="button" onClick={iniciar}>
        iniciar
      </button>
      <button type="button" onClick={abandonar}>
        abandonar
      </button>
    </>
  )
}

/** Conta só os registros de `beforeunload`, ignorando os outros do React. */
function espionarOuvintes() {
  const registrados: string[] = []
  const removidos: string[] = []

  vi.spyOn(window, 'addEventListener').mockImplementation((tipo) => {
    registrados.push(tipo)
  })
  vi.spyOn(window, 'removeEventListener').mockImplementation((tipo) => {
    removidos.push(tipo)
  })

  const doTipo = (lista: string[]) => lista.filter((tipo) => tipo === 'beforeunload').length

  return { antesDeSair: () => doTipo(registrados), removidos: () => doTipo(removidos) }
}

describe('S156 — o aviso antes de fechar a janela', () => {
  it('CA-S156-2 — sem partida, nenhum ouvinte de beforeunload é registrado', () => {
    const espia = espionarOuvintes()

    render(
      <ProvedorDaPartida>
        <Sonda />
      </ProvedorDaPartida>,
    )

    expect(screen.getByText('sem partida')).toBeDefined()
    expect(espia.antesDeSair()).toBe(0)

    vi.restoreAllMocks()
  })

  it('CA-S156-1 — com partida em andamento, o ouvinte é registrado', () => {
    const espia = espionarOuvintes()

    render(
      <ProvedorDaPartida>
        <Sonda />
      </ProvedorDaPartida>,
    )

    // Âncora: o registro precisa acontecer **depois** de a partida existir, e o
    // zero de antes é o que prova que ele não é permanente.
    expect(espia.antesDeSair()).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: 'iniciar' }))

    expect(screen.getByText('rodada 1')).toBeDefined()
    expect(espia.antesDeSair()).toBeGreaterThan(0)

    vi.restoreAllMocks()
  })

  it('CA-S156-1 — o ouvinte chama preventDefault', () => {
    render(
      <ProvedorDaPartida>
        <Sonda />
      </ProvedorDaPartida>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'iniciar' }))

    const evento = new Event('beforeunload', { cancelable: true })
    const impedir = vi.spyOn(evento, 'preventDefault')

    window.dispatchEvent(evento)

    expect(impedir).toHaveBeenCalled()

    // A ressalva da spec §5: isto prova que **o nosso código** pediu o aviso. Se
    // o navegador o mostra depende de ter havido interação com a página, e
    // nenhum teste em jsdom alcança essa parte.
  })

  it('CA-S157-1 — abandonar remove o ouvinte', () => {
    render(
      <ProvedorDaPartida>
        <Sonda />
      </ProvedorDaPartida>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'iniciar' }))

    const espia = espionarOuvintes()

    fireEvent.click(screen.getByRole('button', { name: 'abandonar' }))

    expect(screen.getByText('sem partida')).toBeDefined()
    expect(espia.removidos()).toBeGreaterThan(0)
    expect(espia.antesDeSair()).toBe(0)

    vi.restoreAllMocks()
  })
})
