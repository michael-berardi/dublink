import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrapeDutchie } from '../src/dutchie-scraper';
import { formatMenu } from '../src/menu-formatter';
import { tvPage } from '../src/html-tv';

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

function baseProduct(id: string, extra: Record<string, unknown>) {
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
});
