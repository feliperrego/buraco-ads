# Spec 0009 — Regularizar o curinga

> Status: **confirmado** — 7 decisões, nenhuma pendência
> História: **H9** — "Estendo a sequência até o curinga ocupar sua casa e a canastra fica limpa"
> Fecha: R6.5, R6.6, R8.5
> Última atualização: 2026-08-02

Decisões a partir de **`S95`**, continuando a série global.

---

## 1. Escopo

### Entra

O comando `regularizarCuringa`: o `2` já baixado **deixa de ser curinga** ao ocupar sua casa
natural, e a carta que ele representava é reposta (R6.5). É o **sexto e último** comando do
[domain.md](../domain.md) §6 — depois dele, a tabela de comandos está fechada.

Fecha também a **R8.5**, que a H8 já honrava estruturalmente (S91) e que só agora fica
**provada**: a mesma canastra muda de `SUJA` para `LIMPA` no meio da rodada, sem que nada seja
recalculado à mão, porque não há campo a recalcular.

### Não entra

| Fora | Vai para |
|---|---|
| Pegar morto e bater (R9, R10) | H10, H11 |
| Somar pontos na apuração (R11) | H12 |

- `[D]` **S95** — A H9 não acrescenta nada além do comando. Em particular,
  ela **não** remove a guarda da S45/S70 — a jogada que esvaziaria a mão continua fora da lista,
  e agora são **três** comandos passando pela mesma guarda em `adicionar`. Ela sai na H10,
  junto com a batida, e o gatilho do [roadmap.md](../roadmap.md) §3 passa a citar as três.

---

## 2. A pergunta que esta fatia existe para responder

O [roadmap.md](../roadmap.md) §3 registrou um gatilho que não é sobre uma decisão adiada, e sim
sobre **nós**:

> *Se o modelo de posições (M2) está certo — **Ao terminar H9** — se regularizar o curinga foi
> difícil, o modelo está errado.*

O [domain.md](../domain.md) §2 fez três previsões sobre esta regra, em julho, antes de existir
uma linha de engine. Esta spec é onde elas são cobradas:

| Previsão do domain.md §2 | Onde ela cai nesta fatia |
|---|---|
| *"Regularizar é converter uma posição `Curinga` em `Natural`. A regra vira uma transformação nomeada, não um caso especial espalhado"* | §3 |
| *"Curinga de outro naipe é permanentemente sujo porque a conversão exige que `carta.naipe` seja igual ao naipe da sequência. A impossibilidade é **estrutural**, não uma verificação extra"* | §3.1 |
| *"A classificação não pode ser um campo armazenado"* (R8.5) | §5 |

A **primeira** condição da R6.5 — "o curinga é o 2 do naipe da sequência" — é a que a previsão
do meio cobre, e ela é a mais fácil de implementar errado: escrevê-la como um `if` explícito
funcionaria, passaria nos testes, e **esconderia** que o modelo já a garante.

---

## 3. A operação, e as três condições que caem dos invariantes

A R6.5 exige três coisas ao mesmo tempo. Sob o M2, nenhuma delas vira verificação nova:

| Condição da R6.5 | Como ela é satisfeita |
|---|---|
| 1. O curinga é o `2` **do naipe da sequência** | **I2** — uma posição `Natural` precisa ser do naipe do jogo. Um `2♠` convertido para `Natural` numa sequência de copas viola I2, e o jogo simplesmente não se forma |
| 2. A sequência **alcança a casa do 2** | **I3** — sem buraco. O `2` vai para a casa 1, e as casas entre ela e o início atual precisam ser preenchidas |
| 3. A carta substituída é **reposta** | **I3** de novo — a casa que o curinga deixou vaga é um buraco, e um buraco reprova |

- `[D]` **S97** — `regularizarJogo(jogo, novasCartas)` vive em `jogo.ts`, ao
  lado de `aumentarJogo`, e é implementada **sobre `criarJogo`** pelo mesmo caminho da S64:

```ts
export function regularizarJogo(jogo: Jogo, novas: readonly Carta[]): ResultadoDeJogo
// ≡ criarJogo(jogo.dono, [curingaConvertido, ...outras, ...novas]), com o id da S63 restaurado
```

A conversão é uma linha — `{ tipo: 'Natural', carta }` no lugar de
`{ tipo: 'Curinga', carta, representa }` — e o resto é a porta única de sempre.

> **É aqui que se lê o sinal do gatilho.** Se esta seção fosse longa, com casos especiais para
> naipe, para casa ocupada e para reposição, o M2 estaria errado. Ela é uma tabela de três
> linhas em que a coluna da direita diz "I2", "I3" e "I3". A previsão de julho se sustentou.

### 3.1 O caso que prova que a impossibilidade é estrutural

