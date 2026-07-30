# Glossário — Linguagem Ubíqua

> Status: **confirmado** (termos), com pendências listadas na seção 9
> Escopo: Buraco Aberto, 1 contra 1 ([ADR-0001](decisions/0001-variante-buraco-aberto.md), [ADR-0002](decisions/0002-formato-individual-1v1.md), [ADR-0003](decisions/0003-canastras-especiais-500-1000.md))
> Última atualização: 2026-07-29

Este documento define **o vocabulário do projeto**. Cada termo aqui tem exatamente um
significado e exatamente um identificador em código.

Regra: se um conceito não está neste glossário, ele não pode aparecer em código, em teste,
em nome de arquivo ou em mensagem de commit. Termo novo entra aqui primeiro.

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
| **Baralho** | O conjunto de 104 cartas usado na partida: dois baralhos franceses de 52, **sem Curingão**. Cada carta existe em duplicata. | `Baralho` |
| **Carta** | Unidade do jogo. Definida por naipe e valor. | `Carta` |
| **Naipe** | Copas, Ouros, Espadas ou Paus. | `Naipe` |
| **Valor** | A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K. | `Valor` |
| **Curinga** | O **2** de qualquer naipe, quando usado para substituir outra carta. Um 2 empregado na sua própria posição natural (ex.: A-2-3 de copas) é carta natural, não curinga. | `Curinga` |
| **Curingão** | O Joker. **Não existe no Buraco Aberto.** Registrado para deixar explícito que está fora do escopo. | — |
| **Carta natural** | Qualquer carta que não está sendo usada como curinga. | `cartaNatural` |

---

## 3. Áreas da mesa

| Termo | Definição | Em código |
|---|---|---|
| **Mão** | As cartas que um jogador tem consigo, visíveis apenas para ele. São 11 na distribuição inicial. | `Mao` |
| **Monte** | A pilha de compra, virada para baixo. | `Monte` |
| **Lixo** | A pilha de descarte. No Buraco Aberto **todas as cartas são visíveis**. | `Lixo` |
| **Morto** | Conjunto reservado de 11 cartas. Existem **dois mortos, sem dono**: formam um recurso comum e **disputado**. Um jogador pega um morto ao ficar sem cartas na mão, e **pode pegar os dois** se esvaziar a mão duas vezes. | `Morto` |
| **Mesa** | Área onde ficam os jogos baixados, visível para todos. | `Mesa` |

---

## 4. Jogos baixados

| Termo | Definição | Em código |
|---|---|---|
| **Jogo** | Conjunto de cartas baixado na mesa segundo as regras. No Buraco Aberto **só existe um tipo: a sequência**. | `Jogo` |
| **Sequência** | Três ou mais cartas do **mesmo naipe** em ordem consecutiva. O Ás pode ocupar **as duas pontas** da mesma sequência (`A-2-3-…-K-A`), mas a sequência **termina no Ás alto e não continua além dele** — por isso `K-A-2` é inválida. Tamanho máximo: **14 cartas**. | `Sequencia` |
| **Trinca** | Três ou mais cartas do mesmo valor. **Não existe no Buraco Aberto.** Registrado para deixar explícito que está fora do escopo. | — |
| **Canastra** | Um jogo que atingiu **sete ou mais cartas**. | `Canastra` |

### 4.1 Categorias de canastra

| Termo | Definição | Pontos | Em código |
|---|---|---|---|
| **Canastra limpa** | Canastra formada só por cartas naturais. | 200 | `LIMPA` |
| **Canastra suja** | Canastra que contém ao menos um curinga. | 100 | `SUJA` |
| **Canastra de 500** | Sequência completa de **Ás a Rei** — 13 cartas. | 500 | `DE_500` |
| **Canastra de 1000** | Sequência de **Ás a Ás** — 14 cartas, com um Ás em cada ponta. | 1000 | `DE_1000` |

As quatro categorias são **mutuamente exclusivas**: toda canastra recebe exatamente uma.
A regra de precedência entre elas está pendente — ver seção 9.

