// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://where-to-live.pages.dev',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de', 'it'],
    routing: { prefixDefaultLocale: false },
  },
});
