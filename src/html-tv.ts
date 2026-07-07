import { CATEGORY_ICON_SVGS, PLACEHOLDER_ICON_SVGS, CATEGORY_LABELS, GET_CATEGORY_TYPE_JS, GET_PRODUCT_VARIANT_JS } from './category-icons';

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

export function tvPage(sessionId: string, origin: string, options?: { noAgeGate?: boolean; preview?: boolean; initialConfig?: any; demo?: boolean }): string {
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
    initialConfig.categories.some((cat: any) => Array.isArray(cat.products) && cat.products.length > 0);
  const initialTemplate = initialConfig?.template || 'default';
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
  .menu-header{display:flex;justify-content:space-between;align-items:center;padding:0.85rem 2.25rem;border-bottom:1px solid var(--border);flex-shrink:0;background:linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0.08)),var(--bg);z-index:9;box-shadow:0 12px 32px rgba(0,0,0,0.22);}
  .header-left{display:flex;align-items:center;gap:1rem;min-width:0;}
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
  .layout-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;align-items:stretch;}
  .layout-grid .category-block{min-width:0;min-height:0;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.2)),var(--bg-card);border:1px solid var(--border);border-radius:1rem;padding:0.95rem;box-shadow:var(--card-shadow),inset 0 1px 0 rgba(255,255,255,0.045);overflow:hidden;}
  .layout-grid .category-header{margin-bottom:0.75rem;padding-bottom:0.65rem;border-bottom:1px solid var(--border);}
  .layout-grid .grid-products{display:flex;flex-direction:column;gap:0.48rem;flex:1;min-height:0;}
  .layout-grid .product-table-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;padding:0 0.25rem 0.1rem 0.55rem;color:var(--text-faint);font-size:clamp(0.62rem,0.72vw,0.82rem);font-weight:900;letter-spacing:0.11em;text-transform:uppercase;}
  .layout-grid .product-card{background:linear-gradient(145deg,rgba(255,255,255,0.058),rgba(255,255,255,0.014)),var(--bg-card);border:1px solid var(--border);border-left:0;border-radius:0.62rem;overflow:hidden;display:grid;grid-template-columns:0.38rem minmax(0,1fr) auto;align-items:center;gap:0.8rem;min-height:5.65rem;padding:0.65rem 0.78rem 0.65rem 0;box-shadow:0 12px 28px rgba(0,0,0,0.16);transition:border-color 0.3s,transform 0.2s;position:relative;isolation:isolate;}
  .layout-grid .product-card:hover{border-color:var(--border-hover);transform:translateY(-2px);}
  .layout-grid .strain-bar{align-self:stretch;width:0.38rem;background:linear-gradient(180deg,var(--accent),rgba(255,255,255,0.08));box-shadow:0 0 18px var(--accent-glow);}
  .layout-grid .product-card.strain-indica .strain-bar{background:linear-gradient(180deg,#8b5cf6,#4c1d95);box-shadow:0 0 16px rgba(139,92,246,0.35);}
  .layout-grid .product-card.strain-sativa .strain-bar{background:linear-gradient(180deg,#f97316,#c2410c);box-shadow:0 0 16px rgba(249,115,22,0.35);}
  .layout-grid .product-card.strain-hybrid .strain-bar{background:linear-gradient(180deg,#22c55e,#15803d);box-shadow:0 0 16px rgba(34,197,94,0.35);}
  .layout-grid .card-image,.layout-grid .card-image-placeholder{display:none;}
  .layout-grid .card-body{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(8rem,auto);grid-template-areas:"name meta" "desc meta";column-gap:0.8rem;row-gap:0.28rem;min-width:0;}
  .layout-grid .card-name{grid-area:name;font-size:clamp(1.2rem,1.5vw,1.75rem);font-weight:900;line-height:1.06;color:var(--text);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:normal;}
  .layout-grid .card-meta{grid-area:meta;display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:0.3rem 0.46rem;min-width:8rem;max-width:14rem;font-size:clamp(0.78rem,0.9vw,1rem);line-height:1.15;color:var(--text-muted);}
  .layout-grid .card-meta .strain-badge-tv{font-size:0.72rem;padding:0.18rem 0.46rem;margin-right:0;}
  .layout-grid .card-desc{grid-area:desc;font-size:clamp(0.8rem,0.92vw,1rem);line-height:1.22;color:var(--text-muted);display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;max-width:100%;}
  .layout-grid .card-price{font-size:clamp(1.55rem,1.9vw,2.25rem);font-weight:950;color:var(--accent);letter-spacing:-0.03em;text-align:right;min-width:4.6rem;text-shadow:0 0 18px var(--accent-glow);}
  .layout-grid .card-price-orig{font-size:0.85rem;color:var(--text-faint);text-decoration:line-through;}
  .layout-grid .category-spotlight{position:relative;display:flex;flex-direction:column;justify-content:flex-end;gap:0.38rem;flex:1;min-height:4.75rem;margin-top:0.15rem;padding:1.1rem;border:1px solid var(--border);border-radius:0.7rem;overflow:hidden;background:radial-gradient(circle at 78% 26%,rgba(16,185,129,0.22),transparent 26%),radial-gradient(circle at 50% 100%,rgba(16,185,129,0.18),transparent 38%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(0,0,0,0.26)),var(--bg-elev);}
  .layout-grid .category-spotlight::after{content:'';position:absolute;right:-1.2rem;bottom:-1.4rem;width:12rem;height:12rem;border-radius:50%;background:var(--accent);opacity:0.1;filter:blur(1px);}
  .layout-grid .spotlight-watermark{position:absolute;right:0.65rem;bottom:1.1rem;max-width:92%;font-size:clamp(3rem,5vw,5.8rem);font-weight:1000;line-height:0.82;letter-spacing:-0.08em;color:var(--accent);opacity:0.055;text-transform:uppercase;text-align:right;white-space:normal;word-break:break-word;pointer-events:none;}
  .layout-grid .spotlight-mark{position:absolute;right:0.75rem;top:0.75rem;width:7rem;height:7rem;color:var(--accent);opacity:0.22;}
  .layout-grid .spotlight-mark .cat-icon-wrap{width:100%;height:100%;filter:none;}
  .layout-grid .spotlight-kicker{position:relative;z-index:1;font-size:0.72rem;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-faint);}
  .layout-grid .spotlight-title{position:relative;z-index:1;font-size:clamp(1.35rem,1.75vw,2.15rem);font-weight:950;line-height:0.95;color:var(--text);}
  .layout-grid .spotlight-sub{position:relative;z-index:1;font-size:0.86rem;font-weight:750;color:var(--text-muted);}

  .layout-list .list-products{display:grid;grid-template-columns:repeat(2,1fr);gap:0 2rem;}
  .layout-list .product-row{display:flex;align-items:baseline;gap:0.5rem;padding:0.5rem 0;border-bottom:1px solid var(--border);}
  .layout-list .row-name{font-size:1.6rem;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .layout-list .row-meta{font-size:1.1rem;color:var(--text-muted);white-space:nowrap;}
  .layout-list .leader{flex:1;border-bottom:1px dotted var(--text-faint);margin:0 0.4rem;min-width:1rem;align-self:flex-end;margin-bottom:0.3rem;}
  .layout-list .row-price{font-size:2rem;font-weight:900;color:var(--accent);white-space:nowrap;}

  .layout-poster .poster-products{display:flex;flex-direction:column;gap:1rem;}
  .layout-poster .product-row{display:flex;gap:1.5rem;align-items:center;padding:1rem;background:var(--bg-card);border-radius:0.6rem;border:1px solid var(--border);}
  .layout-poster .card-image{width:200px;height:200px;object-fit:cover;border-radius:0.4rem;flex-shrink:0;}
  .layout-poster .product-info{flex:1;display:flex;flex-direction:column;gap:0.5rem;}
  .layout-poster .card-name{font-size:2.2rem;font-weight:900;color:var(--text);}
  .layout-poster .card-meta{font-size:1.4rem;color:var(--text-muted);}
  .layout-poster .card-price{font-size:2.8rem;font-weight:900;color:var(--accent);}

  .layout-cinematic .cinematic-products{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;}
  .layout-cinematic .product-card{position:relative;border-radius:0.8rem;overflow:hidden;height:320px;background:var(--bg-card);border:1px solid var(--border);box-shadow:var(--card-shadow);}
  .layout-cinematic .card-image,.layout-cinematic .card-image-placeholder{width:100%;height:100%;object-fit:cover;border:0;}
  .layout-cinematic .card-body{position:absolute;left:0;right:0;bottom:0;padding:1.35rem;background:linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.58) 68%,transparent 100%);display:flex;flex-direction:column;gap:0.35rem;}
  .layout-cinematic .card-name{font-size:2rem;font-weight:900;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,0.7);}
  .layout-cinematic .card-meta{font-size:1.2rem;color:rgba(255,255,255,0.82);}
  .layout-cinematic .card-price{font-size:2.4rem;font-weight:900;color:var(--accent);}

  .layout-showcase .showcase-products{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;}
  .layout-showcase .product-card{display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center;}
  .layout-showcase .card-image{width:500px;height:400px;object-fit:cover;border-radius:1rem;}
  .layout-showcase .card-name{font-size:3rem;font-weight:900;color:var(--text);}
  .layout-showcase .card-meta{font-size:1.8rem;color:var(--text-muted);}
  .layout-showcase .card-price{font-size:4rem;font-weight:900;color:var(--accent);}

  .layout-editorial .editorial-products{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;}
  .layout-editorial .product-card{background:var(--bg-card);border:1px solid var(--border);border-radius:0.75rem;overflow:hidden;box-shadow:var(--card-shadow);}
  .layout-editorial .card-image{width:100%;height:160px;object-fit:cover;}
  .layout-editorial .card-body{padding:1rem;display:flex;flex-direction:column;gap:0.4rem;}
  .layout-editorial .card-name{font-size:1.3rem;font-weight:800;color:var(--text);}
  .layout-editorial .card-meta{font-size:0.95rem;color:var(--text-muted);}
  .layout-editorial .card-price{font-size:1.6rem;font-weight:900;color:var(--accent);}

  .out-of-stock{opacity:0.5;}
  .out-of-stock .card-image{filter:grayscale(0.6);}
  .sale-text{color:#ef4444;font-weight:800;}
  .oos-text{color:var(--text-faint);font-style:italic;}

  @keyframes content-refresh{0%{opacity:0.55;transform:translateY(6px);}100%{opacity:1;transform:translateY(0);}}
  @keyframes blink{0%,100%{opacity:0.5;}50%{opacity:1;}}
  .cursor-hidden,.cursor-hidden *{cursor:none !important;}
  .empty-state{display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-faint);font-size:1.5rem;text-align:center;}

  .conn-indicator{position:fixed;top:1rem;right:1rem;display:flex;align-items:center;gap:0.5rem;padding:0.45rem 0.9rem;border-radius:2rem;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);border:1px solid var(--border);font-size:0.75rem;font-weight:700;z-index:200;opacity:0;transition:opacity 0.5s;pointer-events:none;}
  .conn-indicator.visible{opacity:1;}
  .conn-dot{width:9px;height:9px;border-radius:50%;background:#ef4444;animation:blink 1.5s ease-in-out infinite;}
  .conn-dot.connected{background:var(--accent);}

  .tv-info{position:fixed;bottom:1rem;left:1rem;display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.9rem;border-radius:1.5rem;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);border:1px solid var(--border);font-size:0.7rem;font-weight:700;letter-spacing:0.04em;z-index:200;opacity:0;transition:opacity 1s ease;pointer-events:none;text-transform:uppercase;}
  .tv-info.visible{opacity:0.85;}

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
  .layout-sparse .hero-card .card-image-placeholder{width:100%;height:100%;border-radius:0.6rem;}
  .layout-sparse .hero-info{display:flex;flex-direction:column;justify-content:center;gap:0.75rem;min-width:0;}
  .layout-sparse .hero-name{font-size:clamp(2.4rem,3.5vw,3.8rem);font-weight:900;line-height:1.1;color:var(--text);overflow-wrap:break-word;}
  .layout-sparse .hero-meta{font-size:1.2rem;color:var(--text-muted);}
  .layout-sparse .hero-price{font-size:clamp(2.6rem,4.5vw,5rem);font-weight:900;color:var(--accent);margin-top:auto;}
  .layout-sparse .stack{display:flex;flex-direction:column;gap:0.75rem;flex:1;min-height:0;}
  .layout-sparse .stack-card{display:grid;grid-template-columns:110px 1fr auto;gap:1rem;align-items:center;background:var(--card-grad),var(--bg-card);border:1px solid var(--border);border-radius:0.6rem;overflow:hidden;padding:0.75rem;flex:1;min-height:0;}
  .layout-sparse .stack-card .card-image{width:110px;height:85px;object-fit:cover;border-radius:0.4rem;}
  .layout-sparse .stack-card .card-image-placeholder{width:110px;height:85px;border-radius:0.4rem;}
  .layout-sparse .stack-card .card-name{font-size:clamp(1.2rem,2vw,1.6rem);font-weight:800;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .layout-sparse .stack-card .card-meta{font-size:1rem;color:var(--text-muted);}
  .layout-sparse .stack-card .card-price{font-size:clamp(1.5rem,2.2vw,2.2rem);font-weight:900;color:var(--accent);}
  .layout-sparse .stack-info{min-width:0;}

  /* Single-product sparse category: vertical hero card fills remaining viewport */
  .menu-content.layout-sparse{display:flex;flex-direction:column;min-height:0;}
  .layout-sparse .category-block.single-product{flex:1;min-height:0;}
  .layout-sparse .single-product .sparse-products{flex:1;min-height:0;gap:0;}
  .layout-sparse.single-product .hero-card,.layout-sparse .single-product .hero-card{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;min-height:0;padding:2rem;gap:2rem;}
  .layout-sparse.single-product .hero-card .card-image,.layout-sparse.single-product .hero-card .card-image-placeholder,.layout-sparse .single-product .hero-card .card-image,.layout-sparse .single-product .hero-card .card-image-placeholder{width:100%;height:55%;max-height:55%;object-fit:cover;border-radius:0.8rem;}
  .layout-sparse.single-product .hero-info,.layout-sparse .single-product .hero-info{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;text-align:center;min-width:0;width:100%;}
  .layout-sparse.single-product .hero-name,.layout-sparse .single-product .hero-name{font-size:clamp(3rem,5vw,5.5rem);}
  .layout-sparse.single-product .hero-meta,.layout-sparse .single-product .hero-meta{font-size:clamp(1.2rem,2vw,1.8rem);}
  .layout-sparse.single-product .hero-price,.layout-sparse .single-product .hero-price{font-size:clamp(3rem,6vw,6.5rem);margin-top:1rem;}

  /* Full strain labels with color-coded badges */
  .strain-badge-tv{display:inline-flex;align-items:center;gap:0.35rem;padding:0.2rem 0.55rem;border-radius:0.3rem;font-size:0.85rem;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;vertical-align:middle;}
  .strain-dot-tv{width:7px;height:7px;border-radius:50%;}
  .card-meta .strain-badge-tv,.row-meta .strain-badge-tv,.hero-meta .strain-badge-tv{margin-right:0.4rem;}
  .hero-meta .strain-badge-tv{font-size:1rem;padding:0.35rem 0.75rem;}
  .hero-meta .strain-dot-tv{width:9px;height:9px;}

  /* Branded placeholder for product cards without an image */
  .card-image-placeholder{
    display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;
    background:var(--bg-elev);
    border:1px solid var(--border);
  }
  .card-image-placeholder .placeholder-icon{
    width:clamp(28px,36%,80px);height:auto;
    color:var(--text-muted);
    opacity:0.48;
  }
  .card-image-placeholder .placeholder-icon .placeholder-label{display:none;}
  .card-image[data-cat]{background:var(--bg-elev);}
  .card-image-loading{opacity:0;transition:opacity 0.2s;}
  .card-image-loaded{opacity:1;}

  @media (max-width:768px){
    .card-image-placeholder .placeholder-icon{width:clamp(28px,35%,80px);}
  }

  .layout-grid .card-image-placeholder .placeholder-icon{width:clamp(28px,35%,80px);}

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
    .menu-header{padding:0.75rem 1rem;position:sticky;top:0;}
    .header-logo{max-height:36px;max-width:120px;}
    .dispensary-name{font-size:1.4rem;}
    .menu-content{padding:1rem;overflow-y:auto;max-height:none;}
    .menu-footer{padding:0.5rem 1rem;font-size:0.7rem;}
    .promo-bar{font-size:0.85rem;padding:0.4rem 1rem;}
    .category-header{margin-bottom:0.6rem;padding-bottom:0.3rem;}
    .category-title{font-size:1.2rem;gap:0.4rem;}
    .cat-icon-wrap{width:1.1em;height:1.1em;}
    .cat-icon{width:100%;height:100%;}

    .layout-grid{grid-template-columns:1fr;gap:0.9rem;}
    .layout-grid .category-block{padding:0.75rem;border-radius:0.75rem;}
    .layout-grid .grid-products{display:flex;flex-direction:column;gap:0.55rem;}
    .layout-grid .product-table-head{font-size:0.62rem;padding-left:0.45rem;}
    .layout-grid .product-card{grid-template-columns:0.28rem minmax(0,1fr);gap:0.5rem;min-height:auto;padding:0.55rem 0.6rem 0.55rem 0;}
    .layout-grid .card-body{display:flex;flex-direction:column;gap:0.22rem;min-width:0;}
    .layout-grid .card-name{font-size:1rem;white-space:normal;}
    .layout-grid .card-meta{font-size:0.72rem;justify-content:flex-start;min-width:0;max-width:none;}
    .layout-grid .card-desc{font-size:0.78rem;-webkit-line-clamp:2;}
    .layout-grid .card-price{grid-column:2;font-size:1.25rem;text-align:left;min-width:0;}
    .layout-grid .category-spotlight{min-height:4.5rem;padding:0.75rem;}

    .layout-list .list-products{grid-template-columns:1fr;gap:0;}
    .layout-list .row-name{font-size:1rem;}
    .layout-list .row-meta{font-size:0.8rem;}
    .layout-list .row-price{font-size:1.15rem;}

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

    .layout-editorial .editorial-products{grid-template-columns:1fr;}
    .layout-editorial .card-image{height:130px;}
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
    .layout-sparse.single-product .hero-card .card-image,.layout-sparse.single-product .hero-card .card-image-placeholder,.layout-sparse .single-product .hero-card .card-image,.layout-sparse .single-product .hero-card .card-image-placeholder{height:45%;max-height:45%;}
    .layout-sparse.single-product .hero-name,.layout-sparse .single-product .hero-name{font-size:2rem;}
    .layout-sparse.single-product .hero-meta,.layout-sparse .single-product .hero-meta{font-size:1rem;}
    .layout-sparse.single-product .hero-price,.layout-sparse .single-product .hero-price{font-size:2.4rem;margin-top:0.5rem;}

    .price-tiers .tier-label{font-size:0.7rem;}
    .price-tiers .tier-price{font-size:0.95rem;}

    .conn-indicator{top:0.5rem;right:0.5rem;font-size:0.65rem;padding:0.35rem 0.7rem;}
    .tv-info{bottom:0.5rem;left:0.5rem;font-size:0.6rem;padding:0.35rem 0.7rem;}

    .age-gate h2{font-size:2rem;}
    .age-gate p{font-size:1rem;}
    .age-gate .btn{font-size:1rem;padding:0.75rem 1.5rem;}
  }
</style>
</head>
<body class="template-${initialTemplate}">

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
  var ALLOWED_LAYOUTS = ['grid','list','poster','cinematic','showcase','editorial','sparse'];
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
  var PLACEHOLDER_ICON_SVGS = ${JSON.stringify(PLACEHOLDER_ICON_SVGS)};
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
    if(/^\\/api\\/uploads\\//.test(u) || /^https:\\/\\//.test(u) || /^data:image\\//.test(u)) return u;
    return '';
  }
  function safeCssValue(v){
    if(!v || typeof v !== 'string') return '';
    if(/[;{}<>]/.test(v)) return '';
    return v;
  }
  function imgMarkup(p, lazy){
    var safeUrl = safeImgUrl(p.image);
    var alt = escapeHtml(p.name || '');
    var catType = getCategoryType(p.categoryName || p.name || '');
    var v = getProductVariant(p.id || '', p.name || '');
    if(!safeUrl || (config && config.showImages === false)){
      return placeholderMarkup(catType, v);
    }
    return '<img class="card-image card-image-loading" src="' + escapeHtml(safeUrl) + '" alt="' + alt + '"' + (lazy ? ' loading="lazy"' : '') + ' decoding="async" data-cat="' + catType + '" data-variant="' + v + '" onload="this.classList.remove(\\'card-image-loading\\');this.classList.add(\\'card-image-loaded\\');" onerror="window.dubmenuImgFallback(this)">';
  }
  function basePlaceholderSvg(type){
    return PLACEHOLDER_ICON_SVGS[type] || PLACEHOLDER_ICON_SVGS.generic;
  }
  function placeholderMarkup(type, v){
    return '<div class="card-image card-image-placeholder placeholder-' + type + ' placeholder-v' + (v || '0') + '">' + basePlaceholderSvg(type) + '</div>';
  }

  window.dubmenuImgFallback = function(img){
    var type = img.getAttribute('data-cat') || 'generic';
    var v = img.getAttribute('data-variant') || '0';
    var wrap = document.createElement('div');
    wrap.className = 'card-image card-image-placeholder placeholder-' + type + ' placeholder-v' + v;
    wrap.innerHTML = basePlaceholderSvg(type);
    if(img.parentNode) img.parentNode.replaceChild(wrap, img);
  };

  ${GET_CATEGORY_TYPE_JS}
  ${GET_PRODUCT_VARIANT_JS}
  function categoryIconSvg(type){
    return CATEGORY_ICON_SVGS[type] || CATEGORY_ICON_SVGS.generic;
  }
  function categoryIcon(type){
    return '<span class="cat-icon-wrap" aria-hidden="true"><span class="cat-icon cat-icon-' + type + '">' + categoryIconSvg(type) + '</span></span>';
  }

  var cycleState = {currentPage:0, totalPages:1, interval:null, isTransitioning:false};

  var templateLayouts = {
    'default':'grid', 'light':'grid', 'neon':'grid', 'minimal':'list',
    'sunset':'poster', 'forest':'cinematic', 'royal':'showcase',
    'gold':'grid', 'ocean':'grid', 'crimson':'grid', 'bone':'editorial', 'vapor':'grid'
  };

  // Resolve the active layout for THIS TV:
  //   1. ?layout= URL override (validated)
  //   2. Explicit config.layout override (e.g. manual layout control)
  //   3. Legacy config.layoutMode mapping (auto/columns/grid -> grid; pricelist/compact -> list)
  //   4. For 1-of-4+ multi-display setups, prefer sparse hero-fill layout
  //   5. template-derived layout from config.template
  //   6. 'grid' fallback
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
    if(cfg && cfg.template && templateLayouts[cfg.template]) return templateLayouts[cfg.template];
    return 'grid';
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
    if(DISPLAY_TOTAL>1){
      var perTv=Math.ceil(cats.length/DISPLAY_TOTAL);
      var start=(DISPLAY_NUM-1)*perTv;
      cats=cats.slice(start,start+perTv);
    }
    return cats;
  }

  function isDemoOrDefaultDisplay(cfg){
    return cfg && (cfg.tvDemo || (cfg.template === 'default' && cfg.layout === 'auto' && cfg.layoutMode === 'auto'));
  }

  function getProductsPerPage(layout, bannerActive){
    // Default page sizes tuned for a 1080px viewport. Increase for demo/default
    // displays so the board looks populated and premium. Reduce when a promo
    // banner is active so the bottom row/category is not clipped by the
    // banner's reserved space.
    var isDemoDefault = isDemoOrDefaultDisplay(config);
    var base;
    switch(layout){
      case 'grid': base = isDemoDefault ? 12 : 6; break;
      case 'list': base = isDemoDefault ? 18 : 12; break;
      case 'poster': base = isDemoDefault ? 4 : 2; break;
      case 'cinematic': base = isDemoDefault ? 4 : 2; break;
      case 'showcase': base = 1; break;
      case 'editorial': base = isDemoDefault ? 6 : 4; break;
      case 'sparse': base = isDemoDefault ? 4 : 3; break;
      default: base = 10;
    }
    return bannerActive ? Math.max(1, base - (layout === 'showcase' ? 0 : 2)) : base;
  }

  function getMaxCategoriesPerPage(layout, bannerActive){
    // Limit categories per page so headers + products fit in the viewport.
    var isDemoDefault = isDemoOrDefaultDisplay(config);
    var base;
    switch(layout){
      case 'grid': base = isDemoDefault ? 3 : 2; break;
      case 'list': base = isDemoDefault ? 4 : 3; break;
      case 'poster': base = isDemoDefault ? 2 : 2; break;
      case 'cinematic': base = isDemoDefault ? 2 : 2; break;
      case 'showcase': base = 1; break;
      case 'editorial': base = isDemoDefault ? 3 : 3; break;
      case 'sparse': base = 1; break;
      default: base = 3;
    }
    return bannerActive ? Math.max(1, base - 1) : base;
  }

  function paginateCategories(cats, pageNum, perPage, maxCategories){
    var catsWithProducts = cats.filter(function(c){return c.products.length>0;});
    if(catsWithProducts.length===0) return [];
    // Show only a sliding window of categories per page.
    var pageCats = catsWithProducts.slice(pageNum * maxCategories, (pageNum + 1) * maxCategories);
    if(pageCats.length===0) return [];
    var perCategory = Math.max(1, Math.floor(perPage / pageCats.length));
    return pageCats.map(function(cat){
      var total = cat.products.length;
      var count = Math.min(perCategory, total);
      var start = (pageNum * count) % total;
      var products = [];
      for(var i=0;i<count;i++){
        var idx = (start+i) % total;
        products.push(cat.products[idx]);
      }
      return Object.assign({}, cat, {products: products});
    }).filter(function(c){return c.products.length>0;});
  }

  function startCycling(){
    stopCycling();
    if(cycleState.totalPages<=1) return;
    cycleState.interval = setInterval(function(){
      if(cycleState.isTransitioning) return;
      cycleState.isTransitioning = true;
      var content = document.getElementById('menu-content');
      content.style.opacity = '0';
      content.style.transition = 'opacity 0.5s ease';
      setTimeout(function(){
        cycleState.currentPage = (cycleState.currentPage + 1) % cycleState.totalPages;
        renderCurrentPage();
        content.style.opacity = '1';
        setTimeout(function(){cycleState.isTransitioning=false;},500);
      },500);
    },10000);
  }

  function stopCycling(){
    if(cycleState.interval){clearInterval(cycleState.interval);cycleState.interval=null;}
  }

  function renderCurrentPage(){
    if(!config) return;
    var layout = getActiveLayout(config);
    var cats = getCategoriesForDisplay(config.categories||[]);
    var urlCat = new URLSearchParams(location.search).get('category');
    if(urlCat) cats = cats.filter(function(c){return c.id===urlCat;});
    if(config.showCategory) cats = cats.filter(function(c){return c.id===config.showCategory;});
    if(!cats.length) return;
    
    var bannerActive = !!getActiveBanner();
    var perPage = getProductsPerPage(layout, bannerActive);
    var maxCategories = getMaxCategoriesPerPage(layout, bannerActive);
    var pageCats = paginateCategories(cats, cycleState.currentPage, perPage, maxCategories);
    if(!pageCats.length) return;
    
    var content = document.getElementById('menu-content');
    content.innerHTML = '';
    content.className = 'menu-content layout-' + layout;
    
    if(layout==='grid') renderGrid(pageCats, content);
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
    if(banner){
      pb.textContent=banner.text;
      pb.style.background = safeCssValue(banner.bgColor);
      pb.style.color = safeCssValue(banner.textColor);
      pb.classList.add('active');
    }else{
      pb.classList.remove('active');
    }
  }
  setInterval(function(){if(config&&paired)updatePromoBannerDisplay();},60000);

  function renderMenu(){
    if(!config) return;
    document.body.className = 'template-' + getActiveTemplate(config);
    
    var headerName = document.getElementById('dispensary-name');
    if(config.dispensaryName) headerName.textContent = config.dispensaryName;
    else headerName.textContent = 'DubMenu TV';
    
    var hl = document.getElementById('header-logo');
    var logoUrl = safeImgUrl(config.logo);
    if(logoUrl) { hl.src = logoUrl; hl.classList.add('show'); }
    else { hl.classList.remove('show'); }
    
    updatePromoBannerDisplay();

    var disc = getDisclaimer(config);
    var footerEl = document.getElementById('footer-disclaimer');
    if(footerEl){
      footerEl.textContent = disc;
      footerEl.style.display = disc ? '' : 'none';
    }
    
    var cats = getCategoriesForDisplay(config.categories||[]);
    var urlCat = new URLSearchParams(location.search).get('category');
    if(urlCat) cats = cats.filter(function(c){return c.id===urlCat;});
    if(config.showCategory) cats = cats.filter(function(c){return c.id===config.showCategory;});
    
    if(!cats.length){
      document.getElementById('menu-content').innerHTML = '<div class="empty-state">No products to display on this screen</div>';
      return;
    }
    
    // Hide connection indicator when menu is showing
    document.getElementById('conn-indicator').classList.remove('visible');
    
    var layout = getActiveLayout(config);
    var bannerActive = !!getActiveBanner();
    var maxCategories = getMaxCategoriesPerPage(layout, bannerActive);
    cycleState.totalPages = Math.max(1, Math.ceil(cats.length / maxCategories));
    cycleState.currentPage = 0;
    
    renderCurrentPage();
    
    if(config.autoScroll) startCycling();
    else stopCycling();

    showTvInfo(layout);
  }

  function strainBadge(p){
    if(!p || !p.strain) return '';
    var raw = String(p.strain).toLowerCase().trim();
    var map = {h:'hybrid',s:'sativa',i:'indica',hybrid:'hybrid',sativa:'sativa',indica:'indica'};
    var strain = map[raw];
    if(!strain) return '';
    var colors = {indica: '#8b5cf6', sativa: '#f97316', hybrid: '#22c55e'};
    var color = colors[strain];
    var label = strain.charAt(0).toUpperCase() + strain.slice(1);
    return '<span class="strain-badge-tv" style="background:' + color + '22;color:' + color + '"><span class="strain-dot-tv" style="background:' + color + '"></span>' + escapeHtml(label) + '</span>';
  }

  function makeSub(p){
    var parts = [];
    if(p.strain) parts.push(strainBadge(p));
    if(p.sku) parts.push('SKU ' + escapeHtml(p.sku));
    if(p.weight) parts.push(escapeHtml(p.weight));
    if(p.thc || p.cbd){
      var cannabinoids = [];
      if(p.thc) cannabinoids.push('THC ' + escapeHtml(p.thc));
      if(p.cbd) cannabinoids.push('CBD ' + escapeHtml(p.cbd));
      if(cannabinoids.length) parts.push(cannabinoids.join(' / '));
    }
    if(p.brand) parts.push(escapeHtml(p.brand));
    return parts.join(' \u00B7 ');
  }

  function makePrice(p){
    if(p && Array.isArray(p.priceTiers) && p.priceTiers.length > 0){
      var tiers = p.priceTiers.map(function(t){
        var label = escapeHtml((t && t.label) || '');
        var price = escapeHtml((t && t.price) || '');
        if(!label || !price) return '';
        return '<span class="tier"><span class="tier-label">' + label + '</span><span class="tier-price">' + price + '</span></span>';
      }).join('');
      if(tiers){
        return '<div class="price-tiers">' + tiers + '</div>';
      }
    }
    var orig = p.priceOriginal || p.originalPrice;
    if(orig && orig !== p.price){
      return '<span class="card-price-orig">$' + escapeHtml(orig) + '</span> <span class="sale-text">$' + escapeHtml(p.price) + '</span>';
    }
    return '$' + (typeof p.price === 'number' ? p.price.toFixed(2).replace(/\\.00$/, '') : escapeHtml(p.price));
  }

  function makeDesc(p){
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
    if(p.strain) parts.push(strainBadge(p));
    if(p.weight) parts.push('<span>' + escapeHtml(p.weight) + '</span>');
    if(p.thc) parts.push('<span>THC ' + escapeHtml(p.thc) + '</span>');
    if(p.cbd) parts.push('<span>CBD ' + escapeHtml(p.cbd) + '</span>');
    if(p.brand) parts.push('<span>' + escapeHtml(p.brand) + '</span>');
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
        var card = document.createElement('div');
        card.className = 'product-card' + gridStrainClass(p) + (p.inStock === false ? ' out-of-stock' : '');
        card.innerHTML = '<span class="strain-bar"></span><div class="card-body"><div class="card-name">' + escapeHtml(p.name) + '</div><div class="card-meta">' + makeGridMeta(p) + '</div>' + makeDesc(p) + '</div><div class="card-price">' + makePrice(p) + '</div>';
        grid.appendChild(card);
      });
      if(cat.products.length < 6) grid.insertAdjacentHTML('beforeend', '<div class="category-spotlight"><div class="spotlight-watermark">' + escapeHtml(cat.name) + '</div><div class="spotlight-mark">' + categoryIcon(getCategoryType(cat.name)) + '</div><div class="spotlight-kicker">Live menu</div><div class="spotlight-title">' + escapeHtml(cat.name) + '</div><div class="spotlight-sub">Fresh availability · aligned pricing · premium display</div></div>');
      catEl.appendChild(grid);
      container.appendChild(catEl);
    });
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
      poster.className = 'poster-products';
      cat.products.forEach(function(p){ p.categoryName = cat.name;
        var row = document.createElement('div');
        row.className = 'product-row' + (p.inStock === false ? ' out-of-stock' : '');
        var img = imgMarkup(p, false);
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
        card.className = 'product-card' + (p.inStock === false ? ' out-of-stock' : '');
        var img = imgMarkup(p, true);
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
        card.className = 'product-card' + (p.inStock === false ? ' out-of-stock' : '');
        var img = imgMarkup(p, true);
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
      heroCard.className = 'hero-card' + (hero.inStock === false ? ' out-of-stock' : '');
      heroCard.innerHTML = imgMarkup(hero, false) + '<div class="hero-info"><div class="hero-name">' + escapeHtml(hero.name) + '</div><div class="hero-meta">' + makeSub(hero) + '</div><div class="hero-price">' + makePrice(hero) + '</div></div>';
      wrap.appendChild(heroCard);
      if(rest.length){
        var stack = document.createElement('div');
        stack.className = 'stack';
        rest.forEach(function(p){
          var row = document.createElement('div');
          row.className = 'stack-card' + (p.inStock === false ? ' out-of-stock' : '');
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
    var overshootX = (SCALE_BASELINE_W * scale - vw);
    var overshootY = (SCALE_BASELINE_H * scale - vh);
    menu.style.marginLeft = (overshootX > 0 ? -overshootX / 2 : 0) + 'px';
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
          if(hasProducts(incoming) || !hasProducts(config)){
            config=incoming;
          }
          if(paired || hasProducts(config)){setPhase('menu');renderMenu();}
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
    fetch('/api/analytics/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'analytics.tv.load',payload:{session:'${safeSessionId}'}})});
  }catch(e){}
})();
</script>
</body>
</html>`;
}