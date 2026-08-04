import type { CartaBaixada, Comando } from '../comandos/comando.ts'
import type { Carta } from '../dominio/carta.ts'
import { podeBater } from '../dominio/batida.ts'
import { aumentarJogo, criarJogo, regularizarJogo } from '../dominio/jogo.ts'
import type { Jogo, Posicao } from '../dominio/jogo.ts'
import type { VisaoDoJogador } from './visao-de.ts'

/**
 * S145 — o comando **bate**? A pergunta que a `ia/` não consegue responder
 * sozinha.
 *
 * A IA10 quer bater assim que puder, e a S115 já mediu por que isso exige o
 * **resultado**: a jogada que zera a mão pode ser exatamente a que fecha a
 * canastra limpa. A `VisaoDoJogador` carrega os jogos de agora, e reconstruir o
 * resultado dentro da `ia/` seria a S140 de volta — a mesma regra em dois
 * módulos, concordando por acaso de escrita.
 *
 * O que esta consulta **reusa** é o `podeBater`, expressão única da R10.1 desde
 * a S140. O que ela não reusa é a construção do jogo resultante: a enumeração já
 * a tem pronta na `Leitura` e pagaria caro para jogá-la fora, e aqui só chega o
 * `Comando`. Essa duplicação é aceita **sob medição**: a `CA-S145-3` confere,
 * comando a comando ao longo de partidas inteiras, que esta resposta é a mesma
 * que `aplicar` dá de fato.
 *
 * As três perguntas estão em ordem de **preço**, e não de importância. A cara é
 * a última, e quase nunca é feita: com a mão grande, `zeraAMao` já responde não.
 */
export function bateCom(visao: VisaoDoJogador, comando: Comando): boolean {
  // R9.2 antes de R10.1 (S111): quem zera a mão com morto na mesa **pega o
  // morto**, e a rodada continua. Em `aplicar` isso é a ordem de `comFimDeMao`;
  // aqui precisa ser dito, porque a consulta não tem ordem para se apoiar.
  if (visao.mortosRestantes > 0) {
    return false
  }

  if (!zeraAMao(visao, comando)) {
    return false
  }

  const jogos = jogosApos(visao, comando)

  return jogos !== null && podeBater(visao, jogos)
}

/**
 * O comando deixa a mão **vazia**?
 *
 * Mora aqui, e não na `ia/`, porque as duas parcelas que dependem disso — a
 * batida (IA10) e a corrida ao morto (IA8) — precisam concordar. Duas contagens
 * da mesma coisa é o começo do defeito da S140.
 */
export function zeraAMao(visao: VisaoDoJogador, comando: Comando): boolean {
  switch (comando.tipo) {
    case 'comprarDoMonte':
    case 'pegarLixo':
      // As duas **aumentam** a mão (R4.1, R4.2). Nunca zeram.
      return false
    case 'descartar':
      return visao.mao.length === 1
    case 'baixar':
    case 'aumentar':
    case 'regularizarCuringa':
      return visao.mao.length === comando.cartas.length
  }
}

/**
 * Os jogos que eu terei **depois** do comando, ou `null` se ele não construir um
 * jogo válido.
 *
 * É o `jogosDepois` de `movimentosValidos` visto do outro lado: lá o jogo
 * resultante já veio pronto da `Leitura`, aqui ele precisa ser construído a
 * partir do `Comando`. O `aumentar` e o `regularizarCuringa` **substituem**, e
 * somar sem tirar a versão antiga é o defeito que a `CA-S140-4` prende.
 */
function jogosApos(
  visao: VisaoDoJogador,
  comando: Comando,
): readonly (readonly Posicao[])[] | null {
  const atuais = visao.meusJogos.map((jogo) => jogo.posicoes)

  switch (comando.tipo) {
    case 'comprarDoMonte':
    case 'pegarLixo':
    case 'descartar':
      // Nenhum deles toca a mesa.
      return atuais
    case 'baixar': {
      const daMao = posicoesDaMao(visao.mao, comando.cartas)

      if (daMao === null) {
        return null
      }

      const resultado = criarJogo(visao.eu, daMao)

      return resultado.tipo === 'valido' ? [...atuais, resultado.jogo.posicoes] : null
    }
    case 'aumentar': {
      const alvo = jogoAlvo(visao, comando.jogo)
      const daMao = posicoesDaMao(visao.mao, comando.cartas)

      if (alvo === null || daMao === null) {
        return null
      }

      const resultado = aumentarJogo(alvo, daMao)

      return resultado.tipo === 'valido' ? substituindo(visao, alvo, resultado.jogo.posicoes) : null
    }
    case 'regularizarCuringa': {
      const alvo = jogoAlvo(visao, comando.jogo)
      const daMao = posicoesDaMao(
        visao.mao,
        comando.cartas.map((carta) => ({ carta })),
      )

      if (alvo === null || daMao === null) {
        return null
      }

      const resultado = regularizarJogo(
        alvo,
        daMao.map((posicao) => posicao.carta),
      )

      return resultado.tipo === 'valido' ? substituindo(visao, alvo, resultado.jogo.posicoes) : null
    }
  }
}

/** S66 — a posse é estrutural: só há onde procurar entre os meus jogos. */
function jogoAlvo(visao: VisaoDoJogador, id: string): Jogo | null {
  return visao.meusJogos.find((jogo) => jogo.id === id) ?? null
}

function substituindo(
  visao: VisaoDoJogador,
  alvo: Jogo,
  posicoes: readonly Posicao[],
): readonly (readonly Posicao[])[] {
  return [
    ...visao.meusJogos.filter((jogo) => jogo.id !== alvo.id).map((jogo) => jogo.posicoes),
    posicoes,
  ]
}

/** S52 — cartas pedidas viram posições, e o `representa` é o que separa as duas. */
function posicoesDaMao(
  mao: readonly Carta[],
  pedidas: readonly CartaBaixada[],
): readonly Posicao[] | null {
  const posicoes: Posicao[] = []

  for (const baixada of pedidas) {
    const carta = mao.find((daMao) => daMao.id === baixada.carta)

    if (carta === undefined) {
      return null
    }

    posicoes.push(
      baixada.representa === undefined
        ? { tipo: 'Natural', carta }
        : { tipo: 'Curinga', carta, representa: baixada.representa },
    )
  }

  return posicoes
}
