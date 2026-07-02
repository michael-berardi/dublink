export function termsPage(origin: string): string {
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
  <title>Terms of Service | DubMenu</title>
  <meta name="description" content="DubMenu terms of service.">
  <link rel="canonical" href="${safeOrigin}/terms">
  <style>
    :root{--bg:#0a0f0d;--surface:rgba(255,255,255,0.04);--border:rgba(255,255,255,0.08);--text:#f0f2f5;--muted:#889495;--primary:#10b981;}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Inter,system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh;}
    .nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1.5rem;background:rgba(10,15,13,0.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);}
    .nav a.logo{font-weight:700;font-size:1.125rem;color:var(--text);}
    .nav-links{display:flex;align-items:center;gap:1.25rem;}
    .nav-links a{font-size:0.875rem;color:var(--muted);font-weight:500;}
    .nav-links a:hover{color:var(--text);}
    .hero{padding:8rem 1.5rem 3rem;text-align:center;max-width:800px;margin:0 auto;}
    .hero h1{font-size:2.5rem;font-weight:800;}
    .content{max-width:800px;margin:0 auto;padding:0 1.5rem 4rem;}
    .section{margin-bottom:2rem;}
    .section h2{font-size:1.25rem;font-weight:700;margin-bottom:0.75rem;}
    .section p{color:var(--muted);margin-bottom:1rem;}
    footer{padding:2rem 1.5rem;text-align:center;color:var(--muted);font-size:0.875rem;border-top:1px solid var(--border);}
  </style>
</head>
<body>
  <nav class="nav">
    <a href="${safeOrigin}/" class="logo">DUBMENU</a>
    <div class="nav-links">
      <a href="${safeOrigin}/">Home</a>
      <a href="${safeOrigin}/pricing">Pricing</a>
      <a href="${safeOrigin}/faq">FAQ</a>
      <a href="${safeOrigin}/contact">Contact</a>
    </div>
  </nav>
  <div class="hero">
    <h1>Terms of Service</h1>
  </div>
  <div class="content">
    <div class="section">
      <h2>1. Acceptance of Terms</h2>
      <p>By using DubMenu, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
    </div>
    <div class="section">
      <h2>2. Description of Service</h2>
      <p>DubMenu provides digital menu board software. You are responsible for the content you display, including ensuring it complies with all applicable laws and regulations in your jurisdiction.</p>
    </div>
    <div class="section">
      <h2>3. Accounts and Subscriptions</h2>
      <p>Accounts are for individual businesses. You may not share login credentials. Subscriptions renew monthly unless canceled. You may cancel at any time through the billing portal or by contacting support.</p>
    </div>
    <div class="section">
      <h2>4. Free Trial</h2>
      <p>New accounts are eligible for a 14-day free trial. After the trial, you will be charged monthly unless you cancel. We reserve the right to end a trial early if we detect abuse.</p>
    </div>
    <div class="section">
      <h2>5. Acceptable Use</h2>
      <p>You may not use DubMenu to display illegal content, infringe intellectual property, or violate any third-party terms. We may suspend accounts for abuse or non-payment.</p>
    </div>
    <div class="section">
      <h2>6. Data and Content</h2>
      <p>You retain ownership of your menu content. You grant us a limited license to store and display it as needed to provide the service. We do not claim ownership of your content.</p>
    </div>
    <div class="section">
      <h2>7. Limitation of Liability</h2>
      <p>DubMenu is provided as-is. We are not liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount you paid in the 12 months preceding the claim.</p>
    </div>
    <div class="section">
      <h2>8. Modifications</h2>
      <p>We may modify these terms. Material changes will be notified by email or through the service. Continued use after changes constitutes acceptance.</p>
    </div>
    <div class="section">
      <h2>9. Governing Law</h2>
      <p>These terms are governed by the laws of the State of New York, without regard to conflict of law principles.</p>
    </div>
    <div class="section">
      <h2>10. Contact</h2>
      <p>Questions? Email support@dubmenu.com.</p>
    </div>
  </div>
  <footer>
    <p>&copy; 2026 DubMenu. A <a href="https://dubhaven.com">DubHaven</a> product.</p>
  </footer>
</body>
</html>`;
}
