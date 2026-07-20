import { describe, expect, it } from 'vitest';
import {
  allocateCategoriesForDisplay,
  clampDisplayCount,
  getScreenConfig,
  normalizeScreens,
  selectCategoriesForDisplay,
} from '../src/multi-display';

type Product = { id: string };
type Category = { id: string; products: Product[] };

function category(id: string, productCount: number): Category {
  return {
    id,
    products: Array.from({ length: productCount }, (_, index) => ({ id: `${id}-${index + 1}` })),
  };
}

describe('screen config helpers', () => {
  it('clamps display count to 1-4', () => {
    expect(clampDisplayCount(0)).toBe(1);
    expect(clampDisplayCount(1)).toBe(1);
    expect(clampDisplayCount(4)).toBe(4);
    expect(clampDisplayCount(5)).toBe(4);
    expect(clampDisplayCount('2')).toBe(2);
    expect(clampDisplayCount(undefined)).toBe(1);
  });

  it('normalizes a stable 1-4 screen list with defaults', () => {
    const screens = normalizeScreens([], 1);
    expect(screens).toHaveLength(4);
    expect(screens.map((s) => s.id)).toEqual(['screen-1', 'screen-2', 'screen-3', 'screen-4']);
    expect(screens.every((s) => Array.isArray(s.categoryIds) && s.categoryIds.length === 0)).toBe(true);
  });

  it('preserves persisted names, categoryIds, and layouts when normalizing', () => {
    const screens = normalizeScreens(
      [
        { id: 'screen-1', name: 'Menu', categoryIds: ['flower'], layout: 'grid' },
        { id: 'screen-2', name: 'Edibles', categoryIds: ['edibles'], layout: 'list' },
      ],
      2,
    );
    expect(screens[0]).toEqual({ id: 'screen-1', name: 'Menu', categoryIds: ['flower'], layout: 'grid' });
    expect(screens[1]).toEqual({ id: 'screen-2', name: 'Edibles', categoryIds: ['edibles'], layout: 'list' });
    expect(screens[2].categoryIds).toEqual([]);
    expect(screens[3].categoryIds).toEqual([]);
  });

  it('selects explicit categories for a display with every product retained', () => {
    const categories = [category('flower', 3), category('vapes', 5), category('edibles', 4)];
    const screens: { id: string; name: string; categoryIds: string[]; layout?: string }[] = [
      { id: 'screen-1', name: 'Display 1', categoryIds: ['flower', 'vapes'] },
      { id: 'screen-2', name: 'Display 2', categoryIds: ['edibles'] },
    ];

    const screen1 = selectCategoriesForDisplay(categories, screens, 1, 2);
    expect(screen1.map((c) => c.id)).toEqual(['flower', 'vapes']);
    expect(screen1.flatMap((c) => c.products)).toHaveLength(8);
    expect(screen1[0].products).toEqual(categories[0].products);

    const screen2 = selectCategoriesForDisplay(categories, screens, 2, 2);
    expect(screen2.map((c) => c.id)).toEqual(['edibles']);
    expect(screen2.flatMap((c) => c.products)).toHaveLength(4);
  });

  it('duplicates a category across multiple displays', () => {
    const categories = [category('flower', 3), category('vapes', 2)];
    const screens: { id: string; name: string; categoryIds: string[]; layout?: string }[] = [
      { id: 'screen-1', name: 'Display 1', categoryIds: ['flower'] },
      { id: 'screen-2', name: 'Display 2', categoryIds: ['flower'] },
    ];

    const a = selectCategoriesForDisplay(categories, screens, 1, 2);
    const b = selectCategoriesForDisplay(categories, screens, 2, 2);
    expect(a.map((c) => c.id)).toEqual(['flower']);
    expect(b.map((c) => c.id)).toEqual(['flower']);
    expect(a[0].products).toEqual(b[0].products);
  });

  it('falls back to legacy allocation when screen selection is empty', () => {
    const categories = [category('flower', 4), category('vapes', 4)];
    const screens = normalizeScreens([], 2);

    const allocations = Array.from({ length: 2 }, (_, i) =>
      selectCategoriesForDisplay(categories, screens, i + 1, 2),
    );
    expect(allocations.map((group) => group.map((c) => c.id))).toEqual([
      ['flower'],
      ['vapes'],
    ]);
    expect(allocations.flatMap((group) => group.flatMap((c) => c.products))).toHaveLength(8);
  });

  it('picks screen config by 1-based display number', () => {
    const screens = normalizeScreens([{ id: 'screen-2', name: 'B', categoryIds: ['b'] }], 2);
    expect(getScreenConfig(screens, 1)?.id).toBe('screen-1');
    expect(getScreenConfig(screens, 2)?.name).toBe('B');
    expect(getScreenConfig(screens, 99)).toBeUndefined();
  });
});

