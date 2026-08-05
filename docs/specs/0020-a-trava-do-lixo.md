# Spec 0020 — a trava do lixo da IA9

> Status: **confirmada** — 4 decisões, confirmadas em bloco em 2026-08-05
> Não é história: é a dívida registrada no [roadmap.md](../roadmap.md) §3 ao fechar a H15
> Corrige: `IA9` da [ia-strategy.md](../ia-strategy.md), `S149` da [spec 0015](0015-ia-por-heuristica.md)

## 1. O defeito, medido

A IA9 pontua o `pegarLixo` pelo saldo: soma o valor das cartas que **encaixam** e subtrai o das
que não encaixam. Medido contra um oponente que nunca pega o lixo:

| Tamanho do lixo | Saldo médio |
|---|---|
| 0 a 9 | **+11** |
| 10 a 19 | −11 |
| 30 a 39 | −82 |
| 60 a 69 | **−140** |

O saldo não tem piso. Passado o ponto em que vira negativo, o lixo só cresce — e quanto mais
cresce, mais negativo fica. **Trava que se realimenta**, vista chegando a 70 cartas.

Contra a aleatória isso não acontece, porque ela pega o lixo em metade das compras e ele não passa
de 16. Foi por isso que as 600 partidas da H15 não viram: **o arnês não copiava este oponente**.

---

## 2. O diagnóstico, e ele muda o conserto

A leitura fácil é _"falta um piso no termo negativo"_. É a leitura do sintoma.

A causa é outra, e está na **S149**: uma carta do lixo "encaixa" quando há vizinha do mesmo naipe
na minha **mão** ou nos **meus jogos**. A definição ignora que as cartas do lixo são vizinhas
**umas das outras**.

Um lixo de 60 cartas é uma pilha enorme de sequências prontas — e a fórmula o avalia como se cada
carta fosse chegar sozinha. **O erro cresce com o tamanho do lixo**, que é exatamente a forma da
trava.

- `[D]` **S177** — O defeito é da **definição de encaixe**, não da falta de piso. Consertar o
  piso trataria o sintoma e deixaria a fórmula continuar subestimando lixo grande.

---

## 3. As três saídas, medidas

Vinte rodadas contra o oponente que não pega o lixo, com a heurística do outro lado:

| | Como | Maior lixo | Pega o lixo em |
|---|---|---|---|
| **atual** | vizinha na mão ou nos meus jogos | **70** | 80% das compras |
| **A** | a vizinha também pode estar **no próprio lixo** | **13** | 92% |
| **B** | saldo **médio** por carta, em vez da soma | **70** | 80% |
| **C** | termo negativo com **teto de 50** | 24 | 87% |

- `[D]` **S178** — Forma **A**. A trava some — o lixo não passa de 13 — e o conserto é da causa: a
  carta que não encaixa hoje na minha mão pode encaixar com a vizinha que vem junto com ela.

> **A B é inerte, e vale registrar por quê.** Dividir a soma pelo número de cartas **não muda o
> sinal**, e é o sinal que decide entre pegar e comprar. Ela parecia a correção mais natural — e o
> número saiu **idêntico** ao atual, casa a casa. É o terceiro caso do projeto em que uma mudança
> que parece resolver não muda decisão nenhuma, junto com o `dobro` da IA5 e a ponta do desempate.
>
> A **C** funciona e é remendo: o teto de 50 é número novo sem regra por trás, e a trava só fica
> mais lenta — o lixo ainda chegou a 24.

---

## 4. O que isso custa em força

A E6 é medida contra a aleatória, e a correção **não a piora**:

| | Força relativa em 600 partidas |
|---|---|
| IA9 como está (H15) | 97,8% — intervalo de 95%: 96,7% a 99,0% |
| com a forma **A** | **100,0%** — 600 de 600 |

- `[D]` **S179** — A medição da E6 é **refeita** com a correção e o número entra na
  `ia-strategy.md` §6.1, junto com a leitura de que **100% torna o limiar da E6 inútil como
  comparação**. Ele já era largo demais na H15; agora é um teto.

> Isto reforça o que a H15 já tinha registrado: um limiar que a heurística cumpre com folga não
> separa esta política da próxima. A linha de base útil, daqui em diante, é a **heurística
> anterior** — não o sorteio.

---

## 5. O que prende o conserto

A trava não apareceu em teste nenhum, e não vai aparecer sozinha da próxima vez.

