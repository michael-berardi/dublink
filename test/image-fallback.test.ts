import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const BASE = 'https://dubmenu.com';

describe('product image fallback in rendered pages', () => {
  it('TV page includes the image fallback handler and monochrome placeholders', async () => {
    const sessionId = 'IMG-FALLBACK-TV-' + Date.now().toString(36);
    const res = await SELF.fetch(`${BASE}/tv/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('dubmenuImgFallback');
    expect(html).toContain('onerror="window.dubmenuImgFallback(this)"');
    // Placeholder icon CSS should use the muted gray color, not the accent.
    expect(html).toMatch(/\.placeholder-icon\{[^}]*color:var\(--text-muted\)/);
    expect(html).not.toMatch(/\.placeholder-icon\{[^}]*color:var\(--accent\)/);
  });

  it('menu page includes the image fallback handler and monochrome placeholders', async () => {
    const sessionId = 'IMG-FALLBACK-MENU-' + Date.now().toString(36);
    const res = await SELF.fetch(`${BASE}/menu/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('dubmenuImgFallback');
    expect(html).toContain('onerror="window.dubmenuImgFallback(this)"');
    expect(html).toMatch(/\.placeholder-icon\{[^}]*color:var\(--text-muted\)/);
    expect(html).not.toMatch(/\.placeholder-icon\{[^}]*color:var\(--accent\)/);
  });
});
