# ADR-0007 — TypeScript estrito com indexação verificada

- **Status:** Aceita
- **Data:** 2026-07-31
- **Relacionada a:** tarefa 0.1 do [roadmap.md](../roadmap.md)

## Contexto

O domínio deste projeto é **denso em coleções indexadas**. `monte`, `lixo`, `mao`, `mortos` e
as `posicoes` de um `Jogo` são todos arranjos que o código acessa por índice o tempo todo
([domain.md](../domain.md) §5).

E o esvaziamento dessas coleções **não é caso de erro — é regra do jogo**:

- **R4.5** — lixo vazio muda as opções de compra
- **R4.6 e R4.8** — monte esgotado converte um morto ou encerra a rodada
- **R9.2** — mão vazia dispara a entrega do morto

Por padrão, o TypeScript tipa `monte[0]` como `Carta`, mesmo quando o monte está vazio e o
valor real é `undefined`. Ou seja: exatamente nas situações que mais importam para as regras,
o tipo mente.

Verificação feita ao configurar o projeto: o TypeScript 6 já liga `strict` por padrão —
`noImplicitAny` e `strictNullChecks` rejeitaram código de teste sem nenhuma configuração. Mas
`noUncheckedIndexedAccess` **não** faz parte de `strict`, e continua desligado.

## Decisão

Em `tsconfig.app.json` e `tsconfig.node.json`:

- `"strict": true` — explícito, embora já seja o padrão do TS 6
- `"noUncheckedIndexedAccess": true`

Com isso, `monte[0]` passa a ter tipo `Carta | undefined`, e o compilador exige o tratamento.

## Consequências

**Positivas**

- O compilador passa a **exigir** o tratamento dos casos que R4.5, R4.6, R4.8 e R9.2 já
  determinam. A regra deixa de depender de alguém lembrar dela.
- Pega em tempo de compilação uma classe de defeito que só apareceria em partida real, e
  provavelmente numa borda rara — justamente as que a H14 existe para cobrir.
- `strict` explícito torna a garantia independente do padrão da versão do compilador.

**Negativas**

- **Atrito real e permanente.** Toda indexação passa a exigir verificação, desestruturação
  com valor padrão, ou um método que já retorne o tipo correto. Isso aparece em todo o código
  da engine, não em pontos isolados.
- Existe a tentação de anular a verificação com `!` (asserção de não-nulo). Se isso virar
  hábito, o ADR passa a ser decorativo: o compilador cala e o defeito volta.

**Neutras**

- Tornar `strict` explícito não muda comportamento algum hoje, já que é o padrão do TS 6.

## Alternativas consideradas

- **Não ligar, e confiar nos testes.** Os testes de regra cobririam os casos de coleção vazia
  que alguém pensou em escrever. `noUncheckedIndexedAccess` cobre também os que ninguém
  pensou, que são precisamente os perigosos. Rejeitada.
- **Ligar mais tarde, quando a engine existir.** Rejeitada por custo: ligar depois produziria
  dezenas de erros de uma vez, num momento em que a pressão é implementar história, e a saída
  fácil seria espalhar `!` pelo código. Agora o custo é zero, porque não há código.

## Desdobramento para a tarefa 0.3

A tarefa 0.3 do [roadmap.md](../roadmap.md) configura o ESLint. Ela precisa **proibir a
asserção de não-nulo** (`@typescript-eslint/no-non-null-assertion`), com exceção pontual e
justificada.

Sem essa regra, este ADR é facilmente contornável: `monte[0]!` compila e devolve o
comportamento antigo, sem aviso.

## Nota para o futuro

Se este ADR estiver sendo lido porque `noUncheckedIndexedAccess` está incomodando: o
incômodo é o mecanismo funcionando. Ele foi ligado porque coleção vazia **é regra do jogo**
neste domínio, não caso excepcional.

A resposta correta ao atrito é criar funções de acesso que já devolvam o tipo certo — por
exemplo, uma consulta de topo do monte que retorne `Carta | undefined` e obrigue quem chama a
decidir — não desligar a flag nem espalhar `!`.
