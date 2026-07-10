import { importDutchieMenu } from './dutchie-api';
import { importDutchiePublicMenu } from './dutchie-public-api';
import { scrapeDutchie, type ScrapedCategory, type ScrapedProduct } from './dutchie-scraper';

export type SourceType =
  | 'dutchie-embedded'
  | 'dutchie-regular'
  | 'dutchie-slug'
  | 'website-dutchie'
  | 'website-generic'
  | 'invalid';

export interface MenuSource {
  type: SourceType;
  slug?: string;
  url?: string;
  error?: string;
}

export interface MenuImportResult {
  categories: ScrapedCategory[];
  productCount: number;
  dispensaryName: string;
  logo?: string;
  source: string;
  apiUsed?: boolean;
  demo?: boolean;
  apiError?: string;
  warnings: string[];
}

export interface MenuImportEnv {
  DUTCHIE_API_KEY?: string;
  BROWSERLESS_TOKEN?: string;
  OVERSEER_CRAWL_URL?: string;
  OVERSEER_CRAWL_API_KEY?: string;
}

type OverseerProductCrawlProduct = {
  id?: string;
  name?: string;
  price?: number;
  currency?: string;
  url?: string;
  image?: string;
  category?: string;
  brand?: string;
  description?: string;
  inStock?: boolean;
  thc?: string;
  cbd?: string;
  weight?: string;
};

type OverseerProductCrawlResponse = {
  success?: boolean;
  sourceURL?: string;
  discoveredUrls?: string[];
  dutchie?: {
    kind?: 'iframe' | 'script' | 'link';
    slug?: string;
    embedId?: string;
    embedUrl?: string;
  };
  products?: OverseerProductCrawlProduct[];
  productCount?: number;
  categories?: Array<{ name?: string; products?: OverseerProductCrawlProduct[] }>;
  warnings?: string[];
};

const DUTCHIE_EMBEDDED_RE = /dutchie\.com\/embedded-menu\/([a-zA-Z0-9_-]+)/i;
const DUTCHIE_STORE_RE = /dutchie\.com\/stores\/([a-zA-Z0-9_-]+)/i;
const DUTCHIE_DISPENSARY_RE = /dutchie\.com\/dispensary\/([a-zA-Z0-9_-]+)/i;
const DUTCHIE_ROOT_SLUG_RE = /https?:\/\/(?:www\.)?dutchie\.com\/([a-zA-Z0-9_-]+)(?:\/[a-zA-Z0-9_-]+)?/i;
const DUTCHIE_RESERVED_PATHS = new Set(['api', 'api-2', 'assets', 'business', 'cdn', 'help', 'hc', 'images', 'stores', 'store', 'dispensaries', 'us', 'embedded-menu', 'www']);


function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || (value.includes('.') && !value.includes(' '));
}

function isPrivateOrLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) return true;
  return false;
}

export function normalizePublicHttpUrl(input: string): string {
  const raw = (input || '').trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error('Enter a public HTTP(S) website URL.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only public HTTP(S) website URLs can be scanned.');
  }
  if (url.username || url.password) {
    throw new Error('Website URLs with embedded credentials cannot be scanned.');
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new Error('Only standard public website ports can be scanned.');
  }
  if (isPrivateOrLocalHostname(url.hostname)) {
    throw new Error('Only public website URLs can be scanned.');
  }
  url.hash = '';
  return url.toString();
}

