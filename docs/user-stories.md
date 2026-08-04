# Histórias de usuário

> Status: **confirmado** — 7 decisões, nenhuma pendência
> Deriva de: [requirements.md](requirements.md) · [rules.md](rules.md) · [architecture.md](architecture.md)
> Última atualização: 2026-07-29

## Como ler este documento

Cada história é uma **fatia de valor observável**: algo que, ao ficar pronto, muda o que se
pode ver ou fazer no jogo. Não são tarefas técnicas — "criar o validador de sequências" não é
história, é parte de uma.

Toda história cita as regras (`Rn`) e requisitos (`RFn`, `RNFn`) que a fecham. Essa citação é
o que permite saber quando ela terminou: **uma história está pronta quando todas as regras
que ela cita têm teste passando** (RNF2.1).

Identificadores: histórias são `H1`…`Hn`, agrupadas em **Marcos** (I a VI). Pendências deste
documento são `U1`…`Un`.

---

## 1. A decisão de fatiamento

Antes das histórias, a pergunta que define a ordem de tudo.

O [architecture.md](architecture.md) colocou a engine no centro, sem dependências. Isso
convida a construí-la inteira antes de qualquer pixel. Três caminhos:

| Caminho | A favor | Contra |
|---|---|---|
| **A. Engine primeiro** | Foco total no domínio, sem distração de interface. Todas as regras testadas antes de existir tela | Semanas construindo um núcleo que **nenhum jogador tocou**. A forma de `movimentosValidos` só é validada quando alguém a consome |
| **B. Fatias verticais** | Cada história atravessa engine → estado → interface. Feedback real desde a primeira | As primeiras fatias são pesadas de engine. Alguma retrabalho de interface conforme ela cresce |
| **C. Esqueleto vertical, depois engine em bloco** | Prova a integração cedo e depois concentra no domínio | Volta ao problema de A na parte grande do trabalho |

- `[D]` **Caminho B: fatias verticais.**

> O argumento decisivo não é feedback do jogador — é feedback sobre a **API**. O
> [architecture.md](architecture.md) A4 afirma que interface e IA consomem a mesma superfície
> (`VisaoDoJogador` + `movimentosValidos`). Isso é uma hipótese até alguém consumir. Se a
> forma estiver errada, quero descobrir na primeira fatia, não na trigésima.
>
> A ressalva honesta: **as primeiras fatias serão desproporcionalmente de engine**, porque
> validar uma sequência é pré-requisito de quase tudo. Não é vertical puro. Mas cada fatia
> termina com algo visível na tela, e isso é o que importa.
>
> Aceito o custo assimétrico: retrabalho de interface é barato, retrabalho de núcleo não é.

---

## 2. A IA entra na terceira história — de propósito

- `[D]` A IA aparece em **H3**, muito antes de ser competente. A primeira versão
  **escolhe um movimento aleatório** de `movimentosValidos`.

Duas razões, e a segunda é a boa:

1. A fronteira `VisaoDoJogador` (M11) é caríssima de instalar depois. Se a IA nascer lendo
   `Partida` porque "é só para testar", a RF5.2 já foi perdida.
2. **Uma IA que escolhe entre movimentos válidos nunca é inválida.** Conforme
   `movimentosValidos` cresce a cada história, ela passa a saber baixar, pegar o lixo e
   regularizar curinga sem uma linha nova. Ela fica burra por muito tempo, e correta desde o
   início.

> Isso dá um teste de integração poderoso e quase grátis: **duas IAs aleatórias jogando mil
> partidas com sementes diferentes**. Nenhuma deve travar, nenhuma deve violar a conservação
> das 104 cartas (M9), e todas devem terminar. Um gerador de casos de borda que ninguém
> precisa escrever.

---

## 3. As histórias

### Marco I — Esqueleto jogável

Objetivo: provar a integração engine → estado → interface com o mínimo possível.

| # | História | Fecha |
|---|---|---|
| **H1** | Inicio uma partida e vejo minhas 11 cartas, o monte, o lixo vazio e os dois mortos | R1.1, R1.2, R2.1–R2.6, R3.1, RF1.1, RF1.2, RNF1.3, M9 |
| **H2** | Compro uma carta do monte e descarto outra, encerrando meu turno | R3.1, R3.2, R4.1, R4.3, R7.1, R7.2, RF2.2, M10 |
| **H3** | O oponente joga seu turno sozinho e a vez volta para mim | RF5.1, RF5.2, M11, M12 |

> Ao fim do Marco I existe um jogo jogável: dois jogadores comprando e descartando para
> sempre, sem baixar nada. Inútil como jogo e decisivo como arquitetura — as quatro camadas e
> as três fronteiras estão de pé e exercitadas.

### Marco II — Jogos na mesa

