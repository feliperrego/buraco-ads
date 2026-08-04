# Spec 0014 — H14: o monte esgotado

> Status: **confirmada** — 8 decisões, nenhuma pendência
> História: `H14` — *"O monte acaba, um morto vira o novo monte e a partida continua"*
> Fecha: R4.6, R4.7, R4.8, R10.1.1, R11.5.1, R11.5.2
> Deriva de: [rules.md](../rules.md) · [domain.md](../domain.md) · [user-stories.md](../user-stories.md)

---

## 1. Esta história não é caso de borda, e o número diz por quê

O [user-stories.md](../user-stories.md) descreve a H14 assim:

> *"H14 é puro caso de borda e vale um marco próprio junto de H13 porque é a história com mais
> chance de **nunca acontecer** numa partida real de teste."*

Medido em 200 rodadas simuladas entre IAs aleatórias:

| | |
|---|---|
| rodadas em que o monte **esgota** | **200 de 200** |
| das quais com morto por converter no instante do esgotamento (R4.6) | **200** |
| rodadas que terminam em batida **antes** de o monte esgotar | 0 — as 17 batidas acontecem **depois** |

A afirmação de julho está errada, e por uma margem larga: **o monte esgota em toda rodada**, e a
conversão da R4.6 é a regra mais frequente do jogo, não a mais rara. A H14 não é acabamento — é
o que faz uma rodada terminar.

> A leitura de julho não foi descuidada, foi feita sem o jogo existir. É o mesmo tipo de correção
> da S70 e da S45: uma afirmação sobre o comportamento do sistema feita antes de haver sistema
> para medir. A diferença é que desta vez ela não virou código — só atrasou uma fatia.

O `user-stories.md` precisa dessa correção junto com a fatia.

---

## 2. Escopo

### Entra

- **R4.6, R4.7** — o morto não reclamado vira o novo monte
- **R4.8** — o monte esgota sem morto, e a rodada termina **sem batida**
- **R10.1.1** — a exigência do morto cai para quem não teve chance de pegar nenhum
- **R11.5.1, R11.5.2** — a penalidade de −100 passa a distinguir os dois casos
- O que a interface diz quando a rodada acaba **sem ninguém bater**

### Não entra

- Nada é adiado desta vez. A H14 fecha as duas pendências que a **S110** (H11) e a **S119**
  (H12) deixaram marcadas para ela, e com isso o `rules.md` fica **inteiramente implementado**.

- `[D]` **S136** — A H14 fecha a R4.6–R4.8 **e** as duas exceções que dependiam delas. Ao fim
  desta fatia não resta regra do documento normativo sem código.

---

## 3. O campo que falta, e por que ele não reabre o gatilho do `eventos[]`

A **R10.1.1** e a **R11.5.1** precisam saber **por que** não há morto:

| Motivo | R10.1.1 | R11.5.1 |
|---|---|---|
| o adversário pegou os dois (R9.3) | exigência **continua** valendo | penalidade **se aplica** |
| um morto virou monte (R4.6) | exigência **cai** | penalidade **não** se aplica |

Isso parece exatamente o que a **S120** disse que reabriria o gatilho do `eventos[]`: *"um item
de pontuação que dependesse de **como** o jogo chegou ali"*. E não é — a diferença é fina e vale
dizer em voz alta.

O que essas regras pedem não é o **histórico**, é um **estado** que hoje não existe. Um morto tem
três destinos possíveis, e o tipo só representa dois:

| Destino do morto | Hoje | Deveria ser |
|---|---|---|
| intacto | `reclamadoPor: null` | ✅ |
| pego por um jogador | `reclamadoPor: 0 \| 1` | ✅ |
| **convertido em monte** | *não representável* | ❌ |

- `[D]` **S137** — `Morto.reclamadoPor` vira **`Morto.destino: JogadorId | 'Monte' | null`**. Um
  campo, três valores, e as duas exceções passam a ser **derivação do estado**, não leitura de
  histórico. O gatilho do `eventos[]` **continua fechado**.

