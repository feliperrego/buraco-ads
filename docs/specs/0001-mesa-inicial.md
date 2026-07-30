# Spec 0001 — Mesa inicial

> Status: **rascunho anotado** — 8 pendências na seção 7
> História: **H1** — "Inicio uma partida e vejo minhas 11 cartas, o monte, o lixo vazio e os dois mortos"
> Fecha: R1.1, R1.2, R2.1–R2.6, R3.1, RF1.1, RF1.2, RNF1.3, M9
> Última atualização: 2026-07-29

## Sobre o formato das specs

Esta é a primeira e serve de modelo. Uma spec de fatia tem sete seções:

1. **Escopo** — o que entra e, principalmente, o que **não** entra
2. **API introduzida** — o que passa a existir na superfície pública
3. **Comportamento** — o detalhe exato, incluindo o que os documentos anteriores deixaram em aberto
4. **Fronteiras** — o que esta fatia decide sobre quem fala com quem
5. **Interface** — o que aparece na tela
6. **Critérios de aceite** — Dado/Quando/Então, cada um com identificador
7. **Pendências** — decisões desta fatia, para confirmação

A diferença em relação aos documentos de fundação: uma spec é **descartável**. Depois que a
história está pronta e testada, ela vira histórico. Os testes passam a ser a especificação viva.

Pendências desta spec: `S1`…`Sn`.

---

## 1. Escopo

### Entra

Iniciar uma partida do zero e **ver** o estado inicial na tela.

### Não entra

Explicitamente fora, mesmo parecendo natural:

| Fora | Vai para |
|---|---|
| Comprar do monte, descartar | H2 |
| Qualquer interação com a mesa | H2 |
| Turno da IA | H3 |
| Baixar, aumentar, pegar o lixo | H4–H7 |
| Pontuação, batida, morto | H10–H12 |
| Acabamento visual | H19 |

- `[P]` ⚠️ **S1** — A H1 tem **zero interatividade**. Nada na tela de partida responde a
  clique, toque ou teclado. A única ação do sistema é o botão "iniciar partida" na tela
  inicial.

> S1 parece pobre e é o ponto. A H1 existe para provar que engine → estado → interface
> funciona de ponta a ponta. Acrescentar "só o comprar" misturaria a prova de integração com a
> primeira regra de turno, e uma falha não diria qual das duas quebrou.

---

## 2. API introduzida

```
engine.iniciarPartida(semente: number): Partida
engine.visaoDe(partida: Partida, jogador: JogadorId): VisaoDoJogador
```

Só isso. `movimentosValidos` entra na H2, junto com o primeiro comando.

- `[P]` ⚠️ **S2** — `iniciarPartida` é a **única** forma de criar uma `Partida` fora de
  `engine/testing/`. Não há construtor público nem estado parcial.

---

## 3. Comportamento

### 3.1 O baralho (R1.1, R1.2)

104 cartas: 4 naipes × 13 valores × 2 cópias.

- `[P]` ⚠️ **S3** — O `id` da carta é legível e derivado do conteúdo:
  `COPAS-8-1`, `COPAS-8-2`, `ESPADAS-A-1`. Formato `{NAIPE}-{VALOR}-{COPIA}`.

> Um `id` legível torna cada teste que falha autoexplicativo e cada `Partida` serializada
> inspecionável a olho. O `id` continua sendo identidade (M1) — só não é opaco.

Ordem canônica **antes** de embaralhar: naipe na ordem `COPAS, OUROS, ESPADAS, PAUS`, valor na
ordem `A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K`, cópia `1` e depois `2`.

### 3.2 Embaralhamento (R2.1, RNF1.3)

- `[P]` ⚠️ **S4** — **Fisher-Yates descendente**, usando `mulberry32` semeado. Para
  `i` de `103` até `1`: `j = floor(aleatorio() * (i + 1))`, troca `carta[i]` com `carta[j]`.

