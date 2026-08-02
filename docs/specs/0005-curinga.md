# Spec 0005 — O 2 como curinga

> Status: **rascunho anotado** — 11 propostas aguardando confirmação
> História: **H5** — "Uso um 2 como curinga para completar uma sequência"
> Fecha: R1.3, R1.4, R5.4, R5.5, I4, I7, M2
> Última atualização: 2026-08-02

Pendências a partir de **`S50`**, continuando a série global.

---

## 1. Escopo

### Entra

Baixar um jogo que contém **um** curinga: um `2` fazendo papel de outra carta. Junto com a H4,
fecha os sete invariantes de `Jogo` do [domain.md](../domain.md) §4.

### Não entra

| Fora | Vai para |
|---|---|
| Regularizar o curinga já baixado (R6.5, R6.6) | H9 |
| Aumentar jogo já na mesa (R6.2, R6.3) | H6 |
| Pegar o lixo (R4.2, R4.4) | H7 |
| **Categoria da canastra — `LIMPA`, `SUJA` (R8.2, R8.5)** | H8 |
| Bater e pegar morto (R9, R10) | H10 |

- `[P]` **S50** — A H5 **não** calcula categoria. Isso tem consequência
  direta nos critérios herdados, e está na §6.1: os dois `CA-R1.3-*` do
  [acceptance-tests.md](../acceptance-tests.md) §4.2 falam em `LIMPA` e `SUJA`, que é R8.

> A H4 herdou oito critérios sem tocar em nenhum. A H5 herda quatro e precisa **adaptar dois**,
> porque eles foram escritos na Onda 2 mirando o comportamento final e atravessam a fronteira
> desta fatia. A adaptação preserva o que eles provam — o mesmo `2♥` com resultados opostos — e
> troca a asserção de categoria por asserção de **posição**, que é o que a H5 tem.

---

## 2. A decisão que os documentos anteriores não tomaram

Esta é a spec inteira. As outras dez propostas caem dela.

### 2.1 Um conjunto de cartas não determina um jogo

O comando da H4 é `{ tipo: 'baixar'; cartas: string[] }`, e a engine deduz as casas. Com
curinga, **a dedução deixa de ser única**:

| Cartas | Leitura A | Leitura B |
|---|---|---|
| `2♥ 3♥ 4♥` | `2♥` natural na casa 1 → `2-3-4` | `2♥` curinga valendo `5♥` → `3-4-[5]` |

As duas são sequências válidas de três cartas do mesmo naipe. Não há regra que escolha entre
elas — e a escolha **importa**: pela R8.5 a primeira vira canastra limpa e a segunda, suja; e
pela R6.5 só a segunda tem curinga para regularizar depois.

> É o mesmo formato de armadilha da S41, e por isso vale nomear: ali, a intuição errada era
> tratar a ordem como anel; aqui, é supor que a engine consegue inferir o papel de cada carta.
> Nos dois casos a implementação ingênua **funciona** nos casos fáceis e erra em silêncio no
> caso que importa.

### 2.2 As alternativas

| # | Alternativa | A favor | Contra |
|---|---|---|---|
| **A** | O comando carrega o papel de cada carta | Sem ambiguidade; a engine não adivinha | Comando maior, e a H4 precisa migrar junto |
| **B** | O comando segue só com cartas, e a engine resolve por uma regra de precedência (ex.: natural primeiro) | Nada muda na H4 | **A interface perde uma jogada legal.** O jogador não consegue pedir a leitura B, e é ele quem decide se quer a canastra suja com curinga regularizável |
| **C** | O comando segue só com cartas, e o jogador escolhe o papel numa segunda tela | Comando pequeno | Interface passa a conduzir a regra, contra a T6 |

- `[P]` **S51** — **Alternativa A.** O comando `baixar` passa a carregar,
  para cada carta, a casa que ela ocupa:

```ts
type CartaBaixada = {
  readonly carta: string
  /** Ausente = natural. Presente = curinga fazendo papel deste valor (R5.5). */
  readonly representa?: Valor
}

{ tipo: 'baixar'; cartas: readonly CartaBaixada[] }
```

> A B é a tentadora, e é a que eu escolheria se olhasse só para o tamanho do diff. Ela cai por
> uma razão que não é de software: **remove uma decisão tática do jogador**. A R6.5 diz que um
> curinga do próprio naipe pode ser regularizado e um de outro naipe não — então "usar o 2♥
> como natural ou como curinga" é escolha de jogo, e a engine tomá-la por precedência é a
> interface decidindo regra com outro nome.
>
> O custo é real e vale dizer: a H4 migra junto. `descartar` não muda, mas os `baixar` que a
> H4 enumera passam a nascer com `representa` ausente, e a `CA-R6.1-1` muda de forma.

