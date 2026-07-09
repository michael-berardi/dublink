import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { shouldRedirectToHttps } from '../src/index';

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
});
