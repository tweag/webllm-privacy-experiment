import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

export default [
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/']
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.jest,
        RequestInit: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'react/prop-types': 'off'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
]
