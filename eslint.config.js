import js from '@eslint/js'
import ts from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import prettier from 'eslint-plugin-prettier'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'src-tauri/**', '.opencode/**'],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: ts.parser,
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        KeyboardEvent: 'readonly',
        TouchEvent: 'readonly',
        MouseEvent: 'readonly',
        PointerEvent: 'readonly',
        Event: 'readonly',
        URL: 'readonly',
        HTMLElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLAudioElement: 'readonly',
        HTMLInputElement: 'readonly',
        MediaQueryList: 'readonly',
        MediaQueryListEvent: 'readonly',
        Element: 'readonly',
        HTMLCanvasElement: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        ResizeObserver: 'readonly',
        structuredClone: 'readonly',
      },
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        KeyboardEvent: 'readonly',
        TouchEvent: 'readonly',
        MouseEvent: 'readonly',
        PointerEvent: 'readonly',
        Event: 'readonly',
        URL: 'readonly',
        HTMLElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLAudioElement: 'readonly',
        HTMLInputElement: 'readonly',
        MediaQueryList: 'readonly',
        MediaQueryListEvent: 'readonly',
        Element: 'readonly',
        HTMLCanvasElement: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        ResizeObserver: 'readonly',
        structuredClone: 'readonly',
      },
    },
  },
  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'warn',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
