// POST /api/waitlist — validates, checks Turnstile, stores the sign-up in D1.
// Always answers 200 for valid sign-ups, new or repeated, so the endpoint never reveals who is on the list.
// A repeated email keeps its first city and language (INSERT OR IGNORE).
import { PRIVACY_VERSION } from '../../src/config';
import {
  isTrustedTurnstile,
  parseHostnames,
  parseWaitlist,
  type SiteverifyOutcome,
} from '../../src/lib/waitlist';

interface Env {
  DB: D1Database;
  TURNSTILE_SECRET: string;
  // Comma-separated production hostnames. When set, tokens must come from them (and not from test keys).
  TURNSTILE_HOSTNAMES?: string;
}

// A sign-up is a few hundred bytes; anything bigger is not a person filling the form.
const MAX_BODY_BYTES = 4096;

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

type Body = Record<string, unknown> | 'invalid' | 'too-large';

async function readBody(request: Request): Promise<Body> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) return 'too-large';
  const type = request.headers.get('content-type') ?? '';
  const isJson = type.startsWith('application/json');
  const isForm = type.startsWith('application/x-www-form-urlencoded');
  if (!isJson && !isForm) return 'invalid';

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return 'too-large';
  if (isForm) return Object.fromEntries(new URLSearchParams(text));
  try {
    const data: unknown = JSON.parse(text);
    return data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : 'invalid';
  } catch {
    return 'invalid';
  }
}

async function verifyTurnstile(
  token: string,
  secret: string,
  ip: string | null,
  hostnames: readonly string[],
): Promise<boolean> {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const res = await fetch(SITEVERIFY_URL, { method: 'POST', body: form });
    if (!res.ok) return false;
    return isTrustedTurnstile((await res.json()) as SiteverifyOutcome, hostnames);
  } catch {
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readBody(request);
  if (body === 'too-large') return json({ ok: false, error: 'too-large' }, 413);
  if (body === 'invalid') return json({ ok: false, error: 'invalid', fields: [] }, 400);

  const parsed = parseWaitlist(body);
  if (!parsed.ok) {
    return parsed.reason === 'captcha'
      ? json({ ok: false, error: 'captcha' }, 403)
      : json({ ok: false, error: 'invalid', fields: parsed.fields }, 400);
  }

  if (!env.TURNSTILE_SECRET || !env.DB) {
    console.error('waitlist: missing TURNSTILE_SECRET or DB binding');
    return json({ ok: false, error: 'server' }, 500);
  }

  const human = await verifyTurnstile(
    parsed.token,
    env.TURNSTILE_SECRET,
    request.headers.get('CF-Connecting-IP'),
    parseHostnames(env.TURNSTILE_HOSTNAMES),
  );
  if (!human) return json({ ok: false, error: 'captcha' }, 403);

  const { email, city, locale, source } = parsed.entry;
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO waitlist (email, city, locale, consent_at, created_at, source, policy_version)
       VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?6)`,
    )
      .bind(email, city, locale, now, source, PRIVACY_VERSION)
      .run();
  } catch (err) {
    console.error('waitlist: insert failed', err);
    return json({ ok: false, error: 'server' }, 500);
  }

  return json({ ok: true });
};

export const onRequest: PagesFunction<Env> = () =>
  new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
