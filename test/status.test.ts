import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

describe('health', () => {
  it('returns ok from /api/health', async () => {
    const res = await SELF.fetch('https://dubmenu.com/api/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });
});

describe('status', () => {
  it('returns a healthy status page', async () => {
    const res = await SELF.fetch('https://dubmenu.com/status');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('DubMenu System Status');
  });
});
