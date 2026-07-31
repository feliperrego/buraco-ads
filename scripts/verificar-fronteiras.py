#!/usr/bin/env python3
"""Verifica que a regra de dependencia do ESLint realmente reprova.

Implementa docs/roadmap.md RD1: uma regra de lint mal configurada nao avisa que
esta mal configurada - ela simplesmente passa. Este script escreve violacoes
propositais, confirma que o ESLint as recusa, e apaga tudo.

Testa os dois sentidos:
  - violacoes  precisam disparar a regra de fronteira esperada
  - permitidos NAO podem disparar nenhuma regra de fronteira

Uso: python3 scripts/verificar-fronteiras.py
"""

import json
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SRC = RAIZ / "src"

REGRAS_DE_FRONTEIRA = {
    "no-restricted-imports",
    "no-restricted-properties",
    "no-restricted-syntax",
}

# Modulos-alvo criados so para os imports resolverem.
ALVOS = {
    "engine/index.ts": "export const versao = 1\n",
    "engine/dominio/carta.ts": "export const carta = 1\n",
    "engine/testing/construtor.ts": "export const construir = 1\n",
    "estado/loja.ts": "export const loja = 1\n",
    "ia/decisor.ts": "export const decidir = 1\n",
    "ui/tela.ts": "export const tela = 1\n",
}

VIOLACOES = [
    ("engine/_fronteira/react.ts", "import 'react'\nexport const x = 1\n",
     "no-restricted-imports", "engine importando React (RNF1.1)"),
    ("engine/_fronteira/estado.ts", "import '../../estado/loja'\nexport const x = 1\n",
     "no-restricted-imports", "engine importando estado/ (A1)"),
    ("engine/_fronteira/ui.ts", "import '../../ui/tela'\nexport const x = 1\n",
     "no-restricted-imports", "engine importando ui/ (A1)"),
    ("engine/_fronteira/aleatorio.ts", "export const x = Math.random()\n",
     "no-restricted-properties", "engine usando Math.random (A5)"),
    ("engine/_fronteira/relogio.ts", "export const x = Date.now()\n",
     "no-restricted-properties", "engine usando Date.now (A5)"),
    ("engine/_fronteira/data.ts", "export const x = new Date()\n",
     "no-restricted-syntax", "engine usando new Date (A5)"),
    ("ia/_fronteira/estado.ts", "import '../../estado/loja'\nexport const x = 1\n",
     "no-restricted-imports", "ia importando estado/ (A3)"),
    ("ia/_fronteira/ui.ts", "import '../../ui/tela'\nexport const x = 1\n",
     "no-restricted-imports", "ia importando ui/ (A3)"),
    ("ia/_fronteira/profundo.ts", "import '../../engine/dominio/carta'\nexport const x = 1\n",
     "no-restricted-imports", "ia importando interior da engine (A8)"),
    ("estado/_fronteira/ui.ts", "import '../../ui/tela'\nexport const x = 1\n",
     "no-restricted-imports", "estado importando ui/ (A1)"),
    ("estado/_fronteira/testing.ts", "import '../../engine/testing/construtor'\nexport const x = 1\n",
     "no-restricted-imports", "estado importando engine/testing/ (C6)"),
    ("ui/_fronteira/ia.ts", "import '../../ia/decisor'\nexport const x = 1\n",
     "no-restricted-imports", "ui importando ia/ (A1)"),
    ("ui/_fronteira/profundo.ts", "import '../../engine/dominio/carta'\nexport const x = 1\n",
     "no-restricted-imports", "ui importando interior da engine (A8)"),
    ("ui/_fronteira/testing.ts", "import '../../engine/testing/construtor'\nexport const x = 1\n",
     "no-restricted-imports", "ui importando engine/testing/ (C6)"),
]

