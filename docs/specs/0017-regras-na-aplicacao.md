# Spec 0017 — H17: as regras dentro da aplicação

> Status: **rascunho anotado** — 6 decisões, todas pendentes
> História: `H17` — _"Consulto as regras do jogo sem sair da aplicação"_
> Fecha: ADR-0005, RNF3.2 (o 404 em português)

## 1. O problema

A rota `/regras` existe desde a tarefa 0.7 e renderiza `<h1>Regras</h1>`. É o último esqueleto
vazio do projeto.

O que ela precisa mostrar já existe, e é aí que mora a decisão: o
[`rules.md`](../rules.md) tem **66 regras** em doze seções, e é **normativo** — a invariante 2
do acordo diz que regra que não está lá não existe. Mas ele foi escrito para nós: tem
identificadores estáveis, marcas de origem, notas sobre decisões abandonadas e uma seção de
histórico. Nada disso é para o jogador.

Então a pergunta desta fatia não é "como renderizar markdown". É: **o que impede a tela de
divergir do documento normativo?**

---

## 2. De onde vem o texto

|  | Como | Custo |
|---|---|---|
| **A — o `rules.md` inteiro** | importar como texto e renderizar | o jogador lê `[D]`, `R8.3` e a seção de decisões abandonadas; e exige biblioteca de markdown ou aceitar texto cru |
| **B — texto próprio, escrito para o jogador** | prosa nova no componente | **diverge em silêncio** quando uma regra mudar, e o projeto não tem como saber |
| **C — texto próprio, com as regras citadas** | prosa nova, cada trecho citando os `Rn` que resume | a divergência deixa de ser silenciosa: o `verificar-rastreabilidade.py` já sabe cobrar citação de regra, e passa a cobrar desta tela também |

- `[P]` **S159** — Forma **C**. A tela tem texto próprio, escrito para quem vai jogar, e **cada
  bloco cita os `Rn` que resume**. A citação entra no `rastreio.json`, e uma regra que nenhum
  bloco cite reprova o CI.

> A **A** é a tentação, porque parece a única que "não pode divergir". Ela troca divergência por
> outro defeito: entrega ao jogador um documento de engenharia. O `rules.md` diz _"R8.6 — a
> canastra de 1000 exige as catorze casas"_, e o jogador precisa de _"uma sequência de A a A, com
> catorze cartas, vale 1000"_. São o mesmo fato em duas línguas, e a tela precisa da segunda.
>
> A **B** é o que quase todo projeto faz, e o motivo de tantas telas de ajuda estarem erradas.
> Este projeto já tem a ferramenta que a impede — o `verificar-rastreabilidade.py`, que nasceu na
> Onda 3 e já achou duas regras órfãs na H14.

---

## 3. O que a citação obriga, e o que ela não obriga

- `[P]` **S160** — A citação é de **cobertura**, não de fidelidade. O script prova que nenhuma
  regra ficou de fora da tela; ele **não** prova que o texto ao lado da citação está certo. Essa
  parte continua sendo leitura humana, e a spec diz isso em vez de fingir o contrário.

> É a mesma honestidade da RNF2.1: o teste cita o `Rn` que valida, e a citação não substitui o
> julgamento sobre o que o teste afirma. Verificador que promete mais do que checa é pior que
> nenhum — foi a lição do `grep` que declarou "sem conflito" e deixou passar um ID duplicado.

---

## 4. Como se chega lá, e como se volta

A H17 é a primeira fatia em que o jogador **sai da tela de partida e volta**. Isso levanta uma
pergunta que nenhuma fatia anterior fez: a partida sobrevive?

Sobrevive, e por construção: o `ProvedorDaPartida` fica **acima** do `RouterProvider`
(`Aplicacao.tsx`), então trocar de rota não desmonta o estado. Isso não foi decidido pela H17 —
foi decidido na H1, ao descobrir que `beforeLoad` roda fora do React.

- `[P]` **S161** — O acesso às regras é um **link de rota**, e ele existe nas três telas do jogo:
  inicial, partida e fim. Voltar é o botão do navegador **e** um link de volta na própria tela de
  regras, porque a RNF3.4 pede navegação por teclado e o botão do navegador não é conteúdo da
  página.

- `[P]` **S162** — Sair para `/regras` e voltar **preserva a partida**, e isso ganha critério
  próprio em vez de ficar implícito na arquitetura. É a propriedade que um refactor do
  `Aplicacao.tsx` quebraria sem que nenhum outro teste reclamasse.

