# Spec 0004 — Baixar sequências

> Status: **confirmado** — 12 decisões, nenhuma pendência
> História: **H4** — "Baixo três ou mais cartas do mesmo naipe em sequência"
> Fecha: R3.4, R5.1, R5.2, R5.3, R5.6, R6.1, I1, I2, I3, I5, I6
> Última atualização: 2026-08-01

Pendências a partir de **`S38`**, continuando a série global.

---

## 1. Escopo

### Entra

Baixar um jogo novo na mesa: três ou mais cartas do mesmo naipe, em sequência, **sem curinga**.

É a fatia que dá corpo ao `Jogo`, que até agora era `never`. Junto com a H5, fecha os sete
invariantes do [domain.md](../domain.md) §4.

### Não entra

| Fora | Vai para |
|---|---|
| Curinga em qualquer posição — invariantes I4 e I7 | H5 |
| Aumentar jogo já baixado (R6.2, R6.3) | H6 |
| Pegar o lixo (R4.2, R4.4) | H7 |
| Canastra, categoria e pontuação (R8, R11) | H8–H12 |
| Bater e pegar morto (R9, R10) | H10 |

- `[D]` **S38** — A H4 é **sem curinga**. O `2` do próprio naipe continua sendo
  carta natural na posição dele (R1.3), e é assim que `A-2-3` entra aqui.

> A H5 é um subproblema inteiro, e as [user-stories.md](../user-stories.md) já avisaram: juntar
> as duas torna difícil saber qual das duas está errada quando um teste falha.

---

## 2. API introduzida

```ts
type Posicao = { readonly tipo: 'Natural'; readonly carta: Carta }

type Jogo = {
  readonly id: string
  readonly dono: JogadorId
  readonly naipe: Naipe
  readonly posicoes: readonly Posicao[]
}

type Invariante = 'I1' | 'I2' | 'I3' | 'I5' | 'I6'

type ResultadoDeJogo =
  | { readonly tipo: 'valido'; readonly jogo: Jogo }
  | { readonly tipo: 'invalido'; readonly violados: readonly Invariante[] }

// engine
criarJogo(dono: JogadorId, cartas: readonly Carta[]): ResultadoDeJogo

// comando novo
{ tipo: 'baixar'; cartas: readonly string[] }
```

- `[D]` **S39** — `Posicao` nasce com **só `Natural`**. A variante `Curinga`
  entra na H5 e alarga o tipo.

> Mesmo padrão do `Jogo = never` na H1: o tipo diz a verdade sobre a fatia, e o compilador
> passa a garantir que a H4 não cria curinga por acidente. A M2 continua honrada — a estrutura
> **já é** lista de posições, não de cartas, que é o que torna a R6.5 exprimível na H9.

- `[D]` **S40** — `criarJogo` devolve **sucesso com o jogo, ou a lista de
  invariantes violadas** (M6), nunca um `Jogo` inválido. `Invariante` cobre só os cinco da H4;
  `I4` e `I7` entram com o curinga.

---

## 3. Comportamento

### 3.1 As catorze casas, e por que não é uma ordem circular

Esta é a decisão mais consequente da fatia, e o [domain.md](../domain.md) §4 já avisou que o
`I6` "é um erro fácil de cometer e difícil de notar".

- `[D]` **S41** — A ordem da R5.2 é uma **linha de 14 casas**, não um anel:

```
casa:   0  1  2  3  4  5  6  7  8  9 10 11 12 13
valor:  A  2  3  4  5  6  7  8  9 10  J  Q  K  A
```

Uma sequência é um trecho **contíguo** desta linha, cada casa ocupada uma vez.

| Cartas | Casas | Válido? |
|---|---|---|
| `A♥ 2♥ 3♥` | 0, 1, 2 | sim — Ás baixo |
| `Q♥ K♥ A♥` | 11, 12, 13 | sim — Ás alto |
| `K♥ A♥ 2♥` | 12, 13, **1** | **não** — 13 e 1 não são vizinhas |
| `A♥ 2♥ … K♥ A♥` | 0 a 13 | sim — 14 cartas, Ás nas duas pontas |

> Tratar a ordem como circular faria `K-A-2` passar, e ela é proibida pela R5.3. O anel é a
> intuição errada mais natural do mundo aqui: `A` aparece nas duas pontas, então parece que
> fecha. Não fecha.

- `[D]` **S42** — Uma carta de valor `A` pode ocupar a casa **0 ou a 13**. Ao
  construir o jogo, a engine **tenta as combinações** e aceita se alguma produzir trecho
  contíguo válido.

> Com no máximo dois Ases do mesmo naipe, são no máximo quatro combinações. É barato, e a
> alternativa — pedir ao jogador que diga qual ponta — seria interface decidindo regra (T6).

### 3.2 A ordem em que as cartas chegam

- `[D]` **S43** — O comando aceita as cartas em **qualquer ordem**. A engine
  ordena.

