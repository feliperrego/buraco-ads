# Regras — Buraco Aberto, 1 contra 1

> Status: **rascunho anotado** — 24 pendências na seção 13
> Escopo: [ADR-0001](decisions/0001-variante-buraco-aberto.md), [ADR-0002](decisions/0002-formato-individual-1v1.md), [ADR-0003](decisions/0003-canastras-especiais-500-1000.md)
> Vocabulário: [glossary.md](glossary.md)
> Última atualização: 2026-07-29

## Como ler este documento

Este é o documento **normativo** do projeto. Não é cópia de nenhuma fonte externa: onde as
fontes divergem, nós decidimos e registramos.

**Regra de ouro: se não está aqui, não existe no código.**

Cada regra tem um identificador estável (`R4.2`) que os testes da engine devem citar:

```
✓ R5.4 — sequencia com dois curingas e invalida
```

Quando um teste quebra, o identificador diz qual regra foi violada. Quando uma regra muda,
`grep -r "R5.4"` acha tudo que depende dela.

Cada regra declara sua **origem**:

| Marca | Significado |
|---|---|
| `[F]` | Vem das fontes pesquisadas, com convergência entre elas |
| `[D]` | Decisão já tomada por você, registrada em ADR ou no glossário |
| `[P]` | **Proposta minha, ainda não confirmada.** Sempre acompanhada de `⚠️ Pn` |

Nenhuma regra `[P]` pode virar código antes de ser confirmada.

---

## R1 — Componentes

- **R1.1** `[D]` A partida usa **104 cartas**: dois baralhos franceses de 52, sem Curingão.
- **R1.2** `[D]` Quatro naipes (Copas, Ouros, Espadas, Paus) e treze valores (A, 2–10, J, Q, K). Cada combinação naipe+valor existe **duas vezes**.
- **R1.3** `[D]` O **2** é o único curinga. Um 2 empregado na sua posição natural dentro de uma sequência do próprio naipe (ex.: `A-2-3` de copas) é carta natural, não curinga.
- **R1.4** `[P]` ⚠️ **P1** — Um mesmo jogo pode conter **no máximo um curinga**.

---

## R2 — Preparação da rodada

- **R2.1** `[F]` As 104 cartas são embaralhadas.
- **R2.2** `[D]` Cada jogador recebe **11 cartas** na mão.
- **R2.3** `[D]` São formados **dois mortos de 11 cartas** cada, virados para baixo. Cada jogador tem direito a **um**, não há disputa.
- **R2.4** `[P]` ⚠️ **P2** — A rodada começa com o **lixo vazio**. Nenhuma carta é virada na preparação.
- **R2.5** `[F]` As cartas restantes formam o **monte**, virado para baixo. Decorre de R2.2–R2.4: `104 − 22 − 22 = 60` cartas.
- **R2.6** `[P]` ⚠️ **P3** — Na primeira rodada, o jogador inicial é **sorteado**. Nas rodadas seguintes, o início **alterna**.

---

## R3 — Estrutura do turno

- **R3.1** `[F]` Um turno tem três fases, nesta ordem: **comprar** (obrigatório) → **baixar e/ou aumentar** (opcional) → **descartar** (obrigatório).
- **R3.2** `[P]` ⚠️ **P4** — Não é permitido baixar ou aumentar **antes** de comprar.
- **R3.3** `[P]` ⚠️ **P5** — Na fase de baixar/aumentar, o jogador pode realizar **quantas ações quiser**, em qualquer ordem.
- **R3.4** `[P]` ⚠️ **P6** — **Não existe pontuação mínima para a primeira descida.** O jogador pode baixar seu primeiro jogo a qualquer momento, sem valor mínimo acumulado.

> P6 é uma diferença importante em relação à Canasta americana, que exige um mínimo
> crescente para a descida inicial. As fontes brasileiras não mencionam tal exigência
> para o Buraco, mas a ausência de menção não é confirmação.

---

