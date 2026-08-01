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
    return 0


if __name__ == "__main__":
    sys.exit(main())
