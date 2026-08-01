import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { usePartidaEmCurso } from '../../estado/partida-em-curso.ts'
import TelaInicial from '../telas/TelaInicial.tsx'

/**
 * A navegação acontece quando a partida **aparece**, e não no clique.
 *
 * Navegar dentro do `onClick` seria uma corrida: o `dispatch` é assíncrono, e
 * `/partida` chegaria a ver `partida === null` — sendo devolvida para cá pela
 * própria regra da S14.
 *
 * Arquivo próprio por exigência do `react-refresh`: `roteador.tsx` exporta a
 * fábrica, que não é componente, e por isso não pode definir componentes.
 */
export default function RotaInicial() {
  const { partida, iniciar } = usePartidaEmCurso()
  const navegar = useNavigate()

  useEffect(() => {
    if (partida) {
      void navegar({ to: '/partida' })
    }
  }, [partida, navegar])

  return <TelaInicial aoIniciar={iniciar} />
}
