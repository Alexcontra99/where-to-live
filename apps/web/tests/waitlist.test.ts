import { describe, expect, it } from 'vitest';
import {
  isTrustedTurnstile,
  isValidEmail,
  MAX_TOKEN_LENGTH,
  normalizeEmail,
  parseHostnames,
  parseWaitlist,
} from '../src/lib/waitlist';

const valid = {
  email: '  Ana@Example.COM ',
  city: 'madrid',
  locale: 'es',
  consent: 'on',
  'cf-turnstile-response': 'token-123',
};

describe('normalizeEmail / isValidEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Ana@Example.COM ')).toBe('ana@example.com');
  });

  it.each(['a@b.co', 'first.last+tag@sub.example.lu'])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    '',
    'plain',
    'a@b',
    'a b@c.de',
    '@c.de',
    'a@@c.de',
    '=cmd@evil.co',
    '+1@x.co',
    '-x@y.co',
    `${'x'.repeat(250)}@c.de`,
  ])('rejects %j', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe('parseWaitlist', () => {
  it('accepts a valid form payload and normalises it', () => {
    expect(parseWaitlist(valid)).toEqual({
      ok: true,
      token: 'token-123',
      entry: { email: 'ana@example.com', city: 'madrid', locale: 'es', source: 'landing' },
    });
  });

  it('accepts JSON booleans and a `token` alias', () => {
    const result = parseWaitlist({
      email: 'a@b.co',
      city: 'luxembourg',
      locale: 'en',
      consent: true,
      token: 't',
    });
    expect(result.ok).toBe(true);
  });

  it('lists every invalid field', () => {
    const result = parseWaitlist({ email: 'nope', city: 'tokyo', locale: 'pt', consent: 'off' });
    expect(result).toEqual({
      ok: false,
      reason: 'invalid',
      fields: ['email', 'city', 'locale', 'consent'],
    });
  });

  it('requires consent', () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.consent;
    expect(parseWaitlist(rest)).toEqual({ ok: false, reason: 'invalid', fields: ['consent'] });
  });

  it('ignores non-string values instead of coercing them', () => {
    const result = parseWaitlist({ ...valid, email: ['a@b.co'], city: { id: 'madrid' } });
    expect(result).toMatchObject({ ok: false, fields: ['email', 'city'] });
  });

  it('reports a missing captcha token only when the data is valid', () => {
    expect(parseWaitlist({ ...valid, 'cf-turnstile-response': '  ' })).toEqual({
      ok: false,
      reason: 'captcha',
    });
    expect(parseWaitlist({ ...valid, email: 'x', 'cf-turnstile-response': '' })).toMatchObject({
      reason: 'invalid',
    });
  });

  it('keeps a clean source tag and falls back otherwise', () => {
    expect(parseWaitlist({ ...valid, source: 'Reddit_lux' })).toMatchObject({
      entry: { source: 'reddit_lux' },
    });
    expect(parseWaitlist({ ...valid, source: '<script>' })).toMatchObject({
      entry: { source: 'landing' },
    });
  });

  it('accepts every city and locale offered by the form', async () => {
    const { CITIES, LOCALES } = await import('../src/config');
    for (const c of CITIES)
      for (const l of LOCALES) {
        expect(parseWaitlist({ ...valid, city: c.id, locale: l.id }).ok).toBe(true);
      }
  });
});

describe('captcha token limits', () => {
  it('rejects an oversized token as a captcha failure', () => {
    const token = 'x'.repeat(MAX_TOKEN_LENGTH + 1);
    expect(parseWaitlist({ ...valid, 'cf-turnstile-response': token })).toEqual({
      ok: false,
      reason: 'captcha',
    });
  });
});

describe('isTrustedTurnstile', () => {
  const prod = ['where-to-live.pages.dev'];

  it('requires success', () => {
    expect(isTrustedTurnstile({ success: false }, [])).toBe(false);
    expect(isTrustedTurnstile({}, [])).toBe(false);
  });

  it('accepts any successful token when no hostnames are configured (local dev)', () => {
    expect(isTrustedTurnstile({ success: true, hostname: 'example.com' }, [])).toBe(true);
  });

  it('checks hostname and action in production', () => {
    expect(
      isTrustedTurnstile(
        { success: true, hostname: 'where-to-live.pages.dev', action: 'waitlist' },
        prod,
      ),
    ).toBe(true);
    expect(
      isTrustedTurnstile({ success: true, hostname: 'example.com', action: 'waitlist' }, prod),
    ).toBe(false);
    expect(
      isTrustedTurnstile(
        { success: true, hostname: 'where-to-live.pages.dev', action: 'other' },
        prod,
      ),
    ).toBe(false);
  });
});

describe('parseHostnames', () => {
  it('splits, trims, lowercases and drops blanks', () => {
    expect(parseHostnames(' Where-To-Live.pages.dev, ,example.org ')).toEqual([
      'where-to-live.pages.dev',
      'example.org',
    ]);
    expect(parseHostnames(undefined)).toEqual([]);
  });
});
