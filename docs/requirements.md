# Requisitos

> Status: **confirmado** — 22 propostas resolvidas, nenhuma pendência
> Escopo: [vision.md](vision.md) · Regras do jogo: [rules.md](rules.md) · Vocabulário: [glossary.md](glossary.md)
> Última atualização: 2026-07-29

## Como ler este documento

`rules.md` diz como o **Buraco** funciona. Este documento diz como o **produto** funciona —
o que existiria mesmo se o jogo fosse outro.

A divisão é deliberada: regra de jogo muda quando a mesa decide, requisito de produto muda
quando o produto decide. Misturá-los faria uma discussão sobre tempo de resposta da IA
parecer uma discussão sobre Buraco.

Identificadores: **RF** para requisito funcional, **RNF** para não funcional. Mesma marcação
de origem do `rules.md`:

| Marca | Significado |
|---|---|
| `[D]` | Decisão já tomada por você |
| `[P]` | **Proposta minha, não confirmada** — acompanhada de `⚠️ Qn` |

Não resta nenhuma `[P]`. O histórico das 22 propostas está na seção 4.

---

## 1. Requisitos funcionais

### RF1 — Iniciar e encerrar partida

- **RF1.1** `[D]` O jogo é acessível abrindo uma página, **sem cadastro, sem login e sem conexão a servidor**.
- **RF1.2** `[D]` Existe uma **tela inicial** com uma única ação relevante: iniciar nova partida.
- **RF1.3** `[D]` O jogador pode **abandonar** a partida em andamento e voltar à tela inicial, com confirmação antes de descartar o progresso.
- **RF1.4** `[D]` Não há persistência. O jogo **avisa antes de fechar ou recarregar** a janela com partida em andamento.
- **RF1.5** `[D]` Ao fim da partida, o jogo anuncia o vencedor e oferece **nova partida**.

### RF2 — Jogar

- **RF2.1** `[D]` O sistema **só permite jogadas válidas** segundo `rules.md`. Jogadas inválidas não são recusadas com mensagem de erro: simplesmente **não estão disponíveis** na interface.
- **RF2.2** `[D]` A interface indica sempre **de quem é a vez** e **em que fase do turno** o jogador está (comprar, baixar, descartar).
- **RF2.3** `[D]` Não há **desfazer**. Uma jogada confirmada é definitiva.

> **RF2.3 tem peso arquitetural.** Desfazer exigiria que a engine mantivesse histórico de
> comandos ou de estados, não apenas o estado atual — uma decisão que muda o desenho do
> núcleo, não um detalhe de interface. Por isso está aqui e não em `screens.md`.
>
> Além do custo: num jogo com informação oculta, desfazer permite comprar uma carta, ver que
> não serviu, desfazer e comprar de novo. **Desfazer quebraria o jogo**, não só o código.

### RF3 — Informação visível

O que o jogador pode ver determina tanto a interface quanto o que a IA tem direito de saber.

- **RF3.1** `[D]` O **lixo é sempre visível por inteiro**, para os dois jogadores (R4.3).
- **RF3.2** `[D]` A **mão do adversário é oculta**, mas a **quantidade** de cartas nela é visível.
- **RF3.3** `[D]` O **monte** é oculto, e a **quantidade** de cartas restantes é visível.
- **RF3.4** `[D]` Os **mortos** são ocultos, e a quantidade de mortos **ainda não reclamados** é visível.
- **RF3.5** `[D]` Todos os **jogos baixados** dos dois jogadores são visíveis, com sua **categoria de canastra** indicada (limpa, suja, 500, 1000).

### RF4 — Pontuação

- **RF4.1** `[D]` O **placar acumulado** da partida está sempre visível.
- **RF4.2** `[D]` Ao fim de cada rodada, o jogo mostra a **apuração detalhada**: canastras por categoria, cartas na mesa, cartas na mão, penalidades e bônus — item por item, não apenas o total.

> Q12 não é enfeite. A pontuação do Buraco tem seis componentes (R11.1 a R11.6); mostrar só
> o total torna impossível para o jogador — e para nós, depurando — saber se a engine
> calculou certo. A apuração detalhada é a interface de diagnóstico da regra mais complexa
> do sistema.

### RF5 — Oponente de IA

- **RF5.1** `[D]` A IA joga automaticamente no seu turno. **Nível único**, sem seletor de dificuldade.
- **RF5.2** `[D]` A IA **não trapaceia**. Ela decide usando exclusivamente o que um jogador humano naquela posição poderia ver: a própria mão, o lixo, os jogos baixados e as contagens de RF3. **Nunca** o conteúdo do monte, dos mortos ou da mão do adversário.
- **RF5.3** `[D]` A jogada da IA é apresentada com **ritmo perceptível**, não instantânea, para que o jogador acompanhe o que aconteceu.

> Q13 é o requisito mais importante desta seção, e o mais fácil de violar por acidente. Se a
> engine expõe o estado completo à IA, "não trapacear" passa a depender de disciplina do
> programador. A forma correta de garantir isso é **estrutural**: a IA recebe uma *visão
> parcial* do estado, não o estado. Se ela não tem acesso ao dado, não pode usá-lo. Isso vai
> para o `architecture.md` como uma fronteira, não como uma convenção.

---

## 2. Requisitos não funcionais

### RNF1 — Independência da engine

- **RNF1.1** `[D]` A engine **não importa** React, DOM, ou qualquer biblioteca de interface.
- **RNF1.2** `[D]` O estado da partida é **serializável**, para que persistência e multiplayer sejam adições futuras e não reescritas.
- **RNF1.3** `[D]` A engine é **determinística**: dada a mesma semente aleatória e a mesma sequência de jogadas, produz exatamente a mesma partida.

