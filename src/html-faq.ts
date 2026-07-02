export function faqPage(origin: string): string {
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
  <title>FAQ | DubMenu - Digital Menu Boards for Dispensaries</title>
  <meta name="description" content="Frequently asked questions about DubMenu. Learn about pricing, setup, hardware requirements, and more. $99/month. Free 2-week trial.">
  <link rel="canonical" href="${safeOrigin}/faq">
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
    .faq-content{max-width:800px;margin:0 auto;padding:0 1.5rem 4rem;}
    .faq-item{margin-bottom:1.5rem;padding:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);}
    .faq-item h2{font-size:1.25rem;font-weight:700;margin-bottom:0.75rem;}
    .faq-item p{color:var(--text-faint);}
    .faq-item ul{margin-top:0.75rem;margin-left:1.5rem;color:var(--text-faint);}
    .faq-item li{margin-bottom:0.5rem;}
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
    <h1>Frequently Asked Questions</h1>
    <p>Everything you need to know about DubMenu.</p>
  </div>

  <div class="faq-content">
    <div class="faq-item">
      <h2>What is DubMenu?</h2>
      <p>DubMenu is a digital menu board system for cannabis dispensaries. It turns any screen into a live product display that you control from your phone. Update prices, products, and stock status in real time.</p>
    </div>

    <div class="faq-item">
      <h2>How much does DubMenu cost?</h2>
      <p>DubMenu is $99 per month. There is no setup fee, no hardware requirement, and no long-term contract. Every feature is included. Start with a 2-week free trial.</p>
    </div>

    <div class="faq-item">
      <h2>Do I need special hardware?</h2>
      <p>No. DubMenu works on any device with a web browser, including smart TVs, tablets, computers, and phones. Use your existing screens.</p>
    </div>

    <div class="faq-item">
      <h2>How do I set it up?</h2>
      <p>Open tv.dubmenu.com on your TV. A pairing code appears. Scan it with your phone, and you are in the control panel. Add products, set prices, pick a theme, and your menu is live. Setup takes under 60 seconds.</p>
    </div>

    <div class="faq-item">
      <h2>Can I update prices from my phone?</h2>
      <p>Yes. DubMenu is designed to be controlled from a smartphone. Make changes from anywhere, and they appear on every screen instantly.</p>
    </div>

    <div class="faq-item">
      <h2>Does it work with multiple screens?</h2>
      <p>Yes. Each screen gets its own pairing code and its own menu, and you can manage them all from one phone. Configure every display independently to show whatever you want.</p>
    </div>

    <div class="faq-item">
      <h2>Can I import my existing menu?</h2>
      <p>Yes. If you use Dutchie for online ordering, paste your Dutchie URL and DubMenu imports your products, prices, THC content, strain types, and images automatically.</p>
    </div>

    <div class="faq-item">
      <h2>Is there a free trial?</h2>
      <p>Yes. Every new account gets a 2-week free trial. No credit card required. Test the system with your actual products before paying anything.</p>
    </div>

    <div class="faq-item">
      <h2>Can I cancel anytime?</h2>
      <p>Yes. There is no long-term contract. Cancel whenever you want. Your menu data is exportable, so you can take it with you.</p>
    </div>

    <div class="faq-item">
      <h2>What product types are supported?</h2>
      <p>DubMenu supports unlimited categories, including flower, pre-rolls, vapes, edibles, concentrates, tinctures, CBD, and accessories.</p>
    </div>

    <div class="faq-item">
      <h2>Does it work for medical dispensaries?</h2>
      <p>Yes. DubMenu works for both recreational and medical dispensaries. Customize the disclaimer text for your state requirements.</p>
    </div>

    <div class="faq-item">
      <h2>How is customer support?</h2>
      <p>Email support with under 24-hour response time. Most issues are resolved within one business day.</p>
    </div>
  </div>

  <footer>
    <p>&copy; 2026 DubMenu. A <a href="https://dubhaven.com" target="_blank">DubHaven</a> product.</p>
  </footer>
</body>
</html>`;
}