# Spec 0002 — Comprar e descartar

> Status: **confirmado** — 11 decisões, nenhuma pendência
> História: **H2** — "Compro uma carta do monte e descarto outra, encerrando meu turno"
> Fecha: R3.1, R3.2, R4.1 (metade), R4.3, R7.1, R7.2, RF2.2, M10
> Última atualização: 2026-08-01

## Sobre a numeração

As pendências continuam a série da [spec 0001](0001-mesa-inicial.md), que foi de `S1` a `S16`.
Esta começa em **`S17`**.

A série é **global e não reinicia** a cada spec. Custa nada e garante que uma referência a
"S9" continue sem ambiguidade daqui a dez fatias, mesmo depois de as specs virarem histórico.

---

## 1. Escopo

### Entra

Um turno completo do jogador humano: comprar do monte, descartar, e a vez passar.

Nasce aqui a **primeira transição de estado** do projeto. A H1 provou que a mesa pode ser
criada e vista; a H2 prova que ela pode **mudar** sem violar a conservação das cartas (M9).

### Não entra

| Fora | Vai para |
|---|---|
| Pegar o lixo | H7 |
| Baixar, aumentar, regularizar curinga | H4–H6 |
| Turno da IA | H3 |
| Batida e o descarte opcional da R7.3 | H10–H12 |
| Pegar morto | H10 |
| Monte esgotado (R4.6, R4.8) | H14 |

- `[D]` **S17** — A H2 implementa **apenas `comprarDoMonte`** das duas opções da
  R4.1. `pegarLixo` é a H7 inteira, e misturar as duas aqui juntaria a primeira transição de
  estado com a regra de compra mais complexa do jogo.

> Isto repete o padrão da S7 na H1, que implementou só a primeira metade da R2.6. Uma regra
> pode ser fechada por duas histórias, desde que esteja escrito qual metade cabe a cada uma.

- `[D]` **S18** — Depois do descarte, a vez passa ao adversário e **a mesa fica
  inerte**. Sem IA (H3), a partida para ali.

> S18 parece um beco sem saída e é a fatia honesta. A alternativa seria deixar o humano jogar
> os dois lados, o que criaria comportamento para ser removido na H3 — e um teste de "vez do
> adversário" que não testa nada, porque não existiria adversário.
>
> O estado inerte não é ausência de trabalho: é a RF2.2 e a
> [screens.md](../screens.md) §5 se tornarem observáveis pela primeira vez.

---

## 2. API introduzida

```ts
type Comando =
  | { tipo: 'comprarDoMonte' }
  | { tipo: 'descartar'; carta: string }

type Resultado =
  | { tipo: 'sucesso'; partida: Partida }
  | { tipo: 'recusa'; motivo: string }

movimentosValidos(visao: VisaoDoJogador): readonly Comando[]
aplicar(partida: Partida, comando: Comando): Resultado
```

### 2.1 A contradição do `domain.md`, e como ela se resolve

O [domain.md](../domain.md) decide **duas coisas incompatíveis** sobre a mesma função, ambas
marcadas `[D]`:

| Onde | Diz |
|---|---|
| **M10** | `movimentosValidos(partida) → Comando[]` |
| **M12** | "`movimentosValidos` opera sobre `VisaoDoJogador`, **não** sobre `Partida`" |

- `[D]` **S19** — Vale o **M12**: a assinatura recebe `VisaoDoJogador`. A linha do
  M10 é imprecisão de redação e deve ser corrigida no `domain.md`, com nota de por quê.

> O M12 vence por três motivos, e o terceiro é o que decide.
>
> **É a garantia estrutural da RF5.2.** Se a função recebesse a `Partida`, nada impediria um
> movimento calculado a partir do monte oculto. Com a visão, é impossível por construção — não
> por disciplina.
>
> **É implementável.** Conferi comando a comando: `comprarDoMonte` depende de `fase` e de
> `cartasNoMonte`; `descartar` depende de `fase` e da própria `mao`. Os três campos estão na
> visão. Nenhum comando da H2 precisa de informação oculta.
>
> **A `Partida` não sabe de quem é a pergunta.** `movimentosValidos(partida)` teria de receber
> também um `JogadorId`, ou assumir o `jogadorDaVez` — e assumir tornaria impossível perguntar
> "o que o adversário poderia fazer?", que é exatamente o que a IA da H15 vai querer. A visão
> já carrega o `eu`, então a pergunta é sempre inequívoca.

- `[D]` **S20** — Quando `visao.jogadorDaVez !== visao.eu`, a lista é **vazia**.

> É daqui que a mesa inerte da S18 cai de graça: a interface só mostra o que está na lista
> (RF2.1), então "não é sua vez" não precisa de nenhum código de interface. É ausência, não
> desabilitação.

- `[D]` **S21** — `aplicar` devolve `Sucesso(partida)` **sem a lista de eventos**
  que o M8 previu.

