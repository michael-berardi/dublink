import { importDutchieMenu } from './dutchie-api';
import { importDutchiePublicMenu } from './dutchie-public-api';
import { scrapeDutchie, scrapeDutchieDemo, type ScrapedCategory, type ScrapedProduct } from './dutchie-scraper';

export type SourceType =
  | 'dutchie-embedded'
  | 'dutchie-regular'
  | 'dutchie-slug'
  | 'simply-green'
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
}

const DUTCHIE_EMBEDDED_RE = /dutchie\.com\/embedded-menu\/([a-zA-Z0-9_-]+)/i;
const DUTCHIE_DISPENSARY_RE = /dutchie\.com\/dispensary\/([a-zA-Z0-9_-]+)/i;
const DUTCHIE_ROOT_SLUG_RE = /dutchie\.com\/([a-zA-Z0-9_-]+)(?:\/[a-zA-Z0-9_-]+)?/i;
const DUTCHIE_EMBEDDED_ID_RE = /dutchie\.com\/api\/v2\/embedded-menu\/([a-f0-9]+)(?:\.js)?/i;

const DUTCHIE_EMBEDDED_ID_MAP: Record<string, string> = {
  // Simply Green NY embedded menu ID -> known Dutchie slug.
  '69ab2eec51d4a55999d225a5': 'simply-green',
};

const SIMPLY_GREEN_HOSTS = new Set([
  'simplygreenny.com',
  'www.simplygreenny.com',
  'simply-green-ny.pages.dev',
  'dc88ae0b.simply-green-ny.pages.dev',
]);

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || (value.includes('.') && !value.includes(' '));
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

  // Simply Green NY shortcut: map the SG website domains directly to the known
  // Dutchie slug so the importer can use the Dutchie API / public fallback.
  if (SIMPLY_GREEN_HOSTS.has(hostname)) {
    return { type: 'simply-green', slug: 'simply-green', url: urlStr };
  }

  if (hostname.endsWith('dutchie.com')) {
    const path = url.pathname.replace(/\/+$/, '');

    // Dutchie v2 embedded-menu script IDs (e.g. simply-green uses one).
    const embeddedIdMatch = path.match(/^\/api\/v2\/embedded-menu\/([a-f0-9]+)(?:\.js)?$/i);
    if (embeddedIdMatch) {
      const slug = DUTCHIE_EMBEDDED_ID_MAP[embeddedIdMatch[1]];
      if (slug) return { type: 'simply-green', slug, url: urlStr };
    }

    if (path.startsWith('/embedded-menu/')) {
      const slug = path.split('/')[2];
      if (slug) return { type: 'dutchie-embedded', slug: slug.toLowerCase(), url: urlStr };
    }

    if (path.startsWith('/dispensary/')) {
      const slug = path.split('/')[2];
      if (slug) return { type: 'dutchie-regular', slug: slug.toLowerCase(), url: urlStr };
    }

    const subdomain = hostname.replace(/\.dutchie\.com$/, '');
    if (subdomain && subdomain !== 'dutchie' && !subdomain.includes('.')) {
      return { type: 'dutchie-regular', slug: subdomain.toLowerCase(), url: urlStr };
    }

    const rootParts = path.split('/').filter(Boolean);
    if (rootParts[0]) {
      return { type: 'dutchie-regular', slug: rootParts[0].toLowerCase(), url: urlStr };
    }

    return { type: 'dutchie-regular', slug: '', url: urlStr, error: 'Could not find a store slug in this Dutchie link.' };
  }

  // Generic website — may or may not embed Dutchie; we resolve that at fetch time.
  return { type: 'website-generic', url: urlStr };
}

export function extractDutchieSlugFromHtml(html: string): string | null {
  const embedded = html.match(DUTCHIE_EMBEDDED_RE);
  if (embedded) return embedded[1].toLowerCase();
  const embeddedId = html.match(DUTCHIE_EMBEDDED_ID_RE);
  if (embeddedId) {
    const slug = DUTCHIE_EMBEDDED_ID_MAP[embeddedId[1]];
    if (slug) return slug.toLowerCase();
  }
  const dispensary = html.match(DUTCHIE_DISPENSARY_RE);
  if (dispensary) return dispensary[1].toLowerCase();
  const root = html.match(DUTCHIE_ROOT_SLUG_RE);
  if (root) return root[1].toLowerCase();
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

function extractStoreName(html: string, url: string): string {
  const ogSite = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ogSite) return ogSite.trim();
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ogTitle) return ogTitle.trim();
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (title) return title.trim();
  return titleCaseFromDomain(humanDomain(url));
}

