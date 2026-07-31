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

### Onda 0 — Fundação ✅ completa

| Documento | Propósito | Status |
|---|---|---|
| [vision.md](vision.md) | Por que o produto existe, para quem, e o que ele **não** é | Escrito |
| [glossary.md](glossary.md) | Linguagem ubíqua: o vocabulário do Buraco que o código vai usar | Escrito |
| [rules.md](rules.md) | Regras do jogo. **Fonte única de verdade do domínio** | Confirmado |
| [requirements.md](requirements.md) | Requisitos funcionais e não-funcionais do produto | Confirmado |

### Onda 1 — Modelagem ✅ completa

| Documento | Propósito | Status |
|---|---|---|
| [domain.md](domain.md) | Entidades, agregados, invariantes, máquina de estados | Confirmado |
| [architecture.md](architecture.md) | Camadas, fronteiras e regra de dependência | Confirmado |

### Onda 2 — Experiência ✅ completa

| Documento | Propósito | Status |
|---|---|---|
| [user-stories.md](user-stories.md) | Fatias verticais de valor | Confirmado |
| [screens.md](screens.md) | Telas, fluxos e estados de interface | Confirmado |
| [acceptance-tests.md](acceptance-tests.md) | Critérios de aceite em Given/When/Then | Confirmado |

### Onda 3 — Execução

| Documento | Propósito | Status |
|---|---|---|
| [testing-strategy.md](testing-strategy.md) | O que testar, em que nível, e por quê | Confirmado |
| [roadmap.md](roadmap.md) | Ordem de entrega e marcos | Confirmado |

## Specs de fatia

[`specs/`](specs/) é onde o ciclo SDD roda por funcionalidade em vez de por documento. Uma
spec por história, escrita antes do código dela.

Diferente dos documentos acima, uma spec é **descartável**: quando a história está pronta e
testada, os testes passam a ser a especificação viva.

| Spec | História | Status |
|---|---|---|
| [0001-mesa-inicial.md](specs/0001-mesa-inicial.md) | H1 — mesa inicial | Rascunho anotado |

## Verificação

[`scripts/verificar-rastreabilidade.py`](../scripts/verificar-rastreabilidade.py) confere as
relações de rastreabilidade e falha o CI se alguma quebrar: toda regra citada por alguma
história, nenhuma história citando regra inexistente, nenhum critério citando regra
inexistente.

```bash
python3 scripts/verificar-rastreabilidade.py
```

A configuração fica em [`rastreio.json`](../rastreio.json) na raiz: qual arquivo define os
itens numerados, com que padrão, e quais documentos os citam. O script é genérico — a mesma
ferramenta serve para requisitos, endpoints ou qualquer conjunto de itens identificados.

## Decisões

[`decisions/`](decisions/) guarda os ADRs (*Architecture Decision Records*). São
**append-only**: uma decisão tomada não se apaga, se supersede por outra.

| ADR | Decisão |
|---|---|
| [0001](decisions/0001-variante-buraco-aberto.md) | Adotar Buraco Aberto como variante de referência |
| [0002](decisions/0002-formato-individual-1v1.md) | Formato 1 contra 1 na v1 |
| [0003](decisions/0003-canastras-especiais-500-1000.md) | Incluir as canastras de 500 e de 1000 (emenda o 0001) |
| [0004](decisions/0004-remover-tanstack-query.md) | Remover o TanStack Query da stack |
| [0005](decisions/0005-manter-tanstack-router.md) | Manter o TanStack Router |
| [0006](decisions/0006-playwright-na-onda-3.md) | Playwright entra na Onda 3 |