export function detectMenuSource(input: string): MenuSource {
  const raw = (input || '').trim();
  if (!raw) return { type: 'invalid', error: 'Enter a Dutchie URL, store slug, or dispensary website.' };

  // Slug-only input before any URL normalization.
  if (/^[a-zA-Z0-9_-]+$/.test(raw)) {
    return { type: 'dutchie-slug', slug: raw.toLowerCase() };
  }

  if (!looksLikeUrl(raw)) {
    return { type: 'invalid', error: 'That does not look like a valid URL or Dutchie slug.' };
  }

  let urlStr = raw;
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = 'https://' + urlStr;
  }

  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return { type: 'invalid', error: 'That does not look like a valid URL or Dutchie slug.' };
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');


  if (hostname === 'dutchie.com' || hostname.endsWith('.dutchie.com')) {
    const path = url.pathname.replace(/\/+$/, '');

    // Dutchie v2 embedded-menu script IDs are hex hashes, not cName slugs.
    // Treat them as dutchie-embedded; the crawl service resolves the cName
    // from the rendered iframe at runtime.
    const embeddedIdMatch = path.match(/^\/api\/v2\/embedded-menu\/([a-f0-9]+)(?:\.js)?$/i);
    if (embeddedIdMatch) {
      const embeddedId = embeddedIdMatch[1].toLowerCase();
      return { type: 'dutchie-embedded', slug: embeddedId, url: urlStr };
    }

    if (path.startsWith('/embedded-menu/')) {
      const slug = path.split('/')[2];
      if (slug && !DUTCHIE_RESERVED_PATHS.has(slug.toLowerCase())) return { type: 'dutchie-embedded', slug: slug.toLowerCase(), url: urlStr };
    }

    if (path.startsWith('/stores/')) {
      const slug = path.split('/')[2];
      if (slug && !DUTCHIE_RESERVED_PATHS.has(slug.toLowerCase())) return { type: 'dutchie-regular', slug: slug.toLowerCase(), url: urlStr };
    }

    if (path.startsWith('/dispensary/')) {
      const slug = path.split('/')[2];
      if (slug && !DUTCHIE_RESERVED_PATHS.has(slug.toLowerCase())) return { type: 'dutchie-regular', slug: slug.toLowerCase(), url: urlStr };
    }

    const subdomain = hostname.replace(/\.dutchie\.com$/, '');
    if (subdomain && subdomain !== 'dutchie' && !subdomain.includes('.') && !DUTCHIE_RESERVED_PATHS.has(subdomain)) {
      return { type: 'dutchie-regular', slug: subdomain.toLowerCase(), url: urlStr };
    }

    const rootParts = path.split('/').filter(Boolean);
    if (rootParts[0] && !DUTCHIE_RESERVED_PATHS.has(rootParts[0].toLowerCase())) {
      return { type: 'dutchie-regular', slug: rootParts[0].toLowerCase(), url: urlStr };
    }

    return { type: 'dutchie-regular', slug: '', url: urlStr, error: 'Could not find a store slug in this Dutchie link.' };
  }

  // Generic website — may or may not embed Dutchie; we resolve that at fetch time.
  return { type: 'website-generic', url: urlStr };
}

export function extractDutchieSlugFromHtml(html: string): string | null {
  // Look for cName slugs in iframe/store/dispensary URLs. We deliberately
  // skip api/v2/embedded-menu/{hexId}.js script references because those IDs
  // are internal Dutchie dispensary hashes, not customer-facing slugs.
  const embedded = html.match(DUTCHIE_EMBEDDED_RE);
  if (embedded && !DUTCHIE_RESERVED_PATHS.has(embedded[1].toLowerCase())) return embedded[1].toLowerCase();
  const store = html.match(DUTCHIE_STORE_RE);
  if (store && !DUTCHIE_RESERVED_PATHS.has(store[1].toLowerCase())) return store[1].toLowerCase();
  const dispensary = html.match(DUTCHIE_DISPENSARY_RE);
  if (dispensary && !DUTCHIE_RESERVED_PATHS.has(dispensary[1].toLowerCase())) return dispensary[1].toLowerCase();
  const root = html.match(DUTCHIE_ROOT_SLUG_RE);
  if (root && !DUTCHIE_RESERVED_PATHS.has(root[1].toLowerCase())) return root[1].toLowerCase();
  return null;
}

function humanDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').replace(/\.com$/, '');
  } catch {
    return 'Menu';
  }
}

function titleCaseFromDomain(domain: string): string {
  return domain
    .split(/[-_.]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
};

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (entity, code: string) => {
    if (code[0] !== '#') return HTML_ENTITIES[code.toLowerCase()] || entity;
    const numeric = code[1].toLowerCase() === 'x' ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
    return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : entity;
  });
}

