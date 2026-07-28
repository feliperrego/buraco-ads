# ADR-0002 — Formato 1 contra 1 na v1

- **Status:** Aceita
- **Data:** 2026-07-28

## Contexto

Buraco é classicamente jogado em duplas (2 contra 2), mas também se joga individualmente.
O formato escolhido afeta praticamente todas as camadas do sistema: o modelo de domínio
(existe o conceito de "time"?), as regras (jogos baixados pertencem ao jogador ou à
dupla?), a IA (uma IA parceira precisa cooperar com o humano) e a interface (quantas mãos,
quantas áreas de jogo na mesa).

## Decisão

A v1 suporta **um humano contra uma IA**, sem parcerias.

## Consequências

**Positivas**

- Elimina do domínio os conceitos de time, propriedade compartilhada de jogos baixados e
  coordenação entre jogadores aliados.
- Remove o problema de IA mais difícil do projeto: uma IA que joga *como sua parceira* e
  precisa sinalizar intenção sem comunicação explícita.
- Reduz a interface a duas mãos e duas áreas de jogo.

**Negativas**

- O formato mais tradicional do Buraco fica de fora da v1.
- Jogadores acostumados a duplas não encontrarão o jogo que esperam.

**Neutras**

- O domínio será modelado para 1v1 de forma direta e honesta. Não criaremos abstração
  genérica de "N jogadores em M times" antes de existir uma segunda configuração real.
  Quando duplas entrarem, o refactor será guiado por um caso concreto — que é a única
  forma de acertar uma abstração.

## Alternativas consideradas

- **2 contra 2 (duplas)** — formato clássico, mas exige modelar parceria e uma IA
  cooperativa logo na primeira versão.
- **Domínio genérico sobre jogadores e times desde o início** — rejeitada por YAGNI:
  abstrair antes de ter dois casos concretos costuma produzir a abstração errada, que
  então custa mais caro para desfazer do que teria custado escrever.

## Relação com outras decisões

Depende de [ADR-0001](0001-variante-buraco-aberto.md), que fixa a variante de regras.
