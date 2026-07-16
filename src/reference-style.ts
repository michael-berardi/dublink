import type { MenuConfig, ReferenceStyleProfile } from './types';

export type ReferenceStyleInput = {
  sourceUrl?: string;
  notes?: string;
  productCount?: number;
  currentDisplayCount?: number;
  currentShowImages?: boolean;
};

export type ReferenceStyleResult = Pick<MenuConfig, 'layout' | 'template' | 'fontSize' | 'showImages' | 'showDescription' | 'showPromos' | 'showBrand' | 'showStrain' | 'displayCount'> & {
  layoutMode: MenuConfig['layoutMode'];
  styleProfile: ReferenceStyleProfile;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const normalizeInput = (input: ReferenceStyleInput) => `${(input.sourceUrl || '').slice(0, 300)} ${(input.notes || '').slice(0, 500)}`.toLowerCase();

function detectDisplayCount(source: string, fallback: number): { count: number; explicit: boolean } {
  const patterns: Array<{ count: number; regexes: RegExp[] }> = [
    { count: 4, regexes: [/\b(4|four)\b[^.]{0,24}\b(display|screen|tv|monitor)s?\b/, /\b(display|screen|tv|monitor)s?\b[^.]{0,24}\b(4|four)\b/] },
    { count: 3, regexes: [/\b(3|three)\b[^.]{0,24}\b(display|screen|tv|monitor)s?\b/, /\b(display|screen|tv|monitor)s?\b[^.]{0,24}\b(3|three)\b/] },
    { count: 2, regexes: [/\b(2|two)\b[^.]{0,24}\b(display|screen|tv|monitor)s?\b/, /\b(display|screen|tv|monitor)s?\b[^.]{0,24}\b(2|two)\b/] },
    { count: 1, regexes: [/\b(1|one)\b[^.]{0,24}\b(display|screen|tv|monitor)s?\b/, /\b(display|screen|tv|monitor)s?\b[^.]{0,24}\b(1|one)\b/] },
  ];
  for (const pattern of patterns) {
    if (pattern.regexes.some((regex) => regex.test(source))) return { count: pattern.count, explicit: true };
  }
  return { count: clamp(Math.round(fallback || 1), 1, 4), explicit: false };
}

export function analyzeReferenceStyle(input: ReferenceStyleInput): ReferenceStyleResult {
  const source = normalizeInput(input);
  const productCount = Math.max(0, Math.floor(input.productCount || 0));
  const keywords: string[] = [];
  const hasPositiveCue = (word: string) => {
    let index = source.indexOf(word);
    while (index !== -1) {
      const prefix = source.slice(Math.max(0, index - 32), index);
      if (!/\b(no|not|avoid|without)\b[^.]{0,28}$/.test(prefix)) return true;
      index = source.indexOf(word, index + word.length);
    }
    return false;
  };
  const hit = (words: string[], label: string, includeNegated = false) => {
    const matched = words.some((word) => includeNegated ? source.includes(word) : hasPositiveCue(word));
    if (matched) keywords.push(label);
    return matched;
  };

  const dense = hit(['dense', 'price wall', 'pricewall', 'price board', 'price list', 'menu board', 'tv menu', 'digital menu', 'table', 'columns', 'many products'], 'dense');
  const images = hit(['image', 'photo', 'photos', 'photography', 'poster', 'video', 'gallery', 'visual', 'hero'], 'image');
  const showcase = hit(['showcase'], 'showcase');
  const promos = hit(['deal', 'deals', 'special', 'specials', 'happy hour', 'loyalty', 'discount', 'promo', 'promotion', 'daily'], 'promo');
  const single = hit(['single product', 'one product', 'hero', 'sparse', 'minimal', 'feature product'], 'single');
  const explicitSingle = single && !/\b(no|not|avoid|without)\b[^.]{0,28}\b(hero|sparse|single product|feature product)\b/.test(source);
  const editorial = hit(['editorial', 'lifestyle', 'premium', 'story', 'curated', 'cinematic', 'brand campaign'], 'editorial');
  const noPhotos = hit(['no photo', 'no photos', 'no image', 'no images', 'text only', 'price only'], 'no-photo', true);

  let layout: MenuConfig['layout'] = 'grid';
  const explicitSingleStrong = explicitSingle && /\b(single product|one product|feature product|sparse)\b/.test(source);
  if (explicitSingleStrong) layout = 'sparse';
  else if (dense || productCount >= 36) layout = 'pricewall';
  else if (showcase) layout = 'showcase';
  else if (explicitSingle) layout = 'sparse';
  else if (editorial) layout = 'editorial';
  else if (images && promos) layout = 'cinematic';
  else if (images || promos) layout = 'poster';

  let template: MenuConfig['template'] = 'default';
  if (hit(['green', 'forest', 'leaf', 'cannabis', 'emerald', 'garden', 'organic'], 'forest-color')) template = 'forest';
  else if (hit(['gold', 'golden', 'lux', 'luxury', 'premium', 'elite', 'reserve', 'crown'], 'gold-color')) template = 'gold';
  else if (hit(['blue', 'ocean', 'aqua', 'coast', 'wave'], 'ocean-color')) template = 'ocean';
  else if (hit(['red', 'ruby', 'crimson', 'rose', 'scarlet'], 'red-color')) template = 'crimson';
  else if (hit(['white', 'bone', 'ivory', 'clean', 'minimal white', 'clinic'], 'light-color')) template = 'bone';
  else if (hit(['neon', 'glow', 'cyber', 'night', 'club'], 'neon-color')) template = 'neon';
  else if (hit(['sun', 'sunset', 'orange', 'fire', 'ember'], 'sunset-color')) template = 'sunset';
  else if (hit(['purple', 'vapor', 'pink', 'cosmic'], 'vapor-color')) template = 'vapor';
  else if (hit(['royal', 'liberty', 'empire', 'heritage'], 'royal-color')) template = 'royal';
  const display = detectDisplayCount(source, input.currentDisplayCount || 1);
  const showImages = !noPhotos && (input.currentShowImages === true || images || layout === 'poster' || layout === 'cinematic' || layout === 'editorial' || layout === 'showcase');
  const showDescription = layout !== 'pricewall';
  const fontSize: MenuConfig['fontSize'] = dense || productCount >= 36 ? 'small' : explicitSingle ? 'large' : 'medium';
  const confidence = clamp(0.45 + keywords.length * 0.06 + (productCount >= 36 ? 0.1 : 0) + (display.explicit ? 0.05 : 0), 0.45, 0.95);
  const summary = `Applied ${layout} / ${template} from ${keywords.length ? keywords.slice(0, 5).join(', ') : 'general menu-board cues'}.`;

  return {
    layout,
    template,
    layoutMode: 'auto',
    fontSize,
    showImages,
    showDescription,
    showPromos: promos || layout === 'pricewall',
    showBrand: true,
    showStrain: true,
    displayCount: display.count,
    styleProfile: {
      sourceUrl: input.sourceUrl?.trim().slice(0, 300) || undefined,
      notes: input.notes?.trim().slice(0, 500) || undefined,
      intent: layout === 'pricewall' ? 'dense-menu-board' : layout === 'sparse' ? 'single-hero' : layout === 'editorial' ? 'editorial-board' : showImages ? 'image-led' : 'promo-board',
      layout,
      template,
      fontSize,
      showImages,
      showDescription,
      showPromos: promos || layout === 'pricewall',
      showBrand: true,
      showStrain: true,
      confidence: Math.round(confidence * 100) / 100,
      keywords: keywords.slice(0, 12),
      summary,
      appliedAt: new Date().toISOString(),
    },
  };
}

export function resolveImportedPresentation(
  style: Pick<ReferenceStyleResult, 'layout' | 'template'>,
  notes: string,
  hasImportedBrandStyle: boolean,
  inferredBrandTemplate: MenuConfig['template'],
): Pick<MenuConfig, 'layout' | 'template'> {
  const hasExplicitLayoutNotes = /\b(price\s*wall|pricewall|poster|cinematic|showcase|editorial|sparse|single[- ]hero|grid|columns?|list|compact)\b/i.test(notes);
  const hasExplicitTemplateNotes = /\b(green|forest|emerald|gold|golden|lux|luxury|premium|elite|crown|blue|ocean|aqua|red|ruby|crimson|rose|scarlet|white|bone|ivory|neon|cyber|sunset|orange|ember|purple|vapor|pink|cosmic|royal|heritage)\b/i.test(notes);
  const layout: MenuConfig['layout'] = hasExplicitLayoutNotes ? style.layout : 'auto';
  const template: MenuConfig['template'] = hasExplicitTemplateNotes
    ? style.template
    : hasImportedBrandStyle
      ? 'default'
      : style.template === 'default'
        ? inferredBrandTemplate
        : style.template;
  return { layout, template };
}
