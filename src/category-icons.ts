// Clean, product-realistic category icon system for DubMenu.
// All icons are inline SVGs using only currentColor. No gradients, filters,
// glows, or decorative overlays. Category icons are 24x24; placeholder icons are
// 100x100 product-image fallbacks shown when a product image is missing.

export const CATEGORY_LABELS: Record<string, string> = {
  flower: 'Flower',
  edibles: 'Edibles',
  beverages: 'Beverages',
  concentrates: 'Concentrates',
  prerolls: 'Pre-Rolls',
  vapes: 'Vapes',
  topicals: 'Topicals',
  tinctures: 'Tinctures',
  cbd: 'CBD',
  accessories: 'Accessories',
  seedling: 'Clones/Plants',
  other: 'Other',
  generic: 'Product',
};

// Shared SVG wrapper attributes for accessibility and rendering consistency.
const SVG_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false"';
const PLACEHOLDER_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" class="placeholder-icon"';

export const CATEGORY_ICON_SVGS: Record<string, string> = {
  flower:
    `<svg ${SVG_ATTRS}><path d="M12 20v-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 17c-4-2-6.5-5.5-6.5-9.5 0-2.5 2.5-4.5 6.5-4.5s6.5 2 6.5 4.5c0 4-2.5 7.5-6.5 9.5z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 6c-1 2-1 4.5 0 6.5M15 6c1 2 1 4.5 0 6.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/><path d="M10.5 5c-0.5 2-0.5 4 0 6M13.5 5c0.5 2 0.5 4 0 6" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/></svg>`,
  edibles:
    `<svg ${SVG_ATTRS}><rect x="6" y="8" width="12" height="8" rx="1.5" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="1.5"/><path d="M6 9l-2-2M6 15l-2 2M18 9l2-2M18 15l2 2" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/><path d="M10 12h4" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/></svg>`,
  beverages:
    `<svg ${SVG_ATTRS}><path d="M8 3h8l1 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5l1-2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M11 4h2v2h-2z" fill="currentColor" opacity="0.3"/></svg>`,
  concentrates:
    `<svg ${SVG_ATTRS}><rect x="7" y="3" width="10" height="4" rx="1" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5"/><path d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 12c1 1 3 1.5 4.5 1s3-0.5 3.5-1" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/></svg>`,
  prerolls:
    `<svg ${SVG_ATTRS}><path d="M19 4L7 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 4l-2 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/><path d="M7 20c-1 1-2 1-2.5 0.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/></svg>`,
  vapes:
    `<svg ${SVG_ATTRS}><rect x="8" y="7" width="8" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 7V3.5c0-1 0.5-1.5 1.5-1.5h3c1 0 1.5 0.5 1.5 1.5V7" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><rect x="10" y="10" width="4" height="6" rx="0.5" fill="currentColor" opacity="0.15"/></svg>`,
  topicals:
    `<svg ${SVG_ATTRS}><path d="M7 5h10l-1 15a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2L7 5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 5h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 5V3h6v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 12h4" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/></svg>`,
  tinctures:
    `<svg ${SVG_ATTRS}><path d="M9 2h6v5h-6z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 2V1h2v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 8h8l-1 12a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2L8 8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 10v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/><circle cx="12" cy="18" r="1" fill="currentColor" opacity="0.3"/></svg>`,
  cbd:
    `<svg ${SVG_ATTRS}><path d="M12 21c0-3-1.5-5.5-4-7.5 2.5-1 4-3.5 4-6.5 0 3 1.5 5.5 4 6.5-2.5 2-4 4.5-4 7.5z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 9c-1 1.5-1 3 0 4.5M16 9c1 1.5 1 3 0 4.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/></svg>`,
  accessories:
    `<svg ${SVG_ATTRS}><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/></svg>`,
  seedling:
    `<svg ${SVG_ATTRS}><path d="M12 20V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 10c-3 0-5-2-5-5 2.5 0 4 1.5 5 4 1-2.5 2.5-4 5-4 0 3-2 5-5 5z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 21h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  other:
    `<svg ${SVG_ATTRS}><rect x="5" y="7" width="14" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 10h14M12 7v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  generic:
    `<svg ${SVG_ATTRS}><rect x="6" y="6" width="12" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="6" y="10" width="12" height="4" fill="currentColor" opacity="0.15"/><path d="M9 9h6" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>`,
};