> A S162 é a lição da H13 aplicada antes do erro: quando a spec justifica algo dizendo "isto vale
> porque em tal situação seria diferente", essa situação precisa virar critério. Aqui a situação é
> o provedor descer para dentro da rota raiz — e é uma mudança que parece inofensiva.

---

## 5. O 404 em português

O `roadmap.md` §3 guarda, com prazo neste marco:

> _"Tela de rota inexistente em português — hoje é o 'Not Found' padrão do TanStack, em inglês e
> sem `<h1>`."_

Ele nasceu na tarefa 0.7 e tem causa conhecida: o _rewrite_ de SPA do `vercel.json` faz a Vercel
devolver **200 para qualquer caminho**, então **o roteador é o dono do 404**, não o servidor.

- `[P]` **S163** — O gatilho fecha aqui, e não numa fatia própria. A tela de rota inexistente é a
  mesma família da tela de regras — conteúdo estático, em português, com caminho de volta —, e
  separá-las custaria uma fatia para um `<h1>` e um link.

---

## 6. O que fica de fora

- **Busca dentro das regras.** Doze seções com âncoras bastam; busca é funcionalidade, e nenhum
  requisito a pede.
- **Biblioteca de markdown.** A forma **C** não precisa de uma: o texto é JSX.
- **Estilo.** É a H19.

- `[P]` **S164** — Nenhuma dependência nova entra nesta fatia. É a mesma pergunta que o ADR-0004
  fez ao remover o TanStack Query: a biblioteca resolve um problema que temos?

---

## 7. Critérios de aceite

**S159 e S160 — o texto e a cobertura**

- `CA-S159-1` — a rota `/regras` mostra as doze seções do `rules.md`, com título em português
- `CA-S159-2` — a tela **não** mostra identificadores de regra, marcas `[D]`/`[P]` nem a seção de
  histórico de decisões — é o par negativo da `CA-S159-1`
- `CA-S160-1` — o `verificar-rastreabilidade.py` passa a cobrar a tela de regras como fonte
  citante, e foi **visto reprovando** com uma regra descoberta

**S161 e S162 — a navegação**

- `CA-S161-1` — as telas inicial, de partida e de fim oferecem caminho para as regras
- `CA-S161-2` — a tela de regras oferece caminho de volta, como conteúdo da página
- `CA-S162-1` — iniciar partida, ir às regras e voltar mantém a **mesma** partida: mesma mão,
  mesmo placar, mesma fase
- `CA-S162-2` — ir às regras **sem** partida e voltar não cria partida nenhuma

**S163 — o 404**

- `CA-S163-1` — um caminho inexistente mostra `<h1>` em português com caminho para a tela inicial
- `CA-S163-2` — o texto _"Not Found"_ não aparece em lugar nenhum — é o par negativo

---

## 8. Decisões

Seis propostas. Nenhuma confirmada.

| # | Assunto | Proposta |
|---|---|---|
| **S159** | Conteúdo | Texto próprio para o jogador, com cada bloco **citando os `Rn`** que resume |
| **S160** | Verificação | A citação prova **cobertura**, não fidelidade — e a spec diz isso |
| **S161** | Navegação | Link para as regras nas três telas, e link de volta como conteúdo da página |
| **S162** | Estado | Ir às regras e voltar **preserva a partida**, com critério próprio |
| **S163** | Escopo | O 404 em português fecha aqui, junto — mesma família de tela |
| **S164** | Escopo | Nenhuma dependência nova; o texto é JSX |

### Onde eu erraria, se errasse

**A S159 é a única com risco de domínio**, e o risco não é a forma — é o **texto**. Resumir 66
regras para um jogador é reescrever o seu Buraco em outra língua, e a calibragem do acordo diz
que é exatamente aí que eu erro: 5 de 5 quedas do projeto foram no `rules.md`.

A citação da S160 não me protege disso. Ela prova que nenhuma regra ficou de fora; não prova que
eu a resumi certo. **Vale ler o texto da tela como você leu o `rules.md`** — é o mesmo conteúdo,
com o mesmo tipo de erro possível.

A **S163** é a que eu tiraria se você quisesse a fatia menor. Ela é oportunista: cabe aqui porque
é a mesma família de tela, não porque a H17 precise dela.
