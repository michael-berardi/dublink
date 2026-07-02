import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const BASE = 'https://dubmenu.com';
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Sign up a fresh account through the real /api/signup flow and return the
// Set-Cookie header value (a `dubmenu_auth=...` cookie). Uses a unique email
// each call so collisions across runs are impossible.
async function signupCookie(): Promise<{ cookie: string; accountId: string; email: string }> {
  const email = `acct-features-${unique()}@dubmenu-test.example`;
  const form = new FormData();
  form.set('email', email);
  form.set('password', 'test-password-1234');
  const res = await SELF.fetch(`${BASE}/api/signup`, {
    method: 'POST',
    body: form,
    redirect: 'manual',
  });
  // /api/signup redirects (302) on success and sets the cookie.
  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/dubmenu_auth=([^;]+)/);
  if (!match) throw new Error(`signup did not set auth cookie (status ${res.status}): ${setCookie}`);
  // accountId is derived from email via accountIdFromEmail (sanitized). The
  // export/delete routes look the account up by the token's accountId, so we
  // don't need to mirror the derivation here — the cookie carries it.
  return { cookie: match[1], accountId: '', email };
}

function authedFetch(path: string, cookie: string, init: RequestInit = {}): Promise<Response> {
  return SELF.fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Cookie: `dubmenu_auth=${cookie}`,
    },
  });
}

describe('GET /api/account/export', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await SELF.fetch(`${BASE}/api/account/export`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Unauthorized');
  });

  it('returns a JSON bundle and excludes passwordHash when authenticated', async () => {
    const { cookie } = await signupCookie();
    const res = await authedFetch('/api/account/export', cookie);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('content-disposition') || '').toMatch(/attachment; filename="dubmenu-account-export-.*\.json"/);
    const body = (await res.json()) as {
      exportedAt?: string;
      account?: { passwordHash?: unknown; passwordSalt?: unknown; email?: string };
      sessions?: unknown;
      uploads?: unknown[];
    };
    expect(body.exportedAt).toBeTruthy();
    expect(body.account).toBeTruthy();
    expect(body.account.passwordHash).toBeUndefined();
    expect(body.account.passwordSalt).toBeUndefined();
    expect(body.account.email).toBeTruthy();
    expect(typeof body.sessions).toBe('object');
    expect(Array.isArray(body.uploads)).toBe(true);
  });
});

describe('POST /api/account/delete', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await SELF.fetch(`${BASE}/api/account/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'DELETE' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 when confirm body is not the literal "DELETE"', async () => {
    const { cookie } = await signupCookie();
    const res = await authedFetch('/api/account/delete', cookie, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'no' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/confirm/i);
  });

  it('returns 400 on invalid JSON body', async () => {
    const { cookie } = await signupCookie();
    const res = await authedFetch('/api/account/delete', cookie, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json{',
    });
    expect(res.status).toBe(400);
  });

  it('cascades and clears the auth cookie when confirmed', async () => {
    const { cookie } = await signupCookie();
    const res = await authedFetch('/api/account/delete', cookie, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'DELETE' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: boolean };
    expect(body.deleted).toBe(true);
    const setCookie = res.headers.get('set-cookie') || '';
    expect(setCookie).toMatch(/dubmenu_auth=;/);
    expect(setCookie).toMatch(/Max-Age=0/);
  });
});

describe('GET /print/[sessionId]', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await SELF.fetch(`${BASE}/print/ABCD2345EFGH6789`);
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid session id format', async () => {
    const res = await SELF.fetch(`${BASE}/print/bad id!`);
    expect(res.status).toBe(400);
  });

  it('returns 403 when the authenticated account does not own the session', async () => {
    const { cookie } = await signupCookie();
    // A session id the freshly-signed-up account never claimed.
    const res = await authedFetch('/print/ZZZZZZZZZZZZZZZZ', cookie);
    expect(res.status).toBe(403);
  });
});
