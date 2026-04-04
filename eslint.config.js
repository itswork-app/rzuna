import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  prettier,
  security.configs.recommended,
  sonarjs.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
        process: 'readonly',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-console': 'off',
      'security/detect-object-injection': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/deprecation': 'off',
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/no-dead-store': 'off',
      'sonarjs/function-return-type': 'off',
      'sonarjs/no-ignored-exceptions': 'off',
      'sonarjs/public-static-readonly': 'off',
      'sonarjs/unused-import': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/void-use': 'off',
      'sonarjs/assertions-in-tests': 'off',
      complexity: 'off',
    },
  },
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/scripts/**',
      '**/*.config.ts',
      '**/*.config.js',
      '**/eslint.config.js',
      '**/vitest.config.ts',
    ],
  },
);
