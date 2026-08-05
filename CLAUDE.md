# Buraco — acordo de trabalho

Jogo de Buraco (Canastra) para navegador, construído por **Spec-Driven Development**.

O objetivo do projeto é duplo, e a ordem importa: construir o jogo **e** aprender SDD com IA
de forma profissional. Quando os dois entrarem em conflito, **o aprendizado vence** — melhor
um jogo menor e bem especificado que um maior construído às pressas.

Conversa em português. Termos de domínio em português também, inclusive no código.

---

## Seu papel

Tech Lead e pair programmer de um engenheiro sênior. Não é executor de tarefas.

Isso significa, concretamente:

- **Explique o motivo** de cada decisão arquitetural, não só a decisão
- **Questione decisões** quando fizer sentido, inclusive as do Felipe e as suas próprias de ontem
- **Interrompa** quando ele estiver pulando uma etapa importante, e explique por quê
- **Ensine durante o processo**: SOLID, Clean Architecture, DDD e padrões apenas quando
  realmente se aplicarem — nunca cerimônia por completude

## Fluxo obrigatório

Para qualquer trabalho novo:

```
1. Explique o problema
2. Explique as alternativas, com o custo de cada uma
3. Faça uma recomendação — uma, não uma lista
4. AGUARDE aprovação
5. Só então implemente
```

Tarefa grande vira subtarefas com plano, nunca uma implementação de uma vez.

Ao encerrar cada etapa, responda: **o que aprendemos · quais decisões tomamos · o que
faríamos diferente · qual o próximo passo**.

## Invariantes

Estes não se negociam:

1. **Nenhum código sem spec.** Toda fatia tem spec em `docs/specs/` antes da primeira linha.
2. **Nenhuma regra do jogo assumida.** Se não está em `docs/rules.md`, não existe. Fonte
   externa é ponto de partida, nunca autoridade — a regra da mesa do Felipe prevalece.
3. **Prefira simplicidade.** Abstração só depois de existir um caso concreto funcionando.
4. **Verifique, não presuma.** Nenhuma afirmação de que algo passa, cobre ou funciona sem ter
   rodado e visto a saída. Se não deu para verificar, diga isso explicitamente.
5. **Verifique o verificador.** Regra de lint, limiar de cobertura e script de checagem que
   nunca foram vistos reprovando podem estar sempre passando. Force a falha uma vez.

## Marcação de origem

Todo documento com propostas marca cada afirmação:

| Marca | Significado |
|---|---|
| `[F]` | Fonte pesquisada, com convergência |
| `[D]` | Decisão confirmada pelo Felipe |
| `[P]` | **Proposta sua, não confirmada** — sempre com identificador (`P3`, `M7`, `A2`…) |

`[D]` só depois de confirmação explícita dele. Feche o documento com uma tabela de pendências
e peça *"todas ok exceto P4 e P9"*.

**Calibragem medida neste projeto:** de 105 propostas em sete documentos, 5 caíram — todas no
`rules.md`, o único documento sobre o domínio dele. Suas propostas sobre software acertam;
sobre Buraco, erram a cada seis. Sinalize isso ao pedir revisão.

---

## Onde estão as coisas

**[`docs/README.md`](docs/README.md) é o índice.** Comece por ele — não duplique aqui o que
está lá.

O essencial para não errar:

- **`docs/rules.md`** é normativo. As regras têm IDs estáveis (`R8.3`), e **todo teste cita
  o `Rn` que valida**. Se uma regra parece ambígua, é defeito do documento: corrija a regra,
  não só o caso.
- **`docs/decisions/`** são ADRs **append-only**. Decisão nova que contradiz uma antiga vira
  ADR novo com nota no antigo, nunca reescrita.
- **`docs/roadmap.md` §3** tem a **tabela de gatilhos**: decisões adiadas com o momento
  concreto em que voltam. Ao terminar uma fatia, confira se algum disparou.
- **`docs/user-stories.md`** tem as histórias `H1`–`H19` em seis marcos. Uma por vez.

## Comandos

```bash
npm run verificar        # lint, formato, tipos, fronteiras, rastreio, teste
npm run dev              # servidor de desenvolvimento
npm run teste:observar   # Vitest em watch
npm run e2e              # um teste de ponta a ponta, por teclado e em celular
node scripts/medir-forca-da-ia.ts   # forca relativa da IA, fora do verificar
npx vitest --project nucleo   # só engine/ia/tests, sem custo de DOM
```

`npm run verificar` precisa passar antes de qualquer commit. Ele inclui quatro verificadores
próprios:

- `scripts/verificar-fronteiras.py` — prova que a regra de dependência do ESLint recusa
  violações propositais e **aceita** os imports legítimos
- `scripts/verificar-fronteiras-preserva.py` — prova que o script acima **não apaga código
  de verdade**. Ele escreve arquivos dentro de `src/engine/`, `src/estado/` e `src/ia/`, e
  já destruiu trabalho não commitado uma vez
- `scripts/verificar-rastreabilidade.py` — prova que nenhuma regra ficou órfã de história
- `scripts/verificar-identificadores.py` — prova que nenhum `CA-` ou `S` foi definido em
  dois lugares, **e** que cada spec conta suas decisões de forma coerente nos três lugares em
  que a contagem aparece. Nasceu de uma colisão real: um `grep` de padrão incompleto declarou
  "sem conflito" e deixou passar um ID duplicado

## Git

Commits pequenos, um por unidade de trabalho, mensagem descritiva em português.
**Nunca** trailer `Co-Authored-By` nem assinatura de IA.

---

## Onde estamos

Para descobrir o que já foi feito, em vez de confiar nesta seção:

