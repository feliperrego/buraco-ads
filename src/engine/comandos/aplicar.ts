import type { Carta } from '../dominio/carta.ts'
import { podeBater } from '../dominio/batida.ts'
import { aumentarJogo, criarJogo, regularizarJogo } from '../dominio/jogo.ts'
import type { Posicao } from '../dominio/jogo.ts'
import { apurar, totalDe } from '../dominio/pontuacao.ts'
import type { Jogador, JogadorId, Morto, Partida } from '../dominio/partida.ts'
import type { CartaBaixada, Comando, Resultado } from './comando.ts'

/**
 * M8 — comandos são funções puras: `aplicar(partida, comando)` devolve uma
 * partida nova, nunca muda a recebida.
 *
 * M9 vale em **toda** transição: a soma das cartas em mãos, jogos, monte, lixo e
 * mortos é sempre 104, sem `id` repetido. A H1 provou isso num estado; a partir
 * daqui é invariante de movimento.
 */
export function aplicar(partida: Partida, comando: Comando): Resultado {
  // M3/S103 — quem jogou, capturado **antes** do comando: o `descartar` passa a
  // vez, e o morto é de quem esvaziou a mão, não de quem joga em seguida.
  const quem = partida.jogadorDaVez
  const resultado = executar(partida, comando)

  if (resultado.tipo !== 'sucesso') {
    return resultado
  }

  // S139 — os efeitos automáticos são uma **sequência nomeada**, e não um bloco.
  // A H11 avisou que este lugar acabaria quando alguém pendurasse nele algo que
  // responde a outra pergunta, e é o caso: a conversão da R4.6 responde a "o
  // monte esgotou?", não a "a mão zerou?".
  //
  // A ordem não é livre. Quem zera a mão pega o morto **antes** de o monte poder
  // convertê-lo — a R9.2 não tem ressalva, e é o mesmo argumento da S111.
  return { tipo: 'sucesso', partida: comFimDeMonte(comFimDeMao(resultado.partida, quem)) }
}

/**
 * R4.6, R4.7 e R4.8 — "o monte esgotou?", a segunda pergunta automática.
 *
 * S139 — mora aqui, e não dentro de `comFimDeMao`, porque o gatilho é outro. E
 * roda **depois** dele: o morto que acabou de ser entregue a um jogador não está
 * mais disponível para virar monte.
 */
function comFimDeMonte(partida: Partida): Partida {
  if (partida.monte.length > 0) {
    return partida
  }

  const indice = partida.mortos.findIndex((morto) => morto.destino === null)
  const morto = partida.mortos[indice]

  if (morto === undefined) {
    // R4.8 — sem monte e sem morto, a rodada acaba **sem batida**, e o lixo não
    // conta (S138). A leitura alternativa — esperar o lixo esvaziar — não
    // termina: com uma carta no lixo o `pegarLixo` continua sendo oferecido, e
    // 184 de 200 partidas simuladas ficaram presas exatamente aí.
    return encerrar(partida)
  }

  // R4.7 — qual morto é indiferente, porque eles não têm dono (R2.3). O primeiro
  // não reclamado, como na S104, e pelo mesmo motivo: a escolha é livre e o
  // critério registra qual foi feita.
  const convertido: Morto = { ...morto, cartas: [], destino: 'Monte' }

  return {
    ...partida,
    monte: morto.cartas,
    mortos: indice === 0 ? [convertido, partida.mortos[1]] : [partida.mortos[0], convertido],
  }
}

/**
 * As duas continuações da mão vazia, na ordem em que as regras as põem.
 *
 * S111 — a batida entra **depois** do morto, e a ordem não é escolha nossa: a
 * R9.2 não tem ressalva. Quem zera a mão com morto na mesa pega o morto, mesmo
 * tendo canastra limpa e podendo bater — o `domain.md` §1.3 já dizia isso ao
 * exigir "não há morto disponível" para a batida (M4).
 *
 * O terceiro caso — mão vazia, sem morto, sem poder bater — é o que a R10.1.3
 * proíbe, e a guarda de `movimentosValidos` não o oferece. Se um chamador
 * insistir, o estado fica como está (S22): a engine não inventa regra para
 * consertar quem não escolheu da lista.
 */
