import type { Account, Env } from './auth';

const STRIPE_API = 'https://api.stripe.com/v1';
const pendingCheckoutSessions = new Map<string, Promise<{ url: string | null; id: string }>>();

export interface StripeObject {
  [key: string]: unknown;
  id?: string;
  url?: string | null;
  status?: string;
  trial_end?: number;
  customer?: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: { object: StripeObject };
}

function isStripeObject(value: unknown): value is StripeObject {
  return typeof value === 'object' && value !== null;
}

function isStripeWebhookEvent(value: unknown): value is StripeWebhookEvent {
  if (!isStripeObject(value) || typeof value.id !== 'string' || typeof value.type !== 'string') return false;
  return isStripeObject(value.data) && isStripeObject(value.data.object);
}

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


function authHeader(apiKey: string): string {
  return 'Basic ' + btoa(`${apiKey}:`);
}

async function stripeFetch(path: string, apiKey: string, options: RequestInit = {}): Promise<StripeObject> {
  const url = `${STRIPE_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: authHeader(apiKey),
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers,
    },
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    let message = res.statusText;
    if (isStripeObject(data) && isStripeObject(data.error) && typeof data.error.message === 'string') {
      message = data.error.message;
    }
    throw new Error(`Stripe error: ${message}`);
  }
  if (!isStripeObject(data)) throw new Error('Stripe returned an invalid response');
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
    headers: { 'Idempotency-Key': `dubmenu-customer-${accountId}` },
    body: encodeParams({ email, 'metadata[accountId]': accountId }),
  });
  if (typeof data.id !== 'string') throw new Error('Stripe customer response missing ID');
  return { id: data.id };
}

export async function createCheckoutSession(
  env: Env,
  options: {
    customerEmail?: string;
    customerId?: string;
    successUrl: string;
    cancelUrl: string;
    clientReferenceId?: string;
  }
): Promise<{ url: string | null; id: string }> {
  if (!env.STRIPE_API_KEY || !env.STRIPE_PRICE_ID) throw new Error('Stripe not configured');
  if (!options.clientReferenceId) throw new Error('clientReferenceId required');
  const accountId = options.clientReferenceId;
  const inFlight = pendingCheckoutSessions.get(accountId);
  if (inFlight) return inFlight;
  const pending = (async () => {
    const customerId = options.customerId || (await createCustomer(env, options.customerEmail || '', accountId)).id;
    const params: Record<string, string | number | undefined> = {
      mode: 'subscription',
      'payment_method_types[0]': 'card',
      'line_items[0][price]': env.STRIPE_PRICE_ID,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': '14',
      customer: customerId,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      allow_promotion_codes: 'true',
      billing_address_collection: 'auto',
      client_reference_id: accountId,
    };
    const windowId = Math.floor(Date.now() / (15 * 60 * 1000));
    const data = await stripeFetch('/checkout/sessions', env.STRIPE_API_KEY as string, {
      method: 'POST',
      headers: { 'Idempotency-Key': `dubmenu-checkout-${accountId}-${windowId}` },
      body: encodeParams(params),
    });
    if (typeof data.id !== 'string' || (data.url !== null && typeof data.url !== 'string')) {
      throw new Error('Stripe checkout response is invalid');
    }
    return { url: data.url ?? null, id: data.id };
  })();
  pendingCheckoutSessions.set(accountId, pending);
  try {
    return await pending;
  } finally {
    if (pendingCheckoutSessions.get(accountId) === pending) pendingCheckoutSessions.delete(accountId);
  }
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
  if (data.url !== null && typeof data.url !== 'string') throw new Error('Stripe portal response is invalid');
  return { url: data.url ?? null };
}

export async function getCheckoutSession(env: Env, sessionId: string): Promise<StripeObject> {
  if (!env.STRIPE_API_KEY) throw new Error('Stripe not configured');
  return stripeFetch(`/checkout/sessions/${sessionId}`, env.STRIPE_API_KEY);
}

export async function getSubscription(env: Env, subscriptionId: string): Promise<StripeObject> {
  if (!env.STRIPE_API_KEY) throw new Error('Stripe not configured');
  return stripeFetch(`/subscriptions/${subscriptionId}`, env.STRIPE_API_KEY);
}

export async function cancelSubscription(env: Env, subscriptionId: string): Promise<StripeObject> {
  if (!env.STRIPE_API_KEY) throw new Error('Stripe not configured');
  return stripeFetch(`/subscriptions/${subscriptionId}`, env.STRIPE_API_KEY, {
    method: 'POST',
    body: encodeParams({ cancel_at_period_end: 'true' }),
  });
}

export async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<StripeWebhookEvent> {
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
  const event: unknown = JSON.parse(payload);
  if (!isStripeWebhookEvent(event)) throw new Error('Invalid webhook event');
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

export function subscriptionStatusFromStripe(status: string): Account['subscriptionStatus'] {
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

export function trialEndsAtFromStripe(subscription: StripeObject): number | undefined {
  return typeof subscription.trial_end === 'number' ? subscription.trial_end * 1000 : undefined;
}
