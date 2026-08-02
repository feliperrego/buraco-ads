# Spec 0006 — Aumentar um jogo na mesa

> Status: **confirmado** — 13 decisões, nenhuma pendência
> História: **H6** — "Acrescento cartas a um jogo que já está na mesa, quantas vezes quiser no turno"
> Fecha: R3.3, R6.2, R6.3, R6.4
> Última atualização: 2026-08-02

Decisões a partir de **`S62`**, continuando a série global.

---

## 1. Escopo

### Entra

O comando `aumentar`: acrescentar cartas da mão a um jogo **próprio** já na mesa, quantas
vezes o jogador quiser dentro do turno (R3.3). É o quarto dos seis comandos do
[domain.md](../domain.md) §6.

### Não entra

| Fora | Vai para |
|---|---|
| Regularizar o curinga já baixado (R6.5, R6.6) | H9 |
| Pegar o lixo (R4.2, R4.4) | H7 |
| Categoria da canastra — `LIMPA`, `SUJA`, `DE_500`, `DE_1000` (R8) | H8 |
| Bater e pegar morto (R9, R10) | H10 |

- `[D]` **S62** — A H6 continua **sem calcular categoria**, como a S50 fixou
  para a H5. Isso tem uma consequência que vale nomear, porque a R6.3 usa a palavra:
  *"é permitido aumentar um jogo que já é canastra, até o limite de 14 cartas"*. A H6 verifica
  a R6.3 pelo **tamanho** — um jogo de 7 posições aceita mais, e o de 14 não aceita nenhuma —,
  sem que a palavra "canastra" exista no código. A asserção de categoria chega na H8.

> A R6.3 é, na prática, uma regra sobre o limite de 14 vista de outro ângulo. O que ela
> acrescenta à R5.3 não é um limite novo: é a negação de uma regra que **não** existe — a de
> que a canastra fecharia ao completar sete. Um critério que prove o crescimento de 7 para 8
> fecha a R6.3 inteira, e não precisa de R8 para isso.

---

## 2. As duas decisões que os documentos anteriores não tomaram

### 2.1 O `id` do jogo deixa de poder ser derivado do conteúdo

A H4 deu ao `Jogo` um `id` derivado, no mesmo espírito do `id` da carta (S3):

```ts
id: `J${dono}-${primeiraPosicao.carta.id}`
```

Nunca foi decisão de spec — é escolha de implementação registrada em comentário, e a H4 podia
se dar a ela porque **jogo baixado nunca mudava**. A H6 é a fatia em que muda, e a escolha
quebra no primeiro caso:

| Antes | Comando | Depois | `id` |
|---|---|---|---|
| `5♥ 6♥ 7♥` | aumentar com `4♥` | `4♥ 5♥ 6♥ 7♥` | **muda** — a primeira carta é outra |
| `5♥ 6♥ 7♥` | aumentar com `8♥` | `5♥ 6♥ 7♥ 8♥` | não muda |

Um identificador que muda quando o objeto cresce pela esquerda e não muda quando cresce pela
direita não é identidade: é resumo do conteúdo. E o `Jogo` é **entidade** no
[domain.md](../domain.md) §3 — a única da lista, junto com `Carta`, cujo `id` alguém de fora
usa para apontar.

| # | Alternativa | A favor | Contra |
|---|---|---|---|
| **A** | O `id` nasce em `baixar` e é **preservado** por `aumentar` | Identidade estável; o comando aponta para algo que continua existindo com aquele nome | `criarJogo` deixa de ser a única a atribuir `id` |
| **B** | O `id` segue o conteúdo | Nada muda | O jogo alvo do comando **some** quando o comando é aplicado. Duas jogadas no mesmo turno (R3.3) passam a falar de "jogos" diferentes que são o mesmo jogo, e a chave de renderização troca junto |
| **C** | Contador em `Partida`, distribuído no `baixar` | Identidade sem depender de carta | Estado novo na raiz do agregado, e o `id` deixa de ser reproduzível a partir do conteúdo nos testes |

