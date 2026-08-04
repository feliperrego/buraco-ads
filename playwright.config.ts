import { defineConfig, devices } from '@playwright/test'

/**
 * S170 — o Playwright entra com **um** teste, e não com a suíte.
 *
 * O ADR-0006 o adiou para "o Marco VI, quando existir partida completa". Ela
 * existe desde a H14, e desde então toda fatia foi verificada por roteiros
 * descartáveis — que acharam defeito em seis das nove últimas. O que entra aqui
 * é o que se sabe: uma partida de ponta a ponta, por teclado, em viewport de
 * celular.
 *
 * O que **não** entra é a suíte de interface: os 381 testes de jsdom são mais
 * rápidos, e a `screens.md` RNF2.2 fixou que o critério é comportamento, não
 * aparência. E nem substitui rodar o app à mão — o defeito da H17 ("Voltar ao
 * início" levando ao jogo) foi achado por quem não estava procurando por ele.
 *
 * Fora do `npm run verificar`, como o arnês da S151: exige servidor e navegador.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    // S169 — a viewport da RNF3.1, e ela é o objeto do teste, não o cenário.
    ...devices['Pixel 5'],
    // Em máquinas que já têm o Chromium instalado fora do cache do Playwright,
    // apontar para ele evita baixar um segundo. Vazio, o Playwright resolve
    // sozinho — é o caminho normal, e o CI usa esse.
    launchOptions: process.env.CHROMIUM_EXECUTAVEL
      ? { executablePath: process.env.CHROMIUM_EXECUTAVEL }
      : {},
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
