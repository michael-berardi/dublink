export interface Product {
  id: string;
  name: string;
  price: number;
  thc?: string;
  cbd?: string;
  description?: string;
  inStock: boolean;
  strain?: 'indica' | 'sativa' | 'hybrid';
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
  order: number;
}

export interface MenuConfig {
  dispensaryName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  showStrain: boolean;
  currency: string;
  categories: Category[];
  layout: 'grid' | 'list' | 'cards';
  fontSize: 'small' | 'medium' | 'large';
  theme: 'dark' | 'light';
}

export interface Session {
  id: string;
  createdAt: number;
  lastActivity: number;
  config: MenuConfig;
  tvConnected: boolean;
  phoneConnected: boolean;
}

export interface ServerToClientEvents {
  'session:update': (config: MenuConfig) => void;
  'session:connected': (role: 'tv' | 'phone') => void;
  'session:disconnected': (role: 'tv' | 'phone') => void;
  'session:paired': () => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'session:join': (sessionId: string, role: 'tv' | 'phone') => void;
  'config:update': (sessionId: string, config: Partial<MenuConfig>) => void;
  'category:add': (sessionId: string, category: Omit<Category, 'id'>) => void;
  'category:update': (sessionId: string, categoryId: string, updates: Partial<Category>) => void;
  'category:remove': (sessionId: string, categoryId: string) => void;
  'product:add': (sessionId: string, categoryId: string, product: Omit<Product, 'id'>) => void;
  'product:update': (sessionId: string, categoryId: string, productId: string, updates: Partial<Product>) => void;
  'product:remove': (sessionId: string, categoryId: string, productId: string) => void;
  'product:toggle-stock': (sessionId: string, categoryId: string, productId: string) => void;
}

export const DEFAULT_CONFIG: MenuConfig = {
  dispensaryName: 'DubHaven Dispensary',
  primaryColor: '#10b981',
  secondaryColor: '#065f46',
  showStrain: true,
  currency: '$',
  layout: 'grid',
  fontSize: 'medium',
  theme: 'dark',
  categories: [
    {
      id: 'flower',
      name: 'Flower',
      order: 0,
      products: [
        { id: 'f1', name: 'OG Kush', price: 45, thc: '24%', cbd: '0.1%', strain: 'hybrid', inStock: true },
        { id: 'f2', name: 'Blue Dream', price: 42, thc: '21%', cbd: '0.2%', strain: 'sativa', inStock: true },
        { id: 'f3', name: 'Northern Lights', price: 40, thc: '19%', cbd: '0.1%', strain: 'indica', inStock: true },
        { id: 'f4', name: 'Gelato', price: 48, thc: '25%', cbd: '0.1%', strain: 'hybrid', inStock: false },
      ]
    },
    {
      id: 'edibles',
      name: 'Edibles',
      order: 1,
      products: [
        { id: 'e1', name: 'Gummy Bears 100mg', price: 25, thc: '100mg', cbd: '0mg', inStock: true },
        { id: 'e2', name: 'Chocolate Bar 200mg', price: 35, thc: '200mg', cbd: '0mg', inStock: true },
        { id: 'e3', name: 'CBD Gummies 50mg', price: 30, thc: '0mg', cbd: '50mg', inStock: true },
      ]
    },
    {
      id: 'concentrates',
      name: 'Concentrates',
      order: 2,
      products: [
        { id: 'c1', name: 'Live Resin', price: 65, thc: '82%', cbd: '0.2%', inStock: true },
        { id: 'c2', name: 'Shatter', price: 55, thc: '78%', cbd: '0.1%', inStock: true },
        { id: 'c3', name: 'Rosin', price: 75, thc: '85%', cbd: '0.3%', inStock: true },
      ]
    },
    {
      id: 'vapes',
      name: 'Vapes',
      order: 3,
      products: [
        { id: 'v1', name: 'Disposable Pen', price: 55, thc: '85%', cbd: '0.2%', inStock: true },
        { id: 'v2', name: 'Cartridge 1g', price: 60, thc: '88%', cbd: '0.1%', inStock: true },
        { id: 'v3', name: 'CBD Cartridge', price: 50, thc: '0%', cbd: '500mg', inStock: false },
      ]
    }
  ]
};