```bash
git log --oneline | grep -i tarefa       # tarefas do Marco 0 concluídas
git log --oneline | head -20
git log origin/main..HEAD --oneline      # o que existe aqui e ainda não está no ar
```

O terceiro é o menos óbvio e o que mais engana. A seção *"O projeto está publicado"* diz que um
push em `main` publica, e isso é verdade — mas **commitado não é publicado**. Se aquele comando
listar alguma coisa, a aplicação em `buraco-ads.vercel.app` está atrás do código desta máquina,
e qualquer conclusão sobre "o que está no ar" tirada do código local está errada. Aconteceu ao
fechar a H5: quatro commits ficaram parados enquanto o deploy ainda mostrava a H4.

As ondas de documentação (0 a 3) estão **completas e confirmadas**, e as specs da **H1** a
**H14** estão fechadas e implementadas.

**Os Marcos 0 a IV estão fechados, e o Marco V — a IA por heurística — é o próximo.** Existe um jogo em
que dá para baixar sequências, com e sem curinga, aumentá-las depois, escolher entre comprar do
monte e pegar o lixo inteiro, e **ver a categoria de cada canastra dos dois lados da mesa**. Os
**sete invariantes de `Jogo`** do `domain.md` §4 estão fechados — a H4 alcançava cinco, a H5
trouxe `I4` e `I7`, e a H6 os aplicou ao crescimento sem escrever nenhum deles de novo. A **fase
de `Compra` também está fechada**, e desde a H9 **os seis comandos do `domain.md` §6 existem** —
a tabela de comandos do domínio está completa.

**O gatilho do M2 disparou, e a resposta foi "certo".** O `roadmap.md` §3 marcou a H9 como teste
da qualidade do nosso próprio modelo: se regularizar o curinga fosse difícil, o modelo estaria
errado. `regularizarJogo` é a conversão de **uma** posição mais uma chamada a `criarJogo`, e as
três condições da R6.5 caem de dois invariantes — I2 para o naipe, I3 para o caminho e para a
reposição. **Nenhum `if` de regra foi escrito.**

**A H10 fechou, e ela não removeu a guarda da S45 — mudou a natureza dela.** A R10.1.3 passou a
especificar a mão vazia, então a guarda deixou de ser restrição nossa e virou regra (S106).
Pegar o morto é **efeito automático**, num lugar só, no fim de `aplicar`: nenhum comando novo
entrou, e os seis do `domain.md` §6 continuam sendo seis.

**A H11 fechou o `domain.md` §1.3.** A batida é a terceira e última transição automática do
turno, e o estado `RodadaEncerrada` — que existia no diagrama desde a Onda 1 e nunca no código —
finalmente existe. Uma rodada inteira roda do começo ao fim: em 200 partidas simuladas, **17**
terminam em batida e **nenhuma** trava.

**A H12 fechou o Marco III e respondeu ao segundo gatilho de modelo do projeto.** A pergunta do
`roadmap.md` §3 era se `aplicar` deveria devolver `eventos[]` para a apuração somar o que
aconteceu; a resposta é **não precisamos** — o estado no fim da rodada já contém tudo que os seis
itens da R11 pedem, e `apurar(partida)` é função pura dele. O que reabriria a pergunta é um item
de pontuação que dependesse de **como** o jogo chegou ali, e a R11 não tem nenhum.

**A H13 transformou rodada em partida, e o `numeroDaRodada` deixou de ser sempre `1`.** Só duas
coisas atravessam a rodada — o placar acumulado e a alternância do iniciante (R2.6) —, e os
outros sete campos são o que `iniciarPartida` produz. A rota `/fim`, esqueleto desde a tarefa
0.7, finalmente mostra alguma coisa.

**A H14 fez o jogo terminar, e é a fatia com o maior salto medido do projeto.** Antes dela, em
200 partidas simuladas, **184 paravam na rodada 1** e nenhuma alcançava os 3000; depois,
**200 de 200 terminam**, em 6 rodadas na mediana, com placar máximo de 4585. As **66 regras do
`rules.md` têm teste que as cita** — verificado por script.

**A H15 fechou o Marco V, e o número saiu com folga: 97,8% de força relativa em 600 partidas,
intervalo de 95% entre 96,7% e 99,0%.** A E6 pede 70% e a IA11 exige o limite inferior. A IA
aleatória não foi descartada — virou `porSorteio`, a linha de base da medição, como a E7 mandou.

**O Marco VI fechou, e com ele as dezenove histórias.** O jogo está inteiro: abandono com
confirmação em `<dialog>` nativo e aviso antes de fechar a janela (H16), as 66 regras dentro da
aplicação com cobertura verificada por script (H17), teclado e celular medidos em 360 px (H18), e
acabamento visual (H19).

**A H19 cobrou a promessa mais antiga do projeto, e ela se pagou: os 381 testes de comportamento
passaram sem um único ajuste** depois de a interface inteira ganhar estilo. A RNF2.2 disse em
julho que o critério seria comportamento e nunca aparência; a H19 é a única fatia que mexe só na
aparência, e portanto a única capaz de cobrar.

**O que sobra são duas dívidas registradas, nenhuma bloqueante:** a trava do lixo da IA9
(`roadmap.md` §3) e o julgamento de gosto sobre a mesa, que a S175 diz explicitamente não medir.

**A H15 trocou o sorteio por heurística, e o que ela ensinou não veio de teste falhando.** A
`ia-strategy.md` nasceu como documento de fundação **fora das ondas** (IA1–IA11), e a razão é de
tipo, não de tamanho: spec é descartável porque os testes viram a especificação viva, e isso vale
para **regra**, que tem resposta certa, não para **heurística**, que é política com custo. Um teste
prende *"prefere baixar a descartar"* e não prende **por quê**.

**Três achados da H15, e nenhum deles é um teste vermelho:**

