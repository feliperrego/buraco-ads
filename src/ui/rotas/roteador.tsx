import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import type { RouterHistory } from '@tanstack/react-router'
import App from '../App.tsx'
import RotaFim from './RotaFim.tsx'
import RotaInicial from './RotaInicial.tsx'
import RotaPartida from './RotaPartida.tsx'
import TelaNaoEncontrada from '../telas/TelaNaoEncontrada.tsx'
import RotaRegras from './RotaRegras.tsx'

/**
 * As quatro telas de docs/screens.md §1. A H1 preencheu duas e a H13 a terceira;
 * A H17 preencheu a `/regras`, que era o último esqueleto da RD2, e deu ao
 * roteador a tela de rota inexistente (S163).
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
  component: RotaFim,
})

const rotaRegras = createRoute({
  getParentRoute: () => rotaRaiz,
  path: '/regras',
  component: RotaRegras,
})

const arvoreDeRotas = rotaRaiz.addChildren([rotaInicial, rotaPartida, rotaFim, rotaRegras])

/**
 * Fábrica, e não instância de módulo, para o teste poder criar um roteador com
 * histórico em memória sem depender da URL do navegador.
 */
export function criarRoteador(history?: RouterHistory) {
  // S163 — o 404 é do **roteador**, não do servidor. O *rewrite* de SPA do
  // `vercel.json` faz a Vercel devolver 200 para qualquer caminho (ADR-0008),
  // então quem decide que a rota não existe é esta linha. Sem ela, o padrão do
  // TanStack aparece: "Not Found", em inglês e sem `<h1>`, contra a RNF3.2.
  return createRouter({
    routeTree: arvoreDeRotas,
    history,
    defaultNotFoundComponent: TelaNaoEncontrada,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof criarRoteador>
  }
}
