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

export type ImportedTemplate = 'default' | 'minimal' | 'neon' | 'light' | 'sunset' | 'forest' | 'royal' | 'gold' | 'ocean' | 'crimson' | 'bone' | 'vapor';

export interface ImportedBrandStyle {
  template: ImportedTemplate;
  primaryColor: string;
  secondaryColor: string;
}

const BRAND_STYLES: Record<ImportedTemplate, ImportedBrandStyle> = {
  default: { template: 'default', primaryColor: '#10b981', secondaryColor: '#065f46' },
  minimal: { template: 'minimal', primaryColor: '#ffffff', secondaryColor: '#a1a1aa' },
  neon: { template: 'neon', primaryColor: '#00ff88', secondaryColor: '#00cc66' },
  light: { template: 'light', primaryColor: '#0f766e', secondaryColor: '#99f6e4' },
  sunset: { template: 'sunset', primaryColor: '#f97316', secondaryColor: '#7c2d12' },
  forest: { template: 'forest', primaryColor: '#22c55e', secondaryColor: '#14532d' },
  royal: { template: 'royal', primaryColor: '#818cf8', secondaryColor: '#312e81' },
  gold: { template: 'gold', primaryColor: '#fbbf24', secondaryColor: '#78350f' },
  ocean: { template: 'ocean', primaryColor: '#06b6d4', secondaryColor: '#164e63' },
  crimson: { template: 'crimson', primaryColor: '#fb7185', secondaryColor: '#881337' },
  bone: { template: 'bone', primaryColor: '#d6d3d1', secondaryColor: '#57534e' },
  vapor: { template: 'vapor', primaryColor: '#e879f9', secondaryColor: '#701a75' },
};

const BRAND_STYLE_RULES: Array<{ template: ImportedTemplate; pattern: RegExp }> = [
  { template: 'gold', pattern: /\b(high society|gold|golden|lux|luxury|premium|elite|select|reserve|crown|king|queen)\b/i },
  { template: 'royal', pattern: /\b(liberty|royal|capital|capitol|republic|state|empire|heritage|legacy)\b/i },
  { template: 'forest', pattern: /\b(forest|green|leaf|garden|tree|earth|organic|nature|harvest|botanical|grove|pine)\b/i },
  { template: 'vapor', pattern: /\b(vibe|vapor|vape|cloud|electric|future|cosmic|galaxy)\b/i },
  { template: 'ocean', pattern: /\b(ocean|coast|bay|blue|wave|harbor|shore|reef|tide)\b/i },
  { template: 'sunset', pattern: /\b(sun|sunset|desert|orange|fire|ember|blaze|flame)\b/i },
  { template: 'crimson', pattern: /\b(red|ruby|crimson|rose|scarlet|cherry)\b/i },
  { template: 'bone', pattern: /\b(white|bone|ivory|cream|clean|minimal|clinic|medical|apothecary)\b/i },
  { template: 'neon', pattern: /\b(neon|night|after dark|club|glow)\b/i },
];

export function getImportedTemplateStyle(template: ImportedTemplate): ImportedBrandStyle {
  return BRAND_STYLES[template] || BRAND_STYLES.default;
}

export function inferImportedBrandStyle(dispensaryName: string, logo?: string): ImportedBrandStyle {
  const source = `${dispensaryName || ''} ${logo || ''}`.replace(/[-_./]+/g, ' ');
  const matched = BRAND_STYLE_RULES.find((rule) => rule.pattern.test(source));
  return BRAND_STYLES[matched?.template || 'default'];
}


export interface FormattedMenu {
  categories: ScrapedCategory[];
  productCount: number;
  dispensaryName: string;
  logo?: string;
  layout: SmartLayout;
  brandStyle: ImportedBrandStyle;
  warnings: string[];
}

const CATEGORY_ORDER = ['Specials', 'Flower', 'Pre-Rolls', 'Vapes', 'Concentrates', 'Edibles', 'Tinctures', 'Topicals', 'CBD', 'Accessories', 'Other'];

