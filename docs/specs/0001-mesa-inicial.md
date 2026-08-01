# Spec 0001 — Mesa inicial

> Status: **confirmado** — 16 decisões, nenhuma pendência
> História: **H1** — "Inicio uma partida e vejo minhas 11 cartas, o monte, o lixo vazio e os dois mortos"
> Fecha: R1.1, R1.2, R2.1–R2.6, R3.1, RF1.1, RF1.2, RNF1.3, M9
> Última atualização: 2026-07-31

## Sobre o formato das specs

Esta é a primeira e serve de modelo. Uma spec de fatia tem sete seções:

1. **Escopo** — o que entra e, principalmente, o que **não** entra
2. **API introduzida** — o que passa a existir na superfície pública
3. **Comportamento** — o detalhe exato, incluindo o que os documentos anteriores deixaram em aberto
4. **Fronteiras** — o que esta fatia decide sobre quem fala com quem
5. **Interface** — o que aparece na tela
6. **Critérios de aceite** — Dado/Quando/Então, cada um com identificador
7. **Decisões** — as escolhas desta fatia, com o histórico de confirmação

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

- `[D]` **S1** — A H1 tem **zero interatividade**. Nada na tela de partida responde a
  clique, toque ou teclado. A única ação do sistema é o botão "iniciar partida" na tela
  inicial.

> S1 parece pobre e é o ponto. A H1 existe para provar que engine → estado → interface
> funciona de ponta a ponta. Acrescentar "só o comprar" misturaria a prova de integração com a
> primeira regra de turno, e uma falha não diria qual das duas quebrou.

---

## 2. API introduzida

```ts
type JogadorId = 0 | 1

iniciarPartida(semente: number): Partida
visaoDe(partida: Partida, jogador: JogadorId): VisaoDoJogador
```

Só isso. `movimentosValidos` entra na H2, junto com o primeiro comando.

- `[D]` **S2** — `iniciarPartida` é a **única** forma de criar uma `Partida` fora de
  `engine/testing/`. Não há construtor público nem estado parcial.

- `[D]` **S11** — `JogadorId` é `0 | 1`, e o **humano é sempre `0`**. A S5 já dependia
  disso quando chamou os índices 0–10 de "mão do jogador humano"; agora está escrito em vez
  de subentendido.

### 2.1 A forma de `VisaoDoJogador`

- `[D]` **S16** — Os nomes de campo fazem parte desta spec, porque a seção 5 já
  descreve o que a tela mostra. Deixá-los para a implementação obrigaria a interface a
  descobri-los depois, e a M11 diz que esta projeção é exatamente o que ela renderiza.

```ts
type VisaoDoJogador = {
  eu: JogadorId
  mao: readonly Carta[]              // a própria mão, de frente
  lixo: readonly Carta[]             // integralmente público (R4.3, RF3.1)
  meusJogos: readonly Jogo[]
  jogosDoAdversario: readonly Jogo[]
  cartasNoMonte: number              // contagem, nunca o conteúdo (RF3.3)
  cartasNaMaoDoAdversario: number    // contagem (RF3.2)
  mortosRestantes: number            // não reclamados (RF3.4)
  placar: readonly [number, number]  // índice = JogadorId (RF4.1)
  jogadorDaVez: JogadorId
  fase: FaseDoTurno
  numeroDaRodada: number
}
```

A tabela do [domain.md](../domain.md) §7 é a autoridade sobre o que **não** pode estar aqui:
mão do adversário, conteúdo do monte e conteúdo dos mortos. Os três aparecem apenas como
contagem.

---

## 3. Comportamento

### 3.1 O baralho (R1.1, R1.2)

104 cartas: 4 naipes × 13 valores × 2 cópias.

- `[D]` **S3** — O `id` da carta é legível e derivado do conteúdo:
  `COPAS-8-1`, `COPAS-8-2`, `ESPADAS-A-1`. Formato `{NAIPE}-{VALOR}-{COPIA}`.

> Um `id` legível torna cada teste que falha autoexplicativo e cada `Partida` serializada
> inspecionável a olho. O `id` continua sendo identidade (M1) — só não é opaco.

Ordem canônica **antes** de embaralhar: naipe na ordem `COPAS, OUROS, ESPADAS, PAUS`, valor na
ordem `A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K`, cópia `1` e depois `2`.

