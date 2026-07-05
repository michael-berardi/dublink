import type { ScrapedCategory, ScrapedProduct } from './dutchie-scraper';

const DUTCHIE_GRAPHQL_URL = 'https://dutchie.com/graphql';
const DUTCHIE_GRAPHQL_FALLBACK_URL = 'https://api.dutchie.com/graphql';


export function parseDutchieSlug(input: string): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  // Slug-only input: letters, numbers, hyphens, and underscores (common in Dutchie handles).
  const slugOnly = /^[a-zA-Z0-9_-]+$/.test(trimmed);
  if (slugOnly) return trimmed.toLowerCase();

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  if (!hostname.endsWith('dutchie.com')) return null;

  // Remove leading/trailing slashes and split path.
  const pathParts = url.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);

  // https://dutchie.com/embedded-menu/<slug>[/...]
  const embeddedIdx = pathParts.indexOf('embedded-menu');
  if (embeddedIdx !== -1 && pathParts[embeddedIdx + 1]) {
    return pathParts[embeddedIdx + 1].toLowerCase();
  }

  // https://dutchie.com/dispensary/<slug> (sometimes used in public links).
  if (pathParts[0] === 'dispensary' && pathParts[1]) {
    return pathParts[1].toLowerCase();
  }

  // Subdomain store: https://<slug>.dutchie.com
  const subdomain = hostname.replace(/\.dutchie\.com$/, '');
  if (subdomain && subdomain !== 'dutchie' && !subdomain.includes('.')) {
    return subdomain.toLowerCase();
  }

  // Root-level slug: https://dutchie.com/<slug>
  if (pathParts[0] && !pathParts[0].includes('.')) {
    return pathParts[0].toLowerCase();
  }

  return null;
}

interface DutchieApiProduct {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  type?: string;
  strainType?: string;
  thc?: number | string | { value: number; unit: string };
  cbd?: number | string | { value: number; unit: string };
  description?: string;
  image?: string;
  images?: Array<{ url: string; active?: boolean }>;
  recPrices?: number[];
  Prices?: number[];
  prices?: number[];
  medicalPrices?: number[];
  POSMetaData?: {
    canonicalCategory?: string;
    canonicalBrandName?: string;
    canonicalImgUrl?: string;
    children?: Array<{ recPrice?: number; price?: number; option?: string }>;
  };
  posMetadata?: {
    canonicalCategory?: string;
    canonicalBrandName?: string;
    canonicalImgUrl?: string;
    children?: Array<{ recPrice?: number; price?: number; option?: string }>;
  };
  Options?: string[];
  options?: string[];
}

interface DutchieApiResponse {
  data?: {
    dispensary?: {
      id?: string;
      name?: string;
      logo?: string;
      imageUrl?: string;
      branding?: {
        logo?: string;
        [key: string]: unknown;
      };
    };
    products?: {
      edges?: Array<{ node?: DutchieApiProduct }>;
    };
    filteredProducts?: {
      products?: DutchieApiProduct[];
    };
  };
  errors?: Array<{ message: string }>;
}

function firstNumber(values: unknown): number {
  if (Array.isArray(values)) {
    const v = values.find((item) => typeof item === 'number' && item > 0);
    return typeof v === 'number' ? v : 0;
  }
  return typeof values === 'number' && values > 0 ? values : 0;
}

function potencyValue(content: unknown): string | undefined {
  if (!content) return undefined;
  if (typeof content === 'string') return content;
  if (typeof content === 'number') return `${content}%`;
  const value = (content as any).value;
  if (typeof value !== 'number') return undefined;
  return (content as any).unit === 'MILLIGRAMS' ? `${value}mg` : `${value}%`;
}

function cleanImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    u.searchParams.set('h', '400');
    u.searchParams.set('w', '400');
    u.searchParams.delete('dpr');
    return u.toString();
  } catch {
    return url;
  }
}

function cleanWeight(value: unknown): string | undefined {
  if (!value) return undefined;
  const weight = String(value).trim();
  if (!weight || weight.toLowerCase() === 'n/a') return undefined;
  const gramMatch = weight.match(/^(\d*\.?\d+)g$/i);
  if (gramMatch) {
    const grams = Number(gramMatch[1]);
    if (grams < 0.5 || grams > 56) return undefined;
  }
  return weight;
}

function parseStrain(text: string): 'indica' | 'sativa' | 'hybrid' | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('indica')) return 'indica';
  if (lower.includes('sativa')) return 'sativa';
  if (lower.includes('hybrid')) return 'hybrid';
  return undefined;
}

function parseTHC(text: string): string | undefined {
  const m = text.match(/THC:\s*([\d.]+%|[\d.]+mg)/i);
  return m ? m[1] : undefined;
}

