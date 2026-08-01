import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import type { RouterHistory } from '@tanstack/react-router'
import App from '../App.tsx'

/**
 * As quatro telas de docs/screens.md §1, criadas **vazias** conforme a RD2: o
 * esqueleto de navegação que a RF1.3 e a RF1.4 vão usar, não as telas.
 *
 * Roteamento por código, e não por arquivos, por causa da A7: as rotas moram em
 * src/ui/rotas/ porque a arquitetura já decidiu isso. O plugin de arquivos
 * geraria um routeTree.gen.ts para ser commitado e depois excluído do Prettier,
 * do ESLint e da cobertura — três exceções para economizar vinte linhas.
 */
const rotaRaiz = createRootRoute({ component: App })

const rotaInicial = createRoute({
  getParentRoute: () => rotaRaiz,
  path: '/',
  component: () => <h1>Inicial</h1>,
})

const rotaPartida = createRoute({
  getParentRoute: () => rotaRaiz,
  path: '/partida',
  component: () => <h1>Partida</h1>,
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
