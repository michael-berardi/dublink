import type { DurableObjectBinding } from './auth';

export interface StatusEnv {
  SESSION: DurableObjectBinding;
  ACCOUNTS: DurableObjectBinding;
  STRIPE_API_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID?: string;
  AUTH_SECRET?: string;
  APP_URL?: string;
}

export interface StatusResult {
  healthy: boolean;
  timestamp: string;
  env: {
    authSecret: boolean;
    stripeKey: boolean;
    stripePriceId: boolean;
    webhookSecret: boolean;
    appUrl: boolean;
  };
  stripe: { ok: boolean; error?: string };
  durableObjects: { accounts: boolean; sessions: boolean };
}

export async function getStatus(env: StatusEnv): Promise<StatusResult> {
  const result: StatusResult = {
    healthy: false,
    timestamp: new Date().toISOString(),
    env: {
      authSecret: !!env.AUTH_SECRET,
      stripeKey: !!env.STRIPE_API_KEY,
      stripePriceId: !!env.STRIPE_PRICE_ID,
      webhookSecret: !!env.STRIPE_WEBHOOK_SECRET,
      appUrl: !!env.APP_URL,
    },
    stripe: { ok: false },
    durableObjects: { accounts: false, sessions: false },
  };

  // Check Durable Object bindings by creating transient IDs
  try {
    const accountId = env.ACCOUNTS.idFromName('__status_probe__');
    const accountStub = env.ACCOUNTS.get(accountId);
    await accountStub.fetch(new Request('https://internal/probe'));
    result.durableObjects.accounts = true;
  } catch (err) {
    result.durableObjects.accounts = false;
  }

  try {
    const sessionId = env.SESSION.idFromName('__status_probe__');
    const sessionStub = env.SESSION.get(sessionId);
    await sessionStub.fetch(new Request('https://internal/probe'));
    result.durableObjects.sessions = true;
  } catch (err) {
    result.durableObjects.sessions = false;
  }

  // Check Stripe API
  if (env.STRIPE_API_KEY) {
    try {
      const res = await fetch('https://api.stripe.com/v1/products?limit=1', {
        headers: { Authorization: `Bearer ${env.STRIPE_API_KEY}`, 'Stripe-Version': '2024-12-18.acacia' },
      });
      result.stripe.ok = res.ok;
      if (!res.ok) {
        result.stripe.error = `HTTP ${res.status}`;
      }
    } catch (err) {
      result.stripe.error = err instanceof Error ? err.message : String(err);
    }
  } else {
    result.stripe.error = 'missing key';
  }

  result.healthy = result.env.authSecret && result.env.stripeKey && result.env.stripePriceId && result.env.webhookSecret && result.durableObjects.accounts && result.durableObjects.sessions && result.stripe.ok;
  return result;
}