> A T8 fixou "tocar e confirmar": o jogador seleciona `7♥`, depois `5♥`, depois `6♥`, e a
> ordem da seleção é acidental. Exigir ordem faria a interface ordenar — e ordenar exige saber
> onde o Ás vai, que é regra.

### 3.3 Baixar não encerra o turno

- `[D]` **S44** — Depois de `baixar`, a fase **continua `Acao`** e a vez
  **não passa**. Só `descartar` encerra o turno.

> É a R3.3 — "quantas ações quiser, em qualquer ordem". A H2 tinha só um comando na fase de
> ação, e por isso o descarte parecia ser "a" ação. Agora a fase ganha o laço próprio que o
> diagrama do [domain.md](../domain.md) §1.3 já mostrava.

### 3.4 O estado que a H4 pode alcançar e não sabe tratar

Se um jogador baixar **todas** as cartas da mão, ele fica sem carta para descartar — e a R7.1
exige o descarte. A R7.3 diz que a exceção é a batida, que é a H10.

- `[D]` **S45** — Na H4, `movimentosValidos` **não oferece** um `baixar` que
  esvaziaria a mão. A guarda é temporária e sai na H10.

> É a única proposta desta spec que **restringe** o jogo além das regras, e é por isso que ela
> precisa do seu olho. O alvo é não alcançar um estado sem especificação: hoje a partida
> travaria sem descarte possível.
>
> Alcançável? Exige as 12 cartas da mão formando sequências. Raro, mas a IA da H3 escolhe por
> sorteio e joga indefinidamente — "raro" vira "uma hora acontece".
>
> Gatilho: **ao implementar a H10**, remover a guarda junto com a batida.

---

## 4. A enumeração, e o gatilho da T7

A [screens.md](../screens.md) §3.1 registrou o medo: enumerar todos os `baixar` com 22 cartas
na mão poderia explodir. A T7 decidiu **medir antes de otimizar**, e o gatilho vence aqui.

- `[D]` **S46** — A enumeração é feita por **corridas de casas**, não por
  subconjuntos da mão.

```
para cada naipe:
  mapeia as cartas daquele naipe para casas
  acha as corridas maximais de casas consecutivas
  para cada corrida, enumera os trechos contíguos de tamanho >= 3
```

> A intuição de "todos os subconjuntos" dá `2^22`, mais de quatro milhões — e é a conta que
> assustou a T7. Mas sequência é trecho contíguo de uma linha de 14 casas, então o espaço real
> tem no máximo `4 naipes × 14 × 14` candidatos, e na prática muito menos.
>
> **O medo era de um algoritmo que ninguém precisa escrever.** Vale medir mesmo assim, porque
> a T7 pediu número e não argumento.

- `[D]` **S47** — Cartas repetidas geram **um comando só**. Para cada casa, a
  engine escolhe uma carta canônica — a de menor `id`.

> Com dois `5♥` na mão, `5♥-6♥-7♥` é uma jogada, não duas. A M1 diz que as regras comparam só
> naipe e valor, então as cópias são intercambiáveis e oferecer as duas seria ruído na
> interface sem escolha real por trás.

---

## 5. Interface

A H2 tinha seleção de **uma** carta. Baixar precisa de várias, e a T6 já disse como.

- `[D]` **S48** — A máquina de seleção passa a operar sobre um **conjunto**, e
  o botão de confirmar aparece para **todo comando cujas cartas sejam exatamente a seleção**.

> Isso unifica o que a H2 fez à mão: `descartar` vira o caso de conjunto unitário, e não
> precisa de caminho próprio. A T6 fica cumprida ao pé da letra — a interface **filtra** a
> lista, e nunca sabe o que é uma sequência.
>
> Consequência: com três cartas selecionadas que formem sequência, aparece "Baixar". Com uma
> carta só, aparece "Descartar". Nenhum dos dois botões é decidido pela interface.

- `[D]` **S49** — Uma carta da mão é **selecionável** quando participa de ao
  menos um comando válido **compatível com a seleção atual**. Ao selecionar, as cartas que
  deixam de poder acompanhar ficam inertes.

> É o que a T6 pediu, e tem um efeito colateral bom: o jogador descobre as sequências possíveis
> pela própria mesa, sem o jogo explicar nada.

---

## 6. Critérios de aceite

### 6.1 Os que já estavam escritos

Esta é a primeira spec que **herda critérios em vez de criar**. O
[acceptance-tests.md](../acceptance-tests.md) já definiu, na Onda 2:

`CA-R5.3-1` · `CA-R5.3-2` · `CA-R5.3-3` · `CA-R5.3-4` · `CA-R5.3-5` · `CA-R5.3-6` ·
`CA-R5.6-1` · `CA-R5.6-2`

Eles vão para os testes **como estão**, sem reescrita. O par decisivo continua sendo
`CA-R5.3-2` (`Q♥ K♥ A♥` válido) contra `CA-R5.3-4` (`K♥ A♥ 2♥` inválido): é ele que separa a
linha de 14 casas do anel.

### 6.2 Os novos

