import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import nextPlugin from '@next/eslint-plugin-next';
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/.next/**',
      'node_modules/**',
      'out/**',
      'dist/**',
      'coverage/**',
      'next-env.d.ts',
      '**/*.config.js',
      'prisma/migrations/**',
      '.env',
      '.env*',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      '@next/next': {
        rules: nextPlugin.rules,
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-undef': 'error',
      'no-unused-expressions': 'off',
      'no-fallthrough': 'off',
      'no-cond-assign': 'off',
      'no-empty': 'off',
      'no-prototype-builtins': 'off',
      'no-control-regex': 'off',
      'no-constant-condition': 'off',
      'no-unused-vars': 'off',
      'no-self-assign': 'off',
      'no-func-assign': 'off',
      'no-case-declarations': 'off',
      'getter-return': 'off',
      'valid-typeof': 'off',
      'no-misleading-character-class': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
      next: {
        rootDir: './',
      },
    },
  },
  eslintConfigPrettier,
];
