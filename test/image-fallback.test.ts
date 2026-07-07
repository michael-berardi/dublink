import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const BASE = 'https://dubmenu.com';

describe('product image fallback in rendered pages', () => {
  it('TV page includes the image fallback handler and premium placeholders', async () => {
    const sessionId = 'IMG-FALLBACK-TV-' + Date.now().toString(36);
    const res = await SELF.fetch(`${BASE}/tv/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('dubmenuImgFallback');
    expect(html).toContain('onerror="window.dubmenuImgFallback(this)"');
    // Placeholder icons should be the branded, category-specific SVGs.
    expect(html).toContain('placeholder-icon');
    // Product-level deterministic variant classes should be present.
    expect(html).toContain('placeholder-v');
    expect(html).toContain('data-variant=');
    // Clean placeholders: no decorative overlays or gradient/glow artifacts.
    expect(html).not.toContain('placeholder-variant-overlay');
    expect(html).not.toContain('variant-overlay-shape');
    expect(html).not.toContain('linearGradient');
  });

  it('menu page includes the image fallback handler and premium placeholders', async () => {
    const sessionId = 'IMG-FALLBACK-MENU-' + Date.now().toString(36);
    const res = await SELF.fetch(`${BASE}/menu/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('dubmenuImgFallback');
    expect(html).toContain('onerror="window.dubmenuImgFallback(this)"');
    expect(html).toContain('placeholder-icon');
    expect(html).toContain('placeholder-v');
    expect(html).toContain('data-variant=');
    // Clean placeholders: no decorative overlays or gradient/glow artifacts.
    expect(html).not.toContain('placeholder-variant-overlay');
    expect(html).not.toContain('variant-overlay-shape');
    expect(html).not.toContain('linearGradient');
  });
});