PERMITIDOS = [
    ("estado/_fronteira/ok-engine.ts", "import '../../engine/index'\nexport const x = 1\n",
     "estado importando a API publica da engine"),
    ("estado/_fronteira/ok-ia.ts", "import '../../ia/decisor'\nexport const x = 1\n",
     "estado importando ia/"),
    ("ui/_fronteira/ok-estado.ts", "import '../../estado/loja'\nexport const x = 1\n",
     "ui importando estado/"),
    ("engine/_fronteira/ok-interno.ts", "import '../dominio/carta'\nexport const x = 1\n",
     "engine importando o proprio interior"),
]


def escrever(caminho_relativo, conteudo):
    destino = SRC / caminho_relativo
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(conteudo, encoding="utf-8")
    return destino


def rodar_eslint(arquivos):
    resultado = subprocess.run(
        ["npx", "eslint", "--format", "json", "--no-warn-ignored", *[str(a) for a in arquivos]],
        cwd=RAIZ,
        capture_output=True,
        text=True,
    )
    saida = resultado.stdout.strip()
    if not saida:
        print("ERRO: eslint nao produziu saida JSON.", file=sys.stderr)
        print(resultado.stderr, file=sys.stderr)
        raise SystemExit(2)
    por_arquivo = {}
    for entrada in json.loads(saida):
        regras = {m.get("ruleId") for m in entrada.get("messages", [])}
        por_arquivo[Path(entrada["filePath"]).resolve()] = regras
    return por_arquivo


def limpar(criados):
    for caminho in criados:
        caminho.unlink(missing_ok=True)
    for camada in ("engine", "ia", "estado", "ui"):
        pasta = SRC / camada / "_fronteira"
        if pasta.is_dir() and not any(pasta.iterdir()):
            pasta.rmdir()
    for alvo in ALVOS:
        (SRC / alvo).unlink(missing_ok=True)
    for camada in ("engine", "ia", "estado"):
        base = SRC / camada
        if base.is_dir():
            shutil.rmtree(base, ignore_errors=True)
    for restante in ("ui/tela.ts",):
        (SRC / restante).unlink(missing_ok=True)


def main():
    criados = []
    falhas = []
    try:
        for relativo, conteudo in ALVOS.items():
            criados.append(escrever(relativo, conteudo))
        for relativo, conteudo, _, _ in VIOLACOES:
            criados.append(escrever(relativo, conteudo))
        for relativo, conteudo, _ in PERMITIDOS:
            criados.append(escrever(relativo, conteudo))

        alvos_eslint = [SRC / r for r, _, _, _ in VIOLACOES]
        alvos_eslint += [SRC / r for r, _, _ in PERMITIDOS]
        por_arquivo = rodar_eslint(alvos_eslint)

        print("violacoes que precisam ser recusadas:\n")
        for relativo, _, regra_esperada, descricao in VIOLACOES:
            regras = por_arquivo.get((SRC / relativo).resolve(), set())
            ok = regra_esperada in regras
            print(f"  {'OK  ' if ok else 'FALHA'}  {descricao}")
            if not ok:
                falhas.append(f"{descricao}: esperava {regra_esperada}, veio {sorted(regras)}")

        print("\nimports permitidos que nao podem disparar fronteira:\n")
        for relativo, _, descricao in PERMITIDOS:
            regras = por_arquivo.get((SRC / relativo).resolve(), set())
            disparadas = regras & REGRAS_DE_FRONTEIRA
            ok = not disparadas
            print(f"  {'OK  ' if ok else 'FALHA'}  {descricao}")
            if not ok:
                falhas.append(f"{descricao}: disparou {sorted(disparadas)} sem motivo")
    finally:
        limpar(criados)

    if falhas:
        print(f"\n{len(falhas)} problema(s):")
        for falha in falhas:
            print(f"  {falha}")
        return 1

    print(f"\nOK: {len(VIOLACOES)} violacoes recusadas, {len(PERMITIDOS)} permitidos aceitos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
