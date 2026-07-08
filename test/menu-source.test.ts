import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectMenuSource, extractDutchieSlugFromHtml, resolveMenuSource, scrapeGenericWebsite } from '../src/menu-source';

describe('detectMenuSource', () => {
  it('detects Dutchie embedded URLs', () => {
    const s = detectMenuSource('https://dutchie.com/embedded-menu/simply-green');
    expect(s.type).toBe('dutchie-embedded');
    expect(s.slug).toBe('simply-green');
  });

  it('detects Dutchie regular URLs', () => {
    const s = detectMenuSource('https://dutchie.com/simply-green');
    expect(s.type).toBe('dutchie-regular');
    expect(s.slug).toBe('simply-green');
  });

  it('detects Dutchie subdomain URLs', () => {
    const s = detectMenuSource('https://simply-green.dutchie.com/embedded-menu');
    expect(s.type).toBe('dutchie-regular');
    expect(s.slug).toBe('simply-green');
  });

  it('accepts a bare slug', () => {
    const s = detectMenuSource('simply-green');
    expect(s.type).toBe('dutchie-slug');
    expect(s.slug).toBe('simply-green');
  });

  it('detects Simply Green website URLs', () => {
    const s = detectMenuSource('https://simplygreenny.com/shop');
    expect(s.type).toBe('simply-green');
    expect(s.slug).toBe('simply-green');

    const www = detectMenuSource('https://www.simplygreenny.com/');
    expect(www.type).toBe('simply-green');
    expect(www.slug).toBe('simply-green');

    const staging = detectMenuSource('https://dc88ae0b.simply-green-ny.pages.dev/shop');
    expect(staging.type).toBe('simply-green');
    expect(staging.slug).toBe('simply-green');
  });

  it('detects Dutchie v2 embedded-menu script IDs used by Simply Green', () => {
    const s = detectMenuSource('https://dutchie.com/api/v2/embedded-menu/69ab2eec51d4a55999d225a5.js');
    expect(s.type).toBe('simply-green');
    expect(s.slug).toBe('simply-green');
  });

  it('detects generic website URLs', () => {
    const s = detectMenuSource('https://example-dispensary.com/menu');
    expect(s.type).toBe('website-generic');
    expect(s.url).toBe('https://example-dispensary.com/menu');
  });

  it('rejects invalid input', () => {
    const s = detectMenuSource('not a url or slug!!!');
    expect(s.type).toBe('invalid');
    expect(s.error).toBeTruthy();
  });

  it('detects modern Dutchie /stores/:slug URLs', () => {
    const s = detectMenuSource('https://dutchie.com/stores/nature-med-gladstone');
    expect(s.type).toBe('dutchie-regular');
    expect(s.slug).toBe('nature-med-gladstone');
  });

  it('does not misdetect reserved Dutchie paths as a store slug', () => {
    const reserved = [
      'https://dutchie.com/stores',
      'https://dutchie.com/stores/',
      'https://dutchie.com/api/v1/dispensaries',
      'https://dutchie.com/help',
      'https://dutchie.com/business',
      'https://dutchie.com/us/dispensaries',
    ];
    for (const url of reserved) {
      const s = detectMenuSource(url);
      expect(s.type).toBe('dutchie-regular');
      expect(s.slug).toBeFalsy();
      expect(s.error).toBeTruthy();
    }
  });
});

describe('extractDutchieSlugFromHtml', () => {
  it('pulls a slug from an embedded iframe', () => {
    const html = '<iframe src="https://dutchie.com/embedded-menu/green-leaf?theme=dark"></iframe>';
    expect(extractDutchieSlugFromHtml(html)).toBe('green-leaf');
  });

  it('pulls a slug from a Dutchie v2 embedded script ID', () => {
    const html = '<script src="https://dutchie.com/api/v2/embedded-menu/69ab2eec51d4a55999d225a5.js"></script>';
    expect(extractDutchieSlugFromHtml(html)).toBe('simply-green');
  });

  it('returns null when no Dutchie link is present', () => {
    expect(extractDutchieSlugFromHtml('<html><body>No menu here</body></html>')).toBeNull();
  });

  it('ignores reserved Dutchie slugs in HTML links', () => {
    expect(extractDutchieSlugFromHtml('<a href="https://dutchie.com/stores">Stores directory</a>')).toBeNull();
    expect(extractDutchieSlugFromHtml('<a href="https://dutchie.com/help">Help center</a>')).toBeNull();
    expect(extractDutchieSlugFromHtml('<a href="https://dutchie.com/api/v2/embedded-menu/69ab2eec51d4a55999d225a5.js"></a>')).toBe('simply-green');
  });
});