function normalizeCategory(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes('flower')) return 'Flower';
  if (lower.includes('pre-roll') || lower.includes('preroll')) return 'Pre-Rolls';
  if (lower.includes('vape') || lower.includes('vaporizer')) return 'Vapes';
  if (lower.includes('concentrate') || lower.includes('extract')) return 'Concentrates';
  if (lower.includes('edible')) return 'Edibles';
  if (lower.includes('tincture')) return 'Tinctures';
  if (lower.includes('topical')) return 'Topicals';
  if (lower === 'cbd' || lower.includes('cbd')) return 'CBD';
  if (lower.includes('accessor')) return 'Accessories';
  return undefined;
}

function guessCategory(name: string, category?: string): string {
  const parsed = normalizeCategory(category);
  if (parsed) return parsed;
  const value = name.toLowerCase();
  if (value.includes('pre-roll') || value.includes('preroll') || value.includes('joint')) return 'Pre-Rolls';
  if (value.includes('flower') || value.includes('bud')) return 'Flower';
  if (value.includes('vape') || value.includes('vaporizer') || value.includes('aio') || value.includes('cartridge') || value.includes('disposable')) return 'Vapes';
  if (value.includes('concentrate') || value.includes('extract') || value.includes('resin') || value.includes('rosin') || value.includes('wax') || value.includes('shatter') || value.includes('badder') || value.includes('crumble') || value.includes('sauce')) return 'Concentrates';
  if (value.includes('edible') || value.includes('gummy') || value.includes('chocolate') || value.includes('chew') || value.includes('cookie')) return 'Edibles';
  if (value.includes('tincture') || value.includes('sublingual')) return 'Tinctures';
  if (value.includes('topical') || value.includes('cream') || value.includes('balm') || value.includes('lotion')) return 'Topicals';
  if (value.includes('cbd')) return 'CBD';
  if (value.includes('accessor') || value.includes('battery') || value.includes('paper') || value.includes('grinder')) return 'Accessories';
  return 'Other';
}

function parseWeight(text: string): string | undefined {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(g|mg|ml|oz|ct|pack|pk)\b/i);
  return m ? `${m[1]}${m[2]}` : undefined;
}

function toProduct(p: DutchieApiProduct): ScrapedProduct | null {
  const rawName = String(p.name || 'Product');
  const category = guessCategory(
    rawName,
    normalizeCategory(p.category) ||
      normalizeCategory(p.POSMetaData?.canonicalCategory) ||
      normalizeCategory(p.posMetadata?.canonicalCategory) ||
      p.type
  );
  const brand = p.brand || p.POSMetaData?.canonicalBrandName || p.posMetadata?.canonicalBrandName;
  const price =
    firstNumber(p.recPrices) ||
    firstNumber(p.prices) ||
    firstNumber(p.Prices) ||
    firstNumber(p.medicalPrices) ||
    firstNumber(p.POSMetaData?.children?.[0]?.recPrice) ||
    firstNumber(p.POSMetaData?.children?.[0]?.price) ||
    firstNumber(p.posMetadata?.children?.[0]?.recPrice) ||
    firstNumber(p.posMetadata?.children?.[0]?.price);
  if (!price) return null;
  const image = cleanImageUrl(
    p.image ||
      p.images?.find((img) => img?.active !== false)?.url ||
      p.POSMetaData?.canonicalImgUrl ||
      p.posMetadata?.canonicalImgUrl
  );
  const strain = parseStrain(String(p.strainType || rawName));
  const thc = potencyValue(p.thc) || parseTHC(rawName);
  const cbd = potencyValue(p.cbd);
  const rawWeight =
    Array.isArray(p.options) ? p.options[0] :
    Array.isArray(p.Options) ? p.Options[0] :
    p.POSMetaData?.children?.[0]?.option ||
    p.posMetadata?.children?.[0]?.option;
  const weight = cleanWeight(rawWeight || parseWeight(rawName));
  return {
    id: String(p.id || p.name || crypto.randomUUID()).replace(/[^a-zA-Z0-9_-]/g, '-'),
    name: rawName.replace(/\s+/g, ' ').trim(),
    price,
    sku: p.id,
    category,
    thc,
    cbd,
    image,
    weight,
    brand,
    inStock: true,
    strain,
  };
}

function toCategories(products: ScrapedProduct[]): ScrapedCategory[] {
  const categoryMap = new Map<string, ScrapedProduct[]>();
  for (const p of products) {
    const category = p.category || guessCategory(p.name, undefined);
    if (!categoryMap.has(category)) categoryMap.set(category, []);
    categoryMap.get(category)!.push(p);
  }

  const categoryOrder = ['Flower', 'Pre-Rolls', 'Vapes', 'Concentrates', 'Edibles', 'Tinctures', 'Topicals', 'CBD', 'Accessories', 'Other'];
  return Array.from(categoryMap.entries())
    .sort((a, b) => {
      const ai = categoryOrder.indexOf(a[0]);
      const bi = categoryOrder.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([name, products], i) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      order: i,
      products: products.slice(0, 40),
    }));
}

