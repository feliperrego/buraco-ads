# Spec 0010 — Pegar o morto

> Status: **confirmado** — 7 decisões, nenhuma pendência
> História: **H10** — "Fico sem cartas na mão e recebo um morto automaticamente"
> Fecha: R2.3, R9.1, R9.2, R9.3, R9.4, M3
> Última atualização: 2026-08-02

Decisões a partir de **`S102`**, continuando a série global.

---

## 1. O defeito que esta spec encontrou antes de começar

A **S70** afirmou, na spec 0006 §3.6, e você confirmou:

> *"Vale registrar a propriedade que isto preserva: com a guarda por comando, **nenhuma
> sequência de jogadas oferecidas esvazia a mão**. Baixar, aumentar, aumentar de novo — cada uma
> deixa ao menos uma carta, então a última também deixa."*

**Isso é falso**, e o erro é meu. A guarda vive em `adicionar`, que só é chamada por `baixar`,
`aumentar` e `regularizarCuringa`. O **`descartar` nunca passou por ela** — e ele tira exatamente
uma carta. Baixar até sobrar uma, depois descartar essa uma, e a mão zera.

Não é hipótese. Em **200 partidas** simuladas entre IAs:

| Medida | Valor |
|---|---|
| Partidas em que alguma mão chegou a **zero** | **58 de 200** |
| Ocorrências somadas | **7299** |
| Das quais causadas pelo **próprio descarte** | **2435** |

Ou seja: desde a H4 o jogo alcança rotineiramente o estado que a **R9.2** descreve — mão vazia
— e **nada acontece**. O jogador fica com zero cartas, compra uma no turno seguinte, e segue.
A regra existe no documento normativo e nunca existiu no código.

> É o mesmo formato do achado da H8, e a lição se repete: **quem acha é a spec que relê o
> requisito inteiro.** A diferença é que desta vez o requisito não foi esquecido — ele foi
> **declarado coberto** por uma proposta minha que não conferi. A S70 é a primeira decisão do
> projeto que precisa ser corrigida por estar errada, e não por ter envelhecido.

---

## 2. Escopo

### Entra

Pegar o morto como **efeito automático** (M3): sempre que a mão zera e há morto disponível, a
engine o entrega (R9.2), sem encerrar o turno (R9.4), e o mesmo jogador pode pegar os dois ao
longo da rodada (R9.3).

### Não entra

| Fora | Vai para |
|---|---|
| Bater, e a exigência de ter pegado morto (R9.5, R10.1, R10.2) | H11 |
| Penalidade por terminar sem morto (R9.6, R11.5) | H12 |
| Morto convertido em monte (R4.6, R4.7, R10.1.1) | H14 |

- `[D]` **S102** — A H10 implementa a **primeira metade** da R10.1.3 —
  *"é proibido realizar uma jogada que esvazie a mão quando não há morto disponível"* — e deixa
  a segunda, a ressalva da batida, para a H11. Não é invasão de escopo: sem ela, remover a
  guarda da S45 abriria um estado sem especificação, que é exatamente o que a guarda existia
  para evitar.

---

## 3. A guarda da S45 não sai: ela vira regra

A S45 foi descrita desde a H4 como *"a única decisão do projeto que **restringe o jogo além das
regras**"*, temporária, a ser removida na H10. A leitura estava certa enquanto a mão vazia não
tinha especificação. Agora tem, e a guarda muda de natureza em vez de sumir:

| | Antes da H10 | Depois da H10 |
|---|---|---|
| Regra | nenhuma — decisão nossa (S45) | **R10.1.3**, primeira metade |
| Condição | a jogada usa a mão inteira | a jogada esvazia a mão **e não há morto disponível** |
| Comandos cobertos | `baixar`, `aumentar`, `regularizarCuringa` | os três **mais o `descartar`** |

- `[D]` **S106** — A guarda **estreita e alarga ao mesmo tempo**: passa a
  permitir esvaziar a mão quando há morto esperando, e passa a valer para o `descartar`, que
  nunca cobriu. O gatilho do [roadmap.md](../roadmap.md) §3 não é resolvido aqui — ele muda de
  texto e continua aberto até a H11, que traz a ressalva da batida.

> A parte que mais me interessa é a segunda. A guarda foi escrita para os comandos que **põem
> cartas na mesa**, e a mão também esvazia por onde ela nunca olhou. Uma guarda que cobre três
> dos quatro caminhos é pior que nenhuma, porque quem a lê acredita estar protegido — foi
> exatamente o que a S70 escreveu.

### 3.1 A contagem também estava errada: são duas cartas, não uma

