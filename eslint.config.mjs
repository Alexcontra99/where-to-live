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
);
