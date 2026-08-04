# Roteiro

> Status: **confirmado** — 9 decisões, nenhuma pendência
> Deriva de: [user-stories.md](user-stories.md) · [testing-strategy.md](testing-strategy.md) · [architecture.md](architecture.md)
> Última atualização: 2026-07-31

## Como ler este documento

Este documento é **curto de propósito**, e isso é bom sinal: a ordem de entrega já está nos
Marcos I a VI de [user-stories.md](user-stories.md), e não há prazos porque
[vision.md](vision.md) estabeleceu que o aprendizado vence a velocidade.

Sobra o que nenhum outro documento cobre:

1. O trabalho técnico que **não é história de usuário** e precisa existir antes da H1
2. Os **gatilhos de reavaliação** das decisões que adiamos
3. Como uma história vira código

O item 2 é a razão principal deste documento existir. Sem ele, "reavaliar depois" nunca chega.

Pendências: `RD1`…`RDn`.

---

## 1. Marco 0 — fundação técnica

Não é história de usuário: ninguém "vê" configuração. Mas a H1 não começa sem isso.

| # | Tarefa | Fecha |
|---|---|---|
| **0.1** | Vite + React + TypeScript | Stack |
| **0.2** | Estrutura de pastas de `src/` | A7 |
| **0.3** | ESLint + Prettier, **proibindo asserção de não-nulo** | Stack, ADR-0007 |
| **0.4** | **Regra de dependência como configuração de ESLint** | A2, A3, C6 |
| **0.5** | Vitest em dois projetos, com relatório e limiar de cobertura | E4 |
| **0.6** | CI no GitHub Actions rodando `npm run verificar` e `npm run build` | E5, E9 |
| **0.7** | TanStack Router com as quatro rotas vazias | ADR-0005, T1 |
| **0.8a** | Repositório no GitHub e primeiro push | 0.6, ADR-0008 |
| **0.8** | Publicação na Vercel, com *rewrite* de SPA em `vercel.json` | ADR-0008, RNF3.1 |

- `[D]` **A 0.8a e a 0.8 executam antes da 0.7**, apesar da numeração. Duas razões, e a
  segunda é a mais forte:
  1. A primeira rota nasce com deep link já funcionando, em vez de ganhá-lo depois.
  2. **Isola variáveis.** Publicando enquanto o app é uma página trivial, um 404 só pode vir
     da hospedagem. Se o primeiro deploy acontecesse depois do roteador, um 404 seria ambíguo
     entre roteador e host — e depurar duas causas ao mesmo tempo custa muito mais.

- `[D]` A 0.8 só está pronta quando a URL publicada devolver **404 antes** e **200 depois**
  do `vercel.json`. Sem o 404, não se sabe se o 200 veio do *rewrite* ou de um padrão da
  plataforma — o arquivo poderia ser cerimônia. É a invariante 5 aplicada à hospedagem.

> O deep link é a **única parte do projeto que `npm run verificar` não alcança**. Medimos que
> o `vite preview` faz *fallback* de SPA sozinho: `GET /uma-rota-que-nao-existe` devolve
> `200 text/html` com ou sem configuração de hospedagem. Verificar deep link localmente é
> exatamente o verificador que sempre passa.

