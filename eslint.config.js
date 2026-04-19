import js from '@eslint/js'
import ts from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import prettier from 'eslint-plugin-prettier'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'src-tauri/**'],
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
        Event: 'readonly',
        URL: 'readonly',
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
        Event: 'readonly',
        URL: 'readonly',
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
