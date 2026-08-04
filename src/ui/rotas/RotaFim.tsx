import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { vencedorDa } from '../../engine/index.ts'
import { usePartidaEmCurso } from '../../estado/partida-em-curso.ts'
import TelaFim from '../telas/TelaFim.tsx'

/**
 * A rota `/fim`, que existia como `<h1>` vazio desde a tarefa 0.7.
 *
 * S135 — sem partida em memória ela volta para `/`, pelo mesmo efeito que a
 * `RotaPartida` usa desde a H1 (S14). E sem **vencedor** também: chegar aqui com
 * a partida em andamento é digitar a URL na mão, e a tela não teria o que dizer.
 *
 * S132 — quem lê a R12.2 é `vencedorDa`, na engine. A rota só pergunta.
 */
export default function RotaFim() {
  const { partida, iniciar } = usePartidaEmCurso()
  const navegar = useNavigate()
  const vencedor = partida === null ? null : vencedorDa(partida)

  useEffect(() => {
    if (vencedor === null) {
      void navegar({ to: '/', replace: true })
    }
  }, [vencedor, navegar])

  if (partida === null || vencedor === null) {
    return null
  }

  // RF1.5 — nova partida começa do zero, e é a mesma ação da tela inicial.
  const jogarDeNovo = () => {
    iniciar()
    void navegar({ to: '/partida' })
  }

  return <TelaFim vencedor={vencedor} placar={partida.placar} aoJogarDeNovo={jogarDeNovo} />
}
