#!/usr/bin/env python3
"""Prova que verificar-fronteiras.py nao destroi codigo de verdade.

Regressao de 2026-07-31. A versao anterior do verificador tinha dois caminhos
destrutivos, ambos inofensivos enquanto src/engine nao existia:

  1. `shutil.rmtree` em src/engine, src/ia e src/estado ao terminar, sem
     distinguir o que o script criou do que ja estava la
  2. a tabela ALVOS sobrescrevia engine/index.ts e engine/dominio/carta.ts -
     nomes reais - com stubs de uma linha

No primeiro dia em que a engine passou a existir, rodar `npm run verificar`
apagou cinco arquivos nao commitados. O comando que protege o repositorio nao
pode ser o que o destroi.

Este teste cria sentinelas dentro das tres pastas perigosas, roda o verificador
e exige que continuem la byte a byte. Tambem tira impressao digital dos arquivos
reais cujos nomes colidem com a tabela ALVOS.

Uso: python3 scripts/verificar-fronteiras-preserva.py
"""

import hashlib
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SRC = RAIZ / "src"
VERIFICADOR = RAIZ / "scripts" / "verificar-fronteiras.py"

# Sentinelas em caminhos que o verificador nunca usa, dentro das pastas que a
# versao antiga apagava inteiras.
SENTINELAS = {
    "engine/_sentinela/nao-apague.ts": "export const sentinela = 'engine'\n",
    "estado/_sentinela/nao-apague.ts": "export const sentinela = 'estado'\n",
    "ia/_sentinela/nao-apague.ts": "export const sentinela = 'ia'\n",
}

# Arquivos reais cujos nomes aparecem na tabela ALVOS do verificador. Se
# existirem, o conteudo tem de sobreviver intacto.
COLIDEM_COM_ALVOS = [
    "engine/index.ts",
    "engine/dominio/carta.ts",
    "engine/testing/construtor.ts",
    "estado/loja.ts",
    "ia/decisor.ts",
    "ui/tela.ts",
]


def digital(caminho):
    return hashlib.sha256(caminho.read_bytes()).hexdigest()


def criar_sentinelas():
    criados, pastas = [], []
    for relativo, conteudo in SENTINELAS.items():
        destino = SRC / relativo
        if destino.exists():
            print(f"ERRO: {destino} ja existe; escolha outro caminho.", file=sys.stderr)
            raise SystemExit(2)
        # Todas as pastas ausentes, nao so a imediata: src/estado e src/ia podem
        # nao existir ainda, e deixa-las para tras seria a mesma falta de higiene
        # que este script existe para cobrar do outro.
        pasta = destino.parent
        while not pasta.exists():
            pastas.append(pasta)
            pasta = pasta.parent
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(conteudo, encoding="utf-8")
        criados.append(destino)
    return criados, pastas


def remover_sentinelas(criados, pastas):
    for caminho in criados:
        caminho.unlink(missing_ok=True)
    for pasta in sorted(set(pastas), key=lambda p: len(p.parts), reverse=True):
        if pasta.is_dir() and not any(pasta.iterdir()):
            pasta.rmdir()


def main():
    antes = {
        relativo: digital(SRC / relativo)
        for relativo in COLIDEM_COM_ALVOS
        if (SRC / relativo).is_file()
    }
    criados, pastas = criar_sentinelas()
    falhas = []

    try:
        subprocess.run(
            [sys.executable, str(VERIFICADOR)],
            cwd=RAIZ,
            capture_output=True,
            text=True,
            check=False,
        )

        print("sentinelas que precisam sobreviver:\n")
        for relativo, conteudo in SENTINELAS.items():
            destino = SRC / relativo
            if not destino.is_file():
                print(f"  FALHA  {relativo} — APAGADO")
                falhas.append(f"{relativo} foi apagado pelo verificador")
            elif destino.read_text(encoding="utf-8") != conteudo:
                print(f"  FALHA  {relativo} — conteudo alterado")
                falhas.append(f"{relativo} teve o conteudo alterado")
            else:
                print(f"  OK     {relativo}")

        print("\narquivos reais que colidem com a tabela ALVOS:\n")
        if not antes:
            print("  (nenhum existe ainda — nada a conferir)")
        for relativo, impressao in antes.items():
            destino = SRC / relativo
            if not destino.is_file():
                print(f"  FALHA  {relativo} — APAGADO")
                falhas.append(f"{relativo} foi apagado pelo verificador")
            elif digital(destino) != impressao:
                print(f"  FALHA  {relativo} — SOBRESCRITO")
                falhas.append(f"{relativo} foi sobrescrito pelo verificador")
            else:
                print(f"  OK     {relativo}")
    finally:
        remover_sentinelas(criados, pastas)

    if falhas:
        print(f"\n{len(falhas)} problema(s):")
        for falha in falhas:
            print(f"  {falha}")
        return 1

    print(f"\nOK: {len(SENTINELAS)} sentinelas e {len(antes)} arquivo(s) real(is) preservados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