| # | Dado | Então |
|---|---|---|
| **CA-R5.1-1** | `5♥ 6♥ 7♥` | forma jogo válido de 3 posições |
| **CA-R5.1-2** | `5♥ 6♠ 7♥` | **inválido** — I2, naipes misturados |
| **CA-R5.1-3** | `5♥ 6♥` | **inválido** — I1, mínimo de três |
| **CA-R5.1-4** | `5♥ 7♥ 8♥` | **inválido** — I3, casa 5 vazia |
| **CA-S43-1** | `7♥ 5♥ 6♥`, nesta ordem | válido — a engine ordena |
| **CA-R6.1-1** | baixar na fase `Acao` | as cartas saem da mão e o jogo aparece em `meusJogos` |
| **CA-R6.1-2** | baixar | a fase **continua** `Acao` e a vez **não** passa |
| **CA-R6.1-3** | baixar cartas que não estão na mão | `aplicar` devolve **recusa** |
| **CA-R3.4-1** | um jogador sem nenhum jogo na mesa | pode baixar o primeiro sem mínimo algum |
| **CA-M9-7** | após `baixar` | a conservação das 104 se mantém |
| **CA-S45-1** | uma mão cujo único `baixar` a esvaziaria | esse comando **não** é oferecido |
| **CA-S47-1** | dois `5♥` na mão e `6♥ 7♥` | há **um** comando `baixar` para `5-6-7`, não dois |

### 6.3 O critério que responde ao gatilho da T7

| # | Dado | Então |
|---|---|---|
| **CA-S46-1** | uma mão de **22 cartas** | `movimentosValidos` responde em **menos de 50 ms**, e o número de comandos é registrado |

> O limiar de 50 ms é metade do orçamento que a E6 dá à IA inteira (100 ms por turno), porque
> a enumeração é só uma parte do que ela faz. **O número de comandos importa mais que o tempo**
> e vai para o roteiro: é ele que diz se a T6 se sustenta ou se a consulta `validar` da §3.1
> vai ser preciso.

Interface, nível 4:

| # | Dado | Então |
|---|---|---|
| **CA-S48-1** | três cartas selecionadas que formam sequência | aparece a ação **Baixar**, e ela baixa aquelas três |
| **CA-S48-2** | uma carta selecionada | aparece **Descartar** e **não** aparece Baixar |
| **CA-S49-1** | uma carta selecionada | as cartas que não acompanham nenhum comando com ela ficam **inertes** |

---

## 7. Decisões

**Não há pendências.** As 12 decisões foram confirmadas em 2026-08-01.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **S38** | Escopo | H4 é **sem curinga**; o `2` do naipe segue natural (R1.3) |
| **S39** | Tipos | `Posicao` nasce só com `Natural`; `Curinga` alarga na H5 |
| **S40** | API | `criarJogo` devolve sucesso ou **lista de invariantes violadas** (M6) |
| **S41** | Domínio | A ordem é **linha de 14 casas**, não anel — é o que proíbe `K-A-2` |
| **S42** | Domínio | O `A` pode ir para a casa 0 **ou** 13; a engine tenta as combinações |
| **S43** | API | O comando aceita as cartas em **qualquer ordem** |
| **S44** | Turno | `baixar` **não** encerra o turno; só `descartar` encerra (R3.3) |
| **S45** | Escopo | `baixar` que esvaziaria a mão **não é oferecido** — guarda temporária até a H10 |
| **S46** | Desempenho | Enumeração por **corridas de casas**, não por subconjuntos |
| **S47** | Enumeração | Cartas repetidas geram **um** comando; carta canônica por casa |
| **S48** | Interface | Seleção por **conjunto**; confirma quando bate exatamente com um comando |
| **S49** | Interface | Carta é selecionável se acompanha algum comando compatível com a seleção |

### O que merece sua atenção

**Calibragem, e desta vez ela pesa contra mim de verdade.** Esta é a primeira spec sobre as
regras do seu jogo, e é a faixa em que erro a cada seis. As três que mais quero que você olhe:

- **S45 é a única que restringe o jogo além das regras.** Ela impede baixar tudo e ficar sem
  descarte, porque a batida é a H10. Se você preferir que a H4 simplesmente não chegue lá e a
  gente aceite o risco, ela cai — mas aí a partida pode travar num estado sem spec.
- **S41 e S42 são a leitura que faço da R5.2 e da R5.3.** Se na sua mesa o Ás se comporta de
  outro jeito — por exemplo, se `K-A-2` for aceito, ou se o Ás só puder ocupar uma ponta por
  rodada —, é aqui que cai, e cai junto com metade da fatia.
- **S47 parece detalhe de implementação e é regra disfarçada:** se na sua mesa faz diferença
  *qual* cópia da carta foi baixada, a proposta está errada.

Sobre software eu estou tranquilo: **S46 desarma o susto da T7**. A conta de `2^22` que
assustou a Onda 2 pressupõe subconjuntos arbitrários, e sequência não é subconjunto arbitrário
— é trecho contíguo de uma linha de 14 casas. O espaço real é de centenas, não de milhões.
