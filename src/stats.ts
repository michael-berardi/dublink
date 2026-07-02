export interface StatsEvent {
  type: 'account.created' | 'account.updated' | 'subscription.updated' | 'session.created' | 'webhook.received' | 'analytics.tv.load' | 'analytics.widget.load' | 'analytics.config.save';
  accountId?: string;
  email?: string;
  payload?: any;
  timestamp: number;
}

interface StatsState {
  events: StatsEvent[];
  accountCount: number;
  sessionCount: number;
}

const MAX_EVENTS = 200;

export class StatsDurableObject implements DurableObject {
  private state: DurableObjectState;
  private initialized: boolean = false;
  private stats: StatsState = { events: [], accountCount: 0, sessionCount: 0 };

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    const stored = await this.state.storage.get<StatsState>('stats');
    if (stored) this.stats = stored;
    this.initialized = true;
  }

  private async save(): Promise<void> {
    await this.state.storage.put('stats', this.stats);
  }

  async fetch(request: Request): Promise<Response> {
    await this.initialize();
    const url = new URL(request.url);

    if (url.pathname === '/record' && request.method === 'POST') {
      const event = (await request.json()) as StatsEvent;
      this.stats.events.unshift(event);
      if (this.stats.events.length > MAX_EVENTS) {
        this.stats.events = this.stats.events.slice(0, MAX_EVENTS);
      }
      if (event.type === 'account.created') this.stats.accountCount++;
      if (event.type === 'session.created') this.stats.sessionCount++;
      await this.save();
      return jsonResponse({ ok: true });
    }

    if (url.pathname === '/stats' && request.method === 'GET') {
      return jsonResponse(this.stats);
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
