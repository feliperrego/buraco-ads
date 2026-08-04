import { createContext, useContext } from 'react'
import { aplicar, iniciarPartida, novaRodada } from '../engine/index.ts'
import type { Comando, Partida } from '../engine/index.ts'

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
export type AcaoDaPartida =
  | { readonly tipo: 'iniciar'; readonly semente: number }
  | { readonly tipo: 'jogar'; readonly comando: Comando }
  // S129/S130 — a rodada seguinte não é comando, e a semente dela vem daqui pelo
  // mesmo caminho da primeira: o reducer precisa ser puro (S8).
  | { readonly tipo: 'novaRodada'; readonly semente: number }

export type EstadoDaPartida = {
  readonly partida: Partida | null
}

export const INICIAL: EstadoDaPartida = { partida: null }

export function reduzir(estado: EstadoDaPartida, acao: AcaoDaPartida): EstadoDaPartida {
  switch (acao.tipo) {
    case 'iniciar':
      // Substituir uma partida em curso é a RF1.3, que exige confirmação e
      // chega na H16. Aqui iniciar sempre começa do zero.
      return { partida: iniciarPartida(acao.semente) }

    case 'novaRodada':
      return estado.partida === null
        ? estado
        : { partida: novaRodada(estado.partida, acao.semente) }

    case 'jogar': {
      if (estado.partida === null) {
        return estado
      }

      const resultado = aplicar(estado.partida, acao.comando)

      // Uma recusa não deveria chegar aqui: a RF2.1 garante que a interface só
      // oferece o que está em `movimentosValidos`. Se chegar, o estado fica como
      // está — a recusa da S22 existe para proteger a engine, não para virar
      // mensagem de erro que a RF2.1 diz não existir.
      return resultado.tipo === 'sucesso' ? { partida: resultado.partida } : estado
    }
  }
}

/** S8 — a única fonte de aleatoriedade do sistema, e ela vive fora da engine. */
export function sortearSemente(): number {
  return Math.floor(Math.random() * 2 ** 32)
}

export type ContextoDaPartida = {
  readonly partida: Partida | null
  readonly iniciar: () => void
  readonly jogar: (comando: Comando) => void
  readonly seguirParaProximaRodada: () => void
}

export const Contexto = createContext<ContextoDaPartida | null>(null)

export function usePartidaEmCurso(): ContextoDaPartida {
  const contexto = useContext(Contexto)

  if (!contexto) {
    throw new Error('usePartidaEmCurso precisa de um ProvedorDaPartida acima')
  }

  return contexto
}
