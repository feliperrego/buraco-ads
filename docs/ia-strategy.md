# Estratégia da IA

> Status: **confirmado** — 11 decisões, confirmadas em bloco em 2026-08-04
> Deriva de: [rules.md](rules.md) · [requirements.md](requirements.md) RF5 · [testing-strategy.md](testing-strategy.md) E6, E7
> Fecha o gatilho *"`ia-strategy.md` como documento próprio"* do [roadmap.md](roadmap.md) §3 (U2)

## Como ler este documento

Identificadores são `IA1`…`IAn`, e a marcação de origem é a de sempre: `[F]` pesquisado, `[D]`
confirmado, `[P]` proposta minha.

**Este documento existe por uma razão específica, e vale dizê-la.** As specs de fatia são
declaradas descartáveis pelo [README](README.md): *"quando a história está pronta e testada, os
testes passam a ser a especificação viva"*. Isso vale para **regra**, que tem resposta certa. Não
vale para **heurística**, que é política com custo: um teste prende *"prefere baixar a
descartar"*, e não prende **por quê** — e é o porquê que vai ser revisto quando a medição chegar.
O limiar de 70% da E6 já nasceu marcado para revisão, e revisão precisa de casa.

A contrapartida é a invariante 3 do acordo: abstração só depois do caso concreto. Por isso este
documento é **pequeno de propósito** — só as decisões que a H15 vai tomar. Ele cresce quando a
medição pedir, não antes.

---

## 1. O que esta IA precisa ser

| Requisito | O que exige |
|---|---|
| **RF5.1** | **Nível único.** Não há seletor de dificuldade, então não há "fácil" a preservar |
| **RF5.2** | Decide só com o que a `VisaoDoJogador` carrega. Já é garantia estrutural (S29) |
| **RF5.3** | Ritmo perceptível — a pausa da S35, que já existe |
| **E6** | Quatro propriedades: legalidade, determinismo, **força relativa ≥70%**, tempo **<100 ms** |
| **E7** | A IA aleatória **não é descartada**: vira a linha de base |

E o que ela **não** precisa ser: boa de Buraco. O alvo da E6 é ganhar de quem sorteia, não jogar
bem. Isso importa porque define o teto do esforço — a fatia acaba quando o número aparece, não
quando a estratégia fica elegante.

- `[D]` **IA1** — A H15 entrega **uma** política heurística, medida contra a aleatória. Nada de
  níveis, perfis ou parâmetros ajustáveis: a RF5.1 diz nível único, e um parâmetro sem seletor é
  configuração que ninguém muda.

---

## 2. A forma da decisão

Três formas, e a escolha condiciona tudo o que vem depois:

| | Como | Custo |
|---|---|---|
| **A — pontuação** | `pontuar(visao, comando) → número`, escolhe o máximo | uma função por comando; o peso relativo entre eles vira número, e número se ajusta |
| **B — cascata de regras** | *"se puder bater, bata; senão se puder pegar o morto…"* | lê como as regras, e a ordem dos `if` vira decisão implícita que ninguém registrou |
| **C — busca** | simular jogadas à frente | fora de escopo: a E6 pede <100 ms e a RF5.1 pede um nível só |

- `[D]` **IA2** — Forma **A**. `decidir` vira `argmax` de `pontuar`, e cada heurística deste
  documento vira uma parcela da pontuação.

> A **B** é tentadora porque as regras do Buraco já são uma cascata, e por isso mesmo ela engana:
> a ordem dos `if` **é** a estratégia, e fica escrita em lugar nenhum. Este projeto já mediu esse
> defeito duas vezes com outro nome — a S140, em que a mesma condição vivia em dois módulos, e a
> H9, em que a mesma intenção estava expressa duas vezes. Uma cascata é a mesma armadilha com
> sintaxe melhor.

### 2.1 O gatilho da ordem de `movimentosValidos` fecha aqui

O [roadmap.md](roadmap.md) §3 guardava, com prazo nesta fatia:

> *"Ordem em que `movimentosValidos` devolve os comandos — ninguém a decidiu, e a interface já a
> usa para ordenar botões."*

A forma **A** responde: `movimentosValidos` **enumera**, a `ia/` **pontua**. A ordem da engine
não vira contrato, e é isso que a mantém livre para mudar.

Falta o empate. Dois comandos com a mesma pontuação precisam de desempate, e usar a ordem de
enumeração devolveria o contrato pela porta dos fundos.

