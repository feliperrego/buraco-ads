import { expect, test } from '@playwright/test'

/**
 * CA-S175-1 e CA-S175-2 — a spec 0019 §6.
 *
 * O que dá para medir de "acabamento visual coerente", e **só** isso: contraste
 * e foco visível. Se está bonito é julgamento do Felipe, e a S175 diz isso em
 * vez de escrever um critério que pareça medir estética.
 */

/** Luminância relativa da WCAG, a partir de um `rgb(...)` computado. */
function contrasteEntre(frente: string, fundo: string): number {
  const canais = (cor: string) =>
    (cor.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map((valor) => Number(valor) / 255)

  const luminancia = (cor: string) => {
    const [r = 0, g = 0, b = 0] = canais(cor).map((canal) =>
      canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4,
    )

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const [claro, escuro] = [luminancia(frente), luminancia(fundo)].sort((a, b) => b - a)

  return ((claro ?? 0) + 0.05) / ((escuro ?? 0) + 0.05)
}

test('CA-S175-1 — todo texto tem contraste de ao menos 4.5:1', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /iniciar partida/i }).click()
  await page.getByRole('button', { name: /comprar do monte/i }).click()
  await expect(page.getByRole('region', { name: /minha mão/i })).toBeVisible()

  /*
   * A carta **selecionada** entra na medição, e não por completude: a primeira
   * versão do CSS a deixou branca no branco, e este teste — rodando antes de
   * qualquer seleção — passou. Quem viu foi rodar o app. Estado que muda cor
   * precisa ser visitado, ou o teste mede o estado fácil.
   */
  const primeira = page
    .getByRole('region', { name: /minha mão/i })
    .locator('li button')
    .first()

  if (await primeira.count()) await primeira.click()

  const medidos = await page.evaluate(() => {
    const fundoDe = (elemento: Element): string => {
      for (let atual: Element | null = elemento; atual; atual = atual.parentElement) {
        const cor = getComputedStyle(atual).backgroundColor

        if (cor && !cor.startsWith('rgba(0, 0, 0, 0)')) return cor
      }

      return 'rgb(255, 255, 255)'
    }

    return [...document.querySelectorAll('p, li, h1, h2, button, a, span')]
      .filter((elemento) => elemento.textContent.trim().length > 0)
      .map((elemento) => ({
        texto: elemento.textContent.trim().slice(0, 40),
        frente: getComputedStyle(elemento).color,
        fundo: fundoDe(elemento),
      }))
  })

  // Âncora: há o que medir, e bastante.
  expect(medidos.length).toBeGreaterThan(20)

  for (const medido of medidos) {
    expect(
      contrasteEntre(medido.frente, medido.fundo),
      `"${medido.texto}" — ${medido.frente} sobre ${medido.fundo}`,
    ).toBeGreaterThanOrEqual(4.5)
  }
})

test('CA-S175-2 — todo elemento interativo tem foco visível', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /iniciar partida/i }).click()
  await expect(page.getByRole('region', { name: /minha mão/i })).toBeVisible()

  /*
   * O foco é conferido **pelo teclado**, e isso não é preciosismo do roteiro: o
   * `:focus-visible` é uma decisão do navegador, e um `.focus()` programático
   * depois de um clique de mouse **não** o acende. A primeira versão deste teste
   * usava `.focus()` e reprovou lendo `outline: none` — a regra do CSS estava
   * certa, e a medição é que não representava um usuário de teclado.
   */
  const medidos: { rotulo: string; largura: number; estilo: string }[] = []

  for (let passo = 0; passo < 15; passo += 1) {
    await page.keyboard.press('Tab')

    const medido = await page.evaluate(() => {
      const ativo = document.activeElement

      if (!(ativo instanceof HTMLElement) || ativo === document.body) return null

      const estilo = getComputedStyle(ativo)

      return {
        rotulo: ativo.textContent.trim().slice(0, 30),
        largura: Number.parseFloat(estilo.outlineWidth),
        estilo: estilo.outlineStyle,
      }
    })

    if (medido !== null) medidos.push(medido)
  }

  // Âncora: o `Tab` precisa ter passado por elementos de verdade.
  expect(medidos.length).toBeGreaterThan(2)

  for (const medido of medidos) {
    // Sem isto, `outline: none` num reset de CSS passaria despercebido — e é o
    // jeito mais comum de quebrar a RNF3.4 sem quebrar nenhum teste.
    expect(medido.estilo, `contorno de "${medido.rotulo}"`).not.toBe('none')
    expect(medido.largura, `largura do contorno de "${medido.rotulo}"`).toBeGreaterThan(0)
  }
})
