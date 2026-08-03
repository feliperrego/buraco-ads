# Spec 0011 — H11: bater e encerrar a rodada

> Status: **rascunho anotado** — 9 propostas, nenhuma confirmada
> História: `H11` — *"Fico sem cartas com uma canastra limpa e bato, encerrando a rodada"*
> Fecha: R7.3, R9.5, R9.6, R10.1, R10.1.2, R10.1.3, R10.2, R10.3, R10.4, M4
> Deriva de: [rules.md](../rules.md) · [domain.md](../domain.md) · [user-stories.md](../user-stories.md)

---

## 1. O que esta fatia realmente é

A H10 disse que a mão vazia tem duas continuações: **pega o morto** se houver, e o resto ficou
em aberto. A H11 fecha o resto — e com ele fecha o `domain.md` §1.3 inteiro, porque a batida é
a **terceira e última** transição automática do turno.

Vale ver o tamanho da fatia antes de decidir qualquer coisa. São três coisas diferentes, e só a
primeira parece "bater":

1. **O efeito** — mão vazia, sem morto, condições da R10.1 satisfeitas → a rodada encerra.
2. **Um estado novo no domínio** — `RodadaEncerrada` existe no diagrama do `domain.md` §1.3
   desde a Onda 1 e **nunca existiu no código**. `FaseDoTurno` tem dois valores.
3. **A última mudança da guarda** — a R10.1.3 ganha a segunda metade, e a condição de
   `adicionar` muda pela terceira e última vez.

O item 2 é o que carrega o risco desta fatia, e a §4 é sobre ele.

---

## 2. Escopo

### Entra

- A batida como **efeito automático** (M4), no mesmo lugar do morto
- O estado de rodada encerrada, e `movimentosValidos` devolvendo `[]` nele
- A **R10.2** — quais canastras contam como limpas para efeito de batida
- A **R10.1.2** — o adversário levou os dois mortos e a exigência continua valendo
- A segunda metade da **R10.1.3** na guarda de `adicionar`
- A **R10.4** — bater com ou sem descarte final, que é o mesmo caminho
- O anúncio na interface: quem bateu, e que a rodada acabou

### Não entra

- **A apuração** (R11, RF4.2) — é a H12. Ao fim desta fatia a rodada encerra e o **placar não
  muda**. É uma lacuna observável e proposital.
- **A R10.1.1** — a exceção do morto convertido em monte. A conversão é a R4.6, que é a **H14**;
  antes dela, "não há morto disponível" só pode significar "o adversário levou os dois", que é
  exatamente a R10.1.2. Implementar a R10.1.1 agora seria escrever código para um estado
  inalcançável, e testá-lo exigiria construir um estado que a R4.6 ainda não sabe produzir.
- **A R9.6 e a R11.5** — a penalidade de −100 por terminar sem morto é apuração, e vai junto
  com a H12.
- **A próxima rodada** (R12) — a rodada encerra e fica encerrada. Encadear rodadas é a H13.

- `[P]` **S110** — A H11 implementa a **R10.1.2** e deixa a **R10.1.1** para a H14, junto com a
  conversão que a torna alcançável. É o mesmo corte da S102 na H10, e pelo mesmo motivo: a
  exceção depende de um estado que a fatia anterior não sabe produzir.

> A `CA-R10.1.1-1` fica **sem teste** ao fim desta fatia, e isso precisa estar registrado num
> gatilho, não na minha memória. O `verificar-rastreabilidade.py` não pega: ele confere que a
> regra tem história, e a R10.1.1 tem — é a H11 hoje. A proposta é mover a citação da R10.1.1
> para a H14 no `user-stories.md`, e aí o script passa a defender o novo lugar.

---

## 3. A batida é efeito, e a ordem entre ela e o morto já está decidida

O `domain.md` §1.3 fixou (M4):

> *"O jogador escolhe uma jogada (baixar, aumentar ou descartar); se ela zera a mão, **não há
> morto disponível** e as condições da R10.1 estão satisfeitas, a batida acontece. Não existe
> comando `bater`."*

O trecho em negrito é o que resolve a única ambiguidade real entre a R9.2 e a R10.1: um jogador
com canastra limpa, morto já pego, mão zerada **e ainda um morto na mesa** pega o segundo morto
(R9.2, R9.3) em vez de bater. Não há escolha a oferecer — a R9.2 não tem ressalva.

