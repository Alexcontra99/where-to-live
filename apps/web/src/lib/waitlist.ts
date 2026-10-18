// Pure validation for waitlist sign-ups. Shared by the Pages Function and the tests.
import { CITIES, LOCALES, type CityId, type LocaleId } from '../config';

export interface WaitlistEntry {
  email: string;
  city: CityId;
  locale: LocaleId;
  source: string;
}

export type FieldError = 'email' | 'city' | 'locale' | 'consent';

export type ParseResult =
  | { ok: true; entry: WaitlistEntry; token: string }
  | { ok: false; reason: 'invalid'; fields: FieldError[] }
  | { ok: false; reason: 'captcha' };

const CITY_IDS: ReadonlySet<string> = new Set(CITIES.map((c) => c.id));
const LOCALE_IDS: ReadonlySet<string> = new Set(LOCALES.map((l) => l.id));

// Deliberately loose: one @, a dot in the domain, no spaces. The inbox is the real check.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCE_RE = /^[a-z0-9_-]{1,32}$/;
// A leading = + - @ would run as a formula if an export is opened in a spreadsheet.
const FORMULA_RE = /^[=+@-]/;

export const MAX_TOKEN_LENGTH = 2048;
export const TURNSTILE_ACTION = 'waitlist';

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email) && !FORMULA_RE.test(email);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isConsent(value: unknown): boolean {
  return value === true || value === 'true' || value === 'on' || value === 'yes';
}

/**
 * Validates a raw sign-up payload (parsed JSON or form fields).
 * Data errors win over a missing captcha token so the visitor can fix the form first.
 */
export function parseWaitlist(input: Record<string, unknown>): ParseResult {
  const email = normalizeEmail(str(input.email));
  const city = str(input.city);
  const locale = str(input.locale);
  const fields: FieldError[] = [];

  if (!isValidEmail(email)) fields.push('email');
  if (!CITY_IDS.has(city)) fields.push('city');
  if (!LOCALE_IDS.has(locale)) fields.push('locale');
  if (!isConsent(input.consent)) fields.push('consent');
  if (fields.length > 0) return { ok: false, reason: 'invalid', fields };

  const token = str(input['cf-turnstile-response'] ?? input.token).trim();
  if (!token || token.length > MAX_TOKEN_LENGTH) return { ok: false, reason: 'captcha' };

  const rawSource = str(input.source).trim().toLowerCase();
  const source = SOURCE_RE.test(rawSource) ? rawSource : 'landing';

  return {
    ok: true,
    entry: { email, city: city as CityId, locale: locale as LocaleId, source },
    token,
  };
}

export interface SiteverifyOutcome {
  success?: boolean;
  hostname?: string;
  action?: string;
}

/**
 * Accepts a Turnstile siteverify result. When production hostnames are configured, the token must also
 * come from one of them and from the waitlist widget; test keys report example.com and are rejected.
 */
export function isTrustedTurnstile(
  outcome: SiteverifyOutcome,
  hostnames: readonly string[],
): boolean {
  if (outcome.success !== true) return false;
  if (hostnames.length === 0) return true;
  return hostnames.includes(outcome.hostname ?? '') && outcome.action === TURNSTILE_ACTION;
}

/** Parses the comma-separated TURNSTILE_HOSTNAMES variable. */
export function parseHostnames(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}
