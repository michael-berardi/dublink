// Premium monochrome category icon system for DubMenu.
// All icons are inline SVGs that use `currentColor` so they inherit the
// surrounding text color. This keeps them crisp, theme-agnostic, and free of
// layout shift. Placeholder icons are larger branded fallbacks shown when a
// product image is missing or fails to load.

export const CATEGORY_LABELS: Record<string, string> = {
  flower: 'Flower',
  edibles: 'Edibles',
  concentrates: 'Concentrates',
  prerolls: 'Pre-Rolls',
  vapes: 'Vapes',
  topicals: 'Topicals',
  tinctures: 'Tinctures',
  cbd: 'CBD',
  accessories: 'Accessories',
  other: 'Other',
  generic: 'Product',
};

// Shared SVG wrapper attributes for accessibility and rendering consistency.
const SVG_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false"';
const PLACEHOLDER_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" class="placeholder-icon"';

export const CATEGORY_ICON_SVGS: Record<string, string> = {
  flower:
    `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4-2-7-6-7-11 0-3 2-6 5-6s5 3 5 6c0 5-3 9-7 11z"/><path d="M12 11c-2.5-1.5-4-4-4-7 0-2 1.5-3.5 4-3.5s4 1.5 4 3.5c0 3-1.5 5.5-4 7z" opacity="0.6"/><path d="M12 11c2.5-1.5 4-4 4-7" opacity="0.35"/></svg>`,
  edibles:
    `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7.5"/><circle cx="9.5" cy="10" r="1.25" fill="currentColor"/><circle cx="14.5" cy="10" r="1.25" fill="currentColor"/><path d="M8.5 15c1.5 1.25 4.5 1.25 6 0" opacity="0.7"/></svg>`,
  concentrates:
    `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8.5 6.5L12 19 3.5 9.5z"/><path d="M12 8.5l4.5 3.5L12 15.5 7.5 12z" opacity="0.5"/><path d="M12 8.5V15" opacity="0.35"/></svg>`,
  prerolls:
    `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L20 4" stroke-width="3.5"/><circle cx="5" cy="19" r="2.5" fill="currentColor"/></svg>`,
  vapes:
    `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="16" rx="3"/><rect x="9.5" y="18" width="5" height="3" rx="1" fill="currentColor" opacity="0.85"/><circle cx="12" cy="9" r="1.5" fill="currentColor" opacity="0.5"/></svg>`,
  topicals:
    `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4.5 0-8 3.5-8 8 0 3.5 2.5 6.5 6 7.5v3h4v-3c3.5-1 6-4 6-7.5 0-4.5-3.5-8-8-8z"/><path d="M12 7v5" opacity="0.6"/></svg>`,
  tinctures:
    `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6v4H9z"/><path d="M8 7h8l-1 12a2.5 2.5 0 0 1-5 0L8 7z"/><path d="M12 11v5" opacity="0.6"/></svg>`,
  cbd:
    `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c0-4-3-7-6-8 3-1 6-4 6-8 0 4 3 7 6 8-3 1-6 4-6 8z"/><path d="M12 6c-1.5 1.5-2 3-2 5s1 4 2 5c1.5-1 2-3 2-5s-1-4-2-5z" opacity="0.7"/><path d="M12 9v5" opacity="0.7"/></svg>`,
  accessories:
    `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 5v2M12 17v2M5 12h2M17 12h2"/></svg>`,
  other:
    `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="17.5" cy="12" r="1.5" fill="currentColor"/></svg>`,
  generic:
    `<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c0-4.5-3.5-7.5-6-8.5 3-1 6-4 6-8.5 0 4.5 3 7.5 6 8.5-3 1-6 4-6 8.5z"/><path d="M12 11V5" opacity="0.6"/></svg>`,
};

