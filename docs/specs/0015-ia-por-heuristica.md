# Spec 0015 — H15: o oponente por heurística

> Status: **confirmada** — 9 decisões, confirmadas em bloco em 2026-08-04
> História: `H15` — *"Jogo contra um oponente que toma decisões razoáveis, não aleatórias"*
> Fecha: RF5.1, RF5.2, RF5.3
> Deriva de: [ia-strategy.md](../ia-strategy.md) `IA1`–`IA11`, confirmadas em bloco

## 1. O problema

A IA sorteia dentro de `movimentosValidos` desde a H3. Ela é legal e determinística — duas das
quatro propriedades da E6 —, e não é adversário: baixa uma canastra por acidente, descarta a
carta que completa o jogo do oponente, e pega o lixo porque saiu o número.

A `ia-strategy.md` já decidiu **o que** a heurística prefere. Esta spec decide **onde o código
mora, como ele pergunta as coisas à engine, e como a força é medida**. É deliberadamente sobre
mecânica: as onze decisões de política estão fechadas e não se rediscutem aqui.

Uma coisa que a fatia **não** muda: a interface. A RF5.3 já tem a pausa da S35, e nenhuma tela
ganha elemento novo. O que muda é observável mesmo assim — o painel de jogos do adversário, que
a H8 consertou, passa a encher com jogos escolhidos em vez de sorteados.

---

## 2. Onde a heurística mora, e o que acontece com a aleatória

A E7 é explícita: a aleatória **não é descartada**, vira a linha de base. Então a `ia/` passa a
ter duas políticas, e a pergunta é que forma elas compartilham.

Hoje a assinatura é `decidir(visao, aleatorio)`. A heurística **não usa** o `aleatorio` — a IA3
resolveu o empate por chave estável justamente para não precisar dele. Três saídas:

| | Como | Custo |
|---|---|---|
| **A** | as duas mantêm `(visao, aleatorio)`, e a heurística ignora o segundo | parâmetro morto na assinatura da política que o projeto usa de verdade |
| **B** | `Politica = (visao) => Comando \| null`, e a aleatória vira `porSorteio(aleatorio): Politica` | `estado/` muda: deixa de criar gerador para a IA |
| **C** | duas assinaturas diferentes, sem tipo comum | o arnês de medição não consegue tratar as duas como intercambiáveis, que é a única coisa que a E7 pede |

- `[D]` **S144** — Forma **B**. `Politica = (visao: VisaoDoJogador) => Comando | null`. A
  heurística é `decidir`, e a aleatória vira `porSorteio(aleatorio)`, uma fábrica que fecha sobre
  o gerador. `estado/turno-da-ia.ts` para de receber `Aleatorio`, e o `ProvedorDaPartida` para de
  criar o gerador da IA.

> **A consequência de estado que vale olhar antes de aprovar.** O `ProvedorDaPartida` mantém um
> `useRef` com `criarAleatorio(partida.semente + 1)`, recriado a cada rodada, e a S144 o apaga. A
> S130 não é afetada — ela diz que a reprodutibilidade da RNF1.3 vale **por entrada**, e a
> semente que sobra é a do embaralhamento, que continua saindo de `estado/`. O que some é o
> segundo gerador, e com ele some a armadilha da H14: o arnês de simulação errou justamente por
> não reproduzir a semeadura por rodada desse `useRef`. Depois da S144 não há o que reproduzir.

---

## 3. A pergunta cara: como a IA sabe que um comando **bate**

A IA10 diz *"bate assim que pode"*, e é o único item da estratégia que a `ia/` **não consegue
responder sozinha**.

A S115 já mediu por quê: a jogada que zera a mão pode ser exatamente a que fecha a canastra
limpa. Saber se um comando bate exige o **jogo resultante** dele, e a `VisaoDoJogador` carrega os
jogos de agora. Reconstruir o resultado dentro da `ia/` é o defeito da S140 com nome novo — a
mesma condição em dois módulos, concordando por acaso de escrita.

