import { describe, it, expect } from 'vitest';
import { getCategoryType, GET_CATEGORY_TYPE_JS, CATEGORY_ICON_SVGS, PLACEHOLDER_ICON_SVGS, getProductVariant, GET_PRODUCT_VARIANT_JS, getPlaceholderIconSvg, GET_PLACEHOLDER_ICON_SVG_JS, getPlaceholderVariantOverlay, PLACEHOLDER_VARIANT_OVERLAYS, PLACEHOLDER_OVERLAY_COLORS, GET_PLACEHOLDER_OVERLAY_COLORS_JS, GET_PLACEHOLDER_VARIANT_OVERLAY_JS } from '../src/category-icons';

describe('getCategoryType', () => {
  it('classifies canonical category names and synonyms', () => {
    expect(getCategoryType('Flower')).toBe('flower');
    expect(getCategoryType('Whole Flower')).toBe('flower');
    expect(getCategoryType('Pre-Rolls')).toBe('prerolls');
    expect(getCategoryType('Vape Cartridges')).toBe('vapes');
    expect(getCategoryType('Concentrates')).toBe('concentrates');
    expect(getCategoryType('Edibles')).toBe('edibles');
    expect(getCategoryType('Gummies')).toBe('edibles');
    expect(getCategoryType('CBD Tincture')).toBe('cbd');
    expect(getCategoryType('Topicals')).toBe('topicals');
    expect(getCategoryType('Accessories')).toBe('accessories');
  });

  it('falls back to other for unknown names', () => {
    expect(getCategoryType('Mystery')).toBe('other');
    expect(getCategoryType('')).toBe('other');
  });

  it('is case-insensitive', () => {
    expect(getCategoryType('FLOWER')).toBe('flower');
    expect(getCategoryType('Pre-Roll Singles')).toBe('prerolls');
  });
});

describe('GET_CATEGORY_TYPE_JS', () => {
  it('injects a runnable browser function', () => {
    expect(GET_CATEGORY_TYPE_JS).toContain('function getCategoryType');
    expect(GET_CATEGORY_TYPE_JS).toContain('flower');
    expect(GET_CATEGORY_TYPE_JS).toContain('edibles');
    // Evaluate in a minimal context to ensure it parses and returns expected types.
    const fn = new Function(GET_CATEGORY_TYPE_JS + '; return getCategoryType;')();
    expect(fn('Vape Carts')).toBe('vapes');
    expect(fn('Live Resin')).toBe('concentrates');
    expect(fn('Unknown')).toBe('other');
  });
});

describe('icon SVGs', () => {
  it('all category icons use currentColor and have consistent viewBox', () => {
    for (const [key, svg] of Object.entries(CATEGORY_ICON_SVGS)) {
      expect(svg, `${key} icon`).toContain('viewBox="0 0 24 24"');
      expect(svg, `${key} icon`).toContain('currentColor');
      expect(svg, `${key} icon`).toContain('aria-hidden="true"');
      expect(svg, `${key} icon`).not.toContain('fill="var(--bg-elev)"');
      expect(svg, `${key} icon`).not.toContain('fill="var(--accent)"');
    }
  });

  it('all placeholder icons use currentColor and have consistent viewBox', () => {
    for (const [key, svg] of Object.entries(PLACEHOLDER_ICON_SVGS)) {
      expect(svg, `${key} placeholder`).toContain('viewBox="0 0 100 100"');
      expect(svg, `${key} placeholder`).toContain('currentColor');
      expect(svg, `${key} placeholder`).toContain('class="placeholder-icon"');
    }
  });

  it('includes every category label', () => {
    const keys = Object.keys(CATEGORY_ICON_SVGS);
    expect(keys).toContain('flower');
    expect(keys).toContain('edibles');
    expect(keys).toContain('concentrates');
    expect(keys).toContain('prerolls');
    expect(keys).toContain('vapes');
    expect(keys).toContain('topicals');
    expect(keys).toContain('tinctures');
    expect(keys).toContain('cbd');
    expect(keys).toContain('accessories');
    expect(keys).toContain('other');
    expect(keys).toContain('generic');
  });
});

describe('getProductVariant', () => {
  it('returns a deterministic number between 0 and 3', () => {
    expect(getProductVariant('p1', 'OG Kush')).toBeGreaterThanOrEqual(0);
    expect(getProductVariant('p1', 'OG Kush')).toBeLessThan(4);
  });

  it('is stable for the same id and name', () => {
    expect(getProductVariant('p1', 'OG Kush')).toBe(getProductVariant('p1', 'OG Kush'));
  });

  it('varies with different inputs', () => {
    const variants = new Set<number>();
    variants.add(getProductVariant('p1', 'OG Kush'));
    variants.add(getProductVariant('p2', 'Blue Dream'));
    variants.add(getProductVariant('p3', 'Gelato #33'));
    variants.add(getProductVariant('p4', 'Runtz'));
    // At least two distinct variants should appear across a small sample.
    expect(variants.size).toBeGreaterThanOrEqual(2);
  });

  it('tolerates missing id or name', () => {
    expect(getProductVariant('', 'Name')).toBeGreaterThanOrEqual(0);
    expect(getProductVariant('', 'Name')).toBeLessThan(4);
    expect(getProductVariant('id', '')).toBeGreaterThanOrEqual(0);
    expect(getProductVariant('id', '')).toBeLessThan(4);
  });
});