- `[D]` **S63** — **Alternativa A.** O `id` é atribuído uma vez, no momento
  em que o jogo é baixado, e `aumentar` o **preserva**. Continua derivado da primeira posição
  daquele instante — o que muda é que ele para de ser recalculado.

> A B é a que passa despercebida, porque tudo continua funcionando: os testes de engine
> comparam conteúdo, e a tela remonta a lista inteira a cada jogada. O sintoma só aparece na
> segunda jogada do mesmo turno, que é exatamente o que a R3.3 autoriza e nenhuma fatia até
> aqui exercitou.
>
> Vale registrar o que isto não é: não é um ADR. A regra de dependência, as camadas e a porta
> única de `Jogo` continuam de pé. É a correção de uma escolha de implementação que nunca
> chegou a ser decidida — e o lugar de decidi-la é a fatia que a torna visível.

### 2.2 Aumentar não pode reimplementar os sete invariantes

`criarJogo` é a **única porta** de `Jogo` (S40, S52), e um `Jogo` inválido não é
representável. Aumentar produz um `Jogo`. Ou passa pela mesma porta, ou existe uma segunda
porta com sete invariantes copiados.

- `[D]` **S64** — `aumentarJogo(jogo, novasPosicoes)` vive em `jogo.ts` e é
  implementada **sobre `criarJogo`**, com o conjunto inteiro:

```ts
export function aumentarJogo(jogo: Jogo, novas: readonly Posicao[]): ResultadoDeJogo
// ≡ criarJogo(jogo.dono, [...jogo.posicoes, ...novas]), com o id da S63 restaurado
```

O jogo inteiro é **revalidado**, não só o pedaço novo. Sete consequências caem de graça, e
nenhuma delas precisa de código nesta fatia:

| Invariante | O que passa a proteger no `aumentar` | Regra |
|---|---|---|
| **I1** | Não passar de 14 posições | R6.3, R5.3 |
| **I2** | A carta acrescentada é do naipe do jogo | R5.1 |
| **I3** | Não deixar buraco entre o jogo e a carta nova | R5.1 |
| **I4** | Não acrescentar um segundo curinga a um jogo que já tem um | R5.4 |
| **I5** | Não acrescentar carta de valor já ocupado — inclusive o **representado** pelo curinga (S55) | R5.6 |
| **I6** | Não passar do Ás alto | R5.3 |
| **I7** | Só o `2` entra como curinga | R1.3 |

> Este é o retorno do investimento da S52. Se `criarJogo` ainda inferisse as casas a partir das
> cartas, revalidar o conjunto inteiro seria impossível — as posições existentes já carregam
> escolhas do jogador (qual carta é curinga, qual ponta o Ás ocupa) que uma nova inferência
> poderia desfazer em silêncio. Como ela **confere em vez de inferir**, revalidar é seguro.
>
> A I5 é a mais interessante da tabela, e §3.4 volta a ela: é ela que separa a H6 da H9.

---

## 3. Comportamento

### 3.1 A forma do comando

- `[D]` **S65** — O comando aponta o jogo pelo `id` e reusa `CartaBaixada`:

```ts
{ tipo: 'aumentar'; jogo: string; cartas: readonly CartaBaixada[] }
```

A S51 vale sem alteração: carta sem `representa` é natural, com `representa` é curinga fazendo
papel daquele valor. As cartas vêm **sempre da mão** — nunca da mesa, nunca do lixo.

> O `jogo` é o campo que a H6 acrescenta e que nenhum comando anterior tinha: é a primeira vez
> que um comando aponta para algo que já está na mesa. É por isso que a S63 vem antes desta.

### 3.2 A posse é estrutural (R6.2)

- `[D]` **S66** — `aplicar` procura o jogo alvo **somente entre os jogos de
  quem está jogando**. Um `id` de jogo do adversário não é recusado por uma checagem de posse:
  ele simplesmente **não é encontrado**, e cai na mesma recusa de `id` inexistente.

> É o mesmo formato da RF5.2 na visão: o dado que não chega não pode ser usado. Uma segunda
> checagem — "achei o jogo, agora confiro o dono" — é uma linha a mais que pode ser esquecida
> num refactor; uma busca na lista errada não tem como estar certa por acaso.

