import type { ScrapedCategory, ScrapedProduct } from './dutchie-scraper';

const DUTCHIE_GRAPHQL_URL = 'https://dutchie.com/graphql';
const DUTCHIE_API2_GRAPHQL_URL = 'https://dutchie.com/api-2/graphql';

interface DutchiePublicDispensary {
  id?: string;
  name?: string;
  cName?: string;
  description?: string;
  address?: string;
  phone?: string;
  listImage?: string;
  bannerImage?: string;
  logoImage?: string;
  embeddedLogoImage?: string;
  embedBackUrl?: string;
  embeddedMenuUrl?: string;
  SpecialLogoImage?: string;
  menuSections?: Array<{
    category?: string;
    label?: string;
    linkLabel?: string;
    products?: DutchiePublicProduct[];
  }>;
}

interface DutchiePublicProduct {
  id?: string;
  name?: string;
  brand?: string;
  category?: string;
  type?: string;
  strainType?: string;
  thc?: { value?: number; unit?: string } | number | string;
  cbd?: { value?: number; unit?: string } | number | string;
  description?: string;
  image?: string;
  images?: Array<{ url?: string; active?: boolean }>;
  recPrices?: number[];
  Prices?: number[];
  prices?: number[];
  medicalPrices?: number[];
  salePrice?: number;
  specialPrice?: number;
  discountPrice?: number;
  discountedPrice?: number;
  originalPrice?: number;
  retailPrice?: number;
  listPrice?: number;
  special?: boolean;
  specials?: Array<{ name?: string; title?: string; label?: string; description?: string }>;
  discount?: string | number | { label?: string; description?: string; name?: string };
  deal?: string | { label?: string; description?: string; name?: string };
  Options?: string[];
  options?: string[];
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
  // V2 public API fields observed in the browser.
  cannabinoids?: Array<{ name?: string; value?: number; unit?: string }>;
  weights?: Array<{ value?: number; unit?: string; price?: number }>;
  variants?: Array<{ option?: string; recPrice?: number; price?: number }>;
  sku?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
  if (!isRecord(content)) return undefined;
  const value = content.value;
  if (typeof value !== 'number') return undefined;
  return content.unit === 'MILLIGRAMS' ? `${value}mg` : `${value}%`;
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

function parseStrain(text: string): 'indica' | 'sativa' | 'hybrid' | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('indica')) return 'indica';
  if (lower.includes('sativa')) return 'sativa';
  if (lower.includes('hybrid')) return 'hybrid';
  return undefined;
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

function extractCannabinoid(product: DutchiePublicProduct, name: string): string | undefined {
  if (!Array.isArray(product.cannabinoids)) return undefined;
  const match = product.cannabinoids.find((c) => c && c.name?.toLowerCase() === name.toLowerCase());
  if (!match) return undefined;
  const unit = match.unit === 'MILLIGRAMS' ? 'mg' : '%';
  return typeof match.value === 'number' ? `${match.value}${unit}` : undefined;
}


function dealLabelText(product: DutchiePublicProduct): string {
  const specialText = Array.isArray(product.specials)
    ? product.specials
        .map((special) => [special.label, special.title, special.name, special.description].filter(Boolean).join(' '))
        .join(' ')
    : '';
  const discountText = typeof product.discount === 'string' || typeof product.discount === 'number'
    ? String(product.discount)
    : product.discount
      ? [product.discount.label, product.discount.name, product.discount.description].filter(Boolean).join(' ')
      : '';
  const dealText = typeof product.deal === 'string'
    ? product.deal
    : product.deal
      ? [product.deal.label, product.deal.name, product.deal.description].filter(Boolean).join(' ')
      : '';
  return `${specialText} ${discountText} ${dealText} ${product.description || ''}`.trim();
}

function dealLabel(product: DutchiePublicProduct, originalPrice?: number): string | undefined {
  const text = dealLabelText(product);
  if (/\bbogo\b/i.test(text)) return 'BOGO';
  const percent = text.match(/\b(\d{1,2}%\s*off)\b/i);
  if (percent) return percent[1].toUpperCase();
  if (/\b(staff\s?pick|best\s?seller|top\s?seller)\b/i.test(text)) return 'Best Seller';
  if (/\b(bundle|mix\s*&\s*match|happy\s*hour|flash\s*sale|special|deal|sale|promo|promotion|clearance|discount)\b/i.test(text)) return 'Special';
  if (originalPrice) return 'Sale';
  return undefined;
}