### 3.2 Embaralhamento (R2.1, RNF1.3)

- `[D]` **S4** — **Fisher-Yates descendente**, usando `mulberry32` semeado. Para
  `i` de `103` até `1`: `j = floor(aleatorio() * (i + 1))`, troca `carta[i]` com `carta[j]`.

- `[D]` **S9** — O gerador é escrito **literalmente** aqui, e não referido pelo
  nome:

```ts
function mulberry32(semente: number): () => number {
  let a = semente >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
```

> **S4 é uma decisão que congela.** A partir do primeiro teste que cita uma semente, trocar o
> gerador ou a direção do Fisher-Yates muda todas as distribuições e quebra a suíte inteira —
> sem que nenhuma regra tenha mudado.
>
> Por isso o algoritmo faz parte da especificação, e não do detalhe de implementação. O
> `mulberry32` foi escolhido por ser curto, sem dependência externa e de qualidade suficiente
> para um jogo de cartas. Se um dia trocarmos, é ADR, não refatoração.
>
> A **S9 corrige uma contradição** do rascunho: ele afirmava congelar o algoritmo e informava
> apenas o nome dele. "mulberry32" não determina se a semente avança antes ou depois do uso,
> nem que as multiplicações são `Math.imul` de 32 bits. Um nome não congela nada.

### 3.3 Distribuição (R2.2–R2.5)

- `[D]` **S5** — Ordem exata, a partir do baralho embaralhado (índices de 0 a 103):

| Índices | Destino |
|---|---|
| 0–10 | mão do jogador humano |
| 11–21 | mão do adversário |
| 22–32 | morto A |
| 33–43 | morto B |
| 44–103 | monte, 60 cartas |
| — | lixo, vazio (R2.4) |

Confere com R2.5: `104 − 22 − 22 = 60`.

- `[D]` **S6** — `monte[0]` é o **topo**. Comprar remove de `monte[0]`.

> S5 e S6 existem porque determinismo não tolera ambiguidade. "Distribuir 11 cartas para cada"
> admite alternar entre jogadores, distribuir em blocos, ou de trás para frente — três
> distribuições diferentes para a mesma semente. Uma delas tem que estar escrita.

### 3.4 Quem começa (R2.6)

- `[D]` **S7** — Após a distribuição, **uma chamada adicional** ao gerador decide o
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

- `[D]` **S8** — A semente é gerada em **`estado/`**, com `Math.random()`, no momento em que
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

### 4.3 Onde a partida vive, entre duas rotas

Esta seção **não existia no rascunho**, e a razão é datada: ele foi escrito em 2026-07-29, antes
de a tarefa 0.7 criar as rotas. Com quatro rotas de pé, três perguntas ficaram em aberto.

- `[D]` **S15** — O `Provider` do `useReducer` (A6) fica **acima do roteador**, em
  `ui/Aplicacao.tsx`. Assim a partida sobrevive à navegação de `/` para `/partida`, que é a
  única transição da H1.

- `[D]` **S14** — `/partida` **sem partida em memória redireciona para `/`**.

> **Correção de 2026-08-01, ao implementar.** A S15 dizia que o `Provider` ficaria na rota
> raiz (`ui/App.tsx`) e a S14 dizia que o redirecionamento viria de um `beforeLoad`. As duas
> juntas não fecham: **`beforeLoad` roda fora do React** e não enxerga contexto de componente,
> então não teria como saber se há partida.
>
> Duas saídas eram possíveis — injetar o estado no contexto do roteador, ou redirecionar
> dentro do componente. Ficou a segunda, por ser mais simples e por evitar uma segunda corrida:
> o `dispatch` é assíncrono, então mesmo com o contexto do roteador o `beforeLoad` poderia ler
> um estado velho.
>
> A CA-S14-1 **não precisou mudar**, e é isso que valida a correção: ela mede *onde a navegação
> termina*, não por qual mecanismo. Um critério escrito sobre comportamento sobrevive à troca da
> implementação — se estivesse escrito sobre `beforeLoad`, teria virado retrabalho.