Três saídas:

| | Como | Custo |
|---|---|---|
| **A** | consulta nova na engine: `bateCom(visao, comando): boolean` | reconstrói o jogo resultante a partir do comando, que a enumeração já faz de outro jeito |
| **B** | `movimentosValidos` devolve `{ comando, bate }[]` | muda o contrato que `ui/`, `estado/` e ~40 testes usam, para servir a um consumidor só |
| **C** | a `ia/` recalcula | é a S140 de volta, e ela custou uma partida travada em 200 |

- `[D]` **S145** — Forma **A**. `bateCom` entra em `engine/consultas/`, e o que ela **reusa** é o
  `podeBater` de `dominio/batida.ts` — a expressão única da R10.1 desde a S140. O que ela não
  reusa é a construção do jogo resultante, e essa duplicação é aceita **sob medição**, não sob
  argumento: a `CA-S145-3` confere, comando a comando ao longo de partidas inteiras, que
  `bateCom` concorda com o que `aplicar` faz de verdade.

> **Por que a duplicação é aceitável aqui e não foi na S140.** Os dois lugares fazem a mesma
> pergunta em **momentos diferentes**: a enumeração já tem o jogo construído na mão — a `Leitura`
> traz `cartas` **e** `posicoes` — e pagaria caro para jogá-lo fora e reconstruir; a consulta
> recebe só o `Comando` e não tem escolha. O que a S140 proibia era duas expressões da **regra**;
> `podeBater` continua sendo uma. O que existe em dois lugares é a **construção**, e ela tem um
> juiz: `aplicar`. A `CA-S145-3` é esse juiz virado teste.

---

## 4. A forma da nota

A IA2 fixou pontuação com `argmax`. Falta como a IA10 — *"bate assim que pode"* — convive com
parcelas contínuas.

Um número só exige que o peso da batida **domine qualquer soma** das outras parcelas. Isso é
demonstrável hoje (a mão tem teto, e o valor da carta tem teto), e é exatamente o tipo de
propriedade que se perde em silêncio quando alguém acrescenta uma parcela. O projeto já tem nome
para isso: peso que precisa dominar é peso que pode deixar de dominar.

- `[D]` **S146** — A nota é `{ bate: boolean; valor: number }`, comparada em ordem: primeiro
  `bate`, depois `valor`. A separação da IA10 vira **estrutural** em vez de aritmética, e nenhuma
  parcela nova pode furá-la.

> Isto **não** é a cascata de `if` que a IA2 recusou. A cascata põe *toda* a estratégia na ordem
> das linhas; aqui há exatamente **uma** classe, ela vem de uma regra (R10.3 encerra a rodada), e
> as outras seis parcelas continuam sendo números que se comparam entre si. A pergunta que separa
> as duas formas é: *quantas decisões estão na ordem, e não no número?* Na cascata, todas. Aqui,
> uma — e ela está escrita.

---

## 5. As parcelas

Uma por item confirmado da `ia-strategy.md` §3–§4. **Os pesos são a parte fraca desta spec**, e
estão aqui para serem revistos pela medição, não defendidos.

| Comando | Parcela | Peso | De onde |
|---|---|---|---|
| `baixar`, `aumentar` | valor das cartas movidas | `+2 × Σ valorDaCarta` | IA5 — a R11.3 inverte o sinal, então a diferença é o dobro |
| `baixar`, `aumentar` | o curinga é o `2` do naipe da sequência | `+50` | IA6 — a R6.5 só deixa regularizar esse, e a R8.2 põe 100 na diferença; metade porque regularizar ainda exige as cartas |
| `regularizarCuringa` | limpar a canastra | `+100` | R8.2 — suja para limpa é exatamente 100 |
| qualquer um | a jogada zera a mão e há morto por pegar | `+200` | IA8 — a R9.2 entrega 11 cartas |
| `pegarLixo` | saldo do que encaixa | `Σ valor(encaixa) − Σ valor(não encaixa)` | IA9 |
| `comprarDoMonte` | — | `0` | a linha de base contra a qual o lixo é medido |
| `descartar` | o que a carta entrega | `− valorDaCarta` | IA7 — argmax sobre `−valor` escolhe a **menor**, que é o que a IA7 pede |
| `descartar` | a carta estende jogo visível do adversário | `−100` | IA7 — a R4.2 manda o lixo **inteiro** a quem o pegar, e a R4.3 o deixa visível |

