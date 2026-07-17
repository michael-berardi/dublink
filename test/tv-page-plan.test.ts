import { describe, expect, it } from 'vitest';
import { allocateCategoriesForDisplay } from '../src/multi-display';
import { buildTvCatalogPagePlan } from '../src/tv-page-plan';
import type { Category, Product } from '../src/types';

function products(prefix: string, count: number, strain?: Product['strain']): Product[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    name: `${prefix} ${String(index + 1).padStart(3, '0')}`,
    price: 20 + index,
    inStock: true,
    strain,
  }));
}

function productIds(categories: Category[]): string[] {
  return categories.flatMap((category) => category.products.map((product) => product.id));
}

function plannedProductIds(pages: Category[][]): string[] {
  return pages.flatMap((page) => productIds(page));
}

describe('buildTvCatalogPagePlan', () => {
  it('covers all 452 products exactly once across one to four displays', () => {
    const specs = [
      ['Flower', 127],
      ['Pre-Rolls', 63],
      ['Vapes', 55],
      ['Concentrates', 21],
      ['Edibles', 123],
      ['Tinctures', 7],
      ['Topicals', 2],
      ['CBD', 12],
      ['Accessories', 42],
    ] as const;
    const categories: Category[] = specs.map(([name, count], order) => ({
      id: name.toLowerCase(),
      name,
      order,
      products: products(name, count),
    }));
    const expectedIds = productIds(categories).sort();
    expect(expectedIds).toHaveLength(452);

    for (let displayTotal = 1; displayTotal <= 4; displayTotal += 1) {
      const actualIds: string[] = [];
      for (let displayNumber = 1; displayNumber <= displayTotal; displayNumber += 1) {
        const allocation = allocateCategoriesForDisplay(categories, displayNumber, displayTotal);
        const pages = buildTvCatalogPagePlan(allocation, { layout: 'list', demoMode: true });
        expect(pages.every((page) => productIds(page).length <= 18)).toBe(true);
        actualIds.push(...plannedProductIds(pages));
      }

      expect(actualIds.sort()).toEqual(expectedIds);
      expect(new Set(actualIds).size).toBe(452);
    }
  });

  it('shows a full Simply Green-sized catalog within a five-minute pricewall cycle', () => {
    const specs = [
      ['Flower', 125],
      ['Pre-Rolls', 82],
      ['Vapes', 65],
      ['Concentrates', 24],
      ['Edibles', 147],
      ['Tinctures', 6],
      ['Topicals', 3],
      ['CBD', 12],
      ['Accessories', 42],
    ] as const;
    const categories: Category[] = specs.map(([name, count], order) => ({
      id: name.toLowerCase(),
      name,
      order,
      products: products(name, count),
    }));

    const pages = buildTvCatalogPagePlan(categories, {
      layout: 'pricewall',
      fontScale: 100,
    });

    expect(pages.length * 8).toBeLessThanOrEqual(300);
    expect(pages.every((page) => page.length <= 2)).toBe(true);
    expect(pages.every((page) => productIds(page).length <= 16)).toBe(true);
    expect(plannedProductIds(pages).sort()).toEqual(productIds(categories).sort());
    expect(new Set(plannedProductIds(pages)).size).toBe(506);
  });

  it('creates labeled strain pages and retains unknown-strain products in fallback pages', () => {
    const category: Category = {
      id: 'flower',
      name: 'Flower',
      order: 0,
      products: [
        ...products('Indica', 12, 'indica'),
        ...products('Sativa', 12, 'sativa'),
        ...products('Hybrid', 12, 'hybrid'),
        ...products('Unknown', 3),
      ],
    };

    const pages = buildTvCatalogPagePlan([category], { layout: 'list' });
    const names = pages.flatMap((page) => page.map((plannedCategory) => plannedCategory.name));

    expect(names).toContain('Flower · Indica');
    expect(names).toContain('Flower · Sativa');
    expect(names).toContain('Flower · Hybrid');
    expect(names).toContain('Flower');
    expect(plannedProductIds(pages).sort()).toEqual(productIds([category]).sort());
  });

  it('does not repeat a strain already present in the source category label', () => {
    const category: Category = {
      id: 'flower-indica',
      name: 'Flower · Indica',
      order: 0,
      products: products('Indica', 12, 'indica'),
    };

    const pages = buildTvCatalogPagePlan([category], { layout: 'list' });

    expect(pages.flatMap((page) => page.map((plannedCategory) => plannedCategory.name)).every((name) => name === 'Flower · Indica')).toBe(true);
  });

  it('aligns sparse pagination with its four-product renderer', () => {
    const category: Category = {
      id: 'flower',
      name: 'Flower',
      order: 0,
      products: products('Flower', 10),
    };

    const pages = buildTvCatalogPagePlan([category], { layout: 'sparse' });

    expect(pages.map((page) => productIds(page).length)).toEqual([4, 4, 2]);
    expect(plannedProductIds(pages)).toEqual(productIds([category]));
  });

  it('preserves every product while reducing per-page density at larger font scales', () => {
    const category: Category = {
      id: 'flower',
      name: 'Flower',
      order: 0,
      products: products('Flower', 30),
    };
    const layouts = ['grid', 'list', 'columns', 'compact', 'cards', 'pricewall', 'poster', 'cinematic', 'showcase', 'editorial', 'sparse'];

    for (const layout of layouts) {
      const compact = buildTvCatalogPagePlan([category], { layout, fontScale: 100 });
      const standard = buildTvCatalogPagePlan([category], { layout, fontScale: 140 });
      const extraLarge = buildTvCatalogPagePlan([category], { layout, fontScale: 250 });
      for (const plan of [compact, standard, extraLarge]) {
        expect(plannedProductIds(plan)).toEqual(productIds([category]));
      }
      const compactPageMaximum = Math.max(...compact.map((page) => productIds(page).length));
      const extraLargePageMaximum = Math.max(...extraLarge.map((page) => productIds(page).length));
      expect(extraLargePageMaximum).toBeLessThanOrEqual(compactPageMaximum);
    }
  });

  it('keeps three category boxes on banner pages while preserving every product', () => {
    const categories: Category[] = Array.from({ length: 3 }, (_, index) => ({
      id: `category-${index + 1}`,
      name: `Category ${index + 1}`,
      order: index,
      products: products(`Category ${index + 1}`, 4),
    }));

    const pages = buildTvCatalogPagePlan(categories, {
      layout: 'grid',
      bannerActive: true,
      fontScale: 140,
    });

    expect(pages[0]).toHaveLength(3);
    expect(pages.every((page) => page.length <= 3)).toBe(true);
    expect(plannedProductIds(pages).sort()).toEqual(productIds(categories).sort());
  });

  it('keeps dense and image-led pages within TV-height capacity', () => {
    const categories: Category[] = Array.from({ length: 4 }, (_, index) => ({
      id: `category-${index + 1}`,
      name: `Category ${index + 1}`,
      order: index,
      products: products(`Category ${index + 1}`, 4),
    }));
    const list = buildTvCatalogPagePlan(categories, { layout: 'list', demoMode: true, fontScale: 100 });
    const standardPoster = buildTvCatalogPagePlan(categories, { layout: 'poster', demoMode: true, fontScale: 100 });
    const extraLargePoster = buildTvCatalogPagePlan(categories, { layout: 'poster', demoMode: true, fontScale: 140 });
    const highScalePoster = buildTvCatalogPagePlan(categories, { layout: 'poster', demoMode: true, fontScale: 200 });
    const extraLargeCinematic = buildTvCatalogPagePlan(categories, { layout: 'cinematic', demoMode: true, fontScale: 140 });

    expect(list.every((page) => page.length <= 3)).toBe(true);
    expect(list.every((page) => productIds(page).length <= 10)).toBe(true);
    expect(standardPoster.every((page) => page.length === 1 && productIds(page).length <= 3)).toBe(true);
    expect(extraLargePoster.every((page) => page.length === 1 && productIds(page).length <= 2)).toBe(true);
    expect(highScalePoster.every((page) => page.length === 1 && productIds(page).length === 1)).toBe(true);
    expect(extraLargeCinematic.every((page) => page.length === 1 && productIds(page).length <= 4)).toBe(true);
    expect(plannedProductIds(list).sort()).toEqual(productIds(categories).sort());
    expect(plannedProductIds(standardPoster)).toEqual(productIds(categories));
    expect(plannedProductIds(extraLargePoster)).toEqual(productIds(categories));
    expect(plannedProductIds(highScalePoster)).toEqual(productIds(categories));
    expect(plannedProductIds(extraLargeCinematic)).toEqual(productIds(categories));
  });

  it('paginates long accessories rows before they can collide with the TV footer', () => {
    const accessories: Category = {
      id: 'accessories',
      name: 'Accessories',
      order: 0,
      products: products('Long Accessory Product Name', 8),
    };

    const pages = buildTvCatalogPagePlan([accessories], { layout: 'list', fontScale: 140 });

    expect(pages).toHaveLength(2);
    expect(pages.every((page) => productIds(page).length <= 6)).toBe(true);
    expect(plannedProductIds(pages)).toEqual(productIds([accessories]));
  });

  it('keeps every special product in pricewall pages instead of only the featured rail', () => {
    const categories: Category[] = [
      { id: 'specials', name: 'Specials', order: 0, products: products('Special', 10) },
      { id: 'flower', name: 'Flower', order: 1, products: products('Flower', 6) },
    ];

    const pages = buildTvCatalogPagePlan(categories, { layout: 'pricewall' });

    expect(plannedProductIds(pages).sort()).toEqual(productIds(categories).sort());
    expect(new Set(plannedProductIds(pages)).size).toBe(16);
  });

  it('gives long product names extra row capacity without dropping products', () => {
    const category: Category = {
      id: 'edibles',
      name: 'Edibles',
      order: 0,
      products: products('Long edible name', 6),
    };

    const pages = buildTvCatalogPagePlan([category], {
      fontScale: 100,
      layout: 'pricewall',
      productRowWeight: () => 2,
    });

    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(2);
    expect(pages[0].every((pageCategory) => pageCategory.products.length <= 4)).toBe(true);
    expect(plannedProductIds(pages)).toEqual(productIds([category]));
  });

  it('uses one exhaustive product page per SKU in showcase mode', () => {
    const category: Category = {
      id: 'flower',
      name: 'Flower',
      order: 0,
      products: products('Flower', 5),
    };

    const pages = buildTvCatalogPagePlan([category], { layout: 'showcase' });

    expect(pages).toHaveLength(5);
    expect(pages.every((page) => productIds(page).length === 1)).toBe(true);
    expect(plannedProductIds(pages)).toEqual(productIds([category]));
  });
});
