interface PSEOPageData {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  introParagraphs: string[];
  sections: { heading: string; content: string }[];
  faqs: { q: string; a: string }[];
  relatedPages: { slug: string; title: string }[];
  schemaType: string;
  keywords: string[];
}

export function pseoPage(slug: string, origin: string): string | null {
  const page = PSEO_PAGES.find(p => p.slug === slug);
  if (!page) return null;
  return generatePSEOHTML(page, origin);
}

export function getAllPSEOSlugs(): string[] {
  return PSEO_PAGES.map(p => p.slug);
}

export function getAllPSEOPages(): PSEOPageData[] {
  return PSEO_PAGES;
}

function generatePSEOHTML(page: PSEOPageData, origin: string): string {
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const safeOrigin = escapeHtml(origin);
  const TV_ORIGIN = 'https://tv.dubmenu.com';
  
  const introHTML = page.introParagraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n');
  const sectionsHTML = page.sections.map(s => `
    <section class="pseo-section">
      <h2>${escapeHtml(s.heading)}</h2>
      <p>${escapeHtml(s.content)}</p>
    </section>
  `).join('\n');
  const faqsHTML = page.faqs.map(f => `
    <div class="pseo-faq">
      <h3>${escapeHtml(f.q)}</h3>
      <p>${escapeHtml(f.a)}</p>
    </div>
  `).join('\n');
  const relatedHTML = page.relatedPages.map(r => `
    <a href="${safeOrigin}/${escapeHtml(r.slug)}" class="pseo-related">${escapeHtml(r.title)}</a>
  `).join('\n');
  const keywordsMeta = escapeHtml(page.keywords.join(', '));
  const schemaJSON = JSON.stringify({
    "@context": "https://schema.org",
    "@type": page.schemaType,
    "name": page.title,
    "description": page.metaDescription,
    "offers": {
      "@type": "Offer",
      "price": "99",
      "priceCurrency": "USD",
      "priceValidUntil": "2027-12-31",
      "availability": "https://schema.org/InStock"
    },
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Any",
    "featureList": page.keywords.join(', ')
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.metaDescription)}">
  <meta name="keywords" content="${keywordsMeta}">
  <link rel="canonical" href="${safeOrigin}/${escapeHtml(page.slug)}">
  <script type="application/ld+json">${schemaJSON}</script>
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
    .pseo-hero{padding:8rem 1.5rem 3rem;text-align:center;max-width:800px;margin:0 auto;}
    .pseo-hero h1{font-size:2.5rem;font-weight:800;letter-spacing:-0.03em;line-height:1.1;margin-bottom:1.5rem;}
    .pseo-hero p{font-size:1.125rem;color:var(--text-faint);margin-bottom:2rem;}
    .pseo-cta{display:inline-flex;align-items:center;gap:0.75rem;background:var(--primary);color:#0a0f0d;padding:0.875rem 1.75rem;border-radius:var(--radius);font-weight:600;transition:background var(--transition);}
    .pseo-cta:hover{background:var(--primary-dark);}
    .pseo-content{max-width:800px;margin:0 auto;padding:0 1.5rem 4rem;}
    .pseo-intro p{font-size:1.125rem;color:var(--text-faint);margin-bottom:1.5rem;}
    .pseo-section{margin:3rem 0;padding:2rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);}
    .pseo-section h2{font-size:1.5rem;font-weight:700;margin-bottom:1rem;}
    .pseo-section p{color:var(--text-faint);}
    .pseo-faqs{margin:3rem 0;}
    .pseo-faqs h2{font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;}
    .pseo-faq{margin-bottom:1.5rem;padding:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);}
    .pseo-faq h3{font-size:1.125rem;font-weight:600;margin-bottom:0.5rem;color:var(--text);}
    .pseo-faq p{color:var(--text-faint);}
    .pseo-related{margin:3rem 0;}
    .pseo-related h2{font-size:1.5rem;font-weight:700;margin-bottom:1rem;}
    .pseo-related a{display:inline-block;margin:0.5rem 1rem 0.5rem 0;padding:0.5rem 1rem;background:var(--surface);border:1px solid var(--border);border-radius:0.5rem;color:var(--text-faint);transition:all var(--transition);}
    .pseo-related a:hover{background:var(--surface-hover);color:var(--text);}
    .pseo-cta-bottom{text-align:center;margin:3rem 0;}
    .pseo-cta-bottom a{display:inline-block;background:var(--primary);color:#0a0f0d;padding:1rem 2rem;border-radius:var(--radius);font-weight:600;font-size:1.125rem;transition:background var(--transition);}
    .pseo-cta-bottom a:hover{background:var(--primary-dark);}
    footer{padding:2rem 1.5rem;text-align:center;color:var(--text-faint);font-size:0.875rem;border-top:1px solid var(--border);margin-top:4rem;}
        @media(max-width:640px){.pseo-hero h1{font-size:2rem;}.nav-toggle{display:block;}.nav-links{display:none;position:absolute;top:100%;left:0;right:0;background:rgba(10,15,13,0.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);flex-direction:column;padding:1rem;gap:1rem;}.nav-links.open{display:flex;}.nav-links a{color:var(--text);}.nav{padding:0.75rem 1rem;}}
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

  <div class="pseo-hero">
    <h1>${escapeHtml(page.h1)}</h1>
    <p>${escapeHtml(page.metaDescription)}</p>
    <a href="${TV_ORIGIN}/tv/demo" class="pseo-cta" target="_blank">Try the Demo</a>
  </div>

  <div class="pseo-content">
    <div class="pseo-intro">
      ${introHTML}
    </div>

    ${sectionsHTML}

    <div class="pseo-faqs">
      <h2>Frequently Asked Questions</h2>
      ${faqsHTML}
    </div>

    <div class="pseo-related">
      <h2>Related Pages</h2>
      ${relatedHTML}
    </div>

    <div class="pseo-cta-bottom">
      <a href="${safeOrigin}/signup">Start Your Free Trial</a>
    </div>
  </div>

  <footer>
    <p>&copy; 2026 DubMenu. A <a href="https://dubhaven.com" target="_blank">DubHaven</a> product.</p>
  </footer>
</body>
</html>`;
}

const PSEO_PAGES: PSEOPageData[] = [
  {
    slug: "digital-menu-board-for-cannabis-dispensary",
    title: "Digital Menu Board for Cannabis Dispensary | DubMenu",
    h1: "Digital Menu Board for Cannabis Dispensaries",
    metaDescription: "Modern digital menu boards for cannabis dispensaries. No hardware, no setup fees. $99/month after a 2-week free trial. Syncs with your phone instantly.",
    introParagraphs: [
      "A digital menu board for cannabis dispensaries does more than list products. It gives your customers a clear, real-time view of what you have in stock, at what price, and in what form. When paired with a system that updates from your phone, you never have to print, laminate, or replace a physical menu again.",
      "DubMenu is a web-first digital menu board built specifically for dispensaries. There is no hardware to buy, no software to install, and no onboarding fee. You open a URL on any TV, tablet, or monitor, and your menu is live. When you need to change a price, mark a strain out of stock, or run a flash sale, you do it from your phone and the board updates immediately."
    ],
    sections: [
      {
        heading: "Why dispensaries are switching to digital menu boards",
        content: "Paper menus get stained, outdated, and thrown away. Static boards require a designer every time you want a new layout. Digital menu boards solve both problems: they stay clean, current, and editable without a design budget. For cannabis dispensaries, this is especially important because inventory changes daily, strain availability shifts by the hour, and promotional pricing moves fast. A digital board keeps your floor staff from repeating the same corrections to every customer."
      },
      {
        heading: "What to look for in a dispensary menu board",
        content: "The right menu board should display strain type, THC content, price, weight, and brand clearly. It should support real-time updates from a mobile device. It should work on any screen with a browser, not require a proprietary display. And it should be affordable enough that you are not locked into a long contract just to test it. DubMenu meets all of these requirements."
      },
      {
        heading: "How much does a digital menu board cost?",
        content: "Many dispensary menu board providers charge between $150 and $300 per month, plus a setup fee that can run $500 or more. Some require you to buy their hardware. DubMenu is $99 per month after a 2-week free trial, with no onboarding fee and no hardware requirement. You can use any smart TV, tablet, or monitor you already own. There is no long-term contract, so you can cancel if it is not the right fit."
      },
      {
        heading: "Getting started with DubMenu",
        content: "Setup takes under one minute. Open a URL on your TV. A pairing code appears on screen. Scan it with your phone, and you are in the control panel. Add your products, set your prices, pick a theme, and your menu is live. The entire process happens in the browser, with no downloads, no app store approvals, and no IT team required."
      }
    ],
    faqs: [
      { q: "Do I need special hardware for a digital menu board?", a: "No. DubMenu works on any device with a web browser, including smart TVs, tablets, computers, and even phones. You do not need to buy anything." },
      { q: "Can I update prices from my phone?", a: "Yes. DubMenu is designed to be controlled from a smartphone. Open the pairing URL, make your changes, and the TV updates in real time." },
      { q: "Is there a setup fee?", a: "No. DubMenu has no onboarding fee, no installation cost, and no hardware requirement. Start your 2-week free trial and see if it works for your dispensary." },
      { q: "How many TVs can I connect?", a: "As many as you need. Each TV gets its own pairing code, and you can manage them all from one phone. Multi-screen setups are supported out of the box." }
    ],
    relatedPages: [
      { slug: "cannabis-dispensary-menu-board", title: "Cannabis Dispensary Menu Board" },
      { slug: "dispensary-menu-display", title: "Dispensary Menu Display" },
      { slug: "cannabis-menu-board", title: "Cannabis Menu Board" },
      { slug: "dutchie-menu-board-alternative", title: "Dutchie Menu Board Alternative" },
      { slug: "menu-board-for-cannabis", title: "Menu Board for Cannabis" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["digital menu board", "cannabis dispensary", "menu board", "digital signage", "dispensary menu"]
  },
  {
    slug: "cannabis-dispensary-menu-board",
    title: "Cannabis Dispensary Menu Board | DubMenu",
    h1: "Cannabis Dispensary Menu Boards That Update in Real Time",
    metaDescription: "Stop printing menus. Get a cannabis dispensary menu board that updates from your phone. $99/month. 2-week free trial. No hardware needed.",
    introParagraphs: [
      "A printed menu board at a cannabis dispensary becomes outdated the moment a strain sells out, a price changes, or a new product arrives. Replacing it means reprinting, relaminating, and rehanging, sometimes multiple times a week. A digital menu board eliminates that cycle entirely.",
      "DubMenu gives cannabis dispensaries a menu board that lives in the browser. You control it from your phone. When you change a price, toggle a product out of stock, or add a new category, every connected screen updates instantly. There is no hardware to buy, no app to install, and no setup fee."
    ],
    sections: [
      {
        heading: "The real cost of printed menu boards",
        content: "Most dispensaries underestimate the true cost of printed menus. Between design time, printing, lamination, cutting, and hanging, a single menu refresh can cost $50 to $100 in labor and materials. If you update weekly, that is $2,600 to $5,200 per year. A digital menu board pays for itself in the first month."
      },
      {
        heading: "What customers expect from a modern menu board",
        content: "Cannabis consumers are used to seeing detailed product information online. They want to know THC percentage, strain type, weight, price, and brand before they ask a budtender. A good menu board displays all of this clearly, in a layout that is readable from across the room. DubMenu supports strain badges, THC labels, price formatting, and high-contrast themes so your customers can read the board without squinting."
      },
      {
        heading: "Manage every display from one phone",
        content: "If you run more than one screen in your dispensary, keeping them consistent can be a headache. DubMenu lets you pair as many displays as you need from one account. Each screen gets its own pairing code, so you can control them individually or show the same menu everywhere, all from your phone."
      },
      {
        heading: "Built for compliance",
        content: "DubMenu includes a customizable disclaimer field for age verification, medical warnings, and state-specific compliance text. You can set the text once and it appears on every screen. When regulations change, you update it in one place."
      }
    ],
    faqs: [
      { q: "Can I use my existing TV?", a: "Yes. Any smart TV, tablet, or monitor with a web browser works. No proprietary hardware required." },
      { q: "How fast do updates appear?", a: "Updates happen in real time over WebSocket. Change a price on your phone and it appears on the TV within seconds." },
      { q: "Can I display images?", a: "Yes. DubMenu supports product images, logos, and banner graphics. You can toggle images on or off depending on your layout." },
      { q: "What if I have multiple product categories?", a: "DubMenu handles unlimited categories, and you can arrange them in any order. Categories automatically scroll if they do not fit on one screen." }
    ],
    relatedPages: [
      { slug: "digital-menu-board-for-cannabis-dispensary", title: "Digital Menu Board for Cannabis Dispensary" },
      { slug: "dispensary-menu-display", title: "Dispensary Menu Display" },
      { slug: "digital-menu-board-dispensary", title: "Digital Menu Board Dispensary" },
      { slug: "menu-board-for-cannabis", title: "Menu Board for Cannabis" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["cannabis dispensary", "menu board", "dispensary menu", "digital menu", "cannabis menu"]
  },
  {
    slug: "dispensary-menu-display",
    title: "Dispensary Menu Display | Best Digital Menu Boards for Dispensaries",
    h1: "Dispensary Menu Display Systems That Work on Any Screen",
    metaDescription: "Turn any screen into a live dispensary menu display. Update prices, strains, and inventory from your phone. Free 2-week trial. $99/month.",
    introParagraphs: [
      "A dispensary menu display is the first thing customers see when they walk in. It sets the tone for the shopping experience. A messy, outdated, or handwritten menu makes your dispensary look amateur. A clean, modern digital display tells customers you are organized, current, and professional.",
      "DubMenu turns any screen, TV, or tablet into a live dispensary menu display. You control it from your phone. When inventory changes, you update it once and every display reflects the change immediately. No printing, no waiting, no design software."
    ],
    sections: [
      {
        heading: "Why your menu display matters",
        content: "In a dispensary, the menu display is more than a price list. It is a sales tool. When customers can see strain names, THC percentages, and prices clearly, they make faster decisions. When the display is outdated or missing products, customers ask more questions, budtenders spend more time clarifying, and lines move slower. A good display pays for itself in reduced labor and faster throughput."
      },
      {
        heading: "Any screen becomes a menu display",
        content: "DubMenu is entirely web-based. You do not need a special display, media player, or proprietary screen. Any device with a web browser works: Samsung Smart TVs, LG webOS TVs, Amazon Fire tablets, iPads, Android tablets, laptops, desktops, and even phones. Just open the URL, scan the pairing code, and your menu is live."
      },
      {
        heading: "Designed for the dispensary environment",
        content: "Dispensaries are often dimly lit, with high contrast between bright product lights and dark walls. DubMenu offers twelve color themes designed for different lighting conditions. The default dark theme with green accents is optimized for low-light environments and reads well from a distance. You can also choose bright themes for well-lit spaces or high-contrast themes for maximum readability."
      },
      {
        heading: "Automatic scrolling for long menus",
        content: "If you carry a large inventory, a single screen might not fit every product. DubMenu can auto-scroll through categories, cycling through your menu at a speed you control. This keeps every product visible without overwhelming the display with tiny text."
      }
    ],
    faqs: [
      { q: "What kind of screen do I need?", a: "Any screen with a web browser. Smart TVs, tablets, computers, and even phones work. There is no hardware requirement." },
      { q: "Can customers read it from across the room?", a: "Yes. DubMenu supports three text sizes and high-contrast themes. The large font option is readable from 20+ feet on a typical TV." },
      { q: "Does it work in dark dispensaries?", a: "Yes. The default dark theme is built for dim environments. You can also choose neon or minimal themes for different lighting conditions." },
      { q: "Can I show a promotional banner?", a: "Yes. DubMenu includes a customizable banner for daily specials, happy hour deals, or compliance notices. You set the text, color, and on/off toggle from your phone." }
    ],
    relatedPages: [
      { slug: "digital-menu-board-for-cannabis-dispensary", title: "Digital Menu Board for Cannabis Dispensary" },
      { slug: "cannabis-menu-display", title: "Cannabis Menu Display" },
      { slug: "dispensary-digital-signage", title: "Dispensary Digital Signage" },
      { slug: "dispensary-menu-board-screen", title: "Dispensary Menu Board Screen" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["dispensary menu display", "menu display", "digital display", "cannabis display", "dispensary screen"]
  },
  {
    slug: "cannabis-menu-board",
    title: "Cannabis Menu Board | Modern Digital Menu Boards for Dispensaries",
    h1: "Cannabis Menu Boards Built for Dispensary Operations",
    metaDescription: "Get a cannabis menu board that updates from your phone. No hardware, no setup fees. $99/month after a free 2-week trial. Try the demo now.",
    introParagraphs: [
      "A cannabis menu board needs to do more than list products. It needs to handle strain types, THC content, weights, brands, and prices in a format that customers can read quickly. It needs to update when inventory changes. And it needs to look professional enough to match your dispensary's branding.",
      "DubMenu is a digital menu board designed specifically for cannabis dispensaries. It displays strain badges, THC percentages, prices, and product images in a clean, customizable layout. You control it from your phone. Updates happen in real time. And there is no hardware to buy or software to install."
    ],
    sections: [
      {
        heading: "What makes a good cannabis menu board",
        content: "A good cannabis menu board is readable, accurate, and easy to update. It should show strain type clearly because customers often filter by indica, sativa, or hybrid. It should display THC content prominently because potency is a primary decision factor. It should show price and weight together because customers compare value per gram. And it should update instantly when products sell out or prices change. DubMenu handles all of this."
      },
      {
        heading: "Strain badges and product details",
        content: "DubMenu automatically shows color-coded strain badges for indica, sativa, and hybrid products. You can also display THC and CBD content, brand names, weights, and stock status. Customers get the information they need without asking your budtenders, which speeds up transactions and reduces wait times."
      },
      {
        heading: "Import from Dutchie",
        content: "If you already use Dutchie for online ordering, you can import your entire menu into DubMenu with one click. Paste your Dutchie URL, and DubMenu scrapes your products, prices, THC content, strain types, and images. No manual data entry required."
      },
      {
        heading: "White-label branding",
        content: "Your menu board should feel like part of your dispensary, not a generic template. DubMenu lets you set your dispensary name, upload your logo, choose your accent color, and select a custom Google Font. The result looks like a custom-built menu board, not a cookie-cutter solution."
      }
    ],
    faqs: [
      { q: "Can I show both THC and CBD content?", a: "Yes. DubMenu supports both THC and CBD fields, and you can display them alongside strain type and price." },
      { q: "How do I add new products?", a: "From your phone, tap the category you want to add to, enter the product name and price, and tap save. The product appears on the TV instantly." },
      { q: "Can I hide out-of-stock products?", a: "Yes. You can toggle any product's stock status with one tap. Out-of-stock products can be hidden or marked with a badge, depending on your preference." },
      { q: "Does it support medical marijuana menus?", a: "Yes. DubMenu works for both recreational and medical dispensaries. You can customize the disclaimer text to include medical-specific language or state requirements." }
    ],
    relatedPages: [
      { slug: "digital-menu-board-for-cannabis-dispensary", title: "Digital Menu Board for Cannabis Dispensary" },
      { slug: "cannabis-menu-board-software", title: "Cannabis Menu Board Software" },
      { slug: "digital-menu-board-cannabis", title: "Digital Menu Board Cannabis" },
      { slug: "dutchie-menu-board-alternative", title: "Dutchie Menu Board Alternative" },
      { slug: "menu-board-for-cannabis", title: "Menu Board for Cannabis" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["cannabis menu board", "menu board", "cannabis menu", "digital menu board", "dispensary menu"]
  },
  {
    slug: "digital-menu-board-dispensary",
    title: "Digital Menu Board Dispensary | Affordable Menu Boards",
    h1: "Digital Menu Board for Dispensaries: No Hardware, No Setup Fee",
    metaDescription: "Affordable digital menu boards for dispensaries. $99/month. No hardware required. 2-week free trial. Update your menu from your phone in real time.",
    introParagraphs: [
      "Digital menu boards for dispensaries used to require expensive hardware, proprietary software, and technical setup. Providers charged $200 to $500 per month, plus a setup fee, plus the cost of their display equipment. That model excluded small and mid-size dispensaries from having a professional menu display.",
      "DubMenu changes the model. It is a web-based digital menu board that runs on any screen with a browser. There is no hardware to buy, no setup fee, and no long-term contract. It is $99 per month after a 2-week free trial. You control the entire system from your phone, and updates appear on your TV in real time."
    ],
    sections: [
      {
        heading: "The old way vs. the new way",
        content: "The old way: buy a $1,000 digital display, pay a $500 setup fee, sign a $200/month contract, wait two weeks for installation, call support every time you want to change a price. The new way: open a URL on your existing TV, scan a code with your phone, and your menu is live. Change a price in 10 seconds. No contract, no hardware, no waiting."
      },
      {
        heading: "Pricing that makes sense for dispensaries",
        content: "DubMenu is $99 per month. There is no onboarding fee, no setup cost, and no hardware requirement. You get a 2-week free trial to test the system with your actual menu. If it does not work for you, cancel anytime. No questions asked. Compare that to competitors charging $200 to $500 per month with annual contracts and setup fees."
      },
      {
        heading: "Works with your existing setup",
        content: "You do not need to rewire your store or mount new displays. Any TV, tablet, or monitor already in your dispensary works. If you have a smart TV in the waiting area, a tablet behind the counter, or a monitor in the back office, each can display your menu. Just open the URL and pair it with your phone."
      },
      {
        heading: "From setup to live in 60 seconds",
        content: "Open tv.dubmenu.com on your TV. A pairing code and QR code appear on screen. Scan the code with your phone, and you are in the control panel. Add your products, set your prices, pick a theme, and your menu is live. The entire process takes under a minute. No downloads, no app store approvals, no IT team."
      }
    ],
    faqs: [
      { q: "Is there really no setup fee?", a: "Correct. There is no onboarding fee, no installation cost, and no hidden charges. Start your free trial and see the full system before paying anything." },
      { q: "Can I cancel anytime?", a: "Yes. There is no long-term contract. Cancel whenever you want. Your menu data is exportable, so you can take it with you." },
      { q: "Do I need a smart TV?", a: "Any device with a web browser works. Smart TVs are easiest, but tablets, computers, and even phones work too." },
      { q: "What happens after the free trial?", a: "After 2 weeks, you choose whether to continue at $99/month or cancel. If you cancel, you keep your data and can export it anytime." }
    ],
    relatedPages: [
      { slug: "digital-menu-board-for-cannabis-dispensary", title: "Digital Menu Board for Cannabis Dispensary" },
      { slug: "cannabis-menu-board-price", title: "Cannabis Menu Board Price" },
      { slug: "affordable-dispensary-menu-board", title: "Affordable Dispensary Menu Board" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["digital menu board dispensary", "menu board dispensary", "affordable menu board", "dispensary digital menu", "no hardware menu board"]
  },
  {
    slug: "dispensary-digital-signage",
    title: "Dispensary Digital Signage | Menu Boards & Product Displays",
    h1: "Dispensary Digital Signage for Menu Boards and Promotions",
    metaDescription: "Digital signage for cannabis dispensaries. Display menus, promotions, and compliance notices on any screen. $99/month. Free 2-week trial.",
    introParagraphs: [
      "Digital signage for dispensaries is not just about menus. It is about creating a professional in-store experience that communicates product information, promotions, and compliance notices clearly. A well-designed digital sign reduces questions, speeds up transactions, and makes your dispensary look more established.",
      "DubMenu is a digital signage system built specifically for cannabis dispensaries. It displays your product menu, promotional banners, and compliance disclaimers on any screen. You control everything from your phone, and updates happen in real time. No proprietary hardware, no setup fees, no long-term contracts."
    ],
    sections: [
      {
        heading: "Digital signage vs. static displays",
        content: "Static displays, printed menus, and chalkboards work until they do not. When a product sells out, a price changes, or a promotion ends, you need to physically replace the display. Digital signage eliminates that problem. Change anything from your phone, and every screen updates instantly. For dispensaries where inventory changes daily, this is not a luxury, it is a necessity."
      },
      {
        heading: "Promotional banners and announcements",
        content: "DubMenu includes a customizable promotional banner that appears at the top of your display. Use it for daily specials, flash sales, new product announcements, or compliance notices. Set the text, background color, and text color from your phone. Toggle it on or off depending on whether you are running a promotion."
      },
      {
        heading: "Multi-screen setups",
        content: "If you run a large dispensary with multiple display areas, DubMenu supports multi-screen setups. Each screen gets its own pairing code, and you can assign different categories to different screens. For example, show flower and pre-rolls on the main display, and edibles and concentrates on the secondary display. Or sync all screens to show the same menu everywhere."
      },
      {
        heading: "Compliance and age verification",
        content: "Every dispensary needs visible compliance notices. DubMenu includes a customizable disclaimer field that appears at the bottom of every screen. Use it for age verification, medical warnings, or state-specific compliance text. Update it once, and it appears on every screen on your account."
      }
    ],
    faqs: [
      { q: "Can I use digital signage for non-menu content?", a: "Yes. The promotional banner can display any text you want, including announcements, compliance notices, or event information." },
      { q: "How many screens can I run?", a: "As many as you need. Each screen gets its own pairing code and can display independent or synchronized content." },
      { q: "Can I schedule different content for different times?", a: "Currently, you toggle content manually from your phone. Scheduled content rotation is on the roadmap based on customer demand." },
      { q: "Does it work for both medical and recreational dispensaries?", a: "Yes. The disclaimer text and product categories are fully customizable for any dispensary type or state requirement." }
    ],
    relatedPages: [
      { slug: "dispensary-menu-display", title: "Dispensary Menu Display" },
      { slug: "digital-menu-board-dispensary", title: "Digital Menu Board Dispensary" },
      { slug: "menu-display-for-dispensary", title: "Menu Display for Dispensary" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["dispensary digital signage", "digital signage", "cannabis signage", "menu signage", "dispensary display"]
  },
  {
    slug: "cannabis-menu-display",
    title: "Cannabis Menu Display | Product Displays for Dispensaries",
    h1: "Cannabis Menu Display: Show Products Clearly on Any Screen",
    metaDescription: "Display your cannabis products on any screen. Show strain types, THC, prices, and images. Update from your phone. $99/month. Free 2-week trial.",
    introParagraphs: [
      "A cannabis menu display is the bridge between your inventory and your customers. When it is clear, current, and easy to read, customers make faster decisions and budtenders spend less time answering questions. When it is outdated, incomplete, or hard to read, it creates friction at the point of sale.",
      "DubMenu turns any screen into a professional cannabis menu display. It shows strain types, THC content, prices, weights, and product images in a clean, readable layout. You control it from your phone, and every update appears on the display in real time."
    ],
    sections: [
      {
        heading: "What customers want to see on a menu display",
        content: "Cannabis customers look for four things: strain type, potency, price, and weight. They also want to know if a product is in stock. A good menu display shows all of this at a glance, without requiring customers to ask a budtender or search through a paper menu. DubMenu displays strain badges, THC percentages, prices, weights, and stock status clearly."
      },
      {
        heading: "Readability from a distance",
        content: "Dispensary menu displays are often viewed from 10 to 20 feet away. Small text or low-contrast colors make the display useless. DubMenu offers three text sizes and twelve color themes designed for different viewing distances and lighting conditions. The large text option is readable from across a typical dispensary floor."
      },
      {
        heading: "Images that sell",
        content: "Product images help customers identify products and make decisions faster. DubMenu supports product images for every item in your menu. You can upload images manually or import them automatically from Dutchie. Toggle images on or off depending on your layout preference."
      },
      {
        heading: "Auto-scroll for large inventories",
        content: "If you carry 50+ products, fitting them all on one screen means tiny text. DubMenu can auto-scroll through categories, showing a manageable number of products at a time and cycling through the rest. You control the scroll speed from your phone."
      },
      {
        heading: "A reliable update workflow",
        content: "Assign one staff member to verify the display at opening and after every inventory import, price change, or promotion. Compare several products on the screen with the point-of-sale record, then confirm sold-out items, weights, potency, and sale labels. Keep the screen paired to a stable network and place the display where glare does not hide prices. This short operational check prevents an attractive menu from showing stale information during the busiest part of the day."
      }
    ],
    faqs: [
      { q: "Can customers read the display from the waiting area?", a: "Yes. The large font option is designed for readability from 20+ feet. High-contrast themes ensure readability even in dim lighting." },
      { q: "Do I need to upload product images manually?", a: "You can upload images manually or import them automatically from Dutchie. If you do not have images, the menu works just as well with text-only layouts." },
      { q: "Can I show sale prices?", a: "Yes. You can set original prices and sale prices, and DubMenu shows the discount clearly with a sale badge." },
      { q: "Does it work for delivery-only dispensaries?", a: "Yes. You can display your menu on a tablet at the pickup counter, on a monitor in the back office, or even on a phone for on-the-go management." }
    ],
    relatedPages: [
      { slug: "dispensary-menu-display", title: "Dispensary Menu Display" },
      { slug: "cannabis-menu-board", title: "Cannabis Menu Board" },
      { slug: "marijuana-menu-display", title: "Marijuana Menu Display" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["cannabis menu display", "menu display", "product display", "cannabis display", "dispensary menu"]
  },
  {
    slug: "weed-menu-board",
    title: "Weed Menu Board | Digital Menu Boards for Cannabis Shops",
    h1: "Weed Menu Boards That Update From Your Phone",
    metaDescription: "Get a weed menu board that updates in real time. No hardware, no setup fees. $99/month after a 2-week free trial. Try the demo now.",
    introParagraphs: [
      "A weed menu board should be as straightforward as the product it sells. Customers want to see what is available, how much it costs, and how strong it is. They do not want to squint at a handwritten chalkboard or flip through a stained paper menu.",
      "DubMenu is a digital weed menu board that displays your products clearly on any screen. Show strain names, THC content, prices, weights, and stock status. Update everything from your phone. No hardware to buy, no app to install, no setup fee."
    ],
    sections: [
      {
        heading: "Why paper menus fail for weed shops",
        content: "Paper menus get damaged, outdated, and lost. When a strain sells out, you cross it out with a marker. When a price changes, you print a new menu. When a new product arrives, you wait for the next print run. This cycle is expensive and makes your shop look disorganized. A digital menu board eliminates all of it."
      },
      {
        heading: "Strain information at a glance",
        content: "Weed customers care about strain type and potency. Indica, sativa, and hybrid are not just categories, they are purchase drivers. DubMenu shows color-coded strain badges so customers can scan the menu and find what they want without reading every line. THC percentages are displayed prominently, so potency is never a question."
      },
      {
        heading: "Affordable pricing for independent shops",
        content: "Many digital menu providers charge $200 to $500 per month, which is too expensive for small and independent weed shops. DubMenu is $99 per month with no setup fee and no hardware requirement. You can start with a 2-week free trial and cancel anytime if it is not the right fit."
      },
      {
        heading: "Works on any screen you already own",
        content: "You do not need to buy a new TV or a proprietary display. Any screen with a web browser works. If you have a smart TV in the shop, a tablet behind the counter, or an old monitor in the back, you can turn it into a live menu board in under a minute."
      }
    ],
    faqs: [
      { q: "Can I use this for a small weed shop?", a: "Yes. DubMenu is designed for shops of all sizes. Whether you have 10 products or 500, the menu board scales to fit your inventory." },
      { q: "Do I need technical skills?", a: "No. The setup process is designed for non-technical users. Open a URL, scan a code, and your menu is live. No coding, no installation, no IT support." },
      { q: "Can I show edibles and concentrates too?", a: "Yes. DubMenu supports unlimited categories. Flower, pre-rolls, vapes, edibles, concentrates, tinctures, CBD, and accessories are all supported." },
      { q: "What if I only have one TV?", a: "One TV is enough. DubMenu works with a single screen or multiple screens. Start with one and add more as you grow." }
    ],
    relatedPages: [
      { slug: "cannabis-menu-board", title: "Cannabis Menu Board" },
      { slug: "marijuana-menu-board", title: "Marijuana Menu Board" },
      { slug: "weed-menu-display", title: "Weed Menu Display" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["weed menu board", "weed menu", "cannabis menu board", "marijuana menu board", "menu board"]
  },
  {
    slug: "marijuana-menu-board",
    title: "Marijuana Menu Board | Digital Menu Boards for Dispensaries",
    h1: "Marijuana Menu Boards for Dispensaries and Cannabis Shops",
    metaDescription: "Professional marijuana menu boards that update in real time. No hardware required. $99/month. Start with a 2-week free trial. Try the demo now.",
    introParagraphs: [
      "A marijuana menu board is more than a price list. It is a sales tool that helps customers make informed decisions quickly. When customers can see strain types, THC content, and prices clearly, they buy with confidence. When the menu is outdated, missing products, or hard to read, it creates confusion and slows down transactions.",
      "DubMenu is a digital marijuana menu board built for dispensaries. It displays products, prices, strain information, and stock status on any screen. You control it from your phone, and updates happen instantly. No hardware to buy, no setup fee, no long-term contract."
    ],
    sections: [
      {
        heading: "The real cost of printed marijuana menu boards",
        content: "Printed menus for marijuana dispensaries are expensive to maintain. Design, printing, lamination, and hanging can cost $50 to $100 per update. If you refresh weekly, that is $2,600 to $5,200 per year. A digital menu board eliminates that cost entirely and updates in real time."
      },
      {
        heading: "What customers expect from a modern menu board",
        content: "Marijuana consumers want detailed product information before they speak to a budtender. They expect to see strain type, THC percentage, CBD content, weight, price, and brand. A professional menu board displays all of this clearly and updates when products sell out. DubMenu handles strain badges, potency labels, price formatting, and stock status automatically."
      },
      {
        heading: "Manage every display from one phone",
        content: "If you run more than one screen, keeping menu boards consistent can be a challenge. DubMenu lets you pair as many displays as you need from one account. Each screen gets its own pairing code, so you can control them individually or show the same menu everywhere, all from your phone."
      },
      {
        heading: "Compliance-ready disclaimers",
        content: "Marijuana dispensaries must display age verification and compliance notices. DubMenu includes a customizable disclaimer field that appears at the bottom of every screen. Update the text once, and it appears on every screen on your account instantly."
      }
    ],
    faqs: [
      { q: "Can I display both recreational and medical products?", a: "Yes. DubMenu supports unlimited categories, so you can separate recreational and medical products or display them together." },
      { q: "How do I update the menu when a product sells out?", a: "Tap the product on your phone, toggle the stock status to out of stock, and the change appears on every screen within seconds." },
      { q: "Can I show product images?", a: "Yes. Upload images manually or import them from Dutchie. Images can be toggled on or off depending on your preference." },
      { q: "Does it work for both medical and recreational dispensaries?", a: "Yes. The disclaimer text, categories, and product fields are fully customizable for any dispensary type." }
    ],
    relatedPages: [
      { slug: "cannabis-menu-board", title: "Cannabis Menu Board" },
      { slug: "weed-menu-board", title: "Weed Menu Board" },
      { slug: "digital-menu-board-for-marijuana-dispensary", title: "Digital Menu Board for Marijuana Dispensary" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["marijuana menu board", "marijuana menu", "cannabis menu board", "dispensary menu board", "menu board"]
  },
  {
    slug: "dispensary-tv-menu",
    title: "Dispensary TV Menu | Turn Any TV Into a Menu Board",
    h1: "Dispensary TV Menu: Use Your Existing Smart TV",
    metaDescription: "Turn any smart TV into a live dispensary menu. No new hardware needed. $99/month. Free 2-week trial. Update from your phone instantly.",
    introParagraphs: [
      "Most dispensaries already have a TV in the waiting area or behind the counter. Instead of buying a separate menu board, why not use the TV you already own? A dispensary TV menu turns your existing screen into a live product display that updates from your phone.",
      "DubMenu is a web-based dispensary TV menu that runs on any smart TV with a browser. Open the URL, scan the pairing code with your phone, and your menu is live. No cables, no installation, no IT team. Just your TV and your phone."
    ],
    sections: [
      {
        heading: "Why use your TV as a menu board",
        content: "Smart TVs are already designed for bright, readable displays. They have large screens, high resolution, and good viewing angles. Instead of buying a separate digital sign, you can repurpose the TV you already have. DubMenu runs in the browser, so there is nothing to install. Just open the URL and go."
      },
      {
        heading: "Works with any smart TV brand",
        content: "DubMenu works on Samsung Smart TVs, LG webOS TVs, Sony Android TVs, Roku TVs, Amazon Fire TVs, and any other TV with a web browser. If your TV can open a website, it can run DubMenu. No app store needed, no downloads, no compatibility issues."
      },
      {
        heading: "Remote control from your phone",
        content: "Your phone becomes the remote control for your TV menu. Change prices, add products, toggle stock status, or switch themes, all from your phone. The TV updates in real time. No need to walk over to the TV or use a separate remote."
      },
      {
        heading: "No additional hardware required",
        content: "You do not need a media player, HDMI stick, or proprietary device. Your smart TV has everything it needs. Just open the URL, pair it with your phone, and your menu is live. If you have an older TV without a browser, a $30 Amazon Fire Stick or Chromecast will turn it into a smart TV."
      }
    ],
    faqs: [
      { q: "Do I need a smart TV?", a: "Any TV with a web browser works. If you have an older TV, a $30 streaming stick like Fire TV or Chromecast will add browser support." },
      { q: "Can I use a TV in the waiting area?", a: "Yes. DubMenu works on any screen, including waiting area TVs, counter displays, and back-office monitors." },
      { q: "How do I keep the TV from going to sleep?", a: "Most smart TVs have a screensaver or sleep mode. You can disable it in the TV settings, or set it to display a static image when inactive. DubMenu will stay visible." },
      { q: "Can I still use the TV for other purposes?", a: "Yes. When you want to use the TV for something else, just switch inputs or close the browser. DubMenu is just a website, not a permanent installation." }
    ],
    relatedPages: [
      { slug: "dispensary-menu-display", title: "Dispensary Menu Display" },
      { slug: "digital-menu-board-dispensary", title: "Digital Menu Board Dispensary" },
      { slug: "cannabis-menu-screen", title: "Cannabis Menu Screen" },
      { slug: "dispensary-menu-board-screen", title: "Dispensary Menu Board Screen" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["dispensary tv menu", "tv menu", "smart tv menu", "cannabis tv menu", "menu board tv"]
  },
  {
    slug: "cannabis-menu-screen",
    title: "Cannabis Menu Screen | Digital Displays for Dispensaries",
    h1: "Cannabis Menu Screens for Every Dispensary Setup",
    metaDescription: "Turn any screen into a professional cannabis menu display. $99/month. No hardware required. Free 2-week trial. Update from your phone in real time.",
    introParagraphs: [
      "A cannabis menu screen is the first thing customers notice when they enter your dispensary. It needs to be clear, current, and professional. A handwritten chalkboard or faded paper menu sends the wrong message. A digital menu screen tells customers you are modern, organized, and serious about your business.",
      "DubMenu turns any screen, tablet, or monitor into a cannabis menu display. It shows your products, prices, strain types, and THC content in a clean, readable format. You control it from your phone, and every update appears instantly."
    ],
    sections: [
      {
        heading: "Any screen works",
        content: "You do not need a special display or proprietary hardware. Any screen with a web browser works. This includes smart TVs, tablets, computers, monitors, and even phones. If you have a screen, you have a menu board."
      },
      {
        heading: "Optimized for different screen sizes",
        content: "DubMenu automatically adapts to different screen sizes. On a large TV, it shows a full menu with images and detailed product information. On a tablet, it shows a condensed version. On a phone, you get the control panel. The same system works across all your devices."
      },
      {
        heading: "High contrast for visibility",
        content: "Dispensaries are often dimly lit. Small text or low-contrast colors make the menu hard to read. DubMenu offers twelve color themes with high contrast options. The default dark theme with bright green accents is designed for visibility in low-light environments."
      },
      {
        heading: "Auto-rotate for vertical screens",
        content: "If you have a vertical or portrait-oriented screen, DubMenu automatically adjusts the layout to fit. Vertical screens are great for narrow spaces like checkout counters or shelf ends. The menu stacks categories vertically and scrolls smoothly."
      }
    ],
    faqs: [
      { q: "Can I use a tablet as a menu screen?", a: "Yes. Tablets work great for counter displays or shelf-mounted menus. Just open the URL and pair it with your phone." },
      { q: "Does it work on small screens?", a: "Yes. DubMenu adapts to any screen size, from large TVs to small tablets. The layout adjusts automatically." },
      { q: "Can I use multiple screens in one store?", a: "Yes. Each screen gets its own pairing code, and you can control them all from one phone." },
      { q: "What about vertical screens?", a: "DubMenu supports both horizontal and vertical orientations. The layout adjusts automatically." }
    ],
    relatedPages: [
      { slug: "dispensary-menu-display", title: "Dispensary Menu Display" },
      { slug: "cannabis-menu-display", title: "Cannabis Menu Display" },
      { slug: "dispensary-tv-menu", title: "Dispensary TV Menu" },
      { slug: "dispensary-menu-board-screen", title: "Dispensary Menu Board Screen" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["cannabis menu screen", "menu screen", "digital screen", "cannabis display", "screen menu"]
  },
  {
    slug: "digital-menu-board-for-dispensaries",
    title: "Digital Menu Board for Dispensaries | Affordable & Easy Setup",
    h1: "Digital Menu Boards for Dispensaries: No Hardware, No Setup Fee",
    metaDescription: "Get a digital menu board for your dispensary. No hardware required. $99/month. Free 2-week trial. Update from your phone in real time.",
    introParagraphs: [
      "Digital menu boards for dispensaries should not require expensive hardware, long contracts, or technical expertise. They should be as easy to set up as opening a website and as affordable as a monthly utility bill.",
      "DubMenu is a digital menu board built specifically for dispensaries. It runs on any screen with a web browser. You control it from your phone. Updates happen in real time. And it costs $99 per month with no setup fee and no long-term contract."
    ],
    sections: [
      {
        heading: "The problem with traditional menu boards",
        content: "Traditional menu boards for dispensaries are expensive and inflexible. Hardware costs $1,000 or more. Setup fees run $500+. Monthly contracts lock you in for a year or more. And every time you want to change a price, you need to call support or hire a designer. DubMenu eliminates all of these problems."
      },
      {
        heading: "A better way to display your menu",
        content: "DubMenu is web-based, so there is no hardware to buy. It runs on any screen with a browser. You control it from your phone, so there is no need to call support. Updates happen in real time, so your menu is always current. And there is no long-term contract, so you can cancel anytime."
      },
      {
        heading: "Pricing that works for any dispensary",
        content: "DubMenu is $99 per month flat. There are no per-screen fees, no enterprise pricing tiers, and no volume discounts that penalize small shops. Every customer gets the same features, the same support, and the same fair price."
      },
      {
        heading: "Setup in under 60 seconds",
        content: "Open tv.dubmenu.com on your TV. A pairing code appears. Scan it with your phone. You are now in the control panel. Add products, set prices, pick a theme, and your menu is live. The entire process takes less than a minute. No downloads, no installations, no IT team."
      }
    ],
    faqs: [
      { q: "Is there a contract?", a: "No. DubMenu has no long-term contract. You can cancel anytime. Your data is always exportable." },
      { q: "Can I use it for multiple displays?", a: "Yes. Each display gets its own pairing code, and you can manage them all from one phone. The price is $99 per month flat, regardless of how many displays you pair." },
      { q: "What if I need help?", a: "DubMenu includes email support and a comprehensive help center. Response time is typically under 24 hours." },
      { q: "Can I try it before buying?", a: "Yes. Every new account gets a 2-week free trial. No credit card required." }
    ],
    relatedPages: [
      { slug: "digital-menu-board-for-cannabis-dispensary", title: "Digital Menu Board for Cannabis Dispensary" },
      { slug: "digital-menu-board-dispensary", title: "Digital Menu Board Dispensary" },
      { slug: "affordable-dispensary-menu-board", title: "Affordable Dispensary Menu Board" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["digital menu board for dispensaries", "menu board dispensary", "digital menu", "dispensary menu", "menu board"]
  },
  {
    slug: "dispensary-menu-software",
    title: "Dispensary Menu Software | Menu Board Management System",
    h1: "Dispensary Menu Software That Updates From Your Phone",
    metaDescription: "Manage your dispensary menu from your phone. $99/month. No hardware required. Free 2-week trial. Real-time updates to any screen.",
    introParagraphs: [
      "Dispensary menu software should be simple. You should not need a desktop computer, a design team, or an IT department to update your menu. You should be able to change a price, add a product, or toggle stock status from your phone, and see the update on every screen instantly.",
      "DubMenu is dispensary menu software that runs in the browser. There is nothing to install. You control the entire system from your phone. Every update happens in real time. And it costs $99 per month with no setup fee and no long-term contract."
    ],
    sections: [
      {
        heading: "What dispensary menu software should do",
        content: "Good dispensary menu software should let you add products, set prices, organize categories, and update displays from any device. It should work on any screen without proprietary hardware. It should sync in real time. And it should be affordable enough that small shops can use it too. DubMenu does all of this."
      },
      {
        heading: "Cloud-based menu management",
        content: "DubMenu stores your menu data in the cloud, so it is accessible from any device. Update your menu from your phone at home, from a tablet in the back office, or from a laptop at your desk. Every change syncs to every connected screen in real time."
      },
      {
        heading: "Import and export your data",
        content: "Your menu data belongs to you. DubMenu lets you export your entire menu as a JSON file, which you can import into another system or keep as a backup. You can also import menus from Dutchie, saving hours of manual data entry."
      },
      {
        heading: "No software to install",
        content: "DubMenu is entirely web-based. There is no app to download, no software to install, and no updates to manage. The system updates automatically on our end. You always have the latest version without lifting a finger."
      }
    ],
    faqs: [
      { q: "Do I need to download an app?", a: "No. DubMenu runs entirely in the browser. There is nothing to download or install." },
      { q: "Can I access my menu from multiple devices?", a: "Yes. Your menu is stored in the cloud, so you can access it from any phone, tablet, or computer." },
      { q: "Is my data secure?", a: "Yes. DubMenu uses encrypted connections and secure cloud storage. Your data is never shared with third parties." },
      { q: "Can I export my menu data?", a: "Yes. You can export your entire menu as a JSON file at any time. Your data belongs to you." }
    ],
    relatedPages: [
      { slug: "cannabis-menu-board-software", title: "Cannabis Menu Board Software" },
      { slug: "digital-menu-board-for-dispensaries", title: "Digital Menu Board for Dispensaries" },
      { slug: "cannabis-menu-system", title: "Cannabis Menu System" },
      { slug: "dutchie-menu-board-alternative", title: "Dutchie Menu Board Alternative" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["dispensary menu software", "menu software", "cannabis software", "menu management", "dispensary software"]
  },
  {
    slug: "cannabis-menu-system",
    title: "Cannabis Menu System | Menu Board Management for Dispensaries",
    h1: "Cannabis Menu Systems for Dispensaries and Cannabis Shops",
    metaDescription: "Get a cannabis menu system that updates from your phone. $99/month. No hardware required. Free 2-week trial. Real-time sync to any screen.",
    introParagraphs: [
      "A cannabis menu system is more than a display. It is the connection between your inventory and your customers. When it works well, customers make faster decisions and budtenders spend less time answering questions. When it does not work, you get frustrated customers, long lines, and missed sales.",
      "DubMenu is a cannabis menu system that turns any screen into a live product display. You control it from your phone. Updates happen in real time. And it works on any device with a web browser, so you never need to buy proprietary hardware."
    ],
    sections: [
      {
        heading: "What a cannabis menu system should include",
        content: "A complete cannabis menu system should include product management, category organization, real-time display updates, multi-screen support, and compliance tools. It should also be affordable and easy to use. DubMenu includes all of these features in a single, web-based platform."
      },
      {
        heading: "Real-time sync across all screens",
        content: "When you change a price or toggle a product out of stock, every connected screen updates instantly. There is no delay, no refresh button, and no manual syncing. The system uses WebSocket technology to push updates to all displays in real time."
      },
      {
        heading: "Category and product management",
        content: "Organize your products into unlimited categories. Add, edit, or remove products from your phone. Set prices, weights, THC content, strain types, and stock status. Every field is editable and appears on the display in real time."
      },
      {
        heading: "Compliance and legal notices",
        content: "Every cannabis menu system needs to display compliance notices. DubMenu includes a customizable disclaimer field for age verification, medical warnings, and state-specific legal text. Update it once, and it appears on every screen."
      }
    ],
    faqs: [
      { q: "Can I manage multiple displays?", a: "Yes. Each display gets its own pairing code, and you can control them all from one phone." },
      { q: "Does it integrate with my POS?", a: "DubMenu currently supports Dutchie import. Direct POS integration is on the roadmap." },
      { q: "Can I run more than one dispensary account?", a: "Each DubMenu account is one menu. If you operate more than one dispensary, you can create a separate account for each. Multi-account management is on our roadmap." },
      { q: "Is there a limit on products or categories?", a: "No. DubMenu supports unlimited products and categories." }
    ],
    relatedPages: [
      { slug: "dispensary-menu-software", title: "Dispensary Menu Software" },
      { slug: "cannabis-menu-board-software", title: "Cannabis Menu Board Software" },
      { slug: "digital-menu-board-for-dispensaries", title: "Digital Menu Board for Dispensaries" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["cannabis menu system", "menu system", "cannabis system", "dispensary system", "menu management"]
  },
  {
    slug: "menu-board-for-cannabis",
    title: "Menu Board for Cannabis | Digital Menu Boards for Dispensaries",
    h1: "Menu Boards for Cannabis Dispensaries and Shops",
    metaDescription: "Get a menu board for your cannabis dispensary. No hardware, no setup fees. $99/month. Free 2-week trial. Update from your phone instantly.",
    introParagraphs: [
      "A menu board for cannabis products needs to handle unique requirements: strain types, THC content, weights, and prices. It needs to update quickly when inventory changes. And it needs to look professional enough to match the quality of your products.",
      "DubMenu is a digital menu board designed for cannabis dispensaries. It shows strain badges, THC percentages, prices, and stock status in a clean, customizable layout. You control it from your phone, and updates appear on every screen in real time."
    ],
    sections: [
      {
        heading: "What makes a good cannabis menu board",
        content: "A good cannabis menu board shows strain type, potency, price, and weight clearly. It updates in real time when products sell out or prices change. It works on any screen without proprietary hardware. And it is affordable enough for small shops. DubMenu meets all of these requirements."
      },
      {
        heading: "Strain badges and potency labels",
        content: "DubMenu automatically shows color-coded strain badges for indica, sativa, and hybrid products. THC and CBD percentages are displayed prominently. Customers can scan the menu and find exactly what they want without asking a budtender."
      },
      {
        heading: "Works for all product types",
        content: "Whether you sell flower, pre-rolls, vapes, edibles, concentrates, tinctures, or CBD products, DubMenu handles them all. Create unlimited categories, organize products in any order, and display them in a layout that makes sense for your shop."
      },
      {
        heading: "Affordable and contract-free",
        content: "DubMenu is $99 per month with no setup fee and no long-term contract. Start with a 2-week free trial and see if it works for your dispensary. Cancel anytime if it is not the right fit."
      }
    ],
    faqs: [
      { q: "Can I show CBD products?", a: "Yes. DubMenu supports unlimited categories, including CBD, tinctures, topicals, and accessories." },
      { q: "How do I handle seasonal products?", a: "Add seasonal products to a special category, or toggle them on and off as needed. There is no limit to how many products you can add or remove." },
      { q: "Can I show medical and recreational products together?", a: "Yes. You can organize products by type, potency, or any other criteria. Medical and recreational products can be displayed together or in separate categories." },
      { q: "Does it support weight-based pricing?", a: "Yes. DubMenu supports any pricing format, including per gram, per eighth, per ounce, and flat pricing." }
    ],
    relatedPages: [
      { slug: "cannabis-menu-board", title: "Cannabis Menu Board" },
      { slug: "digital-menu-board-for-cannabis-dispensary", title: "Digital Menu Board for Cannabis Dispensary" },
      { slug: "menu-display-for-dispensary", title: "Menu Display for Dispensary" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["menu board for cannabis", "cannabis menu board", "menu board", "dispensary menu", "cannabis menu"]
  },
  {
    slug: "dispensary-menu-display-screen",
    title: "Dispensary Menu Display Screen | Digital Menu Boards",
    h1: "Dispensary Menu Display Screens for Every Setup",
    metaDescription: "Turn any screen into a dispensary menu display. $99/month. No hardware required. Free 2-week trial. Update from your phone in real time.",
    introParagraphs: [
      "A dispensary menu display screen is the face of your product lineup. It needs to be clear, current, and professional. Whether it is a large TV in the waiting area or a tablet behind the counter, the display should make your products look their best.",
      "DubMenu turns any screen into a live dispensary menu display. It works on TVs, tablets, monitors, and even phones. You control it from your phone, and every update appears instantly. No proprietary hardware, no setup fees, no long-term contracts."
    ],
    sections: [
      {
        heading: "Choosing the right display screen",
        content: "The best display screen depends on your space. Large TVs work well for waiting areas where customers view from a distance. Tablets are ideal for counter displays where customers view up close. Monitors work for back-office inventory management. DubMenu supports all of these setups."
      },
      {
        heading: "Screen size and readability",
        content: "DubMenu offers three text sizes to match your screen size. Small text works for tablets and close viewing. Medium text works for standard TVs. Large text works for big screens and long viewing distances. Every size is optimized for readability."
      },
      {
        heading: "Portrait and landscape orientations",
        content: "DubMenu supports both horizontal and vertical screen orientations. Landscape is standard for TVs and monitors. Portrait works well for narrow spaces like checkout counters or shelf ends. The layout adjusts automatically."
      },
      {
        heading: "No special hardware needed",
        content: "You do not need a digital signage player, media box, or proprietary screen. Any device with a web browser works. This includes smart TVs, tablets, computers, and phones. Just open the URL and pair it with your phone."
      }
    ],
    faqs: [
      { q: "What is the best screen size for a menu display?", a: "For waiting areas, 40+ inch TVs work well. For counter displays, 10-15 inch tablets are ideal. For back offices, any monitor works." },
      { q: "Can I use a vertical screen?", a: "Yes. DubMenu supports both portrait and landscape orientations. The layout adjusts automatically." },
      { q: "Do I need a 4K screen?", a: "No. DubMenu works on any resolution. 1080p is sufficient for most displays. 4K looks sharper but is not required." },
      { q: "Can I mount a tablet on the wall?", a: "Yes. Tablets can be wall-mounted using standard tablet mounts. This is a great option for checkout counters or product shelves." }
    ],
    relatedPages: [
      { slug: "dispensary-menu-display", title: "Dispensary Menu Display" },
      { slug: "cannabis-menu-screen", title: "Cannabis Menu Screen" },
      { slug: "dispensary-tv-menu", title: "Dispensary TV Menu" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["dispensary menu display screen", "menu display screen", "digital screen", "cannabis screen", "menu screen"]
  },
  {
    slug: "cannabis-menu-board-software",
    title: "Cannabis Menu Board Software | Menu Management System",
    h1: "Cannabis Menu Board Software for Dispensaries",
    metaDescription: "Get cannabis menu board software that updates from your phone. $99/month. No hardware required. Free 2-week trial. Real-time sync to any screen.",
    introParagraphs: [
      "Cannabis menu board software should be simple, affordable, and effective. It should let you update your menu from anywhere, display it on any screen, and keep everything in sync. It should not require expensive hardware, long contracts, or technical expertise.",
      "DubMenu is cannabis menu board software that runs entirely in the browser. You control it from your phone. It displays on any screen with a web browser. Updates happen in real time. And it costs $99 per month with no setup fee and no long-term contract."
    ],
    sections: [
      {
        heading: "What cannabis menu board software should do",
        content: "Good cannabis menu board software should include product management, category organization, real-time display updates, multi-screen support, and compliance tools. It should also import existing menus from platforms like Dutchie. DubMenu includes all of these features."
      },
      {
        heading: "Cloud-based menu management",
        content: "Your menu data is stored in the cloud, so you can access it from any device. Update your menu from your phone, tablet, or computer. Every change syncs to all connected screens instantly. No manual refresh needed."
      },
      {
        heading: "Import from Dutchie",
        content: "If you already use Dutchie for online ordering, you can import your entire menu into DubMenu with one click. Paste your Dutchie URL, and the software scrapes your products, prices, THC content, strain types, and images. No manual data entry."
      },
      {
        heading: "No installation required",
        content: "DubMenu is entirely web-based. There is no software to install, no app to download, and no updates to manage. The system updates automatically. You always have the latest version without any effort."
      }
    ],
    faqs: [
      { q: "Do I need to install software?", a: "No. DubMenu runs entirely in the browser. There is nothing to download or install." },
      { q: "Can I use it on a Mac or PC?", a: "Yes. DubMenu works on any device with a web browser, including Mac, PC, iOS, and Android." },
      { q: "Is there a mobile app?", a: "No mobile app is needed. The control panel works perfectly in your phone's browser." },
      { q: "How do I back up my data?", a: "You can export your entire menu as a JSON file at any time. Keep it as a backup or import it into another system." }
    ],
    relatedPages: [
      { slug: "dispensary-menu-software", title: "Dispensary Menu Software" },
      { slug: "cannabis-menu-system", title: "Cannabis Menu System" },
      { slug: "digital-menu-board-cannabis", title: "Digital Menu Board Cannabis" },
      { slug: "cannabis-menu-board-system", title: "Cannabis Menu Board System" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["cannabis menu board software", "menu board software", "cannabis software", "menu software", "dispensary software"]
  },
  {
    slug: "digital-menu-board-cannabis",
    title: "Digital Menu Board Cannabis | Menu Boards for Dispensaries",
    h1: "Digital Menu Boards for Cannabis Dispensaries",
    metaDescription: "Get a digital menu board for your cannabis dispensary. $99/month. No hardware required. Free 2-week trial. Update from your phone in real time.",
    introParagraphs: [
      "A digital menu board for cannabis products needs to handle unique requirements: strain types, THC content, weights, and prices. It needs to be clear, current, and professional. And it needs to work on any screen without expensive hardware.",
      "DubMenu is a digital menu board built for cannabis dispensaries. It displays strain badges, THC percentages, prices, and product images in a clean, customizable layout. You control it from your phone, and updates happen in real time. No hardware to buy, no setup fee, no long-term contract."
    ],
    sections: [
      {
        heading: "Built for cannabis products",
        content: "DubMenu understands cannabis products. It shows strain badges, THC content, CBD content, weights, and prices in a format that customers understand. It supports unlimited categories, including flower, pre-rolls, vapes, edibles, concentrates, tinctures, and CBD."
      },
      {
        heading: "Real-time updates from your phone",
        content: "When a product sells out or a price changes, update it from your phone and every screen reflects the change instantly. No need to walk over to the TV, no need to call support, no need to wait for a designer."
      },
      {
        heading: "Professional branding",
        content: "Your menu board should look like part of your dispensary, not a generic template. Upload your logo, set your accent color, choose a custom font, and display your dispensary name. The result is a custom-branded menu board that matches your aesthetic."
      },
      {
        heading: "Affordable pricing",
        content: "DubMenu is $99 per month with no setup fee and no long-term contract. Start with a 2-week free trial and see if it works for your dispensary. Compare that to competitors charging $200 to $500 per month with annual contracts."
      }
    ],
    faqs: [
      { q: "Can I show both THC and CBD content?", a: "Yes. DubMenu supports both THC and CBD fields for every product." },
      { q: "Does it work for medical marijuana?", a: "Yes. DubMenu supports both recreational and medical dispensaries. Customize the disclaimer text for your state requirements." },
      { q: "Can I import my existing menu?", a: "Yes. Import from Dutchie with one click, or add products manually." },
      { q: "How many products can I add?", a: "Unlimited. There is no cap on products or categories." }
    ],
    relatedPages: [
      { slug: "digital-menu-board-for-cannabis-dispensary", title: "Digital Menu Board for Cannabis Dispensary" },
      { slug: "cannabis-menu-board", title: "Cannabis Menu Board" },
      { slug: "digital-menu-board-for-marijuana-dispensary", title: "Digital Menu Board for Marijuana Dispensary" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["digital menu board cannabis", "menu board cannabis", "cannabis digital menu", "dispensary menu", "digital menu"]
  },
  {
    slug: "menu-display-for-dispensary",
    title: "Menu Display for Dispensary | Digital Menu Boards",
    h1: "Menu Displays for Dispensaries: Any Screen, Any Size",
    metaDescription: "Get a menu display for your dispensary. $99/month. No hardware required. Free 2-week trial. Update from your phone in real time.",
    introParagraphs: [
      "A menu display for a dispensary needs to be clear, current, and easy to read. It should show strain types, THC content, prices, and stock status. It should update when products sell out or prices change. And it should work on any screen without expensive hardware.",
      "DubMenu is a menu display system for dispensaries. It turns any screen into a live product display. You control it from your phone. Updates happen in real time. And it costs $99 per month with no setup fee and no long-term contract."
    ],
    sections: [
      {
        heading: "What makes a good dispensary menu display",
        content: "A good dispensary menu display is readable from a distance, shows product details clearly, and updates in real time. It should work on any screen and be affordable enough for small shops. DubMenu meets all of these requirements."
      },
      {
        heading: "Works on any screen",
        content: "DubMenu works on TVs, tablets, monitors, and phones. Any device with a web browser can display your menu. No proprietary hardware, no special displays, no expensive equipment."
      },
      {
        heading: "Three text sizes for different setups",
        content: "Small text for tablets and close viewing. Medium text for standard TVs. Large text for big screens and long viewing distances. Choose the size that works for your setup."
      },
      {
        heading: "Twelve color themes",
        content: "Dark themes for dim dispensaries. Bright themes for well-lit spaces. High-contrast themes for maximum readability. Choose the theme that matches your environment and brand."
      }
    ],
    faqs: [
      { q: "Can I use a tablet as a menu display?", a: "Yes. Tablets work great for counter displays and shelf-mounted menus." },
      { q: "What is the best screen size?", a: "For waiting areas, 40+ inch TVs. For counters, 10-15 inch tablets. For back offices, any monitor works." },
      { q: "Can I use multiple displays?", a: "Yes. Each display gets its own pairing code, and you can control them all from one phone." },
      { q: "Does it work in portrait mode?", a: "Yes. DubMenu supports both portrait and landscape orientations." }
    ],
    relatedPages: [
      { slug: "dispensary-menu-display", title: "Dispensary Menu Display" },
      { slug: "cannabis-menu-display", title: "Cannabis Menu Display" },
      { slug: "dispensary-menu-display-screen", title: "Dispensary Menu Display Screen" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["menu display for dispensary", "dispensary display", "menu display", "cannabis display", "digital display"]
  },
  {
    slug: "cannabis-menu-board-system",
    title: "Cannabis Menu Board System | Menu Management for Dispensaries",
    h1: "Cannabis Menu Board Systems for Dispensaries",
    metaDescription: "Get a cannabis menu board system that updates from your phone. $99/month. No hardware required. Free 2-week trial. Real-time sync to any screen.",
    introParagraphs: [
      "A cannabis menu board system is the complete solution for managing and displaying your product menu. It includes product management, category organization, real-time display updates, and compliance tools. It should be affordable, easy to use, and work on any screen.",
      "DubMenu is a cannabis menu board system that includes all of these features. You manage products from your phone. Displays update in real time. And it works on any device with a web browser. No proprietary hardware, no setup fees, no long-term contracts."
    ],
    sections: [
      {
        heading: "Complete menu management",
        content: "Add products, set prices, organize categories, and manage stock status from your phone. Every change syncs to all connected displays instantly. No need to walk over to the TV or use a separate computer."
      },
      {
        heading: "Real-time display updates",
        content: "When you update a price or toggle a product out of stock, every display reflects the change immediately. The system uses WebSocket technology to push updates in real time. There is no delay, no refresh button, and no manual syncing."
      },
      {
        heading: "Multi-screen support",
        content: "Run one display or twenty. Each screen gets its own pairing code and can show independent or synchronized content. Assign different categories to different screens, or show the same menu everywhere."
      },
      {
        heading: "Compliance tools",
        content: "Display age verification notices, medical warnings, and state-specific compliance text. Update the disclaimer once, and it appears on every screen on your account."
      }
    ],
    faqs: [
      { q: "Can I manage multiple displays?", a: "Yes. Each display gets its own pairing code and can show the same menu. Control them all from one phone." },
      { q: "Is there a product limit?", a: "No. DubMenu supports unlimited products and categories." },
      { q: "Can I import from my existing menu?", a: "Yes. Import from Dutchie with one click, or add products manually." },
      { q: "Does it work for medical dispensaries?", a: "Yes. The disclaimer text and categories are fully customizable for medical or recreational dispensaries." }
    ],
    relatedPages: [
      { slug: "cannabis-menu-system", title: "Cannabis Menu System" },
      { slug: "cannabis-menu-board-software", title: "Cannabis Menu Board Software" },
      { slug: "digital-menu-board-for-dispensaries", title: "Digital Menu Board for Dispensaries" },
      { slug: "cannabis-menu-board-system", title: "Cannabis Menu Board System" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["cannabis menu board system", "menu board system", "cannabis system", "dispensary system", "menu system"]
  },
  {
    slug: "weed-menu-display",
    title: "Weed Menu Display | Digital Menu Boards for Cannabis Shops",
    h1: "Weed Menu Displays That Update From Your Phone",
    metaDescription: "Get a weed menu display that updates in real time. No hardware, no setup fees. $99/month after a 2-week free trial. Try the demo now.",
    introParagraphs: [
      "A weed menu display should be as straightforward as the product it sells. Customers want to see what is available, how much it costs, and how strong it is. They do not want to squint at a handwritten chalkboard or flip through a stained paper menu.",
      "DubMenu is a digital weed menu display that shows your products clearly on any screen. Display strain names, THC content, prices, weights, and stock status. Update everything from your phone. No hardware to buy, no app to install, no setup fee."
    ],
    sections: [
      {
        heading: "Why digital displays beat paper menus",
        content: "Paper menus get damaged, outdated, and lost. When a strain sells out, you cross it out with a marker. When a price changes, you print a new menu. A digital display eliminates all of this. Update from your phone, and the display is always current."
      },
      {
        heading: "Strain information at a glance",
        content: "Weed customers care about strain type and potency. DubMenu shows color-coded strain badges so customers can scan the menu and find what they want. THC percentages are displayed prominently, so potency is never a question."
      },
      {
        heading: "Affordable for small shops",
        content: "Many digital menu providers charge $200 to $500 per month, which is too expensive for small weed shops. DubMenu is $99 per month with no setup fee and no hardware requirement. Start with a 2-week free trial."
      },
      {
        heading: "Works on any screen",
        content: "Any screen with a web browser works. Smart TVs, tablets, monitors, and even phones. No proprietary hardware required."
      }
    ],
    faqs: [
      { q: "Can I use this for a small shop?", a: "Yes. DubMenu is designed for shops of all sizes. Whether you have 10 products or 500, it scales to fit." },
      { q: "Do I need technical skills?", a: "No. Open a URL, scan a code, and your menu is live. No coding, no installation, no IT support." },
      { q: "Can I show edibles and concentrates?", a: "Yes. Unlimited categories including flower, pre-rolls, vapes, edibles, concentrates, tinctures, CBD, and accessories." },
      { q: "What if I only have one screen?", a: "One screen is enough. Start with one and add more as you grow." }
    ],
    relatedPages: [
      { slug: "weed-menu-board", title: "Weed Menu Board" },
      { slug: "cannabis-menu-display", title: "Cannabis Menu Display" },
      { slug: "marijuana-menu-display", title: "Marijuana Menu Display" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["weed menu display", "weed display", "cannabis display", "menu display", "digital display"]
  },
  {
    slug: "marijuana-menu-display",
    title: "Marijuana Menu Display | Digital Menu Boards for Dispensaries",
    h1: "Marijuana Menu Displays for Dispensaries and Shops",
    metaDescription: "Get a marijuana menu display that updates in real time. No hardware required. $99/month. Free 2-week trial. Try the demo now.",
    introParagraphs: [
      "A marijuana menu display is the first thing customers see when they enter your dispensary. It needs to be clear, current, and professional. A handwritten chalkboard or faded paper menu sends the wrong message. A digital display tells customers you are modern and organized.",
      "DubMenu turns any screen into a marijuana menu display. It shows products, prices, strain types, and THC content in a clean, readable format. You control it from your phone, and every update appears instantly. No hardware to buy, no setup fee, no long-term contract."
    ],
    sections: [
      {
        heading: "What customers expect to see",
        content: "Marijuana consumers want detailed product information: strain type, THC percentage, CBD content, weight, price, and brand. A professional display shows all of this clearly. DubMenu handles strain badges, potency labels, price formatting, and stock status automatically."
      },
      {
        heading: "Real-time updates",
        content: "When a product sells out or a price changes, update it from your phone and the display reflects the change immediately. No need to walk over to the TV or use a separate computer."
      },
      {
        heading: "Manage every display from one phone",
        content: "If you run more than one screen in your dispensary, keeping menu displays consistent can be a challenge. DubMenu lets you pair as many displays as you need from one account, so they all show the same menu and update together."
      },
      {
        heading: "Compliance-ready",
        content: "Display age verification and compliance notices on every screen. Update the text once, and it appears on every screen on your account instantly."
      }
    ],
    faqs: [
      { q: "Can I display medical and recreational products?", a: "Yes. Organize products into separate categories or display them together." },
      { q: "How do I update the menu?", a: "Tap the product on your phone, make your changes, and the display updates instantly." },
      { q: "Can I show product images?", a: "Yes. Upload images manually or import them from Dutchie." },
      { q: "Does it work for delivery services?", a: "Yes. Display your menu on a tablet at the pickup counter or on a monitor in the back office." }
    ],
    relatedPages: [
      { slug: "marijuana-menu-board", title: "Marijuana Menu Board" },
      { slug: "cannabis-menu-display", title: "Cannabis Menu Display" },
      { slug: "weed-menu-display", title: "Weed Menu Display" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["marijuana menu display", "marijuana display", "cannabis display", "menu display", "digital display"]
  },
  {
    slug: "dispensary-menu-board-screen",
    title: "Dispensary Menu Board Screen | Digital Menu Displays",
    h1: "Dispensary Menu Board Screens for Every Setup",
    metaDescription: "Turn any screen into a dispensary menu board. $99/month. No hardware required. Free 2-week trial. Update from your phone in real time.",
    introParagraphs: [
      "A dispensary menu board screen is the face of your product lineup. It needs to be clear, current, and professional. Whether it is a large TV in the waiting area or a tablet behind the counter, the screen should make your products look their best.",
      "DubMenu turns any screen into a live dispensary menu board. It works on TVs, tablets, monitors, and phones. You control it from your phone, and every update appears instantly. No proprietary hardware, no setup fees, no long-term contracts."
    ],
    sections: [
      {
        heading: "Choosing the right screen",
        content: "Large TVs work well for waiting areas. Tablets are ideal for counter displays. Monitors work for back offices. DubMenu supports all of these setups and automatically adjusts the layout for each screen size."
      },
      {
        heading: "Screen size and readability",
        content: "DubMenu offers three text sizes: small for tablets, medium for standard TVs, and large for big screens. Every size is optimized for readability from the typical viewing distance."
      },
      {
        heading: "Portrait and landscape support",
        content: "DubMenu works in both horizontal and vertical orientations. Landscape is standard for TVs. Portrait works well for narrow spaces like checkout counters. The layout adjusts automatically."
      },
      {
        heading: "No special hardware needed",
        content: "Any device with a web browser works. No digital signage player, media box, or proprietary screen required."
      }
    ],
    faqs: [
      { q: "What is the best screen size?", a: "40+ inch TVs for waiting areas. 10-15 inch tablets for counters. Any monitor for back offices." },
      { q: "Can I mount a tablet on the wall?", a: "Yes. Tablets can be wall-mounted using standard tablet mounts." },
      { q: "Do I need a 4K screen?", a: "No. 1080p is sufficient for most displays. 4K looks sharper but is not required." },
      { q: "Can I use multiple screens?", a: "Yes. Each screen gets its own pairing code, and you can control them all from one phone." }
    ],
    relatedPages: [
      { slug: "dispensary-menu-display-screen", title: "Dispensary Menu Display Screen" },
      { slug: "cannabis-menu-screen", title: "Cannabis Menu Screen" },
      { slug: "dispensary-tv-menu", title: "Dispensary TV Menu" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["dispensary menu board screen", "menu board screen", "digital screen", "cannabis screen", "menu screen"]
  },
  {
    slug: "cannabis-menu-board-price",
    title: "Cannabis Menu Board Price | Affordable Menu Boards for Dispensaries",
    h1: "Cannabis Menu Board Pricing: $99/Month, No Setup Fee",
    metaDescription: "Affordable cannabis menu boards at $99/month. No setup fee, no hardware required. Free 2-week trial. Update from your phone in real time.",
    introParagraphs: [
      "Cannabis menu board pricing should be straightforward and affordable. You should not need to pay a setup fee, buy proprietary hardware, or sign a long-term contract. The price should be low enough that small dispensaries can afford it, and the features should be robust enough for large operations.",
      "DubMenu is $99 per month. There is no setup fee, no hardware requirement, and no long-term contract. You get a 2-week free trial to test the system. If it does not work for you, cancel anytime."
    ],
    sections: [
      {
        heading: "Transparent pricing",
        content: "$99 per month. That is it. No setup fee, no onboarding cost, no hidden charges. No hardware to buy. No long-term contract. Start with a 2-week free trial, and if you like it, continue at $99/month. Cancel anytime."
      },
      {
        heading: "Compare to competitors",
        content: "Many cannabis menu board providers charge $200 to $500 per month, plus a $500 setup fee, plus the cost of their proprietary hardware. Some require annual contracts. DubMenu is $99 per month with no setup fee and no hardware requirement. That is a savings of $1,200 to $4,800 per year."
      },
      {
        heading: "What is included",
        content: "Everything. Unlimited products, unlimited categories, unlimited screens, real-time updates, Dutchie import, 12 color themes, 3 text sizes, promotional banners, compliance disclaimers, and phone-based control. There are no premium tiers or upsells."
      },
      {
        heading: "Free trial",
        content: "Every new account gets a 2-week free trial. No credit card required. Test the system with your actual products and see if it works for your dispensary. If it does not, you walk away with no obligation."
      }
    ],
    faqs: [
      { q: "Is there really no setup fee?", a: "Correct. Zero setup fee. Zero onboarding cost. Zero hidden charges." },
      { q: "Can I cancel anytime?", a: "Yes. No long-term contract. Cancel whenever you want. Your data is exportable." },
      { q: "Do I need to buy hardware?", a: "No. DubMenu works on any screen with a web browser. Use your existing TV, tablet, or monitor." },
      { q: "What happens after the free trial?", a: "After 2 weeks, choose to continue at $99/month or cancel. No obligation." }
    ],
    relatedPages: [
      { slug: "digital-menu-board-dispensary", title: "Digital Menu Board Dispensary" },
      { slug: "affordable-dispensary-menu-board", title: "Affordable Dispensary Menu Board" },
      { slug: "cheap-cannabis-menu-board", title: "Cheap Cannabis Menu Board" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["cannabis menu board price", "menu board price", "cannabis menu pricing", "affordable menu board", "menu board cost"]
  },
  {
    slug: "digital-menu-board-for-marijuana-dispensary",
    title: "Digital Menu Board for Marijuana Dispensary | Menu Boards",
    h1: "Digital Menu Boards for Marijuana Dispensaries",
    metaDescription: "Get a digital menu board for your marijuana dispensary. $99/month. No hardware required. Free 2-week trial. Update from your phone in real time.",
    introParagraphs: [
      "A digital menu board for a marijuana dispensary needs to handle unique requirements: strain types, THC content, weights, and prices. It needs to be clear, current, and professional. And it needs to work on any screen without expensive hardware.",
      "DubMenu is a digital menu board built for marijuana dispensaries. It displays strain badges, THC percentages, prices, and product images in a clean, customizable layout. You control it from your phone, and updates happen in real time. No hardware to buy, no setup fee, no long-term contract."
    ],
    sections: [
      {
        heading: "Built for marijuana products",
        content: "DubMenu understands marijuana products. It shows strain badges, THC content, CBD content, weights, and prices in a format that customers understand. It supports unlimited categories, including flower, pre-rolls, vapes, edibles, concentrates, tinctures, and CBD."
      },
      {
        heading: "Real-time updates from your phone",
        content: "When a product sells out or a price changes, update it from your phone and every screen reflects the change instantly. No need to walk over to the TV or call support."
      },
      {
        heading: "Professional branding",
        content: "Upload your logo, set your accent color, choose a custom font, and display your dispensary name. The result is a custom-branded menu board that matches your aesthetic."
      },
      {
        heading: "Affordable pricing",
        content: "DubMenu is $99 per month with no setup fee and no long-term contract. Start with a 2-week free trial and see if it works for your dispensary."
      }
    ],
    faqs: [
      { q: "Can I show both THC and CBD content?", a: "Yes. DubMenu supports both THC and CBD fields for every product." },
      { q: "Does it work for medical marijuana?", a: "Yes. Customize the disclaimer text for your state requirements." },
      { q: "Can I import my existing menu?", a: "Yes. Import from Dutchie with one click, or add products manually." },
      { q: "How many products can I add?", a: "Unlimited. There is no cap on products or categories." }
    ],
    relatedPages: [
      { slug: "digital-menu-board-for-cannabis-dispensary", title: "Digital Menu Board for Cannabis Dispensary" },
      { slug: "marijuana-menu-board", title: "Marijuana Menu Board" },
      { slug: "digital-menu-board-cannabis", title: "Digital Menu Board Cannabis" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["digital menu board for marijuana dispensary", "marijuana menu board", "cannabis menu board", "dispensary menu board", "digital menu"]
  },
  {
    slug: "cannabis-menu-board-cost",
    title: "Cannabis Menu Board Cost | Pricing & Plans for Dispensaries",
    h1: "Cannabis Menu Board Cost: $99/Month, No Hidden Fees",
    metaDescription: "Transparent cannabis menu board pricing. $99/month with no setup fee. Free 2-week trial. No hardware required. Update from your phone in real time.",
    introParagraphs: [
      "The cost of a cannabis menu board should be straightforward. You should know exactly what you are paying for, with no hidden fees, no setup costs, and no long-term contracts. The price should be affordable enough for small dispensaries and scalable enough for large operations.",
      "DubMenu is $99 per month. There is no setup fee, no hardware requirement, and no long-term contract. You get a 2-week free trial to test the system. If it does not work for you, cancel anytime."
    ],
    sections: [
      {
        heading: "Simple pricing",
        content: "$99 per month. That is the only price. No setup fee, no onboarding cost, no hidden charges. No hardware to buy. No long-term contract. Every feature is included."
      },
      {
        heading: "Compare to competitors",
        content: "Many providers charge $200 to $500 per month, plus a $500 setup fee, plus hardware costs. Some require annual contracts. DubMenu is $99 per month with no setup fee and no hardware. That saves you $1,200 to $4,800 per year."
      },
      {
        heading: "Everything is included",
        content: "Unlimited products, unlimited categories, unlimited screens, real-time updates, Dutchie import, 12 themes, 3 text sizes, promotional banners, compliance disclaimers, and phone-based control. No premium tiers. No upsells."
      },
      {
        heading: "Free trial",
        content: "Every new account gets a 2-week free trial. No credit card required. Test with your actual products. If it does not work, cancel with no obligation."
      }
    ],
    faqs: [
      { q: "Is there a setup fee?", a: "No. Zero setup fee. Zero onboarding cost." },
      { q: "Can I cancel anytime?", a: "Yes. No contract. Cancel whenever you want." },
      { q: "Do I need to buy hardware?", a: "No. Works on any screen with a web browser." },
      { q: "What happens after the trial?", a: "Choose to continue at $99/month or cancel. No obligation." }
    ],
    relatedPages: [
      { slug: "cannabis-menu-board-price", title: "Cannabis Menu Board Price" },
      { slug: "affordable-dispensary-menu-board", title: "Affordable Dispensary Menu Board" },
      { slug: "cheap-cannabis-menu-board", title: "Cheap Cannabis Menu Board" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["cannabis menu board cost", "menu board cost", "cannabis menu pricing", "affordable menu board", "menu board price"]
  },
  {
    slug: "best-cannabis-menu-board",
    title: "Best Cannabis Menu Board | Top-Rated Menu Boards for Dispensaries",
    h1: "Best Cannabis Menu Boards for Dispensaries",
    metaDescription: "The best cannabis menu board for dispensaries. $99/month. No hardware required. Free 2-week trial. Update from your phone in real time.",
    introParagraphs: [
      "The best cannabis menu board is affordable, easy to use, and works on any screen. It should update in real time from your phone. It should display strain types, THC content, and prices clearly. And it should not require expensive hardware or long-term contracts.",
      "DubMenu is designed to be a top cannabis menu board for dispensaries. It is $99 per month with no setup fee and no hardware requirement. You control it from your phone. Updates happen in real time. And it works on any device with a web browser."
    ],
    sections: [
      {
        heading: "What to look for",
        content: "Look for a menu board that is readable, accurate, and easy to update. It should show strain type, THC content, price, and weight clearly. It should work on any screen without proprietary hardware. It should be affordable and contract-free. DubMenu is built to meet these criteria."
      },
      {
        heading: "Why dispensaries choose DubMenu",
        content: "DubMenu is chosen by dispensaries because it is affordable, easy to use, and works on any screen. There is no hardware to buy, no setup fee, and no long-term contract. Updates happen in real time from your phone. And every feature is included in the flat $99/month price."
      },
      {
        heading: "Key features to evaluate",
        content: "When evaluating a cannabis menu board, check for real-time updates, phone-based control, multiple themes, and no hardware requirements. Make sure it displays strain type, THC content, and prices clearly. Test the free trial to see if it works for your dispensary."
      },
      {
        heading: "Try it free for 2 weeks",
        content: "The best way to evaluate a cannabis menu board is to try it. DubMenu offers a 2-week free trial with no credit card required. Test it with your actual products and see if it works for your dispensary."
      }
    ],
    faqs: [
      { q: "What makes DubMenu a strong choice?", a: "It is affordable, easy to use, works on any screen, and updates in real time from your phone. No hardware, no setup fee, no contract." },
      { q: "Can I try it before buying?", a: "Yes. 2-week free trial with no credit card required." },
      { q: "Does it work for small dispensaries?", a: "Yes. DubMenu is designed for dispensaries of all sizes." },
      { q: "What if I need help?", a: "Email support with under 24-hour response time." }
    ],
    relatedPages: [
      { slug: "cannabis-menu-board", title: "Cannabis Menu Board" },
      { slug: "digital-menu-board-for-cannabis-dispensary", title: "Digital Menu Board for Cannabis Dispensary" },
      { slug: "affordable-dispensary-menu-board", title: "Affordable Dispensary Menu Board" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["best cannabis menu board", "best menu board", "top rated menu board", "cannabis menu board", "dispensary menu board"]
  },
  {
    slug: "cheap-cannabis-menu-board",
    title: "Cheap Cannabis Menu Board | Affordable Menu Boards for Dispensaries",
    h1: "Cheap Cannabis Menu Boards: Affordable Quality for Dispensaries",
    metaDescription: "Get a cheap cannabis menu board that works. $99/month. No hardware required. Free 2-week trial. Update from your phone in real time.",
    introParagraphs: [
      "A cheap cannabis menu board should not mean low quality. It should mean affordable pricing without sacrificing features. It should work on any screen, update in real time, and display your products professionally. And it should not require expensive hardware or long-term contracts.",
      "DubMenu is a cheap cannabis menu board that does not compromise on quality. It is $99 per month with no setup fee and no hardware requirement. You control it from your phone. Updates happen in real time. And every feature is included."
    ],
    sections: [
      {
        heading: "Affordable does not mean low quality",
        content: "DubMenu is $99 per month, which is cheaper than most competitors. But it includes unlimited products, unlimited categories, unlimited screens, real-time updates, Dutchie import, 12 themes, and phone-based control. There are no premium tiers or hidden fees."
      },
      {
        heading: "No hardware costs",
        content: "Many menu boards require you to buy a proprietary display or media player. DubMenu works on any screen with a web browser. Use your existing TV, tablet, or monitor. No additional hardware costs."
      },
      {
        heading: "No setup fee",
        content: "Most providers charge a $500 setup fee. DubMenu has zero setup fee. Open the URL, scan the code, and your menu is live. The entire process takes under a minute."
      },
      {
        heading: "No long-term contract",
        content: "Many providers require annual contracts. DubMenu has no contract. Cancel anytime. You are not locked in if the system does not work for you."
      }
    ],
    faqs: [
      { q: "Is $99/month really cheap?", a: "Compared to competitors charging $200-$500/month plus setup fees, yes. DubMenu is one of the most affordable options on the market." },
      { q: "Are there hidden fees?", a: "No. $99/month is the only price. No setup fee, no hardware cost, no hidden charges." },
      { q: "Can I get a discount?", a: "DubMenu is a flat $99/month with no setup fee. We do not currently offer multi-account discounts, but you can contact support to discuss your needs." },
      { q: "Is the free trial really free?", a: "Yes. 2 weeks, no credit card required. Test the full system with no obligation." }
    ],
    relatedPages: [
      { slug: "affordable-dispensary-menu-board", title: "Affordable Dispensary Menu Board" },
      { slug: "cannabis-menu-board-price", title: "Cannabis Menu Board Price" },
      { slug: "cannabis-menu-board-cost", title: "Cannabis Menu Board Cost" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["cheap cannabis menu board", "affordable menu board", "cheap menu board", "cannabis menu board", "menu board"]
  },
  {
    slug: "affordable-dispensary-menu-board",
    title: "Affordable Dispensary Menu Board | Cheap Menu Boards That Work",
    h1: "Affordable Dispensary Menu Boards: $99/Month, No Setup Fee",
    metaDescription: "Get an affordable dispensary menu board. $99/month. No hardware required. Free 2-week trial. Update from your phone in real time.",
    introParagraphs: [
      "An affordable dispensary menu board should not sacrifice quality for price. It should display products clearly, update in real time, and work on any screen. And it should be priced so that small and mid-size dispensaries can afford it.",
      "DubMenu is an affordable dispensary menu board that includes every feature you need. It is $99 per month with no setup fee and no hardware requirement. You control it from your phone. Updates happen in real time. And it works on any device with a web browser."
    ],
    sections: [
      {
        heading: "Pricing that works for every dispensary",
        content: "DubMenu is $99 per month. There are no premium tiers, no feature restrictions, and no hidden fees. The price is the same for every dispensary. Every feature is included."
      },
      {
        heading: "No hardware costs",
        content: "Use your existing TV, tablet, or monitor. No proprietary displays, no media players, no special equipment. Any screen with a web browser works."
      },
      {
        heading: "No setup fee",
        content: "Zero setup fee. Zero onboarding cost. Zero installation charges. Open the URL, scan the code, and your menu is live. The entire process takes under a minute."
      },
      {
        heading: "No long-term contract",
        content: "Cancel anytime. There is no annual contract, no cancellation fee, and no penalty. Your data is exportable, so you can take it with you."
      }
    ],
    faqs: [
      { q: "Is it really affordable?", a: "At $99/month with no setup fee, DubMenu is one of the most affordable menu boards on the market." },
      { q: "Are there hidden fees?", a: "No. $99/month is the only price. Every feature is included." },
      { q: "Can I get a refund?", a: "If you cancel within the first 30 days, you can request a full refund." },
      { q: "Is the free trial really free?", a: "Yes. 2 weeks, no credit card required. Test the full system with no obligation." }
    ],
    relatedPages: [
      { slug: "cheap-cannabis-menu-board", title: "Cheap Cannabis Menu Board" },
      { slug: "cannabis-menu-board-price", title: "Cannabis Menu Board Price" },
      { slug: "digital-menu-board-dispensary", title: "Digital Menu Board Dispensary" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["affordable dispensary menu board", "affordable menu board", "cheap menu board", "dispensary menu board", "menu board"]
  },
  {
    slug: "dutchie-menu-board-alternative",
    title: "Dutchie Menu Board Alternative | Better Pricing, No Setup Fee",
    h1: "Dutchie Menu Board Alternative: $99/Month, No Hardware",
    metaDescription: "Looking for a Dutchie menu board alternative? Try DubMenu. $99/month. No hardware required. Free 2-week trial. Update from your phone in real time.",
    introParagraphs: [
      "If you are looking for a Dutchie menu board alternative, you are probably frustrated with high prices, hardware requirements, or long-term contracts. You want a menu board that is affordable, easy to use, and works on any screen.",
      "DubMenu is a strong Dutchie menu board alternative. It is $99 per month with no setup fee and no hardware requirement. You can import your Dutchie menu with one click. You control it from your phone. And updates happen in real time."
    ],
    sections: [
      {
        heading: "Why switch from Dutchie",
        content: "Dutchie is a great ordering platform, but their menu board solution may be expensive or require specific hardware. DubMenu is a dedicated menu board system that is more affordable, works on any screen, and includes features designed specifically for in-store displays."
      },
      {
        heading: "Import your Dutchie menu instantly",
        content: "Paste your Dutchie URL into DubMenu, and the system scrapes your products, prices, THC content, strain types, and images. No manual data entry. Your entire menu is imported in seconds."
      },
      {
        heading: "More affordable pricing",
        content: "DubMenu is $99 per month with no setup fee and no hardware requirement. Compare that to Dutchie's pricing, which may include hardware costs and higher monthly fees."
      },
      {
        heading: "Works on any screen",
        content: "DubMenu works on any device with a web browser. No proprietary hardware, no special displays, no media players. Use your existing TV, tablet, or monitor."
      }
    ],
    faqs: [
      { q: "Can I import my Dutchie menu?", a: "Yes. Paste your Dutchie URL, and DubMenu imports your products, prices, and images automatically." },
      { q: "Is DubMenu cheaper than Dutchie?", a: "DubMenu is $99/month with no setup fee. Compare this to Dutchie's pricing for menu boards." },
      { q: "Can I use both Dutchie and DubMenu?", a: "Yes. Many dispensaries use Dutchie for online ordering and DubMenu for in-store displays. They work independently." },
      { q: "Will my menu sync with Dutchie?", a: "Currently, DubMenu imports from Dutchie but does not sync bidirectionally. You update DubMenu independently." }
    ],
    relatedPages: [
      { slug: "digital-menu-board-for-cannabis-dispensary", title: "Digital Menu Board for Cannabis Dispensary" },
      { slug: "cannabis-menu-board-software", title: "Cannabis Menu Board Software" },
      { slug: "affordable-dispensary-menu-board", title: "Affordable Dispensary Menu Board" }
    ],
    schemaType: "SoftwareApplication",
    keywords: ["dutchie menu board alternative", "dutchie alternative", "menu board alternative", "cannabis menu board", "dispensary menu board"]
  }
];
