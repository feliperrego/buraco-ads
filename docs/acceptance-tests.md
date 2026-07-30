# Critérios de aceite

> Status: **confirmado** — 7 decisões, nenhuma pendência
> A ambiguidade C3 gerou a regra nova R8.6 em `rules.md`
> Deriva de: [rules.md](rules.md) · [domain.md](domain.md) · [user-stories.md](user-stories.md)
> Última atualização: 2026-07-29

## Como ler este documento

`rules.md` diz **o que é verdade**. Este documento diz **como saber que o código respeita
isso**.

A diferença é concreta. A R8.3 é uma frase — "a classificação segue a precedência da tabela".
O critério de aceite correspondente é uma tabela de casos, cada linha virando um teste. A
regra não muda; o que se acrescenta é a lista de situações em que ela precisa ser observada.

Identificadores: `CA-Rn-k`, onde `Rn` é a regra validada e `k` distingue os casos. A
rastreabilidade fica embutida no nome — não depende de disciplina para se manter.

Pendências: `C1`…`Cn`.

---

## 1. Formato

- `[D]` **Dado / Quando / Então**, em português, com a regra citada no nome do
  critério e no nome do teste.

```
CA-R5.3-4
  Dado    uma tentativa de baixar K♥ A♥ 2♥
  Quando  o jogo é construído
  Então   a construção falha por violar I6
```

O nome do teste em Vitest repete o identificador:

```
✓ CA-R5.3-4 — K-A-2 e invalida porque a sequencia nao passa do As alto
```

- `[D]` Este documento cobre os casos que **alguém erraria escrevendo de
  memória**. Os critérios exaustivos de cada história ficam na spec dela
  ([user-stories.md](user-stories.md) U6).

> A escolha é deliberada. Um documento com um critério para cada caso de cada regra não seria
> lido, e cada spec de história precisa dos seus de todo modo. O que **não** pode ficar
> espalhado é o conjunto abaixo: casos em que a leitura natural da regra leva à implementação
> errada.

---

## 2. A ambiguidade que gerou uma regra nova

Escrever os critérios de precedência revelou um caso que `rules.md` não resolvia.

A R8.2 definia `DE_500` como "sequência completa de **Ás a Rei** — 13 cartas". Mas existe outra
sequência de 13 cartas: **do 2 ao Ás alto** (`2-3-4-…-K-A`). A redação admitia três leituras:

| Leitura | `2…K-A` (13 cartas) valeria |
|---|---|
| **Literal** — `DE_500` exige começar no Ás | 200 (`LIMPA`) |
| Por tamanho — qualquer sequência de 13 é `DE_500` | 500 |
| Por completude — contém todos os valores distintos | 500 |

- `[D]` **C3 — leitura literal.** `DE_500` exige **exatamente Ás a Rei**. Uma sequência de 13
  cartas do 2 ao Ás alto é `LIMPA` ou `SUJA`. Decidido em 2026-07-29 e incorporado a
  `rules.md` como **R8.6**.

> Duas coisas valem registrar sobre este episódio.
>
> A primeira: a ambiguidade **não apareceu ao escrever a regra, nem ao modelar o domínio**.
> Apareceu ao escrever critérios de aceite — quando foi preciso dizer, para um caso concreto,
> qual número sai. É o argumento prático a favor de escrever critérios antes de código:
> eles forçam precisão que a prosa tolera.
>
> A segunda: a correção foi feita **na regra**, não só no critério. Ajustar apenas
> `CA-R8.6-1` deixaria `rules.md` ainda ambíguo para o próximo leitor.

---

## 3. O problema do estado inicial

Para testar a batida preciso de uma partida com canastra limpa na mesa, morto já pego e uma
carta na mão. Chegar lá jogando 40 turnos é insustentável — e o teste passaria a falhar por
motivos que não têm nada a ver com a batida.

| Alternativa | A favor | Contra |
|---|---|---|
| **A. Só sequência de comandos** `(semente, comandos[])` | Todo estado testado é comprovadamente alcançável | Frágil: mudar uma regra muda o estado resultante e quebra testes não relacionados. E o preparo esconde o que o teste verifica |
| **B. Construtor livre de estado** | Direto e legível | Permite montar estado impossível — três Ases de copas — e validar comportamento sobre situação que nunca ocorre |
| **C. Construtor validado** | Legível **e** impossível de produzir estado inválido | Não garante alcançabilidade |

- `[D]` **Alternativa C.** Existe um construtor declarativo de estado que, ao
  final, roda **os mesmos invariantes que a engine usa**: conservação das 104 cartas (M9) e os
  sete invariantes de `Jogo` (domain.md §4). Descrição impossível faz o construtor falhar.

- `[D]` A alcançabilidade é coberta **pelo outro lado**: o teste de mil partidas
  entre IAs aleatórias ([user-stories.md](user-stories.md) U2) só percorre estados alcançáveis
  por construção.

