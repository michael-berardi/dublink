import { CATEGORY_ICON_SVGS, CATEGORY_LABELS, GET_CATEGORY_TYPE_JS } from './category-icons';
import { allocateCategoriesForDisplay } from './multi-display';
import { buildTvCatalogPagePlan } from './tv-page-plan';
import { serializeInlineScriptJson } from './inline-script-json';
import { TV_FONT_SCALE_DEFAULT, TV_FONT_SCALE_MAX, TV_FONT_SCALE_MIN, TV_PAGE_DURATION_DEFAULT, TV_PAGE_DURATION_OPTIONS, TV_PAGE_TRANSITION_DEFAULT, normalizeTvPageDurationSeconds, normalizeTvPageTransition } from './types';

export type TvPageInitialConfig = {
  template?: string;
  fontSize?: 'small' | 'medium' | 'large';
  fontScale?: number;
  categories?: Array<{ id?: string; name?: string; order?: number; products?: unknown[] }>;
} & Record<string, unknown>;

export function normalizeTvFontScale(value: unknown, legacyFontSize: unknown = 'medium'): number {
  const numeric = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : Number.NaN;
  const legacyScale = legacyFontSize === 'small' ? TV_FONT_SCALE_MIN : legacyFontSize === 'large' ? 180 : TV_FONT_SCALE_DEFAULT;
  const requested = Number.isFinite(numeric) ? numeric : legacyScale;
  const clamped = Math.max(TV_FONT_SCALE_MIN, Math.min(TV_FONT_SCALE_MAX, requested));
  return Math.round(clamped / 5) * 5;
}

export function tvFontSizeClass(fontScale: number): 'small' | 'medium' | 'large' {
  if (fontScale < 120) return 'small';
  if (fontScale >= 180) return 'large';
  return 'medium';
}

type TvManualSpecialInput = {
  id?: string;
  title?: string;
  description?: string;
  brand?: string;
  image?: string;
  price?: number;
  originalPrice?: number;
  priceTiers?: unknown[];
  specialLabel?: string;
  active?: boolean;
};

export function buildTvManualSpecialsCategory(cfg: { specials?: TvManualSpecialInput[] } | null | undefined) {
  const specials = (Array.isArray(cfg?.specials) ? cfg.specials : [])
    .filter((special) => special && special.active !== false && String(special.title || '').trim());
  if (!specials.length) return null;
  return {
    id: 'specials',
    name: 'Specials',
    order: -1,
    products: specials.map((special, index) => ({
      id: special.id || `manual-special-${index}`,
      name: special.title,
      description: special.description || '',
      brand: special.brand || '',
      image: special.image || '',
      price: typeof special.price === 'number' ? special.price : undefined,
      originalPrice: typeof special.originalPrice === 'number' ? special.originalPrice : undefined,
      priceTiers: Array.isArray(special.priceTiers) ? special.priceTiers : undefined,
      specialLabel: special.specialLabel || 'Special',
      inStock: true,
      isPromo: true,
    })),
  };
}

export function compactTvDescription(value: unknown): string {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const sentence = (text.match(/^[^.!?]+[.!?]?/) || [text])[0].trim();
  const words = sentence.split(' ');
  if (sentence.length <= 120 || words.length <= 16) return sentence;
  const clause = sentence.slice(0, 120);
  const clauseEnd = Math.max(clause.lastIndexOf(','), clause.lastIndexOf(';'), clause.lastIndexOf('—'), clause.lastIndexOf(' - '));
  if (clauseEnd >= 60) return `${clause.slice(0, clauseEnd).replace(/[,:;\s]+$/, '')}.`;
  return `${words.slice(0, 16).join(' ').replace(/[,:;\s]+$/, '')}.`;
}

type TvProductNameInput = {
  name?: unknown;
  brand?: unknown;
  weight?: unknown;
  strain?: unknown;
};

export function formatTvProductName(product: TvProductNameInput, categoryName: unknown = ''): string {
  const original = String(product?.name || '').replace(/\s+/g, ' ').trim();
  if (!original) return '';

  const normalizeToken = (value: unknown): string =>
    String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const brand = String(product?.brand || '').trim();
  let displayName = original;
  if (brand && displayName.toLowerCase().startsWith(brand.toLowerCase())) {
    const remainder = displayName.slice(brand.length).trim();
    if (/^(?:\||[-–—:])/.test(remainder)) displayName = remainder.replace(/^(?:\||[-–—:])\s*/, '').trim();
  }
  if (brand && displayName.includes('|')) {
    const leadingSegment = displayName.split('|', 1)[0].trim();
    const leadingToken = normalizeToken(leadingSegment);
    if (leadingToken.length >= 3 && normalizeToken(brand).startsWith(leadingToken)) {
      displayName = displayName.slice(displayName.indexOf('|') + 1).trim();
    }
  }

  const category = String(categoryName || '').replace(/\s*·\s*(?:indica|sativa|hybrid)\s*$/i, '').trim();
  const categoryPattern = (() => {
    switch (normalizeToken(category)) {
      case 'flower': return /\bflowers?\b/ig;
      case 'prerolls': return /\bpre[\s-]?rolls?\b/ig;
      case 'vapes': return /\bvapes?\b/ig;
      case 'concentrates': return /\bconcentrates?\b/ig;
      case 'edibles': return /\bedibles?\b/ig;
      case 'tinctures': return /\btinctures?\b/ig;
      case 'topicals': return /\btopicals?\b/ig;
      case 'accessories': return /\baccessor(?:y|ies)\b/ig;
      default: return null;
    }
  })();
  const redundantTokens = new Set(
    [brand, product?.weight, product?.strain, category]
      .map(normalizeToken)
      .filter(Boolean),
  );
  const parts = displayName.split('|').map((part) => part.trim()).filter(Boolean);
  const conciseParts = parts
    .map((part) => categoryPattern ? part.replace(categoryPattern, ' ').replace(/\s+/g, ' ').trim() : part)
    .filter((part) => part && !redundantTokens.has(normalizeToken(part)));
  if (conciseParts.length > 0) displayName = conciseParts.join(' | ');

  const weight = String(product?.weight || '').trim();
  if (weight && displayName.toLowerCase().endsWith(weight.toLowerCase())) {
    const withoutWeight = displayName.slice(0, -weight.length).replace(/[\s|:–—-]+$/, '').trim();
    if (withoutWeight) displayName = withoutWeight;
  }

  return displayName || original;
}

type TvPageProgressCategory = { name?: unknown };

export function formatTvPageProgress(
  pagePlan: readonly (readonly TvPageProgressCategory[])[],
  currentPage: number,
): string {
  if (pagePlan.length === 0) return '';
  const pageIndex = Math.max(0, Math.min(pagePlan.length - 1, Math.floor(currentPage)));
  const baseName = (category: TvPageProgressCategory): string =>
    String(category?.name || '').replace(/\s*·\s*(?:indica|sativa|hybrid)\s*$/i, '').trim();
  const visibleNames = Array.from(new Set(pagePlan[pageIndex].map(baseName).filter(Boolean)));

  return visibleNames.map((name) => {
    let categoryPage = 0;
    let categoryPages = 0;
    for (let index = 0; index < pagePlan.length; index += 1) {
      if (!pagePlan[index].some((category) => baseName(category) === name)) continue;
      categoryPages += 1;
      if (index <= pageIndex) categoryPage += 1;
    }
    return `${name} ${categoryPage}/${categoryPages}`;
  }).join(' · ');
}

const TV_TEMPLATES = ['default', 'minimal', 'neon', 'light', 'sunset', 'forest', 'royal', 'gold', 'ocean', 'crimson', 'bone', 'vapor'] as const;

function isTvTemplate(value: unknown): value is (typeof TV_TEMPLATES)[number] {
  return typeof value === 'string' && (TV_TEMPLATES as readonly string[]).includes(value);
}

export function shouldResetTvCycle(previousSignature: string, nextSignature: string): boolean {
  return previousSignature !== nextSignature;
}

export function shouldRunTvCycle(autoScroll: unknown, totalPages: number, hidden: boolean): boolean {
  return autoScroll === true && totalPages > 1 && !hidden;
}

export function nextTvCyclePage(currentPage: number, totalPages: number): number {
  return totalPages > 0 ? (currentPage + 1) % totalPages : 0;
}

export function normalizeTvUploadImageUrl(value: unknown, pageOrigin: string): string {
  if (!value || typeof value !== 'string') return '';
  const url = value.trim();
  if (/^data:image\//.test(url)) return url;
  try {
    const parsed = new URL(url, pageOrigin);
    if (!parsed.pathname.startsWith('/api/uploads/')) return '';
    const isRelativeUpload = /^\/api\/uploads\//.test(url);
    const approvedHost = parsed.protocol === 'https:' &&
      (parsed.hostname === 'dubmenu.com' || parsed.hostname === 'www.dubmenu.com');
    if (!isRelativeUpload && parsed.origin !== pageOrigin && !approvedHost) return '';
    parsed.searchParams.set('dubmenu-cors', '1');
    return isRelativeUpload ? `${parsed.pathname}${parsed.search}` : parsed.toString();
  } catch {
    return '';
  }
}

export function isVisuallyBlankImageSample(pixels: ArrayLike<number>): boolean {
  let opaque = 0;
  let bright = 0;
  let dark = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 16) continue;
    const luminance = 0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2];
    opaque++;
    if (luminance > 235) bright++;
    if (luminance < 190) dark++;
  }
  return opaque === 0 || (bright / opaque > 0.94 && dark / opaque < 0.035);
}


// State-specific compliance disclaimer templates. These are generic
// templates — operators must verify exact wording with their counsel and
// state regulator before relying on them. [Year] and [Dispensary] are
// substituted at render time.
const COMPLIANCE_TEMPLATES: Record<string, string> = {
  CA: 'For use by adults 21 and over only. Cannabis remains a Schedule I controlled substance under federal law. It is illegal to operate a vehicle or machinery under the influence of cannabis. Keep out of reach of children and pets. \u00A9 [Year] [Dispensary].',
  NY: 'Cannabis is for use by adults 21 and over only. Do not drive or operate machinery while under the influence. Keep out of reach of children and pets.',
  CO: 'Marijuana is for adults 21 and over only. It is illegal to use marijuana while operating a vehicle or machinery. Keep out of reach of children. \u00A9 [Year] [Dispensary].',
  OR: 'Cannabis products are for adults 21 and over only. Do not drive or operate machinery under the influence. Keep out of reach of children and pets.',
  WA: 'Marijuana is for adults 21 and over only. It is illegal to drive or operate machinery under the influence. Keep out of reach of children and pets.',
  MA: 'Cannabis is for adults 21 and over only. Do not drive or operate machinery under the influence. Keep out of reach of children and pets.',
  NV: 'Marijuana is for adults 21 and over only. It is illegal to drive or operate machinery under the influence. Keep out of reach of children and pets.',
  MI: 'Cannabis is for adults 21 and over only. Do not drive or operate machinery under the influence. Keep out of reach of children and pets.',
};

