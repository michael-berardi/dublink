import type { Account, BusinessMember, BusinessInvitation } from './auth';

export function authPage(
  origin: string,
  mode: 'login' | 'signup' | 'account' | 'invite',
  account?: Account,
  error?: string,
  dubHavenEnabled: boolean = false,
  next?: string,
  business?: {
    sessions: string[];
    members: BusinessMember[];
    pendingInvites: Array<Omit<BusinessInvitation, 'tokenHash'>>;
    isOwner: boolean;
  }
): string {
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const safeOrigin = escapeHtml(origin);
  const nextQuery = next ? '?next=' + encodeURIComponent(next) : '';
  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isAccount = mode === 'account';

  let accountHtml = '';
  if (isAccount && account) {
    const status = account.subscriptionStatus || 'inactive';
    const trialEnds = account.trialEndsAt ? new Date(account.trialEndsAt).toLocaleDateString() : 'N/A';
    const active = status === 'active' || (status === 'trialing' && !!account.trialEndsAt && account.trialEndsAt > Date.now());
    const isOwner = business?.isOwner ?? false;
    const accountHasMenu = Boolean(account.businessMenuSessionId || business?.sessions.length);
    const configSessionId = account.businessMenuSessionId || business?.sessions[0] || '';
    const statusLabel = active ? 'Active' : 'Inactive';
    let subscriptionActionHtml = '';
    if (isOwner && account.stripeSubscriptionId) {
      subscriptionActionHtml = `<a href="${safeOrigin}/api/portal" class="btn btn-secondary" style="width:100%;margin-bottom:0.5rem;">Manage Subscription</a>`;
    } else if (isOwner && !active) {
      subscriptionActionHtml = `<a href="${safeOrigin}/api/checkout" class="btn btn-primary" style="width:100%;margin-bottom:0.5rem;">Restart Subscription</a>`;
    }

    const onboardingHtml = `
      <div class="card">
        <h1 class="card-title">Welcome to DubMenu</h1>
        ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
        <p style="color:var(--muted);margin-bottom:1rem;">${active
          ? 'Name your business to create your first menu.'
          : 'Reactivate your subscription before creating a business menu.'}</p>
        ${active ? `
          <form method="POST" action="${safeOrigin}/api/business/onboarding">
            <div class="field"><label>Business Name</label><input type="text" name="businessName" required maxlength="100" placeholder="Green Leaf Dispensary"></div>
            <button type="submit" class="btn btn-primary" style="width:100%;">Create Menu</button>
          </form>
        ` : `<a href="${safeOrigin}/api/checkout" class="btn btn-primary" style="width:100%;">Restart Subscription</a>`}
      </div>
    `;


    const membersHtml = business?.members.length
      ? `<ul style="list-style:none;padding:0;margin:0;">${business.members
          .map(
            (m) =>
              `<li style="padding:0.5rem;background:var(--surface2);border-radius:0.5rem;margin-bottom:0.5rem;"><span style="font-weight:600;">${escapeHtml(m.email)}</span> <span style="color:var(--muted);font-size:0.875rem;text-transform:uppercase;">${escapeHtml(m.role)}</span></li>`
          )
          .join('')}</ul>`
      : '<p style="color:var(--muted);">No team members yet.</p>';

    const pendingInvitesHtml = business?.pendingInvites.length
      ? `<ul style="list-style:none;padding:0;margin:0;">${business.pendingInvites
          .map(
            (i) =>
              `<li style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:var(--surface2);border-radius:0.5rem;margin-bottom:0.5rem;"><span>${escapeHtml(i.email)}</span><span style="color:var(--muted);font-size:0.75rem;">expires ${new Date(i.expiresAt).toLocaleDateString()}</span></li>`
          )
          .join('')}</ul>`
      : '<p style="color:var(--muted);">No pending invitations.</p>';

    const manageHtml = `
      <div class="card">
        ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
        <h1 class="card-title">Account</h1>
        <p style="color:var(--muted);margin-bottom:1rem;">Email: ${escapeHtml(account.email)}</p>
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
          <span class="status-badge ${active ? 'active' : 'inactive'}">${statusLabel}</span>
          <span style="color:var(--muted);font-size:0.875rem;">${status === 'trialing' ? `Trial ends ${trialEnds}` : `Status: ${status}`}</span>
        </div>
        ${isOwner ? `
          <div style="margin-bottom:1rem;">
            <h2 class="card-title" style="margin-bottom:0.75rem;">Business</h2>
            <form method="POST" action="${safeOrigin}/api/business/name" style="display:flex;gap:0.5rem;">
              <input type="text" name="businessName" value="${escapeHtml(account.businessName || '')}" required maxlength="100" style="flex:1;background:var(--surface2);border:none;border-radius:0.5rem;padding:0.75rem;color:var(--text);">
              <button type="submit" class="btn btn-secondary">Update</button>
            </form>
          </div>
        ` : `<p style="color:var(--muted);margin-bottom:1rem;">Business: ${escapeHtml(account.businessName || '')}</p>`}
        ${subscriptionActionHtml}
        <form method="POST" action="${safeOrigin}/api/logout"><button type="submit" class="btn btn-danger" style="width:100%;">Log Out</button></form>
      </div>
      <div class="card">
        <h2 class="card-title">Menu Configuration</h2>
        <p style="color:var(--muted);margin-bottom:1rem;">Configure the 1-4 screens for your business menu.</p>
        ${active
          ? `<a href="${safeOrigin}/config/${escapeHtml(configSessionId)}" class="btn btn-primary" style="width:100%;">Open Menu Configuration</a>`
          : `<p style="color:var(--muted);">Reactivate the business subscription to edit this menu.</p>`}
      </div>
      <div class="card">
        <h2 class="card-title">Team Members</h2>
        ${membersHtml}
      </div>
      ${isOwner ? `
        <div class="card">
          <h2 class="card-title">Pending Invitations</h2>
          ${pendingInvitesHtml}
          <h3 class="card-title" style="margin-top:1.25rem;">Invite a Manager</h3>
          <form method="POST" action="${safeOrigin}/api/business/invite">
            <div class="field" style="display:flex;gap:0.5rem;">
              <input type="email" name="email" required placeholder="manager@example.com" style="flex:1;background:var(--surface2);border:none;border-radius:0.5rem;padding:0.75rem;color:var(--text);">
              <button type="submit" class="btn btn-primary">Send</button>
            </div>
          </form>
        </div>
      ` : ''}
    `;

    accountHtml = accountHasMenu ? manageHtml : onboardingHtml;
  }

  const formHtml = isAccount ? '' : `
    <div class="card">
      <h1 class="card-title">${isLogin ? 'Log In' : 'Create Account'}</h1>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
      ${dubHavenEnabled ? `
      <a href="${safeOrigin}/auth/dubhaven${nextQuery}" class="btn btn-google" style="width:100%;margin-bottom:1rem;">
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
        ${isLogin ? `Don't have an account? <a href="${safeOrigin}/signup${nextQuery}">Start free trial</a>` : `Already have an account? <a href="${safeOrigin}/login${nextQuery}">Log in</a>`}
      </div>
    </div>
  `;

  let pageTitle = 'Account';
  let canonicalPath = 'account';
  if (isLogin) {
    pageTitle = 'Log In';
    canonicalPath = 'login';
  } else if (isSignup) {
    pageTitle = 'Start Free Trial';
    canonicalPath = 'signup';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} | DubMenu</title>
  <meta name="description" content="${isSignup ? 'Start your 14-day free trial of DubMenu.' : 'Manage your DubMenu account.'}">
  <link rel="canonical" href="${safeOrigin}/${canonicalPath}">
  <style>
    :root{--bg:#0a0f0d;--surface:rgba(255,255,255,0.04);--surface2:#2c2c2e;--border:rgba(255,255,255,0.08);--text:#f0f2f5;--muted:#889495;--primary:#10b981;--primary-dark:#0a9364;--danger:#ef4444;--radius:0.75rem;}
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
  </body>
</html>`;
}

