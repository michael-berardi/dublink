import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectMenuSource, extractDutchieSlugFromHtml, normalizePublicHttpUrl, resolveMenuSource, scrapeGenericWebsite } from '../src/menu-source';

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

  it('routes Simply Green production URLs through its live Dutchie store', () => {
    const s = detectMenuSource('https://simplygreenny.com/shop');
    expect(s).toMatchObject({
      type: 'website-dutchie',
      slug: 'simply-green',
      url: 'https://simplygreenny.com/shop',
    });

    const www = detectMenuSource('https://www.simplygreenny.com/');
    expect(www).toMatchObject({
      type: 'website-dutchie',
      slug: 'simply-green',
      url: 'https://www.simplygreenny.com/',
    });

    const staging = detectMenuSource('https://dc88ae0b.simply-green-ny.pages.dev/shop');
    expect(staging.type).toBe('website-generic');
    expect(staging.url).toBe('https://dc88ae0b.simply-green-ny.pages.dev/shop');
  });

  it('detects Dutchie v2 embedded-menu script IDs as raw Dutchie IDs', () => {
    const s = detectMenuSource('https://dutchie.com/api/v2/embedded-menu/69ab2eec51d4a55999d225a5.js');
    expect(s.type).toBe('dutchie-embedded');
    expect(s.slug).toBe('69ab2eec51d4a55999d225a5');
  });

  it('treats unknown Dutchie embedded-menu script IDs as importable Dutchie IDs', () => {
    const s = detectMenuSource('https://dutchie.com/api/v2/embedded-menu/aaaaaaaaaaaaaaaaaaaaaaaa.js');
    expect(s.type).toBe('dutchie-embedded');
    expect(s.slug).toBe('aaaaaaaaaaaaaaaaaaaaaaaa');
  });

  it('detects generic website URLs', () => {
    const s = detectMenuSource('https://example-dispensary.com/menu');
    expect(s.type).toBe('website-generic');
    expect(s.url).toBe('https://example-dispensary.com/menu');
  });

  it('does not classify lookalike hostnames as Dutchie', () => {
    const source = detectMenuSource('https://notdutchie.com/menu');
    expect(source.type).toBe('website-generic');
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

  it('ignores Dutchie v2 embedded script IDs because they are not cName slugs', () => {
    const html = '<script src="https://dutchie.com/api/v2/embedded-menu/69ab2eec51d4a55999d225a5.js"></script>';
    expect(extractDutchieSlugFromHtml(html)).toBeNull();
  });

  it('does not extract unknown Dutchie v2 embedded script IDs from website HTML', () => {
    const html = '<script src="https://dutchie.com/api/v2/embedded-menu/bbbbbbbbbbbbbbbbbbbbbbbb.js"></script>';
    expect(extractDutchieSlugFromHtml(html)).toBeNull();
  });

  it('returns null when no Dutchie link is present', () => {
    expect(extractDutchieSlugFromHtml('<html><body>No menu here</body></html>')).toBeNull();
  });

  it('ignores reserved Dutchie slugs in HTML links', () => {
    expect(extractDutchieSlugFromHtml('<a href="https://dutchie.com/stores">Stores directory</a>')).toBeNull();
    expect(extractDutchieSlugFromHtml('<a href="https://dutchie.com/help">Help center</a>')).toBeNull();
    expect(extractDutchieSlugFromHtml('<a href="https://dutchie.com/api/v2/embedded-menu/69ab2eec51d4a55999d225a5.js"></a>')).toBeNull();
  });

  it('ignores Dutchie image CDN URLs when scanning website HTML', () => {
    const html = '<img src="https://images.dutchie.com/d40b22887286904038e34b337e29428b?fm=webp">';
    expect(extractDutchieSlugFromHtml(html)).toBeNull();
  });
});