## R4 — Compra

- **R4.1** `[F]` No início do turno o jogador escolhe **uma** das duas opções, exclusivamente: comprar **uma carta do monte**, ou **pegar o lixo**.
- **R4.2** `[D]` Ao pegar o lixo, o jogador leva **todas** as cartas dele para a mão. Nunca uma parte.
- **R4.3** `[D]` No Buraco Aberto **todas as cartas do lixo são visíveis** a ambos os jogadores durante toda a rodada.
- **R4.4** `[P]` ⚠️ **P7** — **Não há condição para pegar o lixo.** O jogador não precisa justificar a compra usando a carta do topo. (Essa exigência é do Buraco Fechado.)
- **R4.5** `[P]` ⚠️ **P8** — Se o lixo estiver **vazio**, a única opção é comprar do monte.
- **R4.6** `[P]` ⚠️ **P9** — Se o **monte acabar**, a rodada termina imediatamente, sem batida. A pontuação é apurada normalmente (R11), e ambos os jogadores sofrem as penalidades cabíveis.

> P9 é um caso de borda que precisa de decisão explícita. A alternativa comum é
> reembaralhar o lixo para formar um novo monte — mas no Buraco Aberto isso destruiria a
> informação pública acumulada no lixo, que é a característica central da variante.

---

## R5 — Sequências

- **R5.1** `[D]` Um **jogo** é sempre uma **sequência**: três ou mais cartas do **mesmo naipe** em ordem consecutiva. Não existe trinca.
- **R5.2** `[D]` A ordem dos valores é `A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A`. O Ás pode ocupar **as duas pontas** da mesma sequência.
- **R5.3** `[D]` A sequência **termina no Ás alto e não continua além dele**. Portanto `K-A-2` é inválida, e o tamanho máximo de uma sequência é **14 cartas**.
- **R5.4** `[P]` ⚠️ **P1** (mesma decisão de R1.4) — Uma sequência com dois ou mais curingas é inválida.
- **R5.5** `[P]` ⚠️ **P10** — O curinga pode ocupar **qualquer posição** da sequência, inclusive as pontas.
- **R5.6** `[P]` ⚠️ **P11** — Uma sequência não pode conter duas cartas de mesmo valor, **com uma exceção**: os dois Ases de uma sequência de 14 cartas (`A…K-A`), que ocupam pontas distintas.

---

## R6 — Baixar e aumentar

- **R6.1** `[F]` **Baixar** é colocar um jogo novo na mesa. O jogo deve ser válido no momento em que é baixado (R5).
- **R6.2** `[D]` **Aumentar** é acrescentar cartas a um jogo já na mesa. O jogador só pode aumentar os **próprios** jogos, nunca os do adversário.
- **R6.3** `[P]` ⚠️ **P12** — É permitido aumentar um jogo que já é canastra, até o limite de 14 cartas (R5.3).
- **R6.4** `[P]` ⚠️ **P13** — **Não é permitido reorganizar** cartas já baixadas: nem mover cartas entre jogos próprios, nem dividir um jogo em dois.
- **R6.5** `[P]` ⚠️ **P14** — É permitido **substituir o curinga** de um jogo pela carta natural que ele representa, desde que o jogador tenha essa carta na mão. O curinga liberado volta para a mão do jogador e pode ser reutilizado no mesmo turno.

> P14 é a regra que permite "limpar" uma canastra suja, promovendo-a de 100 para 200
> pontos. É uma das decisões táticas mais interessantes do jogo — e uma das que mais
> complicam a engine, porque torna a classificação de uma canastra mutável ao longo da
> rodada.

---

## R7 — Descarte

- **R7.1** `[F]` O turno termina com o jogador colocando **exatamente uma carta** da mão no lixo.
- **R7.2** `[P]` ⚠️ **P15** — O jogador pode descartar qualquer carta da mão, inclusive uma que tenha acabado de comprar ou de pegar do lixo no mesmo turno.
- **R7.3** `[P]` ⚠️ **P16** — O descarte é obrigatório **exceto na batida**, quando o jogador pode encerrar a rodada baixando ou aumentando com todas as cartas restantes, sem descartar.