### 3.3 Nada a fazer pela R6.4, e é isso que precisa de prova

A R6.4 proíbe reorganizar cartas já baixadas. Não há código a escrever: o comando só acrescenta.

- `[D]` **S67** — A R6.4 é verificada por **critério positivo antes do
  negativo**: primeiro que as posições anteriores continuam todas lá, na mesma ordem relativa e
  com o mesmo papel; só então que nenhum comando de `movimentosValidos` cita carta que já esteja
  na mesa.

> "Nenhum comando move cartas entre jogos" é verdade num jogo vazio, num jogo sem `aumentar` e
> numa lista vazia de comandos. Já aconteceu duas vezes neste projeto — `CA-S1-1` e `CA-S27-1` —
> e o conserto é sempre o mesmo: uma afirmação positiva provando que **há o que negar**.
>
> A parte positiva não é decorativa. `criarJogo` **ordena** as posições (S43), e o jogo
> aumentado pela esquerda tem primeira posição nova. Provar que as antigas seguem lá, na mesma
> ordem entre si, é o que distingue "cresceu" de "foi remontado".

### 3.4 A fronteira com a H9, que a I5 já desenha

Um caso merece critério próprio porque parece jogada legal e não é — ainda:

> Jogo na mesa: `5♥ 6♥ [2♠→7♥]`. Mão: `7♥`.
> O jogador tenta acrescentar o `7♥`.

Pela R6.5 isso é **regularizar**, e nem assim seria legal: o curinga é `2♠`, de outro naipe, e
a canastra é permanentemente suja. Mas o caso vizinho — `[2♥→7♥]` com o `7♥` na mão — **será**
legal na H9, e hoje não é.

- `[D]` **S68** — Acrescentar a carta natural do valor que o curinga
  representa é **recusado** na H6, pela I5 (valor repetido), sem tratamento especial. O critério
  registra que a recusa é da fatia, não da regra, e cita a H9.

> Sem o critério, a H9 encontra um comportamento que parece decidido. É a mesma armadilha que a
> S61 desarmou nos `CA-R1.3-*`: um critério cumprido pelo motivo errado é pior que um critério
> ausente.

### 3.5 O curinga no aumentar

- `[D]` **S69** — Se o jogo já tem curinga, todas as posições novas são
  **naturais** — a I4 recusa o resto, e a enumeração nem oferece. Se não tem, vale um curinga,
  e a S56 é herdada sem alteração: **um comando por naipe de `2` disponível**, canônica de menor
  `id` dentro do naipe.

### 3.6 A guarda da S45 se estende

- `[D]` **S70** — O `aumentar` que esvaziaria a mão **não é oferecido**, pela
  mesma razão da S45: a R7.1 exige o descarte, e a batida é a H10. Sai junto com ela — o gatilho
  do [roadmap.md](../roadmap.md) §3 passa a citar as duas.

> Vale registrar a propriedade que isto preserva, porque a R3.3 é o que a coloca em dúvida: com
> a guarda por comando, **nenhuma sequência de jogadas oferecidas esvazia a mão**. Baixar,
> aumentar, aumentar de novo — cada uma deixa ao menos uma carta, então a última também deixa.
> A guarda não precisa olhar o histórico do turno.

---

## 4. A enumeração

### 4.1 A janela do jogo, e de onde ela vem

Um jogo ocupa um trecho contíguo `[inicio, fim]` das catorze casas (S41). Aumentar é **alargar
esse trecho** — e só isso, porque um jogo não tem buracos para tapar. Mas o `Jogo` guarda as
posições ordenadas, **não** as casas: `criarJogo` as calcula e as descarta.

| # | Alternativa | A favor | Contra |
|---|---|---|---|
| **A** | Derivar a janela das pontas, a cada consulta | Nenhum campo novo; coerente com a R8.5 — "função derivada, nunca campo armazenado" | Uma função a mais para testar |
| **B** | Armazenar `casaInicial` em `Jogo` | Consulta direta | Campo derivado armazenado, que é exatamente o que a R8.5 proíbe para categoria. Dois lugares para a mesma verdade |