function comFimDeMao(partida: Partida, quem: JogadorId): Partida {
  if (partida.jogadores[quem].mao.length > 0) {
    return partida
  }

  const indice = partida.mortos.findIndex((morto) => morto.destino === null)
  const morto = partida.mortos[indice]

  if (morto !== undefined) {
    return comMorto(partida, quem, indice, morto)
  }

  return podeBaterNaPartida(partida, quem) ? encerrar(partida) : partida
}

/**
 * R10.3 e R11 — a rodada encerra e o saldo entra no placar.
 *
 * S122 — a soma acontece **aqui**, e não ao iniciar a rodada seguinte. A
 * alternativa deixaria o jogador olhando uma apuração de `+430` com o placar
 * ainda em `0 × 0` durante toda a tela de apuração, que é justamente o que esta
 * fatia veio entregar.
 *
 * O `placar` é a única coisa desta fatia que é **guardada** em vez de derivada,
 * e a razão é que ele sobrevive à rodada: quando a H13 redistribuir o baralho,
 * os jogos e as mãos que produziram o saldo deixam de existir.
 */
function encerrar(partida: Partida): Partida {
  const [minha, dele] = apurar(partida)

  return {
    ...partida,
    fase: 'RodadaEncerrada',
    placar: [partida.placar[0] + totalDe(minha), partida.placar[1] + totalDe(dele)],
  }
}

/** A R10.1 lida sobre a `Partida`. A regra em si mora em `batida.ts` (S140). */
function podeBaterNaPartida(partida: Partida, quem: JogadorId): boolean {
  return podeBater(
    {
      meusMortos: partida.mortos.filter((morto) => morto.destino === quem).length,
      algumMortoVirouMonte: partida.mortos.some((morto) => morto.destino === 'Monte'),
    },
    partida.jogadores[quem].jogos.map((jogo) => jogo.posicoes),
  )
}

/**
 * M3/S103 — pegar o morto é **efeito automático**, e este é o **único** lugar
 * onde ele acontece.
 *
 * R9.2 — quem fica sem cartas na mão pega um morto, se houver. R9.3 — pode
 * acontecer duas vezes na rodada, porque não há reserva para o adversário.
 *
 * S107 — a função **não toca** `fase` nem `jogadorDaVez`, e é daí que os dois
 * casos da R9.4 caem de graça: quem zerou baixando continua na `Acao` com o
 * descarte pendente, e quem zerou descartando já teve o turno encerrado pelo
 * próprio descarte. A P21 morreu por querer que o efeito encerrasse o turno.
 *
 * A alternativa — cada comando chamar o efeito — foi recusada porque a S70 já
 * provou, neste projeto, que uma guarda replicada por comando deixa um comando
 * de fora e ninguém nota por seis fatias.
 */
function comMorto(partida: Partida, quem: JogadorId, indice: number, morto: Morto): Partida {
  // S104 — o primeiro não reclamado. A R4.7 já decidiu que tanto faz qual, e as
  // cartas entram no **fim** da mão, na ordem do morto (S23, S77).
  //
  // O morto reclamado fica **sem cartas**: elas foram para a mão, e mantê-las
  // aqui as faria existir duas vezes (M9).
  const reclamado = { ...morto, cartas: [], destino: quem }

  return {
    ...partida,
    jogadores: comJogador(partida, quem, {
      ...partida.jogadores[quem],
      mao: [...partida.jogadores[quem].mao, ...morto.cartas],
    }),
    mortos: indice === 0 ? [reclamado, partida.mortos[1]] : [partida.mortos[0], reclamado],
  }
}

function executar(partida: Partida, comando: Comando): Resultado {
  switch (comando.tipo) {
    case 'comprarDoMonte':
      return comprarDoMonte(partida)
    case 'pegarLixo':
      return pegarLixo(partida)
    case 'descartar':
      return descartar(partida, comando.carta)
    case 'baixar':
      return baixar(partida, comando.cartas)
    case 'aumentar':
      return aumentar(partida, comando.jogo, comando.cartas)
    case 'regularizarCuringa':
      return regularizarCuringa(partida, comando.jogo, comando.cartas)
  }
}

