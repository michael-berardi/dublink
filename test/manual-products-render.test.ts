import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const BASE = 'https://dubmenu.com';
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

async function signupCookie(): Promise<string> {
  const email = `manual-products-${unique()}@dubmenu-test.example`;
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
  const sessionId = `MANUAL-${unique()}`;
  await claimSession(sessionId, cookie);
  const csv = `name,price,category,description,strain
SAM SYNC TEST A,20.00,Flower,Bright test description,hybrid
SAM SYNC TEST B,25.00,Edibles,Chewy test description,indica`;
  await importCSV(sessionId, cookie, csv);
  return { sessionId, cookie };
}

describe('manual products render in customer menu', () => {
  it('renders manual product names in /menu/:sessionId HTML', async () => {
    const { sessionId } = await createPopulatedSession();

    const res = await SELF.fetch(`${BASE}/menu/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('SAM SYNC TEST A');
    expect(html).toContain('SAM SYNC TEST B');
    // The menu body should not be empty/no-results for a populated session.
    expect(html).not.toContain('No products to display');
  });

  it('renders manual product names in the public widget JSON', async () => {
    const { sessionId } = await createPopulatedSession();

    const res = await SELF.fetch(`${BASE}/api/widget/${sessionId}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      categories: { name: string; products: { name: string }[] }[];
    };
    const names = body.categories.flatMap((c) => c.products.map((p) => p.name));
    expect(names).toContain('SAM SYNC TEST A');
    expect(names).toContain('SAM SYNC TEST B');
  });

  it('does not render products for an unowned session', async () => {
    const sessionId = `UNOWNED-MANUAL-${unique()}`;
    const res = await SELF.fetch(`${BASE}/menu/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).not.toContain('SAM SYNC TEST A');
  });
});

describe('manual products render in TV path', () => {
  it('TV page for a populated session contains the correct WebSocket URL', async () => {
    const { sessionId } = await createPopulatedSession();

    const res = await SELF.fetch(`${BASE}/tv/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    // TV renders client-side after pairing; initial HTML carries the session id.
    expect(html).toContain(`/ws/${sessionId}?role=tv`);
    expect(html).toContain(sessionId.toUpperCase());
  });

  it('TV page for a populated session embeds the persisted config so it renders immediately', async () => {
    const { sessionId } = await createPopulatedSession();

    const res = await SELF.fetch(`${BASE}/tv/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    // The server should embed the saved config so the TV shows products without
    // waiting for a phone to pair. Product names must appear in the initial HTML
    // (inside the embedded initialConfig JSON), not only via WebSocket.
    expect(html).toContain('SAM SYNC TEST A');
    expect(html).toContain('SAM SYNC TEST B');
    expect(html).not.toContain('var initialConfig = null');
  });

  it('TV page for an unowned session stays in pairing mode', async () => {
    const sessionId = `UNOWNED-TV-${unique()}`;

    const res = await SELF.fetch(`${BASE}/tv/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    // No persisted config, so the TV should still show the pairing instructions.
    expect(html).toContain('Scan with your phone to configure your menu');
  });

  it('TV WebSocket returns the populated config to a TV role on connect', async () => {
    const { sessionId } = await createPopulatedSession();

    const res = await SELF.fetch(`${BASE}/ws/${sessionId}?role=tv`, {
      headers: { Upgrade: 'websocket' },
    });
    expect(res.status).toBe(101);
    const client = res.webSocket;
    if (!client) throw new Error('expected WebSocket');

    const msg = await new Promise<{ type: string; payload?: { categories?: { products?: { name: string; description?: string; specialLabel?: string }[] }[] } }>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('websocket timeout')), 5000);
      client.addEventListener('message', (ev) => {
        clearTimeout(timer);
        resolve(JSON.parse(ev.data as string));
      }, { once: true });
      client.accept();
    });

    expect(msg.type).toBe('config');
    const products = (msg.payload?.categories || []).flatMap((c: { products?: { name: string; description?: string; specialLabel?: string }[] }) => c.products || []);
    const names = products.map((p) => p.name);
    expect(products.find((p) => p.name === 'SAM SYNC TEST A')?.description).toBe('Bright test description');
    expect(names).toContain('SAM SYNC TEST A');
    expect(names).toContain('SAM SYNC TEST B');

    client.close();
  });

  it('TV embed page for the owner bypasses the age gate', async () => {
    const { sessionId, cookie } = await createPopulatedSession();

    const res = await authedFetch(`/tv/${sessionId}?embed=1`, cookie);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('/ws/' + sessionId + '?role=tv');
    // Age gate should be hidden in embed mode for the owning account.
    expect(html).toContain('id="age-gate"');
    expect(html).toMatch(/class="age-gate hidden"/);
  });
  it('TV page for a populated session renders menu immediately without pairing UI', async () => {
    const { sessionId } = await createPopulatedSession();

    const res = await SELF.fetch(`${BASE}/tv/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('id="pairing"');
    expect(html).toContain('id="menu"');
    // Configured sessions should show the menu phase and hide the pairing phase.
    expect(html).toMatch(/id="pairing"[^>]*hidden/);
    expect(html).not.toMatch(/id="menu"[^>]*hidden/);
    // The embedded initial config contains the product names.
    expect(html).toContain('SAM SYNC TEST A');
    expect(html).toContain('SAM SYNC TEST B');
  });

  it('TV page for an unconfigured session still shows pairing UI', async () => {
    const sessionId = `UNOWNED-TV-${unique()}`;

    const res = await SELF.fetch(`${BASE}/tv/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('id="pairing"');
    expect(html).toContain('id="menu"');
    // Pairing phase is visible; menu phase is hidden for unconfigured sessions.
    expect(html).not.toMatch(/id="pairing"[^>]*hidden/);
    expect(html).toMatch(/id="menu"[^>]*hidden/);
  });
});

