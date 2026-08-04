# Documentação

Este projeto é desenvolvido por **Spec-Driven Development**: nenhum código nasce sem uma
especificação escrita antes dele.

A documentação se divide em dois tipos, e a distinção importa:

- **Documentos de fundação** — mudam devagar. Respondem *por que* e *o quê*.
- **Specs de fatia** — mudam rápido. Respondem *como esta funcionalidade se comporta*.
  Nascem, viram código e testes, e passam a ser histórico.

## Ordem de escrita

Cada onda consome a anterior como entrada. Não escrevemos uma onda antes da anterior
estar aprovada.

### Onda 0 — Fundação ✅ completa

| Documento | Propósito | Status |
|---|---|---|
| [vision.md](vision.md) | Por que o produto existe, para quem, e o que ele **não** é | Escrito |
| [glossary.md](glossary.md) | Linguagem ubíqua: o vocabulário do Buraco que o código vai usar | Escrito |
| [rules.md](rules.md) | Regras do jogo. **Fonte única de verdade do domínio** | Confirmado |
| [requirements.md](requirements.md) | Requisitos funcionais e não-funcionais do produto | Confirmado |

### Onda 1 — Modelagem ✅ completa

| Documento | Propósito | Status |
|---|---|---|
| [domain.md](domain.md) | Entidades, agregados, invariantes, máquina de estados | Confirmado |
| [architecture.md](architecture.md) | Camadas, fronteiras e regra de dependência | Confirmado |

### Onda 2 — Experiência ✅ completa

| Documento | Propósito | Status |
|---|---|---|
| [user-stories.md](user-stories.md) | Fatias verticais de valor | Confirmado |
| [screens.md](screens.md) | Telas, fluxos e estados de interface | Confirmado |
| [acceptance-tests.md](acceptance-tests.md) | Critérios de aceite em Given/When/Then | Confirmado |

### Onda 3 — Execução

| Documento | Propósito | Status |
|---|---|---|
| [testing-strategy.md](testing-strategy.md) | O que testar, em que nível, e por quê | Confirmado |
| [roadmap.md](roadmap.md) | Ordem de entrega e marcos | Confirmado |

## Specs de fatia

[`specs/`](specs/) é onde o ciclo SDD roda por funcionalidade em vez de por documento. Uma
spec por história, escrita antes do código dela.

Diferente dos documentos acima, uma spec é **descartável**: quando a história está pronta e
testada, os testes passam a ser a especificação viva.

| Spec | História | Status |
|---|---|---|
| [0001-mesa-inicial.md](specs/0001-mesa-inicial.md) | H1 — mesa inicial | **Implementada** — 20 critérios verdes |
| [0002-comprar-e-descartar.md](specs/0002-comprar-e-descartar.md) | H2 — comprar e descartar | **Implementada** — 20 critérios verdes |
| [0003-turno-da-ia.md](specs/0003-turno-da-ia.md) | H3 — turno da IA | **Implementada** — 10 critérios verdes |
| [0004-baixar-sequencias.md](specs/0004-baixar-sequencias.md) | H4 — baixar sequências | **Implementada** — 24 critérios verdes |
| [0005-curinga.md](specs/0005-curinga.md) | H5 — o 2 como curinga | **Implementada** — 19 critérios verdes |
| [0006-aumentar.md](specs/0006-aumentar.md) | H6 — aumentar um jogo na mesa | **Implementada** — 22 critérios verdes |
| [0007-pegar-o-lixo.md](specs/0007-pegar-o-lixo.md) | H7 — pegar o lixo | **Implementada** — 18 critérios verdes |
| [0008-categoria-da-canastra.md](specs/0008-categoria-da-canastra.md) | H8 — categoria da canastra | **Implementada** — 11 novos e 12 herdados |
| [0009-regularizar-o-curinga.md](specs/0009-regularizar-o-curinga.md) | H9 — regularizar o curinga | **Implementada** — 11 novos e 4 herdados |
| [0010-pegar-morto.md](specs/0010-pegar-morto.md) | H10 — pegar o morto | **Implementada** — 16 novos e 1 herdado |
| [0011-bater.md](specs/0011-bater.md) | H11 — bater e encerrar a rodada | **Implementada** — 16 novos e 2 herdados |
| [0012-apuracao-da-rodada.md](specs/0012-apuracao-da-rodada.md) | H12 — a apuração da rodada | **Implementada** — 17 novos e 2 herdados |

## Verificação

```bash
npm run verificar
```

Roda, na ordem do CI ([testing-strategy.md](testing-strategy.md) E9): `lint` → `formato` →
`tipos` → `fronteiras` → `rastreio` → `teste`.

Os testes são divididos em dois projetos do Vitest, porque as camadas têm necessidades
opostas: **`nucleo`** roda em Node sem DOM (`engine/`, `ia/`, `tests/`) e **`interface`** roda
em jsdom (`ui/`, `estado/`). Durante o desenvolvimento da engine dá para rodar só o núcleo:

```bash
npx vitest --project nucleo
npm run teste:cobertura
```

### Fronteiras arquiteturais

A regra de dependência de [architecture.md](architecture.md) A1 é **verificada por ESLint**,
não por disciplina (A2). [`scripts/verificar-fronteiras.py`](../scripts/verificar-fronteiras.py)
prova que a configuração funciona: escreve 14 violações propositais e 4 imports permitidos,
confere cada resultado e apaga tudo.