export const PLACEHOLDER_ICON_SVGS: Record<string, string> = {
  flower:
    `<svg ${PLACEHOLDER_ATTRS} fill="currentColor"><path d="M50 92C50 92 22 70 22 40c0-16 11-26 28-26s28 10 28 26c0 30-28 52-28 52z" opacity="0.85"/><path d="M50 64c8-8 16-16 28-26" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3"/><path d="M50 64c-8-8-16-16-28-26" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3"/></svg>`,
  edibles:
    `<svg ${PLACEHOLDER_ATTRS} fill="currentColor"><circle cx="50" cy="50" r="32" opacity="0.85"/><circle cx="38" cy="42" r="6" opacity="0.25"/><circle cx="62" cy="42" r="6" opacity="0.25"/><path d="M34 60c7 5 21 5 28 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.25"/></svg>`,
  concentrates:
    `<svg ${PLACEHOLDER_ATTRS} fill="currentColor"><path d="M50 12C50 12 80 50 80 68c0 15-12 22-30 22S20 83 20 68c0-18 30-56 30-56z" opacity="0.85"/><path d="M50 34c-8 10-16 24-16 36" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3"/></svg>`,
  prerolls:
    `<svg ${PLACEHOLDER_ATTRS} fill="currentColor"><path d="M28 12h44L58 88H42L28 12z" opacity="0.85"/><rect x="35" y="18" width="30" height="10" rx="2" opacity="0.25"/><path d="M42 36h16" stroke="currentColor" stroke-width="2" opacity="0.25"/></svg>`,
  vapes:
    `<svg ${PLACEHOLDER_ATTRS} fill="currentColor"><rect x="30" y="12" width="40" height="72" rx="14" opacity="0.85"/><rect x="38" y="80" width="24" height="12" rx="4" opacity="0.25"/><circle cx="50" cy="38" r="8" opacity="0.25"/></svg>`,
  topicals:
    `<svg ${PLACEHOLDER_ATTRS} fill="currentColor"><path d="M50 8C28 8 10 26 10 48c0 16 10 32 24 38v4h32v-4c14-6 24-22 24-38C90 26 72 8 50 8z" opacity="0.85"/><circle cx="30" cy="42" r="8" opacity="0.25"/><circle cx="70" cy="58" r="8" opacity="0.25"/></svg>`,
  tinctures:
    `<svg ${PLACEHOLDER_ATTRS} fill="currentColor"><rect x="32" y="8" width="36" height="16" rx="2" opacity="0.85"/><path d="M28 28h44L62 88H38L28 28z" opacity="0.85"/><rect x="42" y="40" width="16" height="28" rx="2" opacity="0.25"/></svg>`,
  cbd:
    `<svg ${PLACEHOLDER_ATTRS} fill="currentColor"><path d="M50 92C50 92 22 70 22 40c0-16 11-26 28-26s28 10 28 26c0 30-28 52-28 52z" opacity="0.85"/><path d="M50 62c10-10 20-18 28-26" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3"/><path d="M50 62c-10-10-20-18-28-26" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3"/></svg>`,
  accessories:
    `<svg ${PLACEHOLDER_ATTRS} fill="currentColor"><circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" stroke-width="6" opacity="0.85"/><circle cx="50" cy="50" r="12" opacity="0.85"/><path d="M50 12v12M50 76v12M12 50h12M76 50h12" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>`,
  other:
    `<svg ${PLACEHOLDER_ATTRS} fill="currentColor"><circle cx="26" cy="50" r="12" opacity="0.85"/><circle cx="50" cy="50" r="12" opacity="0.85"/><circle cx="74" cy="50" r="12" opacity="0.85"/></svg>`,
  generic:
    `<svg ${PLACEHOLDER_ATTRS} fill="currentColor"><circle cx="50" cy="50" r="32" opacity="0.85"/><circle cx="38" cy="38" r="10" opacity="0.25"/><circle cx="62" cy="62" r="10" opacity="0.25"/></svg>`,
};

const CATEGORY_NEEDLES: { type: string; needles: string[] }[] = [
  { type: 'cbd', needles: ['cbd'] },
  { type: 'flower', needles: ['flower', 'bud', 'strain', 'whole flower', 'ground flower', 'smalls', 'popcorn'] },
  { type: 'edibles', needles: ['edible', 'gummy', 'gummies', 'candy', 'chocolate', 'baked', 'munchie', 'chew', 'cookie', 'brownie', 'beverage', 'drink', 'soda', 'mint', 'snack'] },
  { type: 'concentrates', needles: ['concentrate', 'extract', 'wax', 'shatter', 'resin', 'rosin', 'oil', 'dab', 'sauce', 'badder', 'crumble', 'live', 'diamond', 'distillate', 'kief', 'bubble hash'] },
  { type: 'prerolls', needles: ['pre-roll', 'preroll', 'pre roll', 'joint', 'cone', 'blunt'] },
  { type: 'vapes', needles: ['vape', 'vaporizer', 'cartridge', 'cart', 'disposable', 'aio', '510', 'pen'] },
  { type: 'topicals', needles: ['topical', 'cream', 'balm', 'lotion', 'salve', 'transdermal', 'patch'] },
  { type: 'tinctures', needles: ['tincture', 'sublingual', 'drop', 'spray', 'elixir'] },
  { type: 'accessories', needles: ['accessor', 'battery', 'paper', 'grinder', 'pipe', 'bong', 'rig', 'tool', 'gear', 'lighter', 'apparel'] },
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