> C4 e C5 se completam e é isso que faz a combinação funcionar. O construtor cobre **estados
> específicos** que seriam caros de alcançar; as partidas aleatórias cobrem **alcançabilidade
> e conservação** em volume. Nenhum dos dois sozinho seria suficiente: o construtor poderia
> testar situações irreais, e as partidas aleatórias quase nunca produziriam a batida com
> morto convertido em monte.

### 3.1 Onde o construtor mora

- `[D]` O construtor fica em `engine/testing/`, com **ponto de entrada próprio**.
  Não é exportado por `engine/index.ts` (A8), e o ESLint (A2) proíbe `ui/` e `ia/` de importá-lo.

> Sem C6, o construtor viraria uma porta dos fundos: alguém na interface o usaria para
> "consertar" um estado, e a garantia de que `Partida` só contém estados válidos (M8) morreria
> silenciosamente. A restrição é a mesma da A2 — verificada por lint, não por intenção.

---

## 4. Os critérios que ninguém acerta de memória

### 4.1 Sequências e o Ás — R5.2, R5.3

| # | Dado | Então |
|---|---|---|
| **CA-R5.3-1** | `5♥ 6♥ 7♥` | válido |
| **CA-R5.3-2** | `Q♥ K♥ A♥` | válido — Ás alto |
| **CA-R5.3-3** | `A♥ 2♥ 3♥` | válido — Ás baixo, e o 2♥ é **natural** (R1.3) |
| **CA-R5.3-4** | `K♥ A♥ 2♥` | **inválido** — não passa do Ás alto |
| **CA-R5.3-5** | `A♥ 2♥ … K♥ A♥` (14) | válido, com Ás nas duas pontas |
| **CA-R5.3-6** | 15 cartas em sequência | **inválido** — excede o máximo |
| **CA-R5.6-1** | `5♥ 6♥ 6♥ 7♥` | **inválido** — valor repetido |
| **CA-R5.6-2** | os dois Ases de `A♥ … K♥ A♥` | válido — única exceção |

> CA-R5.3-2 e CA-R5.3-4 são o par decisivo. Quem implementa a ordem dos valores como
> **circular** faz o -2 passar e o -4 falhar. Os dois juntos travam a interpretação correta:
> ordem linear de 14 casas, não anel.

### 4.2 O 2 como natural ou curinga — R1.3, R1.4

| # | Dado | Então |
|---|---|---|
| **CA-R1.3-1** | `A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥` | canastra `LIMPA` — o 2♥ está na casa dele |
| **CA-R1.3-2** | `5♥ 6♥ 7♥ [2♥→8♥] 9♥ 10♥ J♥` | canastra `SUJA` — o mesmo 2♥ agora é curinga |
| **CA-R1.4-1** | sequência com `2♠` e `2♦` como curingas | **inválido** — no máximo um curinga |
| **CA-R1.4-2** | `A♥ 2♥ 3♥` mais `2♠` como curinga | válido — o 2♥ é natural, só o 2♠ conta |

> CA-R1.3-1 e CA-R1.3-2 usam **a mesma carta** com resultados opostos. É a prova de que
> "curinga" é papel na sequência, não atributo da carta (M2). Se a implementação guardar
> `ehCuringa` na carta, um dos dois falha.

### 4.3 Precedência das categorias — R8.3, R8.4

| # | Dado | Então |
|---|---|---|
| **CA-R8.3-1** | 14 cartas, sem curinga | `DE_1000`, não `LIMPA` |
| **CA-R8.3-2** | 14 cartas, com curinga | `DE_1000`, não `SUJA` (R8.4) |
| **CA-R8.3-3** | `A…K` (13), sem curinga | `DE_500` |
| **CA-R8.3-4** | `A…K` (13), com curinga | `DE_500` (R8.4) |
| **CA-R8.3-5** | 7 cartas, sem curinga | `LIMPA` |
| **CA-R8.3-6** | 7 cartas, com curinga | `SUJA` |
| **CA-R8.3-7** | 6 cartas | não é canastra — nenhuma categoria |
| **CA-R8.6-1** | `2…K-A` (13), sem curinga | `LIMPA` (200), **não** `DE_500` |
| **CA-R8.6-2** | `2…K-A` (13), com curinga | `SUJA` (100) |
| **CA-R8.6-3** | `A…K` (13) mais o segundo Ás | passa de `DE_500` a `DE_1000` |

### 4.4 Regularizar o curinga — R6.5, R6.6, R8.5

| # | Dado | Quando | Então |
|---|---|---|---|
| **CA-R6.5-1** | jogo de copas com `2♥` fazendo papel de `8♥`; jogador tem `8♥ 4♥ 3♥ A♥` | estende até o Ás e repõe o `8♥` | o `2♥` passa a `Natural` e a categoria vira `LIMPA` |
| **CA-R6.5-2** | jogo de copas com `2♠` como curinga | tenta regularizar | **não existe** o comando em `movimentosValidos` — canastra suja permanente |
| **CA-R6.5-3** | qualquer regularização | o comando é aplicado | o tamanho da mão **não muda** por causa do 2 — ele fica no jogo |
| **CA-R8.5-1** | canastra `SUJA` de 100 | curinga regularizado | vale 200 na apuração da mesma rodada |

