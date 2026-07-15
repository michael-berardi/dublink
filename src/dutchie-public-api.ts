import type { ScrapedCategory, ScrapedProduct } from './dutchie-scraper';
import { extractProductDescription } from './product-description';

const DUTCHIE_GRAPHQL_URL = 'https://dutchie.com/graphql';
const DUTCHIE_PRODUCTS_GRAPHQL_URL = 'https://dutchie.com/api-4/graphql';
const DUTCHIE_PRODUCTS_PER_PAGE = 100;
const DUTCHIE_MAX_PRODUCT_PAGES = 20;

export interface DutchiePublicBrandStyle {
  primaryColor?: string;
  secondaryColor?: string;
}

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
    products?: string[];
  }>;
  webCustomizationSettingsV2?: {
    colors?: {
      buttonsLinks?: string;
      navBar?: string;
      staffPickTag?: string;
      discountTag?: string;
    };
    fonts?: {
      body?: string;
      heading?: string;
    };
  };
}

type DutchiePotency = { value?: number; unit?: string; range?: number[] } | number | string;

interface DutchiePublicProduct {
  id?: string;
  name?: string;
  Name?: string;
  brand?: string | { name?: string; imageUrl?: string };
  brandName?: string;
  category?: string;
  type?: string;
  subcategory?: string;
  strainType?: string;
  thc?: DutchiePotency;
  cbd?: DutchiePotency;
  THC?: DutchiePotency;
  CBD?: DutchiePotency;
  THCContent?: DutchiePotency;
  CBDContent?: DutchiePotency;
  description?: string;
  image?: string;
  Image?: string;
  images?: Array<{ url?: string; active?: boolean }>;
  recPrices?: number[];
  recSpecialPrices?: number[];
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
  special?: boolean | string;
  specials?: Array<{ name?: string; title?: string; label?: string; description?: string }>;
  discount?: string | number | { label?: string; description?: string; name?: string };
  deal?: string | { label?: string; description?: string; name?: string };
  collectionCardBadge?: { title?: string };
  featured?: { current?: boolean };
  Status?: string;
  Options?: string[];
  options?: string[];
  POSMetaData?: {
    canonicalCategory?: string;
    canonicalBrandName?: string;
    canonicalImgUrl?: string;
    children?: Array<{ recPrice?: number; price?: number; option?: string; quantityAvailable?: number }>;
  };
  posMetadata?: {
    canonicalCategory?: string;
    canonicalBrandName?: string;
    canonicalImgUrl?: string;
    children?: Array<{ recPrice?: number; price?: number; option?: string; quantityAvailable?: number }>;
  };
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
  const range = Array.isArray(content.range) ? content.range : [];
  const value = typeof content.value === 'number'
    ? content.value
    : range.find((item): item is number => typeof item === 'number');
  if (typeof value !== 'number') return undefined;
  const unit = String(content.unit || '').toUpperCase();
  return unit.includes('MILLIGRAM') ? `${value}mg` : `${value}%`;
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

function normalizeHexColor(value: string | undefined): string | undefined {
  const color = value?.trim().toLowerCase();
  if (!color || !/^#[0-9a-f]{6}$/.test(color)) return undefined;
  return color;
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
  if (lower.includes('flower') || lower.includes('clone') || lower.includes('seed')) return 'Flower';
  if (lower.includes('pre-roll') || lower.includes('preroll') || lower.includes('joint')) return 'Pre-Rolls';
  if (lower.includes('vape') || lower.includes('vaporizer') || lower.includes('inhaler')) return 'Vapes';
  if (lower.includes('concentrate') || lower.includes('extract')) return 'Concentrates';
  if (
    lower.includes('edible') ||
    lower.includes('beverage') ||
    lower.includes('drink') ||
    lower.includes('capsule') ||
    lower.includes('tablet') ||
    lower.includes('pill') ||
    lower.includes('oral')
  ) return 'Edibles';
  if (lower.includes('tincture') || lower.includes('sublingual')) return 'Tinctures';
  if (
    lower.includes('topical') ||
    lower.includes('transdermal') ||
    lower.includes('suppository') ||
    lower.includes('patch')
  ) return 'Topicals';
  if (lower === 'cbd' || lower.includes('cbd')) return 'CBD';
  if (
    lower.includes('accessor') ||
    lower.includes('apparel') ||
    lower.includes('merch') ||
    lower.includes('gear')
  ) return 'Accessories';
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


type ImportedPriceTier = { label: string; price: string };

function formatTierPrice(value: number): string {
  return `$${value.toFixed(2).replace(/\.00$/, '')}`;
}

function tierLabel(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const raw = String(value).trim();
  if (!raw || /^(?:n\/?a|none|default|unit)$/i.test(raw)) return undefined;
  return cleanWeight(raw) || raw;
}

function productPriceTiers(product: DutchiePublicProduct): ImportedPriceTier[] | undefined {
  const tierByLabel = new Map<string, { label: string; price: number }>();
  const addTier = (labelValue: unknown, priceValue: unknown) => {
    const price = firstNumber(priceValue);
    const label = tierLabel(labelValue);
    if (!label || !price) return;
    const key = label.toLowerCase();
    const existing = tierByLabel.get(key);
    if (!existing || price < existing.price) {
      tierByLabel.set(key, { label, price });
    }
  };

  const labels = product.options || product.Options || product.weights?.map((weight) => `${weight.value}${weight.unit || 'g'}`) || [];
  const basePrices = product.recPrices || product.prices || product.Prices || product.medicalPrices || [];
  const specialPrices = product.recSpecialPrices || [];
  basePrices.forEach((price, index) => {
    const specialPrice = firstNumber(specialPrices[index]);
    addTier(labels[index], specialPrice && specialPrice < price ? specialPrice : price);
  });
  product.weights?.forEach((weight) => addTier(`${weight.value}${weight.unit || 'g'}`, weight.price));
  product.variants?.forEach((variant) => addTier(variant.option, variant.recPrice || variant.price));
  product.POSMetaData?.children?.forEach((child) => addTier(child.option, child.recPrice || child.price));
  product.posMetadata?.children?.forEach((child) => addTier(child.option, child.recPrice || child.price));

  if (tierByLabel.size <= 1) return undefined;
  return Array.from(tierByLabel.values(), ({ label, price }) => ({
    label,
    price: formatTierPrice(price),
  }));
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
  const currentSpecial = typeof product.special === 'string' ? product.special : '';
  return `${specialText} ${discountText} ${dealText} ${currentSpecial} ${product.collectionCardBadge?.title || ''} ${product.description || ''}`.trim();
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
  const rawName = String(p.name || p.Name || 'Product');
  const category = guessCategory(
    rawName,
    normalizeCategory(p.category) ||
      normalizeCategory(p.POSMetaData?.canonicalCategory) ||
      normalizeCategory(p.posMetadata?.canonicalCategory) ||
      p.type
  );
  const brand = (
    typeof p.brand === 'string'
      ? p.brand
      : p.brand?.name
  ) || p.brandName || p.POSMetaData?.canonicalBrandName || p.posMetadata?.canonicalBrandName;
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
  const dealPrice =
    firstNumber(p.recSpecialPrices) ||
    firstNumber([p.salePrice, p.specialPrice, p.discountPrice, p.discountedPrice]);
  const explicitOriginalPrice = firstNumber([p.originalPrice, p.retailPrice, p.listPrice]);
  const price = dealPrice && dealPrice < basePrice ? dealPrice : basePrice;
  const originalPrice = explicitOriginalPrice && explicitOriginalPrice > price
    ? explicitOriginalPrice
    : dealPrice && dealPrice < basePrice
      ? basePrice
      : undefined;
  const specialLabel = dealLabel(p, originalPrice);
  const image = cleanImageUrl(
    p.image ||
      p.Image ||
      p.images?.find((img) => img?.active !== false)?.url ||
      p.POSMetaData?.canonicalImgUrl ||
      p.posMetadata?.canonicalImgUrl
  );
  const strain = parseStrain(String(p.strainType || rawName));
  const thc =
    potencyValue(p.thc) ||
    potencyValue(p.THC) ||
    potencyValue(p.THCContent) ||
    extractCannabinoid(p, 'THC');
  const cbd =
    potencyValue(p.cbd) ||
    potencyValue(p.CBD) ||
    potencyValue(p.CBDContent) ||
    extractCannabinoid(p, 'CBD');
  const rawWeight =
    Array.isArray(p.options) ? p.options[0] :
    Array.isArray(p.Options) ? p.Options[0] :
    p.weights?.[0]?.value ? `${p.weights[0].value}${p.weights[0].unit || 'g'}` :
    p.POSMetaData?.children?.[0]?.option ||
    p.posMetadata?.children?.[0]?.option ||
    p.variants?.[0]?.option;
  const weight = cleanWeight(parseWeight(rawName) || rawWeight);
  return {
    id: String(p.id || p.name || p.Name || crypto.randomUUID()).replace(/[^a-zA-Z0-9_-]/g, '-'),
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
    description: extractProductDescription(p),
    inStock: !p.Status || p.Status.toLowerCase() === 'active',
    strain,
    special: Boolean(p.special || specialLabel || originalPrice || p.featured?.current),
    specialLabel,
    priceTiers: productPriceTiers(p),
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
      products,
    }));
}

const DUTCHIE_PRODUCT_FIELDS = `
  id
  Name
  description
  brandName
  brand { name imageUrl }
  type
  subcategory
  strainType
  THCContent { unit range }
  CBDContent { unit range }
  Image
  images { url active }
  Options
  Prices
  recPrices
  medicalPrices
  recSpecialPrices
  special
  POSMetaData {
    canonicalCategory
    canonicalBrandName
    canonicalImgUrl
    children { option recPrice price quantityAvailable }
  }
  Status
  featured { current }
  collectionCardBadge { title }
`;

const CONSUMER_DISPENSARIES_QUERY = `
  query ConsumerDispensaries($dispensaryFilter: dispensariesFilterInput!) {
    filteredDispensaries(filter: $dispensaryFilter) {
      id
      name
      cName
      description
      address
      phone
      listImage
      bannerImage
      logoImage
      embeddedLogoImage
      embedBackUrl
      embeddedMenuUrl
      SpecialLogoImage
      menuSections { category label linkLabel products }
      webCustomizationSettingsV2 {
        colors { buttonsLinks navBar staffPickTag discountTag }
        fonts { body heading }
      }
    }
  }
`;

const FILTERED_PRODUCTS_QUERY = `
  query FilteredProducts(
    $productsFilter: productsFilterInput!
    $page: Int
    $perPage: Int
    $includeEnterpriseSpecials: Boolean = false
  ) {
    filteredProducts(
      filter: $productsFilter
      page: $page
      perPage: $perPage
      includeEnterpriseSpecials: $includeEnterpriseSpecials
    ) {
      products { ${DUTCHIE_PRODUCT_FIELDS} }
      queryInfo { totalCount totalPages }
    }
  }
`;

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function readBoolean(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
}

function readStringArray(record: Record<string, unknown>, key: string): string[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === 'string');
}

