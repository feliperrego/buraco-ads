# Spec 0003 — Turno da IA

> Status: **confirmado** — 10 decisões, nenhuma pendência
> História: **H3** — "O oponente joga seu turno sozinho e a vez volta para mim"
> Fecha: RF5.1, RF5.2, RF5.3 (metade), M11, M12
> Última atualização: 2026-08-01

As pendências continuam a série global das specs, que foi de `S1` a `S27`. Esta começa em
**`S28`**.

---

## 1. Escopo

### Entra

O adversário joga sozinho: compra do monte, descarta, e a vez volta. Fecha o Marco I — ao fim
desta fatia existe um jogo que roda para sempre, com dois jogadores comprando e descartando.

Nasce a camada **`ia/`**, a última das quatro. Depois desta fatia as três fronteiras da
[architecture.md](../architecture.md) estão de pé **e exercitadas**.

### Não entra

| Fora | Vai para |
|---|---|
| Qualquer heurística ou avaliação de mão | H15 |
| Seletor de dificuldade | Nunca — a RF5.1 fixa nível único |
| Baixar, aumentar, pegar o lixo pela IA | H4–H7, quando os comandos existirem |
| Monte esgotado | H14 |
| Força relativa e orçamento de 100 ms (E6) | H15, quando houver duas IAs para comparar |

- `[D]` **S28** — A IA da H3 escolhe **por sorteio**, uniformemente, dentro de
  `movimentosValidos`. Nenhuma avaliação, nenhuma preferência.

> Isso não é um rascunho a ser jogado fora. A [testing-strategy.md](../testing-strategy.md) E7
> decidiu que a **IA aleatória é permanente**: depois da H15 ela vira a linha de base contra a
> qual a heurística é medida, e o adversário do nível 2 de teste. Vale construí-la para durar.

---

## 2. API introduzida

```ts
type Aleatorio = () => number

// engine — utilitário público, ver S30
criarAleatorio(semente: number): Aleatorio

// ia
decidir(visao: VisaoDoJogador, aleatorio: Aleatorio): Comando | null
```

- `[D]` **S29** — `decidir` recebe **apenas a visão**, e chama
  `movimentosValidos` ela mesma. Não recebe a `Partida` nem a lista pronta.

> É a RF5.2 como garantia estrutural, não como política. A IA não *escolhe* não trapacear: ela
> não tem por onde. E chamar `movimentosValidos` internamente fecha a última brecha — se a
> lista viesse pronta de fora, alguém poderia um dia passar uma lista calculada a partir da
> `Partida`.

- `[D]` **S30** — A engine passa a exportar `criarAleatorio(semente)` na API
  pública, reusando o `mulberry32` que já existe.

> `estado/` precisa semear a IA e **não pode** alcançar `engine/aleatorio/` — a A8 proíbe, e o
> verificador de fronteiras recusa. As alternativas eram duplicar o gerador dentro de `ia/`,
> ou deixar a IA usar `Math.random()` e perder o determinismo que a E6 exige. Exportar o que já
> existe é mais barato que as duas.

- `[D]` **S31** — `decidir` devolve **`null`** quando não há movimento algum.

> Acontece só no caso da R4.6/R4.8 — monte esgotado —, que é a H14. Devolver `null` em vez de
> lançar deixa o chamador decidir, e é o que impede a H14 de ter que reescrever esta
> assinatura.

---

## 3. Comportamento

### 3.1 A escolha (RF5.1, RF5.2)

```
movimentos = movimentosValidos(visao)
se vazio        → null
senão           → movimentos[floor(aleatorio() * movimentos.length)]
```

Uma chamada ao gerador por decisão. Na fase `Compra` a lista tem um elemento só, então o
sorteio é degenerado — mas a chamada acontece do mesmo jeito, para que a sequência do gerador
não dependa do tamanho da lista.

### 3.2 Quem conduz o turno (A3)

- `[D]` **S32** — O turno da IA é conduzido por um efeito em **`estado/`**.

> A A3 proíbe `ia/` de importar `estado/` ou `ui/`, então a IA não pode se auto-agendar. E a
> `ui/` não pode importar `ia/` — a regra de dependência recusa. Sobra `estado/`, que é a única
> camada autorizada a conhecer as duas, e é onde o despacho já mora.

