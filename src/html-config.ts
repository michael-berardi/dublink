export function configPage(sessionId: string, origin: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>DubMenu — Configure</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    :root{--bg:#000;--surface:#1c1c1e;--surface2:#2c2c2e;--border:#38383a;--text:#fff;--muted:#8e8e93;--primary:#10b981;--danger:#ef4444;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;max-width:520px;margin:0 auto;padding:1rem;-webkit-font-smoothing:antialiased;}
    .status-bar{display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background:var(--surface);border-radius:0.75rem;margin-bottom:1.25rem;position:sticky;top:0.5rem;z-index:100;}
    .status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:0.5rem;}
    .status-connected{background:var(--primary);}
    .status-disconnected{background:var(--danger);}
    .status-connecting{background:#f59e0b;}
    .status-text{font-size:0.875rem;font-weight:600;}
    .header{margin-bottom:1.5rem;}
    .header h1{font-size:1.75rem;font-weight:700;letter-spacing:-0.02em;}
    .header .sub{color:var(--muted);font-size:0.875rem;margin-top:0.25rem;}
    .header .sub a{color:var(--primary);text-decoration:none;font-weight:600;}
    .card{background:var(--surface);border-radius:0.75rem;padding:1.25rem;margin-bottom:0.75rem;}
    .card-title{font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:1rem;}
    .field{margin-bottom:1rem;}
    .field:last-child{margin-bottom:0;}
    .field label{display:block;font-size:0.75rem;font-weight:600;color:var(--muted);margin-bottom:0.375rem;text-transform:uppercase;letter-spacing:0.04em;}
    .field input[type="text"],.field input[type="url"],.field input[type="number"],.field textarea,.field select{
      width:100%;background:var(--surface2);border:none;border-radius:0.5rem;padding:0.75rem;color:var(--text);font-size:1rem;outline:none;font-family:inherit;
    }
    .field input:focus,.field textarea:focus,.field select:focus{box-shadow:0 0 0 2px var(--primary);}
    .field input[type="color"]{width:100%;height:2.5rem;background:var(--surface2);border:none;border-radius:0.5rem;cursor:pointer;padding:0.25rem;}
    .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;}
    .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-top:1px solid var(--border);}
    .toggle-row:first-child{border-top:none;}
    .toggle-row span{font-size:1rem;}
    .switch{position:relative;width:44px;height:26px;background:var(--surface2);border-radius:13px;cursor:pointer;transition:background 0.2s;flex-shrink:0;}
    .switch.on{background:var(--primary);}
    .switch::after{content:'';position:absolute;width:22px;height:22px;background:#fff;border-radius:50%;top:2px;left:2px;transition:left 0.2s;}
    .switch.on::after{left:20px;}
    .theme-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;}
    .theme-option{background:var(--surface2);border:2px solid transparent;border-radius:0.75rem;padding:1rem;cursor:pointer;transition:border-color 0.2s;}
    .theme-option.selected{border-color:var(--primary);}
    .theme-name{font-size:0.9375rem;font-weight:700;margin-bottom:0.25rem;}
    .theme-desc{font-size:0.75rem;color:var(--muted);line-height:1.4;}
    .theme-preview{height:32px;border-radius:0.375rem;margin-bottom:0.5rem;}
    .preview-dark{background:linear-gradient(135deg,#0a0a0a,#1a1a1a);border:1px solid #10b981;}
    .preview-light{background:linear-gradient(135deg,#f5f5f5,#fff);border:1px solid #059669;}
    .preview-neon{background:linear-gradient(135deg,#050505,#0a0a0a);box-shadow:inset 0 0 10px #00ff88;}
    .preview-minimal{background:linear-gradient(135deg,#111,#1a1a1a);}
    .preview-sunset{background:linear-gradient(135deg,#1a0a0a,#2a1212);border:1px solid #f97316;}
    .preview-forest{background:linear-gradient(135deg,#0a1410,#112218);border:1px solid #22c55e;}
    .preview-royal{background:linear-gradient(135deg,#0a0a1a,#12122a);border:1px solid #818cf8;}
    .preview-gold{background:linear-gradient(135deg,#0c0a05,#1a160c);border:1px solid #fbbf24;}
    .preview-ocean{background:linear-gradient(135deg,#050c14,#0e1824);border:1px solid #06b6d4;}
    .preview-crimson{background:linear-gradient(135deg,#0e0505,#1c0a0a);border:1px solid #dc2626;}
    .preview-bone{background:linear-gradient(135deg,#faf8f5,#fff);border:1px solid #1c1917;}
    .preview-vapor{background:linear-gradient(135deg,#0c0414,#180a26);border:1px solid #e879f9;}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:0.375rem;padding:0.75rem 1.25rem;border:none;border-radius:0.5rem;font-size:0.9375rem;font-weight:600;cursor:pointer;font-family:inherit;color:#fff;}
    .btn-primary{background:var(--primary);}
    .btn-danger{background:var(--danger);}
    .btn-secondary{background:var(--surface2);}
    .btn-sm{padding:0.5rem 0.75rem;font-size:0.8125rem;}
    .search-bar{padding:0.75rem;background:var(--surface2);border-radius:0.5rem;margin-bottom:0.75rem;}
    .search-bar input{background:transparent;border:none;color:var(--text);font-size:1rem;outline:none;width:100%;}
    .cat-item{background:var(--surface2);border-radius:0.75rem;padding:1rem;margin-bottom:0.75rem;}
    .cat-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap;}
    .cat-header input{flex:1;background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);font-size:1rem;font-weight:600;outline:none;}
    .prod-item{background:var(--surface);border-radius:0.5rem;padding:0.75rem;margin-bottom:0.5rem;}
    .prod-top{display:flex;justify-content:space-between;align-items:center;}
    .prod-name{font-weight:600;font-size:0.9375rem;}
    .prod-price{color:var(--primary);font-weight:700;font-size:0.9375rem;}
    .prod-meta{font-size:0.75rem;color:var(--muted);margin-top:0.25rem;display:flex;gap:0.5rem;flex-wrap:wrap;}
    .badge{display:inline-flex;padding:0.125rem 0.375rem;border-radius:0.25rem;font-size:0.625rem;font-weight:700;text-transform:uppercase;}
    .badge-indica{background:#6d28d9;color:#fff;}
    .badge-sativa{background:#d97706;color:#fff;}
    .badge-hybrid{background:#059669;color:#fff;}
    .badge-out{background:var(--danger);color:#fff;}
    .badge-in{background:var(--primary);color:#fff;}
    .expand-btn{background:none;border:none;color:var(--muted);cursor:pointer;font-size:0.8125rem;font-family:inherit;padding:0.25rem;}
    .prod-edit{display:none;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border);}
    .prod-edit.open{display:block;}
    .prod-edit .grid-2{margin-bottom:0.5rem;}
    .actions{display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem;}
    .actions .btn{flex:1;min-width:100px;}
    .toast{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--surface2);color:var(--text);padding:0.75rem 1.5rem;border-radius:0.75rem;font-size:0.9375rem;font-weight:600;z-index:1000;opacity:0;transition:opacity 0.3s,transform 0.3s;pointer-events:none;}
    .toast.show{opacity:1;transform:translateX(-50%) translateY(-8px);}
    .screenset-info{background:var(--surface);border:1px solid var(--primary);border-radius:0.75rem;padding:1rem;margin-bottom:0.75rem;display:none;}
    .screenset-info.active{display:block;}
    .screenset-info h3{font-size:0.9375rem;font-weight:700;margin-bottom:0.5rem;}
    .screenset-list{display:flex;flex-direction:column;gap:0.5rem;}
    .screenset-tv{display:flex;align-items:center;gap:0.75rem;padding:0.625rem;background:var(--surface2);border-radius:0.5rem;}
    .screenset-tv-num{width:28px;height:28px;background:var(--primary);color:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.8125rem;flex-shrink:0;}
    .screenset-tv-url{font-size:0.75rem;color:var(--muted);flex:1;word-break:break-all;}
    .helper{font-size:0.8125rem;color:var(--muted);line-height:1.45;margin-top:0.4rem;}
    .import-status{font-size:0.875rem;color:var(--muted);margin-top:0.75rem;min-height:1.2rem;}
    .import-status.ok{color:var(--primary);}
    .import-status.err{color:var(--danger);}
    @media(max-width:400px){.grid-2{grid-template-columns:1fr;}.theme-grid{grid-template-columns:1fr;}}
    @media(max-width:480px){
      .cat-header input{flex:1 1 100%;}
      .cat-header .btn{flex:1 1 auto;}
      .prod-edit .grid-2{grid-template-columns:1fr;}
      .prod-edit input,.prod-edit select{min-width:0;}
    }
  </style>
</head>
<body>

<div class="status-bar">
  <div><span class="status-dot status-disconnected" id="statusDot"></span><span class="status-text" id="statusText">Connecting...</span></div>
  <div><button class="btn btn-sm btn-secondary" onclick="exportData()">Export</button><button class="btn btn-sm btn-secondary" onclick="document.getElementById('importInput').click()" style="margin-left:0.25rem;">Import</button><input type="file" id="importInput" accept=".json" style="display:none" onchange="importData(event)"></div>
</div>

<div class="header">
  <h1>DubMenu</h1>
  <div class="sub"><a href="https://tv.dubmenu.com/tv/${sessionId}" target="_blank">Open TV Display &rarr;</a></div>
</div>

<div class="screenset-info" id="screensetInfo">
  <h3>Screen Set (<span id="screensetCount">1</span> TV<span id="screensetPlural">s</span>)</h3>
  <div class="screenset-list" id="screensetList"></div>
</div>

<div class="card">
  <div class="card-title">Branding</div>
  <div class="field"><label>Dispensary Name</label><input type="text" id="dispensaryName" placeholder="My Dispensary" oninput="debounceConfig('dispensaryName',this.value)"></div>
  <div class="grid-2">
    <div class="field"><label>Logo URL</label><input type="url" id="logoUrl" placeholder="https://..." oninput="debounceConfig('logo',this.value)"></div>
    <div class="field"><label>Accent Color</label><input type="color" id="primaryColor" value="#10b981" onchange="debounceConfig('primaryColor',this.value)"></div>
  </div>
</div>

<div class="card">
  <div class="card-title">Import From Dutchie</div>
  <div class="field">
    <label>Dutchie Menu URL</label>
    <input type="url" id="dutchieUrl" placeholder="https://dutchie.com/embedded-menu/simply-green">
    <div class="helper">Paste a Dutchie embedded menu link. DubMenu will scrape products, prices, THC, strain type, brand, weight, and images into an optimized TV menu.</div>
  </div>
  <button class="btn btn-primary" id="dutchieImportBtn" onclick="importDutchie()" style="width:100%;">Import Menu</button>
  <div class="import-status" id="dutchieStatus"></div>
</div>

<div class="card">
  <div class="card-title">Theme</div>
  <div class="theme-grid" id="templateSelect">
    <div class="theme-option" data-template="default" onclick="selectTemplate('default')">
      <div class="theme-preview preview-dark"></div>
      <div class="theme-name">Classic Dark</div>
      <div class="theme-desc">Black background, green accents. Matches most dispensary aesthetics.</div>
    </div>
    <div class="theme-option" data-template="light" onclick="selectTemplate('light')">
      <div class="theme-preview preview-light"></div>
      <div class="theme-name">Clean Light</div>
      <div class="theme-desc">Bright, airy, Apple Store feel. Best for modern, well-lit spaces.</div>
    </div>
    <div class="theme-option" data-template="neon" onclick="selectTemplate('neon')">
      <div class="theme-preview preview-neon"></div>
      <div class="theme-name">Bold Neon</div>
      <div class="theme-desc">Glowing green on deep black. Nightlife, premium, eye-catching.</div>
    </div>
    <div class="theme-option" data-template="minimal" onclick="selectTemplate('minimal')">
      <div class="theme-preview preview-minimal"></div>
      <div class="theme-name">Minimal</div>
      <div class="theme-desc">Monochrome, maximum whitespace. Quiet luxury, understated.</div>
    </div>
    <div class="theme-option" data-template="sunset" onclick="selectTemplate('sunset')">
      <div class="theme-preview preview-sunset"></div>
      <div class="theme-name">Sunset</div>
      <div class="theme-desc">Warm orange on dark brown. Cozy, boutique, inviting.</div>
    </div>
    <div class="theme-option" data-template="forest" onclick="selectTemplate('forest')">
      <div class="theme-preview preview-forest"></div>
      <div class="theme-name">Forest</div>
      <div class="theme-desc">Deep green on dark forest. Natural, organic, earthy.</div>
    </div>
    <div class="theme-option" data-template="royal" onclick="selectTemplate('royal')">
      <div class="theme-preview preview-royal"></div>
      <div class="theme-name">Royal</div>
      <div class="theme-desc">Indigo glow on midnight. Premium, sophisticated, modern.</div>
    </div>
    <div class="theme-option" data-template="gold" onclick="selectTemplate('gold')">
      <div class="theme-preview preview-gold"></div>
      <div class="theme-name">Gold Rush</div>
      <div class="theme-desc">Gold on near-black. Maximum luxury, premium feel.</div>
    </div>
    <div class="theme-option" data-template="ocean" onclick="selectTemplate('ocean')">
      <div class="theme-preview preview-ocean"></div>
      <div class="theme-name">Ocean</div>
      <div class="theme-desc">Cyan on deep navy. Fresh, clinical, modern.</div>
    </div>
    <div class="theme-option" data-template="crimson" onclick="selectTemplate('crimson')">
      <div class="theme-preview preview-crimson"></div>
      <div class="theme-name">Crimson</div>
      <div class="theme-desc">Red on dark black. Bold, urgent, sale-energy.</div>
    </div>
    <div class="theme-option" data-template="bone" onclick="selectTemplate('bone')">
      <div class="theme-preview preview-bone"></div>
      <div class="theme-name">Bone</div>
      <div class="theme-desc">Off-white with black accent. Editorial, high-fashion.</div>
    </div>
    <div class="theme-option" data-template="vapor" onclick="selectTemplate('vapor')">
      <div class="theme-preview preview-vapor"></div>
      <div class="theme-name">Vapor</div>
      <div class="theme-desc">Pink-purple glow. Retro-futuristic, fun.</div>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title">Layout</div>
  <div class="field">
    <label>Menu Style</label>
    <select id="layoutMode" onchange="debounceConfig('layoutMode',this.value)">
      <option value="auto">Auto (recommended)</option>
      <option value="columns">Columns</option>
      <option value="pricelist">Price List</option>
      <option value="grid">Grid (with images)</option>
      <option value="compact">Compact Tiles</option>
    </select>
  </div>
  <div class="grid-2">
    <div class="field"><label>Currency</label><input type="text" id="currency" value="$" maxlength="3" onchange="debounceConfig('currency',this.value)"></div>
    <div class="field"><label>Text Size</label><select id="fontSize" onchange="debounceConfig('fontSize',this.value)"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></div>
  </div>
  <div class="toggle-row"><span>Show Strain Type</span><div class="switch" id="showStrain" onclick="toggleSwitch(this,'showStrain')"></div></div>
  <div class="toggle-row"><span>Show Brand & Weight</span><div class="switch" id="showBrandWeight" onclick="toggleSwitch(this);updateBrandWeight()"></div></div>
  <div class="toggle-row"><span>Show Product Images</span><div class="switch" id="showImages" onclick="toggleSwitch(this,'showImages')"></div></div>
  <div class="toggle-row"><span>Show Sale Badges</span><div class="switch" id="showPromos" onclick="toggleSwitch(this,'showPromos')"></div></div>
  <div class="toggle-row"><span>Auto-Scroll Menu</span><div class="switch" id="autoScroll" onclick="toggleSwitch(this,'autoScroll');document.getElementById('scrollSpeedField').style.display=this.classList.contains('on')?'block':'none'"></div></div>
  <div class="field" id="scrollSpeedField" style="display:none;"><label>Scroll Speed</label><input type="range" id="autoScrollSpeed" min="10" max="150" value="50" oninput="debounceConfig('autoScrollSpeed',parseInt(this.value))" style="width:100%;"></div>
  <div class="field"><label>Custom Font (Google Fonts)</label><input type="text" id="customFont" placeholder="e.g. Inter, Poppins, Oswald" oninput="debounceConfig('customFont',this.value)"></div>
</div>

<div class="card">
  <div class="card-title">Promo Banner (Always On)</div>
  <div class="field"><input type="text" id="promoBannerText" placeholder="Today's special..." oninput="updatePromoBanner()"></div>
  <div class="grid-2">
    <div class="field"><label>Banner Color</label><input type="color" id="promoBannerBg" value="#10b981" onchange="updatePromoBanner()"></div>
    <div class="field"><label>Text Color</label><input type="color" id="promoBannerTextColor" value="#000000" onchange="updatePromoBanner()"></div>
  </div>
  <div class="toggle-row"><span>Banner Active</span><div class="switch" id="promoBannerActive" onclick="toggleSwitch(this);updatePromoBanner()"></div></div>
</div>

<div class="card">
  <div class="card-title">Scheduled Banners (Time-Based)</div>
  <div id="scheduledBannersList"></div>
  <button class="btn btn-secondary btn-sm" style="margin-top:0.5rem;" onclick="addScheduledBanner()">+ Add Scheduled Banner</button>
  <div style="font-size:0.75rem;color:var(--muted);margin-top:0.5rem;">Banners show automatically during their time window. First match wins. Overrides the always-on banner above when active.</div>
</div>

<div class="card">
  <div class="card-title">Compliance</div>
  <div class="field"><label>Disclaimer Text</label><textarea id="disclaimer" placeholder="Must be 21+ with valid ID." rows="2" oninput="debounceConfig('disclaimer',this.value)"></textarea></div>
</div>

<div class="card">
  <div class="card-title">Products</div>
  <div class="search-bar"><input type="text" id="searchInput" placeholder="Search products..." oninput="filterProducts()"></div>
  <div class="field"><div style="display:flex;gap:0.5rem;"><input type="text" id="newCategoryName" placeholder="New category name" style="flex:1;background:var(--surface2);border:none;border-radius:0.5rem;padding:0.75rem;color:var(--text);font-size:1rem;outline:none;" onkeydown="if(event.key==='Enter')addCategory()"><button class="btn btn-primary btn-sm" onclick="addCategory()">+ Add</button></div></div>
  <div id="categoryList"></div>
</div>

<div class="toast" id="toast"></div>

<script>
const SESSION_ID="${sessionId}";
const ORIGIN="${origin}";
let ws=null,config=null,reconnectTimer=null,reconnectAttempts=0,debounceTimer=null;

function connect(){
  const proto=location.protocol==='https:'?'wss:':'ws:';
  ws=new WebSocket(proto+'//'+location.host+'/ws/'+SESSION_ID+'?role=phone');
  ws.onopen=function(){reconnectAttempts=0;setStatus('connecting');ws.send(JSON.stringify({type:'join',payload:{role:'phone'}}));};
  ws.onmessage=function(ev){const m=JSON.parse(ev.data);if(m.type==='ping'){ws.send(JSON.stringify({type:'pong'}));return;}if(m.type==='config'){config=m.payload;setStatus('connected');render();}};
  ws.onclose=function(){setStatus('disconnected');if(reconnectAttempts<10){reconnectAttempts++;reconnectTimer=setTimeout(connect,2000*reconnectAttempts);}};
  ws.onerror=function(){ws.close();};
}
function setStatus(s){
  document.getElementById('statusDot').className='status-dot status-'+s;
  document.getElementById('statusText').textContent=s==='connected'?'Connected':s==='disconnected'?'Disconnected':'Connecting...';
}
function send(t,p){if(ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:t,payload:p}));}
function sendConfig(k,v){const u={};u[k]=v;send('config_update',u);}
function debounceConfig(k,v){clearTimeout(debounceTimer);debounceTimer=setTimeout(function(){sendConfig(k,v);},400);}
function toggleSwitch(el,key){el.classList.toggle('on');if(key)sendConfig(key,el.classList.contains('on'));}
function setSwitch(id,on){var el=document.getElementById(id);if(el){el.classList.toggle('on',on);}}
function getSwitch(id){var el=document.getElementById(id);return el?el.classList.contains('on'):false;}

function selectTemplate(t){
  document.querySelectorAll('#templateSelect .theme-option').forEach(function(el){el.classList.toggle('selected',el.dataset.template===t);});
  sendConfig('template',t);
}

function updatePromoBanner(){
  sendConfig('promoBanner',{
    text:document.getElementById('promoBannerText').value,
    active:document.getElementById('promoBannerActive').classList.contains('on'),
    bgColor:document.getElementById('promoBannerBg').value,
    textColor:document.getElementById('promoBannerTextColor').value
  });
}
function hourLabel(h){
  var period=h>=12?'PM':'AM';
  var hr=h%12;if(hr===0)hr=12;
  return hr+' '+period;
}
function renderScheduledBanners(){
  var list=document.getElementById('scheduledBannersList');
  if(!list)return;
  var banners=config.scheduledBanners||[];
  if(!banners.length){list.innerHTML='<div style="color:var(--muted);padding:0.5rem;font-size:0.875rem;">No scheduled banners. Add one to show promos at specific times.</div>';return;}
  var html='';
  banners.forEach(function(b,idx){
    var opts='';for(var h=0;h<24;h++){opts+='<option value="'+h+'"'+(b.startHour===h?' selected':'')+'>'+hourLabel(h)+'</option>';}
    var opts2='';for(var h2=1;h2<=24;h2++){var val=h2===24?23:h2;opts2+='<option value="'+val+'"'+(b.endHour===val?' selected':'')+'>'+hourLabel(val)+'</option>';}
    html+='<div data-banner-idx="'+idx+'" style="background:var(--surface);border-radius:0.5rem;padding:0.75rem;margin-bottom:0.5rem;">';
    html+='<input type="text" class="sb-text" value="'+escapeHtml(b.text||'')+'" placeholder="Happy Hour - 20% off all flower!" style="background:var(--surface2);border:none;border-radius:0.5rem;padding:0.5rem;color:var(--text);width:100%;margin-bottom:0.5rem;font-size:0.9rem;">';
    html+='<div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">';
    html+='<select class="sb-start" style="background:var(--surface2);border:none;border-radius:0.375rem;padding:0.4rem;color:var(--text);font-size:0.8rem;">'+opts+'</select>';
    html+='<span style="color:var(--muted);font-size:0.8rem;">to</span>';
    html+='<select class="sb-end" style="background:var(--surface2);border:none;border-radius:0.375rem;padding:0.4rem;color:var(--text);font-size:0.8rem;">'+opts2+'</select>';
    html+='<input type="color" class="sb-bg" value="'+escapeHtml(b.bgColor||'#10b981')+'" style="width:32px;height:32px;border:none;border-radius:0.25rem;background:none;cursor:pointer;" title="Background color">';
    html+='<input type="color" class="sb-text-color" value="'+escapeHtml(b.textColor||'#000000')+'" style="width:32px;height:32px;border:none;border-radius:0.25rem;background:none;cursor:pointer;" title="Text color">';
    html+='<div class="switch sb-active'+(b.active?' on':'')+'"></div>';
    html+='<button class="btn btn-danger btn-sm sb-remove">Remove</button>';
    html+='</div></div>';
  });
  list.innerHTML=html;
  list.querySelectorAll('[data-banner-idx]').forEach(function(row){
    var i=parseInt(row.dataset.bannerIdx);
    row.querySelector('.sb-text').addEventListener('input',function(){updateScheduledBanner(i,'text',this.value);});
    row.querySelector('.sb-start').addEventListener('change',function(){updateScheduledBanner(i,'startHour',parseInt(this.value));});
    row.querySelector('.sb-end').addEventListener('change',function(){updateScheduledBanner(i,'endHour',parseInt(this.value));});
    row.querySelector('.sb-bg').addEventListener('change',function(){updateScheduledBanner(i,'bgColor',this.value);});
    row.querySelector('.sb-text-color').addEventListener('change',function(){updateScheduledBanner(i,'textColor',this.value);});
    row.querySelector('.sb-active').addEventListener('click',function(){toggleSwitch(this);updateScheduledBanner(i,'active',this.classList.contains('on'));});
    row.querySelector('.sb-remove').addEventListener('click',function(){removeScheduledBanner(i);});
  });
}
function addScheduledBanner(){
  if(!config.scheduledBanners)config.scheduledBanners=[];
  config.scheduledBanners.push({id:Date.now().toString(),text:'',startHour:8,endHour:12,bgColor:'#10b981',textColor:'#000000',active:false});
  sendConfig('scheduledBanners',config.scheduledBanners);
  renderScheduledBanners();
}
function updateScheduledBanner(idx,field,value){
  if(!config.scheduledBanners||!config.scheduledBanners[idx])return;
  config.scheduledBanners[idx][field]=value;
  sendConfig('scheduledBanners',config.scheduledBanners);
}
function removeScheduledBanner(idx){
  if(!config.scheduledBanners)return;
  config.scheduledBanners.splice(idx,1);
  sendConfig('scheduledBanners',config.scheduledBanners);
  renderScheduledBanners();
}
function showToast(msg){var t=document.getElementById('toast');t.textContent=msg;t.className='toast show';setTimeout(function(){t.classList.remove('show');},2500);}
function escapeHtml(s){if(!s)return'';var d=document.createElement('div');d.textContent=s;return d.innerHTML;}

async function importDutchie(){
  var input=document.getElementById('dutchieUrl');
  var btn=document.getElementById('dutchieImportBtn');
  var status=document.getElementById('dutchieStatus');
  var url=input.value.trim();
  if(!url){status.textContent='Paste a Dutchie menu URL first.';status.className='import-status err';return;}
  btn.disabled=true;
  btn.textContent='Importing...';
  status.textContent='Scraping Dutchie. This can take up to a minute.';
  status.className='import-status';
  try{
    var res=await fetch('/api/scrape-dutchie',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url,session:SESSION_ID})});
    var data=await res.json();
    if(!res.ok||!data.success)throw new Error(data.error||'Import failed');
    var count=data.productCount||((data.categories||[]).reduce(function(n,c){return n+(c.products?c.products.length:0);},0));
    status.textContent='Imported '+count+' products across '+(data.categories||[]).length+' categories.';
    status.className='import-status ok';
    showToast('Dutchie menu imported');
  }catch(err){
    status.textContent=err&&err.message?err.message:'Import failed';
    status.className='import-status err';
    showToast('Dutchie import failed');
  }finally{
    btn.disabled=false;
    btn.textContent='Import Menu';
  }
}

// Brand+Weight combined toggle
function updateBrandWeight(){
  var on=getSwitch('showBrandWeight');
  sendConfig('showBrand',on);
}

function render(){
  if(!config)return;
  document.getElementById('dispensaryName').value=config.dispensaryName||'';
  document.getElementById('logoUrl').value=config.logo||'';
  document.getElementById('primaryColor').value=config.primaryColor||'#10b981';
  document.getElementById('currency').value=config.currency||'$';
  document.getElementById('fontSize').value=config.fontSize||'medium';
  document.getElementById('layoutMode').value=config.layoutMode||'auto';
  document.getElementById('promoBannerText').value=config.promoBanner?(config.promoBanner.text||''):'';
  document.getElementById('promoBannerBg').value=config.promoBanner?(config.promoBanner.bgColor||'#10b981'):'#10b981';
  document.getElementById('promoBannerTextColor').value=config.promoBanner?(config.promoBanner.textColor||'#000000'):'#000000';
  document.getElementById('disclaimer').value=config.disclaimer||'';
  setSwitch('showStrain',config.showStrain!==false);
  setSwitch('showBrandWeight',config.showBrand!==false);
  setSwitch('showImages',config.showImages!==false);
  setSwitch('showPromos',config.showPromos!==false);
  setSwitch('autoScroll',config.autoScroll===true);
  document.getElementById('autoScrollSpeed').value=config.autoScrollSpeed||50;
  document.getElementById('scrollSpeedField').style.display=config.autoScroll===true?'block':'none';
  document.getElementById('customFont').value=(config.customFont&&config.customFont!=='system')?config.customFont:'';
  setSwitch('promoBannerActive',config.promoBanner?config.promoBanner.active===true:false);
  renderScheduledBanners();
  document.querySelectorAll('#templateSelect .theme-option').forEach(function(el){el.classList.toggle('selected',el.dataset.template===(config.template||'default'));});
  renderCategories();
  updateScreenSet();
}

// Screen set: detect TVs from cookie
function updateScreenSet(){
  var screens=getCookie('dubmenu_screens');
  if(!screens)return;
  var screenIds=screens.split(',').filter(function(s){return s;});
  if(screenIds.length<=1)return;
  var info=document.getElementById('screensetInfo');
  info.classList.add('active');
  document.getElementById('screensetCount').textContent=screenIds.length;
  document.getElementById('screensetPlural').textContent=screenIds.length>1?'s':'';
  var list=document.getElementById('screensetList');
  list.innerHTML='';
  screenIds.forEach(function(sid,i){
    var url=ORIGIN+'/tv/'+sid+'?display='+(i+1)+'&displays='+screenIds.length;
    var div=document.createElement('div');
    div.className='screenset-tv';
    div.innerHTML='<div class="screenset-tv-num">'+(i+1)+'</div><div class="screenset-tv-url">'+escapeHtml(url)+'</div><button class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText(\\''+url+'\\');showToast(\\'Copied!\\')">Copy</button>';
    list.appendChild(div);
  });
  sendConfig('displayCount',screenIds.length);
}

function getCookie(n){var m=document.cookie.match(new RegExp('(^| )'+n+'=([^;]+)'));return m?m[2]:null;}
function setCookie(n,v,days){var d=new Date();d.setTime(d.getTime()+(days||7)*86400000);document.cookie=n+'='+v+';expires='+d.toUTCString()+';path=/';}

function filterProducts(){renderCategories();}
function uploadProductImage(input,cid,pid){
  var file=input.files[0];
  if(!file)return;
  var urlField=document.getElementById('ep-'+cid+'-'+pid+'-image');
  var fd=new FormData();
  fd.append('file',file);
  fetch('/api/upload',{method:'POST',body:fd})
    .then(function(r){if(!r.ok)throw new Error('Upload failed');return r.json();})
    .then(function(data){
      var url=data.url;
      if(url)urlField.value=url;
      showToast('Image uploaded');
    })
    .catch(function(err){showToast(err.message||'Upload failed');});
}
function renderCategories(){
  var list=document.getElementById('categoryList');
  if(!config||!config.categories||!config.categories.length){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--muted);">No categories yet.</div>';return;}
  var search=(document.getElementById('searchInput').value||'').toLowerCase();
  var html='';
  config.categories.forEach(function(cat){
    html+='<div class="cat-item"><div class="cat-header"><input type="text" value="'+escapeHtml(cat.name)+'" onchange="updateCategoryName(\\''+cat.id+'\\',this.value)"><button class="btn btn-danger btn-sm" onclick="removeCategory(\\''+cat.id+'\\')">Remove</button></div>';
    html+='<div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap;"><input type="text" placeholder="Product name" style="flex:2 1 100%;background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);font-size:0.9375rem;outline:none;min-width:0;" id="np-'+cat.id+'-name"><input type="number" placeholder="$ Price" style="flex:1;background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);font-size:0.9375rem;outline:none;min-width:0;" id="np-'+cat.id+'-price" step="0.01"><button class="btn btn-primary btn-sm" onclick="addProduct(\\''+cat.id+'\\')">+</button></div>';
    if(!cat.products||!cat.products.length){html+='<div style="text-align:center;padding:1rem;color:var(--muted);font-size:0.875rem;">No products yet.</div>';}
    else{
      cat.products.forEach(function(p){
        if(search&&p.name&&p.name.toLowerCase().indexOf(search)===-1)return;
        html+='<div class="prod-item"><div class="prod-top"><span class="prod-name">'+escapeHtml(p.name)+'</span><span class="prod-price">'+(config.currency||'$')+p.price+'</span></div>';
        html+='<div class="prod-meta">';
        if(p.strain)html+='<span class="badge badge-'+p.strain+'">'+p.strain+'</span>';
        if(p.thc)html+='<span>THC '+escapeHtml(p.thc)+'</span>';
        if(p.inStock===false)html+='<span class="badge badge-out">Out</span>';else html+='<span class="badge badge-in">In Stock</span>';
        html+='</div>';
        html+='<button class="expand-btn" onclick="toggleEdit(\\''+cat.id+'\\',\\''+p.id+'\\')">Edit</button>';
        html+='<div class="prod-edit" id="edit-'+cat.id+'-'+p.id+'">';
        html+='<div style="margin-bottom:0.5rem;min-width:0;"><label style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Name</label><input type="text" value="'+escapeHtml(p.name||'')+'" id="ep-'+cat.id+'-'+p.id+'-name" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;"></div>';
        html+='<div class="grid-2"><div style="min-width:0;"><label style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Price</label><input type="number" value="'+p.price+'" step="0.01" id="ep-'+cat.id+'-'+p.id+'-price" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;"></div>';
        html+='<div style="min-width:0;"><label style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">THC</label><input type="text" value="'+escapeHtml(p.thc||'')+'" id="ep-'+cat.id+'-'+p.id+'-thc" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;"></div></div>';
        html+='<div class="grid-2"><div style="min-width:0;"><label style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Weight</label><input type="text" value="'+escapeHtml(p.weight||'')+'" id="ep-'+cat.id+'-'+p.id+'-weight" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;"></div>';
        html+='<div style="min-width:0;"><label style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Brand</label><input type="text" value="'+escapeHtml(p.brand||'')+'" id="ep-'+cat.id+'-'+p.id+'-brand" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;"></div></div>';
        html+='<div style="margin-bottom:0.5rem;"><label style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Image URL</label><div style="display:flex;gap:0.5rem;"><input type="url" value="'+escapeHtml(p.image||'')+'" id="ep-'+cat.id+'-'+p.id+'-image" style="flex:1;background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;min-width:0;"><input type="file" accept="image/*" id="ep-'+cat.id+'-'+p.id+'-image-file" onchange="uploadProductImage(this,\\''+cat.id+'\\',\\''+p.id+'\\')" style="color:var(--text);font-size:0.875rem;max-width:120px;"></div></div>';
        html+='<label style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Strain Type</label><select id="ep-'+cat.id+'-'+p.id+'-strain" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;margin-bottom:0.5rem;"><option value="">None</option><option value="indica"'+(p.strain==='indica'?' selected':'')+'>Indica</option><option value="sativa"'+(p.strain==='sativa'?' selected':'')+'>Sativa</option><option value="hybrid"'+(p.strain==='hybrid'?' selected':'')+'>Hybrid</option></select>';
        html+='<div class="actions"><button class="btn btn-sm btn-primary" onclick="saveProduct(\\''+cat.id+'\\',\\''+p.id+'\\')">Save</button><button class="btn btn-sm '+(p.inStock===false?'btn-primary':'btn-secondary')+'" onclick="toggleStock(\\''+cat.id+'\\',\\''+p.id+'\\')">'+(p.inStock===false?'Mark In Stock':'Mark Out of Stock')+'</button><button class="btn btn-sm btn-danger" onclick="removeProduct(\\''+cat.id+'\\',\\''+p.id+'\\')">Delete</button></div>';
        html+='</div></div>';
      });
    }
    html+='</div>';
  });
  list.innerHTML=html;
}
function toggleEdit(cid,pid){var el=document.getElementById('edit-'+cid+'-'+pid);if(el)el.classList.toggle('open');}
function addCategory(){var name=document.getElementById('newCategoryName').value.trim();if(!name)return;send('category_add',{name:name});document.getElementById('newCategoryName').value='';}
function updateCategoryName(cid,name){send('category_update',{categoryId:cid,updates:{name:name}});}
function removeCategory(cid){send('category_remove',{categoryId:cid});}
function addProduct(cid){var name=document.getElementById('np-'+cid+'-name').value.trim();var price=parseFloat(document.getElementById('np-'+cid+'-price').value)||0;if(!name)return;send('product_add',{categoryId:cid,product:{name:name,price:price,inStock:true}});document.getElementById('np-'+cid+'-name').value='';document.getElementById('np-'+cid+'-price').value='';}
function saveProduct(cid,pid){
  var updates={};
  updates.name=document.getElementById('ep-'+cid+'-'+pid+'-name').value;
  updates.price=parseFloat(document.getElementById('ep-'+cid+'-'+pid+'-price').value)||0;
  updates.thc=document.getElementById('ep-'+cid+'-'+pid+'-thc').value;
  updates.weight=document.getElementById('ep-'+cid+'-'+pid+'-weight').value;
  updates.brand=document.getElementById('ep-'+cid+'-'+pid+'-brand').value;
  updates.image=document.getElementById('ep-'+cid+'-'+pid+'-image').value;
  updates.strain=document.getElementById('ep-'+cid+'-'+pid+'-strain').value;
  send('product_update',{categoryId:cid,productId:pid,updates:updates});
  toggleEdit(cid,pid);
  showToast('Saved');
  try{
    fetch('/api/analytics/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'analytics.config.save',payload:{action:'product_update'}})});
  }catch(e){}
}
function toggleStock(cid,pid){send('product_toggle_stock',{categoryId:cid,productId:pid});}
function removeProduct(cid,pid){send('product_remove',{categoryId:cid,productId:pid});}
function exportData(){if(!config)return;var blob=new Blob([JSON.stringify(config,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dubmenu-config.json';a.click();showToast('Exported');}
function importData(ev){var f=ev.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(e){try{var d=JSON.parse(e.target.result);if(!d.dispensaryName||!d.categories){showToast('Invalid file');return;}send('config_replace',d);showToast('Imported');}catch(err){showToast('Parse error');}};r.readAsText(f);ev.target.value='';}

connect();
</script>
</body>
</html>`;
}
