// POST /api/waitlist — validates, checks Turnstile, stores the sign-up in D1.
// Always answers 200 for valid sign-ups, new or repeated, so the endpoint never reveals who is on the list.
import { parseWaitlist } from '../../src/lib/waitlist';

interface Env {
  DB: D1Database;
  TURNSTILE_SECRET: string;
}

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get('content-type') ?? '';
  try {
    if (type.includes('application/json')) {
      const data: unknown = await request.json();
      return data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    }
    if (type.includes('form')) {
      return Object.fromEntries((await request.formData()).entries());
    }
  } catch {
    return null;
  }
  return null;
}

async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const res = await fetch(SITEVERIFY_URL, { method: 'POST', body: form });
    if (!res.ok) return false;
    const outcome = (await res.json()) as { success?: boolean };
    return outcome.success === true;
  } catch {
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'invalid', fields: [] }, 400);

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
  );
  if (!human) return json({ ok: false, error: 'captcha' }, 403);

  const { email, city, locale, source } = parsed.entry;
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO waitlist (email, city, locale, consent_at, created_at, source)
       VALUES (?1, ?2, ?3, ?4, ?4, ?5)`,
    )
      .bind(email, city, locale, now, source)
      .run();
  } catch (err) {
    console.error('waitlist: insert failed', err);
    return json({ ok: false, error: 'server' }, 500);
  }

  return json({ ok: true });
};

export const onRequest: PagesFunction<Env> = () =>
  new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