function readNumberArray(record: Record<string, unknown>, key: string): number[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item));
}

function readRecord(record: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const value = record[key];
  return isRecord(value) ? value : undefined;
}

function readRecordArray(record: Record<string, unknown>, key: string): Array<Record<string, unknown>> | undefined {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;
  return value.filter(isRecord);
}

function parsePotency(record: Record<string, unknown>, key: string): DutchiePublicProduct['THCContent'] {
  const value = record[key];
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (!isRecord(value)) return undefined;
  const numericValue = typeof value.value === 'number' ? value.value : undefined;
  return {
    value: numericValue,
    unit: readString(value, 'unit'),
    range: readNumberArray(value, 'range'),
  };
}

function parsePosMetadata(record: Record<string, unknown>, key: string): DutchiePublicProduct['POSMetaData'] {
  const metadata = readRecord(record, key);
  if (!metadata) return undefined;
  const children = readRecordArray(metadata, 'children')?.map((child) => ({
    recPrice: typeof child.recPrice === 'number' ? child.recPrice : undefined,
    price: typeof child.price === 'number' ? child.price : undefined,
    option: readString(child, 'option'),
    quantityAvailable: typeof child.quantityAvailable === 'number' ? child.quantityAvailable : undefined,
  }));
  return {
    canonicalCategory: readString(metadata, 'canonicalCategory'),
    canonicalBrandName: readString(metadata, 'canonicalBrandName'),
    canonicalImgUrl: readString(metadata, 'canonicalImgUrl'),
    children,
  };
}

