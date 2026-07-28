# Glossário — Linguagem Ubíqua

> Status: **rascunho para revisão**
> Escopo: Buraco Aberto, 1 contra 1 ([ADR-0001](decisions/0001-variante-buraco-aberto.md), [ADR-0002](decisions/0002-formato-individual-1v1.md))
> Última atualização: 2026-07-28

Este documento define **o vocabulário do projeto**. Cada termo aqui tem exatamente um
significado e exatamente um identificador em código.

Regra: se um conceito não está neste glossário, ele não pode aparecer em código, em teste,
em nome de arquivo ou em mensagem de commit. Termo novo entra aqui primeiro.

Itens marcados com **⚠️ CONFIRMAR** são pontos onde as fontes divergem ou onde decidi por
conta própria. Preciso da sua confirmação antes que virem regra em `rules.md`.

---

## 1. Decisão de idioma

Os termos do domínio ficam **em português** no código.

`Morto`, `bater`, `canastra limpa` e `lixo` não têm equivalente honesto em inglês —
traduzir produziria `DeadHand`, `goOut`, `cleanCanasta`, termos que nem você nem eu usamos
ao falar do jogo. Em DDD, a Linguagem Ubíqua existe justamente para que a conversa e o
código usem as mesmas palavras. Traduzir o domínio quebra isso.

**Termos técnicos** (fora do domínio) seguem em inglês, como é convenção:
`GameState`, `reducer`, `validate`, `shuffle`.

Sem acentos e sem cedilha nos identificadores: `Sequencia`, não `Sequência`.

---

## 2. Baralho e cartas

| Termo | Definição | Em código |
|---|---|---|
| **Baralho** | O conjunto de 104 cartas usado na partida: dois baralhos franceses de 52, **sem Curingão**. ⚠️ CONFIRMAR | `Baralho` |
| **Carta** | Unidade do jogo. Definida por naipe e valor. Cartas iguais existem em duplicata. | `Carta` |
| **Naipe** | Copas, Ouros, Espadas ou Paus. | `Naipe` |
| **Valor** | A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K. | `Valor` |
| **Curinga** | O **2** de qualquer naipe, quando usado para substituir outra carta. ⚠️ CONFIRMAR: um 2 usado na sua própria posição natural (ex.: A-2-3 de copas) conta como carta natural, não como curinga. | `Curinga` |
| **Curingão** | O Joker. **Não existe no Buraco Aberto.** Registrado aqui apenas para deixar explícito que está fora do escopo. | — |
| **Carta natural** | Qualquer carta que não está sendo usada como curinga. | `cartaNatural` |

---

## 3. Áreas da mesa

| Termo | Definição | Em código |
|---|---|---|
| **Mão** | As cartas que um jogador tem consigo, visíveis apenas para ele. ⚠️ CONFIRMAR: 11 cartas na distribuição inicial. | `Mao` |
| **Monte** | A pilha de compra, virada para baixo. | `Monte` |
| **Lixo** | A pilha de descarte. No Buraco Aberto **todas as cartas são visíveis**. | `Lixo` |
| **Morto** | Conjunto reservado de 11 cartas que um jogador recebe ao ficar sem cartas na mão. ⚠️ CONFIRMAR: quantos mortos existem em 1 contra 1 — dois (um por jogador) ou apenas um? Esta é a pergunta mais importante deste glossário. | `Morto` |
| **Mesa** | Área onde ficam os jogos baixados, visível para todos. | `Mesa` |

---

## 4. Jogos baixados

| Termo | Definição | Em código |
|---|---|---|
| **Jogo** | Conjunto de cartas baixado na mesa segundo as regras. No Buraco Aberto, **só existe um tipo: a sequência**. | `Jogo` |
| **Sequência** | Três ou mais cartas do **mesmo naipe** em ordem consecutiva. ⚠️ CONFIRMAR: o Ás vale como carta baixa (A-2-3) e alta (Q-K-A); a sequência **não dá a volta** (K-A-2 é inválida). | `Sequencia` |
| **Trinca** | Três ou mais cartas do mesmo valor. **Não existe no Buraco Aberto.** Registrado para deixar explícito que está fora do escopo. | — |
| **Canastra** | Um jogo que atingiu **sete ou mais cartas**. | `Canastra` |
| **Canastra limpa** | Canastra formada só por cartas naturais. ⚠️ CONFIRMAR: 200 pontos. | `canastraLimpa` |
| **Canastra suja** | Canastra que contém ao menos um curinga. ⚠️ CONFIRMAR: 100 pontos. | `canastraSuja` |

> **Nota sobre "Buraco".** Em parte do Brasil, "buraco" é usado como sinônimo de
> "canastra". Neste projeto **"Buraco" é apenas o nome do jogo**. O conjunto de sete ou
> mais cartas chama-se sempre *canastra*. Nunca use "buraco" com o segundo sentido.

---

## 5. Ações do jogador

| Termo | Definição | Em código |
|---|---|---|
| **Comprar** | Pegar uma carta do monte. Primeira ação do turno. | `comprar` |
| **Pegar o lixo** | Alternativa a comprar: levar as cartas do lixo para a mão. ⚠️ CONFIRMAR: leva-se o lixo **inteiro**, nunca uma parte. | `pegarLixo` |
| **Baixar** | Colocar um jogo novo na mesa. | `baixar` |
| **Aumentar** | Acrescentar cartas a um jogo já baixado. ⚠️ CONFIRMAR: só é permitido aumentar os próprios jogos, não os do adversário. | `aumentar` |
| **Descartar** | Colocar uma carta no lixo. Última ação do turno. | `descartar` |
| **Pegar o morto** | Receber o morto ao ficar sem cartas na mão. | `pegarMorto` |
| **Bater** | Encerrar a rodada ficando sem cartas. ⚠️ CONFIRMAR: exige ter pegado o morto e possuir ao menos uma **canastra limpa**. | `bater` |

---

## 6. Estrutura da partida

| Termo | Definição | Em código |
|---|---|---|
| **Turno** | A vez de um jogador: comprar (ou pegar o lixo), opcionalmente baixar/aumentar, e descartar. | `Turno` |
| **Rodada** | Uma distribuição completa, do embaralhamento até a batida. | `Rodada` |
| **Partida** | Sequência de rodadas até um jogador atingir a pontuação de vitória. | `Partida` |
| **Pontuação de vitória** | Total que encerra a partida. ⚠️ CONFIRMAR: 3000 pontos. | `PONTUACAO_VITORIA` |

---

## 7. Termos proibidos

Sinônimos que causam ambiguidade. Nunca usar em código, teste ou documento:

| Não usar | Usar |
|---|---|
| *meld*, *combinação*, *jogada baixada* | **Jogo** |
| *descarte*, *pilha de descarte* | **Lixo** |
| *deck*, *stock*, *estoque* | **Baralho** (as 104 cartas) ou **Monte** (a pilha de compra) |
| *buraco* como sinônimo de canastra | **Canastra** |
| *coringa* | **Curinga** |
| *run*, *escada* | **Sequência** |
| *fechar*, *finalizar*, *sair* | **Bater** |

---

## 8. Pendências

Os onze **⚠️ CONFIRMAR** acima. Nenhum deles vira regra em `rules.md` sem sua confirmação
explícita — nenhuma regra do jogo é assumida.
