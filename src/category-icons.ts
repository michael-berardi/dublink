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
const STROKE_ICON_ATTRS = `${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"`;
const PREROLL_ICON_ATTRS = `${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;

export const CATEGORY_ICON_SVGS: Record<string, string> = {
  flower:
    `<svg ${STROKE_ICON_ATTRS}><circle cx="8.2" cy="9.1" r="2.5"/><circle cx="15.6" cy="9.3" r="2.5"/><circle cx="12" cy="6.2" r="2.7"/><path d="M6.7 11.2c.1 3.8 2 6.6 5.3 8.8 3.4-2.2 5.2-5.1 5.3-8.8M12 10v10M9.1 13.2l2.9 2.2 2.9-2.2"/></svg>`,
  edibles:
    `<svg ${STROKE_ICON_ATTRS}><rect x="6.5" y="7.5" width="11" height="9" rx="3"/><path d="m6.5 9-3-2.5.7 4-2 1.5 2 1.5-.7 4 3-2.5M17.5 9l3-2.5-.7 4 2 1.5-2 1.5.7 4-3-2.5M10 10.5h4M9.5 13.5h5"/></svg>`,
  beverages:
    `<svg ${STROKE_ICON_ATTRS}><path d="M9 3h6l.8 3.2c.1.4.2.8.2 1.2V20a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7.4c0-.4.1-.8.2-1.2L9 3Z"/><path d="M8.4 8h7.2M8.4 17h7.2M10.5 11.5h3"/></svg>`,
  concentrates:
    `<svg ${STROKE_ICON_ATTRS}><path d="M5 7.5 13 3l6 5-2 10-9 3-5-7 2-6.5Z"/><path d="m5 7.5 7 5L19 8m-7 4.5L8 21m4-8.5 5 5.5"/></svg>`,
  prerolls:
    `<svg ${PREROLL_ICON_ATTRS}><path d="m18.8 3.2-2.2 4.2L7.2 20l-3.4.8.7-3.5L17 7.9l1.8-4.7Z"/><path d="m14.8 9.5 2.7 2M4.5 17.3l2.7 2M18.8 3.2l1.8-.8-.7 1.8"/></svg>`,
  vapes:
    `<svg ${STROKE_ICON_ATTRS}><path d="M10 2.5h4v3h-4zM8.5 5.5h7v6.8h-7zM9 9.5h6M8 12.3h8V20a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 20v-7.7Z"/><circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none"/></svg>`,
  topicals:
    `<svg ${STROKE_ICON_ATTRS}><path d="M8 3h8l1.5 15H6.5L8 3ZM6.5 18h11v3h-11zM9.5 8.5h5M10.5 11.5h3"/></svg>`,
  tinctures:
    `<svg ${STROKE_ICON_ATTRS}><path d="M9 2.5h6v3H9zM10 5.5h4v3l2 2V20a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 20v-9.5l2-2v-3Z"/><path d="M8.5 12h7M12 14.5c-1.2 1.4-1.8 2.4-1.8 3.1a1.8 1.8 0 1 0 3.6 0c0-.7-.6-1.7-1.8-3.1Z"/></svg>`,
  cbd:
    `<svg ${STROKE_ICON_ATTRS}><path d="M12 2.8c3.1 4 4.7 7.1 4.7 9.4a4.7 4.7 0 1 1-9.4 0c0-2.3 1.6-5.4 4.7-9.4Z"/><path d="M12 17.5v-6M12 13.5c-1.4-.2-2.5-1.1-3-2.4M12 12.2c1.4-.2 2.5-1.1 3-2.4"/></svg>`,
  accessories:
    `<svg ${STROKE_ICON_ATTRS}><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.2"/><path d="M12 3.5v3m0 11v3M3.5 12h3m11 0h3M6 6l2.2 2.2m7.6 7.6L18 18m0-12-2.2 2.2m-7.6 7.6L6 18"/></svg>`,
  seedling:
    `<svg ${STROKE_ICON_ATTRS}><path d="M12 21V9M12 13c-4.2 0-7-2.3-7-6.5 4.2 0 7 2.3 7 6.5ZM12 16c4.2 0 7-2.3 7-6.5-4.2 0-7 2.3-7 6.5ZM7 21h10"/></svg>`,
  other:
    `<svg ${STROKE_ICON_ATTRS}><path d="M5 6h14v14H5zM5 10h14M9 6v14"/><path d="M12.5 13.5h3M12.5 16.5h2"/></svg>`,
  generic:
    `<svg ${STROKE_ICON_ATTRS}><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>`,
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