- `[D]` **S71** — **Alternativa A.** `janelaDe(jogo)` deriva das pontas, com
  a regra do Ás explícita: **Ás na primeira posição está na casa 0; Ás na última, na casa 13.**

> A regra do Ás não é arbitrária, e é a única sutileza aqui. Como o jogo tem ao menos três
> posições e está ordenado, um Ás na frente não pode estar na casa 13 — não haveria casa acima
> dele para as outras duas. O simétrico vale para o Ás no fim. O jogo de 14 tem os dois, e é
> justamente o que não pode crescer.

### 4.2 Janelas que contêm a janela atual

- `[D]` **S72** — A enumeração percorre as janelas `[i', f']` que
  **contêm** `[inicio, fim]` e diferem dela, com `0 ≤ i' ≤ inicio` e `fim ≤ f' ≤ 13`. As casas
  novas são preenchidas pela mão, com no máximo uma vazia — e essa vazia só existe se o jogo
  ainda não tiver curinga (S69).

Isso torna **um comando só** o que estende as duas pontas ao mesmo tempo. É a mesma escolha da
S46: a janela dispensa tratar "estender à esquerda", "estender à direita" e "os dois" como casos
diferentes, porque na janela são o mesmo caso.

> A R3.3 tornaria aceitável oferecer só extensões de um lado — duas jogadas alcançariam o mesmo
> estado. Cai porque o jogador que selecionou `4♥` e `8♥` em volta de `5♥ 6♥ 7♥` fez **uma**
> jogada na cabeça dele, e a S48 casa botão com seleção exata: sem o comando de dois lados, a
> seleção não teria botão nenhum e a jogada pareceria ilegal.

### 4.3 Medir de novo, pela terceira vez

A T7 foi medida na H4 (99 `baixar`, 0,12 ms) e de novo na H5 (258 `baixar`, 0,31 ms), porque o
número da H4 não cobria o curinga.

**Nenhum dos dois cobre a H6**, e por um motivo novo: até aqui a enumeração dependia só da mão.
Agora ela depende também do **estado da mesa** — um jogador com seis jogos baixados enumera seis
vezes mais janelas de aumento.

- `[D]` **S73** — A H6 mede outra vez, com a mesma mão de 22 cartas da
  `CA-S46-1` **e jogos na mesa**, mantendo o teto de 50 ms e o limiar de ~2000 comandos que
  reabriria a consulta `validar` da [screens.md](../screens.md) §3.1.

> Conta de guardanapo: cada jogo rende no máximo `inicio × (14 − fim)` janelas, o que para um
> jogo curto no meio da linha dá algumas dezenas, e cada janela rende até 5 comandos. Estimo
> **menos de 200 por jogo**, e a mão de 22 cartas raramente sustenta seis jogos. É estimativa
> `[P]`, e o critério existe porque estimativa não é medição.

---

## 5. Interface

A S48 casa botão com a seleção exata, e a S60 nomeia cada botão pelo que o distingue. `aumentar`
entra nesse mesmo mecanismo — as cartas vêm da mão, então a seleção funciona igual.

O que muda é que **duas jogadas diferentes podem ter o mesmo conjunto de cartas** por um motivo
novo. Com dois jogos de copas na mesa, `A♥ 2♥ 3♥` e `5♥ 6♥ 7♥`, o `4♥` na mão aumenta os dois:

- `[D]` **S74** — O rótulo nomeia o jogo alvo pelas **pontas**:
  *"Aumentar o jogo de A a 3 de copas"*. A tela lê as pontas de `visao.meusJogos` e monta o
  rótulo; ela continua sem saber o que é uma sequência (T6).

A alternativa era o jogador **clicar no jogo** para escolher o alvo, e ela cai por custo: seria
um segundo estado de seleção em `ui/`, com as combinações "carta selecionada sem jogo" e "jogo
selecionado sem carta" para tratar. O rótulo resolve com o mecanismo que já existe.

> **A S60 continua valendo por cima da S74, e é o que fecha um buraco que ela sozinha deixa.**
> Com o jogo `5♥ 6♥ 7♥` e um `2♠` na mão, dois comandos têm o **mesmo** conjunto de cartas e o
> **mesmo** jogo alvo: `[2♠→4]` estende à esquerda e `[2♠→8]` à direita. As pontas não os
> distinguem — o papel do curinga distingue. O rótulo do `aumentar` é portanto composto: pontas
> do jogo pela S74, mais o papel do curinga pela S60, exatamente como o `baixar` já faz.