- `[P]` **S52** — `criarJogo` recebe as posições prontas, não as cartas:
  `criarJogo(dono, posicoes)`. A conversão de `CartaBaixada[]` para `Posicao[]` acontece em
  `aplicar`, junto com a checagem de posse.

> Mantém a propriedade que a H4 comprou: `criarJogo` é a única porta de `Jogo`, e um `Jogo`
> inválido não é representável. O que muda é que ela para de inferir e passa a **conferir**.

---

## 3. Comportamento

### 3.1 Os dois invariantes novos

- `[P]` **S53** — `Invariante` ganha `I4` e `I7`, e o tipo passa a ter os
  sete do [domain.md](../domain.md) §4:

| # | Invariante | Como a H5 o verifica |
|---|---|---|
| **I4** | No máximo **uma** posição `Curinga` (R1.4, R5.4) | Conta as posições `Curinga` |
| **I7** | Posição `Curinga` só com carta de valor `2` (R1.3) | Confere `carta.valor === '2'` |

Os cinco da H4 passam a ler a **casa da posição**, não o valor da carta:

- **I2** já dizia "toda posição `Natural`" — o curinga de outro naipe é legal por construção,
  e é isso que torna a canastra permanentemente suja da R6.5 uma consequência, não uma
  verificação.
- **I3** e **I6** passam a usar `representa` quando a posição é `Curinga`.
- **I5** é a que precisa de decisão própria, abaixo.

### 3.2 O `2` do próprio naipe na própria casa

R1.3 é explícita: um `2` na casa dele, no naipe dele, **é natural**. Duas leituras precisam
ser proibidas, e nenhuma delas está escrita em lugar nenhum:

- `[P]` **S54** — Uma posição `Curinga` cuja `carta` seja o `2` do naipe do
  jogo e cujo `representa` seja `'2'` é **inválida** — viola `I7` na intenção e a R1.3 na
  letra. Um `2♥` na casa 1 de uma sequência de copas é natural, e ponto.

- `[P]` **S55** — `I5` — "sem valores repetidos" — passa a olhar o **valor
  representado**, não o valor impresso na carta. Consequência: o jogo
  `A♥ 2♥ 3♥ 4♥ 5♥ 6♥ [2♥→7♥]` é **válido**, com um `2♥` natural na casa 1 e o outro `2♥`
  curinga na casa 6.

> Esta é a que mais quero que você olhe, e é regra da sua mesa, não software. As duas cópias do
> `2♥` aparecem no mesmo jogo com papéis diferentes. Pelo M2 isso é coerente — "curinga" é
> papel, não atributo —, e pela R5.6 o que se proíbe é repetir **valor na sequência**, o que
> não acontece: as casas 1 e 6 são distintas. Mas se na sua mesa isso soa errado, cai aqui.

### 3.3 Qual `2` a enumeração oferece

A H4 fixou na S47 que cópias são intercambiáveis e geram um comando só. Com curinga isso
**deixa de valer entre naipes**:

- `[P]` **S56** — `movimentosValidos` oferece um comando por **naipe de `2`
  disponível**, não um só. Dentro do mesmo naipe, a canônica continua sendo a de menor `id`
  (S47).

> Um `2♠` e um `2♦` como curinga numa sequência de copas produzem jogos que valem o mesmo
> **hoje** e valem diferente na H9: nenhum dos dois é regularizável, mas o `2♥` é. A M1 diz que
> as regras comparam naipe e valor — e aqui o naipe passa a importar. Oferecer um só esconderia
> a jogada que a R6.5 torna melhor.
>
> O teto é 4 comandos por trecho, não 8: as duas cópias do mesmo `2♥` continuam
> intercambiáveis entre si.

### 3.4 O curinga nas pontas

R5.5 diz que o curinga pode ocupar qualquer posição, **inclusive as pontas**.

- `[P]` **S57** — A enumeração oferece o curinga em três papéis: **tapar um
  buraco** no meio de um trecho, **estender** o trecho à esquerda, e **estender** à direita. A
  ponta esquerda não passa da casa 0 e a direita não passa da 13 (S41 e R5.3 continuam valendo).

### 3.5 A guarda da S45 continua

- `[P]` **S58** — O `baixar` que esvaziaria a mão continua fora da lista, e
  o gatilho continua sendo a H10. Nada nesta fatia o altera.

---

## 4. A enumeração, e por que a resposta da T7 não cobre isto

A H4 mediu **121 comandos, dos quais 99 `baixar`, em 0,12 ms**, e o gatilho da T7 saiu da
tabela do [roadmap.md](../roadmap.md) §3 com esse número.

