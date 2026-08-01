/**
 * Fisher-Yates **descendente**, conforme a S4: para `i` de `103` até `1`,
 * `j = floor(aleatorio() * (i + 1))`, troca `carta[i]` com `carta[j]`.
 *
 * A direção faz parte da especificação. Inverter o laço produz outra
 * distribuição para a mesma semente e reprova a CA-S4-1.
 */
export function embaralhar<T>(itens: readonly T[], aleatorio: () => number): T[] {
  const baralho = [...itens]

  for (let i = baralho.length - 1; i > 0; i -= 1) {
    const j = Math.floor(aleatorio() * (i + 1))
    const emI = baralho[i]
    const emJ = baralho[j]

    // `noUncheckedIndexedAccess` torna os dois `T | undefined`, e o ADR-0007
    // proíbe asserção de não-nulo. O guarda é inalcançável — `i` e `j` estão
    // sempre dentro do baralho — mas escrevê-lo custa três linhas e é a
    // diferença entre tratar e presumir.
    if (emI === undefined || emJ === undefined) {
      throw new Error(`índice fora do baralho: i=${String(i)}, j=${String(j)}`)
    }

    baralho[i] = emJ
    baralho[j] = emI
  }

  return baralho
}
