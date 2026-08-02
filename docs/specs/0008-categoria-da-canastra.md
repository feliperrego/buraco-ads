# Spec 0008 — A categoria da canastra

> Status: **confirmado com uma pendência** — 9 decisões, e a `S94` aberta (§11)
> História: **H8** — "Vejo minhas canastras e a categoria de cada uma"
> Fecha: R8.1, R8.2, R8.3, R8.4, R8.6, RF3.5
> Última atualização: 2026-08-02

Decisões a partir de **`S85`**, continuando a série global.

---

## 1. Escopo

### Entra

A **categoria** de um jogo: `DE_1000`, `DE_500`, `LIMPA` ou `SUJA` (R8.2), com a precedência da
R8.3 e a leitura posicional da R8.6. É a primeira fatia do Marco III e a primeira que não
acrescenta comando nenhum — ela acrescenta uma **consulta**.

Fecha a **RF3.5**, e isso é mais trabalho do que parece: §5 mostra que metade dela nunca foi
implementada.

### Não entra

| Fora | Vai para |
|---|---|
| Regularizar o curinga, e a recategorização que ele causa (R6.5, R6.6, R8.5) | H9 |
| Somar pontos de canastra na apuração (R11) | H12 |
| `contaComoLimpaParaBatida` (R10.2) | H11 |
| Pegar morto e bater (R9, R10) | H10 |

- `[D]` **S89** — A H8 devolve a **categoria**, não os **pontos**. É o mesmo
  formato da S50 ("a H5 não calcula categoria") e da S62 ("a H6 verifica a R6.3 por tamanho"),
  agora do outro lado: a tabela da R8.2 tem uma coluna de pontos, e ela fica fechada até a H12.

> A distinção não é formal. Os nomes `DE_500` e `DE_1000` **contêm** os números, e é tentador
> concluir que a categoria já é a pontuação. Não é: a R11 soma canastras, cartas na mão,
> penalidades e bônus, e nenhuma dessas contas existe ainda. Uma constante
> `PONTOS_POR_CATEGORIA` escrita aqui ficaria três marcos sem chamador — e a invariante 3 diz
> para não abstrair antes do caso concreto.

---

## 2. Onde a categoria mora

A R8.5 é explícita: *"função derivada do conteúdo do jogo, nunca um campo armazenado"*. Isso
elimina o campo em `Jogo`, mas não decide **quem** calcula nem **onde** o resultado aparece.

O [domain.md](../domain.md) §7 diz que a `VisaoDoJogador` contém *"Todos os jogos, com
categoria"*, e essa frase admite duas leituras.

| # | Alternativa | A favor | Contra |
|---|---|---|---|
| **A** | `categoriaDe(jogo)` exportada pela API pública; a visão **não muda** | Uma forma só para "jogo na mesa". Mesmo precedente do `valorDa` da H6 — acessador puro sobre o que a visão já carrega | A frase do domain.md §7 precisa ser lida como *informação disponível*, não como campo |
| **B** | A visão passa a carregar `{ jogo, categoria }` | Lê a frase do domain.md ao pé da letra | Cria uma **segunda forma** de jogo na mesa. `meusJogos[0].id` vira `meusJogos[0].jogo.id`, e todo teste de H4 a H7 muda junto |
| **C** | Campo `categoria` em `Jogo`, preenchido por `criarJogo` | Consulta direta | **Proibido pela R8.5**, e quebraria na H9: regularizar o curinga mudaria a categoria sem passar por `criarJogo` |

- `[D]` **S85** — **Alternativa A.** `categoriaDe(jogo)` vive em `jogo.ts`,
  ao lado de `janelaDe`, e é exportada por `engine/index.ts`. A `VisaoDoJogador` não muda.

```ts
export function categoriaDe(jogo: Jogo): CategoriaCanastra | null
```

> A frase do `domain.md` §7 continua verdadeira sob a Alternativa A, e vale dizer por quê: a
> categoria é **função pura** do `Jogo`, e o `Jogo` inteiro está na visão. A informação chega;
> o que não chega é um campo. É a mesma distinção que a S71 fez para a janela — derivada das
> pontas, nunca armazenada, porque campo derivado é um segundo lugar para a mesma verdade.
>
> A C é a que precisa ser recusada por escrito, não só descartada. Ela é o caminho de menor
> esforço hoje — `criarJogo` já percorre as posições — e **funcionaria** até a H9, que é
> exatamente quando o conteúdo do jogo muda sem passar pelo construtor. É o mesmo formato do
> erro que a S63 corrigiu na H6: uma escolha que só quebra na fatia seguinte.

