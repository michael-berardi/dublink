import { describe, expect, it, vi } from 'vitest';
import worker from '../src/index';
import { signToken } from '../src/auth';

describe('synchronous import ownership recording', () => {
  it('does not add a session to the account when Session DO import persistence fails', async () => {
    const authSecret = 'auth-secret-for-import-failure-test';
    const account = {
      id: 'account-1',
      email: 'owner@example.com',
      businessId: 'account-1',
      businessName: 'Import Failure Green',
      businessMembers: [
        { accountId: 'account-1', email: 'owner@example.com', role: 'owner' as const, joinedAt: Date.now() },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      subscriptionStatus: 'active',
      sessions: [],
    };
    const accountFetch = vi.fn(async (request: Request) => {
      if (new URL(request.url).pathname === '/get') return new Response(JSON.stringify({ account }), { status: 200 });
      if (new URL(request.url).pathname === '/add-session') return new Response(JSON.stringify({ account: { ...account, sessions: ['SESSION123'] } }), { status: 200 });
      return new Response('Not found', { status: 404 });
    });
    const sessionFetch = vi.fn(async (request: Request) => {
      const path = new URL(request.url).pathname;
      if (path === '/owner') return new Response(JSON.stringify({ ownerAccountId: account.id }), { status: 200 });
      if (path === '/import') return new Response(JSON.stringify({ ok: false, error: 'Import failed' }), { status: 500 });
      return new Response('Not found', { status: 404 });
    });
    const accounts = { idFromName: () => ({}), get: () => ({ fetch: accountFetch }) } as unknown as DurableObjectNamespace;
    const sessions = { idFromName: () => ({}), get: () => ({ fetch: sessionFetch }) } as unknown as DurableObjectNamespace;
    const env = { AUTH_SECRET: authSecret, ACCOUNTS: accounts, SESSION: sessions, APP_URL: 'https://dubmenu.com' } as unknown as Env;
    const token = await signToken({ accountId: account.id, email: account.email }, authSecret);
    const response = await worker.fetch(new Request('https://dubmenu.com/api/import/csv/SESSION123', {
      method: 'POST',
      headers: { Cookie: `dubmenu_auth=${token}`, 'Content-Type': 'text/csv' },
      body: 'name,price,category\nOG Kush,20,Flower',
    }), env, {} as ExecutionContext);

    expect(response.status).toBe(500);
    expect(accountFetch.mock.calls.some(([request]) => new URL((request as Request).url).pathname === '/add-session')).toBe(false);
  });
});
