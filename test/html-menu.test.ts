import { describe, it, expect } from 'vitest';
import { menuPage } from '../src/html-menu';
import { createDemoConfig } from '../src/starter-template';

describe('menuPage', () => {
  const sampleConfig = {
    dispensaryName: 'Test Dispensary',
    categories: [
      {
        id: 'cat-flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'p1', name: 'OG Kush', price: 45, inStock: true, image: 'https://example.com/og.jpg' },
          { id: 'p2', name: 'Blue Dream', price: 40, inStock: true },
        ],
      },
    ],
  };

  it('renders product images with lazy loading and decoding', () => {
    const page = menuPage('test-session', sampleConfig, 'https://dubmenu.com');
    expect(page).toContain('https://example.com/og.jpg');
    expect(page).toContain('loading="lazy"');
    expect(page).toContain('decoding="async"');
  });

  it('renders a placeholder for products without an image', () => {
    const page = menuPage('test-session', sampleConfig, 'https://dubmenu.com');
    expect(page).toContain('product-image-placeholder');
    expect(page).toContain('placeholder-art');
  });

  it('includes the shared category detector script', () => {
    const page = menuPage('test-session', sampleConfig, 'https://dubmenu.com');
    expect(page).toContain('function getCategoryType');
  });

  it('uses premium accent placeholders', () => {
    const page = menuPage('test-session', sampleConfig, 'https://dubmenu.com');
    expect(page).toContain('.placeholder-icon');
    expect(page).toContain('color:var(--text-muted)');
  });

  it('registers an image fallback handler on window', () => {
    const page = menuPage('test-session', sampleConfig, 'https://dubmenu.com');
    expect(page).toContain('window.dubmenuImgFallback');
    expect(page).toContain('onerror="window.dubmenuImgFallback(this)"');
  });

  it('renders demo config with category pills and placeholder icons', () => {
    const page = menuPage('demo', createDemoConfig(), 'https://dubmenu.com');
    expect(page).toContain('Simply Green');
    expect(page).toContain('Flower');
    expect(page).toContain('Pre-Rolls');
    expect(page).toContain('OG Kush');
    expect(page).toContain('product-image-placeholder');
  });

  it('emits a parseable inline script with no broken string literals', () => {
    const page = menuPage('demo', createDemoConfig(), 'https://dubmenu.com');
    const scriptMatch = page.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
    expect(scriptMatch).toBeTruthy();
    const script = scriptMatch![1].trim();
    // The inline script is an IIFE expression statement; this only checks syntax.
    expect(() => new Function(script)).not.toThrow();
  });

  it('includes mobile-safe CSS for product grid and category nav', () => {
    const page = menuPage('demo', createDemoConfig(), 'https://dubmenu.com');
    // Mobile-first single column product grid with overflow guard
    expect(page).toContain('.products-grid{');
    expect(page).toContain('grid-template-columns:1fr');
    expect(page).toContain('max-width:100%');
    // Category nav is constrained to viewport width
    expect(page).toContain('width:100%;max-width:100vw');
    // Sticky header wrapper is constrained to viewport width
    expect(page).toMatch(/\.sticky-top\{[^}]*width:100%;max-width:100vw/);
  });

  it('emits deterministic product-level placeholder variant classes', () => {
    const page = menuPage('demo', createDemoConfig(), 'https://dubmenu.com');
    expect(page).toContain('placeholder-v');
    expect(page).toContain('data-variant=');
    expect(page).toContain('getProductVariant');
    expect(page).toContain('placeholder-icon');
  });

  it('uses a responsive header name that can wrap on very narrow screens', () => {
    const page = menuPage('demo', createDemoConfig(), 'https://dubmenu.com');
    expect(page).toContain('.header-name{font-size:clamp(');
    expect(page).toMatch(/@media\(max-width:374px\)[^}]*\.header-name\{[^}]*white-space:normal/);
  });
});
