export interface CustomDomainMapping {
  domain: string;
  sessionId: string;
  accountId: string;
  verified: boolean;
  createdAt: number;
}

export interface Account {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: number;
  updatedAt: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  trialEndsAt?: number;
  sessions: string[];
  customDomains?: string[];
}

export interface AuthToken {
  accountId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface Env {
  SESSION: DurableObjectNamespace;
  ACCOUNTS: DurableObjectNamespace;
  STRIPE_API_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID?: string;
  AUTH_SECRET?: string;
  RESEND_API_KEY?: string;
  BROWSERLESS_TOKEN?: string;
  APP_URL?: string;
  TV_URL?: string;
}
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return typeof email === 'string' && email.length <= 200 && EMAIL_REGEX.test(email);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const usedSalt = salt || arrayBufferToHex(crypto.getRandomValues(new Uint8Array(16)));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(usedSalt),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    key,
    256
  );
  return { hash: arrayBufferToHex(bits), salt: usedSalt };
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  const result = await hashPassword(password, salt);
  return result.hash === hash;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function signToken(payload: Omit<AuthToken, 'iat' | 'exp'>, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const token: AuthToken = {
    ...payload,
    iat: now,
    exp: now + 60 * 60 * 24 * 7, // 7 days
  };
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(token));
  const data = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return `${data}.${arrayBufferToHex(signature)}`;
}

export async function verifyToken(token: string, secret: string): Promise<AuthToken | null> {
  try {
    const [headerB64, payloadB64, signatureHex] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureHex) return null;
    const data = `${headerB64}.${payloadB64}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const signature = hexToArrayBuffer(signatureHex);
    const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
    if (!valid) return null;
    const payload = JSON.parse(atob(payloadB64)) as AuthToken;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

export function getCookieValue(request: Request, name: string): string | undefined {
  const cookie = request.headers.get('cookie');
  if (!cookie) return undefined;
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function setCookie(name: string, value: string, maxAgeSeconds: number, secure: boolean): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`;
}

