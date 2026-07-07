import { describe, it, expect, vi } from 'vitest';
import { SELF } from 'cloudflare:test';
import {
  signDubHavenToken,
  verifyDubHavenToken,
  buildDubHavenAuthUrl,
  handleDubHavenCallback,
  isDubHavenStartConfigured,
  isDubHavenCallbackConfigured,
  DubHavenEnv,
} from '../src/dubhaven-auth';

const TEST_SECRET = 'a'.repeat(32);
const AUTH_SECRET = 'b'.repeat(32);

function makeEnv(overrides: Partial<DubHavenEnv> = {}): DubHavenEnv {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SESSION: undefined as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ACCOUNTS: undefined as any,
    AUTH_SECRET,
    DUBHAVEN_AUTH_URL: 'https://dubhaven.com/api/auth/google',
    DUBHAVEN_ACCOUNT_SECRET: TEST_SECRET,
    ...overrides,
  } as DubHavenEnv;
}

function makeAccountsMock(existing: Record<string, unknown> | null = null) {
  const stub = {
    fetch: vi.fn(async (req: Request) => {
      if (req.url.endsWith('/upsert-dubhaven')) {
        const body = (await req.json()) as Record<string, unknown>;
        const account = existing || {
          id: body.id,
          email: body.email,
          dubhavenAccountId: body.dubhavenAccountId,
          googleSubject: body.googleSubject,
          googleEmail: body.googleEmail,
          name: body.name,
          picture: body.picture,
          subscriptionStatus: 'trialing',
          sessions: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return new Response(JSON.stringify({ account, isNew: !existing }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }),
  };
  return {
    idFromName: vi.fn(() => ({ toString: () => 'id' }) as unknown),
    get: vi.fn(() => stub),
  };
}

function makeIdentity(overrides: Partial<Parameters<typeof signDubHavenToken>[0]> = {}) {
  return {
    accountId: 'dh-123',
    email: 'test@example.com',
    googleSub: 'g-1',
    name: 'Test User',
    picture: 'https://example.com/pic.png',
    product: 'dubmenu',
    nonce: 'nonce-1',
    returnTo: 'https://dubmenu.com/account',
    ...overrides,
  };
}

describe('dubhaven-auth unit', () => {
  it('signs and verifies a DubHaven identity token', async () => {
    const token = await signDubHavenToken(makeIdentity({ email: 'Test@Example.com' }), TEST_SECRET);
    expect(token.split('.')).toHaveLength(3);
    const identity = await verifyDubHavenToken(token, TEST_SECRET);
    expect(identity).toMatchObject({
      accountId: 'dh-123',
      email: 'test@example.com',
      googleSub: 'g-1',
      name: 'Test User',
      picture: 'https://example.com/pic.png',
      product: 'dubmenu',
    });
  });

  it('rejects a tampered token', async () => {
    const token = await signDubHavenToken(makeIdentity(), TEST_SECRET);
    const parsed = await verifyDubHavenToken(token + 'x', TEST_SECRET);
    expect(parsed).toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signDubHavenToken(makeIdentity(), TEST_SECRET);
    const parsed = await verifyDubHavenToken(token, 'different-secret-32-characters');
    expect(parsed).toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await signDubHavenToken(makeIdentity(), TEST_SECRET, { expiresInSeconds: -1 });
    const parsed = await verifyDubHavenToken(token, TEST_SECRET);
    expect(parsed).toBeNull();
  });

  it('rejects a token with wrong product', async () => {
    const token = await signDubHavenToken(makeIdentity({ product: 'dubledger' }), TEST_SECRET);
    const parsed = await verifyDubHavenToken(token, TEST_SECRET);
    expect(parsed).toBeNull();
  });
});

describe('dubhaven auth url builder', () => {
  it('builds DubHaven SSO URL with product and callback', async () => {
    const env = makeEnv();
    const url = await buildDubHavenAuthUrl(env, 'https://dubmenu.com', '/config/abc');
    const parsed = new URL(url);
    expect(parsed.hostname).toBe('dubhaven.com');
    expect(parsed.pathname).toBe('/api/auth/google');
    expect(parsed.searchParams.get('product')).toBe('dubmenu');
    const redirect = new URL(parsed.searchParams.get('redirect') || '');
    expect(redirect.pathname).toBe('/auth/dubhaven/callback');
    expect(redirect.searchParams.get('next')).toBe('/config/abc');
  });

  it('refuses to build a DubHaven SSO URL for localhost origins', () => {
    const env = makeEnv();
    expect(() => buildDubHavenAuthUrl(env, 'http://127.0.0.1:8792', '/config/abc')).toThrow('DubHaven auth is not configured');
    expect(() => buildDubHavenAuthUrl(env, 'http://localhost:8787', '/config/abc')).toThrow('DubHaven auth is not configured');
  });

  it('is configured when DubHaven URL defaults and callback secret is present', () => {
    const env = makeEnv();
    expect(isDubHavenStartConfigured(env)).toBe(true);
    expect(isDubHavenCallbackConfigured(env)).toBe(true);
  });

  it('is not start-configured for local origins even with default URL', () => {
    const env = makeEnv();
    expect(isDubHavenStartConfigured(env, 'http://127.0.0.1:8792')).toBe(false);
    expect(isDubHavenStartConfigured(env, 'http://localhost:8787')).toBe(false);
    expect(isDubHavenStartConfigured(env, 'http://0.0.0.0:3000')).toBe(false);
  });

  it('is start-configured for non-local origins with default URL', () => {
    const env = makeEnv();
    expect(isDubHavenStartConfigured(env, 'https://dubmenu.com')).toBe(true);
    expect(isDubHavenStartConfigured(env, 'https://www.dubmenu.com')).toBe(true);
  });

  it('is not callback-configured when account secret is missing', () => {
    const env = makeEnv({ DUBHAVEN_ACCOUNT_SECRET: undefined });
    expect(isDubHavenStartConfigured(env)).toBe(true);
    expect(isDubHavenCallbackConfigured(env)).toBe(false);
  });
});

describe('dubhaven callback handler', () => {
  it('issues a local session and redirects on a valid token', async () => {
    const env = makeEnv({ ACCOUNTS: makeAccountsMock() as unknown });
    const token = await signDubHavenToken(
      makeIdentity({ email: 'Test@Example.com' }),
      TEST_SECRET
    );
    const req = new Request(
      `https://dubmenu.com/auth/dubhaven/callback?token=${encodeURIComponent(token)}&next=%2Fconfig%2Fabc`
    );
    const result = await handleDubHavenCallback(req, env, 'https://dubmenu.com', true);
    expect(result.response.status).toBe(302);
    expect(result.response.headers.get('location')).toBe('/config/abc');
    const cookie = result.response.headers.get('set-cookie') || '';
    expect(cookie).toContain('dubmenu_auth=');
    expect(result.account).not.toBeNull();
    expect(result.account?.dubhavenAccountId).toBe('dh-123');
    expect(result.account?.email).toBe('test@example.com');
    expect(result.isNew).toBe(true);
  });

  it('returns 400 when token is missing', async () => {
    const env = makeEnv();
    const req = new Request('https://dubmenu.com/auth/dubhaven/callback');
    const result = await handleDubHavenCallback(req, env, 'https://dubmenu.com', true);
    expect(result.response.status).toBe(400);
    expect(result.account).toBeNull();
  });

  it('returns 400 when token is invalid', async () => {
    const env = makeEnv();
    const req = new Request('https://dubmenu.com/auth/dubhaven/callback?token=invalid-token');
    const result = await handleDubHavenCallback(req, env, 'https://dubmenu.com', true);
    expect(result.response.status).toBe(400);
    expect(result.account).toBeNull();
  });

  it('returns 503 when callback is not configured', async () => {
    const env = makeEnv({ DUBHAVEN_ACCOUNT_SECRET: undefined });
    const token = await signDubHavenToken(makeIdentity(), TEST_SECRET);
    const req = new Request(`https://dubmenu.com/auth/dubhaven/callback?token=${encodeURIComponent(token)}`);
    const result = await handleDubHavenCallback(req, env, 'https://dubmenu.com', true);
    expect(result.response.status).toBe(503);
    expect(result.account).toBeNull();
  });
});

describe('dubhaven auth routes', () => {
  it('/auth/dubhaven redirects to DubHaven SSO with product and callback', async () => {
    const res = await SELF.fetch('https://dubmenu.com/auth/dubhaven?next=%2Fconfig%2Fabc', { redirect: 'manual' });
    expect(res.status).toBe(302);
    const location = res.headers.get('location') || '';
    expect(location).toContain('https://dubhaven.com/api/auth/google');
    expect(location).toContain('product=dubmenu');
    expect(location).toContain(encodeURIComponent('/auth/dubhaven/callback'));
  });

  it('localhost falls back to local login from /auth/dubhaven preserving next', async () => {
    const res = await SELF.fetch('http://127.0.0.1:8792/auth/dubhaven?next=%2Fconfig%2Fdemo', { redirect: 'manual' });
    expect(res.status).toBe(302);
    const location = res.headers.get('location') || '';
    expect(location).toBe('http://127.0.0.1:8792/login?next=%2Fconfig%2Fdemo');
    expect(location).not.toContain('dubhaven.com');
  });

  it('localhost /config/:id unauthenticated falls back to /login preserving next', async () => {
    const res = await SELF.fetch('http://127.0.0.1:8792/config/demo', { redirect: 'manual' });
    expect(res.status).toBe(302);
    const location = res.headers.get('location') || '';
    expect(location).toBe('http://127.0.0.1:8792/login?next=%2Fconfig%2Fdemo');
    expect(location).not.toContain('dubhaven.com');
    expect(location).not.toContain('/auth/dubhaven');
  });

  it('unauthenticated GET http://127.0.0.1/config/demo never reaches DubHaven and preserves next=/config/demo', async () => {
    // Following the redirect chain must land on the local login page and keep
    // the intended destination in the form. It must never reach the DubHaven
    // SSO endpoint, which would reject the localhost callback with
    // "Invalid redirect URL for product".
    const res = await SELF.fetch('http://127.0.0.1:8792/config/demo');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Log In');
    expect(html).toContain('/api/login');
    expect(html).toContain('<input type="hidden" name="next" value="/config/demo">');
    expect(html).not.toContain('dubhaven.com');
    expect(html).not.toContain('Invalid redirect URL for product');
  });

  it('localhost /tv/new unauthenticated falls back to /login preserving next', async () => {
    const res = await SELF.fetch('http://127.0.0.1:8792/tv/new', { redirect: 'manual' });
    expect(res.status).toBe(302);
    const location = res.headers.get('location') || '';
    expect(location).toBe('http://127.0.0.1:8792/login?next=%2Ftv%2Fnew');
  });

  it('localhost /account unauthenticated falls back to /login (no DubHaven redirect)', async () => {
    const res = await SELF.fetch('http://127.0.0.1:8792/account', { redirect: 'manual' });
    expect(res.status).toBe(302);
    const location = res.headers.get('location') || '';
    expect(location).toBe('http://127.0.0.1:8792/login');
  });

  it('localhost /login does not render the DubHaven SSO button', async () => {
    const res = await SELF.fetch('http://127.0.0.1:8792/login');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).not.toContain('/auth/dubhaven');
    expect(html).not.toContain('Sign in with DubHaven');
    expect(html).toContain('/api/login');
  });
});

it('no DubMenu-only Google OAuth route remains', async () => {
  const res = await SELF.fetch('https://dubmenu.com/auth/google', { redirect: 'manual' });
  expect(res.status).toBe(404);
});
