// Commercial name is still undecided: change it here and nowhere else.
export const SITE_NAME = 'Where to Live';

export const SITE_URL = 'https://where-to-live.pages.dev';

// Placeholder until the domain exists: the privacy policy names this address as the contact.
export const CONTACT_EMAIL = 'privacy@where-to-live.example';

// Date of the privacy policy a subscriber consented to; stored with each sign-up. Bump it when the policy changes.
export const PRIVACY_VERSION = '2026-10-10';

// Data controller named in the privacy policy. Must be completed before publishing.
export const CONTROLLER = '[Controller name and postal address — to complete before launch]';

// Cities offered in the waitlist form. `status` drives copy on the landing.
export const CITIES = [
  { id: 'luxembourg', name: 'Luxembourg', country: 'LU', status: 'demo' },
  { id: 'madrid', name: 'Madrid', country: 'ES', status: 'waitlist' },
  { id: 'barcelona', name: 'Barcelona', country: 'ES', status: 'waitlist' },
  { id: 'paris', name: 'Paris', country: 'FR', status: 'waitlist' },
  { id: 'london', name: 'London', country: 'GB', status: 'waitlist' },
  { id: 'berlin', name: 'Berlin', country: 'DE', status: 'waitlist' },
  { id: 'rome', name: 'Rome', country: 'IT', status: 'waitlist' },
  { id: 'milan', name: 'Milan', country: 'IT', status: 'waitlist' },
] as const;

export type CityId = (typeof CITIES)[number]['id'];

// Languages a subscriber can ask to hear from us in. The site itself ships in English first.
export const LOCALES = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' },
  { id: 'de', name: 'Deutsch' },
  { id: 'it', name: 'Italiano' },
] as const;

export type LocaleId = (typeof LOCALES)[number]['id'];

// Cloudflare's always-pass test site key. Production sets PUBLIC_TURNSTILE_SITE_KEY at build time.
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
