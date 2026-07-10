import { env as workerEnv } from 'cloudflare:test';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { createCheckoutSession, safeEqual } from '../src/stripe';
import { claimStripeEvent, completeStripeEvent, releaseStripeEvent } from '../src/stats';
import worker from '../src/index';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('checkout idempotency', () => {
  it('coalesces concurrent checkout creation and sends per-account Stripe idempotency keys', async () => {
    const calls: Array<{ url: string; headers: Headers }> = [];
    globalThis.fetch = vi.fn(async (input: string | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      calls.push({ url, headers: new Headers(init?.headers) });
      if (url.endsWith('/customers')) return new Response(JSON.stringify({ id: 'cus_123' }), { status: 200 });
      return new Response(JSON.stringify({ id: 'cs_123', url: 'https://checkout.stripe.com/c/pay' }), { status: 200 });
    }) as unknown as typeof fetch;
    const env = { STRIPE_API_KEY: 'sk_test', STRIPE_PRICE_ID: 'price_123' } as Env;
    const options = {
      customerEmail: 'owner@example.com',
      successUrl: 'https://dubmenu.com/success',
      cancelUrl: 'https://dubmenu.com/account',
      clientReferenceId: 'account-123',
    };

    const [first, second] = await Promise.all([createCheckoutSession(env, options), createCheckoutSession(env, options)]);

    expect(first).toEqual(second);
    expect(calls).toHaveLength(2);
    expect(calls[0].headers.get('Idempotency-Key')).toContain('account-123');
    expect(calls[1].headers.get('Idempotency-Key')).toContain('account-123');
  });
});


describe('durable webhook idempotency', () => {
  it('releases failed claims and permanently rejects completed events', async () => {
    const eventId = `evt_durable_${crypto.randomUUID()}`;
    expect(await claimStripeEvent(workerEnv, eventId)).toBe(true);
    expect(await claimStripeEvent(workerEnv, eventId)).toBe(false);
    await releaseStripeEvent(workerEnv, eventId);
    expect(await claimStripeEvent(workerEnv, eventId)).toBe(true);
    await completeStripeEvent(workerEnv, eventId);
    expect(await claimStripeEvent(workerEnv, eventId)).toBe(false);
  });

  it('reclaims processing leases after a worker dies', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-09T12:00:00Z'));
    const eventId = `evt_lease_${crypto.randomUUID()}`;
    expect(await claimStripeEvent(workerEnv, eventId)).toBe(true);
    expect(await claimStripeEvent(workerEnv, eventId)).toBe(false);
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(await claimStripeEvent(workerEnv, eventId)).toBe(true);
    await releaseStripeEvent(workerEnv, eventId);
  });
});

describe('webhook retry handling', () => {
  it('does not mark a Stripe event processed until account updates succeed', async () => {
    const secret = 'whsec_retry_test';
    const event = {
      id: `evt_retry_${crypto.randomUUID()}`,
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'account-123', customer: 'cus_123', subscription: 'sub_123' } },
    };
    const payload = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
    const hex = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
    let subscriptionAttempts = 0;
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/subscriptions/sub_123')) {
        subscriptionAttempts++;
        if (subscriptionAttempts === 1) return new Response(JSON.stringify({ error: { message: 'temporary failure' } }), { status: 500 });
        return new Response(JSON.stringify({ id: 'sub_123', status: 'active' }), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    }) as unknown as typeof fetch;
    const accountStub = { fetch: vi.fn(async () => new Response(JSON.stringify({ account: { id: 'account-123' } }), { status: 200 })) };
    const accountNamespace = { idFromName: () => ({}), get: () => accountStub } as unknown as DurableObjectNamespace;
    const stripeEventStates = new Map<string, 'processing' | 'processed'>();
    const statsStub = { fetch: vi.fn(async (request: Request) => {
      const { pathname } = new URL(request.url);
      if (pathname === '/record') return new Response(JSON.stringify({ ok: true }), { status: 200 });
      const body = (await request.json()) as { eventId: string };
      if (pathname === '/stripe-event/claim') {
        if (stripeEventStates.has(body.eventId)) return new Response(JSON.stringify({ claimed: false }), { status: 200 });
        stripeEventStates.set(body.eventId, 'processing');
        return new Response(JSON.stringify({ claimed: true }), { status: 200 });
      }
      if (pathname === '/stripe-event/complete') stripeEventStates.set(body.eventId, 'processed');
      if (pathname === '/stripe-event/release') stripeEventStates.delete(body.eventId);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) };
    const statsNamespace = { idFromName: () => ({}), get: () => statsStub } as unknown as DurableObjectNamespace;
    const env = {
      STRIPE_API_KEY: 'sk_test',
      STRIPE_WEBHOOK_SECRET: secret,
      ACCOUNTS: accountNamespace,
      SESSION: accountNamespace,
      STATS: statsNamespace,
    } as unknown as Env;
    const request = () => new Request('https://dubmenu.com/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${timestamp},v1=${hex}` },
      body: payload,
    });

    expect((await worker.fetch(request(), env, {} as ExecutionContext)).status).toBe(500);
    const retry = await worker.fetch(request(), env, {} as ExecutionContext);
    expect(retry.status).toBe(200);
    await expect(retry.json()).resolves.toEqual({ received: true });
    expect(subscriptionAttempts).toBe(2);
    const duplicate = await worker.fetch(request(), env, {} as ExecutionContext);
    expect(duplicate.status).toBe(200);
    await expect(duplicate.json()).resolves.toEqual({ received: true, duplicate: true });
    expect(subscriptionAttempts).toBe(2);
  });
});

describe('safeEqual', () => {
  it('returns true for identical strings', () => {
    expect(safeEqual('abc123', 'abc123')).toBe(true);
  });

  it('returns false for different strings of equal length', () => {
    expect(safeEqual('abc123', 'abc124')).toBe(false);
  });

  it('returns false for strings of different lengths', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(safeEqual('', '')).toBe(true);
    expect(safeEqual('', 'a')).toBe(false);
  });

  it('handles hex signatures', () => {
    const sig = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
    expect(safeEqual(sig, sig)).toBe(true);
    expect(safeEqual(sig, sig.slice(0, -1) + '0')).toBe(false);
  });
});