/**
 * R6.5, R6.6 — regularizar o curinga do jogo, repondo a carta que ele fazia.
 *
 * S96 — as cartas chegam como **identificadores**, sem `representa`: depois de
 * regularizar o jogo não tem curinga, a I4 aceitaria um novo, e o comando
 * simplesmente não permite pedi-lo. Acrescentar curinga é o que o `aumentar`
 * faz, e a R3.3 deixa fazer as duas coisas em sequência.
 *
 * A posse é estrutural pelo mesmo caminho da S66, e a fase pelo da R3.2.
 */
function regularizarCuringa(
  partida: Partida,
  jogoId: string,
  pedidas: readonly string[],
): Resultado {
  if (partida.fase !== 'Acao') {
    return { tipo: 'recusa', motivo: 'R3.2: não se regulariza antes de comprar' }
  }

  const quem = partida.jogadorDaVez
  const jogador = partida.jogadores[quem]
  const alvo = jogador.jogos.find((umJogo) => umJogo.id === jogoId)

  if (alvo === undefined) {
    return { tipo: 'recusa', motivo: `R6.2: ${jogoId} não é um jogo de quem está jogando` }
  }

  if (!alvo.posicoes.some((posicao) => posicao.tipo === 'Curinga')) {
    // Não é invariante violado: é um comando sem objeto. A I4 permite zero
    // curingas, então `criarJogo` não teria o que reprovar.
    return { tipo: 'recusa', motivo: `R6.5: o jogo ${jogoId} não tem curinga a regularizar` }
  }

  const daMao = posicoesDaMao(
    jogador.mao,
    pedidas.map((carta) => ({ carta })),
    'R6.5',
  )

  if (daMao.tipo === 'recusa') {
    return daMao
  }

  const resultado = regularizarJogo(
    alvo,
    daMao.posicoes.map((posicao) => posicao.carta),
  )

  if (resultado.tipo !== 'valido') {
    return { tipo: 'recusa', motivo: `R5: jogo inválido — ${resultado.violados.join(', ')}` }
  }

  return {
    tipo: 'sucesso',
    partida: {
      ...partida,
      jogadores: comJogador(partida, quem, {
        ...jogador,
        // R6.5 — o `2` **permanece no jogo**. A mão só perde as cartas repostas.
        mao: daMao.sobraram,
        jogos: jogador.jogos.map((umJogo) => (umJogo.id === jogoId ? resultado.jogo : umJogo)),
      }),
    },
  }
}

/**
 * R6.2 — aumentar é acrescentar cartas da mão a um jogo **próprio** já na mesa.
 *
 * S66 — a posse é **estrutural**: o jogo alvo é procurado somente entre os jogos
 * de quem está jogando. Um `id` do adversário não é recusado por uma checagem de
 * dono; ele simplesmente não é encontrado, e cai na mesma recusa de `id`
 * inexistente. É o formato da RF5.2 na visão — o dado que não chega não pode ser
 * usado. Uma segunda checagem seria uma linha a mais que um refactor esquece;
 * uma busca na lista errada não tem como estar certa por acaso.
 *
 * S44/R3.3 vale igual ao `baixar`: a fase continua `Acao` e a vez não passa.
 */
function aumentar(
  partida: Partida,
  jogoId: string,
  acrescentadas: readonly CartaBaixada[],
): Resultado {
  if (partida.fase !== 'Acao') {
    return { tipo: 'recusa', motivo: 'R3.2: não se aumenta antes de comprar' }
  }

  const quem = partida.jogadorDaVez
  const jogador = partida.jogadores[quem]
  const alvo = jogador.jogos.find((umJogo) => umJogo.id === jogoId)

  if (alvo === undefined) {
    return { tipo: 'recusa', motivo: `R6.2: ${jogoId} não é um jogo de quem está jogando` }
  }

  const daMao = posicoesDaMao(jogador.mao, acrescentadas, 'R6.2')

  if (daMao.tipo === 'recusa') {
    return daMao
  }

  const resultado = aumentarJogo(alvo, daMao.posicoes)

  if (resultado.tipo !== 'valido') {
    return { tipo: 'recusa', motivo: `R5: jogo inválido — ${resultado.violados.join(', ')}` }
  }

  return {
    tipo: 'sucesso',
    partida: {
      ...partida,
      jogadores: comJogador(partida, quem, {
        ...jogador,
        mao: daMao.sobraram,
        // R6.4 — o jogo é substituído no lugar, e nenhum outro é tocado. A ordem
        // da lista se mantém, o que deixa estável a chave de renderização.
        jogos: jogador.jogos.map((umJogo) => (umJogo.id === jogoId ? resultado.jogo : umJogo)),
      }),
    },
  }
}

