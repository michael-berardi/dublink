import { describe, it, expect } from 'vitest';
import { getCategoryType, GET_CATEGORY_TYPE_JS, CATEGORY_ICON_SVGS, PLACEHOLDER_ICON_SVGS, CATEGORY_LABELS, getProductVariant, GET_PRODUCT_VARIANT_JS, getPlaceholderIconSvg, GET_PLACEHOLDER_ICON_SVG_JS } from '../src/category-icons';

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
    expect(getCategoryType('Beverages')).toBe('beverages');
    expect(getCategoryType('Drinks')).toBe('beverages');
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
    expect(fn('Soda')).toBe('beverages');
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
    expect(keys).toContain('beverages');
    expect(keys).toContain('concentrates');
    expect(keys).toContain('prerolls');
    expect(keys).toContain('vapes');
    expect(keys).toContain('topicals');
    expect(keys).toContain('tinctures');
    expect(keys).toContain('cbd');
    expect(keys).toContain('accessories');
    expect(keys).toContain('seedling');
    expect(keys).toContain('other');
    expect(keys).toContain('generic');
  });

  it('rejects gradient, filter, and glow-style artifacts', () => {
    const artifacts = ['linearGradient', 'radialGradient', 'filter', 'drop-shadow', 'box-shadow'];
    for (const [key, svg] of Object.entries(CATEGORY_ICON_SVGS)) {
      for (const artifact of artifacts) {
        expect(svg, `${key} category icon should not contain ${artifact}`).not.toContain(artifact);
      }
    }
    for (const [key, svg] of Object.entries(PLACEHOLDER_ICON_SVGS)) {
      for (const artifact of artifacts) {
        expect(svg, `${key} placeholder icon should not contain ${artifact}`).not.toContain(artifact);
      }
    }
  });

  it('rejects inline style attributes and explicit color values', () => {
    // Only currentColor should drive color; no inline styles or hex/rgb fills.
    for (const [key, svg] of Object.entries(CATEGORY_ICON_SVGS)) {
      expect(svg, `${key} category icon`).not.toMatch(/style\s*=/);
      expect(svg, `${key} category icon`).not.toMatch(/fill\s*=\s*"#[0-9a-fA-F]{3,6}"/);
      expect(svg, `${key} category icon`).not.toMatch(/stroke\s*=\s*"#[0-9a-fA-F]{3,6}"/);
      expect(svg, `${key} category icon`).not.toMatch(/fill\s*=\s*"rgb\(/);
      expect(svg, `${key} category icon`).not.toMatch(/stroke\s*=\s*"rgb\(/);
    }
    for (const [key, svg] of Object.entries(PLACEHOLDER_ICON_SVGS)) {
      // Placeholder wrappers carry the required class attribute, but no inline styles.
      expect(svg, `${key} placeholder icon`).not.toMatch(/style\s*=/);
      expect(svg, `${key} placeholder icon`).not.toMatch(/fill\s*=\s*"#[0-9a-fA-F]{3,6}"/);
      expect(svg, `${key} placeholder icon`).not.toMatch(/stroke\s*=\s*"#[0-9a-fA-F]{3,6}"/);
      expect(svg, `${key} placeholder icon`).not.toMatch(/fill\s*=\s*"rgb\(/);
      expect(svg, `${key} placeholder icon`).not.toMatch(/stroke\s*=\s*"rgb\(/);
    }
  });

  it('keeps stroke widths within a consistent, premium range', () => {
    for (const [key, svg] of Object.entries(CATEGORY_ICON_SVGS)) {
      const matches = svg.matchAll(/stroke-width="([0-9.]+)"/g);
      for (const m of matches) {
        const w = parseFloat(m[1]);
        expect(w, `${key} category icon stroke-width`).toBeGreaterThanOrEqual(1);
        expect(w, `${key} category icon stroke-width`).toBeLessThanOrEqual(2.5);
      }
    }
    for (const [key, svg] of Object.entries(PLACEHOLDER_ICON_SVGS)) {
      const matches = svg.matchAll(/stroke-width="([0-9.]+)"/g);
      for (const m of matches) {
        const w = parseFloat(m[1]);
        expect(w, `${key} placeholder icon stroke-width`).toBeGreaterThanOrEqual(1.5);
        expect(w, `${key} placeholder icon stroke-width`).toBeLessThanOrEqual(7);
      }
    }
  });

  it('keeps only product-realistic icon shapes for important categories', () => {
    // Each icon must have enough path/rect/circle geometry to be recognizable.
    for (const key of Object.keys(CATEGORY_LABELS)) {
      const svg = CATEGORY_ICON_SVGS[key];
      expect(svg, `${key} category icon`).toBeTruthy();
      expect(svg, `${key} category icon`).toMatch(/<path|<rect|<circle|<ellipse/);
      expect(svg, `${key} category icon`).toContain('</svg>');
    }
    for (const key of Object.keys(CATEGORY_LABELS)) {
      const svg = PLACEHOLDER_ICON_SVGS[key] || PLACEHOLDER_ICON_SVGS.generic;
      expect(svg, `${key} placeholder icon`).toBeTruthy();
      expect(svg, `${key} placeholder icon`).toMatch(/<path|<rect|<circle|<ellipse/);
      expect(svg, `${key} placeholder icon`).toContain('</svg>');
    }
  });

  it('avoids smiley-face or mascot geometry in edibles icon', () => {
    const svg = CATEGORY_ICON_SVGS.edibles;
    const circleCount = (svg.match(/<circle/g) || []).length;
    // Smiley faces rely on paired eye circles; product-realistic edibles uses at most one highlight.
    expect(circleCount).toBeLessThanOrEqual(1);
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

describe('getPlaceholderIconSvg', () => {
  it('returns a clean currentColor placeholder SVG without inline color styles', () => {
    const svg = getPlaceholderIconSvg('flower', 1);
    expect(svg).toContain('class="placeholder-icon"');
    expect(svg).not.toContain('style="color:');
    expect(svg).not.toContain('linearGradient');
    expect(svg).toContain('currentColor');
  });

  it('returns the bare category icon for variant 0', () => {
    const svg = getPlaceholderIconSvg('edibles', 0);
    expect(svg).toContain('class="placeholder-icon"');
    expect(svg).not.toContain('style="color:');
    expect(svg).not.toContain('variant-decor');
  });

  it('is deterministic for the same category and variant', () => {
    expect(getPlaceholderIconSvg('concentrates', 2)).toBe(getPlaceholderIconSvg('concentrates', 2));
  });

  it('falls back to generic for unknown categories', () => {
    const svg = getPlaceholderIconSvg('unknown', 3);
    expect(svg).toContain('class="placeholder-icon"');
    expect(svg).toContain('currentColor');
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
