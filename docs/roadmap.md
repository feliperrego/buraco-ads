# Roteiro

> Status: **confirmado** — 6 decisões, nenhuma pendência
> Deriva de: [user-stories.md](user-stories.md) · [testing-strategy.md](testing-strategy.md) · [architecture.md](architecture.md)
> Última atualização: 2026-07-29

## Como ler este documento

Este documento é **curto de propósito**, e isso é bom sinal: a ordem de entrega já está nos
Marcos I a VI de [user-stories.md](user-stories.md), e não há prazos porque
[vision.md](vision.md) estabeleceu que o aprendizado vence a velocidade.

Sobra o que nenhum outro documento cobre:

1. O trabalho técnico que **não é história de usuário** e precisa existir antes da H1
2. Os **gatilhos de reavaliação** das decisões que adiamos
3. Como uma história vira código

O item 2 é a razão principal deste documento existir. Sem ele, "reavaliar depois" nunca chega.

Pendências: `RD1`…`RDn`.

---

## 1. Marco 0 — fundação técnica

Não é história de usuário: ninguém "vê" configuração. Mas a H1 não começa sem isso.

| # | Tarefa | Fecha |
|---|---|---|
| **0.1** | Vite + React + TypeScript | Stack |
| **0.2** | Estrutura de pastas de `src/` | A7 |
| **0.3** | ESLint + Prettier | Stack |
| **0.4** | **Regra de dependência como configuração de ESLint** | A2, A3, C6 |
| **0.5** | Vitest com relatório de cobertura | E4 |
| **0.6** | `scripts/verificar-cobertura.py` no CI | E5, E9 |
| **0.7** | TanStack Router com as quatro rotas vazias | ADR-0005, T1 |

- `[D]` A tarefa 0.4 só está pronta quando um **import proibido de verdade faz o
  lint falhar**. Escrevemos a violação, confirmamos a falha, e removemos.

> RD1 parece exagero e não é. Uma regra de lint mal configurada não avisa que está mal
> configurada — ela simplesmente passa. A A2 afirma que a fronteira é garantida por ferramenta;
> se ninguém verificar a ferramenta, voltamos a ter uma intenção, com a agravante de acreditar
> que está protegida.
>
> Vale para os três casos: `engine/` importando React, `ia/` importando de `estado/`, e
> qualquer coisa fora de teste importando `engine/testing/`.

- `[D]` A tarefa 0.7 cria as rotas **vazias**, sem conteúdo. É o esqueleto de
  navegação que a T1 e a RF1.3 vão usar, não as telas.

---

## 2. Ordem de entrega

Os marcos de [user-stories.md](user-stories.md), sem datas:

| Marco | Histórias | Termina quando |
|---|---|---|
| **0** | 0.1–0.7 | O lint recusa um import proibido e a suíte vazia roda |
| **I** | H1–H3 | Dois jogadores compram e descartam; a IA joga sozinha |
| **II** | H4–H7 | Dá para baixar sequências, com e sem curinga, e pegar o lixo |
| **III** | H8–H12 | Uma rodada completa termina em batida e pontuação apurada |
| **IV** | H13–H14 | Uma partida completa chega a 3000, inclusive com monte esgotado |
| **V** | H15 | O oponente joga por heurística, não por sorteio |
| **VI** | H16–H19 | Produto: abandono, regras, celular, acabamento |

- `[D]` **Uma história por vez**, sem iteração de tamanho fixo. Cada história
  percorre o ciclo completo: spec em `docs/specs/` → critérios de aceite → testes → código →
  refatoração.

> Iteração fixa serve para coordenar equipe e prever entrega. Não temos equipe nem prazo. O que
> importa aqui é que nenhuma história comece antes de a anterior estar pronta pela definição da
> U5: regras citadas com teste passando **e** comportamento observável.

---

## 3. Gatilhos de reavaliação

As decisões que adiamos, cada uma com o momento em que voltamos a olhá-la. Sem isto, "depois"
é o mesmo que "nunca".

| Decisão adiada | Gatilho | Origem |
|---|---|---|
| Custo de enumerar todos os `baixar` | **Ao terminar H4** — medir com 22 cartas na mão | T7 |
| Se o modelo de posições (M2) está certo | **Ao terminar H9** — se regularizar o curinga foi difícil, o modelo está errado | M2, H9 |
| `ia-strategy.md` como documento próprio | **Antes de começar H15** | U2 |
| Limiar de 70% na força relativa da IA | **Ao terminar H15** — com o número real medido | E6 |
| `useReducer` + Context vs Zustand | **Se houver re-render perceptível** durante Marco VI | A6 |
| Teste de mutação | **Se aparecer bug em regra que tinha teste passando** | E8 |
| Playwright | **Início do Marco VI** — quando existir partida completa | ADR-0006 |
| Reintroduzir TanStack Query | **Se multiplayer entrar no escopo** | ADR-0004 |

- `[D]` Cada gatilho acionado gera **decisão registrada**: ADR se mudar
  arquitetura, atualização do documento de origem caso contrário. Nunca uma mudança silenciosa.

> O gatilho da H9 é o mais interessante da tabela, porque é um **teste da qualidade do nosso
> próprio modelo**. A R6.5 é a regra mais difícil do Buraco Aberto. Se o `domain.md` M2 acertou,
> implementá-la é quase trivial; se errou, é impossível. A dificuldade sentida ao escrever a H9
> é o sinal — e queremos lê-lo em vez de atribuir a "regra complicada".

---

## 4. Como uma história vira código

- `[D]` Sequência fixa, sem atalho:

```
1. spec         docs/specs/NNNN-nome.md — comportamento e casos de borda
2. critérios    Dado/Quando/Então, cada um citando seu Rn (C1)
3. testes       falhando, com o identificador CA-Rn-k no nome
4. código       o mínimo para os testes passarem
5. refatoração  com os testes verdes
6. verificação  suíte completa + scripts/verificar-cobertura.py
7. commit       pequeno, mensagem descritiva
```

- `[D]` Uma história só é considerada pronta com a **suíte inteira** verde, não
  apenas os testes dela.

> O passo 3 antes do 4 é TDD, e aqui ele tem uma razão específica além das usuais: o critério
> de aceite já existe escrito (passo 2), então o teste é transcrição, não invenção. É o ponto
> em que o SDD e o TDD se encontram — a especificação já determinou o teste, e o teste
> determina o código.

---

## 5. Histórico das decisões

**Não há pendências.** As 6 decisões foram confirmadas em 2026-07-29.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **RD1** | Marco 0 | A regra de dependência só está pronta quando um import proibido **faz o lint falhar** |
| **RD2** | Marco 0 | Rotas criadas **vazias**, só o esqueleto de navegação |
| **RD3** | Ritmo | **Uma história por vez**, sem iteração de tamanho fixo |
| **RD4** | Reavaliação | Todo gatilho acionado gera decisão registrada, nunca mudança silenciosa |
| **RD5** | Ciclo | Sete passos de spec a commit, sem atalho |
| **RD6** | Pronto | Suíte **inteira** verde, não só os testes da história |

### Notas de decisão

- **RD1** é a única tarefa do Marco 0 que exige verificar a própria ferramenta. Sem ela, a A2 seria fé.
- **RD3** faz o ritmo depender de nós dois, coerente com "não temos pressa".
- A **tabela de gatilhos da seção 3** é o conteúdo real deste documento.
