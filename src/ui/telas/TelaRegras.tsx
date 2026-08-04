import { Link } from '@tanstack/react-router'

/**
 * A tela de regras (screens.md §1, ADR-0005). Sem estilo — o acabamento é a H19.
 *
 * S159 — o texto é **próprio**, escrito para quem vai jogar, e não o `rules.md`
 * renderizado. O documento normativo tem identificadores, marcas de origem e um
 * histórico de decisões abandonadas: é de engenharia, não de jogador.
 *
 * O que impede a divergência é a citação em comentário sobre cada bloco. Ela não
 * chega à tela, e o `verificar-rastreabilidade.py` a lê: uma regra do `rules.md`
 * que nenhum bloco cite reprova o CI.
 *
 * **S160 — e é só isso que ela prova.** Cobertura, não fidelidade. Que o texto
 * ao lado da citação resuma a regra certa continua sendo leitura humana, e é o
 * único lugar desta fatia onde um erro de domínio caberia.
 */
type Props = {
  /**
   * S161 — com partida em curso, o link de volta leva **ao jogo**, e diz isso.
   * A `RotaInicial` redireciona `/` para `/partida` quando há partida, então
   * apontar para `/` funcionava e mentia no rótulo — achado no navegador.
   */
  readonly emPartida: boolean
}

