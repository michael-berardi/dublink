import { CustomDomainMapping } from './auth';

export interface DomainDOEnv {
  DOMAINS?: DurableObjectNamespace;
}
const RESERVED_CUSTOM_DOMAIN_SUFFIXES = ['.local', '.localhost', '.internal', '.test', '.example', '.invalid'];

export function normalizeCustomDomain(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const domain = input.trim().toLowerCase().replace(/\.$/, '');
  if (!domain || domain.length > 253 || domain.includes('://') || /[\/@:*\s]/.test(domain)) return null;
  if (domain === 'localhost' || domain === 'dubmenu.com' || domain.endsWith('.dubmenu.com') || domain.endsWith('.workers.dev')) return null;
  if (RESERVED_CUSTOM_DOMAIN_SUFFIXES.some((suffix) => domain.endsWith(suffix))) return null;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(domain)) return null;
  const labels = domain.split('.');
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
  return domain;
}


export class DomainDurableObject implements DurableObject {
  private state: DurableObjectState;
  private mappings: Map<string, CustomDomainMapping> = new Map();
  private initialized = false;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    const stored = await this.state.storage.get<CustomDomainMapping[]>('domains');
    if (stored) {
      for (const m of stored) {
        const domain = normalizeCustomDomain(m.domain);
        if (domain) this.mappings.set(domain, { ...m, domain });
      }
    }
    this.initialized = true;
  }

  private async save(): Promise<void> {
    await this.state.storage.put('domains', Array.from(this.mappings.values()));
  }

  async fetch(request: Request): Promise<Response> {
    await this.initialize();
    const url = new URL(request.url);

    if (url.pathname === '/add' && request.method === 'POST') {
      const body = (await request.json()) as { domain: string; sessionId: string; accountId: string };
      if (!body.domain || !body.sessionId || !body.accountId) {
        return jsonResponse({ error: 'Missing fields' }, 400);
      }
      const domain = normalizeCustomDomain(body.domain);
      if (!domain) return jsonResponse({ error: 'Invalid custom domain' }, 400);
      const existing = this.mappings.get(domain);
      if (existing && existing.accountId !== body.accountId) {
        return jsonResponse({ error: 'Domain already claimed by another account' }, 403);
      }
      const mapping: CustomDomainMapping = {
        domain,
        sessionId: body.sessionId,
        accountId: body.accountId,
        verified: false,
        verificationToken: existing?.verificationToken || crypto.randomUUID(),
        createdAt: existing?.createdAt || Date.now(),
      };
      this.mappings.set(domain, mapping);
      await this.save();
      return jsonResponse({ ok: true, mapping });
    }

    if (url.pathname === '/remove' && request.method === 'POST') {
      const body = (await request.json()) as { domain: string; accountId: string };
      const domain = normalizeCustomDomain(body.domain);
      if (!domain) return jsonResponse({ error: 'Invalid custom domain' }, 400);
      const existing = this.mappings.get(domain);
      if (!existing || existing.accountId !== body.accountId) {
        return jsonResponse({ error: 'Not found or not owner' }, 404);
      }
      this.mappings.delete(domain);
      await this.save();
      return jsonResponse({ ok: true });
    }

    if (url.pathname === '/verify' && request.method === 'POST') {
      const body = (await request.json()) as { domain: string; accountId: string };
      const domain = normalizeCustomDomain(body.domain);
      if (!domain) return jsonResponse({ error: 'Invalid custom domain' }, 400);
      const mapping = this.mappings.get(domain);
      if (!mapping || mapping.accountId !== body.accountId) {
        return jsonResponse({ error: 'Not found or not owner' }, 404);
      }
      if (!mapping.verificationToken) {
        mapping.verificationToken = crypto.randomUUID();
        mapping.verified = false;
        await this.save();
        return jsonResponse({ error: 'Verification challenge created', mapping }, 409);
      }
      try {
        const proof = await fetch(`https://${domain}/.well-known/dubmenu-verification`, {
          headers: { Accept: 'text/plain' },
          redirect: 'error',
          signal: AbortSignal.timeout(5000),
        });
        const value = proof.ok ? (await proof.text()).trim() : '';
        if (value !== mapping.verificationToken) {
          mapping.verified = false;
          await this.save();
          return jsonResponse({ error: 'Domain verification challenge not found', mapping }, 409);
        }
      } catch {
        mapping.verified = false;
        await this.save();
        return jsonResponse({ error: 'Domain verification challenge unavailable', mapping }, 409);
      }
      mapping.verified = true;
      this.mappings.set(domain, mapping);
      await this.save();
      return jsonResponse({ ok: true, mapping });
    }

    if (url.pathname === '/list' && request.method === 'GET') {
      const accountId = url.searchParams.get('accountId');
      if (!accountId) return jsonResponse({ error: 'Missing accountId' }, 400);
      const list = Array.from(this.mappings.values()).filter(m => m.accountId === accountId);
      return jsonResponse({ domains: list });
    }

    if (url.pathname === '/lookup' && request.method === 'GET') {
      const domain = normalizeCustomDomain(url.searchParams.get('domain'));
      if (!domain) return jsonResponse({ error: 'Invalid domain' }, 400);
      const mapping = this.mappings.get(domain);
      return jsonResponse({ mapping: mapping || null });
    }

    if (url.pathname === '/probe' && request.method === 'GET') {
      return jsonResponse({ ok: true, count: this.mappings.size });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }
}

function jsonResponse(body: object, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