function resolveAssetUrl(value: string, pageUrl: string): string | undefined {
  try {
    return new URL(decodeHtmlEntities(value.trim()), pageUrl).toString();
  } catch {
    return undefined;
  }
}

function extractStoreName(html: string, url: string): string {
  const ogSite = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ogSite) return decodeHtmlEntities(ogSite.trim());
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ogTitle) return decodeHtmlEntities(ogTitle.trim());
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (title) return decodeHtmlEntities(title.trim());
  return titleCaseFromDomain(humanDomain(url));
}

function extractLogo(html: string, url: string): string | undefined {
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ogImage) return resolveAssetUrl(ogImage, url);
  const twitterImage = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (twitterImage) return resolveAssetUrl(twitterImage, url);
  const logo = html.match(/<img[^>]+(?:class=["'][^"']*logo[^"']*["']|alt=["'][^"']*logo[^"']*["'])[^>]+src=["']([^"']+)["']/i)?.[1];
  return logo ? resolveAssetUrl(logo, url) : undefined;
}

function parsePrice(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const m = value.match(/[\d,]+\.?\d*/);
    return m ? parseFloat(m[0].replace(/,/g, '')) : 0;
  }
  return 0;
}

function parseStrain(text: string): 'indica' | 'sativa' | 'hybrid' | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('indica')) return 'indica';
  if (lower.includes('sativa')) return 'sativa';
  if (lower.includes('hybrid')) return 'hybrid';
  return undefined;
}