- `[P]` **S111** — A batida entra no **mesmo lugar** da S103, no fim de `aplicar`, e **depois**
  do morto. Uma função só, com a forma "mão vazia → morto se houver, senão batida se a R10.1
  permitir, senão nada". Não é um segundo ponto de saída: é o mesmo `comMorto` da H10 crescendo
  para `comFimDeMao`.

> É a terceira vez que este lugar recebe comportamento, e vale dizer por que ele não virou um
> emaranhado: as três coisas que moram lá — entregar morto, encerrar rodada, e antes disso nada
> — respondem à **mesma pergunta** ("a mão zerou?"), e a resposta é sequencial. Se a próxima
> fatia quiser pendurar ali algo que responda a outra pergunta, é sinal de que o lugar acabou.

---

## 4. Onde mora "a rodada acabou" — a decisão desta spec

`Partida.fase` é `'Compra' | 'Acao'`. O diagrama do `domain.md` §1.3 tem **três** estados. A
diferença nunca incomodou porque nenhuma fatia alcançava o terceiro.

### As alternativas

| | Como fica | Custo |
|---|---|---|
| **A** — `fase` ganha `'RodadaEncerrada'` | um campo, três valores, igual ao diagrama | **todo `if (fase === 'Compra') … else …` passa a errar em silêncio** |
| **B** — campo novo `encerrada: boolean` | `fase` continua honesta ao nome | duas verdades sobre o mesmo fato; `fase` passa a ter valor sem sentido depois do fim |
| **C** — campo novo `encerramento: {…} \| null` | carrega o **motivo**, que a R11.5 vai querer | abstração antes do segundo caso concreto (a R4.8 é a H14) — contraria a invariante 3 |

O custo da **A** é o achado da H7 repetido: *"uma cadeia de ternários sobre `Comando` presumia
que 'não é X nem Y' implicava Z"*. Hoje existem pelo menos dois lugares com essa forma exata —
`movimentosValidos` (`if fase === 'Compra' … else` cai no ramo de ação) e `TelaPartida`
(`fase === 'Compra' ? 'compra' : 'ação'`). Os dois **compilam** com um terceiro valor, e os dois
ficam errados.

Isso não é argumento contra a A: é a especificação do que precisa vir junto com ela.

- `[P]` **S112** — Alternativa **A**, com duas obrigações amarradas: o tipo passa a se chamar
  **`FaseDaRodada`** (um valor chamado `RodadaEncerrada` num tipo chamado `FaseDoTurno` é uma
  mentira que alguém vai acreditar), e **todo lugar que enumera `fase` vira `switch` exaustivo**.
  É a forma que **não compila** quando um estado novo aparece — a mesma lição da H7, aplicada
  antes de o erro acontecer em vez de depois.

### Quem bateu

A interface precisa dizer quem. E a R11.5, na H12, vai precisar saber. A tentação é um campo
`batidaPor: JogadorId | null` — e ele seria, hoje, **exatamente** `fase === 'RodadaEncerrada'`
dito de novo. A H9 já mostrou o que isso custa: *"uma decisão expressa duas vezes é uma decisão
sem rede"*, e a mutação que troca uma das duas expressões não reprova nada.

- `[P]` **S113** — Quem bateu é **derivado**: é o jogador com a mão vazia. Nada novo no estado,
  na linha da S71 (janela), S85 (categoria) e S105 (`mortosPegos`).

Duas coisas que fazem esta derivação funcionar, e uma que ela **não** pode usar:

1. Só um jogador pode estar com a mão vazia ao fim de um comando — o outro teria pegado morto
   ou batido antes, e a rodada teria acabado ali.
2. Na H14 ela continua certa de graça: a R4.8 encerra a rodada **sem batida**, e aí ninguém
   está sem cartas — "nenhuma mão vazia" é a resposta certa para "quem bateu?".
3. **Não pode ser `jogadorDaVez`.** A batida por descarte final (R10.4) acontece depois de o
   `descartar` já ter passado a vez, então `jogadorDaVez` aponta para o **adversário** do
   batedor. Vale registrar por escrito porque a leitura errada é a intuitiva.

---

## 5. A R10.2 inteira cabe em "sem curinga"

> **R10.2** — *"as canastras `DE_500` e `DE_1000` **sem curinga** contam como limpas; com
> curinga, não contam."*