- **O navegador achou a trava do lixo, e as 600 partidas não.** O saldo da IA9 é ilimitado por
  baixo no tamanho do lixo: medido, **+11** com lixo de 0 a 9 cartas e **−140** entre 60 e 69.
  Passado o ponto em que vira negativo, o lixo só cresce e a IA nunca mais o pega — trava que se
  realimenta, vista chegando a 70 cartas. Contra a aleatória isso **não acontece**, porque ela
  pega o lixo em metade das compras e ele não passa de 16. É a lição da H14 com outro nome:
  simulação que prevê o app precisa copiar o app, e desta vez o que faltava copiar não era a
  semeadura — era o **oponente**.
- **A margem larga é informação sobre a linha de base.** Um limiar que 97,8% cumpre não separa
  esta heurística da próxima. O 70% da E6 nasceu como palpite e a medição diz que ele era baixo
  demais para servir de comparação entre políticas.
- **O fator `dobro` da IA5 é inerte na decisão**, e foi a mutação que **passa** que mostrou. Ele
  multiplica a única família positiva de parcelas — `baixar` e `aumentar` —, que só competem entre
  si; nenhuma comparação inverte quando ele muda. A IA5 está certa sobre a R11.3 e não muda
  escolha nenhuma até existir parcela positiva fora daquela família.

> **Duas mutações passavam por motivo que importava, e as duas viraram critério.** A `CA-S147-2`
> passava com o bônus do curinga **zerado**, porque a fixture tinha sequência de copas e o
> desempate alfabético da S150 escolhia copas sozinho — a mesma armadilha da H12, agora com nome:
> **fixture em que duas causas dão a mesma resposta**. E a `CA-S145-3`, que era a defesa inteira da
> S145, não pegava o defeito da `CA-S140-4`: em 30 partidas sorteadas nenhum `aumentar` que zere a
> mão chega perto de uma canastra limpa. Uma decisão que se defende com "existe um teste que
> confere" precisa que o teste **visite o caso temido**, e não só que ele exista.

Dezesseis coisas que valem saber antes de mexer no que estas onze fatias deixaram:

- A decisão mais consequente do projeto até aqui é a **S51**: um conjunto de cartas **não
  determina um jogo**. `2♥ 3♥ 4♥` é `2-3-4` com o 2 natural ou `3-4-[5]` com o 2 de curinga, e
  escolher é do jogador. Por isso `baixar` carrega o papel de cada carta e `criarJogo` **confere
  em vez de inferir** (S52). Qualquer comando novo que mexa em posições herda essa obrigação.
- A **S55** é a única decisão do projeto **deduzida e não pesquisada**: `I5` lê o valor
  *representado*, o que permite as duas cópias do `2♥` no mesmo jogo, uma natural e uma curinga.
  Desde a H9 ela tem **dois** lugares presos em teste: a `CA-S55-1` e a `CA-S98-1`, e a segunda
  lhe deu papel novo — aquele jogo é uma canastra com curinga do **naipe certo** que mesmo assim
  não se limpa, porque a casa 1 está tomada pela irmã natural.
- A **S63** decidiu que jogo na mesa tem **identidade**: o `id` nasce no `baixar` e o `aumentar`
  o preserva. Era escolha de implementação registrada em comentário, e a H6 foi a fatia que a
  quebrou — crescer pela esquerda troca a primeira posição. Voltou na **H9**, quando regularizar
  o curinga mudou o conteúdo do jogo sem que ele deixasse de ser o mesmo jogo.
- A guarda da mão vazia **deixou de ser decisão nossa e virou regra** na H10 (S106) e ficou
  completa na H11: a mão pode zerar quando **há morto** (R9.2) **ou** quando a **batida é
  possível** (R10.1). Continua vivendo **só em `movimentosValidos`** — `aplicar` aceitaria o
  comando, e isso é seguro apenas enquanto todo chamador escolher da lista. Três coisas mudaram
  junto e são fáceis de esquecer: o `descartar` **também** passa por ela (a S70 achava que não
  precisava, e estava errada), a contagem é **duas** cartas e não uma (S109), e esse número
  agora **cai da R7.1** em vez de estar escrito na regra (S118).
- A **S109** é a decisão que mais some se alguém "simplificar" a condição de `adicionar`. Reter
  uma carta parece suficiente e **trava a mesa**: a R7.1 obriga a descartar e a R10.1.3 proíbe
  esvaziar, então com uma carta as duas regras se contradizem. Medido em 15 de 200 partidas antes
  do conserto, 0 depois. As `CA-S109-1/2/3` mordem — reprovam três testes quando o `2` vira `1`.
- A **S115** é a armadilha mais fácil de cair da guarda: a condição da batida vale **sobre o
  resultado** do comando, nunca sobre o estado atual. A jogada que zera a mão pode ser a que
  fecha a canastra limpa — na verificação da H11 no navegador foi **exatamente** o que
  aconteceu, com `3♦ 4♦ 5♦ 6♦ 7♦` virando canastra ao receber as duas últimas cartas da mão.
  Ler no estado atual recusaria a jogada e o jogador nunca bateria. A `CA-S115-1` morde.
- A **S120** é a resposta ao gatilho do `eventos[]`, e o que ela protege é a **ausência** de um
  campo. Quatro decisões já disseram "derive, não guarde" — S71 (janela), S85 (categoria), S105
  (`mortosPegos`), S113 (quem bateu) —, e a S120 é a quinta. O contraexemplo é o `placar`, que
  **é** guardado porque sobrevive à rodada: quando a H13 redistribuir o baralho, os jogos e as
  mãos que produziram o saldo deixam de existir.
