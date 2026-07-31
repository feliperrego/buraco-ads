# Estratégia de testes

> Status: **confirmado** — 10 decisões, nenhuma pendência
> Deriva de: [requirements.md](requirements.md) · [acceptance-tests.md](acceptance-tests.md) · [architecture.md](architecture.md) · [domain.md](domain.md)
> Última atualização: 2026-07-29

## Como ler este documento

`acceptance-tests.md` diz **o que** verificar. Este documento diz **em que nível, com que
ferramenta, e o que o CI exige** para considerar uma história pronta.

O objetivo não é "muitos testes". É que cada regra tenha exatamente um lugar natural onde é
verificada, e que uma falha diga imediatamente qual regra caiu.

Pendências: `E1`…`En`.

---

## 1. Cinco níveis

| Nível | O que verifica | Ferramenta | Quantidade esperada | Velocidade |
|---|---|---|---|---|
| **1. Unitário de engine** | Uma regra, isolada | Vitest | Centenas | milissegundos |
| **2. Invariante em volume** | M9 e alcançabilidade | Vitest + IAs aleatórias | Uma suíte | segundos |
| **3. Integração de engine** | Sequências de comandos, rodada completa | Vitest | Dezenas | milissegundos |
| **4. Componente de interface** | Comportamento, não aparência | Vitest + Testing Library | Dezenas | segundos |
| **5. Ponta a ponta** | Uma partida real no navegador | Playwright | Duas ou três | minutos |

- `[D]` O **nível 2 não existe na pirâmide clássica** e é o de maior retorno neste
  projeto. Não é um extra: é o nível que pega a classe de bug que os outros quatro não pegam.

> Testes por regra verificam o que você **pensou em verificar**. O nível 2 verifica o que
> ninguém pensou: mil partidas entre IAs aleatórias, sementes distintas, conferindo a
> conservação das 104 cartas (M9) após **cada** comando. Se algum caminho de código perde ou
> duplica carta, ele aparece — sem que alguém tenha escrito o caso.
>
> É possível porque a IA escolhe dentro de `movimentosValidos`
> ([user-stories.md](user-stories.md) U2): ela nunca produz jogada ilegal, então mil partidas
> são mil caminhos válidos percorridos de graça.

---

## 2. A engine não tem mocks

- `[D]` Nenhum teste de engine usa mock, spy ou dublê. Se algum precisar, é sinal
  de que a fronteira está errada.

> Isso não é disciplina, é consequência de decisões já tomadas. `Partida` é imutável e os
> comandos são funções puras (M8); a aleatoriedade entra por injeção (A5); a engine não importa
> nada (RNF1.1). Não há relógio, rede, banco ou DOM para simular.
>
> Um teste de engine é: monte o estado, aplique o comando, compare o retorno. Sem preparo, sem
> limpeza, sem ordem entre testes. É o retorno concreto de M8 e A5 — e vale lembrar disso
> quando alguém propuser "só um `Date.now()` aqui".

---

## 3. Como a RNF2.1 é medida

A RNF2.1 exige que toda regra tenha teste citando seu identificador. Isso precisa ser
verificável, não declarado.

- `[D]` A métrica que **bloqueia** o CI é **cobertura por regra**: toda regra de
  `rules.md` tem ao menos um teste cujo nome cita seu `Rn`. Meta: **100%**, sem exceção.
- `[D]` Cobertura de **linhas** é medida e reportada, com piso de **90% em
  `engine/`**, mas **não é a métrica principal**.

> A inversão é deliberada. "90% de linhas" convive tranquilamente com uma regra de pontuação
> inteira sem teste — basta que as linhas dela sejam executadas de passagem por outro teste.
> "66 de 66 regras com teste nomeado" é uma afirmação sobre o domínio, não sobre execução de
> código.
>
> A cobertura de linhas continua útil como sinal invertido: se uma parte de `engine/` não é
> executada por teste nenhum, provavelmente é código morto.

- `[D]` `scripts/verificar-rastreabilidade.py` é estendido para ler os **nomes dos
  testes** e conferir a relação regra ↔ teste. Hoje ele confere regra ↔ história e
  regra ↔ critério; passará a fechar o ciclo até o código.

---

## 4. Como testar a IA

O problema mais interessante do documento. Não se pode afirmar "a IA deve escolher esta
jogada" — isso congelaria a heurística e faria todo ajuste quebrar testes.

- `[D]` A IA é verificada por **quatro propriedades**, nenhuma delas sobre jogadas
  específicas:

| Propriedade | Verificação |
|---|---|
| **Legalidade** | Toda escolha está em `movimentosValidos`. Garantida por construção, testada de todo modo |
| **Determinismo** | Mesma `VisaoDoJogador` e mesma semente produzem a mesma escolha |
| **Força relativa** | A IA heurística vence a IA aleatória em pelo menos **70%** de mil partidas |
| **Orçamento de tempo** | Decide em menos de **100 ms** por turno |