function parsePublicProduct(value: unknown): DutchiePublicProduct | undefined {
  if (!isRecord(value)) return undefined;
  const brandValue = value.brand;
  const brand = typeof brandValue === 'string'
    ? brandValue
    : isRecord(brandValue)
      ? { name: readString(brandValue, 'name'), imageUrl: readString(brandValue, 'imageUrl') }
      : undefined;
  const images = readRecordArray(value, 'images')?.map((image) => ({
    url: readString(image, 'url'),
    active: readBoolean(image, 'active'),
  }));
  const badge = readRecord(value, 'collectionCardBadge');
  const featured = readRecord(value, 'featured');
  const specialValue = value.special;
  const special = typeof specialValue === 'boolean' || typeof specialValue === 'string'
    ? specialValue
    : undefined;
  return {
    id: readString(value, 'id'),
    name: readString(value, 'name'),
    Name: readString(value, 'Name'),
    brand,
    brandName: readString(value, 'brandName'),
    category: readString(value, 'category'),
    type: readString(value, 'type'),
    subcategory: readString(value, 'subcategory'),
    strainType: readString(value, 'strainType'),
    thc: parsePotency(value, 'thc'),
    cbd: parsePotency(value, 'cbd'),
    THC: parsePotency(value, 'THC'),
    CBD: parsePotency(value, 'CBD'),
    THCContent: parsePotency(value, 'THCContent'),
    CBDContent: parsePotency(value, 'CBDContent'),
    description: readString(value, 'description'),
    image: readString(value, 'image'),
    Image: readString(value, 'Image'),
    images,
    recPrices: readNumberArray(value, 'recPrices'),
    recSpecialPrices: readNumberArray(value, 'recSpecialPrices'),
    Prices: readNumberArray(value, 'Prices'),
    prices: readNumberArray(value, 'prices'),
    medicalPrices: readNumberArray(value, 'medicalPrices'),
    special,
    collectionCardBadge: badge ? { title: readString(badge, 'title') } : undefined,
    featured: featured ? { current: readBoolean(featured, 'current') } : undefined,
    Status: readString(value, 'Status'),
    Options: readStringArray(value, 'Options'),
    options: readStringArray(value, 'options'),
    POSMetaData: parsePosMetadata(value, 'POSMetaData'),
    posMetadata: parsePosMetadata(value, 'posMetadata'),
    sku: readString(value, 'sku'),
  };
}

