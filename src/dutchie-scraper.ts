// Dutchie menu scraper - uses Railway Browserless service to render JS-heavy Dutchie pages.
import { DEMO_DISPENSARY_NAME, createSimplyGreenDemoCategories } from './starter-template';
const BROWSERLESS_URL = 'https://overseer-browser-production.up.railway.app/scrape-specials';
const DUTCHIE_MENU_URL = 'https://overseer-browser-production.up.railway.app/scrape-dutchie-menu';

export interface ScrapedProduct {
  id: string;
  name: string;
  price: number;
  sku?: string;
  category?: string;
  thc?: string;
  cbd?: string;
  image?: string;
  description?: string;
  weight?: string;
  brand?: string;
  inStock: boolean;
  strain?: 'indica' | 'sativa' | 'hybrid';
  special?: boolean;
  specialLabel?: string;
  originalPrice?: number;
  priceTiers?: Array<{ label: string; price: string }>;
}

export interface ScrapedCategory {
  id: string;
  name: string;
  order: number;
  products: ScrapedProduct[];
}


function parseStrain(text: string): 'indica' | 'sativa' | 'hybrid' | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('indica')) return 'indica';
  if (lower.includes('sativa')) return 'sativa';
  if (lower.includes('hybrid')) return 'hybrid';
  return undefined;
}

function parseTHC(text: string): string | undefined {
  const m = text.match(/THC\s*:?\s*([\d.]+\s*(?:%|mg))/i);
  return m ? m[1].replace(/\s+/g, '') : undefined;
}

function parseCBD(text: string): string | undefined {
  const m = text.match(/CBD\s*:?\s*([\d.]+\s*(?:%|mg))/i);
  return m ? m[1].replace(/\s+/g, '') : undefined;
}

function parsePrices(text: string): { price: number; originalPrice?: number } {
  const prices = Array.from(text.matchAll(/\$[\d,]+\.?\d*/g))
    .map((match) => parseFloat(match[0].replace(/[$,]/g, '')))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!prices.length) return { price: 0 };
  const price = prices[0];
  const originalPrice = prices.find((value) => value > price);
  return originalPrice ? { price, originalPrice } : { price };
}

function productSlugFromHref(href: string | undefined): string {
  return href?.split('/product/')[1]?.split(/[/?#]/)[0] || '';
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b(\d+)\s+(\d+)g\b/gi, '$1.$2g')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function saleLabel(text: string, originalPrice?: number): string | undefined {
  if (/staff\s*pick/i.test(text)) return 'Staff Pick';
  if (/\bbogo\b/i.test(text)) return 'BOGO';
  const percent = text.match(/\b(\d{1,2}%\s*off)\b/i);
  if (percent) return percent[1].toUpperCase();
  if (originalPrice) return 'Sale';
  const deal = text.match(/\b(\d+\s*\/\s*\$\d+(?:,\s*\d+\s*\/\s*\$\d+)*)\b/i);
  if (deal) return deal[1].replace(/\s+/g, '');
  return undefined;
}

function firstNumber(values: unknown): number {
  if (Array.isArray(values)) {
    const v = values.find((item) => typeof item === 'number' && item > 0);
    return typeof v === 'number' ? v : 0;
  }
  return typeof values === 'number' && values > 0 ? values : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}


function potencyValue(content: unknown, category?: string): string | undefined {
  if (!content) return undefined;
  if (typeof content === 'string') return content;
  if (!isRecord(content)) return undefined;
  const range = content.range;
  const value = Array.isArray(range) ? range[0] : content.value;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined;
  const unit = typeof content.unit === 'string' ? content.unit.toUpperCase() : '';
  const usesMilligrams = unit.includes('MILLIGRAM')
    || category === 'Edibles' || category === 'Tinctures' || category === 'CBD';
  return usesMilligrams ? `${value}mg` : `${value}%`;
}

function imageCandidateUrl(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return firstImageUrl(...value);
  if (isRecord(value)) {
    return imageCandidateUrl(
      value.url ??
      value.src ??
      value.href ??
      value.image ??
      value.Image ??
      value.original ??
      value.thumbnail ??
      value.medium ??
      value.large
    );
  }
  return undefined;
}

function firstImageUrl(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const active = value.find((item) => !isRecord(item) || item.active !== false) ?? value[0];
      const activeUrl = imageCandidateUrl(active);
      if (activeUrl) return activeUrl;
      continue;
    }
    const url = imageCandidateUrl(value);
    if (url) return url;
  }
  return undefined;
}

