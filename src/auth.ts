import { createStarterConfig } from './starter-template';

export interface CustomDomainMapping {
  domain: string;
  sessionId: string;
  accountId: string;
  verified: boolean;
  verificationToken?: string;
  createdAt: number;
}

export interface BusinessMember {
  accountId: string;
  email: string;
  role: 'owner' | 'manager';
  joinedAt: number;
}

export interface BusinessInvitation {
  id: string;
  email: string;
  role: 'manager';
  tokenHash: string;
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
}

export interface Account {
  id: string;
  email: string;
  passwordHash?: string;
  passwordSalt?: string;
  createdAt: number;
  updatedAt: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  trialEndsAt?: number;
  sessions: string[];
  customDomains?: string[];
  businessId?: string; // equals owner account id; for owners this is account.id
  businessName?: string;
  businessMenuSessionId?: string;
  businessMembers?: BusinessMember[];
  businessInvitations?: BusinessInvitation[];
  // Shared DubHaven identity linkage. When present the account was created
  // or linked via DubHaven SSO; googleSubject/googleEmail store the upstream
  // Google claims from the shared identity token.
  dubhavenAccountId?: string;
  googleSubject?: string;
  googleEmail?: string;
  name?: string;
  picture?: string;
}

export interface AccountStripeUpdate {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: Account['subscriptionStatus'];
  trialEndsAt?: number;
}

export interface AuthToken {
  accountId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface DurableObjectBinding {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): { fetch(request: Request): Promise<Response> };
}

export interface Env {
  SESSION: DurableObjectBinding;
  ACCOUNTS: DurableObjectBinding;
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

function arrayBufferToHex(input: ArrayBufferLike | ArrayBufferView<ArrayBufferLike>): string {
  const bytes = ArrayBuffer.isView(input)
    ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
    : new Uint8Array(input);
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return hex;
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

function legacyAccountIdFromEmail(email: string): string {
  return normalizeEmail(email).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
}

export async function accountIdFromEmail(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  const suffix = Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const prefix = normalized.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'account';
  return `${prefix}-${suffix}`;
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
        subscriptionStatus: 'trialing',
        trialEndsAt: now + 14 * 24 * 60 * 60 * 1000,
        sessions: [],
      };
      await this.state.storage.put('account', this.account);
      return jsonResponse({ account: this.account });
    }

    if (url.pathname === '/verify' && request.method === 'POST') {
      const body = (await request.json()) as { password: string };
      if (!this.account || !this.account.passwordHash || !this.account.passwordSalt || !body.password) return jsonResponse({ valid: false }, 401);
      const valid = await verifyPassword(body.password, this.account.passwordSalt, this.account.passwordHash);
      return jsonResponse({ valid, account: valid ? this.account : null });
    }

    if (url.pathname === '/upsert-dubhaven' && request.method === 'POST') {
      const body = (await request.json()) as {
        id: string;
        email: string;
        dubhavenAccountId: string;
        googleSubject?: string;
        googleEmail?: string;
        name?: string;
        picture?: string;
        demoTrialDays?: number;
      };
      if (!body.email || !body.dubhavenAccountId || !body.id) {
        return jsonResponse({ error: 'Missing fields' }, 400);
      }
      const now = Date.now();
      if (this.account) {
        this.account.dubhavenAccountId = body.dubhavenAccountId;
        if (body.googleSubject) this.account.googleSubject = body.googleSubject;
        if (body.googleEmail) this.account.googleEmail = body.googleEmail;
        if (body.name) this.account.name = body.name;
        if (body.picture) this.account.picture = body.picture;
        this.account.updatedAt = now;
        await this.state.storage.put('account', this.account);
        return jsonResponse({ account: this.account, isNew: false });
      }
      const trialDays = typeof body.demoTrialDays === 'number' && body.demoTrialDays > 0 ? body.demoTrialDays : 30;
      this.account = {
        id: body.id,
        email: body.email,
        createdAt: now,
        updatedAt: now,
        subscriptionStatus: 'trialing',
        trialEndsAt: now + trialDays * 24 * 60 * 60 * 1000,
        sessions: [],
        dubhavenAccountId: body.dubhavenAccountId,
        googleSubject: body.googleSubject,
        googleEmail: body.googleEmail,
        name: body.name,
        picture: body.picture,
      };
      await this.state.storage.put('account', this.account);
      return jsonResponse({ account: this.account, isNew: true });
    }

