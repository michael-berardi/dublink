import { describe, it, expect } from 'vitest';
import {
  isVisuallyBlankImageSample,
  nextTvCyclePage,
  normalizeTvUploadImageUrl,
  normalizeTvFontScale,
  shouldResetTvCycle,
  shouldRunTvCycle,
  tvPage,
} from '../src/html-tv';

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

  it('accepts only app-owned uploads, preserves their origin, and versions CORS responses', () => {
    expect(normalizeTvUploadImageUrl('/api/uploads/acct/photo.jpg', 'https://store.example')).toBe('/api/uploads/acct/photo.jpg?dubmenu-cors=1');
    expect(normalizeTvUploadImageUrl(
      'https://dubmenu.com/api/uploads/acct/photo.jpg?version=1',
      'https://store.example'
    )).toBe('https://dubmenu.com/api/uploads/acct/photo.jpg?version=1&dubmenu-cors=1');
    expect(normalizeTvUploadImageUrl(
      'https://store.example/api/uploads/acct/photo.jpg',
      'https://store.example'
    )).toBe('https://store.example/api/uploads/acct/photo.jpg?dubmenu-cors=1');
    expect(normalizeTvUploadImageUrl(
      'https://images.dutchie.com/api/uploads/acct/photo.jpg',
      'https://store.example'
    )).toBe('');
  });

  it('classifies washed-out samples while retaining photos with visible subject detail', () => {
    const sample = (darkPixels: number) => {
      const pixels = new Uint8ClampedArray(24 * 24 * 4);
      for (let pixel = 0; pixel < 24 * 24; pixel++) {
        const value = pixel < darkPixels ? 40 : 255;
        const offset = pixel * 4;
        pixels[offset] = value;
        pixels[offset + 1] = value;
        pixels[offset + 2] = value;
        pixels[offset + 3] = 255;
      }
      return pixels;
    };
    expect(isVisuallyBlankImageSample(sample(0))).toBe(true);
    expect(isVisuallyBlankImageSample(sample(10))).toBe(true);
    expect(isVisuallyBlankImageSample(sample(24))).toBe(false);
  });

  it('renders product images when showImages is true', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: true } });
    expect(page).toContain('https://dubmenu.com/api/uploads/acct_123/og.jpg');
    expect(page).toContain('card-image');
  });

  it('allows curated data-image demo product photography', () => {
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
              { id: 'p1', name: 'OG Kush', price: 45, inStock: true, image: 'data:image/webp;base64,AAAA' },
            ],
          },
        ],
      },
    });
    expect(page).toContain('data:image/webp;base64,AAAA');
    expect(page).toContain('card-image');
  });

  it('omits product images and icon placeholders when showImages is false', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    // The image URL may still appear in the embedded JSON, but no product card should render it as an <img src>.
    const imgSrcMatches = page.match(/<img[^>]+src="https:\/\/dubmenu\.com\/api\/uploads\/acct_123\/og\.jpg"/g) || [];
    expect(imgSrcMatches.length).toBe(0);
    expect(page).not.toContain('card-image-placeholder');
    expect(page).not.toContain('placeholder-icon');
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
    expect(page).toContain('normalizeTvUploadImageUrl(url, location.origin)');
  });

  it('prevents embedded config previews from taking over fullscreen', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });
    expect(page).toContain("var EMBED_MODE = new URLSearchParams(location.search).get('embed') === '1'");
    expect(page).toContain('if(EMBED_MODE||fsDone||fsPending)return');
    expect(page).toContain('fsPending=false');
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

  it('preserves initial demo config only for demo pages when the server sends an empty config', () => {
    const demoPage = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig }, demo: true });
    const livePage = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig } });
    // Demo pages keep their seeded sample menu when an unowned session returns { categories: [] }.
    // Live paired pages must accept that same empty array so "Clear menu" clears the TV.
    expect(demoPage).toContain('PRESERVE_INITIAL_DEMO_CONFIG = true');
    expect(livePage).toContain('PRESERVE_INITIAL_DEMO_CONFIG = false');
    expect(livePage).toContain('hasCategoryArray(incoming) && !PRESERVE_INITIAL_DEMO_CONFIG');
    expect(livePage).toContain("if(!displayCats.length){renderEmptyMenu(layout);return;}");
  });

  it('keeps unpaired TVs on the QR screen when config data arrives', () => {
    const page = tvPage('test-session', 'https://dubmenu.com');
    expect(page).toContain("if(paired){setPhase('menu');renderMenu();}");
    expect(page).toContain("else {setPhase('pairing');}");
    expect(page).not.toContain("paired || hasProducts(config) || hasCategoryArray(config)");
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

  it('does not ship product-level icon placeholder helpers', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).not.toContain('placeholderMarkup');
    expect(page).not.toContain('getProductVariant');
    expect(page).not.toContain('placeholder-icon');
  });

  it('uses full-screen category panels for the default TV grid', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('.layout-grid,.layout-pricewall{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))');
    expect(page).toContain('.layout-grid .category-block,.layout-pricewall .category-block{min-width:0;min-height:0;display:flex;flex-direction:column');
    expect(page).toContain('function makeDesc');
  });

  it('uses price-board rows for the default TV grid', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('product-table-head');
    expect(page).toContain('strain-bar');
    expect(page).toContain('gridStrainClass');
    expect(page).not.toContain('category-spotlight');
    expect(page).toContain('product-table-head');
  });

  it('injects the exhaustive page planner for imported grid boards', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig } });
    expect(page).toContain('var buildTvCatalogPagePlan = function buildTvCatalogPagePlan');
  });

  it('keeps alternate no-photo TV layouts dense instead of showing empty image-first cards', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig } });
    expect(page).toContain('buildTvCatalogPagePlan(cats,{');
    expect(page).toContain("row.className = 'product-row ' + (rowHasImage ? 'has-image' : 'no-image')");
    expect(page).toContain("card.className = 'product-card ' + (hasImage ? 'has-image' : 'no-image')");
    expect(page).toContain('.layout-poster .poster-products.no-images');
    expect(page).toContain("' no-images'");
    expect(page).toContain('.layout-cinematic .product-card.no-image');
    expect(page).toContain("if(DISPLAY_TOTAL >= 4) return hasDisplayImages(cfg) ? 'cinematic' : 'list'");
    expect(page).toContain('.layout-editorial .product-card.no-image');
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
    expect(page).toContain("promo = '<span class=\"promo-price\">' + escapeHtml(p.specialLabel) + '</span> '");
    expect(page).toContain("promo = '<span class=\"promo-price\">Special</span> '");
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
    expect(page).toContain("price: typeof s.price === 'number' ? s.price : undefined");
    expect(page).toContain('Tiered Flower Special');
  });

  it('surfaces sold-out products and respects hidden strain settings', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showStrain: false } });
    expect(page).toContain("if(p.inStock === false) parts.push('<span class=\"oos-text\">Sold Out</span>')");
    expect(page).toContain("(config.showStrain !== false ? gridStrainClass(p) : '')");
  });

  it('applies the configured font size to the body class', () => {
    const small = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, fontSize: 'small' } });
    const medium = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, fontSize: 'medium' } });
    const large = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, fontSize: 'large' } });
    expect(small).toContain('<body class="template-default font-small" data-font-scale="90">');
    expect(medium).toContain('<body class="template-default font-medium" data-font-scale="100">');
    expect(large).toContain('<body class="template-default font-large" data-font-scale="120">');
  });

  it('normalizes continuous TV scale safely while preserving legacy size settings', () => {
    expect(normalizeTvFontScale(undefined, 'small')).toBe(90);
    expect(normalizeTvFontScale(undefined, 'medium')).toBe(100);
    expect(normalizeTvFontScale(undefined, 'large')).toBe(120);
    expect(normalizeTvFontScale(79, 'large')).toBe(90);
    expect(normalizeTvFontScale(137, 'small')).toBe(135);
    expect(normalizeTvFontScale(500, 'small')).toBe(140);

    const page = tvPage('test-session', 'https://dubmenu.com', {
      initialConfig: { ...sampleConfig, fontSize: 'small', fontScale: 135 },
    });
    expect(page).toContain('<body class="template-default font-large" data-font-scale="135">');
    expect(page).toContain("document.body.setAttribute('data-font-scale',String(fontScale))");
    expect(page).toContain('fontScale:activeTvFontScale(config)');
  });

  it('gives every TV font setting explicit menu-board typography tokens', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, fontSize: 'large', layout: 'pricewall' } });
    expect(page).toContain('--tv-name-size:clamp(1.28rem,1.4vw,1.62rem)');
    expect(page).toContain('body.font-large{');
    expect(page).toContain('--tv-name-size:clamp(1.55rem,1.7vw,1.95rem)');
    expect(page).toContain('--tv-meta-size:clamp(0.98rem,1.15vw,1.25rem)');
    expect(page).toContain('--tv-price-size:clamp(2.15rem,2.65vw,2.95rem)');
    expect(page).toContain('.layout-grid .card-name,.layout-pricewall .card-name{font-size:var(--tv-name-size);font-weight:900');
    expect(page).toContain('.layout-grid .card-price,.layout-pricewall .card-price{font-size:var(--tv-price-size);font-weight:950');
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

  it('keeps color templates independent from TV layout selection', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', {
      initialConfig: { ...sampleConfig, template: 'forest' },
    });
    expect(page).toContain('Color templates never choose layouts.');
    expect(page).not.toContain('productCountForLayout');
    expect(page).toContain("if(URL_LAYOUT) return URL_LAYOUT");
  });

  it('models playback reset, enablement, pause, resume, and wraparound decisions', () => {
    expect(shouldResetTvCycle('same-page-model', 'same-page-model')).toBe(false);
    expect(shouldResetTvCycle('old-page-model', 'new-page-model')).toBe(true);

    expect(shouldRunTvCycle(true, 2, false)).toBe(true);
    expect(shouldRunTvCycle(false, 2, false)).toBe(false);
    expect(shouldRunTvCycle(true, 1, false)).toBe(false);
    expect(shouldRunTvCycle(true, 2, true)).toBe(false);

    expect(nextTvCyclePage(0, 3)).toBe(1);
    expect(nextTvCyclePage(2, 3)).toBe(0);
    expect(nextTvCyclePage(2, 0)).toBe(0);
  });

  it('computes the cycle interval from autoScrollSpeed', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, autoScroll: true, autoScrollSpeed: 75 } });
    expect(page).toContain('function getCycleInterval');
    expect(page).toContain('config.autoScrollSpeed');
    expect(page).toContain('Math.max(4000, Math.min(20000, 5000 + raw * 100))');
  });

  it('auto-rotates overflow category pages only when enabled', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, autoScroll: true } });
    expect(page).toContain('if(shouldRunTvCycle(config && config.autoScroll,cycleState.totalPages,document.hidden)) startCycling();');
    expect(page).toContain('var cats = getCategoriesForDisplay(categoriesWithManualSpecials(config));');
  });

  it('uses calm two-stage page transitions and honors reduced-motion preferences', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, autoScroll: true } });
    expect(page).toContain('.menu-content.page-exit{animation:menu-page-exit 220ms');
    expect(page).toContain('.menu-content.page-enter{animation:menu-page-enter 420ms');
    expect(page).toContain('@media (prefers-reduced-motion:reduce)');
    expect(page).toContain("window.matchMedia('(prefers-reduced-motion: reduce)').matches");
    expect(page).toContain('function advanceCyclePage()');
    expect(page).toContain('cycleState.interval = setInterval(advanceCyclePage,intervalMs)');
    expect(page).toContain("content.setAttribute('data-menu-page',String(cycleState.currentPage+1))");
    expect(page).not.toContain('content-refresh');
  });

  it('keeps playback stable across duplicate or cosmetic config broadcasts', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, autoScroll: true } });
    expect(page).toContain('var nextPageSignature = getPageSignature(layout,cats,bannerActive)');
    expect(page).toContain('var pageModelChanged = shouldResetTvCycle(cycleState.pageSignature,nextPageSignature)');
    expect(page).toContain('cycleState.currentPage = pageModelChanged ? 0 : Math.min(cycleState.currentPage,Math.max(0,nextTotalPages-1))');
    expect(page).toContain('if(cycleState.interval && cycleState.intervalMs===intervalMs) return');
  });

  it('pauses and resumes page rotation when a TV becomes visible again', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, autoScroll: true } });
    expect(page).toContain("document.addEventListener('visibilitychange'");
    expect(page).toContain('if(document.hidden){stopCycling();return;}');
    expect(page).toContain('if(config&&hasProducts(config))renderMenu();');
  });

  it('keeps a physical TV awake and reacquires the screen wake lock after visibility returns', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });
    expect(page).toContain("navigator.wakeLock.request('screen')");
    expect(page).toContain("lock.addEventListener('release'");
    expect(page).toContain("setDisplayWakeLockState('active')");
    expect(page).toContain('requestDisplayWakeLock();\n    if(config&&hasProducts(config))renderMenu();');
    expect(page).toContain('requestDisplayWakeLock();\n\n  connect();');
  });

  it('bounds multi-screen URL topology to four displays', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });
    expect(page).toContain("Math.max(1,Math.min(4,value))");
    expect(page).toContain("var DISPLAY_TOTAL = boundedDisplayParam('displays',1)");
    expect(page).toContain("var DISPLAY_NUM = Math.min(boundedDisplayParam('display',1),DISPLAY_TOTAL)");
  });

  it('compacts the TV board and centers scaled previews when a promo banner is active', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });
    expect(page).toContain('body.has-promo-banner .menu-content');
    expect(page).toContain("document.body.classList.toggle('has-promo-banner',!!banner)");
    expect(page).toContain('Math.max(0, (vw - scaledW) / 2)');
  });

  it('shows the demo pill when tvDemo is enabled', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, tvDemo: true } });
    expect(page).toContain('<div class="demo-pill" id="demo-pill">Demo data</div>');
    expect(page).toContain('config.tvDemo');
    expect(page).toContain("demoPill.classList.toggle('visible', DEMO_MODE || !!config.tvDemo)");
  });

  it('does not render icon placeholders for cards when showImages is false', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('config && config.showImages === false');
    expect(page).not.toContain('placeholderMarkup');
    expect(page).not.toContain('card-image-placeholder');
  });

  it('injects the tested multi-display allocator into the TV runtime', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: true } });
    expect(page).toContain('var allocateCategoriesForDisplay = function allocateCategoriesForDisplay');
    expect(page).toContain('return allocateCategoriesForDisplay(allCats,DISPLAY_NUM,DISPLAY_TOTAL)');
  });

  it('falls back to the first planned page when cycle state is stale', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig } });
    expect(page).toContain('var pageCats = pagePlan[cycleState.currentPage] || pagePlan[0] || []');
    expect(page).toContain('cycleState.currentPage = pageModelChanged ? 0 : Math.min');
  });

  it('uses the same safe image helper in sparse layouts as other layouts', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig } });
    expect(page).toContain('safeImgUrl(hero.image)');
    expect(page).toContain('safeImgUrl(p.image)');
    expect(page).not.toContain('safeImageUrl');
  });

  it('turns failed product photos into text-only cards instead of dead image slots', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig } });
    expect(page).toContain("img.closest && img.closest('.has-image')");
    expect(page).toContain("card.classList.remove('has-image')");
    expect(page).toContain("card.classList.add('no-image')");
  });

  it('runs loaded product photos through the CORS-safe blank-image handler', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig } });
    expect(page).toContain('crossorigin="anonymous"');
    expect(page).toContain('window.dubmenuImgLoaded(this)');
    expect(page).toContain('isVisuallyBlankImageSample(pixels)');
    expect(page).toContain('window.dubmenuImgFallback(img)');
  });

  it('does not assign has-image or render an image placeholder for grid products without an image', () => {
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
              { id: 'p-text-only', name: 'Text Only Flower', price: 30, inStock: true },
            ],
          },
        ],
      },
    });

    // The product config has no image field, so the running renderer must not treat it as visual.
    expect(page).toContain('"id":"p-text-only"');
    expect(page).toContain('"name":"Text Only Flower"');
    expect(page).not.toContain('"image":"');

    // Grid renderer: no image column, no placeholder column, and uses the no-image class branch.
    expect(page).toContain('var hasImage = !!(safeImgUrl(p.image) && config.showImages !== false)');
    expect(page).toContain("var visual = hasImage ? imgMarkup(p, true) : ''");
    expect(page).toContain("'product-card' + (hasImage ? ' has-image' : ' no-image')");
  });

  it('adds the competitor-inspired dense price wall shell', () => {
    const manyProducts = Array.from({ length: 40 }, (_, idx) => ({
      id: `p-${idx}`,
      name: `Flower ${idx}`,
      price: 20 + idx,
      inStock: true,
      strain: idx % 2 ? 'hybrid' : 'indica',
      thc: `${20 + (idx % 10)}%`,
      brand: 'Test Brand',
    }));
    const page = tvPage('test-session', 'https://dubmenu.com', {
      initialConfig: {
        ...sampleConfig,
        categories: [
          { id: 'cat-flower', name: 'Flower', order: 0, products: manyProducts.slice(0, 20) },
          { id: 'cat-vapes', name: 'Vapes', order: 1, products: manyProducts.slice(20) },
        ],
      },
    });

    expect(page).toContain("if(getTotalProductCount(cfg) >= 36) return 'pricewall'");
    expect(page).toContain("else if(layout==='pricewall') renderPricewall(pageCats, content, pricewallRailCats)");
    expect(page).toContain('pricewall-shell');
    expect(page).toContain('pricewall-status');
    expect(page).toContain('Featured deals');
  });

  it('keeps sparse price-wall category rows top-aligned instead of stretching a single product', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, layout: 'pricewall' } });
    expect(page).toContain('justify-content:flex-start');
    expect(page).toContain('flex:0 0 auto;');
  });

  it('fills dense price-wall columns while preserving sparse-row sizing', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, layout: 'pricewall' } });
    expect(page).toContain("grid.className = 'grid-products count-' + Math.min(9, cat.products.length)");
    expect(page).toContain('.grid-products:not(.count-1):not(.count-2):not(.count-3) .product-card');
    expect(page).toContain('flex:1 1 0;min-height:0;');
  });

  it('keeps explicit specials in exhaustive price-wall pages and the featured rail', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, layout: 'pricewall' } });
    expect(page).toContain('function getPricewallPromoProducts(cats)');
    expect(page).toContain("var pricewallRailCats = layout === 'pricewall' ? cats : []");
    expect(page).toContain('if(!specials) return false');
    expect(page).not.toContain('explicitSpecialCats');
    expect(page).toContain('.layout-pricewall .card-price .promo-price');
  });

  it('makes markdown pricing explicit and formats fractional currency to cents', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, layout: 'pricewall' } });
    expect(page).toContain('<span class="sale-text">Now $');
    expect(page).toContain("numeric.toFixed(2).replace(/\\.00$/, '')");
    expect(page).toContain('.card-price-orig{color:var(--text-muted)');
  });

  it('does not render manual specials without prices as zero-dollar products', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, specials: [{ id: 'bogo', title: 'BOGO gummies', active: true }] } });
    expect(page).toContain("price: typeof s.price === 'number' ? s.price : undefined");
    expect(page).toContain('if(!hasPrice) return promo.trim()');
  });

  it('allows monitor-level dense price wall layout overrides', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, layout: 'pricewall' } });
    expect(page).toContain("'pricewall'");
    expect(page).toContain('buildTvCatalogPagePlan(cats,{');
  });

  it('wires all exposed TV layouts to renderers', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });
    expect(page).toContain("else if(layout==='poster') renderPoster(pageCats, content)");
    expect(page).toContain("else if(layout==='cinematic') renderCinematic(pageCats, content)");
    expect(page).toContain("else if(layout==='showcase') renderShowcase(pageCats, content)");
    expect(page).toContain("else if(layout==='editorial') renderEditorial(pageCats, content)");
    expect(page).toContain("else if(layout==='sparse') renderSparse(pageCats, content)");
  });

  it('keeps layout configurability and renderer state aligned', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });
    expect(page).toContain('var nextTotalPages = Math.max(1, pagePlan.length)');
    expect(page).toContain('function renderPricewall(cats, container, allCats)');
    expect(page).toContain('renderPricewallShell(allCats || cats, container)');
  });

  it('respects optional display toggles in the TV renderer', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', {
      initialConfig: {
        ...sampleConfig,
        logo: '/api/uploads/acct_123/logo.png',
        showLogo: false,
        showDescription: false,
        analyticsEnabled: false,
        categories: [
          {
            id: 'cat-flower',
            name: 'Flower',
            order: 0,
            products: [
              { id: 'p1', name: 'OG Kush', price: 45, inStock: true, description: 'Hidden description' },
            ],
          },
        ],
      },
    });
    expect(page).toContain('if(config.showLogo !== false && logoUrl)');
    expect(page).toContain('if(config && config.showDescription === false) return');
    expect(page).toContain('if(!config || config.analyticsEnabled !== false) fetch');
  });

  it('guides setup on the TV blank state instead of a generic no-products message', () => {
    const page = tvPage('test-session', 'https://tv.dubmenu.com', {
      preview: true,
      initialConfig: { categories: [] },
    });

    expect(page).toContain('Menu setup required');
    expect(page).toContain('Build this TV menu from the remote.');
    expect(page).toContain('empty-state-card');
    expect(page).toContain('function emptyMenuMarkup()');
    expect(page).toContain('function stopCycling()');
    expect(page).not.toContain('No products to display on this screen');
  });
});