- `[D]` **S98** — A casa natural do `2` é a **casa 1** — a única entre o Ás e
  o `3` (S41). Disso sai o pré-requisito, e ele é uma comparação: **`inicio ≥ 2`**.

Se a janela do jogo já cobre a casa 1, ela está ocupada, e o `2` não tem para onde ir. Isso
produz um caso que vale critério próprio, porque parece regularizável e não é:

> Jogo: `A♥ 2♥ 3♥ 4♥ 5♥ 6♥ [2♥→7♥]` — o *fixture* da `CA-S55-1`.

As **duas cópias** do `2♥` estão no mesmo jogo: uma natural na casa 1, outra de curinga na casa
6. O curinga é do naipe certo, e mesmo assim a canastra é **permanentemente suja** — a casa
dele está tomada pela irmã. Nenhum `if` diz isso; a I5 diria, se a tentativa fosse feita.

> A S55 foi a única decisão do projeto **deduzida e não pesquisada**, e a `CA-S55-1` era o único
> lugar onde ela estava presa em teste. A H9 lhe dá o segundo, e num papel novo: aquele mesmo
> jogo é agora o exemplo de curinga do naipe certo que não se limpa.

---

## 4. A forma do comando

- `[D]` **S96** — O comando aponta o jogo e leva **só identificadores de
  carta**:

```ts
{ tipo: 'regularizarCuringa'; jogo: string; cartas: readonly string[] }
```

**Não** reusa `CartaBaixada`, e a ausência do campo `representa` é a decisão. Depois de
regularizar, o jogo não tem curinga — a I4 aceitaria um novo, e o comando **não permite pedi-lo**.
Acrescentar curinga é o que o `aumentar` faz; misturar as duas coisas num gesto seria um comando
que faz duas jogadas.

> É o mesmo formato da S76, que fechou a R4.2 e a R4.4 por **ausência de campo**. A diferença é
> que lá as duas regras proibiam algo; aqui o que se recusa é uma composição que nenhuma regra
> proíbe e nenhuma regra pede. A R3.3 já deixa o jogador fazer as duas em sequência.

---

## 5. A enumeração

Regularizar é alargar a janela **para baixo** até a casa 1, preenchendo tudo com naturais.

- `[D]` **S99** — A enumeração percorre `[novoInicio, novoFim]` com
  **`novoInicio ∈ {0, 1}`** e `novoFim ∈ [fim, 13]`, e **nenhuma casa pode ficar vazia** — o
  curinga foi gasto na própria operação (I4).

Duas consequências que valem dizer:

- **`novoInicio` tem dois valores, não catorze.** A casa 1 é obrigatória (é para lá que o `2`
  vai) e a casa 0 é opcional (o Ás, se o jogador tiver). Não há terceira opção: começar em 2 ou
  mais deixaria a casa 1 vazia.
- **`novoFim` varia** porque a S48 casa botão com a **seleção exata**. Um jogador que selecionou
  o Ás, o `3`, o `4`, o `8` reposto **e** um `J` para a outra ponta fez uma jogada só na cabeça
  dele; sem o comando correspondente, aquela seleção não teria botão. É o mesmo argumento da
  S72, e é ele que impede de cortar a enumeração pela metade.

> A guarda da S45/S70 vale igual, e passa a servir **três** comandos na mesma função
> `adicionar`. Isso é bom sinal: a guarda temporária não se multiplicou por comando.

---

## 6. O que a H9 prova sobre a H8

- `[D]` **S100** — A **R8.5** deixa de ser honrada por ausência e passa a ser
  **provada**: a mesma canastra, com o mesmo `id`, vale `SUJA` antes do comando e `LIMPA`
  depois, na mesma rodada. Nada é recalculado, porque a S85 fez da categoria uma função.

E a **S63** volta, como a H6 previu que voltaria:

> *"Ela volta na H9, quando regularizar o curinga mudar o conteúdo do jogo sem que ele deixe de
> ser o mesmo jogo."*

Regularizar troca a primeira posição do jogo — a janela cresce para baixo —, exatamente como
crescer pela esquerda fazia no `aumentar`. O `id` é preservado pelo mesmo mecanismo, e o
critério é o mesmo par.

> Vale lembrar o que a H6 anotou: a mutação mais estreita daquela fatia foi a do `id`, e ela
> reprovou **um** teste — a `CA-S63-1`. Com a H9, passam a ser dois, em dois comandos
> diferentes. A identidade do `Jogo` deixa de depender de um teste só.

---

## 7. Interface

- `[D]` **S101** — O rótulo usa o nome que a própria R6.5 dá à operação:
  *"Limpar a canastra com 8 de copas"*, nomeando a carta **reposta** — que é a que distingue
  esta jogada de um `aumentar` qualquer sobre o mesmo jogo.

