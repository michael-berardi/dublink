import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const BASE = 'https://dubmenu.com';
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

async function signupCookie(): Promise<string> {
  const email = `session-isolation-${unique()}@dubmenu-test.example`;
  const form = new FormData();
  form.set('email', email);
  form.set('password', 'test-password-1234');
  const res = await SELF.fetch(`${BASE}/api/signup`, {
    method: 'POST',
    body: form,
    redirect: 'manual',
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/dubmenu_auth=([^;]+)/);
  if (!match) throw new Error(`signup did not set auth cookie (status ${res.status}): ${setCookie}`);
  return match[1];
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

describe('session ownership isolation', () => {
  it('rejects unauthenticated claim attempts', async () => {
    const sessionId = `UNAUTH-${unique()}`;
    const res = await SELF.fetch(`${BASE}/api/claim/${sessionId}`, { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('allows the first authenticated account to claim an unowned session', async () => {
    const sessionId = `CLAIM-${unique()}`;
    const cookie = await signupCookie();
    const res = await authedFetch(`/api/claim/${sessionId}`, cookie, { method: 'POST' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean; sessionId?: string };
    expect(body.ok).toBe(true);
    expect(body.sessionId).toBe(sessionId);
  });

  it('blocks a second account from claiming an already-owned session', async () => {
    const sessionId = `CLAIM-SECOND-${unique()}`;
    const ownerCookie = await signupCookie();
    const first = await authedFetch(`/api/claim/${sessionId}`, ownerCookie, { method: 'POST' });
    expect(first.status).toBe(200);

    const attackerCookie = await signupCookie();
    const second = await authedFetch(`/api/claim/${sessionId}`, attackerCookie, { method: 'POST' });
    expect(second.status).toBe(403);
    const body = (await second.json()) as { error?: string };
    expect(body.error).toMatch(/owned by another account/i);
  });

  it('blocks a non-owner from accessing the print page', async () => {
    const sessionId = `PRINT-ISO-${unique()}`;
    const ownerCookie = await signupCookie();
    const claim = await authedFetch(`/api/claim/${sessionId}`, ownerCookie, { method: 'POST' });
    expect(claim.status).toBe(200);

    const attackerCookie = await signupCookie();
    const res = await authedFetch(`/print/${sessionId}`, attackerCookie);
    expect(res.status).toBe(403);
  });

  it('blocks a non-owner from exporting the session config', async () => {
    const sessionId = `EXPORT-ISO-${unique()}`;
    const ownerCookie = await signupCookie();
    const claim = await authedFetch(`/api/claim/${sessionId}`, ownerCookie, { method: 'POST' });
    expect(claim.status).toBe(200);

    const attackerCookie = await signupCookie();
    const res = await authedFetch(`/api/export/${sessionId}`, attackerCookie);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/owned by another account/i);
  });
});

describe('demo widget', () => {
  it('does not expose a fake customer dispensary name', async () => {
    const res = await SELF.fetch(`${BASE}/api/widget/demo`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { dispensaryName?: string; categories?: unknown[] };
    const name = body.dispensaryName || '';
    expect(name === '' || name === 'DubMenu').toBe(true);
    expect(Array.isArray(body.categories)).toBe(true);
  });

  it('returns empty categories for an unowned demo session', async () => {
    const res = await SELF.fetch(`${BASE}/api/widget/demo`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { dispensaryName?: string; categories?: unknown[] };
    expect(body.dispensaryName).toBe('DubMenu');
    expect(body.categories).toHaveLength(0);
  });

  it('returns empty categories for an unowned non-demo session', async () => {
    const sessionId = `UNOWNED-${unique()}`;
    const res = await SELF.fetch(`${BASE}/api/widget/${sessionId}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { dispensaryName?: string; categories?: unknown[] };
    expect(body.dispensaryName).toBe('DubMenu');
    expect(body.categories).toHaveLength(0);
  });
});
