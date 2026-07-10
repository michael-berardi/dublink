export type DisplayCategory<TProduct = unknown> = {
  products?: TProduct[];
};

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
  return groups[displayIndex] || [];
}