/**
 * R6.1 — baixar é colocar um jogo novo na mesa, válido no momento em que é
 * baixado (R5).
 *
 * S44 — e só isso: a fase continua `Acao` e a vez não passa. É a R3.3 — "quantas
 * ações quiser, em qualquer ordem" —, e a diferença que a H2 não tinha como
 * mostrar, porque tinha um comando só na fase de ação.
 */
function baixar(partida: Partida, baixadas: readonly CartaBaixada[]): Resultado {
  if (partida.fase !== 'Acao') {
    return { tipo: 'recusa', motivo: 'R3.2: não se baixa antes de comprar' }
  }

  const quem = partida.jogadorDaVez
  const jogador = partida.jogadores[quem]
  const daMao = posicoesDaMao(jogador.mao, baixadas, 'R6.1')

  if (daMao.tipo === 'recusa') {
    return daMao
  }

  const resultado = criarJogo(quem, daMao.posicoes)

  if (resultado.tipo !== 'valido') {
    return { tipo: 'recusa', motivo: `R5: jogo inválido — ${resultado.violados.join(', ')}` }
  }

  return {
    tipo: 'sucesso',
    partida: {
      ...partida,
      jogadores: comJogador(partida, quem, {
        ...jogador,
        mao: daMao.sobraram,
        jogos: [...jogador.jogos, resultado.jogo],
      }),
    },
  }
}

type DaMao =
  | {
      readonly tipo: 'posicoes'
      readonly posicoes: readonly Posicao[]
      /** A mão sem as cartas pedidas, já filtrada. */
      readonly sobraram: readonly Carta[]
    }
  | { readonly tipo: 'recusa'; readonly motivo: string }

/**
 * S52 — a conversão de cartas pedidas para **posições**, junto com a checagem de
 * posse. `criarJogo` recebe as posições prontas e passa a conferir, não a
 * inferir, e é aqui que a S51 vira estrutura: sem `representa` a carta é
 * natural, com `representa` ela é curinga fazendo papel daquele valor.
 *
 * `baixar` e `aumentar` compartilham isto por inteiro. A `regra` só muda o texto
 * da recusa — R6.1 num caso, R6.2 no outro —, e essa é a única diferença entre
 * os dois caminhos até `criarJogo`.
 */
function posicoesDaMao(
  mao: readonly Carta[],
  pedidas: readonly CartaBaixada[],
  regra: string,
): DaMao {
  const pedidos = new Set(pedidas.map((baixada) => baixada.carta))

  if (pedidos.size !== pedidas.length) {
    return { tipo: 'recusa', motivo: `${regra}: a mesma carta foi pedida duas vezes` }
  }

  const posicoes: Posicao[] = []

  for (const baixada of pedidas) {
    const carta = mao.find((daMao) => daMao.id === baixada.carta)

    if (carta === undefined) {
      return { tipo: 'recusa', motivo: `${regra}: a carta ${baixada.carta} não está na mão` }
    }

    posicoes.push(
      baixada.representa === undefined
        ? { tipo: 'Natural', carta }
        : { tipo: 'Curinga', carta, representa: baixada.representa },
    )
  }

  return { tipo: 'posicoes', posicoes, sobraram: mao.filter((carta) => !pedidos.has(carta.id)) }
}

/** Substitui um jogador, preservando a tupla de dois. */
function comJogador(
  partida: Partida,
  quem: JogadorId,
  jogador: Jogador,
): readonly [Jogador, Jogador] {
  return quem === 0 ? [jogador, partida.jogadores[1]] : [partida.jogadores[0], jogador]
}