const CATEGORY_SYNONYMS: { canonical: string; needles: string[] }[] = [
  { canonical: 'Specials', needles: ['special', 'specials', 'deal', 'deals', 'sale', 'promo', 'promotion', 'bogo', 'clearance', 'discount'] },
  { canonical: 'Flower', needles: ['flower', 'bud', 'whole flower', 'ground flower', 'loose flower', 'smalls', 'popcorn'] },
  { canonical: 'Pre-Rolls', needles: ['pre-roll', 'preroll', 'pre roll', 'joint', 'blunt', 'cone'] },
  { canonical: 'Vapes', needles: ['vape', 'vaporizer', 'cartridge', 'cart', 'disposable', 'aio', '510'] },
  { canonical: 'Concentrates', needles: ['concentrate', 'extract', 'resin', 'rosin', 'wax', 'shatter', 'badder', 'crumble', 'sauce', 'diamond', 'live', 'distillate', 'dab', 'kief', 'bubble hash'] },
  { canonical: 'Edibles', needles: ['edible', 'gummy', 'gummies', 'chocolate', 'chocolates', 'chew', 'cookie', 'brownie', 'beverage', 'drink', 'soda', 'mint', 'candy', 'snack'] },
  { canonical: 'CBD', needles: ['cbd'] },
  { canonical: 'Tinctures', needles: ['tincture', 'sublingual', 'drops', 'spray', 'elixir'] },
  { canonical: 'Topicals', needles: ['topical', 'cream', 'balm', 'lotion', 'transdermal', 'salve', 'patch'] },
  { canonical: 'Accessories', needles: ['accessory', 'accessories', 'gear', 'battery', 'paper', 'grinder', 'pipe', 'lighter', 'bong', 'rig', 'tool', 'apparel'] },
];

export function canonicalCategoryName(name: string): string {
  const lower = name.toLowerCase();
  for (const { canonical, needles } of CATEGORY_SYNONYMS) {
    if (needles.some((n) => lower === n || lower.includes(n))) return canonical;
  }
  return 'Other';
}

function stableIdSuffix(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function normalizeProductId(p: ScrapedProduct): string {
  const source = p.id || p.name;
  const normalized = source.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase().slice(0, 120);
  let hasNonAscii = false;
  for (let index = 0; index < source.length; index++) {
    if (source.charCodeAt(index) > 0x7f) {
      hasNonAscii = true;
      break;
    }
  }
  if (!hasNonAscii) return normalized;
  const base = normalized.replace(/-+/g, '-').replace(/^-|-$/g, '') || 'product';
  const suffix = stableIdSuffix(source);
  return `${base.slice(0, 119 - suffix.length)}-${suffix}`;
}

function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 40);
}

function titleCaseAllCapsProductName(value: string): string {
  if (!/[A-Z]/.test(value) || value !== value.toUpperCase()) return value;
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\bTincutre\b/g, 'Tincture')
    .replace(/\b(thc|cbd|cbg|cbn|og)\b/gi, (match) => match.toUpperCase());
}

function cleanProductDisplayName(product: ScrapedProduct, categoryName: string): string {
  const raw = product.name.replace(/\s+/g, ' ').replace(/^\s*\|+\s*/, '').replace(/\s*\|+\s*$/, '').trim();
  if (!/^[.]?\d+(?:\.\d+)?\s*(g|mg|ml|oz|ct)$/i.test(raw)) return titleCaseAllCapsProductName(raw);
  const fallbackPrefix = (product.brand || categoryName).replace(/\s+/g, ' ').trim();
  return titleCaseAllCapsProductName(fallbackPrefix ? `${fallbackPrefix} ${raw}` : raw);
}

export interface FormatMenuOptions {
  maxCategories?: number;
  maxProductsPerCategory?: number;
  tvOptimize?: boolean;
  maxTvCategories?: number;
  maxTvProductsPerCategory?: number;
  preserveSections?: boolean;
}
export function isSpecialProduct(p: ScrapedProduct): boolean {
  if (p.special) return true;
  const text = `${p.name} ${p.brand || ''} ${p.category || ''} ${p.description || ''} ${p.specialLabel || ''}`.toLowerCase();
  return /\b(special|deal|sale|promo|promotion|bogo|clearance|discount|staff\s?pick|best\s?seller|top\s?seller|bundle|mix\s*&\s*match|happy\s*hour|flash\s*sale)\b/.test(text) || /\b\d{1,2}%\s*off\b/.test(text) || (p.originalPrice !== undefined && p.originalPrice > p.price);
}