*Acrescentado depois de implementar a S106 e medir.* Com a guarda nova de pé, 200 partidas
simuladas entre IAs foram até o fim, e **15 delas pararam**: `movimentosValidos` devolveu `[]`
em fase `Acao`, e as quinze no mesmo estado — `mão=1, mortosRestantes=0`.

O estado é uma contradição entre duas regras que a S106 juntou sem reparar:

| Regra | Diz |
|---|---|
| **R7.1** | o turno **termina** com um descarte obrigatório |
| **R10.1.3** | sem morto disponível, é proibido esvaziar a mão |

Com uma carta na mão, descartá-la esvazia — proibido —, e não descartar também é proibido. A
mesa congela.

O defeito não é da R10.1.3: é da **contagem** que a S45 escolheu em julho e a S106 herdou.
Reter "ao menos uma carta" é uma condição sobre o **turno**, e o turno acaba no descarte. Logo,
antes dele são duas: uma para descartar e uma para ficar. A S45 contou cartas quando devia ter
contado o fim do turno, e o erro atravessou seis fatias sem aparecer porque, até a H10, quem
tinha uma carta só na mão sempre podia descartá-la.

- `[D]` **S109** — Sem morto disponível, uma jogada oferecida precisa deixar **≥ 2** cartas na
  mão. Uma linha em `adicionar`: `mao.length - comando.cartas.length < (podeEsvaziar ? 0 : 2)`.
  Com morto, o limite é zero e a guarda some — a S106 continua inteira.

Medido antes de propor, e de novo depois de implementar:

| | Antes da S109 | Depois |
|---|---|---|
| partidas travadas em fase `Acao` | **15 / 200** | **0 / 200** |
| mortos entregues em 200 partidas | 84 | **84** |

O segundo número é o que faz a decisão barata: apertar a guarda **não** custou nenhum morto.
Era o risco real — uma guarda mais estreita poderia bloquear justamente a jogada que zera a mão
e chama a R9.2.

> Duas correções da mesma decisão na mesma fatia, e as duas vieram de **medir o que a spec
> afirmou sem medir**. A S70 afirmou uma propriedade falsa; a S45 escolheu um número sem derivá-lo
> da regra que o justificava. Nenhuma das duas caiu em revisão, em teste ou em `tsc` — caíram
> quando 200 partidas foram jogadas até o fim. Simular a partida inteira é uma rede nova, e é a
> primeira que pega **contradição entre regras**, não erro de código.

---

## 4. Pegar o morto é efeito, não comando

O [domain.md](../domain.md) §1.3 já decidiu (M3):

> *"Pegar o morto não é fase nem comando. É um **efeito automático**: sempre que a mão de um
> jogador zera e há morto disponível, a engine o entrega. O jogador nunca 'pede' o morto."*

- `[D]` **S103** — O efeito é aplicado em **um lugar só**: uma função
  `entregarMortoSePreciso(partida)` chamada no fim de `aplicar`, depois do efeito do comando e
  antes de devolver o `Resultado`.

```ts
// em aplicar.ts, no ponto único de saída de cada comando bem-sucedido
return comMorto({ tipo: 'sucesso', partida: ... })
```

Duas alternativas foram descartadas, e vale dizer por quê:

| # | Alternativa | Por que não |
|---|---|---|
| **A** | Cada comando que pode zerar a mão chama o efeito | Quatro chamadas, e o quinto comando futuro esquece uma. É exatamente o erro que a S70 cometeu |
| **B** | O efeito vira comando `pegarMorto` na lista de movimentos | Contradiz o M3, e a interface passaria a oferecer uma jogada que o jogador não escolhe |

> A **A** é o caminho de menor esforço, e o argumento contra ela não é estético: a S70 provou,
> neste mesmo projeto, que uma guarda replicada por comando deixa um comando de fora e ninguém
> nota por seis fatias.

### 4.1 A R9.4 é o critério que já rejeitou uma proposta minha

O [acceptance-tests.md](../acceptance-tests.md) §4.5 avisa:

> *"CA-R9.4-1 é o critério que rejeitou a minha proposta original (P21). Quem implementar
> 'pegar o morto encerra o turno' falha exatamente aqui."*

- `[D]` **S107** — O efeito **não toca** `fase` nem `jogadorDaVez`. Quem as
  move é o comando, e por isso os dois casos da R9.4 caem de graça:

| A mão zerou por | O comando faz | Resultado |
|---|---|---|
| `baixar` / `aumentar` / `regularizarCuringa` | fase continua `Acao` | pega o morto e **ainda precisa descartar** |
| `descartar` | fase vira `Compra`, a vez passa | pega o morto e o **turno termina** |