> **Q15 é o requisito não funcional de maior retorno do projeto.** Determinismo dá três
> coisas de graça:
>
> 1. **Testes reproduzíveis** — um bug encontrado é um bug que se reproduz sempre, a partir
>    de uma semente. Sem isso, bugs de embaralhamento viram caça a fantasmas.
> 2. **Replay** — uma partida inteira passa a ser descrita por `(semente, lista de jogadas)`.
> 3. **Base para multiplayer** — dois clientes com a mesma semente e as mesmas jogadas
>    chegam ao mesmo estado.
>
> O custo é uma disciplina: a engine **não pode chamar `Math.random()` nem `Date.now()`
> diretamente**. Toda fonte de aleatoriedade entra por injeção. É pouco código e muda o
> desenho — por isso é requisito, não detalhe de implementação.

### RNF2 — Qualidade

- **RNF2.1** `[D]` **Toda regra de `rules.md` tem ao menos um teste** que cita seu identificador no nome. A cobertura da engine é medida por regras cobertas, não só por linhas.
- **RNF2.2** `[D]` A interface é testada em nível de comportamento, não de aparência. Não haverá testes de snapshot visual na v1.

> Q16 inverte a métrica usual. "90% de cobertura de linhas" pode conviver com uma regra de
> pontuação inteira sem teste. "65 de 65 regras cobertas" é uma afirmação verificável sobre
> o domínio. O detalhamento fica em `testing-strategy.md`.

### RNF3 — Alcance e acesso

- **RNF3.1** `[D]` O jogo funciona em **desktop e mobile**, com interação por mouse e por toque.
- **RNF3.2** `[D]` Idioma único: **português do Brasil**. Sem infraestrutura de internacionalização na v1.
- **RNF3.3** `[D]` Suporte às **versões atuais** de Chrome, Firefox, Safari e Edge. Sem suporte a navegadores legados.
- **RNF3.4** `[D]` Acessibilidade: contraste adequado e **navegação completa por teclado**. Leitor de tela não é meta da v1.

> Q21 é uma escolha honesta de escopo, não desleixo. Um jogo de cartas com arrastar-e-soltar
> exige trabalho real para funcionar em leitor de tela. Prometer e entregar mal é pior do
> que declarar fora de escopo — e a navegação por teclado já resolve uma parte grande do
> problema, além de facilitar testes automatizados.

### RNF4 — Privacidade

- **RNF4.1** `[D]` Sem backend, sem banco de dados, sem contas.
- **RNF4.2** `[D]` **Nenhuma telemetria, análise de uso ou coleta de dados.** Nada sai do navegador.

---

## 3. Fora de escopo

Os itens de escopo negativo estão em [vision.md §4](vision.md) e não se repetem aqui.
Multiplayer, contas, persistência, duplas, outras variantes, ranking, chat e aplicativo
nativo estão **fora da v1**.

---

## 4. Histórico das decisões

**Não há pendências.** As 22 propostas foram **confirmadas como escritas** em 2026-07-29 e
incorporadas ao corpo do documento.

Contraste com o `rules.md`, onde 5 de 33 propostas caíram: aqui nenhuma caiu. A diferença não
é sorte. `rules.md` especifica um domínio que **você** conhece e eu não — meu palpite errava
com frequência. `requirements.md` especifica software, que é o domínio onde eu tenho base
para propor. Vale como calibragem: **desconfie das minhas propostas na proporção em que o
assunto for seu, não meu.**

| # | Requisito | Decisão confirmada |
|---|---|---|
| **Q1** | RF1.2 | Tela inicial com ação única de iniciar partida |
| **Q2** | RF1.3 | Pode abandonar partida, com confirmação |
| **Q3** | RF1.5 | Anuncia vencedor e oferece nova partida |
| **Q4** | RF2.1 | Jogadas inválidas **não aparecem**, em vez de serem recusadas |
| **Q5** | RF2.2 | Interface indica a vez e a fase do turno |
| **Q6** | RF2.3 | **Sem desfazer** — peso arquitetural |
| **Q7** | RF3.2 | Mão do adversário oculta, contagem visível |
| **Q8** | RF3.3 | Monte oculto, contagem visível |
| **Q9** | RF3.4 | Mortos ocultos, quantidade restante visível |
| **Q10** | RF3.5 | Jogos baixados visíveis com categoria indicada |
| **Q11** | RF4.1 | Placar acumulado sempre visível |
| **Q12** | RF4.2 | Apuração detalhada ao fim da rodada |
| **Q13** | RF5.2 | **IA não trapaceia** — visão parcial, garantida por estrutura |
| **Q14** | RF5.3 | Jogada da IA com ritmo perceptível |
| **Q15** | RNF1.3 | **Engine determinística** por semente |
| **Q16** | RNF2.1 | Toda regra de `rules.md` com teste que cita seu ID |
| **Q17** | RNF2.2 | Sem testes de snapshot visual |
| **Q18** | RNF3.1 | Desktop e mobile, mouse e toque |
| **Q19** | RNF3.2 | Só pt-BR, sem i18n |
| **Q20** | RNF3.3 | Navegadores atuais apenas |
| **Q21** | RNF3.4 | Contraste e teclado; leitor de tela fora da v1 |
| **Q22** | RNF4.2 | Zero telemetria |

### As três que mudam o desenho do código

As outras dezenove são decisões de produto: mudá-las depois custa retrabalho de interface.
Estas três, se mudarem depois, custam retrabalho de **núcleo**:

- **Q6 (desfazer)** — obriga a engine a guardar histórico, não só estado
- **Q13 (IA não trapaceia)** — obriga uma fronteira de visão parcial entre engine e IA
- **Q15 (determinismo)** — obriga injeção de aleatoriedade em vez de `Math.random()`
