import type { Comando } from '../comandos/comando.ts'
import type { VisaoDoJogador } from './visao-de.ts'

/**
 * M10 — enumera **todos** os comandos legais no estado atual, e é o único lugar
 * onde "o que pode ser jogado" é decidido. A interface filtra por esta lista
 * (RF2.1), a IA escolhe dentro dela (RF5.2), e os testes a leem diretamente.
 *
 * M12/S19 — recebe a **visão**, nunca a `Partida`. Não é preferência de estilo:
 * é o que torna impossível, por construção, um movimento calculado a partir de
 * informação oculta. E é a visão que carrega o `eu`, então a pergunta "quais são
 * os movimentos de quem?" nunca fica ambígua.
 */
export function movimentosValidos(visao: VisaoDoJogador): readonly Comando[] {
  // S20 — fora da sua vez não há jogada nenhuma. A mesa inerte da S18 é este
  // `[]`, e não código de interface.
  if (visao.jogadorDaVez !== visao.eu) {
    return []
  }

  if (visao.fase === 'Compra') {
    // R3.2 — descartar não aparece aqui. A ausência da aresta é a regra
    // (domain.md §1.3), não uma validação.
    return visao.cartasNoMonte > 0 ? [{ tipo: 'comprarDoMonte' }] : []
  }

  // R7.1, R7.2 — qualquer carta da mão pode ser descartada, inclusive a que
  // acabou de ser comprada. A T7 pediu enumeração completa antes de otimizar.
  return visao.mao.map((carta) => ({ tipo: 'descartar', carta: carta.id }))
}