export function inviteAcceptPage(
  origin: string,
  token: string,
  businessName: string,
  email: string,
  error?: string
): string {
  const escapeHtml = (str: string) =>
    str
      .replace(/\u0026/g, '\u0026amp;')
      .replace(/\u003c/g, '\u0026lt;')
      .replace(/\u003e/g, '\u0026gt;')
      .replace(/"/g, '\u0026quot;')
      .replace(/'/g, '\u0026#39;');
  const safeOrigin = escapeHtml(origin);
  const safeToken = escapeHtml(token);
  const safeBusinessName = escapeHtml(businessName);
  const safeEmail = escapeHtml(email);
  const errorHtml = error ? `<div class="error">${escapeHtml(error)}</div>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accept Invitation | DubMenu</title>
  <link rel="canonical" href="${safeOrigin}/invite/${safeToken}">
  <style>
    :root{--bg:#0a0f0d;--surface:rgba(255,255,255,0.04);--surface2:#2c2c2e;--border:rgba(255,255,255,0.08);--text:#f0f2f5;--muted:#889495;--primary:#10b981;--primary-dark:#0a9364;--danger:#ef4444;--radius:0.75rem;}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Inter,system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:1rem;}
    .nav{width:100%;max-width:520px;display:flex;justify-content:space-between;align-items:center;padding:1rem 0;margin-bottom:1.5rem;}
    .nav a.logo{font-weight:800;font-size:1.25rem;color:var(--text);text-decoration:none;}
    .nav a{color:var(--muted);font-size:0.875rem;text-decoration:none;}
    .card{width:100%;max-width:420px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;margin-bottom:1rem;}
    .card-title{font-size:1.375rem;font-weight:700;margin-bottom:1.25rem;}
    p{margin-bottom:1rem;color:var(--muted);line-height:1.5;}
    .btn{display:inline-flex;align-items:center;justify-content:center;padding:0.75rem 1.25rem;border:none;border-radius:0.5rem;font-size:0.9375rem;font-weight:600;cursor:pointer;font-family:inherit;color:#fff;background:var(--primary);width:100%;}
    .btn:hover{background:var(--primary-dark);}
    .error{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:0.75rem;border-radius:0.5rem;margin-bottom:1rem;font-size:0.875rem;}
    strong{color:var(--text);}
  </style>
</head>
<body>
  <nav class="nav">
    <a href="${safeOrigin}/" class="logo">DUBMENU</a>
    <a href="${safeOrigin}/pricing">Pricing</a>
  </nav>
  <div class="card">
    <h1 class="card-title">Accept Invitation</h1>
    ${errorHtml}
    <p>You've been invited to manage <strong>${safeBusinessName}</strong> on DubMenu.</p>
    <p>This invitation is for <strong>${safeEmail}</strong>.</p>
    <form method="POST" action="${safeOrigin}/invite/${safeToken}">
      <button type="submit" class="btn">Accept Invitation</button>
    </form>
  </div>
</body>
</html>`;
}