export function tvPage(sessionId: string, origin: string, options?: { noAgeGate?: boolean; preview?: boolean; initialConfig?: TvPageInitialConfig; demo?: boolean }): string {
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const safeSessionId = escapeHtml(sessionId);
  const initialConfig = options?.initialConfig;
  const hasInitialMenu = initialConfig &&
    Array.isArray(initialConfig.categories) &&
    initialConfig.categories.some((cat) => Array.isArray(cat.products) && cat.products.length > 0);
  const initialTemplate = isTvTemplate(initialConfig?.template) ? initialConfig.template : 'default';
  const initialFontScale = normalizeTvFontScale(initialConfig?.fontScale, initialConfig?.fontSize);
  const initialFontSize = tvFontSizeClass(initialFontScale);
  const configOrigin = /^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin)
    ? origin
    : 'https://dubmenu.com';
  const landingUrl = configOrigin + '/?code=' + safeSessionId;
  const qrSrc =
    'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=' +
    encodeURIComponent(landingUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>DubMenu TV</title>
<style>
  body.template-default {
    --bg:#070707;--bg-elev:#121214;--bg-card:#151518;
    --accent:#10b981;--accent-dim:rgba(16,185,129,0.12);--accent-glow:rgba(16,185,129,0.25);
    --text:#f5f5f5;--text-muted:#999;--text-faint:#555;
    --border:rgba(255,255,255,0.05);--border-hover:rgba(16,185,129,0.4);
    --card-shadow:0 2px 12px rgba(0,0,0,0.4);
    --card-grad:linear-gradient(180deg,rgba(255,255,255,0.03) 0%,rgba(0,0,0,0.2) 100%);
    --pairing-bg:radial-gradient(ellipse at center,#0d1f17 0%,#030303 70%);
    --pairing-glow:rgba(16,185,129,0.08);
  }
  body.template-light {
    --bg:#f0f0f0;--bg-elev:#fff;--bg-card:#fff;
    --accent:#059669;--accent-dim:rgba(5,150,105,0.1);--accent-glow:rgba(5,150,105,0.2);
    --text:#111;--text-muted:#666;--text-faint:#aaa;
    --border:rgba(0,0,0,0.06);--border-hover:rgba(5,150,105,0.4);
    --card-shadow:0 1px 8px rgba(0,0,0,0.06);
    --card-grad:linear-gradient(180deg,rgba(0,0,0,0.01) 0%,rgba(0,0,0,0.04) 100%);
    --pairing-bg:radial-gradient(ellipse at center,#e8f5ee 0%,#d0d8d4 70%);
    --pairing-glow:rgba(5,150,105,0.12);
  }
  body.template-neon {
    --bg:#030303;--bg-elev:#080808;--bg-card:#080808;
    --accent:#00ff88;--accent-dim:rgba(0,255,136,0.12);--accent-glow:rgba(0,255,136,0.3);
    --text:#fff;--text-muted:#6a6a6a;--text-faint:#333;
    --border:rgba(0,255,136,0.15);--border-hover:rgba(0,255,136,0.6);
    --card-shadow:0 0 16px rgba(0,255,136,0.06);
    --card-grad:linear-gradient(180deg,rgba(0,255,136,0.04) 0%,rgba(0,0,0,0.3) 100%);
    --pairing-bg:radial-gradient(ellipse at center,#0a1f14 0%,#010101 70%);
    --pairing-glow:rgba(0,255,136,0.12);
  }
  body.template-minimal {
    --bg:#111;--bg-elev:#1a1a1a;--bg-card:#1a1a1a;
    --accent:#888;--accent-dim:rgba(136,136,136,0.12);--accent-glow:rgba(136,136,136,0.2);
    --text:#fff;--text-muted:#777;--text-faint:#444;
    --border:transparent;--border-hover:rgba(255,255,255,0.15);
    --card-shadow:none;
    --card-grad:linear-gradient(180deg,rgba(255,255,255,0.02) 0%,rgba(0,0,0,0.1) 100%);
    --pairing-bg:radial-gradient(ellipse at center,#1a1a1a 0%,#0a0a0a 70%);
    --pairing-glow:rgba(255,255,255,0.04);
  }
  body.template-sunset {
    --bg:#1a0a0a;--bg-elev:#241010;--bg-card:#2a1212;
    --accent:#f97316;--accent-dim:rgba(249,115,22,0.12);--accent-glow:rgba(249,115,22,0.25);
    --text:#fff5f0;--text-muted:#a08070;--text-faint:#5a4030;
    --border:rgba(249,115,22,0.08);--border-hover:rgba(249,115,22,0.4);
    --card-shadow:0 2px 12px rgba(60,20,0,0.4);
    --card-grad:linear-gradient(180deg,rgba(249,115,22,0.04) 0%,rgba(0,0,0,0.2) 100%);
    --pairing-bg:radial-gradient(ellipse at center,#2a1410 0%,#0a0505 70%);
    --pairing-glow:rgba(249,115,22,0.1);
  }
  body.template-forest {
    --bg:#0a1410;--bg-elev:#0f1d18;--bg-card:#112218;
    --accent:#22c55e;--accent-dim:rgba(34,197,94,0.12);--accent-glow:rgba(34,197,94,0.25);
    --text:#e8f5e8;--text-muted:#708070;--text-faint:#405040;
    --border:rgba(34,197,94,0.08);--border-hover:rgba(34,197,94,0.4);
    --card-shadow:0 2px 12px rgba(0,20,0,0.4);
    --card-grad:linear-gradient(180deg,rgba(34,197,94,0.03) 0%,rgba(0,0,0,0.2) 100%);
    --pairing-bg:radial-gradient(ellipse at center,#0f2010 0%,#030805 70%);
    --pairing-glow:rgba(34,197,94,0.1);
  }
  body.template-royal {
    --bg:#0a0a1a;--bg-elev:#101024;--bg-card:#12122a;
    --accent:#818cf8;--accent-dim:rgba(129,140,248,0.12);--accent-glow:rgba(129,140,248,0.25);
    --text:#f0f0ff;--text-muted:#8080a0;--text-faint:#404060;
    --border:rgba(129,140,248,0.08);--border-hover:rgba(129,140,248,0.4);
    --card-shadow:0 2px 12px rgba(10,10,40,0.4);
    --card-grad:linear-gradient(180deg,rgba(129,140,248,0.04) 0%,rgba(0,0,0,0.2) 100%);
    --pairing-bg:radial-gradient(ellipse at center,#101030 0%,#050510 70%);
    --pairing-glow:rgba(129,140,248,0.1);
  }
  body.template-gold {
    --bg:#0c0a05;--bg-elev:#161208;--bg-card:#1a160c;
    --accent:#fbbf24;--accent-dim:rgba(251,191,36,0.12);--accent-glow:rgba(251,191,36,0.25);
    --text:#fefce8;--text-muted:#a09870;--text-faint:#504830;
    --border:rgba(251,191,36,0.08);--border-hover:rgba(251,191,36,0.4);
    --card-shadow:0 2px 12px rgba(40,30,0,0.4);
    --card-grad:linear-gradient(180deg,rgba(251,191,36,0.04) 0%,rgba(0,0,0,0.2) 100%);
    --pairing-bg:radial-gradient(ellipse at center,#1a1408 0%,#050402 70%);
    --pairing-glow:rgba(251,191,36,0.1);
  }
  body.template-ocean {
    --bg:#050c14;--bg-elev:#0a141e;--bg-card:#0e1824;
    --accent:#06b6d4;--accent-dim:rgba(6,182,212,0.12);--accent-glow:rgba(6,182,212,0.25);
    --text:#f0faff;--text-muted:#7090a0;--text-faint:#405560;
    --border:rgba(6,182,212,0.08);--border-hover:rgba(6,182,212,0.4);
    --card-shadow:0 2px 12px rgba(0,10,20,0.4);
    --card-grad:linear-gradient(180deg,rgba(6,182,212,0.04) 0%,rgba(0,0,0,0.2) 100%);
    --pairing-bg:radial-gradient(ellipse at center,#0a1820 0%,#020608 70%);
    --pairing-glow:rgba(6,182,212,0.1);
  }
  body.template-crimson {
    --bg:#0e0505;--bg-elev:#180808;--bg-card:#1c0a0a;
    --accent:#dc2626;--accent-dim:rgba(220,38,38,0.12);--accent-glow:rgba(220,38,38,0.25);
    --text:#fff5f5;--text-muted:#a07070;--text-faint:#503030;
    --border:rgba(220,38,38,0.08);--border-hover:rgba(220,38,38,0.4);
    --card-shadow:0 2px 12px rgba(20,0,0,0.4);
    --card-grad:linear-gradient(180deg,rgba(220,38,38,0.04) 0%,rgba(0,0,0,0.2) 100%);
    --pairing-bg:radial-gradient(ellipse at center,#1a0808 0%,#050202 70%);
    --pairing-glow:rgba(220,38,38,0.1);
  }
  body.template-bone {
    --bg:#faf8f5;--bg-elev:#fff;--bg-card:#fff;
    --accent:#1c1917;--accent-dim:rgba(28,25,23,0.08);--accent-glow:rgba(28,25,23,0.15);
    --text:#1c1917;--text-muted:#78716c;--text-faint:#a8a29e;
    --border:rgba(0,0,0,0.06);--border-hover:rgba(28,25,23,0.3);
    --card-shadow:0 1px 8px rgba(0,0,0,0.04);
    --card-grad:linear-gradient(180deg,rgba(0,0,0,0.01) 0%,rgba(0,0,0,0.03) 100%);
    --pairing-bg:radial-gradient(ellipse at center,#f5f0eb 0%,#e8e0d8 70%);
    --pairing-glow:rgba(28,25,23,0.06);
  }
  body.template-vapor {
    --bg:#0c0414;--bg-elev:#14081e;--bg-card:#180a26;
    --accent:#e879f9;--accent-dim:rgba(232,121,249,0.12);--accent-glow:rgba(232,121,249,0.25);
    --text:#fdf4ff;--text-muted:#9070a0;--text-faint:#503050;
    --border:rgba(232,121,249,0.1);--border-hover:rgba(232,121,249,0.4);
    --card-shadow:0 2px 12px rgba(20,0,30,0.4);
    --card-grad:linear-gradient(180deg,rgba(232,121,249,0.04) 0%,rgba(0,0,0,0.2) 100%);
    --pairing-bg:radial-gradient(ellipse at center,#180828 0%,#050208 70%);
    --pairing-glow:rgba(232,121,249,0.1);
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:100%;height:100vh;overflow:hidden;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
  body{
    --tv-category-size:clamp(2rem,2.45vw,2.55rem);
    --tv-name-size:clamp(1.45rem,1.62vw,1.85rem);
    --tv-editorial-name-size:clamp(1.25rem,1.42vw,1.62rem);
    --tv-meta-size:clamp(0.9rem,1vw,1.08rem);
    --tv-price-size:clamp(1.7rem,1.95vw,2.15rem);
    --tv-table-size:clamp(0.72rem,0.82vw,0.9rem);
    --tv-footer-size:clamp(1rem,1.08vw,1.15rem);
    --tv-tier-label-size:clamp(0.72rem,0.78vw,0.84rem);
    --tv-tier-price-size:clamp(1.12rem,1.22vw,1.32rem);
    --tv-feature-name-size:clamp(2.4rem,3vw,3.4rem);
    --tv-feature-meta-size:clamp(1.1rem,1.35vw,1.55rem);
    --tv-feature-price-size:clamp(2.55rem,3.15vw,3.65rem);
    --tv-hero-name-size:clamp(3.6rem,5.8vw,6.2rem);
    --tv-hero-meta-size:clamp(1.2rem,2vw,1.8rem);
    --tv-hero-price-size:clamp(3.8rem,6vw,6.5rem);
    --tv-brand-size:clamp(2.35rem,3.35vw,3.5rem);
    --tv-promo-size:clamp(1.05rem,1.45vw,1.45rem);
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif;background:var(--bg);color:var(--text);user-select:none;-webkit-user-select:none;font-size:1.125rem;
  }
  body.font-small{
    --tv-category-size:clamp(1.72rem,2vw,2.1rem);
    --tv-name-size:clamp(1.28rem,1.4vw,1.62rem);
    --tv-meta-size:clamp(0.78rem,0.86vw,0.94rem);
    --tv-price-size:clamp(1.5rem,1.7vw,1.85rem);
    --tv-table-size:clamp(0.66rem,0.72vw,0.78rem);
    --tv-footer-size:0.84rem;
    --tv-tier-label-size:0.68rem;
    --tv-tier-price-size:1.02rem;
    --tv-feature-name-size:clamp(2rem,2.5vw,2.8rem);
    --tv-feature-meta-size:clamp(0.95rem,1.15vw,1.3rem);
    --tv-feature-price-size:clamp(2.15rem,2.65vw,3rem);
    --tv-hero-name-size:clamp(3rem,4.8vw,5.2rem);
    --tv-hero-meta-size:clamp(1rem,1.65vw,1.5rem);
    --tv-hero-price-size:clamp(3.15rem,5vw,5.5rem);
    --tv-brand-size:clamp(2rem,2.85vw,3rem);
    --tv-promo-size:clamp(0.9rem,1.2vw,1.25rem);
    font-size:14px;
  }
  body.font-medium{font-size:18px;}
  body.font-large{
    --tv-category-size:clamp(2.3rem,2.75vw,2.9rem);
    --tv-name-size:clamp(1.8rem,2vw,2.3rem);
    --tv-meta-size:clamp(0.98rem,1.15vw,1.25rem);
    --tv-price-size:clamp(1.95rem,2.3vw,2.55rem);
    --tv-table-size:clamp(0.78rem,0.9vw,1rem);
    --tv-footer-size:clamp(1rem,1.08vw,1.16rem);
    --tv-tier-label-size:clamp(0.78rem,0.86vw,0.94rem);
    --tv-tier-price-size:clamp(1.28rem,1.42vw,1.55rem);
    --tv-feature-name-size:clamp(2.8rem,3.5vw,4rem);
    --tv-feature-meta-size:clamp(1.28rem,1.55vw,1.8rem);
    --tv-feature-price-size:clamp(3rem,3.7vw,4.25rem);
    --tv-hero-name-size:clamp(4.2rem,6.8vw,7.3rem);
    --tv-hero-meta-size:clamp(1.4rem,2.3vw,2.1rem);
    --tv-hero-price-size:clamp(4.4rem,6.9vw,7.5rem);
    --tv-brand-size:clamp(2.75rem,3.9vw,4.1rem);
    --tv-promo-size:clamp(1.2rem,1.65vw,1.7rem);
    font-size:24px;
  }
  body.font-small .row-name{font-size:0.82em;}
  body.font-large .row-name{font-size:1.28em;}
  .font-custom-serif{font-family:Georgia,'Times New Roman',serif;}
  .font-custom-slab{font-family:Rockwell,Georgia,'Times New Roman',serif;}
  .font-custom-mono{font-family:'SF Mono','JetBrains Mono','Fira Code',monospace;}
  .font-custom-condensed{font-family:'Arial Narrow','Roboto Condensed',Impact,sans-serif;}
  .font-custom-bold .category-title,.font-custom-bold .card-name,.font-custom-bold .row-name,.font-custom-bold .dispensary-name{font-weight:950;}
  ::-webkit-scrollbar{display:none;width:0;height:0;}
  body{scrollbar-width:none;-ms-overflow-style:none;}
  .phase{position:fixed;inset:0;display:flex;transition:opacity 0.8s ease;}
  .phase[hidden]{display:none;opacity:0;pointer-events:none;visibility:hidden;}

  #pairing{flex-direction:column;align-items:center;justify-content:center;background:var(--pairing-bg);gap:1rem;padding:1rem;overflow:hidden;}
  .pairing-glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;height:700px;background:radial-gradient(circle,var(--pairing-glow) 0%,transparent 70%);pointer-events:none;animation:breathe 4s ease-in-out infinite;}
  @keyframes breathe{0%,100%{opacity:0.5;transform:translate(-50%,-50%) scale(0.95);}50%{opacity:1;transform:translate(-50%,-50%) scale(1.05);}}
  .brand{position:relative;text-align:center;}
  .brand-logo{font-size:clamp(2.5rem,6vw,6rem);font-weight:900;letter-spacing:-0.03em;color:var(--accent);line-height:1;text-shadow:0 0 40px var(--accent-dim);}
  .brand-tag{font-size:clamp(0.8rem,1.3vw,1.2rem);font-weight:600;letter-spacing:0.3em;color:var(--text-muted);text-transform:uppercase;margin-top:0.3rem;}
  .qr-section{position:relative;display:flex;flex-direction:column;align-items:center;gap:0.75rem;}
  .qr-frame{position:relative;padding:1.25rem;background:#fff;border-radius:1.5rem;box-shadow:0 0 0 1px var(--border-hover),0 20px 60px rgba(0,0,0,0.5);animation:float 3s ease-in-out infinite;}
  @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
  .qr-frame img{display:block;width:clamp(200px,22vw,350px);height:clamp(200px,22vw,350px);border-radius:0.5rem;}
  .access-code-wrap{text-align:center;}
  .access-code-label{font-size:clamp(0.85rem,1.3vw,1.1rem);font-weight:700;text-transform:uppercase;letter-spacing:0.25em;color:var(--text-muted);margin-bottom:0.5rem;}
  .access-code{font-size:clamp(2rem,5vw,5rem);font-weight:900;color:var(--accent);letter-spacing:0.15em;font-family:'SF Mono','JetBrains Mono','Fira Code',monospace;line-height:1;text-shadow:0 0 30px var(--accent-dim);}
  .pairing-instruction{font-size:clamp(1rem,1.6vw,1.5rem);font-weight:600;color:var(--text);text-align:center;max-width:600px;}

  #menu{flex-direction:column;background:
    radial-gradient(circle at 12% 10%,var(--accent-dim),transparent 30%),
    radial-gradient(circle at 88% 18%,rgba(255,255,255,0.045),transparent 28%),
    linear-gradient(135deg,rgba(255,255,255,0.025),transparent 42%),
    var(--bg);}
  .promo-bar{width:100%;padding:0.8rem clamp(2.5rem,3vw,3.75rem);text-align:center;font-weight:900;font-size:var(--tv-promo-size);letter-spacing:0.06em;flex-shrink:0;z-index:10;display:none;text-transform:uppercase;overflow-wrap:break-word;word-wrap:break-word;min-width:0;box-shadow:0 8px 28px rgba(0,0,0,0.22);}
  .promo-bar.active{display:block;}
  .menu-header{display:flex;justify-content:space-between;align-items:center;gap:1.25rem;padding:1rem clamp(2.5rem,3vw,3.75rem);border-bottom:1px solid var(--border);flex-shrink:0;background:linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0.08)),var(--bg);z-index:9;box-shadow:0 12px 32px rgba(0,0,0,0.22);}
  .header-left{display:flex;align-items:center;gap:1rem;min-width:0;flex:1 1 auto;}
  .header-right{display:flex;align-items:center;gap:0.75rem;flex:0 0 auto;}
  .header-logo{max-height:56px;max-width:220px;object-fit:contain;display:none;}
  .header-logo.show{display:block;}
  .dispensary-name{font-size:var(--tv-brand-size);font-weight:950;letter-spacing:-0.035em;line-height:1.05;color:var(--accent);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 0 32px var(--accent-glow);}
  .menu-content{position:relative;z-index:1;flex:1 1 auto;min-height:0;overflow:hidden;padding:1.25rem clamp(2.5rem,3vw,3.75rem);width:100%;}
  .menu-content.page-exit{animation:menu-page-exit 180ms cubic-bezier(0.4,0,1,1) both;will-change:opacity;pointer-events:none;}
  .menu-content.page-enter{animation:menu-page-enter 220ms cubic-bezier(0.16,1,0.3,1) both;will-change:opacity;}
  .menu-footer{position:relative;z-index:1;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;padding:0.85rem clamp(2.5rem,3vw,3.75rem) 1.15rem;border-top:1px solid var(--border);background:linear-gradient(0deg,rgba(0,0,0,0.42),rgba(0,0,0,0.18)),var(--bg);font-size:var(--tv-footer-size);font-weight:850;color:var(--text);opacity:0.9;gap:1rem;text-transform:uppercase;letter-spacing:0.035em;}
  .footer-progress{max-width:42%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--accent);}
  body.font-small .footer-progress{font-size:1.2rem;}
  .footer-right{text-align:right;max-width:58%;}

  .age-gate{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#000;z-index:500;gap:1.5rem;padding:2rem;text-align:center;}
  .age-gate.hidden{display:none;}
  .age-gate h2{font-size:clamp(2rem,5vw,4rem);font-weight:900;color:var(--accent);}
  .age-gate p{font-size:clamp(1rem,2vw,1.5rem);color:var(--text-muted);max-width:600px;}
  .age-gate .btn{font-size:1.25rem;padding:1rem 2rem;}
  .age-gate .btn-secondary{font-size:1rem;background:var(--surface2);color:var(--text);text-decoration:none;}

  .category-header{margin-bottom:0.7rem;padding-bottom:0.55rem;border-bottom:1px solid var(--border);display:flex;align-items:baseline;gap:0.75rem;}
  .category-title{font-size:var(--tv-category-size);font-weight:950;letter-spacing:0.005em;line-height:1.08;color:var(--text);display:inline-flex;align-items:center;gap:0.65rem;text-transform:none;}
  .cat-icon-wrap{width:1.15em;height:1.15em;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--accent);filter:drop-shadow(0 0 14px var(--accent-glow));}
  .cat-icon{width:100%;height:100%;display:inline-flex;align-items:center;justify-content:center;color:inherit;}
  .cat-icon svg{width:100%;height:100%;fill:currentColor;}
  .layout-grid,.layout-pricewall{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.15rem;align-items:stretch;height:100%;min-height:0;}
  .pricewall-special-name{font-weight:900;font-size:var(--tv-name-size);line-height:1.05;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
  .layout-grid:has(.category-block:first-child:nth-last-child(2)),.layout-pricewall:has(.category-block:first-child:nth-last-child(2)){grid-template-columns:repeat(2,minmax(0,1fr));}
  .layout-grid:has(.category-block:first-child:nth-last-child(2)) .category-block:first-child:nth-last-child(2) ~ .category-block,.layout-pricewall:has(.category-block:first-child:nth-last-child(2)) .category-block:first-child:nth-last-child(2) ~ .category-block{min-width:0;}
  .layout-grid .category-block,.layout-pricewall .category-block{min-width:0;min-height:0;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.2)),var(--bg-card);border:1px solid var(--border);border-radius:1rem;padding:1rem;box-shadow:var(--card-shadow),inset 0 1px 0 rgba(255,255,255,0.045);overflow:hidden;}
  .layout-grid .category-header,.layout-pricewall .category-header{margin-bottom:0.8rem;padding-bottom:0.7rem;border-bottom:1px solid var(--border);}
  .layout-grid .grid-products,.layout-pricewall .grid-products{display:flex;flex-direction:column;gap:0.55rem;flex:1;min-height:0;justify-content:flex-start;}
  .layout-grid .product-table-head,.layout-pricewall .product-table-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;padding:0 0.25rem 0.15rem 0.6rem;color:var(--text);opacity:0.76;font-size:var(--tv-table-size);font-weight:950;letter-spacing:0.09em;text-transform:uppercase;flex:0 0 auto;}
  .layout-grid .product-card,.layout-pricewall .product-card{background:linear-gradient(145deg,rgba(255,255,255,0.058),rgba(255,255,255,0.014)),var(--bg-card);border:1px solid var(--border);border-left:0;border-radius:0.62rem;overflow:hidden;display:grid;grid-template-columns:0.38rem minmax(0,1fr) auto;align-items:center;gap:0.9rem;min-height:6.1rem;padding:0.72rem 0.9rem 0.72rem 0;box-shadow:0 12px 28px rgba(0,0,0,0.16);position:relative;isolation:isolate;flex:0 0 auto;}
  @media (min-width:769px){.layout-grid .grid-products:not(.count-1):not(.count-2):not(.count-3) .product-card,.layout-pricewall .grid-products:not(.count-1):not(.count-2):not(.count-3) .product-card{flex:1 1 0;min-height:0;}}
  @media (min-width:769px){.font-scale-large .layout-grid .grid-products .product-card{flex:1 1 0;min-height:0;}}
  .layout-grid .product-card.has-image,.layout-pricewall .product-card.has-image{grid-template-columns:0.38rem 4.6rem minmax(0,1fr) auto;}
  .layout-grid .strain-bar,.layout-pricewall .strain-bar{align-self:stretch;width:0.38rem;background:linear-gradient(180deg,var(--accent),rgba(255,255,255,0.08));box-shadow:0 0 18px var(--accent-glow);}
  .layout-grid .product-card.strain-indica .strain-bar,.layout-pricewall .product-card.strain-indica .strain-bar{background:linear-gradient(180deg,#8b5cf6,#4c1d95);box-shadow:0 0 16px rgba(139,92,246,0.35);}
  .layout-grid .product-card.strain-sativa .strain-bar,.layout-pricewall .product-card.strain-sativa .strain-bar{background:linear-gradient(180deg,#f97316,#c2410c);box-shadow:0 0 16px rgba(249,115,22,0.35);}
  .layout-grid .product-card.strain-hybrid .strain-bar,.layout-pricewall .product-card.strain-hybrid .strain-bar{background:linear-gradient(180deg,#22c55e,#15803d);box-shadow:0 0 16px rgba(34,197,94,0.35);}
  .layout-grid .card-image,.layout-pricewall .card-image{display:block;width:4.6rem;height:4.6rem;object-fit:cover;border-radius:0.48rem;border:1px solid var(--border);background:var(--bg-elev);box-shadow:0 10px 22px rgba(0,0,0,0.22);}
  .layout-pricewall{grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(23rem,0.72fr);gap:1.15rem;}
  .layout-pricewall .category-block{border-radius:1rem;padding:1rem;background:linear-gradient(180deg,rgba(255,255,255,0.055),rgba(0,0,0,0.2)),var(--bg-card);}
  .layout-pricewall .category-title{font-size:var(--tv-category-size);letter-spacing:0.005em;text-transform:uppercase;}
  .layout-pricewall .grid-products{gap:0.55rem;}
  .layout-pricewall .product-card{min-height:5.9rem;padding:0.66rem 0.88rem 0.66rem 0;gap:0.82rem;border-radius:0.62rem;box-shadow:0 10px 24px rgba(0,0,0,0.18);}
  .layout-pricewall .product-card.has-image{grid-template-columns:0.34rem 4.4rem minmax(0,1fr) auto;}
  .layout-pricewall .strain-bar{width:0.34rem;}
  .layout-pricewall .card-image{width:4.4rem;height:4.4rem;border-radius:0.48rem;}
  .layout-pricewall .card-body{min-width:0;display:flex;flex-direction:column;justify-content:center;gap:0.3rem;}
  .layout-grid .card-name,.layout-pricewall .card-name{font-size:var(--tv-name-size);font-weight:900;line-height:1.08;color:var(--text);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-transform:none;}
  body.font-small .layout-pricewall .grid-products:not(.count-1):not(.count-2):not(.count-3) .product-card.name-long{flex-grow:1.5;}
  body.font-small .layout-pricewall .grid-products:not(.count-1):not(.count-2):not(.count-3) .product-card.name-extra-long{flex-grow:2;}
  body.font-small .layout-pricewall .product-card.name-long .card-name{-webkit-line-clamp:3;}
  body.font-small .layout-pricewall .product-card.name-extra-long .card-name{-webkit-line-clamp:4;}
  .font-scale-large .category-accessories .card-name{-webkit-line-clamp:4;}
  .layout-grid .card-meta,.layout-pricewall .card-meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;min-width:0;max-width:none;font-size:var(--tv-meta-size);font-weight:700;line-height:1.16;gap:0.22rem 0.55rem;color:var(--text);opacity:0.82;}
  .layout-pricewall .card-meta span{white-space:nowrap;}
  .layout-pricewall .card-desc{display:-webkit-box;-webkit-line-clamp:1;}
  .layout-grid .compact-desc{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;white-space:normal;overflow:hidden;font-size:var(--tv-table-size);line-height:1.18;}
  .layout-grid .compact-desc,.layout-pricewall .compact-desc,.layout-cinematic .compact-desc,.layout-editorial .compact-desc,.layout-sparse .stack-card .compact-desc{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;white-space:normal;overflow:hidden;}
  .font-scale-large .layout-grid .product-card{grid-template-columns:0.38rem minmax(0,1fr);grid-template-areas:"bar body" "bar price";align-content:center;}
  .font-scale-large .layout-grid .product-card.has-image{grid-template-columns:0.38rem 4.6rem minmax(0,1fr);grid-template-areas:"bar image body" "bar image price";}
  .font-scale-large .layout-grid .strain-bar{grid-area:bar;}
  .font-scale-large .layout-grid .card-image{grid-area:image;}
  .font-scale-large .layout-grid .card-body{grid-area:body;}
  .font-scale-large .layout-grid .card-price{grid-area:price;min-width:0;text-align:left;}
  .font-scale-large .layout-grid .price-tiers{width:auto;grid-template-columns:repeat(3,minmax(3.5rem,max-content));justify-content:start;}
  .layout-grid .card-price,.layout-pricewall .card-price{font-size:var(--tv-price-size);font-weight:950;line-height:1;color:var(--text);min-width:7.5rem;text-align:right;font-variant-numeric:tabular-nums;}
  .layout-pricewall .card-price .promo-price{display:block;width:max-content;margin:0 0 0.25rem auto;padding:0.18rem 0.46rem;border:1px solid var(--accent);border-radius:999px;background:var(--accent-dim);color:var(--text);font-size:var(--tv-tier-label-size);line-height:1;font-weight:950;letter-spacing:0.07em;text-transform:uppercase;}
  .layout-pricewall .category-block{grid-row:1 / span 3;}
  .layout-pricewall .pricewall-shell{grid-column:3;grid-row:1 / span 3;display:flex;flex-direction:column;gap:0.85rem;min-width:0;min-height:0;}
  .layout-pricewall:not(.pricewall-no-rail):has(> .category-block:first-child:nth-last-child(2)){grid-template-columns:minmax(0,1fr) minmax(23rem,0.72fr);}
  .layout-pricewall:not(.pricewall-no-rail):has(> .category-block:first-child:nth-last-child(2)) .category-block{grid-column:1;}
  .layout-pricewall:not(.pricewall-no-rail):has(> .category-block:first-child:nth-last-child(2)) .pricewall-shell{grid-column:2;}
  .layout-pricewall.pricewall-no-rail{grid-template-columns:repeat(2,minmax(0,1fr));}
  .font-scale-high .layout-pricewall .pricewall-shell{display:none;}
  .font-scale-high .layout-pricewall:not(.pricewall-no-rail):has(> .category-block:first-child:nth-last-child(2)){grid-template-columns:minmax(0,1fr);}
  .font-scale-high .layout-pricewall:not(.pricewall-no-rail):has(> .category-block:first-child:nth-last-child(2)) .category-block{grid-column:1;}
  .font-scale-high .layout-pricewall:not(.pricewall-no-rail):has(> .category-block:first-child:nth-last-child(3)){grid-template-columns:repeat(2,minmax(0,1fr));}
  body.has-promo-banner .menu-content{padding-top:0.95rem;padding-bottom:0.7rem;}
  body.has-promo-banner .layout-grid .category-block,body.has-promo-banner .layout-pricewall .category-block{padding:0.78rem;}
  body.has-promo-banner .layout-grid .category-header,body.has-promo-banner .layout-pricewall .category-header{margin-bottom:0.55rem;padding-bottom:0.48rem;}
  body.has-promo-banner .layout-grid .grid-products,body.has-promo-banner .layout-pricewall .grid-products{gap:0.36rem;}
  body.has-promo-banner .layout-grid .product-card,body.has-promo-banner .layout-pricewall .product-card{min-height:4.45rem;padding-top:0.48rem;padding-bottom:0.48rem;}
  body.has-promo-banner .layout-grid .product-card.has-image,body.has-promo-banner .layout-pricewall .product-card.has-image{grid-template-columns:0.34rem 3.4rem minmax(0,1fr) auto;}
  body.has-promo-banner .layout-grid .card-image,body.has-promo-banner .layout-pricewall .card-image{width:3.4rem;height:3.4rem;}
  .pricewall-panel{background:linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)),var(--bg-card);border:1px solid var(--border);border-radius:1rem;padding:1rem;box-shadow:var(--card-shadow);overflow:hidden;}
  .pricewall-panel-title{font-size:var(--tv-meta-size);font-weight:950;color:var(--text);opacity:0.78;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:0.65rem;}
  .pricewall-promo{min-height:9.5rem;display:flex;align-items:flex-start;justify-content:center;background:radial-gradient(circle at 78% 18%,var(--accent-dim),transparent 45%),linear-gradient(160deg,rgba(255,255,255,0.09),rgba(0,0,0,0.16)),var(--bg-card);}
  .pricewall-promo-main{font-size:clamp(2rem,2.75vw,3.55rem);line-height:0.96;font-weight:1000;letter-spacing:-0.055em;color:var(--accent);text-shadow:0 0 26px var(--accent-glow);}
  .pricewall-promo-sub{display:none;}
  .pricewall-status{display:none;}
  .pricewall-status strong{font-size:clamp(1.35rem,1.7vw,1.9rem);line-height:1;color:var(--text);letter-spacing:-0.035em;}
  .pricewall-specials{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:0.6rem;}
  .pricewall-special-row{display:grid;grid-template-columns:minmax(0,1fr);gap:0.3rem;align-content:start;border-top:1px solid var(--border);padding-top:0.7rem;}
  .pricewall-special-row:first-child{border-top:0;padding-top:0;}
  .pricewall-special-name{font-weight:900;font-size:var(--tv-name-size);line-height:1.12;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .pricewall-special-price{min-width:0;font-weight:1000;color:var(--accent);font-size:var(--tv-price-size);font-variant-numeric:tabular-nums;}
  .pricewall-special-price .price-pair{justify-content:flex-start;}
  .pricewall-special-price .card-price-orig{display:inline-block;margin:0 0 0 0.65rem;}
  .layout-list .product-row{display:grid;grid-template-columns:minmax(0,auto) minmax(0,auto) minmax(1rem,1fr) auto;grid-template-areas:"name meta leader price" "desc desc desc price";align-items:baseline;column-gap:0.5rem;row-gap:0.12rem;padding:0.5rem 0;border-bottom:1px solid var(--border);min-width:0;}
  .layout-list .row-name{grid-area:name;font-size:var(--tv-name-size);font-weight:850;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
  .layout-list .row-meta{grid-area:meta;font-size:var(--tv-meta-size);font-weight:700;color:var(--text);opacity:0.82;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
  .layout-list .row-desc{grid-area:desc;font-size:var(--tv-meta-size);font-weight:650;line-height:1.16;color:var(--text);opacity:0.86;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
  .layout-list .leader{grid-area:leader;border-bottom:1px dotted var(--text-faint);min-width:1rem;align-self:end;margin-bottom:0.3rem;}
  .layout-list .row-price{grid-area:price;align-self:center;font-size:var(--tv-price-size);font-weight:950;color:var(--text);white-space:nowrap;}

  .layout-grid .card-body{min-width:0;display:flex;flex-direction:column;gap:0.26rem;}
  .layout-grid .card-meta{display:flex;flex-wrap:wrap;align-items:center;gap:0.18rem 0.45rem;min-width:0;max-width:none;line-height:1.12;}
  .layout-grid .card-meta span{white-space:nowrap;}
  .product-maker{color:var(--text);font-weight:900;}
  .product-maker::before{content:'By ';color:var(--text-muted);font-weight:700;}
  .layout-grid .card-meta .product-maker,.layout-pricewall .card-meta .product-maker{flex-basis:100%;}
  body.font-small .layout-pricewall .product-card{min-height:0;padding-top:0.25rem;padding-bottom:0.25rem;}
  body.font-small .layout-pricewall .card-body{gap:0.2rem;}
  body.font-small .layout-pricewall .card-name{line-height:1;-webkit-line-clamp:2;}
  body.font-small .layout-pricewall .card-meta{flex-wrap:wrap;gap:0.12rem 0.35rem;line-height:1;overflow:visible;}
  body.font-small .layout-pricewall .card-meta span{flex:0 0 auto;}
  body.font-small .layout-pricewall .card-meta .product-maker{flex:1 1 100%;flex-basis:100%;min-width:0;white-space:normal;overflow-wrap:anywhere;}
  body.font-small .layout-pricewall .card-price{line-height:0.95;}
  body.font-small .layout-pricewall .card-price .promo-price{margin-bottom:0.12rem;padding:0.12rem 0.35rem;}
  body.font-small .layout-pricewall .card-price-orig{margin-top:0.1rem;}
  .card-desc{font-size:var(--tv-meta-size);font-weight:650;line-height:1.24;color:var(--text);opacity:0.86;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;overflow-wrap:anywhere;}
  .layout-showcase .card-desc{max-width:62ch;font-size:var(--tv-hero-meta-size);-webkit-line-clamp:3;}
  .layout-sparse .hero-card .card-desc{font-size:var(--tv-feature-meta-size);-webkit-line-clamp:3;}
  .layout-cinematic .product-card.no-image .card-body{grid-template-areas:"name price" "meta price" "desc price";}
  .layout-cinematic .product-card.no-image .card-desc{grid-area:desc;}
  .layout-list .category-accessories .product-row{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"name price" "meta price" "desc price";align-items:start;column-gap:1rem;row-gap:0.2rem;}
  .layout-list .category-accessories .row-name{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
  .layout-list .category-accessories .row-meta{white-space:normal;overflow:visible;}
  .layout-list .category-accessories .leader{display:none;}
  .layout-poster,.layout-cinematic,.layout-editorial{display:flex;flex-direction:column;gap:0.85rem;height:100%;min-height:0;}
  .layout-poster .category-block,.layout-cinematic .category-block,.layout-editorial .category-block{display:flex;flex-direction:column;flex:1 1 0;min-height:0;}
  .layout-poster .category-header,.layout-cinematic .category-header,.layout-editorial .category-header{flex:0 0 auto;}
  .layout-poster .poster-products{display:flex;flex-direction:column;gap:1rem;flex:1 1 auto;min-height:0;}
  .layout-poster .product-row{display:flex;gap:1.5rem;align-items:center;padding:1rem;background:var(--bg-card);border-radius:0.6rem;border:1px solid var(--border);}
  .layout-poster .card-image{width:200px;height:200px;object-fit:cover;border-radius:0.4rem;flex-shrink:0;}
  .layout-poster .product-info{flex:1;display:flex;flex-direction:column;gap:0.5rem;}
  .layout-poster .card-name{font-size:var(--tv-feature-name-size);font-weight:900;color:var(--text);}
  .layout-poster .card-meta{font-size:var(--tv-feature-meta-size);color:var(--text);}
  .layout-poster .card-price{font-size:var(--tv-feature-price-size);font-weight:950;color:var(--text);}
  .layout-poster .product-row.no-image{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;min-height:6.4rem;padding:1rem 1.15rem;}
  .layout-poster .poster-products.no-images{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(44rem,100%),1fr));grid-auto-rows:minmax(8rem,auto);align-content:start;gap:0.75rem;}
  .layout-poster .product-row.no-image .product-info{min-width:0;gap:0.28rem;}
  .layout-poster .product-row.no-image .card-name{font-size:var(--tv-name-size);line-height:1.08;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .layout-poster .product-row.no-image .card-meta{font-size:var(--tv-meta-size);white-space:normal;overflow-wrap:anywhere;}
  .layout-poster .product-row.no-image .card-price{font-size:var(--tv-price-size);line-height:1;text-align:right;}
  .layout-poster .product-row.no-image .card-image{display:none;}

  .layout-cinematic .cinematic-products{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:0.78rem;flex:1 1 auto;min-height:0;}
  .layout-cinematic .cinematic-products.count-1 .product-card,.layout-cinematic .cinematic-products.count-3 .product-card:first-child{grid-column:1 / -1;}
  .layout-cinematic .product-card{position:relative;border-radius:0.8rem;overflow:hidden;height:100%;min-height:0;background:var(--bg-card);border:1px solid var(--border);box-shadow:var(--card-shadow);}
  .layout-cinematic .card-image{width:100%;height:100%;object-fit:cover;border:0;}
  .layout-cinematic .card-body{position:absolute;left:0;right:0;bottom:0;padding:0.9rem 1rem;background:linear-gradient(to top,rgba(0,0,0,0.98) 0%,rgba(0,0,0,0.9) 70%,rgba(0,0,0,0.68) 100%);display:flex;flex-direction:column;gap:0.2rem;}
  .layout-cinematic .card-name{font-size:var(--tv-name-size);font-weight:900;line-height:1.04;color:#fff;text-shadow:0 2px 18px rgba(0,0,0,0.9);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}
  .layout-cinematic .card-meta{font-size:var(--tv-meta-size);line-height:1.16;color:rgba(255,255,255,0.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .layout-cinematic .card-price{font-size:var(--tv-price-size);line-height:1;font-weight:950;color:#fff;}
  .layout-cinematic .product-card.no-image{height:100%;min-height:7.2rem;border-color:var(--border-hover);background:radial-gradient(circle at 84% 16%,var(--accent-dim),transparent 42%),linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.018)),var(--bg-card);}
  .layout-cinematic .product-card.no-image .card-body{position:static;height:100%;min-height:7.2rem;padding:1rem 1.15rem;background:transparent;display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"name" "meta" "desc" "price";align-content:center;align-items:center;row-gap:0.28rem;box-shadow:inset 0.38rem 0 var(--accent);}
  .layout-cinematic .product-card.no-image .card-name{grid-area:name;font-size:var(--tv-name-size);line-height:1.08;display:block;white-space:normal;overflow:visible;}
  .layout-cinematic .product-card.no-image .card-meta{grid-area:meta;font-size:var(--tv-meta-size);white-space:normal;overflow:visible;}
  .layout-cinematic .product-card.no-image .card-desc{grid-area:desc;}
  .layout-cinematic .product-card.no-image .card-price{grid-area:price;font-size:var(--tv-price-size);line-height:1;text-align:left;margin-top:0.15rem;}

  .layout-showcase .showcase-products{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;}
  .layout-showcase .product-card{display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center;}
  .layout-showcase .card-image{width:500px;height:400px;object-fit:cover;border-radius:1rem;}
  .layout-showcase .card-name{font-size:var(--tv-hero-name-size);font-weight:900;color:var(--text);}
  .layout-showcase .card-meta{font-size:var(--tv-hero-meta-size);color:var(--text);}
  .layout-showcase .card-price{font-size:var(--tv-hero-price-size);font-weight:950;color:var(--text);}

  .layout-editorial .editorial-products{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:minmax(0,1fr);gap:1rem;flex:1 1 auto;min-height:0;}
  .layout-editorial .product-card{position:relative;background:var(--bg-card);border:1px solid var(--border);border-radius:0.75rem;overflow:hidden;box-shadow:var(--card-shadow);min-height:0;}
  .layout-editorial .editorial-products.no-images{grid-template-columns:repeat(auto-fit,minmax(min(44rem,100%),1fr));}
  .layout-editorial .card-image{width:100%;height:100%;object-fit:cover;border:0;}
  .layout-editorial .card-body{position:absolute;left:0;right:0;bottom:0;padding:0.85rem 0.95rem;background:linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.62) 72%,transparent 100%);display:flex;flex-direction:column;gap:0.18rem;}
  .layout-editorial .card-name{font-size:var(--tv-name-size);line-height:1.06;font-weight:900;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,0.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .layout-editorial .card-meta{font-size:var(--tv-meta-size);line-height:1.12;color:rgba(255,255,255,0.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .layout-editorial .card-price{font-size:var(--tv-price-size);line-height:1;font-weight:950;color:#fff;}
  .layout-editorial .product-card.no-image{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:1rem;padding:0.85rem 1rem;min-height:5.8rem;height:100%;}
  .layout-editorial .product-card.no-image .card-body{position:static;padding:0;min-width:0;background:none;display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"name price" "meta price" "desc price";align-content:center;align-items:center;column-gap:1rem;row-gap:0.2rem;}
  .layout-editorial .product-card.no-image .card-name{grid-area:name;font-size:var(--tv-editorial-name-size);line-height:1.08;white-space:normal;overflow:visible;}
  .layout-editorial .product-card.no-image .card-meta{grid-area:meta;font-size:var(--tv-meta-size);white-space:normal;overflow-wrap:anywhere;}
  .layout-editorial .product-card.no-image .card-desc{grid-area:desc;}
  .layout-editorial .product-card.no-image .card-price{grid-area:price;font-size:var(--tv-price-size);line-height:1;text-align:right;}

  .font-scale-maximum .compact-desc{display:block;white-space:normal;overflow:visible;-webkit-line-clamp:unset;}
  .font-scale-maximum .layout-list .row-desc{white-space:normal;overflow:visible;text-overflow:clip;}
  .font-scale-maximum .layout-list .row-price{overflow:visible;line-height:1.08;}
  .font-scale-high .layout-editorial .editorial-products{grid-template-columns:repeat(2,minmax(0,1fr));}
  .font-scale-maximum .layout-editorial .editorial-products{grid-template-columns:minmax(0,1fr);}
  .font-scale-maximum .layout-editorial .card-name,.font-scale-maximum .layout-editorial .card-meta{white-space:normal;overflow:visible;text-overflow:clip;}
  .font-scale-high .layout-showcase .showcase-products{align-items:stretch;}
  .font-scale-high .layout-showcase .product-card{display:grid;grid-template-columns:minmax(15rem,0.8fr) minmax(0,1.2fr);grid-template-areas:"image name" "image meta" "image desc" "image price";grid-template-rows:auto auto auto auto;align-content:center;align-items:center;column-gap:2rem;row-gap:0.35rem;height:100%;min-height:0;text-align:left;}
  .font-scale-high .layout-showcase .product-card:not(:has(.card-image)){grid-template-columns:minmax(0,1fr);grid-template-areas:"name" "meta" "desc" "price";text-align:center;}
  .font-scale-high .layout-showcase .card-image{grid-area:image;width:100%;height:min(55vh,30rem);object-fit:contain;}
  .font-scale-high .layout-showcase .card-name{grid-area:name;font-size:clamp(5rem,7vw,8rem);line-height:1;}
  .font-scale-high .layout-showcase .card-meta{grid-area:meta;font-size:clamp(2.2rem,3vw,3rem);line-height:1.08;}
  .font-scale-high .layout-showcase .card-desc{grid-area:desc;max-width:none;}
  .font-scale-high .layout-showcase .card-price{grid-area:price;font-size:clamp(5rem,7.5vw,8rem);line-height:1.04;overflow:visible;}
  .font-scale-high .layout-showcase .price-tiers{justify-content:flex-start;}
  .font-scale-high .layout-showcase .product-card:not(:has(.card-image)) .price-tiers{justify-content:center;}
  .out-of-stock{opacity:0.5;}
  .out-of-stock .card-image{filter:grayscale(0.6);}
  .card-price-orig{color:var(--text-muted);font-size:0.72em;font-weight:750;text-decoration:line-through;text-decoration-thickness:0.1em;}
  .sale-text{color:var(--accent);font-weight:950;white-space:nowrap;}
  .oos-text{color:var(--text-faint);font-style:italic;}

  @keyframes menu-page-exit{from{opacity:1;}to{opacity:0;}}
  @keyframes menu-page-enter{from{opacity:0;}to{opacity:1;}}
  @media (prefers-reduced-motion:reduce){
    .phase,.menu-content.page-exit,.menu-content.page-enter{animation:none!important;transition:none!important;transform:none!important;}
    .pairing-glow,.conn-dot{animation:none!important;}
  }
  @keyframes blink{0%,100%{opacity:0.5;}50%{opacity:1;}}
  .cursor-hidden,.cursor-hidden *{cursor:none !important;}
  .empty-state{grid-column:1/-1;align-self:stretch;display:flex;align-items:center;justify-content:center;height:100%;min-height:0;padding:3rem;color:var(--text-faint);text-align:center;}
  .empty-state-card{max-width:920px;border:1px solid var(--border);border-radius:1.4rem;background:linear-gradient(150deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02)),var(--bg-elev);padding:3rem;box-shadow:var(--card-shadow);}
  .empty-state-kicker{color:var(--accent);font-weight:900;letter-spacing:0.18em;text-transform:uppercase;font-size:1rem;margin-bottom:0.8rem;}
  .empty-state-title{color:var(--text);font-size:clamp(2.6rem,5vw,5rem);line-height:0.95;font-weight:950;letter-spacing:-0.055em;margin-bottom:1rem;}
  .empty-state-copy{color:var(--text);font-size:clamp(1.15rem,1.6vw,1.65rem);line-height:1.35;margin-bottom:1.4rem;}
  .empty-state-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:0.8rem;text-align:left;}
  .empty-state-step{border:1px solid var(--border);border-radius:0.9rem;padding:1rem;background:rgba(0,0,0,0.22);color:var(--text);font-size:clamp(1.02rem,1.2vw,1.25rem);line-height:1.22;}
  .empty-state-step b{display:block;color:var(--text);font-size:clamp(1rem,1.25vw,1.3rem);margin-bottom:0.3rem;}

  .conn-indicator{position:fixed;top:1rem;right:1rem;display:flex;align-items:center;gap:0.5rem;padding:0.45rem 0.9rem;border-radius:2rem;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);border:1px solid var(--border);font-size:0.75rem;font-weight:700;z-index:200;opacity:0;transition:opacity 0.5s;pointer-events:none;}
  .conn-indicator.visible{opacity:1;}
  .conn-dot{width:9px;height:9px;border-radius:50%;background:#ef4444;animation:blink 1.5s ease-in-out infinite;}
  .conn-dot.connected{background:var(--accent);}

  .tv-info{display:none;}
  .tv-info.visible{opacity:0.85;}
  .demo-pill{display:none;padding:0.38rem 0.75rem;border-radius:999px;background:rgba(250,204,21,0.16);border:1px solid rgba(250,204,21,0.34);color:#fde68a;font-size:0.72rem;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;pointer-events:none;backdrop-filter:blur(10px);white-space:nowrap;}
  .demo-pill.visible{display:block;}

  .price-pair{display:inline-flex;align-items:baseline;justify-content:flex-end;gap:0.42rem;white-space:nowrap;}
  .price-value{font:inherit;color:inherit;}
  .price-weight{display:inline-flex;align-items:center;padding:0.2em 0.42em;border:1px solid var(--accent);border-radius:0.42em;background:var(--accent-dim);color:var(--text);font-size:0.62em;font-weight:950;line-height:1;letter-spacing:0.025em;white-space:nowrap;}
  .card-price-orig{display:block;margin-top:0.22rem;}
  .price-tiers{display:flex;flex-wrap:wrap;gap:0.45rem 0.55rem;margin-top:auto;align-items:stretch;}
  .price-tiers .tier{display:inline-flex;flex-direction:row;align-items:baseline;gap:0.32rem;padding:0.34rem 0.5rem;border-radius:0.45rem;background:rgba(255,255,255,0.045);border:1px solid var(--border);min-width:3.75rem;}
  .price-tiers .tier-label{font-size:var(--tv-tier-label-size);font-weight:950;text-transform:uppercase;letter-spacing:0.04em;color:var(--text);line-height:1;}
  .price-tiers .tier-price{font-size:var(--tv-tier-price-size);font-weight:950;line-height:1.05;color:var(--text);}
  .layout-grid .price-tiers{display:grid;grid-template-columns:repeat(2,minmax(3.5rem,1fr));width:11.75rem;max-width:100%;justify-content:flex-end;gap:0.35rem;margin-top:0;}
  .layout-grid .price-tiers .tier{min-width:3.5rem;padding:0.28rem 0.42rem;border-radius:0.38rem;}
  .layout-grid .price-tiers .tier-label{font-size:var(--tv-tier-label-size);}
  .layout-grid .price-tiers .tier-price{font-size:var(--tv-tier-price-size);}
  .layout-pricewall .price-tiers{display:grid;grid-template-columns:repeat(2,minmax(4.5rem,1fr));gap:0.38rem;min-width:10rem;}
  .layout-pricewall .price-tiers .tier{min-width:0;justify-content:flex-end;padding:0.3rem 0.44rem;}
  .layout-pricewall .price-tiers .tier-label{font-size:var(--tv-tier-label-size);}
  .layout-pricewall .price-tiers .tier-price{font-size:var(--tv-tier-price-size);font-variant-numeric:tabular-nums;}
  .layout-list .price-tiers{display:grid;grid-template-columns:repeat(3,max-content);margin-top:0;gap:0.35rem;}
  .layout-list .price-tiers .tier{padding:0;background:transparent;border:0;min-width:auto;align-items:baseline;gap:0.25rem;}
  .layout-list .price-tiers .tier-price{font-size:var(--tv-tier-price-size);}
  .layout-poster .price-tiers .tier-price{font-size:var(--tv-feature-meta-size);}
  .layout-cinematic .price-tiers .tier-price{font-size:var(--tv-tier-price-size);color:var(--text);}
  .layout-showcase .price-tiers{justify-content:center;gap:1rem 1.5rem;}
  .layout-showcase .price-tiers .tier-price{font-size:var(--tv-feature-price-size);}
  .layout-editorial .price-tiers .tier-price{font-size:var(--tv-tier-price-size);}

  /* Sparse layout for 1-of-4 (or more) multi-display setups: hero + stacked cards fill the screen */
  .layout-sparse{display:flex;flex-direction:column;min-height:0;}
  .layout-sparse .category-block{display:flex;flex-direction:column;flex:1;min-height:0;}
  .layout-sparse .category-header{flex-shrink:0;}
  .layout-sparse .sparse-products{display:flex;flex-direction:column;gap:1rem;flex:1;min-height:0;}
  .layout-sparse .hero-card{display:grid;grid-template-columns:1.2fr 1fr;grid-template-rows:1fr;gap:1.5rem;background:var(--card-grad),var(--bg-card);border:1px solid var(--border);border-radius:0.8rem;overflow:hidden;flex:0.82;min-height:0;padding:1.5rem;}
  .layout-sparse .hero-card .card-image{width:100%;height:100%;object-fit:cover;border-radius:0.6rem;min-height:0;}
  .layout-sparse .hero-card.no-image{grid-template-columns:1fr;}
  .layout-sparse .hero-info{display:flex;flex-direction:column;justify-content:center;gap:0.75rem;min-width:0;}
  .layout-sparse .hero-name{font-size:var(--tv-feature-name-size);font-weight:900;line-height:1.1;color:var(--text);overflow-wrap:break-word;}
  .layout-sparse .hero-meta{font-size:var(--tv-feature-meta-size);color:var(--text);}
  .layout-sparse .hero-price{font-size:var(--tv-feature-price-size);font-weight:950;color:var(--text);margin-top:auto;}
  .layout-sparse .stack{display:flex;flex-direction:column;gap:0.75rem;flex:1.18;min-height:0;}
  .layout-sparse .stack-card{display:grid;grid-template-columns:110px 1fr auto;gap:1rem;align-items:center;background:var(--card-grad),var(--bg-card);border:1px solid var(--border);border-radius:0.6rem;overflow:hidden;padding:0.75rem;flex:1;min-height:0;}
  .layout-sparse .stack-card .card-image{width:110px;height:85px;object-fit:cover;border-radius:0.4rem;}
  .layout-sparse .stack-card.no-image{grid-template-columns:1fr auto;}
  .layout-sparse .stack-card .card-name{font-size:var(--tv-name-size);font-weight:850;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .layout-sparse .stack-card .card-meta{font-size:var(--tv-meta-size);color:var(--text);}
  .layout-sparse .stack-card .card-price{font-size:var(--tv-price-size);font-weight:950;color:var(--text);}
  .layout-sparse .stack-info{min-width:0;display:grid;gap:0.18rem;}

  /* Single-product sparse category: vertical hero card fills remaining viewport */
  .menu-content.layout-sparse{display:flex;flex-direction:column;min-height:0;}
  .layout-sparse .category-block.single-product{flex:1;min-height:0;}
  .layout-sparse .single-product .sparse-products{flex:1;min-height:0;gap:0;}
  .layout-sparse.single-product .hero-card,.layout-sparse .single-product .hero-card{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;min-height:0;padding:2rem;gap:2rem;}
  .layout-sparse.single-product .hero-card .card-image,.layout-sparse .single-product .hero-card .card-image{width:100%;height:55%;max-height:55%;object-fit:cover;border-radius:0.8rem;}
  .layout-sparse.single-product .hero-card.no-image,.layout-sparse .single-product .hero-card.no-image{gap:1rem;}
  .layout-sparse.single-product .hero-info,.layout-sparse .single-product .hero-info{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;text-align:center;min-width:0;width:100%;}
  .layout-sparse.single-product .hero-name,.layout-sparse .single-product .hero-name{font-size:var(--tv-hero-name-size);}
  .layout-sparse.single-product .hero-meta,.layout-sparse .single-product .hero-meta{font-size:var(--tv-hero-meta-size);}
  .layout-sparse.single-product .hero-price,.layout-sparse .single-product .hero-price{font-size:var(--tv-hero-price-size);margin-top:1rem;}
  .font-scale-high .layout-sparse.single-product .hero-card,.font-scale-high .layout-sparse .single-product .hero-card{display:grid;grid-template-columns:minmax(15rem,0.8fr) minmax(0,1.2fr);grid-template-rows:minmax(0,1fr);align-items:stretch;justify-content:stretch;padding:1.5rem;gap:1.5rem;}
  .font-scale-high .layout-sparse.single-product .hero-card .card-image,.font-scale-high .layout-sparse .single-product .hero-card .card-image{width:100%;height:100%;max-height:none;object-fit:contain;}
  .font-scale-high .layout-sparse.single-product .hero-info,.font-scale-high .layout-sparse .single-product .hero-info{height:100%;min-height:0;align-items:flex-start;justify-content:center;gap:0.55rem;text-align:left;}
  .font-scale-high .layout-sparse.single-product .hero-card.no-image,.font-scale-high .layout-sparse .single-product .hero-card.no-image{grid-template-columns:minmax(0,1fr);}
  .font-scale-high .layout-sparse.single-product .hero-card.no-image .hero-info,.font-scale-high .layout-sparse .single-product .hero-card.no-image .hero-info{align-items:center;text-align:center;}
  .font-scale-high .layout-sparse.single-product .hero-name,.font-scale-high .layout-sparse .single-product .hero-name{font-size:clamp(5rem,7vw,8rem);line-height:1;}
  .font-scale-high .layout-sparse.single-product .hero-meta,.font-scale-high .layout-sparse .single-product .hero-meta{font-size:clamp(2.2rem,3vw,3rem);line-height:1.08;}
  .font-scale-high .layout-sparse.single-product .hero-price,.font-scale-high .layout-sparse .single-product .hero-price{font-size:clamp(5rem,7.5vw,8rem);line-height:1.04;margin-top:0.5rem;}

  /* Minimal TV strain labels: text-first, no pill/chip noise */
  .strain-badge-tv{display:inline;color:var(--text-muted);font-weight:850;text-transform:uppercase;letter-spacing:0.04em;}
  .strain-dot-tv{display:none;}
  .card-meta .strain-badge-tv,.row-meta .strain-badge-tv,.hero-meta .strain-badge-tv{margin-right:0;}
  .hero-meta .strain-badge-tv{font-size:1em;padding:0;}


  /* ----------------------------------------------------------------
     Mobile-aware layout.
     The TV view is designed for 1920×1080 and scaled down via JS
     (fitToScreen). On phone-width screens that produces tiny text and
     large blank margins. Instead we let the #menu render at its natural
     width and provide responsive overrides so content is readable and
     free of horizontal overflow at 390×844.
  ----------------------------------------------------------------- */
  @media (max-width:768px){
    body{font-size:16px;}
    html,body{overflow:auto;height:auto;min-height:100vh;}
    .phase{position:relative;inset:auto;height:auto;min-height:100vh;}
    #menu{width:100% !important;height:auto !important;transform:none !important;margin:0 !important;}
    .menu-header{padding:0.75rem 1rem;position:sticky;top:0;gap:0.6rem;}
    .header-logo{max-height:36px;max-width:120px;}
    .dispensary-name{font-size:1.4rem;}
    .demo-pill{font-size:0.58rem;padding:0.28rem 0.5rem;letter-spacing:0.06em;}
    .menu-content{padding:1rem;overflow-y:auto;max-height:none;}
    .menu-footer{padding:0.5rem 1rem;font-size:0.7rem;}
    .promo-bar{font-size:0.85rem;padding:0.4rem 1rem;}
    .category-header{margin-bottom:0.6rem;padding-bottom:0.3rem;}
    .category-title{font-size:1.2rem;gap:0.4rem;}
    .cat-icon-wrap{width:1.1em;height:1.1em;}
    .cat-icon{width:100%;height:100%;}

    .layout-grid,.layout-pricewall{grid-template-columns:1fr;gap:0.9rem;height:auto;min-height:0;align-items:start;}
    .layout-grid .category-block,.layout-pricewall .category-block{padding:0.75rem;border-radius:0.75rem;min-height:0;}
    .layout-grid .grid-products,.layout-pricewall .grid-products{display:flex;flex-direction:column;gap:0.55rem;flex:0 0 auto;}
    .layout-grid .product-table-head,.layout-pricewall .product-table-head{font-size:0.62rem;padding-left:0.45rem;}
    .layout-grid .product-card,.layout-pricewall .product-card{grid-template-columns:0.28rem minmax(0,1fr);gap:0.5rem;min-height:4.8rem;padding:0.55rem 0.6rem 0.55rem 0;flex:0 0 auto;}
    .layout-grid .product-card.has-image,.layout-pricewall .product-card.has-image{grid-template-columns:0.28rem 3.4rem minmax(0,1fr);}
    .layout-grid .card-image,.layout-pricewall .card-image{width:3.4rem;height:3.4rem;border-radius:0.42rem;}
    .layout-grid .card-body,.layout-pricewall .card-body{display:flex;flex-direction:column;gap:0.22rem;min-width:0;}
    .layout-grid .card-name,.layout-pricewall .card-name{font-size:1rem;white-space:normal;}
    .layout-grid .card-meta,.layout-pricewall .card-meta{font-size:0.72rem;justify-content:flex-start;min-width:0;max-width:none;}
    .layout-grid .card-desc,.layout-pricewall .card-desc{font-size:0.78rem;-webkit-line-clamp:2;}
    .layout-grid .card-price,.layout-pricewall .card-price{grid-column:2 / -1;font-size:1.25rem;text-align:left;min-width:0;}
    .layout-pricewall .pricewall-shell{grid-column:auto;grid-row:auto;gap:0.7rem;}
    .pricewall-promo{min-height:0;}
    .pricewall-promo-main{font-size:2rem;letter-spacing:-0.035em;}
    .pricewall-promo-sub{font-size:0.95rem;}

    .layout-list .product-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:0.18rem 0.6rem;padding:0.5rem 0;}
    .layout-list .row-name{font-size:1rem;grid-column:1;min-width:0;}
    .layout-list .row-meta{font-size:0.8rem;grid-column:1 / -1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .layout-list .leader{display:none;}
    .layout-list .row-price{font-size:1.15rem;grid-column:2;grid-row:1;text-align:right;}

    .layout-poster .product-row{flex-direction:column;align-items:stretch;gap:0.6rem;padding:0.75rem;}
    .layout-poster .card-image{width:100%;height:auto;aspect-ratio:1/1;max-width:240px;margin:0 auto;}
    .layout-poster .card-name{font-size:1.3rem;}
    .layout-poster .card-meta{font-size:1rem;}
    .layout-poster .card-price{font-size:1.5rem;}

    .layout-cinematic .cinematic-products{grid-template-columns:1fr;}
    .layout-cinematic .product-card{height:auto;min-height:200px;}
    .layout-cinematic .card-image{height:180px;}
    .layout-cinematic .card-name{font-size:1.3rem;}
    .layout-cinematic .card-meta{font-size:0.95rem;}
    .layout-cinematic .card-price{font-size:1.4rem;}

    .layout-showcase .showcase-products{height:auto;padding:1rem 0;}
    .layout-showcase .card-image{width:100%;height:auto;aspect-ratio:4/3;max-width:320px;}
    .layout-showcase .card-name{font-size:1.5rem;}
    .layout-showcase .card-meta{font-size:1.1rem;}
    .layout-showcase .card-price{font-size:1.8rem;}

    .layout-editorial .category-block{flex:0 0 auto;min-height:0;}
    .layout-editorial .editorial-products{grid-template-columns:1fr;grid-auto-rows:minmax(180px,auto);}
    .layout-editorial .product-card{min-height:180px;}
    .layout-editorial .card-image{height:100%;}
    .layout-editorial .card-name{font-size:1.1rem;}
    .layout-editorial .card-meta{font-size:0.85rem;}
    .layout-editorial .card-price{font-size:1.2rem;}

    .layout-sparse .hero-card{grid-template-columns:1fr;padding:1rem;gap:1rem;}
    .layout-sparse .hero-card .card-image{height:180px;}
    .layout-sparse .hero-name{font-size:1.8rem;}
    .layout-sparse .hero-meta{font-size:1rem;}
    .layout-sparse .hero-price{font-size:2rem;}
    .layout-sparse .stack-card{grid-template-columns:80px 1fr auto;padding:0.5rem;gap:0.5rem;}
    .layout-sparse .stack-card .card-image{width:80px;height:60px;}
    .layout-sparse .stack-card .card-name{font-size:1rem;}
    .layout-sparse .stack-card .card-meta{font-size:0.85rem;}
    .layout-sparse .stack-card .card-price{font-size:1.2rem;}

    .layout-sparse.single-product .hero-card,.layout-sparse .single-product .hero-card{padding:1rem;gap:1rem;}
    .layout-sparse.single-product .hero-card .card-image,.layout-sparse .single-product .hero-card .card-image{height:45%;max-height:45%;}
    .layout-sparse.single-product .hero-name,.layout-sparse .single-product .hero-name{font-size:2rem;}
    .layout-sparse.single-product .hero-meta,.layout-sparse .single-product .hero-meta{font-size:1rem;}
    .layout-sparse.single-product .hero-price,.layout-sparse .single-product .hero-price{font-size:2.4rem;margin-top:0.5rem;}

    .price-tiers .tier-label{font-size:0.7rem;}
    .price-tiers .tier-price{font-size:0.95rem;}

    .conn-indicator{top:0.5rem;right:0.5rem;font-size:0.65rem;padding:0.35rem 0.7rem;}
    .tv-info{display:none;}

    .age-gate h2{font-size:2rem;}
    .age-gate p{font-size:1rem;}
    .age-gate .btn{font-size:1rem;padding:0.75rem 1.5rem;}
  }
</style>
</head>
<body class="template-${initialTemplate} font-${initialFontSize}" data-font-scale="${initialFontScale}">

<div id="pairing" class="phase"${hasInitialMenu ? ' hidden' : ''}>
  <div class="pairing-glow"></div>
  <div class="brand">
    <div class="brand-logo">DUBMENU</div>
    <div class="brand-tag">Digital Menu Board</div>
  </div>
  <div class="qr-section">
    <div class="qr-frame">
      <img src="${qrSrc}" alt="Scan to connect" />
    </div>
    <div class="access-code-wrap">
      <div class="access-code-label">Access Code</div>
      <div class="access-code">${safeSessionId.toUpperCase()}</div>
    </div>
  </div>
  <div class="pairing-instruction">Scan with your phone to configure your menu</div>
</div>

<div id="menu" class="phase"${hasInitialMenu ? '' : ' hidden'}>
  <div class="promo-bar" id="promo-bar"></div>
  <header class="menu-header">
    <div class="header-left">
      <img id="header-logo" class="header-logo" alt="">
      <div class="dispensary-name" id="dispensary-name">Loading...</div>
    </div>
    <div class="header-right">
      <div class="demo-pill" id="demo-pill">Demo data</div>
    </div>
  </header>
  <div class="menu-content" id="menu-content"></div>
  <footer class="menu-footer">
    <div class="footer-progress" id="footer-progress"></div>
    <div class="footer-right" id="footer-disclaimer">For use by licensed adults only. Keep out of reach of children.</div>
  </footer>
</div>

<div id="age-gate" class="age-gate${options?.noAgeGate ? ' hidden' : ''}">
  <h2>Age Verification</h2>
  <p>This menu is intended for adults 21 years of age or older. Please confirm your age to continue.</p>
  <button class="btn btn-primary" onclick="verifyAge()">I am 21+</button>
  <div class="btn-secondary">You must be 21+ to view this menu.</div>
</div>

<div class="conn-indicator" id="conn-indicator">
  <span class="conn-dot" id="conn-dot"></span>
  <span id="conn-text">Connecting</span>
</div>

<div class="tv-info" id="tv-info"></div>

<script>
(function(){
  var WS_URL = location.origin.replace(/^http/, 'ws') + '/ws/${safeSessionId}?role=tv';
  var DEMO_MODE = ${options?.demo ? 'true' : 'false'};
  var shouldResetTvCycle = ${shouldResetTvCycle.toString()};
  var shouldRunTvCycle = ${shouldRunTvCycle.toString()};
  var nextTvCyclePage = ${nextTvCyclePage.toString()};
  var TV_FONT_SCALE_MIN = ${TV_FONT_SCALE_MIN};
  var TV_FONT_SCALE_MAX = ${TV_FONT_SCALE_MAX};
  var TV_FONT_SCALE_DEFAULT = ${TV_FONT_SCALE_DEFAULT};
  var normalizeTvFontScale = ${normalizeTvFontScale.toString()};
  var tvFontSizeClass = ${tvFontSizeClass.toString()};
  var compactDescription = ${compactTvDescription.toString()};
  var formatProductName = ${formatTvProductName.toString()};
  var manualSpecialsCategory = ${buildTvManualSpecialsCategory.toString()};
  var formatTvPageProgress = ${formatTvPageProgress.toString()};
  var TV_PAGE_DURATION_OPTIONS = ${serializeInlineScriptJson(TV_PAGE_DURATION_OPTIONS)};
  var TV_PAGE_DURATION_DEFAULT = ${TV_PAGE_DURATION_DEFAULT};
  var TV_PAGE_TRANSITION_DEFAULT = ${serializeInlineScriptJson(TV_PAGE_TRANSITION_DEFAULT)};
  var normalizeTvPageDurationSeconds = ${normalizeTvPageDurationSeconds.toString()};
  var normalizeTvPageTransition = ${normalizeTvPageTransition.toString()};
  var __name = function(target){return target;};
  var buildTvCatalogPagePlan = ${buildTvCatalogPagePlan.toString()};
  var EMBED_MODE = new URLSearchParams(location.search).get('embed') === '1';
  var displayParams = new URLSearchParams(location.search);
  function boundedDisplayParam(name,fallback){
    var value = parseInt(displayParams.get(name) || String(fallback),10);
    return isFinite(value) ? Math.max(1,Math.min(4,value)) : fallback;
  }
  var DISPLAY_TOTAL = boundedDisplayParam('displays',1);
  var DISPLAY_NUM = Math.min(boundedDisplayParam('display',1),DISPLAY_TOTAL);

  // --- Per-TV URL overrides (do NOT persist to config) ---
  var ALLOWED_LAYOUTS = ['grid','list','pricewall','poster','cinematic','showcase','editorial','sparse'];
  var ALLOWED_TEMPLATES = ['default','light','neon','minimal','sunset','forest','royal','gold','ocean','crimson','bone','vapor'];
  var URL_LAYOUT = (function(){
    var v = new URLSearchParams(location.search).get('layout');
    if(v){ v = String(v).toLowerCase().trim(); if(ALLOWED_LAYOUTS.indexOf(v) !== -1) return v; else console.warn('[DubMenu TV] Invalid ?layout= "' + v + '" — falling back to config layout. Allowed: ' + ALLOWED_LAYOUTS.join(', ')); }
    return null;
  })();
  var URL_THEME = (function(){
    var v = new URLSearchParams(location.search).get('theme');
    if(v){ v = String(v).toLowerCase().trim(); if(ALLOWED_TEMPLATES.indexOf(v) !== -1) return v; else console.warn('[DubMenu TV] Invalid ?theme= "' + v + '" — falling back to config template. Allowed: ' + ALLOWED_TEMPLATES.join(', ')); }
    return null;
  })();
  var URL_FONT_SIZE = (function(){
    var v = new URLSearchParams(location.search).get('fontSize');
    return v === 'small' || v === 'medium' || v === 'large' ? v : null;
  })();
  var URL_FONT_SCALE = (function(){
    var value = new URLSearchParams(location.search).get('fontScale');
    if(value === null || String(value).trim() === '') return null;
    var numeric = Number(value);
    if(!Number.isFinite(numeric)){
      console.warn('[DubMenu TV] Invalid ?fontScale= "' + value + '" — falling back to config scale.');
      return null;
    }
    return normalizeTvFontScale(numeric);
  })();

  var CATEGORY_ICON_SVGS = ${serializeInlineScriptJson(CATEGORY_ICON_SVGS)};
  var CATEGORY_LABELS = ${serializeInlineScriptJson(CATEGORY_LABELS)};

  var ws = null;
  var config = null;
  var initialConfig = ${serializeInlineScriptJson(options?.initialConfig ?? null)};
  var paired = false;
  var reconnectAttempts = 0;
  var reconnectTimer = null;
  var heartbeatTimer = null;
  var cursorTimer = null;
  var displayWakeLock = null;
  var wakeLockRetryTimer = null;
  var MAX_RECONNECT_DELAY = 30000;

  function escapeHtml(str){
    if(str===null||str===undefined) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function hasProducts(cfg){
    return cfg && Array.isArray(cfg.categories) && cfg.categories.some(function(c){ return c && Array.isArray(c.products) && c.products.length > 0; });
  }
  function hasCategoryArray(cfg){
    return cfg && Array.isArray(cfg.categories);
  }

  var PRESERVE_INITIAL_DEMO_CONFIG = ${options?.demo ? 'true' : 'false'};

  var COMPLIANCE_TEMPLATES = ${serializeInlineScriptJson(COMPLIANCE_TEMPLATES)};
  function getDisclaimer(cfg){
    if(cfg && typeof cfg.disclaimer === 'string' && cfg.disclaimer.trim()){
      return cfg.disclaimer;
    }
    if(cfg && typeof cfg.complianceState === 'string' && cfg.complianceState){
      var tmpl = COMPLIANCE_TEMPLATES[cfg.complianceState.toUpperCase()];
      if(tmpl){
        var year = String(new Date().getFullYear());
        var name = (cfg.dispensaryName || '').trim();
        return tmpl.split('[Year]').join(year).split('[Dispensary]').join(name).trim();
      }
    }
    return '';
  }
  var normalizeTvUploadImageUrl = ${normalizeTvUploadImageUrl.toString()};
  var isVisuallyBlankImageSample = ${isVisuallyBlankImageSample.toString()};
  function safeImgUrl(url){
    return normalizeTvUploadImageUrl(url, location.origin);
  }
  function safeCssValue(v){
    if(!v || typeof v !== 'string') return '';
    if(/[;{}<>]/.test(v)) return '';
    return v;
  }

  function safeFontSize(v){
    return v === 'small' || v === 'large' || v === 'medium' ? v : 'medium';
  }
  function activeTvFontScale(cfg){
    if(URL_FONT_SCALE !== null) return URL_FONT_SCALE;
    if(URL_FONT_SIZE !== null) return normalizeTvFontScale(undefined,URL_FONT_SIZE);
    return normalizeTvFontScale(cfg&&cfg.fontScale,cfg&&cfg.fontSize);
  }
  function scaledClamp(min,fluid,max,factor){
    var maximum=Math.round(max*factor*1000)/1000;
    if(!isMobileViewport()) return maximum+'rem';
    return 'clamp('+(Math.round(min*factor*1000)/1000)+'rem,'+(Math.round(fluid*factor*1000)/1000)+'vw,'+maximum+'rem)';
  }
  function applyTvFontScale(fontScale){
    var factor=fontScale/100;
    var tokens={
      '--tv-category-size':scaledClamp(2,2.45,2.55,factor),
      '--tv-editorial-name-size':scaledClamp(1.25,1.42,1.62,factor),
      '--tv-name-size':scaledClamp(1.45,1.62,1.85,factor),
      '--tv-meta-size':scaledClamp(0.9,1,1.08,factor),
      '--tv-price-size':scaledClamp(1.7,1.95,2.15,factor),
      '--tv-table-size':scaledClamp(0.72,0.82,0.9,factor),
      '--tv-footer-size':scaledClamp(0.9,0.95,1.02,factor),
      '--tv-tier-label-size':scaledClamp(0.72,0.78,0.84,factor),
      '--tv-tier-price-size':scaledClamp(1.12,1.22,1.32,factor),
      '--tv-feature-name-size':scaledClamp(2.4,3,3.4,factor),
      '--tv-feature-meta-size':scaledClamp(1.1,1.35,1.55,factor),
      '--tv-feature-price-size':scaledClamp(2.55,3.15,3.65,factor),
      '--tv-hero-name-size':scaledClamp(3.6,5.8,6.2,factor),
      '--tv-hero-meta-size':scaledClamp(1.2,2,1.8,factor),
      '--tv-hero-price-size':scaledClamp(3.8,6,6.5,factor),
      '--tv-brand-size':scaledClamp(2.35,3.35,3.5,factor),
      '--tv-promo-size':scaledClamp(1.05,1.45,1.45,factor),
    };
    Object.keys(tokens).forEach(function(name){document.body.style.setProperty(name,tokens[name]);});
    document.body.setAttribute('data-font-scale',String(fontScale));
    document.body.classList.toggle('font-scale-large',fontScale>=130);
    document.body.classList.toggle('font-scale-high',fontScale>=190);
    document.body.classList.toggle('font-scale-maximum',fontScale>=220);
  }
  function customFontClass(v){
    var lower = String(v || '').toLowerCase();
    var classes = [];
    if(lower.indexOf('serif') !== -1) classes.push(lower.indexOf('slab') !== -1 ? 'font-custom-slab' : 'font-custom-serif');
    else if(lower.indexOf('mono') !== -1 || lower.indexOf('code') !== -1) classes.push('font-custom-mono');
    else if(lower.indexOf('condensed') !== -1 || lower.indexOf('narrow') !== -1) classes.push('font-custom-condensed');
    if(lower.indexOf('bold') !== -1 || lower.indexOf('heavy') !== -1) classes.push('font-custom-bold');
    return classes.join(' ');
  }
  function hexToRgb(hex){
    var m = /^#([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if(!m) return null;
    var n = parseInt(m[1], 16);
    return { r:(n>>16)&255, g:(n>>8)&255, b:n&255, hex:'#' + m[1] };
  }
  function applyBrandStyle(cfg){
    var style = document.getElementById('brand-overrides');
    if(!style){
      style = document.createElement('style');
      style.id = 'brand-overrides';
      document.head.appendChild(style);
    }
    var rgb = hexToRgb(cfg && cfg.primaryColor);
    if(!rgb){ style.textContent = ''; return; }
    style.textContent = 'body{--accent:' + rgb.hex + ';--accent-dim:rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.13);--accent-glow:rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.30);--border-hover:rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.44);}';
  }
  function imgMarkup(p, lazy){
    var safeUrl = safeImgUrl(p.image);
    var alt = escapeHtml(p.name || '');
    if(!safeUrl || (config && config.showImages === false)){
      return '';
    }
    return '<img class="card-image card-image-loading" src="' + escapeHtml(safeUrl) + '" alt="' + alt + '" crossorigin="anonymous"' + (lazy ? ' loading="lazy"' : '') + ' decoding="async" onload="window.dubmenuImgLoaded(this)" onerror="window.dubmenuImgFallback(this)">';
  }

  window.dubmenuImgFallback = function(img){
    if(!img) return;
    var card = img.closest && img.closest('.has-image');
    if(card){ card.classList.remove('has-image'); card.classList.add('no-image'); }
    if(img.parentNode) img.parentNode.removeChild(img);
  };

  window.dubmenuImgLoaded = function(img){
    if(!img) return;
    img.classList.remove('card-image-loading');
    img.classList.add('card-image-loaded');
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      var context = canvas.getContext('2d');
      if(!context) return;
      context.drawImage(img,0,0,canvas.width,canvas.height);
      var pixels = context.getImageData(0,0,canvas.width,canvas.height).data;
      if(isVisuallyBlankImageSample(pixels)){
        window.dubmenuImgFallback(img);
      }
    } catch(e) {
      return;
    }
  };

  var allocateCategoriesForDisplay = ${allocateCategoriesForDisplay.toString()};
  ${GET_CATEGORY_TYPE_JS}
  function categoryIconSvg(type){
    return CATEGORY_ICON_SVGS[type] || CATEGORY_ICON_SVGS.generic;
  }
  function categoryIcon(type){
    return '<span class="cat-icon-wrap" aria-hidden="true"><span class="cat-icon cat-icon-' + type + '">' + categoryIconSvg(type) + '</span></span>';
  }

  var cycleState = {currentPage:0,totalPages:1,interval:null,intervalMs:0,isTransitioning:false,pageSignature:'',swapTimer:null,cleanupTimer:null};


  // Resolve the active layout for THIS TV:
  //   1. ?layout= URL override (validated) — used for monitor-level layout choices
  //   2. Explicit config.layout override from the remote controls
  //   3. Legacy config.layoutMode mapping (auto/columns/grid -> grid; pricelist/compact -> list)
  //   4. Multi-display setups use image-led layouts when photos are available,
  //      and dense text layouts when they are not.
  //   5. Dense single-screen imports use the pricewall category tables.
  //   6. 'grid' fallback. Color templates never choose layouts.
  function getActiveLayout(cfg){
    if(URL_LAYOUT) return URL_LAYOUT;
    if(cfg && cfg.layout && cfg.layout !== 'auto'){
      var explicit = cfg.layout;
      if(explicit === 'compact' || explicit === 'cards') explicit = 'list';
      if(ALLOWED_LAYOUTS.indexOf(explicit) !== -1) return explicit;
    }
    if(cfg && cfg.layoutMode && cfg.layoutMode !== 'auto'){
      var mode = cfg.layoutMode;
      if(mode === 'grid' || mode === 'columns') return 'grid';
      if(mode === 'pricelist' || mode === 'compact') return 'list';
    }
    if(DISPLAY_TOTAL >= 4) return hasDisplayImages(cfg) ? 'cinematic' : 'list';
    if(DISPLAY_TOTAL === 3) return hasDisplayImages(cfg) ? 'poster' : 'pricewall';
    if(DISPLAY_TOTAL === 2) return hasDisplayImages(cfg) ? 'editorial' : 'pricewall';
    if(getTotalProductCount(cfg) >= 36) return 'pricewall';
    return 'grid';
  }
  function getTotalProductCount(cfg){
    return ((cfg && cfg.categories) || []).reduce(function(total, cat){
      return total + ((cat && cat.products) ? cat.products.length : 0);
    }, 0);
  }
  function hasDisplayImages(cfg){
    if(!cfg || cfg.showImages === false) return false;
    return ((cfg && cfg.categories) || []).some(function(cat){
      return cat && (cat.products || []).some(function(product){ return product && product.image; });
    });
  }
  // Resolve the active template (theme) for THIS TV:
  //   1. ?theme= URL override (validated)
  //   2. config.template
  //   3. 'default'
  function getActiveTemplate(cfg){
    if(URL_THEME) return URL_THEME;
    if(cfg && cfg.template) return cfg.template;
    return 'default';
  }

  function setPhase(phase){
    var pairing=document.getElementById('pairing');
    var menu=document.getElementById('menu');
    if(phase==='menu'){pairing.hidden=true;menu.hidden=false;}
    else{menu.hidden=true;pairing.hidden=false;}
  }

  function setConn(status){
    var ind=document.getElementById('conn-indicator');
    var dot=document.getElementById('conn-dot');
    var txt=document.getElementById('conn-text');
    if(status==='connected'){dot.className='conn-dot connected';txt.textContent='Live';}
    else if(status==='paired'){dot.className='conn-dot connected';ind.classList.remove('visible');return;}
    else{dot.className='conn-dot';txt.textContent='Reconnecting';}
    ind.classList.add('visible');
  }

  var tvInfoTimer = null;
  function showTvInfo(layout){
    var el = document.getElementById('tv-info');
    if(!el) return;
    var parts = [];
    if(DISPLAY_TOTAL > 1){
      parts.push('Display ' + DISPLAY_NUM + ' of ' + DISPLAY_TOTAL);
    }
    if(layout){
      parts.push(layout.charAt(0).toUpperCase() + layout.slice(1));
    }
    if(getActiveTemplate(config) !== 'default' || URL_THEME){
      var tmpl = getActiveTemplate(config);
      parts.push(tmpl.charAt(0).toUpperCase() + tmpl.slice(1));
    }
    el.textContent = parts.join(' \u00B7 ');
    if(parts.length === 0){ el.classList.remove('visible'); return; }
    el.classList.add('visible');
    if(tvInfoTimer) clearTimeout(tvInfoTimer);
    tvInfoTimer = setTimeout(function(){ el.classList.remove('visible'); }, 5000);
  }

  function getCategoriesForDisplay(allCats){
    return allocateCategoriesForDisplay(allCats,DISPLAY_NUM,DISPLAY_TOTAL);
  }


  function categoriesWithManualSpecials(cfg){
    var cats = (cfg && cfg.categories) || [];
    var manual = manualSpecialsCategory(cfg);
    if(!manual) return cats;
    return [manual].concat(cats.filter(function(cat){ return cat && cat.id !== 'specials'; }));
  }


  function isDemoOrDefaultDisplay(cfg){
    return cfg && (cfg.tvDemo || (cfg.layout === 'auto' && cfg.layoutMode === 'auto'));
  }

  function isPromotionalProduct(product){
    return !!(product&&(product.isPromo||product.special||product.specialLabel||product.originalPrice||product.priceOriginal));
  }

  function getCatalogPagePlan(cats, layout, bannerActive, demoMode){
    return buildTvCatalogPagePlan(cats,{
      layout:layout,
      bannerActive:bannerActive,
      demoMode:demoMode,
      fontScale:activeTvFontScale(config),
      productRowWeight:function(product,category){
        var length=formatProductName(product,category&&category.name).length;
        var needsPromoRoom=isPromotionalProduct(product)&&length>28;
        return length>80?2:(length>32||needsPromoRoom)?1.5:1;
      },
    });
  }

  function getPageSignature(layout,cats,bannerActive,demoMode){
    return JSON.stringify([
      layout,
      activeTvFontScale(config),
      bannerActive ? 1 : 0,
      demoMode ? 1 : 0,
      (cats || []).map(function(cat){
        return [cat.id,cat.name,(cat.products || []).map(function(product){
          return [product.id,product.name,product.price,product.originalPrice,product.inStock,product.strain];
        })];
      })
    ]);
  }

  function getCycleInterval(){
    return normalizeTvPageDurationSeconds(config && config.pageDurationSeconds) * 1000;
  }

  function cancelPageTransition(){
    clearTimeout(cycleState.swapTimer);
    clearTimeout(cycleState.cleanupTimer);
    cycleState.swapTimer=null;
    cycleState.cleanupTimer=null;
    cycleState.isTransitioning=false;
    var content=document.getElementById('menu-content');
    if(content){content.classList.remove('page-exit');content.classList.remove('page-enter');}
  }

  function stopCycling(){
    clearTimeout(cycleState.interval);
    cycleState.interval=null;
    cycleState.intervalMs=0;
    cancelPageTransition();
  }

  function scheduleNextCycle(){
    if(!shouldRunTvCycle(config && config.autoScroll,cycleState.totalPages,document.hidden)){
      stopCycling();
      return;
    }
    var intervalMs=getCycleInterval();
    if(cycleState.interval && cycleState.intervalMs===intervalMs) return;
    clearTimeout(cycleState.interval);
    cycleState.intervalMs=intervalMs;
    cycleState.interval=setTimeout(advanceCyclePage,intervalMs);
  }

  function advanceCyclePage(){
    cycleState.interval=null;
    cycleState.intervalMs=0;
    if(cycleState.isTransitioning||!shouldRunTvCycle(config && config.autoScroll,cycleState.totalPages,document.hidden)) return;
    var content=document.getElementById('menu-content');
    var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var instant=normalizeTvPageTransition(config && config.pageTransition)==='none';
    cycleState.isTransitioning=true;
    if(!content||reduceMotion||instant){
      cycleState.currentPage=nextTvCyclePage(cycleState.currentPage,cycleState.totalPages);
      renderCurrentPage();
      cycleState.isTransitioning=false;
      scheduleNextCycle();
      return;
    }
    content.classList.remove('page-enter');
    content.classList.add('page-exit');
    cycleState.swapTimer=setTimeout(function(){
      cycleState.swapTimer=null;
      cycleState.currentPage=nextTvCyclePage(cycleState.currentPage,cycleState.totalPages);
      renderCurrentPage();
      content.classList.remove('page-exit');
      void content.offsetWidth;
      content.classList.add('page-enter');
      cycleState.cleanupTimer=setTimeout(function(){
        cycleState.cleanupTimer=null;
        content.classList.remove('page-enter');
        cycleState.isTransitioning=false;
        scheduleNextCycle();
      },230);
    },180);
  }

  function startCycling(){
    if(cycleState.totalPages<=1){stopCycling();return;}
    scheduleNextCycle();
  }

  function resumeCycling(){
    if(shouldRunTvCycle(config && config.autoScroll,cycleState.totalPages,document.hidden)) startCycling();
    else stopCycling();
  }

  function emptyMenuMarkup(){
    return '<div class="empty-state"><div class="empty-state-card"><div class="empty-state-kicker">Menu setup required</div><div class="empty-state-title">Build this TV menu from the remote.</div><div class="empty-state-copy">Open DubMenu on your phone or desktop, run the setup wizard, and import a menu URL or settings file before this display goes live.</div><div class="empty-state-steps"><div class="empty-state-step"><b>1. Import</b>Paste a Dutchie link, store slug, or website.</div><div class="empty-state-step"><b>2. Style</b>Use competitor notes to choose a premium layout.</div><div class="empty-state-step"><b>3. Verify</b>Preview every display before showing customers.</div></div></div></div>';
  }

  function renderEmptyMenu(layout){
    var content = document.getElementById('menu-content');
    if(!content) return;
    content.innerHTML = emptyMenuMarkup();
    content.className = 'menu-content layout-' + (layout || 'grid');
    stopCycling();
    showTvInfo(layout);
  }


  function renderCurrentPage(){
    if(!config) return;
    var layout = getActiveLayout(config);
    var cats = getCategoriesForDisplay(categoriesWithManualSpecials(config));
    var urlCat = new URLSearchParams(location.search).get('category');
    if(urlCat) cats = cats.filter(function(c){return c.id===urlCat;});
    if(config.showCategory) cats = cats.filter(function(c){return c.id===config.showCategory;});
    var displayCats = cats;
    var pricewallRailCats = layout === 'pricewall' ? cats : [];
    if(!displayCats.length){renderEmptyMenu(layout);return;}
    
    var bannerActive = !!getActiveBanner();
    var pagePlan = getCatalogPagePlan(displayCats, layout, bannerActive, isDemoOrDefaultDisplay(config));
    var pageCats = pagePlan[cycleState.currentPage] || pagePlan[0] || [];
    if(!pageCats.length){renderEmptyMenu(layout);return;}
    
    var content = document.getElementById('menu-content');
    content.innerHTML = '';
    content.className = 'menu-content layout-' + layout;
    content.setAttribute('data-menu-page',String(cycleState.currentPage+1));
    content.setAttribute('data-menu-pages',String(cycleState.totalPages));
    var footerProgress = document.getElementById('footer-progress');
    if(footerProgress) footerProgress.textContent = formatTvPageProgress(pagePlan,cycleState.currentPage);
    
    if(layout==='grid') renderGrid(pageCats, content);
    else if(layout==='pricewall') renderPricewall(pageCats, content, pricewallRailCats);
    else if(layout==='list') renderList(pageCats, content);
    else if(layout==='poster') renderPoster(pageCats, content);
    else if(layout==='cinematic') renderCinematic(pageCats, content);
    else if(layout==='showcase') renderShowcase(pageCats, content);
    else if(layout==='editorial') renderEditorial(pageCats, content);
    else if(layout==='sparse') renderSparse(pageCats, content);
    else renderGrid(pageCats, content);
    
    requestAnimationFrame(fitToScreen);
    setTimeout(fitToScreen,100);
    setTimeout(fitToScreen,500);
  }

  function getActiveBanner(){
    var banners=config.scheduledBanners||[];
    var hour=new Date().getHours();
    for(var i=0;i<banners.length;i++){
      var b=banners[i];
      if(!b.active||!b.text)continue;
      if(b.startHour<=b.endHour){
        if(hour>=b.startHour&&hour<b.endHour)return b;
      }else{
        if(hour>=b.startHour||hour<b.endHour)return b;
      }
    }
    if(config.promoBanner&&config.promoBanner.active&&config.promoBanner.text){
      return{text:config.promoBanner.text,bgColor:config.promoBanner.bgColor,textColor:config.promoBanner.textColor};
    }
    return null;
  }
  var lastBannerActive=false;
  function updatePromoBannerDisplay(){
    var pb=document.getElementById('promo-bar');
    if(!pb)return;
    var banner=getActiveBanner();
    lastBannerActive=!!banner;
    document.body.classList.toggle('has-promo-banner',lastBannerActive);
    if(banner){
      pb.textContent=banner.text;
      pb.style.background = safeCssValue(banner.bgColor) || '';
      pb.style.color = safeCssValue(banner.textColor) || '';
      pb.classList.add('active');
    }else{
      pb.textContent='';
      pb.style.background='';
      pb.style.color='';
      pb.classList.remove('active');
    }
  }
  setInterval(function(){
    if(!hasProducts(config))return;
    var nextBannerActive=!!getActiveBanner();
    if(nextBannerActive!==lastBannerActive)renderMenu();
  },60000);

  function renderMenu(){
    if(!config) return;
    var fontScale = activeTvFontScale(config);
    document.body.className = ('template-' + getActiveTemplate(config) + ' font-' + tvFontSizeClass(fontScale) + ' ' + customFontClass(config.customFont)).trim();
    applyTvFontScale(fontScale);
    applyBrandStyle(config);
    fitToScreen();
    var demoPill = document.getElementById('demo-pill');
    if(demoPill) demoPill.classList.toggle('visible', DEMO_MODE || !!config.tvDemo);
    var headerName = document.getElementById('dispensary-name');
    if(config.dispensaryName) headerName.textContent = config.dispensaryName;
    else headerName.textContent = 'DubMenu TV';
    
    var hl = document.getElementById('header-logo');
    var logoUrl = safeImgUrl(config.logo);
    if(config.showLogo !== false && logoUrl) { hl.src = logoUrl; hl.classList.add('show'); }
    else { hl.removeAttribute('src'); hl.classList.remove('show'); }
    
    updatePromoBannerDisplay();

    var disc = getDisclaimer(config);
    var footerEl = document.getElementById('footer-disclaimer');
    if(footerEl){
      footerEl.textContent = disc;
      footerEl.style.display = disc ? '' : 'none';
    }
    var cats = getCategoriesForDisplay(categoriesWithManualSpecials(config));
    var urlCat = new URLSearchParams(location.search).get('category');
    if(urlCat) cats = cats.filter(function(c){return c.id===urlCat;});
    if(config.showCategory) cats = cats.filter(function(c){return c.id===config.showCategory;});
    
    var layout = getActiveLayout(config);
    if(!cats.length){
      cycleState.totalPages=1;
      cycleState.currentPage=0;
      cycleState.pageSignature='';
      renderEmptyMenu(layout);
      showTvInfo(layout);
      return;
    }

    // Hide connection indicator when menu is showing
    document.getElementById('conn-indicator').classList.remove('visible');

    var bannerActive = !!getActiveBanner();
    var demoMode = isDemoOrDefaultDisplay(config);
    var pagePlan = getCatalogPagePlan(cats, layout, bannerActive, demoMode);
    var nextTotalPages = Math.max(1, pagePlan.length);
    var nextPageSignature = getPageSignature(layout,cats,bannerActive,demoMode);
    var pageModelChanged = shouldResetTvCycle(cycleState.pageSignature,nextPageSignature);
    cycleState.totalPages = nextTotalPages;
    cycleState.currentPage = pageModelChanged ? 0 : Math.min(cycleState.currentPage,Math.max(0,nextTotalPages-1));
    cycleState.pageSignature = nextPageSignature;

    if(pageModelChanged) stopCycling();
    else cancelPageTransition();
    renderCurrentPage();

    resumeCycling();

    showTvInfo(layout);
  }

  function strainBadge(p){
    if(!p || !p.strain) return '';
    var raw = String(p.strain).toLowerCase().trim();
    var map = {h:'hybrid',s:'sativa',i:'indica',hybrid:'hybrid',sativa:'sativa',indica:'indica'};
    var strain = map[raw];
    if(!strain) return '';
    var label = strain.charAt(0).toUpperCase() + strain.slice(1);
    return '<span class="strain-badge-tv">' + escapeHtml(label) + '</span>';
  }

  function hasTierPrices(p){
    return !!(p && Array.isArray(p.priceTiers) && p.priceTiers.length);
  }

  function hasSinglePrice(p){
    return !!(p && (typeof p.price === 'number' || (typeof p.price === 'string' && p.price.trim())));
  }

  function weightBelongsInMeta(p){
    return !!(p && p.weight && !hasTierPrices(p) && !hasSinglePrice(p));
  }

  function makeSub(p){
    var parts = [];
    if(p.inStock === false) parts.push('<span class="oos-text">Sold Out</span>');
    if(config.showBrand !== false && p.brand) parts.push('<span class="product-maker">' + escapeHtml(p.brand) + '</span>');
    if(config.showStrain !== false && p.strain) parts.push(strainBadge(p));
    if(weightBelongsInMeta(p)) parts.push(escapeHtml(p.weight));
    if(p.thc) parts.push('THC ' + escapeHtml(p.thc));
    if(p.cbd) parts.push('CBD ' + escapeHtml(p.cbd));
    return parts.join(' \u00B7 ');
  }

  function formatPriceValue(value){
    var numeric = typeof value === 'number' ? value : Number(value);
    if(value !== '' && value !== null && value !== undefined && isFinite(numeric)){
      return numeric.toFixed(2).replace(/\\.00$/, '');
    }
    return escapeHtml(value);
  }

  function makePrice(p){
    if(!p) return '';
    var promo = '';
    if(p.specialLabel){
      promo = '<span class="promo-price">' + escapeHtml(p.specialLabel) + '</span> ';
    } else if(p.isPromo || p.special){
      promo = '<span class="promo-price">Special</span> ';
    }
    if(hasTierPrices(p)){
      var tiers = p.priceTiers.map(function(t){
        var label = escapeHtml((t && t.label) || '');
        var price = escapeHtml((t && t.price) || '');
        if(!label || !price) return '';
        return '<span class="tier"><span class="tier-label">' + label + '</span><span class="tier-price">' + price + '</span></span>';
      }).join('');
      if(tiers){
        return promo + '<div class="price-tiers">' + tiers + '</div>';
      }
    }
    var hasPrice = hasSinglePrice(p);
    var orig = p.priceOriginal || p.originalPrice;
    if(!hasPrice) return promo.trim();
    var weight = p.weight ? '<span class="price-weight">' + escapeHtml(p.weight) + '</span>' : '';
    var current = orig && orig !== p.price
      ? '<span class="sale-text">Now $' + formatPriceValue(p.price) + '</span>'
      : '<span class="price-value">$' + formatPriceValue(p.price) + '</span>';
    var original = orig && orig !== p.price
      ? '<span class="card-price-orig">Was $' + formatPriceValue(orig) + '</span>'
      : '';
    return promo + '<span class="price-pair">' + weight + current + '</span>' + original;
  }

  function makeDesc(p,compact){
    if(config && config.showDescription === false) return '';
    if(!p || !p.description) return '';
    var description = compact ? compactDescription(p.description) : String(p.description);
    return description ? '<div class="card-desc' + (compact ? ' compact-desc' : '') + '">' + escapeHtml(description) + '</div>' : '';
  }

  function makeListDesc(p){
    if(config && config.showDescription === false) return '';
    if(!p || !p.description) return '';
    var description = compactDescription(p.description);
    return description ? '<div class="row-desc">' + escapeHtml(description) + '</div>' : '';
  }

  function gridStrainClass(p){
    var raw = String((p && p.strain) || '').toLowerCase().trim();
    var map = {h:'hybrid',s:'sativa',i:'indica',hybrid:'hybrid',sativa:'sativa',indica:'indica'};
    var strain = map[raw];
    return strain ? ' strain-' + strain : '';
  }

  function makeGridMeta(p){
    var parts = [];
    if(config.showBrand !== false && p.brand) parts.push('<span class="product-maker">' + escapeHtml(p.brand) + '</span>');
    if(config.showStrain !== false && p.strain) parts.push(strainBadge(p));
    if(weightBelongsInMeta(p)) parts.push('<span>' + escapeHtml(p.weight) + '</span>');
    if(p.thc) parts.push('<span>THC ' + escapeHtml(p.thc) + '</span>');
    if(p.cbd) parts.push('<span>CBD ' + escapeHtml(p.cbd) + '</span>');
    return parts.join('');
  }

  function fitGridCardNames(root){
    var contentOverflows=function(name){
      var card=name.closest('.product-card');
      var body=name.closest('.card-body');
      if(name.scrollHeight>name.clientHeight+4) return true;
      if(!card||!body) return false;
      var cardRect=card.getBoundingClientRect();
      var bodyRect=body.getBoundingClientRect();
      return bodyRect.top<cardRect.top-1||bodyRect.bottom>cardRect.bottom+1;
    };
    Array.prototype.forEach.call(root.querySelectorAll('.card-name'),function(name){
      name.style.fontSize='';
      name.style.webkitLineClamp='';
      name.removeAttribute('data-name-overflow');
      var size=parseFloat(getComputedStyle(name).fontSize);
      while(contentOverflows(name)&&size>22){
        size=Math.max(22,size-0.5);
        name.style.fontSize=size+'px';
      }
      if(name.scrollHeight>name.clientHeight+4) name.style.webkitLineClamp='3';
      while(contentOverflows(name)&&size>18){
        size=Math.max(18,size-0.5);
        name.style.fontSize=size+'px';
      }
      if(contentOverflows(name)) name.setAttribute('data-name-overflow','true');
    });
  }

  function renderGrid(cats, container){
    cats.forEach(function(cat, catIndex){
      var catEl = document.createElement('div');
      catEl.className = 'category-block category-' + getCategoryType(cat.name);
      catEl.innerHTML = '<div class="category-header"><div class="category-title">' + categoryIcon(getCategoryType(cat.name)) + escapeHtml(cat.name) + '</div></div>';
      var grid = document.createElement('div');
      grid.className = 'grid-products count-' + Math.min(9, cat.products.length);
      grid.innerHTML = '<div class="product-table-head"><span>Product</span><span>Price</span></div>';
      cat.products.forEach(function(p){ p.categoryName = cat.name;
        var hasImage = !!(safeImgUrl(p.image) && config.showImages !== false);
        var visual = hasImage ? imgMarkup(p, true) : '';
        var cardName = formatProductName(p,cat.name);
        var needsPromoRoom = isPromotionalProduct(p)&&cardName.length>28;
        var nameClass = cardName.length>80 ? ' name-extra-long' : cardName.length>32||needsPromoRoom ? ' name-long' : '';
        var card = document.createElement('div');
        card.className = 'product-card' + nameClass + (hasImage ? ' has-image' : ' no-image') + (config.showStrain !== false ? gridStrainClass(p) : '') + (p.inStock === false ? ' out-of-stock' : '');
        card.innerHTML = '<span class="strain-bar"></span>' + visual + '<div class="card-body"><div class="card-name">' + escapeHtml(cardName) + '</div><div class="card-meta">' + makeGridMeta(p) + '</div>' + makeDesc(p,true) + '</div><div class="card-price">' + makePrice(p) + '</div>';
        grid.appendChild(card);
      });
      catEl.appendChild(grid);
      container.appendChild(catEl);
    });
    requestAnimationFrame(function(){fitGridCardNames(container);});
  }

  function isSpecialCategory(cat){
    var source = String((cat && (cat.name || cat.id)) || '').toLowerCase();
    return /special|deal|promo/.test(source);
  }

  function getPricewallPromoProducts(cats){
    var promoProducts = [];
    cats.forEach(function(cat){
      var specialCat = isSpecialCategory(cat);
      (cat.products || []).forEach(function(p){
        if(p && (specialCat || isPromotionalProduct(p))){
          p.categoryName = cat.name;
          promoProducts.push(p);
        }
      });
    });
    return promoProducts;
  }





  function renderPricewallShell(cats, container){
    var promoProducts = getPricewallPromoProducts(cats).slice(0, 3);
    var specials = promoProducts.map(function(p){
      return '<div class="pricewall-special-row"><div class="pricewall-special-name">' + escapeHtml(formatProductName(p,p.categoryName)) + '</div><div class="pricewall-special-price">' + makePrice(p) + '</div></div>';
    }).join('');
    if(!specials) return false;
    var shell = document.createElement('aside');
    shell.className = 'pricewall-shell';
    shell.innerHTML = '<div class="pricewall-panel pricewall-specials"><div class="pricewall-panel-title">Featured deals</div>' + specials + '</div>';
    container.appendChild(shell);
    return true;
  }

  function renderPricewall(cats, container, allCats){
    renderGrid(cats, container);
    if(!renderPricewallShell(allCats || cats, container)) container.classList.add('pricewall-no-rail');
  }

  function renderList(cats, container){
    cats.forEach(function(cat, catIndex){
      var catEl = document.createElement('div');
      catEl.className = 'category-block category-' + getCategoryType(cat.name);
      catEl.innerHTML = '<div class="category-header"><div class="category-title">' + categoryIcon(getCategoryType(cat.name)) + escapeHtml(cat.name) + '</div></div>';
      var list = document.createElement('div');
      list.className = 'list-products';
      cat.products.forEach(function(p){ p.categoryName = cat.name;
        var row = document.createElement('div');
        row.className = 'product-row' + (p.inStock === false ? ' out-of-stock' : '');
        row.innerHTML = '<div class="row-name">' + escapeHtml(p.name) + '</div><div class="row-meta">' + makeSub(p) + '</div><div class="leader"></div>' + makeListDesc(p) + '<div class="row-price">' + makePrice(p) + '</div>';
        list.appendChild(row);
      });
      catEl.appendChild(list);
      container.appendChild(catEl);
    });
  }

  function renderPoster(cats, container){
    cats.forEach(function(cat, catIndex){
      var catEl = document.createElement('div');
      catEl.className = 'category-block category-' + getCategoryType(cat.name);
      catEl.innerHTML = '<div class="category-header"><div class="category-title">' + categoryIcon(getCategoryType(cat.name)) + escapeHtml(cat.name) + '</div></div>';
      var poster = document.createElement('div');
      poster.className = 'poster-products' + (cat.products.some(function(p){ return !!(safeImgUrl(p.image) && config.showImages !== false); }) ? ' has-images' : ' no-images');
      cat.products.forEach(function(p){ p.categoryName = cat.name;
        var row = document.createElement('div');
        var rowHasImage = !!(safeImgUrl(p.image) && config.showImages !== false);
        row.className = 'product-row ' + (rowHasImage ? 'has-image' : 'no-image') + (p.inStock === false ? ' out-of-stock' : '');
        var img = rowHasImage ? imgMarkup(p, false) : '';
        row.innerHTML = img + '<div class="product-info"><div class="card-name">' + escapeHtml(p.name) + '</div><div class="card-meta">' + makeSub(p) + '</div>' + makeDesc(p) + '<div class="card-price">' + makePrice(p) + '</div></div>';
        poster.appendChild(row);
      });
      catEl.appendChild(poster);
      container.appendChild(catEl);
    });
  }

  function renderCinematic(cats, container){
    cats.forEach(function(cat, catIndex){
      var catEl = document.createElement('div');
      catEl.className = 'category-block category-' + getCategoryType(cat.name);
      catEl.innerHTML = '<div class="category-header"><div class="category-title">' + categoryIcon(getCategoryType(cat.name)) + escapeHtml(cat.name) + '</div></div>';
      var grid = document.createElement('div');
      grid.className = 'cinematic-products count-' + Math.min(4, cat.products.length);
      cat.products.forEach(function(p){ p.categoryName = cat.name;
        var card = document.createElement('div');
        var hasImage = !!(safeImgUrl(p.image) && config.showImages !== false);
        card.className = 'product-card ' + (hasImage ? 'has-image' : 'no-image') + (p.inStock === false ? ' out-of-stock' : '');
        var img = hasImage ? imgMarkup(p, true) : '';
        card.innerHTML = img + '<div class="card-body"><div class="card-name">' + escapeHtml(p.name) + '</div><div class="card-meta">' + makeSub(p) + '</div>' + makeDesc(p) + '<div class="card-price">' + makePrice(p) + '</div></div>';
        grid.appendChild(card);
      });
      catEl.appendChild(grid);
      container.appendChild(catEl);
    });
  }

  function renderShowcase(cats, container){
    var allProducts = [];
    cats.forEach(function(cat){
      cat.products.forEach(function(p){ p.categoryName = cat.name;
        allProducts.push({product: p, catName: cat.name});
      });
    });
    if(!allProducts.length) return;
    var idx = cycleState.currentPage % allProducts.length;
    var current = allProducts[idx];
    var p = current.product;
    var showcase = document.createElement('div');
    showcase.className = 'showcase-products';
    var card = document.createElement('div');
    card.className = 'product-card' + (p.inStock === false ? ' out-of-stock' : '');
    var img = imgMarkup(p, false);
    card.innerHTML = img + '<div class="card-name">' + escapeHtml(p.name) + '</div><div class="card-meta">' + escapeHtml(current.catName) + (makeSub(p) ? ' \u00B7 ' + makeSub(p) : '') + '</div>' + makeDesc(p) + '<div class="card-price">' + makePrice(p) + '</div>';
    showcase.appendChild(card);
    container.appendChild(showcase);
  }

  function renderEditorial(cats, container){
    cats.forEach(function(cat, catIndex){
      var catEl = document.createElement('div');
      catEl.className = 'category-block category-' + getCategoryType(cat.name);
      catEl.innerHTML = '<div class="category-header"><div class="category-title">' + categoryIcon(getCategoryType(cat.name)) + escapeHtml(cat.name) + '</div></div>';
      var grid = document.createElement('div');
      grid.className = 'editorial-products' + (cat.products.some(function(p){ return !!(safeImgUrl(p.image) && config.showImages !== false); }) ? ' has-images' : ' no-images');
      cat.products.forEach(function(p){ p.categoryName = cat.name;
        var card = document.createElement('div');
        var hasImage = !!(safeImgUrl(p.image) && config.showImages !== false);
        card.className = 'product-card ' + (hasImage ? 'has-image' : 'no-image') + (p.inStock === false ? ' out-of-stock' : '');
        var img = hasImage ? imgMarkup(p, true) : '';
        card.innerHTML = img + '<div class="card-body"><div class="card-name">' + escapeHtml(p.name) + '</div><div class="card-meta">' + makeSub(p) + '</div>' + makeDesc(p,true) + '<div class="card-price">' + makePrice(p) + '</div></div>';
        grid.appendChild(card);
      });
      catEl.appendChild(grid);
      container.appendChild(catEl);
    });
  }

  function renderSparse(cats, container){
    cats.forEach(function(cat, catIndex){
      var products = (cat.products || []).slice(0, 4);
      if(!products.length) return;
      var catEl = document.createElement('div');
      catEl.className = 'category-block category-' + getCategoryType(cat.name) + (products.length === 1 ? ' single-product' : '');
      catEl.innerHTML = '<div class="category-header"><div class="category-title">' + categoryIcon(getCategoryType(cat.name)) + escapeHtml(cat.name) + '</div></div>';
      var wrap = document.createElement('div');
      wrap.className = 'sparse-products' + (products.length === 1 ? ' single-product' : '');
      var hero = products[0];
      var rest = products.slice(1);
      var heroCard = document.createElement('div');
      var heroHasImage = !!(hero && safeImgUrl(hero.image) && config.showImages !== false);
      heroCard.className = 'hero-card ' + (heroHasImage ? 'has-image' : 'no-image') + (hero.inStock === false ? ' out-of-stock' : '');
      heroCard.innerHTML = imgMarkup(hero, false) + '<div class="hero-info"><div class="hero-name">' + escapeHtml(hero.name) + '</div><div class="hero-meta">' + makeSub(hero) + '</div>' + makeDesc(hero) + '<div class="hero-price">' + makePrice(hero) + '</div></div>';
      wrap.appendChild(heroCard);
      if(rest.length){
        var stack = document.createElement('div');
        stack.className = 'stack';
        rest.forEach(function(p){
          var row = document.createElement('div');
          var rowHasImage = !!(p && safeImgUrl(p.image) && config.showImages !== false);
          row.className = 'stack-card ' + (rowHasImage ? 'has-image' : 'no-image') + (p.inStock === false ? ' out-of-stock' : '');
          row.innerHTML = imgMarkup(p, true) + '<div class="stack-info"><div class="card-name">' + escapeHtml(p.name) + '</div><div class="card-meta">' + makeSub(p) + '</div>' + makeDesc(p) + '</div><div class="card-price">' + makePrice(p) + '</div>';
          stack.appendChild(row);
        });
        wrap.appendChild(stack);
      }
      catEl.appendChild(wrap);
      container.appendChild(catEl);
    });
  }

  var SCALE_BASELINE_W = 1920;
  var SCALE_BASELINE_H = 1080;
  var MOBILE_BREAKPOINT = 768;
  var fitScale = 1;
  function isMobileViewport(){
    return window.matchMedia('(max-width:' + MOBILE_BREAKPOINT + 'px)').matches;
  }
  function fitToScreen(){
    var menu = document.getElementById('menu');
    if(!menu) return;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var menuVisible = !menu.hidden;
    if(!menuVisible){
      if(fitScale !== 1){
        fitScale = 1;
        menu.style.transform = '';
        menu.style.transformOrigin = '';
        menu.style.width = '';
        menu.style.height = '';
        menu.style.marginLeft = '';
        menu.style.marginTop = '';
      }
      return;
    }
    // On phone-width screens do NOT scale the 1920×1080 canvas down —
    // the media-query overrides render #menu responsively at 100% width.
    if(isMobileViewport()){
      fitScale = 1;
      menu.style.transform = '';
      menu.style.transformOrigin = '';
      menu.style.width = '100%';
      menu.style.height = 'auto';
      menu.style.marginLeft = '';
      menu.style.marginTop = '';
      return;
    }
    var scaleX = vw / SCALE_BASELINE_W;
    var scaleY = vh / SCALE_BASELINE_H;
    var scale = Math.min(scaleX, scaleY);
    if(!(scale > 0) || !isFinite(scale)) scale = 1;
    fitScale = scale;
    menu.style.transformOrigin = 'top left';
    var canvasHeight = vh > vw ? vh / scale : SCALE_BASELINE_H;
    menu.style.width = SCALE_BASELINE_W + 'px';
    menu.style.height = canvasHeight + 'px';
    menu.style.transform = 'scale(' + scale + ')';
    var scaledW = SCALE_BASELINE_W * scale;
    var scaledH = canvasHeight * scale;
    var overshootX = scaledW - vw;
    var overshootY = scaledH - vh;
    menu.style.marginLeft = (overshootX > 0 ? -overshootX / 2 : Math.max(0, (vw - scaledW) / 2)) + 'px';
    menu.style.marginTop = (overshootY > 0 ? -overshootY / 2 : 0) + 'px';
  }

  function connect(){
    if(DEMO_MODE) return;
    if(reconnectTimer){clearTimeout(reconnectTimer);reconnectTimer=null;}
    try{ws=new WebSocket(WS_URL);}catch(e){scheduleReconnect();return;}
    ws.onopen=function(){
      reconnectAttempts=0;
      setConn('connected');
      ws.send(JSON.stringify({type:'join',payload:{role:'tv'}}));
      if(config && hasProducts(config)) renderMenu();
      if(heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer=setInterval(function(){if(ws&&ws.readyState===1) ws.send(JSON.stringify({type:'pong'}));},25000);
    };
    ws.onmessage=function(ev){
      try{
        var msg=JSON.parse(ev.data);
        if(msg.type==='config'){
          var incoming = msg.payload;
          if(hasProducts(incoming) || !hasProducts(config) || (hasCategoryArray(incoming) && !PRESERVE_INITIAL_DEMO_CONFIG)){
            config=incoming;
          }
          if(paired||hasProducts(config)){setPhase('menu');renderMenu();}
          else {setPhase('pairing');}
          return;
        }
        if(msg.type==='paired'){paired=true;setConn('paired');setPhase('menu');if(config) renderMenu();}
        if(msg.type==='unpaired'){paired=false;if(hasProducts(config)){setPhase('menu');resumeCycling();}else{stopCycling();setPhase('pairing');}}
        if(msg.type==='ping'){if(ws&&ws.readyState===1) ws.send(JSON.stringify({type:'pong'}));}
      }catch(e){}
    };
    ws.onclose=function(){
      if(heartbeatTimer){clearInterval(heartbeatTimer);heartbeatTimer=null;}
      stopCycling();
      setConn('disconnected');
      scheduleReconnect();
    };
    ws.onerror=function(){try{ws.close();}catch(e){}};
  }

  function scheduleReconnect(){
    if(reconnectTimer) clearTimeout(reconnectTimer);
    var delay=Math.min(MAX_RECONNECT_DELAY,Math.pow(2,reconnectAttempts)*1000);
    reconnectAttempts++;
    reconnectTimer=setTimeout(connect,delay);
  }


  function setDisplayWakeLockState(state){
    document.documentElement.setAttribute('data-display-wake-lock',state);
  }

  function scheduleDisplayWakeLock(){
    if(EMBED_MODE||document.hidden||wakeLockRetryTimer||!('wakeLock' in navigator)) return;
    setDisplayWakeLockState('retrying');
    wakeLockRetryTimer=setTimeout(function(){
      wakeLockRetryTimer=null;
      requestDisplayWakeLock();
    },60000);
  }

  function requestDisplayWakeLock(){
    if(EMBED_MODE) return;
    if(document.hidden){
      setDisplayWakeLockState('paused');
      return;
    }
    if(!navigator.wakeLock||!navigator.wakeLock.request){
      setDisplayWakeLockState('unsupported');
      return;
    }
    if(displayWakeLock) return;
    setDisplayWakeLockState('requesting');
    navigator.wakeLock.request('screen').then(function(lock){
      displayWakeLock=lock;
      setDisplayWakeLockState('active');
      if(lock&&lock.addEventListener){
        lock.addEventListener('release',function(){
          displayWakeLock=null;
          setDisplayWakeLockState(document.hidden?'paused':'released');
          scheduleDisplayWakeLock();
        });
      }
    }).catch(function(){
      displayWakeLock=null;
      scheduleDisplayWakeLock();
    });
  }

  var fsDone=false;
  var fsPending=false;
  function tryFullscreen(){
    if(EMBED_MODE||fsDone||fsPending)return;
    var el=document.documentElement;
    try {
      if(el.requestFullscreen){
        fsPending=true;
        el.requestFullscreen().then(function(){
          fsDone=true;
          fsPending=false;
        },function(){
          fsPending=false;
        });
      } else if(el.webkitRequestFullscreen){
        el.webkitRequestFullscreen();
        fsDone=true;
      }
    } catch(e) {
      fsPending=false;
    }
  }

  function verifyAge(){
    try{localStorage.setItem('dubmenu_age_verified_${safeSessionId}','1');}catch(e){}
    var gate=document.getElementById('age-gate');
    if(gate)gate.classList.add('hidden');
    requestDisplayWakeLock();
    tryFullscreen();
  }
  window.verifyAge = verifyAge;

  (function checkAgeGate(){
    var verified=false;
    try{verified=localStorage.getItem('dubmenu_age_verified_${safeSessionId}')==='1';}catch(e){}
    if(verified){
      var gate=document.getElementById('age-gate');
      if(gate)gate.classList.add('hidden');
    }
  })();

  document.addEventListener('click',function(){requestDisplayWakeLock();tryFullscreen();});
  document.addEventListener('touchstart',function(){requestDisplayWakeLock();tryFullscreen();});
  document.addEventListener('keydown',function(){requestDisplayWakeLock();tryFullscreen();});
  setTimeout(function(){requestDisplayWakeLock();tryFullscreen();},1000);

  document.addEventListener('mousemove',function(){
    document.body.classList.remove('cursor-hidden');
    if(cursorTimer) clearTimeout(cursorTimer);
    cursorTimer=setTimeout(function(){document.body.classList.add('cursor-hidden');},5000);
  });

  window.addEventListener('resize',function(){
    fitToScreen();
    requestAnimationFrame(function(){
      var content=document.getElementById('menu-content');
      if(content&&(content.classList.contains('layout-grid')||content.classList.contains('layout-pricewall'))) fitGridCardNames(content);
    });
  });
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){stopCycling();return;}
    requestDisplayWakeLock();
    if(config&&hasProducts(config))renderMenu();
    else resumeCycling();
  });

  if(!DEMO_MODE){
    var pollTimer=setInterval(function(){
      if(paired) return;
      fetch('/status/${safeSessionId}').then(function(r){return r.json();}).then(function(d){
        if(d.hasPhone && !paired){
          paired=true;
          setConn('paired');
          if(d.config){config=d.config;}
          setPhase('menu');
          if(config) renderMenu();
        }
      }).catch(function(){});
    },3000);
  }

  if(initialConfig && hasProducts(initialConfig)){
    config = initialConfig;
    paired = true;
    setPhase('menu');
    renderMenu();
  }

  requestDisplayWakeLock();

  connect();

  try{
    if(!config || config.analyticsEnabled !== false) fetch('/api/analytics/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'analytics.tv.load',payload:{session:'${safeSessionId}'}})});
  }catch(e){}
})();
</script>
</body>
</html>`;
}