### 2.1 O jogo que não é canastra

Um jogo de três a seis posições não tem categoria: ele não é canastra (R8.1).

| # | Alternativa | A favor | Contra |
|---|---|---|---|
| **A** | `CategoriaCanastra \| null` | A R8.2 diz **quatro** categorias, e o tipo diz quatro | O chamador trata o `null` |
| **B** | Um quinto valor, `NENHUMA` | Nada retorna `null` | O tipo passa a dizer cinco onde a regra diz quatro, e `NENHUMA` vira um valor que a R8.2 não nomeia |

- `[D]` **S86** — **Alternativa A.** `null` para jogo com menos de sete
  posições, e `ehCanastra(jogo)` é `categoriaDe(jogo) !== null` — sem segunda travessia.

---

## 3. A R8.6 já está construída, e ninguém percebeu

A R8.6 é a regra mais delicada do documento normativo, e a única que nasceu de uma ambiguidade
achada ao escrever critérios de aceite (C3). Ela diz que `DE_500` e `DE_1000` dependem da
**posição**, não do tamanho: `A…K` vale 500, e `2…K-A` — mesmas treze cartas — vale 200.

Uma implementação por tamanho passaria em quase todos os critérios e erraria exatamente esse.
Mas a H6 já construiu a ferramenta certa, para outro fim:

```ts
janelaDe(jogo) // S71 — o trecho contíguo das catorze casas que o jogo ocupa
```

| Jogo | Janela | Categoria |
|---|---|---|
| `A 2 3 4 5 6 7 8 9 10 J Q K A` | `[0, 13]` | `DE_1000` |
| `A 2 3 4 5 6 7 8 9 10 J Q K` | `[0, 12]` | `DE_500` |
| `2 3 4 5 6 7 8 9 10 J Q K A` | `[1, 13]` | `LIMPA` ou `SUJA` |

- `[D]` **S87** — A R8.6 é lida pela **janela**, não pelo tamanho:
  `DE_1000` é `[0, 13]` e `DE_500` é `[0, 12]`. A janela da S71 já lê o valor **representado**
  (S55), então uma canastra especial com curinga na ponta é classificada certo sem tratamento
  extra — que é a R8.4.

> Pelo tamanho, `DE_1000` seria `posicoes.length === 14`, e isso é **verdade** — a I1 limita a
> catorze e a I5 só admite dois Ases nesse tamanho, então catorze posições implicam `A…K-A`.
> A leitura por tamanho estaria correta, e mesmo assim é a errada de escrever: ela depende de
> uma dedução sobre dois invariantes distantes, e a R8.6 existe porque essa exata família de
> deduções já produziu uma ambiguidade. A janela diz o que a regra diz.
>
> Para `DE_500` a dedução nem funcionaria: treze posições são `A…K` **ou** `2…K-A`, e é
> justamente esse par que a R8.6 separa.

---

## 4. A precedência é a ordem dos `if`, e é isso que precisa de rede

A R8.3 fixa a precedência `DE_1000 → DE_500 → LIMPA → SUJA`, e o `rules.md` já registrou o
motivo de ela ser explícita:

> *"Sem P17 explícito, a pontuação passa a depender da ordem dos `if` na implementação — um bug
> silencioso que nenhum teste pegaria por acaso."*

Na implementação, a precedência **é** a ordem dos `if`. Não há como torná-la estrutural, e essa
é a diferença entre esta fatia e as anteriores: a S66 tornou a posse impossível de errar, a S76
tornou a R4.2 impossível de errar. Aqui não dá — o que resta é rede de teste.

- `[D]` **S88** — Os **seis** casos de precedência da R8.3 e os **três** da
  R8.6 entram como critérios, e a R8.4 é verificada **dentro** deles, não em separado: ela é a
  consequência de o curinga só ser consultado depois das especiais.

> A R8.4 é a única regra desta fatia que não gera uma linha de código. "As canastras especiais
> admitem curinga" é o que acontece quando o `if` do curinga vem **por último** — e isso torna
> `CA-R8.3-2` e `CA-R8.3-4` os critérios mais valiosos do lote, porque são os únicos que
> reprovam se alguém subir a checagem de curinga para o topo achando que simplifica.

---

## 5. A metade da RF3.5 que nunca existiu

