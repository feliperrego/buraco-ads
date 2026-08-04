import { useEffect, useMemo, useReducer, useRef } from 'react'
import type { ReactNode } from 'react'
import { criarAleatorio } from '../engine/index.ts'
import type { Aleatorio, Comando } from '../engine/index.ts'
import { Contexto, INICIAL, reduzir, sortearSemente } from './partida-em-curso.ts'
import type { ContextoDaPartida } from './partida-em-curso.ts'
import { IA, PAUSA_DA_IA_MS, comandoDaIa } from './turno-da-ia.ts'

/**
 * Único export deste arquivo, por exigência do `react-refresh`. A lógica e o
 * gancho ficam em `partida-em-curso.ts`.
 *
 * S32 — é aqui que o turno da IA é conduzido. `ia/` não pode se auto-agendar
 * (a A3 a proíbe de conhecer `estado/` e `ui/`) e `ui/` não pode importar `ia/`.
 * Sobra esta camada, que é a única autorizada a conhecer as duas.
 */
export default function ProvedorDaPartida({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(reduzir, INICIAL)

  // S34 — o `Aleatorio` da IA é de vida longa: um por partida, não um por turno.
  // Recriá-lo a cada jogada faria a IA repetir a escolha sempre que a visão se
  // repetisse, e a E7 precisa de partidas comparáveis para medir força relativa.
  const gerador = useRef<{ semente: number; aleatorio: Aleatorio } | null>(null)

  const partida = estado.partida

  useEffect(() => {
    if (partida === null || partida.jogadorDaVez !== IA) {
      return
    }

    const temporizador = setTimeout(() => {
      if (gerador.current?.semente !== partida.semente) {
        // Deslocamento de 1 para não reusar a sequência que embaralhou o baralho.
        gerador.current = {
          semente: partida.semente,
          aleatorio: criarAleatorio(partida.semente + 1),
        }
      }

      const comando = comandoDaIa(partida, gerador.current.aleatorio)

      if (comando !== null) {
        despachar({ tipo: 'jogar', comando })
      }
    }, PAUSA_DA_IA_MS)

    return () => {
      clearTimeout(temporizador)
    }
    // S33 — um comando por passagem. Cada despacho muda `partida`, o efeito roda
    // de novo, e a IA decide o próximo. Comprar e descartar saem de duas voltas.
  }, [partida])

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
      // S130 — a semente da rodada nova sai daqui, como a da primeira: a A5
      // proíbe a engine de sortear, e a S8 mantém o reducer puro.
      seguirParaProximaRodada: () => {
        despachar({ tipo: 'novaRodada', semente: sortearSemente() })
      },
    }),
    [estado.partida],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