**Aquele número é da enumeração sem curinga.** A H5 multiplica o espaço por três eixos: os
trechos com um buraco, as extensões nas duas pontas, e os até quatro naipes de `2`. Não é
honesto herdar o "não precisa otimizar" sem medir de novo.

- `[P]` **S59** — A H5 mede a enumeração outra vez, com o mesmo teto de
  50 ms e a mesma mão de 22 cartas, e **registra o número novo**. Se ele passar de ~2000
  comandos, a consulta `validar` da [screens.md](../screens.md) §3.1 volta à mesa — não pelo
  tempo, mas porque a T6 pressupõe que a interface consegue filtrar a lista.

> A conta de guardanapo, para saber o que esperar: cada trecho com exatamente um buraco rende
> até 4 comandos, e as extensões de ponta rendem mais 8 por corrida. Estimo **entre 400 e 900**.
> É estimativa `[P]`, e o critério existe justamente porque estimativa não é medição.

---

## 5. Interface

A S48 fez o botão de confirmar aparecer para **todo comando cujas cartas sejam exatamente a
seleção**. Com a §2.1, dois comandos diferentes passam a ter o mesmo conjunto de cartas.

- `[P]` **S60** — Quando mais de um comando casa com a seleção, cada botão
  se nomeia pelo que o distingue: **"Baixar"** para a leitura sem curinga, e
  **"Baixar com 2♥ valendo 5♥"** para cada leitura com curinga.

> É a menor mudança que preserva a T6. A tela continua sem saber o que é uma sequência: ela lê
> `representa` do comando e monta o rótulo. Se um dia dois comandos gerarem o mesmo rótulo, é
> sinal de que a enumeração está oferecendo jogada duplicada — e aí o defeito é da S56, não da
> tela.
>
> A alternativa que descartei era mostrar um botão "Baixar" só e abrir escolha depois. Cai pela
> mesma razão da Alternativa C da §2.2.

---

## 6. Critérios de aceite

### 6.1 Os herdados, e os dois que precisam de adaptação

O [acceptance-tests.md](../acceptance-tests.md) §4.2 definiu quatro:

`CA-R1.3-1` · `CA-R1.3-2` · `CA-R1.4-1` · `CA-R1.4-2`

`CA-R1.4-1` e `CA-R1.4-2` vão para os testes **como estão**.

Os outros dois pedem categoria de canastra, que é R8 e não existe até a H8:

| Critério | Como está escrito | Como a H5 o verifica |
|---|---|---|
| `CA-R1.3-1` | `A♥ 2♥ 3♥ 4♥ 5♥ 6♥ 7♥` → canastra `LIMPA` | o jogo é válido e **nenhuma posição é `Curinga`** |
| `CA-R1.3-2` | `5♥ 6♥ 7♥ [2♥→8♥] 9♥ 10♥ J♥` → canastra `SUJA` | o jogo é válido e **exatamente uma posição é `Curinga`** |

> Os dois continuam **definidos** no `acceptance-tests.md` — a tabela acima os cita, não os
> recria. A primeira versão desta seção os pôs em negrito na primeira coluna, que é a forma de
> definição, e o `verificar-identificadores.py` reprovou. Foi para isto que ele nasceu.

- `[P]` **S61** — A adaptação acima é registrada **no
  `acceptance-tests.md`**, não só aqui, com nota de que a asserção de categoria volta na H8. O
  par continua usando a **mesma carta** com resultados opostos, que é o que ele existe para
  provar (M2).

> Sem a nota no documento de origem, a H8 reencontraria dois critérios que parecem cumpridos e
> não estão. É a correção de documento anterior que o acordo pede — e o gatilho é a H8.

### 6.2 Os novos

