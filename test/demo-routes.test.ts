import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';
import { createDemoConfig } from '../src/starter-template';

describe('demo route fallback', () => {
  it('/menu/demo renders representative demo products', async () => {
    const res = await SELF.fetch('https://dubmenu.com/menu/demo');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('DubMenu Demo Dispensary');
    expect(html).toContain('OG Kush');
    expect(html).toContain('Blue Dream');
    expect(html).toContain('Flower');
    expect(html).toContain('Edibles');
    expect(html).toContain('placeholder-art');
    expect(html).toContain('This is a demo menu for visual QA');
  });

  it('/tv/demo renders the menu board phase immediately', async () => {
    const res = await SELF.fetch('https://dubmenu.com/tv/demo');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('DubMenu Demo Dispensary');
    expect(html).toContain('OG Kush');
    expect(html).toContain('Flower');
    // Pairing phase should be hidden when demo menu data is present.
    expect(html).toContain('id="pairing" class="phase" hidden');
    expect(html).toContain('id="menu" class="phase">');
  });

  it('/tv/demo includes the demo density marker so the board fills the screen', async () => {
    const res = await SELF.fetch('https://dubmenu.com/tv/demo');
    expect(res.status).toBe(200);
    const html = await res.text();
    // The demo config is tagged so the client can render a denser, premium default board.
    expect(html).toContain('"tvDemo":true');
    // Premium category header styling should be present.
    expect(html).toContain('cat-icon-wrap');
    expect(html).toContain('text-shadow');
  });

  it('createDemoConfig returns a full menu config with starter categories', () => {
    const config = createDemoConfig();
    expect(config.dispensaryName).toBe('DubMenu Demo Dispensary');
    expect(config.categories.length).toBeGreaterThan(0);
    expect(config.categories.some((cat) => cat.products.length > 0)).toBe(true);
    expect(config.disclaimer).toContain('demo menu');
  });

  it('/menu/:unowned still returns empty categories (no fake data leak)', async () => {
    const sessionId = `UNOWNED-${Date.now()}`;
    const res = await SELF.fetch(`https://dubmenu.com/menu/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).not.toContain('DubMenu Demo Dispensary');
    expect(html).toContain('No products found');
  });
});