describe('GET_PRODUCT_VARIANT_JS', () => {
  it('injects a runnable browser function that matches the server result', () => {
    expect(GET_PRODUCT_VARIANT_JS).toContain('function getProductVariant');
    const fn = new Function(GET_PRODUCT_VARIANT_JS + '; return getProductVariant;')();
    expect(fn('p1', 'OG Kush')).toBe(getProductVariant('p1', 'OG Kush'));
    expect(fn('', 'Name')).toBe(getProductVariant('', 'Name'));
    expect(fn('p1', 'OG Kush')).toBeGreaterThanOrEqual(0);
    expect(fn('p1', 'OG Kush')).toBeLessThan(4);
  });
});

describe('placeholder variant overlays', () => {
  it('provides a distinct overlay for every variant 0-3', () => {
    const shapes = new Set<string>();
    for (let v = 0; v < 4; v++) {
      const overlay = getPlaceholderVariantOverlay(v);
      expect(overlay, `variant ${v}`).toContain('<svg');
      expect(overlay, `variant ${v}`).toContain('</svg>');
      expect(overlay, `variant ${v}`).toContain('variant-overlay-shape');
      shapes.add(overlay);
    }
    expect(shapes.size).toBe(4);
  });

  it('overlays use currentColor for category-aware coloring', () => {
    for (const [v, overlay] of Object.entries(PLACEHOLDER_VARIANT_OVERLAYS)) {
      if (!overlay) continue;
      expect(overlay, `variant ${v}`).toContain('currentColor');
    }
  });

  it('returns variant 0 as the fallback for invalid variants', () => {
    const v0 = getPlaceholderVariantOverlay(0);
    expect(getPlaceholderVariantOverlay(99)).toBe(v0);
    expect(getPlaceholderVariantOverlay(-1)).toBe(v0);
  });
});

describe('GET_PLACEHOLDER_VARIANT_OVERLAY_JS', () => {
  it('injects a runnable browser variable matching the server map', () => {
    expect(GET_PLACEHOLDER_VARIANT_OVERLAY_JS).toContain('PLACEHOLDER_VARIANT_OVERLAYS');
    const ctx = new Function(GET_PLACEHOLDER_VARIANT_OVERLAY_JS + '; return PLACEHOLDER_VARIANT_OVERLAYS;')();
    expect(ctx[0]).toBe(PLACEHOLDER_VARIANT_OVERLAYS[0]);
    expect(ctx[1]).toBe(PLACEHOLDER_VARIANT_OVERLAYS[1]);
    expect(ctx[2]).toBe(PLACEHOLDER_VARIANT_OVERLAYS[2]);
    expect(ctx[3]).toBe(PLACEHOLDER_VARIANT_OVERLAYS[3]);
  });
});

describe('GET_PLACEHOLDER_OVERLAY_COLORS_JS', () => {
  it('injects a runnable browser map of category accent colors', () => {
    expect(GET_PLACEHOLDER_OVERLAY_COLORS_JS).toContain('PLACEHOLDER_OVERLAY_COLORS');
    const ctx = new Function(GET_PLACEHOLDER_OVERLAY_COLORS_JS + '; return PLACEHOLDER_OVERLAY_COLORS;')();
    expect(ctx.flower).toBe(PLACEHOLDER_OVERLAY_COLORS.flower);
    expect(ctx.edibles).toBe(PLACEHOLDER_OVERLAY_COLORS.edibles);
    expect(ctx.flower).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('getPlaceholderIconSvg', () => {
  it('embeds the category color into the placeholder SVG', () => {
    const svg = getPlaceholderIconSvg('flower', 1);
    expect(svg).toContain('class="placeholder-icon"');
    expect(svg).toContain('style="color:#4ade80"');
  });

  it('returns the bare category icon for variant 0', () => {
    const svg = getPlaceholderIconSvg('edibles', 0);
    expect(svg).toContain('class="placeholder-icon"');
    expect(svg).toContain('style="color:#fbbf24"');
    expect(svg).not.toContain('variant-decor');
  });

  it('is deterministic for the same category and variant', () => {
    expect(getPlaceholderIconSvg('concentrates', 2)).toBe(getPlaceholderIconSvg('concentrates', 2));
  });

  it('falls back to generic for unknown categories', () => {
    const svg = getPlaceholderIconSvg('unknown', 3);
    expect(svg).toContain('style="color:#34d399"');
  });
});

describe('GET_PLACEHOLDER_ICON_SVG_JS', () => {
  it('injects a runnable browser function that matches the server result', () => {
    expect(GET_PLACEHOLDER_ICON_SVG_JS).toContain('function getPlaceholderIconSvg');
    const fn = new Function('PLACEHOLDER_ICON_SVGS', GET_PLACEHOLDER_ICON_SVG_JS + '; return getPlaceholderIconSvg;')(PLACEHOLDER_ICON_SVGS);
    expect(fn('flower', 1)).toBe(getPlaceholderIconSvg('flower', 1));
    expect(fn('flower', 0)).toBe(getPlaceholderIconSvg('flower', 0));
    expect(fn('unknown', 3)).toBe(getPlaceholderIconSvg('unknown', 3));
  });
});