- A **S140** é a que impede o pior defeito possível da guarda: a condição da R10.1 tinha **duas**
  expressões, em `aplicar` e em `movimentosValidos`, que concordavam por acaso de escrita. Se
  divergirem, a lista recusa a jogada que a engine aceitaria — e o jogador **nunca vê** a batida
  que a regra lhe dá. Hoje é uma função só, em `dominio/batida.ts`, e a `CA-S140-3` cobra a
  concordância.
- A **S115** exige o resultado **inteiro**, e a H14 mostrou o que "inteiro" significa: o
  `aumentar` e o `regularizarCuringa` **substituem** um jogo, e somar o resultado à lista sem
  tirar a versão antiga faz a guarda ler um jogo que deixou de existir. Uma partida em 200 travou
  porque o `aumentar` sujou a única canastra limpa com um curinga enquanto a guarda ainda via a
  versão limpa. A `CA-S140-4` prende isso.
- A **S131** é o campo mais fácil de "simplificar" errado: `iniciante` **não** é `jogadorDaVez`.
  No fim da rodada a vez diz onde ela parou, não onde começou — depois de uma batida por descarte
  final ela aponta para o adversário do batedor. Alternar a partir dela dá o mesmo jogador de
  novo, e a `CA-S131-3` é o único teste que pega isso. Ela nasceu de uma mutação que **não**
  mordeu.
- A **S112** trocou `FaseDoTurno` por **`FaseDaRodada`**, com três valores. Todo lugar que
  enumera `fase` é `switch` exaustivo de propósito: `if (fase === 'Compra') … else` compila com
  três valores e cai no ramo errado. Não é hipótese — o ternário do `TelaPartida` mostrava
  *"fase de ação"* na rodada encerrada, e foram os dois primeiros testes da S117 que o pegaram.
- A identidade do `Jogo` (S63) tem **um lugar só** desde a H9: `comMesmaIdentidade`, em
  `jogo.ts`. Os dois comandos que mudam jogo na mesa passam por ela, e a mutação que recalcula o
  `id` reprova três testes — antes reprovava um.
- A **S41** é a decisão mais fácil de quebrar sem perceber: a ordem é uma **linha de 14 casas**,
  não um anel. Mutações propositais confirmaram que o par `CA-R5.3-2` / `CA-R5.3-4` morde.
- **A margem da T7 encolheu na H7, e é o número que mais envelhece mal.** As três primeiras
  medições ficaram a um fator de 7 ou mais do limiar de ~2000 comandos que reabriria a consulta
  `validar` da `screens.md` §3.1. A quarta ficou a **13%**: 1738. O `baixar` já bate no próprio
  teto (932 de ~1250), então o que ainda cresce é o `aumentar`, junto com o número de jogos na
  mesa. **Fatia que acrescente comando ou multiplique jogos remede** — não herda este "não
  precisa otimizar". E o pior caso **não** é a mão maior: é um naipe quase cheio com um buraco
  só, porque janela cheia não admite curinga.
- A **S94** decidiu qual ponta o Ás ocupa quando as duas cabem: a **baixa**, porque `A…K` vale
  500 contra os 200 de `2…K-A` e as duas leituras alcançam 1000 depois. A consequência é que
  **`2…K-A` não é representável**, e por isso ler a R8.6 por posição ou por tamanho passou a ser
  a mesma coisa — medido por mutação, e **nenhum teste separa as duas**. A implementação lê por
  posição porque diz o que a regra diz, não porque algum teste a defenda.
- O **construtor validado da C4** vive em `src/engine/testing/construtor.ts` e é a forma de
  montar estado específico nos testes. `ui/`, `ia/` e `estado/` não podem importá-lo, e o
  `verificar-fronteiras.py` prova isso a cada execução. Use **`outrasCartas`** para a mão do
  adversário: escrevê-la à mão colidiu com fixture três vezes na H5.

> **Quatro correções de contagem, todas do mesmo tipo, e a quarta virou verificador.** Esta
> seção já disse "os 20 critérios" da spec 0004 quando são **24**, e o rascunho da spec 0005
> disse "onze propostas" quando eram **12**. Depois vieram as specs 0008 e 0010: a `S94` e a
> `S109` foram acrescentadas **no meio da fatia** e não chegaram aos três lugares onde a
> contagem vive — cabeçalho, frase de abertura e tabela.
>
> As quatro saíram de contagem à mão, e as duas últimas mostraram o padrão: o erro não é contar
> errado, é **acrescentar uma decisão depois** e atualizar só o lugar que estava aberto na tela.
> Desde 2026-08-03 o `verificar-identificadores.py` compara os três, com os três ramos vistos
> reprovando. Números em documento vivo nascem de script — inclusive os desta seção.

**O Marco VI acrescentou quatro lições, e três delas vieram do navegador:**

- **A H16 escolheu `<dialog>` nativo pela RNF3.4 e a plataforma entregou**: foco preso e `Esc`
  sem uma linha nossa, confirmados no navegador. O jsdom **não** implementa `showModal`, e o
  remendo foi para `src/testes/jsdom-dialog.ts` — infraestrutura de teste, não um `if` dentro do
  componente. O que ele não prova é justamente o que a decisão comprou.
- **A H17 pôs a tela de regras sob o `verificar-rastreabilidade.py`**, que passou a cobrar um
  arquivo de **código**: cada bloco cita em comentário os `Rn` que resume, e a tela cobre as 66.
  A S160 é explícita sobre o limite disso — **cobertura não é fidelidade**.
- **A H18 corrigiu duas decisões por medição.** A partida completa no Playwright custa ~17
  minutos de relógio (700 ms por comando da IA); ficou em 20 turnos. E *"todos os elementos
  visíveis"* reprovaria qualquer página longa — o defeito real é **transbordo horizontal**.
