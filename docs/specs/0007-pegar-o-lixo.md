# Spec 0007 — Pegar o lixo

> Status: **confirmado** — 10 decisões, nenhuma pendência
> História: **H7** — "Pego o lixo inteiro em vez de comprar do monte"
> Fecha: R4.1, R4.2, R4.4, R4.5, RF3.1
> Última atualização: 2026-08-02

Decisões a partir de **`S75`**, continuando a série global.

---

## 1. Escopo

### Entra

O comando `pegarLixo`: levar **todas** as cartas do lixo para a mão, como alternativa exclusiva
a comprar do monte (R4.1, R4.2). É o segundo dos seis comandos do [domain.md](../domain.md) §6,
e o último que falta na fase de **compra** — depois dele, a `Compra` está fechada.

Fecha também a **RF3.1**, que já estava cumprida. Vale explicar por quê, porque a diferença é
o risco central da fatia: o lixo é integralmente visível desde a H1, e a `CA-R4.3-2` prova isso.
O que a H7 acrescenta é torná-lo **acionável** — e a implementação óbvia disso é transformar o
painel num botão, que faria a lista sumir e quebraria uma regra já cumprida. §5 volta a isso.

### Não entra

| Fora | Vai para |
|---|---|
| Morto vira monte quando o monte esgota (R4.6, R4.7) | H14 |
| Rodada encerrada por monte esgotado sem morto (R4.8) | H14 |
| Categoria da canastra (R8) | H8 |
| Pegar morto e bater (R9, R10) | H10 |

- `[D]` **S75** — A R4.6–R4.8 continuam fora, e a H7 **estreita** o buraco que
  elas deixam em vez de abri-lo. Vale nomear o estado exato, porque ele é fácil de confundir
  com um defeito novo:

| Monte | Lixo | `movimentosValidos` na `Compra` | Desde |
|---|---|---|---|
| cheio | vazio | `[comprarDoMonte]` | H2 |
| cheio | cheio | `[comprarDoMonte, pegarLixo]` | **H7** |
| **vazio** | cheio | `[pegarLixo]` — a partida **continua** | **H7** |
| vazio | vazio | `[]` — a partida **trava**, sem mensagem | H2 |

> A última linha já existia: desde a H2, monte vazio devolve lista vazia e a mesa fica inerte
> sem explicar nada. A H7 não a cria — ela remove a penúltima, que hoje trava e passa a
> continuar. O que resta é exatamente a **R4.8**, e é da H14.
>
> Isso vira **gatilho novo** no [roadmap.md](../roadmap.md) §3: "partida travada com monte e
> lixo vazios", com prazo na H14. Um estado sem saída que ninguém anotou é indistinguível de
> um bug que ninguém achou.

---

## 2. O comando

### 2.1 A forma, e o que a ausência de campos decide

- `[D]` **S76** — O comando não tem carga:

```ts
{ tipo: 'pegarLixo' }
```

As duas regras que ele fecha são **ausências de campo**, e é assim que elas deixam de poder ser
esquecidas:

| Regra | O que um campo permitiria | Por que não existe |
|---|---|---|
| **R4.2** | `quantas: number` — levar parte do lixo | "Todas as cartas dele. Nunca uma parte." |
| **R4.4** | `justificando: string` — a carta do topo que será usada | É exigência do Buraco **Fechado**, e a nossa variante é a Aberta (ADR-0001) |

> A R4.4 é a única regra deste projeto que se define por **negação de outra variante**, e é por
> isso que ela precisa de critério próprio mesmo sem gerar uma linha de código. Quem chegar a
> este código vindo do Buraco Fechado vai procurar a condição, não achar, e concluir que ela
> foi esquecida. O critério é o que responde a essa pergunta antes de ela ser feita — mesma
> função da `CA-R3.4-1`, que prova a ausência de pontuação mínima na primeira descida.

### 2.2 A ordem em que o lixo entra na mão

`lixo[0]` é o topo (S24), e a mão é renderizada na ordem em que a engine a devolve. A S23 já
fixou que a engine **nunca reordena** a mão e que a carta comprada entra no fim. Pegar o lixo
acrescenta doze, trinta ou sessenta cartas de uma vez, e a ordem delas é observável.

| # | Alternativa | A favor | Contra |
|---|---|---|---|
| **A** | `[...mao, ...lixo]` — a pilha entra como está, topo primeiro | É a única em que a engine literalmente não toca na ordem. Prolonga a S23 sem exceção | A carta mais recente aparece antes das mais antigas |
| **B** | `[...mao, ...lixo.reverse()]` — ordem de descarte | Reproduz a ordem cronológica em que as cartas caíram | Inverte, e a S23 disse que a engine não reordena |
| **C** | `[...lixo, ...mao]` — as novas na frente | Destaca o que acabou de chegar | Move a mão inteira, e a posição das cartas antigas muda sem motivo |

