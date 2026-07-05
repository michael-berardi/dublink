const MAX_CSV_BYTES = 5 * 1024 * 1024;
const MAX_CSV_ROWS = 5000;

/**
 * RFC 4180 CSV parser (state machine). Handles quoted fields, escaped
 * quotes (""), and embedded commas/newlines. No external dependencies.
 */
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }

    if (char === '\r') {
      i++;
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
      i++;
      continue;
    }

    field += char;
    i++;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const result: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const values = rows[r];
    if (values.length === 1 && values[0].trim() === '') continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (values[idx] || '').trim();
    });
    result.push(obj);
  }
  return result;
}

export interface CsvImportResult {
  ok: boolean;
  categoriesImported: number;
  productsImported: number;
  errors?: string[];
}

export function importMenuFromCSV(csvText: string): { categories: any[]; errors: string[] } {
  const errors: string[] = [];

  if (csvText.length > MAX_CSV_BYTES) {
    errors.push(`CSV exceeds maximum size of ${MAX_CSV_BYTES} bytes`);
    return { categories: [], errors };
  }

  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    errors.push('CSV is empty or missing data rows');
    return { categories: [], errors };
  }

  if (rows.length > MAX_CSV_ROWS) {
    errors.push(`CSV exceeds maximum of ${MAX_CSV_ROWS} data rows`);
    return { categories: [], errors };
  }

  const required = ['category', 'name', 'price'];
  const missing = required.filter((key) => !(key in rows[0]));
  if (missing.length > 0) {
    errors.push(`Missing required columns: ${missing.join(', ')}`);
    return { categories: [], errors };
  }

  const categoryMap = new Map<string, { id: string; name: string; order: number; products: any[] }>();
  let order = 0;

  rows.forEach((row, idx) => {
    const categoryName = row.category?.trim();
    const name = row.name?.trim();
    const price = parseFloat(row.price);
    if (!categoryName || !name || Number.isNaN(price)) {
      errors.push(`Row ${idx + 2}: missing category, name, or valid price`);
      return;
    }

    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, {
        id: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: categoryName,
        order: order++,
        products: [],
      });
    }

    const cat = categoryMap.get(categoryName)!;
    const product: any = {
      id: `${cat.id}-${cat.products.length + 1}`,
      name,
      price,
      inStock: row.instock ? row.instock.toLowerCase() !== 'false' : true,
    };

    if (row.thc) product.thc = row.thc;
    if (row.cbd) product.cbd = row.cbd;
    if (row.weight) product.weight = row.weight;
    if (row.brand) product.brand = row.brand;
    if (row.sku) product.sku = row.sku;
    if (row.strain) {
      const s = row.strain.toLowerCase();
      if (['indica', 'sativa', 'hybrid'].includes(s)) product.strain = s;
    }
    if (row.description) product.description = row.description;

    cat.products.push(product);
  });

  return { categories: Array.from(categoryMap.values()), errors };
}