- `[D]` **S180** — O caso ganha teste: com um lixo grande de cartas que formam sequências **entre
  si**, a IA pega o lixo. E o par: com um lixo grande de cartas espalhadas, ela compra do monte.
  Mais um teste de propriedade sobre partidas inteiras contra um oponente que **não** pega o lixo,
  exigindo que ele não ultrapasse um teto.

> O arnês da S151 continua medindo contra a aleatória, e está certo — é o que a E7 pede. O que
> faltava era **um segundo oponente** no repertório, e o "guloso que nunca pega o lixo" passa a ser
> ele. Foi ele que achou isto.

---

## 6. Critérios de aceite

- `CA-S178-1` — com lixo de cartas que se encadeiam entre si, e nenhuma vizinha na mão, a IA
  **pega** o lixo
- `CA-S178-2` — com lixo do mesmo tamanho e cartas espalhadas, ela **compra do monte** — é o par
- `CA-S178-3` — a carta não conta como vizinha de si mesma, nem a segunda cópia dela (herda a
  leitura da `CA-S149-3`)
- `CA-S180-1` — em 20 rodadas contra um oponente que nunca pega o lixo, o lixo **não passa de 20
  cartas** — o teto é folgado de propósito: o que se prende é a ausência da trava, não o número
- `CA-S179-1` — a força relativa é remedida em 600 partidas, e o número entra na `ia-strategy.md`

---

## 7. Decisões

Quatro decisões, confirmadas em bloco em 2026-08-05.

| # | Assunto | Proposta |
|---|---|---|
| **S177** | Diagnóstico | O defeito é da **definição de encaixe**, não da falta de piso |
| **S178** | Regra | A vizinha pode estar **no próprio lixo**. Trava some: 70 → 13 cartas |
| **S179** | Medição | E6 refeita — **100%** —, e o limiar dela deixa de servir de comparação |
| **S180** | Teste | O caso vira teste, e o "oponente que não pega o lixo" entra no repertório |

---

## 8. O que o conserto mediu

Escrito depois da implementação.

| | Antes | Depois |
|---|---|---|
| maior lixo contra o guloso (`CA-S180-1`) | **70** | **13** |
| força relativa, 600 partidas | 97,8% — 96,7% a 99,0% | **100,0%** — 600 de 600 |
| rodadas por partida | 3,3 | 2,8 |
| `decidir` com lixo de **70** cartas | — | **0,38 ms** |
| `decidir` no pior caso da T7 | 12,89 ms | 17,06 ms |

**O custo em tempo subiu e não importa.** A mudança é quadrática no tamanho do lixo — cada carta
passa a ser comparada com as outras —, e o pior caso construível da T7 foi de 12,89 ms para
17,06 ms, contra os 100 ms da E6. Medido no caso que a mudança de fato piora, um lixo de **70
cartas**, a decisão leva **0,38 ms**: o quadrado de 70 é pequeno perto do que a enumeração já faz.

### 8.1 Uma mutação passou, e ela apagou uma linha

A primeira escrita filtrava a própria carta — `outra.id !== carta.id` — e a mutação que **remove
esse filtro não reprovou nada**.

Conferido para os treze valores do baralho, o Ás incluído (ele ocupa duas casas): **nenhum valor é
vizinho de si mesmo**, porque `vizinhas` exige distância de ao menos uma casa. O filtro dizia a
mesma coisa que a distância mínima já dizia.

A linha saiu. É o defeito que a H9 mediu com outro nome — **duplicação de intenção, não de
código** —, e é a segunda vez que ele aparece por uma mutação que **passa**.

### 8.2 A primeira tentativa de mutar a alternativa C estava mal feita

Ela acrescentou o teto de 50 **por cima** do conserto, e passou — o que só dizia que C sobre A é
inofensivo. Refeita **no lugar** de A, ela reprova três critérios, e o maior lixo vai a **24**.

É a diferença entre mutar a decisão e mutar um detalhe ao lado dela.

---

### Onde eu erraria, se errasse

**A S178 é decisão de mesa, e é a segunda vez que mexo na IA9** — a mesma proposta que a
calibragem do acordo apontou como a mais arriscada, e que de fato foi a que quebrou.

O que **não** estou propondo, e vale você saber: continuo sem limiar sobre o **tamanho da mão**. A
IA pega o lixo em 92% das compras com a forma A, e uma mão grande afasta o morto e a batida. Se na
sua mesa pegar o lixo quase sempre é jogar mal, o item a corrigir é este — e ele não aparece na
medição contra a aleatória, porque contra ela **tudo** ganha.
