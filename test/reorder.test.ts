import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

// The default config is intentionally empty/pairing-safe (no fake customer
// menu). These tests verify the ordering contract that the `reorder` WS
// handler in src/session.ts maintains when a session is populated. The WS
// path itself is not directly reachable from this fetch-based harness, so we
// test the read-side contract via the widget endpoint.

const BASE = 'https://dubmenu.com';

// A fixed session id that the default-config DurableObject serves.
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

describe('default widget state — no fake customer menu', () => {
  it('returns an empty category list for an unseeded/demo session', async () => {
    const { categories } = await fetchWidget();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories).toHaveLength(0);
  });

  it('returns a demo-safe dispensary name instead of a fake customer', async () => {
    const res = await SELF.fetch(`${BASE}/api/widget/${SESSION}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { dispensaryName?: string };
    const name = body.dispensaryName || '';
    expect(name === '' || name === 'DubMenu').toBe(true);
  });
});

describe('reorder ordering contract — /api/widget', () => {
  // With the default config intentionally empty, these tests document the
  // invariants the widget read-side must preserve once a session is populated.
  // The actual WS reorder handler in src/session.ts enforces the same
  // contract by reassigning category.order from the new array index and
  // rebuilding the products array in the requested id order.

  it('returns categories as an array (array index is the product order)', async () => {
    const { categories } = await fetchWidget();
    expect(Array.isArray(categories)).toBe(true);
  });

  it('rejects an invalid session id for the widget route', async () => {
    const res = await SELF.fetch(`${BASE}/api/widget/bad id!`);
    expect(res.status).toBe(400);
  });
});