- `[D]` **S147** — Estas oito parcelas, com estes pesos, e nenhuma outra. Parcela nova na H15 só
  se a medição da S150 reprovar.

Duas notas sobre a tabela, e a segunda é uma correção à IA7:

**A magnitude já faz o trabalho da palavra *"equivalentes"*.** A IA7 diz *"entre descartes
equivalentes, a IA solta a de menor valor"*. Com `−100` para o perigo e no máximo `−15` para o
valor (R11.2), o valor nunca supera o perigo — o "entre equivalentes" está codificado na
diferença de escala, sem precisar de uma segunda classe como a da S146.

**A IA7 tem uma metade que a própria `ia-strategy.md` §5 proíbe.** Ela pede também que a carta
*"que ele acabou de mostrar interesse por"* valha menos. Isso é memória entre turnos, e a §5
excluiu memória com o argumento de que o lixo (R4.3) já carrega a informação. Os dois estão
certos e não cabem juntos: o lixo diz o que foi **descartado**, não o que foi **pego** — e
"mostrou interesse" é sobre o que ele pegou.

- `[D]` **S148** — Só a metade visível da IA7 entra: a carta que estende um jogo **da mesa** do
  adversário. A metade do interesse fica fora da H15, com o registro de que ela exige memória e
  a §5 a excluiu. Se a medição pedir, é a §5 que se reabre, não a IA7 que se contorna.

### 5.1 O que "encaixa" quer dizer

A IA9 fala em cartas do lixo que *"encaixam"* nos meus jogos ou na minha mão, e não define. Sem
definição operacional o peso não existe. A definição precisa ser barata: o lixo chega a dezenas
de cartas, e isto roda por comando.

- `[D]` **S149** — Uma carta do lixo **encaixa** quando existe, na minha mão ou nos meus jogos,
  outra carta do **mesmo naipe** a **distância ≤ 2 casas** dela (S41). Duas casas porque a
  sequência mínima é de três (R5.2) e um buraco admite curinga (R5.5) — mais que isso não é
  encaixe, é esperança.

---

## 6. O empate

- `[D]` **S150** — Empate de nota é resolvido pela **chave estável** do comando (IA3): o tipo
  seguido dos identificadores citados, em ordem, comparados como texto. A posição em
  `movimentosValidos` não entra em lugar nenhum da `ia/`, e é isso que mantém a ordem da engine
  livre — foi assim que o gatilho da H10 fechou.

---

## 7. A medição

A IA11 fixou 600 partidas, resultado como intervalo, E6 cumprida pelo **limite inferior**. Falta
onde isso roda.

600 partidas a ~0,5 s dão ~5 minutos. Isso não cabe no `npm run verificar`, que hoje fecha em
segundos e roda antes de cada commit.

| | Como | Custo |
|---|---|---|
| **A** | script `scripts/medir-forca-da-ia.ts`, rodado à mão | a medição não é contínua; um peso alterado não avisa |
| **B** | teste do Vitest com 600 partidas | ~5 min em todo commit e em todo CI, para uma resposta que muda quando os pesos mudam |
| **C** | teste com N pequeno no CI, script com 600 à parte | dois números com o mesmo nome, e o pequeno tem intervalo largo demais para significar algo |

