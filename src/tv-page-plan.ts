import { TV_FONT_SCALE_DEFAULT, TV_FONT_SCALE_MAX, TV_FONT_SCALE_MIN, type Category, type Product } from './types';

export interface TvPagePlanOptions {
  layout: string;
  bannerActive?: boolean;
  demoMode?: boolean;
  fontScale?: number;
}

/**
 * Builds the exact sequence of pages for one TV's already-partitioned catalog.
 * Products appear once in the plan. Full strain buckets become labeled pages;
 * smaller residual buckets share deterministic alphabetical fallback pages.
 */
export function buildTvCatalogPagePlan(
  categories: Category[],
  options: TvPagePlanOptions
): Category[][] {
  const normalizeStrain = (product: Product): 'Indica' | 'Sativa' | 'Hybrid' | undefined => {
    const value = String(product.strain || '').toLowerCase().trim();
    if (!value) return undefined;
    if (value === 'i' || value.includes('indica')) return 'Indica';
    if (value === 's' || value.includes('sativa')) return 'Sativa';
    if (value === 'h' || value.includes('hybrid')) return 'Hybrid';
    return undefined;
  };

  const capacity = () => {
    const demoMode = options.demoMode === true;
    let productsPerPage: number;
    let categoriesPerPage: number;
    switch (options.layout) {
      case 'grid': productsPerPage = 12; categoriesPerPage = 3; break;
      case 'pricewall': productsPerPage = demoMode ? 18 : 16; categoriesPerPage = 2; break;
      case 'list': productsPerPage = 10; categoriesPerPage = 3; break;
      case 'poster': productsPerPage = 3; categoriesPerPage = 1; break;
      case 'cinematic': productsPerPage = demoMode ? 8 : 6; categoriesPerPage = 1; break;
      case 'showcase': productsPerPage = 1; categoriesPerPage = 1; break;
      case 'editorial': productsPerPage = demoMode ? 12 : 9; categoriesPerPage = 3; break;
      case 'sparse': productsPerPage = 4; categoriesPerPage = 1; break;
      default: productsPerPage = 10; categoriesPerPage = 3;
    }
    if (options.bannerActive && options.layout !== 'pricewall') {
      productsPerPage = Math.max(1, productsPerPage - (options.layout === 'showcase' ? 0 : 2));
    }
    const rawFontScale = Number(options.fontScale);
    const fontScale = Number.isFinite(rawFontScale)
      ? Math.max(TV_FONT_SCALE_MIN, Math.min(TV_FONT_SCALE_MAX, rawFontScale))
      : TV_FONT_SCALE_DEFAULT;
    const hasAccessories = (categories || []).some((category) => /accessor/i.test(category?.name || ''));
    if (fontScale >= 220) {
      productsPerPage = options.layout === 'pricewall' ? Math.min(productsPerPage, 2) : 1;
      if (options.layout !== 'pricewall') categoriesPerPage = 1;
    } else if (fontScale >= 190) {
      if (options.layout === 'pricewall') productsPerPage = Math.min(productsPerPage, 4);
      else if (options.layout !== 'showcase') productsPerPage = Math.min(productsPerPage, 2);
      if (categoriesPerPage > 1) categoriesPerPage = 2;
    } else if (fontScale >= 160) {
      if (options.layout === 'pricewall') productsPerPage = Math.min(productsPerPage, 8);
      else if (options.layout === 'poster') productsPerPage = Math.min(productsPerPage, 1);
      else if (options.layout === 'cinematic') productsPerPage = Math.min(productsPerPage, 2);
      else if (options.layout === 'editorial') productsPerPage = Math.min(productsPerPage, 3);
      else if (options.layout === 'sparse') productsPerPage = Math.min(productsPerPage, 2);
      else if (options.layout !== 'showcase') productsPerPage = Math.min(productsPerPage, 6);
    } else if (fontScale >= 145) {
      if (options.layout === 'pricewall') productsPerPage = Math.min(productsPerPage, 10);
      else if (options.layout === 'poster') productsPerPage = Math.min(productsPerPage, 2);
      else if (options.layout === 'cinematic') productsPerPage = Math.min(productsPerPage, 3);
      else if (options.layout === 'editorial') productsPerPage = Math.min(productsPerPage, 4);
      else if (options.layout === 'sparse') productsPerPage = Math.min(productsPerPage, 3);
      else if (options.layout !== 'showcase') productsPerPage = Math.min(productsPerPage, 7);
    } else if (fontScale >= 130) {
      if (options.layout === 'pricewall') productsPerPage = Math.min(productsPerPage, 12);
      else if (options.layout === 'poster') productsPerPage = Math.min(productsPerPage, 3);
      else if (options.layout === 'cinematic') productsPerPage = Math.min(productsPerPage, 4);
      else if (options.layout === 'editorial') productsPerPage = Math.min(productsPerPage, 6);
      else if (options.layout !== 'showcase' && options.layout !== 'sparse') productsPerPage = Math.min(productsPerPage, 7);
    } else if (fontScale >= 115) {
      if (options.layout === 'pricewall') productsPerPage = Math.min(productsPerPage, 14);
      else if (options.layout === 'poster') productsPerPage = Math.min(productsPerPage, 3);
      else if (options.layout === 'cinematic') productsPerPage = Math.min(productsPerPage, 5);
      else if (options.layout === 'editorial') productsPerPage = Math.min(productsPerPage, 6);
      else if (options.layout !== 'showcase' && options.layout !== 'sparse') productsPerPage = Math.min(productsPerPage, 10);
    }
    if (options.layout === 'list' && hasAccessories) {
      const accessoriesLimit = fontScale >= 190 ? 2 : fontScale >= 160 ? 4 : fontScale >= 130 ? 6 : 7;
      productsPerPage = Math.min(productsPerPage, accessoriesLimit);
    }
    return { productsPerPage, categoriesPerPage };
  };

  const visibleCategories = (categories || []).filter(
    (category) => category && Array.isArray(category.products) && category.products.length > 0
  );
  if (visibleCategories.length === 0) return [];

  if (options.layout === 'showcase') {
    return visibleCategories.flatMap((category) =>
      category.products.map((product) => [{ ...category, products: [product] }])
    );
  }

  const { productsPerPage, categoriesPerPage } = capacity();
  const pages: Category[][] = [];
  const strainOrder: Array<'Indica' | 'Sativa' | 'Hybrid'> = ['Indica', 'Sativa', 'Hybrid'];

  for (let categoryStart = 0; categoryStart < visibleCategories.length; categoryStart += categoriesPerPage) {
    const categoryGroup = visibleCategories.slice(categoryStart, categoryStart + categoriesPerPage);
    const productsPerCategory = Math.max(1, Math.floor(productsPerPage / categoryGroup.length));
    const categoryPlans = categoryGroup.map((category) => {
      const assigned = new Set<Product>();
      const plan: Array<{ products: Product[]; strain?: 'Indica' | 'Sativa' | 'Hybrid' }> = [];

      for (const strain of strainOrder) {
        const bucket = category.products.filter((product) => normalizeStrain(product) === strain);
        const fullPageCount = Math.floor(bucket.length / productsPerCategory);
        for (let pageIndex = 0; pageIndex < fullPageCount; pageIndex += 1) {
          const products = bucket.slice(
            pageIndex * productsPerCategory,
            (pageIndex + 1) * productsPerCategory
          );
          products.forEach((product) => assigned.add(product));
          plan.push({ products, strain });
        }
      }

      const remaining = category.products.filter((product) => !assigned.has(product));
      for (let start = 0; start < remaining.length; start += productsPerCategory) {
        const products = remaining.slice(start, start + productsPerCategory);
        const strains = new Set(products.map(normalizeStrain).filter(Boolean));
        const strain = strains.size === 1 && products.every((product) => normalizeStrain(product))
          ? Array.from(strains)[0]
          : undefined;
        plan.push({ products, strain });
      }

      return plan.map((page) => ({
        ...category,
        name: page.strain ? `${category.name} · ${page.strain}` : category.name,
        products: page.products,
      }));
    });

    const groupPageCount = Math.max(...categoryPlans.map((plan) => plan.length));
    for (let pageIndex = 0; pageIndex < groupPageCount; pageIndex += 1) {
      const page = categoryPlans
        .map((plan) => plan[pageIndex])
        .filter((category): category is Category => Boolean(category));
      if (page.length > 0) pages.push(page);
    }
  }

  return pages;
}
