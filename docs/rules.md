# Regras — Buraco Aberto, 1 contra 1

> Status: **confirmado** — 33 propostas resolvidas, nenhuma pendência
> Pronto para servir de base ao `domain.md` e aos testes da engine
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

Nenhuma regra `[P]` pode virar código antes de ser confirmada. **Não resta nenhuma** — o
histórico das 33 propostas originais está na seção 13. A marca permanece documentada porque
regras novas nascerão como `[P]`.

---

## R1 — Componentes

- **R1.1** `[D]` A partida usa **104 cartas**: dois baralhos franceses de 52, sem Curingão.
- **R1.2** `[D]` Quatro naipes (Copas, Ouros, Espadas, Paus) e treze valores (A, 2–10, J, Q, K). Cada combinação naipe+valor existe **duas vezes**.
- **R1.3** `[D]` O **2** é o único curinga. Um 2 empregado na sua posição natural dentro de uma sequência do próprio naipe (ex.: `A-2-3` de copas) é carta natural, não curinga.
- **R1.4** `[D]` Um mesmo jogo pode conter **no máximo um curinga**.

---

## R2 — Preparação da rodada

- **R2.1** `[F]` As 104 cartas são embaralhadas.
- **R2.2** `[D]` Cada jogador recebe **11 cartas** na mão.
- **R2.3** `[D]` São formados **dois mortos de 11 cartas** cada, virados para baixo. Os mortos **não têm dono**: formam um conjunto comum, e qualquer jogador pode pegar qualquer um deles. Um mesmo jogador pode pegar **os dois**, se esvaziar a mão duas vezes.
- **R2.4** `[D]` A rodada começa com o **lixo vazio**. Nenhuma carta é virada na preparação.
- **R2.5** `[F]` As cartas restantes formam o **monte**, virado para baixo. Decorre de R2.2–R2.4: `104 − 22 − 22 = 60` cartas.
- **R2.6** `[D]` Na primeira rodada, o jogador inicial é **sorteado**. Nas rodadas seguintes, o início **alterna**.

---

## R3 — Estrutura do turno

- **R3.1** `[F]` Um turno tem três fases, nesta ordem: **comprar** (obrigatório) → **baixar e/ou aumentar** (opcional) → **descartar** (obrigatório).
- **R3.2** `[D]` Não é permitido baixar ou aumentar **antes** de comprar.
- **R3.3** `[D]` Na fase de baixar/aumentar, o jogador pode realizar **quantas ações quiser**, em qualquer ordem.
- **R3.4** `[D]` **Não existe pontuação mínima para a primeira descida.** O jogador pode baixar seu primeiro jogo a qualquer momento, sem valor mínimo acumulado.

> R3.4 é uma diferença importante em relação à Canasta americana, que exige um mínimo
> crescente para a descida inicial. Confirmado em 2026-07-29.

---

## R4 — Compra

- **R4.1** `[F]` No início do turno o jogador escolhe **uma** das duas opções, exclusivamente: comprar **uma carta do monte**, ou **pegar o lixo**.
- **R4.2** `[D]` Ao pegar o lixo, o jogador leva **todas** as cartas dele para a mão. Nunca uma parte.
- **R4.3** `[D]` No Buraco Aberto **todas as cartas do lixo são visíveis** a ambos os jogadores durante toda a rodada. Sobre o que "visível" exige da interface, ver [screens.md](screens.md) T4: disponibilidade de informação, não tamanho de renderização.
- **R4.4** `[D]` **Não há condição para pegar o lixo.** O jogador não precisa justificar a compra usando a carta do topo. (Essa exigência é do Buraco Fechado.)
- **R4.5** `[D]` Se o lixo estiver **vazio**, a única opção é comprar do monte.
- **R4.6** `[D]` Se o **monte se esgotar** e ainda houver **morto não reclamado**, um desses mortos **passa a ser o novo monte**. As 11 cartas são viradas para baixo e a rodada continua normalmente.
- **R4.7** `[D]` Não há ambiguidade sobre *qual* morto é convertido: como os mortos não têm dono (R2.3), são intercambiáveis.
- **R4.8** `[D]` Se o monte se esgotar e **não houver morto disponível**, a rodada termina imediatamente, sem batida. A pontuação é apurada normalmente (R11).

> O lixo **nunca** é reembaralhado. No Buraco Aberto isso destruiria a informação pública
> acumulada nele, que é a característica central da variante.
>
> **Consequência importante:** um morto convertido em monte deixa de existir como morto.
> Quem ainda não tinha pegado morto pode ficar sem chance de pegar. Por isso as exigências
> ligadas ao morto são relaxadas nesse caso — ver R10.1 e R11.5.