> **S4 é uma decisão que congela.** A partir do primeiro teste que cita uma semente, trocar o
> gerador ou a direção do Fisher-Yates muda todas as distribuições e quebra a suíte inteira —
> sem que nenhuma regra tenha mudado.
>
> Por isso o algoritmo faz parte da especificação, e não do detalhe de implementação. O
> `mulberry32` foi escolhido por ser curto, sem dependência externa e de qualidade suficiente
> para um jogo de cartas. Se um dia trocarmos, é ADR, não refatoração.

### 3.3 Distribuição (R2.2–R2.5)

- `[P]` ⚠️ **S5** — Ordem exata, a partir do baralho embaralhado (índices de 0 a 103):

| Índices | Destino |
|---|---|
| 0–10 | mão do jogador humano |
| 11–21 | mão do adversário |
| 22–32 | morto A |
| 33–43 | morto B |
| 44–103 | monte, 60 cartas |
| — | lixo, vazio (R2.4) |

Confere com R2.5: `104 − 22 − 22 = 60`.

- `[P]` ⚠️ **S6** — `monte[0]` é o **topo**. Comprar remove de `monte[0]`.

> S5 e S6 existem porque determinismo não tolera ambiguidade. "Distribuir 11 cartas para cada"
> admite alternar entre jogadores, distribuir em blocos, ou de trás para frente — três
> distribuições diferentes para a mesma semente. Uma delas tem que estar escrita.

### 3.4 Quem começa (R2.6)

- `[P]` ⚠️ **S7** — Após a distribuição, **uma chamada adicional** ao gerador decide o
  jogador inicial: `floor(aleatorio() * 2)`.

> A H1 implementa apenas a **primeira metade** da R2.6 — o sorteio da rodada inicial. A
> alternância entre rodadas depende de haver mais de uma rodada, e fica na H13. Este era o
> motivo de a R2.6 aparecer só na H13: percebi ao escrever esta spec que a H1 não pode criar
> uma partida sem definir de quem é a vez. A citação foi acrescentada à H1.

### 3.5 Estado inicial completo

| Campo | Valor |
|---|---|
| `semente` | a recebida |
| `jogadores[].mao` | 11 cartas cada |
| `jogadores[].jogos` | vazio |
| `jogadores[].mortosPegos` | 0 |
| `monte` | 60 cartas |
| `lixo` | vazio |
| `mortos` | dois, 11 cartas cada, `reclamadoPor: null` |
| `jogadorDaVez` | conforme S7 |
| `fase` | `Compra` (R3.1) |
| `placar` | 0 e 0 |
| `numeroDaRodada` | 1 |

---

## 4. Fronteiras

### 4.1 De onde vem a semente

A A5 proíbe a engine de chamar `Math.random()`. Mas a semente tem que vir de algum lugar.

- `[P]` ⚠️ **S8** — A semente é gerada em **`estado/`**, com `Math.random()`, no momento em que
  o jogador inicia a partida. A engine apenas a recebe.

```
ui/          botão "iniciar partida"
  ↓
estado/      semente = Math.floor(Math.random() * 2**32)
  ↓
engine/      iniciarPartida(semente)
```

> Determinismo não significa ausência de aleatoriedade — significa que a engine **não é a
> fonte** dela. A impureza fica numa linha, numa camada externa, e a engine permanece uma
> função pura da semente.
>
> Consequência para a tarefa 0.4 do [roadmap.md](../roadmap.md): a regra de ESLint deve
> proibir `Math.random` e `Date.now` dentro de `engine/`, e isso entra na verificação da RD1.

### 4.2 A interface só recebe a visão

A tela renderiza `VisaoDoJogador` (M11), nunca `Partida`. Já na H1, onde não há IA a proteger —
para que o caminho certo seja o único que existe desde o começo.

---

## 5. Interface

Layout da Opção B ([screens.md](../screens.md) T2), sem estilo.

