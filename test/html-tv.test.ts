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
          { id: 'p1', name: 'OG Kush', price: 45, inStock: true, image: 'https://dubmenu.com/api/uploads/acct_123/og.jpg' },
        ],
      },
    ],
    template: 'default',
  };

  it('renders product images when showImages is true', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: true } });
    expect(page).toContain('https://dubmenu.com/api/uploads/acct_123/og.jpg');
    expect(page).toContain('card-image');
  });

  it('hides product images when showImages is false', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    // The image URL may still appear in the embedded JSON, but no product card should render it as an <img src>.
    const imgSrcMatches = page.match(/<img[^>]+src="https:\/\/dubmenu\.com\/api\/uploads\/acct_123\/og\.jpg"/g) || [];
    expect(imgSrcMatches.length).toBe(0);
    expect(page).toContain('card-image-placeholder');
  });

  it('does not render external CDN image URLs from stale configs', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', {
      initialConfig: {
        ...sampleConfig,
        showImages: true,
        categories: [
          {
            id: 'cat-flower',
            name: 'Flower',
            order: 0,
            products: [
              { id: 'p1', name: 'OG Kush', price: 45, inStock: true, image: 'https://images.dutchie.com/og.jpg' },
            ],
          },
        ],
      },
    });
    expect(page).toContain("parsed.pathname.indexOf('/api/uploads/') === 0");
    expect(page).not.toContain("if(/^\\\\/api\\\\/uploads\\\\//.test(u) || /^https:");
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
    expect(page).toContain('color:var(--text-muted)');
  });

  it('wraps category icons in a premium badge for large-screen TV', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('cat-icon-wrap');
    expect(page).toContain('cat-icon cat-icon-');
    // Ensure inline category SVGs remain custom SVGs, not emoji text.
    expect(page).toContain('<svg');
    expect(page).toContain('</svg>');
  });

  it('emits a parseable inline script with no broken string literals', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });
    const scriptMatch = page.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
    expect(scriptMatch).toBeTruthy();
    const script = scriptMatch![1].trim();
    expect(() => new Function(script)).not.toThrow();
  });

  it('uses a single muted category header style, not rainbow category accents', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).not.toContain('--cat-accent');
    expect(page).not.toContain('CAT_ACCENT');
  });

  it('emits deterministic product-level placeholder variant classes', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('placeholder-v');
    expect(page).toContain('data-variant=');
    expect(page).toContain('getProductVariant');
    expect(page).toContain('placeholder-icon');
  });

  it('uses full-screen category panels for the default TV grid', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('.layout-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))');
    expect(page).toContain('.layout-grid .category-block{min-width:0;min-height:0;display:flex;flex-direction:column');
    expect(page).toContain('function makeDesc');
  });

  it('uses price-board rows for the default TV grid', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('product-table-head');
    expect(page).toContain('strain-bar');
    expect(page).toContain('gridStrainClass');
    expect(page).toContain('category-spotlight');
    expect(page).toContain('aligned pricing');
  });

  it('renders real product images in price-board rows when assets exist', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: true } });
    expect(page).toContain('hasImage');
    expect(page).toContain(' has-image');
    expect(page).toContain("imgMarkup(p, true)");
    expect(page).toContain('.layout-grid .product-card.has-image');
  });

  it('renders manual specials as a dedicated TV category', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', {
      initialConfig: {
        ...sampleConfig,
        showImages: true,
        specials: [
          {
            id: 'wyld-10',
            title: '10% off Wyld gummies',
            description: 'Brand promotion for today only',
            brand: 'Wyld',
            image: 'https://example.com/wyld.jpg',
            active: true,
          },
        ],
      },
    });
    expect(page).toContain('manualSpecialsCategory');
    expect(page).toContain('categoriesWithManualSpecials');
    expect(page).toContain('10% off Wyld gummies');
    expect(page).toContain('promo-price');
  });

  it('maps manual special price, originalPrice, and priceTiers to the specials category', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', {
      initialConfig: {
        ...sampleConfig,
        showImages: true,
        specials: [
          {
            id: 'tier-deal',
            title: 'Tiered Flower Special',
            description: 'Multi-tier promo',
            price: 25,
            originalPrice: 40,
            priceTiers: [
              { label: '1g', price: '$12' },
              { label: '8th', price: '$25' },
            ],
            active: true,
          },
        ],
      },
    });
    expect(page).toContain('originalPrice: typeof s.originalPrice');
    expect(page).toContain('priceTiers: Array.isArray(s.priceTiers)');
    expect(page).toContain('price: price');
    expect(page).toContain('Tiered Flower Special');
  });

  it('applies the configured font size to the body class', () => {
    const small = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, fontSize: 'small' } });
    const medium = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, fontSize: 'medium' } });
    const large = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, fontSize: 'large' } });
    expect(small).toContain('<body class="template-default font-small">');
    expect(medium).toContain('<body class="template-default font-medium">');
    expect(large).toContain('<body class="template-default font-large">');
  });

  it('wires brand primary color into the inline override style', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', {
      initialConfig: { ...sampleConfig, primaryColor: '#ff0000' },
    });
    expect(page).toContain('function applyBrandStyle');
    expect(page).toContain('brand-overrides');
    expect(page).toContain('cfg.primaryColor');
    expect(page).toContain('--accent:');
  });

  it('computes the cycle interval from autoScrollSpeed', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, autoScroll: true, autoScrollSpeed: 75 } });
    expect(page).toContain('function getCycleInterval');
    expect(page).toContain('config.autoScrollSpeed');
    expect(page).toContain('Math.max(4000, Math.min(20000, 5000 + raw * 100))');
  });

  it('shows the demo pill when tvDemo is enabled', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, tvDemo: true } });
    expect(page).toContain('<div class="demo-pill" id="demo-pill">Demo data</div>');
    expect(page).toContain('config.tvDemo');
    expect(page).toContain("demoPill.classList.toggle('visible', DEMO_MODE || !!config.tvDemo)");
  });

  it('uses placeholder images for all cards when showImages is false', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('config && config.showImages === false');
    expect(page).toContain('placeholderMarkup');
    expect(page).toContain('card-image-placeholder');
  });
});