---

## R5 — Sequências

- **R5.1** `[D]` Um **jogo** é sempre uma **sequência**: três ou mais cartas do **mesmo naipe** em ordem consecutiva. Não existe trinca.
- **R5.2** `[D]` A ordem dos valores é `A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A`. O Ás pode ocupar **as duas pontas** da mesma sequência.
- **R5.3** `[D]` A sequência **termina no Ás alto e não continua além dele**. Portanto `K-A-2` é inválida, e o tamanho máximo de uma sequência é **14 cartas**.
- **R5.4** `[D]` (mesma decisão de R1.4) — Uma sequência com dois ou mais curingas é inválida.
- **R5.5** `[D]` O curinga pode ocupar **qualquer posição** da sequência, inclusive as pontas.
- **R5.6** `[D]` Uma sequência não pode conter duas cartas de mesmo valor, **com uma exceção**: os dois Ases de uma sequência de 14 cartas (`A…K-A`), que ocupam pontas distintas.

---

## R6 — Baixar e aumentar

- **R6.1** `[F]` **Baixar** é colocar um jogo novo na mesa. O jogo deve ser válido no momento em que é baixado (R5).
- **R6.2** `[D]` **Aumentar** é acrescentar cartas a um jogo já na mesa. O jogador só pode aumentar os **próprios** jogos, nunca os do adversário.
- **R6.3** `[D]` É permitido aumentar um jogo que já é canastra, até o limite de 14 cartas (R5.3).
- **R6.4** `[D]` **Não é permitido reorganizar** cartas já baixadas: nem mover cartas entre jogos próprios, nem dividir um jogo em dois. A única exceção é R6.5.

### R6.5 — Regularizar o curinga ("limpar a canastra")

- **R6.5** `[D]` Um curinga já baixado **deixa de ser curinga** quando passa a ocupar sua **posição natural** na sequência. O curinga **permanece no jogo** — não volta para a mão.

Só é possível quando as três condições valem ao mesmo tempo:

1. **Mesmo naipe** — o curinga é o **2 do naipe da sequência**. Um 2 de outro naipe nunca pode ser regularizado.
2. **A sequência alcança a posição do 2** — o jogador estende a sequência até que ela contenha a casa entre o Ás e o 3 do naipe.
3. **A carta substituída é reposta** — a carta natural que o curinga representava é acrescentada ao jogo.

- **R6.6** `[D]` Reposicionar o curinga dentro do próprio jogo é permitido **exclusivamente** nesta operação. É a única exceção a R6.4.

> **Consequências desta regra:**
>
> - Uma canastra cujo curinga é de **naipe diferente** do da sequência é **permanentemente
>   suja**. Não há como limpá-la. Isso torna a escolha de *qual* 2 usar como curinga uma
>   decisão tática relevante desde o momento em que se baixa o jogo.
> - Regularizar exige estender a sequência até a região `A-2-3`, o que na prática só é
>   viável em sequências longas — as mesmas que caminham para `DE_500` e `DE_1000`.
> - Para a engine: a classificação de uma canastra **não pode ser um campo armazenado**.
>   Precisa ser uma função derivada do conteúdo do jogo, recalculada a cada alteração
>   (R8.5).

---

## R7 — Descarte

- **R7.1** `[F]` O turno termina com o jogador colocando **exatamente uma carta** da mão no lixo.
- **R7.2** `[D]` O jogador pode descartar qualquer carta da mão, inclusive uma que tenha acabado de comprar ou de pegar do lixo no mesmo turno.
- **R7.3** `[D]` O descarte é obrigatório **exceto na batida**, quando o jogador pode encerrar a rodada baixando ou aumentando com todas as cartas restantes, sem descartar.

> R7.3 dá ao turno **duas formas de terminar**: pelo descarte (caso normal) ou pela batida
> (caso terminal). A engine precisa modelar as duas — não é possível assumir que todo turno
> termina em descarte.

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

- **R8.3** `[D]` A classificação segue a **precedência da tabela, de cima para baixo**: avalia-se `DE_1000`, depois `DE_500`, depois `LIMPA`, depois `SUJA`. A primeira que casar é a categoria da canastra.
- **R8.4** `[D]` As canastras especiais **admitem curinga**. Uma sequência de Ás a Rei com um curinga ainda vale 500.
- **R8.5** `[D]` A categoria é **recalculada continuamente**, não fixada no momento em que a canastra se forma. Uma canastra suja cujo curinga é regularizado (R6.5) passa a valer como limpa. A categoria é uma **função derivada** do conteúdo do jogo, nunca um campo armazenado.
- **R8.6** `[D]` As categorias `DE_500` e `DE_1000` dependem da **posição** da sequência, não apenas do seu tamanho. `DE_500` exige **exatamente Ás a Rei**; `DE_1000` exige **Ás a Ás**. Uma sequência de 13 cartas que vá **do 2 ao Ás alto** (`2-3-…-K-A`) **não é** `DE_500`: é `LIMPA` ou `SUJA`, conforme contenha curinga.

