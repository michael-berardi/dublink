import { CustomDomainMapping } from './auth';

export interface DomainDOEnv {
  DOMAINS?: DurableObjectNamespace;
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
      for (const m of stored) this.mappings.set(m.domain.toLowerCase(), m);
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
      const domain = body.domain.toLowerCase().trim();
      if (this.mappings.has(domain)) {
        const existing = this.mappings.get(domain)!;
        if (existing.accountId !== body.accountId) {
          return jsonResponse({ error: 'Domain already claimed by another account' }, 403);
        }
      }
      const mapping: CustomDomainMapping = {
        domain,
        sessionId: body.sessionId,
        accountId: body.accountId,
        verified: false,
        createdAt: Date.now(),
      };
      this.mappings.set(domain, mapping);
      await this.save();
      return jsonResponse({ ok: true, mapping });
    }

    if (url.pathname === '/remove' && request.method === 'POST') {
      const body = (await request.json()) as { domain: string; accountId: string };
      const domain = body.domain?.toLowerCase().trim();
      if (!domain) return jsonResponse({ error: 'Missing domain' }, 400);
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
      const domain = body.domain?.toLowerCase().trim();
      const mapping = this.mappings.get(domain);
      if (!mapping || mapping.accountId !== body.accountId) {
        return jsonResponse({ error: 'Not found or not owner' }, 404);
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
      const domain = url.searchParams.get('domain');
      if (!domain) return jsonResponse({ error: 'Missing domain' }, 400);
      const mapping = this.mappings.get(domain.toLowerCase().trim());
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