export function clearCookie(name: string): string {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function accountIdFromEmail(email: string): string {
  return email.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
}

export class AccountDurableObject implements DurableObject {
  private state: DurableObjectState;
  private account: Account | null = null;
  private initializePromise: Promise<void> | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async initialize(): Promise<Account | null> {
    if (this.account) return this.account;
    // Serialize concurrent first-fetch races: blockConcurrencyWhile
    // blocks all other operations on the DO until the callback resolves,
    // guaranteeing the one-time storage read happens exactly once.
    if (!this.initializePromise) {
      this.initializePromise = this.state.blockConcurrencyWhile(async () => {
        if (this.account) return;
        const stored = await this.state.storage.get<Account>('account');
        if (stored) this.account = stored;
      });
    }
    await this.initializePromise;
    return this.account;
  }

  async fetch(request: Request): Promise<Response> {
    await this.initialize();
    const url = new URL(request.url);

    if (url.pathname === '/probe' && request.method === 'GET') {
      return jsonResponse({ ok: true, hasAccount: !!this.account });
    }

    if (url.pathname === '/get' && request.method === 'GET') {
      return jsonResponse({ account: this.account });
    }

    if (url.pathname === '/create' && request.method === 'POST') {
      const body = (await request.json()) as { id: string; email: string; passwordHash: string; passwordSalt: string };
      if (!body.email || !body.passwordHash || !body.passwordSalt || !body.id) {
        return jsonResponse({ error: 'Missing fields' }, 400);
      }
      if (this.account) {
        return jsonResponse({ error: 'Account exists' }, 409);
      }
      const now = Date.now();
      this.account = {
        id: body.id,
        email: body.email,
        passwordHash: body.passwordHash,
        passwordSalt: body.passwordSalt,
        createdAt: now,
        updatedAt: now,
        subscriptionStatus: 'inactive',
        sessions: [],
      };
      await this.state.storage.put('account', this.account);
      return jsonResponse({ account: this.account });
    }

    if (url.pathname === '/verify' && request.method === 'POST') {
      const body = (await request.json()) as { password: string };
      if (!this.account || !body.password) return jsonResponse({ valid: false }, 401);
      const valid = await verifyPassword(body.password, this.account.passwordSalt, this.account.passwordHash);
      return jsonResponse({ valid, account: valid ? this.account : null });
    }

    if (url.pathname === '/stripe' && request.method === 'POST') {
      const body = (await request.json()) as {
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        subscriptionStatus?: Account['subscriptionStatus'];
        trialEndsAt?: number;
      };
      if (!this.account) return jsonResponse({ error: 'Account not found' }, 404);
      if (body.stripeCustomerId !== undefined) this.account.stripeCustomerId = body.stripeCustomerId;
      if (body.stripeSubscriptionId !== undefined) this.account.stripeSubscriptionId = body.stripeSubscriptionId;
      if (body.subscriptionStatus !== undefined) this.account.subscriptionStatus = body.subscriptionStatus;
      if (body.trialEndsAt !== undefined) this.account.trialEndsAt = body.trialEndsAt;
      this.account.updatedAt = Date.now();
      await this.state.storage.put('account', this.account);
      return jsonResponse({ account: this.account });
    }

    if (url.pathname === '/add-session' && request.method === 'POST') {
      const body = (await request.json()) as { sessionId: string };
      if (!this.account || !body.sessionId) return jsonResponse({ error: 'Invalid' }, 400);
      if (!this.account.sessions.includes(body.sessionId)) {
        this.account.sessions.push(body.sessionId);
        this.account.updatedAt = Date.now();
        await this.state.storage.put('account', this.account);
      }
      return jsonResponse({ account: this.account });
    }

    if (url.pathname === '/remove-session' && request.method === 'POST') {
      const body = (await request.json()) as { sessionId: string };
      if (!this.account || !body.sessionId) return jsonResponse({ error: 'Invalid' }, 400);
      this.account.sessions = this.account.sessions.filter((s) => s !== body.sessionId);
      this.account.updatedAt = Date.now();
      await this.state.storage.put('account', this.account);
      return jsonResponse({ account: this.account });
    }

    // Internal wipe endpoint used by account self-deletion (GDPR/CCPA).
    // Clears all durable storage and in-memory state. The Worker router has
    // already verified auth + confirmation and cancelled billing before
    // invoking. Returns 200.
    if (url.pathname === '/' && request.method === 'DELETE') {
      await this.state.storage.deleteAll();
      this.account = null;
      this.initializePromise = null;
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }
}

export function jsonResponse(body: object, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export async function getAccount(env: Env, accountId: string): Promise<Account | null> {
  const id = env.ACCOUNTS.idFromName(accountId);
  const stub = env.ACCOUNTS.get(id);
  const res = await stub.fetch(new Request('https://internal/get'));
  const data = (await res.json()) as { account: Account | null };
  return data.account;
}

export async function createAccount(env: Env, email: string, password: string): Promise<{ account: Account } | { error: string; status: number }> {
  const accountId = accountIdFromEmail(email);
  const id = env.ACCOUNTS.idFromName(accountId);
  const stub = env.ACCOUNTS.get(id);
  const { hash, salt } = await hashPassword(password);
  const res = await stub.fetch(
    new Request('https://internal/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: accountId, email, passwordHash: hash, passwordSalt: salt }),
    })
  );
  if (!res.ok) {
    const err = (await res.json()) as { error: string };
    return { error: err.error, status: res.status };
  }
  const data = (await res.json()) as { account: Account };
  return { account: data.account };
}

export async function authenticate(env: Env, email: string, password: string): Promise<Account | null> {
  const accountId = accountIdFromEmail(email);
  const id = env.ACCOUNTS.idFromName(accountId);
  const stub = env.ACCOUNTS.get(id);
  const res = await stub.fetch(
    new Request('https://internal/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
  );
  const data = (await res.json()) as { valid: boolean; account: Account | null };
  return data.valid ? data.account : null;
}

export async function updateAccountStripe(env: Env, accountId: string, updates: Parameters<AccountDurableObject['fetch']> extends never ? never : any): Promise<Account | null> {
  const id = env.ACCOUNTS.idFromName(accountId);
  const stub = env.ACCOUNTS.get(id);
  const res = await stub.fetch(
    new Request('https://internal/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  );
  const data = (await res.json()) as { account: Account | null };
  return data.account;
}

export async function addSessionToAccount(env: Env, accountId: string, sessionId: string): Promise<void> {
  const id = env.ACCOUNTS.idFromName(accountId);
  const stub = env.ACCOUNTS.get(id);
  await stub.fetch(
    new Request('https://internal/add-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
  );
}

export function isSubscriptionActive(account: Account): boolean {
  if (account.subscriptionStatus === 'active') return true;
  if (account.subscriptionStatus === 'trialing' && account.trialEndsAt && account.trialEndsAt > Date.now()) return true;
  return false;
}

export function generateSessionId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const length = 16;
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[arr[i] % chars.length];
  }
  return result;
}
