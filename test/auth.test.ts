import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { shouldRedirectToHttps } from '../src/index';
import { accountIdFromEmail } from '../src/auth';

describe('account identifiers', () => {
  it('does not collide for distinct addresses that share a legacy slug', async () => {
    await expect(accountIdFromEmail('a+b@example.com')).resolves.not.toBe(await accountIdFromEmail('a-b@example.com'));
  });

  it('is stable and case-insensitive for a normalized email', async () => {
    await expect(accountIdFromEmail(' Person@Example.COM ')).resolves.toBe(await accountIdFromEmail('person@example.com'));
  });
});

describe('post-login redirects', () => {
  it('does not treat protocol-relative next values as local paths', async () => {
    const form = new FormData();
    form.set('email', `redirect-${crypto.randomUUID()}@dubmenu-test.example`);
    form.set('password', 'test-password-1234');
    form.set('next', '//evil.example/steal');
    const res = await SELF.fetch('https://dubmenu.com/api/signup', { method: 'POST', body: form, redirect: 'manual' });
    expect(res.status).toBe(302);
    const location = res.headers.get('location') || '';
    expect(new URL(location).pathname).toBe('/account');
    expect(location).not.toContain('evil.example');
  });
});

describe('auth gates', () => {
  it('blocks /api/sessions when unauthenticated', async () => {
    const res = await SELF.fetch('https://dubmenu.com/api/sessions');
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Unauthorized');
  });

  it('blocks /admin when unauthenticated', async () => {
    const res = await SELF.fetch('https://dubmenu.com/admin', { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/login');
  });
});

describe('public pages', () => {
  it('serves the homepage', async () => {
    const res = await SELF.fetch('https://dubmenu.com/');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('DubMenu');
  });

  it('serves the TV page', async () => {
    const res = await SELF.fetch('https://dubmenu.com/tv/testsession123');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('DubMenu TV');
    expect(text).toContain("location.origin.replace(/^http/, 'ws')");
  });

  it('keeps local development requests on HTTP while redirecting production HTTP', async () => {
    const local = await SELF.fetch('http://127.0.0.1:8792/api/health', { redirect: 'manual' });
    expect(local.status).toBe(200);

    expect(shouldRedirectToHttps(new URL('http://127.0.0.1:8792/api/health'), '127.0.0.1:8792', 'https://dubmenu.com')).toBe(false);
    expect(shouldRedirectToHttps(new URL('http://dubmenu.com/api/health'), 'dubmenu.com', 'https://dubmenu.com')).toBe(true);
    expect(shouldRedirectToHttps(new URL('https://dubmenu.com/api/health'), 'dubmenu.com', 'https://dubmenu.com')).toBe(false);
  });

  it('serves a browser favicon on both product domains', async () => {
    for (const origin of ['https://dubmenu.com', 'https://tv.dubmenu.com']) {
      const res = await SELF.fetch(`${origin}/favicon.ico`, { redirect: 'manual' });
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('image/svg+xml');
      expect(new TextDecoder().decode(await res.arrayBuffer())).toContain('<svg');
    }
  });

  it('uses a real H1 on the signup and login forms', async () => {
    const signup = await (await SELF.fetch('https://dubmenu.com/signup')).text();
    expect(signup).toContain('<h1 class="card-title">Create Account</h1>');

    const login = await (await SELF.fetch('https://dubmenu.com/login')).text();
    expect(login).toContain('<h1 class="card-title">Log In</h1>');
  });

  it('allows browser and pinch zoom on authentication forms', async () => {
    for (const path of ['/login', '/signup', '/demo-login']) {
      const html = await (await SELF.fetch(`https://dubmenu.com${path}`)).text();
      expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
      expect(html).not.toContain('maximum-scale');
      expect(html).not.toContain('user-scalable=no');
    }
  });

  it('links the legal pages from the homepage footer', async () => {
    const html = await (await SELF.fetch('https://dubmenu.com/')).text();
    expect(html).toMatch(/href="[^"]+\/privacy"/);
    expect(html).toMatch(/href="[^"]+\/terms"/);
  });

  it('links the DubHaven product and service ecosystem from public marketing pages', async () => {
    for (const path of ['/', '/about', '/contact']) {
      const html = await (await SELF.fetch(`https://dubmenu.com${path}`)).text();
      expect(html).toContain('https://dubhaven.com');
      expect(html).toContain('https://dubledger.com');
      expect(html).toContain('https://dubhaven.com/services/web-and-seo');
      expect(html).toContain('rel="noopener noreferrer"');
    }
  });
});
