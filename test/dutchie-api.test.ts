import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { importDutchieMenu, parseDutchieSlug } from '../src/dutchie-api';
import type { ScrapedCategory } from '../src/dutchie-scraper';

describe('parseDutchieSlug', () => {
  it('extracts slug from embedded menu URLs', () => {
    expect(parseDutchieSlug('https://dutchie.com/embedded-menu/simply-green')).toBe('simply-green');
    expect(parseDutchieSlug('https://www.dutchie.com/embedded-menu/simply-green')).toBe('simply-green');
    expect(parseDutchieSlug('http://dutchie.com/embedded-menu/simply-green?ref=home')).toBe('simply-green');
    expect(parseDutchieSlug('https://dutchie.com/embedded-menu/simply-green/category/flower')).toBe('simply-green');
  });

  it('extracts slug from root-level dispensary URLs', () => {
    expect(parseDutchieSlug('https://dutchie.com/simply-green')).toBe('simply-green');
    expect(parseDutchieSlug('https://www.dutchie.com/simply-green/')).toBe('simply-green');
  });

  it('extracts slug from dispensary path URLs', () => {
    expect(parseDutchieSlug('https://dutchie.com/dispensary/simply-green')).toBe('simply-green');
  });

  it('extracts slug from subdomain URLs', () => {
    expect(parseDutchieSlug('https://simply-green.dutchie.com/')).toBe('simply-green');
    expect(parseDutchieSlug('https://simply-green.dutchie.com/embedded-menu')).toBe('simply-green');
  });

  it('accepts bare slug input', () => {
    expect(parseDutchieSlug('simply-green')).toBe('simply-green');
    expect(parseDutchieSlug('simplygreen123')).toBe('simplygreen123');
  });

  it('rejects invalid URLs', () => {
    expect(parseDutchieSlug('https://example.com/embedded-menu/simply-green')).toBeNull();
    expect(parseDutchieSlug('not a url')).toBeNull();
    expect(parseDutchieSlug('')).toBeNull();
  });
});

