import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrapeDutchie } from '../src/dutchie-scraper';
import { formatMenu } from '../src/menu-formatter';
import { tvPage } from '../src/html-tv';
import { bundleImportedImages } from '../src/upload';

const DUTCHIE_MENU_URL = 'https://overseer-browser-production.up.railway.app/scrape-dutchie-menu';
const BROWSERLESS_URL = 'https://overseer-browser-production.up.railway.app/scrape-specials';

function structuredResponse(products: unknown[]) {
  return new Response(
    JSON.stringify({
      responses: [{ json: { data: { filteredProducts: { products } } } }],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

function baseProduct(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    name: `${id} Product`,
    type: 'flower',
    recPrices: [25],
    ...extra,
  };
}

describe('Dutchie scraper image extraction', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const imageCases = [
    {
      name: 'capitalized Image field',
      product: baseProduct('image-cap', {
        Image: 'https://images.dutchie.com/image-cap.jpg?dpr=2&h=200&w=200',
      }),
      expected: 'https://images.dutchie.com/image-cap.jpg?h=400&w=400',
    },
    {
      name: 'lowercase image field',
      product: baseProduct('image-lower', {
        image: 'https://images.dutchie.com/image-lower.jpg?dpr=2',
      }),
      expected: 'https://images.dutchie.com/image-lower.jpg?h=400&w=400',
    },
    {
      name: 'images array with active entry',
      product: baseProduct('image-array', {
        images: [{ url: 'https://images.dutchie.com/image-array.jpg', active: true }],
      }),
      expected: 'https://images.dutchie.com/image-array.jpg?h=400&w=400',
    },
    {
      name: 'POSMetaData.canonicalImgUrl',
      product: baseProduct('pos-meta', {
        POSMetaData: { canonicalImgUrl: 'https://images.dutchie.com/pos-meta.jpg' },
      }),
      expected: 'https://images.dutchie.com/pos-meta.jpg?h=400&w=400',
    },
    {
      name: 'lowercase posMetadata.canonicalImgUrl',
      product: baseProduct('pos-meta-lower', {
        posMetadata: { canonicalImgUrl: 'https://images.dutchie.com/pos-meta-lower.jpg' },
      }),
      expected: 'https://images.dutchie.com/pos-meta-lower.jpg?h=400&w=400',
    },
    {
      name: 'thumbnail field fallback',
      product: baseProduct('thumbnail', {
        thumbnail: 'https://images.dutchie.com/thumb.jpg',
      }),
      expected: 'https://images.dutchie.com/thumb.jpg?h=400&w=400',
    },
    {
      name: 'productImage field fallback',
      product: baseProduct('product-image', {
        productImage: 'https://images.dutchie.com/product.jpg',
      }),
      expected: 'https://images.dutchie.com/product.jpg?h=400&w=400',
    },
  ];

  for (const { name, product, expected } of imageCases) {
    it(`normalizes ${name} into a secure, resized image URL`, async () => {
      globalThis.fetch = vi.fn(async (input: string | Request) => {
        const url = typeof input === 'string' ? input : input.url;
        if (url.startsWith(DUTCHIE_MENU_URL)) {
          return structuredResponse([product]);
        }
        return new Response('Not Found', { status: 404 });
      }) as unknown as typeof fetch;

      const result = await scrapeDutchie('image-test', 'test-token');
      const products = result.categories.flatMap((c) => c.products);
      expect(products.length).toBe(1);
      expect(products[0].image).toBe(expected);
    });
  }

  it('preserves option price tiers for TV price matrices', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.startsWith(DUTCHIE_MENU_URL)) {
        return structuredResponse([
          baseProduct('tiered-flower', {
            recPrices: [12, 35, 60],
            Options: ['1g', '3.5g', '7g'],
          }),
        ]);
      }
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const result = await scrapeDutchie('tier-test', 'test-token');
    const products = result.categories.flatMap((c) => c.products);
    expect(products[0].priceTiers).toEqual([
      { label: '1g', price: '$12' },
      { label: '3.5g', price: '$35' },
      { label: '7g', price: '$60' },
    ]);
  });

  it('normalizes edible dosages and rejects impossible tier weights', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (!url.startsWith(DUTCHIE_MENU_URL)) return new Response('Not Found', { status: 404 });
      return structuredResponse([
        baseProduct('edible-dose', {
          type: 'edible',
          recPrices: [26.55, 30],
          Options: ['.1g', '.1g'],
          THCContent: { range: [100], unit: 'PERCENTAGE' },
          CBDContent: { range: [0], unit: 'MILLIGRAMS_PER_PACKAGE' },
        }),
        baseProduct('tincture-dose', {
          type: 'tincture',
          recPrices: [50.44, 57],
          Options: ['427.8g', '427.8g'],
          THCContent: { range: [150], unit: 'PERCENTAGE' },
        }),
      ]);
    }) as unknown as typeof fetch;

    const result = await scrapeDutchie('dose-test', 'test-token');
    const products = new Map(result.categories.flatMap((category) =>
      category.products.map((product) => [product.id, product])
    ));
    expect(products.get('edible-dose')).toMatchObject({
      thc: '100mg',
      weight: '100mg',
      priceTiers: undefined,
    });
    expect(products.get('edible-dose')?.cbd).toBeUndefined();
    expect(products.get('tincture-dose')).toMatchObject({
      thc: '150mg',
      weight: undefined,
      priceTiers: undefined,
    });
  });

  it('preserves Dutchie product descriptions for richer TV cards', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.startsWith(DUTCHIE_MENU_URL)) {
        return structuredResponse([
          baseProduct('described-flower', {
            name: 'Orange Kush',
            description: 'Bright citrus flower with a smooth pine finish.',
            image: 'https://images.dutchie.com/orange-kush.jpg',
          }),
        ]);
      }
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const scraped = await scrapeDutchie('description-test', 'test-token');
    const product = scraped.categories.flatMap((c) => c.products)[0];
    expect(product.description).toBe('Bright citrus flower with a smooth pine finish.');

    const formatted = formatMenu(scraped.categories, scraped.dispensaryName, undefined, { tvOptimize: true });
    const page = tvPage('tv-session', 'https://dubmenu.com', {
      initialConfig: {
        ...formatted,
        showImages: true,
        template: 'default',
      },
    });
    expect(page).toContain('Bright citrus flower with a smooth pine finish.');
    expect(page).toContain('class="card-desc"');
  });

  it('prefers the first active image in the images array', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.startsWith(DUTCHIE_MENU_URL)) {
        return structuredResponse([
          baseProduct('active-precedence', {
            images: [
              { url: 'https://images.dutchie.com/inactive.jpg', active: false },
              { url: 'https://images.dutchie.com/active.jpg', active: true },
              { url: 'https://images.dutchie.com/later.jpg', active: true },
            ],
          }),
        ]);
      }
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const result = await scrapeDutchie('image-test', 'test-token');
    const products = result.categories.flatMap((c) => c.products);
    expect(products[0].image).toBe('https://images.dutchie.com/active.jpg?h=400&w=400');
  });

  it('rejects non-HTTPS and malformed image URLs while keeping HTTPS ones', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.startsWith(DUTCHIE_MENU_URL)) {
        return structuredResponse([
          baseProduct('http-image', {
            image: 'http://images.dutchie.com/insecure.jpg',
          }),
          baseProduct('bad-image', {
            image: 'not a url',
          }),
          baseProduct('https-image', {
            image: 'https://images.dutchie.com/secure.jpg',
          }),
        ]);
      }
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const result = await scrapeDutchie('image-test', 'test-token');
    const products = result.categories.flatMap((c) => c.products);
    const httpProduct = products.find((p) => p.id === 'http-image');
    const badProduct = products.find((p) => p.id === 'bad-image');
    const httpsProduct = products.find((p) => p.id === 'https-image');
    expect(httpProduct?.image).toBeUndefined();
    expect(badProduct?.image).toBeUndefined();
    expect(httpsProduct?.image).toBe('https://images.dutchie.com/secure.jpg?h=400&w=400');
  });

  it('normalizes Browserless fallback p.img into a secure, resized image URL', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.startsWith(DUTCHIE_MENU_URL)) {
        return new Response('Structured scrape unavailable', { status: 500 });
      }
      if (url.startsWith(BROWSERLESS_URL)) {
        return new Response(
          JSON.stringify({
            products: [
              {
                href: '/product/browserless-og-kush',
                text: 'Browserless OG Kush\nHybrid\nTHC 22%\n$35',
                img: 'https://images.dutchie.com/browserless-og.jpg?dpr=2&h=200&w=200',
              },
            ],
            count: 1,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const result = await scrapeDutchie('browserless-test', 'test-token');
    const products = result.categories.flatMap((c) => c.products);
    const product = products.find((p) => p.id === 'browserless-og-kush');
    expect(product?.image).toBe('https://images.dutchie.com/browserless-og.jpg?h=400&w=400');
    expect(product?.thc).toBe('22%');
    expect(product?.brand).toBeUndefined();
  });

  it('renders scraped product images as real <img> tags on the TV page when showImages is true', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.startsWith(DUTCHIE_MENU_URL)) {
        return structuredResponse([
          baseProduct('tv-og', {
            image: 'https://images.dutchie.com/tv-og.jpg',
            name: 'TV OG Kush',
            recPrices: [35],
          }),
        ]);
      }
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const scraped = await scrapeDutchie('tv-test', 'test-token');
    const formatted = formatMenu(scraped.categories, scraped.dispensaryName, undefined, { tvOptimize: true });
    const page = tvPage('tv-session', 'https://dubmenu.com', {
      initialConfig: {
        ...formatted,
        showImages: formatted.layout.showImages,
        template: 'default',
      },
    });

    const expectedUrl = 'https://images.dutchie.com/tv-og.jpg?h=400&w=400';
    expect(page).toContain(expectedUrl);
    expect(page).toContain('var initialConfig = ');
    expect(page).toContain('imgMarkup(p, true)');
    expect(page).toContain('class="card-image card-image-loading"');
  });

  it('parses modern Dutchie store DOM from the Browserless fallback when structured scrape fails', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.startsWith(DUTCHIE_MENU_URL)) {
        return new Response('Structured scrape unavailable', { status: 500 });
      }
      if (url.startsWith(BROWSERLESS_URL)) {
        return new Response(
          JSON.stringify({
            products: [
              {
                href: '/stores/nature-med-gladstone/product/0-5g-diamond-infused-preroll-2pk-1g-la-kush-cake',
                text: '\nHybrid\nTHC: 22%\nCBD: 0.05%\n$14\n$16\nSale\nStaff Pick',
                img: 'https://images.dutchie.com/0-5g-diamond-preroll.jpg?dpr=2&h=200&w=200',
              },
            ],
            count: 1,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const result = await scrapeDutchie('nature-med-gladstone', 'test-token');
    expect(result.productCount).toBe(1);

    const products = result.categories.flatMap((c) => c.products);
    const product = products.find(
      (p) => p.id === '0-5g-diamond-infused-preroll-2pk-1g-la-kush-cake'
    );
    expect(product).toBeDefined();
    expect(product!.name).toBe('Diamond Infused Preroll La Kush Cake');
    expect(product!.price).toBe(14);
    expect(product!.originalPrice).toBe(16);
    expect(product!.thc).toBe('22%');
    expect(product!.cbd).toBe('0.05%');
    expect(product!.weight).toBe('0.5g');
    expect(product!.image).toBe('https://images.dutchie.com/0-5g-diamond-preroll.jpg?h=400&w=400');
    expect(product!.category).toBe('Pre-Rolls');
    expect(product!.special).toBe(true);
    expect(product!.specialLabel).toBe('Staff Pick');
  });

  it('drops individual unpriced fallback cards while retaining priced products', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.startsWith(DUTCHIE_MENU_URL)) return new Response('Unavailable', { status: 500 });
      if (url.startsWith(BROWSERLESS_URL)) {
        return new Response(JSON.stringify({ products: [
          { href: '/product/priced-flower', text: 'Priced Flower\n$25' },
          { href: '/product/no-price-edible', text: 'No Price Edible' },
        ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const result = await scrapeDutchie('fallback-prices', 'test-token');
    expect(result.productCount).toBe(1);
    expect(result.categories.flatMap((category) => category.products).map((product) => product.id)).toEqual(['priced-flower']);
  });

  it('accepts a later priced duplicate and lowercase structured fields', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (!url.startsWith(DUTCHIE_MENU_URL)) return new Response('Not Found', { status: 404 });
      return new Response(JSON.stringify({ responses: [
        { json: { data: { filteredProducts: { products: [{ id: 'duplicate', name: 'Incomplete', recPrices: [] }] } } } },
        { json: { data: { filteredProducts: { products: [{
          id: 'duplicate',
          name: 'Complete Product',
          prices: [25],
          posMetadata: {
            canonicalCategory: 'Flower',
            canonicalBrandName: 'Lowercase Brand',
            children: [{ option: '1g' }],
          },
        }] } } } },
      ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as unknown as typeof fetch;

    const result = await scrapeDutchie('structured-lowercase', 'test-token');
    const products = result.categories.flatMap((category) => category.products);
    expect(result.productCount).toBe(1);
    expect(products[0]).toMatchObject({
      id: 'duplicate',
      price: 25,
      category: 'Flower',
      brand: 'Lowercase Brand',
      weight: '1g',
    });
  });

  it('maps modern Dutchie product types into every supported menu section', async () => {
    const cases = [
      ['clone', 'Flower'],
      ['joint', 'Pre-Rolls'],
      ['disposable', 'Vapes'],
      ['live rosin', 'Concentrates'],
      ['beverage', 'Edibles'],
      ['sublingual', 'Tinctures'],
      ['transdermal patch', 'Topicals'],
      ['cbd wellness', 'CBD'],
      ['apparel', 'Accessories'],
    ];
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (!url.startsWith(DUTCHIE_MENU_URL)) return new Response('Not Found', { status: 404 });
      return structuredResponse(cases.map(([type], index) => baseProduct(`taxonomy-${index}`, { type })));
    }) as unknown as typeof fetch;

    const result = await scrapeDutchie('structured-taxonomy', 'test-token');
    const categoryByProduct = new Map(result.categories.flatMap((category) =>
      category.products.map((product) => [product.id, category.name])
    ));

    cases.forEach(([, expectedCategory], index) => {
      expect(categoryByProduct.get(`taxonomy-${index}`)).toBe(expectedCategory);
    });
  });

  it('removes placeholder fragments from structured product display names', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (!url.startsWith(DUTCHIE_MENU_URL)) return new Response('Not Found', { status: 404 });
      return structuredResponse([
        baseProduct('dangling-pack', { name: 'Sour Unicorn | . x', type: 'pre-roll', brandName: 'Hudson Cannabis' }),
        baseProduct('empty-segment', { name: 'Ceramic Tip | | Strawberry Runtz', type: 'pre-roll', brandName: 'Torrwood Farm' }),
        baseProduct('potency-only', { name: 'THC : CBD', type: 'vape', brandName: 'ayrloom' }),
        baseProduct('unbranded-potency', { name: 'THC : CBD', type: 'vape' }),
        baseProduct('placeholder-only', { name: 'x', type: 'edible', brandName: 'Incredibles' }),
        baseProduct('empty-brackets', { name: 'Camino Watermelon Gummies [ ]', type: 'edible', brandName: 'Camino' }),
        baseProduct('count-suffix', { name: 'Sweet Chili x Sea Salt Caramel x Chicago | 20 x', type: 'edible', brandName: 'Space Poppers' }),
        baseProduct('dangling-x', { name: 'Blue Raspberry Dream x', type: 'pre-roll', brandName: 'Test Brand' }),
      ]);
    }) as unknown as typeof fetch;

    const result = await scrapeDutchie('structured-names', 'test-token');
    const names = new Map(result.categories.flatMap((category) =>
      category.products.map((product) => [product.id, product.name])
    ));
    expect(names).toEqual(new Map([
      ['dangling-pack', 'Sour Unicorn'],
      ['empty-segment', 'Ceramic Tip | Strawberry Runtz'],
      ['potency-only', 'ayrloom THC + CBD'],
      ['unbranded-potency', 'Cannabis Vape'],
      ['placeholder-only', 'Incredibles Edible'],
      ['empty-brackets', 'Camino Watermelon Gummies'],
      ['count-suffix', 'Sweet Chili x Sea Salt Caramel x Chicago'],
      ['dangling-x', 'Blue Raspberry Dream'],
    ]));
  });

  it('keeps all structured products for the formatter to rank and cap', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (!url.startsWith(DUTCHIE_MENU_URL)) return new Response('Not Found', { status: 404 });
      return structuredResponse(Array.from({ length: 41 }, (_, index) => baseProduct(`product-${index}`)));
    }) as unknown as typeof fetch;

    const result = await scrapeDutchie('structured-large', 'test-token');
    expect(result.productCount).toBe(41);
    expect(result.categories[0].products).toHaveLength(41);
  });
});

