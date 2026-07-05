import type { ScrapedCategory, ScrapedProduct } from './dutchie-scraper';

export interface SmartLayout {
  displayCount: number;
  layoutMode: 'auto' | 'columns' | 'pricelist' | 'compact' | 'grid';
  fontSize: 'small' | 'medium' | 'large';
  showImages: boolean;
  showBrand: boolean;
  showStrain: boolean;
  theme: 'dark' | 'light';
}

export interface FormattedMenu {
  categories: ScrapedCategory[];
  productCount: number;
  dispensaryName: string;
  logo?: string;
  layout: SmartLayout;
  warnings: string[];
}

const CATEGORY_ORDER = ['Flower', 'Pre-Rolls', 'Vapes', 'Concentrates', 'Edibles', 'Tinctures', 'Topicals', 'CBD', 'Accessories', 'Other'];

const CATEGORY_SYNONYMS: { canonical: string; needles: string[] }[] = [
  { canonical: 'Flower', needles: ['flower', 'bud', 'whole flower', 'ground flower', 'loose flower', 'smalls', 'popcorn'] },
  { canonical: 'Pre-Rolls', needles: ['pre-roll', 'preroll', 'pre roll', 'joint', 'blunt', 'cone'] },
  { canonical: 'Vapes', needles: ['vape', 'vaporizer', 'cartridge', 'cart', 'disposable', 'aio', '510'] },
  { canonical: 'Concentrates', needles: ['concentrate', 'extract', 'resin', 'rosin', 'wax', 'shatter', 'badder', 'crumble', 'sauce', 'diamond', 'live', 'distillate', 'dab', 'kief', 'bubble hash'] },
  { canonical: 'Edibles', needles: ['edible', 'gummy', 'gummies', 'chocolate', 'chocolates', 'chew', 'cookie', 'brownie', 'beverage', 'drink', 'soda', 'mint', 'candy', 'snack'] },
  { canonical: 'CBD', needles: ['cbd'] },
  { canonical: 'Tinctures', needles: ['tincture', 'sublingual', 'drops', 'spray', 'elixir'] },
  { canonical: 'Topicals', needles: ['topical', 'cream', 'balm', 'lotion', 'transdermal', 'salve', 'patch'] },
  { canonical: 'Accessories', needles: ['accessory', 'gear', 'battery', 'paper', 'grinder', 'pipe', 'lighter', 'bong', 'rig', 'tool', 'apparel'] },
];

export function canonicalCategoryName(name: string): string {
  const lower = name.toLowerCase();
  for (const { canonical, needles } of CATEGORY_SYNONYMS) {
    if (needles.some((n) => lower === n || lower.includes(n))) return canonical;
  }
  return 'Other';
}

function normalizeProductId(p: ScrapedProduct): string {
  return (p.id || p.name).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase().slice(0, 120);
}

function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 40);
}

export function dedupeAndFormatCategories(
  categories: ScrapedCategory[],
  opts: { maxCategories?: number; maxProductsPerCategory?: number } = {}
): { categories: ScrapedCategory[]; productCount: number; warnings: string[] } {
  const maxCategories = opts.maxCategories ?? 20;
  const maxProductsPerCategory = opts.maxProductsPerCategory ?? 40;
  const warnings: string[] = [];

  const merged = new Map<string, { name: string; products: ScrapedProduct[] }>();
  for (const cat of categories) {
    const canonical = canonicalCategoryName(cat.name);
    if (!merged.has(canonical)) {
      merged.set(canonical, { name: canonical, products: [] });
    }
    merged.get(canonical)!.products.push(...cat.products);
  }

  const sorted = Array.from(merged.entries()).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a[0]);
    const bi = CATEGORY_ORDER.indexOf(b[0]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  if (sorted.length > maxCategories) {
    warnings.push(`Limited menu to ${maxCategories} categories; some niche categories were merged into Other.`);
  }

  const outCategories: ScrapedCategory[] = [];
  let productCount = 0;

  for (let i = 0; i < sorted.length && i < maxCategories; i++) {
    const [name, group] = sorted[i];
    const seen = new Set<string>();
    const products: ScrapedProduct[] = [];
    for (const p of group.products) {
      const id = normalizeProductId(p);
      const nameKey = normalizeProductName(p.name);
      const key = id || nameKey;
      if (seen.has(key)) continue;
      seen.add(key);
      products.push({
        ...p,
        id,
        name: p.name.replace(/\s+/g, ' ').trim(),
        category: name,
        inStock: p.inStock !== false,
      });
      if (products.length >= maxProductsPerCategory) break;
    }

    if (products.length === 0) continue;
    if (group.products.length > maxProductsPerCategory) {
      warnings.push(`"${name}" limited to ${maxProductsPerCategory} products for TV readability.`);
    }

    productCount += products.length;
    outCategories.push({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      order: i,
      products,
    });
  }

  return { categories: outCategories, productCount, warnings };
}

export function smartLayout(productCount: number, categoryCount: number): SmartLayout {
  // Display count: 1-4 based on how much content there is to show.
  let displayCount = 1;
  if (productCount > 80 || categoryCount > 6) displayCount = 4;
  else if (productCount > 45 || categoryCount > 4) displayCount = 3;
  else if (productCount > 18 || categoryCount > 2) displayCount = 2;

  // Layout mode: prioritize readability for the density of items.
  let layoutMode: SmartLayout['layoutMode'] = 'auto';
  let showImages = true;
  if (productCount <= 12 && categoryCount <= 3) {
    layoutMode = 'grid';
    showImages = true;
  } else if (productCount <= 30 || categoryCount <= 4) {
    layoutMode = 'columns';
    showImages = true;
  } else if (productCount <= 70) {
    layoutMode = 'auto';
    showImages = true;
  } else {
    layoutMode = 'compact';
    showImages = false;
  }

  // Font size: smaller as content density grows.
  let fontSize: SmartLayout['fontSize'] = 'large';
  if (productCount > 60 || categoryCount > 6) fontSize = 'small';
  else if (productCount > 25 || categoryCount > 3) fontSize = 'medium';

  return {
    displayCount,
    layoutMode,
    fontSize,
    showImages,
    showBrand: productCount <= 80,
    showStrain: productCount <= 80,
    theme: 'dark',
  };
}

export function formatMenu(
  categories: ScrapedCategory[],
  dispensaryName: string,
  logo?: string,
  opts?: { maxCategories?: number; maxProductsPerCategory?: number }
): FormattedMenu {
  const deduped = dedupeAndFormatCategories(categories, opts);
  const layout = smartLayout(deduped.productCount, deduped.categories.length);
  return {
    categories: deduped.categories,
    productCount: deduped.productCount,
    dispensaryName,
    logo,
    layout,
    warnings: deduped.warnings,
  };
}
