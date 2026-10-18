// @ts-check
import { defineConfig } from 'astro/config';
import { CONTACT_EMAIL, CONTROLLER } from './src/config.ts';

// Production builds on Cloudflare Pages refuse to ship test keys or legal placeholders.
// CF_PAGES and CF_PAGES_BRANCH are set by the Pages build; PRODUCTION_BRANCH defaults to main.
const env = process.env;
if (env.CF_PAGES === '1' && env.CF_PAGES_BRANCH === (env.PRODUCTION_BRANCH ?? 'main')) {
  const missing = [];
  if (!env.PUBLIC_TURNSTILE_SITE_KEY) missing.push('PUBLIC_TURNSTILE_SITE_KEY build variable');
  if (CONTACT_EMAIL.endsWith('.example')) missing.push('CONTACT_EMAIL in src/config.ts');
  if (CONTROLLER.startsWith('[')) missing.push('CONTROLLER in src/config.ts');
  if (missing.length) throw new Error(`Production build blocked, set: ${missing.join(', ')}`);
}

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