Lida sem cuidado, a regra pede uma tabela de quatro categorias. Lida com a S85 na mão, ela
some: `LIMPA` já significa "canastra sem curinga", e `SUJA` já significa "canastra com curinga".
O que a R10.2 acrescenta é só que `DE_500` e `DE_1000` **não** são uma terceira coisa — elas se
comportam conforme tenham curinga ou não.

| Categoria | Tem curinga? | Conta como limpa (R10.2) |
|---|---|---|
| `LIMPA` | nunca | sim |
| `SUJA` | sempre | não |
| `DE_500` | pode | **conforme** |
| `DE_1000` | pode | **conforme** |

A coluna da direita é a coluna do meio negada. Logo:

- `[P]` **S114** — `contaComoLimpa(jogo)` é **`ehCanastra(jogo) && nenhuma posição é curinga`**.
  Nenhum `if` por categoria é escrito, e a função **não consulta `categoriaDe`** para decidir —
  só para saber se são sete cartas.

> É o mesmo tipo de resultado da H9, e por isso merece a mesma desconfiança: uma regra que some
> ao ser implementada pode ser uma regra bem modelada **ou** uma regra mal lida. O que trava a
> interpretação aqui é um par de critérios com `DE_1000` — um com curinga e um sem —, porque só
> eles separam a leitura certa da leitura "canastra de 1000 sempre conta".

---

## 6. A guarda muda pela última vez, e o custo dela não é onde parece

Hoje: `podeEsvaziar = mortosRestantes > 0`. Depois desta fatia:

```
podeEsvaziar = mortosRestantes > 0  ou  as condições da R10.1 estão satisfeitas
```

Há uma armadilha aqui, e ela é a razão de esta seção existir. **A jogada que esvazia a mão pode
ser a mesma que fecha a canastra limpa.** Baixar as últimas três cartas pode levar um jogo de 4
a 7 posições — e nesse caso a condição da R10.1 é falsa **antes** do comando e verdadeira
**depois**. Avaliar a guarda no estado atual recusaria exatamente a jogada mais bonita do jogo.

Então a condição precisa ser avaliada **sobre o resultado**. E isso esbarra na T7: são até 1738
comandos candidatos, e aplicar cada um para depois olhar seria multiplicar o custo da
enumeração por um fator que ninguém mediu.

O corte é observar **quantos** candidatos precisam da checagem cara:

- Um comando só zera a mão se usar todas as cartas dela.
- A maior sequência tem 14 posições (S41), então uma mão com 15 ou mais cartas **não tem nenhum
  candidato** que a zere.
- O pior caso da T7 é uma mão de 22 cartas. Ele tem **zero** candidatos caros.

- `[P]` **S115** — A guarda avalia a condição da R10.1 **sobre o resultado do comando**, e só
  para os candidatos que zerariam a mão. Os outros saem pela comparação de tamanhos, que é o que
  a guarda já faz hoje.

> A afirmação "zero candidatos caros no pior caso da T7" é **dedução, não medição** — vale como
> desenho, não como resultado. A medição correspondente entra no passo 6: reexecutar a medição
> da T7 com a guarda nova e comparar com os 1738. A fatia que acrescenta comando ou muda a
> guarda remede, e esta faz as duas coisas.

E a visão precisa de um dado que hoje não carrega:

- `[P]` **S116** — `VisaoDoJogador` ganha **`meusMortos: number`**, derivado de
  `mortos.filter(reclamadoPor === eu)`. Só o meu — o do adversário não é necessário para
  nenhuma regra desta fatia, e a RF5.2 é mais barata de manter quando o campo não existe.

---

## 7. A R10.1.3 tem defeito de texto, e a H10 o mediu sem perceber

> **R10.1.3** — *"É proibido realizar uma jogada que esvazie a mão quando não há morto
> disponível e as condições de batida não estão satisfeitas. O jogador deve reter **ao menos uma
> carta**."*

A segunda frase é o número que a **S109** mediu como errado. Reter uma carta trava a mesa —
15 de 200 partidas —, porque a R7.1 ainda obriga a descartar. A H10 corrigiu o **código** e
registrou a correção na spec 0010; a **regra continua dizendo o número errado**.

Isso é exatamente o caso que o acordo prevê: *"se uma regra parece ambígua, é defeito do
documento: corrija a regra, não só o caso"*. E a correção melhor não é trocar "uma" por "duas",
porque isso repete o erro de origem — fixar um número em vez de derivá-lo.