O nome muda junto porque `reclamadoPor: 'Monte'` seria uma mentira — o monte não reclama nada. É
a mesma razão da **S112**, que renomeou `FaseDoTurno` ao lhe acrescentar um valor que não era
fase de turno.

> Vale guardar a distinção, porque ela vai voltar: **"derive, não guarde" nunca foi sobre não ter
> campos.** É sobre não ter dois campos dizendo a mesma coisa. Um destino que o tipo não sabe
> exprimir não é história — é buraco no modelo.

---

## 4. Onde a conversão acontece — e o aviso que a H11 deixou

A H11 escreveu, ao pôr a batida junto do morto no fim de `aplicar`:

> *"As três coisas que moram lá respondem à **mesma pergunta** ("a mão zerou?"), e a resposta é
> sequencial. **Se a próxima fatia quiser pendurar ali algo que responda a outra pergunta, é
> sinal de que o lugar acabou.**"*

É esta fatia. A conversão responde a **"o monte esgotou?"** — pergunta diferente, gatilho
diferente, momento diferente. Pendurá-la no mesmo `comFimDeMao` seria ignorar um aviso que nós
mesmos escrevemos.

- `[D]` **S139** — O fim de `aplicar` deixa de ser uma função e vira uma **sequência nomeada de
  efeitos automáticos**, cada um com sua pergunta e sua guarda:

```
aplicar = executar  →  comFimDeMao   ("a mão zerou?")   R9.2, R10.1
                    →  comFimDeMonte ("o monte esgotou?") R4.6, R4.8
```

A ordem importa e não é arbitrária: quem zera a mão pega o morto **antes** de o monte poder
convertê-lo. Um morto entregue a um jogador não está mais disponível para virar monte, e a R9.2
não tem ressalva — o mesmo argumento da S111.

E o momento: a conversão é conferida quando o monte está vazio, **depois** do comando. O jogador
que comprou a última carta termina o turno dele normalmente; o monte novo espera a compra
seguinte. É o que o `domain.md` §1.3 desenha ao pôr a saída da R4.8 partindo de `Compra`.

---

## 5. A R4.8 tem duas leituras, e uma delas não termina

> **R4.8** — *"Se o monte se esgotar e **não houver morto disponível**, a rodada termina
> imediatamente, sem batida."*

A regra não fala do lixo, e é aí que ela se abre:

| | Quando a rodada acaba | Consequência |
|---|---|---|
| **A — literal** | monte vazio e sem morto, **mesmo com lixo cheio** | a rodada sempre termina |
| **B — "nada para comprar"** | monte vazio, sem morto **e** lixo vazio | a rodada **não** termina |

A **B** parece mais generosa e é a que quebra o jogo. Com o monte vazio e o lixo com uma carta, a
R4.1 ainda oferece `pegarLixo`: o jogador leva o lixo inteiro, joga, descarta uma — e o próximo
faz o mesmo, para sempre. Não é hipótese: é exatamente o estado em que **184 de 200 partidas**
simuladas estão presas hoje, e a razão de nenhuma delas alcançar os 3000.

- `[D]` **S138** — Leitura **A**. Quando o monte esgota e não há morto para converter, a rodada
  encerra, independentemente do que houver no lixo.

> **Esta é a proposta de domínio desta spec, e é onde a calibragem diz que eu erro.** O argumento
> acima é sobre terminação, não sobre Buraco: se na sua mesa a rodada continua enquanto houver
> lixo para comprar, a **A** está errada — e aí a regra que falta não é a R4.8, é uma que faça o
> lixo acabar.

---

## 6. A condição da R10.1 está escrita em dois lugares

Hoje "pode bater" existe duas vezes, sobre dados diferentes:

| Onde | Sobre | Expressão |
|---|---|---|
| `aplicar.ts` | `Partida` | `mortos.some(destino === quem) && jogos.some(contaComoLimpa)` |
| `movimentos-validos.ts` | `VisaoDoJogador` | `meusMortos > 0 && (…contaComoLimpa…)` |