> **0.8a e 0.8 concluídas em 2026-07-31.** Repositório em
> [feliperrego/buraco-ads](https://github.com/feliperrego/buraco-ads), publicado em
> [buraco-ads.vercel.app](https://buraco-ads.vercel.app).
>
> A sequência do 404 foi cumprida: antes do `vercel.json`, `/regras` devolvia `404 text/plain`;
> depois, `200 text/html`. O *rewrite* não é cerimônia.
>
> **A 0.8a fechou a 0.6 junto.** O push do `430a748` disparou a primeira execução do workflow
> — `conclusao=success`. O CI escrito na 0.6 saiu de "no disco" para "executado".
>
> A verificação revelou uma consequência não prevista: `/assets/nao-existe.js` devolve
> `200 text/html` em vez de 404. Registrada no [ADR-0008](decisions/0008-publicar-na-vercel-com-integracao-git.md)
> e com gatilho na §3.

- `[D]` A tarefa 0.4 só está pronta quando um **import proibido de verdade faz o
  lint falhar**. Escrevemos a violação, confirmamos a falha, e removemos.

> **Concluída em 2026-07-31.** A verificação foi automatizada em
> [`scripts/verificar-fronteiras.py`](../scripts/verificar-fronteiras.py), que escreve 14
> violações e 4 imports permitidos, confere o resultado de cada um e apaga tudo. Roda em
> `npm run verificar`.
>
> Os **4 casos permitidos** são tão necessários quanto as violações: sem eles, uma regra que
> bloqueasse qualquer import passaria nos 14 testes negativos.

> RD1 parece exagero e não é. Uma regra de lint mal configurada não avisa que está mal
> configurada — ela simplesmente passa. A A2 afirma que a fronteira é garantida por ferramenta;
> se ninguém verificar a ferramenta, voltamos a ter uma intenção, com a agravante de acreditar
> que está protegida.
>
> Vale para os três casos: `engine/` importando React, `ia/` importando de `estado/`, e
> qualquer coisa fora de teste importando `engine/testing/`.

- `[D]` A tarefa 0.7 cria as rotas **vazias**, sem conteúdo. É o esqueleto de
  navegação que a T1 e a RF1.3 vão usar, não as telas.

> **0.7 concluída em 2026-07-31 — o Marco 0 está fechado.** Roteamento por código, registrado
> no [ADR-0009](decisions/0009-roteamento-por-codigo.md). Quatro rotas: `/`, `/partida`,
> `/fim`, `/regras`.
>
> O teste foi **visto reprovando** antes de ser aceito, conforme a invariante 5: com o caminho
> escrito errado e com a rota fora do `addChildren`, um caso falha e os outros quatro passam.
> É o que o tipo não pega — rota não registrada só falha em runtime.
>
> A prova de fim a fim: `https://buraco-ads.vercel.app/regras` digitado direto **renderiza a
> tela**. Servidor devolve o `index.html` pelo rewrite da 0.8, roteador resolve, React monta.
> Foi exatamente para isto que a 0.8 veio antes.
>
> Achado que só apareceu com as duas juntas: como o rewrite faz a Vercel devolver 200 para
> qualquer caminho, **o roteador virou o dono do 404**. Hoje ele mostra o "Not Found" padrão
> do TanStack — em inglês, sem `<h1>`. Gatilho na §3.

> **Nota sobre a 0.6, corrigida em 2026-07-31.** A redação anterior dizia que a 0.6 era a
> única tarefa do Marco 0 **não verificada antes de entregue**, e que "um workflow do GitHub
> Actions só se prova no primeiro push". Era generoso demais.
>
> O fato apurado ao começar a 0.8a: **este repositório não tinha remoto.** `git remote -v`
> voltava vazio. Não é que o push ainda não tivesse acontecido — não existia destino para
> ele. O workflow esteve no disco por um commit inteiro sem nunca ter sido executado.
>
> O que deu para verificar continua valendo: o YAML analisa, e os comandos que ele invoca —
> `npm ci`, `npm run verificar`, `npm run build` — passam nesta máquina. O que faltava não
> eram as versões das actions: era o repositório remoto.
>
> A 0.6 passa a depender da **0.8a** para ser considerada concluída de fato.
>
> A lição não é sobre GitHub Actions. É que "entregue mas não verificado" e "entregue e
> impossível de verificar" parecem a mesma coisa na hora de escrever a nota, e são muito
> diferentes. A pergunta que teria pegado isto na hora: *o que exatamente falta acontecer
> para esta verificação rodar?*

---

## 2. Ordem de entrega

Os marcos de [user-stories.md](user-stories.md), sem datas:

| Marco | Histórias | Termina quando |
|---|---|---|
| **0** ✅ | 0.1–0.8 | O lint recusa um import proibido, a suíte vazia roda e uma rota digitada direto na URL publicada devolve a aplicação |
| **I** ✅ | H1–H3 | Dois jogadores compram e descartam; a IA joga sozinha |
| **II** ✅ | H4–H7 | Dá para baixar sequências, com e sem curinga, e pegar o lixo |
| **III** ✅ | H8–H12 | Uma rodada completa termina em batida e pontuação apurada |
| **IV** ✅ | H13–H14 | Uma partida completa chega a 3000, inclusive com monte esgotado |
| **V** ✅ | H15 | O oponente joga por heurística, não por sorteio |
| **VI** | H16–H19 | Produto: abandono, regras, celular, acabamento |

- `[D]` **Uma história por vez**, sem iteração de tamanho fixo. Cada história
  percorre o ciclo completo: spec em `docs/specs/` → critérios de aceite → testes → código →
  refatoração.

> Iteração fixa serve para coordenar equipe e prever entrega. Não temos equipe nem prazo. O que
> importa aqui é que nenhuma história comece antes de a anterior estar pronta pela definição da
> U5: regras citadas com teste passando **e** comportamento observável.

---

## 3. Gatilhos de reavaliação

As decisões que adiamos, cada uma com o momento em que voltamos a olhá-la. Sem isto, "depois"
é o mesmo que "nunca".

| Decisão adiada | Gatilho | Origem |
|---|---|---|
| Forma da parcela do lixo (IA9) | **Na primeira fatia que revisar a IA** — o saldo não tem piso, então o lixo grande nunca é pego e só cresce. Medido: saldo médio de **+11** com lixo de 0 a 9 cartas e de **−140** com 60 a 69, contra o humano que não pega o lixo. As 600 partidas não veem, porque contra a aleatória o lixo não passa de 16 | H15, IA9 |
| `useReducer` + Context vs Zustand | **Se houver re-render perceptível** durante Marco VI | A6 |
| Teste de mutação | **Se aparecer bug em regra que tinha teste passando** | E8 |
| Reintroduzir TanStack Query | **Se multiplayer entrar no escopo** | ADR-0004 |
| Excluir `/assets/` do *rewrite* de SPA | **Ao primeiro `Unexpected token '<'` no console** — asset ausente devolve HTML em vez de 404 | ADR-0008 |
| Roteamento por arquivos | **Se as rotas passarem de oito ou virarem dinâmicas** — a justificativa do ADR-0009 é serem quatro e estáticas | ADR-0009 |

- `[D]` Cada gatilho acionado gera **decisão registrada**: ADR se mudar
  arquitetura, atualização do documento de origem caso contrário. Nunca uma mudança silenciosa.

### Gatilhos já disparados

Saíram da tabela acima porque foram resolvidos. Ficam aqui porque a RD4 exige o registro — um
gatilho que some sem deixar rastro é indistinguível de um gatilho esquecido.

| Decisão | Disparou em | Resultado |
|---|---|---|
| Critério de ponta a ponta | Spec da H3, 2026-08-01 | Virou a **`CA-S37-1`**, primeiro teste do projeto a exercitar as quatro camadas numa asserção só |
| `strictTypeChecked` do typescript-eslint | Fim do Marco I, 2026-08-01 | **Mantido.** Reprovou seis vezes na H2 e na H3, e **nenhuma foi ruído**: `no-unnecessary-condition` num `switch` de uma alternativa, `no-base-to-string` num objeto em template, `restrict-template-expressions`, `react-refresh` em dois arquivos e dois `no-unused-vars`. O atrito medido é baixo e a regra está pagando |
| Custo de enumerar todos os `baixar` | H4, 2026-08-02 | **Medido: 121 comandos, dos quais 99 `baixar`, em 0,12 ms.** Nenhuma otimização é necessária, e a T6 se sustenta |
| Custo de enumerar `baixar` **com curinga** | H5, 2026-08-02 | **Medido: 280 comandos, dos quais 258 `baixar` (218 com curinga), em 0,31 ms.** Continua sem precisar otimizar, e bem abaixo do limiar de ~2000 que reabriria a consulta `validar` |
| Custo de enumerar `aumentar`, **com jogos na mesa** | H6, 2026-08-02 | **Medido: 218 comandos, dos quais 85 `aumentar`, em 1,08 ms**, com a mão de 22 cartas da `CA-S46-1` e quatro jogos na mesa. A estimativa da spec 0006 §4.3 era de "menos de 200 por jogo"; o real ficou em **~21 por jogo**, uma ordem de grandeza abaixo |
| Asserção de categoria em `CA-R1.3-1` e `CA-R1.3-2` | H8, 2026-08-02 | **Restaurada.** Os dois voltaram a afirmar `LIMPA` e `SUJA`, e a asserção de posição da H5 ficou junto — ela é o que explica **por que** a categoria é essa (S90) |
| Se o modelo de posições (M2) está certo | H9, 2026-08-02 | **Certo.** `regularizarJogo` é a conversão de uma posição mais uma chamada a `criarJogo`. As **três** condições da R6.5 caem de dois invariantes — I2 para o naipe, I3 para o caminho e para a reposição — e **nenhum `if` de regra foi escrito**. A previsão do domain.md §2 se sustentou |
| Guarda das jogadas que esvaziam a mão (**parcial**) | H10, 2026-08-03 | **Não sai — vira regra.** A R10.1.3 passou a especificar a mão vazia, então a guarda deixou de ser restrição nossa e virou primeira metade de uma regra (S106). E a contagem estava errada: reter **uma** carta trava a mesa em 15 de 200 partidas, porque a R7.1 obriga a descartar. São **duas** (S109), e a correção não custou nenhum dos 84 mortos entregues. Continua na tabela acima, agora com prazo na H11 |
| `eventos[]` no retorno de `aplicar` | H12, 2026-08-03 | **Não precisamos.** O estado no fim da rodada já contém tudo que os seis itens da R11 pedem: os jogos com suas posições, as mãos como ficaram, `reclamadoPor` para o morto e a mão vazia para a batida. `apurar(partida)` é função pura do estado, e `aplicar` continua devolvendo `Sucesso \| Recusa`. O que reabriria a pergunta é um item de pontuação que dependesse de **como** o jogo chegou ali — por exemplo premiar quem baixou a canastra primeiro |
| Rodada que não termina, e mesa inerte com monte vazio | H14, 2026-08-04 | **Fechados os dois pela mesma leitura.** A R4.8 é **literal** (S138): sem monte e sem morto a rodada acaba, mesmo com lixo. A leitura alternativa — esperar o lixo esvaziar — não termina, porque `pegarLixo` continua sendo oferecido com uma carta. Medido: antes, **184 de 200** partidas rodavam para sempre; depois, **200 de 200** terminam, em 6 rodadas na mediana e com placar máximo de 4585 |
| Marco III ✅ e Marco IV ✅ | H14, 2026-08-04 | **As 66 regras do `rules.md` têm teste que as cita.** Verificado por script, e ele achou duas órfãs de citação — R7.3 e R9.6 — que tinham código sob outro nome. A RNF2.1 pede a citação, não só a implementação |
| Reprodutibilidade da RNF1.3 | H13, 2026-08-04 | **Passa a valer por entrada, não por partida (S130).** A semente da rodada nova vem de `estado/`, pelo mesmo caminho da primeira, e a engine continua sem nenhuma fonte de aleatoriedade. O que se perde nunca existiu: uma partida jogada no app jamais foi reproduzível, porque a semente da primeira rodada já era sorteada e nunca mostrada. As quatro redes de verificação não passam por `estado/` e geram a sequência de sementes a partir de um número só |
| Guarda das jogadas que esvaziam a mão | H11, 2026-08-03 | **Fechado.** A guarda nunca saiu — virou regra. Hoje ela lê a R10.1.3 inteira: a mão pode zerar quando há morto (R9.2) **ou** quando a batida é possível (R10.1). O número de cartas a reter deixou de ser escolha e passou a cair da R7.1 (S109, S118). O que a H11 acrescentou foi a segunda condição, avaliada **sobre o resultado** do comando (S115) — a jogada que zera a mão pode ser a que fecha a canastra limpa, e foi exatamente o que aconteceu na verificação no navegador |
| Custo da enumeração **com a guarda da batida** | H11, 2026-08-03 | **Medido: 1738 comandos em 5,95 ms** — o mesmo pior caso construível da H7, mesmo número, mesmo tempo. A pergunta cara da S115 não aparece ali: com 52 cartas na mão, nenhum comando a zera, porque a maior sequência tem 14 posições. O limiar de ~2000 continua a 13% |
| `ia-strategy.md` como documento próprio | Antes da H15, 2026-08-04 | **Sim, documento próprio.** Não por tamanho — por tipo. O `README.md` declara a spec **descartável** porque, pronta a história, os testes viram a especificação viva; isso vale para **regra**, que tem resposta certa, e não para **heurística**, que é política com custo. Um teste prende *"prefere baixar a descartar"* e não prende **por quê**, e é o porquê que a medição vai rever. Onze decisões, `IA1` a `IA11`, confirmadas em bloco |
| Ordem em que `movimentosValidos` devolve os comandos | H15, 2026-08-04 | **Não vira contrato.** A engine **enumera**, a `ia/` **pontua** (IA2), e o empate sai de **chave estável do comando** — tipo e cartas ordenados —, nunca da posição na lista (IA3). Usar a posição devolveria o contrato pela porta dos fundos e amarraria a engine a um consumidor. A dependência da **interface** naquela ordem é real e continua aberta, agora como decisão de interface com prazo no Marco VI (IA4) |
| Ordem dos botões de jogada na interface | H18, 2026-08-04 | **A tela ordena, e a ordem da engine deixa de significar qualquer coisa.** Jogadas de mesa primeiro, descarte por último — ele **encerra o turno** (R7.1), e oferecer a ação irreversível antes das reversíveis é pior no teclado, onde a primeira opção é a que o `Enter` alcança. A `CA-S167-2` embaralha `movimentosValidos` e exige a mesma saída |
| Playwright | H18, 2026-08-04 | **Entrou com um teste**, e não com a suíte (S170): vinte turnos por teclado em viewport de celular, fora do `npm run verificar`. A partida completa **não** cabe — 700 ms por comando da IA dão ~17 minutos de relógio —, e continua sendo verificação exploratória à mão |
| Tela de rota inexistente em português | H17, 2026-08-04 | **Fechada junto com a tela de regras** (S163), por serem a mesma família: conteúdo estático, em português, com caminho de volta. O 404 é do **roteador** e não do servidor, porque o *rewrite* do `vercel.json` devolve 200 para qualquer caminho — hoje é um `defaultNotFoundComponent`, com `<h1>` "Página não encontrada" |
| Limiar de 70% na força relativa da IA | H15, 2026-08-04 | **Medido: 97,8%, intervalo de 95% entre 96,7% e 99,0%, em 600 partidas.** A E6 passa pelo limite inferior (IA11) com 26,7 pontos de folga, e o arnês foi conferido contra si mesmo — aleatória contra aleatória dá 53,7%, intervalo contendo os 50%. O limiar **era baixo demais para separar políticas**: um número que 97,8% cumpre não distingue esta heurística da próxima. Quando houver uma segunda, a comparação útil é contra ela |
| Custo com a mão **inchada pelo lixo** | H7, 2026-08-02 | **Medido: 1738 comandos — 932 `baixar`, 754 `aumentar`, 52 `descartar` — em ~6 ms**, no pior caso construível. Passa do limiar de ~2000? **Não**, e por 13%. É a medição mais próxima que o projeto já teve, e a `validar` continua fechada |

> O número da T7 merece a conta ao lado, porque a diferença entre o medo e o fato é de quatro
> ordens de grandeza. A mão do pior caso tem 22 cartas, com um naipe ocupando as catorze casas
> e outro ocupando oito. Por subconjuntos seriam `2^22` — mais de quatro milhões. Por corridas
> de casas (S46), uma corrida de `n` casas rende `(n-1)(n-2)/2` trechos de tamanho ≥ 3: 78 do
> primeiro naipe, 21 do segundo, 99 ao todo.
>
> **A conta que assustou a Onda 2 estava certa; o que estava errado era a estrutura que ela
> pressupunha.** Sequência não é subconjunto arbitrário, é trecho contíguo de uma linha — e
> quem enumera a estrutura certa não precisa otimizar. O limiar de 50 ms da `CA-S46-1` sobrou
> por um fator de 400, então ele fica no lugar como rede, não como meta.
>
> **Correção da H5:** aquela mão de 22 cartas contém `2♥` e `2♦`, e com o curinga da H5 eles
> passaram a gerar comandos. A `CA-S46-1` mede hoje **111 `baixar`, não 99**. O 99 continua
> correto como o que a H4 media, e é registrado aqui porque um número de documento vivo que
> deixa de reproduzir é pior que número nenhum.
>
> **E a H5 mostrou que o pior caso não é esta mão.** O que explode a enumeração não é um naipe
> cheio — janela cheia não tem lacuna, logo não admite curinga. É um naipe **quase cheio, com
> um buraco só**: aí quase toda janela tem exatamente uma lacuna, e cada lacuna rende um
> comando por naipe de `2` disponível. Foi assim que se chegou aos 280. O formato foi achado
> por sondagem entre cinco mãos, e é o maior entre elas — não um máximo provado.

> **A H6 mediu pela terceira vez, e o motivo era novo.** Até ali a enumeração dependia só da
> mão; com o `aumentar`, ela passou a depender também do **estado da mesa**. O número — 85
> `aumentar` para quatro jogos — ficou uma ordem de grandeza abaixo da estimativa de
> guardanapo da spec, e a razão é a mesma que derrubou o `2^22`: a conta pessimista supunha
> que toda janela que contém a atual seria resolvível, quando a maioria delas pede **duas**
> casas vazias e é cortada de imediato pela I4. A estimativa errou para cima, que é o lado
> seguro — mas errou, e é por isso que a `CA-S73-1` existe.

> **A H7 mediu a quarta vez, e é a única em que a resposta não era previsível.** Três coisas
> valem guardar dela:
>
> **A mão maior não é o pior caso, e a spec pediu o fixture errado.** A S80 mandou medir a
> "mão saturada", e a mão de **71** cartas obtida por um `pegarLixo` de 60 rende só **287**
> comandos — menos que os 280 da H5 com 22 cartas. O motivo é o mesmo que a H5 já tinha
> ensinado, aqui aparecendo pelo avesso: janela **cheia** não admite curinga, então saturar a
> mão **desliga** o multiplicador da S56. O pior caso é um naipe quase cheio com **um buraco
> só**, nos quatro naipes ao mesmo tempo — 52 cartas, não 71.
>
> **O baralho é o teto, não o algoritmo.** O máximo construído foi 1738, com seis jogos na
> mesa. O sétimo não cabe, e quem prova isso não é um argumento: é o construtor da C4, que o
> recusa pela **R2.3** — os dois mortos exigem 22 cartas. A conta estrutural da spec 0007 §3.1
> se sustentou.
>
> **A margem encolheu, e isso é o que muda.** Nas três medições anteriores o limiar de ~2000
> estava a um fator de 7 ou mais. Agora está a 13%. O `baixar` já bateu no próprio teto (932
> de ~1250), então o que ainda pode crescer é o `aumentar` — e ele cresce com o número de
> jogos na mesa. **A próxima fatia que acrescentar comando ou aumentar o número de jogos
> precisa remedir**, e não herdar este "não precisa otimizar".

> O gatilho da H9 é o mais interessante da tabela, porque é um **teste da qualidade do nosso
> próprio modelo**. A R6.5 é a regra mais difícil do Buraco Aberto. Se o `domain.md` M2 acertou,
> implementá-la é quase trivial; se errou, é impossível. A dificuldade sentida ao escrever a H9
> é o sinal — e queremos lê-lo em vez de atribuir a "regra complicada".

---

## 4. Como uma história vira código

- `[D]` Sequência fixa, sem atalho:

```
1. spec         docs/specs/NNNN-nome.md — comportamento e casos de borda
2. critérios    Dado/Quando/Então, cada um citando seu Rn (C1)
3. testes       falhando, com o identificador CA-Rn-k no nome
4. código       o mínimo para os testes passarem
5. refatoração  com os testes verdes
6. verificação  suíte completa + scripts/verificar-rastreabilidade.py
7. commit       pequeno, mensagem descritiva
```

- `[D]` Uma história só é considerada pronta com a **suíte inteira** verde, não
  apenas os testes dela.

> O passo 3 antes do 4 é TDD, e aqui ele tem uma razão específica além das usuais: o critério
> de aceite já existe escrito (passo 2), então o teste é transcrição, não invenção. É o ponto
> em que o SDD e o TDD se encontram — a especificação já determinou o teste, e o teste
> determina o código.

---

## 5. Histórico das decisões

**Não há pendências.** RD1–RD6 foram confirmadas em 2026-07-29; RD7 a RD9, em 2026-07-31.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **RD1** | Marco 0 | A regra de dependência só está pronta quando um import proibido **faz o lint falhar** |
| **RD2** | Marco 0 | Rotas criadas **vazias**, só o esqueleto de navegação |
| **RD3** | Ritmo | **Uma história por vez**, sem iteração de tamanho fixo |
| **RD4** | Reavaliação | Todo gatilho acionado gera decisão registrada, nunca mudança silenciosa |
| **RD5** | Ciclo | Sete passos de spec a commit, sem atalho |
| **RD6** | Pronto | Suíte **inteira** verde, não só os testes da história |
| **RD7** | Marco 0 | Publicar na **Vercel** por integração Git; 0.8a e 0.8 executam **antes** da 0.7 |
| **RD8** | Marco 0 | O *rewrite* de SPA só está provado com **404 antes** e **200 depois** na URL publicada |
| **RD9** | Ritmo | Automação autônoma cabe nos passos **3–6** do ciclo §4, **nunca nos 1–2** |

### Notas de decisão

- **RD1** é a única tarefa do Marco 0 que exige verificar a própria ferramenta. Sem ela, a A2 seria fé.
- **RD3** faz o ritmo depender de nós dois, coerente com "não temos pressa".
- A **tabela de gatilhos da seção 3** é o conteúdo real deste documento.
- **RD9 foi medida na H2, em 2026-08-01.** O loop rodou os passos 3–6 em três iterações e
  **nenhum commit precisou ser refeito**. Três correções aconteceram antes de commitar — trocar
  uma biblioteca de teste por outra já instalada, dar valores distintos a um *fixture* de
  cartas, e acrescentar âncora a um critério negativo — e as três eram sobre software, nenhuma
  sobre Buraco. É o que a divisão previa.
  > O achado inesperado veio do próprio loop: **dois dos vinte critérios da H2 eram asserções
  > negativas, e passavam sem implementação nenhuma.** "Não deve existir X" é trivialmente
  > verdade num componente vazio. Virou padrão de revisão — todo critério negativo precisa de
  > uma afirmação positiva antes, provando que há o que negar.
- **RD9** divide o ciclo §4 pela natureza do trabalho, não pela dificuldade. Os passos 1–2 são
  julgamento sobre o domínio; os 3–6 são mecânicos, e o próprio §4 já diz que o teste é
  "transcrição, não invenção" porque o critério de aceite veio antes.
  A calibragem do `CLAUDE.md` explica por que a divisão importa: das 105 propostas, as 5 que
  caíram foram **todas** no `rules.md`. Some-se a RNF2.1, que exige que todo teste cite o `Rn`
  que valida, e uma regra mal interpretada sem supervisão não gera só código errado — gera um
  teste que passa e **documenta** o erro. A verificação passaria a confirmá-lo.
- **RD8** é a RD1 aplicada à hospedagem, e nasceu do mesmo raciocínio: verificamos que o
  `vite preview` faz *fallback* sozinho, portanto um teste local de deep link passaria sempre.
  A diferença é que a RD1 pôde virar script versionado
  ([`verificar-fronteiras.py`](../scripts/verificar-fronteiras.py)) e a RD8 não — ela depende
  de uma URL externa. É a única verificação do projeto que fica fora de `npm run verificar`,
  e vale saber disso em vez de fingir cobertura.
