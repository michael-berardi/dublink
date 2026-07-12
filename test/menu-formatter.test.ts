import { describe, it, expect } from 'vitest';
import { canonicalCategoryName, dedupeAndFormatCategories, smartLayout, formatMenu, scoreProductForTv, selectTvProducts, isSpecialProduct, inferImportedBrandStyle, getImportedTemplateStyle } from '../src/menu-formatter';
import type { ScrapedCategory } from '../src/dutchie-scraper';

describe('canonicalCategoryName', () => {
  it('classifies common synonyms', () => {
    expect(canonicalCategoryName('Whole Flower')).toBe('Flower');
    expect(canonicalCategoryName('Pre-Roll Singles')).toBe('Pre-Rolls');
    expect(canonicalCategoryName('Vape Cartridges')).toBe('Vapes');
    expect(canonicalCategoryName('Live Resin')).toBe('Concentrates');
    expect(canonicalCategoryName('Gummies')).toBe('Edibles');
    expect(canonicalCategoryName('CBD Tincture')).toBe('CBD');
    expect(canonicalCategoryName('Bongs')).toBe('Accessories');
    expect(canonicalCategoryName('Accessories')).toBe('Accessories');
    expect(canonicalCategoryName('Unknown')).toBe('Other');
  });
});

describe('dedupeAndFormatCategories', () => {
  it('merges duplicate categories and products', () => {
    const categories: ScrapedCategory[] = [
      { id: 'flower', name: 'Flower', order: 0, products: [{ id: 'a', name: 'OG Kush', price: 45, inStock: true }] },
      { id: 'whole-flower', name: 'Whole Flower', order: 1, products: [{ id: 'b', name: 'Blue Dream', price: 40, inStock: true }] },
      { id: 'flower', name: 'Flower', order: 2, products: [{ id: 'a', name: 'OG Kush', price: 45, inStock: true }] },
    ];
    const result = dedupeAndFormatCategories(categories);
    expect(result.categories.length).toBe(1);
    expect(result.categories[0].name).toBe('Flower');
    expect(result.productCount).toBe(2);
  });

  it('preserves product image URLs through formatting', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'a', name: 'OG Kush', price: 45, inStock: true, image: 'https://example.com/og.jpg' },
        ],
      },
    ];
    const result = dedupeAndFormatCategories(categories);
    expect(result.categories[0].products[0].image).toBe('https://example.com/og.jpg');
  });

  it('limits categories and warns', () => {
    const categories: ScrapedCategory[] = [
      { id: 'flower', name: 'Flower', order: 0, products: [{ id: 'f1', name: 'F1', price: 10, inStock: true }] },
      { id: 'preroll', name: 'Pre-Roll', order: 1, products: [{ id: 'p1', name: 'P1', price: 10, inStock: true }] },
      { id: 'vape', name: 'Vape', order: 2, products: [{ id: 'v1', name: 'V1', price: 10, inStock: true }] },
      { id: 'concentrate', name: 'Concentrate', order: 3, products: [{ id: 'c1', name: 'C1', price: 10, inStock: true }] },
      { id: 'edible', name: 'Edible', order: 4, products: [{ id: 'e1', name: 'E1', price: 10, inStock: true }] },
      { id: 'tincture', name: 'Tincture', order: 5, products: [{ id: 't1', name: 'T1', price: 10, inStock: true }] },
      { id: 'topical', name: 'Topical', order: 6, products: [{ id: 'to1', name: 'To1', price: 10, inStock: true }] },
      { id: 'cbd', name: 'CBD', order: 7, products: [{ id: 'cbd1', name: 'CBD1', price: 10, inStock: true }] },
    ];
    const result = dedupeAndFormatCategories(categories, { maxCategories: 5 });
    expect(result.categories.length).toBe(5);
    expect(result.warnings.length).toBe(1);
  });

  it('keeps distinct products with non-ASCII identifiers', () => {
    const categories: ScrapedCategory[] = [{
      id: 'flower',
      name: 'Flower',
      order: 0,
      products: [
        { id: '漢字一', name: 'First Product', price: 10, inStock: true },
        { id: '漢字二', name: 'Second Product', price: 12, inStock: true },
      ],
    }];

    const result = dedupeAndFormatCategories(categories);
    expect(result.productCount).toBe(2);
    expect(new Set(result.categories[0].products.map((product) => product.id)).size).toBe(2);
  });
});

