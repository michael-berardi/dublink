import type { MenuConfig, Category } from './types';
import { DEFAULT_CONFIG } from './types';

export const STARTER_DISPENSARY_NAME = 'Green Leaf Dispensary';

export const DEMO_DISPENSARY_NAME = 'Simply Green';

export const starterCategories: Category[] = [
  {
    id: 'cat-flower',
    name: 'Flower',
    order: 0,
    products: [
      {
        id: 'prod-og-kush',
        name: 'OG Kush',
        price: 45,
        thc: '24%',
        cbd: '<1%',
        weight: '3.5g',
        brand: 'Connected Cannabis Co.',
        strain: 'indica',
        inStock: true,
        description: 'Classic indica-dominant strain with earthy pine and lemon notes.',
        priceTiers: [
          { label: '1g', price: '$15' },
          { label: '3.5g', price: '$45' },
          { label: '7g', price: '$85' },
        ],
      },
      {
        id: 'prod-blue-dream',
        name: 'Blue Dream',
        price: 40,
        thc: '21%',
        cbd: '<1%',
        weight: '3.5g',
        brand: 'Wonderbrett',
        strain: 'sativa',
        inStock: true,
        description: 'Sweet berry aroma with balanced full-body relaxation.',
        priceTiers: [
          { label: '1g', price: '$14' },
          { label: '3.5g', price: '$40' },
          { label: '7g', price: '$78' },
        ],
      },
      {
        id: 'prod-gelato',
        name: 'Gelato #33',
        price: 48,
        thc: '25%',
        cbd: '<1%',
        weight: '3.5g',
        brand: 'Sherbinskis',
        strain: 'hybrid',
        inStock: true,
        description: 'Dessert-like hybrid with creamy citrus flavor and euphoric effects.',
      },
      {
        id: 'prod-runaway',
        name: 'Runtz',
        price: 50,
        thc: '27%',
        cbd: '<1%',
        weight: '3.5g',
        brand: 'Cookies',
        strain: 'hybrid',
        inStock: true,
        description: 'Award-winning strain known for its sugary, fruity profile.',
      },
    ],
  },
  {
    id: 'cat-prerolls',
    name: 'Pre-Rolls',
    order: 1,
    products: [
      {
        id: 'prod-preroll-sativa',
        name: 'Daytime Sativa Pre-Roll',
        price: 12,
        thc: '20%',
        cbd: '<1%',
        weight: '1g',
        brand: 'Saints Joints',
        strain: 'sativa',
        inStock: true,
        description: 'Energizing single-strain pre-roll for daytime creativity.',
      },
      {
        id: 'prod-preroll-indica',
        name: 'Nighttime Indica Pre-Roll',
        price: 12,
        thc: '22%',
        cbd: '<1%',
        weight: '1g',
        brand: 'Saints Joints',
        strain: 'indica',
        inStock: true,
        description: 'Relaxing indica blend for evening wind-down.',
      },
      {
        id: 'prod-preroll-hybrid',
        name: 'Hybrid Pack (5-Pack)',
        price: 35,
        thc: '21%',
        cbd: '<1%',
        weight: '2.5g',
        brand: 'Lowell Herb Co.',
        strain: 'hybrid',
        inStock: true,
        description: 'Five perfectly rolled hybrid joints in a reusable tin.',
      },
    ],
  },
  {
    id: 'cat-edibles',
    name: 'Edibles',
    order: 2,
    products: [
      {
        id: 'prod-gummies',
        name: 'Mango Gummies',
        price: 18,
        thc: '100mg',
        cbd: '<1%',
        weight: '10pk',
        brand: 'Kiva Confections',
        inStock: true,
        description: 'Tropical mango gummies with 10mg THC per piece.',
      },
      {
        id: 'prod-chocolate',
        name: 'Dark Chocolate Bar',
        price: 24,
        thc: '100mg',
        cbd: '<1%',
        weight: '1 bar',
        brand: 'Kiva Confections',
        inStock: true,
        description: 'Rich 60% dark chocolate with 10mg scored doses.',
      },
      {
        id: 'prod-mints',
        name: 'Peppermint Mints',
        price: 16,
        thc: '40mg',
        cbd: '20mg',
        weight: '20pk',
        brand: 'Breez',
        inStock: true,
        description: 'Microdose mints with 2mg THC and 1mg CBD each.',
      },
    ],
  },
  {
    id: 'cat-concentrates',
    name: 'Concentrates',
    order: 3,
    products: [
      {
        id: 'prod-live-resin',
        name: 'Live Resin Badder',
        price: 55,
        thc: '78%',
        cbd: '<1%',
        weight: '1g',
        brand: 'Raw Garden',
        strain: 'hybrid',
        inStock: true,
        description: 'Flash-frozen flower extraction bursting with terpenes.',
      },
      {
        id: 'prod-shatter',
        name: 'Lemon Shatter',
        price: 40,
        thc: '82%',
        cbd: '<1%',
        weight: '1g',
        brand: 'Moxie',
        strain: 'sativa',
        inStock: true,
        description: 'Citrus-forward shatter with glass-like consistency.',
      },
      {
        id: 'prod-rosin',
        name: 'Solventless Rosin',
        price: 65,
        thc: '75%',
        cbd: '<1%',
        weight: '1g',
        brand: 'Blue River',
        strain: 'indica',
        inStock: true,
        description: 'Premium heat-and-pressure rosin, solventless and pure.',
      },
    ],
  },
  {
    id: 'cat-vapes',
    name: 'Vapes',
    order: 4,
    products: [
      {
        id: 'prod-cart',
        name: 'Strawberry Cough Cartridge',
        price: 35,
        thc: '85%',
        cbd: '<1%',
        weight: '1g',
        brand: 'Stiiizy',
        strain: 'sativa',
        inStock: true,
        description: 'Sweet strawberry distillate cartridge with a smooth finish.',
      },
      {
        id: 'prod-disposable',
        name: 'Live Resin Disposable',
        price: 42,
        thc: '80%',
        cbd: '<1%',
        weight: '0.5g',
        brand: 'PlugPlay',
        strain: 'hybrid',
        inStock: true,
        description: 'All-in-one rechargeable disposable with live resin terpenes.',
      },
      {
        id: 'prod-battery',
        name: '510 Thread Battery',
        price: 15,
        weight: '1 unit',
        brand: 'PAX',
        inStock: true,
        description: 'Rechargeable 510 battery with three temperature settings.',
      },
    ],
  },
  {
    id: 'cat-topicals',
    name: 'Topicals',
    order: 5,
    products: [
      {
        id: 'prod-balm',
        name: 'Cooling Relief Balm',
        price: 30,
        thc: '50mg',
        cbd: '200mg',
        weight: '2oz',
        brand: 'Lord Jones',
        inStock: true,
        description: 'Menthol-infused CBD balm for targeted soothing relief.',
      },
      {
        id: 'prod-lotion',
        name: 'Hydrating Body Lotion',
        price: 28,
        thc: '25mg',
        cbd: '150mg',
        weight: '4oz',
        brand: 'Cannuka',
        inStock: true,
        description: 'Creamy daily lotion with CBD and manuka honey.',
      },
    ],
  },
];