function parseDispensaryData(value: unknown): { filteredDispensaries: DutchiePublicDispensary[] } {
  if (!isRecord(value) || !Array.isArray(value.filteredDispensaries)) {
    throw new Error('Dutchie ConsumerDispensaries returned an invalid response shape.');
  }
  const filteredDispensaries = value.filteredDispensaries
    .filter(isRecord)
    .map((dispensary) => {
      const settings = readRecord(dispensary, 'webCustomizationSettingsV2');
      const colors = settings ? readRecord(settings, 'colors') : undefined;
      const fonts = settings ? readRecord(settings, 'fonts') : undefined;
      return {
        id: readString(dispensary, 'id'),
        name: readString(dispensary, 'name'),
        cName: readString(dispensary, 'cName'),
        description: readString(dispensary, 'description'),
        address: readString(dispensary, 'address'),
        phone: readString(dispensary, 'phone'),
        listImage: readString(dispensary, 'listImage'),
        bannerImage: readString(dispensary, 'bannerImage'),
        logoImage: readString(dispensary, 'logoImage'),
        embeddedLogoImage: readString(dispensary, 'embeddedLogoImage'),
        embedBackUrl: readString(dispensary, 'embedBackUrl'),
        embeddedMenuUrl: readString(dispensary, 'embeddedMenuUrl'),
        SpecialLogoImage: readString(dispensary, 'SpecialLogoImage'),
        webCustomizationSettingsV2: settings ? {
          colors: colors ? {
            buttonsLinks: readString(colors, 'buttonsLinks'),
            navBar: readString(colors, 'navBar'),
            staffPickTag: readString(colors, 'staffPickTag'),
            discountTag: readString(colors, 'discountTag'),
          } : undefined,
          fonts: fonts ? {
            body: readString(fonts, 'body'),
            heading: readString(fonts, 'heading'),
          } : undefined,
        } : undefined,
      };
    });
  return { filteredDispensaries };
}