A RF3.5 diz: *"Todos os jogos baixados **dos dois jogadores** são visíveis, com sua categoria de
canastra indicada"*.

A parte "com categoria" é o trabalho novo desta fatia. A parte "dos dois jogadores" **está
quebrada desde a H4**, e a leitura do componente mostra:

```tsx
<section aria-label="Jogos do adversário">
  <p>{visao.jogosDoAdversario.length === 0 ? 'Nenhum jogo na mesa' : ''}</p>
</section>
```

Quando o adversário tem jogos, a tela renderiza um parágrafo **vazio**.

Isso não é hipótese, e o número importa: em **40 de 40** partidas simuladas entre IAs, a mesa
termina com ao menos um jogo baixado, e a maior chegou a **16**. A IA sorteia dentro de
`movimentosValidos`, e `baixar` está lá desde a H4 — então este painel está errado em toda
partida que alguém jogou.

- `[D]` **S92** — A H8 corrige isso: os jogos do adversário passam a ser
  desenhados, com a mesma forma dos meus — posições nomeadas (S60/H5) e categoria. O critério
  usa **âncora positiva antes da negativa**, porque "mostra os jogos do adversário" é
  trivialmente falso hoje e trivialmente verdadeiro num painel que mostra tudo.

> Vale nomear como isto escapou por quatro fatias, porque o padrão se repete. A `CA-S1-2` da H1
> verificou o painel **vazio** — *"Nenhum jogo na mesa"* —, e naquele momento estava certo:
> ninguém baixava. Nenhuma fatia depois voltou a ele, porque nenhuma **spec** falava dele: a H4
> e a H5 cuidaram de `meusJogos`, a H6 e a H7 não tocaram em jogos do adversário.
>
> É o modo de falha oposto ao da H4 e da H5. Lá, a metade observável faltava na fatia que a
> criava, e rodar o app achou. Aqui ela falta numa fatia que **já passou**, e rodar o app não
> acha — porque quem roda o app olha o que acabou de escrever. O que acha é uma spec que releia
> o requisito inteiro em vez da parte nova dele.

---

## 6. Interface

- `[D]` **S93** — Cada jogo de sete ou mais posições ganha um rótulo de
  categoria em português, junto das cartas. Jogo menor não ganha rótulo nenhum — a ausência é
  a R8.1, não um "sem categoria" escrito.

| Categoria | Na tela |
|---|---|
| `DE_1000` | *canastra de 1000* |
| `DE_500` | *canastra de 500* |
| `LIMPA` | *canastra limpa* |
| `SUJA` | *canastra suja* |
| — | nada |

> A tela chama `categoriaDe` e traduz o resultado. Ela continua sem saber o que é uma canastra
> (T6): para ela, categoria é um de quatro rótulos ou nada. É o mesmo arranjo do `valorDa` na
> H6 — a engine decide, a interface nomeia.
>
> O rótulo vazio para jogo de menos de sete é uma decisão, não uma omissão. Escrever *"sem
> categoria"* faria a tela afirmar algo que a R8.2 não define, e a R8.1 é justamente sobre o
> limiar em que a categoria **passa a existir**.

---

## 7. As duas regras que a H8 honra sem fechar

- `[D]` **S91** — A **R8.5** não é da H8 (ela é da H9), e mesmo assim a H8
  já a honra **estruturalmente**: não existe campo a atualizar, então não existe recálculo a
  esquecer. O que a H9 acrescenta é a **prova** — regularizar o curinga e ver a mesma canastra
  mudar de `SUJA` para `LIMPA` na mesma rodada, que é a `CA-R8.5-1`.

> Registrar isto evita a leitura de que a R8.5 foi pulada. Ela é a única regra do projeto que
> descreve uma **não-implementação**: "nunca um campo armazenado" é satisfeita por ausência, e
> ausência não aparece em `grep`. A `CA-R8.5-1` na H9 é o que a torna verificável.

---

## 8. O gatilho que dispara

O [roadmap.md](../roadmap.md) §3 registrou, na H5:

> *Asserção de categoria em `CA-R1.3-1` e `CA-R1.3-2` — **Ao escrever a H8** — na H5 eles
> verificam a posição; `LIMPA`/`SUJA` só existe com a R8 (S61).*

- `[D]` **S90** — O gatilho dispara aqui. Os dois critérios voltam a afirmar
  **categoria**, como o `acceptance-tests.md` §4.2 os define, e a nota da S61 naquele documento
  é atualizada para dizer que a adaptação terminou. O gatilho sai da tabela de abertos e entra
  na de disparados.

