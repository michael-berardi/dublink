export function aboutPage(origin: string): string {
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const safeOrigin = escapeHtml(origin);
  const TV_ORIGIN = 'https://tv.dubmenu.com';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About | DubMenu - Digital Menu Boards for Dispensaries</title>
  <meta name="description" content="Learn about DubMenu. We build digital menu boards for cannabis dispensaries. Part of the DubHaven ecosystem. $99/month. Free 2-week trial.">
  <link rel="canonical" href="${safeOrigin}/about">
  <style>
    :root{--bg:#0a0f0d;--surface:rgba(255,255,255,0.04);--surface-hover:rgba(255,255,255,0.08);--border:rgba(255,255,255,0.08);--text:#f0f2f5;--text-faint:#889495;--primary:#10b981;--primary-dark:#0a9364;--radius:0.75rem;--shadow:0 4px 24px rgba(0,0,0,0.4);--transition:0.2s ease;}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Inter,system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh;}
    a{color:var(--primary);text-decoration:none;transition:color var(--transition);}
    a:hover{color:var(--text);}
    .nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1.5rem;background:rgba(10,15,13,0.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);}
    .nav a.logo{font-weight:700;font-size:1.125rem;color:var(--text);display:flex;align-items:center;gap:0.5rem;}
    .nav a.logo svg{width:28px;height:28px;color:var(--primary);}
    .nav-links{display:flex;align-items:center;gap:1.25rem;}
    .nav-links a{font-size:0.875rem;color:var(--text-faint);font-weight:500;transition:color var(--transition);}
    .nav-links a:hover{color:var(--text);}
    .nav-toggle{display:none;background:none;border:none;color:var(--text);cursor:pointer;padding:0.5rem;}
    .nav-toggle svg{width:24px;height:24px;}
    .nav-cta{background:var(--primary);color:#0a0f0d;padding:0.5rem 1rem;border-radius:0.5rem;font-weight:600;font-size:0.875rem;transition:background var(--transition);}
    .nav-cta:hover{background:var(--primary-dark);color:#0a0f0d;}
    .hero{padding:8rem 1.5rem 3rem;text-align:center;max-width:800px;margin:0 auto;}
    .hero h1{font-size:2.5rem;font-weight:800;letter-spacing:-0.03em;line-height:1.1;margin-bottom:1.5rem;}
    .hero p{font-size:1.125rem;color:var(--text-faint);}
    .content{max-width:800px;margin:0 auto;padding:0 1.5rem 4rem;}
    .section{margin:3rem 0;padding:2rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);}
    .section h2{font-size:1.5rem;font-weight:700;margin-bottom:1rem;}
    .section p{color:var(--text-faint);margin-bottom:1rem;}
    .section p:last-child{margin-bottom:0;}
    .team{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;margin:2rem 0;}
    .team-member{padding:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);text-align:center;}
    .team-member h3{font-size:1.25rem;font-weight:700;margin-bottom:0.5rem;}
    .team-member p{color:var(--text-faint);font-size:0.875rem;}
    footer{padding:2rem 1.5rem;text-align:center;color:var(--text-faint);font-size:0.875rem;border-top:1px solid var(--border);margin-top:4rem;}
    @media(max-width:640px){
      .nav-toggle{display:block;}
      .nav-links{display:none;position:absolute;top:100%;left:0;right:0;background:rgba(10,15,13,0.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);flex-direction:column;padding:1rem;gap:1rem;}
      .nav-links.open{display:flex;}
      .nav-links a{color:var(--text);}
      .hero h1{font-size:2rem;}
      .nav{padding:0.75rem 1rem;}
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="${safeOrigin}/" class="logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      DUBMENU
    </a>
    <div class="nav-links">
      <a href="${safeOrigin}/">Home</a>
      <a href="${TV_ORIGIN}/tv/demo" target="_blank">Demo</a>
      <a href="${safeOrigin}/pricing">Pricing</a>
      <a href="${safeOrigin}/faq">FAQ</a>
      <a href="${safeOrigin}/about">About</a>
      <a href="${safeOrigin}/contact">Contact</a>
      <a href="${TV_ORIGIN}/tv/demo" class="nav-cta" target="_blank">Launch TV</a>
    </div>
    <button class="nav-toggle" aria-label="Toggle menu" onclick="document.querySelector('.nav-links').classList.toggle('open')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
  </nav>

  <div class="hero">
    <h1>About DubMenu</h1>
    <p>We build digital menu boards for cannabis dispensaries.</p>
  </div>

  <div class="content">
    <div class="section">
      <h2>Our Story</h2>
      <p>DubMenu was built by the team at DubHaven, a software consultancy focused on the cannabis industry. We saw dispensaries struggling with outdated paper menus, expensive digital signage, and complicated hardware setups.</p>
      <p>We built DubMenu to solve these problems. It is a web-based menu board that runs on any screen. No hardware. No setup fee. No long-term contract. Just a simple, affordable way to display your products professionally.</p>
    </div>

    <div class="section">
      <h2>Our Mission</h2>
      <p>We believe every dispensary deserves a professional menu display, regardless of size or budget. Our mission is to make digital menu boards accessible, affordable, and easy to use for every cannabis operator.</p>
    </div>

    <div class="section">
      <h2>The DubHaven Ecosystem</h2>
      <p>DubMenu is part of the DubHaven ecosystem, which includes DubLedger (cannabis POS) and DubHaven (cannabis software consultancy). Together, we provide a complete suite of tools for cannabis operators.</p>
    </div>

    <div class="section">
      <h2>Our Team</h2>
      <p>We are a small, dedicated team of engineers and designers who understand the cannabis industry. We have built systems for dispensaries, cultivators, and brands across the country.</p>
      <div class="team">
        <div class="team-member">
          <h3>Sam Leibowitz</h3>
          <p>Founder & CEO</p>
        </div>
        <div class="team-member">
          <h3>Mike Berardi</h3>
          <p>Technical Co-Founder</p>
        </div>
      </div>
    </div>
  </div>

  <footer>
    <p>&copy; 2026 DubMenu. A <a href="https://dubhaven.com" target="_blank">DubHaven</a> product.</p>
  </footer>
</body>
</html>`;
}