function guessCategoryFromName(name: string): string {
  const value = name.toLowerCase();
  if (value.includes('pre-roll') || value.includes('preroll') || value.includes('joint') || value.includes('blunt')) return 'Pre-Rolls';
  if (value.includes('flower') || value.includes('bud') || value.includes('whole flower') || value.includes('ground flower')) return 'Flower';
  if (value.includes('vape') || value.includes('vaporizer') || value.includes('aio') || value.includes('cartridge') || value.includes('disposable') || value.includes('cart')) return 'Vapes';
  if (value.includes('concentrate') || value.includes('extract') || value.includes('resin') || value.includes('rosin') || value.includes('wax') || value.includes('shatter') || value.includes('badder') || value.includes('crumble') || value.includes('sauce') || value.includes('live') || value.includes('diamond')) return 'Concentrates';
  if (value.includes('edible') || value.includes('gummy') || value.includes('gummies') || value.includes('chocolate') || value.includes('chocolates') || value.includes('chew') || value.includes('cookie') || value.includes('beverage') || value.includes('drink') || value.includes('soda') || value.includes('mint')) return 'Edibles';
  if (value.includes('cbd')) return 'CBD';
  if (value.includes('tincture') || value.includes('sublingual') || value.includes('drop')) return 'Tinctures';
  if (value.includes('topical') || value.includes('cream') || value.includes('balm') || value.includes('lotion') || value.includes('transdermal')) return 'Topicals';
  if (value.includes('accessory') || value.includes('battery') || value.includes('paper') || value.includes('grinder') || value.includes('gear') || value.includes('pipe') || value.includes('lighter')) return 'Accessories';
  return 'Other';
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringField(record: UnknownRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}


function firstOffer(value: unknown): UnknownRecord | undefined {
  if (isRecord(value)) return value;
  if (!Array.isArray(value)) return undefined;
  return value.find((offer) => isRecord(offer) && parsePrice(offer.price) > 0) as UnknownRecord | undefined
    ?? value.find(isRecord);
}

function normalizeGenericProduct(item: unknown, baseUrl: string): ScrapedProduct | null {
  if (!isRecord(item)) return null;

  const name = stringField(item, 'name') || stringField(item, 'title') || '';
  if (!name) return null;

  const offers = firstOffer(item.offers);
  const price = parsePrice(offers?.price ?? item.price);
  if (!price && !offers) return null;

  let image: string | undefined;
  const imageValue = item.image ?? item.imageUrl;
  if (typeof imageValue === 'string') image = imageValue;
  else if (Array.isArray(imageValue) && typeof imageValue[0] === 'string') image = imageValue[0];
  else if (isRecord(imageValue) && typeof imageValue.url === 'string') image = imageValue.url;
  if (image) {
    try {
      image = new URL(image, baseUrl).toString();
    } catch {
      image = undefined;
    }
  }

  const category = stringField(item, 'category') || guessCategoryFromName(name);
  const brandValue = item.brand;
  const brand = typeof brandValue === 'string'
    ? brandValue
    : isRecord(brandValue)
      ? stringField(brandValue, 'name')
      : undefined;
  const description = (stringField(item, 'description') || stringField(item, 'rawText') || stringField(item, 'potency'))?.slice(0, 500);
  const combined = `${name} ${description || ''}`;

  // Extract weight from name or description (e.g., "3.5g", "100mg", "1/8 oz").
  const weightMatch = combined.match(/(\d+(?:\.\d+)?)\s*(g|mg|ml|oz)\b/i) ||
    combined.match(/(\d\/\d)\s*(oz)\b/i);
  const weight = weightMatch ? `${weightMatch[1]}${weightMatch[2]}` : undefined;

  const thcMatch = combined.match(/THC[\s:]*([\d.]+%|[\d.]+mg)/i);
  const cbdMatch = combined.match(/CBD[\s:]*([\d.]+%|[\d.]+mg)/i);
  const sourceId = stringField(item, 'sku') || stringField(item, 'slug') || stringField(item, '@id') || name;
  const availability = offers?.availability ?? item.availability;
  const availabilityToken = typeof availability === 'string' ? availability.split(/[\/#]/).pop()?.toLowerCase() : undefined;

  return {
    id: sourceId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120),
    name,
    price,
    sku: stringField(item, 'sku'),
    category,
    thc: thcMatch ? thcMatch[1] : undefined,
    cbd: cbdMatch ? cbdMatch[1] : undefined,
    image,
    weight,
    brand,
    description,
    inStock: availabilityToken !== 'outofstock',
    strain: parseStrain(combined),
  };
}

async function fetchWebsiteHtml(url: string): Promise<string> {
  const safeUrl = normalizePublicHttpUrl(url);
  const resp = await fetch(safeUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!resp.ok) throw new Error(`Website returned ${resp.status}`);
  return resp.text();
}

function overseerCrawlBaseUrl(env: MenuImportEnv): string | null {
  const base = (env.OVERSEER_CRAWL_URL || '').trim();
  if (!base || !env.OVERSEER_CRAWL_API_KEY) return null;
  return base.replace(/\/+$/, '');
}

function cleanOverseerDisplayName(product: OverseerProductCrawlProduct, category: string): string {
  const raw = product.name?.trim() || '';
  if (!raw.includes('|')) return raw;
  const brand = (product.brand || '').toLowerCase();
  const categoryLower = category.toLowerCase();
  const strainWords = new Set(['indica', 'sativa', 'hybrid']);
  const parts = raw.split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const lower = part.toLowerCase();
      if (brand && lower === brand) return false;
      if (categoryLower && (lower === categoryLower || categoryLower.includes(lower))) return false;
      if (strainWords.has(lower)) return false;
      return true;
    });
  return parts.length ? parts.join(' ') : raw;
}

function productFromOverseerProduct(product: OverseerProductCrawlProduct, fallbackCategory?: string): ScrapedProduct | null {
  if (!product.name || !product.price) return null;
  const category = product.category || fallbackCategory || guessCategoryFromName(product.name);
  const sourceId = product.id || product.url || product.name;
  return {
    id: sourceId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120),
    name: cleanOverseerDisplayName(product, category),
    price: product.price,
    category,
    image: product.image,
    brand: product.brand,
    description: product.description,
    thc: product.thc,
    cbd: product.cbd,
    weight: product.weight,
    inStock: product.inStock !== false,
    strain: parseStrain(`${product.name} ${product.description || ''} ${category}`),
  };
}

