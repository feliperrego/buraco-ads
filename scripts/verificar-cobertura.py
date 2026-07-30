#!/usr/bin/env python3
"""Confere a rastreabilidade entre docs/rules.md e docs/user-stories.md.

Falha se alguma regra nao estiver citada por nenhuma historia, ou se alguma
historia citar regra inexistente. Implementa docs/user-stories.md U7.

Uso: python3 scripts/verificar-cobertura.py
"""

import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
REGRAS = RAIZ / "docs" / "rules.md"
HISTORIAS = RAIZ / "docs" / "user-stories.md"

PADRAO_REGRA = re.compile(r"^- \*\*(R[\d.]+)\*\*", re.M)
PADRAO_CITACAO = re.compile(r"R\d+(?:\.\d+)+")
PADRAO_INTERVALO = re.compile(r"(R\d+\.\d+(?:\.\d+)?)[–-](R\d+\.\d+(?:\.\d+)?)")


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
    texto = HISTORIAS.read_text()
    citadas = set(PADRAO_CITACAO.findall(texto)) | expandir_intervalos(texto)

    orfas = [r for r in regras if r not in citadas]
    inexistentes = sorted((c for c in citadas if c not in regras), key=ordem)

    print(f"regras em rules.md:            {len(regras)}")
    print(f"cobertas por alguma historia:  {len(regras) - len(orfas)}")

    if orfas:
        print(f"\nREGRAS ORFAS ({len(orfas)}):")
        for regra in orfas:
            print(f"  {regra} - nenhuma historia cita")

    if inexistentes:
        print(f"\nCITADAS MAS INEXISTENTES ({len(inexistentes)}):")
        for citacao in inexistentes:
            print(f"  {citacao} - nao existe em rules.md")

    if orfas or inexistentes:
        return 1

    print("\nOK: rastreabilidade completa nos dois sentidos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
