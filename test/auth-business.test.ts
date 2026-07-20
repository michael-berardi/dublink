import { env as workerEnv, SELF } from 'cloudflare:test';
import { describe, expect, it, vi } from 'vitest';
import {
  accountIdFromEmail,
  createBusinessInvitation,
  ensureBusinessAccount,
  getAccount,
  listPendingInvitations,
  sendBusinessInviteEmail,
  updateAccountStripe,
  type Account,
  type Env,
} from '../src/auth';

const BASE = 'https://dubmenu.com';
const env = workerEnv as unknown as Env;
const uniqueEmail = (label: string) => `${label}-${crypto.randomUUID()}@dubmenu-test.example`;

type SignedUpAccount = {
  accountId: string;
  cookie: string;
  email: string;
};

async function signUp(label: string): Promise<SignedUpAccount> {
  const email = uniqueEmail(label);
  const form = new FormData();
  form.set('email', email);
  form.set('password', 'test-password-1234');
  const response = await SELF.fetch(`${BASE}/api/signup`, {
    method: 'POST',
    body: form,
    headers: { Origin: BASE },
    redirect: 'manual',
  });
  expect(response.status).toBe(302);
  const cookieMatch = (response.headers.get('set-cookie') || '').match(/dubmenu_auth=([^;]+)/);
  if (!cookieMatch) throw new Error('Sign-up did not set an auth cookie');
  return {
    accountId: await accountIdFromEmail(email),
    cookie: `dubmenu_auth=${cookieMatch[1]}`,
    email,
  };
}

async function onboard(account: SignedUpAccount, businessName: string) {
  const form = new FormData();
  form.set('businessName', businessName);
  const response = await SELF.fetch(`${BASE}/api/business/onboarding`, {
    method: 'POST',
    body: form,
    headers: { Cookie: account.cookie, Origin: BASE },
    redirect: 'manual',
  });
  expect(response.status).toBe(302);
  const location = response.headers.get('location') || '';
  expect(location).toMatch(/\/config\/[A-Za-z0-9_-]+$/);
  return location.split('/').at(-1) as string;
}

function authedFetch(account: SignedUpAccount, path: string, init: RequestInit = {}) {
  return SELF.fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Cookie: account.cookie,
      Origin: BASE,
      ...(init.headers || {}),
    },
  });
}