function specialLabel(p: ScrapedProduct): string {
  if (p.specialLabel) return p.specialLabel;
  const text = `${p.name} ${p.brand || ''} ${p.category || ''} ${p.description || ''}`.toLowerCase();
  if (/\bbogo\b/.test(text)) return 'BOGO';
  const percent = text.match(/\b(\d{1,2}%\s*off)\b/);
  if (percent) return percent[1].toUpperCase();
  if (/\b(clearance|sale|promo|promotion|deal|discount|bundle|mix\s*&\s*match|happy\s*hour|flash\s*sale)\b/.test(text) || (p.originalPrice !== undefined && p.originalPrice > p.price)) return 'Sale';
  if (/\b(staff\s?pick|best\s?seller|top\s?seller)\b/.test(text)) return 'Best Seller';
  return 'Special';
}


export function scoreProductForTv(p: ScrapedProduct): number {
  let score = 0;
  if (p.inStock === false) score -= 1000;
  if (p.price > 0) score += 28;
  if (p.image) score += 60;
  else score -= 18;
  if (p.brand) score += 14;
  if (p.strain) score += 10;
  if (p.thc) score += 10;
  if (p.cbd) score += 3;
  if (p.weight) score += 10;
  if (isSpecialProduct(p)) score += 34;
  const nameLength = p.name.trim().length;
  if (nameLength >= 5 && nameLength <= 38) score += 8;
  else if (nameLength <= 54) score += 3;
  if (nameLength > 70) score -= 12;
  return score;
}

function categoryPriority(name: string): number {
  const index = CATEGORY_ORDER.indexOf(name);
  return index === -1 ? 99 : index;
}

function tvNameKey(product: ScrapedProduct): string {
  return product.name
    .toLowerCase()
    .replace(/\b(\d+(?:\.\d+)?\s*(g|mg|ml|oz|ct|pack|pk)|indica|sativa|hybrid)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 48);
}

function tvBrandKey(product: ScrapedProduct): string {
  return (product.brand || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32);
}

function tvStrainKey(product: ScrapedProduct): string {
  return product.strain || 'unknown';
}

function bestSellerSignal(product: ScrapedProduct, sourceIndex: number): number {
  const text = `${product.name} ${product.brand || ''} ${product.category || ''}`.toLowerCase();
  let score = Math.max(0, 24 - sourceIndex);
  if (/\b(best\s?seller|top\s?seller|popular|staff\s?pick|featured|customer\s?favorite|favorite|special)\b/.test(text)) {
    score += 32;
  }
  return score;
}


function selectDiverseTvProducts(products: ScrapedProduct[], maxProducts: number): ScrapedProduct[] {
  const priced = products.filter((p) => p.inStock !== false && p.price > 0);
  const candidatePool = priced.length > 0 ? priced : products.filter((p) => p.inStock !== false);
  const candidates = candidatePool
    .map((product, sourceIndex) => ({
      product,
      score: scoreProductForTv(product) + bestSellerSignal(product, sourceIndex),
    }))
    .sort((a, b) => {
      const scoreDelta = b.score - a.score;
      if (scoreDelta !== 0) return scoreDelta;
      const priceDelta = b.product.price - a.product.price;
      if (priceDelta !== 0) return priceDelta;
      return a.product.name.localeCompare(b.product.name);
    })
    .map((item) => item.product);

  const selected: ScrapedProduct[] = [];
  const nameKeys = new Set<string>();
  const brandCounts = new Map<string, number>();
  const strainCounts = new Map<string, number>();
  const brandLimit = Math.max(2, Math.ceil(maxProducts / 3));
  const strainLimit = Math.max(2, Math.ceil(maxProducts / 2));

  const tryAdd = (product: ScrapedProduct, enforceDiversity: boolean): void => {
    if (selected.length >= maxProducts) return;
    const nameKey = tvNameKey(product);
    if (nameKey && nameKeys.has(nameKey)) return;
    const brandKey = tvBrandKey(product);
    const strainKey = tvStrainKey(product);
    if (enforceDiversity && (brandCounts.get(brandKey) || 0) >= brandLimit) return;
    if (enforceDiversity && strainKey !== 'unknown' && (strainCounts.get(strainKey) || 0) >= strainLimit) return;
    selected.push(product);
    if (nameKey) nameKeys.add(nameKey);
    brandCounts.set(brandKey, (brandCounts.get(brandKey) || 0) + 1);
    strainCounts.set(strainKey, (strainCounts.get(strainKey) || 0) + 1);
  };

  for (const product of candidates) tryAdd(product, true);
  for (const product of candidates) tryAdd(product, false);
  return selected;
}