- `[P]` **S118** — A segunda frase da R10.1.3 passa a ser: *"O jogador deve reter cartas
  suficientes para cumprir o descarte obrigatório da R7.1."* O número deixa de estar na regra e
  passa a cair dela, que é o que a S109 já faz no código.

> Esta é a única proposta desta spec sobre o **documento normativo**, e a calibragem do acordo
> diz que é aqui que eu erro: 5 quedas em 5 estão no `rules.md`. Se na sua mesa a frase "reter
> ao menos uma carta" tiver um sentido que eu não peguei — por exemplo, se na sua mesa for
> **legal** ficar com a mão vazia sem bater e simplesmente não descartar —, a S118 está errada e
> a S109 também.

---

## 8. Interface

A mesa fica inerte quando a rodada acaba: `movimentosValidos` devolve `[]`, e a IA para porque
`decidir` devolve `null`. Inerte **e sem explicação** é o modo de falha que o `roadmap.md` §3 já
registra para a R4.8 — *"a mesa fica inerte sem explicar nada"*. Não vale repeti-lo de propósito.

- `[P]` **S117** — O encerramento aparece no painel **"Vez e fase"**, que já existe e já é o
  lugar onde o jogador lê em que ponto o jogo está. Ele passa a mostrar *"Você bateu — rodada
  encerrada"* ou *"O adversário bateu — rodada encerrada"* no lugar de vez e fase. Sem tela nova,
  sem painel novo: a apuração da H12 é que traz o painel sobreposto (`screens.md` §1).

> O nome do painel continua *"Vez e fase"* e ele passa a mostrar uma terceira coisa. Alternativa
> considerada e recusada: renomeá-lo para *"Estado do turno"*. O `aria-label` é o nome pelo qual
> nove testes o encontram, e trocá-lo agora seria churn sem ganho — a H12 vai mexer nesta região
> de novo e é lá que a pergunta se paga.

---

## 9. Critérios de aceite

Dois vêm do [acceptance-tests.md](../acceptance-tests.md) §4.6 e vão para os testes com o nome
deles — não estão redigitados nas tabelas abaixo, porque estão **definidos lá**:

- **`CA-R10.1.2-1`** — adversário pegou os dois; jogador sem morto, com canastra limpa: **não
  pode bater**. É a R10.1.2 inteira, e o par dela é a `CA-R10.1.1-1`, que fica para a H14 (S110).
- **`CA-R10.1.3-1`** — sem morto disponível e sem poder bater: **nenhum** movimento válido
  esvazia a mão. É o critério que a guarda de `adicionar` cumpre desde a H10 e que só agora
  ganha a segunda condição.

> Escrevê-los como linha de tabela aqui foi a primeira tentativa, e o
> `verificar-identificadores.py` reprovou: *"CA-R10.1.2-1 definido em 2 arquivos"*. É o mesmo
> script que nasceu de uma colisão real na Onda 2, e esta é a segunda vez que ele morde. Um
> `CA-` que já existe se **cita**; só ganha linha de tabela o que nasce na spec.

Todos exigem estado construído com o construtor da C4 — a batida não aparece sozinha em teste
aleatório com a frequência necessária. O que **está medido**, em 200 partidas simuladas entre
IAs aleatórias:

| | |
|---|---|
| partidas com alguma canastra que conta como limpa (R10.2) | **172 / 200** |
| partidas em que o **mesmo** jogador tem canastra limpa e morto pego | **48 / 200** |

O segundo número é o que importa: a batida é alcançável por jogo aleatório, então a verificação
no navegador é possível — cara, mas possível — e a simulação de 200 partidas volta a valer como
rede no passo 6.

### 9.1 O efeito

| # | Dado | Então |
|---|---|---|
| **CA-R10.1-1** | morto já pego, canastra limpa na mesa, sem morto disponível | a jogada que zera a mão **encerra a rodada** |
| **CA-R10.1-2** | morto já pego, **só canastra suja**, sem morto disponível | a jogada que zeraria a mão **não é oferecida** (R10.1.3) |
| **CA-S111-1** | mão zerada, canastra limpa, morto pego **e ainda um morto disponível** | pega o **segundo morto** e a rodada **continua** — a R9.2 vem antes da R10.1 |
| **CA-R10.3-1** | rodada encerrada | `movimentosValidos` devolve `[]` para os **dois** jogadores |
| **CA-R10.4-1** | última carta **descartada**, condições satisfeitas | a rodada encerra — bater com descarte final |
| **CA-R10.4-2** | últimas cartas **baixadas**, condições satisfeitas | a rodada encerra sem descarte |
| **CA-S113-1** | batida por descarte final | quem bateu é lido pela **mão vazia**, e `jogadorDaVez` aponta para o adversário |
| **CA-M9-13** | após a batida | a conservação das 104 se mantém, sem `id` repetido |

