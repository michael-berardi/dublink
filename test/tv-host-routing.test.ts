import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const BASE = 'https://dubmenu.com';
const TV_BASE = 'https://tv.dubmenu.com';
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

async function signupCookie(): Promise<string> {
  const email = `tv-host-routing-${unique()}@dubmenu-test.example`;
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
  if (!match) throw new Error('signup did not set auth cookie');
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

async function activateTrial(cookie: string): Promise<void> {
  const res = await authedFetch('/api/test/activate-trial', cookie, {
    method: 'POST',
    redirect: 'manual',
  });
  expect(res.status).toBe(302);
}

async function claimSession(sessionId: string, cookie: string): Promise<void> {
  const res = await authedFetch(`/api/claim/${sessionId}`, cookie, { method: 'POST' });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { ok?: boolean };
  expect(body.ok).toBe(true);
}

async function importCSV(sessionId: string, cookie: string, csv: string): Promise<void> {
  const res = await authedFetch(`/api/import/csv/${sessionId}`, cookie, {
    method: 'POST',
    headers: { 'Content-Type': 'text/csv' },
    body: csv,
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { ok?: boolean };
  expect(body.ok).toBe(true);
}

async function createPopulatedSession(): Promise<{ sessionId: string; cookie: string }> {
  const cookie = await signupCookie();
  await activateTrial(cookie);
  const sessionId = `TV-HOST-${unique()}`;
  await claimSession(sessionId, cookie);
  const csv = `name,price,category
TV HOST A,20.00,Flower
TV HOST B,25.00,Edibles`;
  await importCSV(sessionId, cookie, csv);
  return { sessionId, cookie };
}

describe('tv.dubmenu.com routing', () => {
  it('/tv/demo on the TV host renders the populated demo board', async () => {
    const res = await SELF.fetch(`${TV_BASE}/tv/demo`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Simply Green');
    expect(html).toContain('OG Kush');
    expect(html).toContain('Flower');
    expect(html).toContain('id="pairing" class="phase" hidden');
    expect(html).toContain('id="menu" class="phase">');
    // The demo route runs in demo mode so it never asks the real demo session DO
    // for updates, which protects it from an owned/stale demo session.
    expect(html).toContain('DEMO_MODE = true');
  });

  it('tv.dubmenu.com root starts a fresh pairable TV session, not the demo board', async () => {
    const res = await SELF.fetch(`${TV_BASE}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    // Pairing phase must be visible and the menu phase must be hidden by default.
    expect(html).toContain('id="pairing" class="phase">');
    expect(html).toContain('id="menu" class="phase" hidden>');
    // Root must be a fresh access-code session, not the named demo session.
    expect(html).not.toContain('ACCESS CODE</div>\\n      <div class="access-code">DEMO</div>');
    expect(html).not.toContain('Simply Green');
    expect(html).not.toContain('Bills House');
    expect(html).not.toContain('DEMO_MODE = true');
    expect(html).toMatch(/\/ws\/[A-Z0-9]{16}\?role=tv/);
    expect(html).toContain('data=https%3A%2F%2Fdubmenu.com%2F%3Fcode%3D');
  });

  it('/tv/<session> on the TV host renders a real session and is not demo mode', async () => {
    const { sessionId } = await createPopulatedSession();

    const res = await SELF.fetch(`${TV_BASE}/tv/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('TV HOST A');
    expect(html).toContain('TV HOST B');
    expect(html).toContain('id="pairing" class="phase" hidden');
    expect(html).toContain('id="menu" class="phase">');
    // Real sessions must not be locked into demo mode; they need live WebSocket updates.
    expect(html).not.toContain('DEMO_MODE = true');
    expect(html).toContain(`/ws/${sessionId}?role=tv`);
  });
});

export {};