- `[D]` **S77** — **Alternativa A.** A pilha entra no fim da mão, na ordem
  em que está no lixo.

> Não é decisão de regra: a M1 diz que as regras comparam só naipe e valor, e a S25 identifica
> carta por `id`, nunca por posição. É decisão de **observabilidade**, da mesma família da S5 —
> "distribuir 11 cartas para cada" admitia variantes, e cada variante dava outra mesa para a
> mesma semente. Aqui cada variante dá outra mão para o mesmo lixo, e o jogador vê.
>
> A H19 pode reordenar a mão na apresentação sem contradizer isto. A S23 deixou essa porta
> aberta de propósito, e é ela que torna a escolha aqui de baixo custo.

### 2.3 A exclusividade da R4.1 já está construída

A R4.1 diz que o jogador escolhe **uma** das duas opções, exclusivamente. Não há código a
escrever: as duas partem da fase `Compra` e as duas levam a `Acao`, e a `Acao` não tem aresta
de volta para nenhuma delas.

- `[D]` **S78** — A exclusividade da R4.1 é a **aresta ausente**, como a R3.2
  na H2, e é verificada pelo mesmo formato de par: primeiro que `pegarLixo` aparece na
  `Compra`, depois que ele **não** aparece na `Acao` nem depois de já ter comprado.

> Sem o par, uma enumeração que devolvesse sempre a lista inteira passaria no critério positivo
> e estaria errada. Foi exatamente esse o par que travou a interpretação na H2 — `CA-R4.1-2`,
> `CA-R3.2-1` e `CA-M10-1` —, e a H7 acrescenta o terceiro caso que aqueles três não cobrem:
> **comprar e então tentar pegar**, que é a exclusividade propriamente dita.

### 2.4 O lixo vazio

- `[D]` **S79** — A R4.5 é `visao.lixo.length > 0`, espelho exato do
  `visao.cartasNoMonte > 0` que a H2 escreveu. A ausência do comando **é** a regra, e não uma
  recusa com mensagem (RF2.1).

---

## 3. O que a H7 faz com a T7, e por que desta vez a resposta pode mudar

A T7 foi medida três vezes: **99** `baixar` na H4, **258** na H5, **85** `aumentar` na H6. As
três ficaram muito abaixo do limiar de ~2000 comandos que reabriria a consulta `validar` da
[screens.md](../screens.md) §3.1.

**Esta é a fatia em que aquele limiar pode ser alcançado**, e o motivo é que a mão deixa de ter
tamanho pequeno. Até aqui o máximo plausível era 22 cartas — onze da distribuição mais onze de
um morto (R9.1). Um lixo grande dá muito mais que onze.

### 3.1 O limite é das casas, não da mão

A conta que importa é estrutural, e vale escrevê-la antes de medir:

| Fonte | Teto | De onde vem |
|---|---|---|
| `descartar` | tamanho da mão | um por carta (R7.1) |
| `baixar` | **≈1250** | 78 janelas por naipe × 4 naipes = 312, e cada janela rende no máximo 4 comandos — um por naipe de `2`, quando sobra uma casa (S56) |
| `aumentar` | `inicio × (14 − fim)` por jogo, × 4 | S72, e o jogo cresce até fechar a linha |

**O teto do `baixar` não cresce com a mão.** Uma mão de 30 cartas de copas não gera mais
janelas que uma de 14: as casas são catorze, e uma janela cheia não admite curinga. É a mesma
propriedade que derrubou o `2^22` na H4, vista do outro lado — lá ela explicou por que a
enumeração era pequena, aqui ela explica por que **para de crescer**.

- `[D]` **S80** — A H7 mede pela quarta vez, com a **mão saturada**: a mão
  que ocupa todas as casas de todos os naipes que o baralho permite, obtida por um `pegarLixo`
  grande. O teto de 50 ms continua, e o limiar de ~2000 comandos também — mas desta vez a
  expectativa é chegar **perto**, e o critério registra o número contra os 280 da H5.

> A conta acima diz que não vamos passar de 2000. A invariante 4 do acordo diz que isso não
> basta: **verifique, não presuma.** E há um caminho pelo qual a conta erra — se a soma de
> `descartar` (uma mão grande), `baixar` (perto do teto) e `aumentar` (vários jogos na mesa)
> se acumular, o total cruza sem que nenhuma das três parcelas tenha estourado sozinha. As
> medições anteriores nunca tiveram as três altas ao mesmo tempo.

### 3.2 Uma frase errada na screens.md

A [screens.md](../screens.md) §3.1 diz:

