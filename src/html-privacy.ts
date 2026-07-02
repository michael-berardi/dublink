export function privacyPage(origin: string): string {
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
  <title>Privacy Policy | DubMenu</title>
  <meta name="description" content="DubMenu privacy policy.">
  <link rel="canonical" href="${safeOrigin}/privacy">
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
    <h1>Privacy Policy</h1>
  </div>
  <div class="content">
    <div class="section">
      <h2>1. Information We Collect</h2>
      <p>We collect your email address and password hash when you create an account. When you create a menu display, we store the menu content you provide (product names, prices, images, and branding settings). We also collect basic analytics about how visitors interact with our marketing pages.</p>
    </div>
    <div class="section">
      <h2>2. How We Use Information</h2>
      <p>We use your account information to provide access to the service, manage your subscription, and send you important service updates. We use your menu content to render your digital displays. We do not sell your personal information.</p>
    </div>
    <div class="section">
      <h2>3. Payment Information</h2>
      <p>We use Stripe to process payments. We do not store your full credit card details. Stripe collects and processes payment information according to their privacy policy.</p>
    </div>
    <div class="section">
      <h2>4. Data Security</h2>
      <p>We use industry-standard encryption and access controls to protect your data. Passwords are hashed using PBKDF2. All data is transmitted over HTTPS.</p>
    </div>
    <div class="section">
      <h2>5. Your Rights</h2>
      <p>You can access, update, or delete your account and menu data at any time by contacting support@dubmenu.com. You can export your menu data from the control panel.</p>
    </div>
    <div class="section">
      <h2>6. Cookies</h2>
      <p>We use essential cookies to keep you logged in. We do not use third-party advertising cookies.</p>
    </div>
    <div class="section">
      <h2>7. Changes</h2>
      <p>We may update this privacy policy from time to time. We will notify you of material changes by email or through the service.</p>
    </div>
    <div class="section">
      <h2>8. Contact</h2>
      <p>Questions about this privacy policy? Email support@dubmenu.com.</p>
    </div>
  </div>
  <footer>
    <p>&copy; 2026 DubMenu. A <a href="https://dubhaven.com">DubHaven</a> product.</p>
  </footer>
</body>
</html>`;
}
