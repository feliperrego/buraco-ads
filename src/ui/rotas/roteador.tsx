import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import type { RouterHistory } from '@tanstack/react-router'
import App from '../App.tsx'
import RotaInicial from './RotaInicial.tsx'
import RotaPartida from './RotaPartida.tsx'

/**
 * As quatro telas de docs/screens.md §1. A H1 preenche duas; `/fim` e `/regras`
 * seguem vazias, como a RD2 as criou.
 *
 * Roteamento por código, e não por arquivos, pelo ADR-0009.
 *
 * As duas rotas com conteúdo moram em arquivos próprios porque este exporta a
 * fábrica, que não é componente — o `react-refresh` não deixa os dois juntos.
 */
const rotaRaiz = createRootRoute({ component: App })

const rotaInicial = createRoute({
  getParentRoute: () => rotaRaiz,
  path: '/',
  component: RotaInicial,
})

const rotaPartida = createRoute({
  getParentRoute: () => rotaRaiz,
  path: '/partida',
  component: RotaPartida,
})

const rotaFim = createRoute({
  getParentRoute: () => rotaRaiz,
  path: '/fim',
  component: () => <h1>Fim de partida</h1>,
})

const rotaRegras = createRoute({
  getParentRoute: () => rotaRaiz,
  path: '/regras',
  component: () => <h1>Regras</h1>,
})

const arvoreDeRotas = rotaRaiz.addChildren([rotaInicial, rotaPartida, rotaFim, rotaRegras])

/**
 * Fábrica, e não instância de módulo, para o teste poder criar um roteador com
 * histórico em memória sem depender da URL do navegador.
 */
export function criarRoteador(history?: RouterHistory) {
  return createRouter({ routeTree: arvoreDeRotas, history })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof criarRoteador>
  }
}
