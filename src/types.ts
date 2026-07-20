export interface PriceTier {
  label: string; // e.g., "1g", "8th", "oz"
  price: string; // e.g., "$12", "$40"
}

export interface Product {
  id: string;
  name: string;
  price: number;
  sku?: string; // Product SKU / test label
  originalPrice?: number; // For deals/promos
  thc?: string;
  cbd?: string;
  description?: string;
  image?: string; // Product image URL
  weight?: string; // e.g., "1g", "3.5g", "1oz"
  brand?: string; // Brand name
  inStock: boolean;
  strain?: 'indica' | 'sativa' | 'hybrid';
  isPromo?: boolean; // Flag for promotional items
  specialLabel?: string;
  isNew?: boolean;
  lowStock?: boolean;
  priceTiers?: PriceTier[]; // Tiered pricing, e.g. [{label:"1g",price:"$12"},{label:"8th",price:"$40"}]. Renderer prefers priceTiers when non-empty.
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
  order: number;
}

export interface PromoBanner {
  text: string;
  active: boolean;
  bgColor?: string;
  textColor?: string;
}

export interface ScheduledBanner {
  id: string;
  text: string;
  startHour: number;
  endHour: number;
  bgColor: string;
  textColor: string;
  active: boolean;
}


export interface MenuSpecial {
  id: string;
  title: string;
  description: string;
  brand?: string;
  image?: string;
  price?: number;
  originalPrice?: number;
  priceTiers?: PriceTier[];
  specialLabel?: string;
  active: boolean;
}

export interface CustomDomain {
  domain: string;
  sessionId: string;
  verified: boolean;
}

export interface ReferenceStyleProfile {
  sourceUrl?: string;
  notes?: string;
  intent: 'dense-menu-board' | 'image-led' | 'promo-board' | 'single-hero' | 'editorial-board';
  layout: MenuConfig['layout'];
  template: MenuConfig['template'];
  fontSize: MenuConfig['fontSize'];
  showImages: boolean;
  showDescription: boolean;
  showPromos: boolean;
  showBrand: boolean;
  showStrain: boolean;
  confidence: number;
  keywords: string[];
  summary: string;
  appliedAt: string;
}

export const TV_FONT_SCALE_MIN = 100;
export const TV_FONT_SCALE_MAX = 250;
export const TV_FONT_SCALE_DEFAULT = 140;
export const TV_PAGE_DURATION_OPTIONS = [5, 8, 10, 15, 20] as const;
export type TvPageDurationSeconds = (typeof TV_PAGE_DURATION_OPTIONS)[number];
export const TV_PAGE_DURATION_DEFAULT: TvPageDurationSeconds = 10;
export const TV_PAGE_TRANSITIONS = ['fade', 'none'] as const;
export type TvPageTransition = (typeof TV_PAGE_TRANSITIONS)[number];
export const TV_PAGE_TRANSITION_DEFAULT: TvPageTransition = 'fade';

function parseTvPageDurationNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return Number.NaN;
}

function closestTvPageDurationSeconds(requested: number): TvPageDurationSeconds {
  return TV_PAGE_DURATION_OPTIONS.reduce((closest, option) =>
    Math.abs(option - requested) < Math.abs(closest - requested) ? option : closest
  , TV_PAGE_DURATION_DEFAULT);
}

export function normalizeTvPageDurationSeconds(value: unknown, legacySpeed?: unknown): TvPageDurationSeconds {
  const explicit = parseTvPageDurationNumber(value);
  if (Number.isFinite(explicit)) return closestTvPageDurationSeconds(explicit);

  const legacy = parseTvPageDurationNumber(legacySpeed);
  const requested = Number.isFinite(legacy) ? 5 + legacy / 10 : TV_PAGE_DURATION_DEFAULT;
  return closestTvPageDurationSeconds(requested);
}

export function normalizeTvPageTransition(value: unknown): TvPageTransition {
  return value === 'none' ? 'none' : TV_PAGE_TRANSITION_DEFAULT;
}

export interface ScreenConfig {
  id: string;
  name: string;
  categoryIds: string[];
  layout?: MenuConfig['layout'];
}

export interface MenuConfig {
  dispensaryName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  showStrain: boolean;
  showLogo: boolean;
  showDescription: boolean;
  showImages: boolean;
  showBrand: boolean;
  showPromos: boolean;
  currency: string;
  customFont?: string; // e.g., "Inter", "Roboto", etc.
  categories: Category[];
  layout: 'auto' | 'grid' | 'list' | 'pricewall' | 'cards' | 'compact' | 'poster' | 'cinematic' | 'showcase' | 'editorial' | 'sparse';
  layoutMode: 'auto' | 'columns' | 'pricelist' | 'compact' | 'grid';
  fontSize: 'small' | 'medium' | 'large';
  fontScale?: number;
  theme: 'dark' | 'light';
  autoScroll: boolean;
  pageDurationSeconds: TvPageDurationSeconds;
  pageTransition: TvPageTransition;
  showCategory: string | null;
  promoBanner: PromoBanner;
  scheduledBanners?: ScheduledBanner[];
  specials?: MenuSpecial[];
  ageVerified: boolean;
  disclaimer: string;
  complianceState?: string; // 2-letter US state code, e.g. 'CA','NY'. Used to look up a template when `disclaimer` is empty.
  analyticsEnabled: boolean;
  template: 'default' | 'minimal' | 'neon' | 'light' | 'sunset' | 'forest' | 'royal' | 'gold' | 'ocean' | 'crimson' | 'bone' | 'vapor';
  displayCount: number;
  screens: ScreenConfig[];
  tvDemo?: boolean;
  updatedAt?: string;
  styleProfile?: ReferenceStyleProfile;
}

export const DEFAULT_CONFIG: MenuConfig = {
  dispensaryName: 'DubMenu',
  logo: '',
  primaryColor: '#10b981',
  secondaryColor: '#065f46',
  showStrain: true,
  showLogo: true,
  showDescription: true,
  showImages: true,
  showBrand: true,
  showPromos: true,
  currency: '$',
  customFont: 'system',
  layout: 'auto',
  layoutMode: 'auto',
  fontSize: 'medium',
  fontScale: TV_FONT_SCALE_DEFAULT,
  theme: 'dark',
  autoScroll: true,
  pageDurationSeconds: TV_PAGE_DURATION_DEFAULT,
  pageTransition: TV_PAGE_TRANSITION_DEFAULT,
  showCategory: null,
  promoBanner: {
    text: '',
    active: false,
    bgColor: '#10b981',
    textColor: '#000000'
  },
  scheduledBanners: [],
  specials: [],
  ageVerified: false,
  disclaimer: 'Must be 21+ with valid ID. Product availability and pricing are subject to change.',
  analyticsEnabled: true,
  template: 'default',
  displayCount: 1,
  screens: [
    { id: 'screen-1', name: 'Display 1', categoryIds: [] },
    { id: 'screen-2', name: 'Display 2', categoryIds: [] },
    { id: 'screen-3', name: 'Display 3', categoryIds: [] },
    { id: 'screen-4', name: 'Display 4', categoryIds: [] },
  ],
  updatedAt: new Date().toISOString(),
  categories: []
};