function toProduct(p: DutchiePublicProduct): ScrapedProduct | null {
  const rawName = String(p.name || 'Product');
  const category = guessCategory(
    rawName,
    normalizeCategory(p.category) ||
      normalizeCategory(p.POSMetaData?.canonicalCategory) ||
      normalizeCategory(p.posMetadata?.canonicalCategory) ||
      p.type
  );
  const brand = p.brand || p.POSMetaData?.canonicalBrandName || p.posMetadata?.canonicalBrandName;
  const basePrice =
    firstNumber(p.recPrices) ||
    firstNumber(p.prices) ||
    firstNumber(p.Prices) ||
    firstNumber(p.medicalPrices) ||
    firstNumber(p.variants?.[0]?.recPrice) ||
    firstNumber(p.variants?.[0]?.price) ||
    firstNumber(p.POSMetaData?.children?.[0]?.recPrice) ||
    firstNumber(p.POSMetaData?.children?.[0]?.price) ||
    firstNumber(p.posMetadata?.children?.[0]?.recPrice) ||
    firstNumber(p.posMetadata?.children?.[0]?.price);
  if (!basePrice) return null;
  const dealPrice = firstNumber([p.salePrice, p.specialPrice, p.discountPrice, p.discountedPrice]);
  const explicitOriginalPrice = firstNumber([p.originalPrice, p.retailPrice, p.listPrice]);
  const price = dealPrice && dealPrice < basePrice ? dealPrice : basePrice;
  const originalPrice = explicitOriginalPrice && explicitOriginalPrice > price ? explicitOriginalPrice : dealPrice && dealPrice < basePrice ? basePrice : undefined;
  const specialLabel = dealLabel(p, originalPrice);
  const image = cleanImageUrl(
    p.image ||
      p.images?.find((img) => img?.active !== false)?.url ||
      p.POSMetaData?.canonicalImgUrl ||
      p.posMetadata?.canonicalImgUrl
  );
  const strain = parseStrain(String(p.strainType || rawName));
  const thc = potencyValue(p.thc) || extractCannabinoid(p, 'THC') || undefined;
  const cbd = potencyValue(p.cbd) || extractCannabinoid(p, 'CBD') || undefined;
  const rawWeight =
    Array.isArray(p.options) ? p.options[0] :
    Array.isArray(p.Options) ? p.Options[0] :
    p.weights?.[0]?.value ? `${p.weights[0].value}${p.weights[0].unit || 'g'}` :
    p.POSMetaData?.children?.[0]?.option ||
    p.posMetadata?.children?.[0]?.option ||
    p.variants?.[0]?.option;
  const weight = cleanWeight(rawWeight || parseWeight(rawName));
  return {
    id: String(p.id || p.name || crypto.randomUUID()).replace(/[^a-zA-Z0-9_-]/g, '-'),
    name: rawName.replace(/\s+/g, ' ').trim(),
    price,
    originalPrice,
    sku: p.sku || p.id,
    category,
    thc,
    cbd,
    image,
    weight,
    brand,
    inStock: true,
    strain,
    special: Boolean(p.special || specialLabel || originalPrice),
    specialLabel,
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

async function sha256Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchDutchiePublicGraphQL<T>(url: string, operationName: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const hash = await sha256Hash(query);
  const extensions = JSON.stringify({
    persistedQuery: { version: 1, sha256Hash: hash },
  });

  // Try the persisted-query GET first. Dutchie's own frontend uses this shape.
  const getUrl = `${url}?operationName=${encodeURIComponent(operationName)}&variables=${encodeURIComponent(JSON.stringify(variables))}&extensions=${encodeURIComponent(extensions)}`;
  const commonHeaders = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://dutchie.com/embedded-menu',
    'Origin': 'https://dutchie.com',
  };
  const getResp = await fetch(getUrl, {
    method: 'GET',
    headers: commonHeaders,
    signal: AbortSignal.timeout(30000),
  });

  // If the server does not recognize the persisted query, fall back to a POST
  // with the full query text. This is standard Apollo APQ behavior and is
  // more resilient if Dutchie changes their registered query list.
  const getData = getResp.ok ? ((await getResp.json().catch(() => ({}))) as { data?: T; errors?: Array<{ message: string }> }) : undefined;
  const needsRetry = !getResp.ok || (getData?.errors?.some((e) => e?.message?.includes('PersistedQueryNotFound')) ?? false);

  if (!needsRetry) {
    if (!getResp.ok) {
      const text = await getResp.text().catch(() => '');
      throw new Error(`Dutchie public GraphQL returned ${getResp.status}${text ? ': ' + text.slice(0, 200) : ''}`);
    }
    if (getData?.errors && getData.errors.length > 0) {
      throw new Error(getData.errors[0].message);
    }
    return getData!.data as T;
  }

  const postResp = await fetch(url, {
    method: 'POST',
    headers: {
      ...commonHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operationName, query, variables, extensions: JSON.parse(extensions) }),
    signal: AbortSignal.timeout(30000),
  });
  if (!postResp.ok) {
    const text = await postResp.text().catch(() => '');
    throw new Error(`Dutchie public GraphQL returned ${postResp.status}${text ? ': ' + text.slice(0, 200) : ''}`);
  }
  const postData = (await postResp.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (postData.errors && postData.errors.length > 0) {
    throw new Error(postData.errors[0].message);
  }
  return postData.data as T;
}

export async function importDutchiePublicMenu(slug: string): Promise<{ categories: ScrapedCategory[]; dispensaryName: string; productCount: number; logo?: string }> {
  // 1. Resolve dispensary by slug using the public ConsumerDispensaries query.
  const dispensaryData = await fetchDutchiePublicGraphQL<{ filteredDispensaries: DutchiePublicDispensary[] }>(
    DUTCHIE_GRAPHQL_URL,
    'ConsumerDispensaries',
    'query ConsumerDispensaries($dispensaryFilter: DispensaryFilter!) { filteredDispensaries(dispensaryFilter: $dispensaryFilter) { id name cName description address phone listImage bannerImage logoImage embeddedLogoImage embedBackUrl embeddedMenuUrl menuSections { category label linkLabel products { id name brand category type strainType thc { value unit } cbd { value unit } description image images { url active } recPrices Prices medicalPrices Options POSMetaData { canonicalCategory canonicalBrandName canonicalImgUrl children { recPrice price option } } } } } }',
    { dispensaryFilter: { cNameOrID: slug } }
  );
  const dispensary = dispensaryData?.filteredDispensaries?.[0];
  if (!dispensary) {
    throw new Error(`Could not find Dutchie dispensary for slug "${slug}" via public API.`);
  }
  const dispensaryId = dispensary.id;
  const dispensaryName = dispensary.name || slug.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const logo =
    cleanImageUrl(dispensary.logoImage) ||
    cleanImageUrl(dispensary.embeddedLogoImage) ||
    cleanImageUrl(dispensary.listImage) ||
    cleanImageUrl(dispensary.SpecialLogoImage) ||
    cleanImageUrl(dispensary.bannerImage);

  // 2. Fetch products using the public FilteredProducts query.
  let products: DutchiePublicProduct[] = [];
  try {
    const productsData = await fetchDutchiePublicGraphQL<{ filteredProducts: { products: DutchiePublicProduct[] } }>(
      DUTCHIE_API2_GRAPHQL_URL,
      'FilteredProducts',
      'query FilteredProducts($productsFilter: ProductsFilter!) { filteredProducts(productsFilter: $productsFilter) { products { id name brand category type strainType thc { value unit } cbd { value unit } description image images { url active } recPrices Prices medicalPrices Options POSMetaData { canonicalCategory canonicalBrandName canonicalImgUrl children { recPrice price option } } } } }',
      { productsFilter: { dispensaryId, pricingType: 'rec', status: 'Active' } }
    );
    products = productsData?.filteredProducts?.products || [];
  } catch (err) {
    // If the public product query fails, fall back to menu sections products if present.
    const sectionProducts = dispensary.menuSections?.flatMap((s) => s.products || []) || [];
    if (sectionProducts.length) {
      products = sectionProducts;
    } else {
      throw err;
    }
  }

  if (!products.length) {
    throw new Error(`Dutchie public API returned no products for "${slug}".`);
  }

  const scrapedProducts: ScrapedProduct[] = [];
  const seen = new Set<string>();
  for (const p of products) {
    const product = toProduct(p);
    if (!product) continue;
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    scrapedProducts.push(product);
  }

  const categories = toCategories(scrapedProducts);
  const pricedCount = categories.reduce((total, category) => total + category.products.filter((product) => product.price > 0).length, 0);
  if (pricedCount === 0) {
    throw new Error('Dutchie public import did not return priced products.');
  }

  return { categories, dispensaryName, productCount: scrapedProducts.length, logo };
}
