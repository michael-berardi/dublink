export function widgetPage(origin: string): string {
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const safeOrigin = escapeHtml(origin);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Embeddable Menu Widget | DubMenu</title>
<style>
  :root{--bg:#0a0f0d;--surface:rgba(255,255,255,0.04);--border:rgba(255,255,255,0.08);--text:#f0f2f5;--muted:#889495;--primary:#10b981;}
  body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);padding:2rem;max-width:720px;margin:0 auto;}
  h1{font-size:1.5rem;margin-bottom:1rem;}
  p{line-height:1.6;color:var(--muted);margin-bottom:1rem;}
  code{background:var(--surface);border:1px solid var(--border);padding:0.75rem;border-radius:0.5rem;display:block;white-space:pre-wrap;font-size:0.85rem;margin:1rem 0;}
  .preview{border:1px solid var(--border);border-radius:0.75rem;padding:1rem;margin-top:2rem;}
</style>
</head>
<body>
<h1>Embeddable Menu Widget</h1>
<p>Add a live DubMenu display to any website with two lines of HTML. The widget updates automatically when you edit your display from the phone config.</p>
<code>&lt;div id="dubmenu-widget" data-session-id="YOUR_SESSION_ID"&gt;&lt;/div&gt;
&lt;script src="${safeOrigin}/widget.js" async&gt;&lt;/script&gt;</code>
<div class="preview" id="dubmenu-widget" data-session-id="demo">
  <p style="color:var(--muted);">Widget preview will appear here when a valid session ID is provided.</p>
</div>
<script src="${safeOrigin}/widget.js" async></script>
</body>
</html>`;
}

export function widgetJs(origin: string): string {
  const safeOrigin = origin.replace(/"/g, '\\"');
  return `(function(){
  function escapeHtml(str){
    if(str===null||str===undefined) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function renderWidget(el, sessionId){
    el.innerHTML = '<p style="color:#888;text-align:center;padding:2rem;">Loading menu...</p>';
    fetch('${safeOrigin}/api/widget/' + encodeURIComponent(sessionId))
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(!data || !data.categories){ throw new Error('Invalid menu data'); }
        var html = '<div style="font-family:Inter,system-ui,sans-serif;background:#0a0f0d;color:#f0f2f5;padding:1rem;border-radius:0.75rem;max-width:400px;">';
        html += '<h2 style="margin:0 0 1rem 0;font-size:1.25rem;color:#10b981;">' + escapeHtml(data.dispensaryName || 'Menu') + '</h2>';
        data.categories.forEach(function(cat){
          html += '<div style="margin-bottom:1rem;"><h3 style="font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em;color:#889495;margin:0 0 0.5rem 0;">' + escapeHtml(cat.name) + '</h3>';
          cat.products.forEach(function(p){
            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">';
            html += '<span>' + escapeHtml(p.name) + '</span>';
            html += '<span style="font-weight:700;color:#10b981;">$' + escapeHtml(p.price) + '</span>';
            html += '</div>';
          });
          html += '</div>';
        });
        html += '</div>';
        el.innerHTML = html;
        try{
          fetch('${safeOrigin}/api/analytics/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'analytics.widget.load',payload:{sessionId:sessionId}})});
        }catch(e){}
      })
      .catch(function(err){
        el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:2rem;">Failed to load menu.</p>';
      });
  }

  function init(){
    var widgets = document.querySelectorAll('[data-session-id]');
    widgets.forEach(function(el){
      var sessionId = el.getAttribute('data-session-id');
      if(!sessionId || sessionId === 'demo') return;
      renderWidget(el, sessionId);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;
}