function productCrawlDutchieSlug(data: OverseerProductCrawlResponse): string | null {
  const direct = data.dutchie?.slug;
  if (direct && !DUTCHIE_RESERVED_PATHS.has(direct.toLowerCase())) return direct.toLowerCase();
  // If the crawl found an embed script (ID only, no slug), try extracting
  // a slug from the embed URL which may contain the cName path.
  const embedUrl = data.dutchie?.embedUrl;
  if (embedUrl) return extractDutchieSlugFromHtml(embedUrl);
  return null;
}

function menuResultFromProductCrawl(data: OverseerProductCrawlResponse, sourceUrl: string): MenuImportResult | null {
  const seen = new Set<string>();
  const products: ScrapedProduct[] = [];
  const addProduct = (candidate: OverseerProductCrawlProduct, fallbackCategory?: string) => {
    const product = productFromOverseerProduct(candidate, fallbackCategory);
    if (!product || seen.has(product.id)) return;
    seen.add(product.id);
    products.push(product);
  };

  for (const group of data.categories || []) {
    for (const product of group.products || []) addProduct(product, group.name);
  }
  for (const product of data.products || []) addProduct(product);

  if (products.length === 0) return null;

  const categoryMap = new Map<string, ScrapedProduct[]>();
  for (const product of products) {
    const category = product.category || guessCategoryFromName(product.name);
    if (!categoryMap.has(category)) categoryMap.set(category, []);
    categoryMap.get(category)!.push(product);
  }

  const categories = Array.from(categoryMap.entries()).map(([name, prods], order) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name,
    order,
    products: prods,
  }));

  const warnings = data.warnings?.slice() || [];
  const crawled = data.discoveredUrls?.length || 0;
  if (crawled > 0) warnings.push(`Overseer Products Crawl checked ${crawled} page${crawled === 1 ? '' : 's'}.`);

  return {
    categories,
    productCount: products.length,
    dispensaryName: titleCaseFromDomain(humanDomain(sourceUrl)),
    source: 'overseer-products-crawl',
    warnings,
  };
}

async function fetchOverseerProductsCrawl(
  url: string,
  env: MenuImportEnv,
  preferDutchie: boolean
): Promise<OverseerProductCrawlResponse | null> {
  const base = overseerCrawlBaseUrl(env);
  if (!base) return null;
  const safeUrl = normalizePublicHttpUrl(url);
  const resp = await fetch(`${base}/v2/products/crawl`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OVERSEER_CRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: safeUrl,
      limit: 40,
      maxDepth: 1,
      waitFor: 2000,
      preferDutchie,
    }),
    signal: AbortSignal.timeout(60000),
  });
  const body = await resp.json().catch(() => null) as OverseerProductCrawlResponse | { error?: string; message?: string } | null;
  if (!resp.ok || !body || ('success' in body && body.success === false)) {
    const message = body && 'error' in body ? (body.error || body.message) : undefined;
    throw new Error(message || `Overseer Products Crawl returned ${resp.status}`);
  }
  return body as OverseerProductCrawlResponse;
}