### 9.2 A R10.2

| # | Dado | Então |
|---|---|---|
| **CA-R10.2-1** | canastra `DE_1000` **sem** curinga, morto pego | conta como limpa: **pode bater** |
| **CA-R10.2-2** | canastra `DE_1000` **com** curinga, morto pego, e nenhuma outra canastra | **não** conta: não pode bater |
| **CA-R10.2-3** | jogo de 6 cartas sem curinga | **não** é canastra, então não conta — a R8.1 vem antes |

> A `CA-R10.2-1` e a `CA-R10.2-2` são o par que trava a interpretação da S114. Quem implementar
> "canastra de 1000 sempre conta" passa na primeira e falha na segunda.

### 9.3 A guarda e o estado novo

| # | Dado | Então |
|---|---|---|
| **CA-S115-1** | a jogada que zera a mão é a que **fecha** a canastra limpa | ela **é** oferecida — a condição vale sobre o resultado, não sobre o estado atual |
| **CA-S112-1** | rodada encerrada | `movimentosValidos` devolve `[]` **na fase nova**, e não a lista de ação |

### 9.4 Interface, nível 4

| # | Dado | Então |
|---|---|---|
| **CA-S117-1** | o humano bateu | o painel diz **"Você bateu"** e que a rodada encerrou |
| **CA-S117-2** | a IA bateu | o painel diz **"O adversário bateu"** |
| **CA-S117-3** | rodada encerrada | **nenhum** botão de jogada é oferecido — e a âncora positiva é o mesmo painel antes da batida, com botões |

---

## 10. Pendências

Nove propostas. Nenhuma confirmada.

| # | Assunto | Proposta |
|---|---|---|
| **S110** | Escopo | A H11 faz a **R10.1.2**; a **R10.1.1** vai para a H14, junto com a conversão que a torna alcançável |
| **S111** | Domínio | A batida entra no mesmo lugar do morto e **depois** dele — a R9.2 não tem ressalva |
| **S112** | Domínio | `fase` ganha `'RodadaEncerrada'`, o tipo vira **`FaseDaRodada`**, e todo lugar que a enumera vira `switch` exaustivo |
| **S113** | Domínio | Quem bateu é **derivado** da mão vazia — não um campo, e **não** `jogadorDaVez` |
| **S114** | Domínio | A R10.2 inteira é **"canastra sem curinga"**; nenhum `if` por categoria |
| **S116** | Consultas | `VisaoDoJogador` ganha `meusMortos`, e só o meu |
| **S115** | Enumeração | A condição da R10.1 é avaliada **sobre o resultado** do comando, e só para os candidatos que zerariam a mão |
| **S117** | Interface | O encerramento aparece no painel **"Vez e fase"**; sem tela nem painel novo |
| **S118** | **`rules.md`** | A R10.1.3 deixa de dizer "ao menos uma carta" e passa a derivar o número da R7.1 |

### Onde eu erraria, se errasse

**A S118 é a proposta de risco desta spec**, e por um motivo medido: das quedas registradas
neste projeto, **todas** foram no `rules.md`, e esta é a única aqui que mexe nele. As outras oito
são sobre software, onde a calibragem tem sido boa.

Duas coisas para conferir antes de confirmar em bloco:

- **A S110** decide que a `CA-R10.1.1-1` fica sem teste por uma fatia inteira. Se você preferir
  não ter regra descoberta, a alternativa é escrever a exceção agora com um estado construído à
  mão — funciona, mas testa um caminho que o jogo ainda não sabe alcançar.
- **A S114** faz uma regra sumir ao ser implementada. Isso foi bom sinal na H9 e pode ser mau
  sinal aqui: vale ler a linha `DE_1000` da tabela da §5 e confirmar que, na sua mesa, uma
  canastra de 1000 **com** curinga realmente não habilita a batida.
