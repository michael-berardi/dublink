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

describe('analyzeReferenceStyle smart-import payload contract', () => {
  it('returns styleProfile, layout, and displayCount for the smart import payload', () => {
    const result = analyzeReferenceStyle({
      sourceUrl: 'https://example.com/menu',
      notes: 'four-display green price wall, no photos',
      productCount: 60,
      currentDisplayCount: 1,
    });

    expect(result.layout).toBe('pricewall');
    expect(result.displayCount).toBe(4);
    expect(result.styleProfile).toMatchObject({
      intent: 'dense-menu-board',
      sourceUrl: 'https://example.com/menu',
      notes: 'four-display green price wall, no photos',
    });
    expect(result.styleProfile.keywords).toEqual(expect.arrayContaining(['dense', 'no-photo', 'forest-color']));
  });

  it('lets style notes override the fallback display count', () => {
    const result = analyzeReferenceStyle({
      notes: 'three-display image-led showcase',
      productCount: 10,
      currentDisplayCount: 1,
    });

    expect(result.displayCount).toBe(3);
  });

  it('preserves the current display count when no cue is present', () => {
    const result = analyzeReferenceStyle({
      notes: 'quiet boutique selection',
      productCount: 5,
      currentDisplayCount: 2,
    });

    expect(result.displayCount).toBe(2);
  });

  it('keeps the style profile within safe storage limits', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(400);
    const longNotes = 'notes: ' + 'b'.repeat(600);
    const result = analyzeReferenceStyle({
      sourceUrl: longUrl,
      notes: longNotes,
      productCount: 20,
    });

    expect(result.styleProfile.sourceUrl).toHaveLength(300);
    expect(result.styleProfile.notes).toHaveLength(500);
  });
});
