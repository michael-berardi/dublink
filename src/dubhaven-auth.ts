import { setCookie, signToken, upsertDubHavenAccount, Account } from './auth';
import type { Env as BaseEnv } from './auth';

export const DUBHAVEN_AUTH_URL_DEFAULT = 'https://dubhaven.com/api/auth/google';
const DUBHAVEN_AUDIENCE = 'dubmenu';
const _DUBHAVEN_ISSUER_DEFAULT = 'https://dubhaven.com';
const DUBHAVEN_HANDOFF_TTL_SECONDS = 60; // 1 minute, matches DubHaven provider

export interface DubHavenEnv extends BaseEnv {
  DUBHAVEN_AUTH_URL?: string;
  DUBHAVEN_ACCOUNT_SECRET?: string;
  DUBHAVEN_ISSUER?: string;
}

/**
 * Identity handed off by the shared DubHaven account provider. The JWT is signed
 * with DUBHAVEN_ACCOUNT_SECRET and has a short 60-second TTL. The provider token
 * format (accountId, googleSub, product, nonce, returnTo) is the source of truth
 * and must match lib/account/token.ts in the dubhaven-next provider.
 */
export interface DubHavenIdentity {
  accountId: string;
  email: string;
  googleSub: string;
  name: string;
  picture: string | null;
  product: string;
  nonce: string;
  returnTo: string;
}

interface DubHavenClaims extends DubHavenIdentity {
  iat: number;
  exp: number;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const str = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): ArrayBuffer {
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const chars = atob(padded);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i++) {
    bytes[i] = chars.charCodeAt(i);
  }
  return bytes.buffer;
}

export function getDubHavenAuthUrl(env: DubHavenEnv): string {
  return env.DUBHAVEN_AUTH_URL?.trim() || DUBHAVEN_AUTH_URL_DEFAULT;
}

export function isDubHavenStartConfigured(env: DubHavenEnv): boolean {
  return Boolean(getDubHavenAuthUrl(env));
}

export function isDubHavenCallbackConfigured(env: DubHavenEnv): boolean {
  return Boolean(env.DUBHAVEN_ACCOUNT_SECRET && env.AUTH_SECRET);
}

export function buildDubHavenAuthUrl(env: DubHavenEnv, origin: string, redirectAfter?: string): string {
  if (!isDubHavenStartConfigured(env)) {
    throw new Error('DubHaven auth is not configured');
  }
  const callbackUrl = new URL('/auth/dubhaven/callback', origin);
  if (redirectAfter) {
    callbackUrl.searchParams.set('next', redirectAfter);
  }
  const authUrl = new URL(getDubHavenAuthUrl(env));
  authUrl.searchParams.set('product', 'dubmenu');
  authUrl.searchParams.set('redirect', callbackUrl.toString());
  return authUrl.toString();
}

export async function signDubHavenToken(
  payload: Omit<DubHavenIdentity, 'product' | 'nonce' | 'returnTo'> & Partial<Pick<DubHavenIdentity, 'product' | 'nonce' | 'returnTo'>>,
  secret: string,
  options: { issuer?: string; audience?: string; expiresInSeconds?: number } = {}
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claims: DubHavenClaims = {
    accountId: payload.accountId,
    email: payload.email,
    googleSub: payload.googleSub || payload.email,
    name: payload.name || '',
    picture: payload.picture ?? null,
    product: payload.product || DUBHAVEN_AUDIENCE,
    nonce: payload.nonce || '',
    returnTo: payload.returnTo || '',
    iat: now,
    exp: now + (options.expiresInSeconds ?? DUBHAVEN_HANDOFF_TTL_SECONDS),
  };
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${base64UrlEncode(sig)}`;
}

export async function verifyDubHavenToken(
  token: string,
  secret: string,
  _options: { issuer?: string; audience?: string } = {}
): Promise<DubHavenIdentity | null> {
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !sigB64) return null;
    const data = `${headerB64}.${payloadB64}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sig = base64UrlDecode(sigB64);
    const valid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(data));
    if (!valid) return null;
    const claims = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as DubHavenClaims;
    const now = Math.floor(Date.now() / 1000);
    if (!claims.iat || claims.iat > now) return null;
    if (!claims.exp || claims.exp < now) return null;
    // The DubHaven provider token is product-scoped; reject cross-product tokens.
    if (claims.product !== DUBHAVEN_AUDIENCE) return null;
    if (!claims.accountId || typeof claims.accountId !== 'string') return null;
    if (!claims.email || typeof claims.email !== 'string') return null;
    if (!claims.googleSub || typeof claims.googleSub !== 'string') return null;
    if (claims.picture !== null && typeof claims.picture !== 'string') return null;
    return {
      accountId: claims.accountId,
      email: claims.email.toLowerCase(),
      googleSub: claims.googleSub,
      name: typeof claims.name === 'string' ? claims.name : '',
      picture: typeof claims.picture === 'string' ? claims.picture : null,
      product: claims.product,
      nonce: typeof claims.nonce === 'string' ? claims.nonce : '',
      returnTo: typeof claims.returnTo === 'string' ? claims.returnTo : '',
    };
  } catch {
    return null;
  }
}

export async function handleDubHavenCallback(
  request: Request,
  env: DubHavenEnv,
  origin: string,
  secure: boolean
): Promise<{ response: Response; account: Account; isNew: boolean } | { response: Response; account: null; isNew: false }> {
  if (!isDubHavenCallbackConfigured(env)) {
    return { response: new Response('DubHaven auth is not configured', { status: 503 }), account: null, isNew: false };
  }
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || url.searchParams.get('id_token') || url.searchParams.get('identity');
  const error = url.searchParams.get('error');
  const next = url.searchParams.get('next') || `${origin}/account`;
  if (error) {
    return { response: new Response(`DubHaven SSO error: ${error}`, { status: 400 }), account: null, isNew: false };
  }
  if (!token) {
    return { response: new Response('Missing DubHaven identity token', { status: 400 }), account: null, isNew: false };
  }
  const identity = await verifyDubHavenToken(token, env.DUBHAVEN_ACCOUNT_SECRET as string, {
    issuer: env.DUBHAVEN_ISSUER,
  });
  if (!identity) {
    return { response: new Response('Invalid or expired DubHaven identity token', { status: 400 }), account: null, isNew: false };
  }
  try {
    const localAccountId = dubmenuAccountId(identity.accountId);
    const { account, isNew } = await upsertDubHavenAccount(env, {
      id: localAccountId,
      email: identity.email,
      dubhavenAccountId: identity.accountId,
      googleSubject: identity.googleSub,
      googleEmail: identity.email,
      name: identity.name,
      picture: identity.picture ?? undefined,
    });
    const authToken = await signToken({ accountId: account.id, email: account.email }, env.AUTH_SECRET as string);
    const headers: Record<string, string> = {
      Location: next,
      'Set-Cookie': setCookie('dubmenu_auth', authToken, 60 * 60 * 24 * 7, secure),
      'Cache-Control': 'no-store',
    };
    return { response: new Response(null, { status: 302, headers }), account, isNew };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'DubHaven sign-in failed';
    return { response: new Response(message, { status: 500 }), account: null, isNew: false };
  }
}

function dubmenuAccountId(dubhavenAccountId: string): string {
  return dubhavenAccountId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
}
