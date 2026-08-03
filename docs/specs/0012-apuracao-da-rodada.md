# Spec 0012 — H12: a apuração da rodada

> Status: **confirmada** — 9 decisões, nenhuma pendência
> História: `H12` — *"Vejo a apuração detalhada da rodada, item por item"*
> Fecha: R11.1, R11.2, R11.3, R11.4, R11.5, R11.5.2, R11.6, RF4.2, M5
> Deriva de: [rules.md](../rules.md) · [requirements.md](../requirements.md) · [domain.md](../domain.md)

---

## 1. A lacuna que esta fatia fecha

A H11 deixou uma rodada que termina e um placar que não muda. Depois da batida a tela mostra
`0 × 0`, e isso foi proposital (S110). É a única fatia do projeto entregue com uma lacuna
declarada, e a H12 existe para fechá-la.

O que ela acrescenta não é "somar pontos". É **auditar** a soma: a RF4.2 exige a apuração
*item por item*, e o motivo está no `domain.md` M5 — *"um único número tornaria a regra mais
complexa do sistema impossível de auditar"*.

---

## 2. Um gatilho dispara aqui, e a resposta é não

O [roadmap.md](../roadmap.md) §3 tem uma linha esperando por esta fatia:

> *"`eventos[]` no retorno de `aplicar` — **ao escrever a H12**, decidir entre acrescentá-los ou
> derivar a apuração do estado."*

A pergunta é se `aplicar` deve devolver o que aconteceu — *"fechou canastra limpa"*, *"pegou o
morto"*, *"bateu"* — para a apuração somar eventos em vez de ler o estado final.

A resposta é **não**, e a razão não é preferência: o estado no fim da rodada **já contém tudo**.
Os jogos estão na mesa com suas posições, as mãos estão como ficaram, `mortos.reclamadoPor` diz
quem pegou morto, e a mão vazia diz quem bateu (S113). Nenhum item da R11 pede informação que só
existiria num histórico.

- `[D]` **S120** — A apuração é uma **consulta derivada** do estado, `apurar(partida)`, e o
  retorno de `aplicar` continua sendo `Sucesso(partida) | Recusa(motivo)`. O gatilho fecha com
  "não precisamos".

> Vale dizer o que **mudaria** a resposta, para o gatilho não voltar por engano: um item de
> pontuação que dependesse de *como* o jogo chegou ali. Por exemplo, uma regra que premiasse
> quem baixou a canastra primeiro, ou que contasse quantas vezes o lixo foi pego. A R11 não tem
> nenhum item assim — todos os seis olham o estado final.

Esta é a quarta vez que a resposta é "derive, não guarde": S71 (janela), S85 (categoria), S105
(`mortosPegos`), S113 (quem bateu). Vale registrar o padrão porque ele já tem contraexemplo
conhecido — `placar` **é** guardado, e a §5 explica por quê.

---

## 3. Escopo

### Entra

- `Pontuacao` como objeto por componente (M5), com total derivado
- `apurar(partida)` — a consulta, cobrindo R11.1 a R11.4, R11.5.2 e R11.6
- A atualização do **placar acumulado** ao encerrar a rodada
- O painel de apuração na tela, item por item, para os **dois** jogadores (RF4.2)

### Não entra

- **A R11.5.1** — a exceção que dispensa a penalidade de quem ficou sem morto por **conversão**
  (R4.6). Mesmo corte da S110 na H11: a conversão é a H14, e sem ela o estado é inalcançável.
  Sobra a **R11.5.2**, que é a penalidade normal.
- **A próxima rodada** (R12) — o painel aparece e **fica**. Fechá-lo para seguir adiante é a H13,
  e é ela que dá sentido ao botão.
- **O fim da partida** (R12.1, R12.2) — chegar a 3000 é a H13.

- `[D]` **S119** — A H12 apura, mostra e soma ao placar. A R11.5.1 e o encadeamento de rodadas
  ficam para as fatias que os tornam alcançáveis.

---

## 4. Duas ambiguidades da R11, e uma delas é defeito de texto

Reler a R11 inteira — e não só a parte nova — é o que achou os dois itens abaixo. É o método da
H8, que encontrou um defeito de quatro fatias atrás relendo a RF3.5.