> *"com 22 cartas na mão depois de pegar o lixo"*

O 22 está certo como mão máxima e **errado como consequência de pegar o lixo**: ele é onze da
distribuição mais onze de um morto (R9.1), e não tem relação com o lixo. Um lixo grande passa
disso com folga.

- `[D]` **S81** — A frase é corrigida na `screens.md`, com nota de que o
  número original vinha do morto e que o teto real é o do §3.1 acima. O documento de origem é
  corrigido, não só esta spec.

> É a mesma correção que a S61 fez no `acceptance-tests.md`: sem a nota no documento de origem,
> a próxima fatia reencontra um número que parece medido e não é. Aqui o risco é maior, porque
> o 22 aparece justamente no parágrafo que decide **se** a consulta `validar` é necessária.

---

## 4. A IA passa a pegar o lixo

A IA da H3 sorteia dentro de `movimentosValidos` (RF5.1), e a E7 fixou que ela não é descartada
na H15: vira a linha de base contra a qual a heurística é medida.

A partir da H7 ela pega o lixo em cerca de **metade** das vezes em que ele estiver disponível,
porque na `Compra` a lista terá dois comandos e a escolha é uniforme. A mão dela vai inchar, e
os turnos seguintes vão enumerar sobre uma mão grande.

- `[D]` **S82** — Isso **não** é tratado como defeito e **não** vira
  heurística aqui. É a linha de base da E7 se tornando mais interessante: uma IA que acumula
  lixo e não desce nada é exatamente o adversário fraco contra o qual a H15 precisa medir
  ganho. O que a H7 acrescenta é um critério de **custo**, não de qualidade: o turno da IA com
  a mão inchada continua dentro do teto.

> Vale antecipar o que isso faz com a `CA-S37-1`, o teste de ponta a ponta que já existe: ele
> avança dois temporizadores e espera a vez voltar. Com `pegarLixo` na lista, o caminho que a
> IA escolhe passa a depender do sorteio — e ele já é semeado (`Math.random` fixado em 3), então
> continua determinístico. Se aquele teste ficar instável na H7, a causa é esta, e o conserto é
> a semente, não o teste.

---

## 5. Interface

A S48 casa botão com **seleção de cartas da mão**, e `pegarLixo` não tem seleção: é comando
direto, como `comprarDoMonte`. A [screens.md](../screens.md) §4 já previu isso — *"toca monte
ou lixo (comando direto)"*.

- `[D]` **S83** — O painel do lixo ganha um botão quando `pegarLixo` está na
  lista, **ao lado da listagem, nunca no lugar dela**. As cartas continuam todas renderizadas,
  com ou sem botão (R4.3, RF3.1).

O risco tem nome, e é o oposto do que a H4 e a H5 encontraram. Lá faltava a metade observável;
aqui ela **já existe** e a fatia pode destruí-la:

| Implementação | O que acontece com a R4.3 |
|---|---|
| Botão ao lado da `<ol>` | Cumprida |
| A `<ol>` inteira vira um `<button>` | Cumprida, mas frágil — a R4.3 passa a depender de um estilo |
| O painel vira `Pegar o lixo — 12 cartas`, sem lista | **Violada.** É o painel do monte, e o monte é oculto (RF3.3) |

> A terceira linha é o erro provável, porque o painel do monte já está escrito assim e copiá-lo
> é o caminho de menor esforço. A `CA-S83-3` existe para pegar exatamente isso.

- `[D]` **S84** — O rótulo diz o tamanho: *"Pegar o lixo — 12 cartas"*. É a
  informação que decide a jogada, e ela já está na tela; repeti-la no botão é o que permite
  decidir sem contar.

---

## 6. Critérios de aceite

O [acceptance-tests.md](../acceptance-tests.md) define `CA-R4.6-1` e `CA-R4.8-1`, que são da
H14, e `CA-R4.3-1` e `CA-R4.3-2`, que já estão verdes desde a H2. Os desta fatia são novos.

### 6.1 O comando

