import { describe, it, expect } from 'vitest';
import { tvPage } from '../src/html-tv';

describe('tvPage', () => {
  const sampleConfig = {
    dispensaryName: 'Test Dispensary',
    categories: [
      {
        id: 'cat-flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'p1', name: 'OG Kush', price: 45, inStock: true, image: 'https://example.com/og.jpg' },
        ],
      },
    ],
    template: 'default',
  };

  it('renders product images when showImages is true', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: true } });
    expect(page).toContain('https://example.com/og.jpg');
    expect(page).toContain('card-image');
  });

  it('hides product images when showImages is false', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    // The image URL may still appear in the embedded JSON, but no product card should render it as an <img src>.
    const imgSrcMatches = page.match(/<img[^>]+src="https:\/\/example\.com\/og\.jpg"/g) || [];
    expect(imgSrcMatches.length).toBe(0);
    expect(page).toContain('card-image-placeholder');
  });

  it('uses production origin for the QR code on non-local hosts', () => {
    const page = tvPage('test-session', 'https://tv.dubmenu.com', { initialConfig: sampleConfig });
    expect(page).toContain('https://api.qrserver.com/v1/create-qr-code/');
    expect(page).toContain('https%3A%2F%2Fdubmenu.com%2F%3Fcode%3Dtest-session');
  });

  it('uses request origin for the QR code on localhost', () => {
    const page = tvPage('test-session', 'http://localhost:8787', { initialConfig: sampleConfig });
    expect(page).toContain('http%3A%2F%2Flocalhost%3A8787');
  });

  it('includes the shared category detector script', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });
    expect(page).toContain('function getCategoryType');
    expect(page).toContain('"type":"flower"');
    expect(page).toContain('"type":"edibles"');
  });

  it('preserves initial demo config when the server sends an empty config', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig } });
    // The client should only replace the current config when the incoming
    // config has products, or when the current config is empty. This keeps
    // demo sessions from flipping back to pairing when the demo WebSocket
    // returns an unowned (empty) config.
    expect(page).toContain('if(hasProducts(incoming) || !hasProducts(config))');
    expect(page).toContain('config=incoming');
  });

  it('uses premium accent placeholders', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('.card-image-placeholder .placeholder-icon');
    expect(page).toContain('color:var(--accent)');
  });

  it('emits a parseable inline script with no broken string literals', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });
    const scriptMatch = page.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
    expect(scriptMatch).toBeTruthy();
    const script = scriptMatch![1].trim();
    expect(() => new Function(script)).not.toThrow();
  });

  it('emits deterministic product-level placeholder variant classes', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('placeholder-v');
    expect(page).toContain('data-variant=');
    expect(page).toContain('getProductVariant');
  });
});