export function selectTvProducts(
  categories: ScrapedCategory[],
  opts: { maxCategories?: number; maxProductsPerCategory?: number; preserveSections?: boolean } = {}
): ScrapedCategory[] {
  const maxCategories = opts.maxCategories ?? 10;
  const maxProductsPerCategory = opts.maxProductsPerCategory ?? 6;
  if (opts.preserveSections) {
    return categories
      .map((cat) => ({ ...cat, products: selectDiverseTvProducts(cat.products, maxProductsPerCategory) }))
      .filter((cat) => cat.products.length > 0)
      .slice(0, maxCategories)
      .map((cat, index) => ({ ...cat, order: index }));
  }
  const specialProducts = categories.flatMap((cat) =>
    cat.products
      .filter(isSpecialProduct)
      .map((product) => ({ ...product, category: 'Specials', special: true, specialLabel: specialLabel(product) }))
  );
  const specialCategory: ScrapedCategory[] = specialProducts.length > 0
    ? [{
        id: 'specials',
        name: 'Specials',
        order: 0,
        products: selectDiverseTvProducts(specialProducts, maxProductsPerCategory),
      }]
    : [];
  const regularCategories = categories
    .map((cat) => ({ ...cat, products: selectDiverseTvProducts(cat.products.filter((product) => !isSpecialProduct(product)), maxProductsPerCategory) }))
    .filter((cat) => cat.products.length > 0)
    .sort((a, b) => categoryPriority(a.name) - categoryPriority(b.name));
  return [...specialCategory, ...regularCategories]
    .slice(0, maxCategories)
    .map((cat, index) => ({ ...cat, order: index }));
}

export function dedupeAndFormatCategories(
  categories: ScrapedCategory[],
  opts: FormatMenuOptions = {}
): { categories: ScrapedCategory[]; productCount: number; warnings: string[] } {
  const maxCategories = opts.maxCategories ?? 20;
  const maxProductsPerCategory = opts.maxProductsPerCategory ?? 40;
  const warnings: string[] = [];

  const preserveSections = opts.preserveSections === true;
  const merged = new Map<string, { name: string; products: ScrapedProduct[]; order: number }>();
  for (const cat of categories) {
    const sourceName = (cat.name || 'Other').replace(/\s+/g, ' ').trim() || 'Other';
    const displayName = preserveSections ? sourceName : canonicalCategoryName(sourceName);
    const key = preserveSections ? displayName.toLowerCase() : displayName;
    if (!merged.has(key)) {
      merged.set(key, { name: displayName, products: [], order: cat.order ?? merged.size });
    }
    merged.get(key)!.products.push(...cat.products);
  }

  const sorted = Array.from(merged.values()).sort((a, b) => {
    if (preserveSections) return a.order - b.order;
    const ai = CATEGORY_ORDER.indexOf(a.name);
    const bi = CATEGORY_ORDER.indexOf(b.name);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  if (sorted.length > maxCategories) {
    warnings.push(`Limited menu to ${maxCategories} sections for TV readability.`);
  }

  const outCategories: ScrapedCategory[] = [];
  let productCount = 0;

  for (let i = 0; i < sorted.length && i < maxCategories; i++) {
    const group = sorted[i];
    const name = group.name;
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
        name: cleanProductDisplayName(p, name),
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
  } else if (productCount <= 30 && categoryCount <= 4) {
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
  opts: FormatMenuOptions = {}
): FormattedMenu {
  const deduped = dedupeAndFormatCategories(categories, opts);
  const tvCategories = opts.tvOptimize
    ? selectTvProducts(deduped.categories, {
        maxCategories: opts.maxTvCategories,
        maxProductsPerCategory: opts.maxTvProductsPerCategory,
        preserveSections: opts.preserveSections,
      })
    : deduped.categories;
  const productCount = tvCategories.reduce((total, category) => total + category.products.length, 0);
  const layout = smartLayout(productCount, tvCategories.length);
  const brandStyle = inferImportedBrandStyle(dispensaryName, logo);
  const warnings = deduped.warnings.slice();
  if (opts.tvOptimize && productCount < deduped.productCount) {
    warnings.push(`Selected ${productCount} TV-ready products from ${deduped.productCount} imported products using image, price, and metadata quality.`);
  }
  return {
    categories: tvCategories,
    productCount,
    dispensaryName,
    logo,
    layout,
    brandStyle,
    warnings,
  };
}