describe('allocateCategoriesForDisplay', () => {
  it('keeps all content on a single display', () => {
    const categories = [category('flower', 8), category('vapes', 5)];
    expect(allocateCategoriesForDisplay(categories, 1, 1)).toEqual(categories);
  });

  it('partitions a typical eight-category menu across four displays without overlap', () => {
    const categories = Array.from({ length: 8 }, (_, index) => category(`category-${index + 1}`, 8));
    const allocations = Array.from({ length: 4 }, (_, index) => allocateCategoriesForDisplay(categories, index + 1, 4));

    expect(allocations.map((group) => group.map((item) => item.id))).toEqual([
      ['category-1', 'category-2'],
      ['category-3', 'category-4'],
      ['category-5', 'category-6'],
      ['category-7', 'category-8'],
    ]);
    expect(new Set(allocations.flatMap((group) => group.map((item) => item.id))).size).toBe(8);
  });

  it('balances an uneven Simply Green-sized catalog across three and four displays', () => {
    const categories = [
      category('flower', 125),
      category('pre-rolls', 82),
      category('vapes', 65),
      category('concentrates', 24),
      category('edibles', 147),
      category('tinctures', 6),
      category('topicals', 3),
      category('cbd', 12),
      category('accessories', 42),
    ];
    const expectedIds = categories.flatMap((item) => item.products.map((product) => product.id)).sort();

    for (const displayTotal of [3, 4]) {
      const allocations = Array.from(
        { length: displayTotal },
        (_, index) => allocateCategoriesForDisplay(categories, index + 1, displayTotal),
      );
      const counts = allocations.map((group) =>
        group.reduce((total, item) => total + item.products.length, 0),
      );
      const actualIds = allocations.flatMap((group) =>
        group.flatMap((item) => item.products.map((product) => product.id)),
      );

      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
      expect(actualIds.sort()).toEqual(expectedIds);
      expect(new Set(actualIds).size).toBe(506);
    }
  });

  it('splits products when one category must fill four displays', () => {
    const categories = [category('flower', 10)];
    const allocations = Array.from({ length: 4 }, (_, index) => allocateCategoriesForDisplay(categories, index + 1, 4));
    const productIds = allocations.flatMap((group) => group.flatMap((item) => item.products.map((product) => product.id)));

    expect(allocations.map((group) => group[0].products.length)).toEqual([3, 3, 2, 2]);
    expect(new Set(productIds).size).toBe(10);
  });

  it('splits each of two categories across its assigned displays', () => {
    const categories = [category('flower', 3), category('vapes', 5)];
    const allocations = Array.from({ length: 4 }, (_, index) => allocateCategoriesForDisplay(categories, index + 1, 4));

    expect(allocations.map((group) => ({ id: group[0].id, count: group[0].products.length }))).toEqual([
      { id: 'flower', count: 2 },
      { id: 'vapes', count: 3 },
      { id: 'flower', count: 1 },
      { id: 'vapes', count: 2 },
    ]);
  });

  it('clamps an out-of-range display number to the final display', () => {
    const categories = Array.from({ length: 4 }, (_, index) => category(`category-${index + 1}`, 2));
    expect(allocateCategoriesForDisplay(categories, 99, 2).map((item) => item.id)).toEqual(['category-3', 'category-4']);
  });
});
