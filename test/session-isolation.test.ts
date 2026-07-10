import { SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import { SessionDurableObject } from '../src/session';

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

function fakeSessionState(failPut = false): DurableObjectState {
  const storage = {
    get: vi.fn(async () => undefined),
    put: vi.fn(async () => { if (failPut) throw new Error('storage unavailable'); }),
    deleteAll: vi.fn(async () => undefined),
  };
  return {
    storage,
    blockConcurrencyWhile: async (callback: () => Promise<unknown>) => callback(),
  } as unknown as DurableObjectState;
}

describe('Session Durable Object integrity', () => {
  it('requires the owning account for destructive deletion', async () => {
    const state = fakeSessionState();
    const session = new SessionDurableObject(state, {} as Env);
    const claim = await session.fetch(new Request('https://internal/owner', { method: 'POST', headers: { 'X-Account-Id': 'owner' } }));
    expect(claim.status).toBe(200);

    expect((await session.fetch(new Request('https://internal/', { method: 'DELETE' }))).status).toBe(403);
    expect((await session.fetch(new Request('https://internal/', { method: 'DELETE', headers: { 'X-Account-Id': 'attacker' } }))).status).toBe(403);
    expect((await session.fetch(new Request('https://internal/', { method: 'DELETE', headers: { 'X-Account-Id': 'owner' } }))).status).toBe(200);
  });

  it('returns an import failure instead of broadcasting success when persistence fails', async () => {
    const session = new SessionDurableObject(fakeSessionState(true), {} as Env);
    const res = await session.fetch(new Request('https://internal/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Account-Id': 'owner' },
      body: JSON.stringify({ categories: [{ id: 'flower', name: 'Flower', order: 0, products: [{ id: 'p1', name: 'OG Kush', price: 20, inStock: true }] }] }),
    }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: 'Import failed' });
  });

  it('preserves imported sale metadata as a visible promotion', async () => {
    const session = new SessionDurableObject(fakeSessionState(), {} as Env);
    const imported = await session.fetch(new Request('https://internal/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Account-Id': 'owner' },
      body: JSON.stringify({
        categories: [{
          id: 'flower',
          name: 'Flower',
          order: 0,
          products: [{
            id: 'sale-product',
            name: 'Sale Product',
            price: 28,
            originalPrice: 35,
            special: true,
            specialLabel: 'Sale',
            inStock: true,
          }],
        }],
      }),
    }));
    expect(imported.status).toBe(200);

    const config = await session.fetch(new Request('https://internal/config', {
      headers: { 'X-Account-Id': 'owner' },
    }));
    const payload: unknown = await config.json();
    expect(payload).toMatchObject({
      config: {
        categories: [{
          products: [{
            id: 'sale-product',
            price: 28,
            originalPrice: 35,
            isPromo: true,
            specialLabel: 'Sale',
          }],
        }],
      },
    });
  });
});

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

  it('rejects unauthenticated import job starts', async () => {
    const sessionId = `IMPORT-UNAUTH-${unique()}`;
    const res = await SELF.fetch(`${BASE}/api/import/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'simply-green', session: sessionId }),
    });
    expect(res.status).toBe(401);
  });

  it('validates import job session IDs before starting background work', async () => {
    const cookie = await signupCookie();
    const res = await authedFetch('/api/import/jobs', cookie, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'simply-green', session: '../bad' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/invalid session/i);
  });

  it('waits for live menu persistence before resolving an import job start', async () => {
    const sessionId = `IMPORT-AWAIT-${unique()}`;
    const cookie = await signupCookie();
    expect((await authedFetch(`/api/claim/${sessionId}`, cookie, { method: 'POST' })).status).toBe(200);

    const originalFetch = globalThis.fetch;
    let releaseProducts!: () => void;
    let productRequestStarted = false;
    const productsReady = new Promise<void>((resolve) => {
      releaseProducts = resolve;
    });

    globalThis.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const operationName = JSON.parse(String(init?.body)).operationName as string;
      if (operationName === 'ConsumerDispensaries') {
        return Response.json({
          data: {
            filteredDispensaries: [{ id: 'd-1', name: 'Simply Green' }],
          },
        });
      }
      productRequestStarted = true;
      await productsReady;
      return Response.json({
        data: {
          filteredProducts: {
            products: [{ id: 'p1', Name: 'Blue Dream', type: 'Flower', recPrices: [35] }],
            totalCount: 1,
          },
        },
      });
    }) as typeof fetch;

    try {
      let requestSettled = false;
      const importRequest = authedFetch('/api/import/jobs', cookie, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'simply-green', session: sessionId }),
      }).then((response) => {
        requestSettled = true;
        return response;
      });

      await vi.waitFor(() => expect(productRequestStarted).toBe(true));
      expect(requestSettled).toBe(false);

      releaseProducts();
      const response = await importRequest;
      expect(response.status).toBe(202);
      const started = (await response.json()) as { statusUrl: string };
      const statusResponse = await authedFetch(started.statusUrl, cookie);
      const status = (await statusResponse.json()) as { job?: { status?: string; productCount?: number } };
      expect(status.job).toMatchObject({ status: 'success', productCount: 1 });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('returns a clear 404 for missing import jobs owned by the requester', async () => {
    const sessionId = `IMPORT-MISSING-${unique()}`;
    const cookie = await signupCookie();
    const claim = await authedFetch(`/api/claim/${sessionId}`, cookie, { method: 'POST' });
    expect(claim.status).toBe(200);
    const res = await authedFetch(`/api/import/jobs/missing-job?session=${sessionId}`, cookie);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/import job/i);
  });

  it('notifies TVs when the last authenticated phone disconnects', async () => {
    const sessionId = `DISCONNECT-${unique()}`;
    const cookie = await signupCookie();
    expect((await authedFetch(`/api/claim/${sessionId}`, cookie, { method: 'POST' })).status).toBe(200);
    const tvRes = await SELF.fetch(`${BASE}/ws/${sessionId}?role=tv`, { headers: { Upgrade: 'websocket' } });
    const phoneRes = await SELF.fetch(`${BASE}/ws/${sessionId}?role=phone`, { headers: { Upgrade: 'websocket', Cookie: `dubmenu_auth=${cookie}` } });
    const tv = tvRes.webSocket;
    const phone = phoneRes.webSocket;
    if (!tv || !phone) throw new Error('Expected paired WebSockets');
    tv.accept();
    phone.accept();
    const disconnected = new Promise<void>((resolve) => {
      tv.addEventListener('message', (event) => {
        const message = JSON.parse(String(event.data)) as { type?: string };
        if (message.type === 'unpaired') resolve();
      });
    });
    phone.close(1000, 'test disconnect');
    await disconnected;
    tv.close(1000, 'test complete');
  });
  it('rejects custom-domain mappings to sessions the account does not own', async () => {
    const cookie = await signupCookie();
    const res = await authedFetch('/api/domains', cookie, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: `menu-${unique()}.customer.com`, sessionId: `UNOWNED-${unique()}` }),
    });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringMatching(/owned/i) });
  });

});

describe('demo widget', () => {
  it('returns the same populated Simply Green demo used by the public menu and TV board', async () => {
    const res = await SELF.fetch(`${BASE}/api/widget/demo`);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    const body = (await res.json()) as { dispensaryName?: string; categories?: unknown[] };
    expect(body.dispensaryName).toBe('Simply Green');
    expect(Array.isArray(body.categories)).toBe(true);
    expect(body.categories?.length).toBeGreaterThan(0);
  });

  it('returns empty categories for an unowned non-demo session', async () => {
    const sessionId = `UNOWNED-${unique()}`;
    const res = await SELF.fetch(`${BASE}/api/widget/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    const body = (await res.json()) as { dispensaryName?: string; categories?: unknown[] };
    expect(body.dispensaryName).toBe('DubMenu');
    expect(body.categories).toHaveLength(0);
  });
});
