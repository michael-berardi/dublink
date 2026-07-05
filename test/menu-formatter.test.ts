import { describe, it, expect } from 'vitest';
import { canonicalCategoryName, dedupeAndFormatCategories, smartLayout, formatMenu } from '../src/menu-formatter';
import type { ScrapedCategory } from '../src/dutchie-scraper';

describe('canonicalCategoryName', () => {
  it('classifies common synonyms', () => {
    expect(canonicalCategoryName('Whole Flower')).toBe('Flower');
    expect(canonicalCategoryName('Pre-Roll Singles')).toBe('Pre-Rolls');
    expect(canonicalCategoryName('Vape Cartridges')).toBe('Vapes');
    expect(canonicalCategoryName('Live Resin')).toBe('Concentrates');
    expect(canonicalCategoryName('Gummies')).toBe('Edibles');
    expect(canonicalCategoryName('CBD Tincture')).toBe('CBD');
    expect(canonicalCategoryName('Bongs')).toBe('Accessories');
    expect(canonicalCategoryName('Unknown')).toBe('Other');
  });
});

describe('dedupeAndFormatCategories', () => {
  it('merges duplicate categories and products', () => {
    const categories: ScrapedCategory[] = [
      { id: 'flower', name: 'Flower', order: 0, products: [{ id: 'a', name: 'OG Kush', price: 45, inStock: true }] },
      { id: 'whole-flower', name: 'Whole Flower', order: 1, products: [{ id: 'b', name: 'Blue Dream', price: 40, inStock: true }] },
      { id: 'flower', name: 'Flower', order: 2, products: [{ id: 'a', name: 'OG Kush', price: 45, inStock: true }] },
    ];
    const result = dedupeAndFormatCategories(categories);
    expect(result.categories.length).toBe(1);
    expect(result.categories[0].name).toBe('Flower');
    expect(result.productCount).toBe(2);
  });

  it('limits categories and warns', () => {
    const categories: ScrapedCategory[] = [
      { id: 'flower', name: 'Flower', order: 0, products: [{ id: 'f1', name: 'F1', price: 10, inStock: true }] },
      { id: 'preroll', name: 'Pre-Roll', order: 1, products: [{ id: 'p1', name: 'P1', price: 10, inStock: true }] },
      { id: 'vape', name: 'Vape', order: 2, products: [{ id: 'v1', name: 'V1', price: 10, inStock: true }] },
      { id: 'concentrate', name: 'Concentrate', order: 3, products: [{ id: 'c1', name: 'C1', price: 10, inStock: true }] },
      { id: 'edible', name: 'Edible', order: 4, products: [{ id: 'e1', name: 'E1', price: 10, inStock: true }] },
      { id: 'tincture', name: 'Tincture', order: 5, products: [{ id: 't1', name: 'T1', price: 10, inStock: true }] },
      { id: 'topical', name: 'Topical', order: 6, products: [{ id: 'to1', name: 'To1', price: 10, inStock: true }] },
      { id: 'cbd', name: 'CBD', order: 7, products: [{ id: 'cbd1', name: 'CBD1', price: 10, inStock: true }] },
    ];
    const result = dedupeAndFormatCategories(categories, { maxCategories: 5 });
    expect(result.categories.length).toBe(5);
    expect(result.warnings.length).toBe(1);
  });
});

describe('smartLayout', () => {
  it('uses a single display for small menus', () => {
    const layout = smartLayout(8, 2);
    expect(layout.displayCount).toBe(1);
    expect(layout.layoutMode).toBe('grid');
    expect(layout.fontSize).toBe('large');
  });

  it('uses two displays for medium menus', () => {
    const layout = smartLayout(25, 4);
    expect(layout.displayCount).toBe(2);
    expect(layout.layoutMode).toBe('columns');
    expect(layout.fontSize).toBe('medium');
  });

  it('uses three or four displays for large menus', () => {
    expect(smartLayout(60, 5).displayCount).toBe(3);
    expect(smartLayout(100, 8).displayCount).toBe(4);
  });

  it('switches to compact for very dense menus', () => {
    const layout = smartLayout(90, 8);
    expect(layout.layoutMode).toBe('compact');
    expect(layout.showImages).toBe(false);
    expect(layout.fontSize).toBe('small');
  });
});

describe('formatMenu', () => {
  it('returns a fully formatted menu with smart layout', () => {
    const categories: ScrapedCategory[] = [
      { id: 'flower', name: 'Flower', order: 0, products: [{ id: 'a', name: 'OG Kush', price: 45, inStock: true }] },
    ];
    const result = formatMenu(categories, 'Green Leaf', 'https://example.com/logo.png');
    expect(result.dispensaryName).toBe('Green Leaf');
    expect(result.logo).toBe('https://example.com/logo.png');
    expect(result.layout.displayCount).toBe(1);
    expect(result.layout.layoutMode).toBe('grid');
  });
});