> **Nota sobre "Buraco".** Em parte do Brasil, "buraco" é usado como sinônimo de
> "canastra". Neste projeto **"Buraco" é apenas o nome do jogo**. O conjunto de sete ou
> mais cartas chama-se sempre *canastra*. Nunca use "buraco" com o segundo sentido.

---

## 5. Ações do jogador

### 5.1 Comandos

O jogador emite estes seis comandos. São a superfície pública da engine.

| Termo | Definição | Em código |
|---|---|---|
| **Comprar** | Pegar uma carta do monte. Primeira ação do turno. | `comprarDoMonte` |
| **Pegar o lixo** | Alternativa a comprar: levar o lixo **inteiro** para a mão. Nunca uma parte. | `pegarLixo` |
| **Baixar** | Colocar um jogo novo na mesa. | `baixar` |
| **Aumentar** | Acrescentar cartas a um jogo já baixado. Só nos **próprios** jogos, nunca nos do adversário. | `aumentar` |
| **Regularizar o curinga** | Fazer o curinga baixado ocupar sua casa natural, limpando a canastra. | `regularizarCuringa` |
| **Descartar** | Colocar uma carta no lixo. Última ação do turno. | `descartar` |

### 5.2 Operações automáticas

Continuam sendo termos do domínio, mas **não são comandos**. O jogador nunca as solicita: a
engine as executa como consequência de uma jogada que zerou a mão.

| Termo | Definição | Em código |
|---|---|---|
| **Pegar o morto** | Receber um morto ao ficar sem cartas na mão, havendo morto disponível. | `pegarMorto` |
| **Bater** | Encerrar a rodada ficando sem cartas, sem morto disponível e com ao menos uma canastra **limpa**. | `bater` |

> A separação vem do modelo de domínio ([domain.md](domain.md) M3 e M4). Falar "eu bati" na
> mesa é correto; oferecer um botão "bater" na interface seria errado — a batida é o
> resultado de uma jogada, não uma jogada.

---

## 6. Estrutura da partida

| Termo | Definição | Em código |
|---|---|---|
| **Turno** | A vez de um jogador: comprar (ou pegar o lixo), opcionalmente baixar/aumentar, e descartar. | `Turno` |
| **Rodada** | Uma distribuição completa, do embaralhamento até a batida. | `Rodada` |
| **Partida** | Sequência de rodadas até um jogador atingir a pontuação de vitória. | `Partida` |
| **Pontuação de vitória** | 3000 pontos. | `PONTUACAO_VITORIA` |

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

## 8. Confirmado em 2026-07-29

Baralho de 104 sem Curingão · curinga é só o 2 · 11 cartas por jogador · **dois mortos sem
dono, disputados** · Ás nas duas pontas sem dar a volta · limpa 200 / suja 100 · canastras
de 500 e 1000 · lixo levado inteiro · aumentar só os próprios jogos · bater exige ao menos
um morto e uma canastra limpa · vitória em 3000.

> **Correção da mesma data.** A primeira versão deste glossário dizia que cada jogador
> tinha um morto exclusivo, seguindo as fontes pesquisadas para o jogo 1 contra 1. A regra
> adotada no projeto é outra: os mortos são um **recurso comum e disputado**. Ver `rules.md`
> R2.3 e R9.1–R9.3.

## 9. Pendências para o `rules.md`

Estes pontos não afetam os *termos*, mas afetam as *regras*. Serão decididos ao escrever
`rules.md`:

1. **Precedência entre as categorias de canastra.** Uma sequência de Ás a Ás sem curinga é
   `DE_1000` ou `LIMPA`? Proposta: a categoria mais específica vence — `DE_1000` →
   `DE_500` → `LIMPA` → `SUJA`.
2. **Canastras especiais admitem curinga?** Uma sequência de Ás a Rei com um curinga ainda
   vale 500, ou cai para `SUJA`?
3. **Canastra suja vira limpa?** As fontes descrevem a troca do curinga pela carta natural
   que ele substituía, promovendo a canastra. Adotamos?
4. **Valor individual das cartas** no fechamento da rodada. As fontes indicam 8 a K = 10,
   3 a 7 = 5, Ás = 15; o valor do 2 / curinga ainda não está claro.
5. **Penalidade de −100** por terminar a rodada sem ter pegado o morto.
