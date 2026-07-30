# ADR-0004 — Remover o TanStack Query da stack

- **Status:** Aceita
- **Data:** 2026-07-29
- **Relacionada a:** [architecture.md](../architecture.md) A11

## Contexto

O TanStack Query constava da stack definida no início do projeto. Ele resolve um conjunto
específico de problemas: cache de respostas de servidor, revalidação, deduplicação de
requisições, estados de carregamento e erro, e sincronização entre abas.

Todos pressupõem **estado de servidor** — dados cuja fonte de verdade está em outro lugar e
que podem ficar obsoletos.

A v1 não tem nada disso:

- RNF4.1 — sem backend, sem banco de dados, sem contas
- RNF4.2 — nenhuma telemetria; nada sai do navegador
- [vision.md §4](../vision.md) — multiplayer e persistência estão fora de escopo

O estado da partida vive em memória, é imutável e tem fonte de verdade local
([domain.md](../domain.md) M8). Não existe nada para cachear nem para revalidar.

## Decisão

O TanStack Query **sai da stack**. O estado de aplicação fica em `useReducer` + Context
(A6), consumindo a engine diretamente.

## Consequências

**Positivas**

- Uma dependência menos no bundle, sem funcionalidade perdida.
- Elimina um risco concreto: uma biblioteca de estado de servidor presente no projeto
  acabaria sendo usada para estado local, produzindo uma camada de cache sobre dados que já
  estão em memória — indireção pura.
- A decisão passa a ser examinada em vez de herdada.

**Negativas**

- Se multiplayer entrar no escopo, o TanStack Query terá de ser reintroduzido e a camada de
  estado, revisada.

**Neutras**

- A reintrodução é barata justamente por causa de A6: a engine é pura e não sabe quem a
  chama, então a troca fica contida em `estado/`.

## Alternativas consideradas

- **Manter por precaução** — rejeitada. Manter uma abstração à espera de um problema que
  talvez nunca venha é a definição de complexidade especulativa. Quando o problema chegar,
  ele trará os requisitos concretos que a configuração correta precisa.
- **Manter apenas para estado local** — rejeitada. É usar a ferramenta fora do propósito, e
  `useReducer` faz melhor com menos.

## Nota para o futuro

Se este ADR estiver sendo lido porque multiplayer entrou no escopo: o motivo da remoção foi
**ausência de servidor**, não qualquer objeção à biblioteca. Passando a existir servidor, a
premissa cai e a reintrodução é a decisão correta.