> R8.6 foi acrescentada em 2026-07-29. A redação anterior da R8.2 dizia apenas "sequência
> completa de Ás a Rei — 13 cartas", o que admitia três leituras: por posição, por tamanho ou
> por conjunto de valores distintos. A ambiguidade só apareceu ao escrever os critérios de
> aceite ([acceptance-tests.md](acceptance-tests.md) C3), e a leitura adotada é a **literal**,
> por posição.
>
> Consequência prática: `A…K` e `2…K-A` têm o mesmo tamanho e valores diferentes — 500 contra
> 200. Não é arbitrário: `A…K` deixa a ponta alta livre para crescer até `DE_1000`, enquanto
> `2…K-A` já está fechada nas duas pontas.

> Sem P17 explícito, a pontuação passa a depender da ordem dos `if` na implementação — um
> bug silencioso que nenhum teste pegaria por acaso. É exatamente o tipo de ambiguidade
> que uma especificação existe para eliminar.

---

## R9 — Morto

- **R9.1** `[D]` Os dois mortos formam um **conjunto comum, sem dono** (R2.3).
- **R9.2** `[D]` Um jogador pega um morto no instante em que fica **sem cartas na mão**, desde que ainda haja morto disponível. Vale tanto se a mão zerou ao baixar/aumentar quanto ao descartar.
- **R9.3** `[D]` Um mesmo jogador pode pegar **os dois mortos**, se esvaziar a mão duas vezes ao longo da rodada. Não há reserva para o adversário.
- **R9.4** `[D]` Pegar um morto **não encerra o turno**. As obrigações pendentes continuam valendo: se a mão zerou **antes do descarte**, o jogador pega o morto e **em seguida descarta**. Se zerou **pelo próprio descarte**, o turno termina após pegar o morto.
- **R9.5** `[D]` Só pode **bater** quem já pegou ao menos um morto — ressalvado R10.1.
- **R9.6** `[D]` Terminar a rodada sem ter pegado nenhum morto acarreta a penalidade de R11.5 — ressalvada a mesma exceção.

> **Mudança de 2026-07-29.** A versão anterior desta seção dizia que cada jogador tinha um
> morto exclusivo — o que as fontes pesquisadas afirmam para o jogo 1 contra 1. A regra
> adotada aqui é diferente: **os mortos são um recurso comum e disputado**. Isso muda a
> natureza estratégica da rodada, porque esvaziar a mão primeiro passa a ser uma corrida,
> não um direito garantido. Prevalece a regra da mesa, não a da fonte.
>
> R9.4 reverteu a proposta original (P21), que encerrava o turno ao pegar o morto.

---

## R10 — Batida

- **R10.1** `[D]` Um jogador **bate** ao ficar sem cartas na mão, cumpridas duas condições: já ter pegado **ao menos um morto**, **e** possuir ao menos uma canastra **limpa** na mesa.
- **R10.1.1** `[D]` **Exceção.** Se não houver mais morto disponível **por conversão em monte** (R4.6), a exigência de ter pegado morto **deixa de valer** para o jogador que não teve chance de pegar nenhum. Basta a canastra limpa.
- **R10.1.2** `[D]` Se não houver mais morto disponível **porque o adversário pegou os dois** (R9.3), a exigência **continua valendo**: o jogador sem morto não pode bater.
- **R10.1.3** `[D]` É **proibido** realizar uma jogada que esvazie a mão quando não há morto disponível e as condições de batida não estão satisfeitas. O jogador deve reter ao menos uma carta.
- **R10.2** `[D]` Para efeito de R10.1, as canastras `DE_500` e `DE_1000` **sem curinga** contam como limpas; com curinga, não contam.
- **R10.3** `[F]` A batida **encerra a rodada imediatamente**. O adversário não joga mais nenhum turno.
- **R10.4** `[D]` (mesma decisão de R7.3) — A batida pode ocorrer **com ou sem** descarte final.

---

## R11 — Pontuação da rodada

Ao fim da rodada, cada jogador apura seu saldo somando os itens abaixo.

- **R11.1** `[D]` **Canastras**: conforme a tabela de R8.2, aplicando a precedência de R8.3.
- **R11.2** `[D]` **Valor individual das cartas**:

| Carta | Pontos |
|---|---|
| Ás | 15 |
| 8, 9, 10, J, Q, K | 10 |
| 3, 4, 5, 6, 7 | 5 |
| 2 (curinga) | 10 |

> O valor do 2 é o único ponto em que as fontes não convergem. Propus 10, alinhado à faixa
> das figuras. Se você joga com outro valor, é este item que precisa mudar.

- **R11.3** `[F]` Cartas **baixadas na mesa** contam **positivo**. Cartas que sobraram **na mão** contam **negativo**.
- **R11.4** `[D]` Quem bate recebe **+100 pontos** de bônus.
- **R11.5** `[D]` Quem termina a rodada **sem ter pegado nenhum morto** recebe **−100 pontos**.
- **R11.5.1** `[D]` **Exceção.** A penalidade **não se aplica** ao jogador que ficou sem morto porque um morto foi convertido em monte (R4.6). Não se pune quem não teve escolha.
- **R11.5.2** `[D]` A penalidade **se aplica normalmente** ao jogador que ficou sem morto porque o adversário pegou os dois (R9.3). Aí houve disputa, e ele perdeu.
- **R11.6** `[D]` O saldo de uma rodada **pode ser negativo**, e o total acumulado da partida também.

---

## R12 — Fim da partida

- **R12.1** `[D]` A partida termina quando um jogador atinge **3000 pontos** acumulados.
- **R12.2** `[D]` A verificação ocorre **ao fim de cada rodada**, nunca no meio. Se ambos os jogadores ultrapassarem 3000 na mesma rodada, vence quem tiver **mais pontos**. Em caso de empate exato, joga-se **mais uma rodada**.

---

## 13. Histórico das decisões

**Não há pendências.** As 33 propostas foram resolvidas em 2026-07-29 e incorporadas ao
corpo do documento. Esta seção é histórico: registra o que foi confirmado como proposto e,
mais importante, o que **não** foi.

### 13.1 Propostas que caíram ou mudaram

São as que justificam o método. Cada uma seria um bug caro se tivesse ido direto ao código.

| # | Regra | O que aconteceu |
|---|---|---|
| **P9** | R4.6–R4.8 | **Reformulada.** Propus encerrar a rodada com o monte esgotado. A regra correta converte um morto não reclamado no novo monte, preservando o lixo intacto |
| **P14** | R6.5 | **Reformulada.** Propus trocar o curinga pela carta natural, devolvendo-o à mão. A regra correta o *regulariza*: ele fica no jogo e deixa de ser curinga ao ocupar sua casa |
| **P21** | R9.4 | **Rejeitada.** Propus que pegar o morto encerrasse o turno. Não encerra: o descarte pendente continua obrigatório |
| **P28** | R2.3, R4.7 | **Dissolvida — a premissa estava errada.** Perguntei qual morto virava monte, supondo um morto por jogador. Os mortos **não têm dono**: são recurso comum, e um jogador pode pegar os dois |
| **P16** | R7.3, R10.4 | Confirmada como proposta, mas contrariando minha própria recomendação. O turno tem **duas** formas de terminar, não uma |

A P28 merece destaque: a regra do morto exclusivo vinha das **fontes pesquisadas**, que
afirmam expressamente que em 1 contra 1 cada jogador compra um morto. Estava marcada `[D]`
no glossário e em `rules.md`. Prevaleceu a regra da mesa. Fonte externa é ponto de partida,
não autoridade.

### 13.2 Confirmadas como propostas

P1, P2, P3, P4, P5, P6, P7, P8, P10, P11, P12, P13, P15, P17, P18, P19, P20, P22, P23, P24,
P25, P26, P27, P29, P30, P31, P32, P33.

### 13.3 O que a especificação impõe à engine

Consequências que já são visíveis e que o `domain.md` terá de respeitar:

- **A categoria de uma canastra é função derivada, nunca campo armazenado** (R6.5, R8.5). Regularizar o curinga muda a categoria a qualquer momento da rodada.
- **A classificação precisa de precedência explícita** (R8.3). Sem ela, a pontuação depende da ordem dos `if`.
- **O turno tem duas terminações** (R7.3): descarte e batida.
- **Estados inválidos são tornados inalcançáveis, não tratados** (R10.1.3). Proibir a jogada que esvazia a mão sem batida possível é mais simples do que resolver o impasse depois.
- **Os mortos são recurso comum e disputado** (R2.3, R9.3). Esvaziar a mão primeiro é uma corrida, o que muda a avaliação da IA em todo turno.