- `[D]` **S151** — Forma **A**. O arnês é `scripts/medir-forca-da-ia.ts`, rodado por
  `node scripts/medir-forca-da-ia.ts` — o Node 22 executa TypeScript direto, sem dependência
  nova. Ele alterna as posições entre as partidas e imprime o intervalo. Fica **fora** do
  `npm run verificar`, e o número medido entra na `ia-strategy.md` §6.

> **A lição da H14 vale aqui e é a razão de o arnês ser código commitado, não rascunho.** O arnês
> daquela fatia previu *"a semente 64 decide em 2 rodadas"* e errou, porque não copiava a
> semeadura por rodada do `ProvedorDaPartida`. Depois da S144 esse gerador não existe mais, mas a
> regra que ficou é outra: **simulação que prevê o app precisa copiar o app**. Commitar o arnês é
> o que deixa a próxima fatia herdar a cópia certa em vez de refazê-la de memória.

As outras três propriedades da E6 continuam sendo teste:

- `[D]` **S152** — Legalidade e determinismo passam a valer para **as duas** políticas, na mesma
  tabela de casos. O tempo da E6 (<100 ms por decisão) vira teste no pior caso construível da T7,
  e a **T7 é remedida** — a S145 acrescenta uma pergunta por comando, e a tabela de gatilhos diz
  que fatia que multiplique o custo da enumeração remede em vez de herdar o "não precisa
  otimizar". A margem atual é de 13%.

---

## 8. Critérios de aceite

**S144 — as duas políticas**

- `CA-S144-1` — `decidir(visao)` devolve comando sem receber gerador algum, e duas chamadas com a
  mesma visão devolvem o mesmo comando
- `CA-S144-2` — `porSorteio(criarAleatorio(s))` devolve uma `Politica`, e duas com a mesma
  semente produzem a mesma sequência de comandos
- `CA-S144-3` — `comandoDaIa(partida)` não recebe `Aleatorio`, e o `ProvedorDaPartida` não cria
  gerador para a IA
- `CA-S144-4` — as duas políticas devolvem `null` na visão de quem não é da vez (S20, S31)

**S145 — `bateCom`**

- `CA-S145-1` — com canastra limpa na mesa, morto pego e mão de duas cartas que fecham um jogo,
  `bateCom` é `true` para o comando que as baixa
- `CA-S145-2` — no mesmo estado sem canastra limpa alguma, `bateCom` é `false` para todos
- `CA-S145-3` — ao longo de 30 partidas inteiras, para **todo** comando de `movimentosValidos`,
  `bateCom(visao, comando)` concorda com aplicar o comando e olhar o resultado: rodada encerrada
  **e** mão do jogador vazia
- `CA-S145-4` — `bateCom` é `false` para comando que encerra a rodada pelo **monte esgotado**
  (R4.8) e não pela batida — é o caso que a `CA-S145-3` distingue por olhar a mão

**S146 — a nota**

- `CA-S146-1` — entre um comando que bate e outro com `valor` maior, a IA escolhe o que bate
- `CA-S146-2` — entre dois que batem, o desempate cai para `valor`
- `CA-S146-3` — nenhuma parcela de `valor`, somada no pior caso construível, altera a escolha do
  `CA-S146-1` — é o teste que a forma de um número só exigiria e esta forma dispensa

**S147 e S148 — as parcelas**

- `CA-S147-1` — entre baixar três cartas de 5 pontos e três de 10, a IA baixa as de 10 (IA5)
- `CA-S147-2` — entre dois `baixar` iguais que diferem só no naipe do `2` usado como curinga, a
  IA escolhe o do naipe da sequência (IA6)
- `CA-S147-3` — com a mão podendo zerar e morto por pegar, a jogada que zera é escolhida sobre
  uma que rende mais em cartas (IA8)
- `CA-S147-4` — com o lixo cheio de cartas que encaixam, a IA pega o lixo; com o mesmo lixo de
  cartas que não encaixam, compra do monte (IA9)
