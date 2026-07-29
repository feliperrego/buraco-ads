# ADR-0003 — Incluir as canastras de 500 e de 1000

- **Status:** Aceita
- **Data:** 2026-07-29
- **Emenda parcialmente:** [ADR-0001](0001-variante-buraco-aberto.md)

## Contexto

O [ADR-0001](0001-variante-buraco-aberto.md) escolheu o Buraco Aberto e justificou a
escolha, entre outros motivos, por uma superfície de regras menor — citando
explicitamente *"sem trinca, sem Curingão, **sem canastra de 500/1000**"*.

Essa afirmação estava errada. Ao revisar o glossário, ficou claro que as canastras
especiais são parte da forma como o jogo é efetivamente jogado:

- **Canastra de 500** — sequência de Ás a Rei, 13 cartas
- **Canastra de 1000** — sequência de Ás a Ás, 14 cartas, com um Ás em cada ponta

Elas não são exclusivas do Buraco Fechado, e omiti-las produziria um jogo que não
corresponde ao que se joga na mesa.

## Decisão

As canastras de 500 e de 1000 fazem parte da v1.

A escala de pontuação das canastras passa a ser:

| Categoria | Pontos |
|---|---|
| Suja | 100 |
| Limpa | 200 |
| De 500 (Ás a Rei) | 500 |
| De 1000 (Ás a Ás) | 1000 |

A afirmação do ADR-0001 sobre "sem canastra de 500/1000" fica **revogada**. Todo o resto
daquele ADR — a escolha do Buraco Aberto, a ausência de trinca e de Curingão — permanece
válido.

## Consequências

**Positivas**

- O jogo corresponde ao que se joga de fato; a escala de recompensa acompanha a
  dificuldade de montar cada tipo de canastra.
- Custo de implementação baixo: as duas categorias derivam da mesma regra de tamanho de
  sequência, não de um tipo novo de jogo.

**Negativas**

- Classificar uma canastra deixa de ser um booleano (limpa/suja) e passa a exigir uma
  função com **precedência definida** entre quatro categorias. Sem precedência explícita,
  a pontuação vira dependente da ordem dos `if` na implementação — um bug silencioso.
- Surgem perguntas que ainda não têm resposta: uma canastra de 500 com curinga continua
  valendo 500? Ficam registradas como pendências em `glossary.md` §9 e serão decididas em
  `rules.md`.

**Neutras**

- Exigiu tornar mais precisa a regra da sequência. A formulação anterior — "não dá a
  volta" — era incompatível com a canastra de Ás a Ás. A formulação correta é: **o Ás pode
  ocupar as duas pontas da mesma sequência, que termina no Ás alto e não continua além
  dele**. Assim `A…K-A` (14 cartas) é válida e `K-A-2` permanece inválida.

## Alternativas consideradas

- **Só a canastra de 1000** — deixaria a sequência de Ás a Rei valendo o mesmo que uma
  canastra comum de sete cartas, criando um degrau faltando na escala.
- **Manter o ADR-0001 como estava** — domínio mais enxuto, mas produziria um jogo que
  usuários reconheceriam como incompleto.

## Nota de processo

Esta contradição só foi detectada porque o ADR-0001 registrava **por que** a decisão havia
sido tomada, não apenas qual. Uma justificativa escrita é o que permite perceber quando
ela deixa de ser verdadeira. ADRs são append-only: o 0001 não foi editado no que decidiu,
apenas anotado para apontar para cá.
