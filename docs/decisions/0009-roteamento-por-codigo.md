# ADR-0009 — Roteamento por código, não por arquivos

- **Status:** Aceita
- **Data:** 2026-07-31
- **Relacionada a:** [architecture.md](../architecture.md) A7 · [ADR-0005](0005-manter-tanstack-router.md) · [roadmap.md](../roadmap.md) §1 tarefa 0.7

## Contexto

O roteamento por arquivos é o padrão **recomendado** pela documentação do TanStack Router, e
é o que qualquer pessoa encontra ao procurar como começar. Escolher o contrário exige
justificativa registrada, senão vira algo que alguém "corrige" no futuro sem saber por quê.

Dois fatos do projeto pesam contra o padrão:

**A A7 já decidiu onde as rotas moram.** A estrutura de `src/` espelha as camadas, e as rotas
ficam em `src/ui/rotas/`. O plugin de arquivos quer mandar num diretório e gerar um
`routeTree.gen.ts` — um arquivo de build que é commitado, e que precisaria virar exceção no
Prettier, no ESLint e na cobertura.

**São quatro rotas, estáticas, definidas desde a Onda 2.** [screens.md](../screens.md) §1 as
fixou: inicial, partida, fim de partida e regras. Não há rota dinâmica, não há rota criada com
frequência, e a RD2 as cria vazias.

## Decisão

As rotas são declaradas **por código**, com `createRootRoute` e `createRoute`, num único
arquivo em `src/ui/rotas/`. Sem plugin de Vite e sem arquivo gerado.

## Consequências

**Positivas**

- **Zero exceções de ferramenta.** Nada a excluir do Prettier, do ESLint ou da cobertura.
- **A A7 continua valendo sem negociação.** O arquivo fica onde a arquitetura mandou.
- **A árvore de rotas é legível num lugar só** — hoje, com quatro rotas, cabe numa tela.
- **Uma dependência de build a menos**, e portanto uma coisa a menos que pode quebrar em
  atualização do Vite.

**Negativas**

- **Diverge do caminho recomendado.** Qualquer tutorial, exemplo ou resposta de fórum sobre
  TanStack Router assume arquivos. Quem chegar ao projeto vindo da documentação vai estranhar.
- **A árvore cresce à mão.** Cada rota nova é três lugares: a declaração, o `addChildren` e o
  teste. Com arquivos, seria criar um arquivo.
- **Perde-se a divisão de código automática por rota**, que o plugin faz sozinho. Irrelevante
  hoje — o bundle é um jogo de cartas sem imagens pesadas — mas é uma otimização que teríamos
  de fazer à mão se um dia importar.

**Neutras**

- A migração para arquivos, se acontecer, é mecânica: os componentes já existem, mudariam de
  lugar. O custo está no plugin e nas exceções, não no código das rotas.

## Alternativas consideradas

- **Roteamento por arquivos, com `routesDirectory` apontando para `src/ui/rotas/`** — resolve
  o conflito com a A7, já que o diretório é configurável. Rejeitada mesmo assim pelo
  `routeTree.gen.ts`: um artefato gerado e versionado, com três exceções de ferramenta, para
  quatro rotas que já estão definidas há duas ondas. A invariante 3 pede simplicidade até
  existir caso concreto.
- **Adiar e usar renderização condicional** — rejeitada pelo [ADR-0005](0005-manter-tanstack-router.md),
  que já avaliou e descartou tirar o roteador.

## Nota para o futuro

Se este ADR estiver sendo lido porque as rotas se multiplicaram ou ficaram dinâmicas: o motivo
da decisão foi **serem quatro e estáticas**, não qualquer objeção ao roteamento por arquivos.
Caindo essa premissa, migrar é o caminho correto — e o custo é baixo, porque os componentes de
rota já existem prontos.

O gatilho está registrado em [roadmap.md](../roadmap.md) §3.
