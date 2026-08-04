import { useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { Comando } from '../engine/index.ts'
import { Contexto, INICIAL, emAndamento, reduzir, sortearSemente } from './partida-em-curso.ts'
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

  // S144 — o segundo gerador saiu daqui. A heurística não sorteia: o empate dela
  // vem de chave estável do comando (IA3/S150), e o `useRef` com
  // `criarAleatorio(semente + 1)` que a S34 mantinha não tem mais o que semear.
  //
  // A S130 não muda com isso: a reprodutibilidade da RNF1.3 vale **por entrada**,
  // e a semente que sobra é a do embaralhamento, que continua saindo daqui. O que
  // some junto é a armadilha da H14 — o arnês de simulação errou por não copiar a
  // semeadura por rodada deste `useRef`, e agora não há o que copiar.
  const partida = estado.partida

  useEffect(() => {
    if (partida === null || partida.jogadorDaVez !== IA) {
      return
    }

    const temporizador = setTimeout(() => {
      const comando = comandoDaIa(partida)

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

  // RF1.4/S156 — o aviso antes de fechar a janela, e ele **entra e sai** com a
  // partida. Um ouvinte permanente que decidisse na hora com um `if` passaria em
  // qualquer teste que dispare o evento, e a CA-S156-2 existe para separar os
  // dois casos: sem partida, não há ouvinte nenhum registrado.
  //
  // O `preventDefault` é o que a plataforma pede hoje. Se o navegador mostra o
  // aviso depende de ter havido interação com a página — isso não está sob nosso
  // controle e nenhum teste em jsdom o alcança.
  useEffect(() => {
    if (!emAndamento(partida)) {
      return
    }

    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault()
    }

    window.addEventListener('beforeunload', avisar)

    return () => {
      window.removeEventListener('beforeunload', avisar)
    }
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
      abandonar: () => {
        despachar({ tipo: 'abandonar' })
      },
    }),
    [estado.partida],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