export const PLACEHOLDER_ICON_SVGS: Record<string, string> = {
  flower:
    `<svg ${PLACEHOLDER_ATTRS}><path d="M50 88V73" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/><path d="M50 73c-14-7-24-20-28-34 9-2 18 3 24 11 6-8 15-13 24-11-4 14-14 27-28 34z" fill="currentColor" opacity="0.18" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M38 55l4-6 6 6 6-6 4 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`,
  edibles:
    `<svg ${PLACEHOLDER_ATTRS}><rect x="28" y="34" width="44" height="32" rx="3" fill="currentColor" opacity="0.12" stroke="currentColor" stroke-width="2"/><path d="M28 40l-6-6M28 60l-6 6M72 40l6-6M72 60l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/><path d="M42 50h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/></svg>`,
  beverages:
    `<svg ${PLACEHOLDER_ATTRS}><path d="M32 16h36l5 8v50a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6V24l5-8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M30 30h40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M46 18h8v6h-8z" fill="currentColor" opacity="0.3"/></svg>`,
  concentrates:
    `<svg ${PLACEHOLDER_ATTRS}><rect x="32" y="14" width="36" height="14" rx="2" fill="currentColor" opacity="0.18" stroke="currentColor" stroke-width="2"/><path d="M28 30h44l-4 40a4 4 0 0 1-4 4H36a4 4 0 0 1-4-4L28 30z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M36 48c3 3 8 4 12 4s9-1 12-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/></svg>`,
  prerolls:
    `<svg ${PLACEHOLDER_ATTRS}><path d="M72 22L26 78" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><path d="M72 22l-7 5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/><path d="M26 78c-3 3-6 3-8 1" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.5"/></svg>`,
  vapes:
    `<svg ${PLACEHOLDER_ATTRS}><rect x="34" y="28" width="32" height="54" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M36 28V16c0-2 1-3 3-3h12c2 0 3 1 3 3v12" fill="currentColor" opacity="0.18" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="40" y="40" width="20" height="26" rx="3" fill="currentColor" opacity="0.12"/></svg>`,
  topicals:
    `<svg ${PLACEHOLDER_ATTRS}><path d="M28 22h44l-5 50a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6L28 22z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M24 22h52" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M36 22V16h28v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 50h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/></svg>`,
  tinctures:
    `<svg ${PLACEHOLDER_ATTRS}><path d="M38 8h24v20H38z" fill="currentColor" opacity="0.18" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M44 8V4h12v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 30h36l-4 46a4 4 0 0 1-4 4H40a4 4 0 0 1-4-4L32 30z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M50 34v22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/><circle cx="50" cy="68" r="5" fill="currentColor" opacity="0.25"/></svg>`,
  cbd:
    `<svg ${PLACEHOLDER_ATTRS}><path d="M50 86c0-12-6-22-16-30 10-3 16-10 16-20 0 10 6 17 16 20-10 8-16 18-16 30z" fill="currentColor" opacity="0.22" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M34 38c-2 4-2 8 0 12M66 38c2 4 2 8 0 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/></svg>`,
  accessories:
    `<svg ${PLACEHOLDER_ATTRS}><circle cx="50" cy="50" r="24" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M30 30l40 40M70 30L30 70" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/></svg>`,
  seedling:
    `<svg ${PLACEHOLDER_ATTRS}><path d="M50 85V45" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/><path d="M50 45c-12 0-20-8-20-20 10 0 16 6 20 16 4-10 10-16 20-16 0 12-8 20-20 20z" fill="currentColor" opacity="0.22" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M15 88h70" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  other:
    `<svg ${PLACEHOLDER_ATTRS}><rect x="25" y="30" width="50" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M25 40h50M50 30v40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  generic:
    `<svg ${PLACEHOLDER_ATTRS}><rect x="28" y="28" width="44" height="44" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><rect x="28" y="44" width="44" height="14" fill="currentColor" opacity="0.15"/><path d="M40 38h20" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/></svg>`,
};

