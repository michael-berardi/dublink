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

export const CATEGORY_ICON_SVGS: Record<string, string> = {
  flower:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 22c0-5-4-8-7-9 3-1 7-4 7-9 0 5 4 8 7 9-3 1-7 4-7 9z"/><path d="M12 14c-2-1-3-3-3-5 0-2 1-3 3-4 2 1 3 2 3 4 0 2-1 4-3 5z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  edibles:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r="1.5" fill="var(--bg-elev)"/><circle cx="15" cy="10" r="1.5" fill="var(--bg-elev)"/><path d="M8 15c1.5 1 4.5 1 6 0" fill="none" stroke="var(--bg-elev)" stroke-width="1.5" stroke-linecap="round"/></svg>',
  concentrates:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l10 10-10 10L2 12z"/><path d="M12 6l6 6-6 6-6-6z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  prerolls:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 20L20 4" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="5" cy="19" r="3" fill="currentColor"/></svg>',
  vapes:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="2" width="12" height="18" rx="4"/><rect x="9" y="20" width="6" height="3" rx="1" fill="currentColor"/><circle cx="12" cy="9" r="2" fill="var(--bg-elev)"/></svg>',
  topicals:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c-5 0-9 4-9 9 0 4 3 7 6 8v3h6v-3c3-1 6-4 6-8 0-5-4-9-9-9z"/><path d="M12 6v6" stroke="var(--bg-elev)" stroke-width="2" stroke-linecap="round"/></svg>',
  tinctures:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 2h6v4h-6z"/><path d="M8 6h8l-1 12a3 3 0 0 1-6 0L8 6z"/><path d="M12 10v5" stroke="var(--bg-elev)" stroke-width="2" stroke-linecap="round"/></svg>',
  cbd:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 22c0-4-3-7-6-8 3-1 6-4 6-8 0 4 3 7 6 8-3 1-6 4-6 8z"/><path d="M12 5c-1.5 1.5-2 3-2 5s1 4 2 5c1.5-1 2-3 2-5s-1-4-2-5z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  accessories:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3" stroke="currentColor" stroke-width="2"/></svg>',
  other:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="18" cy="12" r="2" fill="currentColor"/></svg>',
  generic:
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 22c0-5-4-8-7-9 3-1 7-4 7-9 0 5 4 8 7 9-3 1-7 4-7 9z"/></svg>',
};

