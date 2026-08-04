# Spec 0018 — H18: celular e teclado

> Status: **confirmada** — 6 decisões, confirmadas em bloco em 2026-08-04
> História: `H18` — _"Jogo com conforto no celular e navego pelo teclado"_
> Fecha: RNF3.1, RNF3.4
> Fecha gatilhos: ordem dos botões de jogada (IA4), Playwright (ADR-0006)

## 1. O problema, e a linha que ele divide

A H18 e a H19 dividem o mesmo território, e sem uma linha explícita uma engole a outra.

- `[D]` **S165** — A linha é **comportamento contra estética**. A H18 entrega o que **falha** sem
  ela: alcançar toda jogada pelo teclado, e a mesa caber numa tela estreita sem que nada fique
  inacessível. A H19 entrega o que fica **feio** sem ela: cores, espaçamento, tipografia,
  animação.

> O teste da linha é uma pergunta: *um jogador consegue jogar?* Se a resposta é não, é H18. Se é
> "sim, mas está horrível", é H19.

---

## 2. O teclado

A `screens.md` §7 já decidiu a forma, e ela é de 2026-07-30 — antes de existir tela:

> _"`Tab` circula entre mão, jogos próprios, monte, lixo e jogos do adversário; setas movem
> dentro da zona; `Espaço` seleciona; `Enter` confirma; `Esc` cancela a seleção."_

Ao reler isso com a interface pronta, **metade já existe de graça** e a outra metade custa código.
Botões e links nativos já respondem a `Tab`, `Enter` e `Espaço` — foi o que a H16 mediu ao
escolher `<dialog>`, e o que a H17 confirmou no navegador (o primeiro `Tab` foca o link de volta).

O que **não** existe é a navegação por setas dentro da zona, e ela tem um custo escondido: exige
`roving tabindex`, gerência de foco em `useEffect` e um modelo de "item ativo" por região.

|  | Como | Custo |
|---|---|---|
| **A — só o nativo** | tudo é `button`/`link`; `Tab` percorre item a item | a mão com 20 cartas exige 20 `Tab` para chegar ao painel seguinte |
| **B — zonas com setas** | `roving tabindex` por região, como a §7 previu | foco gerenciado à mão em cinco regiões, e é o tipo de código que quebra em silêncio |
| **C — nativo mais atalhos de zona** | tudo continua nativo; teclas levam **direto** a uma zona | não substitui a §7; resolve o mesmo problema (chegar longe rápido) com muito menos superfície |

- `[D]` **S166** — Forma **C**. Toda jogada continua alcançável só com `Tab` e `Enter` — que é o
  que a RNF3.4 exige —, e as zonas ganham atalho direto. A navegação por setas da §7 **não entra**,
  e a §7 recebe nota dizendo por quê.

> Isto **contradiz** uma decisão da Onda 2, então o registro importa. A §7 foi escrita sem tela
> para medir, e a intuição dela era que `Tab` seria insuportável. Com a mesa pronta dá para medir:
> as regiões têm 1 a 4 elementos interativos cada, exceto a mão. O problema real é **uma** zona,
> não cinco — e um mecanismo de cinco zonas para resolver uma é o que a invariante 3 chama de
> abstração sem caso concreto.

---

## 3. A ordem dos botões

O `roadmap.md` §3 guarda, com prazo neste marco:

> _"Ordem dos botões de jogada na interface — com uma carta selecionada aparecem 'Descartar' **e**
> a jogada de mesa, nessa ordem, porque os descartes vêm primeiro no `return` de
> `movimentosValidos`."_

A H15 tirou a `ia/` dessa dependência (IA3): a engine enumera, a `ia/` pontua. Sobrou a tela, e a
H10 mediu que a ordem é **observável** — o roteiro do navegador clicava "o primeiro botão" e
pegava sempre o descarte.

- `[D]` **S167** — A interface **ordena por conta própria**, e a ordem é: jogadas de mesa
  primeiro, descarte por último. A ordem de `movimentosValidos` deixa de significar qualquer
  coisa para qualquer consumidor, e o gatilho fecha de vez.

> O argumento é de consequência, não de estética: o descarte **encerra o turno** (R7.1). Pô-lo
> primeiro é oferecer a ação irreversível antes das reversíveis, e num teclado — onde a primeira
> opção é a que o `Enter` alcança — isso é um erro esperando acontecer.

---

## 4. O celular

A RNF3.1 pede que o jogo funcione em telas pequenas com toque. O modelo de interação já é
tocar-e-confirmar (screens.md §4), que a Onda 2 escolheu justamente por isso.

- `[D]` **S168** — O que falta é **estrutural**, não visual: a meta tag de _viewport_, e um
  layout que empilhe as regiões em telas estreitas em vez de cortá-las. Alvos de toque, cores e
  espaçamento são H19.

- `[D]` **S169** — A verificação é **medida, não olhada**: numa viewport de 360 × 640, todo
  elemento interativo precisa estar dentro da área visível e ser clicável. Um `overflow` que
  esconda o botão de descartar é o defeito que esta fatia existe para pegar, e ele não aparece em
  jsdom.

---

## 5. O Playwright

O ADR-0006 adiou o Playwright para _"o Marco VI, quando existir partida completa"_. Ela existe
desde a H14, e desde então **toda** fatia foi verificada no navegador — por roteiros descartáveis,
escritos e jogados fora.

Esses roteiros acharam defeito em **seis das nove últimas fatias**. É a rede mais produtiva do
projeto e a única que não está no repositório.