function cleanImageUrl(url: unknown): string | undefined {
  const raw = imageCandidateUrl(url);
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return undefined;
    u.searchParams.set('h', '400');
    u.searchParams.set('w', '400');
    u.searchParams.delete('dpr');
    return u.toString();
  } catch {
    return undefined;
  }
}

function parseName(rawName: string): { name: string; brand?: string; category?: string } {
  const parts = rawName.split('|').map(s => s.trim());
  if (parts.length >= 4) {
    return { name: parts.slice(3).join(' | '), brand: parts[0], category: normalizeCategory(parts[1]) };
  }
  if (parts.length >= 2) {
    return { name: parts[parts.length - 1], brand: parts[0], category: normalizeCategory(parts[1]) };
  }
  const match = rawName.match(/^(.+?)\s+[\d.]+(g|mg|ml|oz|ct|pack|pk)/i);
  if (match) return { name: rawName, brand: undefined };
  return { name: rawName, brand: undefined };
}

function cleanScrapedDisplayName(name: string, brand?: string, category?: string): string {
  const cleaned = name
    .replace(/\bTHC:?\s*\d+(?:\.\d+)?%?\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?%THC\b/gi, ' ')
    .replace(/\b(indica|sativa|hybrid)\b/gi, ' ')
    .replace(/\b(?:\d+(?:\.\d+)?\s*)?(?:g|gm|mg|ml|oz|ct|pack|pk)\b/gi, ' ')
    .replace(/\([^)]*(?:g|oz|ct|pack|pk)[^)]*\)/gi, ' ')
    .replace(/\b(jar|bag|cartridge|disposable|multipack|pack|totalnetweight|offlower|0fflower|vaporizerorcartridge|pre-rollpack)\b/gi, ' ')
    .replace(/\[\s*\]/g, ' ')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const withoutPlaceholders = cleaned
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !/^(?:\.|\.?\s*(?:\d+\s*)?x)$/i.test(part))
    .join(' | ')
    .replace(/\s+x$/, '')
    .replace(/^untitled\s+/i, '')
    .trim();
  const categoryLabel = category === 'Accessories'
    ? 'Accessory'
    : category === 'Pre-Rolls'
      ? 'Pre-Roll'
      : category?.replace(/s$/, '') || 'Product';
  const cannabinoidOnly = /\b(?:THC|CBD|CBN|CBC)\b/i.test(withoutPlaceholders)
    && withoutPlaceholders
      .replace(/\b(?:THC|CBD|CBN|CBC)\b/gi, '')
      .replace(/[\d\s:()+.%x|-]/gi, '') === '';
  if (cannabinoidOnly) {
    if (!brand) return `Cannabis ${categoryLabel}`.slice(0, 90);
    const potencyLabel = withoutPlaceholders
      .replace(/:\s*:/g, ':')
      .replace(/\b(THC|CBD|CBN|CBC)\s*:\s*(?=(?:THC|CBD|CBN|CBC)\b)/gi, '$1 + ')
      .replace(/\b(THC|CBD|CBN|CBC)\s*:\s*(?=\d+:\d+\b)/gi, '$1 ')
      .replace(/\s+/g, ' ')
      .trim();
    return `${brand} ${potencyLabel}`.slice(0, 90);
  }
  if (withoutPlaceholders) return withoutPlaceholders.slice(0, 90);
  return `${brand || 'Cannabis'} ${categoryLabel}`.slice(0, 90);
}


function parseWeight(text: string): string | undefined {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(g|mg|ml|oz|ct|pack|pk)\b/i);
  return m ? `${m[1]}${m[2]}` : undefined;
}

