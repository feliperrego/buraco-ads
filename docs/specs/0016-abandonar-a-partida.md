# Spec 0016 — H16: abandonar a partida

> Status: **rascunho anotado** — 6 decisões, todas pendentes
> História: `H16` — _"Abandono a partida com confirmação, e sou avisado antes de fechar a janela"_
> Fecha: RF1.3, RF1.4
> Abre o Marco VI

## 1. O problema

A partida só termina de um jeito hoje: alguém chega aos 3000. Não há saída. Quem abrir o jogo
por engano, ou quiser recomeçar, tem de fechar a aba — e a RF1.4 diz que o jogo deveria avisar
antes disso, porque **não há persistência** (RF1.1): fechar a janela apaga a partida inteira.

São dois requisitos que parecem um só e não são:

- **RF1.3** — sair **de propósito**, com confirmação
- **RF1.4** — sair **sem querer**, com aviso do navegador

O primeiro é interface nossa. O segundo é uma API do navegador que não podemos desenhar, só
acionar — e que tem regras próprias sobre quando o navegador a respeita.

Esta é a primeira fatia do projeto que **não toca a engine**. Nenhuma regra do `rules.md` está
em jogo: abandonar não é jogada, é sair.

---

## 2. Onde mora o botão

- `[P]` **S153** — O botão _"Abandonar partida"_ vive na **tela de partida**, e em nenhuma
  outra. Na `/fim` não existe: a partida acabou, e o que aquela tela oferece é _"Nova partida"_
  (S133). Na inicial não há o que abandonar.

> Vale dizer o que **não** entra junto: a `/fim` não ganha um segundo botão para voltar à tela
> inicial. A RF1.5 pede vencedor e nova partida, e é o que ela tem. Acrescentar saída ali seria
> resolver um problema que ninguém levantou — e a S134 já decidiu, para o painel de apuração,
> que caminho único é preferível a escolha inventada.

---

## 3. A forma da confirmação

A RF1.3 exige confirmação **antes de descartar o progresso**. Três formas:

|                      | Como                                        | Custo                                                                                                                                                     |
| -------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — `<dialog>`**   | elemento nativo, `showModal()`              | traz foco preso, `Esc` e sobreposição de graça, e é HTML — o teste lê por papel (`role="dialog"`) como qualquer outra região                                |
| **B — `confirm()`**  | modal do navegador                          | texto não é nosso, estilo não é nosso, e a RNF3.2 pede português — o rótulo dos botões vem do idioma do sistema, não do nosso                              |
| **C — `div` própria** | painel sobreposto escrito à mão             | foco, `Esc` e clique fora viram código nosso, e a H18 teria de refazê-los para a RNF3.4                                                                    |

- `[P]` **S154** — Forma **A**, `<dialog>` com `showModal()`. O argumento decisivo é a **RNF3.4**:
  a navegação por teclado é requisito, e o `<dialog>` modal já entrega foco preso e `Esc` — as
  duas coisas que a forma **C** faria a H18 escrever de novo.

> A forma **B** é a mais barata de escrever e a que menos serve. Os rótulos _"OK"_ e _"Cancel"_
> vêm do navegador no idioma do sistema, e a RNF3.2 fixa **português do Brasil** como idioma
> único. Um jogo em português com um diálogo em inglês é o mesmo defeito que a `CA-S84-1` pegou
> na H7 — dado certo, texto errado —, e ali ele passou por um critério que conferia o número e
> não a frase.

---

## 4. Abandonar é ação de estado, navegação é da interface

Abandonar faz duas coisas: apaga a partida e leva o jogador à tela inicial. Elas moram em
camadas diferentes, e misturá-las é o erro fácil.

- `[P]` **S155** — `abandonar` é ação nova do reducer, e ela **só** zera a partida. A navegação
  para `/` é da `ui/`, como já é no botão _"Ver o resultado"_ da S134. O reducer continua sem
  conhecer rota.

> É a mesma fronteira da S8: a impureza mora fora do reducer. Aqui a "impureza" é o roteador, e
> a `RotaPartida` já é o lugar do projeto que sabe navegar.

---

## 5. O aviso antes de fechar a janela

A RF1.4 é a API `beforeunload`. Ela tem duas particularidades que mudam o desenho:

1. O navegador só mostra o aviso se houver **interação do usuário** com a página. Um teste que
   dispare o evento programaticamente prova que o nosso código chamou `preventDefault`, e **não**
   prova que o navegador avisou.
2. O texto é do navegador. Como no `confirm()`, não é nosso — mas aqui não há alternativa, e a
   RNF3.2 não é violada por algo que a plataforma não deixa traduzir.

- `[P]` **S156** — O ouvinte de `beforeunload` mora em `estado/`, num efeito do
  `ProvedorDaPartida`, e é **registrado e removido** conforme a partida existir. Não fica sempre
  registrado com um `if` dentro: um ouvinte que existe sempre é indistinguível, em teste, de um
  ouvinte que avisa sempre.

