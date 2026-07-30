#!/usr/bin/env python3
"""Confere a rastreabilidade entre os documentos de especificacao.

Verifica tres relacoes, conforme docs/user-stories.md U7 e
docs/acceptance-tests.md C7:

  1. regra -> historia   toda regra de rules.md citada por alguma historia
  2. historia -> regra   nenhuma historia citando regra inexistente
  3. criterio -> regra   nenhum criterio CA-Rn-k citando regra inexistente

Nao exige que toda regra tenha criterio em acceptance-tests.md: por decisao C2,
aquele documento cobre so os casos dificeis, e os criterios exaustivos vivem nas
specs de cada historia.

Uso: python3 scripts/verificar-cobertura.py
"""

import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DOCS = RAIZ / "docs"
REGRAS = DOCS / "rules.md"
HISTORIAS = DOCS / "user-stories.md"
CRITERIOS = DOCS / "acceptance-tests.md"

PADRAO_REGRA = re.compile(r"^- \*\*(R[\d.]+)\*\*", re.M)
PADRAO_CITACAO = re.compile(r"\bR\d+(?:\.\d+)+")
PADRAO_INTERVALO = re.compile(r"(R\d+\.\d+(?:\.\d+)?)[–-](R\d+\.\d+(?:\.\d+)?)")
PADRAO_CRITERIO = re.compile(r"\bCA-(R\d+(?:\.\d+)+)-\d+")


def ordem(regra):
    return [int(parte) for parte in regra[1:].split(".")]


def expandir_intervalos(texto):
    """R2.1-R2.5 vira R2.1, R2.2, R2.3, R2.4, R2.5."""
    expandidas = set()
    for inicio, fim in PADRAO_INTERVALO.findall(texto):
        partes_inicio = inicio[1:].split(".")
        partes_fim = fim[1:].split(".")
        if partes_inicio[:-1] != partes_fim[:-1]:
            continue
        base = ".".join(partes_inicio[:-1])
        for n in range(int(partes_inicio[-1]), int(partes_fim[-1]) + 1):
            expandidas.add(f"R{base}.{n}")
    return expandidas


def main():
    regras = sorted(set(PADRAO_REGRA.findall(REGRAS.read_text())), key=ordem)
    conjunto_regras = set(regras)

    texto_historias = HISTORIAS.read_text()
    citadas = set(PADRAO_CITACAO.findall(texto_historias))
    citadas |= expandir_intervalos(texto_historias)

    texto_criterios = CRITERIOS.read_text()
    regras_com_criterio = set(PADRAO_CRITERIO.findall(texto_criterios))

    orfas = [r for r in regras if r not in citadas]
    citadas_inexistentes = sorted(citadas - conjunto_regras, key=ordem)
    criterios_inexistentes = sorted(regras_com_criterio - conjunto_regras, key=ordem)

    print(f"regras em rules.md:                 {len(regras)}")
    print(f"cobertas por alguma historia:       {len(regras) - len(orfas)}")
    print(f"com criterio em acceptance-tests:   {len(regras_com_criterio)}")

    falhas = 0

    if orfas:
        falhas += 1
        print(f"\nFALHA - regras orfas ({len(orfas)}):")
        for regra in orfas:
            print(f"  {regra} - nenhuma historia cita")

    if citadas_inexistentes:
        falhas += 1
        print(f"\nFALHA - historias citam regra inexistente ({len(citadas_inexistentes)}):")
        for citacao in citadas_inexistentes:
            print(f"  {citacao}")

    if criterios_inexistentes:
        falhas += 1
        print(f"\nFALHA - criterios citam regra inexistente ({len(criterios_inexistentes)}):")
        for citacao in criterios_inexistentes:
            print(f"  {citacao}")

    if falhas:
        return 1

    print("\nOK: as tres relacoes de rastreabilidade estao consistentes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