---

## R8 — Canastras

- **R8.1** `[D]` Uma **canastra** é um jogo que atingiu **sete ou mais cartas**.
- **R8.2** `[D]` Existem quatro categorias, **mutuamente exclusivas**:

| Categoria | Definição | Pontos |
|---|---|---|
| `DE_1000` | Sequência de Ás a Ás — 14 cartas | 1000 |
| `DE_500` | Sequência de Ás a Rei — 13 cartas | 500 |
| `LIMPA` | 7+ cartas, só naturais | 200 |
| `SUJA` | 7+ cartas, contém curinga | 100 |

- **R8.3** `[P]` ⚠️ **P17** — A classificação segue a **precedência da tabela, de cima para baixo**: avalia-se `DE_1000`, depois `DE_500`, depois `LIMPA`, depois `SUJA`. A primeira que casar é a categoria da canastra.
- **R8.4** `[P]` ⚠️ **P18** — As canastras especiais **admitem curinga**. Uma sequência de Ás a Rei com um curinga ainda vale 500.
- **R8.5** `[P]` ⚠️ **P19** — A categoria é **recalculada continuamente**, não fixada no momento em que a canastra se forma. Uma canastra suja que tem o curinga substituído (R6.5) passa a valer como limpa.

> Sem P17 explícito, a pontuação passa a depender da ordem dos `if` na implementação — um
> bug silencioso que nenhum teste pegaria por acaso. É exatamente o tipo de ambiguidade
> que uma especificação existe para eliminar.

---

## R9 — Morto

- **R9.1** `[D]` Cada jogador tem **um** morto de 11 cartas, exclusivo.
- **R9.2** `[P]` ⚠️ **P20** — O jogador pega o próprio morto no instante em que fica **sem cartas na mão**, seja após baixar, aumentar ou descartar.
- **R9.3** `[P]` ⚠️ **P21** — Ao pegar o morto, o **turno do jogador termina imediatamente**. Ele não joga com as cartas do morto no mesmo turno.
- **R9.4** `[F]` Um jogador só pode **bater** depois de ter pegado seu morto (R10.1).
- **R9.5** `[F]` Terminar a rodada sem ter pegado o morto acarreta penalidade (R11.5).

> P20 e P21 formam o par mais delicado desta especificação. Se o jogador fica sem cartas
> ao **baixar** (antes de descartar), ele pega o morto e o turno acaba sem descarte — ou
> ele ainda precisa descartar? A decisão muda completamente a dinâmica do fim da rodada.

---

## R10 — Batida

- **R10.1** `[D]` Um jogador **bate** ao ficar sem cartas na mão, cumpridas duas condições: já ter pegado seu morto, **e** possuir ao menos uma canastra **limpa** na mesa.
- **R10.2** `[P]` ⚠️ **P22** — Para efeito de R10.1, as canastras `DE_500` e `DE_1000` **sem curinga** contam como limpas; com curinga, não contam.
- **R10.3** `[F]` A batida **encerra a rodada imediatamente**. O adversário não joga mais nenhum turno.
- **R10.4** `[P]` ⚠️ **P16** (mesma decisão de R7.3) — A batida pode ocorrer com ou sem descarte final.

---

## R11 — Pontuação da rodada

Ao fim da rodada, cada jogador apura seu saldo somando os itens abaixo.

- **R11.1** `[D]` **Canastras**: conforme a tabela de R8.2, aplicando a precedência de R8.3.
- **R11.2** `[P]` ⚠️ **P23** — **Valor individual das cartas**:

| Carta | Pontos |
|---|---|
| Ás | 15 |
| 8, 9, 10, J, Q, K | 10 |
| 3, 4, 5, 6, 7 | 5 |
| 2 (curinga) | 10 |