function cleanWeight(value: unknown): string | undefined {
  if (!value) return undefined;
  const weight = String(value).trim();
  if (!weight || weight.toLowerCase() === 'n/a' || /(offlower|flower|vaporizer|cartridge|pre-roll|preroll|edible|concentrate|topical|tincture)/i.test(weight)) return undefined;
  const gramMatch = weight.match(/^(\d*\.?\d+)g$/i);
  if (gramMatch) {
    const grams = Number(gramMatch[1]);
    if (grams <= 0 || grams > 56) return undefined;
    if (grams < 0.5) return `${Number((grams * 1000).toFixed(2))}mg`;
  }
  return weight;
}

type ImportedPriceTier = { label: string; price: string };
type ScraperPosMeta = {
  canonicalCategory?: string;
  canonicalBrandName?: string;
  canonicalImgUrl?: string;
  children?: Array<{ recPrice?: number; price?: number; option?: string }>;
};
type ScraperPriceSource = {
  Options?: unknown[];
  options?: unknown[];
  recPrices?: unknown;
  Prices?: unknown;
  prices?: unknown;
  medicalPrices?: unknown;
  POSMetaData?: ScraperPosMeta;
  posMetadata?: ScraperPosMeta;
};
type ScraperRawProduct = ScraperPriceSource & {
  id?: string;
  _id?: string;
  Name?: string;
  name?: string;
  type?: string;
  brandName?: string;
  brand?: { name?: string };
  Image?: unknown;
  image?: unknown;
  images?: unknown;
  thumbnail?: unknown;
  productImage?: unknown;
  strainType?: string;
  THCContent?: unknown;
  CBDContent?: unknown;
  sku?: string;
  description?: string;
};
type ScraperStructuredResponse = {
  json?: { data?: { filteredProducts?: { products?: ScraperRawProduct[] } } };
};

function formatTierPrice(value: number): string {
  return `$${value.toFixed(2).replace(/\.00$/, '')}`;
}

function tierLabel(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  return cleanWeight(raw);
}

function productPriceTiers(product: ScraperPriceSource): ImportedPriceTier[] | undefined {
  const tiers: ImportedPriceTier[] = [];
  const seen = new Set<string>();
  const addTier = (labelValue: unknown, priceValue: unknown) => {
    const price = firstNumber(priceValue);
    const label = tierLabel(labelValue);
    if (!label || !price) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tiers.push({ label, price: formatTierPrice(price) });
  };

  const labels = product.options || product.Options || [];
  const prices = product.recPrices || product.prices || product.Prices || product.medicalPrices || [];
  if (Array.isArray(prices)) prices.forEach((price, index) => addTier(labels[index], price));
  product.POSMetaData?.children?.forEach((child) => addTier(child.option, child.recPrice || child.price));
  product.posMetadata?.children?.forEach((child) => addTier(child.option, child.recPrice || child.price));
  return tiers.length > 1 ? tiers : undefined;
}

function normalizeCategory(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes('flower') || lower.includes('clone') || lower.includes('seed')) return 'Flower';
  if (lower.includes('pre-roll') || lower.includes('preroll') || lower.includes('joint') || lower.includes('blunt') || lower.includes('cone')) return 'Pre-Rolls';
  if (lower.includes('vape') || lower.includes('vaporizer') || lower.includes('inhaler') || lower.includes('cartridge') || lower.includes('disposable') || lower.includes('aio')) return 'Vapes';
  if (lower.includes('concentrate') || lower.includes('extract') || lower.includes('resin') || lower.includes('rosin') || lower.includes('wax') || lower.includes('shatter') || lower.includes('badder') || lower.includes('crumble') || lower.includes('sauce')) return 'Concentrates';
  if (lower.includes('edible') || lower.includes('beverage') || lower.includes('drink') || lower.includes('capsule') || lower.includes('tablet') || lower.includes('pill') || lower.includes('oral')) return 'Edibles';
  if (lower.includes('tincture') || lower.includes('sublingual')) return 'Tinctures';
  if (lower.includes('topical') || lower.includes('transdermal') || lower.includes('suppository') || lower.includes('patch')) return 'Topicals';
  if (lower === 'cbd' || lower.includes('cbd')) return 'CBD';
  if (lower.includes('accessor') || lower.includes('apparel') || lower.includes('merch') || lower.includes('gear')) return 'Accessories';
  return undefined;
}

