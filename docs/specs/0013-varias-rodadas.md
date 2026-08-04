# Spec 0013 — H13: várias rodadas até 3000

> Status: **confirmada** — 8 decisões, nenhuma pendência
> História: `H13` — *"Jogo várias rodadas até alguém atingir 3000 pontos e vejo o vencedor"*
> Fecha: R2.6, R12.1, R12.2, RF1.5, RF4.1
> Deriva de: [rules.md](../rules.md) · [requirements.md](../requirements.md) · [screens.md](../screens.md)

---

## 1. A fatia que transforma rodada em partida

Até aqui o projeto construiu **uma rodada**. A palavra "partida" aparece no código desde a H1 —
`Partida`, `iniciarPartida` — mas o que ela representa é uma rodada só, com um placar que nunca
foi somado duas vezes.

A H13 é a primeira fatia em que `numeroDaRodada` deixa de ser sempre `1`.

Três coisas mudam, e a terceira é a que carrega a decisão:

1. **A rodada seguinte começa** — baralho novo, mãos novas, mortos novos, placar preservado.
2. **O início alterna** (R2.6), o que exige saber quem começou a rodada que acabou.
3. **A partida termina** em 3000 (R12.1), e "terminou" precisa existir em algum lugar.

---

## 2. Escopo

### Entra

- `novaRodada` — a transição de rodada, com o que sobrevive e o que é redistribuído
- A alternância do jogador inicial (R2.6)
- O fim da partida em 3000, com a regra de desempate da R12.2
- O botão que a H12 deixou faltando no painel de apuração (S119)
- A tela `/fim`, hoje um `<h1>` vazio desde a tarefa 0.7: vencedor, placar e nova partida (RF1.5)

### Não entra

- **A R4.6 e a R4.8** — monte esgotado, morto virando monte, rodada que acaba sem batida. É a
  **H14**, e ela é o que hoje impede 183 de 200 partidas simuladas de terminar. A H13 encadeia
  rodadas que **terminam em batida**; as que não terminam continuam não terminando.
- **A R11.5.1** — segue esperando a conversão da R4.6 (S119).
- **A RF1.3** — abandonar uma partida em curso, com confirmação, é a H16.

- `[D]` **S128** — A H13 encadeia rodadas e fecha a partida. Nada do monte esgotado entra aqui,
  e a partida que não termina em batida continua rodando indefinidamente — um defeito conhecido,
  com fatia marcada.

> Vale dizer o desconforto: entregar "várias rodadas" sabendo que a maioria das partidas
> simuladas não chega ao fim da primeira parece meia entrega. Mas juntar a R4.6 aqui faria uma
> fatia com duas mudanças estruturais — encadear rodadas **e** converter morto em monte —, e a
> ordem H13→H14 do `user-stories.md` foi escolhida justamente para separá-las.

---

## 3. O que sobrevive a uma rodada

`Partida` tem nove campos. Redistribuir é decidir, campo a campo, o que continua:

| Campo | Na rodada nova | Por quê |
|---|---|---|
| `semente` | **nova** | R2.1 — o baralho é embaralhado de novo (§4) |
| `jogadores` | zerados | mãos novas, mesa limpa |
| `monte`, `lixo`, `mortos` | novos | R2.3, R2.4, R2.5 |
| `jogadorDaVez` | o iniciante da rodada | R2.6 (§5) |
| `fase` | `Compra` | a rodada recomeça no começo |
| `placar` | **preservado** | R12.1 — é o acumulado da partida |
| `numeroDaRodada` | `+1` | |

Sete dos nove são exatamente o que `iniciarPartida` já produz. Só dois atravessam.

- `[D]` **S129** — `novaRodada(partida, semente)` é **função da engine**, chamada de `estado/`
  como `iniciarPartida`, e **não** um sétimo comando. Ela reusa `iniciarPartida` e sobrepõe o
  que atravessa.

> Não virar comando é o mesmo raciocínio da M3 e da M4, por outro caminho. Ali, pegar o morto e
> bater não são comandos porque são **automáticos**. Aqui, começar a rodada seguinte não é
> comando porque não é **jogada**: é uma ação de sessão, como iniciar a partida. `movimentosValidos`
> não muda, e a tabela de seis comandos do `domain.md` §6 continua fechada.