### 4.1 As cartas da canastra contam duas vezes?

A R11.1 dá pontos **por canastra** (200 para uma limpa) e a R11.3 dá pontos **por carta baixada
na mesa**. Uma canastra limpa de sete cartas é um conjunto de sete cartas *na mesa*. Então ela
vale 200, ou 200 mais o valor das sete?

O texto não exclui as cartas da canastra da contagem da R11.3, e as duas regras falam de coisas
diferentes: a R11.1 premia **a estrutura**, a R11.3 conta **o material**.

- `[D]` **S123** — Contam as duas: o bônus da categoria **mais** o valor individual de cada
  carta baixada, inclusive as que estão dentro de canastras. Uma canastra limpa de `5♥` a `J♥`
  vale `200 + (5+5+5+10+10+10+10) = 255`.

> **Esta é proposta de domínio, e a calibragem diz que é onde eu erro.** Se na sua mesa a
> canastra vale só os 200, é este item que muda — e a diferença é grande: numa rodada com três
> canastras, algo entre 150 e 250 pontos.

### 4.2 Quanto vale um `2` que **não** é curinga?

A tabela da R11.2 lista quatro linhas, e a última é `2 (curinga) | 10`. Mas desde a S51 um `2`
na mesa pode estar em dois papéis: **curinga**, fazendo o valor de outra carta, ou **natural**,
ocupando a própria casa em `A-2-3`. A tabela não diz quanto vale o segundo.

Não é caso raro: a `CA-S55-1` tem as duas cópias do `2♥` no mesmo jogo, uma natural e uma
curinga, e o painel do jogo as mostra lado a lado. Na hora de somar, uma delas não tem valor
definido pela regra.

Três leituras possíveis:

| | O `2` natural vale | Consequência |
|---|---|---|
| **A** | 10, igual ao curinga | o valor é da **carta**, e o papel não muda pontuação |
| **B** | 5, junto com `3`–`7` | o valor segue a vizinhança numérica, e o papel muda pontuação |
| **C** | 10 na mesa, 10 na mão | igual à A, dito de outro jeito |

- `[D]` **S124** — Alternativa **A**: o `2` vale **10 sempre**, natural ou curinga. O valor é
  propriedade da carta (M1), e "curinga" é papel (M2) — deixar o papel mexer no valor faria a
  mesma carta valer coisas diferentes em duas casas do mesmo jogo.
- `[D]` **S127** — E o texto da R11.2 muda: a linha passa de `2 (curinga)` para `2`. O
  parêntese descreve o caso comum e foi lido como condição.

> A S118 fez a mesma coisa com a R10.1.3 ontem, e o padrão vale notar: **as duas ambiguidades
> do `rules.md` achadas até hoje estavam em parênteses e ressalvas, não no corpo das regras.**
> São os lugares onde o documento fala do caso típico e o leitor entende "só neste caso".

---

## 5. Onde o placar mora — e por que ele é a exceção do "derive, não guarde"

O `placar` já existe em `Partida` e vale `[0, 0]` desde a H1. A H12 é a primeira fatia que o
move.

A pergunta é quando somar. Três formas:

| | Como | Custo |
|---|---|---|
| **A** — somar ao encerrar | `aplicar` soma o saldo no mesmo lugar onde a rodada encerra | uma linha; o detalhe continua derivável do estado |
| **B** — somar ao iniciar a próxima | a H13 soma antes de redistribuir | o placar fica errado durante toda a tela de apuração |
| **C** — `rodadas[]` no estado, placar derivado | histórico completo, placar é uma soma | estrutura nova para um caso concreto só (invariante 3) |

A **B** é tentadora porque parece "cada fatia cuida do seu", e é justamente ela que quebra o que
esta fatia entrega: o jogador olharia a apuração dizendo `+430` com o placar ainda em `0 × 0`.

- `[D]` **S122** — Alternativa **A**. `aplicar` soma o saldo de cada jogador ao `placar` no
  mesmo ponto em que marca `RodadaEncerrada` — é a mesma pergunta ("a rodada acabou?") sendo
  respondida uma vez só, na linha da S111.

