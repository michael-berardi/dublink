import { describe, expect, it } from 'vitest';
import { cleanProductDescription, extractProductDescription } from '../src/product-description';

describe('product descriptions', () => {
  it('turns imported HTML into two concise readable sentences', () => {
    const description = cleanProductDescription(
      '<p>Made with live resin &amp; natural terpenes.</p><p>Balanced flavor with a smooth finish.</p><p>This third sentence should not reach the TV card.</p>',
    );

    expect(description).toBe('Made with live resin & natural terpenes. Balanced flavor with a smooth finish.');
  });

  it('extracts common competitor description fields and truncates at a word boundary', () => {
    const description = extractProductDescription({
      shortDescription: 'A compact accessory built for daily use with durable materials and a secure closure '.repeat(5),
    });

    expect(description).toBeDefined();
    expect(description!.length).toBeLessThanOrEqual(240);
    expect(description).toMatch(/…$/);
  });

  it('drops markup-only and non-string values', () => {
    expect(cleanProductDescription('<script>alert(1)</script>')).toBeUndefined();
    expect(extractProductDescription({ description: { text: 'not a supported shape' } })).toBeUndefined();
  });
});