- `[D]` **S170** — O Playwright entra, e o que ele traz é **um** teste: a partida completa de
  ponta a ponta, com teclado e em viewport de celular. Não a suíte inteira — os 377 testes de
  jsdom continuam onde estão, e são mais rápidos.

> O que ele **não** substitui é a verificação exploratória. O roteiro que achou o _"Voltar ao
> início"_ mentiroso na H17 não estava procurando aquilo; ele estava rodando o app. Um teste
> automatizado prende o que já se sabe, e o valor das seis descobertas veio de olhar.

---

## 6. Critérios de aceite

- `CA-S166-1` — a partida inteira é jogável só com `Tab` e `Enter`, do início ao descarte
- `CA-S166-2` — cada região tem atalho direto, e o atalho move o foco para dentro dela
- `CA-S166-3` — nenhum elemento interativo fica fora da ordem de tabulação (`tabindex="-1"`)
- `CA-S167-1` — com uma carta selecionada que forme jogada de mesa, a jogada de mesa vem **antes**
  do descarte
- `CA-S167-2` — embaralhar a lista de `movimentosValidos` não muda a ordem dos botões — é o par
  que prova que a tela ordena, e não herda
- `CA-S168-1` — a página declara _viewport_ responsivo
- `CA-S169-1` — em 360 × 640, todos os elementos interativos da mesa estão visíveis e clicáveis
- `CA-S170-1` — um teste de Playwright joga uma partida completa por teclado, em viewport de
  celular, e chega à tela de fim

---

## 7. Decisões

Seis decisões, confirmadas em bloco em 2026-08-04.

| # | Assunto | Proposta |
|---|---|---|
| **S165** | Escopo | A linha H18/H19 é **comportamento contra estética**: o que falha aqui, o que fica feio lá |
| **S166** | Teclado | Só o nativo, mais atalhos de zona. **Contradiz a `screens.md` §7**, que ganha nota |
| **S167** | Interface | A tela ordena os botões: mesa primeiro, descarte por último — ele encerra o turno |
| **S168** | Celular | _Viewport_ e empilhamento; alvo de toque e espaçamento são H19 |
| **S169** | Verificação | 360 × 640 medido, não olhado |
| **S170** | Ferramenta | Playwright entra com **um** teste de ponta a ponta, não com a suíte |

---

## 8. O que a fatia mediu

Escrito depois da implementação, e **duas decisões precisaram de conserto** — as duas de medição,
não de domínio.

### 8.1 A CA-S170-1 pedia a partida completa, e o relógio disse não

A RF5.3 põe 700 ms entre os comandos da IA (S35), e desde a H15 a heurística joga várias jogadas
por turno — o turno dela mede **1,4 s** na mediana. Uma partida tem ~500 ações do humano:
**cerca de dezessete minutos de relógio**. Isso não é teste, é espera.

O teste ficou em **20 turnos**, e roda em 18 s. O que ele prova é o que dá para provar: o teclado
alcança tudo ao longo de vários turnos, o atalho de zona leva o foco para dentro da região, e nada
que responde fica inalcançável em 360 × 640.

A partida completa continua sendo verificação **exploratória**, rodada à mão. E isso não é
consolo: os roteiros descartáveis acharam defeito em **seis das nove últimas fatias**, e nenhum
deles estava procurando o que achou.

### 8.2 A CA-S169-1 estava mal escrita, e o teste mostrou

Ela dizia _"todos os elementos interativos da mesa estão visíveis"_. Implementado ao pé da letra —
`toBeInViewport` — o teste **reprovou**, e com razão: a mesa tem vinte cartas e não cabe em 640 px
de altura, nem deveria. Exigir isso reprovaria qualquer página longa.

O defeito que a fatia teme é outro, e é medível: **transbordo horizontal**. Conteúdo mais largo
que a tela empurra elementos para fora do alcance e não volta com rolagem vertical. O critério
passou a ser `scrollWidth − innerWidth ≤ 1`, mais a garantia de que cada botão, depois de rolado
para a área visível, tem caixa e é clicável. Medido em 360 px: **sem transbordo**.

### 8.3 O resto

- **Três mutações, três mordem.** Tirar a ordenação da tela reprova 2; inverter a ordem reprova 1;
  esconder a lista de atalhos reprova 1.
- **A `screens.md` §7 recebeu a nota** que a S166 prometeu, anexada em vez de reescrita.
- **O `<body>` custou uma execução.** A primeira versão do roteiro de teclado procurava o rótulo no
  `textContent` do elemento focado — e o foco inicial é o `<body>`, cujo `textContent` contém a
  página inteira. Ele "achava" qualquer botão no primeiro passo e teclava `Enter` no vazio.
- **Medir o foco a cada `Tab` estourou o limite de dois minutos.** A conta passou a ser feita uma
  vez por ação, em vez de uma por tecla: mesma navegação, um centésimo das idas ao navegador.

---

### Onde eu erraria, se errasse

**A S166 é a única que contradiz uma decisão já confirmada**, e por isso é a que mais precisa do
seu olhar. A `screens.md` §7 pediu navegação por setas dentro das zonas, e eu estou dizendo que
`Tab` basta em quatro das cinco. Se você já jogou algo assim por teclado e a experiência foi ruim,
essa medição vale mais que a minha.

A **S170** é a que eu reduziria primeiro se a fatia ficar grande: o Playwright pode entrar sozinho
depois, e nada nesta história depende dele.