describe('resolveMenuSource', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function graphqlResponse(data: unknown) {
    return Promise.resolve(
      new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  it('imports a Dutchie slug via API when key is present', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(() => {
      calls++;
      if (calls === 1) {
        return graphqlResponse({ dispensary: { id: 'd-1', name: 'Green Leaf', logo: 'https://img.com/logo.png' } });
      }
      return graphqlResponse({
        filteredProducts: {
          products: [
            { id: 'p1', name: 'Blue Dream 3.5g', brand: 'High Garden', category: 'Flower', recPrices: [35], Options: ['3.5g'] },
          ],
        },
      });
    }) as unknown as typeof fetch;

    const result = await resolveMenuSource('green-leaf', { DUTCHIE_API_KEY: 'test-key' });
    expect(result.dispensaryName).toBe('Green Leaf');
    expect(result.apiUsed).toBe(true);
    expect(result.productCount).toBe(1);
    expect(result.categories[0].name).toBe('Flower');
  });

  it('falls back to demo sample menu when the API and public API are unavailable', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ errors: [{ message: 'Forbidden' }] }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const result = await resolveMenuSource('green-leaf', { DUTCHIE_API_KEY: 'test-key' });
    expect(result.demo).toBe(true);
    expect(result.apiUsed).toBe(false);
    expect(result.productCount).toBeGreaterThan(0);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.dispensaryName).toBe('Simply Green');
    expect(result.categories.flatMap((cat) => cat.products).some((product) => product.image?.startsWith('data:image/webp;base64,'))).toBe(true);
    // API key is never printed; only the error message is surfaced.
    expect(mockFetch.mock.calls[0][1].headers['x-api-key']).toBe('test-key');
  });

  it('does not fall back to direct fetch and returns demo when no API key or Browserless token is configured', async () => {
    const mockFetch = vi.fn(() => {
      // Any public GraphQL or direct fetch attempt should fail so the demo path is exercised.
      return Promise.resolve(
        new Response(JSON.stringify({ errors: [{ message: 'Forbidden' }] }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }) as unknown as typeof fetch;
    globalThis.fetch = mockFetch;

    const result = await resolveMenuSource('green-leaf', {});
    expect(result.demo).toBe(true);
    expect(result.productCount).toBeGreaterThan(0);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.dispensaryName).toBe('Simply Green');
    expect(result.categories.flatMap((cat) => cat.products).some((product) => product.image?.startsWith('data:image/webp;base64,'))).toBe(true);

    // The direct-fetch path (dutchie.com/embedded-menu/<slug>) must never be called; the demo fallback is the last resort.
    const calledUrls = mockFetch.mock.calls.map((call) => String(call[0]));
    expect(calledUrls.some((url) => url.includes('dutchie.com/embedded-menu/green-leaf'))).toBe(false);
  });

  it('extracts a Dutchie slug from a generic website and imports it', async () => {
    const html = '<html><head><title>Green Leaf</title></head><body><iframe src="https://dutchie.com/embedded-menu/green-leaf"></iframe></body></html>';
    let calls = 0;
    globalThis.fetch = vi.fn(() => {
      calls++;
      if (calls === 1) {
        return Promise.resolve(new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } }));
      }
      if (calls === 2) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { dispensary: { id: 'd-1', name: 'Green Leaf' } } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              filteredProducts: {
                products: [{ id: 'p1', name: 'Blue Dream', category: 'Flower', recPrices: [35] }],
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }) as unknown as typeof fetch;

    const result = await resolveMenuSource('https://greenleaf.com/menu', { DUTCHIE_API_KEY: 'test-key' });
    expect(result.source).toBe('website-dutchie:https://greenleaf.com/menu');
    expect(result.dispensaryName).toBe('Green Leaf');
    expect(result.productCount).toBe(1);
  });

  it('falls back to demo sample menu when the public API returns a dispensary but no products', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(() => {
      calls++;
      if (calls === 1) {
        // ConsumerDispensaries succeeds
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                filteredDispensaries: [{ id: 'd-1', name: 'Green Leaf', logoImage: 'https://img.com/logo.png', menuSections: [] }],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
      // FilteredProducts returns empty
      return Promise.resolve(
        new Response(
          JSON.stringify({ data: { filteredProducts: { products: [] } } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }) as unknown as typeof fetch;

    const result = await resolveMenuSource('green-leaf', {});
    expect(result.demo).toBe(true);
    expect(result.apiUsed).toBe(false);
    expect(result.productCount).toBeGreaterThan(0);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.source).toBe('dutchie-slug:demo');
    expect(result.dispensaryName).toBe('Simply Green');
    expect(result.categories.flatMap((cat) => cat.products).some((product) => product.image?.startsWith('data:image/webp;base64,'))).toBe(true);
  });

  it('falls back to demo sample menu when the public API returns only unpriced products', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              filteredDispensaries: [{ id: 'd-1', name: 'Green Leaf', menuSections: [] }],
              filteredProducts: {
                products: [
                  { id: 'p1', name: 'Blue Dream 3.5g', brand: 'High Garden', category: 'Flower', recPrices: [], Options: ['3.5g'] },
                ],
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    ) as unknown as typeof fetch;

    const result = await resolveMenuSource('green-leaf', {});
    expect(result.demo).toBe(true);
    expect(result.productCount).toBeGreaterThan(0);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.dispensaryName).toBe('Simply Green');
    expect(result.categories.flatMap((cat) => cat.products).some((product) => product.image?.startsWith('data:image/webp;base64,'))).toBe(true);
  });

  it('falls back to demo menu for a generic website that has no products', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response('<html><body>Coming soon</body></html>', { status: 200 }))
    ) as unknown as typeof fetch;

    const result = await resolveMenuSource('https://empty-menu.com', {});
    expect(result.demo).toBe(true);
    expect(result.source).toBe('website-generic:demo');
    expect(result.productCount).toBeGreaterThan(0);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.dispensaryName).toBe('Simply Green');
    expect(result.categories.flatMap((cat) => cat.products).some((product) => product.image?.startsWith('data:image/webp;base64,'))).toBe(true);
  });

  it('falls back to a Simply Green demo menu when live Dutchie data is unavailable', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ errors: [{ message: 'Forbidden' }] }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    ) as unknown as typeof fetch;

    const result = await resolveMenuSource('https://simplygreenny.com/shop', {});
    expect(result.demo).toBe(true);
    expect(result.source).toBe('simply-green:demo');
    expect(result.dispensaryName).toBe('Simply Green');
    expect(result.productCount).toBeGreaterThan(0);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.categories.flatMap((cat) => cat.products).some((product) => product.image?.startsWith('data:image/webp;base64,'))).toBe(true);
  });

  it('imports a Dutchie slug via the public GraphQL API when no private API key is configured', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(() => {
      calls++;
      if (calls === 1) {
        // ConsumerDispensaries
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                filteredDispensaries: [
                  { id: 'd-1', name: 'Green Leaf', logoImage: 'https://img.com/logo.png', menuSections: [] },
                ],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
      // FilteredProducts
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              filteredProducts: {
                products: [
                  { id: 'p1', name: 'Blue Dream 3.5g', brand: 'High Garden', category: 'Flower', recPrices: [35], Options: ['3.5g'] },
                ],
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }) as unknown as typeof fetch;

    const result = await resolveMenuSource('green-leaf', {});
    expect(result.dispensaryName).toBe('Green Leaf');
    expect(result.apiUsed).toBe(false);
    expect(result.demo).toBeFalsy();
    expect(result.productCount).toBe(1);
    expect(result.categories[0].name).toBe('Flower');
    expect(result.categories[0].products[0].brand).toBe('High Garden');
  });
});

