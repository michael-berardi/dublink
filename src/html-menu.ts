import { CATEGORY_ICON_SVGS, PLACEHOLDER_ICON_SVGS, CATEGORY_LABELS, GET_CATEGORY_TYPE_JS } from './category-icons';
import type { Category, MenuConfig } from './types';

export function menuPage(sessionId: string, config: Partial<MenuConfig>, _origin: string): string {
  const escapeHtml = (str: unknown) => String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const dispensaryName = escapeHtml(config?.dispensaryName || 'Menu');
  const currency = config?.currency || '$';
  const disclaimer = escapeHtml(config?.disclaimer || 'Must be 21+ with valid ID. Product availability and pricing are subject to change.');
  const logoUrl = config?.logo || '';
  const categories: Category[] = Array.isArray(config?.categories) ? config.categories : [];

  // Pre-compute categories that have at least one product
  const visibleCats = categories.filter((c) => c && Array.isArray(c.products) && c.products.length > 0);

  // Build inline JSON for client-side rendering
  const menuData = JSON.stringify({
    dispensaryName: config?.dispensaryName || 'Menu',
    currency,
    categories: visibleCats.map((cat) => ({
      id: cat.id || '',
      name: cat.name || 'Category',
      products: (cat.products || []).map((p) => ({
        id: p.id || '',
        categoryId: cat.id || '',
        categoryName: cat.name || 'Category',
        name: p.name || '',
        price: p.price,
        originalPrice: p.originalPrice,
        thc: p.thc || '',
        cbd: p.cbd || '',
        description: p.description || '',
        image: p.image || '',
        weight: p.weight || '',
        brand: p.brand || '',
        sku: p.sku || '',
        strain: p.strain || '',
        inStock: p.inStock !== false,
        isPromo: p.isPromo || false,
        priceTiers: Array.isArray(p.priceTiers) ? p.priceTiers : [],
      })),
    })),
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#0a0a0a">
<title>${dispensaryName} - Menu</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#0a0a0a;--bg-elev:#141416;--bg-card:#1a1a1e;
    --accent:#10b981;--accent-dim:rgba(16,185,129,0.12);--accent-glow:rgba(16,185,129,0.3);
    --text:#f5f5f5;--text-muted:#999;--text-faint:#555;
    --border:rgba(255,255,255,0.08);--border-hover:rgba(16,185,129,0.4);
    --shadow:0 2px 12px rgba(0,0,0,0.4);
    --radius:0.75rem;
    --safe-top:env(safe-area-inset-top,0px);
    --safe-bottom:env(safe-area-inset-bottom,0px);
  }
  body.light{
    --bg:#f5f5f0;--bg-elev:#fff;--bg-card:#fff;
    --accent:#047857;--accent-dim:rgba(4,120,87,0.08);--accent-glow:rgba(4,120,87,0.15);
    --text:#111;--text-muted:#666;--text-faint:#aaa;
    --border:rgba(0,0,0,0.08);--border-hover:rgba(4,120,87,0.4);
    --shadow:0 1px 8px rgba(0,0,0,0.06);
  }
  html{-webkit-text-size-adjust:100%;}
  body{
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;
    background:var(--bg);color:var(--text);
    min-height:100vh;min-height:100dvh;
    -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
    line-height:1.5;
    overflow-x:hidden;
  }
  ::-webkit-scrollbar{width:0;height:0;}
  body{scrollbar-width:none;-ms-overflow-style:none;}

  /* ===== Sticky top wrapper ===== */
  .sticky-top{
    position:sticky;top:0;z-index:50;
    background:var(--bg);
    width:100%;max-width:100vw;
  }

  /* ===== Header ===== */
  .header{
    position:relative;
    background:var(--bg-elev);
    border-bottom:1px solid var(--border);
    padding:calc(0.75rem + var(--safe-top)) 1rem 0.75rem;
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  }
  .header-top{display:flex;align-items:center;gap:0.75rem;}
  .header-logo{max-height:42px;max-width:140px;object-fit:contain;border-radius:0.3rem;display:none;}
  .header-logo.show{display:block;}
  .header-name{font-size:clamp(1.1rem,4.2vw,1.5rem);font-weight:900;letter-spacing:-0.02em;line-height:1.2;color:var(--accent);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  @media(max-width:374px){
    .header-name{font-size:1.1rem;line-height:1.15;white-space:normal;overflow-wrap:break-word;text-overflow:clip;}
    .header{padding-left:0.75rem;padding-right:0.75rem;}
  }
  .theme-toggle{
    flex-shrink:0;width:38px;height:38px;border-radius:50%;
    border:1px solid var(--border);background:var(--bg-card);color:var(--text);
    display:flex;align-items:center;justify-content:center;cursor:pointer;
    font-size:1.1rem;transition:border-color 0.2s,background 0.2s;
  }
  .theme-toggle:active{transform:scale(0.92);}

  /* ===== Search ===== */
  .search-wrap{position:relative;margin-top:0.65rem;}
  .search-input{
    width:100%;padding:0.65rem 0.65rem 0.65rem 2.5rem;
    border-radius:var(--radius);border:1px solid var(--border);
    background:var(--bg-card);color:var(--text);
    font-size:1rem;font-family:inherit;outline:none;
    transition:border-color 0.2s;
  }
  .search-input:focus{border-color:var(--accent);}
  .search-input::placeholder{color:var(--text-faint);}
  .search-icon{position:absolute;left:0.85rem;top:50%;transform:translateY(-50%);color:var(--text-faint);font-size:1.1rem;pointer-events:none;}

  /* ===== Toolbar ===== */
  .toolbar{
    display:flex;align-items:center;gap:0.5rem;margin-top:0.65rem;
    flex-wrap:wrap;
  }
  .stock-toggle{
    display:inline-flex;align-items:center;gap:0.4rem;
    padding:0.35rem 0.75rem;border-radius:2rem;
    background:var(--bg-card);border:1px solid var(--border);
    font-size:0.8rem;font-weight:600;color:var(--text-muted);
    cursor:pointer;transition:all 0.2s;user-select:none;
  }
  .stock-toggle.active{background:var(--accent-dim);border-color:var(--accent);color:var(--accent);}
  .stock-toggle-dot{width:8px;height:8px;border-radius:50%;background:var(--text-faint);transition:background 0.2s;}
  .stock-toggle.active .stock-toggle-dot{background:var(--accent);}
  .result-count{margin-left:auto;font-size:0.75rem;color:var(--text-faint);font-weight:600;}

  /* ===== Category pills ===== */
  .cat-nav{
    position:relative;
    display:flex;gap:0.35rem;padding:0.55rem 0.85rem;
    overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;
    background:var(--bg);
    border-bottom:1px solid var(--border);
    width:100%;max-width:100vw;
    -webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;
  }
  .cat-nav::-webkit-scrollbar{display:none;}

  .cat-pill{
    flex-shrink:0;display:inline-flex;align-items:center;gap:0.35rem;
    padding:0.35rem 0.75rem;
    border-radius:2rem;border:1px solid var(--border);
    background:var(--bg-card);color:var(--text-muted);
    font-size:0.8rem;font-weight:600;cursor:pointer;
    transition:all 0.2s;white-space:nowrap;user-select:none;
  }
  .cat-pill:active{transform:scale(0.95);}
  .cat-pill.active{background:var(--accent);border-color:var(--accent);color:#fff;}

  /* ===== Products ===== */
  .menu-body{padding:0.75rem 1rem calc(2rem + var(--safe-bottom));}
  .category-section{margin-bottom:2rem;scroll-margin-top:160px;}
  .category-title{
    font-size:1.1rem;font-weight:700;letter-spacing:0.02em;
    color:var(--text);margin-bottom:0.65rem;padding-bottom:0.35rem;
    border-bottom:1px solid var(--border);
    overflow-wrap:break-word;
    display:flex;align-items:center;gap:0.45rem;
  }
  .cat-icon{width:1.1em;height:1.1em;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;color:var(--text-muted);}
  .cat-icon svg{width:100%;height:100%;fill:currentColor;}
  .cat-pill.active .cat-icon{color:#fff;}

  /* ===== Mobile-first: single column products ===== */
  .products-grid{
    display:grid;
    grid-template-columns:1fr;
    gap:0.75rem;
    max-width:100%;
  }

  .product-card{
    background:var(--bg-card);border:1px solid var(--border);
    border-radius:var(--radius);overflow:hidden;
    display:flex;flex-direction:column;
    transition:border-color 0.2s,transform 0.15s;
    position:relative;min-width:0;
  }
  .product-card:active{transform:scale(0.98);}
  .product-card.out-of-stock{opacity:0.5;}
  .product-card.out-of-stock .product-image{filter:grayscale(1);}

  .product-image-wrap{
    width:100%;aspect-ratio:1/1;overflow:hidden;
    background:var(--bg-elev);position:relative;
  }
  .product-image{width:100%;height:100%;object-fit:cover;display:block;}
  .product-image-placeholder{
    width:100%;height:100%;display:flex;align-items:center;justify-content:center;
    position:relative;overflow:hidden;
    background:var(--bg-elev);
  }
  .placeholder-art{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.5rem;width:100%;height:100%;padding:0.5rem;}
  .placeholder-icon{position:relative;z-index:2;width:clamp(40px,40%,90px);height:auto;max-width:90px;color:var(--text-muted);opacity:0.48;}
  .placeholder-label{position:relative;z-index:4;font-size:clamp(0.65rem,2.5vw,0.85rem);font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-muted);opacity:0.9;text-align:center;}
  @media(min-width:600px){
    .placeholder-icon{width:clamp(48px,40%,110px);max-width:110px;}
    .placeholder-label{font-size:clamp(0.75rem,2vw,0.9rem);}
  }
  .product-image-loading{opacity:0;transition:opacity 0.2s;}
  .product-image-loaded{opacity:1;}
  .product-badges{position:absolute;top:0.4rem;left:0.4rem;display:flex;gap:0.3rem;flex-wrap:wrap;}
  .badge-sale{
    background:#ef4444;color:#fff;font-size:0.6rem;font-weight:800;
    text-transform:uppercase;padding:0.15rem 0.45rem;border-radius:1rem;letter-spacing:0.04em;
  }
  .badge-oos{
    background:rgba(0,0,0,0.7);color:#fff;font-size:0.6rem;font-weight:800;
    text-transform:uppercase;padding:0.15rem 0.45rem;border-radius:1rem;letter-spacing:0.04em;
  }

  .product-body{padding:0.6rem;display:flex;flex-direction:column;gap:0.3rem;flex:1;}
  .product-name-row{display:flex;align-items:center;gap:0.35rem;flex-wrap:wrap;min-width:0;}
  .strain-line{display:inline-flex;align-items:center;gap:0.25rem;flex-shrink:0;}
  .strain-dot{display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0;}
  .strain-dot-indica{background:#8b5cf6;}
  .strain-dot-sativa{background:#f97316;}
  .strain-dot-hybrid{background:#22c55e;}
  .strain-badge{
    display:inline-flex;align-items:center;justify-content:center;
    min-width:1.3em;height:1.3em;padding:0 0.2em;
    border-radius:0.3em;font-size:0.65rem;font-weight:800;
    text-transform:uppercase;line-height:1;letter-spacing:0.02em;
  }
  .strain-badge-indica{background:rgba(139,92,246,0.16);color:#c4b5fd;}
  .strain-badge-sativa{background:rgba(249,115,22,0.16);color:#fdba74;}
  .strain-badge-hybrid{background:rgba(34,197,94,0.16);color:#86efac;}
  body.light .strain-badge-indica{color:#7c3aed;}
  body.light .strain-badge-sativa{color:#c2410c;}
  body.light .strain-badge-hybrid{color:#16a34a;}
  .product-name{font-size:1.02rem;font-weight:800;line-height:1.22;color:var(--text);overflow-wrap:break-word;word-break:break-word;overflow-wrap:anywhere;flex:1;min-width:0;}

  .product-meta{font-size:0.72rem;color:var(--text-muted);line-height:1.3;overflow-wrap:break-word;word-break:break-word;}
  .product-maker{font-size:0.76rem;color:var(--text);font-weight:800;line-height:1.3;}
  .product-maker::before{content:'By ';color:var(--text-muted);font-weight:600;}
  .product-sku{font-size:0.62rem;color:var(--text-faint);font-weight:700;letter-spacing:0.04em;text-transform:uppercase;line-height:1.3;}
  .canna-pills{display:flex;flex-wrap:wrap;gap:0.25rem;}
  .canna-pill{
    display:inline-flex;align-items:center;gap:0.15rem;
    padding:0.12rem 0.45rem;border-radius:1rem;
    font-size:0.65rem;font-weight:700;letter-spacing:0.02em;line-height:1.3;
  }
  .canna-thc{background:rgba(139,92,246,0.15);color:#c4b5fd;border:1px solid rgba(139,92,246,0.2);}
  .canna-cbd{background:rgba(34,197,94,0.1);color:#86efac;border:1px solid rgba(34,197,94,0.2);}
  body.light .canna-thc{color:#7c3aed;}
  body.light .canna-cbd{color:#16a34a;}

  .price-area{margin-top:auto;}
  .price-tiers{display:flex;flex-wrap:wrap;gap:0.25rem;}
  .price-tiers .tier{
    display:inline-flex;flex-direction:column;align-items:center;gap:0;
    padding:0.2rem 0.5rem;border-radius:0.4rem;
    background:var(--accent-dim);border:1px solid var(--border);
    min-width:48px;
  }
  .price-tiers .tier-label{font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);line-height:1.2;}
  .price-tiers .tier-price{font-size:0.8rem;font-weight:900;color:var(--accent);line-height:1.2;}
  .price-flat{font-size:1.1rem;font-weight:900;color:var(--accent);}
  .price-orig{font-size:0.7rem;color:var(--text-faint);text-decoration:line-through;margin-right:0.25rem;}

  .product-desc{font-size:0.76rem;color:var(--text-muted);line-height:1.4;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}

  /* ===== Empty state ===== */
  .empty-state{
    text-align:center;padding:3rem 1rem;color:var(--text-faint);
  }
  .empty-state h3{font-size:1.1rem;font-weight:700;margin-bottom:0.3rem;color:var(--text-muted);}

  /* ===== Footer ===== */
  .footer{
    text-align:center;padding:1.5rem 1rem calc(1.5rem + var(--safe-bottom));
    font-size:0.7rem;color:var(--text-faint);line-height:1.5;
    border-top:1px solid var(--border);
  }
  .footer a{color:var(--accent);text-decoration:none;}

  /* ===== No results (search) ===== */
  .no-results{display:none;text-align:center;padding:2rem 1rem;color:var(--text-muted);}
  .no-results.show{display:block;}

  /* ===== Tablet ===== */
  @media(min-width:600px){
    .header-name{font-size:1.75rem;}
    .products-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;}
    .cat-pill{padding:0.4rem 0.9rem;font-size:0.85rem;}
    .product-name{font-size:1rem;}
    .product-body{padding:0.85rem;gap:0.4rem;}
    .product-image-placeholder span{font-size:3rem;}
    .category-title{font-size:1.25rem;}
    .cat-icon{width:1.2em;height:1.2em;}
    .canna-pill{font-size:0.75rem;padding:0.2rem 0.55rem;}
    .price-tiers .tier-label{font-size:0.65rem;}
    .price-tiers .tier-price{font-size:0.95rem;}
  }
  @media(min-width:768px){
    .products-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;}
    .menu-body{padding:1rem 1.5rem calc(2rem + var(--safe-bottom));}
    .header{padding-left:1.5rem;padding-right:1.5rem;}
    .cat-nav{padding-left:1.5rem;padding-right:1.5rem;}
    .product-desc{-webkit-line-clamp:3;}
  }
  @media(min-width:1024px){
    .products-grid{grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1.25rem;}
  }

  /* ===== Animations ===== */
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  .category-section{animation:fadeIn 0.3s ease-out;}
</style>
</head>
<body>

<div class="sticky-top">
<div class="header">
  <div class="header-top">
    <img id="header-logo" class="header-logo" alt="">
    <div class="header-name">${dispensaryName}</div>
    <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark/light mode">
      <span id="theme-icon">&#9790;</span>
    </button>
  </div>
  <div class="search-wrap">
    <span class="search-icon">&#128269;</span>
    <input type="search" class="search-input" id="search-input" placeholder="Search products..." autocomplete="off" enterkeyhint="search">
  </div>
  <div class="toolbar">
    <div class="stock-toggle active" id="stock-toggle">
      <span class="stock-toggle-dot"></span>
      <span>In stock only</span>
    </div>
    <span class="result-count" id="result-count"></span>
  </div>
</div>

<div class="cat-nav" id="cat-nav"></div>
</div>

<div class="menu-body" id="menu-body"></div>

<div class="no-results" id="no-results">
  <h3>No products found</h3>
  <p>Try a different search term.</p>
</div>

<div class="footer">
  ${disclaimer}
</div>

<script>
(function(){
  var DATA = ${menuData};
  var CATEGORY_ICON_SVGS = ${JSON.stringify(CATEGORY_ICON_SVGS)};
  var PLACEHOLDER_ICON_SVGS = ${JSON.stringify(PLACEHOLDER_ICON_SVGS)};
  var CATEGORY_LABELS = ${JSON.stringify(CATEGORY_LABELS)};
  var currency = DATA.currency || '$';
  var allCats = DATA.categories || [];

  function escapeHtml(str){
    if(str===null||str===undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function safeImgUrl(url){
    if(!url||typeof url!=='string') return '';
    var u = url.trim();
    if(/^\\/api\\/uploads\\//.test(u) || /^data:image\\//.test(u)) return u;
    try {
      var parsed = new URL(u, location.origin);
      var host = parsed.hostname;
      if(parsed.protocol === 'https:' && parsed.pathname.indexOf('/api/uploads/') === 0 && (host === location.hostname || host === 'dubmenu.com' || host === 'www.dubmenu.com')) return parsed.toString();
    } catch(e) {}
    return '';
  }

  var searchInput = document.getElementById('search-input');
  var stockToggle = document.getElementById('stock-toggle');
  var catNav = document.getElementById('cat-nav');
  var menuBody = document.getElementById('menu-body');
  var noResults = document.getElementById('no-results');
  var resultCount = document.getElementById('result-count');

  var state = {
    query: '',
    inStockOnly: true,
    activeCat: 'all',
  };

  // ---- Theme ----
  var themeToggle = document.getElementById('theme-toggle');
  var themeIcon = document.getElementById('theme-icon');
  function applyTheme(dark){
    if(dark){
      document.body.classList.remove('light');
      themeIcon.innerHTML = '\\u263E';
    } else {
      document.body.classList.add('light');
      themeIcon.innerHTML = '\\u2600';
    }
  }
  try{
    var saved = localStorage.getItem('dubmenu_menu_theme');
    applyTheme(saved !== 'light');
  }catch(e){ applyTheme(true); }
  themeToggle.addEventListener('click', function(){
    var isDark = !document.body.classList.contains('light');
    applyTheme(!isDark);
    try{ localStorage.setItem('dubmenu_menu_theme', isDark ? 'light' : 'dark'); }catch(e){}
  });

  // ---- Logo ----
  var logoUrl = ${logoUrl ? JSON.stringify(logoUrl) : '""'};
  var safeLogo = safeImgUrl(logoUrl);
  if(safeLogo){
    var hl = document.getElementById('header-logo');
    hl.src = safeLogo;
    hl.classList.add('show');
  }

  // ---- Category nav ----
  function buildCatNav(){
    var html = '<div class="cat-pill active" data-cat="all">All</div>';
    allCats.forEach(function(c){
      html += '<div class="cat-pill" data-cat="'+escapeHtml(c.id)+'">' + categoryIcon(getCategoryType(c.name)) + escapeHtml(c.name) + '</div>';
    });
    catNav.innerHTML = html;
    catNav.querySelectorAll('.cat-pill').forEach(function(pill){
      pill.addEventListener('click', function(){
        catNav.querySelectorAll('.cat-pill').forEach(function(p){p.classList.remove('active');});
        pill.classList.add('active');
        state.activeCat = pill.getAttribute('data-cat');
        render();
        // Scroll to top of menu
        var firstSection = menuBody.querySelector('.category-section');
        if(firstSection && state.activeCat !== 'all'){
          firstSection.scrollIntoView({behavior:'smooth',block:'start'});
        } else {
          window.scrollTo({top:0,behavior:'smooth'});
        }
      });
    });
  }

  // ---- Helpers ----
  function strainDot(p){
    if(!p.strain) return '';
    var label = escapeHtml(p.strain).charAt(0).toUpperCase();
    return '<span class="strain-line"><span class="strain-dot strain-dot-'+escapeHtml(p.strain)+'" aria-label="'+escapeHtml(p.strain)+'"></span><span class="strain-badge strain-badge-'+escapeHtml(p.strain)+'">'+label+'</span></span>';
  }
  function makeCannaPills(p){
    var pills = [];
    if(p.thc) pills.push('<span class="canna-pill canna-thc">THC '+escapeHtml(p.thc)+'</span>');
    if(p.cbd) pills.push('<span class="canna-pill canna-cbd">CBD '+escapeHtml(p.cbd)+'</span>');
    if(!pills.length) return '';
    return '<div class="canna-pills">'+pills.join('')+'</div>';
  }
  function makePrice(p){
    if(p.priceTiers && p.priceTiers.length > 0){
      var tiers = p.priceTiers.map(function(t){
        var label = escapeHtml((t && t.label) || '');
        var price = escapeHtml((t && t.price) || '');
        if(!label || !price) return '';
        return '<span class="tier"><span class="tier-label">'+label+'</span><span class="tier-price">'+price+'</span></span>';
      }).join('');
      if(tiers) return '<div class="price-tiers">'+tiers+'</div>';
    }
    var orig = p.originalPrice;
    var priceStr = typeof p.price === 'number' ? currency + p.price.toFixed(2).replace(/\\.00$/,'') : escapeHtml(p.price);
    if(orig && orig !== p.price){
      var origStr = typeof orig === 'number' ? currency + orig.toFixed(2).replace(/\\.00$/,'') : escapeHtml(orig);
      return '<span class="price-orig">'+origStr+'</span><span class="price-flat">'+priceStr+'</span>';
    }
    return '<span class="price-flat">'+priceStr+'</span>';
  }
  function makeSku(p){
    if(!p.sku) return '';
    return '<div class="product-sku">SKU '+escapeHtml(p.sku)+'</div>';
  }
  function makeMeta(p){
    var html = '';
    if(p.brand) html += '<div class="product-maker">'+escapeHtml(p.brand)+'</div>';
    var parts = [];
    if(p.weight) parts.push(escapeHtml(p.weight));
    if(p.strain) parts.push('<span style="text-transform:capitalize;">'+escapeHtml(p.strain)+'</span>');
    if(parts.length) html += '<div class="product-meta">'+parts.join(' \u00B7 ')+'</div>';
    return html;
  }
  ${GET_CATEGORY_TYPE_JS}
  function categoryIconSvg(type){
    return CATEGORY_ICON_SVGS[type] || CATEGORY_ICON_SVGS.generic;
  }
  function categoryIcon(type){
    return '<span class="cat-icon cat-icon-' + type + '" aria-hidden="true">' + categoryIconSvg(type) + '</span>';
  }
  function basePlaceholderSvg(type){
    return PLACEHOLDER_ICON_SVGS[type] || PLACEHOLDER_ICON_SVGS.generic;
  }
  function placeholderMarkup(p){
    var type = getCategoryType(p.categoryName || p.name || '');
    return '<div class="product-image-placeholder placeholder-' + type + '">' +
      '<div class="placeholder-art">' + basePlaceholderSvg(type) + '<div class="placeholder-label">' + (CATEGORY_LABELS[type] || CATEGORY_LABELS.generic) + '</div></div>' +
      '</div>';
  }
  function imgMarkup(p){
    var safeUrl = safeImgUrl(p.image);
    var catType = getCategoryType(p.categoryName || p.name || '');
    if(!safeUrl){
      return placeholderMarkup(p);
    }
    return '<img class="product-image product-image-loading" src="'+escapeHtml(safeUrl)+'" alt="'+escapeHtml(p.name)+'" loading="lazy" decoding="async" data-cat="'+catType+'" onload="this.classList.remove(\\'product-image-loading\\');this.classList.add(\\'product-image-loaded\\');" onerror="window.dubmenuImgFallback(this)">';
  }

  window.dubmenuImgFallback = function(img){
    if(!img) return;
    var wrap = img.closest && img.closest('.product-image-wrap');
    var card = img.closest && img.closest('.product-card');
    if(card) card.classList.add('no-image');
    if(wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    else if(img.parentNode) img.parentNode.removeChild(img);
  };

  // ---- Filter ----
  function getFilteredCats(){
    var q = state.query.toLowerCase().trim();
    return allCats
      .filter(function(c){
        if(state.activeCat !== 'all' && c.id !== state.activeCat) return false;
        return true;
      })
      .map(function(c){
        var products = c.products.filter(function(p){
          if(state.inStockOnly && p.inStock === false) return false;
          if(q){
            var haystack = (p.name + ' ' + (p.brand||'') + ' ' + (p.strain||'') + ' ' + (p.sku||'') + ' ' + (p.description||'')).toLowerCase();
            if(haystack.indexOf(q) === -1) return false;
          }
          return true;
        });
        return { id: c.id, name: c.name, products: products };
      })
      .filter(function(c){ return c.products.length > 0; });
  }

  // ---- Render ----
  function render(){
    var filtered = getFilteredCats();
    var totalProducts = filtered.reduce(function(a,c){return a+c.products.length;},0);
    resultCount.textContent = totalProducts > 0 ? totalProducts + ' item' + (totalProducts !== 1 ? 's' : '') : '';

    if(filtered.length === 0){
      menuBody.innerHTML = '';
      noResults.classList.add('show');
      return;
    }
    noResults.classList.remove('show');

    var html = '';
    filtered.forEach(function(cat){
      var catType = getCategoryType(cat.name);
      html += '<section class="category-section" id="cat-'+escapeHtml(cat.id)+'">';
      html += '<h2 class="category-title">'+categoryIcon(catType)+escapeHtml(cat.name)+'</h2>';
      html += '<div class="products-grid">';
      cat.products.forEach(function(p){
        var oos = p.inStock === false ? ' out-of-stock' : '';
        var badges = '';
        if(p.originalPrice && p.originalPrice !== p.price) badges += '<span class="badge-sale">Sale</span>';
        if(p.inStock === false) badges += '<span class="badge-oos">Out</span>';
        html += '<div class="product-card'+oos+'">';
        html += '<div class="product-image-wrap">'+imgMarkup(p)+(badges?'<div class="product-badges">'+badges+'</div>':'')+'</div>';
        html += '<div class="product-body">';
        html += '<div class="product-name-row">'+strainDot(p)+'<span class="product-name">'+escapeHtml(p.name)+'</span></div>';
        var meta = makeMeta(p);
        if(meta) html += meta;
        var sku = makeSku(p);
        if(sku) html += sku;
        var pills = makeCannaPills(p);
        if(pills) html += pills;
        if(p.description) html += '<div class="product-desc">'+escapeHtml(p.description)+'</div>';
        html += '<div class="price-area">'+makePrice(p)+'</div>';
        html += '</div></div>';
      });
      html += '</div></section>';
    });
    menuBody.innerHTML = html;
  }

  // ---- Events ----
  var searchTimer = null;
  searchInput.addEventListener('input', function(){
    if(searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function(){
      state.query = searchInput.value;
      render();
    }, 150);
  });

  stockToggle.addEventListener('click', function(){
    state.inStockOnly = !state.inStockOnly;
    stockToggle.classList.toggle('active', state.inStockOnly);
    render();
  });

  // ---- Init ----
  buildCatNav();
  render();
})();
</script>
</body>
</html>`;
}