- `[D]` **IA3** — Empate é resolvido por **chave estável do comando** — tipo e cartas citadas,
  ordenados —, nunca pela posição na lista. Assim a `ia/` é determinística (E6) sem que a ordem
  da engine signifique nada.
- `[D]` **IA4** — A dependência da **interface** naquela ordem **não** é resolvida aqui. Ela é
  real — a H10 mediu que com uma carta selecionada aparecem *"Descartar"* e a jogada de mesa,
  nessa ordem — mas é decisão de interface, e vai para o Marco VI com gatilho próprio.

---

## 3. O que cai das regras

Estas quatro não são gosto meu: são consequência do `rules.md`, e é onde a calibragem do acordo
diz que minhas propostas acertam.

### 3.1 Carta na mesa vale mais que carta na mão

A **R11.3** conta as cartas baixadas como **positivo** e as da mão como **negativo**. Um `K`
baixado e um `K` na mão diferem em **20 pontos**, não em 10.

- `[D]` **IA5** — Baixar e aumentar pontuam **positivo pelo dobro** do valor das cartas movidas.
  Não é preferência por agressividade: é a assimetria que a R11.3 escreveu.

### 3.2 O curinga do próprio naipe é o único que pode ser limpo

A **R6.5** exige que o curinga seja o `2` **do naipe da sequência** para ser regularizado. Um `2`
de outro naipe deixa a canastra **permanentemente suja** — 100 em vez de 200 (R8.2).

- `[D]` **IA6** — Entre dois curingas possíveis, a IA prefere **o `2` do próprio naipe**. A
  diferença é de 100 pontos por canastra, e ela já está no `rules.md`.

### 3.3 Descartar é o comando mais perigoso do Buraco Aberto

A **R4.2** manda o lixo **inteiro** para quem o pegar, e a **R4.3** o deixa **visível o tempo
todo**. Descartar não é descartar: é oferecer, e o adversário vê a oferta crescer.

- `[D]` **IA7** — O descarte é pontuado pelo que **entrega**: carta que estende um jogo visível
  do adversário (RF3.5) vale bem menos, e carta que ele acabou de mostrar interesse por, também.
  Entre descartes equivalentes, a IA solta a de **menor valor** (R11.2).

> Esta é a heurística que mais separa o Buraco **Aberto** do Fechado, e a que menos existiria num
> jogo de lixo oculto. Se a H15 entregar uma IA melhor que a aleatória por um motivo só, aposto
> nesta.

### 3.4 O morto vale onze cartas

A **R9.2** entrega 11 cartas a quem zera a mão, e a **R10.1** faz do morto pré-requisito da
batida. Chegar lá é ganho material e habilitação, ao mesmo tempo.

- `[D]` **IA8** — Zerar a mão vale um bônus grande enquanto houver morto por pegar, e **zero**
  depois que não houver. A guarda da S109/S115 já impede a jogada ilegal; isto é sobre preferir a
  legal.

---

## 4. O que é estratégia de mesa

Aqui a calibragem diz o contrário: **minhas propostas sobre Buraco erram a cada seis**. As duas
abaixo não caem de nenhuma regra, e são as que você precisa julgar.

### 4.1 Quando pegar o lixo

Pegar o lixo dá material de uma vez, e infla a mão — o que afasta o morto e a batida, e aumenta o
negativo da R11.3 se a rodada acabar antes de baixar.

- `[D]` **IA9** — A IA pega o lixo quando as cartas dele que **encaixam** nos seus jogos ou na
  sua mão valem mais que o peso das que **não** encaixam. Um limiar, não uma regra: pegar sempre
  e nunca pegar são os dois extremos ruins.

> **Não sei qual é o certo na sua mesa.** Se você joga pegando o lixo quase sempre — é material,
> e material ganha —, ou quase nunca — mão grande não bate —, o limiar muda de lugar e a IA9 é o
> item a corrigir.

### 4.2 Quando bater

A batida dá **+100** (R11.4), congela a mão do adversário como negativo, e **encerra a rodada**
(R10.3) — inclusive as canastras que ele fecharia.

- `[D]` **IA10** — A IA bate **assim que pode**. Não é obviamente certo: com poucos pontos na
  mesa, encerrar cedo pode travar uma rodada que ela venceria continuando. Mas a alternativa
  — segurar a batida para acumular — exige estimar o que o adversário ainda faria, e isso é busca,
  que a IA2 pôs fora de escopo.

---

## 5. O que fica de fora da H15

- **Ajuste de pesos por medição.** A H15 entrega pesos escolhidos por argumento e **mede**. Se o
  número da E6 não sair, aí sim os pesos viram objeto de trabalho — e este documento é onde a
  revisão fica registrada.