function parseFilteredProductsData(value: unknown): FilteredProductsData {
  if (!isRecord(value)) {
    throw new Error('Dutchie FilteredProducts returned an invalid response shape.');
  }
  const filtered = readRecord(value, 'filteredProducts');
  if (!filtered) {
    throw new Error('Dutchie FilteredProducts returned an invalid response shape.');
  }
  const rawProducts = Array.isArray(filtered.products) ? filtered.products : [];
  const products = rawProducts
    .map(parsePublicProduct)
    .filter((product): product is DutchiePublicProduct => product !== undefined);
  const queryInfo = readRecord(filtered, 'queryInfo');
  return {
    filteredProducts: {
      products,
      queryInfo: queryInfo ? {
        totalCount: typeof queryInfo.totalCount === 'number' ? queryInfo.totalCount : undefined,
        totalPages: typeof queryInfo.totalPages === 'number' ? queryInfo.totalPages : undefined,
      } : undefined,
    },
  };
}

type FilteredProductsData = {
  filteredProducts?: {
    products?: DutchiePublicProduct[];
    queryInfo?: {
      totalCount?: number;
      totalPages?: number;
    };
  };
};

async function fetchDutchiePublicGraphQL<T>(
  url: string,
  operationName: string,
  query: string,
  variables: Record<string, unknown>,
  parseData: (value: unknown) => T
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Apollo-Require-Preflight': 'true',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://dutchie.com/embedded-menu',
      'Origin': 'https://dutchie.com',
    },
    body: JSON.stringify({ operationName, query, variables }),
    signal: AbortSignal.timeout(20000),
  });
  const body = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error(`Dutchie ${operationName} returned ${response.status}: ${body.slice(0, 200) || 'invalid JSON'}`);
  }
  if (!isRecord(payload)) {
    throw new Error(`Dutchie ${operationName} returned ${response.status}: invalid JSON object`);
  }
  const errors = Array.isArray(payload.errors)
    ? payload.errors
        .filter(isRecord)
        .map((error) => readString(error, 'message'))
        .filter((message): message is string => Boolean(message))
    : [];
  if (!response.ok || errors.length) {
    const details = errors.join('; ') || body.slice(0, 200);
    throw new Error(`Dutchie ${operationName} returned ${response.status}${details ? `: ${details}` : ''}`);
  }
  if (!('data' in payload)) {
    throw new Error(`Dutchie ${operationName} returned no data.`);
  }
  return parseData(payload.data);
}

