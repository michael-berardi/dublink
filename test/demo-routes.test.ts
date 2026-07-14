import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';
import { createDemoConfig } from '../src/starter-template';

describe('demo route fallback', () => {
  it('/menu/demo renders representative demo products', async () => {
    const res = await SELF.fetch('https://dubmenu.com/menu/demo');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Simply Green');
    expect(html).toContain('OG Kush');
    expect(html).toContain('Blue Dream');
    expect(html).toContain('Flower');
    expect(html).toContain('Edibles');
    expect(html).toContain('placeholder-art');
    expect(html).toContain('used with permission for visual QA');
  });

  it('/tv/demo renders the menu board phase immediately', async () => {
    const res = await SELF.fetch('https://dubmenu.com/tv/demo');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Simply Green');
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

  it('createDemoConfig returns the Simply Green demo menu config', () => {
    const config = createDemoConfig();
    expect(config.dispensaryName).toBe('Simply Green');
    expect(config.categories.length).toBeGreaterThan(0);
    expect(config.categories.some((cat) => cat.products.length > 0)).toBe(true);
    expect(config.disclaimer).toContain('used with permission');
    for (const category of config.categories) {
      for (const product of category.products) {
        expect(product.name.toLowerCase().endsWith(` ${product.weight?.toLowerCase()}`)).toBe(false);
      }
    }
    const products = config.categories.flatMap((category) => category.products);
    expect(products.find((product) => product.name === 'CBD Balm')).toMatchObject({ cbd: '200mg', thc: undefined });
    expect(products.find((product) => product.name === 'CBD Cartridge')?.cbd).toBe('80%');
    expect(products.find((product) => product.name === 'CBD Tincture')?.cbd).toBe('500mg');
    const imageSetsByCategory = Object.fromEntries(
      config.categories.map((category) => [category.name, new Set(category.products.map((product) => product.image))]),
    );
    expect(Object.fromEntries(
      Object.entries(imageSetsByCategory).map(([categoryName, images]) => [categoryName, images.size]),
    )).toEqual({
      Flower: 1,
      'Pre-Rolls': 1,
      Vapes: 2,
      Concentrates: 1,
      Edibles: 2,
      Tinctures: 1,
      Topicals: 1,
    });
    const assignedImages = Object.values(imageSetsByCategory).flatMap((images) => [...images]);
    expect(new Set(assignedImages).size).toBe(assignedImages.length);
  });

  it('/menu/:unowned still returns empty categories (no fake data leak)', async () => {
    const sessionId = `UNOWNED-${Date.now()}`;
    const res = await SELF.fetch(`https://dubmenu.com/menu/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).not.toContain('Simply Green');
    expect(html).toContain('No products found');
  });

  it('routes the pSEO free-trial CTA to signup instead of the TV demo', async () => {
    const res = await SELF.fetch('https://dubmenu.com/digital-menu-board-for-cannabis-dispensary');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('href="https://dubmenu.com/signup">Start Your Free Trial</a>');
    expect(html).not.toContain('href="https://tv.dubmenu.com/tv/demo" target="_blank">Start Your Free Trial</a>');
  });
});
