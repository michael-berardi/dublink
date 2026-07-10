import type { DurableObjectBinding } from './auth';

export type StatsEventType =
  | 'account.created'
  | 'account.deleted'
  | 'account.updated'
  | 'subscription.updated'
  | 'session.created'
  | 'webhook.received'
  | 'dubmenu.first_login'
  | 'dubmenu.login'
  | 'pairing.start'
  | `analytics.${string}`;

export interface StatsEvent {
  type: StatsEventType;
  accountId?: string;
  email?: string;
  payload?: unknown;
  timestamp: number;
}

type StripeEventState = { status: 'processing' | 'processed'; updatedAt: number };

export interface StatsSnapshot {
  events: StatsEvent[];
  accountCount: number;
  sessionCount: number;
}

interface StatsState extends StatsSnapshot {
  stripeEvents: Record<string, StripeEventState>;
}

const MAX_EVENTS = 200;
const STRIPE_EVENT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const STRIPE_EVENT_PROCESSING_LEASE_MS = 5 * 60 * 1000;

export class StatsDurableObject implements DurableObject {
  private state: DurableObjectState;
  private initialized: boolean = false;
  private stats: StatsState = { events: [], accountCount: 0, sessionCount: 0, stripeEvents: {} };

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    const stored = await this.state.storage.get<Partial<StatsState>>('stats');
    if (stored) this.stats = { ...this.stats, ...stored, stripeEvents: stored.stripeEvents || {} };
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

    if (url.pathname.startsWith('/stripe-event/') && request.method === 'POST') {
      const body = (await request.json()) as { eventId?: unknown };
      const eventId = typeof body.eventId === 'string' && body.eventId.length <= 255 ? body.eventId : '';
      if (!eventId) return jsonResponse({ error: 'Invalid event ID' }, 400);

      const now = Date.now();
      for (const [id, event] of Object.entries(this.stats.stripeEvents)) {
        if (now - event.updatedAt > STRIPE_EVENT_RETENTION_MS) delete this.stats.stripeEvents[id];
      }

      if (url.pathname === '/stripe-event/claim') {
        const existing = this.stats.stripeEvents[eventId];
        if (existing?.status === 'processed' || (existing?.status === 'processing' && now - existing.updatedAt < STRIPE_EVENT_PROCESSING_LEASE_MS)) {
          return jsonResponse({ claimed: false });
        }
        this.stats.stripeEvents[eventId] = { status: 'processing', updatedAt: now };
        await this.save();
        return jsonResponse({ claimed: true });
      }

      if (url.pathname === '/stripe-event/complete') {
        this.stats.stripeEvents[eventId] = { status: 'processed', updatedAt: now };
        await this.save();
        return jsonResponse({ ok: true });
      }

      if (url.pathname === '/stripe-event/release') {
        if (this.stats.stripeEvents[eventId]?.status === 'processing') {
          delete this.stats.stripeEvents[eventId];
          await this.save();
        }
        return jsonResponse({ ok: true });
      }
    }

    if (url.pathname === '/stats' && request.method === 'GET') {
      const { events, accountCount, sessionCount } = this.stats;
      return jsonResponse({ events, accountCount, sessionCount });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }
}
interface StatsEnv {
  STATS?: DurableObjectBinding;
}

async function stripeEventRequest(env: StatsEnv, action: 'claim' | 'complete' | 'release', eventId: string): Promise<Response> {
  if (!env.STATS) throw new Error('Stats Durable Object is not configured');
  const id = env.STATS.idFromName('global');
  return env.STATS.get(id).fetch(new Request(`https://internal/stripe-event/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  }));
}

export async function claimStripeEvent(env: StatsEnv, eventId: string): Promise<boolean> {
  const response = await stripeEventRequest(env, 'claim', eventId);
  if (!response.ok) throw new Error('Failed to claim Stripe event');
  const body = (await response.json()) as { claimed?: boolean };
  return body.claimed === true;
}

export async function completeStripeEvent(env: StatsEnv, eventId: string): Promise<void> {
  const response = await stripeEventRequest(env, 'complete', eventId);
  if (!response.ok) throw new Error('Failed to complete Stripe event');
}

export async function releaseStripeEvent(env: StatsEnv, eventId: string): Promise<void> {
  const response = await stripeEventRequest(env, 'release', eventId);
  if (!response.ok) throw new Error('Failed to release Stripe event');
}

function jsonResponse(body: object, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