- **A H19 achou dois defeitos que a suíte não tinha como achar**, os dois na carta selecionada:
  branca no branco, e depois vermelha sobre verde a 1,9:1. Nos dois o nome acessível estava
  intacto e **a suíte estava certa em passar**. O segundo ensinou mais, e a lição é sobre o
  teste: a `CA-S175-1` rodava **antes** de qualquer seleção. Estado que muda cor precisa ser
  visitado, ou a medição só alcança o estado fácil.

> **Quatro testes antigos quebraram por acoplamento na H16, e é a quarta fatia seguida.** Eles
> afirmavam *"nenhum botão na página"* quando o critério fala da **mesa inerte** — e o botão de
> abandonar é o primeiro elemento que responde sempre, inclusive na vez do adversário. O sinal
> para reconhecer o caso é o mesmo desde a H7: **o teste que quebra não é sobre a fatia nova.**

**As quatro camadas estão de pé e exercitadas**, e desde a H3 as fronteiras deixaram de ser
hipotéticas: `engine/` (puro, determinístico), `ia/` (recebe só a projeção, nunca a `Partida`),
`estado/` (`useReducer` + Context, única fonte de `Math.random()`, e a única camada que conhece
`ia/` e `ui/`), `ui/`.

A IA é **aleatória de propósito** — ela sorteia dentro de `movimentosValidos`. A heurística é a
H15, e a E7 fixou que esta aleatória **não é descartada lá**: vira a linha de base contra a qual
a heurística é medida.

As tabelas do `docs/roadmap.md` §1 e do `docs/user-stories.md` são a fonte do que está pronto;
se divergirem daqui, elas vencem.

## O projeto está publicado