    if (url.pathname === '/stripe' && request.method === 'POST') {
      const body = (await request.json()) as AccountStripeUpdate;
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

    // Business record: idempotent migration for legacy accounts.
    if (url.pathname === '/business/migrate' && request.method === 'POST') {
      if (!this.account) return jsonResponse({ error: 'Account not found' }, 404);
      let body: { businessName?: string; businessMenuSessionId?: string } = {};
      try {
        body = (await request.json()) as { businessName?: string; businessMenuSessionId?: string };
      } catch {
        // empty body is fine
      }
      const now = Date.now();
      let changed = false;
      if (!this.account.businessId) {
        this.account.businessId = this.account.id;
        changed = true;
      }
      const desiredName = body.businessName?.trim().slice(0, 100) || this.account.email.split('@')[0] || 'My Business';
      if (!this.account.businessName) {
        this.account.businessName = desiredName;
        changed = true;
      }
      const canonicalSession = body.businessMenuSessionId?.trim();
      if (!this.account.businessMenuSessionId) {
        if (canonicalSession && this.account.sessions.includes(canonicalSession)) {
          this.account.businessMenuSessionId = canonicalSession;
        } else if (this.account.sessions.length > 0) {
          this.account.businessMenuSessionId = this.account.sessions[0];
        }
        changed = true;
      }
      if (!this.account.businessMembers) {
        this.account.businessMembers = [
          { accountId: this.account.id, email: this.account.email, role: 'owner', joinedAt: this.account.createdAt },
        ];
        changed = true;
      }
      if (changed) {
        this.account.updatedAt = now;
        await this.state.storage.put('account', this.account);
      }
      return jsonResponse({ account: this.account });
    }

    // Business record: update display name and canonical menu session.
    if (url.pathname === '/business' && request.method === 'POST') {
      if (!this.account) return jsonResponse({ error: 'Account not found' }, 404);
      const body = (await request.json()) as {
        businessName?: string;
        businessMenuSessionId?: string;
        businessId?: string;
      };
      if (body.businessName !== undefined) {
        this.account.businessName = body.businessName.slice(0, 100);
      }
      if (body.businessMenuSessionId !== undefined) {
        this.account.businessMenuSessionId = body.businessMenuSessionId;
      }
      if (body.businessId !== undefined) {
        this.account.businessId = body.businessId;
        if (this.account.businessId === this.account.id && !this.account.businessMembers) {
          this.account.businessMembers = [
            { accountId: this.account.id, email: this.account.email, role: 'owner', joinedAt: this.account.createdAt },
          ];
        }
      }
      this.account.updatedAt = Date.now();
      await this.state.storage.put('account', this.account);
      return jsonResponse({ account: this.account });
    }

    // Manager linkage: join a business as a manager (preserves an existing owner business).
    if (url.pathname === '/business/join' && request.method === 'POST') {
      if (!this.account) return jsonResponse({ error: 'Account not found' }, 404);
      const body = (await request.json()) as {
        businessId: string;
        businessName?: string;
        businessMenuSessionId?: string;
      };
      if (!body.businessId) return jsonResponse({ error: 'Missing businessId' }, 400);
      if (!this.account.businessId && this.account.sessions.length > 0) {
        return jsonResponse({ error: 'Account already owns menu sessions' }, 409);
      }
      if (this.account.businessId && this.account.businessId === this.account.id) {
        return jsonResponse({ error: 'Account already owns a business' }, 409);
      }
      if (this.account.businessId !== body.businessId) {
        this.account.businessId = body.businessId;
        if (body.businessName) this.account.businessName = body.businessName;
        if (body.businessMenuSessionId) this.account.businessMenuSessionId = body.businessMenuSessionId;
        this.account.updatedAt = Date.now();
        await this.state.storage.put('account', this.account);
      }
      return jsonResponse({ account: this.account });
    }

    // Business invitations: store token hashes only; never expose them in responses.
    if (url.pathname === '/business/invite' && request.method === 'POST') {
      if (!this.account) return jsonResponse({ error: 'Account not found' }, 404);
      const body = (await request.json()) as {
        id: string;
        email: string;
        role: 'manager';
        tokenHash: string;
        createdAt: number;
        expiresAt: number;
      };
      if (!body.id || !body.email || !body.tokenHash || !body.expiresAt) {
        return jsonResponse({ error: 'Invalid invitation' }, 400);
      }
      const invites = this.account.businessInvitations || [];
      invites.push({
        id: body.id,
        email: body.email,
        role: body.role || 'manager',
        tokenHash: body.tokenHash,
        createdAt: body.createdAt,
        expiresAt: body.expiresAt,
      });
      this.account.businessInvitations = invites;
      this.account.updatedAt = Date.now();
      await this.state.storage.put('account', this.account);
      return jsonResponse({
        invite: { id: body.id, email: body.email, createdAt: body.createdAt, expiresAt: body.expiresAt },
      });
    }

    if (url.pathname === '/business/invite/revoke' && request.method === 'POST') {
      if (!this.account) return jsonResponse({ error: 'Account not found' }, 404);
      const body = (await request.json()) as { id: string };
      if (!body.id) return jsonResponse({ error: 'Invalid invitation id' }, 400);
      const before = this.account.businessInvitations || [];
      const after = before.filter((i) => i.id !== body.id);
      if (after.length === before.length) return jsonResponse({ error: 'Invitation not found' }, 404);
      this.account.businessInvitations = after;
      this.account.updatedAt = Date.now();
      await this.state.storage.put('account', this.account);
      return jsonResponse({ ok: true });
    }

    if (url.pathname === '/business/invite/consume' && request.method === 'POST') {
      if (!this.account) return jsonResponse({ error: 'Account not found' }, 404);
      const body = (await request.json()) as { tokenHash: string; email: string; accountId: string };
      if (!body.tokenHash || !body.email || !body.accountId) {
        return jsonResponse({ accepted: false }, 400);
      }
      const normalizedEmail = body.email.trim().toLowerCase();
      const invite = (this.account.businessInvitations || []).find((item) => item.tokenHash === body.tokenHash);
      const members = this.account.businessMembers || [];
      const existingMember = members.find((member) => member.accountId === body.accountId);
      if (invite?.acceptedAt) {
        const alreadyAccepted = invite.email === normalizedEmail
          && existingMember?.email === normalizedEmail
          && existingMember.role === 'manager';
        return alreadyAccepted
          ? jsonResponse({ accepted: true, acceptedAt: invite.acceptedAt, alreadyAccepted: true })
          : jsonResponse({ accepted: false }, 409);
      }
      if (!invite || invite.email !== normalizedEmail || invite.expiresAt <= Date.now()) {
        return jsonResponse({ accepted: false }, 403);
      }
      if (!existingMember) {
        members.push({
          accountId: body.accountId,
          email: normalizedEmail,
          role: 'manager',
          joinedAt: Date.now(),
        });
      } else {
        existingMember.email = normalizedEmail;
        existingMember.role = 'manager';
      }
      invite.acceptedAt = Date.now();
      this.account.businessMembers = members;
      this.account.updatedAt = Date.now();
      await this.state.storage.put('account', this.account);
      return jsonResponse({ accepted: true, acceptedAt: invite.acceptedAt });
    }

    // Business members: add/update a member on the owner record.
    if (url.pathname === '/business/member' && request.method === 'POST') {
      if (!this.account) return jsonResponse({ error: 'Account not found' }, 404);
      const body = (await request.json()) as {
        accountId: string;
        email: string;
        role: 'owner' | 'manager';
        joinedAt?: number;
      };
      if (!body.accountId || !body.email) return jsonResponse({ error: 'Invalid member' }, 400);
      const members = this.account.businessMembers || [];
      const existing = members.find((m) => m.accountId === body.accountId);
      if (!existing) {
        members.push({
          accountId: body.accountId,
          email: body.email,
          role: body.role || 'manager',
          joinedAt: body.joinedAt || Date.now(),
        });
      } else {
        existing.email = body.email;
        if (body.role) existing.role = body.role;
      }
      this.account.businessMembers = members;
      this.account.updatedAt = Date.now();
      await this.state.storage.put('account', this.account);
      return jsonResponse({ ok: true });
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
  const accountId = await accountIdFromEmail(email);
  const legacyAccountId = legacyAccountIdFromEmail(email);
  if (legacyAccountId !== accountId && await getAccount(env, legacyAccountId)) {
    return { error: 'Account exists', status: 409 };
  }
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
  const accountId = await accountIdFromEmail(email);
  const accountIds = [accountId];
  const legacyAccountId = legacyAccountIdFromEmail(email);
  if (legacyAccountId !== accountId) accountIds.push(legacyAccountId);
  for (const candidateId of accountIds) {
    const id = env.ACCOUNTS.idFromName(candidateId);
    const stub = env.ACCOUNTS.get(id);
    const res = await stub.fetch(
      new Request('https://internal/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
    );
    const data = (await res.json()) as { valid: boolean; account: Account | null };
    if (data.valid) return data.account;
  }
  return null;
}

export async function upsertDubHavenAccount(
  env: Env,
  input: { id: string; email: string; dubhavenAccountId: string; googleSubject?: string; googleEmail?: string; name?: string; picture?: string }
): Promise<{ account: Account; isNew: boolean }> {
  const id = env.ACCOUNTS.idFromName(input.id);
  const stub = env.ACCOUNTS.get(id);
  const res = await stub.fetch(
    new Request('https://internal/upsert-dubhaven', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  );
  if (!res.ok) {
    const err = (await res.json()) as { error: string };
    throw new Error(err.error || 'DubHaven account upsert failed');
  }
  const data = (await res.json()) as { account: Account; isNew: boolean };
  return { account: data.account, isNew: data.isNew };
}

export async function updateAccountStripe(env: Env, accountId: string, updates: AccountStripeUpdate): Promise<Account | null> {
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
  const res = await stub.fetch(
    new Request('https://internal/add-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
  );
  if (!res.ok) {
    throw new Error(`Failed to persist session on account (${res.status})`);
  }
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

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  return crypto.subtle.timingSafeEqual(aBytes, bBytes);
}

export async function ensureDemoAccount(env: Env, email: string): Promise<Account> {
  const accountId = await accountIdFromEmail(email);
  const legacyAccountId = legacyAccountIdFromEmail(email);
  const existing = await getAccount(env, accountId) || (legacyAccountId !== accountId ? await getAccount(env, legacyAccountId) : null);
  const trialEndsAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  if (existing) {
    await updateAccountStripe(env, existing.id, { subscriptionStatus: 'trialing', trialEndsAt });
    const refreshed = await getAccount(env, existing.id);
    return refreshed as Account;
  }
  const password = generateSessionId() + generateSessionId();
  const result = await createAccount(env, email, password);
  if ('error' in result) throw new Error(result.error);
  await updateAccountStripe(env, result.account.id, { subscriptionStatus: 'trialing', trialEndsAt });
  return result.account;
}

export function isBusinessOwner(account: Account): boolean {
  return !!account.businessId && account.businessId === account.id;
}

export function isBusinessMember(account: Account): boolean {
  return !!account.businessId;
}

export function getBusinessOwnerAccountId(account: Account): string | undefined {
  return account.businessId;
}

export function getOwnerAccountIdForAccount(account: Account): string {
  return account.businessId || account.id;
}

export async function resolveBusinessAccount(env: Env, account: Account): Promise<Account | null> {
  if (!account.businessId) return null;
  if (account.businessId === account.id) return account;
  return getAccount(env, account.businessId);
}

export function generateInviteToken(ownerAccountId: string): string {
  return `invite:${ownerAccountId}:${crypto.randomUUID()}`;
}

export function parseInviteToken(token: string): { ownerAccountId: string } | null {
  const parts = token.split(':');
  if (parts.length !== 3 || parts[0] !== 'invite') return null;
  return { ownerAccountId: parts[1] };
}

export async function hashInviteToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return arrayBufferToHex(digest);
}

export async function ensureBusinessAccount(env: Env, account: Account): Promise<Account> {
  if (account.businessId) return account;
  if (account.sessions.length === 0) return account;

  let businessName: string | undefined;
  let businessMenuSessionId: string | undefined;
  let bestCandidate: { sessionId: string; name: string; productCount: number } | null = null;

  for (const sessionId of account.sessions) {
    try {
      const sid = env.SESSION.idFromName(sessionId);
      const session = env.SESSION.get(sid);
      const cfgRes = await session.fetch(new Request('https://internal/tv-config'));
      if (!cfgRes.ok) continue;
      const cfg = (await cfgRes.json()) as {
        dispensaryName?: string;
        categories?: Array<{ products?: unknown[] }>;
      };
      const productCount = Array.isArray(cfg.categories)
        ? cfg.categories.reduce((sum, cat) => sum + (Array.isArray(cat.products) ? cat.products.length : 0), 0)
        : 0;
      const name = cfg.dispensaryName?.trim() || '';
      if (productCount > 0) {
        const candidateIsDefault = bestCandidate?.name === '' || bestCandidate?.name === 'DubMenu';
        if (!bestCandidate || (name !== 'DubMenu' && name.length > 0 && candidateIsDefault)) {
          bestCandidate = { sessionId, name, productCount };
        }
      }
    } catch {
      // ignore unreadable sessions
    }
  }

  if (bestCandidate) {
    businessMenuSessionId = bestCandidate.sessionId;
    if (bestCandidate.name !== 'DubMenu' && bestCandidate.name.length > 0) {
      businessName = bestCandidate.name.slice(0, 100);
    }
  }

  if (!businessName) {
    try {
      const fallbackId = businessMenuSessionId || account.sessions[0];
      const sid = env.SESSION.idFromName(fallbackId);
      const session = env.SESSION.get(sid);
      const cfgRes = await session.fetch(new Request('https://internal/tv-config'));
      if (cfgRes.ok) {
        const cfg = (await cfgRes.json()) as { dispensaryName?: string };
        const name = cfg.dispensaryName?.trim();
        if (name && name.length > 0 && name !== 'DubMenu') {
          businessName = name.slice(0, 100);
        }
      }
    } catch {
      // ignore
    }
  }

  const id = env.ACCOUNTS.idFromName(account.id);
  const stub = env.ACCOUNTS.get(id);
  await stub.fetch(
    new Request('https://internal/business/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName, businessMenuSessionId }),
    })
  );
  const refreshed = await getAccount(env, account.id);
  return refreshed || account;
}

export async function createBusinessMenu(
  env: Env,
  account: Account,
  businessName: string
): Promise<{ sessionId: string; account: Account } | { error: string; status: number }> {
  if (!isSubscriptionActive(account)) {
    return { error: 'An active subscription is required to create a business menu', status: 403 };
  }
  if (account.businessMenuSessionId) {
    return { sessionId: account.businessMenuSessionId, account };
  }
  const accountStub = env.ACCOUNTS.get(env.ACCOUNTS.idFromName(account.id));
  // Persist business identity before importing so the session layer can resolve membership.
  await accountStub.fetch(
    new Request('https://internal/business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: account.id, businessName: businessName.slice(0, 100) }),
    })
  );
  const sessionId = generateSessionId();
  const starter = createStarterConfig();
  const id = env.SESSION.idFromName(sessionId);
  const session = env.SESSION.get(id);
  const importRes = await session.fetch(
    new Request('https://internal/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Account-Id': account.id },
      body: JSON.stringify({ ...starter, dispensaryName: businessName.slice(0, 100) }),
    })
  );
  if (!importRes.ok) {
    return { error: 'Failed to create business menu', status: 500 };
  }
  await addSessionToAccount(env, account.id, sessionId);
  await accountStub.fetch(
    new Request('https://internal/business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessMenuSessionId: sessionId }),
    })
  );
  await accountStub.fetch(
    new Request('https://internal/business/member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: account.id,
        email: account.email,
        role: 'owner',
        joinedAt: account.createdAt,
      }),
    })
  );
  const refreshed = await getAccount(env, account.id);
  const ownerMember = refreshed?.businessMembers?.some(
    (member) => member.accountId === account.id && member.role === 'owner'
  );
  if (
    !refreshed
    || refreshed.businessId !== account.id
    || refreshed.businessMenuSessionId !== sessionId
    || !refreshed.sessions.includes(sessionId)
    || !ownerMember
  ) {
    return { error: 'Failed to persist business menu', status: 500 };
  }
  return { sessionId, account: refreshed };
}

