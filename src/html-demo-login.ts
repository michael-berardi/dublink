export function demoLoginPage(origin: string, next: string, error?: string): string {
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const safeOrigin = escapeHtml(origin);
  const safeNext = escapeHtml(next);
  const errorHtml = error ? `<div class="error">${escapeHtml(error)}</div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Demo Login | DubMenu</title>
  <meta name="description" content="QA demo login for DubMenu.">
  <link rel="canonical" href="${safeOrigin}/demo-login">
  <style>
    :root{--bg:#0a0f0d;--surface:rgba(255,255,255,0.04);--surface2:#2c2c2e;--border:rgba(255,255,255,0.08);--text:#f0f2f5;--muted:#889495;--primary:#10b981;--danger:#ef4444;--radius:0.75rem;}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Inter,system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:1rem;}
    .nav{width:100%;max-width:520px;display:flex;justify-content:space-between;align-items:center;padding:1rem 0;margin-bottom:1.5rem;}
    .nav a.logo{font-weight:800;font-size:1.25rem;color:var(--text);display:flex;align-items:center;gap:0.5rem;}
    .nav a{color:var(--muted);font-size:0.875rem;}
    .card{width:100%;max-width:420px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;margin-bottom:1rem;}
    .card-title{font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:1.25rem;}
    h1.card-title{font-size:1.375rem;text-transform:none;letter-spacing:-0.01em;color:var(--text);}
    .field{margin-bottom:1rem;}
    .field label{display:block;font-size:0.75rem;font-weight:600;color:var(--muted);margin-bottom:0.375rem;text-transform:uppercase;letter-spacing:0.04em;}
    .field input{width:100%;background:var(--surface2);border:none;border-radius:0.5rem;padding:0.75rem;color:var(--text);font-size:1rem;outline:none;}
    .field input:focus{box-shadow:0 0 0 2px var(--primary);}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:0.375rem;padding:0.75rem 1.25rem;border:none;border-radius:0.5rem;font-size:0.9375rem;font-weight:600;cursor:pointer;font-family:inherit;color:#fff;}
    .btn-primary{background:var(--primary);color:#000;width:100%;}
    .error{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:0.75rem;border-radius:0.5rem;margin-bottom:1rem;font-size:0.875rem;}
    .hint{text-align:center;color:var(--muted);font-size:0.875rem;margin-top:1rem;}
    .hint a{color:var(--primary);font-weight:600;}
  </style>
</head>
<body>
  <nav class="nav">
    <a href="${safeOrigin}/" class="logo">DUBMENU</a>
    <a href="${safeOrigin}/pricing">Pricing</a>
  </nav>
  <div class="card">
    <h1 class="card-title">Demo Login</h1>
    ${errorHtml}
    <form method="POST" action="${safeOrigin}/demo-login">
      ${safeNext ? `<input type="hidden" name="next" value="${safeNext}">` : ''}
      <div class="field"><label for="token">Demo Token</label><input type="password" id="token" name="token" required autocomplete="off" placeholder="Enter the demo token"></div>
      <button type="submit" class="btn btn-primary">Start Demo Session</button>
    </form>
    <div class="hint">This is a QA/demo path. Production sign-in is unchanged.</div>
  </div>
</body>
</html>`;
}