- `[D]` **S33** — O efeito aplica **um comando por vez**, não o turno inteiro.

> Cada comando muda o estado, o efeito roda de novo, e a IA decide o próximo. Comprar e
> descartar saem naturalmente de duas passagens.
>
> A alternativa — a IA executar o turno completo numa chamada — parece mais simples hoje e
> quebra na H4: lá o turno tem quantas descidas o jogador quiser (R3.3), e "o turno inteiro"
> deixa de ser um número fixo de comandos.

### 3.3 A semente da IA (E6, RNF1.3)

- `[D]` **S34** — A IA recebe **um `Aleatorio` de vida longa**, criado quando a
  partida começa, a partir de `partida.semente`.

> A E6 exige que "mesma visão e mesma semente produzam a mesma escolha". Um gerador recriado a
> cada turno a partir da visão daria sempre a mesma escolha para a mesma visão — o que soa
> parecido e não é: duas rodadas com mãos idênticas jogariam idêntico, e a IA ficaria
> previsível de um jeito que nenhuma regra pediu.
>
> Com um gerador de vida longa, a partida inteira continua reproduzível a partir de duas
> sementes, e é isso que a E7 vai precisar para rodar mil partidas comparáveis.

### 3.4 O ritmo, e uma tensão entre requisitos confirmados

A **RF5.3** é `[D]`: *"a jogada da IA é apresentada com ritmo perceptível, não instantânea"*.
Mas ela está na lista da **H15**, não na da H3.

Sem nenhuma pausa, o turno da IA acontece entre dois quadros: o jogador confirma o descarte e
a mesa volta a ser dele, com duas cartas a mais no lixo e nenhuma pista de que houve um turno.

- `[D]` **S35** — A H3 implementa a **primeira metade da RF5.3**: uma pausa fixa
  entre comandos da IA, sem animação nem destaque. A apresentação refinada fica na H15.

> Mesmo padrão da S7 na H1 e da S17 na H2 — uma regra fechada por duas histórias, com a divisão
> escrita.
>
> O argumento é a U5: "pronto" exige comportamento **observável**. Sem pausa, o comportamento
> que a H3 entrega não é observável por um humano; só por teste. E a H3 existe justamente para
> o jogador ver o oponente jogar.

### 3.5 O que acontece ao fim do turno da IA

`jogadorDaVez` volta a `0`, a fase volta a `Compra`, e `movimentosValidos` volta a ter
conteúdo para o humano. A mesa destrava — e é a primeira vez no projeto que uma partida
continua.

---

## 4. Fronteiras

A H3 fecha o desenho de camadas, e o diagrama vale mais que a prosa:

```
ui/        renderiza; não conhece ia/
  ↓
estado/    conduz o turno da IA — única camada que importa ia/ (A3)
  ↓  ↓
ia/ ───→  engine/   decidir() chama movimentosValidos(visao)
```

A `ia/` importa **só** a API pública da engine. Nunca `estado/`, nunca `ui/`, nunca o interior
da engine — e o [`verificar-fronteiras.py`](../../scripts/verificar-fronteiras.py) já testa
esses três casos desde a tarefa 0.4, com a IA como alvo. Esta é a primeira fatia em que eles
deixam de ser hipotéticos.

---

## 5. Interface

Nada novo na mesa. O que muda é que ela **deixa de ficar parada**: durante o turno da IA
continua inerte (S18, S20), e volta a responder quando a vez retorna.

- `[D]` **S36** — Durante o turno da IA a mesa mostra que ele está acontecendo,
  reusando o painel "Vez e fase" que já existe. Sem elemento novo.

---

## 6. Critérios de aceite

IA, nível 3 da [testing-strategy.md](../testing-strategy.md):

