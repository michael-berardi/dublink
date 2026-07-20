import type { ScreenConfig } from './types';

export type DisplayCategory<TProduct = unknown> = {
  id?: string;
  products?: TProduct[];
};

export const MAX_DISPLAYS = 4;
export const MIN_DISPLAYS = 1;

export function clampDisplayCount(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(MIN_DISPLAYS, Math.min(MAX_DISPLAYS, Math.floor(numeric)));
}

export function normalizeScreens(screens: unknown, _displayCount: number = 1): ScreenConfig[] {
  const defaults: ScreenConfig[] = Array.from({ length: MAX_DISPLAYS }, (_, index) => ({
    id: `screen-${index + 1}`,
    name: `Display ${index + 1}`,
    categoryIds: [],
  }));
  const input = Array.isArray(screens) ? screens : [];
  return defaults.map((defaultScreen) => {
    const existing = input.find((screen) => screen && screen.id === defaultScreen.id);
    const categoryIds = Array.isArray(existing?.categoryIds)
      ? existing.categoryIds.filter((id): id is string => typeof id === 'string')
      : [];
    const name = typeof existing?.name === 'string' && existing.name.trim() !== ''
      ? existing.name.trim()
      : defaultScreen.name;
    const layout = existing?.layout && typeof existing.layout === 'string'
      ? existing.layout
      : undefined;
    return {
      id: defaultScreen.id,
      name,
      categoryIds,
      layout,
    };
  });
}

export function getScreenConfig(
  screens: readonly ScreenConfig[] | null | undefined,
  displayNumber: number,
): ScreenConfig | undefined {
  const index = Math.max(1, Math.floor(displayNumber)) - 1;
  return (screens || [])[index];
}

export function selectCategoriesForDisplay<T extends DisplayCategory>(
  allCategories: readonly T[] | null | undefined,
  screens: readonly ScreenConfig[] | null | undefined,
  displayNumber: number,
  displayTotal: number,
): T[] {
  const categories = allCategories || [];
  const screen = getScreenConfig(screens, displayNumber);
  if (screen && screen.categoryIds.length > 0) {
    const categoryIds = screen.categoryIds;
    return categoryIds
      .map((id) => categories.find((category) => category.id === id))
      .filter((category): category is T => !!category);
  }
  return allocateCategoriesForDisplay(categories, displayNumber, displayTotal);
}

/**
 * Allocates menu categories to one TV in a multi-display wall.
 * Categories stay intact when there are enough of them; when there are fewer
 * categories than TVs, products are split so every screen receives content.
 */
export function allocateCategoriesForDisplay<T extends DisplayCategory>(
  allCategories: readonly T[] | null | undefined,
  displayNumber: number,
  displayTotal: number,
): T[] {
  const categories = (allCategories || []).filter(function (category) {
    return Boolean(category && category.products && category.products.length > 0);
  });
  if (displayTotal <= 1 || categories.length === 0) return categories.slice();

  const safeDisplayTotal = Math.max(1, Math.floor(displayTotal));
  const displayIndex = Math.min(safeDisplayTotal, Math.max(1, Math.floor(displayNumber))) - 1;

  if (categories.length < safeDisplayTotal) {
    const categoryIndex = displayIndex % categories.length;
    const category = categories[categoryIndex];
    const assignment = Math.floor(displayIndex / categories.length);
    const products = category.products || [];
    const screensForCategory = Math.floor((safeDisplayTotal - 1 - categoryIndex) / categories.length) + 1;
    const baseProducts = Math.floor(products.length / screensForCategory);
    const extraProducts = products.length % screensForCategory;
    const productCount = baseProducts + (assignment < extraProducts ? 1 : 0);
    const productStart = assignment * baseProducts + Math.min(assignment, extraProducts);
    let selectedProducts = products.slice(productStart, productStart + productCount);
    if (selectedProducts.length === 0 && products.length > 0) selectedProducts = [products[assignment % products.length]];
    return selectedProducts.length > 0
      ? [Object.assign({}, category, { products: selectedProducts }) as T]
      : [];
  }

  const groups: T[][] = [];
  let cursor = 0;
  for (let screen = 0; screen < safeDisplayTotal; screen += 1) {
    const remainingScreens = safeDisplayTotal - screen;
    if (remainingScreens === 1) {
      groups.push(categories.slice(cursor));
      break;
    }
    const remainingProducts = categories.slice(cursor).reduce(function (total, currentCategory) {
      return total + (currentCategory.products || []).length;
    }, 0);
    const targetProducts = remainingProducts / remainingScreens;
    const maxEnd = categories.length - (remainingScreens - 1);
    let end = cursor + 1;
    let groupProducts = (categories[cursor].products || []).length;
    while (end < maxEnd) {
      const nextProducts = (categories[end].products || []).length;
      if (
        groupProducts >= targetProducts
        && Math.abs(groupProducts - targetProducts) <= Math.abs(groupProducts + nextProducts - targetProducts)
      ) break;
      groupProducts += nextProducts;
      end += 1;
    }
    groups.push(categories.slice(cursor, end));
    cursor = end;
  }
  const groupCounts = groups.map(function (group) {
    return group.reduce(function (total, category) {
      return total + (category.products || []).length;
    }, 0);
  });
  const totalProducts = groupCounts.reduce(function (total, count) { return total + count; }, 0);
  const targetProducts = totalProducts / safeDisplayTotal;
  const shouldBalanceByProduct = Math.max(...groupCounts) - Math.min(...groupCounts) > Math.ceil(targetProducts * 0.5);
  if (!shouldBalanceByProduct) return groups[displayIndex] || [];

  const baseProducts = Math.floor(totalProducts / safeDisplayTotal);
  const extraProducts = totalProducts % safeDisplayTotal;
  const productStart = displayIndex * baseProducts + Math.min(displayIndex, extraProducts);
  const productCount = baseProducts + (displayIndex < extraProducts ? 1 : 0);
  const productEnd = productStart + productCount;
  const balanced: T[] = [];
  let categoryStart = 0;
  for (const category of categories) {
    const products = category.products || [];
    const categoryEnd = categoryStart + products.length;
    const overlapStart = Math.max(productStart, categoryStart);
    const overlapEnd = Math.min(productEnd, categoryEnd);
    if (overlapStart < overlapEnd) {
      balanced.push(Object.assign({}, category, {
        products: products.slice(overlapStart - categoryStart, overlapEnd - categoryStart),
      }) as T);
    }
    categoryStart = categoryEnd;
    if (categoryStart >= productEnd) break;
  }
  return balanced;
}
