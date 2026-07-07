import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const BASE = 'https://dubmenu.com';
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

async function signupAccount(): Promise<{ cookie: string; email: string }> {
  const email = `qr-auth-${unique()}@dubmenu-test.example`;
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
  return { cookie: match[1], email };
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

describe('QR scan auth redirect flow', () => {
  it('login page preserves the next parameter in a hidden form field', async () => {
    const res = await SELF.fetch(`${BASE}/login?next=%2Fconfig%2FABC123`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<input type="hidden" name="next" value="/config/ABC123">');
  });

  it('signup page preserves the next parameter in a hidden form field', async () => {
    const res = await SELF.fetch(`${BASE}/signup?next=%2Fconfig%2FABC123`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<input type="hidden" name="next" value="/config/ABC123">');
  });

  it('signup without next redirects to account', async () => {
    const form = new FormData();
    form.set('email', `qr-auth-${unique()}@dubmenu-test.example`);
    form.set('password', 'test-password-1234');
    const res = await SELF.fetch(`${BASE}/api/signup`, {
      method: 'POST',
      body: form,
      redirect: 'manual',
    });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/account');
  });

  it('signup with next redirects to the intended config page and claims the session', async () => {
    const sessionId = `QR-${unique()}`;
    await signupAccount();

    const form = new FormData();
    form.set('email', `qr-auth-${unique()}@dubmenu-test.example`);
    form.set('password', 'test-password-1234');
    form.set('next', `/config/${sessionId}`);

    const res = await SELF.fetch(`${BASE}/api/signup`, {
      method: 'POST',
      body: form,
      redirect: 'manual',
    });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain(`/config/${sessionId}`);

    const signupCookie = res.headers.get('set-cookie') || '';
    const match = signupCookie.match(/dubmenu_auth=([^;]+)/);
    if (!match) throw new Error('signup did not set auth cookie');

    // Visiting /config/<sessionId> claims the session.
    const configRes = await authedFetch(`/config/${sessionId}`, match[1]);
    expect(configRes.status).toBe(200);

    const exportRes = await authedFetch(`/api/export/${sessionId}`, match[1]);
    expect(exportRes.status).toBe(200);
  });

  it('login with next redirects to the intended config page', async () => {
    const sessionId = `QR-LOGIN-${unique()}`;
    const { email } = await signupAccount();

    const form = new FormData();
    form.set('email', email);
    form.set('password', 'test-password-1234');
    form.set('next', `/config/${sessionId}`);

    const res = await SELF.fetch(`${BASE}/api/login`, {
      method: 'POST',
      body: form,
      redirect: 'manual',
    });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain(`/config/${sessionId}`);
  });

  it('rejects external next URLs and falls back to account', async () => {
    const form = new FormData();
    form.set('email', `qr-auth-${unique()}@dubmenu-test.example`);
    form.set('password', 'test-password-1234');
    form.set('next', 'https://evil.com/phishing');

    const res = await SELF.fetch(`${BASE}/api/signup`, {
      method: 'POST',
      body: form,
      redirect: 'manual',
    });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/account');
    expect(res.headers.get('location')).not.toContain('evil.com');
  });
});

describe('phone WebSocket mutation errors', () => {
  it('returns an error message when a phone tries to mutate an unowned session', async () => {
    const { cookie } = await signupAccount();
    const sessionId = `WS-UNOWNED-${unique()}`;

    const res = await SELF.fetch(`${BASE}/ws/${sessionId}?role=phone`, {
      headers: { Upgrade: 'websocket', Cookie: `dubmenu_auth=${cookie}` },
    });
    expect(res.status).toBe(101);
    const client = res.webSocket;
    if (!client) throw new Error('expected phone WebSocket');

    const errorMsg = await new Promise<{ type: string; payload?: string }>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('websocket timeout')), 5000);
      client.addEventListener('message', (ev) => {
        const msg = JSON.parse(ev.data as string);
        if (msg.type === 'error') {
          clearTimeout(timer);
          resolve(msg);
        }
      });
      client.accept();
      client.send(JSON.stringify({ type: 'join', payload: { role: 'phone' } }));
      client.send(JSON.stringify({ type: 'config_update', payload: { dispensaryName: 'Should fail' } }));
    });

    expect(errorMsg.type).toBe('error');
    expect(errorMsg.payload).toMatch(/unable to update/i);
    client.close();
  });
});
