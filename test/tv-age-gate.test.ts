import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';
import { tvPage } from '../src/html-tv';

describe('TV age gate bypass', () => {
  it('tvPage hides the age gate when noAgeGate is set', () => {
    const html = tvPage('test-session', 'https://dubmenu.com', { noAgeGate: true });
    expect(html).toContain('id="age-gate"');
    expect(html).toMatch(/class="age-gate hidden"/);
  });

  it('tvPage keeps the age gate visible without the option', () => {
    const html = tvPage('test-session', 'https://dubmenu.com');
    expect(html).toContain('id="age-gate"');
    expect(html).not.toMatch(/class="age-gate hidden"/);
  });

  it('public /tv/:session renders with the age gate hidden by default', async () => {
    const res = await SELF.fetch('https://dubmenu.com/tv/test-session');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('id="age-gate"');
    expect(html).toMatch(/class="age-gate hidden"/);
  });
});