describe('Dutchie import image bundling', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const pngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89,
  ]);

  it('stores imported product images in R2 and rewrites menu config to DubMenu upload URLs', async () => {
    const stored = new Map<string, { body: Blob; metadata?: R2PutOptions }>();
    const uploads = {
      put: vi.fn(async (key: string, body: Blob, options?: R2PutOptions) => {
        stored.set(key, { body, metadata: options });
        return null;
      }),
    } as unknown as R2Bucket;

    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url === 'https://images.dutchie.com/bundled.jpg?h=400&w=400') {
        return new Response(pngBytes, { status: 200, headers: { 'Content-Type': 'image/png' } });
      }
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const config = {
      categories: [
        {
          products: [
            { name: 'Bundled Flower', image: 'https://images.dutchie.com/bundled.jpg?h=400&w=400' },
            { name: 'Same Image', image: 'https://images.dutchie.com/bundled.jpg?h=400&w=400' },
          ],
        },
      ],
      showImages: true,
    };

    const result = await bundleImportedImages(config, { UPLOADS: uploads, APP_URL: 'https://dubmenu.com' }, 'acct_123');
    const first = result.config.categories?.[0]?.products?.[0]?.image;
    const second = result.config.categories?.[0]?.products?.[1]?.image;

    expect(result.warnings).toEqual([]);
    expect(first).toMatch(/^https:\/\/dubmenu\.com\/api\/uploads\/acct_123\/import-[a-f0-9]+\.png$/);
    expect(second).toBe(first);
    expect(uploads.put).toHaveBeenCalledTimes(1);
    expect([...stored.keys()][0]).toMatch(/^acct_123\/import-[a-f0-9]+\.png$/);
  });

  it('removes product image URLs without fetching when imported TV layout hides images', async () => {
    const uploads = {
      put: vi.fn(),
    } as unknown as R2Bucket;
    globalThis.fetch = vi.fn(async () => {
      throw new Error('product images should not be fetched');
    }) as unknown as typeof fetch;

    const config = {
      categories: [
        {
          products: [
            { name: 'Dense Row', image: 'https://images.dutchie.com/dense.jpg' },
          ],
        },
      ],
      showImages: false,
    };

    const result = await bundleImportedImages(config, { UPLOADS: uploads, APP_URL: 'https://dubmenu.com' }, 'acct_123');

    expect(result.config.categories?.[0]?.products?.[0]?.image).toBeUndefined();
    expect(result.warnings).toEqual([]);
    expect(uploads.put).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });


  it('omits external image URLs that cannot be safely ingested', async () => {
    const uploads = {
      put: vi.fn(),
    } as unknown as R2Bucket;

    globalThis.fetch = vi.fn(async () => new Response('not-image', { status: 200, headers: { 'Content-Type': 'text/plain' } })) as unknown as typeof fetch;

    const config = {
      categories: [
        {
          products: [
            { name: 'HTTP Image', image: 'http://images.dutchie.com/insecure.jpg' },
            { name: 'Bad Image', image: 'https://images.dutchie.com/bad.jpg' },
          ],
        },
      ],
      showImages: true,
    };

    const result = await bundleImportedImages(config, { UPLOADS: uploads, APP_URL: 'https://dubmenu.com' }, 'acct_123');

    expect(result.config.categories?.[0]?.products?.[0]?.image).toBeUndefined();
    expect(result.config.categories?.[0]?.products?.[1]?.image).toBeUndefined();
    expect(result.warnings).toHaveLength(2);
    expect(uploads.put).not.toHaveBeenCalled();
  });

  it('omits imported image URLs when R2 storage rejects the bundled image', async () => {
    const uploads = {
      put: vi.fn(async () => {
        throw new Error('R2 unavailable');
      }),
    } as unknown as R2Bucket;

    globalThis.fetch = vi.fn(async () => new Response(pngBytes, { status: 200, headers: { 'Content-Type': 'image/png' } })) as unknown as typeof fetch;

    const config = {
      categories: [
        {
          products: [
            { name: 'Storage Fail Image', image: 'https://images.dutchie.com/storage-fail.jpg' },
          ],
        },
      ],
      showImages: true,
    };

    const result = await bundleImportedImages(config, { UPLOADS: uploads, APP_URL: 'https://dubmenu.com' }, 'acct_123');

    expect(result.config.categories?.[0]?.products?.[0]?.image).toBeUndefined();
    expect(result.warnings).toHaveLength(1);
    expect(uploads.put).toHaveBeenCalledTimes(1);
  });

  it('versions immutable imported image URLs when source bytes change', async () => {
    const storedKeys: string[] = [];
    const uploads = { put: vi.fn(async (key: string) => { storedKeys.push(key); return null; }) } as unknown as R2Bucket;
    const source = 'https://images.dutchie.com/versioned.png';
    const config = () => ({ categories: [{ products: [{ name: 'Versioned', image: source }] }], showImages: true });
    const secondPng = new Uint8Array(pngBytes);
    secondPng[secondPng.length - 1] ^= 0x01;
    let version = 0;
    globalThis.fetch = vi.fn(async () => new Response(version++ === 0 ? pngBytes : secondPng, { status: 200 })) as unknown as typeof fetch;

    await bundleImportedImages(config(), { UPLOADS: uploads, APP_URL: 'https://dubmenu.com' }, 'acct_123');
    await bundleImportedImages(config(), { UPLOADS: uploads, APP_URL: 'https://dubmenu.com' }, 'acct_123');

    expect(storedKeys).toHaveLength(2);
    expect(storedKeys[0]).not.toBe(storedKeys[1]);
  });

  it('cancels an oversized streamed image before buffering the full response', async () => {
    let cancelled = false;
    const chunk = new Uint8Array(1024 * 1024);
    chunk.set(pngBytes.subarray(0, Math.min(pngBytes.length, chunk.length)));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk);
        controller.enqueue(chunk);
        controller.enqueue(new Uint8Array(1));
      },
      cancel() { cancelled = true; },
    });
    const uploads = { put: vi.fn() } as unknown as R2Bucket;
    globalThis.fetch = vi.fn(async () => new Response(stream, { status: 200 })) as unknown as typeof fetch;
    const config = { categories: [{ products: [{ name: 'Too Large', image: 'https://images.dutchie.com/huge.png' }] }], showImages: true };

    const result = await bundleImportedImages(config, { UPLOADS: uploads, APP_URL: 'https://dubmenu.com' }, 'acct_123');

    expect(cancelled).toBe(true);
    expect(uploads.put).not.toHaveBeenCalled();
    expect(result.config.categories[0].products[0].image).toBeUndefined();
  });
});