> O M8 escreveu `Sucesso(nova partida, eventos[])`. Não há consumidor de eventos na H2, nem na
> H3: a interface relê o estado inteiro e a IA recebe a visão. A invariante 3 pede caso
> concreto antes da abstração, e o candidato real aparece na **H12**, quando a apuração
> precisar explicar o que aconteceu.
>
> Gatilho registrado: **ao escrever a H12**, decidir entre acrescentar `eventos[]` ou derivar a
> narrativa do estado.

- `[D]` **S22** — `aplicar` **recusa** comando ilegal, mesmo a RF2.1 garantindo
  que a interface nunca o envie.

> Parece redundância e não é: a RF2.1 protege o jogador humano, não a engine. A IA da H15
> escolherá dentro da lista, mas um bug dela — ou um teste mal escrito — chegaria em `aplicar`.
> Uma engine que confia no chamador não tem como falhar alto.

---

## 3. Comportamento

### 3.1 Comprar do monte (R4.1, R3.1)

`comprarDoMonte` é válido quando `fase === 'Compra'` e o monte não está vazio.

| Antes | Depois |
|---|---|
| `mao` com 11 | `mao` com 12 |
| `monte` com *n* | `monte` com *n − 1* |
| `fase: 'Compra'` | `fase: 'Acao'` |
| `jogadorDaVez` | inalterado |

A carta comprada sai de `monte[0]`, que a S6 fixou como o topo.

- `[D]` **S23** — A carta comprada entra no **fim** da mão. A mão não é
  reordenada pela engine em nenhum momento.

> Ordenar a mão é assunto de interface, e de preferência do jogador. Uma engine que ordena
> impõe uma escolha, e pior: torna o `CA-S4-1` da H1 dependente de uma regra de ordenação que
> nada no domínio exige.

### 3.2 Descartar (R7.1, R7.2)

`descartar` é válido quando `fase === 'Acao'` e a carta indicada está na mão.

| Antes | Depois |
|---|---|
| `mao` com *n* | `mao` com *n − 1* |
| `lixo` com *m* | `lixo` com *m + 1* |
| `fase: 'Acao'` | `fase: 'Compra'` |
| `jogadorDaVez: p` | `jogadorDaVez: o outro` |

- `[D]` **S24** — `lixo[0]` é o **topo**, isto é, a carta descartada mais
  recentemente. Descartar insere no início.

> Mesma convenção da S6 para o monte, e pela mesma razão: "qual ponta é o topo" é exatamente o
> tipo de coisa que duas partes do código decidem em silêncio e diferente. A T3 pede o topo
> destacado na interface, e a H7 vai precisar da ordem para pegar o lixo inteiro.

- `[D]` **S25** — A carta é identificada por **`id`** no comando, não por
  posição na mão.

> Posição é frágil: qualquer reordenação na interface, que a S23 deixa livre, mudaria o
> significado do comando. O `id` é identidade (M1) e a S3 o fez legível justamente para isto.

A R7.2 é explícita em que a carta recém-comprada pode ser descartada no mesmo turno. Como a
S23 a coloca no fim da mão e a S25 identifica por `id`, isso não exige nada especial — mas
exige **teste**, porque é o tipo de regra que uma implementação "esperta" quebraria.

### 3.3 A vez do adversário (RF2.2, S18)

Com `jogadorDaVez` apontando para o adversário e sem IA, o estado congela. A interface mostra
de quem é a vez e em que fase, e `movimentosValidos` devolve lista vazia para a visão do
humano (S20).

### 3.4 O lixo passa a ser visível (R4.3)

Na H1 o lixo estava sempre vazio. Agora ele acumula, e a R4.3 exige que **todas** as cartas
sejam visíveis aos dois jogadores durante toda a rodada — é a característica central do Buraco
Aberto.

A `VisaoDoJogador` já carrega `lixo` inteiro desde a H1 (§2.1 da spec 0001). O que falta é a
interface deixar de dizer "Vazio" e passar a listar.

---

## 4. Fronteiras

### 4.1 A conservação passa a valer em transição

A H1 provou a M9 num único estado. A partir da H2 ela é o que o `domain.md` sempre disse que
era: **invariante de toda transição**.

- `[D]` **S26** — Todo comando tem teste de conservação **depois** de aplicado,
  não só o estado inicial.

> Comprar move uma carta de um lugar para outro; descartar também. São as duas operações mais
> simples do jogo, e é justamente por isso que valem como piso: se a conservação quebrar aqui,
> nenhuma regra mais complexa terá chance.

### 4.2 Quem chama o quê

```
ui/        renderiza movimentosValidos(visao) — não decide o que é válido
  ↓
estado/    despacha o Comando escolhido
  ↓
engine/    aplicar(partida, comando) → Resultado
```

A interface **nunca** valida (T6). Ela filtra o que mostra pela lista, e a lista vem da engine.

---

## 5. Interface

- `[D]` **S27** — Descartar exige **selecionar e confirmar**, em dois passos.
  Um toque só seleciona; um segundo elemento confirma.

> A T8 fixou "tocar e confirmar" para a interação primária, e a RF2.3 é o que torna isso
> obrigatório aqui: **não há desfazer**. Um descarte errado num toque acidental é irreversível
> e pode custar a rodada.