Elas concordam por acaso de escrita, não por construção. A R10.1.1 acrescenta uma ressalva à
**primeira metade** — *"ou algum morto virou monte"* — e acrescentá-la a só uma das duas produz
o pior tipo de defeito: `movimentosValidos` recusaria a jogada que `aplicar` aceitaria, e o
jogador simplesmente nunca veria a batida que a regra lhe dá.

É a **duplicação de intenção** que a H9 mediu como decisão sem rede, e desta vez ela está
espalhada por dois módulos.

- `[D]` **S140** — A condição da R10.1 passa a ter **um lugar só**, em `dominio/`, recebendo os
  três dados que ela precisa — quantos mortos são meus, se algum virou monte, e os meus jogos. Os
  dois chamadores passam a chamá-la, e a `VisaoDoJogador` ganha **`algumMortoVirouMonte:
  boolean`** para conseguir.

E a apuração faz a mesma pergunta pelo outro lado:

- `[D]` **S141** — A **R11.5.1** é a mesma derivação na `Pontuacao`: a penalidade de −100 só se
  aplica a quem terminou sem morto **e** sem conversão. A R11.5.2 continua sendo o caso normal, e
  a `CA-R11.5.2-1` que a H12 já cobre não muda.

> Uma ambiguidade que vale confirmar: com **um** morto pego pelo adversário e **outro** convertido,
> o jogador sem morto ficou sem por qual dos dois motivos? A leitura da S141 é a generosa —
> houve conversão, então não há penalidade. A alternativa exigiria saber a ordem dos eventos, e
> aí sim o gatilho do `eventos[]` reabriria.

---

## 7. Um defeito que esta spec encontrou antes de começar

A **S117** decidiu, na H11, o texto do painel de fase:

```ts
case 'RodadaEncerrada':
  return visao.mao.length === 0
    ? 'Você bateu — rodada encerrada'
    : 'O adversário bateu — rodada encerrada'
```

A leitura estava completa enquanto **toda** rodada encerrada era uma batida. A R4.8 acrescenta a
segunda saída, e nela **ninguém tem a mão vazia** — então a tela dirá *"O adversário bateu"* numa
rodada em que ninguém bateu.

Não é hipótese: é o que acontece na primeira rodada que a H14 fizer terminar por esgotamento.

- `[D]` **S142** — O painel ganha o terceiro caso: **"Rodada encerrada — o monte acabou"**. A
  leitura da mão vazia continua distinguindo os dois batedores, e passa a ser consultada só
  **depois** de haver batida.

> É o mesmo formato do achado da H8 e da H10: **quem acha é a spec que relê o requisito inteiro,
> não só a parte nova dele.** A `CA-S117-1` e a `CA-S117-2` continuariam verdes com a tela
> mentindo, porque nenhuma delas monta uma rodada sem batedor.

E o painel dos mortos tem o mesmo problema, mais brando:

- `[D]` **S143** — O painel de mortos distingue **convertido** de **pego**. Hoje ele conta só os
  não reclamados, e *"nenhum morto por pegar"* cobre dois estados muito diferentes para quem está
  decidindo se dá para bater — com conversão, a R10.1.1 dispensa a exigência; sem ela, não.

---

## 8. Critérios de aceite

Cinco vêm do [acceptance-tests.md](../acceptance-tests.md) §4.6 e são citados, não redefinidos:
**`CA-R4.6-1`**, **`CA-R4.8-1`**, **`CA-R10.1.1-1`**, **`CA-R10.1.2-1`** e **`CA-R11.5.1-1`**. Os
dois últimos já existem nos testes desde a H11 e a H12; os três primeiros são justamente os que
esperavam esta fatia.

### 8.1 A conversão

| # | Dado | Então |
|---|---|---|
| **CA-R4.7-1** | monte esgotado com os **dois** mortos intactos | o **primeiro** vira monte, o segundo continua intacto, e a rodada segue em `Compra` |
| **CA-S137-1** | morto convertido | `destino` é `'Monte'`, e ele **não** conta como reclamado por jogador nenhum |
| **CA-S139-1** | jogada que zera a mão **e** esgota o monte | o jogador pega o morto (R9.2) e o outro é que vira monte — a ordem não é livre |
| **CA-S139-2** | jogador que compra a última carta do monte | ele **termina o turno**; a conversão não interrompe a jogada dele |
| **CA-M9-15** | após a conversão | a conservação das 104 se mantém, sem `id` repetido |

