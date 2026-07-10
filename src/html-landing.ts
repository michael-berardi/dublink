export function landingPage(origin: string): string {
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
  <title>DubMenu — Digital Menu Boards for Cannabis Dispensaries</title>
  <meta name="description" content="Turn any TV into a real-time cannabis menu board. Scan to configure from your phone. No app, no install, no hassle.">
  <link rel="canonical" href="${safeOrigin}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="DubMenu">
  <meta property="og:title" content="DubMenu — Digital Menu Boards for Cannabis Dispensaries">
  <meta property="og:description" content="Turn any TV into a real-time cannabis menu board. Scan to configure from your phone. No app, no install, no hassle.">
  <meta property="og:url" content="${safeOrigin}/">
  <meta property="og:image" content="${safeOrigin}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="DubMenu digital menu boards for dispensaries">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="DubMenu — Digital Menu Boards for Cannabis Dispensaries">
  <meta name="twitter:description" content="Turn any TV into a real-time cannabis menu board. Scan to configure from your phone. No app, no install, no hassle.">
  <meta name="twitter:image" content="${safeOrigin}/og-image.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "DubMenu",
        "url": "${safeOrigin}/",
        "sameAs": [
          "https://dubhaven.com"
        ]
      },
      {
        "@type": "WebSite",
        "name": "DubMenu",
        "url": "${safeOrigin}/"
      }
    ]
  }
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #0a0f0d;
      --bg-elev: #111815;
      --bg-card: rgba(20, 28, 24, 0.6);
      --accent: #10b981;
      --accent-dim: rgba(16, 185, 129, 0.12);
      --accent-glow: rgba(16, 185, 129, 0.35);
      --text: #f0f0f0;
      --text-muted: #9ca3af;
      --text-faint: #6b7280;
      --border: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.15);
      --glass-bg: rgba(20, 28, 24, 0.45);
      --glass-border: rgba(255, 255, 255, 0.1);
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    a { color: var(--accent); text-decoration: none; transition: opacity 0.2s; }
    a:hover { opacity: 0.85; }

    /* Nav */
    .nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      background: rgba(10, 15, 13, 0.75);
      border-bottom: 1px solid var(--border);
      transition: background 0.3s;
    }
    .nav-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .nav-logo {
      font-size: 1.5rem;
      font-weight: 900;
      color: var(--accent);
      letter-spacing: -0.03em;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .nav-logo svg { width: 28px; height: 28px; }
    .nav-links { display: flex; gap: 2rem; align-items: center; }
    .nav-links a { color: var(--text-muted); font-size: 0.875rem; font-weight: 600; transition: color 0.2s; }
    .nav-links a:hover { color: var(--text); }
    .nav-toggle { display: none; background: none; border: none; color: var(--text); cursor: pointer; padding: 0.5rem; }
    .nav-toggle svg { width: 24px; height: 24px; }
    .nav-cta {
      background: var(--accent);
      color: #000;
      padding: 0.625rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 0.875rem;
      transition: transform 0.15s, opacity 0.15s;
    }
    .nav-cta:hover { opacity: 0.9; transform: translateY(-1px); }

    /* Hero */
    .hero {
      text-align: center;
      padding: 8rem 2rem 5rem;
      max-width: 900px;
      margin: 0 auto;
      position: relative;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.25rem;
      background: var(--accent-dim);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 2rem;
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 2rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background: var(--accent);
      border-radius: 50%;
      animation: pulse-dot 2s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }
    .hero h1 {
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1.05;
      margin-bottom: 1.5rem;
    }
    .gradient-text {
      background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero p {
      font-size: clamp(1.125rem, 2vw, 1.375rem);
      color: var(--text-muted);
      max-width: 640px;
      margin: 0 auto 2.5rem;
      line-height: 1.6;
    }
    .hero-cta-row {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 4rem;
    }
    .btn-primary {
      background: var(--accent);
      color: #000;
      padding: 1rem 2rem;
      border-radius: 0.75rem;
      font-weight: 800;
      font-size: 1.125rem;
      border: none;
      cursor: pointer;
      transition: transform 0.15s, opacity 0.15s, box-shadow 0.2s;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25);
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 8px 30px rgba(16, 185, 129, 0.35); }
    .btn-primary:active { transform: scale(0.97); }
    .btn-secondary {
      background: transparent;
      color: var(--text);
      padding: 1rem 2rem;
      border-radius: 0.75rem;
      font-weight: 700;
      font-size: 1.125rem;
      border: 1px solid var(--border-strong);
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.03);
    }
    .btn-secondary:hover { border-color: var(--accent); background: rgba(16, 185, 129, 0.05); }

    /* Mock TV */
    .mock-tv {
      position: relative;
      max-width: 700px;
      margin: 0 auto;
      border-radius: 1.5rem;
      background: var(--bg-elev);
      border: 1px solid var(--border);
      padding: 0.75rem;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
    .mock-tv-inner {
      border-radius: 1rem;
      background: linear-gradient(145deg, #0f1a15 0%, #1a2520 100%);
      aspect-ratio: 16/9;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(16, 185, 129, 0.1);
    }
    .mock-tv-content {
      text-align: center;
      padding: 2rem;
    }
    .mock-tv-content h3 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--accent);
      margin-bottom: 0.5rem;
    }
    .mock-tv-content p {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .mock-tv-qr {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    .mock-tv-qr img { width: 100%; height: 100%; object-fit: contain; border-radius: 0.25rem; }
    .mock-tv-stand {
      width: 120px;
      height: 8px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      margin: 0.5rem auto 0;
      border-radius: 4px;
    }

    /* Steps */
    .steps {
      padding: 6rem 2rem;
      max-width: 1100px;
      margin: 0 auto;
    }
    .section-title {
      text-align: center;
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 900;
      letter-spacing: -0.02em;
      margin-bottom: 3.5rem;
    }
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }
    .step-card {
      background: var(--glass-bg);
      backdrop-filter: blur(20px) saturate(1.5);
      -webkit-backdrop-filter: blur(20px) saturate(1.5);
      border: 1px solid var(--glass-border);
      border-radius: 1.5rem;
      padding: 2.5rem 2rem;
      text-align: center;
      transition: transform 0.2s, border-color 0.2s;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    .step-card:hover { transform: translateY(-4px); border-color: rgba(16, 185, 129, 0.2); }
    .step-num {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 900;
      color: var(--accent);
      margin: 0 auto 1.5rem;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
    }
    .step-card h3 {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 0.75rem;
    }
    .step-card p {
      color: var(--text-muted);
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    /* Features */
    .features {
      padding: 6rem 2rem;
      background: var(--bg-elev);
      position: relative;
    }
    .features::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border-strong), transparent);
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
    }
    .feature {
      background: var(--glass-bg);
      backdrop-filter: blur(16px) saturate(1.5);
      -webkit-backdrop-filter: blur(16px) saturate(1.5);
      border: 1px solid var(--glass-border);
      border-radius: 1.25rem;
      padding: 1.75rem;
      transition: transform 0.2s, border-color 0.2s;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
    .feature:hover { transform: translateY(-3px); border-color: rgba(16, 185, 129, 0.15); }
    .feature-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.75rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
      border: 1px solid rgba(16, 185, 129, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.1);
    }
    .feature-icon svg { width: 24px; height: 24px; color: var(--accent); }
    .feature h3 {
      font-size: 1.0625rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
    }
    .feature p {
      color: var(--text-muted);
      font-size: 0.875rem;
      line-height: 1.5;
    }

    /* Comparison */
    .comparison {
      padding: 6rem 2rem;
      max-width: 900px;
      margin: 0 auto;
    }
    .comparison-table-wrap {
      background: var(--glass-bg);
      backdrop-filter: blur(20px) saturate(1.5);
      -webkit-backdrop-filter: blur(20px) saturate(1.5);
      border: 1px solid var(--glass-border);
      border-radius: 1.5rem;
      overflow: hidden;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
    }
    .comparison-table thead {
      background: rgba(16, 185, 129, 0.08);
      border-bottom: 1px solid var(--glass-border);
    }
    .comparison-table th {
      padding: 1.25rem 1.5rem;
      text-align: left;
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--text);
      letter-spacing: 0.02em;
    }
    .comparison-table th:last-child { text-align: center; }
    .comparison-table td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 0.9375rem;
    }
    .comparison-table td:first-child { color: var(--text-muted); }
    .comparison-table td:last-child { text-align: center; }
    .check-yes { color: var(--accent); font-weight: 700; }
    .check-no { color: #ef4444; opacity: 0.6; }
    .comparison-table tbody tr:hover { background: rgba(16, 185, 129, 0.03); }
    .comparison-table tbody tr:last-child td { border-bottom: none; }

    /* CTA */
    .cta-section {
      text-align: center;
      padding: 6rem 2rem;
      max-width: 700px;
      margin: 0 auto;
      position: relative;
    }
    .cta-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border-strong), transparent);
    }
    .cta-section h2 {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 900;
      letter-spacing: -0.02em;
      margin-bottom: 1rem;
    }
    .cta-section p {
      color: var(--text-muted);
      font-size: 1.125rem;
      margin-bottom: 2rem;
    }

    /* Footer */
    .footer {
      border-top: 1px solid var(--border);
      padding: 4rem 2rem 3rem;
      background: var(--bg-elev);
    }
    .footer-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 3rem;
    }
    .footer-brand .footer-logo {
      font-size: 1.5rem;
      font-weight: 900;
      color: var(--accent);
      letter-spacing: -0.03em;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .footer-brand .footer-logo svg { width: 28px; height: 28px; }
    .footer-brand p {
      color: var(--text-faint);
      font-size: 0.875rem;
      line-height: 1.6;
      max-width: 280px;
    }
    .footer-col h4 {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 1.25rem;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .footer-col a {
      display: block;
      color: var(--text-faint);
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
      transition: color 0.2s;
    }
    .footer-col a:hover { color: var(--text); }
    .footer-bottom {
      max-width: 1100px;
      margin: 3rem auto 0;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--text-faint);
      font-size: 0.8125rem;
    }
    .footer-bottom a { color: var(--text-muted); }

    /* Responsive */
    @media (max-width: 1024px) {
      .features-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .steps-grid { grid-template-columns: 1fr; }
      .features-grid { grid-template-columns: repeat(2, 1fr); }
      .footer-inner { grid-template-columns: 1fr 1fr; gap: 2rem; }
      .comparison-table th,
      .comparison-table td { padding: 1rem; font-size: 0.875rem; }
      .hero { padding: 7rem 1.5rem 4rem; }
      .steps, .features, .comparison, .cta-section { padding: 4rem 1.5rem; }
      .nav-toggle { display: block; }
      .nav-links {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(10, 15, 13, 0.95);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--glass-border);
        flex-direction: column;
        padding: 1rem;
        gap: 1rem;
      }
      .nav-links.open { display: flex; }
      .nav-links a { color: var(--text); }
      .nav-inner { padding: 1rem; }
    }
    @media (max-width: 640px) {
      .features-grid { grid-template-columns: 1fr; }
      .footer-inner { grid-template-columns: 1fr; gap: 2rem; }
      .comparison-table th,
      .comparison-table td { padding: 0.875rem 1rem; }
      .comparison { padding-left: 0.75rem; padding-right: 0.75rem; }
      .comparison-table { table-layout: fixed; }
      .comparison-table th,
      .comparison-table td { padding: 0.75rem 0.3rem; font-size: 0.6875rem; line-height: 1.25; overflow-wrap: anywhere; }
      .comparison-table th:first-child,
      .comparison-table td:first-child { width: 40%; }
      .comparison-table th:not(:first-child),
      .comparison-table td:not(:first-child) { width: 20%; text-align: center; }
      .mock-tv-qr { width: 60px; height: 60px; }
      .mock-tv-qr svg { width: 44px; height: 44px; }
    }
  </style>
  <!-- Google tag (gtag.js) — DubMenu GA4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-GXC70ECVBH"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-GXC70ECVBH');
  </script>
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <div class="nav-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        DUBMENU
      </div>
      <div class="nav-links">
        <a href="#how-it-works">How It Works</a>
        <a href="#features">Features</a>
        <a href="${safeOrigin}/pricing">Pricing</a>
        <a href="${safeOrigin}/faq">FAQ</a>
        <a href="${safeOrigin}/about">About</a>
        <a href="${safeOrigin}/contact">Contact</a>
        <a href="${safeOrigin}/signup" class="nav-cta">Start Free Trial</a>
      </div>
      <button class="nav-toggle" aria-label="Toggle menu" onclick="document.querySelector('.nav-links').classList.toggle('open')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>
  </nav>

  <section class="hero">
    <div class="hero-badge">
      <span class="badge-dot"></span>
      No App &middot; No Install &middot; No Setup
    </div>
    <h1>Turn any TV into a <span class="gradient-text">digital menu board</span></h1>
    <p>Open a URL on your smart TV, scan the QR code with your phone, and configure your menu in real time. No hardware. No software. No monthly fees for a screen.</p>
    <div class="hero-cta-row">
      <button class="btn-primary" onclick="window.location.href='${safeOrigin}/signup'">Start Free Trial</button>
      <button class="btn-secondary" onclick="window.location.href='${TV_ORIGIN}/tv/demo'">Try the Demo</button>
    </div>
    <div class="mock-tv">
      <div class="mock-tv-inner">
        <div class="mock-tv-content">
          <h3>DubMenu Live</h3>
          <p>Scan to pair your phone</p>
        </div>
        <div class="mock-tv-qr">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(TV_ORIGIN + '/tv/demo')}" alt="Scan to open TV demo" />
        </div>
      </div>
      <div class="mock-tv-stand"></div>
    </div>
  </section>

  <section class="steps" id="how-it-works">
    <h2 class="section-title">How It Works</h2>
    <div class="steps-grid">
      <div class="step-card">
        <div class="step-num">1</div>
        <h3>Open on Your TV</h3>
        <p>Navigate to a DubMenu URL on any smart TV, tablet, or display. It auto-generates a pairing code.</p>
      </div>
      <div class="step-card">
        <div class="step-num">2</div>
        <h3>Scan the QR Code</h3>
        <p>Point your phone camera at the QR code on screen. Your phone becomes the remote control.</p>
      </div>
      <div class="step-card">
        <div class="step-num">3</div>
        <h3>Edit and Go Live</h3>
        <p>Add products, set prices, pick a theme. Changes appear on the TV instantly. No refresh needed.</p>
      </div>
    </div>
  </section>

  <section class="features" id="features">
    <h2 class="section-title">Everything you need behind the counter</h2>
    <div class="features-grid">
      <div class="feature">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <h3>12 TV Themes</h3>
        <p>Dark, light, neon, sunset, forest, gold, crimson, vapor, and more. Match your dispensary aesthetic.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <h3>Real-Time Sync</h3>
        <p>Update a price or toggle stock from your phone. The TV updates instantly via WebSocket.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <h3>Dutchie Import</h3>
        <p>Paste a Dutchie menu URL and DubMenu scrapes products, prices, THC, strain type, and images.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <h3>Multiple Displays</h3>
        <p>Run as many screens as you want. Each display gets its own pairing code and its own menu. Manage them all from one phone.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="4"/>
            <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
            <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
            <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/>
            <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>
          </svg>
        </div>
        <h3>Custom Branding</h3>
        <p>Your dispensary name, your logo, your accent color, your fonts. White-label out of the box.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </div>
        <h3>Phone = Remote</h3>
        <p>No keyboard or mouse on the TV. Manage everything from the phone in your pocket.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 1l4 4-4 4"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <path d="M7 23l-4-4 4-4"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
        </div>
        <h3>Auto-Scroll</h3>
        <p>Too many products for one screen? Enable auto-scroll and DubMenu cycles through pages.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="15" y2="17"/>
          </svg>
        </div>
        <h3>Compliance Ready</h3>
        <p>Custom disclaimer text, age gates, and stock toggles built in. Stay compliant by default.</p>
      </div>
    </div>
  </section>

  <section class="comparison" id="comparison">
    <h2 class="section-title">Why DubMenu</h2>
    <div class="comparison-table-wrap">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th style="text-align:center;">DubMenu</th>
            <th style="text-align:center;">Generic Boards</th>
            <th style="text-align:center;">Static Posters</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Real-Time Updates</td>
            <td><span class="check-yes">&#10003;</span></td>
            <td><span class="check-no">&#10007;</span></td>
            <td><span class="check-no">&#10007;</span></td>
          </tr>
          <tr>
            <td>Dutchie Import</td>
            <td><span class="check-yes">&#10003;</span></td>
            <td><span class="check-no">&#10007;</span></td>
            <td><span class="check-no">&#10007;</span></td>
          </tr>
          <tr>
            <td>12 TV Themes</td>
            <td><span class="check-yes">&#10003;</span></td>
            <td><span class="check-no">&#10007;</span></td>
            <td><span class="check-no">&#10007;</span></td>
          </tr>
          <tr>
            <td>Custom Branding</td>
            <td><span class="check-yes">&#10003;</span></td>
            <td><span class="check-no">&#10007;</span></td>
            <td><span class="check-no">&#10007;</span></td>
          </tr>
          <tr>
            <td>Unlimited Displays</td>
            <td><span class="check-yes">&#10003;</span></td>
            <td><span class="check-no">&#10007;</span></td>
            <td><span class="check-no">&#10007;</span></td>
          </tr>
          <tr>
            <td>Monthly Screen Fee</td>
            <td>$0</td>
            <td>$20-50/mo</td>
            <td>$0</td>
          </tr>
          <tr>
            <td>Setup Time</td>
            <td>Under 1 min</td>
            <td>Hours</td>
            <td>Days (print)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="cta-section">
    <h2>Ready to upgrade your menu board?</h2>
    <p>Start your 14-day free trial. No setup fee, no contract.</p>
    <button class="btn-primary" onclick="window.location.href='${safeOrigin}/signup'">Start Free Trial</button>
  </section>

  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="footer-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          DUBMENU
        </div>
        <p>Digital menu boards for cannabis dispensaries. A DubHaven product. For licensed dispensaries only.</p>
      </div>
      <div class="footer-col">
        <h4>Product</h4>
        <a href="${TV_ORIGIN}/tv/demo">Demo TV</a>
        <a href="#features">Features</a>
        <a href="${safeOrigin}/pricing">Pricing</a>
        <a href="#how-it-works">How It Works</a>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="https://dubhaven.com">DubHaven</a>
        <a href="${safeOrigin}/about">About</a>
        <a href="${safeOrigin}/faq">FAQ</a>
        <a href="${safeOrigin}/contact">Contact</a>
        <a href="${safeOrigin}/privacy">Privacy</a>
        <a href="${safeOrigin}/terms">Terms</a>
      </div>
      <div class="footer-col">
        <h4>Resources</h4>
        <a href="${safeOrigin}/digital-menu-board-for-cannabis-dispensary">Digital Menu Board</a>
        <a href="${safeOrigin}/cannabis-dispensary-menu-board">Dispensary Menu Board</a>
        <a href="${safeOrigin}/weed-menu-board">Weed Menu Board</a>
        <a href="${safeOrigin}/dispensary-tv-menu">TV Menu</a>
        <a href="${safeOrigin}/dutchie-menu-board-alternative">Dutchie Alternative</a>
        <a href="${safeOrigin}/best-cannabis-menu-board">Best Menu Board</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>DubMenu &mdash; Digital menu boards for cannabis dispensaries. A <a href="https://dubhaven.com">DubHaven</a> product.</p>
      <p style="margin-top:0.5rem;">For licensed dispensaries only. Keep out of reach of children.</p>
    </div>
  </footer>

  <script>
    // If user scanned a TV QR code (?code=XXX), redirect to config page immediately
    (function() {
      var params = new URLSearchParams(window.location.search);
      var code = params.get('code');
      if (code && /^[a-zA-Z0-9_-]{1,64}$/.test(code)) {
        window.location.replace('${safeOrigin}/config/' + encodeURIComponent(code));
        return;
      }
      
      // TV detection: only redirect if user agent explicitly indicates a TV device
      var ua = navigator.userAgent.toLowerCase();
      var isTVUA = /smart-?tv|tizen|webos|netcast|hbbtv|roku|apple tv|googletv|android tv/.test(ua);

      if (isTVUA) {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var sessionId = '';
        for (var i = 0; i < 6; i++) {
          sessionId += chars[Math.floor(Math.random() * chars.length)];
        }
        window.location.replace('${TV_ORIGIN}/tv/' + sessionId);
      }
    })();
  </script>
</body>
</html>`;
}
