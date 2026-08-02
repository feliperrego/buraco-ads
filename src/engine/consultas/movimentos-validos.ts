import type { Comando } from '../comandos/comando.ts'
import { NAIPES } from '../dominio/carta.ts'
import type { Carta } from '../dominio/carta.ts'
import { casasDe } from '../dominio/jogo.ts'
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
  return [
    ...visao.mao.map((carta): Comando => ({ tipo: 'descartar', carta: carta.id })),
    ...baixares(visao.mao),
  ]
}

/**
 * As cartas da mão indexadas por casa, cada lista ordenada por `id`.
 *
 * S47 — cartas repetidas geram um comando só, e a canônica de cada casa é a de
 * menor `id`. A M1 diz que as regras comparam só naipe e valor, então as cópias
 * são intercambiáveis: oferecer as duas seria ruído na interface sem escolha
 * real por trás. A lista completa fica porque o Ás precisa dela — ver
 * `canonicasDo`.
 */
function porCasa(doNaipe: readonly Carta[]): ReadonlyMap<number, readonly Carta[]> {
  const mapa = new Map<number, Carta[]>()

  for (const carta of [...doNaipe].sort((uma, outra) => uma.id.localeCompare(outra.id))) {
    for (const casa of casasDe(carta.valor)) {
      const lista = mapa.get(casa) ?? []

      lista.push(carta)
      mapa.set(casa, lista)
    }
  }

  return mapa
}

/**
 * A carta canônica de cada casa do trecho, sem repetir carta.
 *
 * O único caso em que uma carta serve a duas casas é o Ás, que aparece na 0 e na
 * 13 (S42). Um trecho que use as duas pontas precisa, portanto, de dois Ases —
 * é a exceção da R5.6, e aqui ela cai de graça: se o segundo não existir, o
 * trecho não vira comando.
 */
function canonicasDo(
  trecho: readonly number[],
  mapa: ReadonlyMap<number, readonly Carta[]>,
): readonly Carta[] | null {
  const usadas = new Set<string>()
  const escolhidas: Carta[] = []

  for (const casa of trecho) {
    const candidata = (mapa.get(casa) ?? []).find((carta) => !usadas.has(carta.id))

    if (candidata === undefined) {
      return null
    }

    usadas.add(candidata.id)
    escolhidas.push(candidata)
  }

  return escolhidas
}

/**
 * S46 — a enumeração é por **corridas de casas**, não por subconjuntos da mão.
 *
 * A intuição de "todos os subconjuntos" dá `2^22`, mais de quatro milhões, e foi
 * ela que assustou a T7. Mas sequência é trecho contíguo de uma linha de catorze
 * casas: o espaço tem no máximo `4 naipes × 14 × 14` candidatos, e na prática
 * muito menos. O medo era de um algoritmo que ninguém precisa escrever.
 */
function baixares(mao: readonly Carta[]): readonly Comando[] {
  const comandos: Comando[] = []

  for (const naipe of NAIPES) {
    const doNaipe = mao.filter((carta) => carta.naipe === naipe)

    if (doNaipe.length < 3) {
      continue
    }

    const mapa = porCasa(doNaipe)
    const ocupadas = [...mapa.keys()].sort((uma, outra) => uma - outra)

    for (let inicio = 0; inicio < ocupadas.length; inicio++) {
      for (let fim = inicio + 2; fim < ocupadas.length; fim++) {
        const primeira = ocupadas[inicio] ?? 0
        const ultima = ocupadas[fim] ?? 0

        // Achou buraco: nenhum trecho maior começando aqui será contíguo.
        if (ultima - primeira !== fim - inicio) {
          break
        }

        const escolhidas = canonicasDo(ocupadas.slice(inicio, fim + 1), mapa)

        if (escolhidas === null) {
          continue
        }

        // S45 — a única decisão do projeto que restringe o jogo além das regras.
        // Baixar tudo deixaria o jogador sem carta para descartar, e a R7.1
        // exige o descarte; a exceção é a batida (R7.3), que é a H10. Sem a
        // guarda, a partida alcança um estado sem especificação. Sai junto com
        // a batida.
        if (escolhidas.length === mao.length) {
          continue
        }

        comandos.push({ tipo: 'baixar', cartas: escolhidas.map((carta) => carta.id) })
      }
    }
  }

  return comandos
}