### 8.2 O fim sem batida

| # | Dado | Então |
|---|---|---|
| **CA-S138-1** | monte vazio, nenhum morto e **lixo com cartas** | a rodada **encerra** — a leitura literal da R4.8 |
| **CA-S138-2** | monte vazio, nenhum morto | ninguém tem a mão vazia, e o `+100` da R11.4 **não** é dado a ninguém |
| **CA-S138-3** | a mesma rodada encerrada | o placar é somado normalmente (R4.8 remete à R11) |

### 8.3 As duas exceções

| # | Dado | Então |
|---|---|---|
| **CA-S140-1** | morto convertido; jogador sem morto, com canastra limpa | **pode bater** — e `movimentosValidos` oferece a jogada que zera a mão |
| **CA-S140-2** | adversário pegou os dois; jogador sem morto, com canastra limpa | **não** pode bater, e a jogada não é oferecida — a R10.1.2 sobrevive à mudança |
| **CA-S140-3** | qualquer estado | a condição da R10.1 dá a mesma resposta em `aplicar` e em `movimentosValidos` |
| **CA-S141-1** | jogador sem morto, com conversão na rodada | **sem** penalidade de −100 |

### 8.4 Interface, nível 4

| # | Dado | Então |
|---|---|---|
| **CA-S142-1** | rodada encerrada **sem** batedor | o painel diz que **o monte acabou**, e **não** que alguém bateu |
| **CA-S142-2** | rodada encerrada com batedor | o painel continua dizendo quem bateu — a âncora que a S117 já tinha |
| **CA-S143-1** | um morto convertido e nenhum por pegar | o painel diz que um **virou monte**, e não só "nenhum morto por pegar" |

---

## 9. Decisões

Oito, confirmadas em bloco em 2026-08-04.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **S136** | Escopo | A H14 fecha a R4.6–R4.8 **e** as duas exceções adiadas; nada fica para depois |
| **S137** | Domínio | `reclamadoPor` vira **`destino: JogadorId \| 'Monte' \| null`** — três destinos, um campo |
| **S138** | **Domínio do jogo** | A R4.8 é **literal**: sem monte e sem morto a rodada acaba, mesmo com lixo |
| **S139** | Domínio | Os efeitos de `aplicar` viram **sequência nomeada**; a conversão é a segunda pergunta |
| **S140** | Domínio | A condição da R10.1 passa a ter **um lugar só**; a visão ganha `algumMortoVirouMonte` |
| **S141** | Domínio | A R11.5.1 é a mesma derivação na apuração |
| **S142** | Interface | O painel de fase ganha o caso **"o monte acabou"** — hoje ele mentiria |
| **S143** | Interface | O painel de mortos distingue **convertido** de **pego** |

### Onde eu erraria, se errasse

**A S138 é a única proposta de domínio, e ela decide se o jogo termina.** O argumento que dei é
sobre terminação — a leitura B deixa 184 de 200 partidas rodando para sempre —, e argumento de
terminação não é argumento de regra. Se na sua mesa a rodada continua enquanto houver lixo, a S138
cai e o problema volta para o `rules.md`: faltaria uma regra dizendo o que esvazia o lixo.

Duas outras que valem um olhar:

- A **S136** afirma que ao fim desta fatia **não resta regra sem código**. É uma afirmação
  contável, e eu não a verifiquei por script — vou verificá-la antes de fechar a fatia, não agora.
- A **S142** conserta um defeito que ainda não aconteceu, porque a rodada sem batida não existe.
  Isso é bom sinal, mas vale notar o que ele custa: a `CA-S142-1` só é verde depois da S138, e as
  duas caem juntas se a leitura da R4.8 mudar.