function guessCategory(href: string, text: string, parsedCategory?: string): string {
  if (parsedCategory) return parsedCategory;
  const value = `${href} ${text}`.toLowerCase();
  if (value.includes('pre-roll') || value.includes('preroll') || value.includes('joint') || value.includes('blunt') || value.includes('cone')) return 'Pre-Rolls';
  if (value.includes('flower') || value.includes('bud') || value.includes('clone') || value.includes('seed')) return 'Flower';
  if (value.includes('vape') || value.includes('vaporizer') || value.includes('inhaler') || value.includes('aio') || value.includes('cartridge') || value.includes('disposable')) return 'Vapes';
  if (value.includes('concentrate') || value.includes('extract') || value.includes('resin') || value.includes('rosin') || value.includes('wax') || value.includes('shatter') || value.includes('badder') || value.includes('crumble') || value.includes('sauce')) return 'Concentrates';
  if (value.includes('edible') || value.includes('gummy') || value.includes('chocolate') || value.includes('chew') || value.includes('cookie') || value.includes('beverage') || value.includes('drink') || value.includes('capsule') || value.includes('tablet') || value.includes('pill') || value.includes('oral')) return 'Edibles';
  if (value.includes('tincture') || value.includes('sublingual')) return 'Tinctures';
  if (value.includes('topical') || value.includes('cream') || value.includes('balm') || value.includes('lotion') || value.includes('transdermal') || value.includes('suppository') || value.includes('patch')) return 'Topicals';
  if (value.includes('cbd')) return 'CBD';
  if (value.includes('accessor') || value.includes('battery') || value.includes('paper') || value.includes('grinder') || value.includes('apparel') || value.includes('merch') || value.includes('gear')) return 'Accessories';
  return 'Other';
}



function compareProductNames(a: ScrapedProduct, b: ScrapedProduct): number {
  const nameOrder = a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true });
  return nameOrder || a.id.localeCompare(b.id, 'en', { sensitivity: 'base', numeric: true });
}

function structuredInventoryKey(id: string, sku?: string): string {
  const normalizedSku = sku?.trim().toLowerCase();
  return normalizedSku ? `sku:${normalizedSku}` : `id:${id.trim().toLowerCase()}`;
}

