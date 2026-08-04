import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Dois projetos porque as camadas têm necessidades opostas.
    // O núcleo é puro (architecture.md RNF1.1) e roda em Node, sem DOM: rápido.
    // A interface precisa de DOM e paga o custo dele.
    projects: [
      {
        extends: true,
        test: {
          name: 'nucleo',
          environment: 'node',
          include: ['src/engine/**/*.test.ts', 'src/ia/**/*.test.ts', 'tests/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'interface',
          environment: 'jsdom',
          // O `<dialog>` do jsdom não tem `showModal` (S154). O remendo mora na
          // infraestrutura de teste, e não num `if` dentro do código de produção.
          setupFiles: ['./src/testes/jsdom-dialog.ts'],
          include: ['src/ui/**/*.test.{ts,tsx}', 'src/estado/**/*.test.{ts,tsx}'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.test.{ts,tsx}', 'src/engine/testing/**', 'src/testes/**'],
      // testing-strategy.md E4: piso de linhas na engine.
      // A metrica que bloqueia o CI e cobertura por regra (E3), nao esta.
      thresholds: {
        'src/engine/**': {
          lines: 90,
        },
      },
    },
  },
})