| # | Dado | Então |
|---|---|---|
| **CA-S51-1** | `2♥ 3♥ 4♥` sem `representa` | jogo válido de 3 posições, **todas `Natural`** |
| **CA-S51-2** | `2♥ 3♥ 4♥` com `2♥` representando `5` | jogo válido, **uma posição `Curinga`** — o par decisivo da §2.1 |
| **CA-S51-3** | `baixar` com `representa` numa carta que não está na mão | `aplicar` devolve **recusa** |
| **CA-R5.5-1** | `5♥ 6♥ [2♠→7♥]` | válido — curinga na **ponta direita** |
| **CA-R5.5-2** | `[2♠→4♥] 5♥ 6♥` | válido — curinga na **ponta esquerda** |
| **CA-R5.4-1** | `5♥ [2♠→6♥] [2♦→7♥]` | **inválido** — I4, dois curingas |
| **CA-I7-1** | `5♥ 6♥ [7♥→8♥]` (um `7` fazendo papel de `8`) | **inválido** — I7, só o `2` é curinga |
| **CA-S54-1** | `A♥ [2♥→2] 3♥` — o `2♥` marcado como curinga da própria casa | **inválido** — R1.3, ele é natural |
| **CA-S55-1** | `A♥ 2♥ 3♥ 4♥ 5♥ 6♥ [2♥→7♥]` | **válido** — as duas cópias do `2♥`, uma natural e uma curinga |
| **CA-S56-1** | mão com `2♠` e `2♦`, e `5♥ 6♥` | há **dois** comandos `baixar`, um por naipe de `2` |
| **CA-S56-2** | mão com as duas cópias de `2♠`, e `5♥ 6♥` | há **um** comando, com a cópia de menor `id` |
| **CA-M9-8** | após `baixar` com curinga | a conservação das 104 se mantém |

### 6.3 O critério que responde à §4

| # | Dado | Então |
|---|---|---|
| **CA-S59-1** | a mesma mão de 22 cartas da `CA-S46-1`, mais os `2` de outros naipes | `movimentosValidos` responde em **menos de 50 ms**, e o número de comandos é registrado e comparado com os 99 da H4 |

Interface, nível 4:

| # | Dado | Então |
|---|---|---|
| **CA-S60-1** | seleção que casa com duas leituras | aparecem **dois** botões, e os rótulos **diferem** |
| **CA-S60-2** | o botão da leitura com curinga | ele baixa o jogo **com** a posição `Curinga`, não a outra leitura |

---

## 7. Pendências

**Onze propostas, nenhuma confirmada.** Responda no formato *"todas ok exceto S54 e S60"*.

| # | Assunto | Proposta |
|---|---|---|
| **S50** | Escopo | A H5 **não** calcula categoria; os `CA-R1.3-*` são adaptados |
| **S51** | API | **Alternativa A** — o comando `baixar` carrega o papel de cada carta |
| **S52** | API | `criarJogo` recebe **posições**, não cartas; a conversão fica em `aplicar` |
| **S53** | Domínio | `Invariante` ganha `I4` e `I7`, fechando os sete |
| **S54** | Domínio | `2` do próprio naipe marcado como curinga da própria casa é **inválido** |
| **S55** | Domínio | `I5` olha o **valor representado**; as duas cópias do `2♥` cabem no mesmo jogo |
| **S56** | Enumeração | **Um comando por naipe de `2`**, porque a R6.5 torna a escolha tática |
| **S57** | Enumeração | Curinga oferecido em três papéis: buraco, ponta esquerda, ponta direita |
| **S58** | Escopo | A guarda da S45 continua intacta |
| **S59** | Desempenho | A enumeração é **medida de novo**; o número da H4 não cobre a H5 |
| **S60** | Interface | Rótulo distingue as leituras: *"Baixar com 2♥ valendo 5♥"* |
| **S61** | Documento | A adaptação dos `CA-R1.3-*` é registrada no `acceptance-tests.md` |

### O que merece sua atenção

**Calibragem, e ela pesa mais aqui do que na H4.** A H4 era sobre a forma da sequência, que é
geometria. A H5 é sobre o que um `2` significa na sua mesa, e é a faixa em que erro a cada
seis. As três que mais quero que você olhe, em ordem:

- **S55 é a mais arriscada da spec.** Ela permite as duas cópias do `2♥` no mesmo jogo, uma
  natural e uma curinga. Deduzi isso do M2 e da R5.6, e nenhum dos dois trata do caso
  explicitamente. Se na sua mesa isso não se faz, cai — e leva junto um critério.
- **S51 é a maior em custo e a que mais me convence.** Ela troca a forma do comando e obriga a
  H4 a migrar. Aceitei o custo porque a alternativa barata remove uma escolha do jogador. Se
  você achar que na sua mesa ninguém pondera "uso este 2 como natural ou como curinga", a B
  volta a ser a certa e a fatia encolhe pela metade.
- **S56 depende de uma leitura da R6.5** — a de que usar o `2` do próprio naipe como curinga é
  jogada boa porque dá para regularizar depois. Se na sua mesa isso raramente compensa, a
  proposta vira ruído na interface e um comando só bastaria.

Sobre software estou tranquilo em duas: a **S52** preserva a propriedade que a H4 comprou —
`criarJogo` continua a única porta de `Jogo` —, e a **S59** existe justamente porque acabei de
fechar o gatilho da T7 com um número que **não cobre esta fatia**. Herdar aquele "não precisa
otimizar" seria o tipo de conclusão que envelhece mal em silêncio.
