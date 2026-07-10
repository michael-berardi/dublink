import { SELF } from 'cloudflare:test';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { getStatus, type StatusEnv } from '../src/status';

const originalFetch = globalThis.fetch;
const namespace = {
  idFromName: () => ({}) as DurableObjectId,
  get: () => ({ fetch: async () => new Response(null, { status: 200 }) }),
} as unknown as DurableObjectNamespace;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function statusEnv(overrides: Partial<StatusEnv> = {}): StatusEnv {
  return {
    SESSION: namespace,
    ACCOUNTS: namespace,
    AUTH_SECRET: 'auth-secret',
    STRIPE_API_KEY: 'stripe-key',
    STRIPE_PRICE_ID: 'price_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_123',
    APP_URL: 'https://dubmenu.com',
    ...overrides,
  };
}

describe('getStatus billing readiness', () => {
  it.each([
    ['price ID', { STRIPE_PRICE_ID: undefined }],
    ['webhook secret', { STRIPE_WEBHOOK_SECRET: undefined }],
  ])('is unhealthy without the required Stripe %s', async (_label, overrides) => {
    globalThis.fetch = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 }))) as unknown as typeof fetch;
    const result = await getStatus(statusEnv(overrides));
    expect(result.healthy).toBe(false);
  });

  it('is healthy when every required billing setting and dependency is available', async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 }))) as unknown as typeof fetch;
    const result = await getStatus(statusEnv());
    expect(result.healthy).toBe(true);
  });
});

describe('health', () => {
  it('returns ok from /api/health', async () => {
    const res = await SELF.fetch('https://dubmenu.com/api/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });
});
describe('status', () => {
  it('returns the rendered status page with an unhealthy code when billing is incomplete', async () => {
    const res = await SELF.fetch('https://dubmenu.com/status');
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(text).toContain('DubMenu System Status');
  });
});