| # | Dado | Então |
|---|---|---|
| **CA-RF5.1-1** | qualquer visão com movimentos | a escolha da IA está **em `movimentosValidos`** |
| **CA-RF5.1-2** | uma visão sem movimento algum | `decidir` devolve `null` |
| **CA-RF5.2-1** | duas partidas iguais **exceto pela ordem do monte** | a IA escolhe **o mesmo** — não enxerga o que está oculto |
| **CA-M12-1** | a mesma visão e a mesma semente | a escolha é **a mesma** |
| **CA-M12-2** | a mesma visão e sementes diferentes | as escolhas **diferem** em algum caso |
| **CA-M11-1** | a visão entregue à IA | não contém mão do adversário, monte nem mortos |

Integração, nível 5:

| # | Dado | Então |
|---|---|---|
| **CA-RF5.1-3** | o humano descarta | a IA compra e descarta, e `jogadorDaVez` volta a `0` |
| **CA-M9-6** | após o turno completo da IA | a conservação das 104 se mantém |
| **CA-S33-1** | o turno da IA | são exatamente **dois** comandos aplicados, na ordem compra → descarte |

Interface, nível 4:

| # | Dado | Então |
|---|---|---|
| **CA-S37-1** | iniciar, comprar e descartar pela interface | a mesa volta a responder ao humano, com o lixo maior |

- `[D]` **S37** — A `CA-S37-1` é o **critério de ponta a ponta** que a H1 não
  teve e a H2 adiou. Ele exercita clique → estado → engine → IA → mesa numa asserção só.

> Registrado como gatilho no [roadmap.md](../roadmap.md) §3 desde a H1, com prazo nesta spec.
> É o único critério do projeto que falha se **qualquer** uma das quatro camadas quebrar, e por
> isso não substitui nenhum dos outros: quando ele falha, não diz onde.

> **CA-RF5.2-1 é o critério mais importante desta fatia.** Embaralhar o monte não muda nada na
> visão da IA — só a contagem sobrevive à projeção. Se a escolha mudar, a IA está lendo o que
> não devia, e nenhum outro critério pegaria isso.

---

## 7. Decisões

**Não há pendências.** As 10 decisões foram confirmadas em 2026-08-01.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **S28** | Escopo | A IA sorteia uniformemente; heurística é a H15 |
| **S29** | API | `decidir(visao, aleatorio)` — só a visão, e chama `movimentosValidos` sozinha |
| **S30** | API | A engine exporta `criarAleatorio(semente)`, reusando o `mulberry32` |
| **S31** | API | `decidir` devolve `null` quando não há movimento |
| **S32** | Fronteiras | O turno da IA é conduzido por efeito em `estado/` |
| **S33** | Comportamento | **Um comando por vez**, não o turno inteiro |
| **S34** | Determinismo | `Aleatorio` de vida longa, semeado de `partida.semente` |
| **S35** | Ritmo | A H3 implementa a **primeira metade da RF5.3**: pausa fixa entre comandos |
| **S36** | Interface | O turno da IA aparece no painel "Vez e fase"; nenhum elemento novo |
| **S37** | Testes | Entra o **critério de ponta a ponta**, adiado desde a H1 |

### O que merece sua atenção

- **S35 é a que mais precisa do seu olho**, e é a única que mexe no escopo combinado. A RF5.3
  está formalmente na H15, mas sem alguma pausa o turno da IA é invisível para um humano — e a
  U5 exige comportamento observável para dizer "pronto". Se você preferir a H3 instantânea e a
  RF5.3 inteira na H15, ela cai; a fatia continua correta, só não dá para assistir.
- **S28** é a decisão que faz a H3 parecer pouco e não é: a E7 já decidiu que esta IA é
  permanente. Ela vira a linha de base da força relativa na H15.
- **S34** é sutil e cara de trocar depois: gerador de vida longa versus recriado por turno
  produzem partidas diferentes, e a diferença só aparece quando duas rodadas tiverem mãos
  parecidas.
- **S30** acrescenta função à API pública da engine, que até agora tinha quatro. É a única
  proposta aqui que amplia superfície.

Calibragem: dez propostas, e **nenhuma interpreta regra de Buraco** — a H3 é sobre camadas,
determinismo e ritmo. As regras que ela toca (R4.1, R7.1) já foram exercitadas pela H2. É a
faixa em que erro menos, e a S35 é a que mais depende de gosto seu.
