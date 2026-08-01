import { useMemo } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import type { RouterHistory } from '@tanstack/react-router'
import ProvedorDaPartida from '../estado/ProvedorDaPartida.tsx'
import { criarRoteador } from './rotas/roteador.tsx'

/**
 * Raiz de composição: o estado por cima, o roteador por dentro.
 *
 * O provedor fica **acima** do `RouterProvider`, e não dentro da rota raiz como
 * a S15 dizia. O motivo apareceu ao escrever o teste da CA-S14-1: `beforeLoad`
 * roda fora do React e não enxerga contexto de componente, então a partida
 * precisa estar acessível de cima. A spec §4.3 merece essa correção no passo 4.
 *
 * O `historico` opcional existe para o teste navegar em memória, sem tocar na
 * URL do navegador — a aplicação real não passa nada e usa o histórico normal.
 */
export default function Aplicacao({ historico }: { historico?: RouterHistory }) {
  const roteador = useMemo(() => criarRoteador(historico), [historico])

  return (
    <ProvedorDaPartida>
      <RouterProvider router={roteador} />
    </ProvedorDaPartida>
  )
}
