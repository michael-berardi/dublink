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

  it('imports products, categories, name, logo, and cleaned image URLs from the public GraphQL API', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/graphql') && url.includes('ConsumerDispensaries')) {
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
              strainType: 'Hybrid',
              thc: { value: 22, unit: 'PERCENT' },
              cbd: { value: 0.1, unit: 'PERCENT' },
              image: 'https://images.dutchie.com/prod1.jpg?h=800&w=800&dpr=2',
              recPrices: [35],
              Options: ['3.5g'],
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
  });

  it('uses the SHA-256 hash of the query in the persisted-query extension', async () => {
    const captured: string[] = [];
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      captured.push(url);
      if (url.includes('ConsumerDispensaries')) {
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

    const consumerUrl = captured.find((u) => u.includes('ConsumerDispensaries'));
    expect(consumerUrl).toBeDefined();
    const params = new URLSearchParams(new URL(consumerUrl!).search);
    const extensions = JSON.parse(params.get('extensions') || '{}');
    expect(extensions.persistedQuery.version).toBe(1);
    expect(extensions.persistedQuery.sha256Hash).toMatch(/^[a-f0-9]{64}$/);
    expect(extensions.persistedQuery.sha256Hash).not.toContain(' ');
    expect(extensions.persistedQuery.sha256Hash).not.toBe('adhoc');
  });

  it('falls back to POST with the full query when the persisted query is not recognized', async () => {
    const captured: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = vi.fn(async (input: string | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      captured.push({ url, init });
      const method = init?.method || 'GET';
      if (method === 'GET' && url.includes('ConsumerDispensaries')) {
        // First GET fails with PersistedQueryNotFound.
        return new Response(
          JSON.stringify({ errors: [{ message: 'PersistedQueryNotFound' }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (method === 'POST' && url.includes('/graphql')) {
        return graphqlResponse({
          filteredDispensaries: [{ id: 'disp-123', name: 'Fallback', menuSections: [] }],
        });
      }
      return graphqlResponse({ filteredProducts: { products: [] } });
    }) as unknown as typeof fetch;

    await expect(importDutchiePublicMenu('simply-green')).rejects.toThrow('Dutchie public API returned no products');

    const postCalls = captured.filter((c) => c.init?.method === 'POST' && c.url.includes('/graphql'));
    expect(postCalls.length).toBe(1);
    const body = JSON.parse(postCalls[0].init!.body as string);
    expect(body.operationName).toBe('ConsumerDispensaries');
    expect(body.query).toContain('ConsumerDispensaries');
    expect(body.query).toContain('filteredDispensaries');
    expect(body.extensions.persistedQuery.sha256Hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('extracts images from the images array and POSMetaData fallback', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('ConsumerDispensaries')) {
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

  it('falls back to menu section products when the FilteredProducts query errors', async () => {
    globalThis.fetch = vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('ConsumerDispensaries')) {
        return graphqlResponse({
          filteredDispensaries: [
            {
              id: 'disp-123',
              name: 'Section Fallback',
              menuSections: [
                {
                  category: 'Flower',
                  products: [
                    {
                      id: 'p1',
                      name: 'Blue Dream 3.5g',
                      category: 'Flower',
                      recPrices: [35],
                      image: 'https://images.dutchie.com/blue.jpg',
                    },
                  ],
                },
              ],
            },
          ],
        });
      }
      return new Response(
        JSON.stringify({ errors: [{ message: 'Forbidden' }] }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }) as unknown as typeof fetch;

    const result = await importDutchiePublicMenu('section-fallback');
    expect(result.dispensaryName).toBe('Section Fallback');
    expect(result.productCount).toBe(1);
    expect(result.categories[0].products[0].image).toBe('https://images.dutchie.com/blue.jpg?h=400&w=400');
  });
});
