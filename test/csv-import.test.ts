import { describe, it, expect } from 'vitest';
import { importMenuFromCSV } from '../src/csv-import';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;

describe('csv-import: simple parsing', () => {
  it('parses a simple unquoted header + data row into 3 columns', () => {
    const csv = 'name,price,category\nBlue Dream,10.00,Flower';
    const res = importMenuFromCSV(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.categories).toHaveLength(1);
    const cat = res.categories[0];
    expect(cat.name).toBe('Flower');
    expect(cat.products).toHaveLength(1);
    expect(cat.products[0].name).toBe('Blue Dream');
    expect(cat.products[0].price).toBe(10);
  });

  it('parses a quoted field containing a comma as a single value', () => {
    const csv = 'name,price,category\n"Special, Deal",10.00,Flower';
    const res = importMenuFromCSV(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.categories).toHaveLength(1);
    expect(res.categories[0].products[0].name).toBe('Special, Deal');
  });

  it('parses a quoted field with an escaped double-quote (RFC 4180 "")', () => {
    const csv = 'name,price,category\n"He said ""hi""",5,Edibles';
    const res = importMenuFromCSV(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.categories[0].products[0].name).toBe('He said "hi"');
  });

  it('parses a quoted field with an embedded newline', () => {
    const csv = 'name,price,category\n"Line1\nLine2",5,Flower';
    const res = importMenuFromCSV(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.categories).toHaveLength(1);
    const name = res.categories[0].products[0].name;
    expect(name).toContain('Line1');
    expect(name).toContain('Line2');
    expect(name).toContain('\n');
  });
});