describe('smartLayout', () => {
  it('uses a single display for small menus', () => {
    const layout = smartLayout(8, 2);
    expect(layout.displayCount).toBe(1);
    expect(layout.layoutMode).toBe('grid');
    expect(layout.fontSize).toBe('large');
  });

  it('uses two displays for medium menus', () => {
    const layout = smartLayout(25, 4);
    expect(layout.displayCount).toBe(2);
    expect(layout.layoutMode).toBe('columns');
    expect(layout.fontSize).toBe('medium');
  });

  it('uses three or four displays for large menus', () => {
    expect(smartLayout(60, 5).displayCount).toBe(3);
    expect(smartLayout(100, 8).displayCount).toBe(4);
  });

  it('switches to compact for very dense menus', () => {
    const layout = smartLayout(90, 8);
    expect(layout.layoutMode).toBe('compact');
    expect(layout.showImages).toBe(false);
    expect(layout.fontSize).toBe('small');
  });
});

describe('isSpecialProduct', () => {
  it('detects deal wording in the description', () => {
    expect(isSpecialProduct({ id: 'a', name: 'Regular', price: 35, inStock: true, description: '10% off today only' })).toBe(true);
    expect(isSpecialProduct({ id: 'a', name: 'Regular', price: 35, inStock: true, description: 'BOGO while supplies last' })).toBe(true);
  });

  it('detects a markdown from originalPrice when it is higher than price', () => {
    expect(isSpecialProduct({ id: 'a', name: 'Regular', price: 30, originalPrice: 40, inStock: true })).toBe(true);
  });

  it('honours the explicit special flag', () => {
    expect(isSpecialProduct({ id: 'a', name: 'Regular', price: 30, inStock: true, special: true })).toBe(true);
  });

  it('does not flag ordinary products without special signals', () => {
    expect(isSpecialProduct({ id: 'a', name: 'Premium Flower', price: 45, inStock: true, description: 'High quality indoor flower' })).toBe(false);
    expect(isSpecialProduct({ id: 'a', name: 'Premium Flower', price: 45, originalPrice: 45, inStock: true })).toBe(false);
  });
});