export const PLACEHOLDER_ICON_SVGS: Record<string, string> = {
  flower:
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="placeholder-icon"><path d="M50 92 C50 92 20 70 20 38 C20 18 33 8 50 8 C67 8 80 18 80 38 C80 70 50 92 50 92 Z" fill="currentColor" opacity="0.95"/><path d="M50 62 C60 52 70 44 80 38" stroke="currentColor" stroke-width="3" fill="none" opacity="0.45"/><path d="M50 62 C40 52 30 44 20 38" stroke="currentColor" stroke-width="3" fill="none" opacity="0.45"/></svg>',
  edibles:
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="placeholder-icon"><circle cx="50" cy="50" r="32" fill="currentColor" opacity="0.95"/><circle cx="38" cy="42" r="6" fill="var(--bg-elev)" opacity="0.35"/><circle cx="62" cy="42" r="6" fill="var(--bg-elev)" opacity="0.35"/><path d="M34 60c7 5 21 5 28 0" stroke="var(--bg-elev)" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.35"/></svg>',
  concentrates:
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="placeholder-icon"><path d="M50 12 C50 12 82 52 82 70 C82 87 67 94 50 94 C33 94 18 87 18 70 C18 52 50 12 50 12 Z" fill="currentColor" opacity="0.95"/><path d="M50 32 C40 42 30 56 30 70" stroke="currentColor" stroke-width="3" fill="none" opacity="0.4"/></svg>',
  prerolls:
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="placeholder-icon"><path d="M28 12 L72 12 L58 88 L42 88 Z" fill="currentColor" opacity="0.95"/><rect x="35" y="18" width="30" height="10" rx="2" fill="var(--bg-elev)" opacity="0.3"/><path d="M42 36 L58 36" stroke="var(--bg-elev)" stroke-width="2" opacity="0.3"/></svg>',
  vapes:
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="placeholder-icon"><rect x="30" y="12" width="40" height="72" rx="14" fill="currentColor" opacity="0.95"/><rect x="38" y="80" width="24" height="12" rx="4" fill="var(--bg-elev)" opacity="0.3"/><circle cx="50" cy="38" r="8" fill="var(--bg-elev)" opacity="0.3"/></svg>',
  topicals:
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="placeholder-icon"><path d="M50 8 C28 8 10 26 10 48 C10 66 22 82 38 88 L38 96 L62 96 L62 88 C78 82 90 66 90 48 C90 26 72 8 50 8 Z" fill="currentColor" opacity="0.95"/><circle cx="30" cy="42" r="8" fill="var(--bg-elev)" opacity="0.3"/><circle cx="70" cy="58" r="8" fill="var(--bg-elev)" opacity="0.3"/></svg>',
  tinctures:
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="placeholder-icon"><rect x="32" y="8" width="36" height="16" rx="2" fill="currentColor" opacity="0.95"/><path d="M28 28 L72 28 L62 88 L38 88 Z" fill="currentColor" opacity="0.95"/><rect x="42" y="40" width="16" height="28" rx="2" fill="var(--bg-elev)" opacity="0.3"/></svg>',
  cbd:
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="placeholder-icon"><path d="M50 92 C50 92 20 70 20 38 C20 18 33 8 50 8 C67 8 80 18 80 38 C80 70 50 92 50 92 Z" fill="currentColor" opacity="0.95"/><path d="M50 60 C62 48 72 42 80 38" stroke="currentColor" stroke-width="3" fill="none" opacity="0.4"/><path d="M50 60 C38 48 28 42 20 38" stroke="currentColor" stroke-width="3" fill="none" opacity="0.4"/></svg>',
  accessories:
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="placeholder-icon"><circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" stroke-width="6" opacity="0.95"/><circle cx="50" cy="50" r="12" fill="currentColor" opacity="0.95"/><path d="M50 12 L50 24 M50 76 L50 88 M12 50 L24 50 M76 50 L88 50" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>',
  other:
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="placeholder-icon"><circle cx="26" cy="50" r="12" fill="currentColor" opacity="0.95"/><circle cx="50" cy="50" r="12" fill="currentColor" opacity="0.95"/><circle cx="74" cy="50" r="12" fill="currentColor" opacity="0.95"/></svg>',
  generic:
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="placeholder-icon"><circle cx="50" cy="50" r="32" fill="currentColor" opacity="0.95"/><circle cx="32" cy="36" r="10" fill="var(--bg-elev)" opacity="0.3"/><circle cx="68" cy="64" r="10" fill="var(--bg-elev)" opacity="0.3"/></svg>',
};

export function getCategoryType(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('flower') || n.includes('bud') || n.includes('strain')) return 'flower';
  if (n.includes('edible') || n.includes('gummy') || n.includes('candy') || n.includes('chocolate') || n.includes('baked') || n.includes('munchie')) return 'edibles';
  if (n.includes('concentrate') || n.includes('extract') || n.includes('wax') || n.includes('shatter') || n.includes('resin') || n.includes('rosin') || n.includes('oil') || n.includes('dab') || n.includes('sauce') || n.includes('badder') || n.includes('crumble')) return 'concentrates';
  if (n.includes('pre-roll') || n.includes('preroll') || n.includes('joint') || n.includes('cone') || n.includes('blunt')) return 'prerolls';
  if (n.includes('vape') || n.includes('vaporizer') || n.includes('cartridge') || n.includes('disposable') || n.includes('pen')) return 'vapes';
  if (n.includes('topical') || n.includes('cream') || n.includes('balm') || n.includes('lotion') || n.includes('salve')) return 'topicals';
  if (n.includes('tincture') || n.includes('sublingual') || n.includes('drop')) return 'tinctures';
  if (n.includes('cbd')) return 'cbd';
  if (n.includes('accessor') || n.includes('battery') || n.includes('paper') || n.includes('grinder') || n.includes('pipe') || n.includes('bong')) return 'accessories';
  return 'other';
}