> A propriedade de **força relativa** é a que dá segurança para mexer na heurística: se um
> ajuste faz a taxa cair, é regressão; se sobe, é melhoria. Uma métrica, não uma opinião.
>
> O limiar de 70% é uma proposta minha, sem base empírica ainda. Depois de H15 saberemos o
> número real e ele pode subir.
>
> Sobre o **orçamento de tempo**: a RF5.3 pede ritmo perceptível, mas isso é uma pausa
> deliberada na interface, não lentidão da IA. Os 100 ms são o limite do cálculo real, para
> que o ritmo seja escolha nossa e não consequência de ineficiência.

- `[D]` A **IA aleatória não é descartada** depois de H15. Ela é infraestrutura de
  teste permanente: adversário do nível 2 e linha de base da força relativa.

---

## 5. O que não vamos testar

- `[D]` Fora de escopo, por decisão:

| Não testamos | Por quê |
|---|---|
| **Snapshot visual** | RNF2.2. Quebra a cada ajuste de estilo, sem pegar defeito de comportamento |
| **Getters e construtores triviais** | Verificar `carta.naipe` retorna o naipe não afirma nada sobre o domínio |
| **Aparência** | Cores, espaçamento e tipografia são revisão humana, não asserção |
| **Detalhes internos da engine** | Testes contra `engine/index.ts` (A8). Testar o interior impede reorganizá-lo |
| **Teste de mutação** | Verificaria a qualidade dos testes, o que aqui seria valioso — mas é lento e adiciona ferramenta. Reavaliar se aparecer bug em regra que tinha teste passando |

> A última linha é a única que me deixa desconfortável. Um domínio denso em regras é
> exatamente onde teste de mutação se paga, porque revela testes que passam sem verificar nada.
> Estou deixando fora por custo de ferramenta, e registrando o gatilho de reavaliação em vez de
> fingir que a decisão é definitiva.

---

## 6. O que o CI roda

- `[D]` Na ordem, com falha rápida:

```
1. lint          ESLint, incluindo a regra de dependência (A2)
2. tipos         tsc --noEmit
3. rastreio      scripts/verificar-rastreabilidade.py
4. unitário      Vitest — níveis 1 e 3
5. invariante    Vitest — nível 2, mil partidas
6. componente    Vitest + Testing Library — nível 4
7. e2e           Playwright — nível 5, só a partir da Onda 3 (ADR-0006)
```

> A ordem é por custo crescente. Os três primeiros passos rodam em segundos e pegam a maior
> parte dos erros de integração de especificação — inclusive violações da regra de dependência,
> que são falhas de arquitetura e não de código.
>
> Colocar o rastreio (passo 3) antes dos testes é intencional: uma regra órfã é um defeito de
> especificação, e descobrir isso depois de dez minutos de suíte é desperdício.

- `[D]` O passo 5 (mil partidas) roda com **sementes fixas** no CI e aceita um
  parâmetro para rodar com sementes aleatórias localmente.

> Sementes fixas no CI mantêm o resultado reproduzível: uma falha é sempre a mesma falha.
> Sementes aleatórias na máquina de quem desenvolve exploram território novo. As duas coisas
> são desejáveis e incompatíveis no mesmo lugar — daí a separação.
>
> Quando uma semente aleatória achar um defeito, ela **entra na lista fixa**. A suíte cresce
> com o histórico de bugs encontrados, em vez de sortear de novo e esquecer.

---

## 7. Histórico das decisões

**Não há pendências.** As 10 decisões foram confirmadas em 2026-07-29.

| # | Assunto | Decisão confirmada |
|---|---|---|
| **E1** | Níveis | Cinco níveis, com o **nível 2** (invariante em volume) como o de maior retorno |
| **E2** | Mocks | **Nenhum mock** em teste de engine; precisar de um indica fronteira errada |
| **E3** | Métrica principal | **Cobertura por regra: 100%**, verificada e bloqueante |
| **E4** | Métrica auxiliar | Cobertura de linhas com piso de 90% em `engine/`, não principal |
| **E5** | Script | Estender a verificação para a relação regra ↔ nome de teste |
| **E6** | IA | Quatro propriedades: legalidade, determinismo, força relativa (≥70%), tempo (<100 ms) |
| **E7** | IA aleatória | **Permanente** como infraestrutura de teste, não descartada em H15 |
| **E8** | Fora de escopo | Sem snapshot visual, sem getters triviais, sem teste de mutação na v1 |
| **E9** | CI | Sete passos por custo crescente; rastreio **antes** dos testes |
| **E10** | Sementes | Fixas no CI, aleatórias localmente; semente que acha bug entra na lista fixa |

### Notas de decisão

- **E3 e E4** invertem a métrica usual: cobertura por regra bloqueia, cobertura de linhas informa.
- **E6** — o limiar de 70% é palpite sem base empírica. Reavaliação registrada no `roadmap.md`.
- **E8** — teste de mutação fica fora da v1, com gatilho de reavaliação no `roadmap.md`.