- `CA-S148-1` — entre duas cartas de mesmo valor, a IA descarta a que **não** estende jogo do
  adversário (IA7)
- `CA-S148-2` — entre duas cartas que não estendem nada, a IA descarta a de menor valor (IA7)
- `CA-S148-3` — a carta que estende jogo do adversário é preterida mesmo sendo a de menor valor
  — é a escala de `−100` contra `−15` fazendo o trabalho de "entre equivalentes"

**S149 — encaixe**

- `CA-S149-1` — carta do lixo com irmã de mesmo naipe a uma e a duas casas encaixa
- `CA-S149-2` — a três casas, não encaixa
- `CA-S149-3` — mesma casa, naipe diferente, não encaixa

**S150 — empate**

- `CA-S150-1` — dois comandos de nota idêntica produzem sempre o mesmo escolhido, e ele não muda
  quando a lista de `movimentosValidos` é embaralhada antes da decisão

**S151 e S152 — medição**

- `CA-S152-1` — a escolha das duas políticas está sempre em `movimentosValidos`, em 30 sementes
  (herda `CA-RF5.1-1`, agora para as duas)
- `CA-S152-2` — uma decisão da heurística no pior caso construível da T7 fica abaixo de 100 ms
- `CA-S152-3` — a enumeração no mesmo pior caso é remedida, e o número entra no `roadmap.md`

---

## 9. Decisões

Nove decisões, confirmadas em bloco em 2026-08-04.

| # | Assunto | Proposta |
|---|---|---|
| **S144** | Forma | `Politica = (visao) => Comando \| null`; a aleatória vira `porSorteio(aleatorio)`, e `estado/` deixa de criar gerador para a IA |
| **S145** | Engine | `bateCom(visao, comando)` como consulta, reusando `podeBater`; a construção duplicada é aceita **sob medição** (`CA-S145-3`) |
| **S146** | Forma | Nota é `{ bate, valor }`, comparada nessa ordem — a IA10 vira separação estrutural, não peso dominante |
| **S147** | Pesos | As oito parcelas da tabela §5, e nenhuma outra na H15 |
| **S148** | Escopo | Só a metade **visível** da IA7; a do "interesse" exige memória, que a `ia-strategy.md` §5 exclui |
| **S149** | Regra | "Encaixa" = mesma carta de naipe a **distância ≤ 2 casas** na mão ou nos jogos |
| **S150** | Forma | Empate por **chave estável** do comando; a posição na lista não entra na `ia/` |
| **S151** | Medição | Arnês é `scripts/medir-forca-da-ia.ts`, rodado por `node`, **fora** do `npm run verificar` |
| **S152** | Medição | Legalidade e determinismo passam a valer para **as duas** políticas; o tempo da E6 vira teste e a **T7 é remedida** |

> A `S152` quase ficou de fora desta tabela — eu a tinha classificado como "lista de testes
> herdados", não como decisão. É exatamente o erro que a segunda checagem do
> `verificar-identificadores.py` existe para pegar, e foi o script que a pegou. Ela **é** decisão:
> escolhe que o orçamento de tempo vira teste em vez de medição avulsa, e obriga a remedição da
> T7.

### Onde eu erraria, se errasse

**Os pesos da §5 são a parte fraca, e eu sei disso antes de medir.** Cinco dos oito números
saíram de regra escrita; o `+50` da IA6 e o `+200` da IA8 saíram de argumento meu, e a distância
≤ 2 da S149 também. Se a força relativa não sair, a ordem de revisão é essa: S149, depois os dois
pesos, depois a IA9 e a IA10 da `ia-strategy.md`.

**A S145 é a decisão que mais pode dar errado em silêncio.** Ela aceita duas construções do mesmo
jogo resultante, e a defesa inteira é um teste. Se a `CA-S145-3` for enfraquecida — menos
partidas, ou parando no primeiro comando de cada turno —, o defeito da S140 volta sem aviso.