---

## 4. De onde vem a semente da rodada nova

Esta é a decisão que mais mexe com um requisito confirmado, e por isso vem com a alternativa
declarada.

A A5 proíbe a engine de ser fonte de aleatoriedade, e a S8 põe `Math.random` em `estado/`. A
primeira rodada segue esse caminho: `sortearSemente()` no despachante, `iniciarPartida(semente)`
na engine. A rodada seguinte pode fazer igual — ou derivar a semente da que já existe.

| | Como | Custo |
|---|---|---|
| **A** — semente nova por rodada | `estado/` sorteia de novo, igual à primeira | uma partida inteira **não** é reproduzível por um número só |
| **B** — semente derivada | `sementeDaRodada(semente, n)` na engine | precisa de uma constante de mistura, e mexer nela muda todas as sementes já usadas |

A **B** parece ganhar pela leitura literal da RNF1.3 — *"dada a mesma semente aleatória e a mesma
sequência de jogadas, produz exatamente a mesma partida"* —, e a **partida** ali é a partida
inteira, não a rodada.

O que desfaz o argumento é onde a reprodutibilidade é usada. **Nenhuma das quatro redes de
verificação passa por `estado/`**: as 200 partidas simuladas, os roteiros do navegador e os
testes chamam a engine direto. Um arnês que queira reproduzir uma partida de cinco rodadas
gera as cinco sementes como quiser — `criarAleatorio(semente)` resolve —, e continua sendo uma
partida reproduzível a partir de um número.

O que se perde é o que nunca existiu: uma partida **jogada no app** nunca foi reproduzível,
porque a semente da primeira rodada já é sorteada e nunca mostrada.

- `[D]` **S130** — Alternativa **A**. A semente da rodada nova vem de `estado/`, pelo mesmo
  caminho da primeira. A engine continua sem nenhuma fonte de aleatoriedade, e a RNF1.3 passa a
  se ler como *"determinística dadas as suas entradas"*, com a semente sendo uma entrada por
  rodada em vez de uma por partida.

> **Isto é um enfraquecimento de um requisito confirmado, e é o item para você olhar com mais
> cuidado nesta spec.** Se você quiser que um número reproduza uma partida inteira — por exemplo
> para relatar um bug dizendo só "semente 376" —, a resposta é a **B**, e ela custa uma função de
> mistura na engine.

---

## 5. Quem começa a rodada seguinte

> **R2.6** — *"Na primeira rodada, o jogador inicial é **sorteado**. Nas rodadas seguintes, o
> início **alterna**."*

Alternar exige saber quem começou a rodada que acabou, e **esse dado não está no estado**.
`jogadorDaVez` no fim da rodada não serve: depois de uma batida por descarte final ele aponta
para o adversário do batedor (S113), e depois de uma batida ao baixar aponta para o batedor. Ele
diz onde a rodada parou, nunca onde ela começou.

Três formas de descobrir:

| | Como | Custo |
|---|---|---|
| **A** — campo `iniciante` | `Partida` ganha um campo, alternado por `novaRodada` | um campo novo |
| **B** — derivar da semente | reexecutar `iniciarPartida(semente)` e ler o `jogadorDaVez` | reembaralha 104 cartas para ler um bit, e amarra o dado à ordem dos sorteios (S7) |
| **C** — derivar de `numeroDaRodada` | ímpar começa quem foi sorteado, par o outro | ainda precisa saber quem foi sorteado — cai na B |

- `[D]` **S131** — Alternativa **A**: `Partida` ganha `iniciante: JogadorId`, posto por
  `iniciarPartida` e **invertido** por `novaRodada`.

É a segunda coisa guardada em vez de derivada nas últimas duas fatias, e pelo mesmo motivo do
`placar` (S122): **ela sobrevive à rodada que a produziu**. A regra é a que a S120 já vinha
usando sem nome — derive o que o estado atual ainda contém; guarde o que a próxima rodada
apagaria.

---

## 6. O fim da partida cabe numa função

> **R12.1** — termina em **3000** acumulados.
> **R12.2** — verificação **ao fim de cada rodada**; ambos acima de 3000, vence quem tem mais;
> **empate exato**, joga-se mais uma rodada.

Lida como três casos, a regra pede três `if`. Lida junto, ela é uma frase:

> **Vence quem tem mais pontos, se o maior alcançou 3000 e não há empate.**

Confere: se só um passou de 3000, ele é necessariamente o de mais pontos — o outro tem menos
que ele, logo o `argmax` já o escolhe. Se os dois passaram, o `argmax` é exatamente o que a R12.2
manda. E o empate exato devolve **nada**, que é precisamente *"joga-se mais uma rodada"* — não
um caso à parte, e sim a ausência de vencedor.

- `[D]` **S132** — `vencedorDa(partida): JogadorId | null` é **derivado** de `placar`, e a R12.2
  inteira cai de uma expressão: `null` quando o máximo não chegou a 3000 **ou** quando há
  empate. Nenhum `if` por caso da regra é escrito.

E o estado de "partida encerrada" não precisa existir:

- `[D]` **S133** — **Não** há quarta fase. A partida acabou quando a rodada está encerrada
  **e** `vencedorDa` devolve alguém. `FaseDaRodada` continua com três valores, e a S112 continua
  valendo como está.

> A tentação de um `PartidaEncerrada` é forte porque a S112 acabou de provar que um estado no
> tipo pega erro em tempo de compilação. Mas ele confundiria dois níveis: a fase é **da rodada**
> — foi por isso que o tipo mudou de nome na H11 — e o fim da partida é do nível acima. Um
> quarto valor faria `movimentosValidos` e o painel de apuração ganharem um ramo que não têm o
> que dizer.

---

## 7. Interface

Duas telas mexem, e uma delas está vazia desde a tarefa 0.7.

### 7.1 O botão que faltava

A `screens.md` §1 já dizia que o painel de apuração *"o jogador fecha para seguir para a próxima
rodada"*, e a H12 o entregou sem botão de propósito (S119). Ele entra aqui, e tem **dois**
destinos possíveis.

- `[D]` **S134** — **Um** botão, com rótulo que muda conforme haja vencedor: *"Próxima rodada"*
  quando a partida continua, *"Ver o resultado"* quando acabou. Não dois botões, nem um botão
  que às vezes desaparece — a decisão de qual caminho seguir é do jogo, não do jogador.

### 7.2 A tela de fim

Hoje a rota `/fim` renderiza `<h1>Fim de partida</h1>`, o esqueleto que a tarefa 0.7 criou.

- `[D]` **S135** — A `/fim` mostra **quem venceu**, o **placar final** dos dois e um botão de
  **nova partida** (RF1.5). Sem partida em memória ela volta para `/`, pelo mesmo efeito que a
  `RotaPartida` usa desde a H1 (S14).

> A `screens.md` chama a `/fim` de tela e a apuração de painel, e a diferença sobrevive aqui: a
> apuração é **da rodada** e acontece com a partida atrás dela; o fim é **da partida** e não tem
> mesa para mostrar.

---

## 8. Critérios de aceite

Nenhum vem do `acceptance-tests.md`: a R12 e a RF1.5 não têm critério escrito lá. Todos nascem
nesta spec.

> A primeira escrita usou `CA-R2.6-1` para a alternância, e o `verificar-identificadores.py`
> reprovou **duas vezes seguidas**: o `-1` e o `-2` já são da **spec 0001**, onde falam do
> sorteio da primeira rodada. Virou `CA-R2.6-3`.
>
> As duas reprovações valem registrar juntas. Na primeira eu renumerei para o próximo número
> **sem conferir** que ele também estava tomado — a mesma pressa que criou a colisão original da
> Onda 2, e que o script existe para pegar. A correção certa não é "somar 1": é procurar o maior
> em uso. É a segunda vez em três fatias que ele morde, e agora por motivos diferentes — colisão
> com o `acceptance-tests.md` na H11, colisão com uma spec antiga aqui.

### 8.1 A rodada nova