> CA-R6.5-2 é o critério que prova que a impossibilidade é **estrutural** (M2), não uma
> verificação à parte: o comando simplesmente não existe.

### 4.5 Morto e continuidade do turno — R9.2, R9.3, R9.4

| # | Dado | Quando | Então |
|---|---|---|---|
| **CA-R9.4-1** | 3 cartas na mão que formam sequência; morto disponível | baixa as 3 | pega o morto **e a fase segue `Acao`**, com descarte pendente |
| **CA-R9.4-2** | 1 carta na mão; morto disponível | descarta | pega o morto e o turno **termina** |
| **CA-R9.3-1** | jogador já pegou um morto; resta um | zera a mão de novo | pega o **segundo** morto |
| **CA-R9.3-2** | adversário pegou os dois mortos | jogador zeraria a mão | ver CA-R10.1.3-1 |

> CA-R9.4-1 é o critério que rejeitou a minha proposta original (P21). Quem implementar "pegar
> o morto encerra o turno" falha exatamente aqui.

### 4.6 As exceções do morto — R4.6 a R4.8, R10.1.1 a R10.1.3, R11.5

| # | Dado | Então |
|---|---|---|
| **CA-R4.6-1** | monte esgotado, um morto intacto | esse morto vira monte com 11 cartas; mortos restantes = 0 |
| **CA-R4.8-1** | monte esgotado, nenhum morto | rodada encerra **sem batida**; apuração normal |
| **CA-R10.1.1-1** | morto convertido em monte; jogador sem morto, com canastra limpa | **pode bater** — exigência do morto suspensa |
| **CA-R10.1.2-1** | adversário pegou os dois; jogador sem morto, com canastra limpa | **não pode bater** |
| **CA-R10.1.3-1** | jogador sem morto disponível e sem poder bater | **nenhum** movimento válido esvazia a mão |
| **CA-R11.5.1-1** | jogador ficou sem morto por conversão | **sem** penalidade de −100 |
| **CA-R11.5.2-1** | jogador ficou sem morto porque o adversário levou os dois | penalidade de **−100** |

> Estes sete são os mais improváveis de acontecer numa partida de teste e os mais fáceis de
> implementar errado. Todos exigem estado construído (C4) — esperar que apareçam sozinhos não
> é estratégia.

### 4.7 Invariante global — M9

| # | Dado | Então |
|---|---|---|
| **CA-M9-1** | qualquer comando aplicado a qualquer partida | soma de cartas em mãos, jogos, monte, lixo e mortos = **104**, sem `id` repetido |
| **CA-M9-2** | mil partidas entre IAs aleatórias, sementes distintas | nenhuma trava, todas terminam, CA-M9-1 vale após **cada** comando |

---

## 5. Rastreabilidade

- `[D]` `scripts/verificar-cobertura.py` passa a conferir **três** relações:
  regra ↔ história, regra ↔ critério, e critério ↔ regra existente. Um critério citando regra
  inexistente falha o CI, igual a uma regra órfã.

> A convenção `CA-Rn-k` foi escolhida para isso: o vínculo está no identificador, então não há
> tabela de mapeamento para manter desatualizada.

---

## 6. Histórico das decisões

**Não há pendências.** As 7 decisões foram confirmadas em 2026-07-29.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **C1** | Formato | Dado/Quando/Então em português; identificador `CA-Rn-k` no nome do teste |
| **C2** | Escopo | Aqui só os casos que se erraria de memória; o resto nas specs de história |
| **C3** | **Regra** | Leitura **literal**: `2…K-A` (13 cartas) é `LIMPA`, não `DE_500`. Gerou **R8.6** |
| **C4** | Estado inicial | Construtor declarativo **validado** pelos invariantes da engine |
| **C5** | Alcançabilidade | Coberta pelas mil partidas aleatórias, não por fixture |
| **C6** | Fronteira | Construtor em `engine/testing/`, proibido a `ui/` e `ia/` por ESLint |
| **C7** | Verificação | Script confere as três relações de rastreabilidade |

### Notas de decisão

- **C3** foi a única que exigia decisão de domínio, e a única que **alterou `rules.md`**:
  gerou a R8.6 e a precisão correspondente no `glossary.md`. As regras passaram de 65 para 66.
- **C4 e C6** juntas evitam que o construtor de teste se torne porta dos fundos para fabricar
  estado inválido em produção.
- **C2** define o tamanho deste documento: 40 critérios sobre os casos difíceis, e os
  exaustivos distribuídos nas specs de história.