> É a mesma forma da S66 e da S78: a regra vira consequência de onde o código **não** mexe. A
> P21 morreu porque queria que o efeito encerrasse o turno — e para isso ele teria que mexer na
> fase, que é justamente o que esta decisão proíbe.

---

## 5. Qual morto, e em que ordem as cartas entram

- `[D]` **S104** — O morto entregue é o **primeiro não reclamado**, na ordem
  em que estão na `Partida`. A R4.7 já decidiu que não há ambiguidade — *"como os mortos não têm
  dono (R2.3), são intercambiáveis"* —, então a escolha é livre e o critério registra qual foi
  feita. As onze cartas entram no **fim** da mão, na ordem do morto, herdando a S23 e a S77 sem
  alteração.

---

## 6. `mortosPegos`: campo ou derivado?

O [domain.md](../domain.md) §3 dá ao `Jogador` um campo `mortosPegos ∈ {0, 1, 2}` (R9.3), e o
`Morto` tem `reclamadoPor: JogadorId | null`. **As duas coisas dizem o mesmo**, e a H10 é a
primeira fatia que precisa manter alguma delas em dia.

| # | Alternativa | A favor | Contra |
|---|---|---|---|
| **A** | Derivar: `mortosPegos` sai de `mortos.filter(...)` e o campo é **removido** | Uma verdade num lugar só, como a S71 fez com a janela e a S85 com a categoria | Contradiz uma linha `[D]` do `domain.md` §3, que precisa de nota |
| **B** | Manter o campo, atualizado pelo efeito | Nada no `domain.md` muda | Dois lugares para a mesma verdade, e o segundo só é lido na H11 — tempo de sobra para divergirem |

- `[D]` **S105** — **Alternativa A.** O campo sai, e o `domain.md` §3 ganha
  nota explicando. A R9.3 continua garantida: o limite de dois é o número de mortos que existem,
  não um contador a validar.

> Esta é a terceira vez que o projeto escolhe derivar em vez de armazenar, e vale dizer o que
> mudou desde a primeira. Na S71 e na S85 o campo **não existia** — a decisão foi não criá-lo.
> Aqui ele existe, e removê-lo contradiz um `[D]`. A regra do acordo cobre o caso: ADR novo se
> mudasse arquitetura, nota no documento de origem caso contrário. É nota.

---

## 7. Interface

- `[D]` **S108** — A metade observável é o painel de **mortos**, que já
  mostra *"2 mortos por pegar"* desde a H1 e passa a mudar sozinho. A mão saltar de zero para
  onze é o outro sinal, e nenhum dos dois precisa de elemento novo na tela.

> Vale nomear o que **não** é feito aqui: nenhum aviso, nenhuma mensagem de "você pegou o
> morto". A RF2.1 diz que a interface mostra o estado, e o estado mudou em dois painéis que já
> existem. Um aviso seria a primeira notificação do projeto, e ela não tem requisito.

---

## 8. Critérios de aceite

O [acceptance-tests.md](../acceptance-tests.md) §4.5 define **quatro**, e a `CA-R9.3-2` remete à
`CA-R10.1.3-1`, que é da H11. Das três restantes, só a `CA-R9.3-1` vai para o teste com o nome
dela: a `CA-R9.4-1` e a `CA-R9.4-2` são exatamente o par da §8.2, e estão nos testes como
`CA-S107-1` e `CA-S107-2` — mesmo caso, nome da decisão que o implementa.

Ao todo: **16 critérios novos** nas tabelas abaixo, mais a `CA-R9.3-1` herdada.

### 8.1 Domínio e comandos

| # | Dado | Então |
|---|---|---|
| **CA-R9.2-1** | mão com uma carta e morto disponível | ao descartá-la, a mão fica com **11** e os mortos restantes caem para 1 |
| **CA-R9.2-2** | mão que zera ao **baixar**, com morto disponível | pega o morto na mesma jogada |
| **CA-S103-1** | mão que zera ao **regularizar o curinga** | pega o morto — o efeito vale para **todos** os comandos, não só os que a S70 cobria |
| **CA-S104-1** | dois mortos intactos | o entregue é o **primeiro**, e as onze cartas entram no **fim** da mão, na ordem do morto |
| **CA-S105-1** | jogador que pegou um morto | `mortos` registra `reclamadoPor`, e **não existe** campo `mortosPegos` a divergir |
| **CA-S106-1** | mão com uma carta e **nenhum** morto disponível | o `descartar` daquela carta **não** é oferecido (R10.1.3) |
| **CA-S106-2** | mão com uma carta e morto disponível | o `descartar` **é** oferecido — a guarda não é sobre esvaziar, é sobre esvaziar **sem morto** |
| **CA-S106-3** | mão que a jogada usaria por inteiro, com morto disponível | `baixar` **é** oferecido, ao contrário do que a S45 fazia |
| **CA-M9-12** | após pegar o morto | a conservação das 104 se mantém, sem `id` repetido |

