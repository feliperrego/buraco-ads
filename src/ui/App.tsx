import { Outlet } from '@tanstack/react-router'

/**
 * Layout da rota raiz.
 *
 * Enquanto as telas estão vazias (roadmap.md RD2), é só a moldura onde cada rota
 * é renderizada. O conteúdo de cada tela nasce com a história que a exige.
 *
 * O <h1> vive em cada rota, não aqui: dois <h1> na mesma página quebrariam a
 * estrutura de cabeçalhos que a RNF3.4 vai cobrar.
 */
export default function App() {
  return (
    <main>
      <Outlet />
    </main>
  )
}