| Elemento | Fase `Compra` | Fase `Acao` | Vez do adversário |
|---|---|---|---|
| Monte | responde | inerte | inerte |
| Mão | **inerte** (R3.2, T9) | seleção | inerte |
| Confirmar descarte | ausente | aparece com carta selecionada | ausente |
| Lixo | inerte | inerte | inerte |

A coluna do meio da linha "Mão" é a R3.2 expressa como ausência de afetação, e não como
mensagem de erro — exatamente o que a T9 pediu.

---

## 6. Critérios de aceite

Engine, níveis 1 e 2:

| # | Dado | Então |
|---|---|---|
| **CA-R4.1-1** | fase `Compra`, monte não vazio | `comprarDoMonte` está entre os movimentos válidos |
| **CA-R4.1-2** | fase `Acao` | `comprarDoMonte` **não** está |
| **CA-R3.1-2** | uma partida em `Compra` | após `comprarDoMonte`, a fase é `Acao` |
| **CA-R3.2-1** | fase `Compra` | **nenhum** `descartar` está entre os movimentos válidos |
| **CA-R3.2-2** | fase `Compra` | `aplicar` com `descartar` devolve **recusa** |
| **CA-R7.1-1** | fase `Acao` com 12 cartas | descartar deixa 11 na mão e 1 no lixo |
| **CA-R7.1-2** | fase `Acao` | após descartar, a vez é do outro jogador e a fase é `Compra` |
| **CA-R7.2-1** | a carta recém-comprada | pode ser descartada no mesmo turno |
| **CA-R4.3-1** | um lixo com cartas | a visão de **ambos** os jogadores contém o lixo inteiro |
| **CA-S24-1** | dois descartes seguidos | `lixo[0]` é o **último** descartado |
| **CA-M9-4** | após `comprarDoMonte` | a conservação das 104 se mantém |
| **CA-M9-5** | após `descartar` | a conservação das 104 se mantém |
| **CA-M10-1** | a visão de quem **não** é da vez | `movimentosValidos` é vazio |
| **CA-M10-2** | fase `Acao` com 12 cartas | há exatamente **12** comandos `descartar`, um por carta |
| **CA-S22-1** | um comando com carta que não está na mão | `aplicar` devolve **recusa** |

Interface, nível 4:

| # | Dado | Então |
|---|---|---|
| **CA-RF2.2-1** | a mesa em qualquer fase | de quem é a vez e qual a fase estão indicados |
| **CA-S27-1** | fase `Acao`, nenhuma carta selecionada | **não** existe ação de confirmar descarte |
| **CA-S27-2** | fase `Acao`, uma carta selecionada | confirmar descarta **aquela** carta |
| **CA-S18-1** | vez do adversário | nenhum elemento da mesa responde a clique |
| **CA-R4.3-2** | um lixo com três cartas | a tela mostra as três, e não só a contagem |

> **CA-R4.1-2, CA-R3.2-1 e CA-M10-1 são os pares que travam interpretação.** Uma implementação
> que devolvesse sempre a lista completa passaria em CA-R4.1-1, CA-M10-2 e em todos os critérios
> de transição — e estaria errada. O que prova que a fase importa é o caso vizinho que **não**
> deve aparecer.

---

## 7. Decisões

**Não há pendências.** As 11 decisões foram confirmadas em 2026-08-01.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **S17** | Escopo | Só `comprarDoMonte`; `pegarLixo` fica inteiro para a H7 |
| **S18** | Escopo | Após o descarte a mesa fica **inerte** — sem IA, a partida para |
| **S19** | API | `movimentosValidos(visao)`, resolvendo M10 × M12 a favor do **M12** |
| **S20** | API | Lista **vazia** quando não é a vez do jogador da visão |
| **S21** | API | `Sucesso(partida)` **sem** `eventos[]`, com gatilho na H12 |
| **S22** | API | `aplicar` recusa comando ilegal, mesmo com a RF2.1 filtrando antes |
| **S23** | Compra | A carta comprada entra no **fim** da mão; a engine nunca ordena |
| **S24** | Lixo | `lixo[0]` é o topo, consistente com a S6 |
| **S25** | Comando | A carta é identificada por **`id`**, não por posição |
| **S26** | Testes | Conservação verificada **depois** de cada comando |
| **S27** | Interface | Descarte em **dois passos**: selecionar e confirmar |

### O que merece sua atenção

- **S19 é a mais consequente**, e é a única que corrige um documento de fundação. Se você
  discordar, o `domain.md` precisa da correção inversa — e aí a RF5.2 deixa de ser garantia
  estrutural e volta a ser disciplina.
- **S27** é a única sobre o seu jogo e não sobre software: dois passos para descartar é mais
  seguro e mais lento. Se na sua mesa descartar é gesto rápido, um toque só pode ser melhor —
  e é a faixa em que eu erro a cada seis.
- **S18** define a H2 como novamente incompleta enquanto jogo. É deliberado, pelo mesmo motivo
  da S1 na H1.
- **S21** é a única que contraria uma decisão do `domain.md` por simplicidade, e não por
  incoerência. O M8 previu `eventos[]`; estou propondo adiar até existir quem os leia.
