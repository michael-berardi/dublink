import { CATEGORY_ICON_SVGS, CATEGORY_LABELS, GET_CATEGORY_TYPE_JS } from './category-icons';

type TvPageInitialConfig = {
  template?: string;
  fontSize?: 'small' | 'medium' | 'large';
  categories?: Array<{ products?: unknown[] }>;
} & Record<string, unknown>;

const TV_TEMPLATES = ['default', 'minimal', 'neon', 'light', 'sunset', 'forest', 'royal', 'gold', 'ocean', 'crimson', 'bone', 'vapor'] as const;

function isTvTemplate(value: unknown): value is (typeof TV_TEMPLATES)[number] {
  return typeof value === 'string' && (TV_TEMPLATES as readonly string[]).includes(value);
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
  const initialFontSize = initialConfig?.fontSize || 'medium';
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
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif;background:var(--bg);color:var(--text);user-select:none;-webkit-user-select:none;font-size:18px;}
  body.font-small{font-size:16px;}
  body.font-medium{font-size:18px;}
  body.font-large{font-size:20px;}
  body.font-small .layout-grid .card-name{font-size:clamp(1.05rem,1.32vw,1.52rem);}
  body.font-large .layout-grid .card-name{font-size:clamp(1.32rem,1.7vw,2rem);}
  body.font-small .layout-grid .card-price{font-size:clamp(1.35rem,1.65vw,1.95rem);}
  body.font-large .layout-grid .card-price{font-size:clamp(1.78rem,2.15vw,2.55rem);}
  body.font-small .row-name{font-size:0.92em;}
  body.font-large .row-name{font-size:1.12em;}
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
  .promo-bar{width:100%;padding:0.7rem 2rem;text-align:center;font-weight:900;font-size:clamp(1rem,1.4vw,1.35rem);letter-spacing:0.08em;flex-shrink:0;z-index:10;display:none;text-transform:uppercase;overflow-wrap:break-word;word-wrap:break-word;min-width:0;box-shadow:0 8px 28px rgba(0,0,0,0.22);}
  .promo-bar.active{display:block;}
  .menu-header{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:0.85rem 2.25rem;border-bottom:1px solid var(--border);flex-shrink:0;background:linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0.08)),var(--bg);z-index:9;box-shadow:0 12px 32px rgba(0,0,0,0.22);}
  .header-left{display:flex;align-items:center;gap:1rem;min-width:0;flex:1 1 auto;}
  .header-right{display:flex;align-items:center;gap:0.75rem;flex:0 0 auto;}
  .header-logo{max-height:52px;max-width:200px;object-fit:contain;display:none;}
  .header-logo.show{display:block;}
  .dispensary-name{font-size:clamp(2rem,3vw,3rem);font-weight:950;letter-spacing:-0.035em;line-height:1.05;color:var(--accent);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 0 32px var(--accent-glow);}
  .menu-content{position:relative;z-index:1;flex:1 1 auto;min-height:0;overflow:hidden;padding:1.25rem 2rem 1rem;width:100%;}
  .menu-content.content-refresh{animation:content-refresh 420ms ease-out;}
  .menu-footer{position:relative;z-index:1;flex-shrink:0;display:flex;justify-content:center;align-items:center;padding:0.55rem 2rem;border-top:1px solid var(--border);background:linear-gradient(0deg,rgba(0,0,0,0.38),rgba(0,0,0,0.16)),var(--bg);font-size:0.8rem;font-weight:800;color:var(--text-muted);gap:1rem;text-transform:uppercase;letter-spacing:0.055em;}
  .footer-right{text-align:center;max-width:90%;}

  .age-gate{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#000;z-index:500;gap:1.5rem;padding:2rem;text-align:center;}
  .age-gate.hidden{display:none;}
  .age-gate h2{font-size:clamp(2rem,5vw,4rem);font-weight:900;color:var(--accent);}
  .age-gate p{font-size:clamp(1rem,2vw,1.5rem);color:var(--text-muted);max-width:600px;}
  .age-gate .btn{font-size:1.25rem;padding:1rem 2rem;}
  .age-gate .btn-secondary{font-size:1rem;background:var(--surface2);color:var(--text);text-decoration:none;}

  .category-header{margin-bottom:0.7rem;padding-bottom:0.55rem;border-bottom:1px solid var(--border);display:flex;align-items:baseline;gap:0.75rem;}
  .category-title{font-size:clamp(1.55rem,2.15vw,2.35rem);font-weight:900;letter-spacing:0.01em;line-height:1.1;color:var(--text);display:inline-flex;align-items:center;gap:0.6rem;text-transform:none;}
  .cat-icon-wrap{width:1.15em;height:1.15em;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--accent);filter:drop-shadow(0 0 14px var(--accent-glow));}
  .cat-icon{width:100%;height:100%;display:inline-flex;align-items:center;justify-content:center;color:inherit;}
  .cat-icon svg{width:100%;height:100%;fill:currentColor;}
  .layout-grid,.layout-pricewall{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;align-items:stretch;height:100%;min-height:0;}
  .layout-grid:has(.category-block:only-child),.layout-pricewall:has(.category-block:only-child){grid-template-columns:minmax(0,1fr);}
  .layout-grid:has(.category-block:first-child:nth-last-child(2)),.layout-pricewall:has(.category-block:first-child:nth-last-child(2)){grid-template-columns:repeat(2,minmax(0,1fr));}
  .layout-grid:has(.category-block:first-child:nth-last-child(2)) .category-block:first-child:nth-last-child(2) ~ .category-block,.layout-pricewall:has(.category-block:first-child:nth-last-child(2)) .category-block:first-child:nth-last-child(2) ~ .category-block{min-width:0;}
  .layout-grid .category-block,.layout-pricewall .category-block{min-width:0;min-height:0;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.2)),var(--bg-card);border:1px solid var(--border);border-radius:1rem;padding:0.95rem;box-shadow:var(--card-shadow),inset 0 1px 0 rgba(255,255,255,0.045);overflow:hidden;}
  .layout-grid .category-header,.layout-pricewall .category-header{margin-bottom:0.75rem;padding-bottom:0.65rem;border-bottom:1px solid var(--border);}
  .layout-grid .grid-products,.layout-pricewall .grid-products{display:flex;flex-direction:column;gap:0.48rem;flex:1;min-height:0;justify-content:flex-start;}
  .layout-grid .product-table-head,.layout-pricewall .product-table-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;padding:0 0.25rem 0.1rem 0.55rem;color:var(--text-faint);font-size:clamp(0.62rem,0.72vw,0.82rem);font-weight:900;letter-spacing:0.11em;text-transform:uppercase;flex:0 0 auto;}
  .layout-grid .product-card,.layout-pricewall .product-card{background:linear-gradient(145deg,rgba(255,255,255,0.058),rgba(255,255,255,0.014)),var(--bg-card);border:1px solid var(--border);border-left:0;border-radius:0.62rem;overflow:hidden;display:grid;grid-template-columns:0.38rem minmax(0,1fr) auto;align-items:center;gap:0.8rem;min-height:5.65rem;padding:0.65rem 0.78rem 0.65rem 0;box-shadow:0 12px 28px rgba(0,0,0,0.16);transition:border-color 0.3s,transform 0.2s;position:relative;isolation:isolate;flex:0 0 auto;}
  .layout-grid .product-card.has-image,.layout-pricewall .product-card.has-image{grid-template-columns:0.38rem 4.4rem minmax(0,1fr) auto;}
  .layout-grid .product-card:hover,.layout-pricewall .product-card:hover{border-color:var(--border-hover);transform:translateY(-2px);}
  .layout-grid .strain-bar,.layout-pricewall .strain-bar{align-self:stretch;width:0.38rem;background:linear-gradient(180deg,var(--accent),rgba(255,255,255,0.08));box-shadow:0 0 18px var(--accent-glow);}
  .layout-grid .product-card.strain-indica .strain-bar,.layout-pricewall .product-card.strain-indica .strain-bar{background:linear-gradient(180deg,#8b5cf6,#4c1d95);box-shadow:0 0 16px rgba(139,92,246,0.35);}
  .layout-grid .product-card.strain-sativa .strain-bar,.layout-pricewall .product-card.strain-sativa .strain-bar{background:linear-gradient(180deg,#f97316,#c2410c);box-shadow:0 0 16px rgba(249,115,22,0.35);}
  .layout-grid .product-card.strain-hybrid .strain-bar,.layout-pricewall .product-card.strain-hybrid .strain-bar{background:linear-gradient(180deg,#22c55e,#15803d);box-shadow:0 0 16px rgba(34,197,94,0.35);}
  .layout-grid .card-image,.layout-pricewall .card-image{display:block;width:4.4rem;height:4.4rem;object-fit:cover;border-radius:0.48rem;border:1px solid var(--border);background:var(--bg-elev);box-shadow:0 10px 22px rgba(0,0,0,0.22);}
  .layout-pricewall{grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(23rem,0.72fr);gap:1.1rem;}
  .layout-pricewall .category-block{border-radius:1rem;padding:0.9rem;background:linear-gradient(180deg,rgba(255,255,255,0.055),rgba(0,0,0,0.2)),var(--bg-card);}
  .layout-pricewall .category-title{font-size:clamp(1.32rem,1.7vw,1.95rem);letter-spacing:0.015em;text-transform:uppercase;}
  .layout-pricewall .grid-products{gap:0.46rem;}
  .layout-pricewall .product-card{min-height:5.1rem;padding:0.56rem 0.72rem 0.56rem 0;gap:0.68rem;border-radius:0.62rem;box-shadow:0 10px 24px rgba(0,0,0,0.18);}
  .layout-pricewall .product-card.has-image{grid-template-columns:0.34rem 3.45rem minmax(0,1fr) auto;}
  .layout-pricewall .strain-bar{width:0.34rem;}
  .layout-pricewall .card-image{width:3.45rem;height:3.45rem;border-radius:0.42rem;}
  .layout-pricewall .card-body{min-width:0;display:flex;flex-direction:column;gap:0.2rem;}
  .layout-pricewall .card-name{font-size:clamp(1.06rem,1.18vw,1.38rem);line-height:1.05;-webkit-line-clamp:1;text-transform:none;}
  .layout-pricewall .card-meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;min-width:0;max-width:none;font-size:clamp(0.66rem,0.75vw,0.86rem);line-height:1.1;gap:0.18rem 0.44rem;}
  .layout-pricewall .card-meta span{white-space:nowrap;}
  .layout-pricewall .card-desc{display:none;}
  .layout-pricewall .card-price{font-size:clamp(1.32rem,1.6vw,1.92rem);min-width:4rem;text-align:right;}
  .layout-pricewall .card-price .promo-price{display:block;width:max-content;margin:0 0 0.18rem auto;padding:0.12rem 0.36rem;border:1px solid var(--accent);border-radius:999px;background:var(--accent-dim);color:var(--accent);font-size:clamp(0.54rem,0.58vw,0.7rem);line-height:1;font-weight:950;letter-spacing:0.08em;text-transform:uppercase;}
  .layout-pricewall .pricewall-shell{grid-column:3;grid-row:1 / span 3;display:flex;flex-direction:column;gap:0.85rem;min-height:0;}
  .layout-pricewall.pricewall-no-rail{grid-template-columns:repeat(2,minmax(0,1fr));}
  body.has-promo-banner .menu-content{padding-top:0.95rem;padding-bottom:0.7rem;}
  body.has-promo-banner .layout-grid .category-block,body.has-promo-banner .layout-pricewall .category-block{padding:0.78rem;}
  body.has-promo-banner .layout-grid .category-header,body.has-promo-banner .layout-pricewall .category-header{margin-bottom:0.55rem;padding-bottom:0.48rem;}
  body.has-promo-banner .layout-grid .grid-products,body.has-promo-banner .layout-pricewall .grid-products{gap:0.36rem;}
  body.has-promo-banner .layout-grid .product-card,body.has-promo-banner .layout-pricewall .product-card{min-height:4.45rem;padding-top:0.48rem;padding-bottom:0.48rem;}
  body.has-promo-banner .layout-grid .product-card.has-image,body.has-promo-banner .layout-pricewall .product-card.has-image{grid-template-columns:0.34rem 3.4rem minmax(0,1fr) auto;}
  body.has-promo-banner .layout-grid .card-image,body.has-promo-banner .layout-pricewall .card-image{width:3.4rem;height:3.4rem;}
  .pricewall-panel{background:linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)),var(--bg-card);border:1px solid var(--border);border-radius:1rem;padding:1rem;box-shadow:var(--card-shadow);overflow:hidden;}
  .pricewall-panel-title{font-size:0.68rem;font-weight:950;color:var(--text-faint);letter-spacing:0.16em;text-transform:uppercase;margin-bottom:0.5rem;}
  .pricewall-promo{min-height:9.5rem;display:flex;align-items:flex-start;justify-content:center;background:radial-gradient(circle at 78% 18%,var(--accent-dim),transparent 45%),linear-gradient(160deg,rgba(255,255,255,0.09),rgba(0,0,0,0.16)),var(--bg-card);}
  .pricewall-promo-main{font-size:clamp(2rem,2.75vw,3.55rem);line-height:0.96;font-weight:1000;letter-spacing:-0.055em;color:var(--accent);text-shadow:0 0 26px var(--accent-glow);}
  .pricewall-promo-sub{display:none;}
  .pricewall-status{display:none;}
  .pricewall-status strong{font-size:clamp(1.35rem,1.7vw,1.9rem);line-height:1;color:var(--text);letter-spacing:-0.035em;}
  .pricewall-specials{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:0.6rem;}
  .pricewall-special-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:0.75rem;align-items:center;border-top:1px solid var(--border);padding-top:0.58rem;}
  .pricewall-special-row:first-child{border-top:0;padding-top:0;}
  .pricewall-special-name{font-weight:900;font-size:clamp(0.98rem,1.08vw,1.2rem);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .pricewall-special-price{font-weight:1000;color:var(--accent);font-size:clamp(1.16rem,1.3vw,1.46rem);white-space:nowrap;}
  .layout-list .product-row{display:flex;align-items:baseline;gap:0.5rem;padding:0.5rem 0;border-bottom:1px solid var(--border);min-width:0;}
  .layout-list .row-name{font-size:1.6rem;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
  .layout-list .row-meta{font-size:1.1rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
  .layout-list .leader{flex:1;border-bottom:1px dotted var(--text-faint);margin:0 0.4rem;min-width:1rem;align-self:flex-end;margin-bottom:0.3rem;}
  .layout-list .row-price{font-size:2rem;font-weight:900;color:var(--accent);white-space:nowrap;}

  .layout-grid .card-body{min-width:0;display:flex;flex-direction:column;gap:0.26rem;}
  .layout-grid .card-meta{display:flex;flex-wrap:wrap;align-items:center;gap:0.18rem 0.45rem;min-width:0;max-width:none;line-height:1.12;}
  .layout-grid .card-meta span{white-space:nowrap;}
  .layout-poster,.layout-cinematic,.layout-editorial{display:flex;flex-direction:column;gap:0.85rem;height:100%;min-height:0;}
  .layout-poster .category-block,.layout-cinematic .category-block,.layout-editorial .category-block{display:flex;flex-direction:column;flex:1 1 0;min-height:0;}
  .layout-poster .category-header,.layout-cinematic .category-header,.layout-editorial .category-header{flex:0 0 auto;}
  .layout-poster .poster-products{display:flex;flex-direction:column;gap:1rem;flex:1 1 auto;min-height:0;}
  .layout-poster .product-row{display:flex;gap:1.5rem;align-items:center;padding:1rem;background:var(--bg-card);border-radius:0.6rem;border:1px solid var(--border);}
  .layout-poster .card-image{width:200px;height:200px;object-fit:cover;border-radius:0.4rem;flex-shrink:0;}
  .layout-poster .product-info{flex:1;display:flex;flex-direction:column;gap:0.5rem;}
  .layout-poster .card-name{font-size:2.2rem;font-weight:900;color:var(--text);}
  .layout-poster .card-meta{font-size:1.4rem;color:var(--text-muted);}
  .layout-poster .card-price{font-size:2.8rem;font-weight:900;color:var(--accent);}
  .layout-poster .product-row.no-image{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;min-height:6.4rem;padding:1rem 1.15rem;}
  .layout-poster .poster-products.no-images{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:minmax(6.4rem,1fr);gap:0.75rem;}
  .layout-poster .product-row.no-image .product-info{min-width:0;gap:0.28rem;}
  .layout-poster .product-row.no-image .card-name{font-size:clamp(1.55rem,2.1vw,2.45rem);line-height:1.05;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .layout-poster .product-row.no-image .card-meta{font-size:clamp(0.95rem,1.15vw,1.35rem);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .layout-poster .product-row.no-image .card-price{font-size:clamp(2rem,2.8vw,3.4rem);line-height:1;text-align:right;}
  .layout-poster .product-row.no-image .card-image{display:none;}

  .layout-cinematic .cinematic-products{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:0.78rem;flex:1 1 auto;min-height:0;}
  .layout-cinematic .product-card{position:relative;border-radius:0.8rem;overflow:hidden;height:100%;min-height:0;background:var(--bg-card);border:1px solid var(--border);box-shadow:var(--card-shadow);}
  .layout-cinematic .card-image{width:100%;height:100%;object-fit:cover;border:0;}
  .layout-cinematic .card-body{position:absolute;left:0;right:0;bottom:0;padding:0.9rem 1rem;background:linear-gradient(to top,rgba(0,0,0,0.94) 0%,rgba(0,0,0,0.62) 70%,transparent 100%);display:flex;flex-direction:column;gap:0.2rem;}
  .layout-cinematic .card-name{font-size:clamp(1.25rem,1.6vw,1.8rem);font-weight:900;line-height:1.04;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,0.7);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .layout-cinematic .card-meta{font-size:clamp(0.82rem,0.95vw,1.08rem);line-height:1.16;color:rgba(255,255,255,0.82);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .layout-cinematic .card-price{font-size:clamp(1.45rem,1.9vw,2.15rem);line-height:1;font-weight:900;color:var(--accent);}
  .layout-cinematic .product-card.no-image{height:100%;min-height:7.2rem;}
  .layout-cinematic .product-card.no-image .card-body{position:static;min-height:7.2rem;padding:1rem 1.15rem;background:linear-gradient(145deg,rgba(255,255,255,0.058),rgba(255,255,255,0.014)),var(--bg-card);display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"name price" "meta price";align-items:center;column-gap:1rem;row-gap:0.25rem;}
  .layout-cinematic .product-card.no-image .card-name{grid-area:name;font-size:clamp(1.35rem,1.8vw,2.05rem);line-height:1.08;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .layout-cinematic .product-card.no-image .card-meta{grid-area:meta;font-size:clamp(0.9rem,1.05vw,1.2rem);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .layout-cinematic .product-card.no-image .card-price{grid-area:price;font-size:clamp(1.9rem,2.45vw,3rem);line-height:1;text-align:right;}

  .layout-showcase .showcase-products{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;}
  .layout-showcase .product-card{display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center;}
  .layout-showcase .card-image{width:500px;height:400px;object-fit:cover;border-radius:1rem;}
  .layout-showcase .card-name{font-size:3rem;font-weight:900;color:var(--text);}
  .layout-showcase .card-meta{font-size:1.8rem;color:var(--text-muted);}
  .layout-showcase .card-price{font-size:4rem;font-weight:900;color:var(--accent);}

  .layout-editorial .editorial-products{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:minmax(0,1fr);gap:1rem;flex:1 1 auto;min-height:0;}
  .layout-editorial .product-card{position:relative;background:var(--bg-card);border:1px solid var(--border);border-radius:0.75rem;overflow:hidden;box-shadow:var(--card-shadow);min-height:0;}
  .layout-editorial .card-image{width:100%;height:100%;object-fit:cover;border:0;}
  .layout-editorial .card-body{position:absolute;left:0;right:0;bottom:0;padding:0.85rem 0.95rem;background:linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.62) 72%,transparent 100%);display:flex;flex-direction:column;gap:0.18rem;}
  .layout-editorial .card-name{font-size:clamp(1.05rem,1.28vw,1.45rem);line-height:1.06;font-weight:900;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,0.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .layout-editorial .card-meta{font-size:clamp(0.78rem,0.88vw,0.98rem);line-height:1.12;color:rgba(255,255,255,0.82);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .layout-editorial .card-price{font-size:clamp(1.35rem,1.7vw,1.95rem);line-height:1;font-weight:950;color:var(--accent);}
  .layout-editorial .product-card.no-image{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:1rem;padding:0.85rem 1rem;min-height:5.8rem;height:100%;}
  .layout-editorial .product-card.no-image .card-body{padding:0;min-width:0;gap:0.2rem;}
  .layout-editorial .product-card.no-image .card-name{font-size:clamp(1.2rem,1.45vw,1.7rem);line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .layout-editorial .product-card.no-image .card-meta{font-size:clamp(0.82rem,0.95vw,1.05rem);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .layout-editorial .product-card.no-image .card-price{font-size:clamp(1.6rem,2vw,2.4rem);line-height:1;text-align:right;}

  .out-of-stock{opacity:0.5;}
  .out-of-stock .card-image{filter:grayscale(0.6);}
  .sale-text{color:#ef4444;font-weight:800;}
  .oos-text{color:var(--text-faint);font-style:italic;}

  @keyframes content-refresh{0%{opacity:0.55;transform:translateY(6px);}100%{opacity:1;transform:translateY(0);}}
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

  .price-tiers{display:flex;flex-wrap:wrap;gap:0.45rem 0.55rem;margin-top:auto;align-items:stretch;}
  .price-tiers .tier{display:inline-flex;flex-direction:column;align-items:flex-start;gap:0.05rem;padding:0.28rem 0.45rem;border-radius:0.45rem;background:rgba(255,255,255,0.045);border:1px solid var(--border);min-width:3.5rem;}
  .price-tiers .tier-label{font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);line-height:1;}
  .price-tiers .tier-price{font-size:1.15rem;font-weight:950;line-height:1.05;color:var(--accent);}
  .layout-grid .price-tiers{justify-content:flex-end;gap:0.3rem;margin-top:0;}
  .layout-grid .price-tiers .tier{min-width:3.25rem;padding:0.22rem 0.38rem;border-radius:0.38rem;}
  .layout-grid .price-tiers .tier-label{font-size:0.62rem;}
  .layout-grid .price-tiers .tier-price{font-size:1.05rem;}
  .layout-list .price-tiers{margin-top:0;gap:0.35rem;}
  .layout-list .price-tiers .tier{padding:0;background:transparent;border:0;min-width:auto;flex-direction:row;align-items:baseline;gap:0.25rem;}
  .layout-list .price-tiers .tier-price{font-size:1rem;}
  .layout-poster .price-tiers .tier-price{font-size:1.8rem;}
  .layout-cinematic .price-tiers .tier-price{font-size:1.5rem;color:var(--accent);}
  .layout-showcase .price-tiers{justify-content:center;gap:1rem 1.5rem;}
  .layout-showcase .price-tiers .tier-price{font-size:2.4rem;}
  .layout-editorial .price-tiers .tier-price{font-size:1.3rem;}

  /* Sparse layout for 1-of-4 (or more) multi-display setups: hero + stacked cards fill the screen */
  .layout-sparse{display:flex;flex-direction:column;min-height:0;}
  .layout-sparse .category-block{display:flex;flex-direction:column;flex:1;min-height:0;}
  .layout-sparse .category-header{flex-shrink:0;}
  .layout-sparse .sparse-products{display:flex;flex-direction:column;gap:1rem;flex:1;min-height:0;}
  .layout-sparse .hero-card{display:grid;grid-template-columns:1.2fr 1fr;grid-template-rows:1fr;gap:1.5rem;background:var(--card-grad),var(--bg-card);border:1px solid var(--border);border-radius:0.8rem;overflow:hidden;flex:1.2;min-height:0;padding:1.5rem;}
  .layout-sparse .hero-card .card-image{width:100%;height:100%;object-fit:cover;border-radius:0.6rem;min-height:0;}
  .layout-sparse .hero-card.no-image{grid-template-columns:1fr;}
  .layout-sparse .hero-info{display:flex;flex-direction:column;justify-content:center;gap:0.75rem;min-width:0;}
  .layout-sparse .hero-name{font-size:clamp(2.4rem,3.5vw,3.8rem);font-weight:900;line-height:1.1;color:var(--text);overflow-wrap:break-word;}
  .layout-sparse .hero-meta{font-size:1.2rem;color:var(--text-muted);}
  .layout-sparse .hero-price{font-size:clamp(2.6rem,4.5vw,5rem);font-weight:900;color:var(--accent);margin-top:auto;}
  .layout-sparse .stack{display:flex;flex-direction:column;gap:0.75rem;flex:1;min-height:0;}
  .layout-sparse .stack-card{display:grid;grid-template-columns:110px 1fr auto;gap:1rem;align-items:center;background:var(--card-grad),var(--bg-card);border:1px solid var(--border);border-radius:0.6rem;overflow:hidden;padding:0.75rem;flex:1;min-height:0;}
  .layout-sparse .stack-card .card-image{width:110px;height:85px;object-fit:cover;border-radius:0.4rem;}
  .layout-sparse .stack-card.no-image{grid-template-columns:1fr auto;}
  .layout-sparse .stack-card .card-name{font-size:clamp(1.2rem,2vw,1.6rem);font-weight:800;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .layout-sparse .stack-card .card-meta{font-size:1rem;color:var(--text-muted);}
  .layout-sparse .stack-card .card-price{font-size:clamp(1.5rem,2.2vw,2.2rem);font-weight:900;color:var(--accent);}
  .layout-sparse .stack-info{min-width:0;}

  /* Single-product sparse category: vertical hero card fills remaining viewport */
  .menu-content.layout-sparse{display:flex;flex-direction:column;min-height:0;}
  .layout-sparse .category-block.single-product{flex:1;min-height:0;}
  .layout-sparse .single-product .sparse-products{flex:1;min-height:0;gap:0;}
  .layout-sparse.single-product .hero-card,.layout-sparse .single-product .hero-card{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;min-height:0;padding:2rem;gap:2rem;}
  .layout-sparse.single-product .hero-card .card-image,.layout-sparse .single-product .hero-card .card-image{width:100%;height:55%;max-height:55%;object-fit:cover;border-radius:0.8rem;}
  .layout-sparse.single-product .hero-card.no-image,.layout-sparse .single-product .hero-card.no-image{gap:1rem;}
  .layout-sparse.single-product .hero-info,.layout-sparse .single-product .hero-info{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;text-align:center;min-width:0;width:100%;}
  .layout-sparse.single-product .hero-name,.layout-sparse .single-product .hero-name{font-size:clamp(3rem,5vw,5.5rem);}
  .layout-sparse.single-product .hero-meta,.layout-sparse .single-product .hero-meta{font-size:clamp(1.2rem,2vw,1.8rem);}
  .layout-sparse.single-product .hero-price,.layout-sparse .single-product .hero-price{font-size:clamp(3rem,6vw,6.5rem);margin-top:1rem;}

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
<body class="template-${initialTemplate} font-${initialFontSize}">

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
  var DISPLAY_NUM = parseInt(new URLSearchParams(location.search).get('display') || '1');
  var DISPLAY_TOTAL = parseInt(new URLSearchParams(location.search).get('displays') || '1');

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

  var CATEGORY_ICON_SVGS = ${JSON.stringify(CATEGORY_ICON_SVGS)};
  var CATEGORY_LABELS = ${JSON.stringify(CATEGORY_LABELS)};

  var ws = null;
  var config = null;
  var initialConfig = ${options?.initialConfig ? JSON.stringify(options.initialConfig) : 'null'};
  var paired = false;
  var reconnectAttempts = 0;
  var reconnectTimer = null;
  var heartbeatTimer = null;
  var cursorTimer = null;
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

  var COMPLIANCE_TEMPLATES = ${JSON.stringify(COMPLIANCE_TEMPLATES)};
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
  function safeImgUrl(url){
    if(!url || typeof url !== 'string') return '';
    var u = url.trim();
    if(/^\\/api\\/uploads\\//.test(u) || /^data:image\\//.test(u)) return u;
    try {
      var parsed = new URL(u, location.origin);
      var host = parsed.hostname;
      if(parsed.protocol === 'https:' && parsed.pathname.indexOf('/api/uploads/') === 0 && (host === location.hostname || host === 'dubmenu.com' || host === 'www.dubmenu.com')) return parsed.toString();
    } catch(e) {}
    return '';
  }
  function safeCssValue(v){
    if(!v || typeof v !== 'string') return '';
    if(/[;{}<>]/.test(v)) return '';
    return v;
  }

  function safeFontSize(v){
    return v === 'small' || v === 'large' || v === 'medium' ? v : 'medium';
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
    return '<img class="card-image card-image-loading" src="' + escapeHtml(safeUrl) + '" alt="' + alt + '"' + (lazy ? ' loading="lazy"' : '') + ' decoding="async" onload="this.classList.remove(\\'card-image-loading\\');this.classList.add(\\'card-image-loaded\\');" onerror="window.dubmenuImgFallback(this)">';
  }

  window.dubmenuImgFallback = function(img){
    if(!img) return;
    var card = img.closest && img.closest('.has-image');
    if(card){ card.classList.remove('has-image'); card.classList.add('no-image'); }
    if(img.parentNode) img.parentNode.removeChild(img);
  };

  ${GET_CATEGORY_TYPE_JS}
  function categoryIconSvg(type){
    return CATEGORY_ICON_SVGS[type] || CATEGORY_ICON_SVGS.generic;
  }
  function categoryIcon(type){
    return '<span class="cat-icon-wrap" aria-hidden="true"><span class="cat-icon cat-icon-' + type + '">' + categoryIconSvg(type) + '</span></span>';
  }

  var cycleState = {currentPage:0, totalPages:1, interval:null, isTransitioning:false};


  // Resolve the active layout for THIS TV:
  //   1. ?layout= URL override (validated) — used for monitor-level layout choices
  //   2. Explicit config.layout override from the remote controls
  //   3. Legacy config.layoutMode mapping (auto/columns/grid -> grid; pricelist/compact -> list)
  //   4. For 1-of-4+ multi-display setups, prefer sparse hero-fill layout
  //   5. Dense imported menus default to the pricewall shell that competitors use
  //      for real TV menu boards: category price tables plus a promo/status rail.
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
    if(DISPLAY_TOTAL >= 4) return 'sparse';
    if(getTotalProductCount(cfg) >= 36) return 'pricewall';
    return 'grid';
  }
  function getTotalProductCount(cfg){
    return ((cfg && cfg.categories) || []).reduce(function(total, cat){
      return total + ((cat && cat.products) ? cat.products.length : 0);
    }, 0);
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
    var cats=(allCats||[]).filter(function(c){return c&&c.products&&c.products.length>0;});
    if(DISPLAY_TOTAL>1 && cats.length>0 && cats.length<DISPLAY_TOTAL){
      return [cats[(Math.max(1,DISPLAY_NUM)-1)%cats.length]];
    }
    if(DISPLAY_TOTAL>1){
      var basePerTv=Math.floor(cats.length/DISPLAY_TOTAL);
      var extra=cats.length%DISPLAY_TOTAL;
      var count=basePerTv+(DISPLAY_NUM<=extra?1:0);
      var start=(DISPLAY_NUM-1)*basePerTv+Math.min(DISPLAY_NUM-1,extra);
      cats=cats.slice(start,start+count);
    }
    return cats;
  }

  function manualSpecialsCategory(cfg){
    var specials = ((cfg && cfg.specials) || []).filter(function(s){ return s && s.active !== false && String(s.title || '').trim(); });
    if(!specials.length) return null;
    return {
      id: 'specials',
      name: 'Specials',
      order: -1,
      products: specials.slice(0, 8).map(function(s, idx){
        return {
          id: s.id || ('manual-special-' + idx),
          name: s.title,
          description: s.description || '',
          brand: s.brand || '',
          image: s.image || '',
          price: typeof s.price === 'number' ? s.price : undefined,
          originalPrice: typeof s.originalPrice === 'number' ? s.originalPrice : undefined,
          priceTiers: Array.isArray(s.priceTiers) ? s.priceTiers : undefined,
          specialLabel: s.specialLabel || 'Special',
          inStock: true,
          isPromo: true
        };
      })
    };
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

  function getProductsPerPage(layout, bannerActive){
    // Default page sizes tuned for a 1080px viewport. Increase for demo/default
    // displays so the board looks populated and premium. Reduce when a promo
    // banner is active so the bottom row/category is not clipped by the
    // banner's reserved space.
    var isDemoDefault = isDemoOrDefaultDisplay(config);
    var base;
    switch(layout){
      case 'grid': base = 12; break;
      case 'pricewall': base = isDemoDefault ? 18 : 16; break;
      case 'list': base = isDemoDefault ? 18 : 12; break;
      case 'poster': base = isDemoDefault ? 8 : 6; break;
      case 'cinematic': base = isDemoDefault ? 8 : 6; break;
      case 'showcase': base = 1; break;
      case 'editorial': base = isDemoDefault ? 12 : 9; break;
      default: base = 10;
    }
    return bannerActive && layout !== 'pricewall' ? Math.max(1, base - (layout === 'showcase' ? 0 : 2)) : base;
  }

  function getMaxCategoriesPerPage(layout, bannerActive){
    // Limit categories per page so headers + products fit in the viewport.
    var isDemoDefault = isDemoOrDefaultDisplay(config);
    var base;
    switch(layout){
      case 'grid': base = 3; break;
      case 'pricewall': base = 2; break;
      case 'list': base = isDemoDefault ? 4 : 3; break;
      case 'poster': base = isDemoDefault ? 2 : 2; break;
      case 'cinematic': base = isDemoDefault ? 2 : 2; break;
      case 'showcase': base = 1; break;
      case 'editorial': base = isDemoDefault ? 3 : 3; break;
      case 'sparse': base = 1; break;
      default: base = 3;
    }
    return bannerActive && layout !== 'pricewall' ? Math.max(1, base - 1) : base;
  }

  function getPagingInfo(cats, perPage, maxCategories){
    var catsWithProducts = (cats || []).filter(function(c){return c && c.products && c.products.length>0;});
    if(catsWithProducts.length===0) return {categoryPages:1,productPages:1,totalPages:1};
    var categoryPages = Math.max(1, Math.ceil(catsWithProducts.length / maxCategories));
    var maxProductPages = 1;
    for(var page=0; page<categoryPages; page++){
      var pageCats = catsWithProducts.slice(page * maxCategories, (page + 1) * maxCategories);
      var perCategory = Math.max(1, Math.floor(perPage / Math.max(1, pageCats.length)));
      pageCats.forEach(function(cat){
        maxProductPages = Math.max(maxProductPages, Math.ceil(cat.products.length / perCategory));
      });
    }
    return {categoryPages:categoryPages,productPages:maxProductPages,totalPages:categoryPages * maxProductPages};
  }

  function paginateCategories(cats, pageNum, perPage, maxCategories){
    var catsWithProducts = cats.filter(function(c){return c.products.length>0;});
    if(catsWithProducts.length===0) return [];
    var paging = getPagingInfo(catsWithProducts, perPage, maxCategories);
    var categoryPage = pageNum % paging.categoryPages;
    var productPage = Math.floor(pageNum / paging.categoryPages);
    var pageCats = catsWithProducts.slice(categoryPage * maxCategories, (categoryPage + 1) * maxCategories);
    if(pageCats.length===0) return [];
    var perCategory = Math.max(1, Math.floor(perPage / pageCats.length));
    return pageCats.map(function(cat){
      var total = cat.products.length;
      var count = Math.min(perCategory, total);
      var start = (productPage * count) % total;
      var products = [];
      for(var i=0;i<count;i++){
        var idx = (start+i) % total;
        products.push(cat.products[idx]);
      }
      return Object.assign({}, cat, {products: products});
    }).filter(function(c){return c.products.length>0;});
  }

  function getCycleInterval(){
    var raw = Number(config && config.autoScrollSpeed);
    if(!isFinite(raw)) return 10000;
    return Math.max(4000, Math.min(20000, 5000 + raw * 100));
  }

  function stopCycling(){
    clearInterval(cycleState.interval);
    cycleState.interval=null;
  }

  function startCycling(){
    stopCycling();
    if(cycleState.totalPages<=1) return;
    cycleState.interval = setInterval(function(){
      if(cycleState.isTransitioning) return;
      cycleState.isTransitioning = true;
      cycleState.currentPage = (cycleState.currentPage + 1) % cycleState.totalPages;
      renderCurrentPage();
      var content = document.getElementById('menu-content');
      if(content){
        content.classList.remove('content-refresh');
        void content.offsetWidth;
        content.classList.add('content-refresh');
      }
      setTimeout(function(){cycleState.isTransitioning=false;},180);
    },getCycleInterval());
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
    var pricewallRailCats = cats;
    if(layout === 'pricewall' && cats.length > 1){
      var promoProducts = getPricewallPromoProducts(cats);
      var shouldUsePromoRail = !!getActiveBanner() || promoProducts.length >= 3;
      if(shouldUsePromoRail){
        displayCats = cats.filter(function(cat){return !isSpecialCategory(cat);});
        if(!displayCats.length) displayCats = cats;
      } else if(promoProducts.length){
        displayCats = mergeSparsePricewallSpecials(cats, promoProducts);
        pricewallRailCats = [];
      }
    }
    if(!displayCats.length){renderEmptyMenu(layout);return;}
    
    var bannerActive = !!getActiveBanner();
    var perPage = getProductsPerPage(layout, bannerActive);
    var maxCategories = getMaxCategoriesPerPage(layout, bannerActive);
    var pageCats = paginateCategories(displayCats, cycleState.currentPage, perPage, maxCategories);
    if(!pageCats.length && displayCats.length){
      cycleState.currentPage = 0;
      pageCats = paginateCategories(displayCats, 0, perPage, maxCategories);
    }
    if(!pageCats.length){renderEmptyMenu(layout);return;}
    
    var content = document.getElementById('menu-content');
    content.innerHTML = '';
    content.className = 'menu-content layout-' + layout;
    
    if(layout==='grid') renderGrid(pageCats, content);
    else if(layout==='pricewall') renderPricewall(pageCats, content, pricewallRailCats);
    else if(layout==='list') renderList(pageCats, content);
    else if(layout==='poster') renderPoster(pageCats, content);
    else if(layout==='cinematic') renderCinematic(pageCats, content);
    else if(layout==='showcase') renderShowcase(cats, content);
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
  function updatePromoBannerDisplay(){
    var pb=document.getElementById('promo-bar');
    if(!pb)return;
    var banner=getActiveBanner();
    document.body.classList.toggle('has-promo-banner',!!banner);
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
  setInterval(function(){if(config&&paired)updatePromoBannerDisplay();},60000);

  function renderMenu(){
    if(!config) return;
    document.body.className = ('template-' + getActiveTemplate(config) + ' font-' + safeFontSize(config.fontSize) + ' ' + customFontClass(config.customFont)).trim();
    applyBrandStyle(config);
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
    
    if(!cats.length){
      document.getElementById('menu-content').innerHTML = emptyMenuMarkup();
      return;
    }
    
    // Hide connection indicator when menu is showing
    document.getElementById('conn-indicator').classList.remove('visible');
    
    var layout = getActiveLayout(config);
    var bannerActive = !!getActiveBanner();
    var perPage = getProductsPerPage(layout, bannerActive);
    var maxCategories = getMaxCategoriesPerPage(layout, bannerActive);
    cycleState.totalPages = layout === 'showcase' ? Math.max(1, getTotalProductCount({categories: cats})) : getPagingInfo(cats, perPage, maxCategories).totalPages;
    cycleState.currentPage = 0;
    
    renderCurrentPage();
    
    if(config.autoScroll || cycleState.totalPages > 1) startCycling();
    else stopCycling();

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

  function makeSub(p){
    var parts = [];
    if(p.inStock === false) parts.push('<span class="oos-text">Sold Out</span>');
    if(config.showStrain !== false && p.strain) parts.push(strainBadge(p));
    if(p.weight) parts.push(escapeHtml(p.weight));
    if(p.thc) parts.push('THC ' + escapeHtml(p.thc));
    if(config.showBrand !== false && p.brand) parts.push(escapeHtml(p.brand));
    return parts.join(' \u00B7 ');
  }

  function makePrice(p){
    if(!p) return '';
    var promo = '';
    if(p.specialLabel){
      promo = '<span class="promo-price">' + escapeHtml(p.specialLabel) + '</span> ';
    } else if(p.isPromo || p.special){
      promo = '<span class="promo-price">Special</span> ';
    }
    if(Array.isArray(p.priceTiers) && p.priceTiers.length){
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
    var hasPrice = typeof p.price === 'number' || (typeof p.price === 'string' && p.price.trim());
    var orig = p.priceOriginal || p.originalPrice;
    if(orig && hasPrice && orig !== p.price){
      return promo + '<span class="card-price-orig">$' + escapeHtml(orig) + '</span> <span class="sale-text">$' + escapeHtml(p.price) + '</span>';
    }
    if(!hasPrice) return promo.trim();
    return promo + '$' + (typeof p.price === 'number' ? p.price.toFixed(2).replace(/\\.00$/, '') : escapeHtml(p.price));
  }

  function makeDesc(p){
    if(config && config.showDescription === false) return '';
    if(!p || !p.description) return '';
    return '<div class="card-desc">' + escapeHtml(p.description) + '</div>';
  }

  function gridStrainClass(p){
    var raw = String((p && p.strain) || '').toLowerCase().trim();
    var map = {h:'hybrid',s:'sativa',i:'indica',hybrid:'hybrid',sativa:'sativa',indica:'indica'};
    var strain = map[raw];
    return strain ? ' strain-' + strain : '';
  }

  function makeGridMeta(p){
    var parts = [];
    if(config.showStrain !== false && p.strain) parts.push(strainBadge(p));
    if(p.weight) parts.push('<span>' + escapeHtml(p.weight) + '</span>');
    if(p.thc) parts.push('<span>THC ' + escapeHtml(p.thc) + '</span>');
    if(config.showBrand !== false && p.brand) parts.push('<span>' + escapeHtml(p.brand) + '</span>');
    return parts.join('');
  }

  function renderGrid(cats, container){
    cats.forEach(function(cat, catIndex){
      var catEl = document.createElement('div');
      catEl.className = 'category-block';
      catEl.innerHTML = '<div class="category-header"><div class="category-title">' + categoryIcon(getCategoryType(cat.name)) + escapeHtml(cat.name) + '</div></div>';
      var grid = document.createElement('div');
      grid.className = 'grid-products';
      grid.innerHTML = '<div class="product-table-head"><span>Product</span><span>Price</span></div>';
      cat.products.forEach(function(p){ p.categoryName = cat.name;
        var hasImage = !!(safeImgUrl(p.image) && config.showImages !== false);
        var visual = hasImage ? imgMarkup(p, true) : '';
        var card = document.createElement('div');
        card.className = 'product-card' + (hasImage ? ' has-image' : ' no-image') + (config.showStrain !== false ? gridStrainClass(p) : '') + (p.inStock === false ? ' out-of-stock' : '');
        card.innerHTML = '<span class="strain-bar"></span>' + visual + '<div class="card-body"><div class="card-name">' + escapeHtml(p.name) + '</div><div class="card-meta">' + makeGridMeta(p) + '</div>' + makeDesc(p) + '</div><div class="card-price">' + makePrice(p) + '</div>';
        grid.appendChild(card);
      });
      catEl.appendChild(grid);
      container.appendChild(catEl);
    });
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
        if(p && (specialCat || p.isPromo || p.special || p.specialLabel || p.originalPrice || p.priceOriginal)) promoProducts.push(p);
      });
    });
    return promoProducts;
  }

  function mergeSparsePricewallSpecials(cats, promoProducts){
    var promos = promoProducts.slice(0, 2).map(function(p){
      return Object.assign({}, p, { isPromo: true, specialLabel: p.specialLabel || 'Special' });
    });
    var inserted = false;
    var merged = [];
    cats.forEach(function(cat){
      if(isSpecialCategory(cat)) return;
      var copy = Object.assign({}, cat);
      var products = (cat.products || []).slice();
      if(!inserted && products.length){
        copy.products = promos.concat(products);
        inserted = true;
      } else {
        copy.products = products;
      }
      merged.push(copy);
    });
    return inserted ? merged : cats;
  }




  function renderPricewallShell(cats, container){
    var promoProducts = getPricewallPromoProducts(cats);
    var banner = getActiveBanner();
    promoProducts = promoProducts.slice(0, 3);
    var shell = document.createElement('aside');
    shell.className = 'pricewall-shell';
    var headline = banner ? banner.text : 'Specials';
    var specials = promoProducts.map(function(p){
      return '<div class="pricewall-special-row"><div class="pricewall-special-name">' + escapeHtml(p.name) + '</div><div class="pricewall-special-price">' + makePrice(p) + '</div></div>';
    }).join('');
    var promoPanel = banner ? '' : (specials ? '<div class="pricewall-panel pricewall-promo"><div class="pricewall-promo-main">' + escapeHtml(headline).slice(0, 42) + '</div></div>' : '');
    var specialPanel = specials ? '<div class="pricewall-panel pricewall-specials"><div class="pricewall-panel-title">Featured deals</div>' + specials + '</div>' : '';
    if(!promoPanel && !specialPanel) return false;
    shell.innerHTML = promoPanel + specialPanel;
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
      catEl.className = 'category-block';
      catEl.innerHTML = '<div class="category-header"><div class="category-title">' + categoryIcon(getCategoryType(cat.name)) + escapeHtml(cat.name) + '</div></div>';
      var list = document.createElement('div');
      list.className = 'list-products';
      cat.products.forEach(function(p){ p.categoryName = cat.name;
        var row = document.createElement('div');
        row.className = 'product-row' + (p.inStock === false ? ' out-of-stock' : '');
        row.innerHTML = '<div class="row-name">' + escapeHtml(p.name) + '</div><div class="row-meta">' + makeSub(p) + '</div><div class="leader"></div><div class="row-price">' + makePrice(p) + '</div>';
        list.appendChild(row);
      });
      catEl.appendChild(list);
      container.appendChild(catEl);
    });
  }

  function renderPoster(cats, container){
    cats.forEach(function(cat, catIndex){
      var catEl = document.createElement('div');
      catEl.className = 'category-block';
      catEl.innerHTML = '<div class="category-header"><div class="category-title">' + categoryIcon(getCategoryType(cat.name)) + escapeHtml(cat.name) + '</div></div>';
      var poster = document.createElement('div');
      poster.className = 'poster-products' + (cat.products.some(function(p){ return !!(safeImgUrl(p.image) && config.showImages !== false); }) ? ' has-images' : ' no-images');
      cat.products.forEach(function(p){ p.categoryName = cat.name;
        var row = document.createElement('div');
        var rowHasImage = !!(safeImgUrl(p.image) && config.showImages !== false);
        row.className = 'product-row ' + (rowHasImage ? 'has-image' : 'no-image') + (p.inStock === false ? ' out-of-stock' : '');
        var img = rowHasImage ? imgMarkup(p, false) : '';
        row.innerHTML = img + '<div class="product-info"><div class="card-name">' + escapeHtml(p.name) + '</div><div class="card-meta">' + makeSub(p) + '</div><div class="card-price">' + makePrice(p) + '</div></div>';
        poster.appendChild(row);
      });
      catEl.appendChild(poster);
      container.appendChild(catEl);
    });
  }

  function renderCinematic(cats, container){
    cats.forEach(function(cat, catIndex){
      var catEl = document.createElement('div');
      catEl.className = 'category-block';
      catEl.innerHTML = '<div class="category-header"><div class="category-title">' + categoryIcon(getCategoryType(cat.name)) + escapeHtml(cat.name) + '</div></div>';
      var grid = document.createElement('div');
      grid.className = 'cinematic-products';
      cat.products.forEach(function(p){ p.categoryName = cat.name;
        var card = document.createElement('div');
        var hasImage = !!(safeImgUrl(p.image) && config.showImages !== false);
        card.className = 'product-card ' + (hasImage ? 'has-image' : 'no-image') + (p.inStock === false ? ' out-of-stock' : '');
        var img = hasImage ? imgMarkup(p, true) : '';
        card.innerHTML = img + '<div class="card-body"><div class="card-name">' + escapeHtml(p.name) + '</div><div class="card-meta">' + makeSub(p) + '</div><div class="card-price">' + makePrice(p) + '</div></div>';
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
    card.innerHTML = img + '<div class="card-name">' + escapeHtml(p.name) + '</div><div class="card-meta">' + escapeHtml(current.catName) + ' \u00B7 ' + makeSub(p) + '</div><div class="card-price">' + makePrice(p) + '</div>';
    showcase.appendChild(card);
    container.appendChild(showcase);
  }

  function renderEditorial(cats, container){
    cats.forEach(function(cat, catIndex){
      var catEl = document.createElement('div');
      catEl.className = 'category-block';
      catEl.innerHTML = '<div class="category-header"><div class="category-title">' + categoryIcon(getCategoryType(cat.name)) + escapeHtml(cat.name) + '</div></div>';
      var grid = document.createElement('div');
      grid.className = 'editorial-products';
      cat.products.forEach(function(p){ p.categoryName = cat.name;
        var card = document.createElement('div');
        var hasImage = !!(safeImgUrl(p.image) && config.showImages !== false);
        card.className = 'product-card ' + (hasImage ? 'has-image' : 'no-image') + (p.inStock === false ? ' out-of-stock' : '');
        var img = hasImage ? imgMarkup(p, true) : '';
        card.innerHTML = img + '<div class="card-body"><div class="card-name">' + escapeHtml(p.name) + '</div><div class="card-meta">' + makeSub(p) + '</div><div class="card-price">' + makePrice(p) + '</div></div>';
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
      catEl.className = 'category-block' + (products.length === 1 ? ' single-product' : '');
      catEl.innerHTML = '<div class="category-header"><div class="category-title">' + categoryIcon(getCategoryType(cat.name)) + escapeHtml(cat.name) + '</div></div>';
      var wrap = document.createElement('div');
      wrap.className = 'sparse-products' + (products.length === 1 ? ' single-product' : '');
      var hero = products[0];
      var rest = products.slice(1);
      var heroCard = document.createElement('div');
      var heroHasImage = !!(hero && safeImgUrl(hero.image) && config.showImages !== false);
      heroCard.className = 'hero-card ' + (heroHasImage ? 'has-image' : 'no-image') + (hero.inStock === false ? ' out-of-stock' : '');
      heroCard.innerHTML = imgMarkup(hero, false) + '<div class="hero-info"><div class="hero-name">' + escapeHtml(hero.name) + '</div><div class="hero-meta">' + makeSub(hero) + '</div><div class="hero-price">' + makePrice(hero) + '</div></div>';
      wrap.appendChild(heroCard);
      if(rest.length){
        var stack = document.createElement('div');
        stack.className = 'stack';
        rest.forEach(function(p){
          var row = document.createElement('div');
          var rowHasImage = !!(p && safeImgUrl(p.image) && config.showImages !== false);
          row.className = 'stack-card ' + (rowHasImage ? 'has-image' : 'no-image') + (p.inStock === false ? ' out-of-stock' : '');
          row.innerHTML = imgMarkup(p, true) + '<div class="stack-info"><div class="card-name">' + escapeHtml(p.name) + '</div><div class="card-meta">' + makeSub(p) + '</div></div><div class="card-price">' + makePrice(p) + '</div>';
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
    menu.style.width = SCALE_BASELINE_W + 'px';
    menu.style.height = SCALE_BASELINE_H + 'px';
    menu.style.transform = 'scale(' + scale + ')';
    var scaledW = SCALE_BASELINE_W * scale;
    var scaledH = SCALE_BASELINE_H * scale;
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
          if(paired){setPhase('menu');renderMenu();}
          else {setPhase('pairing');}
          return;
        }
        if(msg.type==='paired'){paired=true;setConn('paired');setPhase('menu');if(config) renderMenu();}
        if(msg.type==='unpaired'){paired=false;stopCycling();if(!hasProducts(config)){setPhase('pairing');}}
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

  var fsDone=false;
  function tryFullscreen(){
    if(fsDone)return;
    fsDone=true;
    var el=document.documentElement;
    if(el.requestFullscreen)el.requestFullscreen().catch(function(){});
    else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();
  }

  function verifyAge(){
    try{localStorage.setItem('dubmenu_age_verified_${safeSessionId}','1');}catch(e){}
    var gate=document.getElementById('age-gate');
    if(gate)gate.classList.add('hidden');
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

  document.addEventListener('click',tryFullscreen);
  document.addEventListener('touchstart',tryFullscreen);
  document.addEventListener('keydown',tryFullscreen);
  setTimeout(tryFullscreen,1000);

  document.addEventListener('mousemove',function(){
    document.body.classList.remove('cursor-hidden');
    if(cursorTimer) clearTimeout(cursorTimer);
    cursorTimer=setTimeout(function(){document.body.classList.add('cursor-hidden');},5000);
  });

  window.addEventListener('resize',function(){fitToScreen();});

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

  connect();

  try{
    if(!config || config.analyticsEnabled !== false) fetch('/api/analytics/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'analytics.tv.load',payload:{session:'${safeSessionId}'}})});
  }catch(e){}
})();
</script>
</body>
</html>`;
}