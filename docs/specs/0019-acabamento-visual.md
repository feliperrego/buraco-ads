# Spec 0019 — H19: acabamento visual

> Status: **confirmada** — 6 decisões, confirmadas em bloco em 2026-08-04
> História: `H19` — _"A interface tem acabamento visual coerente"_
> Fecha: RNF3.1 · **encerra o Marco VI e o projeto**

## 1. O problema

Dezoito fatias entregaram uma interface **funcional e feia**, e isso foi decisão, não descuido: a
`user-stories.md` fixou que _"uma tela bonita construída sobre regras erradas precisa ser refeita,
enquanto uma tela feia sobre regras corretas só precisa de estilo"_.

Chegou a hora do estilo. E ela chega com uma restrição que as outras fatias não tiveram: **381
testes de comportamento**, escritos ao longo de nove meses de projeto, que encontram tudo por
**papel e nome acessível**.

- `[D]` **S171** — O nome acessível é **contrato**. Nenhuma mudança visual pode alterar o texto de
  um botão, o `aria-label` de uma região ou o papel de um elemento. Se um teste de comportamento
  quebrar nesta fatia, o defeito é da mudança visual — não do teste.

> É a RNF2.2 cobrando o que prometeu: _"o critério é comportamento, nunca aparência"_. A H19 é a
> fatia que testa essa promessa, porque é a única que mexe **só** na aparência. Se os 381 passarem
> sem um ajuste, a estratégia de teste do projeto se prova; se muitos quebrarem, ela era frágil e
> ninguém tinha reparado.

---

## 2. Onde o estilo mora

|  | Como | Custo |
|---|---|---|
| **A — CSS puro com variáveis** | `index.css` com custom properties e seletores por elemento | sem dependência; classes globais exigem disciplina de nomes |
| **B — CSS Modules** | um `.module.css` por componente, já suportado pelo Vite | escopo garantido; espalha o estilo por sete arquivos e dificulta ver o conjunto |
| **C — Tailwind** | utilitários no JSX | dependência nova, e a mesma pergunta do ADR-0004: resolve um problema que temos? |

- `[D]` **S172** — Forma **A**. São sete telas pequenas e um punhado de elementos repetidos; o
  conjunto cabe num arquivo e é mais fácil de manter coerente **vendo-o inteiro**. Nenhuma
  dependência nova entra, pela mesma pergunta que o ADR-0004 fez.

- `[D]` **S173** — O que vira **token** em custom property é o que se repete e precisa combinar:
  cores, escala de espaçamento, escala tipográfica e raio de borda. O que é de um lugar só fica no
  lugar dele. Token que aparece uma vez é indireção, não sistema.

---

## 3. As cartas

Hoje uma carta é um `<li>` com texto — _"7 de copas"_. É o elemento mais repetido da tela e o que
mais muda de aparência.

- `[D]` **S174** — A carta ganha forma de carta: retângulo, valor e naipe, e **cor por naipe**
  (vermelho para copas e ouros). O texto acessível continua sendo _"7 de copas"_ por inteiro, e não
  vira `7♥` — símbolo não se lê em voz alta, e a S171 proíbe mexer no nome.

> A cor **não** pode ser a única portadora do naipe: a RNF3.4 pede contraste adequado, e daltonismo
> vermelho-verde é comum. O naipe continua escrito, e a cor acompanha.

---

## 4. O que "coerente" quer dizer, e como se mede

"Acabamento visual coerente" não é verificável por asserção. Vale dizer isso em vez de fingir um
critério.

- `[D]` **S175** — O que **é** verificável entra em teste: contraste mínimo de 4.5:1 no texto
  (RNF3.4), foco visível em todo elemento interativo, e a ausência de transbordo horizontal em
  360 px que a H18 já mede. O resto — se está bonito — é julgamento seu, e a spec o chama pelo
  nome.

> A tentação aqui é escrever um critério que **pareça** medir estética. "A tela usa no máximo três
> cores" passa e não significa nada. O projeto já tem uma lição sobre isso: verificador que promete
> mais do que checa é pior que nenhum.

---

## 5. O que fica de fora

- `[D]` **S176** — **Animação e transição não entram.** A RF5.3 já resolve o ritmo da IA com a
  pausa da S35, e nenhum requisito pede movimento. Animar cartas é o tipo de trabalho que parece
  acabamento e é funcionalidade nova — com estado, interrupção e caso de borda.

---

