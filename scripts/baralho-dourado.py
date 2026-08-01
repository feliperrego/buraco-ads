#!/usr/bin/env python3
"""
Deriva o valor dourado do criterio CA-S4-1 (docs/specs/0001-mesa-inicial.md).

Por que existe: a S4 congela o embaralhamento. Se o valor esperado do teste fosse
gravado a partir da propria implementacao em TypeScript, o teste provaria apenas
que ela concorda consigo mesma. Este script e uma transcricao **independente** da
spec, entao o valor que ele produz e um oraculo de verdade: um erro de
transcricao no TypeScript aparece como divergencia.

Nao e codigo de producao e nao roda em `npm run verificar` — o valor so muda se a
S4 mudar, e mudar a S4 e decisao de ADR, nunca refatoracao.

    python3 scripts/baralho-dourado.py
"""

MASCARA_32 = 0xFFFFFFFF
SEMENTE_DOURADA = 20260731

NAIPES = ['COPAS', 'OUROS', 'ESPADAS', 'PAUS']
VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']


def para_u32(x):
    return x & MASCARA_32


def para_i32(x):
    x &= MASCARA_32
    return x - 0x100000000 if x >= 0x80000000 else x


def imul(a, b):
    """Equivalente ao Math.imul do JavaScript, em espaco sem sinal."""
    return para_u32(para_i32(a) * para_i32(b))


def mulberry32(semente):
    """Transcricao literal do gerador fixado na secao 3.2 da spec."""
    estado = semente & MASCARA_32

    def proximo():
        nonlocal estado
        estado = para_u32(estado + 0x6D2B79F5)
        t = imul(estado ^ (estado >> 15), 1 | estado)
        t = para_u32(para_u32(t + imul(t ^ (t >> 7), 61 | t)) ^ t)
        return ((t ^ (t >> 14)) & MASCARA_32) / 4294967296

    return proximo


def baralho_canonico():
    """Ordem canonica ANTES de embaralhar (secao 3.1)."""
    return [
        f'{naipe}-{valor}-{copia}'
        for naipe in NAIPES
        for valor in VALORES
        for copia in (1, 2)
    ]


def embaralhar(cartas, aleatorio):
    """Fisher-Yates descendente (S4). Para i de 103 ate 1."""
    baralho = list(cartas)
    for i in range(len(baralho) - 1, 0, -1):
        j = int(aleatorio() * (i + 1))
        baralho[i], baralho[j] = baralho[j], baralho[i]
    return baralho


def distribuir(semente):
    """Secoes 3.2 a 3.4: embaralha, reparte por faixa de indices, sorteia quem comeca."""
    aleatorio = mulberry32(semente)
    baralho = embaralhar(baralho_canonico(), aleatorio)

    return {
        'maoDoJogador0': baralho[0:11],
        'maoDoJogador1': baralho[11:22],
        'mortoA': baralho[22:33],
        'mortoB': baralho[33:44],
        'monte': baralho[44:104],
        # A chamada adicional acontece DEPOIS da distribuicao (S7).
        'jogadorDaVez': int(aleatorio() * 2),
    }


if __name__ == '__main__':
    mesa = distribuir(SEMENTE_DOURADA)

    print(f'semente: {SEMENTE_DOURADA}')
    print(f"jogadorDaVez: {mesa['jogadorDaVez']}")
    for campo in ('maoDoJogador0', 'maoDoJogador1', 'mortoA', 'mortoB'):
        print(f'{campo} ({len(mesa[campo])}):')
        print('  ' + ', '.join(mesa[campo]))
    print(f"monte ({len(mesa['monte'])}), primeiras 5:")
    print('  ' + ', '.join(mesa['monte'][:5]))
    print('monte, ultimas 5:')
    print('  ' + ', '.join(mesa['monte'][-5:]))

    todas = (
        mesa['maoDoJogador0']
        + mesa['maoDoJogador1']
        + mesa['mortoA']
        + mesa['mortoB']
        + mesa['monte']
    )
    print(f'\nconservacao: {len(todas)} cartas, {len(set(todas))} ids distintos')
