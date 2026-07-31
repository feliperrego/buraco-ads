#!/usr/bin/env python3
"""Verifica rastreabilidade entre documentos de especificacao.

Le a configuracao de rastreio.json na raiz do projeto e confere, para cada fonte
de itens numerados (regras, requisitos, endpoints - o que for):

  1. cobertura   todo item citado por pelo menos um consumidor marcado como obrigatorio
  2. existencia  nenhum consumidor citando item que nao existe na fonte

Retorna 1 se qualquer verificacao falhar, para uso direto em CI.

Uso:
    python3 scripts/verificar-rastreabilidade.py [caminho/para/rastreio.json]

Formato de rastreio.json:

{
  "fontes": [
    {
      "nome": "regras",
      "arquivo": "docs/rules.md",
      "padrao_definicao": "^- \\\\*\\\\*(R[\\\\d.]+)\\\\*\\\\*",
      "padrao_citacao": "\\\\bR\\\\d+(?:\\\\.\\\\d+)+",
      "expandir_intervalos": true,
      "consumidores": [
        { "arquivo": "docs/user-stories.md", "cobertura_obrigatoria": true },
        { "arquivo": "docs/acceptance-tests.md", "cobertura_obrigatoria": false,
          "padrao_citacao": "\\\\bCA-(R\\\\d+(?:\\\\.\\\\d+)+)-\\\\d+" }
      ]
    }
  ]
}

Notas:
  - padrao_definicao precisa ter exatamente um grupo de captura: o identificador.
  - padrao_citacao no consumidor sobrescreve o da fonte. Se tiver grupo de captura,
    o grupo e usado; senao, a correspondencia inteira.
  - expandir_intervalos trata "R2.1-R2.5" como as cinco regras da faixa.
"""

import json
import re
import sys
from pathlib import Path

PADRAO_INTERVALO = re.compile(r"([A-Z]+\d+(?:\.\d+)+)\s*[–—-]\s*([A-Z]+\d+(?:\.\d+)+)")


def chave_ordem(identificador):
    numeros = re.findall(r"\d+", identificador)
    return [int(n) for n in numeros] or [0]


def expandir_intervalos(texto):
    """R2.1-R2.5 vira R2.1, R2.2, R2.3, R2.4, R2.5. So expande dentro do mesmo prefixo."""
    expandidos = set()
    for inicio, fim in PADRAO_INTERVALO.findall(texto):
        prefixo = re.match(r"[A-Z]+", inicio).group()
        partes_inicio = inicio[len(prefixo):].split(".")
        partes_fim = fim[len(prefixo):].split(".")
        if partes_inicio[:-1] != partes_fim[:-1]:
            continue
        try:
            primeiro, ultimo = int(partes_inicio[-1]), int(partes_fim[-1])
        except ValueError:
            continue
        base = ".".join(partes_inicio[:-1])
        for n in range(primeiro, ultimo + 1):
            sufixo = f"{base}.{n}" if base else str(n)
            expandidos.add(f"{prefixo}{sufixo}")
    return expandidos


def ler(raiz, caminho_relativo):
    caminho = raiz / caminho_relativo
    if not caminho.is_file():
        raise SystemExit(f"ERRO: arquivo nao encontrado: {caminho_relativo}")
    return caminho.read_text(encoding="utf-8")


def extrair_citacoes(texto, padrao, expandir):
    compilado = re.compile(padrao)
    citados = set()
    for correspondencia in compilado.finditer(texto):
        citados.add(correspondencia.group(1) if compilado.groups else correspondencia.group(0))
    if expandir:
        citados |= expandir_intervalos(texto)
    return citados


def verificar_fonte(raiz, fonte):
    nome = fonte.get("nome", fonte["arquivo"])
    texto_fonte = ler(raiz, fonte["arquivo"])
    definidos = sorted(
        set(re.findall(fonte["padrao_definicao"], texto_fonte, re.M)), key=chave_ordem
    )
    conjunto = set(definidos)

    if not definidos:
        raise SystemExit(
            f"ERRO: nenhum item casou com padrao_definicao em {fonte['arquivo']}.\n"
            f"       Verifique o padrao: {fonte['padrao_definicao']}"
        )

    padrao_citacao_padrao = fonte.get("padrao_citacao")
    expandir_padrao = fonte.get("expandir_intervalos", False)

    cobertos = set()
    problemas = []

    for consumidor in fonte.get("consumidores", []):
        texto = ler(raiz, consumidor["arquivo"])
        padrao = consumidor.get("padrao_citacao", padrao_citacao_padrao)
        if not padrao:
            raise SystemExit(
                f"ERRO: sem padrao_citacao para {consumidor['arquivo']} nem para a fonte {nome}."
            )
        expandir = consumidor.get("expandir_intervalos", expandir_padrao)
        citados = extrair_citacoes(texto, padrao, expandir)

        inexistentes = sorted(citados - conjunto, key=chave_ordem)
        if inexistentes:
            problemas.append(
                (f"{consumidor['arquivo']} cita item inexistente em {nome}", inexistentes)
            )

        validos = citados & conjunto
        if consumidor.get("cobertura_obrigatoria", False):
            cobertos |= validos

        print(f"  {consumidor['arquivo']:<44} cita {len(validos):>4} de {len(definidos)}")

    obrigatorios = [c for c in fonte.get("consumidores", []) if c.get("cobertura_obrigatoria")]
    if obrigatorios:
        orfaos = [i for i in definidos if i not in cobertos]
        if orfaos:
            problemas.append((f"itens de {nome} que nenhum consumidor obrigatorio cita", orfaos))

    return len(definidos), problemas


def main():
    caminho_config = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("rastreio.json")
    if not caminho_config.is_file():
        raise SystemExit(
            f"ERRO: {caminho_config} nao encontrado.\n"
            "       Crie-o na raiz do projeto ou passe o caminho como argumento."
        )

    raiz = caminho_config.resolve().parent
    config = json.loads(caminho_config.read_text(encoding="utf-8"))

    total_problemas = []
    for fonte in config["fontes"]:
        nome = fonte.get("nome", fonte["arquivo"])
        print(f"\n{nome} — {fonte['arquivo']}")
        quantidade, problemas = verificar_fonte(raiz, fonte)
        print(f"  {'itens definidos':<44} {quantidade:>4}")
        total_problemas.extend(problemas)

    if total_problemas:
        print()
        for titulo, itens in total_problemas:
            print(f"FALHA — {titulo} ({len(itens)}):")
            for item in itens:
                print(f"  {item}")
        return 1

    print("\nOK: rastreabilidade consistente em todas as fontes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