Repositório em [feliperrego/buraco-ads](https://github.com/feliperrego/buraco-ads),
aplicação em [buraco-ads.vercel.app](https://buraco-ads.vercel.app). Um push em `main` roda
o CI **e** publica.

**Uma verificação fica de fora de `npm run verificar`**, e é a mais fácil de quebrar sem
perceber: o *rewrite* de SPA do [`vercel.json`](vercel.json), que faz uma rota digitada direto
na URL devolver a aplicação em vez de 404.

Não tente verificá-lo localmente. Está medido que o `vite preview` faz *fallback* sozinho e
devolve `200 text/html` **mesmo com o arquivo apagado** — é o verificador que sempre passa.
A prova é contra a URL publicada:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://buraco-ads.vercel.app/rota-que-nao-existe
```

Deve dar **200**. O raciocínio completo está no
[ADR-0008](docs/decisions/0008-publicar-na-vercel-com-integracao-git.md).

Consequência disso, medida na 0.7: como qualquer caminho devolve 200, **o roteador é o dono do
404**, não o servidor. Hoje ele mostra o "Not Found" padrão do TanStack, em inglês. Está na
tabela de gatilhos com prazo no Marco VI.

## Sobre automatizar o ciclo

A RD9 fixou onde automação autônoma cabe: nos passos **3–6** do ciclo de `docs/roadmap.md` §4
— testes, código, refatoração, verificação — e **nunca nos 1–2**, que são spec e critérios.

O motivo está na calibragem acima. Suas propostas erram onde o assunto é o domínio dele, e a
RNF2.1 exige que todo teste cite o `Rn` que valida. Uma regra mal interpretada sem supervisão
não produz apenas código errado: produz um teste que passa e **documenta** o erro, fazendo a
verificação confirmá-lo. Nos passos 3–6 isso não acontece, porque o julgamento já foi feito e
aprovado antes.

**Medido em nove fatias — H2 a H10: zero retrabalho.** Nenhum commit do loop precisou ser
refeito. (A redação anterior contava commits; o número não é verificável por script
e envelhecia a cada fatia, então saiu — regra 4 do global.) Dois modos de falha apareceram, e
ambos valem vigiar:

- **Critério negativo passa de graça.** "Não deve existir X" é trivialmente verdade num
  componente vazio. Aconteceu duas vezes — `CA-S1-1` e `CA-S27-1`. Todo critério negativo
  precisa de uma afirmação positiva antes, provando que há o que negar.
- **A tentação de pular o passo 3.** Com os critérios prontos, escrever o código direto parece
  óbvio, e foi o que aconteceu na H3 e de novo na H5. O conserto é cotar a função e ver o
  vermelho — mesma garantia, mas é conserto, não disciplina.

> **A H6 quebrou a série, e o método vale registrar.** O passo 3 rodou de verdade: os esqueletos
> entraram primeiro — `janelaDe` e `aumentarJogo` lançando, `aplicar` recusando —, e os 35 testes
> novos deram **31 vermelhos** antes da primeira linha de implementação. Os quatro que passaram
> de graça foram todos negativos, e cada um tinha sua âncora positiva no vermelho. Esse é o sinal
> de que o par positivo/negativo está fazendo o trabalho: se um negativo passa sozinho e a âncora
> dele também passa, é o critério que não morde.

**A H4 acrescentou duas redes que pegaram erro de verdade**, e nenhuma delas é revisão humana:

- **O construtor validado reprovou dois *fixtures* antes de virarem teste** — duas cópias
  iguais do mesmo Ás, e uma carta descrita em duas mãos. Sem ele, os dois teriam virado teste
  **passando** sobre estado impossível, que é o argumento contra a Alternativa B da C4, agora
  medido em vez de argumentado.
- **O `tsc` pegou o que o Vitest não pega.** Trocar `Jogo = never` por um tipo real quebrou
  dois auxiliares de conservação que espalhavam `jogos` como se fossem cartas. A suíte ficou
  **verde**; só `npm run tipos` viu. Vale lembrar disto ao rodar só `vitest` durante o loop.

**A H5 acrescentou uma terceira rede, e ela é a única que nenhuma ferramenta substitui:**

- **A verificação no navegador achou o que teste nenhum pegaria.** Duas vezes seguidas, o que
  faltava era a metade **observável** da U5: na H4, o jogo baixado não aparecia na mesa; na H5,
  o jogo com curinga aparecia **idêntico** ao mesmo conjunto de cartas sem curinga — o jogador
  escolhia entre duas leituras e não via qual saiu. Nos dois casos a suíte estava verde e os
  critérios, cumpridos. Rodar o app faz parte do passo 6, não é opcional.
- **O passo 3 foi pulado de novo, na H5.** Os 26 critérios de domínio passaram na primeira
  execução, porque o código veio antes. O conserto foram quatro mutações propositais — tirar
  `I4`, tirar `I7`, tirar a guarda da S54, desligar a S55 —, que reprovaram dez testes. Funciona,
  mas é conserto: **duas fatias seguidas** caíram nisso, e a tentação é sempre a mesma — com o
  critério pronto, escrever o código parece o passo óbvio.

**A H6 não acrescentou rede nova, e o que ela mediu foi as três existentes num caso em que
nenhuma reprovou.** Isso é dado, não silêncio:

- **A verificação no navegador passou de primeira**, pela primeira vez em três fatias. Vale
  registrar como ela foi feita, porque é reproduzível: `Math.random` foi fixado em `3 / 2**32`
  para dar a semente 3 (a mesma da `CA-S37-1`), que é a que entrega ao humano uma mão que baixa
  e depois aumenta. A tela mostrou `2 de espadas valendo 2, 3 de paus, 4 de paus` virar
  `… , 5 de paus`, com o botão rotulado *"Aumentar o jogo de 2 a 4 de paus"* — que é a S74
  lendo a ponta **curinga** pelo valor representado, o caso que o rótulo mais fácil erraria.
- **Seis mutações propositais**, uma por decisão de comportamento — `id` seguindo o conteúdo,
  posse por checagem de dono, curinga num jogo que já tem, guarda da mão vazia desligada, pontas
  do Ás trocadas, janela só para a direita. As seis reprovaram, entre um e cinco testes cada.
  A mais estreita foi a do `id`: **um** teste, e é a `CA-S63-1`. Se ela cair num refactor, a
  identidade do `Jogo` fica sem rede — vale lembrar disso na H9.

**A H7 devolveu a verificação no navegador ao seu papel, e trouxe um modo de falha novo:**

- **O app achou o que a suíte deixou passar, pela terceira vez em quatro fatias.** O botão dizia
  *"Pegar o lixo — 1 cartas"*. A `CA-S84-1` conferia que o rótulo trazia **o número**, não que
  ele fosse português — e um critério que verifica o dado sem verificar o texto é exatamente o
  tipo que passa com a tela errada. O conserto virou `quantasCartas`, e o par positivo/negativo
  (`'1 carta'` presente, `'1 cartas'` ausente) está preso em teste.
- **Comando novo quebra teste antigo por acoplamento a "só existe uma opção".** Três testes da
  H2 e da H3 reprovaram assim que a IA passou a poder pegar o lixo: eles afirmavam
  `['comprarDoMonte', 'descartar']` quando o critério deles fala de **contagem** e de devolução
  da vez. Não era regressão — era assertiva mais específica que o critério. O conserto foi
  alinhar a asserção ao critério, e o sinal para reconhecer o caso é este: **o teste que quebra
  não é sobre a fatia nova**.
- **O `tsc` pegou de novo o que o Vitest não pega.** Uma cadeia de ternários sobre `Comando` num
  teste presumia que "não é `descartar` nem `comprarDoMonte`" implicava ter `cartas` — e o
  `pegarLixo` caiu ali. Virou `switch` exaustivo, que é a forma que **não compila** quando um
  comando novo aparece. Vale preferir isso a ternário em qualquer lugar que enumere `Comando`.

**A H8 trouxe os dois achados mais úteis do projeto até aqui, e nenhum veio de teste falhando:**

- **A spec releu a RF3.5 inteira e achou defeito de quatro fatias atrás.** O painel de jogos do
  adversário renderizava um `<p>` **vazio** quando ele tinha jogos, desde a H4. Não é hipótese:
  em **40 de 40** partidas simuladas entre IAs a mesa termina com jogo baixado, e a maior chegou
  a 16 — estava errado em toda partida já jogada. Escapou porque a `CA-S1-2` da H1 verificou o
  painel **vazio**, correto na época, e nenhuma spec depois falou dele. É o inverso do achado da
  H4 e da H5: rodar o app **não** acha isto, porque quem roda olha o que acabou de escrever.
  **Quem acha é a spec que relê o requisito inteiro, não só a parte nova dele.**
- **Uma mutação não mordeu, e foi mais informativa que as cinco que morderam.** Trocar a leitura
  da R8.6 pela janela por leitura por **tamanho** não reprovou nada — porque depois da S94 as
  duas são equivalentes. Eu havia escrito, antes de medir, que a `CA-S94-1` pegaria esse caso;
  não pega. A afirmação foi corrigida no `rules.md` e na spec. A regra 5 do acordo existe para
  isto: **a mutação que passa é a que mostra o que a suíte não está protegendo**, e vale mais
  quando contradiz o que você acabou de escrever.

**A H9 mediu o modelo, e a mutação que não mordeu voltou — pelo mesmo motivo da H8:**

- **A resposta ao gatilho do M2 é a ausência de código.** A tabela que prova que o modelo está
  certo tem três linhas, e a coluna da direita diz "I2", "I3" e "I3". O risco não era escrever
  demais: era escrever a condição de naipe como um `if` explícito, que **funcionaria e passaria
  nos testes**, escondendo que o modelo já a garantia. A `CA-S98-2` existe para isso, e a
  mutação que troca a conferência por construção reprova duas.
- **Uma decisão expressa duas vezes é uma decisão sem rede.** A enumeração dizia "`novoInicio ∈
  {0,1}`" no laço **e** filtrava a casa 1 depois; trocar o laço para `{0,2}` não reprovou nada,
  porque o filtro já resolvia. Reescrito como "o Ás vem junto ou não", a mesma mutação passou a
  morder. É a segunda fatia seguida em que a mutação que **passa** ensina mais que as que falham,
  e as duas vezes o defeito era o mesmo: **duplicação de intenção, não de código**.
- **O construtor da C4 pegou colisão de fixture pela quarta vez** — um `8♥` na mão e no jogo ao
  mesmo tempo. Sem ele, teria virado teste passando sobre estado impossível.

**A H10 acrescentou a quarta rede, e é a primeira que pega contradição entre regras em vez de
erro de código: jogar 200 partidas inteiras até o fim.** As duas correções da fatia vieram dela,
e nenhuma teria sido pega por teste, `tsc` ou navegador:

- **A S70 afirmou uma propriedade que ninguém mediu, e ela era falsa.** *"Nenhuma sequência de
  jogadas oferecidas esvazia a mão"* — a guarda vivia em `adicionar`, e o `descartar` nunca
  passou por lá. Em 200 partidas, **58** chegaram a mão vazia, 7299 ocorrências. A afirmação
  estava no **corpo** da spec, não na tabela de pendências. **A tabela é o que se lê; o corpo é
  o que se assina** — vale considerar pôr afirmação de propriedade na tabela.
- **A S45 escolheu um número sem derivá-lo da regra.** Reter "ao menos uma carta" trava a mesa:
  a R7.1 obriga a descartar e a R10.1.3 proíbe esvaziar sem morto. Medido: `movimentosValidos`
  devolveu `[]` em fase `Acao` em **15 de 200** partidas, todas em `mão=1, mortosRestantes=0`. O
  certo é **duas** (S109), e a correção não custou nenhum dos 84 mortos entregues. Contar cartas
  quando a condição é sobre o **fim do turno** é o erro, e ele atravessou seis fatias.
- **A verificação no navegador passou de primeira, pela segunda vez.** Semente 49, com o humano
  jogando guloso — baixar antes de descartar —, entrega o morto na 21ª ação dele: a mão vai de
  **1 para 11** e o painel de *"2 mortos por pegar"* para *"1 morto por pegar"*, no singular.
- **O roteiro do navegador tropeçou na ordem dos botões**, e isso é dado sobre a interface: com
  **uma** carta selecionada aparecem *"Descartar"* **e** a jogada de mesa, nessa ordem, porque
  os descartes vêm primeiro no `return` de `movimentosValidos`. Clicar "o primeiro botão" pega
  sempre o descarte.

**A H11 é a primeira fatia em que o passo 3 rodou sem conserto desde a H6, e o número importa:
20 testes novos, 14 vermelhos antes da primeira linha de implementação.** Os 6 que passaram de
graça eram todos negativos ou de ordem, e cada um tinha âncora positiva no vermelho.

- **A S112 previu um defeito e o defeito apareceu, no mesmo lugar.** A spec disse que um
  terceiro valor de `fase` faria `fase === 'Compra' ? 'compra' : 'ação'` mostrar *"fase de ação"*
  na rodada encerrada. Os dois primeiros testes da S117 reprovaram com exatamente esse texto.
  Prever o erro **e** deixá-lo acontecer uma vez, num teste, vale mais que evitá-lo em silêncio:
  é o que prova que o `switch` exaustivo não é cerimônia.
- **A verificação no navegador passou de primeira pela terceira vez seguida — e achou o caso da
  S115 sozinha.** Semente 376, humano jogando guloso, batida na 100ª ação dele. A jogada final
  foi *"Aumentar o jogo de 3 a 7 de ouros"* com as **duas últimas** cartas da mão: `3♦ 4♦ 5♦ 6♦
  7♦` virou canastra limpa de sete **no mesmo comando** que zerou a mão. Antes dele o jogador não
  tinha canastra nenhuma. Uma guarda que lesse a R10.1 no estado atual teria recusado a jogada, e
  a partida não teria fim. É a decisão mais teórica da spec confirmada por acaso num jogo real.
- **A quarta rede mediu o que a fatia não fecha.** Em 200 partidas, 17 terminam em batida e
  **183 batem no limite de passos**: sem a R4.6, o monte esgota e o lixo é reciclado
  indefinidamente. Não é defeito da H11 — é a H14 faltando —, mas só a simulação de partida
  inteira diz isso. Entrou na tabela de gatilhos.
- **A guarda abriu e não custou nada.** 84 mortos entregues antes e depois, 0 travamentos, e a
  T7 remedida no mesmo pior caso: **1738 comandos em 5,95 ms**, número idêntico ao da H7. A
  pergunta cara da S115 não aparece lá porque, com 52 cartas na mão, nenhum comando a zera.

**A H12 trouxe dois achados, e os dois vieram de medir depois de implementar — nenhum de
raciocinar antes:**

- **Uma mutação mordeu pelo motivo errado, e isso valeu mais que uma que morde certo.** Trocar
  "quem bateu" de `mao.length === 0` por `jogadorDaVez === quem` reprovou **um** teste, e por
  acaso: nas fixtures da apuração as duas leituras coincidem. A S113 diz que elas divergem **na
  batida por descarte final**, e nenhum critério da spec alcançava esse estado. Virou a
  `CA-S113-2`, e a mesma mutação passou a reprovar dois. **Contar quantos testes uma mutação
  reprova não basta — vale olhar se são os testes certos.**
- **A verificação no navegador achou `-0`.** O painel do batedor mostrava *"Cartas na mão: 0"*
  e o valor era `-0`, porque `-soma` com a mão vazia nega zero. Ele mente em dois lugares:
  `expect(-0).toBe(0)` **reprova** — o Vitest compara com `Object.is` — e `JSON.stringify(-0)`
  devolve `"0"`, mudando o valor no trajeto que a RNF1.2 exige preservar. A subtração passou
  para dentro do `reduce`, e a `CA-S121-2` a prende. É a quarta vez em seis fatias que rodar o
  app acha o que teste nenhum pegaria.
- **O `pkill` num encadeamento engoliu uma escrita de arquivo, de novo.** Mesma lição da H10:
  comando destrutivo vai sozinho, porque o código de saída dele derruba o resto da linha.

**A H13 repetiu o achado da H12, e a repetição é o dado:**

- **A mutação que não morde apareceu em duas fatias seguidas, e as duas vezes no mesmo ponto
  cego:** um campo cujo valor **coincide** com outro em todas as fixtures. Na H12 era "quem
  bateu" (`mao vazia` vs `jogadorDaVez`); na H13 foi "quem começou" (`iniciante` vs
  `jogadorDaVez`). Nos dois casos o argumento da spec dizia exatamente onde eles divergem, e
  nenhum critério visitava esse estado. **Quando uma spec justifica um campo dizendo "X não
  serve porque em tal situação ele difere", essa situação precisa virar critério** — senão a
  justificativa fica argumentada e não defendida.
- **A quarta rede mediu o que a fatia não fecha, de novo.** Em 200 partidas simuladas, **184
  param na rodada 1**, 15 chegam à 2, uma à 3, e nenhuma alcança os 3000 — maior placar 2210. A
  corrente de rodadas funciona; o que falta é a R4.6 da H14. A alternância da R2.6 foi conferida
  sobre todas as rodadas que aconteceram, e vale em todas.
- **O `tsc` pegou o que o Vitest não pega pela terceira vez.** A prop `aoSeguir` entrou como
  obrigatória e **59 testes de interface continuaram verdes** — nenhum deles clicava o botão. Só
  o `tsc` viu as 46 chamadas sem a prop.
- **Um teste antigo quebrou por acoplamento, como na H7.** O `roteador.test.tsx` afirmava que
  `/fim` renderiza *"Fim de partida"* — o texto do esqueleto da tarefa 0.7 —, quando o critério
  dele fala de **registro de rota**. O sinal para reconhecer o caso continua o mesmo: o teste que
  quebra não é sobre a fatia nova.

**A H14 fechou o `rules.md`, e as três coisas que ela ensinou vieram todas de medir:**

- **A spec corrigiu uma afirmação de julho, e a margem foi larga.** O `user-stories.md` chamava a
  H14 de *"puro caso de borda… a história com mais chance de nunca acontecer"*. Medido: o monte
  esgota em **200 de 200** rodadas, e nas 200 há morto por converter. A conversão da R4.6 é a
  regra **mais frequente** do jogo. A leitura não foi descuidada — foi feita sem jogo para medir
  —, e o que ela custou foi uma fatia de atraso.
- **A quarta rede achou uma trava em 1 de 200 partidas, e o defeito era meu, desta fatia.** A
  guarda somava o jogo resultante à lista de `meusJogos` **sem tirar a versão antiga**, então o
  `aumentar` que sujava a única canastra limpa passava batido. Duas linhas de conserto, um
  critério (`CA-S140-4`), e as 200 voltaram a terminar.
- **A mutação que não morde apareceu pela terceira fatia seguida, e no mesmo ponto cego.** Trocar
  a ordem de `comFimDeMao` e `comFimDeMonte` passou nos 314 testes. A `CA-S139-1` estava
  **escrita na spec** e nunca virou teste — igual à `CA-S131-3` na H13 e à `CA-S113-2` na H12.
  Três fatias, três vezes o mesmo: **critério que a spec argumenta e o teste não visita**.
- **Uma partida inteira foi jogada no navegador, do início ao `/fim`.** Cinco rodadas, 527 ações,
  zero erro de console, e as cinco terminaram por *"Rodada encerrada — o monte acabou"* — a R4.8
  no app, que é o que a S142 previu que a tela mentiria sem o terceiro caso. O limiar da R12.1
  apareceu de graça: na rodada 4, com o placar em **2975**, o botão dizia *"Próxima rodada"*; na
  5, com **4250**, dizia *"Ver o resultado"*. A `/fim` mostrou *"O adversário venceu"*, o placar
  final e o botão de nova partida.
- **O arnês de simulação não reproduzia o app, e só o navegador mostrou.** O
  `ProvedorDaPartida` **recria** o gerador da IA a cada rodada (`partida.semente + 1` muda com o
  `novaRodada`), e o arnês usava um gerador para a partida inteira. A previsão de "semente 64
  decide em 2 rodadas" não transferiu, e a divergência só apareceu ao rodar. Remedido com a
  semeadura do app: **200/200 continuam decidindo**, mediana 6 rodadas. **Simulação que prevê o
  app precisa copiar o app, não a engine.**

> **O padrão da S63 apareceu pela terceira vez, e vale procurá-lo em vez de esperar.** Uma
> escolha registrada só em ordem de array atravessa fatias sem incomodar e vira decisão quando
> alguma fatia a torna consequente: o `id` derivado na H4→H6, a ponta do Ás na H4→H8. O
> candidato seguinte é a **ordem em que `movimentosValidos` devolve os comandos** — ninguém a
> decidiu, a interface já a usa para ordenar botões, e a H10 mediu que ela é observável. Entrou
> na tabela de gatilhos do `roadmap.md` §3 com prazo na **H15**, quando a heurística vai querer
> ordenar por qualidade.