Uma consequência de implementação, e ela é da S74: até aqui a chave de renderização de cada
botão era o próprio rótulo, e isso bastava porque o `baixar` não tinha alvo. Com dois jogos de
copas **de mesmas pontas** na mesa — possível com o baralho duplo —, dois rótulos coincidem.
A chave passa a incluir o `id` do jogo alvo, que é justamente a identidade que a S63 criou.

> A H5 deixou a lição de que a metade observável é a que escapa: o teste ficou verde duas vezes
> enquanto a tela mostrava a coisa errada. Aqui o risco tem nome — o jogo aumentado precisa
> **aparecer maior** na seção "Meus jogos", e a `CA-S74-2` é onde isso fica preso.

**A visão não muda.** `VisaoDoJogador` já carrega `meusJogos` desde a H1, e é dela que a
enumeração tira as janelas. A M11 previu a projeção certa antes de existir quem a usasse.

---

## 6. Critérios de aceite

Nenhum critério anterior trata de R6.2, R6.3, R6.4 ou R3.3 — o `acceptance-tests.md` só tem os
`CA-R6.5-*`, que são da H9. Todos os desta fatia são novos.

### 6.1 Domínio e comandos

| # | Dado | Então |
|---|---|---|
| **CA-R6.2-1** | jogo próprio `5♥ 6♥ 7♥` e `8♥` na mão | sucesso; o jogo passa a ter **4 posições** e a mão perde o `8♥` |
| **CA-R6.2-2** | `aumentar` apontando um jogo **do adversário** | `aplicar` devolve **recusa**, e o jogo do adversário não muda |
| **CA-R6.2-3** | mesa com um jogo meu e um do adversário, ambos aumentáveis pela minha mão | há `aumentar` para o meu (positivo) e **nenhum** para o dele |
| **CA-R6.3-1** | jogo de **7 posições** e a carta seguinte na mão | sucesso — sete cartas não fecham o jogo |
| **CA-R6.3-2** | jogo de **14 posições** (`A…K-A`) | nenhum `aumentar` é oferecido, e `aplicar` recusa por **I1** |
| **CA-R6.3-3** | jogo `10♥ J♥ Q♥ K♥ A♥` e `2♥` na mão | **recusa** — I6, não se passa do Ás alto |
| **CA-R6.4-1** | jogo `5♥ 6♥ 7♥` aumentado com `4♥` **pela esquerda** | as três posições anteriores continuam lá, na **mesma ordem relativa** e com o mesmo papel |
| **CA-R6.4-2** | qualquer estado com jogos na mesa | depois da `CA-R6.4-1`, **nenhum** comando de `movimentosValidos` cita carta que já esteja na mesa |
| **CA-R3.3-1** | dois `aumentar` seguidos no mesmo turno | os dois são aceitos; a fase segue `Acao` e a vez **não passa** |
| **CA-S63-1** | jogo aumentado **pela esquerda** | o `id` do jogo é **o mesmo** de antes |
| **CA-S64-1** | jogo `5♥ 6♥ 7♥` e `9♥` na mão | **recusa** — I3, a casa do `8` ficaria vazia |
| **CA-S68-1** | jogo `5♥ 6♥ [2♠→7♥]` e `7♥` na mão | **recusa** por I5 — repor a carta do curinga é R6.5, e chega na **H9** |
| **CA-S69-1** | jogo que **já tem** curinga e mão com um `2` | nenhum `aumentar` oferecido usa o `2` como curinga |
| **CA-S69-2** | jogo `5♥ 6♥ 7♥` sem curinga, mão com `2♠` e `2♦` | para **cada** valor representado, há **dois** comandos que estendem com curinga — um por naipe (S56) |
| **CA-S70-1** | mão em que o `aumentar` usaria **todas** as cartas | o comando **não** aparece em `movimentosValidos` |
| **CA-M9-9** | após `aumentar` | a conservação das 104 se mantém, sem `id` repetido |

