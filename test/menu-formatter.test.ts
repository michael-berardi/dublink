import { describe, it, expect } from 'vitest';
import { canonicalCategoryName, dedupeAndFormatCategories, smartLayout, formatMenu, scoreProductForTv, selectTvProducts } from '../src/menu-formatter';
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

  it('preserves product image URLs through formatting', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'a', name: 'OG Kush', price: 45, inStock: true, image: 'https://example.com/og.jpg' },
        ],
      },
    ];
    const result = dedupeAndFormatCategories(categories);
    expect(result.categories[0].products[0].image).toBe('https://example.com/og.jpg');
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

describe('TV product selection', () => {
  it('scores image-rich complete products above sparse products', () => {
    const rich = scoreProductForTv({
      id: 'rich',
      name: 'Premium Blue Dream',
      price: 48,
      image: 'https://example.com/blue.jpg',
      brand: 'Top Shelf',
      strain: 'sativa',
      thc: '24%',
      weight: '3.5g',
      inStock: true,
    });
    const sparse = scoreProductForTv({
      id: 'sparse',
      name: 'Mystery Item With A Very Long Product Name That Does Not Read Well On TV',
      price: 12,
      inStock: true,
    });
    expect(rich).toBeGreaterThan(sparse);
  });

  it('selects TV products by image and metadata quality, not source order', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'cheap', name: 'Cheap Flower', price: 10, inStock: true },
          { id: 'hero', name: 'Hero Flower', price: 40, image: 'https://example.com/hero.jpg', brand: 'Hero Brand', strain: 'hybrid', thc: '28%', weight: '3.5g', inStock: true },
          { id: 'mid', name: 'Mid Flower', price: 30, brand: 'Mid Brand', inStock: true },
        ],
      },
    ];
    const selected = selectTvProducts(categories, { maxProductsPerCategory: 2 });
    expect(selected[0].products.map((p) => p.id)).toEqual(['hero', 'mid']);
  });

  it('uses bestseller wording and source order as popularity signals', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'vapes',
        name: 'Vapes',
        order: 0,
        products: [
          { id: 'regular', name: 'Regular Cart', price: 40, image: 'https://example.com/regular.jpg', brand: 'A', inStock: true },
          { id: 'best', name: 'Best Seller Live Resin Cart', price: 42, image: 'https://example.com/best.jpg', brand: 'B', inStock: true },
        ],
      },
    ];
    const selected = selectTvProducts(categories, { maxProductsPerCategory: 1 });
    expect(selected[0].products[0].id).toBe('best');
  });

  it('promotes scraped deals into a dedicated Specials category', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'deal', name: 'BOGO Blue Dream Eighths', price: 35, image: 'https://example.com/deal.jpg', brand: 'House', inStock: true },
          { id: 'regular', name: 'Regular Blue Dream', price: 40, image: 'https://example.com/regular.jpg', brand: 'House', inStock: true },
        ],
      },
    ];
    const selected = selectTvProducts(categories, { maxCategories: 2, maxProductsPerCategory: 2 });
    expect(selected[0].name).toBe('Specials');
    expect(selected[0].products[0]).toMatchObject({ id: 'deal', special: true, specialLabel: 'BOGO' });
    expect(selected[1].name).toBe('Flower');
    expect(selected[1].products.map((p) => p.id)).toEqual(['regular']);
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

  it('TV-optimizes imported menus and preserves selected assets', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'first', name: 'First No Image', price: 20, inStock: true },
          { id: 'asset', name: 'Asset Product', price: 30, image: 'https://example.com/asset.jpg', brand: 'Asset Brand', thc: '26%', weight: '3.5g', inStock: true },
        ],
      },
    ];
    const result = formatMenu(categories, 'Green Leaf', undefined, { tvOptimize: true, maxTvProductsPerCategory: 1 });
    expect(result.productCount).toBe(1);
    expect(result.categories[0].products[0].id).toBe('asset');
    expect(result.categories[0].products[0].image).toBe('https://example.com/asset.jpg');
    expect(result.layout.showImages).toBe(true);
    expect(result.warnings.join(' ')).toContain('TV-ready products');
  });
});
