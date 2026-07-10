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
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M12 3c3.8 1.9 6.2 4.9 6.2 8.1 0 3.5-2.5 6.5-6.2 8.4-3.7-1.9-6.2-4.9-6.2-8.4C5.8 7.9 8.2 4.9 12 3Zm0 3.2c-.8 1.6-1.2 3.1-1.2 4.7s.4 3.1 1.2 4.6c.8-1.5 1.2-3 1.2-4.6S12.8 7.8 12 6.2Z"/></svg>`,
  edibles:
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M7.3 8.2h9.4c1.1 0 2 .9 2 2v3.6c0 1.1-.9 2-2 2H7.3c-1.1 0-2-.9-2-2v-3.6c0-1.1.9-2 2-2Zm-3.1.2L2.2 6.6c-.5-.5-.1-1.4.6-1.3l3.1.5a3.7 3.7 0 0 0-1.7 2.6Zm0 7.2a3.7 3.7 0 0 0 1.7 2.6l-3.1.5c-.7.1-1.1-.8-.6-1.3l2-1.8Zm15.6 0 2 1.8c.5.5.1 1.4-.6 1.3l-3.1-.5a3.7 3.7 0 0 0 1.7-2.6Zm0-7.2a3.7 3.7 0 0 0-1.7-2.6l3.1-.5c.7-.1 1.1.8.6 1.3l-2 1.8Z"/></svg>`,
  beverages:
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M9 2h6l.8 3.2c.1.4.2.8.2 1.2V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V6.4c0-.4.1-.8.2-1.2L9 2Zm.9 6v8h4.2V8H9.9Z"/></svg>`,
  concentrates:
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M7 5.5C7 4.1 8.1 3 9.5 3h5C15.9 3 17 4.1 17 5.5V7H7V5.5Zm-1 4h12l-1 9.2A2.5 2.5 0 0 1 14.5 21h-5A2.5 2.5 0 0 1 7 18.7L6 9.5Zm3.2 3.6c1 .7 2 .9 3 .6 1.2-.3 2-.2 2.6.4.5-1.3-.4-2.7-1.9-2.7-1.2 0-2.1.8-3.7 1.7Z"/></svg>`,
  prerolls:
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M18.8 3.2c.6-.6 1.6-.2 1.5.7l-.5 4.1L7.4 20.4c-.9.9-2.3.9-3.2 0l-.6-.6c-.9-.9-.9-2.3 0-3.2L16 4.2l2.8-1Zm-3 4.1L5.3 17.8l.9.9L16.7 8.2l-.9-.9Z"/></svg>`,
  vapes:
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M9.5 2h5c.8 0 1.5.7 1.5 1.5V7h-8V3.5C8 2.7 8.7 2 9.5 2Zm-1 6.5h7A1.5 1.5 0 0 1 17 10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V10c0-.8.7-1.5 1.5-1.5Zm2.2 3.2v6.6h2.6v-6.6h-2.6Z"/></svg>`,
  topicals:
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M8 3h8v3H8V3Zm-1 4h10l-1 12.2A3 3 0 0 1 13 22h-2a3 3 0 0 1-3-2.8L7 7Zm3.2 5v2h3.6v-2h-3.6Z"/></svg>`,
  tinctures:
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M9 2h6v4H9V2Zm1 5h4v2.2l2.4 2.4a2 2 0 0 1 .6 1.4v6.5A2.5 2.5 0 0 1 14.5 22h-5A2.5 2.5 0 0 1 7 19.5V13c0-.5.2-1 .6-1.4L10 9.2V7Zm2 6.1c-1.4 1.6-2.1 2.9-2.1 4A2.1 2.1 0 0 0 12 19.2a2.1 2.1 0 0 0 2.1-2.1c0-1.1-.7-2.4-2.1-4Z"/></svg>`,
  cbd:
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M12 3c2.9 2.4 4.4 5 4.4 7.6 0 2.9-1.7 5.1-4.4 6.5-2.7-1.4-4.4-3.6-4.4-6.5C7.6 8 9.1 5.4 12 3Zm0 14.2c2 1.1 3.3 2.4 3.9 3.8H8.1c.6-1.4 1.9-2.7 3.9-3.8Z"/></svg>`,
  accessories:
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M7 5h10a2 2 0 0 1 2 2v2.2a7 7 0 1 1-14 0V7a2 2 0 0 1 2-2Zm1.5 4.2a3.5 3.5 0 0 0 7 0H8.5ZM12 13a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3Z"/></svg>`,
  seedling:
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M11 21v-7.2C7.7 13.4 5 10.6 5 7.2V5h2.2c2.2 0 4.1 1.2 5 3 1-1.8 2.8-3 5-3H19v2.2c0 3.4-2.7 6.2-6 6.6V21h-2Z"/></svg>`,
  other:
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M6 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm2 3v6h8V9H8Z"/></svg>`,
  generic:
    `<svg ${SVG_ATTRS}><path fill="currentColor" d="M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2 3v2h8V8H8Zm0 4v4h8v-4H8Z"/></svg>`,
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
  { type: 'concentrates', needles: ['concentrate', 'extract', 'wax', 'shatter', 'resin', 'rosin', 'oil', 'dab', 'sauce', 'badder', 'crumble', 'diamond', 'distillate', 'kief', 'bubble hash'] },
  { type: 'prerolls', needles: ['pre-roll', 'preroll', 'pre roll', 'joint', 'cone', 'blunt'] },
  { type: 'vapes', needles: ['vape', 'vaporizer', 'cartridge', 'cart', 'disposable', 'aio', '510', 'pen'] },
  { type: 'topicals', needles: ['topical', 'cream', 'balm', 'lotion', 'salve', 'transdermal', 'patch'] },
  { type: 'tinctures', needles: ['tincture', 'sublingual', 'drop', 'spray', 'elixir'] },
  { type: 'accessories', needles: ['accessory', 'accessories', 'battery', 'paper', 'grinder', 'pipe', 'bong', 'rig', 'tool', 'gear', 'lighter', 'apparel'] },
  { type: 'seedling', needles: ['seed', 'clone', 'seedling', 'cutting', 'rooted clone', 'plant start'] },
];

function matchesCategoryNeedle(name: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}(?:s)?(?=$|[^a-z0-9])`, 'i').test(name);
}

export function getCategoryType(name: string): string {
  const n = (name || '').toLowerCase();
  for (const { type, needles } of CATEGORY_NEEDLES) {
    if (needles.some((needle) => matchesCategoryNeedle(n, needle))) return type;
  }
  return 'other';
}

// Self-contained JavaScript source for the shared category detector so it can
// be injected into the inline browser scripts of html-menu and html-tv without
// duplicating the needle list or logic.
export const GET_CATEGORY_TYPE_JS = `function matchesCategoryNeedle(name,needle){
  var escaped=needle.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&');
  return new RegExp('(^|[^a-z0-9])'+escaped+'(?:s)?(?=$|[^a-z0-9])','i').test(name);
}
function getCategoryType(name){
  var n=(name||'').toLowerCase();
  var NEEDLES=${JSON.stringify(CATEGORY_NEEDLES)};
  for(var i=0;i<NEEDLES.length;i++){
    var needles=NEEDLES[i].needles;
    for(var j=0;j<needles.length;j++){
      if(matchesCategoryNeedle(n,needles[j]))return NEEDLES[i].type;
    }
  }
  return 'other';
}`;