- **Memória entre turnos.** A IA decide só do estado atual. Guardar o que o adversário descartou
  é informação que a `VisaoDoJogador` já dá pelo lixo (R4.3), então não há o que memorizar.
- **A IA aleatória.** Continua exportada e usada, pela E7.

---

## 6. Como isto é medido

A **E6** pede força relativa **≥70%** contra a aleatória, e a própria nota admite que o número é
*"palpite sem base empírica"*. Agora há base para dizer o que ele custa.

Medição da linha de base, **600 partidas** de aleatória contra aleatória:

| | |
|---|---|
| partidas decididas | 600 / 600, zero travamentos |
| vitórias do jogador 0 | **48,2%** — intervalo de 95%: 44,2% a 52,2% |
| custo | ~0,5 s por partida |

O intervalo contém os 50%: **não há vantagem posicional detectável**, o que era esperado pela
alternância da R2.6 e não estava medido.

E o limiar fica assim:

| Se a heurística ficar em | Intervalo de 95% com 600 partidas | Exclui 70%? |
|---|---|---|
| 75% | 71,5% a 78,5% | **sim** |
| 72% | 68,4% a 75,6% | **não** |

- `[D]` **IA11** — A força relativa é medida em **600 partidas**, e o resultado é reportado como
  **intervalo**, não como ponto. A E6 é considerada cumprida quando o **limite inferior** do
  intervalo passa de 70% — e não quando a média passa.

> Escolher o `N` **antes** de ver o resultado é o que impede a medição de virar argumento. Se
> 600 não bastar para separar o resultado de 70%, a resposta é aumentar o `N` **uma vez**, com o
> número novo escolhido pela largura desejada — nunca ir aumentando até o intervalo cair do lado
> confortável.

---

## 7. Decisões

Onze decisões, confirmadas em bloco em 2026-08-04.

| # | Assunto | Proposta |
|---|---|---|
| **IA1** | Escopo | Uma política só, sem níveis nem parâmetros — a RF5.1 pede nível único |
| **IA2** | Forma | **Pontuação** de movimentos, e `decidir` vira `argmax`; cascata de `if` recusada |
| **IA3** | Forma | Empate por **chave estável do comando**, nunca pela ordem de enumeração |
| **IA4** | Escopo | A dependência da **interface** naquela ordem vai para o Marco VI |
| **IA5** | Regra | Baixar e aumentar valem o **dobro** — a assimetria é da R11.3 |
| **IA6** | Regra | Entre curingas, prefere o `2` **do próprio naipe** (R6.5) — vale 100 por canastra |
| **IA7** | Regra | O descarte é pontuado pelo que **entrega** ao adversário (R4.2, R4.3) |
| **IA8** | Regra | Zerar a mão vale bônus **enquanto houver morto**, e nada depois (R9.2) |
| **IA9** | **Mesa** | Pega o lixo quando o que encaixa supera o peso do que não encaixa |
| **IA10** | **Mesa** | Bate **assim que pode** |
| **IA11** | Medição | Força relativa em **600 partidas**, reportada como intervalo; a E6 passa pelo limite **inferior** |

### Onde eu erraria, se errasse

Isto foi escrito **antes** da confirmação e fica como estava, porque é a previsão que a medição
vai testar. As onze passaram em bloco, inclusive as duas que eu sinalizei — e o valor de ter
sinalizado só aparece se o registro sobreviver ao "ok".

**A IA9 e a IA10 são as duas propostas de mesa**, e são onde a calibragem diz que eu erro — 5 das
5 quedas do projeto foram no `rules.md`, o único documento sobre o seu domínio. As outras nove são
sobre software ou caem de regra escrita.

Se a força relativa da E6 não sair, **estas duas são as primeiras a revisar** — não porque a
medição vá apontar para elas, mas porque são as únicas cujo argumento não vem de regra escrita.

Duas que valem um olhar além delas:

- A **IA5** propõe o fator **dobro** com um argumento aritmético (a R11.3 inverte o sinal, então a
  diferença é `2×` o valor da carta). O argumento está certo para o **saldo**, e mesmo assim o
  peso pode estar errado: baixar cedo também entrega informação ao adversário, e isso a aritmética
  não mede.
- A **IA11** aperta a E6 em vez de afrouxá-la — exigir o limite inferior acima de 70% é mais duro
  que exigir a média. Se você preferir o critério original, é uma linha, mas aí o número passa a
  depender de quantas partidas eu rodar.
