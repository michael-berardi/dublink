import { Env as SessionEnv, SessionDurableObject, SESSION_ID_REGEX } from './session';
import { AccountDurableObject, createAccount, authenticate, signToken, setCookie, clearCookie, getCookieValue, isSubscriptionActive, getAccount, addSessionToAccount, generateSessionId } from './auth';
import { StatsDurableObject } from './stats';
import { DomainDurableObject } from './domains';
import { buildDubHavenAuthUrl, handleDubHavenCallback, isDubHavenStartConfigured } from './dubhaven-auth';
import { tvPage } from './html-tv';
import { menuPage } from './html-menu';
import { configPage } from './html-config';
import { landingPage } from './html-landing';
import { pseoPage, getAllPSEOSlugs } from './html-pseo';
import { pricingPage } from './html-pricing';
import { faqPage } from './html-faq';
import { aboutPage } from './html-about';
import { contactPage } from './html-contact';
import { privacyPage } from './html-privacy';
import { termsPage } from './html-terms';
import { authPage } from './html-auth';
import { statusPage } from './html-status';
import { adminPage } from './html-admin';
import { widgetPage, widgetJs } from './html-widget';
import { getStatus } from './status';
import { resolveMenuSource } from './menu-source';
import { formatMenu } from './menu-formatter';
import { importMenuFromCSV } from './csv-import';
import { createStarterConfig } from './starter-template';
import { handleImageUpload, serveImage, deleteAccountUploads, listAccountUploads, deleteUpload } from './upload';
import { createCheckoutSession, createCustomerPortalSession, verifyWebhookSignature, subscriptionStatusFromStripe, trialEndsAtFromStripe, isDuplicateEvent, recordEvent as recordStripeEvent, cancelSubscription } from './stripe';

export { SessionDurableObject, AccountDurableObject, StatsDurableObject, DomainDurableObject };

export interface Env extends SessionEnv {
  STRIPE_API_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID?: string;
  AUTH_SECRET?: string;
  APP_URL?: string;
  TV_URL?: string;
  ADMIN_EMAILS?: string;
  STATS?: DurableObjectNamespace;
  DOMAINS?: DurableObjectNamespace;
  UPLOADS?: R2Bucket;
  DUBHAVEN_AUTH_URL?: string;
  DUBHAVEN_ACCOUNT_SECRET?: string;
  DUBHAVEN_ISSUER?: string;
  DUTCHIE_API_KEY?: string;
  BROWSERLESS_TOKEN?: string;
}

async function recordEvent(env: Env, event: { type: string; accountId?: string; email?: string; payload?: any }): Promise<void> {
  if (!env.STATS) return;
  try {
    const statsId = env.STATS.idFromName('global');
    const stub = env.STATS.get(statsId);
    await stub.fetch(new Request('https://internal/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, timestamp: Date.now() }),
    }));
  } catch (err) {
    console.error('Failed to record stats event:', err);
  }
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const HTML_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' ws: wss: https:; font-src 'self'; media-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';";

function htmlResponse(body: string, status: number = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': HTML_CSP,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...SECURITY_HEADERS,
    },
  });
}

// Same as htmlResponse but allows the page to be embedded in an iframe on the
// same origin (used by the desktop config simulator so the preview reuses the
// real TV renderer without weakening the default frame-ancestors policy).
function tvEmbedResponse(body: string, status: number = 200): Response {
  const embedCsp = HTML_CSP.replace("frame-ancestors 'none';", "frame-ancestors 'self';");
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': embedCsp,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...SECURITY_HEADERS,
    },
  });
}

function jsonResponse(body: object, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...SECURITY_HEADERS,
    },
  });
}

function errorResponse(message: string, status: number = 400): Response {
  return new Response(message, { status, headers: SECURITY_HEADERS });
}

function redirectResponse(location: string, cookies?: string[]): Response {
  const headers: Record<string, string> = { Location: location, ...SECURITY_HEADERS };
  if (cookies) {
    headers['Set-Cookie'] = cookies.length === 1 ? cookies[0] : cookies.join(', ');
  }
  return new Response(null, { status: 302, headers });
}

async function requireAuth(request: Request, env: Env): Promise<{ accountId: string; email: string } | null> {
  const tokenStr = getCookieValue(request, 'dubmenu_auth');
  if (!tokenStr || !env.AUTH_SECRET) return null;
  const { verifyToken } = await import('./auth');
  const token = await verifyToken(tokenStr, env.AUTH_SECRET);
  if (!token) return null;
  return { accountId: token.accountId, email: token.email };
}

function appUrl(env: Env, request: Request): string {
  // On localhost the hardcoded APP_URL from wrangler.toml points at the
  // production domain, which breaks cookie-scoped fetches and redirects
  // (e.g. /api/sessions in the account page). Prefer the actual request
  // origin for localhost/127.0.0.1 so links and fetches stay local.
  const requestUrl = new URL(request.url);
  const host = requestUrl.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
    return requestUrl.origin;
  }
  return env.APP_URL || requestUrl.origin;
}

function tvUrl(env: Env): string {
  return env.TV_URL || 'https://tv.dubmenu.com';
}

// Auto-create a starter display for an account with zero sessions. Seeds the
// new Session Durable Object with the starter template, claims ownership for
// the account, and registers the session on the account. Returns the new sessionId.
async function createStarterDisplay(env: Env, accountId: string): Promise<string> {
  const sessionId = generateSessionId();
  const starter = createStarterConfig();
  const id = env.SESSION.idFromName(sessionId);
  const session = env.SESSION.get(id);
  await session.fetch(new Request('https://internal/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Account-Id': accountId },
    body: JSON.stringify(starter),
  }));
  await addSessionToAccount(env, accountId, sessionId);
  return sessionId;
}

// Allowlist of origins permitted to issue credentialed (cookie-bearing)
// cross-origin requests. Used by both the CORS preflight handler and the
// CSRF gate. env-derived values are appended when present so staging/dev
// environments keep working.
function allowedOrigins(env: Env): string[] {
  const origins = new Set<string>([
    'https://dubmenu.com',
    'https://tv.dubmenu.com',
    'http://localhost:8787',
    'http://localhost:8792',
  ]);
  if (env.APP_URL) origins.add(env.APP_URL);
  if (env.TV_URL) origins.add(env.TV_URL);
  return [...origins];
}

