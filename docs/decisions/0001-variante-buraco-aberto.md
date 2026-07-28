# ADR-0001 — Adotar Buraco Aberto como variante de referência

- **Status:** Aceita
- **Data:** 2026-07-28

## Contexto

Buraco (também chamado Canastra, conforme a região do Brasil) possui variantes com
regras genuinamente diferentes — não são detalhes cosméticos, elas alteram o modelo de
domínio. As principais são **Buraco Aberto**, **Buraco Fechado** e **STBL**.

Diferenças relevantes levantadas na pesquisa inicial:

| Eixo | Aberto | Fechado |
|---|---|---|
| Baralho | 104 cartas (sem Curingão) | 108 cartas (com Curingão) |
| Descarte | Todo visível | Só o topo; compra exige justificativa |
| Tipos de jogo | Só sequência do mesmo naipe | Sequência e trinca |
| Batida final | Exige canastra limpa | Basta canastra suja |

Sem escolher uma variante, é impossível escrever `rules.md`, e sem `rules.md` não há
como modelar o domínio nem escrever testes.

## Decisão

A v1 implementa **Buraco Aberto**. `rules.md` especifica esta variante e apenas ela.

## Consequências

**Positivas**

- Superfície de regras aproximadamente metade da do Fechado: sem trinca, sem Curingão,
  sem canastra de 500/1000. Menos entidades, menos invariantes, menos casos de teste.
- O descarte totalmente visível elimina, para a IA, a necessidade de inferir informação
  oculta sobre a pilha.
- Um único tipo de jogo baixado (sequência do mesmo naipe) simplifica bastante a
  validação de jogadas.

**Negativas**

- O Buraco Fechado é amplamente jogado; parte do público esperaria trincas e Curingão.
- O descarte visível aumenta o espaço de decisão da IA ao avaliar a compra da pilha,
  já que ela conhece todas as cartas em jogo ali.

**Neutras**

- Suportar outras variantes depois exigirá tornar as regras configuráveis. Isso **não**
  será antecipado: só faremos quando existir uma segunda variante real a implementar
  (YAGNI). A engine deve, porém, manter as regras isoladas o suficiente para que essa
  evolução não vire reescrita.

## Alternativas consideradas

- **Buraco Fechado** — mais completo e popular, porém aproximadamente o dobro de regras
  a especificar e testar antes de existir qualquer partida jogável.
- **STBL** — variante competitiva, a menos documentada das três; risco alto de
  especificarmos com base em fontes fracas.
- **Suportar várias variantes desde o início** — rejeitada por YAGNI: adiciona abstração
  antes de existir um caso concreto funcionando.

## Nota sobre as fontes

As fontes públicas consultadas são sites comerciais de jogos e **divergem entre si em
pontos de detalhe**. Por isso `rules.md` não será cópia de nenhuma delas: será nossa
especificação normativa. Onde as fontes divergirem, nós decidimos e registramos o motivo.