async function fetchDutchieGraphQL(query: string, variables: Record<string, unknown>, apiKey: string): Promise<DutchieApiResponse> {
  const endpoints = [DUTCHIE_GRAPHQL_URL, DUTCHIE_GRAPHQL_FALLBACK_URL];
  let lastError: Error | undefined;
  for (const endpoint of endpoints) {
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Accept': 'application/json',
          'Origin': 'https://dutchie.com',
          'Referer': 'https://dutchie.com/embedded-menu',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(45000),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Dutchie API returned ${resp.status} at ${endpoint}${text ? ': ' + text.slice(0, 200) : ''}`);
      }
      const data = (await resp.json()) as DutchieApiResponse;
      if (data.errors && data.errors.length > 0) {
        // Surface GraphQL errors so callers can decide whether to retry or fall back.
        throw new Error(data.errors[0].message);
      }
      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Continue to fallback endpoint on network / 403 / 5xx errors.
    }
  }
  throw lastError || new Error('Dutchie GraphQL request failed');
}

export async function importDutchieMenu(slug: string, apiKey: string): Promise<{ categories: ScrapedCategory[]; dispensaryName: string; productCount: number; logo?: string }> {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Dutchie API key is not configured.');
  }
  if (!slug || typeof slug !== 'string') {
    throw new Error('Invalid Dutchie dispensary slug.');
  }

  // Fetch dispensary metadata to get a stable id, display name, and logo.
  const dispensaryQuery = `
    query GetDispensary($slug: String!) {
      dispensary(slug: $slug) {
        id
        name
        logo
        imageUrl
        branding {
          logo
        }
      }
    }
  `;
  const dispensaryResp = await fetchDutchieGraphQL(dispensaryQuery, { slug }, apiKey);
  const dispensaryId = dispensaryResp.data?.dispensary?.id;
  const dispensaryName = dispensaryResp.data?.dispensary?.name || slug.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const logo =
    cleanImageUrl(dispensaryResp.data?.dispensary?.logo) ||
    cleanImageUrl(dispensaryResp.data?.dispensary?.branding?.logo) ||
    cleanImageUrl(dispensaryResp.data?.dispensary?.imageUrl);

  if (!dispensaryId) {
    throw new Error(`Could not find Dutchie dispensary for slug "${slug}". Check the URL and API key.`);
  }

  // Fetch products for the dispensary. Dutchie's schema has varied over time,
  // so we try the most common query shapes and keep the first one that returns
  // products.
  const productsQueryV2 = `
    query GetProducts($dispensaryId: ID!) {
      filteredProducts(dispensaryId: $dispensaryId) {
        products {
          id
          name
          brand
          category
          type
          strainType
          thc { value unit }
          cbd { value unit }
          description
          image
          images { url active }
          recPrices
          Prices
          medicalPrices
          POSMetaData {
            canonicalCategory
            canonicalBrandName
            canonicalImgUrl
            children { recPrice price option }
          }
          Options
        }
      }
    }
  `;
  const productsQueryV1 = `
    query GetProductsV1($dispensaryId: ID!) {
      products(dispensaryId: $dispensaryId) {
        edges {
          node {
            id
            name
            brand
            category
            type
            strainType
            thc { value unit }
            cbd { value unit }
            description
            image
            images { url active }
            recPrices
            Prices
            medicalPrices
            POSMetaData {
              canonicalCategory
              canonicalBrandName
              canonicalImgUrl
              children { recPrice price option }
            }
            Options
          }
        }
      }
    }
  `;

  let apiProducts: DutchieApiProduct[] = [];

  try {
    const v2 = await fetchDutchieGraphQL(productsQueryV2, { dispensaryId }, apiKey);
    apiProducts = v2.data?.filteredProducts?.products || [];
  } catch (_err) {
    // ignored; try v1
  }

  if (!apiProducts.length) {
    try {
      const v1 = await fetchDutchieGraphQL(productsQueryV1, { dispensaryId }, apiKey);
      const edges = v1.data?.products?.edges || [];
      apiProducts = edges.map((e) => e.node).filter((n): n is DutchieApiProduct => !!n);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Dutchie API request failed');
    }
  }

  if (!apiProducts.length) {
    throw new Error(lastError || 'Dutchie API returned no products. Check the slug and API key.');
  }

  const products: ScrapedProduct[] = [];
  const seen = new Set<string>();
  for (const p of apiProducts) {
    const product = toProduct(p);
    if (!product) continue;
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    products.push(product);
  }

  const categories = toCategories(products);
  const pricedCount = categories.reduce((total, category) => total + category.products.filter((product) => product.price > 0).length, 0);
  if (pricedCount === 0) {
    throw new Error('Dutchie import did not return priced products.');
  }

  return { categories, dispensaryName, productCount: products.length, logo };
}
