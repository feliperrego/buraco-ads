import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

/**
 * Regra de dependência de docs/architecture.md A1.
 * As setas só apontam para dentro: engine não conhece ninguém.
 *
 * Ao criar uma pasta nova dentro de engine/, acrescente-a a INTERNOS_DA_ENGINE.
 */
const INTERNOS_DA_ENGINE = [
  '**/engine/dominio/**',
  '**/engine/regras/**',
  '**/engine/comandos/**',
  '**/engine/consultas/**',
  '**/engine/aleatorio/**',
  '**/engine/testing/**',
]

const ENGINE_TESTING = ['**/engine/testing/**']

const semUi = { group: ['**/ui/**'], message: 'A1: nenhuma camada de dentro pode importar de ui/.' }
const semIa = { group: ['**/ia/**'], message: 'A1: só estado/ pode importar de ia/.' }
const semEstado = {
  group: ['**/estado/**'],
  message: 'A1: estado/ é externo — camadas de dentro não o conhecem.',
}
const semTesting = {
  group: ENGINE_TESTING,
  message: 'C6: engine/testing/ é só para testes, nunca para código de produção.',
}
const semInternosDaEngine = {
  group: INTERNOS_DA_ENGINE,
  message: 'A8: importe da API pública em engine/index.ts, não de subpastas internas.',
}

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'node_modules'],
  },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },

  // engine/ — o centro. Não importa nada e não é fonte de aleatoriedade.
  {
    files: ['src/engine/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'react-dom/**', '@tanstack/**'],
              message: 'RNF1.1: a engine não importa React, DOM nem bibliotecas de interface.',
            },
            semIa,
            semEstado,
            semUi,
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'A5: a engine não é fonte de aleatoriedade — receba um Aleatorio injetado.',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'A5: a engine é determinística — nada de relógio.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'NewExpression[callee.name="Date"]',
          message: 'A5: a engine é determinística — nada de relógio.',
        },
      ],
    },
  },

  // ia/ — só conhece a API pública da engine.
  {
    files: ['src/ia/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'react-dom/**'],
              message: 'A3: a IA é uma função de decisão, fora do ciclo de renderização.',
            },
            semEstado,
            semUi,
            semTesting,
            semInternosDaEngine,
          ],
        },
      ],
    },
  },

  // estado/ — conhece engine e ia, nunca a interface.
  {
    files: ['src/estado/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [semUi, semTesting, semInternosDaEngine] }],
    },
  },

  // ui/ — fala com estado e lê tipos da engine.
  {
    files: ['src/ui/**/*.{ts,tsx}', 'src/main.tsx'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [semIa, semTesting, semInternosDaEngine] }],
    },
  },

  prettier,
)
