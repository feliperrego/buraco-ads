# ADR-0006 — Playwright entra na Onda 3

- **Status:** Aceita
- **Data:** 2026-07-29
- **Relacionada a:** [architecture.md](../architecture.md) A13

## Contexto

Playwright constava da stack de qualidade desde o início, junto com Vitest. A questão não é
*se* haverá testes de ponta a ponta, mas **quando**.

Testes E2E são os mais caros do projeto em três dimensões: escrita, manutenção e tempo de
execução. E o retorno depende do que já está coberto em níveis mais baratos.

A engine será coberta regra por regra em Vitest, com cada teste citando um `Rn` de
[rules.md](../rules.md) (RNF2.1). Nesse cenário, um E2E escrito hoje testaria uma interface
que ainda não existe, sobre regras que já estão testadas.

## Decisão

Playwright entra na **Onda 3**, quando existir uma partida jogável de ponta a ponta.

## Consequências

**Positivas**

- Evita escrever e reescrever testes E2E contra uma interface que ainda vai mudar de forma.
- Mantém o ciclo de feedback rápido enquanto o trabalho está concentrado na engine.
- Quando entrar, o primeiro E2E terá alto valor: **uma partida completa do início ao fim**
  exercita interface, estado, IA e engine numa única passagem.

**Negativas**

- Durante as Ondas 1 e 2 não haverá rede de segurança automatizada para a interface.
- Existe o risco de "depois" nunca chegar. Mitigação: o Playwright deve entrar como item
  explícito da Onda 3 no `roadmap.md`, não como intenção vaga.

**Neutras**

- A decisão não afeta o desenho do código. É de sequenciamento, e por isso barata de mudar:
  se a interface amadurecer antes do previsto, o Playwright pode entrar mais cedo sem custo
  algum.

## Alternativas consideradas

- **Playwright desde o início** — daria cobertura de interface mais cedo, mas contra telas
  provisórias. Testes E2E acoplados a uma interface instável são reescritos a cada mudança
  de layout, e o custo de manutenção ensina a equipe a desligá-los.
- **Nunca ter E2E** — rejeitada. A integração entre engine, estado, IA e interface só é
  exercitada de verdade num teste que joga uma partida real. Nenhum teste unitário cobre isso.