describe('importDutchieMenu', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function mockFetch(response: () => Promise<Response>) {
    globalThis.fetch = vi.fn(response) as unknown as typeof fetch;
  }

  function graphqlResponse(data: unknown) {
    return Promise.resolve(
      new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  it('imports products, categories, name, and logo from the Dutchie API', async () => {
    let calls = 0;
    mockFetch(() => {
      calls++;
      if (calls === 1) {
        return graphqlResponse({
          dispensary: {
            id: 'disp-123',
            name: 'Simply Green',
            logo: 'https://images.dutchie.com/logo.png',
          },
        });
      }
      return graphqlResponse({
        filteredProducts: {
          products: [
            {
              id: 'prod-1',
              name: 'Blue Dream 3.5g',
              brand: 'High Garden',
              category: 'Flower',
              description: 'Bright citrus flower',
              type: 'flower',
              strainType: 'Hybrid',
              thc: { value: 22, unit: 'PERCENT' },
              cbd: { value: 0.1, unit: 'PERCENT' },
              image: 'https://images.dutchie.com/prod1.jpg',
              recPrices: [12, 35, 60],
              Options: ['1g', '3.5g', '7g'],
            },
          ],
        },
      });
    });

    const result = await importDutchieMenu('simply-green', 'test-key');
    expect(result.dispensaryName).toBe('Simply Green');
    expect(result.logo).toBe('https://images.dutchie.com/logo.png?h=400&w=400');
    expect(result.productCount).toBe(1);
    expect(result.categories.length).toBe(1);
    expect(result.categories[0].name).toBe('Flower');
    expect(result.categories[0].products[0].name).toBe('Blue Dream 3.5g');
    expect(result.categories[0].products[0].brand).toBe('High Garden');
    expect(result.categories[0].products[0].strain).toBe('hybrid');
    expect(result.categories[0].products[0].thc).toBe('22%');
    expect(result.categories[0].products[0].weight).toBe('1g');
    expect(result.categories[0].products[0].image).toBe('https://images.dutchie.com/prod1.jpg?h=400&w=400');
    expect(result.categories[0].products[0].description).toBe('Bright citrus flower');
    expect(result.categories[0].products[0].priceTiers).toEqual([
      { label: '1g', price: '$12' },
      { label: '3.5g', price: '$35' },
      { label: '7g', price: '$60' },
    ]);
  });

  it('falls back to V1 product query when V2 returns no products', async () => {
    let calls = 0;
    mockFetch(() => {
      calls++;
      if (calls === 1) {
        return graphqlResponse({ dispensary: { id: 'disp-123', name: 'Test Dispensary' } });
      }
      if (calls === 2) {
        return graphqlResponse({ filteredProducts: { products: [] } });
      }
      return graphqlResponse({
        products: {
          edges: [
            {
              node: {
                id: 'prod-2',
                name: 'Gummy Bears 100mg',
                category: 'Edibles',
                type: 'edible',
                recPrices: [25],
              },
            },
          ],
        },
      });
    });

    const result = await importDutchieMenu('test-dispensary', 'test-key');
    expect(result.productCount).toBe(1);
    expect(result.categories[0].name).toBe('Edibles');
  });

  it('throws when the dispensary is not found', async () => {
    mockFetch(() => graphqlResponse({ dispensary: null }));
    await expect(importDutchieMenu('unknown-store', 'test-key')).rejects.toThrow('Could not find Dutchie dispensary');
  });

  it('throws when the API returns no priced products', async () => {
    let calls = 0;
    mockFetch(() => {
      calls++;
      if (calls === 1) {
        return graphqlResponse({ dispensary: { id: 'disp-123', name: 'No Prices' } });
      }
      return graphqlResponse({ filteredProducts: { products: [{ id: 'p', name: 'Free Sample', recPrices: [] }] } });
    });
    await expect(importDutchieMenu('no-prices', 'test-key')).rejects.toThrow('priced products');
  });

  it('throws when the API key is missing', async () => {
    await expect(importDutchieMenu('simply-green', '')).rejects.toThrow('API key is not configured');
  });

  it('extracts logo from imageUrl when logo is absent', async () => {
    let calls = 0;
    mockFetch(() => {
      calls++;
      if (calls === 1) {
        return graphqlResponse({
          dispensary: { id: 'disp-123', name: 'Image Logo', imageUrl: 'https://images.dutchie.com/disp.jpg' },
        });
      }
      return graphqlResponse({
        filteredProducts: { products: [{ id: 'p1', name: 'Pre-Roll 1g', recPrices: [12] }] },
      });
    });

    const result = await importDutchieMenu('image-logo', 'test-key');
    expect(result.logo).toBe('https://images.dutchie.com/disp.jpg?h=400&w=400');
  });
});

describe('importDutchieMenu category handling', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function mockFetchForProducts(products: unknown[]) {
    let calls = 0;
    globalThis.fetch = vi.fn(() => {
      calls++;
      if (calls === 1) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { dispensary: { id: 'disp-123', name: 'Multi' } } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: { filteredProducts: { products } } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }) as unknown as typeof fetch;
  }

  it('groups products into categories and applies the standard order', async () => {
    mockFetchForProducts([
      { id: 'edible', name: 'Gummy', category: 'Edibles', recPrices: [10] },
      { id: 'flower', name: 'Blue Dream', category: 'Flower', recPrices: [30] },
      { id: 'vape', name: 'Cart', category: 'Vapes', recPrices: [40] },
      { id: 'preroll', name: 'Joint', category: 'Pre-Rolls', recPrices: [8] },
    ]);

    const result = await importDutchieMenu('multi', 'test-key');
    const names = result.categories.map((c: ScrapedCategory) => c.name);
    expect(names).toEqual(['Flower', 'Pre-Rolls', 'Vapes', 'Edibles']);
  });

  it('keeps all products for the formatter to rank and cap', async () => {
    mockFetchForProducts(Array.from({ length: 41 }, (_, index) => ({
      id: `flower-${index}`,
      name: `Flower ${index}`,
      category: 'Flower',
      recPrices: [30 + index],
    })));

    const result = await importDutchieMenu('multi', 'test-key');
    expect(result.productCount).toBe(41);
    expect(result.categories[0].products).toHaveLength(41);
  });
});