export async function createBusinessInvitation(
  env: Env,
  ownerAccount: Account,
  email: string
): Promise<{ token: string; invite: { id: string; email: string; createdAt: number; expiresAt: number } } | { error: string; status: number }> {
  if (!isBusinessOwner(ownerAccount)) {
    return { error: 'Only business owners can send invitations', status: 403 };
  }
  if (!isValidEmail(email)) {
    return { error: 'Invalid email address', status: 400 };
  }
  const normalized = normalizeEmail(email);
  if (normalized === normalizeEmail(ownerAccount.email)) {
    return { error: 'You cannot invite the business owner', status: 400 };
  }
  const isMember = (ownerAccount.businessMembers || []).some((m) => normalizeEmail(m.email) === normalized);
  if (isMember) {
    return { error: 'This email is already a member of the business', status: 409 };
  }
  const pending = (ownerAccount.businessInvitations || []).find(
    (i) => !i.acceptedAt && i.expiresAt > Date.now() && normalizeEmail(i.email) === normalized
  );
  if (pending) {
    return { error: 'An invitation is already pending for this email', status: 409 };
  }
  const id = crypto.randomUUID();
  const token = generateInviteToken(ownerAccount.id);
  const tokenHash = await hashInviteToken(token);
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
  const stub = env.ACCOUNTS.get(env.ACCOUNTS.idFromName(ownerAccount.id));
  const res = await stub.fetch(
    new Request('https://internal/business/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, email: normalized, role: 'manager', tokenHash, createdAt: now, expiresAt }),
    })
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: 'Failed to create invitation' }))) as { error?: string };
    return { error: err.error || 'Failed to create invitation', status: res.status };
  }
  return { token, invite: { id, email: normalized, createdAt: now, expiresAt } };
}

