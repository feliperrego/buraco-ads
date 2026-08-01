import { createContext, useContext } from 'react'
import { iniciarPartida } from '../engine/index.ts'
import type { Partida } from '../engine/index.ts'

/**
 * A6 — `useReducer` + Context. Guarda a partida em curso entre as rotas.
 *
 * A semente **não** é gerada dentro do reducer. A S8 manda gerá-la em `estado/`,
 * e um reducer precisa ser puro: sob `StrictMode` o React o invoca duas vezes, e
 * um `Math.random()` lá dentro produziria duas sementes diferentes, matando a
 * RNF1.3 já na primeira tela. Por isso ela é sorteada no despachante e chega
 * pronta na ação.
 *
 * Este arquivo é `.ts` e não `.tsx` de propósito: o `react-refresh` exige que um
 * módulo com componente exporte **só** componentes, então a lógica pura mora
 * aqui e o provedor mora sozinho em `ProvedorDaPartida.tsx`.
 */
export type AcaoDaPartida = { readonly tipo: 'iniciar'; readonly semente: number }

export type EstadoDaPartida = {
  readonly partida: Partida | null
}

export const INICIAL: EstadoDaPartida = { partida: null }

export function reduzir(estado: EstadoDaPartida, acao: AcaoDaPartida): EstadoDaPartida {
  // O estado anterior não participa: a H1 só sabe começar do zero. Substituir
  // uma partida em curso é a RF1.3, que exige confirmação e chega na H16.
  void estado

  // Sem `switch` porque há uma ação só, e o lint reclama com razão de um desvio
  // cuja condição é sempre verdadeira. Ele nasce junto com a segunda ação, na H2.
  return { partida: iniciarPartida(acao.semente) }
}

/** S8 — a única fonte de aleatoriedade do sistema, e ela vive fora da engine. */
export function sortearSemente(): number {
  return Math.floor(Math.random() * 2 ** 32)
}

export type ContextoDaPartida = {
  readonly partida: Partida | null
  readonly iniciar: () => void
}

export const Contexto = createContext<ContextoDaPartida | null>(null)

export function usePartidaEmCurso(): ContextoDaPartida {
  const contexto = useContext(Contexto)

  if (!contexto) {
    throw new Error('usePartidaEmCurso precisa de um ProvedorDaPartida acima')
  }

  return contexto
}
