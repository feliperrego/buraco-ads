import { Link, Outlet } from '@tanstack/react-router'

/**
 * Layout da rota raiz.
 *
 * O <h1> vive em cada rota, não aqui: dois <h1> na mesma página quebrariam a
 * estrutura de cabeçalhos que a RNF3.4 vai cobrar.
 *
 * **S161 — o caminho para as regras mora aqui, e não nas três telas.** A spec
 * dizia "nas três telas", e implementar assim quebrou trinta testes de uma vez:
 * as telas são componentes puros, testados **sem roteador** (spec 0001 §4.2), e
 * um `Link` exige o `RouterProvider` acima. Não foi acidente de teste — foi o
 * teste dizendo o que a arquitetura já decidia: navegação global é da moldura,
 * não de cada tela. De quebra, ela deixa de estar escrita em três lugares.
 */
export default function App() {
  return (
    <main>
      <nav aria-label="Navegação do jogo">
        <Link to="/regras">Regras do jogo</Link>
      </nav>

      <Outlet />
    </main>
  )
}
