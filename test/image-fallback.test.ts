import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const BASE = 'https://dubmenu.com';

describe('product image fallback in rendered pages', () => {
  it('TV page converts broken product images to text-only cards', async () => {
    const sessionId = 'IMG-FALLBACK-TV-' + Date.now().toString(36);
    const res = await SELF.fetch(`${BASE}/tv/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('dubmenuImgFallback');
    expect(html).toContain('onerror="window.dubmenuImgFallback(this)"');
    expect(html).toContain("card.classList.remove('has-image')");
    expect(html).toContain("card.classList.add('no-image')");
    expect(html).toContain('removeChild(img)');
    expect(html).not.toContain('card-image-placeholder');
    expect(html).not.toContain('placeholder-icon');
    expect(html).not.toContain('placeholder-v');
    expect(html).not.toContain('linearGradient');
  });

  it('menu page converts broken remote product images to text-only cards', async () => {
    const sessionId = 'IMG-FALLBACK-MENU-' + Date.now().toString(36);
    const res = await SELF.fetch(`${BASE}/menu/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('dubmenuImgFallback');
    expect(html).toContain('onerror="window.dubmenuImgFallback(this)"');
    expect(html).toContain("card.classList.add('no-image')");
    expect(html).toContain('removeChild(wrap)');
    expect(html).not.toContain("replaceChild(wrap, img)");
  });
});