> O par continua usando **a mesma carta** com resultados opostos — `A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥` é
> `LIMPA` e `5♥ 6♥ 7♥ [2♥→8♥] 9♥ 10♥ J♥` é `SUJA` —, que é o que ele existe para provar (M2).
> A diferença é que agora ele prova isso pela categoria, e não pela contagem de posições
> `Curinga`, que era o substituto da H5.

---

## 9. Critérios de aceite

O [acceptance-tests.md](../acceptance-tests.md) §4.2 e §4.3 já definem **doze** critérios desta
fatia, e eles vão para os testes como estão:

`CA-R1.3-1` · `CA-R1.3-2` · `CA-R8.3-1` · `CA-R8.3-2` · `CA-R8.3-3` · `CA-R8.3-4` ·
`CA-R8.3-5` · `CA-R8.3-6` · `CA-R8.3-7` · `CA-R8.6-1` · `CA-R8.6-2` · `CA-R8.6-3`

É a segunda vez que uma spec **herda** critérios em vez de criar — a primeira foi a H4 — e desta
vez a cobertura herdada é quase total. Os novos abaixo cobrem o que aqueles não alcançam: a
forma da consulta e a interface.

### 9.1 Domínio

| # | Dado | Então |
|---|---|---|
| **CA-S86-1** | jogo de **6** posições | `categoriaDe` devolve `null`, e `ehCanastra` é falso |
| **CA-S86-2** | jogo de **7** posições | `categoriaDe` devolve categoria, e `ehCanastra` é verdadeiro — o limiar da R8.1 |
| **CA-S87-1** | `A…K` com o curinga na ponta do Rei | `DE_500` — a janela lê o valor **representado** (S55), não o impresso |
| **CA-S85-1** | `Jogo` em qualquer estado | **nenhum** campo `categoria` existe no objeto (R8.5) |

### 9.2 Interface, nível 4

| # | Dado | Então |
|---|---|---|
| **CA-S92-1** | adversário com um jogo de `5♥ 6♥ 7♥` | o painel dele **mostra as três cartas** pelo nome |
| **CA-S92-2** | adversário **sem** jogos | o painel dele diz *"Nenhum jogo na mesa"* |
| **CA-S93-1** | jogo próprio de 7 posições sem curinga | aparece *canastra limpa* junto das cartas |
| **CA-S93-2** | jogo próprio de 7 posições com curinga | aparece *canastra suja* |
| **CA-S93-3** | jogo próprio de **6** posições | **nenhum** rótulo de canastra aparece |
| **CA-S93-4** | jogo do **adversário** de 7 posições | a categoria dele também aparece (RF3.5) |

---

## 10. Decisões

Nove, confirmadas em bloco em 2026-08-02.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **S85** | Domínio | `categoriaDe(jogo)` **derivada** e exportada; a `VisaoDoJogador` não muda |
| **S86** | Domínio | `CategoriaCanastra \| null` — quatro categorias, e `null` abaixo de sete |
| **S87** | Domínio | R8.6 lida pela **janela** da S71, não pelo tamanho |
| **S88** | Teste | A precedência da R8.3 **é** a ordem dos `if`; a R8.4 é verificada dentro dela |
| **S89** | Escopo | A H8 devolve **categoria**, não pontos — os pontos são da H12 |
| **S90** | Documento | O gatilho da S61 dispara: `CA-R1.3-1` e `CA-R1.3-2` voltam a afirmar categoria |
| **S91** | Escopo | A R8.5 é honrada **estruturalmente** aqui e **provada** na H9 |
| **S92** | Interface | Os jogos do adversário passam a ser desenhados — hoje não são |
| **S93** | Interface | Rótulo de categoria em português; jogo abaixo de sete não ganha rótulo |

### Onde eu erraria, se errasse

**Calibragem:** 84 decisões na série, 5 quedas, todas no `rules.md` — e duas fatias seguidas sem
queda, 13 de 13 na H6 e 10 de 10 na H7.

Esta é a spec com **menos risco de domínio** do projeto até aqui, e o motivo é histórico: a R8 é
a única seção do `rules.md` que ganhou uma **regra nova** (a R8.6) durante a escrita dos
critérios de aceite. O trabalho difícil de interpretação já foi feito, por você, em julho — e
doze dos critérios desta fatia já estavam escritos antes de ela começar.

Sobra pouco, e o pouco é isto:

- **S93** escolhe as palavras que aparecem na tela. *"canastra de 500"* é a minha tradução de
  `DE_500`; se na sua mesa se diz outra coisa — *"canastra real"*, *"quinhentão"* —, é aqui.
- **S89** aposta que separar categoria de pontos não vai te obrigar a voltar aqui na H12. Se
  você preferir a tabela da R8.2 fechada de uma vez, com os pontos junto, é uma linha a mais
  agora e uma a menos depois.

Das de software, a **S92** é a que eu não esperava escrever: ela não é uma decisão de desenho, é
um defeito de quatro fatias atrás que só apareceu porque esta spec releu a RF3.5 inteira. Vale
como aviso para as próximas — o requisito que a fatia "fecha" pode ter partes que nenhuma fatia
anterior tocou.

---

## 11. A pendência que a implementação abriu

> Status: **`S94` aguardando confirmação.** Os critérios `CA-R8.6-1` e `CA-R8.6-2` estão
> `skip` na suíte até ela ser respondida.

O passo 4 encontrou o que o passo 1 não previu: **`2…K-A` é inalcançável**, e por isso aqueles
dois critérios não são satisfazíveis.

```
descrito como   2 3 4 5 6 7 8 9 10 J Q K A   →   janela [0, 12]   DE_500
a engine devolve             A 2 3 4 … J Q K
```

`criarJogo` tenta as duas pontas do Ás (S42) e aceita a primeira que fecha trecho contíguo. A
ponta baixa vem primeiro na lista, então as mesmas treze cartas saem como `A…K`. Nenhum caminho
produz o outro arranjo: o `aumentar` revalida pelo mesmo `criarJogo` (S64), e um curinga fazendo
papel de Ás cai na mesma resolução.

A ambiguidade só existe quando a corrida é exatamente `2..K` mais **um** Ás — corridas menores
têm uma leitura só, e com dois Ases o jogo é o de catorze. Está medido, e os seis casos estão no
teste `CA-R8.6-1` que registra o arranjo devolvido hoje.

**A escolha da engine é a certa, e é isso que torna a decisão barata.** `A…K` vale 500 contra
200, e as duas leituras alcançam 1000 depois — a ponta baixa domina em **todo** momento, então
nenhum jogador escolheria a outra. O que falta não é o comportamento: é a decisão. `[[0], [13]]`
com "a primeira ganha" é ordem de array, exatamente o formato do `id` derivado que a S63 teve de
corrigir na H6 — uma escolha de implementação que só fica consequente numa fatia posterior.

| # | Alternativa | A favor | Contra |
|---|---|---|---|
| **A** | A engine resolve o Ás na ponta que **maximiza a categoria** — formaliza o que já acontece | Nenhum código novo, e a escolha é sempre a melhor para o jogador | A R8.6 fica com um exemplo sem caso alcançável, e o `rules.md` precisa dizer isso |
| **B** | O jogador escolhe a ponta, como escolhe o papel do curinga (S51) | Torna a R8.6 alcançável; coerente com "um conjunto de cartas não determina um jogo" | `Posicao` ganha campo, `baixar` e `aumentar` carregam, a enumeração dobra — para oferecer uma jogada **estritamente pior** |
| **C** | Adaptar os dois critérios em silêncio | — | Teste verde documentando decisão que ninguém tomou. É o modo de falha que a RD9 nomeia, e por isso os dois estão `skip` e não reescritos |

- `[P]` **S94** — **Alternativa A**, com duas correções de documento: nota na
  **R8.6** do `rules.md` dizendo que `2…K-A` descreve um arranjo que a engine não produz porque
  `A…K` domina, e reescrita de `CA-R8.6-1` e `CA-R8.6-2` no `acceptance-tests.md` para afirmar
  o que é verificável — as mesmas treze cartas produzem `A…K`, e a categoria é `DE_500`.

> A B não é absurda, e vale dizer por que ela cai. A S51 abriu a escolha do curinga ao jogador
> porque as duas leituras são **taticamente diferentes**: uma vira canastra limpa e a outra
> suja, e só uma dá para regularizar depois. Aqui não há tática — uma opção domina a outra em
> pontos e em potencial de crescimento. A S47 já decidiu não oferecer opções sem escolha real,
> e oferecer uma opção estritamente pior é a mesma coisa com um custo maior.
>
> **Esta é decisão de domínio, não de software.** Se na sua mesa alguém já preferiu o Ás em
> cima por algum motivo que eu não vejo, a A cai e a B passa a valer o custo.