| # | História | Fecha |
|---|---|---|
| **H4** | Baixo três ou mais cartas do mesmo naipe em sequência | R3.4, R5.1, R5.2, R5.3, R5.6, R6.1, I1–I3, I5, I6 |
| **H5** | Uso um 2 como curinga para completar uma sequência | R1.3, R1.4, R5.4, R5.5, I4, I7, M2 |
| **H6** | Acrescento cartas a um jogo que já está na mesa, quantas vezes quiser no turno | R3.3, R6.2, R6.3, R6.4 |
| **H7** | Pego o lixo inteiro em vez de comprar do monte | R4.1, R4.2, R4.4, R4.5, RF3.1 |

> H4 e H5 são as histórias mais densas do projeto: juntas fecham os sete invariantes de
> `Jogo` (domain.md §4). H5 depende de H4 e não deve ser feita junto — o curinga é um
> subproblema inteiro, e misturá-lo com a validação básica torna difícil saber qual dos dois
> está errado quando um teste falha.

### Marco III — Rodada completa

| # | História | Fecha |
|---|---|---|
| **H8** | Vejo minhas canastras e a categoria de cada uma | R8.1, R8.2, R8.3, R8.4, R8.6, RF3.5 |
| **H9** | Estendo a sequência até o curinga ocupar sua casa e a canastra fica limpa | R6.5, R6.6, R8.5 |
| **H10** | Fico sem cartas na mão e recebo um morto automaticamente | R2.3, R9.1–R9.4, M3 |
| **H11** | Fico sem cartas com uma canastra limpa e bato, encerrando a rodada | R7.3, R9.5, R9.6, R10.1, R10.1.2, R10.1.3, R10.2, R10.3, R10.4, M4 |
| **H12** | Vejo a apuração detalhada da rodada, item por item | R11.1–R11.6, RF4.2, M5 |

> H9 é a regra mais difícil do jogo e a que mais depende do modelo estar certo. Se M2
> (posições em vez de cartas) estiver bem implementado, ela é quase trivial. Se não, ela é
> impossível — e é aqui que descobriremos.

### Marco IV — Partida completa

| # | História | Fecha |
|---|---|---|
| **H13** | Jogo várias rodadas até alguém atingir 3000 pontos e vejo o vencedor | R2.6, R12.1, R12.2, RF1.5, RF4.1 |
| **H14** | O monte acaba, um morto vira o novo monte e a partida continua | R4.6, R4.7, R4.8, R10.1.1–R10.1.3, R11.5.1, R11.5.2 |

> **Corrigido em 2026-08-04, ao escrever a spec 0014.** Este parágrafo dizia que a H14 era
> *"puro caso de borda"* e *"a história com mais chance de nunca acontecer numa partida real de
> teste"*. Medido em 200 rodadas simuladas: **o monte esgota em 200 delas**, e nas 200 há morto
> por converter no instante do esgotamento. A conversão da R4.6 é a regra mais frequente do jogo.
>
> A leitura de julho não foi descuidada — foi feita sem o jogo existir para medir. O que ela
> custou foi uma fatia de atraso, e não código errado: antes da H14, **184 de 200 partidas não
> terminavam**. Depois, terminam **200 de 200**, em 6 rodadas na mediana.
>
> O que continua valendo do parágrafo antigo: os casos da R10.1.1 e da R11.5.1 **exigem estado
> construído**. Eles são raros; o esgotamento do monte não é.

> **A R10.1.1 é da H14, e a H11 não a implementa (S110).** A H11 citava `R10.1–R10.4` como
> intervalo, o que a incluía sem querer: a exceção suspende a exigência do morto quando um
> morto **virou monte**, e a conversão é a R4.6, que é desta história. A citação da H11 foi
> aberta item a item para dizer o que ela fecha de fato.

### Marco V — Oponente de verdade

| # | História | Fecha |
|---|---|---|
| **H15** | Jogo contra um oponente que toma decisões razoáveis, não aleatórias | RF5.1, RF5.2, RF5.3 |

> Substitui a IA aleatória de H3 por heurística. A aleatória **não é descartada**: continua
> no arsenal de testes, jogando mil partidas para caçar casos de borda.
>
> `ia-strategy.md` provavelmente vira documento próprio antes desta história — as heurísticas
> do Buraco Aberto (quando pegar o lixo, qual 2 usar como curinga, quando correr para o
> morto) merecem especificação, não improviso.

> **Fechada em 2026-08-04, e as três previsões acima se confirmaram.** O `ia-strategy.md` virou
> documento próprio (IA1–IA11), a aleatória continua exportada como `porSorteio` e é a linha de
> base da medição, e as três heurísticas citadas viraram IA9, IA6 e IA8 — nessa ordem.
>
> Medido em 600 partidas: força relativa de **97,8%**, intervalo de 95% entre **96,7% e 99,0%**.
> A E6 pede 70% e a IA11 exige o limite inferior; passa por 26,7 pontos.
>
> O que a história **não** previu está na spec 0015 §10.4: a parcela do lixo não tem piso, e
> contra um oponente que não pega o lixo ele cresce até nunca mais ser pego. As 600 partidas não
> veem isso, porque contra a aleatória o lixo não passa de 16 cartas. Quem viu foi rodar o app.

