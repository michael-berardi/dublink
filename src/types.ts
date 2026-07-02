export interface PriceTier {
  label: string; // e.g., "1g", "8th", "oz"
  price: string; // e.g., "$12", "$40"
}

export interface Product {
  id: string;
  name: string;
  price: number;
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
  layout: 'grid' | 'list' | 'cards' | 'compact';
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
  dispensaryName: 'Simply Green',
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
  layout: 'grid',
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
  categories: [
    {
      id: 'flower',
      name: 'Flower',
      order: 0,
      products: [
        { id: 'sg-flower-1', name: 'Insane Pound Cake', price: 200, thc: '30.97%', weight: '28g', brand: 'Rolling Green', strain: 'indica', inStock: true },
        { id: 'sg-flower-2', name: 'Tamarindo', price: 165.49, thc: '32.04%', weight: '28g', brand: 'Knack', strain: 'hybrid', inStock: true },
        { id: 'sg-flower-3', name: 'Gush Mintz', price: 140.71, thc: '17.51%', weight: '28g', brand: 'Friends with Flowers', strain: 'indica', inStock: true },
        { id: 'sg-flower-4', name: 'Zoap', price: 37.17, thc: '30.86%', cbd: '0.1%', weight: '3.5g', brand: 'Rolling Green', strain: 'hybrid', inStock: true },
      ]
    },
    {
      id: 'pre-rolls',
      name: 'Pre-Rolls',
      order: 1,
      products: [
        { id: 'sg-preroll-1', name: 'Strawberry Runtz x Super Lemon Haze 5 Pack', price: 66.37, thc: '43%', weight: '40mg', brand: "High 5's", strain: 'sativa', inStock: true },
        { id: 'sg-preroll-2', name: 'Rancid Fruit x 7pk', price: 47.79, thc: '27.96%', weight: '3.5g', brand: 'Animal House', strain: 'hybrid', inStock: true },
        { id: 'sg-preroll-3', name: 'Twisted Lime Kush', price: 7.08, thc: '33%', weight: '.5g', brand: 'Picc', strain: 'sativa', inStock: true },
        { id: 'sg-preroll-4', name: 'Green Crack .35g x 10 Pack', price: 57.52, thc: '47%', weight: '3.5g', brand: 'KOA', strain: 'sativa', inStock: true },
      ]
    },
    {
      id: 'vapes',
      name: 'Vapes',
      order: 2,
      products: [
        { id: 'sg-vape-1', name: 'Sour OG', price: 72.57, thc: '88.96%', weight: '2g', brand: 'Outrankd', strain: 'indica', inStock: true },
        { id: 'sg-vape-2', name: 'THC : CBD 1g', price: 46.9, thc: '90%', weight: '1g', brand: 'ayrloom', strain: 'hybrid', inStock: true },
        { id: 'sg-vape-3', name: 'Juicy Red Apple', price: 61.95, thc: '91.5%', weight: '1g', brand: 'Select', strain: 'hybrid', inStock: true },
        { id: 'sg-vape-4', name: 'Gelato 33', price: 72.57, thc: '87.32%', weight: '2g', brand: 'Outrankd', strain: 'hybrid', inStock: true },
      ]
    },
    {
      id: 'concentrates',
      name: 'Concentrates',
      order: 3,
      products: [
        { id: 'sg-concentrate-1', name: 'Papaya Mimosa', price: 60.18, thc: '78.5%', weight: '1g', brand: 'Nyce', strain: 'indica', inStock: true },
        { id: 'sg-concentrate-2', name: 'The Belafonte Live Resin Badder', price: 54.87, thc: '72.39%', cbd: '0%', weight: '1g', brand: 'MFNY', strain: 'sativa', inStock: true },
        { id: 'sg-concentrate-3', name: 'Oishii #4 Live Resin Badder', price: 54.87, thc: '68.48%', cbd: '0%', weight: '1g', brand: 'MFNY', strain: 'indica', inStock: true },
        { id: 'sg-concentrate-4', name: 'Pink Runtz', price: 60.18, thc: '67.87%', weight: '1g', brand: 'Nyce', strain: 'indica', inStock: true },
      ]
    },
    {
      id: 'edibles',
      name: 'Edibles',
      order: 4,
      products: [
        { id: 'sg-edible-1', name: 'Bliss Sour Green Apple 10 Pack', price: 23.89, thc: '100%', brand: 'Florist Farms', strain: 'hybrid', inStock: true },
        { id: 'sg-edible-2', name: 'Party Animal', price: 23.89, thc: '100mg', brand: 'Off Hours', strain: 'hybrid', inStock: true },
        { id: 'sg-edible-3', name: 'Watermelon Mega Rings 100mg', price: 10.62, thc: '100%', cbd: '0%', brand: 'Flav', strain: 'hybrid', inStock: true },
        { id: 'sg-edible-4', name: 'Gelonade 100mg', price: 20.35, thc: '100%', brand: 'Off Hours', strain: 'sativa', inStock: true },
      ]
    },
    {
      id: 'tinctures',
      name: 'Tinctures',
      order: 5,
      products: [
        { id: 'sg-tincture-1', name: 'CBG:CBD:THC 10:5:1 15ml', price: 39.82, thc: '150mg', brand: 'High Falls Canna', inStock: true },
        { id: 'sg-tincture-2', name: 'Oishii Live Resin Tincture 15mL', price: 52.21, weight: '15mL', brand: 'MFNY', strain: 'indica', inStock: true },
        { id: 'sg-tincture-3', name: 'CBN:CBD:THC 5:5:1 15ml', price: 39.82, thc: '150mg', brand: 'High Falls Canna', strain: 'indica', inStock: true },
        { id: 'sg-tincture-4', name: 'Head & Heal Max Strength 1oz Bottle', price: 116.81, thc: '1000mg', weight: '1oz', brand: 'Head & Heal', strain: 'hybrid', inStock: true },
      ]
    },
    {
      id: 'cbd',
      name: 'CBD',
      order: 6,
      products: [
        { id: 'sg-cbd-1', name: 'Calm Drops CBD Dog Tincture', price: 56.64, cbd: '500mg', weight: '0.5g', brand: 'Happy Hounds', inStock: true },
        { id: 'sg-cbd-2', name: 'Calm & Joint Dog Treats 30ct', price: 38.94, brand: 'Happy Hounds', inStock: true },
        { id: 'sg-cbd-3', name: 'Calm & Coat Dog Tincture', price: 47.79, cbd: '250mg', brand: 'Happy Hounds', inStock: true },
        { id: 'sg-cbd-4', name: 'The Money Melon', price: 39.82, weight: '1g', brand: 'Chime & Chill', inStock: true },
      ]
    },
    {
      id: 'accessories',
      name: 'Accessories',
      order: 7,
      products: [
        { id: 'sg-accessory-1', name: 'Zamasu Mini Bullet Asst.', price: 10.62, brand: 'Gen Glass', inStock: true },
        { id: 'sg-accessory-2', name: 'Shroom Booties 1.25 Cones 6ct', price: 8.85, brand: "ZZZ's Collective", inStock: true },
        { id: 'sg-accessory-3', name: 'Whip It Premium North Sea Butane', price: 12.39, brand: 'Whip-It!', inStock: true },
        { id: 'sg-accessory-4', name: 'Wasabi', price: 27.43, brand: 'Tubr', inStock: true },
      ]
    }
  ]
};