> A S14 responde a uma pergunta que só passou a existir depois do [ADR-0008](../decisions/0008-publicar-na-vercel-com-integracao-git.md).
> O *rewrite* de SPA faz **qualquer** URL devolver a aplicação, então digitar `/partida` direto
> é alcançável de verdade — não é hipótese. Sem persistência (RNF1.4), não há partida em
> memória nesse caso.
>
> Redirecionar em vez de renderizar uma tela vazia usa o roteador para o que o
> [ADR-0005](../decisions/0005-manter-tanstack-router.md) o manteve: a decisão fica num lugar
> só, e o estado inválido deixa de ser representável na interface.

```
/          tela inicial, botão "iniciar partida"
  ↓        estado/ gera a semente (S8) e cria a Partida
  ↓        a navegação dispara quando a partida APARECE, não no clique
/partida   renderiza visaoDe(partida, 0)
  ↑
  └─ sem partida em memória → redireciona para /
```

A ordem da seta do meio importa. Navegar dentro do `onClick` seria uma corrida com o
`dispatch`: `/partida` chegaria a ver `partida === null` e seria devolvida para `/` pela
própria regra da S14.

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

Tudo isso vem de `visaoDe(partida, 0)` — a tela não conhece `Partida` (§4.2). As três contagens
que aparecem acima são exatamente os três campos que a §2.1 expõe no lugar do conteúdo oculto.

Tela inicial (`/`): um botão, "iniciar partida" (RF1.1, RF1.2). Clicá-lo gera a semente,
cria a partida e navega para `/partida`.

As rotas `/fim` e `/regras` continuam **vazias** nesta fatia, como a RD2 as criou. A H1 só
preenche duas das quatro.

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
| **CA-R2.6-2** | as sementes **1 a 20** | `0` e `1` aparecem, cada um ao menos uma vez, como `jogadorDaVez` |
| **CA-R3.1-1** | uma partida iniciada | a fase é **`Compra`** |
| **CA-M9-3** | uma partida iniciada | mãos + jogos + monte + lixo + mortos = **104**, sem `id` repetido |
| **CA-RNF1.3-1** | duas partidas com a mesma semente | os estados são **profundamente iguais** |
| **CA-RNF1.3-2** | duas partidas com sementes diferentes | as distribuições **diferem** |
| **CA-S4-1** | a semente **20260731** | a distribuição é **exatamente** a registrada em 6.1 |
| **CA-RNF1.2-1** | uma partida iniciada | `JSON.parse(JSON.stringify(partida))` é profundamente igual à original |

Critérios de interface, nível 4 ([testing-strategy.md](../testing-strategy.md)):

| # | Dado | Então |
|---|---|---|
| **CA-S1-1** | a tela de partida renderizada | **nenhum** elemento da mesa responde a clique |
| **CA-S1-2** | a tela de partida renderizada | a contagem do monte mostra `60` e o lixo indica vazio |
| **CA-S1-3** | a tela inicial | existe exatamente uma ação: iniciar partida |
| **CA-S14-1** | `/partida` aberta **sem** partida em memória | a navegação termina em `/` |

> **CA-RNF1.2-1 não é sobre serialização — é sobre forma.** Ele reprova se o estado usar `Map`,
> `Set`, `Date` ou instâncias de classe, que atravessam o `JSON` perdendo tipo ou conteúdo. A
> H1 é onde a forma da `Partida` nasce, e descobrir na H13 que ela não serializa custaria
> reescrever a engine inteira. A RNF1.2 continua **aberta** depois desta fatia: só o estado
> inicial está coberto, e jogos com curinga ainda não existem.

### 6.1 O valor dourado da CA-S4-1

Congelamento da S4. Derivado por [`scripts/baralho-dourado.py`](../../scripts/baralho-dourado.py),
uma transcrição **independente** da seção 3 — se o valor viesse da própria implementação em
TypeScript, o teste provaria apenas que ela concorda consigo mesma.

Semente `20260731`, `jogadorDaVez: 1`.