O `placar` é guardado e não derivado, ao contrário das quatro decisões da §2, e a razão é
concreta: ele **sobrevive à rodada**. Quando a H13 redistribuir o baralho, os jogos e as mãos
que produziram o saldo deixam de existir, e um placar derivado deixaria de ser calculável. O
detalhe é derivável enquanto a rodada está na tela; o acumulado precisa durar mais que ela.

---

## 6. A forma de `Pontuacao`

A RF4.2 pede mais do que "mostre os componentes". Ela diz:

> *"canastras **por categoria**, cartas na mesa, cartas na mão, penalidades e bônus — item por
> item, não apenas o total."*

"Por categoria" é a parte fácil de perder: não basta *"canastras: 400"*, é *"duas limpas: 400"*.
A estrutura precisa carregar a contagem por categoria, não só a soma.

- `[D]` **S121** — `Pontuacao` tem um campo por componente da R11, mais a contagem por
  categoria, e o **total é função**, não campo:

```
Pontuacao
  canastras          { DE_1000: n, DE_500: n, LIMPA: n, SUJA: n }   R11.1, RF4.2
  pontosDeCanastra   soma da tabela da R8.2                          R11.1
  cartasNaMesa       soma dos valores, positiva                      R11.2, R11.3
  cartasNaMao        soma dos valores, **negativa**                  R11.2, R11.3
  bonusDeBatida      +100 ou 0                                       R11.4
  penalidadeDeMorto  −100 ou 0                                       R11.5, R11.5.2
```

`totalDe(pontuacao)` soma os cinco números. Guardar o total como campo criaria duas verdades
sobre o mesmo fato — o defeito que a H9 mediu como "decisão sem rede", e que a S105 já removeu
uma vez do `Jogador`.

Os sinais moram **no valor**, não em quem lê: `cartasNaMao` e `penalidadeDeMorto` já chegam
negativos, e o total é uma soma sem subtração. A alternativa — guardar positivo e subtrair na
soma — espalha a R11.3 por dois lugares.

---

## 7. Interface

A `screens.md` §1 já decidiu que a apuração **não é tela**: é painel sobreposto à partida, que
o jogador fecha para seguir. A parte de fechar é da H13 (S119).

- `[D]` **S126** — Um `<section aria-label="Apuração da rodada">` que existe **apenas** na fase
  `RodadaEncerrada`, com os dois jogadores lado a lado, item por item. "Sobreposto" é
  apresentação, e a RNF2.2 já fixou que os testes falam de comportamento — o critério é o painel
  existir com os itens certos, não onde ele flutua.

E a apuração precisa chegar à interface pelo caminho de sempre:

- `[D]` **S125** — `VisaoDoJogador` ganha `apuracao: readonly [Pontuacao, Pontuacao] | null`,
  **não-nula só na rodada encerrada**. A M11 diz que a tela renderiza exatamente a visão, e a
  RF5.2 continua garantida por construção: enquanto a rodada corre o campo é `null`, e ninguém
  soma as cartas da mão do adversário antes da hora.

> É o primeiro campo da visão que expõe algo do adversário além de contagem — os pontos dele
> saem das cartas dele. Isso está certo, porque a rodada acabou e a R11 é pública. Mas é
> exatamente o tipo de campo que, mal condicionado, vira vazamento: se `apuracao` fosse
> preenchida em `Acao`, a IA poderia ler a mão do adversário pela pontuação. O `null` não é
> conveniência, é a fronteira.

---

## 8. Critérios de aceite

Dois vêm do [acceptance-tests.md](../acceptance-tests.md) e são citados, não redefinidos:
**`CA-R8.5-1`** (a canastra suja regularizada vale 200 na apuração da mesma rodada) e
**`CA-R11.5.2-1`** (quem ficou sem morto porque o adversário levou os dois leva −100). A
`CA-R11.5.1-1` fica para a H14 (S119).

### 8.1 Os componentes da R11