O mecanismo é o da S48, sem novidade: as cartas vêm da mão, a seleção funciona igual. E não há
colisão de rótulo com `aumentar` sobre o mesmo jogo — um `aumentar` que incluísse a carta
reposta violaria a **I5**, porque o curinga ainda ocuparia aquele valor. Os dois comandos nunca
têm o mesmo conjunto de cartas.

---

## 8. Critérios de aceite

O [acceptance-tests.md](../acceptance-tests.md) §4.4 já define **quatro**, e eles vão para os
testes como estão:

`CA-R6.5-1` · `CA-R6.5-2` · `CA-R6.5-3` · `CA-R8.5-1`

### 8.1 Domínio e comandos

| # | Dado | Então |
|---|---|---|
| **CA-R6.6-1** | jogo `5♥ 6♥ 7♥ [2♥→8♥] 9♥ 10♥ J♥`, mão com `A♥ 3♥ 4♥ 8♥` | sucesso: 11 posições, **todas naturais**, e o `2♥` agora está na **casa 1** |
| **CA-R6.6-2** | o mesmo jogo, depois do comando | nenhuma outra posição mudou de ordem relativa — a R6.6 é exceção **só** para o curinga |
| **CA-S96-1** | um `regularizarCuringa` | o comando **não tem** campo que permita declarar curinga novo |
| **CA-S98-1** | jogo `A♥ 2♥ 3♥ 4♥ 5♥ 6♥ [2♥→7♥]` (o da `CA-S55-1`) | **nenhum** `regularizarCuringa` é oferecido — a casa 1 está ocupada pela outra cópia |
| **CA-S98-2** | jogo com curinga de outro naipe, mão completa | **nenhum** comando — I2 impede, sem checagem de naipe escrita |
| **CA-S99-1** | jogo regularizável, mão **sem** a carta reposta | **nenhum** comando — a casa do curinga ficaria vazia (I3) |
| **CA-S99-2** | jogo regularizável, mão com Ás e sem Ás | há comando nos dois casos, e o com Ás tem **uma carta a mais** |
| **CA-S100-1** | jogo regularizado | o `id` é **o mesmo** de antes (S63) |
| **CA-M9-11** | após `regularizarCuringa` | a conservação das 104 se mantém, sem `id` repetido |

### 8.2 Interface, nível 4

| # | Dado | Então |
|---|---|---|
| **CA-S101-1** | seleção que casa com um `regularizarCuringa` | aparece botão que nomeia a **carta reposta** |
| **CA-S101-2** | o botão é clicado | a mesa passa a mostrar o jogo **sem** "valendo", e a categoria muda de suja para limpa |

---

## 9. Decisões

Sete, confirmadas em bloco em 2026-08-02.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **S95** | Escopo | A guarda da S45/S70 continua, agora servindo **três** comandos |
| **S96** | API | `{ tipo, jogo, cartas: string[] }` — **sem** `representa`, então não cabe curinga novo |
| **S97** | Domínio | `regularizarJogo` sobre `criarJogo`, como a S64; as três condições caem de I2 e I3 |
| **S98** | Domínio | A casa do `2` é a **1**, e o pré-requisito é `inicio ≥ 2` |
| **S99** | Enumeração | `novoInicio ∈ {0, 1}`, `novoFim ∈ [fim, 13]`, **sem buraco** |
| **S100** | Domínio | O `id` é preservado — a S63 na fatia que a H6 previu |
| **S101** | Interface | Rótulo *"Limpar a canastra com …"*, nomeando a carta reposta |

### Onde eu erraria, se errasse

**Calibragem:** 94 decisões, 5 quedas, todas no `rules.md`. As três últimas fatias fecharam 13
de 13, 10 de 10 e 10 de 10 — e a única correção recente veio de mutação, não de revisão.

Esta spec tem **uma** proposta de domínio de verdade, e é a que eu pediria para você olhar:

- **S99** decide que regularizar e estender a ponta de cima cabem no **mesmo** gesto. Se na sua
  mesa "limpar a canastra" for uma jogada fechada — você repõe a carta e estende até o 2, e
  ponto —, então `novoFim` não varia e a enumeração encolhe. O argumento a favor de variar é a
  S48: sem isso, uma seleção que inclua carta da ponta de cima fica sem botão.

E uma observação que não é proposta: **a R6.5 não diz o que acontece se o jogador puder
regularizar e não quiser.** Nada obriga, e a enumeração oferece as duas coisas — regularizar ou
apenas aumentar. Estou lendo isso como "é escolha do jogador"; se na sua mesa a regularização
for **obrigatória** quando possível, isso é regra nova no `rules.md`, não decisão de spec.