| # | Dado | Então |
|---|---|---|
| **CA-R2.6-3** | rodada 1 iniciada pelo jogador `0` | a rodada 2 é iniciada pelo `1`, e a 3 pelo `0` de novo |
| **CA-S129-1** | rodada encerrada com jogos na mesa e cartas na mão | na rodada nova as mãos têm **11** cartas, as mesas estão vazias e os dois mortos estão intactos |
| **CA-S129-2** | qualquer rodada nova | `numeroDaRodada` avança em 1 e a fase é `Compra` |
| **CA-S129-3** | placar em `[430, -120]` | a rodada nova **preserva** o placar |
| **CA-M9-14** | rodada nova | as 104 cartas se conservam, sem `id` repetido |
| **CA-S131-1** | rodada nova | `iniciante` e `jogadorDaVez` **coincidem** no primeiro estado dela — o campo não é decorativo |
| **CA-S131-2** | rodada encerrada por descarte final | `iniciante` **não** mudou durante a rodada, embora `jogadorDaVez` tenha passado para o adversário |

### 8.2 O fim da partida

| # | Dado | Então |
|---|---|---|
| **CA-R12.1-1** | placar `[3010, 500]` com a rodada encerrada | o vencedor é o `0` |
| **CA-R12.1-2** | placar `[2990, 500]` com a rodada encerrada | **não** há vencedor — a partida continua |
| **CA-R12.2-1** | placar `[3200, 3100]` | vence o `0`, que tem mais pontos |
| **CA-R12.2-2** | placar `[3100, 3100]` | **não** há vencedor: empate exato joga mais uma rodada |
| **CA-S132-1** | placar `[3010, 500]` com a rodada **em andamento** | não há vencedor — a R12.2 verifica ao **fim** da rodada, nunca no meio |
| **CA-S133-1** | partida decidida | `fase` continua sendo `RodadaEncerrada`; não existe quarto valor |

### 8.3 Interface, nível 4

| # | Dado | Então |
|---|---|---|
| **CA-S134-1** | rodada encerrada sem vencedor | o painel oferece **"Próxima rodada"**, e não "Ver o resultado" |
| **CA-S134-2** | rodada encerrada com vencedor | o painel oferece **"Ver o resultado"**, e não "Próxima rodada" |
| **CA-S134-3** | clique em "Próxima rodada" | a mesa volta a ter 11 cartas na mão e o painel de apuração some |
| **CA-S135-1** | partida vencida pelo humano | a `/fim` diz que **você** venceu e mostra os dois totais |
| **CA-S135-2** | partida vencida pela IA | a `/fim` diz que o **adversário** venceu |
| **CA-S135-3** | `/fim` sem partida em memória | volta para a tela inicial |

---

## 9. Decisões

Oito, confirmadas em bloco em 2026-08-04.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **S128** | Escopo | A H13 encadeia rodadas e fecha a partida; monte esgotado segue na H14 |
| **S129** | Domínio | `novaRodada(partida, semente)` é **função**, não um sétimo comando |
| **S130** | **Requisito** | A semente da rodada nova vem de `estado/`; a RNF1.3 passa a ser "por entrada", não "por partida" |
| **S131** | Domínio | `Partida` ganha `iniciante`, invertido a cada rodada (R2.6) |
| **S132** | Domínio | `vencedorDa` é derivado, e a R12.2 inteira é "o maior, se chegou a 3000 e não empatou" |
| **S133** | Domínio | **Não** existe fase `PartidaEncerrada` — o fim é rodada encerrada com vencedor |
| **S134** | Interface | **Um** botão no painel, com rótulo conforme haja vencedor |
| **S135** | Interface | A `/fim` mostra vencedor, placar final e nova partida (RF1.5) |

### Onde eu erraria, se errasse

**A S130 é a proposta de risco, e ela não é sobre Buraco — é sobre um requisito seu.** É a
primeira vez neste projeto que eu proponho afrouxar a leitura de um `RNF` confirmado em vez de
cumpri-lo. O argumento está na §4 e me convence, mas é exatamente o tipo de decisão em que
"convence quem escreveu" não basta.

Duas outras que valem um olhar:

- A **S131** acrescenta um campo a `Partida`, e as últimas quatro fatias vinham removendo campos
  ou recusando novos. Se ele parecer supérfluo, a alternativa **B** da §5 existe e é derivável —
  só é cara e frágil.
- A **S128** entrega "várias rodadas" numa base em que a maioria das partidas simuladas não
  termina. Se você preferir a H14 **antes** da H13, a troca é defensável: a R4.6 é o que faz uma
  rodada sempre acabar, e encadear rodadas que acabam é mais fácil de verificar do que encadear
  rodadas que às vezes travam.