### 6.2 Enumeração

| # | Dado | Então |
|---|---|---|
| **CA-S71-1** | jogo `Q♥ K♥ A♥` | a janela termina na casa **13**, e nenhum `aumentar` é oferecido à direita |
| **CA-S71-2** | jogo `A♥ 2♥ 3♥` | a janela começa na casa **0**, e nenhum `aumentar` é oferecido à esquerda |
| **CA-S72-1** | jogo `5♥ 6♥ 7♥`, mão com `4♥` e `8♥` | existe **um** comando com as duas cartas, além dos dois de uma carta só |
| **CA-S73-1** | a mão de 22 cartas da `CA-S46-1` **com jogos na mesa** | `movimentosValidos` responde em **menos de 50 ms**, e o número é registrado e comparado com os 258 da H5 |

### 6.3 Interface, nível 4

| # | Dado | Então |
|---|---|---|
| **CA-S74-1** | dois jogos de copas na mesa e o `4♥` selecionado | aparecem **dois** botões de aumentar, e os rótulos **diferem** pelas pontas do jogo |
| **CA-S74-2** | o botão de aumentar é clicado | a seção "Meus jogos" passa a mostrar o jogo **com a carta nova**, e a mão a perde |

---

## 7. Decisões

Treze, confirmadas em bloco em 2026-08-02.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **S62** | Escopo | A R6.3 é verificada por **tamanho**; "canastra" não existe no código até a H8 |
| **S63** | Domínio | O `id` do `Jogo` é **identidade estável** — nasce no `baixar`, preservado pelo `aumentar` |
| **S64** | Domínio | `aumentarJogo` é implementada **sobre `criarJogo`**, revalidando o jogo inteiro |
| **S65** | API | `{ tipo: 'aumentar'; jogo: string; cartas: CartaBaixada[] }` |
| **S66** | API | A posse (R6.2) é **busca na lista certa**, não checagem de dono |
| **S67** | Teste | R6.4 provada com critério **positivo antes do negativo** |
| **S68** | Escopo | Repor a carta do curinga é **recusado** na H6 pela I5, e o critério cita a H9 |
| **S69** | Enumeração | Jogo com curinga só recebe naturais; sem curinga, herda a S56 |
| **S70** | Escopo | A guarda da S45 vale para `aumentar`, e sai junto com ela na H10 |
| **S71** | Domínio | `janelaDe(jogo)` é **derivada**, com o Ás na casa 0 à frente e 13 atrás |
| **S72** | Enumeração | Janelas que **contêm** a atual — as duas pontas num comando só |
| **S73** | Desempenho | Medir a terceira vez, agora **com jogos na mesa** |
| **S74** | Interface | Rótulo nomeia o jogo alvo pelas **pontas**; sem seleção de jogo por clique |

### As duas que eu havia sinalizado, e o que a confirmação diz

**Calibragem: 13 de 13 aceitas.** A série global vai a **74 decisões com 5 quedas**, todas
ainda no `rules.md`. As duas de domínio que eu havia marcado como as de maior risco passaram
intactas:

- **S62** — a R6.3 não acrescenta limite nenhum à R5.3. **Confirmada**: "canastra" não precisa
  existir no código até a H8, e um critério que prove o crescimento de 7 para 8 fecha a regra.
- **S72** — estender as duas pontas num comando só. **Confirmada**, e com ela a S48 continua
  casando botão com seleção exata sem caso especial.

A **S63** é a mais consequente do lote e a que volta primeiro: ela decide que jogo na mesa tem
**identidade**, e a H9 depende disso — regularizar o curinga muda o conteúdo do jogo sem que
ele deixe de ser o mesmo jogo. Foi a primeira vez neste projeto que uma escolha registrada
apenas em comentário de implementação precisou virar decisão de spec, e o gatilho foi a fatia
que a tornou visível, não uma revisão.

> **Nota de processo.** As contagens desta spec — 22 critérios novos, 13 decisões — saíram de
> script, não de leitura. É a correção que a spec 0005 pediu para esta, depois de dois erros
> de contagem à mão em documentos anteriores.
