import { describe, expect, it } from 'vitest';
import { analyzeReferenceStyle } from '../src/reference-style';

describe('analyzeReferenceStyle', () => {
  it('turns dense no-photo multi-display cues into a price wall preset', () => {
    const result = analyzeReferenceStyle({
      sourceUrl: 'https://example.com/dispensary-digital-menu-board',
      notes: 'dense green TV price board with daily deals rail for four displays, no photos',
      productCount: 42,
      currentDisplayCount: 1,
    });

    expect(result.layout).toBe('pricewall');
    expect(result.template).toBe('forest');
    expect(result.displayCount).toBe(4);
    expect(result.showImages).toBe(false);
    expect(result.showPromos).toBe(true);
    expect(result.styleProfile.intent).toBe('dense-menu-board');
    expect(result.styleProfile.keywords).toEqual(expect.arrayContaining(['dense', 'promo', 'no-photo', 'forest-color']));
  });

  it('lets explicit dense wording beat an empty source menu product count', () => {
    const result = analyzeReferenceStyle({
      notes: 'dense cannabis price list for TV menu, no images',
      productCount: 0,
    });

    expect(result.layout).toBe('pricewall');
    expect(result.template).toBe('forest');
    expect(result.showImages).toBe(false);
  });

  it('uses a sparse hero only for explicit single-product cues or small real menus', () => {
    const explicitSingle = analyzeReferenceStyle({ notes: 'single product hero with premium photo', productCount: 100 });
    const smallMenu = analyzeReferenceStyle({ notes: 'quiet boutique selection', productCount: 3 });

    expect(explicitSingle.layout).toBe('sparse');
    expect(smallMenu.layout).toBe('sparse');
  });

  it('caps reference text before scanning or storing style profiles', () => {
    const result = analyzeReferenceStyle({
      sourceUrl: `${'x'.repeat(320)}green`,
      notes: `${'n'.repeat(520)} dense green price wall`,
      productCount: 20,
    });

    expect(result.layout).toBe('grid');
    expect(result.template).toBe('default');
    expect(result.styleProfile.sourceUrl).toHaveLength(300);
    expect(result.styleProfile.notes).toHaveLength(500);
  });
});