// CSRF defense for cookie-authenticated state-changing requests.
//
// Strategy (defense in depth on top of the SameSite=Lax auth cookie):
//   1. Sec-Fetch-Site (modern browsers): the browser asserts the request's
//      relationship to the target origin. We accept same-origin / same-site
//      / none (top-level user navigation) and reject cross-site.
//   2. Origin fallback (older browsers, or when Sec-Fetch-Site is absent):
//      if an Origin header is present it must be in the allowlist. If Origin
//      is absent we allow the request through, because the SameSite=Lax
//      cookie already prevents it from being attached cross-site.
//
// Returns true when the request should be allowed, false when it must be
// rejected as a likely CSRF attempt.
function passesCsrf(request: Request, env: Env): boolean {
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite) {
    if (fetchSite === 'cross-site') return false;
    return fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none';
  }
  const origin = request.headers.get('Origin');
  if (origin) {
    return allowedOrigins(env).includes(origin);
  }
  return true;
}

// Escape user-controlled strings for safe interpolation into HTML text/attr
// contexts. Mirrors the escapeHtml helper used across the html-*.ts modules.
function escapeHtml(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Render a print-optimized standalone menu page for an operator's own session.
// `config` is the shape returned by the SessionDurableObject `/widget` endpoint
// (dispensaryName + categories[] with products[]). Out-of-stock products are
// omitted. All user-controlled strings are HTML-escaped.
function printPage(sessionId: string, config: any, _origin: string): string {
  const dispensaryName = escapeHtml(config?.dispensaryName || 'Menu');
  const currency = config?.currency || '$';
  const categories: any[] = Array.isArray(config?.categories) ? config.categories : [];

  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const sections = categories
    .filter((cat) => cat && Array.isArray(cat.products) && cat.products.some((p: any) => p && p.inStock !== false))
    .map((cat) => {
      const catName = escapeHtml(cat.name || 'Category');
      const items = cat.products
        .filter((p: any) => p && p.inStock !== false)
        .map((p: any) => {
          const name = escapeHtml(p.name || '');
          // Strain type indicator after product name
          let strainHtml = '';
          if (p.strain) {
            const strainColors: Record<string, string> = { indica: '#8b5cf6', sativa: '#f97316', hybrid: '#22c55e' };
            const color = strainColors[p.strain] || '#555';
            const label = p.strain.charAt(0).toUpperCase() + p.strain.slice(1);
            strainHtml = ' <span style="color:' + color + ';font-weight:700;font-size:0.85em;">[' + label + ']</span>';
          }
          // Price tiers override flat price when available
          let priceHtml: string;
          if (p.priceTiers && Array.isArray(p.priceTiers) && p.priceTiers.length > 0) {
            const tiers = p.priceTiers.map((t: any) => {
              const tLabel = escapeHtml(t?.label || '');
              const tPrice = escapeHtml(t?.price || '');
              if (!tLabel || !tPrice) return '';
              return '<span style="display:inline-block;padding:0.05rem 0.35rem;border:0.5px solid #999;border-radius:0.2rem;margin-right:0.25rem;font-size:0.8rem;"><span style="font-size:0.7rem;color:#777;text-transform:uppercase;">' + tLabel + '</span> ' + tPrice + '</span>';
            }).join('');
            priceHtml = '<span class="price" style="font-size:0.85rem;">' + tiers + '</span>';
          } else {
            const price = typeof p.price === 'number'
              ? currency + p.price.toFixed(2).replace(/\.00$/, '')
              : escapeHtml(p.price);
            priceHtml = '<span class="price">' + price + '</span>';
          }
          const meta: string[] = [];
          if (p.sku) meta.push(escapeHtml(p.sku));
          if (p.thc) meta.push('THC ' + escapeHtml(p.thc));
          if (p.cbd) meta.push('CBD ' + escapeHtml(p.cbd));
          if (p.weight) meta.push(escapeHtml(p.weight));
          if (p.brand) meta.push(escapeHtml(p.brand));
          const metaHtml = meta.length ? `<span class="meta">${meta.join(' &middot; ')}</span>` : '';
          return `<li class="product"><span class="name">${name}${strainHtml}</span><span class="dots"></span>${priceHtml}${metaHtml ? `<div class="meta-line">${metaHtml}</div>` : ''}</li>`;
        })
        .join('\n');
      return `<section class="category"><h2>${catName}</h2><ul class="products">${items}</ul></section>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${dispensaryName} - Menu</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 2rem;
    line-height: 1.4;
  }
  header { text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #000; }
  header h1 { font-size: 1.75rem; margin: 0; letter-spacing: 0.02em; }
  .category { page-break-inside: avoid; margin-bottom: 1.25rem; }
  .category h2 { font-size: 1.15rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #999; padding-bottom: 0.2rem; margin: 0.75rem 0 0.4rem; }
  ul.products { list-style: none; margin: 0; padding: 0; }
  .product { display: flex; align-items: baseline; margin: 0.2rem 0; page-break-inside: avoid; flex-wrap: wrap; }
  .product .name { font-weight: 600; }
  .product .dots { flex: 1 1 auto; border-bottom: 1px dotted #bbb; margin: 0 0.4rem; transform: translateY(-3px); min-width: 1rem; }
  .product .price { font-weight: 700; white-space: nowrap; }
  .product .price .tier { white-space: nowrap; }
  .meta-line { width: 100%; }
  .meta { font-size: 0.8rem; color: #555; }
  footer { margin-top: 2rem; padding-top: 0.75rem; border-top: 1px solid #ccc; text-align: center; font-size: 0.8rem; color: #666; }
  .print-bar { position: sticky; top: 0; background: #fff; border-bottom: 1px solid #ddd; padding: 0.5rem 0; text-align: center; margin: -2rem -2rem 1.5rem; }
  .print-bar button { font: inherit; font-weight: 600; padding: 0.5rem 1.5rem; border: 1px solid #000; background: #000; color: #fff; border-radius: 0.25rem; cursor: pointer; }
  @media print {
    body { padding: 0.6in; }
    .print-bar { display: none; }
    .category { page-break-inside: avoid; }
    .product { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="print-bar"><button onclick="window.print()">Print / Save as PDF</button></div>
  <header><h1>${dispensaryName}</h1></header>
  <main>
${sections || '<p style="text-align:center;color:#666;">No in-stock products to display.</p>'}
  </main>
  <footer>${dispensaryName} &middot; ${escapeHtml(today)}</footer>
  <script>window.addEventListener('load', function(){ setTimeout(function(){ try { window.print(); } catch(e){} }, 400); });</script>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = appUrl(env, request);
    const secure = url.protocol === 'https:';

    if (request.method === 'OPTIONS') {
      const reqOrigin = request.headers.get('Origin') || '';
      const allowed = allowedOrigins(env);
      const isAllowed = reqOrigin !== '' && allowed.includes(reqOrigin);
      const corsHeaders: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
      };
      if (isAllowed) {
        corsHeaders['Access-Control-Allow-Origin'] = reqOrigin;
        corsHeaders['Access-Control-Allow-Credentials'] = 'true';
      }
      return new Response(null, { headers: corsHeaders });
    }

    // Global CSRF gate: every state-changing method (POST/PUT/PATCH/DELETE)
    // must clear passesCsrf(). GET/HEAD/OPTIONS are allowed through to their
    // route handlers. This sits directly after CORS preflight so OPTIONS is
    // never subject to the gate, and before any route logic so no handler can
    // accidentally bypass it.
    if (request.method !== 'GET' && request.method !== 'HEAD' && !passesCsrf(request, env)) {
      return new Response('CSRF check failed', { status: 403, headers: SECURITY_HEADERS });
    }

    // Custom domain detection: if the host is not dubmenu.com or tv.dubmenu.com, check for a mapping
    const host = url.hostname;
    const isTvHost = host === 'tv.dubmenu.com';
    const isDubMenuHost = host === 'dubmenu.com' || host === 'tv.dubmenu.com' || host.endsWith('.workers.dev') || host === 'localhost';
    if (!isDubMenuHost && env.DOMAINS && path === '/') {
      const domainId = env.DOMAINS.idFromName('global');
      const domainStub = env.DOMAINS.get(domainId);
      const lookupRes = await domainStub.fetch(new Request(`https://internal/lookup?domain=${encodeURIComponent(host)}`, { method: 'GET' }));
      const lookup = (await lookupRes.json()) as { mapping: { sessionId: string; verified: boolean } | null };
      if (lookup.mapping?.sessionId) {
        return htmlResponse(tvPage(lookup.mapping.sessionId, url.origin, { noAgeGate: true }));
      }
    }

    // TV subdomain (tv.dubmenu.com) is loaded on a dispensary TV and must go
    // straight into the TV pairing experience (QR code / access code). It must
    // never show marketing or the full site. Functional paths (/tv/*, /ws/*,
    // /status/*, /api/*, /print/*, /config/*) still pass through so a paired
    // phone or a specific TV URL keeps working.
    if (isTvHost) {
      const TV_ALLOWED_PREFIXES = ['/tv/', '/ws/', '/status/', '/api/', '/print/', '/config/', '/menu/', '/login', '/signup', '/robots.txt', '/sitemap.xml'];
      const isTvFunctional = path === '/' || TV_ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p));
      if (!isTvFunctional) {
        // Any marketing/non-TV route on the TV host → straight to TV pairing.
        return redirectResponse(`${url.origin}/tv/demo`);
      }
      if (path === '/') {
        return htmlResponse(tvPage('demo', url.origin, { noAgeGate: true }));
      }
    }

    if (path === '/api/health' || path === '/health') {
      return jsonResponse({ status: 'ok', timestamp: Date.now() });
    }

    if (path === '/status') {
      const status = await getStatus(env);
      return htmlResponse(statusPage(status), status.healthy ? 200 : 503);
    }

    if (path === '/admin') {
      const auth = await requireAuth(request, env);
      if (!auth) return redirectResponse(`${origin}/login?next=${encodeURIComponent('/admin')}`);
      const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (!adminEmails.includes(auth.email.toLowerCase())) {
        return htmlResponse(authPage(origin, 'account', undefined, 'Admin access required'), 403);
      }
      const status = await getStatus(env);
      let stats: any = {};
      if (env.STATS) {
        try {
          const statsId = env.STATS.idFromName('global');
          const stub = env.STATS.get(statsId);
          const res = await stub.fetch(new Request('https://internal/stats', { method: 'GET' }));
          stats = await res.json();
        } catch (err) {
          console.error('Failed to load admin stats:', err);
        }
      }
      const analyticsEvents = stats.events || [];
      const analytics = {
        totalEvents: analyticsEvents.length,
        tvLoads: analyticsEvents.filter((e: any) => e.type === 'analytics.tv.load').length,
        widgetLoads: analyticsEvents.filter((e: any) => e.type === 'analytics.widget.load').length,
        configSaves: analyticsEvents.filter((e: any) => e.type === 'analytics.config.save').length,
        recentEvents: analyticsEvents.slice(0, 20),
      };
      return htmlResponse(adminPage(stats, analytics, status));
    }

        if (path === '/api/analytics/track' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { type?: string; sessionId?: string; payload?: any };
        if (!body.type || !body.type.startsWith('analytics.')) {
          return jsonResponse({ error: 'Invalid analytics type' }, 400);
        }
        await recordEvent(env, { type: body.type as any, payload: { sessionId: body.sessionId, ...(body.payload || {}) } });
        return jsonResponse({ ok: true });
      } catch (err) {
        return jsonResponse({ error: 'Invalid request' }, 400);
      }
    }


    if (path === '/api/test/activate-trial' && request.method === 'POST' && env.APP_URL && (env.APP_URL.startsWith('http://localhost:') || env.APP_URL.startsWith('http://127.0.0.1:'))) {
      const auth = await requireAuth(request, env);
      if (!auth) return redirectResponse(`${origin}/login`);
      const { updateAccountStripe } = await import('./auth');
      await updateAccountStripe(env, auth.accountId, { subscriptionStatus: 'trialing', trialEndsAt: Date.now() + 14 * 24 * 60 * 60 * 1000 });
      return redirectResponse(`${origin}/account`);
    }

    if (path === '/api/domains' && request.method === 'GET') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      if (!env.DOMAINS) return jsonResponse({ domains: [] });
      const id = env.DOMAINS.idFromName('global');
      const stub = env.DOMAINS.get(id);
      const res = await stub.fetch(new Request(`https://internal/list?accountId=${auth.accountId}`, { method: 'GET' }));
      return jsonResponse(await res.json());
    }

    if (path === '/api/domains' && request.method === 'POST') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      const account = await getAccount(env, auth.accountId);
      if (!account || !isSubscriptionActive(account)) {
        return jsonResponse({ error: 'Active subscription required for custom domains' }, 403);
      }
      if (!env.DOMAINS) return jsonResponse({ error: 'Custom domains not configured' }, 500);
      const body = (await request.json()) as { domain: string; sessionId: string };
      if (!body.domain || !body.sessionId) return jsonResponse({ error: 'Missing domain or sessionId' }, 400);
      if (!SESSION_ID_REGEX.test(body.sessionId)) return jsonResponse({ error: 'Invalid session ID' }, 400);
      const id = env.DOMAINS.idFromName('global');
      const stub = env.DOMAINS.get(id);
      const res = await stub.fetch(new Request('https://internal/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: body.domain, sessionId: body.sessionId, accountId: auth.accountId }),
      }));
      return jsonResponse(await res.json(), res.status);
    }

    if (path === '/api/domains' && request.method === 'DELETE') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      if (!env.DOMAINS) return jsonResponse({ error: 'Custom domains not configured' }, 500);
      const body = (await request.json()) as { domain: string };
      if (!body.domain) return jsonResponse({ error: 'Missing domain' }, 400);
      const id = env.DOMAINS.idFromName('global');
      const stub = env.DOMAINS.get(id);
      const res = await stub.fetch(new Request('https://internal/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: body.domain, accountId: auth.accountId }),
      }));
      return jsonResponse(await res.json(), res.status);
    }

    if (path === '/api/domains/verify' && request.method === 'POST') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      if (!env.DOMAINS) return jsonResponse({ error: 'Custom domains not configured' }, 500);
      const body = (await request.json()) as { domain: string };
      if (!body.domain) return jsonResponse({ error: 'Missing domain' }, 400);
      const id = env.DOMAINS.idFromName('global');
      const stub = env.DOMAINS.get(id);
      const res = await stub.fetch(new Request('https://internal/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: body.domain, accountId: auth.accountId }),
      }));
      return jsonResponse(await res.json(), res.status);
    }

    if (path === '/login' && request.method === 'GET') {
      const dubHavenEnabled = isDubHavenStartConfigured(env);
      return htmlResponse(authPage(origin, 'login', undefined, undefined, dubHavenEnabled));
    }
    if (path === '/signup' && request.method === 'GET') {
      const dubHavenEnabled = isDubHavenStartConfigured(env);
      return htmlResponse(authPage(origin, 'signup', undefined, undefined, dubHavenEnabled));
    }
    if (path === '/account' && request.method === 'GET') {
      const auth = await requireAuth(request, env);
      if (!auth) return redirectResponse(`${origin}/login`);
      const account = await getAccount(env, auth.accountId);
      if (!account) return redirectResponse(`${origin}/login`);
      // Frictionless onboarding: active/trial accounts with no displays get an
      // auto-created starter display and land directly in the editor.
      if (isSubscriptionActive(account) && (!account.sessions || account.sessions.length === 0)) {
        const newId = await createStarterDisplay(env, auth.accountId);
        await recordEvent(env, { type: 'session.created', accountId: auth.accountId, payload: { sessionId: newId, starter: true } });
        return redirectResponse(`${origin}/config/${newId}`);
      }
      return htmlResponse(authPage(origin, 'account', account));
    }

    if (path === '/auth/dubhaven' && request.method === 'GET') {
      if (!isDubHavenStartConfigured(env)) {
        return htmlResponse(authPage(origin, 'login', undefined, 'DubHaven sign-in is not configured yet.', false));
      }
      const redirectAfter = url.searchParams.get('next') || `${origin}/account`;
      const authUrl = buildDubHavenAuthUrl(env, origin, redirectAfter);
      return redirectResponse(authUrl);
    }

    if (path === '/auth/dubhaven/callback' && request.method === 'GET') {
      const result = await handleDubHavenCallback(request, env, origin, secure);
      if (result.account) {
        const eventType = result.isNew ? 'dubmenu.first_login' : 'dubmenu.login';
        await recordEvent(env, { type: eventType, accountId: result.account.id, email: result.account.email });
      }
      return result.response;
    }

    if (path === '/api/signup' && request.method === 'POST') {
      const form = await request.formData();
      const email = String(form.get('email') || '').trim().toLowerCase();
      const password = String(form.get('password') || '');
      if (!email || !password || password.length < 8) {
        return htmlResponse(authPage(origin, 'signup', undefined, 'Valid email and 8+ character password required'));
      }
      const result = await createAccount(env, email, password);
      if ('error' in result) {
        return htmlResponse(authPage(origin, 'signup', undefined, result.error));
      }
      await recordEvent(env, { type: 'account.created', accountId: result.account.id, email: result.account.email });
      const token = await signToken({ accountId: result.account.id, email }, env.AUTH_SECRET as string);
      return redirectResponse(`${origin}/account`, [setCookie('dubmenu_auth', token, 60 * 60 * 24 * 7, secure)]);
    }

    if (path === '/api/login' && request.method === 'POST') {
      const form = await request.formData();
      const email = String(form.get('email') || '').trim().toLowerCase();
      const password = String(form.get('password') || '');
      const account = await authenticate(env, email, password);
      if (!account) {
        return htmlResponse(authPage(origin, 'login', undefined, 'Invalid email or password'));
      }
      const token = await signToken({ accountId: account.id, email: account.email }, env.AUTH_SECRET as string);
      return redirectResponse(`${origin}/account`, [setCookie('dubmenu_auth', token, 60 * 60 * 24 * 7, secure)]);
    }

    // Logout: POST performs the actual cookie clear. GET is intentionally a
    // no-op redirect to /account (does NOT clear the cookie) so that the
    // existing <a href="/api/logout"> link in html-auth.ts cannot be abused
    // as a cross-site CSRF log-out vector via <img>/<link>. A follow-up in
    // html-auth.ts should replace the anchor with a POST form so GET can be
    // removed entirely.
    if (path === '/api/logout' && request.method === 'POST') {
      return redirectResponse(`${origin}/`, [clearCookie('dubmenu_auth')]);
    }
    if (path === '/api/logout' && request.method === 'GET') {
      // Deprecated: kept only so the old logout link does not hard-break the
      // UI. It redirects still-authenticated users to /account instead of
      // logging them out. Remove once html-auth.ts uses a POST form.
      return redirectResponse(`${origin}/account`);
    }

    if (path === '/api/checkout' && request.method === 'GET') {
      const auth = await requireAuth(request, env);
      if (!auth) return redirectResponse(`${origin}/login`);
      const account = await getAccount(env, auth.accountId);
      if (!account) return redirectResponse(`${origin}/login`);
      if (account.stripeSubscriptionId) {
        return redirectResponse(`${origin}/account`);
      }
      if (!env.STRIPE_API_KEY || !env.STRIPE_PRICE_ID) {
        return jsonResponse({ error: 'Billing not configured' }, 500);
      }
      const session = await createCheckoutSession(env, {
        customerEmail: account.email,
        successUrl: `${origin}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/account`,
        clientReferenceId: account.id,
      });
      return redirectResponse(session.url || `${origin}/account`);
    }

    if (path === '/api/checkout/success' && request.method === 'GET') {
      const sessionId = url.searchParams.get('session_id');
      if (!sessionId) {
        return redirectResponse(`${origin}/account?error=checkout`);
      }
      return redirectResponse(`${origin}/account?checkout=success`);
    }

    if (path === '/api/portal' && request.method === 'GET') {
      const auth = await requireAuth(request, env);
      if (!auth) return redirectResponse(`${origin}/login`);
      const account = await getAccount(env, auth.accountId);
      if (!account || !account.stripeCustomerId) return redirectResponse(`${origin}/account`);
      const portal = await createCustomerPortalSession(env, account.stripeCustomerId, `${origin}/account`);
      return redirectResponse(portal.url || `${origin}/account`);
    }

    if (path === '/api/stripe/webhook' && request.method === 'POST') {
      if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_API_KEY) {
        return jsonResponse({ error: 'Webhook not configured' }, 500);
      }
      const payload = await request.text();
      const sig = request.headers.get('stripe-signature') || '';
      try {
        const event = await verifyWebhookSignature(payload, sig, env.STRIPE_WEBHOOK_SECRET);
        const eventId = event.id as string | undefined;
        if (eventId && isDuplicateEvent(eventId)) {
          return jsonResponse({ received: true, duplicate: true });
        }
        if (eventId) recordStripeEvent(eventId);
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          if (session.client_reference_id && session.customer && session.subscription) {
            await updateAccountFromStripe(env, session.client_reference_id, session.customer, session.subscription);
            await recordEvent(env, { type: 'subscription.updated', accountId: session.client_reference_id, payload: { event: 'checkout.session.completed' } });
          }
        }
        if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
          const sub = event.data.object;
          const customerId = sub.customer;
          const account = await findAccountByCustomerId(env, customerId);
          if (account) {
            await updateAccountFromStripe(env, account.id, customerId, sub.id);
            await recordEvent(env, { type: 'subscription.updated', accountId: account.id, payload: { event: event.type } });
          }
        }
        await recordEvent(env, { type: 'webhook.received', payload: { event: event.type } });
        return jsonResponse({ received: true });
      } catch (err) {
        console.error('Webhook error:', err);
        return jsonResponse({ error: 'Invalid signature' }, 400);
      }
    }

    if (path === '/api/sessions' && request.method === 'GET') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      const account = await getAccount(env, auth.accountId);
      return jsonResponse({ sessions: account?.sessions || [] });
    }

    if (path.startsWith('/api/export/') && request.method === 'GET') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      const sessionId = path.split('/')[3];
      if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) return jsonResponse({ error: 'Invalid session ID' }, 400);
      const id = env.SESSION.idFromName(sessionId);
      const session = env.SESSION.get(id);
      const res = await session.fetch(new Request('https://internal/config', {
        method: 'GET',
        headers: { 'X-Account-Id': auth.accountId },
      }));
      if (res.status === 403) return jsonResponse({ error: 'Session owned by another account' }, 403);
      if (!res.ok) return jsonResponse({ error: 'Failed to export config' }, 500);
      const data = await res.json() as { config: any };
      const filename = `dubmenu-${sessionId}.json`;
      return new Response(JSON.stringify(data.config, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // GDPR/CCPA data portability: bundle the entire account record (minus the
    // password hash), every owned session's full config, and the list of R2
    // upload keys under the account prefix into a downloadable JSON file.
    if (path === '/api/account/export' && request.method === 'GET') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      const account = await getAccount(env, auth.accountId);
      if (!account) return jsonResponse({ error: 'Account not found' }, 404);

      const { passwordHash: _ph, passwordSalt: _ps, ...safeAccount } = account;

      const sessions: Record<string, any> = {};
      for (const sid of account.sessions) {
        if (!SESSION_ID_REGEX.test(sid)) continue;
        try {
          const id = env.SESSION.idFromName(sid);
          const session = env.SESSION.get(id);
          const res = await session.fetch(new Request('https://internal/config', {
            method: 'GET',
            headers: { 'X-Account-Id': auth.accountId },
          }));
          if (res.ok) {
            const data = (await res.json()) as { config: any };
            sessions[sid] = data.config;
          } else {
            sessions[sid] = { error: `status ${res.status}` };
          }
        } catch (err) {
          sessions[sid] = { error: 'fetch failed' };
        }
      }

      let uploads: string[] = [];
      if (env.UPLOADS) {
        try {
          const prefix = `${auth.accountId}/`;
          let cursor: string | undefined;
          do {
            const listed = await env.UPLOADS.list({ prefix, cursor, limit: 1000 });
            uploads = uploads.concat(listed.objects.map((o) => o.key));
            cursor = listed.truncated ? listed.cursor : undefined;
          } while (cursor);
        } catch (err) {
          // best-effort: surface an empty list on failure
        }
      }

      const bundle = {
        exportedAt: new Date().toISOString(),
        account: safeAccount,
        sessions,
        uploads,
      };
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `dubmenu-account-export-${auth.accountId}-${ts}.json`;
      return new Response(JSON.stringify(bundle, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          ...SECURITY_HEADERS,
        },
      });
    }

    // GDPR/CCPA right-to-erasure: irreversibly cascade-delete the account,
    // all owned sessions, all R2 uploads, and cancel billing. Requires a JSON
    // body of { confirm: "DELETE" } as an accidental-delete speed bump.
    if (path === '/api/account/delete' && request.method === 'POST') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      const account = await getAccount(env, auth.accountId);
      if (!account) return jsonResponse({ error: 'Account not found' }, 404);

      let body: any;
      try {
        body = await request.json();
      } catch (_err) {
        return jsonResponse({ error: 'Invalid JSON body' }, 400);
      }
      if (!body || body.confirm !== 'DELETE') {
        return jsonResponse({ error: 'Confirmation required: send { "confirm": "DELETE" }' }, 400);
      }

      // 1. Wipe each owned session DO (closes WebSockets, clears storage).
      const sessionIds = [...account.sessions];
      for (const sid of sessionIds) {
        if (!SESSION_ID_REGEX.test(sid)) continue;
        try {
          const id = env.SESSION.idFromName(sid);
          const session = env.SESSION.get(id);
          await session.fetch(new Request('https://internal/', { method: 'DELETE' }));
        } catch (err) {
          console.error(`Failed to wipe session ${sid} during account delete:`, err);
        }
      }

      // 2. Delete all R2 uploads under the account prefix.
      let uploadsDeleted = 0;
      try {
        uploadsDeleted = await deleteAccountUploads(env, auth.accountId);
      } catch (err) {
        console.error('Failed to delete R2 uploads during account delete:', err);
      }

      // 3. Cancel the Stripe subscription if present (best-effort; a Stripe
      //    API failure must not block local erasure).
      if (account.stripeSubscriptionId && env.STRIPE_API_KEY) {
        try {
          await cancelSubscription(env, account.stripeSubscriptionId);
        } catch (err) {
          console.error('Failed to cancel Stripe subscription during account delete:', err);
        }
      }

      // 4. Wipe the account DO itself.
      try {
        const id = env.ACCOUNTS.idFromName(auth.accountId);
        const stub = env.ACCOUNTS.get(id);
        await stub.fetch(new Request('https://internal/', { method: 'DELETE' }));
      } catch (err) {
        console.error('Failed to wipe account DO during account delete:', err);
      }

      await recordEvent(env, { type: 'account.deleted', accountId: auth.accountId, email: account.email, payload: { sessionsWiped: sessionIds.length, uploadsDeleted } });

      return new Response(JSON.stringify({ deleted: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': clearCookie('dubmenu_auth'),
          ...SECURITY_HEADERS,
        },
      });
    }

    if (path.startsWith('/api/claim/') && request.method === 'POST') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      const sessionId = path.split('/')[3];
      if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) return jsonResponse({ error: 'Invalid session ID' }, 400);
      const id = env.SESSION.idFromName(sessionId);
      const session = env.SESSION.get(id);
      const ownerRes = await session.fetch(new Request('https://internal/owner', {
        method: 'POST',
        headers: { 'X-Account-Id': auth.accountId },
      }));
      if (ownerRes.status === 403) {
        return jsonResponse({ error: 'Session already owned by another account' }, 403);
      }
      if (!ownerRes.ok) {
        return jsonResponse({ error: 'Failed to claim session' }, 500);
      }
      await addSessionToAccount(env, auth.accountId, sessionId);
      await recordEvent(env, { type: 'session.created', accountId: auth.accountId, payload: { sessionId, claimed: true } });
      return jsonResponse({ ok: true, sessionId });
    }

    if (path.startsWith('/api/widget/') && request.method === 'GET') {
      const sessionId = path.split('/')[3];
      if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) return jsonResponse({ error: 'Invalid session ID' }, 400);
      const id = env.SESSION.idFromName(sessionId);
      const session = env.SESSION.get(id);
      const res = await session.fetch(new Request('https://internal/widget', { method: 'GET' }));
      if (!res.ok) return jsonResponse({ error: 'Failed to load widget' }, 500);
      const data = await res.json();
      return jsonResponse(data);
    }

    if (path === '/api/contact' && request.method === 'POST') {
      try {
        const body = await request.json() as { name?: string; email?: string; message?: string };
        const name = body.name?.trim().slice(0, 200) || '';
        const email = body.email?.trim().slice(0, 200) || '';
        const message = body.message?.trim().slice(0, 5000) || '';
        if (!name || !email || !message) return jsonResponse({ error: 'All fields are required' }, 400);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({ error: 'Invalid email address' }, 400);
        if (!env.RESEND_API_KEY) return jsonResponse({ error: 'Email service is not configured' }, 500);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'DubMenu <hello@dubhaven.com>',
            to: ['mike@dubhaven.com', 'sam@dubhaven.com'],
            reply_to: email,
            subject: `DubMenu Contact: ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
          }),
        });
        if (!res.ok) return jsonResponse({ error: 'Failed to send message' }, 500);
        return jsonResponse({ success: true });
      } catch {
        return jsonResponse({ error: 'Invalid request' }, 400);
      }
    }

    if (path === '/api/scrape-dutchie' && request.method === 'POST') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      const account = await getAccount(env, auth.accountId);
      if (!account || !isSubscriptionActive(account)) {
        return jsonResponse({ error: 'Active subscription required' }, 403);
      }
      try {
        const body = await request.json() as { url?: string; session?: string };
        const urlStr = (body.url || '').trim();
        if (!urlStr) {
          return jsonResponse({ error: 'Paste a menu URL, Dutchie link, or store slug first.' }, 400);
        }

        const raw = await resolveMenuSource(urlStr, {
          DUTCHIE_API_KEY: env.DUTCHIE_API_KEY,
          BROWSERLESS_TOKEN: env.BROWSERLESS_TOKEN,
        });

        const formatted = formatMenu(raw.categories, raw.dispensaryName, raw.logo);
        const importPayload = {
          dispensaryName: formatted.dispensaryName,
          logo: formatted.logo,
          categories: formatted.categories,
          productCount: formatted.productCount,
          displayCount: formatted.layout.displayCount,
          layoutMode: formatted.layout.layoutMode,
          fontSize: formatted.layout.fontSize,
          showImages: formatted.layout.showImages,
          showBrand: formatted.layout.showBrand,
          showStrain: formatted.layout.showStrain,
          theme: formatted.layout.theme,
        };

        if (body.session && SESSION_ID_REGEX.test(body.session)) {
          const id = env.SESSION.idFromName(body.session);
          const session = env.SESSION.get(id);
          await session.fetch(new Request('https://internal/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Account-Id': auth.accountId },
            body: JSON.stringify(importPayload),
          }));
          await addSessionToAccount(env, auth.accountId, body.session);
        }

        return jsonResponse({
          success: true,
          ...importPayload,
          source: raw.source,
          apiUsed: raw.apiUsed,
          apiError: raw.apiError,
          demo: raw.demo,
          warnings: [...(raw.warnings || []), ...formatted.warnings],
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Import failed';
        console.error('Menu import failed:', message);
        return jsonResponse({ error: message }, 500);
      }
    }

    if (path.startsWith('/api/import/csv/') && request.method === 'POST') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      const account = await getAccount(env, auth.accountId);
      if (!account || !isSubscriptionActive(account)) {
        return jsonResponse({ error: 'Active subscription required' }, 403);
      }
      const sessionId = path.split('/')[4];
      if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) return jsonResponse({ error: 'Invalid session ID' }, 400);
      try {
        const body = await request.text();
        const { categories, errors } = importMenuFromCSV(body);
        if (categories.length === 0) {
          return jsonResponse({ error: 'No valid categories found', details: errors }, 400);
        }
        const id = env.SESSION.idFromName(sessionId);
        const session = env.SESSION.get(id);
        const ownerRes = await session.fetch(new Request('https://internal/owner', {
          method: 'POST',
          headers: { 'X-Account-Id': auth.accountId },
        }));
        if (ownerRes.status === 403) {
          return jsonResponse({ error: 'Session owned by another account' }, 403);
        }
        await session.fetch(new Request('https://internal/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Account-Id': auth.accountId },
          body: JSON.stringify({ categories, dispensaryName: account.email.split('@')[0] }),
        }));
        await addSessionToAccount(env, auth.accountId, sessionId);
        return jsonResponse({ ok: true, categoriesImported: categories.length, productsImported: categories.reduce((a, c) => a + c.products.length, 0), errors });
      } catch (err) {
        return jsonResponse({ error: err instanceof Error ? err.message : 'CSV import failed' }, 500);
      }
    }

    if (path === '/api/upload' && request.method === 'POST') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return handleImageUpload(request, env, auth.accountId);
    }

    // Image library: list this account's uploads for the frontend gallery.
    // Authenticated only. Supports optional ?limit and ?cursor pagination; in
    // the common case the full list (capped at 1000 by listAccountUploads)
    // is returned with nextCursor: null.
    if (path === '/api/uploads' && request.method === 'GET') {
      const auth = await requireAuth(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      const uploads = await listAccountUploads(env, auth.accountId);

      let limit = 50;
      const limitParam = url.searchParams.get('limit');
      if (limitParam !== null) {
        const parsed = parseInt(limitParam, 10);
        if (!isNaN(parsed) && parsed > 0) {
          limit = Math.min(parsed, 200);
        }
      }
      const cursorParam = url.searchParams.get('cursor');
      let startIndex = 0;
      if (cursorParam !== null) {
        const parsed = parseInt(cursorParam, 10);
        if (!isNaN(parsed) && parsed > 0) startIndex = parsed;
      }

      const slice = uploads.slice(startIndex, startIndex + limit);
      const nextCursor =
        startIndex + slice.length < uploads.length
          ? String(startIndex + slice.length)
          : null;
      // Expose accountId so the image-library client can resolve upload URLs
      // even on fresh accounts that have no product/logo already using an
      // upload URL (resolveAccountId() in html-config.ts would otherwise have
      // nothing to derive from).
      return jsonResponse({ uploads: slice, nextCursor, accountId: auth.accountId });
    }

    // Per-upload routes under /api/uploads/[...]. GET is the public image
    // serve endpoint (no auth — TVs/widgets load images unauthenticated) and
    // DELETE is the authenticated library delete. The CSRF gate already ran
    // for DELETE at the top of the handler.
    if (path.startsWith('/api/uploads/')) {
      const key = path.slice('/api/uploads/'.length);
      if (!key) return jsonResponse({ error: 'Missing key' }, 400);

      if (request.method === 'DELETE') {
        const auth = await requireAuth(request, env);
        if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
        // `key` is `<accountId>/<filename>` on the serve path. For delete we
        // require the caller to target a bare filename scoped to their own
        // account, so we reject anything that still contains a separator
        // (the frontend calls DELETE /api/uploads/<filename>, not the full
        // <accountId>/<filename> key). deleteUpload reconstructs the
        // authenticated account prefix internally.
        let filename = key;
        if (filename.startsWith(`${auth.accountId}/`)) {
          filename = filename.slice(auth.accountId.length + 1);
        }
        if (!filename) return jsonResponse({ error: 'Missing filename' }, 400);
        // Decode percent-escapes before validation so encoded traversal
        // attempts (..%2F, %5C) are caught by validateFilename. decodeURIComponent
        // can throw on malformed input — treat that as a bad request.
        try {
          filename = decodeURIComponent(filename);
        } catch (_decodeErr) {
          return jsonResponse({ error: 'Invalid filename' }, 400);
        }
        let deleted: boolean;
        try {
          deleted = await deleteUpload(env, auth.accountId, filename);
        } catch (_err) {
          // Path-traversal / invalid filename.
          return jsonResponse({ error: 'Invalid filename' }, 400);
        }
        if (!deleted) return jsonResponse({ error: 'Not found' }, 404);
        return jsonResponse({ deleted: true });
      }

      if (request.method === 'GET') {
        return serveImage(request, env, key);
      }

      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (path.startsWith('/ws/')) {
      const sessionId = path.split('/')[2];
      if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) {
        return errorResponse('Invalid session ID format', 400);
      }
      const id = env.SESSION.idFromName(sessionId);
      const session = env.SESSION.get(id);
      return session.fetch(request);
    }

    if (path.startsWith('/status/')) {
      const sessionId = path.split('/')[2];
      if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) return jsonResponse({ paired: false });
      const id = env.SESSION.idFromName(sessionId);
      const session = env.SESSION.get(id);
      return session.fetch(new Request('https://internal/status', request));
    }

    if (path.startsWith('/tv/')) {
      const sessionId = path.split('/')[2] || 'default';
      if (!SESSION_ID_REGEX.test(sessionId)) return errorResponse('Invalid session ID format', 400);
      if (sessionId === 'new') {
        const auth = await requireAuth(request, env);
        if (!auth) {
          const next = encodeURIComponent('/tv/new');
          const signInUrl = isDubHavenStartConfigured(env) ? `${origin}/auth/dubhaven?next=${next}` : `${origin}/login?next=${next}`;
          return redirectResponse(signInUrl);
        }
        const newId = generateSessionId();
        await addSessionToAccount(env, auth.accountId, newId);
        await recordEvent(env, { type: 'session.created', accountId: auth.accountId, payload: { sessionId: newId } });
        return redirectResponse(`${tvUrl(env)}/tv/${newId}`);
      }

      // For an existing saved session, preload the persisted public config so the TV
      // can render products immediately instead of waiting for a phone to pair.
      let initialConfig: any = undefined;
      if (sessionId !== 'demo') {
        try {
          const id = env.SESSION.idFromName(sessionId);
          const session = env.SESSION.get(id);
          const cfgRes = await session.fetch(new Request('https://internal/tv-config', { method: 'GET' }));
          if (cfgRes.ok) {
            const data = (await cfgRes.json()) as any;
            if (data && Array.isArray(data.categories) && data.categories.some((c: any) => c && Array.isArray(c.products) && c.products.length > 0)) {
              initialConfig = data;
            }
          }
        } catch (err) {
          console.error('Failed to preload TV config:', err);
        }
      }

      // Desktop simulator requests the TV page inside an iframe on the same
      // origin. Relax frame-ancestors for that specific embed mode only, and
      // bypass the age gate when the request is authenticated for the account
      // that owns this session. Unauthenticated or foreign-session embeds still
      // render the normal TV page (with age gate) so public TV behavior is
      // preserved.
      if (url.searchParams.get('embed') === '1') {
        let noAgeGate = false;
        const auth = await requireAuth(request, env);
        if (auth) {
          const account = await getAccount(env, auth.accountId);
          if (account && account.sessions.includes(sessionId)) {
            noAgeGate = true;
          }
        }
        const pageOptions = noAgeGate ? { noAgeGate: true, preview: true, initialConfig } : { initialConfig };
        return tvEmbedResponse(tvPage(sessionId, url.origin, pageOptions));
      }
      return htmlResponse(tvPage(sessionId, url.origin, { noAgeGate: true, initialConfig }));
    }

    if (path.startsWith('/print/')) {
      const sessionId = path.split('/')[2] || '';
      if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) return errorResponse('Invalid session ID format', 400);
      const auth = await requireAuth(request, env);
      if (!auth) return errorResponse('Authentication required', 401);
      const account = await getAccount(env, auth.accountId);
      if (!account) return errorResponse('Account not found', 404);
      if (!account.sessions.includes(sessionId)) return errorResponse('Forbidden', 403);
      const id = env.SESSION.idFromName(sessionId);
      const session = env.SESSION.get(id);
      const res = await session.fetch(new Request('https://internal/widget', { method: 'GET' }));
      if (!res.ok) return errorResponse('Failed to load menu', 500);
      const config = await res.json();
      return htmlResponse(printPage(sessionId, config, origin));
    }

    // Customer-facing mobile/tablet menu (QR code landing). Public, read-only.
    if (path.startsWith('/menu/')) {
      const sessionId = path.slice('/menu/'.length).split('/')[0].split('?')[0];
      if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) return errorResponse('Invalid session ID format', 400);
      const id = env.SESSION.idFromName(sessionId);
      const session = env.SESSION.get(id);
      const res = await session.fetch(new Request('https://internal/widget', { method: 'GET' }));
      if (!res.ok) return errorResponse('Failed to load menu', 500);
      const config = await res.json();
      return htmlResponse(menuPage(sessionId, config, origin));
    }

    if (path.startsWith('/config/')) {
      const sessionId = path.split('/')[2] || 'default';
      if (!SESSION_ID_REGEX.test(sessionId)) return errorResponse('Invalid session ID format', 400);
      const auth = await requireAuth(request, env);
      if (!auth) {
        const next = encodeURIComponent(path);
        const signInUrl = isDubHavenStartConfigured(env) ? `${origin}/auth/dubhaven?next=${next}` : `${origin}/login?next=${next}`;
        return redirectResponse(signInUrl);
      }
      const account = await getAccount(env, auth.accountId);
      if (!account || !isSubscriptionActive(account)) {
        return redirectResponse(`${origin}/account?error=subscription`);
      }
      const id = env.SESSION.idFromName(sessionId);
      const session = env.SESSION.get(id);
      const ownerRes = await session.fetch(new Request('https://internal/owner', {
        method: 'POST',
        headers: { 'X-Account-Id': auth.accountId },
      }));
      if (ownerRes.status === 403) {
        return htmlResponse(authPage(origin, 'account', account, 'This display is managed by another account.'));
      }
      await addSessionToAccount(env, auth.accountId, sessionId);
      await recordEvent(env, { type: 'pairing.start', accountId: auth.accountId, payload: { sessionId } });
      return htmlResponse(configPage(sessionId, url.origin));
    }
    if (path === '/pricing') return htmlResponse(pricingPage(origin));

    if (path === '/widget') return htmlResponse(widgetPage(origin));

    if (path === '/widget.js') {
      return new Response(widgetJs(origin), {
        headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'public, max-age=3600' },
      });
    }

    if (path === '/faq') return htmlResponse(faqPage(origin));
    if (path === '/about') return htmlResponse(aboutPage(origin));
    if (path === '/contact') return htmlResponse(contactPage(origin));
    if (path === '/privacy') return htmlResponse(privacyPage(origin));
    if (path === '/terms') return htmlResponse(termsPage(origin));

    if (path === '/robots.txt') {
      return new Response('User-agent: *\nAllow: /\nDisallow: /tv/\nDisallow: /config/\nDisallow: /ws/\nDisallow: /status/\nSitemap: https://dubmenu.com/sitemap.xml\n', {
        headers: { 'Content-Type': 'text/plain', ...SECURITY_HEADERS },
      });
    }

    if (path === '/sitemap.xml') {
      const pseoSlugs = getAllPSEOSlugs();
      const pseoUrls = pseoSlugs.map((slug) => `  <url><loc>https://dubmenu.com/${slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`).join('\n');
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://dubmenu.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://dubmenu.com/signup</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>https://dubmenu.com/pricing</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>https://dubmenu.com/faq</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>https://dubmenu.com/about</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://dubmenu.com/contact</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://dubmenu.com/privacy</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>
  <url><loc>https://dubmenu.com/terms</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>
${pseoUrls}
</urlset>`, {
        headers: { 'Content-Type': 'application/xml', ...SECURITY_HEADERS },
      });
    }

    const pseoSlugs = getAllPSEOSlugs();
    if (pseoSlugs.includes(path.slice(1))) {
      const page = pseoPage(path.slice(1), origin);
      if (page) return htmlResponse(page);
    }

    if (path === '/' || path === '') return htmlResponse(landingPage(origin));

    return errorResponse('Not found', 404);
  },
};

async function updateAccountFromStripe(env: Env, accountId: string, customerId: string, subscriptionId: string) {
  const { updateAccountStripe } = await import('./auth');
  const subscription = await getSubscription(env, subscriptionId);
  await updateAccountStripe(env, accountId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    subscriptionStatus: subscriptionStatusFromStripe(subscription.status),
    trialEndsAt: trialEndsAtFromStripe(subscription),
  });
}

async function findAccountByCustomerId(env: Env, customerId: string): Promise<{ id: string } | null> {
  try {
    const customer = await fetchStripe(`/customers/${customerId}`, env);
    if (customer.metadata?.accountId) return { id: customer.metadata.accountId };
  } catch (_err) {
    // ignore
  }
  return null;
}

async function fetchStripe(path: string, env: Env): Promise<any> {
  if (!env.STRIPE_API_KEY) throw new Error('No Stripe key');
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: 'Basic ' + btoa(`${env.STRIPE_API_KEY}:`) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || res.statusText);
  return data;
}

async function getSubscription(env: Env, subscriptionId: string): Promise<any> {
  return fetchStripe(`/subscriptions/${subscriptionId}`, env);
}
