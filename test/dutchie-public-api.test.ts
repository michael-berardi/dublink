import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { importDutchiePublicMenu } from '../src/dutchie-public-api';
import type { ScrapedCategory } from '../src/dutchie-scraper';

describe('importDutchiePublicMenu', () => {
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

  function requestOperation(init?: RequestInit): string | undefined {
    if (typeof init?.body !== 'string') return undefined;
    const parsed: unknown = JSON.parse(init.body);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !('operationName' in parsed)) {
      return undefined;
    }
    return typeof parsed.operationName === 'string' ? parsed.operationName : undefined;
  }

  it('imports products, categories, name, logo, and cleaned image URLs from the public GraphQL API', async () => {
    globalThis.fetch = vi.fn(async (_input: string | Request, init?: RequestInit) => {
      if (requestOperation(init) === 'ConsumerDispensaries') {
        return graphqlResponse({
          filteredDispensaries: [
            {
              id: 'disp-123',
              name: 'Simply Green',
              logoImage: 'https://images.dutchie.com/logo.png',
              menuSections: [],
            },
          ],
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
              strainType: 'Hybrid',
              thc: { value: 22, unit: 'PERCENT' },
              cbd: { value: 0.1, unit: 'PERCENT' },
              image: 'https://images.dutchie.com/prod1.jpg?h=800&w=800&dpr=2',
              recPrices: [12, 35, 60],
              Options: ['1g', '3.5g', '7g'],
            },
          ],
        },
      });
    }) as unknown as typeof fetch;

    const result = await importDutchiePublicMenu('simply-green');
    expect(result.dispensaryName).toBe('Simply Green');
    expect(result.logo).toBe('https://images.dutchie.com/logo.png?h=400&w=400');
    expect(result.productCount).toBe(1);
    expect(result.categories.length).toBe(1);
    expect(result.categories[0].name).toBe('Flower');
    expect(result.categories[0].products[0].name).toBe('Blue Dream 3.5g');
    expect(result.categories[0].products[0].image).toBe('https://images.dutchie.com/prod1.jpg?h=400&w=400');
    expect(result.categories[0].products[0].description).toBe('Bright citrus flower');
    expect(result.categories[0].products[0].priceTiers).toEqual([
      { label: '1g', price: '$12' },
      { label: '3.5g', price: '$35' },
      { label: '7g', price: '$60' },
    ]);
  });

  it('uses the current Dutchie schema, paginates every product page, and maps live field names', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = vi.fn(async (input: string | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      calls.push({ url, init });
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      if (body.operationName === 'ConsumerDispensaries') {
        expect(body.query).toContain('$dispensaryFilter: dispensariesFilterInput!');
        expect(body.query).toContain('filteredDispensaries(filter: $dispensaryFilter)');
        return graphqlResponse({
          filteredDispensaries: [{
            id: 'disp-123',
            name: 'Simply Green',
            logoImage: 'https://images.dutchie.com/logo.png',
            webCustomizationSettingsV2: {
              colors: { buttonsLinks: '#5f8f41', navBar: '#172219' },
              fonts: { body: 'Montserrat', heading: 'Montserrat' },
            },
          }],
        });
      }

      expect(url).toBe('https://dutchie.com/api-4/graphql');
      expect(body.query).toContain('$productsFilter: productsFilterInput!');
      expect(body.query).toMatch(/filteredProducts\(\s*filter:\s*\$productsFilter/);
      const page = body.variables.page as number;
      return graphqlResponse({
        filteredProducts: {
          products: [{
            id: `product-${page}`,
            Name: page === 0 ? 'Blue Dream 3.5g' : `Product ${page}`,
            brandName: 'High Garden',
            type: page === 2 ? 'Edible' : 'Flower',
            strainType: 'Hybrid',
            THCContent: { unit: 'PERCENTAGE', range: [22.4] },
            CBDContent: { unit: 'PERCENTAGE', range: [0.1] },
            description: '<p>Bright &amp; citrus flower</p>',
            Image: `https://images.dutchie.com/product-${page}.jpg`,
            Options: [page === 0 ? '1g' : '3.5g'],
            recPrices: [35],
            recSpecialPrices: page === 1 ? [28] : [],
            special: page === 1 ? 'Weekly special' : null,
            Status: 'Active',
          }],
          queryInfo: { totalCount: 3, totalPages: 3 },
        },
      });
    }) as unknown as typeof fetch;

    const result = await importDutchiePublicMenu('simply-green');
    const products = result.categories.flatMap((category) => category.products);
    expect(result.productCount).toBe(3);
    expect(products).toHaveLength(3);
    expect(products[0]).toMatchObject({
      name: 'Blue Dream 3.5g',
      brand: 'High Garden',
      category: 'Flower',
      strain: 'hybrid',
      thc: '22.4%',
      cbd: '0.1%',
      description: 'Bright & citrus flower',
      image: 'https://images.dutchie.com/product-0.jpg?h=400&w=400',
      weight: '3.5g',
    });
    expect(products.find((product) => product.id === 'product-1')).toMatchObject({
      price: 28,
      originalPrice: 35,
      special: true,
    });
    expect(result.brandStyle).toEqual({
      primaryColor: '#5f8f41',
      secondaryColor: '#172219',
    });
    expect(calls.filter((call) => call.url === 'https://dutchie.com/api-4/graphql')).toHaveLength(3);
  });

  it('posts full query documents directly without an unregistered persisted-query round trip', async () => {
    const captured: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = vi.fn(async (input: string | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      captured.push({ url, init });
      if (requestOperation(init) === 'ConsumerDispensaries') {
        return graphqlResponse({
          filteredDispensaries: [{ id: 'disp-123', name: 'Test', menuSections: [] }],
        });
      }
      return graphqlResponse({
        filteredProducts: {
          products: [{ id: 'p1', name: 'Blue Dream 3.5g', category: 'Flower', recPrices: [35] }],
        },
      });
    }) as unknown as typeof fetch;

    await importDutchiePublicMenu('simply-green');

    expect(captured).toHaveLength(2);
    expect(captured.every((call) => call.init?.method === 'POST')).toBe(true);
    for (const call of captured) {
      const parsed: unknown = JSON.parse(String(call.init?.body));
      expect(parsed).toBeTypeOf('object');
      expect(parsed).not.toBeNull();
      expect(parsed).not.toHaveProperty('extensions');
    }
  });

  it('sends the Apollo preflight header required by Dutchie GraphQL', async () => {
    const captured: RequestInit[] = [];
    globalThis.fetch = vi.fn(async (_input: string | Request, init?: RequestInit) => {
      captured.push(init || {});
      if (requestOperation(init) === 'ConsumerDispensaries') {
        return graphqlResponse({
          filteredDispensaries: [{ id: 'disp-123', name: 'Simply Green' }],
        });
      }
      return graphqlResponse({
        filteredProducts: {
          products: [{ id: 'p1', Name: 'Blue Dream', type: 'Flower', recPrices: [35] }],
        },
      });
    }) as unknown as typeof fetch;

    await importDutchiePublicMenu('simply-green');

    expect(captured).toHaveLength(2);
    for (const init of captured) {
      expect(new Headers(init.headers).get('Apollo-Require-Preflight')).toBe('true');
    }
  });

  it('extracts images from the images array and POSMetaData fallback', async () => {
    globalThis.fetch = vi.fn(async (_input: string | Request, init?: RequestInit) => {
      if (requestOperation(init) === 'ConsumerDispensaries') {
        return graphqlResponse({
          filteredDispensaries: [{ id: 'disp-123', name: 'Image Test', menuSections: [] }],
        });
      }
      return graphqlResponse({
        filteredProducts: {
          products: [
            {
              id: 'p1',
              name: 'Gummy Bears 100mg',
              category: 'Edibles',
              recPrices: [25],
              images: [{ url: 'https://images.dutchie.com/gummy.jpg', active: true }],
            },
            {
              id: 'p2',
              name: 'OG Kush 1g',
              category: 'Flower',
              recPrices: [15],
              POSMetaData: { canonicalImgUrl: 'https://images.dutchie.com/og.jpg' },
            },
          ],
        },
      });
    }) as unknown as typeof fetch;

    const result = await importDutchiePublicMenu('image-test');
    const products = result.categories.flatMap((c: ScrapedCategory) => c.products);
    expect(products.map((p) => p.image)).toEqual([
      'https://images.dutchie.com/og.jpg?h=400&w=400',
      'https://images.dutchie.com/gummy.jpg?h=400&w=400',
    ]);
  });

  it('surfaces the failing Dutchie operation when product retrieval is rejected', async () => {
    globalThis.fetch = vi.fn(async (_input: string | Request, init?: RequestInit) => {
      if (requestOperation(init) === 'ConsumerDispensaries') {
        return graphqlResponse({
          filteredDispensaries: [{ id: 'disp-123', name: 'Rejected Products', menuSections: [] }],
        });
      }
      return new Response(
        JSON.stringify({ errors: [{ message: 'Forbidden' }] }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }) as unknown as typeof fetch;

    await expect(importDutchiePublicMenu('rejected-products')).rejects.toThrow(
      'Dutchie FilteredProducts returned 403: Forbidden'
    );
  });

  it('collapses duplicate sale/base variants instead of rendering repeated price chips', async () => {
    globalThis.fetch = vi.fn(async (_input: string | Request, init?: RequestInit) => {
      if (requestOperation(init) === 'ConsumerDispensaries') {
        return graphqlResponse({
          filteredDispensaries: [{ id: 'disp-123', name: 'Tier Test', menuSections: [] }],
        });
      }
      return graphqlResponse({
        filteredProducts: {
          products: [{
            id: 'sale-flower',
            Name: 'Sale Flower',
            type: 'Flower',
            Options: ['1/8oz', '1/8oz'],
            recPrices: [36, 36],
            recSpecialPrices: [21.6, 21.6],
            POSMetaData: {
              children: [
                { option: '1/8oz', recPrice: 36 },
                { option: '1/8oz', recPrice: 36 },
              ],
            },
          }],
        },
      });
    }) as unknown as typeof fetch;

    const result = await importDutchiePublicMenu('tier-test');
    const product = result.categories[0].products[0];
    expect(product.price).toBe(21.6);
    expect(product.originalPrice).toBe(36);
    expect(product.priceTiers).toBeUndefined();
  });

  it('normalizes the broader Dutchie product taxonomy without name guessing', async () => {
    globalThis.fetch = vi.fn(async (_input: string | Request, init?: RequestInit) => {
      if (requestOperation(init) === 'ConsumerDispensaries') {
        return graphqlResponse({
          filteredDispensaries: [{ id: 'disp-123', name: 'Taxonomy Test', menuSections: [] }],
        });
      }
      return graphqlResponse({
        filteredProducts: {
          products: [
            { id: 'beverage', Name: 'Sparkling Water', type: 'Beverage', recPrices: [8] },
            { id: 'clone', Name: 'Starter Plant', type: 'Clones', recPrices: [25] },
            { id: 'apparel', Name: 'Logo Hoodie', type: 'Apparel', recPrices: [40] },
          ],
        },
      });
    }) as unknown as typeof fetch;

    const result = await importDutchiePublicMenu('taxonomy-test');
    const categoryByProduct = Object.fromEntries(
      result.categories.flatMap((category) => category.products.map((product) => [product.id, category.name]))
    );
    expect(categoryByProduct).toEqual({
      beverage: 'Edibles',
      clone: 'Flower',
      apparel: 'Accessories',
    });
  });

  it('keeps all products for the formatter to rank and cap', async () => {
    globalThis.fetch = vi.fn(async (_input: string | Request, init?: RequestInit) => {
      if (requestOperation(init) === 'ConsumerDispensaries') {
        return graphqlResponse({ filteredDispensaries: [{ id: 'disp-123', name: 'Large Menu', menuSections: [] }] });
      }
      return graphqlResponse({
        filteredProducts: {
          products: Array.from({ length: 41 }, (_, index) => ({
            id: `flower-${index}`,
            name: `Flower ${index}`,
            category: 'Flower',
            recPrices: [30 + index],
          })),
        },
      });
    }) as unknown as typeof fetch;

    const result = await importDutchiePublicMenu('large-menu');
    expect(result.productCount).toBe(41);
    expect(result.categories[0].products).toHaveLength(41);
  });
});