type DemoCategorySeed = {
  name: string;
  names: string[];
  weights: string[];
  thc: string[];
  prices: number[];
  strains: Array<'indica' | 'sativa' | 'hybrid' | undefined>;
};

const simplyGreenDemoSeeds: DemoCategorySeed[] = [
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

function createSimplyGreenDemoCategories(): Category[] {
  return simplyGreenDemoSeeds.map((seed, categoryIndex) => ({
    id: seed.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: seed.name,
    order: categoryIndex,
    products: seed.names.map((name, productIndex) => ({
      id: `simply-green-${seed.name.toLowerCase()}-${productIndex + 1}`.replace(/[^a-z0-9_-]/g, '-'),
      name: `${name} ${seed.weights[productIndex]}`,
      price: seed.prices[productIndex],
      thc: seed.thc[productIndex],
      weight: seed.weights[productIndex],
      brand: 'Simply Green',
      strain: seed.strains[productIndex],
      inStock: true,
    })),
  }));
}

export function createDemoConfig(): MenuConfig {
  return {
    ...JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as MenuConfig,
    dispensaryName: DEMO_DISPENSARY_NAME,
    categories: createSimplyGreenDemoCategories(),
    disclaimer: 'This Simply Green demo menu is used with permission for visual QA. Product availability and pricing should be verified before use.',
    tvDemo: true,
  };
}

export function createStarterConfig(): Partial<MenuConfig> & { categories: Category[] } {
  return {
    dispensaryName: STARTER_DISPENSARY_NAME,
    categories: JSON.parse(JSON.stringify(starterCategories)) as Category[],
  };
}
