import { Link } from '@tanstack/react-router'

/**
 * S163 — a tela de rota inexistente, em português (RNF3.2).
 *
 * O gatilho nasceu na tarefa 0.7 e tem causa conhecida: o *rewrite* de SPA do
 * `vercel.json` faz a hospedagem devolver **200 para qualquer caminho**, então o
 * roteador é o dono do 404. Até aqui ele mostrava o "Not Found" padrão do
 * TanStack — em inglês e sem `<h1>`.
 *
 * Sem estilo, como todas as telas até a H19.
 */
export default function TelaNaoEncontrada() {
  return (
    <>
      <h1>Página não encontrada</h1>

      <p>O endereço que você digitou não existe neste jogo.</p>

      <p>
        <Link to="/">Voltar ao início</Link>
      </p>
    </>
  )
}
