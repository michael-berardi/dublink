// Dutchie menu scraper - uses Railway Browserless service to render JS-heavy Dutchie pages.
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
  weight?: string;
  brand?: string;
  inStock: boolean;
  strain?: 'indica' | 'sativa' | 'hybrid';
}

export interface ScrapedCategory {
  id: string;
  name: string;
  order: number;
  products: ScrapedProduct[];
}

function parsePrice(text: string): number {
  const m = text.match(/\$[\d,]+\.?\d*/);
  return m ? parseFloat(m[0].replace(/[$,]/g, '')) : 0;
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

function firstNumber(values: unknown): number {
  if (Array.isArray(values)) {
    const v = values.find((item) => typeof item === 'number' && item > 0);
    return typeof v === 'number' ? v : 0;
  }
  return typeof values === 'number' && values > 0 ? values : 0;
}

function potencyValue(content: any): string | undefined {
  if (!content) return undefined;
  if (typeof content === 'string') return content;
  const value = Array.isArray(content.range) ? content.range[0] : content.value;
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

function guessCategory(href: string, text: string, parsedCategory?: string): string {
  if (parsedCategory) return parsedCategory;
  const value = `${href} ${text}`.toLowerCase();
  if (value.includes('pre-roll') || value.includes('preroll')) return 'Pre-Rolls';
  if (value.includes('flower')) return 'Flower';
  if (value.includes('vape') || value.includes('vaporizer') || value.includes('aio') || value.includes('cartridge') || value.includes('disposable')) return 'Vapes';
  if (value.includes('concentrate') || value.includes('extract') || value.includes('resin') || value.includes('rosin') || value.includes('wax') || value.includes('shatter')) return 'Concentrates';
  if (value.includes('edible') || value.includes('gummy') || value.includes('chocolate') || value.includes('chew') || value.includes('cookie')) return 'Edibles';
  if (value.includes('tincture') || value.includes('sublingual')) return 'Tinctures';
  if (value.includes('topical') || value.includes('cream') || value.includes('balm')) return 'Topicals';
  if (value.includes('cbd')) return 'CBD';
  if (value.includes('accessor') || value.includes('battery') || value.includes('paper')) return 'Accessories';
  return 'Other';
}

export async function scrapeDutchie(dispensarySlug: string, token: string): Promise<{ categories: ScrapedCategory[]; dispensaryName: string; productCount: number }> {
  const dutchieUrl = `https://dutchie.com/embedded-menu/${dispensarySlug}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const structured = await scrapeDutchieStructured(dutchieUrl, token);
    if (structured.categories.length) {
      return structured;
    }
    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  const scrapeUrl = `${BROWSERLESS_URL}?url=${encodeURIComponent(dutchieUrl)}`;

  const resp = await fetch(scrapeUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
    signal: AbortSignal.timeout(90000),
  });

  if (!resp.ok) {
    throw new Error(`Scrape failed: ${resp.status}`);
  }

  const data = await resp.json() as { products: Array<{ href: string; text: string; img: string }>; count: number };

  if (!data.products || !data.products.length) {
    throw new Error('No products found. Check the dispensary slug.');
  }

  // Deduplicate by slug
  const seen = new Set<string>();
  const categoryMap = new Map<string, ScrapedProduct[]>();

  for (const p of data.products) {
    const slug = p.href?.split('/product/')[1]?.split('/')[0] || '';
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const text = p.text || '';
    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const rawName = lines[0] || slug;
    const { name, brand, category: parsedCategory } = parseName(rawName);
    const strain = parseStrain(text);
    const thc = parseTHC(text);
    const price = parsePrice(text);
    const weight = cleanWeight(parseWeight(text));
    const category = guessCategory(p.href || '', text, parsedCategory);

    const product: ScrapedProduct = {
      id: slug,
      name: name.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim(),
      price,
      sku: slug,
      category,
      thc,
      image: cleanImageUrl(p.img),
      weight,
      brand: brand || lines.find(l => l && l !== name && l !== strain && !l.includes('THC') && !l.includes('$') && !l.match(/^\d/)),
      inStock: true,
      strain,
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
    signal: AbortSignal.timeout(120000),
  });
  if (!resp.ok) return { categories: [], dispensaryName: 'Dutchie Menu', productCount: 0 };

  const data = await resp.json() as { responses?: Array<{ json?: any }> };
  const seen = new Set<string>();
  const categoryMap = new Map<string, ScrapedProduct[]>();

  for (const response of data.responses || []) {
    const products = response.json?.data?.filteredProducts?.products || [];
    for (const p of products) {
      const id = String(p.id || p._id || p.Name || crypto.randomUUID());
      if (seen.has(id)) continue;
      seen.add(id);

      const rawName = String(p.Name || p.name || 'Product');
      const parts = rawName.split('|').map((part) => part.trim()).filter(Boolean);
      const category = normalizeCategory(p.type) || normalizeCategory(p.POSMetaData?.canonicalCategory) || normalizeCategory(parts[1]) || 'Other';
      const brand = p.brandName || p.brand?.name || p.POSMetaData?.canonicalBrandName || parts[0];
      const name = parts.length >= 4 ? parts.slice(3).join(' | ') : rawName;
      const price = firstNumber(p.recPrices) || firstNumber(p.Prices) || firstNumber(p.medicalPrices) || firstNumber(p.POSMetaData?.children?.[0]?.recPrice) || firstNumber(p.POSMetaData?.children?.[0]?.price);
      if (!price) continue;

      const image = cleanImageUrl(p.Image || p.images?.find((img: any) => img?.active !== false)?.url || p.POSMetaData?.canonicalImgUrl);
      const strain = parseStrain(String(p.strainType || parts[2] || rawName));
      const thc = potencyValue(p.THCContent) || parseTHC(rawName);
      const cbd = potencyValue(p.CBDContent);
      const rawWeight = Array.isArray(p.Options) ? p.Options[0] : p.POSMetaData?.children?.[0]?.option;
      const weight = cleanWeight(rawWeight);

      const product: ScrapedProduct = {
        id: id.replace(/[^a-zA-Z0-9_-]/g, '-'),
        name: name.replace(/\s+/g, ' ').trim(),
        price,
        sku: p.sku || id,
        category,
        thc,
        cbd,
        image,
        weight,
        brand,
        inStock: true,
        strain,
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
      products: products.slice(0, 40),
    }));

  const path = new URL(dutchieUrl).pathname;
  const slug = path.split('/embedded-menu/')[1]?.split('/')[0] || 'dutchie-menu';
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
export async function scrapeDutchieDemo(slug: string): Promise<{ categories: ScrapedCategory[]; dispensaryName: string; productCount: number; demo: true }> {
  const dispensaryName = slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const categoryDefs: { name: string; names: string[]; weights: string[]; thc: string[]; prices: number[]; strains: ('indica' | 'sativa' | 'hybrid')[] }[] = [
    {
      name: 'Flower',
      names: ['Blue Dream', 'OG Kush', 'Gelato', 'Wedding Cake', 'Sour Diesel', 'Northern Lights'],
      weights: ['3.5g', '7g', '14g', '1g', '3.5g', '7g'],
      thc: ['22%', '24%', '20%', '19%', '25%', '21%'],
      prices: [35, 40, 75, 12, 38, 72],
      strains: ['hybrid', 'indica', 'hybrid', 'indica', 'sativa', 'indica'],
    },
    {
      name: 'Pre-Rolls',
      names: ['Classic Joint', 'Infused Pre-Roll', 'Sativa Blend', 'Indica Blend', 'Hybrid Roll', 'Mini Joints'],
      weights: ['1g', '1.5g', '1g', '1g', '1g', '0.5g'],
      thc: ['18%', '28%', '20%', '22%', '19%', '17%'],
      prices: [8, 15, 9, 10, 9, 14],
      strains: ['hybrid', 'hybrid', 'sativa', 'indica', 'hybrid', 'hybrid'],
    },
    {
      name: 'Vapes',
      names: ['Blueberry Cart', 'Tangie Disposable', 'Live Resin Pod', 'CBD Cartridge', 'Pineapple Express', 'Nighttime Indica'],
      weights: ['1g', '0.5g', '1g', '1g', '1g', '0.5g'],
      thc: ['82%', '78%', '85%', '0%', '80%', '75%'],
      prices: [45, 35, 55, 40, 48, 32],
      strains: ['hybrid', 'sativa', 'hybrid', undefined, 'sativa', 'indica'],
    },
    {
      name: 'Concentrates',
      names: ['Live Resin', 'Shatter', 'Badder', 'Crumble', 'Rosin', 'Sugar'],
      weights: ['1g', '1g', '1g', '1g', '1g', '1g'],
      thc: ['78%', '80%', '82%', '75%', '85%', '79%'],
      prices: [50, 40, 55, 38, 70, 48],
      strains: ['hybrid', 'hybrid', 'indica', 'sativa', 'hybrid', 'hybrid'],
    },
    {
      name: 'Edibles',
      names: ['Gummies 100mg', 'Chocolate Bar', 'Mints', 'Cookies', 'Brownie', 'Soda'],
      weights: ['100mg', '100mg', '100mg', '50mg', '100mg', '10mg'],
      thc: ['10mg', '10mg', '10mg', '10mg', '10mg', '10mg'],
      prices: [18, 22, 15, 12, 14, 8],
      strains: [undefined, undefined, undefined, undefined, undefined, undefined],
    },
    {
      name: 'Tinctures',
      names: ['THC Tincture', 'CBD Tincture', '1:1 Ratio', 'Sleep Formula', 'Daytime Drops', 'Relief Tincture'],
      weights: ['30ml', '30ml', '30ml', '30ml', '30ml', '30ml'],
      thc: ['300mg', '0mg', '150mg', '100mg', '200mg', '250mg'],
      prices: [45, 40, 55, 50, 48, 52],
      strains: [undefined, undefined, undefined, 'indica', 'sativa', 'hybrid'],
    },
    {
      name: 'Topicals',
      names: ['CBD Balm', 'THC Lotion', 'Transdermal Patch', 'Relief Cream', 'Muscle Rub', 'Face Serum'],
      weights: ['2oz', '4oz', '1pk', '3oz', '2oz', '1oz'],
      thc: ['200mg', '100mg', '50mg', '150mg', '250mg', '75mg'],
      prices: [35, 30, 12, 28, 32, 45],
      strains: [undefined, undefined, undefined, undefined, undefined, undefined],
    },
  ];

  const products: ScrapedProduct[] = [];
  const categoryMap = new Map<string, ScrapedProduct[]>();

  for (const def of categoryDefs) {
    const categoryProducts: ScrapedProduct[] = [];
    for (let i = 0; i < def.names.length; i++) {
      const name = def.names[i];
      const weight = def.weights[i];
      const thc = def.thc[i];
      const price = def.prices[i];
      const strain = def.strains[i];
      const id = `${slug}-${def.name.toLowerCase()}-${i + 1}`;
      const product: ScrapedProduct = {
        id: id.replace(/[^a-zA-Z0-9_-]/g, '-'),
        name: `${name} ${weight}`,
        price,
        category: def.name,
        thc,
        cbd: undefined,
        image: undefined,
        weight,
        brand: 'Sample Brand',
        inStock: true,
        strain,
      };
      products.push(product);
      categoryProducts.push(product);
    }
    categoryMap.set(def.name, categoryProducts);
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
      products: products.slice(0, 40),
    }));

  return { categories, dispensaryName, productCount: products.length, demo: true };
}
