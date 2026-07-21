import { SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import { SessionDurableObject } from '../src/session';
import { DEFAULT_CONFIG, type Category } from '../src/types';

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
    list: vi.fn(async () => new Map()),
    delete: vi.fn(async () => undefined),
    deleteAll: vi.fn(async () => undefined),
  };
  return {
    storage,
    blockConcurrencyWhile: async (callback: () => Promise<unknown>) => callback(),
  } as unknown as DurableObjectState;
}

function sizeLimitedSessionState(limit = 128 * 1024): DurableObjectState {
  const values = new Map<string, unknown>();
  const storage = {
    get: vi.fn(async (key: string | string[]) => {
      if (Array.isArray(key)) {
        return new Map(key.filter((entry) => values.has(entry)).map((entry) => [entry, values.get(entry)]));
      }
      return values.get(key);
    }),
    put: vi.fn(async (keyOrEntries: string | Record<string, unknown>, value?: unknown) => {
      const entries = typeof keyOrEntries === 'string'
        ? [[keyOrEntries, value] as const]
        : Object.entries(keyOrEntries);
      for (const [, entryValue] of entries) {
        if (new TextEncoder().encode(JSON.stringify(entryValue)).byteLength > limit) {
          throw new RangeError('Value exceeds the Durable Object storage limit');
        }
      }
      for (const [key, entryValue] of entries) values.set(key, entryValue);
    }),
    delete: vi.fn(async (keys: string | string[]) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) values.delete(key);
    }),
    list: vi.fn(async (options?: { prefix?: string }) => new Map(
      [...values].filter(([key]) => !options?.prefix || key.startsWith(options.prefix))
    )),
    deleteAll: vi.fn(async () => values.clear()),
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
    const configResponse = await session.fetch(new Request('https://internal/config', {
      headers: { 'X-Account-Id': 'owner' },
    }));
    const payload = (await configResponse.json()) as { config: { categories: Category[] } };
    expect(payload.config.categories.flatMap((category) => category.products).some((product) => product.id === 'p1')).toBe(false);
  });

  it('preserves session ownership when a persisted category chunk is missing', async () => {
    const storage = {
      get: vi.fn(async (key: string | string[]) => {
        if (typeof key === 'string' && key === 'session') {
          return {
            config: { ...structuredClone(DEFAULT_CONFIG), categories: [] },
            ownerAccountId: 'owner',
            categoryChunkKeys: ['category:missing'],
          };
        }
        return new Map();
      }),
      put: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
      list: vi.fn(async () => new Map()),
      deleteAll: vi.fn(async () => undefined),
    };
    const state = {
      storage,
      blockConcurrencyWhile: async (callback: () => Promise<unknown>) => callback(),
    } as unknown as DurableObjectState;
    const session = new SessionDurableObject(state, {} as Env);

    const claim = await session.fetch(new Request('https://internal/owner', {
      method: 'POST',
      headers: { 'X-Account-Id': 'attacker' },
    }));
    expect(claim.status).toBe(403);
  });

  it('clamps a legacy stored font scale without deleting active category chunks', async () => {
    const chunkKey = 'category:legacy:0';
    const category: Category = {
      id: 'flower',
      name: 'Flower',
      order: 0,
      products: [{ id: 'legacy-product', name: 'Legacy Product', price: 25, inStock: true }],
    };
    const chunk = { categoryIndex: 0, category };
    const storage = {
      get: vi.fn(async (key: string | string[]) => {
        if (key === 'session') {
          return {
            config: { ...structuredClone(DEFAULT_CONFIG), categories: [], fontScale: 250 },
            ownerAccountId: 'owner',
            categoryChunkKeys: [chunkKey],
          };
        }
        if (Array.isArray(key)) return new Map([[chunkKey, chunk]]);
        return undefined;
      }),
      put: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
      list: vi.fn(async () => new Map([[chunkKey, chunk]])),
      deleteAll: vi.fn(async () => undefined),
    };
    const state = {
      storage,
      blockConcurrencyWhile: async (callback: () => Promise<unknown>) => callback(),
    } as unknown as DurableObjectState;
    const session = new SessionDurableObject(state, {} as Env);

    const response = await session.fetch(new Request('https://internal/config', {
      headers: { 'X-Account-Id': 'owner' },
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      config: {
        fontScale: 150,
        categories: [{ id: 'flower', products: [{ id: 'legacy-product' }] }],
      },
    });
    expect(storage.delete).not.toHaveBeenCalled();
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

  it('retains manual presentation choices across an inferred-default inventory reimport', async () => {
    const session = new SessionDurableObject(fakeSessionState(), {} as Env);
    const importedCategory = (id: string) => [{
      id,
      name: id === 'flower' ? 'Flower' : 'Edibles',
      order: 0,
      products: [{ id: `${id}-product`, name: `${id} product`, price: 20, inStock: true }],
    }];
    const first = await session.fetch(new Request('https://internal/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Account-Id': 'owner' },
      body: JSON.stringify({
        categories: importedCategory('flower'),
        layout: 'grid',
        layoutMode: 'columns',
        fontSize: 'large',
        fontScale: 135,
        autoScroll: false,
        smoothProductScroll: false,
        pageDurationSeconds: 15,
        pageTransition: 'none',
      }),
    }));
    expect(first.status).toBe(200);

    const second = await session.fetch(new Request('https://internal/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Account-Id': 'owner' },
      body: JSON.stringify({
        categories: importedCategory('edibles'),
        presentationDefaults: true,
        layout: 'auto',
        fontSize: 'small',
        fontScale: 100,
        autoScroll: true,
        pageDurationSeconds: 5,
      }),
    }));
    expect(second.status).toBe(200);

    const configResponse = await session.fetch(new Request('https://internal/config', {
      headers: { 'X-Account-Id': 'owner' },
    }));
    await expect(configResponse.json()).resolves.toMatchObject({
      config: {
        categories: [{ id: 'edibles' }],
        layout: 'grid',
        layoutMode: 'columns',
        fontSize: 'large',
        fontScale: 135,
        autoScroll: false,
        smoothProductScroll: false,
        pageDurationSeconds: 15,
        pageTransition: 'none',
      },
    });
  });

  it('persists and reloads a 463-product import within per-value storage limits', async () => {
    const state = sizeLimitedSessionState();
    const categories = Array.from({ length: 9 }, (_, categoryIndex) => ({
      id: `category-${categoryIndex}`,
      name: `Category ${categoryIndex + 1}`,
      order: categoryIndex,
      products: Array.from({ length: categoryIndex === 8 ? 47 : 52 }, (_, productIndex) => ({
        id: `product-${categoryIndex}-${productIndex}`,
        name: `Product ${categoryIndex + 1}-${productIndex + 1}`,
        price: 20 + productIndex,
        description: 'Complete imported product description. '.repeat(12),
        image: `https://dubmenu.com/api/uploads/test-account/${categoryIndex}-${productIndex}.webp`,
        brand: 'Simply Green',
        weight: '3.5g',
        strain: 'hybrid',
        inStock: true,
      })),
    }));
    expect(categories.reduce((total, category) => total + category.products.length, 0)).toBe(463);

    const imported = await new SessionDurableObject(state, {} as Env).fetch(new Request('https://internal/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Account-Id': 'owner' },
      body: JSON.stringify({ categories, layout: 'grid', fontSize: 'large', displayCount: 4 }),
    }));
    expect(imported.status).toBe(200);

    const reloaded = new SessionDurableObject(state, {} as Env);
    const configResponse = await reloaded.fetch(new Request('https://internal/config', {
      headers: { 'X-Account-Id': 'owner' },
    }));
    const payload = (await configResponse.json()) as { config: { categories: Category[] } };
    expect(payload.config.categories).toHaveLength(9);
    expect(payload.config.categories.reduce((total, category) => total + category.products.length, 0)).toBe(463);
    expect(payload.config.categories[8].products.at(-1)?.id).toBe('product-8-46');
  });

  it('rewrites category chunks after a session is deleted and reused', async () => {
    const state = sizeLimitedSessionState();
    const categories = [{
      id: 'flower',
      name: 'Flower',
      order: 0,
      products: [{ id: 'same-product', name: 'Same Product', price: 25, inStock: true }],
    }];
    const importRequest = () => new Request('https://internal/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Account-Id': 'owner' },
      body: JSON.stringify({ categories }),
    });
    const session = new SessionDurableObject(state, {} as Env);
    expect((await session.fetch(importRequest())).status).toBe(200);
    expect((await session.fetch(new Request('https://internal/', {
      method: 'DELETE',
      headers: { 'X-Account-Id': 'owner' },
    }))).status).toBe(200);
    expect((await session.fetch(importRequest())).status).toBe(200);

    const reloaded = new SessionDurableObject(state, {} as Env);
    const configResponse = await reloaded.fetch(new Request('https://internal/config', {
      headers: { 'X-Account-Id': 'owner' },
    }));
    await expect(configResponse.json()).resolves.toMatchObject({
      config: { categories: [{ products: [{ id: 'same-product' }] }] },
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

  it('applies dense automatic presentation defaults to a first large wizard import', async () => {
    const sessionId = `IMPORT-DENSE-${unique()}`;
    const cookie = await signupCookie();
    expect((await authedFetch(`/api/claim/${sessionId}`, cookie, { method: 'POST' })).status).toBe(200);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const operationName = JSON.parse(String(init?.body)).operationName as string;
      if (operationName === 'ConsumerDispensaries') {
        return Response.json({
          data: {
            filteredDispensaries: [{ id: 'd-1', name: 'Simply Green' }],
          },
        });
      }
      return Response.json({
        data: {
          filteredProducts: {
            products: Array.from({ length: 80 }, (_, index) => ({
              id: `p-${index + 1}`,
              Name: `Product ${index + 1}`,
              type: index < 40 ? 'Flower' : 'Edibles',
              recPrices: [20 + index],
            })),
            totalCount: 80,
          },
        },
      });
    }) as typeof fetch;

    try {
      const response = await authedFetch('/api/import/jobs', cookie, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'simply-green', session: sessionId, displayCount: 3 }),
      });
      expect(response.status).toBe(202);

      const widgetResponse = await SELF.fetch(`${BASE}/api/widget/${sessionId}`);
      const widget = (await widgetResponse.json()) as {
        categories?: Array<{ products?: unknown[] }>;
        layout?: string;
        template?: string;
        fontSize?: string;
        fontScale?: number;
        pageDurationSeconds?: number;
        displayCount?: number;
      };
      expect(widget.categories?.flatMap((category) => category.products || [])).toHaveLength(80);
      expect(widget).toMatchObject({
        layout: 'auto',
        template: 'forest',
        fontSize: 'small',
        fontScale: 100,
        pageDurationSeconds: 8,
        displayCount: 3,
      });
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
  it('fans persisted config updates out to multiple TVs in receipt order', async () => {
    const sessionId = `MULTI-TV-${unique()}`;
    const cookie = await signupCookie();
    expect((await authedFetch(`/api/claim/${sessionId}`, cookie, { method: 'POST' })).status).toBe(200);
    const csvImport = await authedFetch(`/api/import/csv/${sessionId}`, cookie, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: 'name,price,category\nFlower Product,20,Flower\nPre-Roll Product,12,Pre-Rolls\nVape Product,30,Vapes',
    });
    expect(csvImport.status).toBe(200);
    const importedConfig = (await (await SELF.fetch(`${BASE}/api/widget/${sessionId}`)).json()) as {
      categories: Array<{ id: string; name: string }>;
    };
    const flowerId = importedConfig.categories.find((category) => category.name === 'Flower')?.id;
    const preRollId = importedConfig.categories.find((category) => category.name === 'Pre-Rolls')?.id;
    const vapeId = importedConfig.categories.find((category) => category.name === 'Vapes')?.id;
    if (!flowerId || !preRollId || !vapeId) throw new Error('Expected imported category IDs');
    const screens = [
      { id: 'screen-1', name: 'Flower + Pre-Rolls', categoryIds: [flowerId, preRollId], layout: 'grid' },
      { id: 'screen-2', name: 'Vapes', categoryIds: [vapeId], layout: 'list' },
      { id: 'screen-3', name: 'Display 3', categoryIds: [] },
      { id: 'screen-4', name: 'Display 4', categoryIds: [] },
    ];

    const [tvOneResponse, tvTwoResponse, phoneResponse] = await Promise.all([
      SELF.fetch(`${BASE}/ws/${sessionId}?role=tv`, { headers: { Upgrade: 'websocket' } }),
      SELF.fetch(`${BASE}/ws/${sessionId}?role=tv`, { headers: { Upgrade: 'websocket' } }),
      SELF.fetch(`${BASE}/ws/${sessionId}?role=phone`, { headers: { Upgrade: 'websocket', Cookie: `dubmenu_auth=${cookie}` } }),
    ]);
    const tvOne = tvOneResponse.webSocket;
    const tvTwo = tvTwoResponse.webSocket;
    const phone = phoneResponse.webSocket;
    if (!tvOne || !tvTwo || !phone) throw new Error('Expected three WebSockets');
    tvOne.accept();
    tvTwo.accept();
    phone.accept();

    const waitForLargeGrid = (socket: WebSocket) => new Promise<void>((resolve) => {
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(String(event.data)) as {
          type?: string;
          payload?: {
            fontSize?: string;
            fontScale?: number;
            layout?: string;
            pageDurationSeconds?: number;
            smoothScrollSpeed?: number;
            pageTransition?: string;
            smoothProductScroll?: boolean;
            displayCount?: number;
            screens?: Array<{ name?: string; categoryIds?: string[]; layout?: string }>;
          };
        };
        const screenOne = message.payload?.screens?.[0];
        const hasScreenConfig = message.payload?.displayCount === 2
          && screenOne?.name === 'Flower + Pre-Rolls'
          && screenOne.categoryIds?.length === 2
          && screenOne.layout === 'grid';
        if (message.type === 'config' && message.payload?.fontSize === 'large' && message.payload.fontScale === 135 && message.payload.layout === 'grid' && message.payload.pageDurationSeconds === 15 && message.payload.smoothScrollSpeed === 55 && message.payload.pageTransition === 'none' && message.payload.smoothProductScroll === false && hasScreenConfig) resolve();
      });
    });
    const bothTVsUpdated = Promise.all([waitForLargeGrid(tvOne), waitForLargeGrid(tvTwo)]);

    phone.send(JSON.stringify({ type: 'config_update', payload: { fontSize: 'large' } }));
    phone.send(JSON.stringify({ type: 'config_update', payload: { layout: 'grid' } }));
    phone.send(JSON.stringify({ type: 'config_update', payload: { fontScale: 135 } }));
    phone.send(JSON.stringify({ type: 'config_update', payload: { pageDurationSeconds: 15 } }));
    phone.send(JSON.stringify({ type: 'config_update', payload: { smoothScrollSpeed: 55 } }));
    phone.send(JSON.stringify({ type: 'config_update', payload: { pageTransition: 'none' } }));
    phone.send(JSON.stringify({ type: 'config_update', payload: { smoothProductScroll: false } }));
    phone.send(JSON.stringify({ type: 'config_update', payload: { displayCount: 2, screens } }));
    await bothTVsUpdated;
    const persistedResponse = await authedFetch(`/api/export/${sessionId}`, cookie);
    expect(persistedResponse.status).toBe(200);
    const persisted = (await persistedResponse.json()) as {
      displayCount: number;
      screens: Array<{ id: string; name: string; categoryIds: string[]; layout?: string }>;
      smoothProductScroll: boolean;
      smoothScrollSpeed: number;
    };
    expect(persisted.displayCount).toBe(2);
    expect(persisted.smoothProductScroll).toBe(false);
    expect(persisted.smoothScrollSpeed).toBe(55);
    expect(persisted.screens.slice(0, 2)).toEqual([
      { id: 'screen-1', name: 'Flower + Pre-Rolls', categoryIds: [flowerId, preRollId], layout: 'grid' },
      { id: 'screen-2', name: 'Vapes', categoryIds: [vapeId], layout: 'list' },
    ]);

    const waitForSparseScreens = new Promise<void>((resolve) => {
      tvOne.addEventListener('message', (event) => {
        const message = JSON.parse(String(event.data)) as {
          type?: string;
          payload?: {
            displayCount?: number;
            screens?: Array<{ id?: string; name?: string; categoryIds?: string[]; layout?: string }>;
          };
        };
        const screenOne = message.payload?.screens?.[0];
        const screenTwo = message.payload?.screens?.[1];
        if (
          message.type === 'config'
          && message.payload?.displayCount === 2
          && screenOne?.id === 'screen-1'
          && screenOne.name === 'Display 1'
          && screenTwo?.id === 'screen-2'
          && screenTwo.name === 'Sparse Vapes'
          && screenTwo.layout === 'list'
        ) resolve();
      });
    });
    phone.send(JSON.stringify({
      type: 'config_update',
      payload: {
        screens: [{ id: 'screen-2', name: 'Sparse Vapes', categoryIds: [vapeId], layout: 'list' }],
      },
    }));
    await waitForSparseScreens;
    const sparsePersisted = (await (await authedFetch(`/api/export/${sessionId}`, cookie)).json()) as {
      displayCount: number;
      screens: Array<{ id: string; name: string; categoryIds: string[]; layout?: string }>;
    };
    expect(sparsePersisted.screens.slice(0, 2)).toEqual([
      { id: 'screen-1', name: 'Display 1', categoryIds: [] },
      { id: 'screen-2', name: 'Sparse Vapes', categoryIds: [vapeId], layout: 'list' },
    ]);

    const waitForOrderedValidation = new Promise<void>((resolve) => {
      tvOne.addEventListener('message', (event) => {
        const message = JSON.parse(String(event.data)) as {
          type?: string;
          payload?: { displayCount?: number; pageTransition?: string };
        };
        if (
          message.type === 'config'
          && message.payload?.displayCount === 2
          && message.payload.pageTransition === 'fade'
        ) resolve();
      });
    });
    phone.send(JSON.stringify({ type: 'config_update', payload: { displayCount: 2.5 } }));
    phone.send(JSON.stringify({ type: 'config_update', payload: { pageTransition: 'fade' } }));
    await waitForOrderedValidation;
    const validatedPersisted = (await (await authedFetch(`/api/export/${sessionId}`, cookie)).json()) as {
      displayCount: number;
    };
    expect(validatedPersisted.displayCount).toBe(2);

    tvOne.close(1000, 'test complete');
    tvTwo.close(1000, 'test complete');
    phone.close(1000, 'test complete');
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
