export function authPage(origin: string, mode: 'login' | 'signup' | 'account', account?: any, error?: string, dubHavenEnabled: boolean = false, next?: string): string {
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const safeOrigin = escapeHtml(origin);
  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isAccount = mode === 'account';

  let accountHtml = '';
  if (isAccount && account) {
    const status = account.subscriptionStatus || 'inactive';
    const trialEnds = account.trialEndsAt ? new Date(account.trialEndsAt).toLocaleDateString() : 'N/A';
    const active = status === 'active' || (status === 'trialing' && account.trialEndsAt && account.trialEndsAt > Date.now());
    accountHtml = `
      <div class="card">
        <div class="card-title">Account</div>
        <p style="color:var(--muted);margin-bottom:1rem;">Email: ${escapeHtml(account.email)}</p>
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
          <span class="status-badge ${active ? 'active' : 'inactive'}">${active ? 'Active' : 'Inactive'}</span>
          <span style="color:var(--muted);font-size:0.875rem;">${status === 'trialing' ? `Trial ends ${trialEnds}` : `Status: ${status}`}</span>
        </div>
        ${account.stripeSubscriptionId ? `<a href="${safeOrigin}/api/portal" class="btn btn-secondary" style="width:100%;margin-bottom:0.5rem;">Manage Subscription</a>` : ''}
        <form method="POST" action="${safeOrigin}/api/logout"><button type="submit" class="btn btn-danger" style="width:100%;">Log Out</button></form>
      </div>
      <div class="card">
        <div class="card-title">Your Menu Displays</div>
        <div id="sessions" style="color:var(--muted);">Loading...</div>
        ${active
          ? `<a href="${safeOrigin}/tv/new" class="btn btn-primary" style="width:100%;margin-top:1rem;">+ Create New Display</a>`
          : `<a href="${safeOrigin}/api/checkout" class="btn btn-primary" style="width:100%;margin-top:1rem;">Start 14-Day Free Trial</a>`}
      </div>
    `;
  }

  const formHtml = isAccount ? '' : `
    <div class="card">
      <div class="card-title">${isLogin ? 'Log In' : 'Create Account'}</div>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
      ${dubHavenEnabled ? `
      <a href="${safeOrigin}/auth/dubhaven${next ? '?next=' + encodeURIComponent(next) : ''}" class="btn btn-google" style="width:100%;margin-bottom:1rem;">
        Sign in with DubHaven
      </a>
      <div style="text-align:center;color:var(--muted);font-size:0.875rem;margin-bottom:1rem;">or use email</div>
      ` : ''}
      <form method="POST" action="${safeOrigin}/api/${isLogin ? 'login' : 'signup'}">
        ${next ? `<input type="hidden" name="next" value="${escapeHtml(next)}">` : ''}
        <div class="field"><label>Email</label><input type="email" name="email" required placeholder="you@example.com"></div>
        <div class="field"><label>Password</label><input type="password" name="password" required minlength="8" placeholder="••••••••"></div>
        <button type="submit" class="btn btn-primary" style="width:100%;">${isLogin ? 'Log In' : 'Start Free Trial'}</button>
      </form>
      <div class="switch-link">
        ${isLogin ? `Don't have an account? <a href="${safeOrigin}/signup${next ? '?next=' + encodeURIComponent(next) : ''}">Start free trial</a>` : `Already have an account? <a href="${safeOrigin}/login${next ? '?next=' + encodeURIComponent(next) : ''}">Log in</a>`}
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${isLogin ? 'Log In' : isSignup ? 'Start Free Trial' : 'Account'} | DubMenu</title>
  <meta name="description" content="${isSignup ? 'Start your 14-day free trial of DubMenu.' : 'Manage your DubMenu account.'}">
  <link rel="canonical" href="${safeOrigin}/${isLogin ? 'login' : isSignup ? 'signup' : 'account'}">
  <style>
    :root{--bg:#0a0f0d;--surface:rgba(255,255,255,0.04);--surface2:#2c2c2e;--border:rgba(255,255,255,0.08);--text:#f0f2f5;--muted:#889495;--primary:#10b981;--primary-dark:#0a9364;--danger:#ef4444;--radius:0.75rem;}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Inter,system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:1rem;}
    .nav{width:100%;max-width:520px;display:flex;justify-content:space-between;align-items:center;padding:1rem 0;margin-bottom:1.5rem;}
    .nav a.logo{font-weight:800;font-size:1.25rem;color:var(--text);display:flex;align-items:center;gap:0.5rem;}
    .nav a{color:var(--muted);font-size:0.875rem;}
    .card{width:100%;max-width:420px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;margin-bottom:1rem;}
    .card-title{font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:1.25rem;}
    .field{margin-bottom:1rem;}
    .field label{display:block;font-size:0.75rem;font-weight:600;color:var(--muted);margin-bottom:0.375rem;text-transform:uppercase;letter-spacing:0.04em;}
    .field input{width:100%;background:var(--surface2);border:none;border-radius:0.5rem;padding:0.75rem;color:var(--text);font-size:1rem;outline:none;}
    .field input:focus{box-shadow:0 0 0 2px var(--primary);}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:0.375rem;padding:0.75rem 1.25rem;border:none;border-radius:0.5rem;font-size:0.9375rem;font-weight:600;cursor:pointer;font-family:inherit;color:#fff;}
    .btn-primary{background:var(--primary);color:#000;}
    .btn-secondary{background:var(--surface2);}
    .btn-danger{background:var(--danger);}
    .btn-google{background:#fff;color:#3c4043;}
    .btn-google:hover{background:#f2f2f2;}
    .error{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:0.75rem;border-radius:0.5rem;margin-bottom:1rem;font-size:0.875rem;}
    .switch-link{text-align:center;margin-top:1rem;color:var(--muted);font-size:0.875rem;}
    .switch-link a{color:var(--primary);font-weight:600;}
    .status-badge{display:inline-flex;padding:0.25rem 0.75rem;border-radius:1rem;font-size:0.75rem;font-weight:700;}
    .status-badge.active{background:rgba(16,185,129,0.15);color:var(--primary);}
    .status-badge.inactive{background:rgba(239,68,68,0.15);color:var(--danger);}
    .session-item{display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:var(--surface2);border-radius:0.5rem;margin-bottom:0.5rem;}
    .session-item a{color:var(--primary);font-size:0.875rem;word-break:break-all;}
  </style>
</head>
<body>
  <nav class="nav">
    <a href="${safeOrigin}/" class="logo">DUBMENU</a>
    <a href="${safeOrigin}/pricing">Pricing</a>
  </nav>
  ${formHtml}
  ${accountHtml}
  ${isAccount ? `<script>
    async function loadSessions(){
      try{
        const res=await fetch('/api/sessions',{credentials:'same-origin'});
        if(!res.ok){
          const err=await res.text().catch(()=>'Unknown error');
          throw new Error('HTTP '+res.status+': '+err);
        }
        const data=await res.json();
        const container=document.getElementById('sessions');
        if(!data.sessions||!data.sessions.length){container.innerHTML='<p style="color:var(--muted);">No displays yet. Create one to get started.</p>';return;}
        container.innerHTML=data.sessions.map(s=>'<div class="session-item"><a href="${safeOrigin}/config/' + s + '" target="_blank">' + s + '</a></div>').join('');
      }catch(e){document.getElementById('sessions').innerHTML='<p style="color:#ef4444;">Failed to load sessions.</p>';}
    }
    loadSessions();
  </script>` : ''}
</body>
</html>`;
}