### 8.2 A R9.4, e o par que rejeitou a P21

| # | Dado | Então |
|---|---|---|
| **CA-S107-1** | mão zerada **antes** do descarte, com morto | a fase continua `Acao` e a vez **não** passa — há descarte pendente |
| **CA-S107-2** | mão zerada **pelo** descarte, com morto | a fase vira `Compra` e a vez **passa** |

> Os dois são o par que trava a interpretação. Uma implementação que encerre o turno ao pegar o
> morto passa no segundo e falha no primeiro, que é o que a `CA-R9.4-1` já dizia em julho.

### 8.3 Interface, nível 4

| # | Dado | Então |
|---|---|---|
| **CA-S108-1** | um morto já reclamado | o painel mostra **1 morto por pegar** |
| **CA-S108-2** | os dois reclamados | o painel mostra **nenhum morto por pegar**, e não um "0" solto |

### 8.4 A contagem da S109

| # | Dado | Então |
|---|---|---|
| **CA-S109-1** | sem morto, jogada que deixaria **uma** carta na mão | **não** é oferecida — e a que deixa duas **é**, que é a âncora positiva |
| **CA-S109-2** | sem morto, `aumentar` que deixaria uma carta | **não** é oferecido — a guarda é uma só, e vale para os três comandos |
| **CA-S109-3** | sem morto, qualquer jogada oferecida | depois dela **ainda existe jogada** — a mesa nunca para |

> A `CA-S109-3` é o critério que fala do defeito, e não do conserto. Ela aplica **cada** comando
> oferecido e exige que a lista seguinte não seja vazia; com a contagem antiga, o `baixar` de
> `5♥ 6♥ 7♥` numa mão de quatro cartas a reprova, que é o travamento medido.

---

## 9. Decisões

Sete, confirmadas em bloco em 2026-08-02, mais a **S109**, que nasceu da medição depois de
implementar e foi confirmada em separado.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **S102** | Escopo | A H10 implementa a **primeira metade** da R10.1.3; a ressalva da batida é da H11 |
| **S103** | Domínio | O efeito é aplicado num **lugar só**, no fim de `aplicar` |
| **S104** | Domínio | O **primeiro** morto não reclamado; as cartas entram no fim da mão |
| **S105** | Domínio | `mortosPegos` **sai** do `Jogador` e passa a ser derivado de `mortos` |
| **S106** | Enumeração | A guarda **estreita e alarga**: cobre o `descartar` e libera com morto disponível |
| **S107** | Domínio | O efeito **não toca** fase nem vez — é daí que os dois casos da R9.4 caem |
| **S108** | Interface | Sem aviso novo: o estado muda em dois painéis que já existem |
| **S109** | Enumeração | Sem morto, a jogada deixa **duas** cartas: uma para descartar, uma para ficar |

### Onde eu erraria, se errasse

**Calibragem:** 101 decisões, 5 quedas, todas no `rules.md` — e três fatias seguidas sem queda.
Mas esta spec começa com uma **correção de uma decisão minha já confirmada**, e isso é novo:

- A **S70** afirmou uma propriedade que eu não medi, e ela é falsa. Você confirmou aquela spec
  em bloco, e a afirmação estava no corpo dela, não na tabela de pendências. **A tabela é o que
  se lê; o corpo é o que se assina.** Vale considerar se afirmações de propriedade — "nenhuma
  sequência de jogadas faz X" — deveriam entrar na tabela como proposta própria, para receberem
  o mesmo olho que as decisões.
- E a segunda correção veio **depois** desta spec ser confirmada: a **S45** escolheu o número 1
  sem derivá-lo da R7.1, e o número certo era 2 (§3.1). Duas decisões minhas caídas na mesma
  fatia, as duas sobre a mesma guarda, e nenhuma delas sobre o domínio — o que muda a leitura da
  calibragem acima. O padrão não é "erro sobre Buraco": é **afirmação sobre o comportamento do
  sistema inteiro feita sem simular o sistema inteiro**.

Das propostas em si, a de domínio é uma só:

- **S104** decide qual morto sai primeiro. A R4.7 diz que tanto faz, então é livre — mas se na
  sua mesa houver alguma convenção sobre qual monte vira morto de quem, é aqui que se diz.

E a de software que eu olharia: a **S105** remove um campo que o `domain.md` decidiu ter. É a
escolha coerente com a S71 e a S85, e é a primeira vez que "derivar em vez de armazenar" desfaz
algo já escrito em vez de evitar escrever.