describe('scrapeGenericWebsite', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('imports JSON-LD products from a generic website', async () => {
    const html = `<html><head><title>Organic Dispensary</title><meta property="og:image" content="https://example.com/logo.png"></head>
    <body>
      <script type="application/ld+json">
      [{
        "@type": "Product",
        "name": "Mango Gummies",
        "offers": { "price": "18.00" },
        "brand": "Kiva",
        "image": "https://example.com/gummy.jpg"
      },{
        "@type": "Product",
        "name": "OG Kush Flower",
        "offers": { "price": "45.00" },
        "category": "Flower"
      }]
      </script>
    </body></html>`;
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } }))
    ) as unknown as typeof fetch;

    const result = await scrapeGenericWebsite('https://organic-dispensary.com/menu');
    expect(result.dispensaryName).toBe('Organic Dispensary');
    expect(result.logo).toBe('https://example.com/logo.png');
    expect(result.productCount).toBe(2);
    const names = result.categories.map((c) => c.name);
    expect(names).toContain('Flower');
    expect(names).toContain('Edibles');
  });

  it('throws a clear error when no products are found', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response('<html><body>Coming soon</body></html>', { status: 200 }))
    ) as unknown as typeof fetch;

    await expect(scrapeGenericWebsite('https://empty-menu.com')).rejects.toThrow('No menu products found');
  });
});
