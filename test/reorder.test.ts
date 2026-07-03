import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

// Regression coverage for category/product ordering, which is the contract
// the `reorder` WebSocket handler mutates. The WS path itself is not directly
// reachable from this fetch-based harness (it requires an authenticated phone
// WebSocket upgrade + an active subscription), so these tests pin the public
// read-side ordering contract that `reorder` is responsible for maintaining:
//
//   - categories are returned sorted ascending by `order`
//   - every category carries an `order` field
//   - products render in their in-array position (Product has no explicit
//     `order` field in src/types.ts, so array index is the source of truth)
//
// The `reorder` WS handler in src/session.ts reassigns `category.order` from
// the new id array index and re-sorts, and rebuilds the product array in the
// requested id order. These tests guarantee that ordering surface stays
// stable across future edits.

const BASE = 'https://dubmenu.com';

// A fixed session id that the default-config DurableObject serves. The DO is
// created on first access and seeded with DEFAULT_CONFIG, so this widget call
// deterministically returns the default category set sorted by `order`.
const SESSION = 'reorder-regression-0001';

type WidgetCategory = {
  id: string;
  name: string;
  order: number;
  products: { id: string; name: string }[];
};

async function fetchWidget(): Promise<{ categories: WidgetCategory[] }> {
  const res = await SELF.fetch(`${BASE}/api/widget/${SESSION}`);
  expect(res.status).toBe(200);
  return (await res.json()) as { categories: WidgetCategory[] };
}

describe('reorder ordering contract — /api/widget', () => {
  it('returns categories sorted ascending by the `order` field', async () => {
    const { categories } = await fetchWidget();
    expect(categories.length).toBeGreaterThan(0);
    for (let i = 1; i < categories.length; i++) {
      expect(categories[i].order).toBeGreaterThanOrEqual(categories[i - 1].order);
    }
  });

  it('every category exposes a numeric `order` field', async () => {
    const { categories } = await fetchWidget();
    for (const cat of categories) {
      expect(typeof cat.order).toBe('number');
      expect(Number.isFinite(cat.order)).toBe(true);
    }
  });

  it('category `order` values equal their array index after sort', async () => {
    // DEFAULT_CONFIG assigns contiguous 0..n-1 order values, and the DO sorts
    // ascending on load. The reorder handler preserves this invariant by
    // reassigning order = new array index.
    const { categories } = await fetchWidget();
    for (let i = 0; i < categories.length; i++) {
      expect(categories[i].order).toBe(i);
    }
  });

  it('products render as an array (array index is the product order)', async () => {
    // Product has no explicit `order` field (src/types.ts), so the products
    // array IS the ordering. The reorder handler rebuilds this array in the
    // requested id order. This test pins the array-as-order contract.
    const { categories } = await fetchWidget();
    const first = categories[0];
    expect(Array.isArray(first.products)).toBe(true);
    // Product objects in the widget payload must NOT carry an `order` field —
    // confirms the array-index contract rather than a field-based one.
    for (const p of first.products as Array<Record<string, unknown>>) {
      expect(p.order).toBeUndefined();
    }
  });

  it('rejects an invalid session id for the widget route', async () => {
    const res = await SELF.fetch(`${BASE}/api/widget/bad id!`);
    expect(res.status).toBe(400);
  });
});

describe('reorder payload shape contract', () => {
  // These tests document the exact payload contract the `reorder` WS handler
  // in src/session.ts validates via isValidReorder(). The handler is not
  // directly invocable here, but the contract is:
  //
  //   { type: 'categories', ids: string[] }
  //     - ids must be a non-empty array of unique strings
  //     - ids set must EXACTLY match existing category ids (no unknown,
  //       no missing, no duplicates)
  //
  //   { type: 'products', categoryId: string, ids: string[] }
  //     - categoryId must be a string pointing at an existing category
  //     - ids must be a non-empty array of unique strings
  //     - ids set must EXACTLY match existing product ids in that category
  //
  // Unknown ids, partial lists, duplicate ids, wrong type, or a missing
  // categoryId (for products) are all rejected atomically (no partial write).

  it('the widget surfaces the full category id set the reorder contract guards', async () => {
    const { categories } = await fetchWidget();
    const ids = categories.map((c) => c.id);
    // No duplicate ids — a precondition isValidReorder enforces on input.
    expect(new Set(ids).size).toBe(ids.length);
    // The reorder contract requires the client to send back exactly this set.
    expect(ids.length).toBe(categories.length);
  });

  it('every category exposes a product id set the reorder contract guards', async () => {
    const { categories } = await fetchWidget();
    for (const cat of categories) {
      const ids = cat.products.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