| Destino | Cartas |
|---|---|
| `mao` do jogador `0` | `ESPADAS-9-2, OUROS-J-1, COPAS-4-2, OUROS-6-1, ESPADAS-K-2, COPAS-K-1, OUROS-9-1, ESPADAS-4-1, ESPADAS-5-2, PAUS-K-2, ESPADAS-5-1` |
| `mao` do jogador `1` | `OUROS-3-2, OUROS-9-2, COPAS-9-1, COPAS-3-1, COPAS-J-1, OUROS-4-2, ESPADAS-7-1, COPAS-2-2, COPAS-7-1, ESPADAS-4-2, OUROS-8-1` |
| morto A | `OUROS-6-2, OUROS-3-1, COPAS-J-2, ESPADAS-6-2, ESPADAS-2-2, ESPADAS-9-1, OUROS-Q-1, ESPADAS-J-1, PAUS-8-1, OUROS-7-1, ESPADAS-3-1` |
| morto B | `PAUS-7-2, PAUS-A-2, COPAS-8-2, PAUS-J-2, PAUS-5-2, PAUS-Q-2, PAUS-A-1, PAUS-6-1, COPAS-5-1, OUROS-10-1, PAUS-J-1` |
| `monte[0..4]` | `PAUS-Q-1, COPAS-8-1, OUROS-K-2, ESPADAS-10-2, PAUS-9-2` |
| `monte[55..59]` | `COPAS-9-2, OUROS-4-1, PAUS-K-1, OUROS-8-2, COPAS-A-2` |

> **O que este critério detecta é mudança, não correção.** Não existe "embaralhamento certo"
> contra o qual comparar — a corretude vem dos outros critérios (104 cartas, conservação,
> sementes diferentes divergem). O que ele garante é que trocar o gerador, inverter a direção
> do Fisher-Yates ou mover a chamada da S7 **não passa despercebido**, que é exatamente o risco
> que a S4 nomeia.

> CA-R2.6-2 merece nota: ele não verifica *qual* jogador começa, e sim que **os dois são
> possíveis**. Uma implementação que sempre devolve o jogador 1 passaria por todos os outros
> critérios.

---

## 7. Decisões

**Não há pendências.** As 16 decisões foram confirmadas em 2026-07-31 — S1–S8 no rascunho de
2026-07-29, S9–S16 ao fechar a spec.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **S1** | Escopo | H1 com **zero interatividade** na mesa |
| **S2** | API | `iniciarPartida` é a única forma pública de criar `Partida` |
| **S3** | `id` | Legível: `{NAIPE}-{VALOR}-{COPIA}` |
| **S4** | Embaralhamento | **Fisher-Yates descendente com `mulberry32`** — decisão que congela |
| **S5** | Distribuição | Ordem exata por faixa de índices |
| **S6** | Monte | `monte[0]` é o topo |
| **S7** | Início | Uma chamada extra ao gerador decide quem começa |
| **S8** | Semente | Gerada em `estado/` com `Math.random()`; a engine só recebe |
| **S9** | Embaralhamento | O `mulberry32` escrito **literalmente**, não referido pelo nome |
| **S10** | Embaralhamento | **`CA-S4-1`**, teste dourado com semente fixa |
| **S11** | Tipos | `JogadorId = 0 \| 1`; o humano é sempre `0` |
| **S12** | Sorteio | `CA-R2.6-2` usa as sementes **1 a 20** |
| **S13** | Serialização | **`CA-RNF1.2-1`** — sem `Map`, `Set` nem classes na `Partida` |
| **S14** | Rotas | `/partida` sem partida em memória **redireciona para `/`** |
| **S15** | Estado | O `Provider` fica na **rota raiz**, acima do `<Outlet/>` |
| **S16** | Visão | Nomes de campo de `VisaoDoJogador` fixados na spec |

### Notas de decisão

- **S4** continua a mais consequente, e a **S9 e a S10 são o que a torna real.** O rascunho
  declarava congelar o algoritmo, dava só o nome dele e não tinha nenhum critério que o
  travasse — qualquer outro gerador passaria pelos 14 critérios originais. Uma decisão
  "congelante" sem teste é uma intenção.
- **S5 e S6** parecem burocráticos e não são: sem eles, "distribuir 11 cartas" admite três
  resultados distintos para a mesma semente.
- **S1** define a H1 como propositalmente inútil enquanto jogo. É a prova de integração, não
  uma entrega de valor jogável.
- **S14 e S15 não existiam no rascunho** porque as rotas não existiam. São o exemplo mais
  claro nesta spec de uma pergunta que só nasce quando outra parte do sistema fica pronta — a
  0.7 criou as rotas, e o ADR-0008 tornou `/partida` digitável de verdade.
- **S13** é a única decisão aqui que não fecha nada nesta fatia. Ela protege uma escolha de
  forma que ficaria cara de reverter depois, e a RNF1.2 permanece aberta.