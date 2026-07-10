import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../src/index';
import { DomainDurableObject } from '../src/domains';

function domainState(): DurableObjectState {
  let stored: unknown;
  return {
    storage: {
      get: vi.fn(async () => stored),
      put: vi.fn(async (_key: string, value: unknown) => { stored = value; }),
    },
  } as unknown as DurableObjectState;
}

async function addDomain(domains: DomainDurableObject, domain = 'Menu.Customer.com.'): Promise<{ verificationToken: string }> {
  const response = await domains.fetch(new Request('https://internal/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, sessionId: 'SESSION-1', accountId: 'account-1' }),
  }));
  expect(response.status).toBe(200);
  const body = await response.json() as { mapping: { domain: string; verificationToken: string } };
  expect(body.mapping.domain).toBe('menu.customer.com');
  return body.mapping;
}

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('custom domain normalization and verification', () => {
  it.each(['https://customer.com/path', 'customer.com:8443', '*.customer.com', '127.0.0.1', 'localhost', 'customer.local', 'dubmenu.com'])('rejects invalid public custom domain %s', async (domain) => {
    const domains = new DomainDurableObject(domainState());
    const response = await domains.fetch(new Request('https://internal/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, sessionId: 'SESSION-1', accountId: 'account-1' }),
    }));
    expect(response.status).toBe(400);
  });

  it('keeps a mapping unverified when the public challenge does not match', async () => {
    const domains = new DomainDurableObject(domainState());
    await addDomain(domains);
    globalThis.fetch = vi.fn(async () => new Response('wrong-token', { status: 200 })) as unknown as typeof fetch;
    const response = await domains.fetch(new Request('https://internal/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'MENU.CUSTOMER.COM', accountId: 'account-1' }),
    }));
    expect(response.status).toBe(409);
    const lookup = await domains.fetch(new Request('https://internal/lookup?domain=menu.customer.com'));
    await expect(lookup.json()).resolves.toMatchObject({ mapping: { verified: false } });
  });

  it('activates a mapping only after the public challenge returns its token', async () => {
    const domains = new DomainDurableObject(domainState());
    const mapping = await addDomain(domains);
    globalThis.fetch = vi.fn(async () => new Response(mapping.verificationToken, { status: 200 })) as unknown as typeof fetch;
    const response = await domains.fetch(new Request('https://internal/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'menu.customer.com', accountId: 'account-1' }),
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ mapping: { verified: true } });
  });
});

describe('custom domain rendering', () => {
  it('rejects unverified mappings instead of serving a menu', async () => {
    const domainStub = { fetch: vi.fn(async () => new Response(JSON.stringify({ mapping: { domain: 'menu.customer.com', sessionId: 'SESSION-1', verified: false, verificationToken: 'token' } }), { headers: { 'Content-Type': 'application/json' } })) };
    const env = { DOMAINS: { idFromName: () => ({}), get: () => domainStub } } as unknown as Env;
    const response = await worker.fetch(new Request('https://menu.customer.com/'), env, {} as ExecutionContext);
    expect(response.status).toBe(404);
  });

  it('preloads saved menu config for a verified custom-domain display', async () => {
    const domainStub = { fetch: vi.fn(async () => new Response(JSON.stringify({ mapping: { domain: 'menu.customer.com', sessionId: 'SESSION-1', verified: true, verificationToken: 'token' } }), { headers: { 'Content-Type': 'application/json' } })) };
    const sessionStub = { fetch: vi.fn(async () => new Response(JSON.stringify({ dispensaryName: 'Saved Customer Menu', categories: [{ id: 'flower', name: 'Flower', order: 0, products: [{ id: 'p1', name: 'Saved OG', price: 20, inStock: true }] }] }), { headers: { 'Content-Type': 'application/json' } })) };
    const env = {
      DOMAINS: { idFromName: () => ({}), get: () => domainStub },
      SESSION: { idFromName: () => ({}), get: () => sessionStub },
    } as unknown as Env;
    const response = await worker.fetch(new Request('https://menu.customer.com/'), env, {} as ExecutionContext);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('Saved Customer Menu');
    expect(html).toContain('Saved OG');
  });
});
