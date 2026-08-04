#!/usr/bin/env python3
"""Prova que nenhum identificador foi definido em dois lugares.

Regressao de 2026-08-01. Ao fechar a spec da H1 eu declarei "sem conflito de
IDs" depois de rodar um grep de padrao `CA-R[0-9.]+-[0-9]+`, que casa `CA-R2.2-1`
e **ignora silenciosamente** `CA-M9-1`. O ID ja pertencia a acceptance-tests.md
com outro significado, e a colisao entrou no repositorio junto com o teste.

A regra do CLAUDE.md e clara: afirmacao contavel precisa de script, nao de
atencao. Este e o script.

Cobre as duas familias que atravessam arquivos:

  CA-*  criterios de aceite, definidos em acceptance-tests.md E em docs/specs/
  S*    decisoes de spec, numeradas em serie global que nao reinicia

Regras (R, RF, RNF, M, A, T, E, RD) vivem cada uma num arquivo so, e o
verificar-rastreabilidade.py ja cuida das citacoes delas.

SEGUNDA CHECAGEM, de 2026-08-03: a contagem de decisoes de cada spec aparece em
TRES lugares -- o cabecalho, a frase de abertura da secao final e as linhas da
tabela -- e uma decisao acrescentada no meio da fatia nao chegava aos tres.
Medido: a spec 0008 tinha a S94 marcada no corpo e ausente da tabela; a 0010
tinha oito decisoes e um cabecalho dizendo sete. As duas sao o mesmo erro, e o
CLAUDE.md ja registrava dois casos anteriores dele.

A tabela e a fonte: e ela que se le para revisar. O cabecalho e a frase precisam
concordar com ela, e nada marcado [P] ou [D] no corpo pode faltar nela.

Uso: python3 scripts/verificar-identificadores.py
"""

import collections
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DOCS = RAIZ / "docs"

FAMILIAS = {
    "criterios de aceite": r"CA-[A-Za-z0-9.]+-\d+",
    "decisoes de spec": r"S\d+",
}

# Um identificador esta sendo DEFINIDO quando aparece em negrito, seja como
# primeira celula de uma linha de tabela, seja abrindo um item de lista. Citacoes
# no meio da prosa nao contam - elas sao o uso normal e esperado.
PADROES_DE_DEFINICAO = (
    r"^\|\s*\*\*({id})\*\*\s*\|(?P<texto>.*)",
    r"^- (?:`\[[PDF]\]`\s*)?(?:⚠️\s*)?\*\*({id})\*\*(?P<texto>.*)",
)


def definicoes(padrao_id):
    """Mapeia identificador -> {arquivo: primeiro texto visto}."""
    encontrados = collections.defaultdict(dict)

    for markdown in sorted(DOCS.rglob("*.md")):
        relativo = str(markdown.relative_to(RAIZ))
        for linha in markdown.read_text(encoding="utf-8").splitlines():
            for molde in PADROES_DE_DEFINICAO:
                achado = re.match(molde.format(id=padrao_id), linha)
                if achado:
                    identificador = achado.group(1)
                    # Dentro de um mesmo arquivo, definir nos dois formatos e o
                    # padrao documentado: item no corpo, linha na tabela final.
                    encontrados[identificador].setdefault(
                        relativo, achado.group("texto").strip(" |")[:64]
                    )

    return encontrados


# A contagem aparece por extenso a partir da spec 0006 e em algarismo antes
# dela. As duas formas valem; o que nao vale e divergirem.
POR_EXTENSO = {
    "uma": 1, "duas": 2, "tres": 3, "quatro": 4, "cinco": 5, "seis": 6,
    "sete": 7, "oito": 8, "nove": 9, "dez": 10, "onze": 11, "doze": 12,
    "treze": 13, "catorze": 14, "quatorze": 14, "quinze": 15, "dezesseis": 16,
    "dezessete": 17, "dezoito": 18, "dezenove": 19, "vinte": 20,
}

SEM_ACENTO = str.maketrans("áàâãéêíóôõúç", "aaaaeeiooouc")


