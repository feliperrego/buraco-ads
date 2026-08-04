import { expect, test } from '@playwright/test'

/**
 * CA-S166-1, CA-S169-1 e CA-S170-1 — a spec 0018 §6.
 *
 * Uma partida jogada **só com teclado**, em viewport de celular. É o único teste
 * de Playwright do projeto, e é de propósito (S170).
 *
 * **A CA-S170-1 pedia a partida completa, até a tela de fim, e a medição a
 * corrigiu.** A RF5.3 põe 700 ms entre os comandos da IA (S35), e desde a H15 a
 * heurística joga várias jogadas por turno — o turno dela mede 1,4 s na mediana.
 * Uma partida tem ~500 ações do humano: **cerca de dezessete minutos de
 * relógio**. Isso não é teste, é espera.
 *
 * O que ficou é o que o teste consegue provar de verdade: o teclado alcança tudo
 * ao longo de vários turnos, o atalho de zona funciona, e em 360 × 640 nada que
 * responde fica fora da tela. A partida completa continua sendo verificação
 * **exploratória**, rodada à mão — e foi ela que achou defeito em seis das nove
 * últimas fatias, justamente por não estar procurando nada.
 */

/** Turnos do humano. Vinte cobrem compra, ação e a virada de vez muitas vezes. */
const TURNOS = 20

/**
 * Aciona por teclado o primeiro elemento cujo rótulo case: conta os `Tab`
 * necessários **de uma vez** e depois os pressiona.
 *
 * A primeira versão media o foco a cada `Tab`, e uma partida inteira estourou o
 * limite de dois minutos: são ~500 ações, cada uma com dezenas de idas e voltas
 * ao navegador. A conta é a mesma; o que mudou foi pagar uma consulta por ação
 * em vez de uma por tecla.
 */
async function acionarPorTeclado(
  pagina: import('@playwright/test').Page,
  alvo: RegExp,
): Promise<boolean> {
  const saltos = await pagina.evaluate(
    ({ fonte, marcas }) => {
      const padrao = new RegExp(fonte, marcas)
      const focaveis = [
        ...document.querySelectorAll<HTMLElement>('a[href], button, [tabindex="0"]'),
      ].filter((elemento) => elemento.offsetParent !== null)

      const daVez = focaveis.findIndex((elemento) => padrao.test(elemento.textContent.trim()))

      if (daVez === -1) {
        return null
      }

      const ativo = document.activeElement
      const atual = ativo instanceof HTMLElement ? focaveis.indexOf(ativo) : -1

      return daVez - atual
    },
    { fonte: alvo.source, marcas: alvo.flags },
  )

  if (saltos === null) {
    return false
  }

  for (let passo = 0; passo < saltos; passo += 1) {
    await pagina.keyboard.press('Tab')
  }

  // A conferência antes do `Enter`: sem ela, um salto errado acionaria o botão
  // errado em silêncio — e num turno de Buraco isso é jogada, não erro de teste.
  const chegou = await pagina.evaluate(
    ({ fonte, marcas }) =>
      new RegExp(fonte, marcas).test((document.activeElement?.textContent ?? '').trim()),
    { fonte: alvo.source, marcas: alvo.flags },
  )

  if (!chegou) {
    return false
  }

  await pagina.keyboard.press('Enter')

  return true
}

test('CA-S170-1 — vinte turnos por teclado, em tela de celular', async ({ page }) => {
  const erros: string[] = []

  page.on('pageerror', (erro) => erros.push(erro.message))
  page.on('console', (mensagem) => {
    if (mensagem.type() === 'error') erros.push(mensagem.text())
  })

  await page.goto('/')

  // CA-S166-1 — nada de clique daqui para baixo.
  expect(await acionarPorTeclado(page, /iniciar partida/i)).toBe(true)
  await expect(page.getByRole('region', { name: /minha mão/i })).toBeVisible()

  // S166 — o atalho de zona leva o foco para dentro da região da mão.
  await page.keyboard.press('1')
  expect(
    await page.evaluate(() => document.activeElement?.closest('[aria-label="Minha mão"]') !== null),
  ).toBe(true)

  let compras = 0
  let descartes = 0

  for (let volta = 0; volta < TURNOS; volta += 1) {
    if (page.url().includes('/fim')) break

    await page
      .waitForFunction(
        () => document.body.textContent.includes('Sua vez') || location.pathname === '/fim',
        null,
        { timeout: 60_000 },
      )
      .catch(() => {})

    if (page.url().includes('/fim')) break

    if (await acionarPorTeclado(page, /^comprar do monte/i)) {
      compras += 1
      continue
    }

    if (await acionarPorTeclado(page, /^(próxima rodada|ver o resultado)$/i)) {
      continue
    }

    // Fase de ação: seleciona a primeira carta e confirma o descarte, que a
    // S167 põe por último entre os botões da mão.
    if (!(await acionarPorTeclado(page, /de (copas|ouros|espadas|paus)$/i))) break
    if (!(await acionarPorTeclado(page, /^descartar$/i))) break

    descartes += 1
  }

  // CA-S169-1 — e aqui a redação do critério também precisou de conserto.
  //
  // "Dentro da área visível" não pode significar **sem rolar**: a mesa tem vinte
  // cartas e não cabe em 640 px de altura, nem deveria. Exigir isso reprovaria
  // qualquer página longa, e não é o defeito que a fatia teme.
  //
  // O defeito é o **transbordo horizontal** — conteúdo mais largo que a tela,
  // que empurra botões para fora do alcance do polegar e não volta com rolagem
  // vertical. Esse é medível e é o que a S169 quer dizer.
  const transbordo = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )

  expect(transbordo, 'transbordo horizontal em 360 px').toBeLessThanOrEqual(1)

  for (const botao of await page.getByRole('button').all()) {
    await botao.scrollIntoViewIfNeeded()
    await expect(botao).toBeVisible()

    const caixa = await botao.boundingBox()

    expect(caixa, 'botão sem caixa').not.toBeNull()
    expect(caixa?.x ?? -1).toBeGreaterThanOrEqual(0)
  }

  // A âncora: o roteiro precisa ter **jogado**, e nas duas fases. Sem isto, um
  // laço que saísse na primeira volta passaria em tudo acima.
  expect(compras, 'compras por teclado').toBeGreaterThan(5)
  expect(descartes, 'descartes por teclado').toBeGreaterThan(5)
  expect(erros).toEqual([])
})