| Elemento | Estado na H1 |
|---|---|
| Minha mão | 11 cartas, de frente |
| Mão do adversário | 11 cartas viradas, com a contagem visível (RF3.2) |
| Monte | pilha virada, contagem `60` (RF3.3) |
| Lixo | painel vazio, indicando vazio (RF3.1) |
| Mortos | duas pilhas viradas, contagem `2` (RF3.4) |
| Jogos de ambos | duas áreas vazias (RF3.5) |
| Placar | `0 × 0` (RF4.1) |
| Vez e fase | indicado (RF2.2) |

Tela inicial: um botão, "iniciar partida" (RF1.1, RF1.2).

---

## 6. Critérios de aceite

| # | Dado | Então |
|---|---|---|
| **CA-R1.1-1** | uma partida iniciada | o total de cartas em jogo é **104** |
| **CA-R1.2-1** | o baralho de uma partida | cada par naipe+valor aparece **exatamente 2 vezes** |
| **CA-R1.2-2** | o baralho de uma partida | os 104 `id` são **distintos** |
| **CA-R2.1-1** | duas partidas com a **mesma** semente | as distribuições são **idênticas**, carta por carta |
| **CA-R2.2-1** | uma partida iniciada | cada jogador tem **11** cartas na mão |
| **CA-R2.3-1** | uma partida iniciada | há **dois** mortos de **11** cartas, ambos com `reclamadoPor: null` |
| **CA-R2.4-1** | uma partida iniciada | o lixo está **vazio** |
| **CA-R2.5-1** | uma partida iniciada | o monte tem **60** cartas |
| **CA-R2.6-1** | duas partidas com a mesma semente | o `jogadorDaVez` é o **mesmo** |
| **CA-R2.6-2** | um conjunto de sementes | os dois jogadores aparecem como iniciais em algum caso |
| **CA-R3.1-1** | uma partida iniciada | a fase é **`Compra`** |
| **CA-M9-1** | uma partida iniciada | mãos + jogos + monte + lixo + mortos = **104**, sem `id` repetido |
| **CA-RNF1.3-1** | duas partidas com a mesma semente | os estados são **profundamente iguais** |
| **CA-RNF1.3-2** | duas partidas com sementes diferentes | as distribuições **diferem** |

Critérios de interface, nível 4 ([testing-strategy.md](../testing-strategy.md)):

| # | Dado | Então |
|---|---|---|
| **CA-S1-1** | a tela de partida renderizada | **nenhum** elemento da mesa responde a clique |
| **CA-S1-2** | a tela de partida renderizada | a contagem do monte mostra `60` e o lixo indica vazio |
| **CA-S1-3** | a tela inicial | existe exatamente uma ação: iniciar partida |

> CA-R2.6-2 merece nota: ele não verifica *qual* jogador começa, e sim que **os dois são
> possíveis**. Uma implementação que sempre devolve o jogador 1 passaria por todos os outros
> critérios.

---

## 7. Pendências

| # | Assunto | Proposta |
|---|---|---|
| **S1** | Escopo | H1 com **zero interatividade** na mesa |
| **S2** | API | `iniciarPartida` é a única forma pública de criar `Partida` |
| **S3** | `id` | Legível: `{NAIPE}-{VALOR}-{COPIA}` |
| **S4** | Embaralhamento | **Fisher-Yates descendente com `mulberry32`** — decisão que congela |
| **S5** | Distribuição | Ordem exata por faixa de índices |
| **S6** | Monte | `monte[0]` é o topo |
| **S7** | Início | Uma chamada extra ao gerador decide quem começa |
| **S8** | Semente | Gerada em `estado/` com `Math.random()`; a engine só recebe |

### O que merece sua atenção

- **S4** é a mais consequente: a partir do primeiro teste semeado, trocar o gerador quebra a suíte inteira sem nenhuma regra ter mudado. Se você preferir outro gerador, é agora.
- **S5 e S6** parecem burocráticos e não são: sem eles, "distribuir 11 cartas" admite três resultados distintos para a mesma semente.
- **S1** define a H1 como propositalmente inútil enquanto jogo. É a prova de integração, não uma entrega de valor jogável.