export async function importDutchiePublicMenu(slug: string): Promise<{
  categories: ScrapedCategory[];
  dispensaryName: string;
  productCount: number;
  logo?: string;
  brandStyle?: DutchiePublicBrandStyle;
}> {
  const dispensaryData = await fetchDutchiePublicGraphQL(
    DUTCHIE_GRAPHQL_URL,
    'ConsumerDispensaries',
    CONSUMER_DISPENSARIES_QUERY,
    { dispensaryFilter: { cNameOrID: slug } },
    parseDispensaryData
  );
  const dispensary = dispensaryData?.filteredDispensaries?.[0];
  if (!dispensary?.id) {
    throw new Error(`Could not find Dutchie dispensary for slug "${slug}" via public API.`);
  }

  const dispensaryName = dispensary.name || slug.split(/[-_]/).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const logo =
    cleanImageUrl(dispensary.logoImage) ||
    cleanImageUrl(dispensary.embeddedLogoImage) ||
    cleanImageUrl(dispensary.listImage) ||
    cleanImageUrl(dispensary.SpecialLogoImage) ||
    cleanImageUrl(dispensary.bannerImage);
  const primaryColor = normalizeHexColor(dispensary.webCustomizationSettingsV2?.colors?.buttonsLinks);
  const secondaryColor = normalizeHexColor(dispensary.webCustomizationSettingsV2?.colors?.navBar);
  const brandStyle = primaryColor || secondaryColor
    ? { primaryColor, secondaryColor }
    : undefined;

  const productsFilter = {
    dispensaryId: dispensary.id,
    pricingType: 'rec',
    strainTypes: [],
    subcategories: [],
    Status: 'Active',
    types: [],
    useCache: true,
    isDefaultSort: true,
    sortBy: 'popular',
    sortDirection: 1,
    bypassOnlineThresholds: false,
    isKioskMenu: false,
    removeProductsBelowOptionThresholds: true,
    platformType: 'ONLINE_MENU',
    preOrderType: null,
  };
  const firstPage = await fetchDutchiePublicGraphQL(
    DUTCHIE_PRODUCTS_GRAPHQL_URL,
    'FilteredProducts',
    FILTERED_PRODUCTS_QUERY,
    {
      productsFilter,
      page: 0,
      perPage: DUTCHIE_PRODUCTS_PER_PAGE,
      includeEnterpriseSpecials: false,
    },
    parseFilteredProductsData
  );
  const firstResult = firstPage.filteredProducts;
  const expectedProductCount = firstResult?.queryInfo?.totalCount;
  const reportedPages = firstResult?.queryInfo?.totalPages;
  const inferredPages = expectedProductCount
    ? Math.ceil(expectedProductCount / DUTCHIE_PRODUCTS_PER_PAGE)
    : 1;
  const requestedPages = reportedPages || inferredPages;
  if (requestedPages > DUTCHIE_MAX_PRODUCT_PAGES) {
    throw new Error(
      `Dutchie reported ${expectedProductCount || requestedPages * DUTCHIE_PRODUCTS_PER_PAGE} products across ${requestedPages} pages, exceeding the ${DUTCHIE_MAX_PRODUCT_PAGES * DUTCHIE_PRODUCTS_PER_PAGE}-product import limit.`
    );
  }
  const totalPages = Math.max(1, requestedPages);
  const products = [...(firstResult?.products || [])];
  for (let page = 1; page < totalPages; page += 4) {
    const pageNumbers = Array.from(
      { length: Math.min(4, totalPages - page) },
      (_, index) => page + index
    );
    const pageResults = await Promise.all(pageNumbers.map((pageNumber) =>
      fetchDutchiePublicGraphQL(
        DUTCHIE_PRODUCTS_GRAPHQL_URL,
        'FilteredProducts',
        FILTERED_PRODUCTS_QUERY,
        {
          productsFilter,
          page: pageNumber,
          perPage: DUTCHIE_PRODUCTS_PER_PAGE,
          includeEnterpriseSpecials: false,
        },
        parseFilteredProductsData
      )
    ));
    for (const pageResult of pageResults) {
      products.push(...(pageResult.filteredProducts?.products || []));
    }
  }

  const sourceProductKeys = new Set(
    products.map((product) => String(product.id || product.name || product.Name || '').trim()).filter(Boolean)
  );
  if (expectedProductCount && sourceProductKeys.size < expectedProductCount) {
    throw new Error(
      `Dutchie catalog changed during import: received ${sourceProductKeys.size} of ${expectedProductCount} products. Retry to load the complete menu.`
    );
  }

  if (!products.length) {
    throw new Error(`Dutchie public API returned no products for "${slug}".`);
  }

  const scrapedProducts: ScrapedProduct[] = [];
  const seen = new Set<string>();
  for (const sourceProduct of products) {
    const product = toProduct(sourceProduct);
    if (!product || seen.has(product.id)) continue;
    seen.add(product.id);
    scrapedProducts.push(product);
  }

  if (scrapedProducts.length < sourceProductKeys.size) {
    throw new Error(
      `Dutchie returned ${sourceProductKeys.size} products, but only ${scrapedProducts.length} had complete display data. Retry or correct missing product prices in Dutchie.`
    );
  }

  const categories = toCategories(scrapedProducts);
  const pricedCount = categories.reduce(
    (total, category) => total + category.products.filter((product) => product.price > 0).length,
    0
  );
  if (pricedCount === 0) {
    throw new Error('Dutchie public import did not return priced products.');
  }

  return {
    categories,
    dispensaryName,
    productCount: scrapedProducts.length,
    logo,
    brandStyle,
  };
}