describe('TV product selection', () => {
  it('scores image-rich complete products above sparse products', () => {
    const rich = scoreProductForTv({
      id: 'rich',
      name: 'Premium Blue Dream',
      price: 48,
      image: 'https://example.com/blue.jpg',
      brand: 'Top Shelf',
      strain: 'sativa',
      thc: '24%',
      weight: '3.5g',
      inStock: true,
    });
    const sparse = scoreProductForTv({
      id: 'sparse',
      name: 'Mystery Item With A Very Long Product Name That Does Not Read Well On TV',
      price: 12,
      inStock: true,
    });
    expect(rich).toBeGreaterThan(sparse);
  });

  it('selects TV products by image and metadata quality, not source order', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'cheap', name: 'Cheap Flower', price: 10, inStock: true },
          { id: 'hero', name: 'Hero Flower', price: 40, image: 'https://example.com/hero.jpg', brand: 'Hero Brand', strain: 'hybrid', thc: '28%', weight: '3.5g', inStock: true },
          { id: 'mid', name: 'Mid Flower', price: 30, brand: 'Mid Brand', inStock: true },
        ],
      },
    ];
    const selected = selectTvProducts(categories, { maxProductsPerCategory: 2 });
    expect(selected[0].products.map((p) => p.id)).toEqual(['hero', 'mid']);
  });

  it('keeps broad imported menus instead of silently dropping secondary categories', () => {
    const categories: ScrapedCategory[] = ['Flower', 'Pre-Rolls', 'Vapes', 'Concentrates', 'Edibles', 'Tinctures', 'Topicals'].map((name, index) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      order: index,
      products: [{ id: `${index}`, name: `${name} Product`, price: 10 + index, inStock: true }],
    }));
    const selected = selectTvProducts(categories);
    expect(selected.map((cat) => cat.name)).toEqual(['Flower', 'Pre-Rolls', 'Vapes', 'Concentrates', 'Edibles', 'Tinctures', 'Topicals']);
  });

  it('uses bestseller wording and source order as popularity signals', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'vapes',
        name: 'Vapes',
        order: 0,
        products: [
          { id: 'regular', name: 'Regular Cart', price: 40, image: 'https://example.com/regular.jpg', brand: 'A', inStock: true },
          { id: 'best', name: 'Best Seller Live Resin Cart', price: 42, image: 'https://example.com/best.jpg', brand: 'B', inStock: true },
        ],
      },
    ];
    const selected = selectTvProducts(categories, { maxProductsPerCategory: 1 });
    expect(selected[0].products[0].id).toBe('best');
  });

  it('promotes scraped deals into a dedicated Specials category', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'deal', name: 'BOGO Blue Dream Eighths', price: 35, image: 'https://example.com/deal.jpg', brand: 'House', inStock: true },
          { id: 'regular', name: 'Regular Blue Dream', price: 40, image: 'https://example.com/regular.jpg', brand: 'House', inStock: true },
        ],
      },
    ];
    const selected = selectTvProducts(categories, { maxCategories: 2, maxProductsPerCategory: 2 });
    expect(selected[0].name).toBe('Specials');
    expect(selected[0].products[0]).toMatchObject({ id: 'deal', special: true, specialLabel: 'BOGO' });
    expect(selected[1].name).toBe('Flower');
    expect(selected[1].products.map((p) => p.id)).toEqual(['regular']);
  });

  it('promotes products with deal descriptions into Specials with derived labels', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'bogo', name: 'BOGO Blue Dream', price: 35, inStock: true, description: 'Buy one get one free' },
          { id: 'percent', name: 'Sour Diesel', price: 30, inStock: true, description: '20% off this week' },
          { id: 'regular', name: 'Regular Blue Dream', price: 40, inStock: true },
        ],
      },
    ];
    const selected = selectTvProducts(categories, { maxCategories: 2, maxProductsPerCategory: 2 });
    expect(selected[0].name).toBe('Specials');
    const ids = selected[0].products.map((p) => p.id);
    expect(ids).toContain('bogo');
    expect(ids).toContain('percent');
    const bogo = selected[0].products.find((p) => p.id === 'bogo');
    expect(bogo?.specialLabel).toBe('BOGO');
    const percent = selected[0].products.find((p) => p.id === 'percent');
    expect(percent?.specialLabel).toBe('20% OFF');
    expect(selected[1].name).toBe('Flower');
  });

  it('promotes products with originalPrice markdowns into Specials as Sale', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'markdown', name: 'Markdown Kush', price: 30, originalPrice: 45, inStock: true },
          { id: 'regular', name: 'Regular Kush', price: 40, inStock: true },
        ],
      },
    ];
    const selected = selectTvProducts(categories, { maxCategories: 2, maxProductsPerCategory: 2 });
    expect(selected[0].name).toBe('Specials');
    expect(selected[0].products[0]).toMatchObject({ id: 'markdown', special: true, specialLabel: 'Sale' });
    expect(selected[1].products.map((p) => p.id)).toEqual(['regular']);
  });

  it('does not promote products whose originalPrice equals price', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'same', name: 'Same Price', price: 40, originalPrice: 40, inStock: true },
          { id: 'regular', name: 'Regular', price: 40, inStock: true },
        ],
      },
    ];
    const selected = selectTvProducts(categories, { maxCategories: 2, maxProductsPerCategory: 2 });
    expect(selected.every((cat) => cat.name !== 'Specials')).toBe(true);
  });

  it('preserves imported section names and order when requested', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'premium-smalls',
        name: 'Premium Smalls',
        order: 0,
        products: [{ id: 'small', name: 'House Smalls', price: 28, inStock: true }],
      },
      {
        id: 'infused-pre-rolls',
        name: 'Infused Pre-Rolls',
        order: 1,
        products: [{ id: 'infused', name: 'Infused Joint', price: 18, inStock: true }],
      },
    ];

    const selected = selectTvProducts(categories, { preserveSections: true });
    expect(selected.map((cat) => cat.name)).toEqual(['Premium Smalls', 'Infused Pre-Rolls']);
    expect(selected[0].products[0].category).toBeUndefined();
  });
});