| # | Dado | Então |
|---|---|---|
| **CA-R4.1-3** | fase `Compra` com lixo não vazio | `pegarLixo` está entre os movimentos válidos, e `comprarDoMonte` também |
| **CA-R4.1-4** | fase `Acao` | `pegarLixo` **não** está entre os movimentos válidos |
| **CA-R4.1-5** | depois de `comprarDoMonte`, no mesmo turno | `pegarLixo` **não** está, e `aplicar` o **recusa** — é a exclusividade da R4.1 |
| **CA-R4.2-1** | lixo com 5 cartas e mão com 11 | após `pegarLixo`, a mão tem **16** e o lixo fica **vazio** |
| **CA-R4.2-2** | qualquer estado com lixo não vazio | há **exatamente um** comando `pegarLixo` — não existe variante que leve parte |
| **CA-R4.4-1** | lixo cujo topo não completa nada na mão | `pegarLixo` continua oferecido — não há condição (Buraco **Aberto**) |
| **CA-R4.5-1** | lixo vazio | `pegarLixo` **não** é oferecido, e `comprarDoMonte` **é** |
| **CA-R3.1-3** | fase `Compra` | após `pegarLixo`, a fase é `Acao` e a vez **não** passa |
| **CA-R7.2-2** | uma carta que veio do lixo | pode ser descartada no mesmo turno |
| **CA-S77-1** | lixo `[K♠, 7♦, 3♣]` e mão de 11 | as três entram no **fim** da mão, nesta ordem, e as 11 anteriores não se movem |
| **CA-S75-1** | monte **vazio** e lixo com cartas | `pegarLixo` é a única jogada de compra, e a partida continua |
| **CA-M9-10** | após `pegarLixo` | a conservação das 104 se mantém, sem `id` repetido |

### 6.2 Custo

| # | Dado | Então |
|---|---|---|
| **CA-S80-1** | a mão **saturada** por um `pegarLixo` grande, com jogos na mesa | `movimentosValidos` responde em **menos de 50 ms** e devolve **menos de 2000** comandos; o número é registrado e comparado com os 280 da H5 |
| **CA-S82-1** | a IA com a mão inchada por um `pegarLixo` | `decidir` responde dentro do mesmo teto, e a escolha continua dentro de `movimentosValidos` |

### 6.3 Interface, nível 4

| # | Dado | Então |
|---|---|---|
| **CA-S83-1** | `pegarLixo` na lista de movimentos | o painel do lixo tem um botão que o envia |
| **CA-S83-2** | `pegarLixo` **fora** da lista | o painel do lixo **não** tem botão |
| **CA-S83-3** | o painel do lixo **com** o botão presente | as cartas continuam **todas** listadas por nome (R4.3) |
| **CA-S84-1** | o botão é clicado | o painel passa a indicar **vazio** e a mão mostra as cartas que vieram |

---

## 7. Decisões

Dez, confirmadas em bloco em 2026-08-02.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **S75** | Escopo | R4.6–R4.8 ficam na H14; a H7 **estreita** o travamento e o gatilho é registrado |
| **S76** | API | `{ tipo: 'pegarLixo' }` sem carga — R4.2 e R4.4 são **ausências de campo** |
| **S77** | Domínio | O lixo entra no **fim** da mão, na ordem em que está (topo primeiro) |
| **S78** | Teste | A exclusividade da R4.1 é **aresta ausente**, verificada por par positivo/negativo |
| **S79** | Enumeração | R4.5 é `lixo.length > 0`, espelho do `cartasNoMonte > 0` |
| **S80** | Desempenho | Medir a **quarta** vez, com a mão **saturada**; é a fatia em que o limiar pode ser alcançado |
| **S81** | Documento | Corrigir o "22 cartas depois de pegar o lixo" da `screens.md` §3.1 |
| **S82** | IA | A IA passar a pegar o lixo **não** é defeito; o critério novo é de **custo**, não de qualidade |
| **S83** | Interface | Botão **ao lado** da listagem, nunca no lugar dela |
| **S84** | Interface | O rótulo diz o tamanho: *"Pegar o lixo — 12 cartas"* |

### O ponto cego que eu sinalizei, e o que a confirmação decidiu

**Calibragem: 10 de 10 aceitas.** A série vai a **84 decisões com 5 quedas**, todas ainda no
`rules.md`, e são duas fatias seguidas sem queda — 13 de 13 na H6, 10 de 10 aqui.

O que eu havia levantado **não era uma proposta**, e é o registro mais importante desta seção:

- **A ausência no `rules.md`.** A R4.4 nega a condição ligada à **carta do topo**, e nada diz
  sobre as outras que algumas mesas usam — não pegar o lixo no primeiro turno, ou só pegar
  depois de ter jogo na mesa. A confirmação em bloco resolve isso pela negativa: **não existe
  nenhuma condição para pegar o lixo**, e é a R4.4 lida na sua extensão máxima. Se um dia
  aparecer uma, ela é regra nova no `rules.md`, e o gatilho é a `CA-R4.4-1` reprovando.
- **S77** — a ordem em que trinta cartas chegam na mão. **Confirmada** na Alternativa A.

Das de software, a **S80** é a única cujo resultado eu não podia prometer antes de rodar. O
número medido vai para o [roadmap.md](../roadmap.md) §3, junto com os das outras três medições,
e é lá que se lê se a conta estrutural do §3.1 se sustentou.