## 6. Critérios de aceite

- `CA-S171-1` — os 381 testes de comportamento passam **sem ajuste** depois da mudança visual
- `CA-S171-2` — nenhum `aria-label` de região e nenhum texto de botão muda no diff da fatia
- `CA-S174-1` — a carta continua tendo nome acessível por extenso, e o naipe continua escrito
- `CA-S175-1` — todo texto tem contraste ≥ 4.5:1 contra o fundo dele, medido
- `CA-S175-2` — todo elemento interativo tem indicador de foco visível, medido no navegador
- `CA-S175-3` — em 360 px não há transbordo horizontal (herda a `CA-S169-1`)

---

## 7. Decisões

Seis decisões, confirmadas em bloco em 2026-08-04.

| # | Assunto | Proposta |
|---|---|---|
| **S171** | Contrato | O nome acessível é **intocável**; teste que quebrar acusa a mudança visual |
| **S172** | Estilo | CSS puro com custom properties, num arquivo. Sem dependência nova |
| **S173** | Estilo | Vira token o que se repete e precisa combinar; o resto fica no lugar |
| **S174** | Cartas | Forma de carta e cor por naipe, com o naipe **escrito** — cor não é a única pista |
| **S175** | Verificação | Mede-se contraste, foco e transbordo. "Bonito" é julgamento seu, e a spec diz isso |
| **S176** | Escopo | Animação **não** entra — é funcionalidade disfarçada de acabamento |

---

## 8. O que a fatia mediu

Escrito depois da implementação.

### 8.1 A CA-S171-1 passou, e é o resultado mais importante do projeto

**Os 381 testes de comportamento passaram sem um único ajuste.** A mudança visual mexeu em dois
arquivos — 241 linhas de CSS e 14 de JSX, todas `className` e `data-naipe` — e nenhum nome
acessível, papel ou texto mudou.

A RNF2.2 prometeu, em julho, que _"o critério é comportamento, nunca aparência"_. A H19 é a única
fatia que mexe **só** na aparência, e portanto a única que podia cobrar a promessa. Ela cobrou.

### 8.2 O navegador achou dois defeitos, e a suíte não achou nenhum

Os dois no mesmo lugar — a carta selecionada — e os dois invisíveis para 381 testes:

1. **Branca no branco.** A regra de seleção pintava o texto de `--realce-tinta`, e a regra da carta
   vinha depois com a mesma especificidade e zerava o fundo. Sobrava texto branco sobre papel
   branco: a carta selecionada **sumia**.
2. **Vermelha sobre verde.** Consertado o primeiro, a carta de ouros selecionada ficou com a cor de
   naipe sobre o fundo de seleção — **1,9:1**. A cor por naipe é mais específica que a de seleção,
   e a colisão entre as duas não tem como aparecer numa asserção de comportamento.

Nos dois casos o nome acessível estava intacto, o papel estava intacto, o `aria-pressed` estava
correto. **A suíte estava certa em passar.** Texto invisível é aparência, e a RNF2.2 fixou que ela
não olha isso — quem olha é o passo 6.

> O segundo defeito ensinou mais que o primeiro, e a lição é sobre o **teste**, não sobre o CSS. A
> `CA-S175-1` rodava **antes** de qualquer seleção, e por isso passou com a carta invisível. Estado
> que muda cor precisa ser **visitado**, ou a medição só alcança o estado fácil. É a `CA-S145-3` da
> H15 com outra roupa: âncora positiva não basta se o teste não vai ao caso temido.

### 8.3 O `:focus-visible` não acende com `.focus()`

A primeira `CA-S175-2` focava por código e lia `outline: none` — e **reprovava com a regra certa
no lugar**. O `:focus-visible` é decisão do navegador, e um foco programático depois de um clique
de mouse não o dispara.

O teste passou a andar de `Tab`, que é o que um usuário de teclado faz. A medição errada não era
severa demais: era **de outra coisa**.

---

### Onde eu erraria, se errasse

**Esta é a fatia em que a minha calibragem menos serve**, e por um motivo diferente do usual: não
é domínio, é **gosto**. As decisões acima são todas sobre mecanismo — onde o CSS mora, o que vira
token, o que se mede. Nenhuma delas diz se a mesa vai ficar boa de olhar.

Isso é seu para julgar, e a `S175` existe para não pretender o contrário. **A pergunta útil no fim
desta fatia não é "os testes passam", é "você jogaria isto?"**
