export interface IndexedPrice {
  index: number;
  price: number;
}

export function firstPositiveIndexedPrice(...sources: unknown[]): IndexedPrice | undefined {
  for (const source of sources) {
    if (!Array.isArray(source)) continue;
    const index = source.findIndex((value) => typeof value === 'number' && Number.isFinite(value) && value > 0);
    if (index >= 0) return { index, price: source[index] as number };
  }
  return undefined;
}
