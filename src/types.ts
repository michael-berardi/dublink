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

export interface CustomDomain {
  domain: string;
  sessionId: string;
  verified: boolean;
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
  layout: 'auto' | 'grid' | 'list' | 'cards' | 'compact' | 'poster' | 'cinematic' | 'showcase' | 'editorial' | 'sparse';
  layoutMode: 'auto' | 'columns' | 'pricelist' | 'compact' | 'grid';
  fontSize: 'small' | 'medium' | 'large';
  theme: 'dark' | 'light';
  autoScroll: boolean;
  autoScrollSpeed: number;
  showCategory: string | null;
  promoBanner: PromoBanner;
  scheduledBanners?: ScheduledBanner[];
  ageVerified: boolean;
  disclaimer: string;
  complianceState?: string; // 2-letter US state code, e.g. 'CA','NY'. Used to look up a template when `disclaimer` is empty.
  analyticsEnabled: boolean;
  template: 'default' | 'minimal' | 'neon' | 'light' | 'sunset' | 'forest' | 'royal' | 'gold' | 'ocean' | 'crimson' | 'bone' | 'vapor';
  displayCount: number;
  updatedAt?: string;
}

export const DEFAULT_CONFIG: MenuConfig = {
  dispensaryName: 'DubMenu',
  logo: '',
  primaryColor: '#10b981',
  secondaryColor: '#065f46',
  showStrain: true,
  showLogo: true,
  showDescription: false,
  showImages: true,
  showBrand: true,
  showPromos: true,
  currency: '$',
  customFont: 'system',
  layout: 'auto',
  layoutMode: 'auto',
  fontSize: 'medium',
  theme: 'dark',
  autoScroll: false,
  autoScrollSpeed: 50,
  showCategory: null,
  promoBanner: {
    text: '',
    active: false,
    bgColor: '#10b981',
    textColor: '#000000'
  },
  scheduledBanners: [],
  ageVerified: false,
  disclaimer: 'Must be 21+ with valid ID. Product availability and pricing are subject to change.',
  analyticsEnabled: true,
  template: 'default',
  displayCount: 1,
  updatedAt: new Date().toISOString(),
  categories: []
};