export async function revokeBusinessInvitation(env: Env, ownerAccount: Account, inviteId: string): Promise<boolean> {
  const stub = env.ACCOUNTS.get(env.ACCOUNTS.idFromName(ownerAccount.id));
  const res = await stub.fetch(
    new Request('https://internal/business/invite/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: inviteId }),
    })
  );
  return res.ok;
}

export function listPendingInvitations(account: Account): Array<Omit<BusinessInvitation, 'tokenHash'>> {
  const now = Date.now();
  return (account.businessInvitations || [])
    .filter((i) => !i.acceptedAt && i.expiresAt > now)
    .map(({ tokenHash: _tokenHash, ...rest }) => rest);
}

export async function acceptBusinessInvitation(
  env: Env,
  initialAccount: Account,
  token: string
): Promise<{ success: boolean; error?: string; status?: number }> {
  const parsed = parseInviteToken(token);
  if (!parsed) return { success: false, error: 'Invalid invitation token', status: 400 };
  const account = await ensureBusinessAccount(env, initialAccount);
  if (!account.businessId && account.sessions.length > 0) {
    return { success: false, error: 'Account already owns menu sessions', status: 409 };
  }
  const ownerAccount = await getAccount(env, parsed.ownerAccountId);
  if (!ownerAccount) return { success: false, error: 'Business not found', status: 404 };
  if (account.businessId === account.id) {
    return { success: false, error: 'Account already owns a business', status: 409 };
  }
  if (account.businessId && account.businessId !== ownerAccount.id) {
    return { success: false, error: 'Account is already linked to a different business', status: 409 };
  }
  if (account.businessId === ownerAccount.id) {
    return { success: false, error: 'Invitation invalid, expired, or email mismatch', status: 409 };
  }

  const tokenHash = await hashInviteToken(token);
  const ownerStub = env.ACCOUNTS.get(env.ACCOUNTS.idFromName(ownerAccount.id));
  const consumeRes = await ownerStub.fetch(
    new Request('https://internal/business/invite/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenHash, email: account.email, accountId: account.id }),
    })
  );
  if (!consumeRes.ok) {
    return { success: false, error: 'Invitation invalid, expired, or email mismatch', status: consumeRes.status };
  }

  const joinRes = await env.ACCOUNTS.get(env.ACCOUNTS.idFromName(account.id)).fetch(
    new Request('https://internal/business/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: ownerAccount.id,
        businessName: ownerAccount.businessName,
        businessMenuSessionId: ownerAccount.businessMenuSessionId,
      }),
    })
  );
  if (!joinRes.ok) {
    return { success: false, error: 'Account could not join the business', status: joinRes.status };
  }
  return { success: true };
}

export async function sendBusinessInviteEmail(
  env: Env,
  token: string,
  ownerAccount: Account,
  inviteeEmail: string,
  origin: string
): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;
  const link = `${origin}/invite/${encodeURIComponent(token)}`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'DubMenu <hello@dubhaven.com>',
        to: [inviteeEmail],
        subject: `Invitation to manage ${ownerAccount.businessName || 'DubMenu'}`,
        text: `You've been invited to manage ${ownerAccount.businessName || 'DubMenu'} on DubMenu. Accept the invitation here: ${link}`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