```bash
python3 scripts/verificar-fronteiras.py
```

Os casos permitidos existem porque uma regra que bloqueasse **qualquer** import também
passaria nos 14 testes negativos.

Para escrever essas violações, o script cria arquivos dentro de `src/engine/`, `src/estado/`
e `src/ia/` — e depois os apaga. Em 2026-07-31 descobrimos que a limpeza apagava as três
pastas **inteiras**, junto com código não commitado. Era inofensiva enquanto elas não
existiam, e destrutiva no primeiro dia da engine.

```bash
python3 scripts/verificar-fronteiras-preserva.py
```

[`verificar-fronteiras-preserva.py`](../scripts/verificar-fronteiras-preserva.py) fecha esse
buraco: cria sentinelas nas três pastas, roda o verificador e exige que sobrevivam byte a
byte. Foi visto reprovando contra a versão antiga antes de ser aceito.

### Rastreabilidade

[`scripts/verificar-rastreabilidade.py`](../scripts/verificar-rastreabilidade.py) confere as
relações entre documentos e falha o CI se alguma quebrar: toda regra citada por alguma
história, nenhuma história citando regra inexistente, nenhum critério citando regra
inexistente.

```bash
python3 scripts/verificar-rastreabilidade.py
```

A configuração fica em [`rastreio.json`](../rastreio.json) na raiz: qual arquivo define os
itens numerados, com que padrão, e quais documentos os citam. O script é genérico — a mesma
ferramenta serve para requisitos, endpoints ou qualquer conjunto de itens identificados.

### Unicidade dos identificadores

```bash
python3 scripts/verificar-identificadores.py
```

[`verificar-identificadores.py`](../scripts/verificar-identificadores.py) prova que nenhum
`CA-` ou `S` foi **definido em dois lugares**. São as duas famílias que atravessam arquivos:
critérios vivem em [acceptance-tests.md](acceptance-tests.md) *e* em [`specs/`](specs/), e a
série `S` das specs é global e não reinicia.

Ele nasceu de uma colisão real, em 2026-08-01: ao fechar a spec da H1, a checagem de conflito
foi um `grep` de padrão `CA-R[0-9.]+-[0-9]+`, que casa `CA-R2.2-1` e **ignora** `CA-M9-1`. O
identificador já pertencia ao `acceptance-tests.md` com outro significado, e a duplicata entrou
no repositório junto com o teste.

A lição está na regra do `CLAUDE.md`: afirmação de completude precisa de script, não de
atenção — e um `grep` escrito na hora é atenção disfarçada de script.

Desde 2026-08-03 ele faz uma **segunda** checagem, e ela nasceu do mesmo jeito. A contagem de
decisões de cada spec aparece em três lugares — o cabeçalho, a frase que abre a seção final e as
linhas da tabela —, e uma decisão acrescentada no meio da fatia não chegava aos três. Medido: a
spec 0008 tinha a `S94` marcada no corpo e **ausente da tabela**; a 0010 tinha oito decisões e um
cabeçalho dizendo sete.

A tabela é a fonte, porque é ela que se lê para revisar. O cabeçalho e a frase precisam concordar
com ela, e nada marcado `[P]` ou `[D]` no corpo pode faltar nela. Os três ramos foram vistos
reprovando contra specs corretas antes de o script ser aceito.

### O que fica de fora

Uma coisa **não** é coberta por `npm run verificar`, e vale saber qual: o *rewrite* de SPA do
[`vercel.json`](../vercel.json), que faz uma rota digitada direto na URL devolver a aplicação
em vez de 404.

Ele só existe em produção, e o preview local **não serve como prova** — medimos que o
`vite preview` faz *fallback* sozinho e devolve `200 text/html` com ou sem configuração. Um
teste local dele passaria sempre, inclusive com o arquivo apagado.

A verificação é contra a URL publicada:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://buraco-ads.vercel.app/rota-que-nao-existe
```

Deve devolver **200**. Se devolver 404, o *rewrite* se perdeu. O raciocínio completo, incluindo
a medição do 404 antes do arquivo existir, está no
[ADR-0008](decisions/0008-publicar-na-vercel-com-integracao-git.md).

## Decisões

[`decisions/`](decisions/) guarda os ADRs (*Architecture Decision Records*). São
**append-only**: uma decisão tomada não se apaga, se supersede por outra.

| ADR | Decisão |
|---|---|
| [0001](decisions/0001-variante-buraco-aberto.md) | Adotar Buraco Aberto como variante de referência |
| [0002](decisions/0002-formato-individual-1v1.md) | Formato 1 contra 1 na v1 |
| [0003](decisions/0003-canastras-especiais-500-1000.md) | Incluir as canastras de 500 e de 1000 (emenda o 0001) |
| [0004](decisions/0004-remover-tanstack-query.md) | Remover o TanStack Query da stack |
| [0005](decisions/0005-manter-tanstack-router.md) | Manter o TanStack Router |
| [0006](decisions/0006-playwright-na-onda-3.md) | Playwright entra na Onda 3 |
| [0007](decisions/0007-typescript-estrito-com-indexacao-verificada.md) | TypeScript estrito com indexação verificada |
| [0008](decisions/0008-publicar-na-vercel-com-integracao-git.md) | Publicar na Vercel com integração Git (depende da mesma premissa do 0004) |
| [0009](decisions/0009-roteamento-por-codigo.md) | Roteamento por código, divergindo do padrão recomendado do TanStack |