- `[P]` **S157** — "Partida em andamento" é `partida !== null && vencedorDa(partida) === null`.
  A rodada encerrada **no meio** da partida conta como em andamento — o placar acumulado se
  perde igual. O que não conta é a partida decidida, porque ali não há progresso a proteger.

> A `vencedorDa` já existe desde a H13 e devolve `null` enquanto ninguém chegou aos 3000 (S132).
> Reusá-la é o que impede uma segunda definição de "acabou" — o defeito que a S140 mediu com
> outro nome.

---

## 6. O que prende o verificador

Os dois requisitos desta fatia são fáceis de testar **errado**, e pelo mesmo motivo: os dois têm
um caso negativo que passa de graça.

- `[P]` **S158** — Cada um dos dois ganha o **par**: o aviso presente com partida em andamento
  **e ausente** na tela inicial e na partida decidida; o diálogo abrindo no clique **e** a
  partida sobrevivendo ao cancelamento. Sem o par, "não avisa quando não deve" é verdade num
  componente que nunca avisa.

> É a regra que o `CLAUDE.md` já registra duas vezes — `CA-S1-1` e `CA-S27-1` —, e a H15
> acrescentou a terceira forma dela: a `CA-S145-3` tinha âncora positiva e mesmo assim não
> visitava o caso temido. Aqui o caso temido é o **cancelar**, e ele é o que separa "confirmação"
> de "botão com um passo a mais".

---

## 7. Critérios de aceite

**S153 — o botão**

- `CA-S153-1` — a tela de partida oferece botão _"Abandonar partida"_
- `CA-S153-2` — a tela inicial **não** o oferece, e a `/fim` também não — e as duas têm âncora
  positiva: a inicial oferece _"Iniciar partida"_, a `/fim` oferece _"Nova partida"_

**S154 e S155 — a confirmação**

- `CA-S154-1` — clicar em _"Abandonar partida"_ abre um diálogo com papel `dialog`, e a partida
  **continua existindo** enquanto ele está aberto
- `CA-S154-2` — o diálogo pergunta em português e oferece duas saídas nomeadas: confirmar e
  cancelar
- `CA-S155-1` — confirmar zera a partida e leva à rota `/`
- `CA-S155-2` — **cancelar fecha o diálogo e a partida segue idêntica** — mesma mão, mesmo
  placar, mesma fase
- `CA-S155-3` — a ação `abandonar` do reducer devolve `partida: null` e não conhece rota alguma

**S156 e S157 — o aviso do navegador**

- `CA-S156-1` — com partida em andamento, o evento `beforeunload` tem `preventDefault` chamado
- `CA-S156-2` — na tela inicial, **nenhum ouvinte de `beforeunload` está registrado**
- `CA-S157-1` — com a partida decidida, o ouvinte foi removido
- `CA-S157-2` — com a rodada encerrada **no meio** da partida, o ouvinte continua registrado

**S158 — o par**

- `CA-S158-1` — abandonar e iniciar de novo entrega uma partida nova, com o placar zerado — é a
  prova de que `abandonar` não deixou resto

---

## 8. O que fica de fora

- **Persistência.** A RF1.1 já decidiu que não há. Esta fatia protege o progresso de sumir sem
  aviso; não o salva.
- **Foco, `Esc` e ordem de tabulação além do que o `<dialog>` dá de graça.** A RNF3.4 inteira é
  a H18, e a S154 escolhe a forma que **não** precisa ser refeita lá.
- **Estilo do diálogo.** É a H19.

---

## 9. Decisões

Seis propostas. Nenhuma confirmada.

| #        | Assunto  | Proposta                                                                                              |
| -------- | -------- | ----------------------------------------------------------------------------------------------------- |
| **S153** | Interface | O botão vive **só** na tela de partida; a `/fim` não ganha saída nova                                 |
| **S154** | Interface | A confirmação é `<dialog>` nativo — a RNF3.4 decide, e o `confirm()` cai pela RNF3.2                  |
| **S155** | Estado   | `abandonar` só zera a partida; a navegação continua na `ui/`                                          |
| **S156** | Estado   | O ouvinte de `beforeunload` é **registrado e removido**, nunca sempre presente com `if` dentro         |
| **S157** | Regra    | "Em andamento" = `partida !== null && vencedorDa(partida) === null`, reusando a `vencedorDa` da H13    |
| **S158** | Teste    | Cada requisito ganha o **par** positivo/negativo; o caso temido é o **cancelar**                      |

### Onde eu erraria, se errasse

**Nenhuma destas seis é sobre Buraco**, e é a primeira spec do projeto de que dá para dizer isso.
São todas software, que é onde a calibragem do acordo diz que eu acerto — o que também significa
que a revisão aqui pode ser mais rápida que a das anteriores.

A que mais pode envelhecer mal é a **S154**. O `<dialog>` é bem suportado hoje (RNF3.3 pede
navegadores atuais), e mesmo assim ele traz comportamento de plataforma que não controlamos —
como o `confirm()` que eu acabei de recusar por isso. A diferença é que o `<dialog>` deixa o
**texto** e o **estilo** conosco, e é isso que a RNF3.2 exige.
