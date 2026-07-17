import { describe, expect, it } from 'vitest';
import { allocateCategoriesForDisplay } from '../src/multi-display';

type Product = { id: string };
type Category = { id: string; products: Product[] };

function category(id: string, productCount: number): Category {
  return {
    id,
    products: Array.from({ length: productCount }, (_, index) => ({ id: `${id}-${index + 1}` })),
  };
}

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
