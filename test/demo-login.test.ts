import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const BASE = 'https://dubmenu.com';
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const DEMO_TOKEN = 'test-demo-secret';

async function demoLogin(next: string, token: string): Promise<{ cookie?: string; location: string | null; status: number; response: Response }> {
  const form = new FormData();
  form.set('token', token);
  form.set('next', next);
  const res = await SELF.fetch(`${BASE}/demo-login`, {
    method: 'POST',
    body: form,
    redirect: 'manual',
    headers: { Origin: BASE },
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/dubmenu_auth=([^;]+)/);
  return {
    cookie: match ? match[1] : undefined,
    location: res.headers.get('location'),
    status: res.status,
    response: res,
  };
}

describe('demo-login route', () => {
  it('GET /demo-login preserves next in the form', async () => {
    const res = await SELF.fetch(`${BASE}/demo-login?next=%2Fconfig%2FABC123`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('/demo-login');
    expect(html).toContain('<input type="hidden" name="next" value="/config/ABC123">');
    expect(html).toContain('name="token"');
  });

  it('POST with wrong demo token fails and does not set a cookie', async () => {
    const { status, cookie, location } = await demoLogin('/config/ABC123', 'wrong-token');
    expect(status).toBe(200);
    expect(cookie).toBeUndefined();
    expect(location).toBeNull();
  });

  it('POST with valid demo token sets cookie and redirects to next', async () => {
    const { status, cookie, location } = await demoLogin('/config/ABC123', DEMO_TOKEN);
    expect(status).toBe(302);
    expect(cookie).toBeDefined();
    expect(location).toContain('/config/ABC123');
  });

  it('POST rejects external next URLs and falls back to account', async () => {
    const { location } = await demoLogin('https://evil.com/phishing', DEMO_TOKEN);
    expect(location).toContain('/account');
    expect(location).not.toContain('evil.com');
  });
});

describe('QR scan → demo auth flow', () => {
  it('/config/:session?demo=1 unauthenticated redirects to /demo-login preserving next', async () => {
    const sessionId = `DEMO-${unique()}`;
    const res = await SELF.fetch(`${BASE}/config/${sessionId}?demo=1`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    const location = res.headers.get('location') || '';
    expect(location).toContain('/demo-login');
    expect(location).toContain(encodeURIComponent(`/config/${sessionId}`));
    expect(location).not.toContain('dubhaven.com');
  });

  it('completes demo login and claims the scanned session', async () => {
    const sessionId = `DEMO-${unique()}`;
    const { cookie } = await demoLogin(`/config/${sessionId}?demo=1`, DEMO_TOKEN);
    expect(cookie).toBeDefined();

    // Config page is now accessible and claims the session.
    const configRes = await SELF.fetch(`${BASE}/config/${sessionId}?demo=1`, {
      headers: { Cookie: `dubmenu_auth=${cookie}` },
      redirect: 'manual',
    });
    expect(configRes.status).toBe(200);
    const html = await configRes.text();
    expect(html).toContain('DubMenu Remote Control');

    // The session is owned by the demo account.
    const claimRes = await SELF.fetch(`${BASE}/api/claim/${sessionId}`, {
      method: 'POST',
      headers: { Cookie: `dubmenu_auth=${cookie}` },
    });
    expect(claimRes.status).toBe(200);
    const body = (await claimRes.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it('config mutation requires an authenticated account', async () => {
    const sessionId = `DEMO-${unique()}`;
    const res = await SELF.fetch(`${BASE}/api/claim/${sessionId}`, { method: 'POST' });
    expect(res.status).toBe(401);
  });
});
