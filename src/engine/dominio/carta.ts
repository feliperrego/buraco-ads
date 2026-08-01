/**
 * R1.2 — quatro naipes e treze valores.
 *
 * A ordem destas duas listas **é** a ordem canônica da spec 0001 §3.1, usada para
 * montar o baralho antes de embaralhar. Reordená-las muda toda distribuição
 * semeada e reprova a CA-S4-1.
 */
export const NAIPES = ['COPAS', 'OUROS', 'ESPADAS', 'PAUS'] as const
export type Naipe = (typeof NAIPES)[number]

export const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
export type Valor = (typeof VALORES)[number]

/** As duas cópias de cada combinação naipe+valor (R1.2). */
export const COPIAS = [1, 2] as const
export type Copia = (typeof COPIAS)[number]

/**
 * M1 — Entity imutável: tem identidade própria, e as regras comparam apenas
 * naipe e valor. O `id` é legível e derivado do conteúdo (S3), no formato
 * `{NAIPE}-{VALOR}-{COPIA}`.
 */
export type Carta = {
  readonly id: string
  readonly naipe: Naipe
  readonly valor: Valor
}

/**
 * As 104 cartas na ordem canônica, antes de embaralhar (R1.1, spec §3.1).
 *
 * O aninhamento é naipe → valor → cópia, nessa ordem. Trocá-lo muda o baralho
 * inicial e, por consequência, toda distribuição semeada.
 */
export function baralhoCanonico(): readonly Carta[] {
  const cartas: Carta[] = []

  for (const naipe of NAIPES) {
    for (const valor of VALORES) {
      for (const copia of COPIAS) {
        cartas.push({ id: `${naipe}-${valor}-${String(copia)}`, naipe, valor })
      }
    }
  }

  return cartas
}