function extractLogo(html: string, url: string): string | undefined {
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ogImage) return ogImage.trim();
  const twitterImage = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (twitterImage) return twitterImage.trim();
  const logo = html.match(/<img[^>]+(?:class=["'][^"']*logo[^"']*["']|alt=["'][^"']*logo[^"']*["'])[^>]+src=["']([^"']+)["']/i)?.[1];
  if (logo) {
    try {
      return new URL(logo, url).toString();
    } catch {
      return undefined;
    }
  }
  return undefined;
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

function normalizeGenericProduct(item: any, baseUrl: string): ScrapedProduct | null {
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (!name) return null;

  const offers = item.offers;
  const price = parsePrice(offers?.price);
  if (!price && typeof offers !== 'object') return null;

  let image: string | undefined;
  if (typeof item.image === 'string') image = item.image;
  else if (Array.isArray(item.image) && item.image.length) image = item.image[0];
  else if (typeof item.image?.url === 'string') image = item.image.url;
  if (image) {
    try {
      image = new URL(image, baseUrl).toString();
    } catch {
      image = undefined;
    }
  }

  const category = typeof item.category === 'string' ? item.category : guessCategoryFromName(name);
  const brand = typeof item.brand === 'string' ? item.brand : item.brand?.name;
  const description = typeof item.description === 'string' ? item.description : undefined;
  const combined = `${name} ${description || ''}`;

  // Extract weight from name or description (e.g., "3.5g", "100mg", "1/8 oz").
  const weightMatch = combined.match(/(\d+(?:\.\d+)?)\s*(g|mg|ml|oz)\b/i) ||
    combined.match(/(\d\/\d)\s*(oz)\b/i);
  const weight = weightMatch ? `${weightMatch[1]}${weightMatch[2]}` : undefined;

  // Extract THC/CBD from description.
  const thcMatch = combined.match(/THC[\s:]*([\d.]+%|[\d.]+mg)/i);
  const cbdMatch = combined.match(/CBD[\s:]*([\d.]+%|[\d.]+mg)/i);

  return {
    id: String(item.sku || item.name || item['@id'] || crypto.randomUUID()).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120),
    name,
    price,
    sku: typeof item.sku === 'string' ? item.sku : undefined,
    category,
    thc: thcMatch ? thcMatch[1] : undefined,
    cbd: cbdMatch ? cbdMatch[1] : undefined,
    image,
    weight,
    brand,
    inStock: offers?.availability !== 'https://schema.org/OutOfStock' && offers?.availability !== 'OutOfStock',
    strain: parseStrain(combined),
  };
}

async function fetchWebsiteHtml(url: string): Promise<string> {
  const resp = await fetch(url, {
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

export async function scrapeGenericWebsite(url: string): Promise<MenuImportResult> {
  const html = await fetchWebsiteHtml(url);
  const dispensaryName = extractStoreName(html, url);
  const logo = extractLogo(html, url);

  const products: ScrapedProduct[] = [];
  const seen = new Set<string>();
  const ldMatches = html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g);
  for (const match of ldMatches) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const candidates = item['@type'] === 'Product' ? [item] : [];
        if (Array.isArray(item.itemListElement)) {
          for (const el of item.itemListElement) {
            if (el?.item?.['@type'] === 'Product') candidates.push(el.item);
          }
        }
        for (const prod of candidates) {
          const p = normalizeGenericProduct(prod, url);
          if (!p || !p.price) continue;
          if (seen.has(p.id)) continue;
          seen.add(p.id);
          products.push(p);
        }
      }
    } catch {
      // ignore malformed JSON-LD
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
      products: prods.slice(0, 40),
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

export async function resolveMenuSource(input: string, env: MenuImportEnv): Promise<MenuImportResult> {
  const source = detectMenuSource(input);
  if (source.type === 'invalid') {
    throw new Error(source.error || 'Invalid menu source.');
  }

  // Generic website that may embed Dutchie.
  if (source.type === 'website-generic' && source.url) {
    let websiteError: string | undefined;
    try {
      const html = await fetchWebsiteHtml(source.url);
      const slug = extractDutchieSlugFromHtml(html);
      if (slug) {
        return importDutchieFromSlug(slug, env, `website-dutchie:${source.url}`);
      }
    } catch (err) {
      websiteError = err instanceof Error ? err.message : 'Website fetch failed';
    }
    try {
      return { ...await scrapeGenericWebsite(source.url), source: 'website-generic' };
    } catch (err) {
      const genericError = err instanceof Error ? err.message : 'Generic website scrape failed';
      // Last resort: return a demo menu seeded from the website URL so the user
      // still gets a working preview. Only do this for syntactically valid URLs.
      return demoMenuFromSlug(source.url, 'website-generic', [websiteError, genericError].filter(Boolean) as string[]);
    }
  }

  // Dutchie sources resolve through a slug.
  if (source.slug) {
    return importDutchieFromSlug(source.slug, env, source.type);
  }

  throw new Error(source.error || 'Could not identify a menu source to import.');
}

function isUsableResult(result: MenuImportResult | undefined): boolean {
  return !!(
    result &&
    Array.isArray(result.categories) &&
    result.categories.length > 0 &&
    result.categories.some((c) => Array.isArray(c.products) && c.products.length > 0)
  );
}

async function demoMenuFromSlug(
  slug: string,
  sourceLabel: string,
  priorErrors: string[] = []
): Promise<MenuImportResult> {
  const demo = await scrapeDutchieDemo(slug);
  const errors = priorErrors.filter(Boolean);
  return {
    categories: demo.categories,
    productCount: demo.productCount,
    dispensaryName: demo.dispensaryName,
    logo: undefined,
    source: `${sourceLabel}:demo`,
    apiUsed: false,
    demo: true,
    apiError: errors.join('; ') || undefined,
    warnings: [
      errors.length > 0
        ? `Could not reach Dutchie for real data (${errors.join('; ')}). Showing a sample menu so you can preview the layout. Connect a Dutchie API key or Browserless token to import live data.`
        : 'Showing a sample menu so you can preview the layout. Connect a Dutchie API key or Browserless token to import live data.',
    ],
  };
}

async function importDutchieFromSlug(
  slug: string,
  env: MenuImportEnv,
  sourceLabel: string
): Promise<MenuImportResult> {
  const errors: string[] = [];
  let result: MenuImportResult | undefined;

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
        warnings: [],
      };
      if (isUsableResult(result)) return result;
      errors.push('Dutchie API returned no usable products');
      result = undefined;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Dutchie API import failed');
      console.error(`Dutchie API import failed for slug "${slug}": ${errors[errors.length - 1]}`);
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
        warnings: errors.length ? [`Dutchie API unavailable; used Browserless scraper (${errors[errors.length - 1]}).`] : [],
      };
      if (isUsableResult(result)) return result;
      errors.push('Browserless scraper returned no usable products');
      result = undefined;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Browserless scraper failed');
      console.error(`Browserless scraper failed for slug "${slug}": ${errors[errors.length - 1]}`);
    }
  }

  if (!result) {
    try {
      const publicResult = await importDutchiePublicMenu(slug);
      result = {
        categories: publicResult.categories,
        productCount: publicResult.productCount,
        dispensaryName: publicResult.dispensaryName,
        logo: publicResult.logo,
        source: sourceLabel,
        apiUsed: false,
        warnings: errors.length ? [`Dutchie API/Browserless unavailable; used public GraphQL fallback (${errors.join('; ')}).`] : [],
      };
      if (isUsableResult(result)) return result;
      errors.push('Dutchie public API returned no usable products');
      result = undefined;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Dutchie public API import failed');
      console.error(`Dutchie public API import failed for slug "${slug}": ${errors[errors.length - 1]}`);
    }
  }

  // Last resort: always return a usable demo menu for any syntactically valid
  // Dutchie slug, regardless of whether live data is reachable. We intentionally
  // do NOT attempt a direct fetch to Dutchie pages here: it is frequently
  // blocked, rate-limited, or returns bot walls, and would only delay the demo
  // fallback that guarantees a working preview.
  return demoMenuFromSlug(slug, sourceLabel, errors);
}