describe('formatMenu', () => {
  it('returns a fully formatted menu with smart layout', () => {
    const categories: ScrapedCategory[] = [
      { id: 'flower', name: 'Flower', order: 0, products: [{ id: 'a', name: 'OG Kush', price: 45, inStock: true }] },
    ];
    const result = formatMenu(categories, 'Green Leaf', 'https://example.com/logo.png');
    expect(result.dispensaryName).toBe('Green Leaf');
    expect(result.logo).toBe('https://example.com/logo.png');
    expect(result.layout.displayCount).toBe(1);
    expect(result.layout.layoutMode).toBe('grid');
  });

  it('infers a matching brand theme from imported dispensary identity', () => {
    expect(inferImportedBrandStyle('High Society Dispensary').template).toBe('gold');
    expect(inferImportedBrandStyle('Vibe by California Ukiah').template).toBe('vapor');
    expect(inferImportedBrandStyle('The Forest Baltimore').template).toBe('forest');
    expect(formatMenu([], 'High Society Dispensary').brandStyle.primaryColor).toBe('#fbbf24');
  });

  it('exposes template colors for notes-driven smart import styles', () => {
    expect(getImportedTemplateStyle('forest')).toMatchObject({
      primaryColor: '#22c55e',
      secondaryColor: '#14532d',
    });
    expect(getImportedTemplateStyle('gold').primaryColor).toBe('#fbbf24');
  });

  it('retains complete normalized inventory when TV optimization is disabled at ingest', () => {
    const categories: ScrapedCategory[] = Array.from({ length: 12 }, (_, categoryIndex) => ({
      id: `category-${categoryIndex}`,
      name: `Source Section ${categoryIndex}`,
      order: categoryIndex,
      products: Array.from({ length: 14 }, (_, productIndex) => ({
        id: `product-${categoryIndex}-${productIndex}`,
        name: `Product ${categoryIndex}-${productIndex}`,
        price: 10 + productIndex,
        inStock: true,
      })),
    }));

    const result = formatMenu(categories, 'Complete Menu', undefined, {
      maxCategories: 20,
      maxProductsPerCategory: 500,
      tvOptimize: false,
      preserveSections: true,
    });

    expect(result.categories).toHaveLength(12);
    expect(result.categories.every((category) => category.products.length === 14)).toBe(true);
    expect(result.productCount).toBe(168);
    expect(result.warnings.join(' ')).not.toContain('TV-ready products');
  });

  it('orders every imported category alphabetically by cleaned product name', () => {
    const categories: ScrapedCategory[] = [{
      id: 'flower',
      name: 'Flower',
      order: 0,
      products: [
        { id: 'z', name: 'Zulu Kush', price: 30, inStock: true },
        { id: 'a10', name: 'apple fritter 10', price: 25, inStock: true },
        { id: 'a2', name: 'Apple Fritter 2', price: 20, inStock: true },
        { id: 'b', name: 'Blue Dream', price: 35, inStock: true },
      ],
    }];

    const result = formatMenu(categories, 'Alphabetical Menu', undefined, {
      maxCategories: 20,
      maxProductsPerCategory: 500,
      tvOptimize: false,
      preserveSections: true,
    });

    expect(result.categories[0].products.map((product) => product.name)).toEqual([
      'Apple Fritter 2',
      'apple fritter 10',
      'Blue Dream',
      'Zulu Kush',
    ]);
  });


  it('TV-optimizes imported menus and preserves selected assets', () => {
    const categories: ScrapedCategory[] = [
      {
        id: 'flower',
        name: 'Flower',
        order: 0,
        products: [
          { id: 'first', name: 'First No Image', price: 20, inStock: true },
          { id: 'asset', name: 'Asset Product', price: 30, image: 'https://example.com/asset.jpg', brand: 'Asset Brand', thc: '26%', weight: '3.5g', inStock: true },
        ],
      },
    ];
    const result = formatMenu(categories, 'Green Leaf', undefined, { tvOptimize: true, maxTvProductsPerCategory: 1 });
    expect(result.productCount).toBe(1);
    expect(result.categories[0].products[0].id).toBe('asset');
    expect(result.categories[0].products[0].image).toBe('https://example.com/asset.jpg');
    expect(result.layout.showImages).toBe(true);
    expect(result.warnings.join(' ')).toContain('TV-ready products');
  });

  it('preserves source sections through TV formatting when requested', () => {
    const result = formatMenu([
      {
        id: 'premium-smalls',
        name: 'Premium Smalls',
        order: 0,
        products: [{ id: 'small', name: 'House Smalls', price: 28, inStock: true }],
      },
      {
        id: 'infused-pre-rolls',
        name: 'Infused Pre-Rolls',
        order: 1,
        products: [{ id: 'infused', name: 'Infused Joint', price: 18, inStock: true }],
      },
    ], 'Green Leaf', undefined, { tvOptimize: true, preserveSections: true });

    expect(result.categories.map((cat) => cat.name)).toEqual(['Premium Smalls', 'Infused Pre-Rolls']);
    expect(result.categories[0].products[0].category).toBe('Premium Smalls');
  });

  it('cleans scraped TV product names that start with separators or only contain weights', () => {
    const result = formatMenu([
      {
        id: 'vapes',
        name: 'Vapes',
        order: 0,
        products: [
          { id: 'pipe', name: '| Black Zskittles', price: 55, brand: 'Woodstock', inStock: true },
          { id: 'weight', name: '2g', price: 76, brand: 'ayrloom', inStock: true },
        ],
      },
    ], 'Green Leaf');

    expect(result.categories[0].products.map((p) => p.name)).toEqual(['ayrloom 2g', 'Black Zskittles']);
  });

  it('title-cases all-uppercase imported product names while preserving cannabis acronyms', () => {
    const result = formatMenu([
      {
        id: 'vapes',
        name: 'Vapes',
        order: 0,
        products: [
          { id: 'all-in-one', name: 'WATERMELON KUSH DISTILLATE ALL-IN-ONE', price: 21.6, inStock: true },
          { id: 'topical', name: 'CBD TOPICAL ROLL-ON (1:1 CBD:THC)', price: 38, inStock: true },
          { id: 'tincture', name: 'BLUEBERRY TINCUTRE 2OZ', price: 29, inStock: true },
        ],
      },
    ], 'Green Leaf');

    expect(result.categories[0].products.map((product) => product.name)).toEqual([
      'Blueberry Tincture 2oz',
      'CBD Topical Roll-On (1:1 CBD:THC)',
      'Watermelon Kush Distillate All-In-One',
    ]);
  });

  it('keeps dense TV imports in text-first mode instead of forcing product photos', () => {
    const products = Array.from({ length: 96 }, (_, index) => ({
      id: `p-${index}`,
      name: `Product ${index}`,
      price: 20 + index,
      image: `https://example.com/p-${index}.jpg`,
      brand: 'Dense Brand',
      inStock: true,
    }));
    const categories: ScrapedCategory[] = [
      { id: 'flower', name: 'Flower', order: 0, products },
      { id: 'vapes', name: 'Vapes', order: 1, products: products.map((p) => ({ ...p, id: `v-${p.id}` })) },
      { id: 'edibles', name: 'Edibles', order: 2, products: products.map((p) => ({ ...p, id: `e-${p.id}` })) },
      { id: 'pre-rolls', name: 'Pre-Rolls', order: 3, products: products.map((p) => ({ ...p, id: `r-${p.id}` })) },
    ];

    const result = formatMenu(categories, 'Dense Menu', undefined, {
      tvOptimize: true,
      maxTvCategories: 4,
      maxTvProductsPerCategory: 24,
    });

    expect(result.productCount).toBeGreaterThan(70);
    expect(result.layout.layoutMode).toBe('compact');
    expect(result.layout.showImages).toBe(false);
  });
});