describe('business persistence', () => {
  it('onboards one persistent business menu and reopens it on later account visits', async () => {
    const owner = await signUp('business-owner');

    const onboardingPage = await authedFetch(owner, '/account?manage=1');
    expect(onboardingPage.status).toBe(200);
    expect(await onboardingPage.text()).toContain('Name your business to create your first menu.');

    const sessionId = await onboard(owner, 'Simply Green Test');
    const account = await getAccount(env, owner.accountId);
    expect(account).toMatchObject({
      businessId: owner.accountId,
      businessName: 'Simply Green Test',
      businessMenuSessionId: sessionId,
      sessions: [sessionId],
    });
    expect(account?.businessMembers).toEqual([
      expect.objectContaining({ accountId: owner.accountId, email: owner.email, role: 'owner' }),
    ]);

    const summaryResponse = await authedFetch(owner, '/api/business');
    expect(summaryResponse.status).toBe(200);
    const summary = (await summaryResponse.json()) as {
      business: Record<string, unknown> & { sessions: string[]; menuSessionId: string };
      role: string;
    };
    expect(summary.role).toBe('owner');
    expect(summary.business).toMatchObject({
      businessName: 'Simply Green Test',
      menuSessionId: sessionId,
      sessions: [sessionId],
    });
    expect(summary.business).not.toHaveProperty('passwordHash');
    expect(summary.business).not.toHaveProperty('stripeCustomerId');
    expect(JSON.stringify(summary)).not.toContain('tokenHash');

    const accountRedirect = await authedFetch(owner, '/account', { redirect: 'manual' });
    expect(accountRedirect.status).toBe(302);
    expect(accountRedirect.headers.get('location')).toBe(`${BASE}/config/${sessionId}`);

    const configResponse = await authedFetch(owner, `/config/${sessionId}`);
    expect(configResponse.status).toBe(200);
    expect(await configResponse.text()).toContain('DubMenu Remote Control');

    const sessionsResponse = await authedFetch(owner, '/api/sessions');
    await expect(sessionsResponse.json()).resolves.toMatchObject({
      sessions: [sessionId],
      business: { name: 'Simply Green Test', menuSessionId: sessionId },
      role: 'owner',
    });
  });

  it('accepts an explicit invitation once and grants an unsubscribed manager the shared menu', async () => {
    const owner = await signUp('invite-owner');
    const sessionId = await onboard(owner, 'Shared Green');
    const manager = await signUp('invite-manager');
    await updateAccountStripe(env, manager.accountId, { subscriptionStatus: 'inactive' });

    const ownerAccount = await getAccount(env, owner.accountId);
    if (!ownerAccount) throw new Error('Owner account missing');
    const invitation = await createBusinessInvitation(env, ownerAccount, manager.email);
    if ('error' in invitation) throw new Error(invitation.error);

    const beforeGet = await getAccount(env, owner.accountId);
    expect(beforeGet && listPendingInvitations(beforeGet)).toHaveLength(1);

    const invitationPath = `/invite/${encodeURIComponent(invitation.token)}`;
    const confirmation = await authedFetch(manager, invitationPath);
    expect(confirmation.status).toBe(200);
    const confirmationHtml = await confirmation.text();
    expect(confirmationHtml).toContain('Accept Invitation');
    expect(confirmationHtml).toContain('Shared Green');
    const afterGet = await getAccount(env, owner.accountId);
    expect(afterGet && listPendingInvitations(afterGet)).toHaveLength(1);

    const accepted = await authedFetch(manager, invitationPath, { method: 'POST', redirect: 'manual' });
    expect(accepted.status).toBe(302);
    expect(accepted.headers.get('location')).toBe(`${BASE}/config/${sessionId}`);

    const linkedManager = await getAccount(env, manager.accountId);
    expect(linkedManager).toMatchObject({
      businessId: owner.accountId,
      businessName: 'Shared Green',
      businessMenuSessionId: sessionId,
      subscriptionStatus: 'inactive',
    });
    const updatedOwner = await getAccount(env, owner.accountId);
    expect(updatedOwner?.businessMembers).toContainEqual(
      expect.objectContaining({ accountId: manager.accountId, email: manager.email, role: 'manager' })
    );
    expect(updatedOwner && listPendingInvitations(updatedOwner)).toHaveLength(0);

    const sharedConfig = await authedFetch(manager, `/config/${sessionId}`);
    expect(sharedConfig.status).toBe(200);
    expect(await sharedConfig.text()).toContain('DubMenu Remote Control');

    const managerSummary = await authedFetch(manager, '/api/business');
    const managerBody = (await managerSummary.json()) as { role: string; business: { pendingInvites: unknown[] } };
    expect(managerBody.role).toBe('manager');
    expect(managerBody.business.pendingInvites).toEqual([]);
    expect((await authedFetch(manager, '/api/business/invites')).status).toBe(403);

    const replay = await authedFetch(manager, invitationPath, { method: 'POST' });
    expect(replay.status).toBe(200);
    expect(await replay.text()).toContain('Invitation invalid, expired, or email mismatch');

    const duplicateMember = await createBusinessInvitation(env, updatedOwner!, manager.email);
    expect(duplicateMember).toMatchObject({ status: 409 });
    const selfInvite = await createBusinessInvitation(env, updatedOwner!, owner.email);
    expect(selfInvite).toMatchObject({ status: 400 });
  });

  it('keeps an invitation pending when the signed-in email does not match', async () => {
    const owner = await signUp('mismatch-owner');
    await onboard(owner, 'Mismatch Green');
    const intendedManager = await signUp('intended-manager');
    const wrongManager = await signUp('wrong-manager');
    const ownerAccount = await getAccount(env, owner.accountId);
    if (!ownerAccount) throw new Error('Owner account missing');
    const invitation = await createBusinessInvitation(env, ownerAccount, intendedManager.email);
    if ('error' in invitation) throw new Error(invitation.error);

    const response = await authedFetch(wrongManager, `/invite/${encodeURIComponent(invitation.token)}`, {
      method: 'POST',
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Invitation invalid, expired, or email mismatch');
    expect((await getAccount(env, wrongManager.accountId))?.businessId).toBeUndefined();
    const refreshedOwner = await getAccount(env, owner.accountId);
    expect(refreshedOwner && listPendingInvitations(refreshedOwner)).toHaveLength(1);
  });

  it('protects legacy owners from invitations and migrates their direct exports', async () => {
    const owner = await signUp('legacy-invite-owner');
    await onboard(owner, 'Invitation Owner');
    const legacyOwner = await signUp('legacy-invitee-owner');
    const legacySessionId = `LEGACY-${crypto.randomUUID()}`;
    const legacyStub = env.ACCOUNTS.get(env.ACCOUNTS.idFromName(legacyOwner.accountId));
    const addSession = await legacyStub.fetch(
      new Request('https://internal/add-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: legacySessionId }),
      })
    );
    expect(addSession.status).toBe(200);

    const exportResponse = await authedFetch(legacyOwner, `/api/export/${legacySessionId}`);
    expect(exportResponse.status).toBe(200);
    const migratedLegacyOwner = await getAccount(env, legacyOwner.accountId);
    expect(migratedLegacyOwner).toMatchObject({
      businessId: legacyOwner.accountId,
      businessMenuSessionId: legacySessionId,
    });

    const ownerAccount = await getAccount(env, owner.accountId);
    if (!ownerAccount) throw new Error('Owner account missing');
    const invitation = await createBusinessInvitation(env, ownerAccount, legacyOwner.email);
    if ('error' in invitation) throw new Error(invitation.error);
    const response = await authedFetch(legacyOwner, `/invite/${encodeURIComponent(invitation.token)}`, {
      method: 'POST',
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Account already owns a business');
    expect((await getAccount(env, legacyOwner.accountId))?.businessId).toBe(legacyOwner.accountId);
    expect((await getAccount(env, owner.accountId))?.businessMembers).not.toContainEqual(
      expect.objectContaining({ accountId: legacyOwner.accountId })
    );
  });

  it('rejects owner-scoped access when a linked account is not an accepted manager', async () => {
    const owner = await signUp('authorization-owner');
    await onboard(owner, 'Authorization Green');
    const unacceptedManager = await signUp('unaccepted-manager');
    const managerStub = env.ACCOUNTS.get(env.ACCOUNTS.idFromName(unacceptedManager.accountId));
    const joinResponse = await managerStub.fetch(
      new Request('https://internal/business/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: owner.accountId }),
      })
    );
    expect(joinResponse.status).toBe(200);
    expect((await authedFetch(unacceptedManager, '/account?manage=1')).status).toBe(403);
    expect((await authedFetch(unacceptedManager, '/api/business')).status).toBe(401);
    expect((await authedFetch(unacceptedManager, '/api/business/members')).status).toBe(401);
    expect((await authedFetch(unacceptedManager, '/api/sessions')).status).toBe(401);
    expect((await authedFetch(unacceptedManager, '/api/uploads')).status).toBe(401);
  });

  it('blocks inactive onboarding without redirect loops and offers reactivation', async () => {
    const newAccount = await signUp('inactive-onboarding');
    await updateAccountStripe(env, newAccount.accountId, { subscriptionStatus: 'inactive', trialEndsAt: undefined });
    const form = new FormData();
    form.set('businessName', 'Blocked Green');
    const onboardingResponse = await authedFetch(newAccount, '/api/business/onboarding', {
      method: 'POST',
      body: form,
      redirect: 'manual',
    });
    expect(onboardingResponse.status).toBe(302);
    expect(onboardingResponse.headers.get('location')).toContain('/account?manage=1&error=');
    expect((await getAccount(env, newAccount.accountId))?.businessMenuSessionId).toBeUndefined();
    const onboardingPage = await authedFetch(newAccount, '/account?manage=1&error=subscription');
    expect(onboardingPage.status).toBe(200);
    expect(await onboardingPage.text()).toContain('Restart Subscription');

    const existingOwner = await signUp('inactive-owner');
    const sessionId = await onboard(existingOwner, 'Inactive Green');
    await updateAccountStripe(env, existingOwner.accountId, { subscriptionStatus: 'inactive', trialEndsAt: undefined });
    const configResponse = await authedFetch(existingOwner, `/config/${sessionId}`, { redirect: 'manual' });
    expect(configResponse.status).toBe(302);
    expect(configResponse.headers.get('location')).toBe(`${BASE}/account?manage=1&error=subscription`);
    const accountPage = await authedFetch(existingOwner, '/account?error=subscription');
    expect(accountPage.status).toBe(200);
    expect(await accountPage.text()).toContain('Reactivate the business subscription');
  });

  it('recovers onboarding when a business identity exists without a menu session', async () => {
    const account = await signUp('incomplete-onboarding');
    const accountStub = env.ACCOUNTS.get(env.ACCOUNTS.idFromName(account.accountId));
    const updateResponse = await accountStub.fetch(
      new Request('https://internal/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: account.accountId, businessName: 'Interrupted Green' }),
      })
    );
    expect(updateResponse.status).toBe(200);
    const page = await authedFetch(account, '/account?manage=1');
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('Name your business to create your first menu.');
    expect(html).toContain('Create Menu');
    expect(html).not.toContain('Open Menu Configuration');
  });

  it('migrates the populated Simply Green session without rebuilding or rescraping it', async () => {
    const legacyAccount: Account = {
      id: 'legacy-owner',
      email: 'legacy-owner@example.com',
      createdAt: 1,
      updatedAt: 1,
      subscriptionStatus: 'active',
      sessions: ['empty-session', 'simply-green-session'],
    };
    const sessionRequests: Array<{ sessionId: string; method: string; path: string }> = [];
    let migrationBody: Record<string, string | undefined> | undefined;
    const sessionConfigs: Record<string, unknown> = {
      'empty-session': {
        dispensaryName: 'DubMenu',
        categories: [],
      },
      'simply-green-session': {
        dispensaryName: 'Simply Green',
        categories: [{ products: [{ id: 'sku-1' }, { id: 'sku-2' }] }],
      },
    };
    const fakeEnv = {
      SESSION: {
        idFromName: (name: string) => name,
        get: (sessionId: string) => ({
          fetch: async (request: Request) => {
            const requestUrl = new URL(request.url);
            sessionRequests.push({ sessionId, method: request.method, path: requestUrl.pathname });
            return Response.json(sessionConfigs[sessionId]);
          },
        }),
      },
      ACCOUNTS: {
        idFromName: (name: string) => name,
        get: () => ({
          fetch: async (request: Request) => {
            const requestUrl = new URL(request.url);
            if (requestUrl.pathname === '/business/migrate') {
              migrationBody = (await request.json()) as Record<string, string | undefined>;
              legacyAccount.businessId = legacyAccount.id;
              legacyAccount.businessName = migrationBody.businessName;
              legacyAccount.businessMenuSessionId = migrationBody.businessMenuSessionId;
              legacyAccount.businessMembers = [
                { accountId: legacyAccount.id, email: legacyAccount.email, role: 'owner', joinedAt: legacyAccount.createdAt },
              ];
              return Response.json({ account: legacyAccount });
            }
            if (requestUrl.pathname === '/get') return Response.json({ account: legacyAccount });
            return new Response('Not found', { status: 404 });
          },
        }),
      },
    } as unknown as Env;

    const migrated = await ensureBusinessAccount(fakeEnv, legacyAccount);
    expect(migrated).toMatchObject({
      businessId: legacyAccount.id,
      businessName: 'Simply Green',
      businessMenuSessionId: 'simply-green-session',
    });
    expect(migrationBody).toEqual({
      businessName: 'Simply Green',
      businessMenuSessionId: 'simply-green-session',
    });
    expect(sessionRequests).toEqual([
      { sessionId: 'empty-session', method: 'GET', path: '/tv-config' },
      { sessionId: 'simply-green-session', method: 'GET', path: '/tv-config' },
    ]);
  });

  it('sends an encoded, addressable invitation URL through Resend', async () => {
    const owner = await signUp('email-owner');
    await onboard(owner, 'Email Green');
    const ownerAccount = await getAccount(env, owner.accountId);
    if (!ownerAccount) throw new Error('Owner account missing');
    const token = `invite:${owner.accountId}:${crypto.randomUUID()}`;
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    try {
      await expect(
        sendBusinessInviteEmail(
          { ...env, RESEND_API_KEY: 'test-resend-key' },
          token,
          ownerAccount,
          'manager@example.com',
          BASE
        )
      ).resolves.toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    const body = JSON.parse(String(init.body)) as { to: string[]; text: string; subject: string };
    expect(body.to).toEqual(['manager@example.com']);
    expect(body.subject).toContain('Email Green');
    expect(body.text).toContain(`${BASE}/invite/${encodeURIComponent(token)}`);
  });

  it('reports invitation delivery exceptions as a failed send', async () => {
    const owner = await signUp('email-error-owner');
    await onboard(owner, 'Email Error Green');
    const ownerAccount = await getAccount(env, owner.accountId);
    if (!ownerAccount) throw new Error('Owner account missing');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network unavailable');
    }) as typeof fetch;
    try {
      await expect(
        sendBusinessInviteEmail(
          { ...env, RESEND_API_KEY: 'test-resend-key' },
          `invite:${owner.accountId}:${crypto.randomUUID()}`,
          ownerAccount,
          'manager@example.com',
          BASE
        )
      ).resolves.toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