/** O caso em que só a mão muda: comprar e descartar. */
function comMao(
  partida: Partida,
  quem: JogadorId,
  mao: readonly Carta[],
): readonly [Jogador, Jogador] {
  return comJogador(partida, quem, { ...partida.jogadores[quem], mao })
}

/**
 * R4.1, R4.2 — pegar o lixo é levar **todas** as cartas dele para a mão, como
 * alternativa exclusiva a comprar do monte.
 *
 * S78 — a exclusividade da R4.1 não é escrita: as duas opções partem da `Compra`
 * e as duas levam a `Acao`, e a `Acao` não tem aresta de volta para nenhuma
 * delas. Quem já comprou cai na guarda de fase abaixo, sem que exista qualquer
 * campo "já comprou" para manter em dia.
 *
 * S77 — a pilha entra no **fim** da mão, na ordem em que está no lixo. É a única
 * das três alternativas em que a engine não toca na ordem, e prolonga a S23 sem
 * abrir exceção. Não é decisão de regra — a M1 compara só naipe e valor —, é
 * decisão de observabilidade: o jogador vê a mão nesta ordem.
 */
function pegarLixo(partida: Partida): Resultado {
  if (partida.fase !== 'Compra') {
    return { tipo: 'recusa', motivo: 'R4.1: pegar o lixo só acontece na fase de compra' }
  }

  if (partida.lixo.length === 0) {
    // R4.5 — na interface isto é a ausência do comando na lista (RF2.1); aqui é
    // a recusa que protege a engine de um chamador com bug (S22).
    return { tipo: 'recusa', motivo: 'R4.5: lixo vazio, a única opção é comprar do monte' }
  }

  const quem = partida.jogadorDaVez

  return {
    tipo: 'sucesso',
    partida: {
      ...partida,
      jogadores: comMao(partida, quem, [...partida.jogadores[quem].mao, ...partida.lixo]),
      // R4.2 — "todas as cartas dele. Nunca uma parte." O lixo esvazia inteiro,
      // e o comando não tem campo que permitisse outra coisa (S76).
      lixo: [],
      fase: 'Acao',
    },
  }
}

function comprarDoMonte(partida: Partida): Resultado {
  if (partida.fase !== 'Compra') {
    return { tipo: 'recusa', motivo: 'R3.1: comprar só acontece na fase de compra' }
  }

  // S6 — o topo é monte[0].
  const topo = partida.monte[0]

  if (topo === undefined) {
    // A R4.6 converte um morto em monte e a R4.8 encerra a rodada. Nenhuma das
    // duas é da H2: aqui a recusa apenas impede um estado impossível.
    return { tipo: 'recusa', motivo: 'R4.6/R4.8: monte vazio, e a H2 não trata esse caso' }
  }

  const quem = partida.jogadorDaVez

  return {
    tipo: 'sucesso',
    partida: {
      ...partida,
      // S23 — entra no fim da mão, e a engine nunca reordena.
      jogadores: comMao(partida, quem, [...partida.jogadores[quem].mao, topo]),
      monte: partida.monte.slice(1),
      fase: 'Acao',
    },
  }
}

function descartar(partida: Partida, cartaId: string): Resultado {
  if (partida.fase !== 'Acao') {
    // R3.2 — não se descarta antes de comprar. Na interface isso é a ausência do
    // comando na lista (RF2.1); aqui é a recusa que protege a engine (S22).
    return { tipo: 'recusa', motivo: 'R3.2: descartar só depois de comprar' }
  }

  const quem = partida.jogadorDaVez
  const mao = partida.jogadores[quem].mao
  const carta = mao.find((daMao) => daMao.id === cartaId)

  if (carta === undefined) {
    return { tipo: 'recusa', motivo: `R7.1: a carta ${cartaId} não está na mão de quem joga` }
  }

  return {
    tipo: 'sucesso',
    partida: {
      ...partida,
      jogadores: comMao(
        partida,
        quem,
        mao.filter((daMao) => daMao.id !== cartaId),
      ),
      // S24 — lixo[0] é o topo, isto e' a carta descartada mais recentemente.
      lixo: [carta, ...partida.lixo],
      // R7.1 — o descarte encerra o turno.
      fase: 'Compra',
      jogadorDaVez: quem === 0 ? 1 : 0,
    },
  }
}
