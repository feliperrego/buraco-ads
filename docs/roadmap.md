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
| **0** | 0.1–0.8 | O lint recusa um import proibido, a suíte vazia roda e uma rota digitada direto na URL publicada devolve a aplicação |
| **I** | H1–H3 | Dois jogadores compram e descartam; a IA joga sozinha |
| **II** | H4–H7 | Dá para baixar sequências, com e sem curinga, e pegar o lixo |
| **III** | H8–H12 | Uma rodada completa termina em batida e pontuação apurada |
| **IV** | H13–H14 | Uma partida completa chega a 3000, inclusive com monte esgotado |
| **V** | H15 | O oponente joga por heurística, não por sorteio |
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
| Custo de enumerar todos os `baixar` | **Ao terminar H4** — medir com 22 cartas na mão | T7 |
| Se o modelo de posições (M2) está certo | **Ao terminar H9** — se regularizar o curinga foi difícil, o modelo está errado | M2, H9 |
| `ia-strategy.md` como documento próprio | **Antes de começar H15** | U2 |
| Limiar de 70% na força relativa da IA | **Ao terminar H15** — com o número real medido | E6 |
| `useReducer` + Context vs Zustand | **Se houver re-render perceptível** durante Marco VI | A6 |
| Teste de mutação | **Se aparecer bug em regra que tinha teste passando** | E8 |
| Playwright | **Início do Marco VI** — quando existir partida completa | ADR-0006 |
| Reintroduzir TanStack Query | **Se multiplayer entrar no escopo** | ADR-0004 |
| `strictTypeChecked` do typescript-eslint | **Ao terminar o Marco I** — se o atrito estiver alto, avaliar `recommendedTypeChecked` | tarefa 0.3 |
| Excluir `/assets/` do *rewrite* de SPA | **Ao primeiro `Unexpected token '<'` no console** — asset ausente devolve HTML em vez de 404 | ADR-0008 |
| Tela de rota inexistente em português | **No Marco VI (acabamento)** — hoje é o "Not Found" padrão do TanStack, em inglês e sem `<h1>` | tarefa 0.7, RNF3.2 |
| Roteamento por arquivos | **Se as rotas passarem de oito ou virarem dinâmicas** — a justificativa do ADR-0009 é serem quatro e estáticas | ADR-0009 |
| `eventos[]` no retorno de `aplicar` | **Ao escrever a H12** — decidir entre acrescentá-los ou derivar a apuração do estado | M8, S21 |
| Critério de ponta a ponta | **Ao escrever a spec da H3** — o turno da IA exige o fluxo completo de qualquer forma | spec 0001 §1 |

- `[D]` Cada gatilho acionado gera **decisão registrada**: ADR se mudar
  arquitetura, atualização do documento de origem caso contrário. Nunca uma mudança silenciosa.

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