def contagem(texto):
    """Quantas decisoes o texto declara, em algarismo ou por extenso.

    Duas formas em uso, e a ordem em que sao tentadas importa. "Treze,
    confirmadas em bloco em 2026-08-02" abre com a palavra e nao repete o
    substantivo; "As 16 decisoes foram confirmadas em 2026-07-31" usa algarismo
    e traz o substantivo junto. Procurar algarismo primeiro acharia o **ano** na
    primeira forma -- foi o que a primeira versao desta funcao fez, e ela
    acusou dez specs incoerentes por causa disso.
    """
    primeira = re.match(r"\**([A-Za-zÀ-ÿ]+)", texto.strip())
    if primeira:
        valor = POR_EXTENSO.get(primeira.group(1).lower().translate(SEM_ACENTO))
        if valor is not None:
            return valor

    achado = re.search(r"(\d+)\s+(?:decis|propost)", texto)
    return int(achado.group(1)) if achado else None


def documentos_contaveis():
    """Quais arquivos tem contagem em tres lugares, e com que familia de ID.

    As specs foram o caso original. O ia-strategy.md entrou depois, com a mesma
    estrutura e a mesma falha: nasceu com o cabecalho dizendo 10 e a tabela com
    11 linhas. Documento de fundacao nao e spec, mas conta do mesmo jeito -- e o
    que decide se ele entra aqui e ter a contagem repetida, nao a pasta.
    """
    for spec in sorted((DOCS / "specs").glob("*.md")):
        yield spec, r"S\d+"
    yield DOCS / "ia-strategy.md", r"IA\d+"


def coerencia_das_specs():
    """Cabecalho, frase de abertura e tabela precisam contar a mesma coisa."""
    problemas = []

    for documento, padrao_id in documentos_contaveis():
        texto = documento.read_text(encoding="utf-8")
        nome = documento.name

        cabecalho = re.search(r"^> Status:.*$", texto, re.M)
        secao = re.search(
            r"^## \d+\. (?:Decis|Pend)\S*\s*\n\s*\n(.+)$", texto, re.M
        )
        tabela = set(re.findall(rf"^\|\s*\*\*({padrao_id})\*\*", texto, re.M))
        corpo = set(re.findall(rf"^- `\[[PD]\]`\s*\*\*({padrao_id})\*\*", texto, re.M))

        if cabecalho is None or secao is None:
            problemas.append(f"{nome}: sem cabecalho de status ou sem secao de decisoes")
            continue

        # O cabecalho traz numero da spec e numero de decisoes; o segundo e o
        # que vem depois do travessao.
        depois = cabecalho.group(0).split("—")[-1]
        no_cabecalho = contagem(depois)
        na_frase = contagem(secao.group(1))

        if no_cabecalho != len(tabela):
            problemas.append(
                f"{nome}: cabecalho diz {no_cabecalho}, tabela tem {len(tabela)}"
            )

        if na_frase != len(tabela):
            problemas.append(
                f"{nome}: abertura da secao diz {na_frase}, tabela tem {len(tabela)}"
            )

        # A ordenacao tira os digitos por regex em vez de cortar o primeiro
        # caractere: o prefixo tem uma letra em `S12` e duas em `IA3`.
        faltando = sorted(corpo - tabela, key=lambda i: int(re.sub(r"\D", "", i)))
        if faltando:
            problemas.append(
                f"{nome}: marcadas no corpo e ausentes da tabela: {', '.join(faltando)}"
            )

    return problemas


def main():
    falhas = []

    for rotulo, padrao in FAMILIAS.items():
        encontrados = definicoes(padrao)
        colisoes = {i: a for i, a in encontrados.items() if len(a) > 1}

        print(f"{rotulo}: {len(encontrados)} identificadores definidos")
        for identificador, arquivos in sorted(colisoes.items()):
            print(f"  COLISAO  {identificador}")
            for arquivo, texto in arquivos.items():
                print(f"           {arquivo}: {texto}")
            falhas.append(f"{identificador} definido em {len(arquivos)} arquivos")

    if falhas:
        print(f"\n{len(falhas)} identificador(es) definido(s) em mais de um lugar:")
        for falha in falhas:
            print(f"  {falha}")
        print("\nUm ID tem que significar uma coisa so. Renumere o mais novo.")
        return 1

    print("\nOK: nenhum identificador definido em dois lugares.")

    incoerentes = coerencia_das_specs()

    if incoerentes:
        print(f"\n{len(incoerentes)} documento(s) com contagem incoerente:")
        for problema in incoerentes:
            print(f"  {problema}")
        print("\nA tabela e a fonte. Cabecalho e abertura acompanham ela.")
        return 1

    print(f"OK: os {len(list(documentos_contaveis()))} documentos contam suas decisoes de forma coerente.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