export default function TelaRegras({ emPartida }: Props) {
  const volta = emPartida ? (
    <Link to="/partida">Voltar ao jogo</Link>
  ) : (
    <Link to="/">Voltar ao início</Link>
  )

  return (
    <>
      <h1>Regras do Buraco</h1>

      <p>
        Esta é a variante <strong>Buraco Aberto</strong>, um contra um.
      </p>

      <p>{volta}</p>

      {/* regras: R1.1, R1.2, R1.3, R1.4 */}
      <section aria-label="Componentes">
        <h2>Componentes</h2>
        <ul>
          <li>São 104 cartas: dois baralhos de 52, sem curingão.</li>
          <li>
            Quatro naipes e treze valores. Cada carta — o 7 de copas, por exemplo — existe duas
            vezes.
          </li>
          <li>
            O <strong>2 é o único curinga</strong>. Mas um 2 usado na própria casa dele, dentro de
            uma sequência do seu naipe (como A-2-3 de copas), é carta natural, não curinga.
          </li>
          <li>Cada jogo aceita no máximo um curinga.</li>
        </ul>
      </section>

      {/* regras: R2.1, R2.2, R2.3, R2.4, R2.5, R2.6 */}
      <section aria-label="Preparação da rodada">
        <h2>Preparação da rodada</h2>
        <ul>
          <li>Cada jogador recebe 11 cartas na mão.</li>
          <li>
            São formados <strong>dois mortos de 11 cartas</strong>, virados para baixo. Eles{' '}
            <strong>não têm dono</strong>: qualquer jogador pode pegar qualquer um, e o mesmo
            jogador pode acabar pegando os dois.
          </li>
          <li>A rodada começa com o lixo vazio — nenhuma carta é virada no começo.</li>
          <li>As 60 cartas restantes formam o monte, viradas para baixo.</li>
          <li>
            Na primeira rodada, quem começa é sorteado. Nas rodadas seguintes, o começo alterna.
          </li>
        </ul>
      </section>

      {/* regras: R3.1, R3.2, R3.3, R3.4 */}
      <section aria-label="O turno">
        <h2>O turno</h2>
        <ul>
          <li>
            Todo turno tem três fases, nesta ordem: <strong>comprar</strong> (obrigatório),{' '}
            <strong>baixar e aumentar</strong> (à vontade) e <strong>descartar</strong>{' '}
            (obrigatório).
          </li>
          <li>Não dá para baixar nem aumentar antes de comprar.</li>
          <li>Na fase do meio você faz quantas jogadas quiser, na ordem que quiser.</li>
          <li>
            <strong>Não existe pontuação mínima para a primeira descida.</strong> Pode baixar o
            primeiro jogo a qualquer momento.
          </li>
        </ul>
      </section>

      {/* regras: R4.1, R4.2, R4.3, R4.4, R4.5, R4.6, R4.7, R4.8 */}
      <section aria-label="A compra">
        <h2>A compra</h2>
        <ul>
          <li>
            No começo do turno você escolhe uma das duas: comprar <strong>uma</strong> carta do
            monte, ou <strong>pegar o lixo</strong>. Nunca as duas.
          </li>
          <li>Pegar o lixo leva todas as cartas dele para a sua mão. Nunca uma parte.</li>
          <li>
            No Buraco Aberto o lixo fica <strong>visível o tempo todo</strong>, para os dois
            jogadores.
          </li>
          <li>
            <strong>Não há condição para pegar o lixo.</strong> Você não precisa usar a carta do
            topo para justificar a compra — isso é do Buraco Fechado.
          </li>
          <li>Com o lixo vazio, só resta comprar do monte.</li>
          <li>
            Se o monte acabar e ainda houver morto na mesa,{' '}
            <strong>um morto vira o novo monte</strong> e a rodada continua. Como os mortos não têm
            dono, tanto faz qual deles.
          </li>
          <li>
            Se o monte acabar e não houver morto, a rodada <strong>termina ali</strong>, sem batida.
            A pontuação é apurada normalmente.
          </li>
        </ul>
      </section>

      {/* regras: R5.1, R5.2, R5.3, R5.4, R5.5, R5.6 */}
      <section aria-label="Sequências">
        <h2>Sequências</h2>
        <ul>
          <li>
            Um jogo é sempre uma <strong>sequência</strong>: três ou mais cartas do mesmo naipe, em
            ordem. <strong>Não existe trinca</strong> neste jogo.
          </li>
          <li>
            A ordem é A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A. O Ás pode ficar nas duas pontas da
            mesma sequência.
          </li>
          <li>
            A sequência <strong>termina no Ás alto</strong> e não continua além dele: K-A-2 não
            vale, e a sequência maior possível tem 14 cartas.
          </li>
          <li>O curinga pode ocupar qualquer casa, inclusive as pontas.</li>
          <li>
            Duas cartas de mesmo valor não cabem na mesma sequência, com uma exceção: os dois Ases
            da sequência de 14 cartas, um em cada ponta.
          </li>
        </ul>
      </section>

      {/* regras: R6.1, R6.2, R6.3, R6.4, R6.5, R6.6 */}
      <section aria-label="Baixar e aumentar">
        <h2>Baixar e aumentar</h2>
        <ul>
          <li>
            <strong>Baixar</strong> é pôr um jogo novo na mesa. Ele precisa ser válido no momento em
            que desce.
          </li>
          <li>
            <strong>Aumentar</strong> é acrescentar cartas a um jogo que já está na mesa — e só aos{' '}
            <strong>seus</strong>, nunca aos do adversário.
          </li>
          <li>Dá para aumentar uma canastra, até o limite de 14 cartas.</li>
          <li>
            <strong>Não dá para reorganizar</strong> o que já foi baixado: nem mover cartas entre os
            seus jogos, nem dividir um jogo em dois.
          </li>
        </ul>

        <h3>Limpar a canastra</h3>
        <p>
          Um curinga já baixado <strong>deixa de ser curinga</strong> quando passa a ocupar a casa
          natural dele. Ele fica no jogo — não volta para a mão. Isso é a única exceção à regra de
          não reorganizar, e exige as três coisas ao mesmo tempo:
        </p>
        <ol>
          <li>
            O curinga é o <strong>2 do naipe da própria sequência</strong>. Um 2 de outro naipe
            nunca pode ser regularizado.
          </li>
          <li>A sequência cresce até alcançar a casa do 2, entre o Ás e o 3.</li>
          <li>A carta que o curinga estava fazendo é reposta no jogo.</li>
        </ol>
        <p>
          A consequência prática vale conhecer: uma canastra cujo curinga é de{' '}
          <strong>outro naipe</strong> fica suja para sempre. Por isso escolher qual 2 usar como
          curinga já é uma decisão na hora de baixar.
        </p>
      </section>

      {/* regras: R7.1, R7.2, R7.3 */}
      <section aria-label="O descarte">
        <h2>O descarte</h2>
        <ul>
          <li>O turno termina com você pondo exatamente uma carta no lixo.</li>
          <li>
            Pode ser qualquer carta da mão, inclusive uma que você acabou de comprar ou de pegar do
            lixo no mesmo turno.
          </li>
          <li>
            O descarte é obrigatório <strong>exceto na batida</strong>: dá para encerrar a rodada
            baixando ou aumentando com todas as cartas que restarem, sem descartar.
          </li>
        </ul>
      </section>

      {/* regras: R8.1, R8.2, R8.3, R8.4, R8.5, R8.6 */}
      <section aria-label="Canastras">
        <h2>Canastras</h2>
        <p>
          Uma <strong>canastra</strong> é um jogo que chegou a sete ou mais cartas. São quatro
          categorias, e vale sempre a primeira que se encaixar, de cima para baixo:
        </p>
        <ul>
          <li>
            <strong>1000 pontos</strong> — sequência de Ás a Ás, com 14 cartas.
          </li>
          <li>
            <strong>500 pontos</strong> — sequência de Ás a Rei, com 13 cartas.
          </li>
          <li>
            <strong>200 pontos</strong> — canastra limpa: sete ou mais cartas, todas naturais.
          </li>
          <li>
            <strong>100 pontos</strong> — canastra suja: sete ou mais cartas, com um curinga.
          </li>
        </ul>
        <p>
          As de 500 e de 1000 <strong>aceitam curinga</strong>: uma sequência de Ás a Rei com um
          curinga ainda vale 500.
        </p>
        <p>
          As duas maiores dependem de <strong>onde</strong> a sequência está, não só do tamanho
          dela. A de 500 exige exatamente de Ás a Rei — uma sequência de 13 cartas que vá do 2 até o
          Ás alto <strong>não</strong> vale 500: vale como limpa ou suja.
        </p>
        <p>
          A categoria é recalculada o tempo todo. Uma canastra suja cujo curinga foi regularizado
          passa a valer como limpa na mesma hora.
        </p>
      </section>

      {/* regras: R9.1, R9.2, R9.3, R9.4, R9.5, R9.6 */}
      <section aria-label="O morto">
        <h2>O morto</h2>
        <ul>
          <li>Os dois mortos são um recurso comum, sem dono.</li>
          <li>
            Você pega um morto <strong>no instante em que fica sem cartas na mão</strong>, se ainda
            houver morto disponível. Vale tanto zerando ao baixar quanto ao descartar.
          </li>
          <li>
            O mesmo jogador pode pegar <strong>os dois</strong>, se zerar a mão duas vezes na
            rodada. Não há um reservado para o adversário.
          </li>
          <li>
            Pegar o morto <strong>não encerra o turno</strong>. Se a mão zerou antes do descarte,
            você pega o morto e descarta em seguida.
          </li>
          <li>Só bate quem já pegou pelo menos um morto — com a exceção descrita na batida.</li>
          <li>Terminar a rodada sem nenhum morto custa 100 pontos, com a mesma exceção.</li>
        </ul>
      </section>

      {/* regras: R10.1, R10.1.1, R10.1.2, R10.1.3, R10.2, R10.3, R10.4 */}
      <section aria-label="A batida">
        <h2>A batida</h2>
        <ul>
          <li>
            Você <strong>bate</strong> ao ficar sem cartas na mão, cumpridas duas condições: já ter
            pegado ao menos um morto, <strong>e</strong> ter ao menos uma canastra limpa na mesa.
          </li>
          <li>
            Para essa condição, as canastras de 500 e de 1000 contam como limpas{' '}
            <strong>se não tiverem curinga</strong>.
          </li>
          <li>
            Se não sobrou morto porque um deles <strong>virou monte</strong>, a exigência de ter
            morto deixa de valer para quem não teve chance de pegar — basta a canastra limpa.
          </li>
          <li>
            Mas se não sobrou morto porque o <strong>adversário pegou os dois</strong>, a exigência
            continua valendo: quem ficou sem morto não bate.
          </li>
          <li>
            Enquanto a batida não for possível, é <strong>proibido</strong> fazer uma jogada que
            esvazie a sua mão sem haver morto — você precisa guardar cartas para o descarte
            obrigatório.
          </li>
          <li>A batida encerra a rodada na hora. O adversário não joga mais nenhum turno.</li>
          <li>A batida pode acontecer com ou sem o descarte final.</li>
        </ul>
      </section>

      {/* regras: R11.1, R11.2, R11.3, R11.4, R11.5, R11.5.1, R11.5.2, R11.6 */}
      <section aria-label="Pontuação da rodada">
        <h2>Pontuação da rodada</h2>
        <p>No fim da rodada, cada jogador soma:</p>
        <ul>
          <li>As canastras, pelos valores da tabela acima.</li>
          <li>
            O valor das cartas: Ás vale 15; 8, 9, 10, J, Q, K e o 2 valem 10; 3, 4, 5, 6 e 7 valem
            5.
          </li>
          <li>
            Cartas <strong>na mesa contam positivo</strong>; cartas que sobraram{' '}
            <strong>na mão contam negativo</strong>.
          </li>
          <li>
            Quem bateu ganha <strong>100 pontos</strong> de bônus.
          </li>
          <li>
            Quem terminou a rodada <strong>sem nenhum morto</strong> perde 100 pontos. A penalidade
            não se aplica a quem ficou sem morto porque um deles virou monte — mas se aplica
            normalmente a quem perdeu a disputa para o adversário.
          </li>
          <li>O saldo de uma rodada pode ser negativo, e o total da partida também.</li>
        </ul>
      </section>

      {/* regras: R12.1, R12.2 */}
      <section aria-label="Fim da partida">
        <h2>Fim da partida</h2>
        <ul>
          <li>
            A partida termina quando alguém chega a <strong>3000 pontos</strong> acumulados.
          </li>
          <li>
            A conferência é <strong>no fim de cada rodada</strong>, nunca no meio. Se os dois
            passarem de 3000 na mesma rodada, vence quem tiver mais pontos; empatando exatamente,
            joga-se mais uma rodada.
          </li>
        </ul>
      </section>

      <p>{volta}</p>
    </>
  )
}
