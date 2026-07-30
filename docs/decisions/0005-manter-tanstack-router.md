# ADR-0005 — Manter o TanStack Router

- **Status:** Aceita
- **Data:** 2026-07-29
- **Relacionada a:** [architecture.md](../architecture.md) A12

## Contexto

No primeiro dia do projeto eu levantei o TanStack Router como possível excesso, ao lado do
TanStack Query: um jogo de cartas passa quase todo o tempo numa única tela, e um roteador
para duas telas seria complexidade sem problema correspondente.

Ao escrever [requirements.md](../requirements.md), a avaliação mudou.

## Decisão

O TanStack Router **permanece** na stack.

## Consequências

**Positivas**

- **São quatro telas, não duas:** inicial (RF1.2), partida, fim de partida (RF1.5) e uma
  tela de regras. Num jogo cujas regras têm 65 itens, a tela de regras é conteúdo de
  verdade, não enfeite.
- **RF1.3 e RF1.4 são bloqueio de navegação.** Confirmar antes de abandonar a partida e
  avisar antes de fechar ou recarregar a janela são exatamente o problema que os *blockers*
  de rota resolvem. Sem roteador, isso vira código manual em dois lugares, com risco de
  divergirem.
- **É a decisão menos reversível das três de stack.** Adicionar roteador depois obriga a
  reescrever a navegação; remover depois é apagar arquivos.

**Negativas**

- É a justificativa mais fraca da stack. Quatro telas estáticas podem ser servidas por um
  estado local e uma renderização condicional.
- Deep linking não tem valor real aqui: sem persistência (RNF1.4), uma URL não consegue
  restaurar uma partida.

**Neutras**

- Se as telas de regras e de fim de partida forem absorvidas pela tela de partida, a
  justificativa enfraquece. Nesse caso, este ADR deve ser reavaliado.

## Alternativas consideradas

- **Remover o roteador** — dois ou três estados locais e renderização condicional. Mais
  simples hoje, mas joga RF1.3 e RF1.4 para implementação manual e cobra caro se surgir uma
  quinta tela.
- **Adiar a decisão** — rejeitada. Justamente por ser a mudança menos reversível, adiar é a
  pior opção: seria decidir por omissão.

## Nota de processo

Este ADR registra uma **mudança de opinião minha**, não uma decisão nova. A suspeita inicial
foi levantada antes de os requisitos existirem, e caiu quando RF1.3 e RF1.4 apareceram.

Vale como exemplo de por que a ordem das ondas importa: uma decisão de stack tomada antes dos
requisitos é palpite. O erro não foi levantar a suspeita — foi que ela só podia ser resolvida
depois.