### Marco VI — Produto

| # | História | Fecha |
|---|---|---|
| **H16** | Abandono a partida com confirmação, e sou avisado antes de fechar a janela | RF1.3, RF1.4 |
| **H17** | Consulto as regras do jogo sem sair da aplicação | ADR-0005 |
| **H18** | Jogo com conforto no celular e navego pelo teclado | RNF3.1, RNF3.4 |
| **H19** | A interface tem acabamento visual coerente | RNF3.1 |

- `[D]` H19 (acabamento visual) fica **por último**, depois de a partida
  funcionar de ponta a ponta.

> **H16 fechada em 2026-08-04.** A RF1.3 é um `<dialog>` nativo, e a escolha se pagou no
> navegador: foco preso e `Esc` funcionam sem uma linha nossa, e o `Esc` cai no **cancelar** —
> sair sem escolher não descarta progresso. A RF1.4 avisa com partida em andamento e não avisa
> sem, conferido nos dois lados num navegador de verdade.

> Cada história do Marco I ao V entrega uma interface funcional e feia. Isso é deliberado: uma
> tela bonita construída sobre regras erradas precisa ser refeita, enquanto uma tela feia
> sobre regras corretas só precisa de estilo. E as decisões visuais ficam melhores quando já
> se sabe o que a tela precisa mostrar.

---

## 4. Rastreabilidade

- `[D]` Toda regra de `rules.md` está citada por **ao menos uma** história. Uma
  regra sem história é uma regra que ninguém vai implementar.
- `[D]` Uma história está **pronta** quando todas as regras e requisitos que ela
  cita têm teste passando (RNF2.1), e o comportamento é observável na interface.
- `[D]` Cada história ganha uma **spec própria** em `docs/specs/` antes de virar
  código. A história diz *o quê*; a spec diz *exatamente como se comporta*, incluindo casos
  de borda.

> U6 é onde o ciclo SDD finalmente roda por fatia, e não por documento. `H1` vira
> `specs/0001-mesa-inicial.md`, e é essa spec que os testes implementam.

- `[D]` A cobertura história ↔ regra é verificada por
  [`scripts/verificar-rastreabilidade.py`](../scripts/verificar-rastreabilidade.py), que falha se alguma
  regra ficar órfã ou se alguma história citar regra inexistente. Entra no CI junto com o
  lint e os testes.

> **O script já se pagou.** A primeira versão desta seção afirmava que todas as regras estavam
> cobertas. Ao rodar a verificação, **6 estavam órfãs**: R3.3, R3.4, R4.3, R7.3, R9.5 e R9.6.
> Todas foram atribuídas a histórias (H2, H4, H6 e H11).
>
> Vale registrar o padrão, porque é o terceiro deste tipo no projeto: eu escrevi uma
> afirmação verificável e não a verifiquei. Foi o mesmo erro das contagens de pendência nos
> cabeçalhos. **Afirmação contável em documento vivo precisa de script, não de atenção.**

---

## 5. Histórico das decisões

**Não há pendências.** As 7 decisões foram confirmadas em 2026-07-29.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **U1** | Fatiamento | **Fatias verticais** (caminho B), aceitando que as primeiras sejam pesadas de engine |
| **U2** | IA | IA **aleatória em H3**, competente só em H15; a aleatória fica como ferramenta de teste |
| **U3** | Acabamento | Acabamento visual (H19) **por último** |
| **U4** | Cobertura | Toda regra citada por ao menos uma história |
| **U5** | Definição de pronto | Regras citadas com teste passando **e** comportamento observável |
| **U6** | SDD por fatia | Cada história ganha spec em `docs/specs/` antes do código |
| **U7** | Verificação | `scripts/verificar-rastreabilidade.py` no CI — já achou 6 regras órfãs |

### Notas de decisão

- **U1** foi a de maior alcance: define a ordem de todo o trabalho restante.
- **U4** foi aprovada **depois de corrigida**. A primeira redação afirmava cobertura completa
  sem verificação; a checagem encontrou 6 regras órfãs, atribuídas a H2, H4, H6 e H11.
- **U3** significa aceitar interface feia do Marco I ao V. Escolha consciente.

### Ainda em aberto para a Onda 3

Estas ficam para o `roadmap.md` e o `testing-strategy.md`, não para cá:

- Quantas histórias por iteração, e se haverá iteração fixa
- Se `ia-strategy.md` é documento próprio (minha inclinação: sim, antes de H15)
- Metas numéricas de cobertura por camada