describe('normalizePublicHttpUrl', () => {
  it('rejects local and private network URLs before scanning', () => {
    expect(() => normalizePublicHttpUrl('http://localhost:3000/menu')).toThrow('public');
    expect(() => normalizePublicHttpUrl('http://127.0.0.1/menu')).toThrow('public');
    expect(() => normalizePublicHttpUrl('http://10.0.0.8/menu')).toThrow('public');
    expect(() => normalizePublicHttpUrl('http://192.168.1.4/menu')).toThrow('public');
  });

  it('normalizes public hostnames without fragments', () => {
    expect(normalizePublicHttpUrl('greenleaf.example/menu#section')).toBe('https://greenleaf.example/menu');
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

  function publicProductsResponse(category = 'Flower', name = 'Blue Dream 3.5g') {
    return graphqlResponse({
      filteredProducts: {
        products: [{ id: 'p1', name, brand: 'High Garden', category, recPrices: [35], Options: ['3.5g'] }],
        queryInfo: { totalCount: 1, totalPages: 1 },
      },
    });
  }

  it('falls back to the private Dutchie API when the public API is unavailable', async () => {
    globalThis.fetch = vi.fn((_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (!headers.has('x-api-key')) {
        return Promise.resolve(
          new Response(JSON.stringify({ errors: [{ message: 'Public API unavailable' }] }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      const query = JSON.parse(String(init?.body)).query as string;
      if (query.includes('GetDispensary')) {
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

  it('surfaces live import failures instead of pretending a demo import succeeded', async () => {
    const mockFetch = vi.fn<typeof fetch>((input, init) => {
      void input;
      void init;
      return Promise.resolve(
        new Response(JSON.stringify({ errors: [{ message: 'Forbidden' }] }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
    globalThis.fetch = mockFetch;

    await expect(resolveMenuSource('green-leaf', { DUTCHIE_API_KEY: 'test-key' })).rejects.toThrow('Could not import live menu products');
    // API key is never printed; only the error message is surfaced.
    expect(mockFetch.mock.calls.some((call) => new Headers(call[1]?.headers).get('x-api-key') === 'test-key')).toBe(true);
  });

  it('does not fall back to direct fetch when no API key or Browserless token is configured', async () => {
    const mockFetch = vi.fn<typeof fetch>((input, init) => {
      void input;
      void init;
      return Promise.resolve(
        new Response(JSON.stringify({ errors: [{ message: 'Forbidden' }] }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
    globalThis.fetch = mockFetch;

    await expect(resolveMenuSource('green-leaf', {})).rejects.toThrow('Could not import live menu products');

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
        return graphqlResponse({ filteredDispensaries: [{ id: 'd-1', name: 'Green Leaf' }] });
      }
      return publicProductsResponse('Flower', 'Blue Dream');
    }) as unknown as typeof fetch;

    const result = await resolveMenuSource('https://greenleaf.com/menu', { DUTCHIE_API_KEY: 'test-key' });
    expect(result.source).toBe('website-dutchie:https://greenleaf.com/menu');
    expect(result.dispensaryName).toBe('Green Leaf');
    expect(result.productCount).toBe(1);
  });

  it('asks Overseer Products Crawl for embedded Dutchie discovery before direct website fetch', async () => {
    const mockFetch = vi.fn<typeof fetch>((input, init) => {
      const url = String(input);
      if (url === 'https://crawl.example/v2/products/crawl') {
        expect(init?.headers).toMatchObject({ Authorization: 'Bearer crawl-key' });
        expect(JSON.parse(String(init?.body))).toMatchObject({
          url: 'https://greenleaf.com/menu',
          preferDutchie: true,
        });
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              sourceURL: 'https://greenleaf.com/menu',
              dutchie: { kind: 'iframe', slug: 'green-leaf', embedUrl: 'https://dutchie.com/embedded-menu/green-leaf' },
              products: [],
              categories: [],
              warnings: [],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
      const operationName = JSON.parse(String(init?.body)).operationName;
      if (operationName === 'ConsumerDispensaries') {
        return graphqlResponse({ filteredDispensaries: [{ id: 'd-1', name: 'Green Leaf' }] });
      }
      return publicProductsResponse('Flower', 'Blue Dream');
    });
    globalThis.fetch = mockFetch;

    const result = await resolveMenuSource('https://greenleaf.com/menu', {
      OVERSEER_CRAWL_URL: 'https://crawl.example',
      OVERSEER_CRAWL_API_KEY: 'crawl-key',
    });

    expect(result.source).toBe('website-dutchie:https://greenleaf.com/menu');
    expect(result.dispensaryName).toBe('Green Leaf');
    expect(mockFetch.mock.calls[0]?.[0]).toBe('https://crawl.example/v2/products/crawl');
  });

  it('rejects instead of using bounded crawl products after discovering a Dutchie menu', async () => {
    let crawlCalls = 0;
    let websiteCalls = 0;
    globalThis.fetch = vi.fn<typeof fetch>((input) => {
      const url = String(input);
      if (url === 'https://crawl.example/v2/products/crawl') {
        crawlCalls++;
        return Promise.resolve(new Response(JSON.stringify({
          success: true,
          sourceURL: 'https://partner.example/menu',
          dutchie: { kind: 'iframe', slug: 'green-leaf', embedUrl: 'https://dutchie.com/embedded-menu/green-leaf' },
          products: [{ id: 'partial', name: 'Partial Product', price: 25 }],
          categories: [],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      if (url === 'https://partner.example/menu') {
        websiteCalls++;
        return Promise.resolve(new Response('<script type="application/ld+json">{"@type":"Product","name":"Partial Product","offers":{"price":25}}</script>'));
      }
      if (url.startsWith('https://dutchie.com/graphql')) {
        return Promise.resolve(new Response(JSON.stringify({ errors: [{ message: 'Unavailable' }] }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }));
    });

    await expect(resolveMenuSource('https://partner.example/menu', {
      OVERSEER_CRAWL_URL: 'https://crawl.example',
      OVERSEER_CRAWL_API_KEY: 'crawl-key',
    })).rejects.toThrow('Could not import live menu products');
    expect(crawlCalls).toBe(1);
    expect(websiteCalls).toBe(0);
  });

  it('rejects an embed-id-only Dutchie crawl instead of accepting its bounded products', async () => {
    globalThis.fetch = vi.fn<typeof fetch>((input) => {
      const url = String(input);
      if (url === 'https://crawl.example/v2/products/crawl') {
        return Promise.resolve(new Response(JSON.stringify({
          success: true,
          sourceURL: 'https://partner.example/menu',
          dutchie: { kind: 'script', embedId: 'dispensary-123' },
          products: [{ id: 'partial', name: 'Partial Product', price: 25 }],
          categories: [],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }));
    });

    await expect(resolveMenuSource('https://partner.example/menu', {
      OVERSEER_CRAWL_URL: 'https://crawl.example',
      OVERSEER_CRAWL_API_KEY: 'crawl-key',
    })).rejects.toThrow('Refusing to use an unverified partial product crawl');
  });

  it('rejects instead of using JSON-LD products after discovering a Dutchie iframe', async () => {
    let websiteCalls = 0;
    globalThis.fetch = vi.fn<typeof fetch>((input) => {
      const url = String(input);
      if (url === 'https://partner.example/menu') {
        websiteCalls++;
        return Promise.resolve(new Response(
          '<iframe src="https://dutchie.com/embedded-menu/green-leaf"></iframe>'
          + '<script type="application/ld+json">{"@type":"Product","name":"Partial Product","offers":{"price":25}}</script>'
        ));
      }
      if (url.startsWith('https://dutchie.com/graphql')) {
        return Promise.resolve(new Response(JSON.stringify({ errors: [{ message: 'Unavailable' }] }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }));
    });

    await expect(resolveMenuSource('https://partner.example/menu', {})).rejects.toThrow(
      'Could not import live menu products'
    );
    expect(websiteCalls).toBe(1);
  });

  it('imports standardized products from Overseer Products Crawl for arbitrary ecommerce sites', async () => {
    const mockFetch = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            sourceURL: 'https://shop.example/menu',
            discoveredUrls: ['https://shop.example/menu', 'https://shop.example/products/flower'],
            products: [
              { id: 'og', name: 'OG Kush Flower', price: 45, category: 'Flower', brand: 'House', image: 'https://img.example/og.jpg' },
              { id: 'gummy', name: 'Mango Gummies', price: 18, category: 'Edibles', brand: 'Kiva' },
            ],
            categories: [],
            warnings: ['Some product pages were skipped.'],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    globalThis.fetch = mockFetch;

    const result = await resolveMenuSource('https://shop.example/menu', {
      OVERSEER_CRAWL_URL: 'https://crawl.example/',
      OVERSEER_CRAWL_API_KEY: 'crawl-key',
    });

    expect(result.source).toBe('overseer-products-crawl');
    expect(result.productCount).toBe(2);
    expect(result.categories.map((c) => c.name)).toEqual(['Flower', 'Edibles']);
    expect(result.warnings).toContain('Overseer Products Crawl checked 2 pages.');
  });

  it('cleans pipe-delimited Overseer product names while preserving imported metadata', async () => {
    const mockFetch = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            sourceURL: 'https://shop.example/menu',
            discoveredUrls: ['https://shop.example/menu'],
            products: [
              {
                id: 'motor-cake',
                name: 'Connected Cannabis | Flower | Hybrid | Motor Cake',
                price: 38,
                category: 'Flower',
                brand: 'Connected Cannabis',
                thc: '29%',
              },
            ],
            categories: [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    globalThis.fetch = mockFetch;

    const result = await resolveMenuSource('https://shop.example/menu', {
      OVERSEER_CRAWL_URL: 'https://crawl.example/',
      OVERSEER_CRAWL_API_KEY: 'crawl-key',
    });

    expect(result.source).toBe('overseer-products-crawl');
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe('Flower');
    expect(result.categories[0].products[0]).toMatchObject({
      name: 'Motor Cake',
      brand: 'Connected Cannabis',
      category: 'Flower',
      strain: 'hybrid',
      thc: '29%',
    });
  });

  it('rejects when the public API returns a dispensary but no products', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(() => {
      calls++;
      if (calls === 1) {
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
      return Promise.resolve(
        new Response(
          JSON.stringify({ data: { filteredProducts: { products: [] } } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }) as unknown as typeof fetch;

    await expect(resolveMenuSource('green-leaf', {})).rejects.toThrow('Could not import live menu products');
  });

  it('rejects when the public API returns only unpriced products', async () => {
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

    await expect(resolveMenuSource('green-leaf', {})).rejects.toThrow('Could not import live menu products');
  });

  it('rejects a generic website that has no products', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response('<html><body>Coming soon</body></html>', { status: 200 }))
    ) as unknown as typeof fetch;

    await expect(resolveMenuSource('https://empty-menu.com', {})).rejects.toThrow('No live menu products found');
  });

  it('imports Simply Green through Browserless when public GraphQL is blocked', async () => {
    const structuredUrls: string[] = [];
    let privateCalls = 0;
    globalThis.fetch = vi.fn<typeof fetch>((input, init) => {
      if (new Headers(init?.headers).has('x-api-key')) {
        privateCalls++;
        return Promise.resolve(new Response('Private API should not be called', { status: 500 }));
      }
      const requestedUrl = String(input);
      if (requestedUrl.startsWith('https://dutchie.com/graphql')) {
        return Promise.resolve(
          new Response(JSON.stringify({ errors: [{ message: 'Forbidden' }] }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      if (requestedUrl.startsWith('https://overseer-browser-production.up.railway.app/scrape-dutchie-menu')) {
        structuredUrls.push(requestedUrl);
        return Promise.resolve(
          new Response(
            JSON.stringify({
              responses: [
                {
                  json: {
                    data: {
                      filteredProducts: {
                        products: [
                          { id: 'p1', name: 'Blue Dream 3.5g', brandName: 'Simply Green', type: 'Flower', recPrices: [35], strainType: 'Hybrid' },
                        ],
                        queryInfo: { totalCount: 1, totalPages: 1 },
                      },
                    },
                  },
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }));
    });

    const result = await resolveMenuSource('https://simplygreenny.com/shop', {
      BROWSERLESS_TOKEN: 'browser-token',
      DUTCHIE_API_KEY: 'private-key',
    });
    expect(result.demo).toBeFalsy();
    expect(result.source).toBe('website-dutchie');
    expect(result.productCount).toBe(1);
    expect(result.categories[0].name).toBe('Flower');
    expect(structuredUrls[0]).toContain(encodeURIComponent('https://dutchie.com/stores/simply-green'));
    expect(privateCalls).toBe(0);
  });

  it('does not replace a failed Simply Green import with a bounded crawl subset', async () => {
    let crawlCalls = 0;
    let privateCalls = 0;
    globalThis.fetch = vi.fn<typeof fetch>((input, init) => {
      if (new Headers(init?.headers).has('x-api-key')) {
        privateCalls++;
        return Promise.resolve(new Response('Private API should not be called', { status: 500 }));
      }
      const url = String(input);
      if (url.startsWith('https://dutchie.com/graphql')) {
        return Promise.resolve(
          new Response(JSON.stringify({ errors: [{ message: 'Forbidden' }] }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      if (url.startsWith('https://crawl.example/v2/products/crawl')) {
        crawlCalls++;
        return Promise.resolve(
          new Response(JSON.stringify({
            success: true,
            productCount: 40,
            products: [{ id: 'partial', name: 'Partial Product', price: 25 }],
          }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        );
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }));
    });

    await expect(resolveMenuSource('https://simplygreenny.com/shop', {
      OVERSEER_CRAWL_URL: 'https://crawl.example',
      OVERSEER_CRAWL_API_KEY: 'crawl-key',
      DUTCHIE_API_KEY: 'private-key',
    })).rejects.toThrow('Could not import live menu products');
    expect(crawlCalls).toBe(0);
    expect(privateCalls).toBe(0);
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

  it('imports Dutchie menu products from the dedicated product endpoint', async () => {
    let calls = 0;
    const mockFetch = vi.fn(() => {
      calls++;
      if (calls === 1) {
        return graphqlResponse({
          filteredDispensaries: [{ id: 'd-1', name: 'Green Leaf', logoImage: 'https://img.com/logo.png' }],
        });
      }
      return publicProductsResponse('Tinctures', 'CBD Drops 30ml');
    }) as unknown as typeof fetch;
    globalThis.fetch = mockFetch;

    const result = await resolveMenuSource('green-leaf', {});
    expect(result.dispensaryName).toBe('Green Leaf');
    expect(result.productCount).toBe(1);
    expect(result.categories[0].name).toBe('Tinctures');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('tries public Dutchie import before private API for store URLs from QR setup', async () => {
    const requestedOperations: string[] = [];
    const mockFetch = vi.fn((_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      const operationName = JSON.parse(String(init?.body)).operationName;
      requestedOperations.push(operationName);
      if (operationName === 'ConsumerDispensaries') {
        return graphqlResponse({ filteredDispensaries: [{ id: 'd-1', name: 'Green Leaf' }] });
      }
      return publicProductsResponse();
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const result = await resolveMenuSource('https://dutchie.com/stores/green-leaf', { DUTCHIE_API_KEY: 'private-key' });
    expect(result.apiUsed).toBe(false);
    expect(result.productCount).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(requestedOperations).toEqual(['ConsumerDispensaries', 'FilteredProducts']);
  });

  it('tries public Dutchie import before private API for bare store slugs', async () => {
    let privateCalls = 0;
    const requestedOperations: string[] = [];
    const mockFetch = vi.fn((_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      if (new Headers(init?.headers).has('x-api-key')) {
        privateCalls++;
        return Promise.resolve(
          new Response(JSON.stringify({ errors: [{ message: 'Legacy API unavailable' }] }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      const operationName = JSON.parse(String(init?.body)).operationName as string;
      requestedOperations.push(operationName);
      if (operationName === 'ConsumerDispensaries') {
        return graphqlResponse({ filteredDispensaries: [{ id: 'd-1', name: 'Simply Green' }] });
      }
      return publicProductsResponse();
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const result = await resolveMenuSource('simply-green', { DUTCHIE_API_KEY: 'private-key' });

    expect(result.apiUsed).toBe(false);
    expect(result.productCount).toBe(1);
    expect(privateCalls).toBe(0);
    expect(requestedOperations).toEqual(['ConsumerDispensaries', 'FilteredProducts']);
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


  it('handles attributed scripts, graphs, offer arrays, metadata, and stock identifiers', async () => {
    const html = `<html><head><title>Green &amp; Leaf</title><meta property="og:image" content="/brand/logo.png"></head>
    <body><script nonce="abc" id="catalog" type='application/ld+json'>
      {"@graph":[{"@type":"Product","name":"Mango Gummies","description":"Bright mango flavor","offers":[{"price":"18.00","availability":"http://schema.org/OutOfStock"}]}]}
    </script></body></html>`;
    globalThis.fetch = vi.fn(() => Promise.resolve(new Response(html, { status: 200 }))) as unknown as typeof fetch;

    const result = await scrapeGenericWebsite('https://green-leaf.example/menu');
    expect(result.dispensaryName).toBe('Green & Leaf');
    expect(result.logo).toBe('https://green-leaf.example/brand/logo.png');
    expect(result.productCount).toBe(1);
    expect(result.categories[0].products[0]).toMatchObject({
      name: 'Mango Gummies',
      price: 18,
      description: 'Bright mango flavor',
      inStock: false,
    });
  });

  it('keeps all generic products for the formatter to rank and cap', async () => {
    const products = Array.from({ length: 41 }, (_, index) => ({
      '@type': 'Product',
      name: `Flower ${index}`,
      category: 'Flower',
      offers: { price: String(index + 1) },
    }));
    const html = `<script type="application/ld+json">${JSON.stringify(products)}</script>`;
    globalThis.fetch = vi.fn(() => Promise.resolve(new Response(html, { status: 200 }))) as unknown as typeof fetch;

    const result = await scrapeGenericWebsite('https://large-menu.example');
    expect(result.productCount).toBe(41);
    expect(result.categories[0].products).toHaveLength(41);
  });

  it('throws a clear error when no products are found', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response('<html><body>Coming soon</body></html>', { status: 200 }))
    ) as unknown as typeof fetch;

    await expect(scrapeGenericWebsite('https://empty-menu.com')).rejects.toThrow('No menu products found');
  });
});
