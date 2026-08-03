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
  dois lugares. Nasceu de uma colisão real: um `grep` de padrão incompleto declarou
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
**H11** estão fechadas e implementadas.

**O Marco 0, o Marco I e o Marco II estão fechados, e o Marco III começou.** Existe um jogo em
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

**A próxima é a H12** — a apuração da rodada (R11.1–R11.6, RF4.2, M5) —, e ela não tem spec.
Hoje a rodada encerra e o **placar não muda**: `0 × 0` na tela depois da batida é a lacuna que a
H12 fecha, e ela é proposital (S110).

Doze coisas que valem saber antes de mexer no que estas oito fatias deixaram:

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

> **Duas correções de contagem, e as duas do mesmo tipo.** Esta seção já disse "os 20 critérios"
> da spec 0004 quando são **24**, e o rascunho da spec 0005 disse "onze propostas" quando eram
> **12**. As duas saíram de contagem à mão. Hoje os números daqui vêm de script: a 0004 tem 24
> critérios e a 0005 tem 19, e é assim que devem nascer.

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

> **O padrão da S63 apareceu pela terceira vez, e vale procurá-lo em vez de esperar.** Uma
> escolha registrada só em ordem de array atravessa fatias sem incomodar e vira decisão quando
> alguma fatia a torna consequente: o `id` derivado na H4→H6, a ponta do Ás na H4→H8. O
> candidato seguinte é a **ordem em que `movimentosValidos` devolve os comandos** — ninguém a
> decidiu, a interface já a usa para ordenar botões, e a H10 mediu que ela é observável. Entrou
> na tabela de gatilhos do `roadmap.md` §3 com prazo na **H15**, quando a heurística vai querer
> ordenar por qualidade.