export async function scrapeGenericWebsite(url: string): Promise<MenuImportResult> {
  const html = await fetchWebsiteHtml(url);
  const dispensaryName = extractStoreName(html, url);
  const logo = extractLogo(html, url);

  const products: ScrapedProduct[] = [];
  const seen = new Set<string>();
  const addCandidate = (candidate: unknown) => {
    const p = normalizeGenericProduct(candidate, url);
    if (!p || !p.price || seen.has(p.id)) return;
    seen.add(p.id);
    products.push(p);
  };

  const ldMatches = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi);
  for (const match of ldMatches) {
    if (!/\btype\s*=\s*["']application\/ld\+json["']/i.test(match[1])) continue;
    try {
      const data: unknown = JSON.parse(match[2]);
      const pending: unknown[] = Array.isArray(data) ? [...data] : [data];
      while (pending.length > 0) {
        const item = pending.pop();
        if (!isRecord(item)) continue;
        if (item['@type'] === 'Product') addCandidate(item);
        if (Array.isArray(item['@graph'])) pending.push(...item['@graph']);
        if (!Array.isArray(item.itemListElement)) continue;
        for (const element of item.itemListElement) {
          pending.push(isRecord(element) && 'item' in element ? element.item : element);
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks and continue scanning the page.
    }
  }


  if (products.length === 0) {
    throw new Error('No menu products found on this page. Try a Dutchie link or CSV import.');
  }

  const categoryMap = new Map<string, ScrapedProduct[]>();
  for (const p of products) {
    const cat = p.category || guessCategoryFromName(p.name);
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(p);
  }

  const categoryOrder = ['Flower', 'Pre-Rolls', 'Vapes', 'Concentrates', 'Edibles', 'Tinctures', 'Topicals', 'CBD', 'Accessories', 'Other'];
  const categories = Array.from(categoryMap.entries())
    .sort((a, b) => {
      const ai = categoryOrder.indexOf(a[0]);
      const bi = categoryOrder.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([name, prods], i) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      order: i,
      products: prods,
    }));

  return {
    categories,
    productCount: products.length,
    dispensaryName,
    logo,
    source: 'website-generic',
    warnings: [],
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: string | number | NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  });
}

export async function resolveMenuSource(input: string, env: MenuImportEnv): Promise<MenuImportResult> {
  const source = detectMenuSource(input);
  if (source.type === 'invalid') {
    throw new Error(source.error || 'Invalid menu source.');
  }


  // Generic website that may embed Dutchie; ask Overseer Products Crawl first so
  // rendered iframes/scripts are detected before the wizard declares a URL invalid.
  if (source.type === 'website-generic' && source.url) {
    const errors: string[] = [];
    try {
      const crawl = await withTimeout(fetchOverseerProductsCrawl(source.url, env, true), 60000, 'Overseer Products Crawl timed out');
      if (crawl) {
        const slug = productCrawlDutchieSlug(crawl);
        if (slug) {
          try {
            return await withTimeout(importDutchieFromSlug(slug, env, `website-dutchie:${source.url}`), 90000, 'Dutchie scraper timed out; trying custom ecommerce crawler.');
          } catch (err) {
            errors.push(err instanceof Error ? err.message : 'Dutchie import from embedded menu failed');
            const fallbackCrawl = await withTimeout(fetchOverseerProductsCrawl(source.url, env, false), 60000, 'Overseer Products Crawl ecommerce extraction timed out');
            const fallbackResult = fallbackCrawl ? menuResultFromProductCrawl(fallbackCrawl, source.url) : null;
            if (fallbackResult) return { ...fallbackResult, warnings: [...fallbackResult.warnings, ...errors] };
          }
        }
        const productResult = menuResultFromProductCrawl(crawl, source.url);
        if (productResult) return productResult;
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Overseer Products Crawl failed');
    }

    try {
      const html = await fetchWebsiteHtml(source.url);
      const slug = extractDutchieSlugFromHtml(html);
      if (slug) {
        return await withTimeout(importDutchieFromSlug(slug, env, `website-dutchie:${source.url}`), 90000, 'Dutchie scraper timed out.');
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Website fetch failed');
    }
    try {
      return { ...await scrapeGenericWebsite(source.url), source: 'website-generic' };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Generic website scrape failed');
      throw new Error(`No live menu products found on this website (${errors.join('; ')}). Try a Dutchie link or CSV import.`);
    }
  }

  // Dutchie sources resolve through a slug, with website crawl fallback when a
  // known website shortcut still has crawlable ecommerce data.
  if (source.slug) {
    try {
      return await withTimeout(importDutchieFromSlug(source.slug, env, source.type), 180000, 'Dutchie scraper timed out.');
    } catch (err) {
      if (!source.url) throw err;
      const crawl = await fetchOverseerProductsCrawl(source.url, env, false).catch(() => null);
      const fallback = crawl ? menuResultFromProductCrawl(crawl, source.url) : null;
      if (fallback) {
        const warning = err instanceof Error ? err.message : 'Dutchie import failed';
        return { ...fallback, warnings: [...fallback.warnings, warning] };
      }
      throw err;
    }
  }

  throw new Error(source.error || 'Could not identify a menu source to import.');
}

function liveImportError(sourceLabel: string, errors: string[]): Error {
  const details = errors.filter(Boolean).join('; ');
  return new Error(`Could not import live menu products from ${sourceLabel}${details ? ` (${details})` : ''}. Configure a Dutchie API key or Browserless token, or import a CSV.`);
}
function isUsableResult(result: MenuImportResult | undefined): boolean {
  return !!(
    result &&
    Array.isArray(result.categories) &&
    result.categories.length > 0 &&
    result.categories.some((c) => Array.isArray(c.products) && c.products.length > 0)
  );
}


async function importDutchieFromSlug(
  slug: string,
  env: MenuImportEnv,
  sourceLabel: string
): Promise<MenuImportResult> {
  const errors: string[] = [];
  let result: MenuImportResult | undefined;

  const shouldTryPrivateFirst = sourceLabel === 'dutchie-slug' && !!env.DUTCHIE_API_KEY;

  if (!shouldTryPrivateFirst) {
    try {
      const publicResult = await importDutchiePublicMenu(slug);
      result = {
        categories: publicResult.categories,
        productCount: publicResult.productCount,
        dispensaryName: publicResult.dispensaryName,
        logo: publicResult.logo,
        source: sourceLabel,
        apiUsed: false,
        warnings: [],
      };
      if (isUsableResult(result)) return result;
      errors.push('Dutchie public API returned no usable products');
      result = undefined;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Dutchie public API import failed');
      console.error(`Dutchie public API import failed for slug "${slug}": ${errors[errors.length - 1]}`);
    }
  }

  if (env.DUTCHIE_API_KEY) {
    try {
      const apiResult = await importDutchieMenu(slug, env.DUTCHIE_API_KEY);
      result = {
        categories: apiResult.categories,
        productCount: apiResult.productCount,
        dispensaryName: apiResult.dispensaryName,
        logo: apiResult.logo,
        source: sourceLabel,
        apiUsed: true,
        warnings: shouldTryPrivateFirst ? [] : [`Dutchie public GraphQL unavailable; used private API fallback (${errors.join('; ')}).`],
      };
      if (isUsableResult(result)) return result;
      errors.push('Dutchie API returned no usable products');
      result = undefined;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Dutchie API import failed');
      console.error(`Dutchie API import failed for slug "${slug}": ${errors[errors.length - 1]}`);
    }
  }

  if (shouldTryPrivateFirst) {
    try {
      const publicResult = await importDutchiePublicMenu(slug);
      result = {
        categories: publicResult.categories,
        productCount: publicResult.productCount,
        dispensaryName: publicResult.dispensaryName,
        logo: publicResult.logo,
        source: sourceLabel,
        apiUsed: false,
        warnings: errors.length ? [`Dutchie API unavailable; used public GraphQL fallback (${errors.join('; ')}).`] : [],
      };
      if (isUsableResult(result)) return result;
      errors.push('Dutchie public API returned no usable products');
      result = undefined;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Dutchie public API import failed');
      console.error(`Dutchie public API import failed for slug "${slug}": ${errors[errors.length - 1]}`);
    }
  }
  if (!result && env.BROWSERLESS_TOKEN) {
    try {
      const scraperResult = await scrapeDutchie(slug, env.BROWSERLESS_TOKEN);
      result = {
        categories: scraperResult.categories,
        productCount: scraperResult.productCount,
        dispensaryName: scraperResult.dispensaryName,
        logo: undefined,
        source: sourceLabel,
        apiUsed: false,
        warnings: errors.length ? [`Dutchie API/public GraphQL unavailable; used Browserless scraper (${errors.join('; ')}).`] : [],
      };
      if (isUsableResult(result)) return result;
      errors.push('Browserless scraper returned no usable products');
      result = undefined;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Browserless scraper failed');
      console.error(`Browserless scraper failed for slug "${slug}": ${errors[errors.length - 1]}`);
    }
  }

  throw liveImportError(sourceLabel, errors);
}
