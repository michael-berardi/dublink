import { describe, it, expect } from 'vitest';
import { getCategoryType, GET_CATEGORY_TYPE_JS, CATEGORY_ICON_SVGS, PLACEHOLDER_ICON_SVGS } from '../src/category-icons';

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
