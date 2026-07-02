import { Env } from './auth';

const STRIPE_API = 'https://api.stripe.com/v1';

/**
 * Constant-time string comparison to avoid timing side-channels.
 * Compares two equal-length hex strings byte-by-byte, always scanning
 * the full length, then XOR-accumulates the difference.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * In-process Stripe event idempotency cache.
 *
 * LIMITATION: This is a module-level structure that resets on Worker
 * isolate restart. It catches Stripe's immediate/burst retries (the most
 * common duplicate-delivery scenario) but does NOT guarantee de-dup across
 * the full ~3-day Stripe retry window or across multiple isolates. A KV- or
 * Durable Object-backed store would be the durable upgrade (deferred to
 * avoid wrangler.toml binding conflicts during the multi-agent pass).
 */
const MAX_EVENT_CACHE = 1000;
const processedEventIds: Set<string> = new Set();
const eventOrder: string[] = [];

export function isDuplicateEvent(eventId: string): boolean {
  return processedEventIds.has(eventId);
}

export function recordEvent(eventId: string): void {
  if (processedEventIds.has(eventId)) return;
  processedEventIds.add(eventId);
  eventOrder.push(eventId);
  while (eventOrder.length > MAX_EVENT_CACHE) {
    const evicted = eventOrder.shift();
    if (evicted !== undefined) processedEventIds.delete(evicted);
  }
}

function authHeader(apiKey: string): string {
  return 'Basic ' + btoa(`${apiKey}:`);
}

async function stripeFetch(path: string, apiKey: string, options: RequestInit = {}): Promise<any> {
  const url = `${STRIPE_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: authHeader(apiKey),
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Stripe error: ${data.error?.message || res.statusText}`);
  }
  return data;
}

function encodeParams(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.join('&');
}

export async function createCustomer(env: Env, email: string, accountId: string): Promise<{ id: string }> {
  if (!env.STRIPE_API_KEY) throw new Error('Stripe not configured');
  const data = await stripeFetch('/customers', env.STRIPE_API_KEY, {
    method: 'POST',
    body: encodeParams({ email, 'metadata[accountId]': accountId }),
  });
  return { id: data.id };
}

export async function createCheckoutSession(
  env: Env,
  options: {
    customerEmail?: string;
    successUrl: string;
    cancelUrl: string;
    clientReferenceId?: string;
  }
): Promise<{ url: string | null; id: string }> {
  if (!env.STRIPE_API_KEY || !env.STRIPE_PRICE_ID) {
    throw new Error('Stripe not configured');
  }
  if (!options.clientReferenceId) throw new Error('clientReferenceId required');
  const customer = await createCustomer(env, options.customerEmail || '', options.clientReferenceId);
  const params: Record<string, string | number | undefined> = {
    'mode': 'subscription',
    'payment_method_types[0]': 'card',
    'line_items[0][price]': env.STRIPE_PRICE_ID,
    'line_items[0][quantity]': '1',
    'subscription_data[trial_period_days]': '14',
    'customer': customer.id,
    'success_url': options.successUrl,
    'cancel_url': options.cancelUrl,
    'allow_promotion_codes': 'true',
    'billing_address_collection': 'auto',
    'client_reference_id': options.clientReferenceId,
  };
  const data = await stripeFetch('/checkout/sessions', env.STRIPE_API_KEY, {
    method: 'POST',
    body: encodeParams(params),
  });
  return { url: data.url, id: data.id };
}

export async function createCustomerPortalSession(
  env: Env,
  customerId: string,
  returnUrl: string
): Promise<{ url: string | null }> {
  if (!env.STRIPE_API_KEY) throw new Error('Stripe not configured');
  const data = await stripeFetch('/billing_portal/sessions', env.STRIPE_API_KEY, {
    method: 'POST',
    body: encodeParams({ customer: customerId, return_url: returnUrl }),
  });
  return { url: data.url };
}

export async function getCheckoutSession(env: Env, sessionId: string): Promise<any> {
  if (!env.STRIPE_API_KEY) throw new Error('Stripe not configured');
  return stripeFetch(`/checkout/sessions/${sessionId}`, env.STRIPE_API_KEY);
}

export async function getSubscription(env: Env, subscriptionId: string): Promise<any> {
  if (!env.STRIPE_API_KEY) throw new Error('Stripe not configured');
  return stripeFetch(`/subscriptions/${subscriptionId}`, env.STRIPE_API_KEY);
}

export async function cancelSubscription(env: Env, subscriptionId: string): Promise<any> {
  if (!env.STRIPE_API_KEY) throw new Error('Stripe not configured');
  return stripeFetch(`/subscriptions/${subscriptionId}`, env.STRIPE_API_KEY, {
    method: 'POST',
    body: encodeParams({ cancel_at_period_end: 'true' }),
  });
}

export async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<any> {
  const parts = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) throw new Error('Invalid signature');
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expectedSig = arrayBufferToHex(sig);
  if (!safeEqual(v1, expectedSig)) throw new Error('Signature mismatch');
  const event = JSON.parse(payload);
  const headerTimestamp = parseInt(timestamp, 10) * 1000;
  const now = Date.now();
  if (now - headerTimestamp > 5 * 60 * 1000) throw new Error('Webhook too old');
  return event;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function subscriptionStatusFromStripe(status: string): any {
  switch (status) {
    case 'trialing': return 'trialing';
    case 'active': return 'active';
    case 'past_due': return 'past_due';
    case 'canceled': return 'canceled';
    case 'unpaid': return 'unpaid';
    case 'incomplete': return 'inactive';
    case 'incomplete_expired': return 'inactive';
    default: return 'inactive';
  }
}

export function trialEndsAtFromStripe(subscription: any): number | undefined {
  if (subscription.trial_end) return subscription.trial_end * 1000;
  return undefined;
}