| # | Dado | Então |
|---|---|---|
| **CA-R11.1-1** | uma canastra de cada categoria na mesa | a apuração conta **uma** em cada, e soma 1000+500+200+100 |
| **CA-R11.2-1** | um Ás, um `K` e um `5` baixados | valem 15, 10 e 5 |
| **CA-R11.3-1** | as mesmas três cartas na **mão** | valem −30, e não +30 |
| **CA-S123-1** | canastra limpa de `5♥` a `J♥` e nada mais | total **255**: os 200 da categoria mais os 55 das cartas |
| **CA-S124-1** | um `2` **natural** e um `2` **curinga** no mesmo jogo | os dois valem 10 |
| **CA-R11.4-1** | jogador que bateu | **+100**, e o adversário não recebe nada |
| **CA-R11.6-1** | jogador sem jogos, com cartas caras na mão e sem morto | o total é **negativo** |

### 8.2 O placar

| # | Dado | Então |
|---|---|---|
| **CA-S122-1** | a jogada que encerra a rodada | o `placar` já reflete o saldo **no mesmo estado** em que a fase vira `RodadaEncerrada` |
| **CA-S122-2** | placar em `[430, 120]` e nova apuração de `+200` | soma, não substitui |
| **CA-S121-1** | qualquer apuração | `totalDe` é a soma dos cinco números, e não existe campo `total` a divergir |

### 8.3 A fronteira da visão

| # | Dado | Então |
|---|---|---|
| **CA-S125-1** | rodada em andamento | `visao.apuracao` é `null` — a âncora positiva é a mesma visão depois da batida, com os dois `Pontuacao` |
| **CA-S125-2** | rodada encerrada | `visao.apuracao` traz os **dois** jogadores, e o meu está no índice `eu` |

### 8.4 Interface, nível 4

| # | Dado | Então |
|---|---|---|
| **CA-S126-1** | rodada encerrada com duas canastras limpas | o painel diz **"2 canastras limpas"** e os 400 — categoria e contagem, não só o total |
| **CA-S126-2** | rodada em andamento | o painel de apuração **não existe** — e a âncora positiva é o mesmo painel depois da batida |
| **CA-S126-3** | rodada encerrada | o placar na tela mostra o total novo, e não `0 × 0` |

---

## 9. Decisões

Nove, confirmadas em bloco em 2026-08-03.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **S119** | Escopo | A H12 apura, mostra e soma; a **R11.5.1** vai para a H14 e o botão de fechar para a H13 |
| **S120** | Domínio | A apuração é **derivada** do estado; `aplicar` **não** ganha `eventos[]` — o gatilho fecha com "não" |
| **S121** | Domínio | `Pontuacao` por componente, com contagem **por categoria**, e total como **função** |
| **S122** | Domínio | O `placar` é somado ao encerrar a rodada, no mesmo ponto da batida |
| **S123** | **Domínio do jogo** | As cartas dentro de canastras contam **também** pelo valor individual |
| **S124** | **Domínio do jogo** | O `2` vale **10** sempre, natural ou curinga |
| **S125** | Consultas | A visão ganha `apuracao`, **não-nula só** na rodada encerrada |
| **S126** | Interface | Painel `Apuração da rodada` só na fase encerrada, item por item, sem botão de fechar |
| **S127** | **`rules.md`** | A linha `2 (curinga)` da R11.2 perde o parêntese |

### Onde eu erraria, se errasse

**Esta spec tem três propostas sobre o seu domínio, e é o maior número desde o `rules.md`.** A
calibragem do acordo diz que erro uma a cada seis nesse terreno, e aqui são três de uma vez:

- A **S123** é a de maior impacto numérico. Se a canastra valer só o bônus, todos os totais desta
  fatia mudam, e os critérios `CA-S123-1` e `CA-R11.1-1` mudam junto.
- A **S124** e a **S127** andam juntas: se o `2` natural valer 5, a proposta cai e a tabela da
  R11.2 ganha uma linha em vez de perder um parêntese.
- O **valor 10 para o `2`** já estava marcado no `rules.md` como o único ponto em que as fontes
  divergem, com um convite explícito: *"se você joga com outro valor, é este item que precisa
  mudar"*. Vale reler aquela linha antes de confirmar em bloco — ela nunca foi exercitada, porque
  até hoje nada somava pontos.

As seis restantes são sobre software, e a única com alternativa real é a **S122** (§5).