function structuredProductId(id: string, sku?: string): string {
  const normalizedSku = sku?.trim();
  const value = normalizedSku && normalizedSku.toLowerCase() !== id.trim().toLowerCase()
    ? `${id}-${normalizedSku}`
    : id;
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

export async function scrapeDutchie(dispensarySlug: string, token: string): Promise<{ categories: ScrapedCategory[]; dispensaryName: string; productCount: number }> {
  // Prefer the store page: Simply Green currently emits FilteredProducts
  // responses there, while its embedded-menu shell can render without exposing
  // the product GraphQL payloads Browserless needs to capture.
  const structuredUrls = [
    `https://dutchie.com/stores/${dispensarySlug}`,
    `https://dutchie.com/embedded-menu/${dispensarySlug}`,
  ];
  const fallbackUrls = [
    `https://dutchie.com/stores/${dispensarySlug}`,
    `https://dutchie.com/embedded-menu/${dispensarySlug}`,
  ];
  let structuredError: string | undefined;
  const structuredAttempts = await Promise.all(structuredUrls.map(async (dutchieUrl) => {
    try {
      return { result: await scrapeDutchieStructured(dutchieUrl, token) };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Structured Dutchie scrape failed' };
    }
  }));
  const structuredResults = structuredAttempts
    .map((attempt) => attempt.result)
    .filter((result): result is NonNullable<typeof result> => Boolean(result?.categories.length));
  if (structuredResults.length > 0) {
    const mergedCategories = new Map<string, ScrapedProduct[]>();
    const seenProducts = new Set<string>();
    for (const result of structuredResults) {
      for (const category of result.categories) {
        if (!mergedCategories.has(category.name)) mergedCategories.set(category.name, []);
        for (const product of category.products) {
          const productKey = structuredInventoryKey(product.id, product.sku);
          if (seenProducts.has(productKey)) continue;
          seenProducts.add(productKey);
          mergedCategories.get(category.name)!.push(product);
        }
      }
    }
    const categoryOrder = ['Flower', 'Pre-Rolls', 'Vapes', 'Concentrates', 'Edibles', 'Tinctures', 'Topicals', 'CBD', 'Accessories', 'Other'];
    const categories = [...mergedCategories.entries()]
      .sort(([a], [b]) => {
        const ai = categoryOrder.indexOf(a);
        const bi = categoryOrder.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
      .map(([name, products], order) => ({
        id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name,
        order,
        products: products.sort(compareProductNames),
      }));
    return {
      categories,
      dispensaryName: structuredResults[0].dispensaryName,
      productCount: seenProducts.size,
    };
  }
  structuredError = structuredAttempts.map((attempt) => attempt.error).filter(Boolean).join('; ')
    || 'Structured Dutchie scrape returned no products';

  let data: { products: Array<{ href: string; text: string; img: string }>; count: number } | undefined;
  let scrapeError: string | undefined;
  for (const dutchieUrl of fallbackUrls) {
    try {
      const scrapeUrl = `${BROWSERLESS_URL}?url=${encodeURIComponent(dutchieUrl)}`;
      const resp = await fetch(scrapeUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(25000),
      });
      if (!resp.ok) {
        throw new Error(`Scrape failed for ${dutchieUrl}: ${resp.status}`);
      }
      const candidate = await resp.json() as { products: Array<{ href: string; text: string; img: string }>; count: number };
      if (!candidate.products || !candidate.products.length) {
        throw new Error(`No products found at ${dutchieUrl}`);
      }
      data = candidate;
      break;
    } catch (err) {
      scrapeError = err instanceof Error ? err.message : 'Browserless fallback failed';
    }
  }

  if (!data?.products || !data.products.length) {
    throw new Error(`${scrapeError || 'No products found'}. Check the dispensary slug.${structuredError ? ` Structured scrape failed first: ${structuredError}` : ''}`);
  }

  // Deduplicate by slug
  const seen = new Set<string>();
  const categoryMap = new Map<string, ScrapedProduct[]>();

  for (const p of data.products) {
    const slug = productSlugFromHref(p.href);
    if (!slug || seen.has(slug)) continue;


    const text = p.text || '';
    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const firstLine = lines[0] || '';
    const pollutedLine = !firstLine || /^(indica|sativa|hybrid)$/i.test(firstLine) || /THC\s*:?\s*\d|CBD\s*:?\s*\d|\$|Add to cart/i.test(firstLine) || firstLine.length > 110;
    const rawName = pollutedLine ? titleFromSlug(slug) : firstLine;
    const { name, brand, category: parsedCategory } = parseName(rawName);
    const category = guessCategory(p.href || '', text || rawName, parsedCategory);
    const cleanName = cleanScrapedDisplayName(name, brand, category);
    const strain = parseStrain(text || rawName);
    const thc = parseTHC(text);
    const cbd = parseCBD(text);
    const { price, originalPrice } = parsePrices(text);
    if (!price) continue;
    seen.add(slug);
    const weight = cleanWeight(parseWeight(`${rawName} ${text}`));
    const specialLabel = saleLabel(text, originalPrice);

    const product: ScrapedProduct = {
      id: slug,
      name: cleanName,
      price,
      originalPrice,
      sku: slug,
      category,
      thc,
      cbd,
      image: cleanImageUrl(p.img),
      weight,
      brand: brand || lines.find((line) => line && line !== name && line !== cleanName && !/^(indica|sativa|hybrid)$/i.test(line) && !/THC|CBD|\$|Add to cart|In stock|Out of stock/i.test(line) && !/^\d/.test(line)),
      inStock: true,
      strain,
      special: !!specialLabel,
      specialLabel,
    };

    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(product);
  }

  const categoryOrder = ['Flower', 'Pre-Rolls', 'Vapes', 'Concentrates', 'Edibles', 'Tinctures', 'Topicals', 'CBD', 'Other'];
  const categories: ScrapedCategory[] = Array.from(categoryMap.entries())
    .sort((a, b) => {
      const ai = categoryOrder.indexOf(a[0]);
      const bi = categoryOrder.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([name, products], i) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      order: i,
      products,
    }));

  const pricedCount = categories.reduce(
    (total, category) => total + category.products.filter(product => product.price > 0).length,
    0
  );
  if (pricedCount === 0) {
    throw new Error('Dutchie import did not return priced products. Retry in a moment.');
  }

  const dispensaryName = dispensarySlug
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return { categories, dispensaryName, productCount: seen.size };
}

async function scrapeDutchieStructured(dutchieUrl: string, token: string): Promise<{ categories: ScrapedCategory[]; dispensaryName: string; productCount: number }> {
  const resp = await fetch(`${DUTCHIE_MENU_URL}?url=${encodeURIComponent(dutchieUrl)}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    signal: AbortSignal.timeout(45000),
  });
  if (!resp.ok) return { categories: [], dispensaryName: 'Dutchie Menu', productCount: 0 };

  const data = await resp.json() as { responses?: ScraperStructuredResponse[] };
  const seen = new Set<string>();
  const categoryMap = new Map<string, ScrapedProduct[]>();

  for (const response of data.responses || []) {
    const products = response.json?.data?.filteredProducts?.products || [];
    for (const p of products) {
      const id = String(p.id || p._id || p.Name || crypto.randomUUID());
      const sku = typeof p.sku === 'string' ? p.sku.trim() : '';
      const productKey = structuredInventoryKey(id, sku);
      if (seen.has(productKey)) continue;


      const rawName = String(p.Name || p.name || 'Product');
      const parts = rawName.split('|').map((part) => part.trim()).filter(Boolean);
      const category = normalizeCategory(p.type) || normalizeCategory(p.POSMetaData?.canonicalCategory) || normalizeCategory(p.posMetadata?.canonicalCategory) || normalizeCategory(parts[1]) || 'Other';
      const brand = p.brandName || p.brand?.name || p.POSMetaData?.canonicalBrandName || p.posMetadata?.canonicalBrandName || (parts.length >= 2 ? parts[0] : undefined);
      const name = parts.length >= 4 ? parts.slice(3).join(' | ') : rawName;
      const price = firstNumber(p.recPrices) || firstNumber(p.prices) || firstNumber(p.Prices) || firstNumber(p.medicalPrices) || firstNumber(p.POSMetaData?.children?.[0]?.recPrice) || firstNumber(p.POSMetaData?.children?.[0]?.price) || firstNumber(p.posMetadata?.children?.[0]?.recPrice) || firstNumber(p.posMetadata?.children?.[0]?.price);
      if (!price) continue;
      seen.add(productKey);

      const image = cleanImageUrl(firstImageUrl(p.Image, p.image, p.images, p.POSMetaData?.canonicalImgUrl, p.posMetadata?.canonicalImgUrl, p.thumbnail, p.productImage));
      const strain = parseStrain(String(p.strainType || parts[2] || rawName));
      const thc = potencyValue(p.THCContent, category) || parseTHC(rawName);
      const cbd = potencyValue(p.CBDContent, category);
      const rawWeight = Array.isArray(p.options) ? p.options[0] : Array.isArray(p.Options) ? p.Options[0] : p.POSMetaData?.children?.[0]?.option || p.posMetadata?.children?.[0]?.option;
      const weight = cleanWeight(rawWeight);

      const product: ScrapedProduct = {
        id: structuredProductId(id, sku),
        name: cleanScrapedDisplayName(name, brand, category),
        price,
        sku: sku || id,
        category,
        thc,
        cbd,
        description: typeof p.description === 'string' ? p.description.trim().slice(0, 240) : undefined,
        image,
        weight,
        brand,
        inStock: true,
        strain,
        priceTiers: productPriceTiers(p),
      };

      if (!categoryMap.has(category)) categoryMap.set(category, []);
      categoryMap.get(category)!.push(product);
    }
  }

  const categoryOrder = ['Flower', 'Pre-Rolls', 'Vapes', 'Concentrates', 'Edibles', 'Tinctures', 'Topicals', 'CBD', 'Accessories', 'Other'];
  const categories: ScrapedCategory[] = Array.from(categoryMap.entries())
    .sort((a, b) => {
      const ai = categoryOrder.indexOf(a[0]);
      const bi = categoryOrder.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([name, products], i) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      order: i,
      products,
    }));

  const path = new URL(dutchieUrl).pathname;
  const slug = path.split('/stores/')[1]?.split('/')[0] || path.split('/embedded-menu/')[1]?.split('/')[0] || 'dutchie-menu';
  const dispensaryName = slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return { categories, dispensaryName, productCount: seen.size };
}

async function scrapeDutchieDirect(dutchieUrl: string): Promise<{ categories: ScrapedCategory[]; dispensaryName: string; productCount: number }> {
  const resp = await fetch(dutchieUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) {
    throw new Error(`Direct fetch failed: ${resp.status}`);
  }
  const html = await resp.text();

  const ldMatches = html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g);
  const products: ScrapedProduct[] = [];
  const seen = new Set<string>();
  for (const match of ldMatches) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] === 'Product' && item.name && item.offers?.price) {
          const id = String(item.sku || item.name).replace(/[^a-zA-Z0-9_-]/g, '-');
          if (seen.has(id)) continue;
          seen.add(id);
          const name = item.name;
          products.push({
            id,
            name,
            price: parseFloat(item.offers.price) || 0,
            sku: item.sku || id,
            category: guessCategory('', name),
            inStock: item.offers.availability !== 'https://schema.org/OutOfStock',
            strain: parseStrain(item.name + ' ' + (item.description || '')),
            brand: item.brand?.name,
            image: cleanImageUrl(item.image),
            weight: parseWeight(item.name + ' ' + (item.description || '')),
          });
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  if (products.length === 0) {
    throw new Error('No products found via direct fetch. Try CSV import or configure Browserless-backed scraper.');
  }

  const categoryMap = new Map<string, ScrapedProduct[]>();
  for (const p of products) {
    const category = p.category || guessCategory('', p.name);
    if (!categoryMap.has(category)) categoryMap.set(category, []);
    categoryMap.get(category)!.push(p);
  }

  const categoryOrder = ['Flower', 'Pre-Rolls', 'Vapes', 'Concentrates', 'Edibles', 'Tinctures', 'Topicals', 'CBD', 'Accessories', 'Other'];
  const categories: ScrapedCategory[] = Array.from(categoryMap.entries())
    .sort((a, b) => {
      const ai = categoryOrder.indexOf(a[0]);
      const bi = categoryOrder.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([name, prods], i) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      order: i,
      products: prods.slice(0, 40),
    }));

  const path = new URL(dutchieUrl).pathname;
  const slug = path.split('/embedded-menu/')[1]?.split('/')[0] || 'dutchie-menu';
  const dispensaryName = slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return { categories, dispensaryName, productCount: seen.size };
}

export async function scrapeDutchieFallback(dispensarySlug: string): Promise<{ categories: ScrapedCategory[]; dispensaryName: string; productCount: number }> {
  return scrapeDutchieDirect(`https://dutchie.com/embedded-menu/${dispensarySlug}`);
}

// Last-resort demo fallback: when no API key, browserless token, or public
// network path can reach Dutchie, we generate a representative sample menu so
// the UI flow and formatter still work. The UI is responsible for surfacing the
// warning that this is sample data.
export async function scrapeDutchieDemo(_slug: string): Promise<{ categories: ScrapedCategory[]; dispensaryName: string; productCount: number; demo: true }> {
  const categories = createSimplyGreenDemoCategories().map((category) => ({
    id: category.id,
    name: category.name,
    order: category.order,
    products: category.products.map((product) => ({
      ...product,
      category: category.name,
    })),
  }));
  const productCount = categories.reduce((total, category) => total + category.products.length, 0);
  return { categories, dispensaryName: DEMO_DISPENSARY_NAME, productCount, demo: true };
}