> O valor do 2 é o único ponto em que as fontes não convergem. Propus 10, alinhado à faixa
> das figuras. Se você joga com outro valor, é este item que precisa mudar.

- **R11.3** `[F]` Cartas **baixadas na mesa** contam **positivo**. Cartas que sobraram **na mão** contam **negativo**.
- **R11.4** `[P]` ⚠️ **P24** — Quem bate recebe **+100 pontos** de bônus.
- **R11.5** `[F]` Quem termina a rodada **sem ter pegado o morto** recebe **−100 pontos**.
- **R11.6** `[P]` ⚠️ **P25** — O saldo de uma rodada **pode ser negativo**, e o total acumulado da partida também.

---

## R12 — Fim da partida

- **R12.1** `[D]` A partida termina quando um jogador atinge **3000 pontos** acumulados.
- **R12.2** `[P]` ⚠️ **P26** — A verificação ocorre **ao fim de cada rodada**, nunca no meio. Se ambos os jogadores ultrapassarem 3000 na mesma rodada, vence quem tiver **mais pontos**. Em caso de empate exato, joga-se **mais uma rodada**.

---

## 13. Pendências

As 26 propostas `[P]` acima, agrupadas por tema. Pode responder por número — *"todas ok
exceto P9 e P23"* é uma resposta completa.

| # | Regra | Proposta |
|---|---|---|
| **P1** | R1.4, R5.4 | No máximo **um curinga** por jogo |
| **P2** | R2.4 | Rodada começa com o **lixo vazio** |
| **P3** | R2.6 | Primeiro jogador sorteado; depois **alterna** |
| **P4** | R3.2 | Não pode baixar antes de comprar |
| **P5** | R3.3 | Quantas descidas/aumentos quiser por turno |
| **P6** | R3.4 | **Sem pontuação mínima** para a primeira descida |
| **P7** | R4.4 | Pegar o lixo **não exige justificativa** |
| **P8** | R4.5 | Lixo vazio → só resta o monte |
| **P9** | R4.6 | **Monte acabou → rodada termina** (não reembaralha o lixo) |
| **P10** | R5.5 | Curinga em qualquer posição, inclusive pontas |
| **P11** | R5.6 | Sem valores repetidos, exceto os dois Ases da sequência de 14 |
| **P12** | R6.3 | Pode aumentar canastra até 14 cartas |
| **P13** | R6.4 | **Não pode reorganizar** cartas já baixadas |
| **P14** | R6.5 | **Pode trocar o curinga** pela carta natural e reutilizá-lo |
| **P15** | R7.2 | Pode descartar carta comprada no mesmo turno |
| **P16** | R7.3, R10.4 | Descarte obrigatório **exceto na batida** |
| **P17** | R8.3 | Precedência `DE_1000 → DE_500 → LIMPA → SUJA` |
| **P18** | R8.4 | Canastras especiais **admitem** curinga |
| **P19** | R8.5 | Categoria **recalculada continuamente** |
| **P20** | R9.2 | Pega o morto **assim que** fica sem cartas |
| **P21** | R9.3 | Pegar o morto **encerra o turno** |
| **P22** | R10.2 | Especiais sem curinga contam como limpa para bater |
| **P23** | R11.2 | Ás 15 · figuras e 8–10 valem 10 · 3–7 valem 5 · **2 vale 10** |
| **P24** | R11.4 | Bônus de **+100** para quem bate |
| **P25** | R11.6 | Saldo **pode ser negativo** |
| **P26** | R12.2 | Verificação ao fim da rodada; empate → mais uma rodada |

### Os cinco que mais importam

Se você quiser revisar só uma parte, revise estes — são os que mais afetam o desenho da
engine:

- **P20 e P21** (morto) — definem como a rodada termina
- **P14 e P19** (limpar canastra) — tornam a classificação mutável ao longo da rodada
- **P9** (monte esgotado) — caso de borda que, se ficar indefinido, trava a engine
