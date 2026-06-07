import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['dist/', 'out/', 'node_modules/', '*.config.*', '*.d.ts', 'src/test/**', 'src/**/*.test.{ts,tsx}', 'src/**/__tests__/**'],
  },
  // Node.js files (main process)
  {
    files: ['src/main/**/*.ts', 'src/shared/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        project: ['./tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly',
        NodeJS: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Menu: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  // Browser files (renderer process)
  {
    files: ['src/renderer/**/*.{ts,tsx}', 'src/preload/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.web.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        SVGElement: 'readonly',
        NodeListOf: 'readonly',
        DragEvent: 'readonly',
        CustomEvent: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Electron: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react-hooks': reactHooks,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
      ...typescriptEslint.configs['recommended-type-checked'].rules,
      ...reactHooks.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-duplicate-type-constituents': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
    },
    settings: {
      react: {
        version: '18.3',
      },
    },
  },
];
