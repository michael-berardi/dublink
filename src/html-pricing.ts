export function pricingPage(origin: string): string {
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
  <title>Pricing | DubMenu - Digital Menu Boards for Dispensaries</title>
  <meta name="description" content="Simple pricing for DubMenu. $99/month with no setup fee, no hardware required, and no long-term contract. Start with a 2-week free trial.">
  <link rel="canonical" href="${safeOrigin}/pricing">
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
    .hero p{font-size:1.125rem;color:var(--text-faint);margin-bottom:2rem;}
    .pricing-card{max-width:400px;margin:0 auto 3rem;padding:2.5rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);text-align:center;}
    .price{font-size:4rem;font-weight:800;color:var(--primary);line-height:1;}
    .price-period{font-size:1.25rem;color:var(--text-faint);margin-bottom:1.5rem;}
    .features{text-align:left;margin:2rem 0;}
    .features li{list-style:none;padding:0.5rem 0;color:var(--text-faint);display:flex;align-items:center;gap:0.75rem;}
    .features li::before{content:"✓";color:var(--primary);font-weight:700;}
    .cta-button{display:inline-block;background:var(--primary);color:#0a0f0d;padding:1rem 2rem;border-radius:var(--radius);font-weight:600;font-size:1.125rem;transition:background var(--transition);margin-top:1rem;}
    .cta-button:hover{background:var(--primary-dark);}
    .comparison{max-width:800px;margin:0 auto;padding:0 1.5rem 4rem;}
    .comparison h2{font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;text-align:center;}
    .comparison-table{width:100%;border-collapse:collapse;}
    .comparison-table th,.comparison-table td{padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);}
    .comparison-table th{color:var(--text-faint);font-weight:600;font-size:0.875rem;}
    .comparison-table td{color:var(--text);}
    .comparison-table .check{color:var(--primary);font-weight:700;}
    .comparison-table .x{color:var(--text-faint);}
    .faq{max-width:800px;margin:0 auto;padding:0 1.5rem 4rem;}
    .faq h2{font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;}
    .faq-item{margin-bottom:1.5rem;padding:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);}
    .faq-item h3{font-size:1.125rem;font-weight:600;margin-bottom:0.5rem;}
    .faq-item p{color:var(--text-faint);}
    footer{padding:2rem 1.5rem;text-align:center;color:var(--text-faint);font-size:0.875rem;border-top:1px solid var(--border);margin-top:4rem;}
    @media(max-width:640px){
      .nav-toggle{display:block;}
      .nav-links{display:none;position:absolute;top:100%;left:0;right:0;background:rgba(10,15,13,0.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);flex-direction:column;padding:1rem;gap:1rem;}
      .nav-links.open{display:flex;}
      .nav-links a{color:var(--text);}
      .hero h1{font-size:2rem;}
      .nav{padding:0.75rem 1rem;}
      .price{font-size:3rem;}
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
    <h1>Simple Pricing</h1>
    <p>One plan. Every feature. No hidden fees.</p>
  </div>

  <div class="pricing-card">
    <div class="price">$99</div>
    <div class="price-period">per month</div>
    <ul class="features">
      <li>Unlimited products & categories</li>
      <li>Unlimited screens</li>
      <li>Real-time updates from your phone</li>
      <li>Dutchie menu import</li>
      <li>12 color themes</li>
      <li>3 text sizes</li>
      <li>Promotional banners</li>
      <li>Compliance disclaimers</li>
      <li>Email support</li>
    </ul>
    <a href="${safeOrigin}/signup" class="cta-button">Start Free Trial</a>
    <p style="margin-top:1rem;color:var(--text-faint);font-size:0.875rem;">2-week free trial. No credit card required.</p>
    <p style="margin-top:1.25rem;color:var(--text-faint);font-size:0.8125rem;"><strong style="color:var(--text);">Coming soon:</strong> custom domains and multi-location tools. <a href="${safeOrigin}/contact">Contact us</a> if you need these for launch.</p>
  </div>

  <div class="comparison">
    <h2>How We Compare</h2>
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Feature</th>
          <th>DubMenu</th>
          <th>Competitors</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Monthly Price</td><td class="check">$99</td><td class="x">$200-500</td></tr>
        <tr><td>Setup Fee</td><td class="check">$0</td><td class="x">$500+</td></tr>
        <tr><td>Hardware Required</td><td class="check">No</td><td class="x">Yes</td></tr>
        <tr><td>Long-Term Contract</td><td class="check">No</td><td class="x">Often required</td></tr>
        <tr><td>Real-Time Updates</td><td class="check">Yes</td><td class="check">Yes</td></tr>
        <tr><td>Phone Control</td><td class="check">Yes</td><td class="x">Limited</td></tr>
        <tr><td>Dutchie Import</td><td class="check">Yes</td><td class="x">No</td></tr>
        <tr><td>Unlimited Screens</td><td class="check">Yes</td><td class="x">Extra cost</td></tr>
      </tbody>
    </table>
  </div>

  <div class="faq">
    <h2>Pricing FAQ</h2>
    <div class="faq-item">
      <h3>Is there really no setup fee?</h3>
      <p>Correct. Zero setup fee. Zero onboarding cost. Zero hidden charges.</p>
    </div>
    <div class="faq-item">
      <h3>Can I cancel anytime?</h3>
      <p>Yes. No long-term contract. Cancel whenever you want. Your data is exportable.</p>
    </div>
    <div class="faq-item">
      <h3>Do I need to buy hardware?</h3>
      <p>No. DubMenu works on any screen with a web browser. Use your existing TV, tablet, or monitor.</p>
    </div>
    <div class="faq-item">
      <h3>What happens after the free trial?</h3>
      <p>After 2 weeks, choose to continue at $99/month or cancel. No obligation.</p>
    </div>
  </div>

  <footer>
    <p>&copy; 2026 DubMenu. A <a href="https://dubhaven.com" target="_blank">DubHaven</a> product.</p>
  </footer>
</body>
</html>`;
}