import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail, parseWaitlist } from '../src/lib/waitlist';

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

  it.each(['', 'plain', 'a@b', 'a b@c.de', '@c.de', 'a@@c.de', `${'x'.repeat(250)}@c.de`])(
    'rejects %j',
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    },
  );
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