const CATEGORY_NEEDLES: { type: string; needles: string[] }[] = [
  { type: 'cbd', needles: ['cbd'] },
  { type: 'flower', needles: ['flower', 'bud', 'strain', 'whole flower', 'ground flower', 'smalls', 'popcorn'] },
  { type: 'beverages', needles: ['beverage', 'drink', 'soda', 'seltzer', 'tonic', 'refreshment'] },
  { type: 'edibles', needles: ['edible', 'gummy', 'gummies', 'candy', 'chocolate', 'baked', 'munchie', 'chew', 'cookie', 'brownie', 'mint', 'snack'] },
  { type: 'concentrates', needles: ['concentrate', 'extract', 'wax', 'shatter', 'resin', 'rosin', 'oil', 'dab', 'sauce', 'badder', 'crumble', 'live', 'diamond', 'distillate', 'kief', 'bubble hash'] },
  { type: 'prerolls', needles: ['pre-roll', 'preroll', 'pre roll', 'joint', 'cone', 'blunt'] },
  { type: 'vapes', needles: ['vape', 'vaporizer', 'cartridge', 'cart', 'disposable', 'aio', '510', 'pen'] },
  { type: 'topicals', needles: ['topical', 'cream', 'balm', 'lotion', 'salve', 'transdermal', 'patch'] },
  { type: 'tinctures', needles: ['tincture', 'sublingual', 'drop', 'spray', 'elixir'] },
  { type: 'accessories', needles: ['accessor', 'battery', 'paper', 'grinder', 'pipe', 'bong', 'rig', 'tool', 'gear', 'lighter', 'apparel'] },
  { type: 'seedling', needles: ['seed', 'clone', 'seedling', 'cutting', 'root', 'clone', 'plant start'] },
];

export function getCategoryType(name: string): string {
  const n = (name || '').toLowerCase();
  for (const { type, needles } of CATEGORY_NEEDLES) {
    if (needles.some((needle) => n.includes(needle))) return type;
  }
  return 'other';
}

// Self-contained JavaScript source for the shared category detector so it can
// be injected into the inline browser scripts of html-menu and html-tv without
// duplicating the needle list or logic.
export const GET_CATEGORY_TYPE_JS = `function getCategoryType(name){
  var n=(name||'').toLowerCase();
  var NEEDLES=${JSON.stringify(CATEGORY_NEEDLES)};
  for(var i=0;i<NEEDLES.length;i++){
    var needles=NEEDLES[i].needles;
    for(var j=0;j<needles.length;j++){
      if(n.indexOf(needles[j])!==-1)return NEEDLES[i].type;
    }
  }
  return 'other';
}`;

// Deterministic product-level visual variant for placeholder icons. Kept for
// backward compatibility, but the new placeholders do not apply decorative
// overlays; variants only affect subtle CSS transforms if the consumer chooses.
export function getProductVariant(id: string, name: string): number {
  const s = String(id || '') + ':' + String(name || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 4;
}

export const GET_PRODUCT_VARIANT_JS = `function getProductVariant(id,name){
  var s=String(id||'')+':'+String(name||'');
  var h=0;
  for(var i=0;i<s.length;i++){
    h=(h*31+s.charCodeAt(i))|0;
  }
  return Math.abs(h)%4;
}`;

// Returns the clean placeholder SVG for a product category. No inline colors,
// gradients, or overlays; the SVG uses currentColor so the surrounding CSS
// controls the icon color.
export function getPlaceholderIconSvg(type: string, _variant: number): string {
  return PLACEHOLDER_ICON_SVGS[type] || PLACEHOLDER_ICON_SVGS.generic;
}

export const GET_PLACEHOLDER_ICON_SVG_JS = `function getPlaceholderIconSvg(type,v){
  var PLACEHOLDER_ICON_SVGS=${JSON.stringify(PLACEHOLDER_ICON_SVGS)};
  return PLACEHOLDER_ICON_SVGS[type]||PLACEHOLDER_ICON_SVGS.generic;
}`;