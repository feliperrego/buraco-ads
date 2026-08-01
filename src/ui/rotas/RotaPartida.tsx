import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { movimentosValidos, visaoDe } from '../../engine/index.ts'
import { usePartidaEmCurso } from '../../estado/partida-em-curso.ts'
import TelaPartida from '../telas/TelaPartida.tsx'

/**
 * S14 — sem partida em memória, volta para a tela inicial.
 *
 * A spec dizia `beforeLoad`, e não deu: ele roda **fora do React** e não enxerga
 * contexto de componente. Passá-lo pelo contexto do roteador exigiria injetar o
 * estado no `RouterProvider` e ainda assim correria com o `dispatch`. O efeito
 * aqui é mais simples e satisfaz o mesmo critério — a CA-S14-1 mede onde a
 * navegação termina, não por qual mecanismo.
 */
export default function RotaPartida() {
  const { partida, jogar } = usePartidaEmCurso()
  const navegar = useNavigate()

  useEffect(() => {
    if (!partida) {
      void navegar({ to: '/', replace: true })
    }
  }, [partida, navegar])

  if (!partida) {
    return null
  }

  // S11 — o humano é sempre 0. A tela nunca vê a `Partida` (spec 0001 §4.2), e
  // recebe a lista de movimentos em vez de decidir o que é válido (T6).
  const visao = visaoDe(partida, 0)

  return <TelaPartida visao={visao} movimentos={movimentosValidos(visao)} aoJogar={jogar} />
}