describe('manual products via phone/editor WebSocket flow', () => {
  it('config_replace from a phone role renders products in /menu and /api/widget', async () => {
    const cookie = await signupCookie();
    await activateTrial(cookie);
    const sessionId = `MANUAL-WS-${unique()}`;
    await claimSession(sessionId, cookie);

    const wsUrl = `${BASE}/ws/${sessionId}?role=phone`;
    const res = await SELF.fetch(wsUrl, {
      headers: { Upgrade: 'websocket', Cookie: `dubmenu_auth=${cookie}` },
    });
    expect(res.status).toBe(101);
    const client = res.webSocket;
    if (!client) throw new Error('expected phone WebSocket');

    const configReplace = {
      dispensaryName: 'WS Manual Test',
      fontScale: 250,
      categories: [
        {
          id: 'cat-ws-flower',
          name: 'Flower',
          order: 0,
          products: [
            { id: 'prod-ws-a', name: 'SAM SYNC TEST A', price: 20, inStock: true },
          ],
        },
        {
          id: 'cat-ws-edibles',
          name: 'Edibles',
          order: 1,
          products: [
            { id: 'prod-ws-b', name: 'SAM SYNC TEST B', price: 25, inStock: true },
          ],
        },
      ],
    };

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('phone join timeout')), 5000);
      client.addEventListener('message', (ev) => {
        const msg = JSON.parse(ev.data as string);
        if (msg.type === 'config') {
          clearTimeout(timer);
          resolve();
        }
      }, { once: true });
      client.accept();
      client.send(JSON.stringify({ type: 'join', payload: { role: 'phone' } }));
    });

    client.send(JSON.stringify({ type: 'config_replace', payload: configReplace }));

    // Allow a brief moment for the DO to persist and broadcast.
    await new Promise((r) => setTimeout(r, 300));
    client.close();

    const widgetRes = await SELF.fetch(`${BASE}/api/widget/${sessionId}`);
    expect(widgetRes.status).toBe(200);
    const widgetBody = (await widgetRes.json()) as {
      categories: { name: string; products: { name: string }[] }[];
    };
    const names = widgetBody.categories.flatMap((c) => c.products.map((p) => p.name));
    expect(names).toContain('SAM SYNC TEST A');
    expect(names).toContain('SAM SYNC TEST B');

    const menuRes = await SELF.fetch(`${BASE}/menu/${sessionId}`);
    expect(menuRes.status).toBe(200);
    const menuHtml = await menuRes.text();
    expect(menuHtml).toContain('SAM SYNC TEST A');
    expect(menuHtml).toContain('SAM SYNC TEST B');

    const tvRes = await SELF.fetch(`${BASE}/tv/${sessionId}`);
    expect(tvRes.status).toBe(200);
    expect(await tvRes.text()).toContain('data-font-scale="150"');
  });
});
