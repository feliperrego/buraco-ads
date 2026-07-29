# Documentação

Este projeto é desenvolvido por **Spec-Driven Development**: nenhum código nasce sem uma
especificação escrita antes dele.

A documentação se divide em dois tipos, e a distinção importa:

- **Documentos de fundação** — mudam devagar. Respondem *por que* e *o quê*.
- **Specs de fatia** — mudam rápido. Respondem *como esta funcionalidade se comporta*.
  Nascem, viram código e testes, e passam a ser histórico.

## Ordem de escrita

Cada onda consome a anterior como entrada. Não escrevemos uma onda antes da anterior
estar aprovada.

### Onda 0 — Fundação

| Documento | Propósito | Status |
|---|---|---|
| [vision.md](vision.md) | Por que o produto existe, para quem, e o que ele **não** é | Escrito |
| [glossary.md](glossary.md) | Linguagem ubíqua: o vocabulário do Buraco que o código vai usar | Escrito |
| rules.md | Regras do jogo. **Fonte única de verdade do domínio** | Pendente |
| requirements.md | Requisitos funcionais e não-funcionais do produto | Pendente |

### Onda 1 — Modelagem

| Documento | Propósito | Status |
|---|---|---|
| domain.md | Entidades, agregados, invariantes, máquina de estados | Pendente |
| architecture.md | Camadas, fronteiras e regra de dependência | Pendente |

### Onda 2 — Experiência

| Documento | Propósito | Status |
|---|---|---|
| user-stories.md | Fatias verticais de valor | Pendente |
| screens.md | Telas, fluxos e estados de interface | Pendente |
| acceptance-tests.md | Critérios de aceite em Given/When/Then | Pendente |

### Onda 3 — Execução

| Documento | Propósito | Status |
|---|---|---|
| testing-strategy.md | O que testar, em que nível, e por quê | Pendente |
| roadmap.md | Ordem de entrega e marcos | Pendente |
| `specs/` | Uma spec por fatia — é aqui que o ciclo SDD roda | Pendente |

## Decisões

[`decisions/`](decisions/) guarda os ADRs (*Architecture Decision Records*). São
**append-only**: uma decisão tomada não se apaga, se supersede por outra.

| ADR | Decisão |
|---|---|
| [0001](decisions/0001-variante-buraco-aberto.md) | Adotar Buraco Aberto como variante de referência |
| [0002](decisions/0002-formato-individual-1v1.md) | Formato 1 contra 1 na v1 |
| [0003](decisions/0003-canastras-especiais-500-1000.md) | Incluir as canastras de 500 e de 1000 (emenda o 0001) |