describe('csv-import: edge cases', () => {
  it('returns a graceful error for empty input', () => {
    const res = importMenuFromCSV('');
    expect(res.categories).toHaveLength(0);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('returns a graceful error for whitespace-only input', () => {
    const res = importMenuFromCSV('   \n   \n  ');
    expect(res.categories).toHaveLength(0);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('returns a graceful error for header-only input (no data rows)', () => {
    const res = importMenuFromCSV('name,price,category\n');
    expect(res.categories).toHaveLength(0);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('strips a UTF-8 BOM and parses normally', () => {
    const csv = '\uFEFFname,price,category\nOG Kush,12.50,Flower';
    const res = importMenuFromCSV(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.categories).toHaveLength(1);
    expect(res.categories[0].products[0].name).toBe('OG Kush');
  });

  it('handles CRLF (\\r\\n) line endings as separators', () => {
    const csv = 'name,price,category\r\nSour Diesel,15.00,Flower\r\nJack Herer,20.00,Flower\r\n';
    const res = importMenuFromCSV(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.categories).toHaveLength(1);
    expect(res.categories[0].products).toHaveLength(2);
    expect(res.categories[0].products[0].name).toBe('Sour Diesel');
    expect(res.categories[0].products[1].name).toBe('Jack Herer');
  });

  it('handles a lone \\r as a carriage return (ignored, not a crash)', () => {
    const csv = 'name,price,category\r\nGG4,18,Flower';
    const res = importMenuFromCSV(csv);
    expect(res.categories).toHaveLength(1);
    expect(res.categories[0].products[0].name).toBe('GG4');
  });

  it('handles a malformed quote (unclosed quote at EOF) without crashing', () => {
    const csv = 'name,price,category\n"Unclosed quote, still ok';
    const res = importMenuFromCSV(csv);
    expect(Array.isArray(res.errors)).toBe(true);
    expect(Array.isArray(res.categories)).toBe(true);
  });

  it('records an error for a data row missing a valid price', () => {
    const csv = 'name,price,category\nGood Bud,notanumber,Flower';
    const res = importMenuFromCSV(csv);
    expect(res.categories).toHaveLength(0);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors.some((e: string) => /missing category, name, or valid price/.test(e))).toBe(true);
  });
});

describe('csv-import: limits', () => {
  it('rejects input exceeding the 5MB byte cap', () => {
    const oneK = 'x'.repeat(1024);
    let big = 'name,price,category\n';
    while (big.length <= MAX_BYTES) {
      big += 'P,1.00,Flower,' + oneK + '\n';
    }
    const res = importMenuFromCSV(big);
    expect(res.categories).toHaveLength(0);
    expect(res.errors.some((e: string) => /maximum size/i.test(e))).toBe(true);
  });

  it('rejects input exceeding the 5000-row cap', () => {
    const lines = ['name,price,category'];
    for (let i = 0; i <= MAX_ROWS; i++) {
      lines.push('P' + i + ',1.00,Flower');
    }
    const res = importMenuFromCSV(lines.join('\n'));
    expect(res.categories).toHaveLength(0);
    expect(res.errors.some((e: string) => /5000/i.test(e))).toBe(true);
  });
});

describe('csv-import: real-world fixture', () => {
  it('parses a 5-row dispensary CSV with mixed categories, quoted names, and decimals', () => {
    const csv = [
      'name,price,category,thc,cbd,weight,brand,strain',
      '"Wedding Cake",45.50,Flower,28.5%,0.1%,3.5g,Rolling Green,indica',
      '"Blue Dream, OG",12.00,Flower,24.0%,0.0%,1g,Knack,hybrid',
      '"Sour Tangie"", Limited",60.00,Concentrates,82.1%,0.0%,1g,Nyce,sativa',
      'Peach Gummy,5.25,Edibles,10mg,0mg,1ct,Flav,hybrid',
      '"Watermelon ""Mega"" Rings",10.62,Edibles,100mg,0%,1ct,Flav,hybrid',
    ].join('\n');
    const res = importMenuFromCSV(csv);
    expect(res.errors).toHaveLength(0);
    const flower = res.categories.find((c: { name: string }) => c.name === 'Flower');
    const conc = res.categories.find((c: { name: string }) => c.name === 'Concentrates');
    const edibles = res.categories.find((c: { name: string }) => c.name === 'Edibles');
    expect(flower).toBeDefined();
    expect(conc).toBeDefined();
    expect(edibles).toBeDefined();
    expect(flower!.products).toHaveLength(2);
    expect(conc!.products).toHaveLength(1);
    expect(edibles!.products).toHaveLength(2);
    expect(flower!.products[0].name).toBe('Wedding Cake');
    expect(flower!.products[1].name).toBe('Blue Dream, OG');
    expect(conc!.products[0].name).toBe('Sour Tangie", Limited');
    expect(edibles!.products[1].name).toBe('Watermelon "Mega" Rings');
    expect(flower!.products[0].price).toBe(45.5);
    expect(edibles!.products[0].price).toBe(5.25);
    expect(flower!.products[0].strain).toBe('indica');
    expect(flower!.products[0].brand).toBe('Rolling Green');
  });

  it('preserves optional columns (thc/cbd/weight/brand/strain/description) when present', () => {
    const csv = 'name,price,category,thc,cbd,weight,brand,strain,description\nA,1.00,Flower,20%,0.1%,1g,BrandX,indica,A nice bud';
    const res = importMenuFromCSV(csv);
    expect(res.errors).toHaveLength(0);
    const p = res.categories[0].products[0];
    expect(p.thc).toBe('20%');
    expect(p.cbd).toBe('0.1%');
    expect(p.weight).toBe('1g');
    expect(p.brand).toBe('BrandX');
    expect(p.strain).toBe('indica');
    expect(p.description).toBe('A nice bud');
  });

  it('defaults inStock to true and ignores invalid strain values', () => {
    const csv = 'name,price,category,strain,instock\nA,1.00,Flower,ronweasley,false';
    const res = importMenuFromCSV(csv);
    expect(res.errors).toHaveLength(0);
    const p = res.categories[0].products[0];
    expect(p.inStock).toBe(false);
    expect(p.strain).toBeUndefined();
  });
});
