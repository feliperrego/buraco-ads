/**
 * Tela inicial (RF1.1, RF1.2, screens.md §1).
 *
 * Uma única ação relevante, e a CA-S1-3 conta: um botão a mais quebra o critério
 * tanto quanto um a menos.
 */
export default function TelaInicial({ aoIniciar }: { aoIniciar: () => void }) {
  return (
    <>
      <h1>Buraco</h1>

      <button type="button" onClick={aoIniciar}>
        Iniciar partida
      </button>
    </>
  )
}
