import { runInThisContext } from 'node:vm';
import { describe, it, expect } from 'vitest';
import {
  buildTvManualSpecialsCategory,
  compactTvDescription,
  formatTvProductName,
  isVisuallyBlankImageSample,
  nextTvCyclePage,
  normalizeTvUploadImageUrl,
  normalizeTvFontScale,
  shouldResetTvCycle,
  shouldRunTvCycle,
  tvPage,
} from '../src/html-tv';
import {
  normalizeTvPageDurationSeconds,
  normalizeTvPageTransition,
  TV_PAGE_DURATION_DEFAULT,
  TV_PAGE_DURATION_OPTIONS,
} from '../src/types';

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

  it('shows cached products without a phone and keeps empty unpaired TVs on the QR screen', () => {
    const page = tvPage('test-session', 'https://dubmenu.com');
    expect(page).toContain("if(paired||hasProducts(config)){setPhase('menu');renderMenu();}");
    expect(page).toContain("else {setPhase('pairing');}");
  });

  it('wraps category icons in a premium badge for large-screen TV', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('cat-icon-wrap');
    expect(page).toContain('cat-icon cat-icon-');
    // Ensure inline category SVGs remain custom SVGs, not emoji text.
    expect(page).toContain('\\u003csvg');
    expect(page).toContain('\\u003c/svg\\u003e');
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
    expect(page).toContain("grid.className = 'editorial-products count-'");
    expect(page).toContain('.layout-editorial .editorial-products.no-images');
  });

  it('uses price-board rows for the default TV grid', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('product-table-head');
    expect(page).toContain('strain-bar');
    expect(page).toContain('gridStrainClass');
    expect(page).not.toContain('category-spotlight');
    expect(page).toContain('product-table-head');
  });

  it('pairs a normalized purchase amount with every single displayed price', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('function weightBelongsInMeta');
    expect(page).toContain("var weight = p.weight ? '<span class=\"price-weight\">'");
    expect(page).toContain("'<span class=\"price-pair\">' + weight + current + '</span>'");
    expect(page).toContain('.price-pair{display:inline-flex;');
    expect(page).toContain('.price-weight{');
    expect(page).toContain('grid-template-areas:"name price" "meta price" "desc price"');
  });

  it('adapts descriptions to layout density instead of repeating full paragraphs everywhere', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, showImages: false } });
    expect(page).toContain('var compactDescription = function compactTvDescription');
    expect(page).toContain('function makeListDesc');
    expect(page).toContain('while(contentOverflows(name)&&size>22)');
    expect(page).toContain("name.style.fontSize=''");
    expect(page).toContain("name.style.webkitLineClamp=''");
    expect(page).toContain("name.removeAttribute('data-name-overflow')");
    expect(page).toContain("name.style.webkitLineClamp='3'");
    expect(page).toContain('requestAnimationFrame(function(){fitGridCardNames(container);})');
    expect(page).toContain("applyBrandStyle(config);\n    fitToScreen();\n    var demoPill");
    expect(page).toContain("if(content&&(content.classList.contains('layout-grid')||content.classList.contains('layout-pricewall'))) fitGridCardNames(content)");
    expect(page).toContain('makeDesc(p,true)');
    expect(page).toContain('.layout-list .row-desc{');
    expect(page).toContain("compact ? ' compact-desc' : ''");
  });

  it('compacts TV descriptions by whole words without deleting letters', () => {
    expect(compactTvDescription('Creamy vanilla and berry aromas open into a smooth, dessert-like finish.'))
      .toBe('Creamy vanilla and berry aromas open into a smooth, dessert-like finish.');
    expect(compactTvDescription('Bright citrus and pine notes with a clean, energizing finish.'))
      .toBe('Bright citrus and pine notes with a clean, energizing finish.');
  });

  it('removes only metadata duplicated by the TV card around the product name', () => {
    expect(formatTvProductName({
      name: 'Ayrloom | Rescue 1:1 Topical | 1000MG THC : 1000MG CBD',
      brand: 'Ayrloom',
      strain: 'Hybrid',
      weight: '2.5g',
    }, 'Topicals · Hybrid')).toBe('Rescue 1:1 | 1000MG THC : 1000MG CBD');
    expect(formatTvProductName({
      name: '1937 | Flower | Hybrid | Papaya | 14g',
      brand: '1937',
      strain: 'Hybrid',
      weight: '14g',
    }, 'Flower · Hybrid')).toBe('Papaya');
    expect(formatTvProductName({
      name: 'Blue Dream',
      brand: 'North Coast Gardens',
      strain: 'Sativa',
      weight: '3.5g',
    }, 'Flower · Sativa')).toBe('Blue Dream');
    expect(formatTvProductName({
      name: 'Dank | Infused Pre-Rolls | 5 Pack | Indica | Blackberry Kush | 2.75g',
      brand: 'Dank By Definition.',
      strain: 'Indica',
      weight: '2.75g',
    }, 'Pre-Rolls · Indica')).toBe('Infused | 5 Pack | Blackberry Kush');
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

  it('keeps every active manual special in the TV category', () => {
    const specials = Array.from({ length: 10 }, (_, index) => ({
      id: `deal-${index}`,
      title: `Deal ${index}`,
      active: true,
    }));
    const category = buildTvManualSpecialsCategory({ specials });

    expect(category?.products).toHaveLength(10);
    expect(category?.products.map((product) => product.id)).toEqual(specials.map((special) => special.id));
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
    const special = buildTvManualSpecialsCategory({
      specials: [{
        id: 'tier-deal',
        title: 'Tiered Flower Special',
        price: 25,
        originalPrice: 40,
        priceTiers: [{ label: '1g', price: '$12' }],
      }],
    })?.products[0];
    expect(special).toMatchObject({
      price: 25,
      originalPrice: 40,
      priceTiers: [{ label: '1g', price: '$12' }],
    });
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
    expect(small).toContain('<body class="template-default font-small" data-font-scale="100">');
    expect(medium).toContain('<body class="template-default font-medium" data-font-scale="140">');
    expect(large).toContain('<body class="template-default font-large" data-font-scale="180">');
  });

  it('normalizes the wider continuous TV scale safely while preserving legacy size settings', () => {
    expect(normalizeTvFontScale(undefined, 'small')).toBe(100);
    expect(normalizeTvFontScale(undefined, 'medium')).toBe(140);
    expect(normalizeTvFontScale(undefined, 'large')).toBe(180);
    expect(normalizeTvFontScale(79, 'large')).toBe(100);
    expect(normalizeTvFontScale(137, 'small')).toBe(135);
    expect(normalizeTvFontScale(500, 'small')).toBe(250);

    const page = tvPage('test-session', 'https://dubmenu.com', {
      initialConfig: { ...sampleConfig, fontSize: 'small', fontScale: 135 },
    });
    expect(page).toContain('<body class="template-default font-medium" data-font-scale="135">');
    expect(page).toContain("document.body.setAttribute('data-font-scale',String(fontScale))");
    expect(page).toContain('fontScale:activeTvFontScale(config)');
    expect(page).toContain('if(!Number.isFinite(numeric))');
    expect(page).toContain('if(URL_FONT_SCALE !== null) return URL_FONT_SCALE');
    expect(page).toContain('if(URL_FONT_SIZE !== null) return normalizeTvFontScale(undefined,URL_FONT_SIZE)');
  });

  it('gives every TV font setting explicit menu-board typography tokens', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, fontSize: 'large', layout: 'pricewall' } });
    expect(page).toContain('--tv-name-size:clamp(1.45rem,1.62vw,1.85rem)');
    expect(page).toContain('body.font-large{');
    expect(page).toContain('--tv-name-size:clamp(1.8rem,2vw,2.3rem)');
    expect(page).toContain('--tv-meta-size:clamp(0.98rem,1.15vw,1.25rem)');
    expect(page).toContain('--tv-price-size:clamp(1.95rem,2.3vw,2.55rem)');
    expect(page).toContain('.layout-grid .card-name,.layout-pricewall .card-name{font-size:var(--tv-name-size);font-weight:900');
    expect(page).toContain("if(!isMobileViewport()) return maximum+'rem'");
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

  it('renders one uncluttered single-line legal footer without a page counter', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });

    expect(page).toContain('<div class="footer-right" id="footer-disclaimer">');
    expect(page).toContain('.footer-right{width:100%;min-width:0;text-align:center;white-space:nowrap');
    expect(page).not.toContain('footer-progress');
    expect(page).not.toContain('formatTvPageProgress');
  });

  it('normalizes explicit page duration seconds and legacy speed values', () => {
    expect(normalizeTvPageDurationSeconds(5)).toBe(5);
    expect(normalizeTvPageDurationSeconds(8)).toBe(8);
    expect(normalizeTvPageDurationSeconds(10)).toBe(10);
    expect(normalizeTvPageDurationSeconds(15)).toBe(15);
    expect(normalizeTvPageDurationSeconds(20)).toBe(20);
    expect(normalizeTvPageDurationSeconds(12)).toBe(10);
    expect(normalizeTvPageDurationSeconds(undefined, 50)).toBe(10);
    expect(normalizeTvPageDurationSeconds(undefined, 100)).toBe(15);
    expect(normalizeTvPageDurationSeconds(undefined, 150)).toBe(20);
    expect(normalizeTvPageDurationSeconds('invalid')).toBe(10);
  });

  it('executes the serialized TV duration normalizer with only its injected constants', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });
    const match = page.match(/var normalizeTvPageDurationSeconds = ([\s\S]+?);\n {2}var normalizeTvPageTransition/);
    if (!match) throw new Error('Serialized TV duration normalizer not found');

    const normalizeInline = runInThisContext(`(() => {
      const TV_PAGE_DURATION_DEFAULT = ${JSON.stringify(TV_PAGE_DURATION_DEFAULT)};
      const TV_PAGE_DURATION_OPTIONS = ${JSON.stringify(TV_PAGE_DURATION_OPTIONS)};
      return (${match[1]});
    })()`) as (value: unknown, legacySpeed?: unknown) => number;

    expect(normalizeInline(5)).toBe(5);
    expect(normalizeInline(12)).toBe(10);
    expect(normalizeInline(undefined, 100)).toBe(15);
    expect(normalizeInline('invalid')).toBe(10);
  });

  it('normalizes page transition choices to the calm fade default', () => {
    expect(normalizeTvPageTransition('fade')).toBe('fade');
    expect(normalizeTvPageTransition('none')).toBe('none');
    expect(normalizeTvPageTransition('flip')).toBe('fade');
    expect(normalizeTvPageTransition(undefined)).toBe('fade');
  });

  it('auto-rotates overflow category pages only when enabled', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, autoScroll: true } });
    expect(page).toContain('if(shouldRunTvCycle(config && config.autoScroll,cycleState.totalPages,document.hidden)) startCycling();');
    expect(page).toContain('var cats = getCategoriesForDisplay(categoriesWithManualSpecials(config));');
  });

  it('keeps an overflow TV menu rotating when its WebSocket disconnects', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, autoScroll: true } });
    const extractFunction = (name: string, nextName: string): string => {
      const start = page.indexOf(`function ${name}(`);
      const end = page.indexOf(`\n\n  function ${nextName}(`, start);
      if (start < 0 || end < 0) throw new Error(`Generated ${name} function not found`);
      return page.slice(start, end);
    };
    const oncloseStart = page.indexOf('ws.onclose=function(){');
    const oncloseTerminator = '\n    };';
    const oncloseEnd = page.indexOf(oncloseTerminator, oncloseStart);
    if (oncloseStart < 0 || oncloseEnd < 0) throw new Error('Generated WebSocket close handler not found');

    const cycleFunctions = [
      extractFunction('getCycleInterval', 'cancelPageTransition'),
      extractFunction('cancelPageTransition', 'stopCycling'),
      extractFunction('stopCycling', 'scheduleNextCycle'),
      extractFunction('scheduleNextCycle', 'advanceCyclePage'),
      extractFunction('advanceCyclePage', 'startCycling'),
      extractFunction('startCycling', 'resumeCycling'),
      extractFunction('resumeCycling', 'emptyMenuMarkup'),
    ].join('\n');
    const oncloseSource = page.slice(oncloseStart, oncloseEnd + oncloseTerminator.length);
    const result = runInThisContext(`(() => {
      const calls = [];
      const timers = new Map();
      let nextTimerId = 1;
      let latestTimerId = null;
      function clearTimeout(timerId) { timers.delete(timerId); }
      function clearInterval() { calls.push('heartbeat-cleared'); }
      function setTimeout(callback, delay) {
        const timerId = nextTimerId++;
        timers.set(timerId, { callback, delay });
        latestTimerId = timerId;
        return timerId;
      }
      let heartbeatTimer = 1;
      const config = { autoScroll: true, pageDurationSeconds: 10, pageTransition: 'fade' };
      const cycleState = {
        currentPage: 0,
        totalPages: 2,
        interval: null,
        intervalMs: 0,
        isTransitioning: false,
        pageSignature: '',
        swapTimer: null,
        cleanupTimer: null,
      };
      const document = { hidden: false, getElementById() { return null; } };
      const window = { matchMedia() { return { matches: true }; } };
      const ws = {};
      function shouldRunTvCycle(autoScroll, totalPages, hidden) {
        return autoScroll === true && totalPages > 1 && !hidden;
      }
      function normalizeTvPageDurationSeconds() { return 10; }
      function normalizeTvPageTransition() { return 'fade'; }
      function nextTvCyclePage(currentPage, totalPages) {
        return totalPages > 0 ? (currentPage + 1) % totalPages : 0;
      }
      function renderCurrentPage() { calls.push('rendered'); }
      function hasProducts() { return true; }
      function setConn(state) { calls.push('connection:' + state); }
      function scheduleReconnect() { calls.push('reconnect'); }
      ${cycleFunctions}
      ${oncloseSource}
      ws.onclose();
      const pageBeforeTimer = cycleState.currentPage;
      const firstTimerId = latestTimerId;
      const firstTimer = timers.get(firstTimerId);
      const firstTimerActiveAfterClose = firstTimer !== undefined;
      if (!firstTimer) throw new Error('Active cycle timer was not scheduled');
      timers.delete(firstTimerId);
      firstTimer.callback();
      return {
        calls,
        firstDelay: firstTimer.delay,
        firstTimerActiveAfterClose,
        pageBeforeTimer,
        pageAfterTimer: cycleState.currentPage,
      };
    })()`) as {
      calls: string[];
      firstDelay: number;
      firstTimerActiveAfterClose: boolean;
      pageBeforeTimer: number;
      pageAfterTimer: number;
    };

    expect(result.calls).toContain('heartbeat-cleared');
    expect(result.calls).toContain('connection:disconnected');
    expect(result.calls).toContain('reconnect');
    expect(result.calls).toContain('rendered');
    expect(result.firstDelay).toBe(10_000);
    expect(result.firstTimerActiveAfterClose).toBe(true);
    expect(result.pageBeforeTimer).toBe(0);
    expect(result.pageAfterTimer).toBe(1);
  });

  it('uses a 400ms fade, recursive dwell scheduling, and instant reduced-motion replacement', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', {
      initialConfig: { ...sampleConfig, autoScroll: true, pageDurationSeconds: 10, pageTransition: 'fade' },
    });
    expect(page).toContain('.menu-content.page-exit{animation:menu-page-exit 180ms');
    expect(page).toContain('.menu-content.page-enter{animation:menu-page-enter 220ms');
    expect(page).toContain('@media (prefers-reduced-motion:reduce)');
    expect(page).toContain('.pairing-glow,.conn-dot{animation:none!important;}');
    expect(page).toContain("window.matchMedia('(prefers-reduced-motion: reduce)').matches");
    expect(page).toContain('function scheduleNextCycle()');
    expect(page).toContain('cycleState.interval=setTimeout(advanceCyclePage,intervalMs)');
    expect(page).not.toContain('setInterval(advanceCyclePage');
    expect(page).toContain("normalizeTvPageTransition(config && config.pageTransition)==='none'");
    expect(page).toContain("content.setAttribute('data-menu-page',String(cycleState.currentPage+1))");
  });

  it('resets for every page-planner input and stops immediately when the menu becomes empty', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, autoScroll: true } });
    expect(page).toContain('var demoMode = isDemoOrDefaultDisplay(config)');
    expect(page).toContain('getPageSignature(layout,cats,bannerActive,demoMode)');
    expect(page).toContain('demoMode ? 1 : 0');
    expect(page).toContain("cycleState.pageSignature=''");
    expect(page).toContain('renderEmptyMenu(layout)');
  });

  it('uses the same demo capacity for cycle counts and rendered pages', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', {
      initialConfig: { ...sampleConfig, autoScroll: true, tvDemo: true },
    });
    expect(page).toContain('getCatalogPagePlan(displayCats, layout, bannerActive, isDemoOrDefaultDisplay(config))');
  });

  it('replans pagination when a scheduled banner starts or ends', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });
    expect(page).toContain('var lastBannerActive=false');
    expect(page).toContain('lastBannerActive=!!banner');
    expect(page).toContain('var nextBannerActive=!!getActiveBanner()');
    expect(page).toContain('if(nextBannerActive!==lastBannerActive)renderMenu()');
  });

  it('escapes imported menu text before embedding initial config in the inline script', () => {
    const injected = '</script><script>window.tvInjection=true</script>';
    const page = tvPage('test-session', 'https://dubmenu.com', {
      initialConfig: { ...sampleConfig, dispensaryName: injected },
    });
    expect(page.match(/<\/script>/g)).toHaveLength(1);
    expect(page).toContain('\\u003c/script\\u003e\\u003cscript\\u003ewindow.tvInjection=true\\u003c/script\\u003e');
  });

  it('keeps playback stable across duplicate or cosmetic config broadcasts', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: { ...sampleConfig, autoScroll: true } });
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

  it('compacts banner boards and expands the logical canvas to every display aspect ratio', () => {
    const page = tvPage('test-session', 'https://dubmenu.com', { initialConfig: sampleConfig });
    expect(page).toContain('body.has-promo-banner .menu-content');
    expect(page).toContain("document.body.classList.toggle('has-promo-banner',lastBannerActive)");
    expect(page).toContain('var canvasWidth = Math.max(SCALE_BASELINE_W, vw / scale)');
    expect(page).toContain('var canvasHeight = Math.max(SCALE_BASELINE_H, vh / scale)');
    expect(page).toContain("menu.style.marginLeft = '0'");
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
    expect(page).toContain('var MIN_DISPLAYS = 1');
    expect(page).toContain('var MAX_DISPLAYS = 4');
    expect(page).toContain('var allocateCategoriesForDisplay = function allocateCategoriesForDisplay');
    expect(page).toContain('var selectCategoriesForDisplay = function selectCategoriesForDisplay');
    expect(page).toContain('return selectCategoriesForDisplay(allCats, normalizeScreens(config && config.screens, DISPLAY_TOTAL), DISPLAY_NUM, DISPLAY_TOTAL)');
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
    expect(page).toContain("'product-card' + nameClass + (hasImage ? ' has-image' : ' no-image')");
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
    expect(page).toContain('.layout-pricewall .pricewall-shell{grid-column:3;grid-row:1 / span 3;display:flex;flex-direction:column;gap:0.85rem;min-width:0;min-height:0;}');
    expect(page).toContain('.layout-pricewall:not(.pricewall-no-rail):has(> .category-block:first-child:nth-last-child(2)){grid-template-columns:minmax(0,1fr) minmax(23rem,0.72fr);}');
    expect(page).toContain('.layout-pricewall:not(.pricewall-no-rail):has(> .category-block:first-child:nth-last-child(2)) .category-block{grid-column:1;}');
    expect(page).toContain('.layout-pricewall:not(.pricewall-no-rail):has(> .category-block:first-child:nth-last-child(2)) .pricewall-shell{grid-column:2;}');
    expect(page).toContain('.font-scale-high .layout-pricewall .pricewall-shell{display:none;}');
    expect(page).toContain('.font-scale-high .layout-pricewall:not(.pricewall-no-rail):has(> .category-block:first-child:nth-last-child(2)){grid-template-columns:minmax(0,1fr);}');
    expect(page).toContain('.font-scale-high .layout-pricewall:not(.pricewall-no-rail):has(> .category-block:first-child:nth-last-child(3)){grid-template-columns:repeat(2,minmax(0,1fr));}');
    expect(page).toContain('pricewall-status');
    expect(page).toContain('Featured deals');
    expect(page).toContain('escapeHtml(formatProductName(p,p.categoryName))');
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
    expect(buildTvManualSpecialsCategory({ specials: [{ id: 'bogo', title: 'BOGO gummies', active: true }] })?.products[0]?.price).toBeUndefined();
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
