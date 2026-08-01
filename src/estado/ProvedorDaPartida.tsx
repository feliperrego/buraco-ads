import { useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { Contexto, INICIAL, reduzir, sortearSemente } from './partida-em-curso.ts'
import type { ContextoDaPartida } from './partida-em-curso.ts'
import type { Comando } from '../engine/index.ts'

/**
 * Único export deste arquivo, por exigência do `react-refresh`. A lógica e o
 * gancho ficam em `partida-em-curso.ts`.
 */
export default function ProvedorDaPartida({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(reduzir, INICIAL)

  const valor = useMemo<ContextoDaPartida>(
    () => ({
      partida: estado.partida,
      iniciar: () => {
        // A impureza mora aqui, numa linha, fora do reducer (S8).
        despachar({ tipo: 'iniciar', semente: sortearSemente() })
      },
      jogar: (comando: Comando) => {
        despachar({ tipo: 'jogar', comando })
      },
    }),
    [estado.partida],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
