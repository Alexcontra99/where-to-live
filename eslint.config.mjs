import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.astro/**',
      '**/.expo/**',
      '**/.wrangler/**',
      '**/ios/**',
      '**/android/**',
      'apps/web/public/demo/**',
      'packages/data-lux/data/**',
      // Prototipo de Ale: JS sin módulos, se mantiene tal cual (qa_data.py lee app.js con regex).
      'prototipo/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
  },
  // Shared packages run on Hermes (React Native) and in browsers: no Node built-ins or Node-only globals.
  {
    files: ['packages/*/src/**/*.{ts,tsx,js,mjs}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [{ group: ['node:*'], message: 'Node built-ins are not available on Hermes.' }],
          paths: ['fs', 'path', 'vm', 'os', 'module', 'crypto', 'child_process', 'url'].map(
            (name) => ({
              name,
              message: 'Node built-ins are not available on Hermes.',
            }),
          ),
        },
      ],
      'no-restricted-globals': [
        'error',
        ...[
          'process',
          'Buffer',
          'require',
          '__dirname',
          '__filename',
          'global',
          'structuredClone',
        ].map((name) => ({ name, message: `${name} is not available on Hermes.` })),
      ],
    },
  },
);
