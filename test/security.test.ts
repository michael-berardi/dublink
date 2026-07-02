import { describe, it, expect } from 'vitest';
import { isSubscriptionActive, generateSessionId } from '../src/auth';
import type { Account } from '../src/auth';

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'test-id',
    email: 'test@example.com',
    passwordHash: 'hash',
    passwordSalt: 'salt',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    subscriptionStatus: 'inactive',
    sessions: [],
    ...overrides,
  };
}

describe('isSubscriptionActive', () => {
  it('returns true for active subscription', () => {
    const account = makeAccount({ subscriptionStatus: 'active' });
    expect(isSubscriptionActive(account)).toBe(true);
  });

  it('returns true for trialing within trial window', () => {
    const account = makeAccount({
      subscriptionStatus: 'trialing',
      trialEndsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    expect(isSubscriptionActive(account)).toBe(true);
  });

  it('returns false for trialing when trial window has passed', () => {
    const account = makeAccount({
      subscriptionStatus: 'trialing',
      trialEndsAt: Date.now() - 1000,
    });
    expect(isSubscriptionActive(account)).toBe(false);
  });

  it('returns false for trialing with no trialEndsAt', () => {
    const account = makeAccount({ subscriptionStatus: 'trialing' });
    expect(isSubscriptionActive(account)).toBe(false);
  });

  it('returns false for inactive', () => {
    const account = makeAccount({ subscriptionStatus: 'inactive' });
    expect(isSubscriptionActive(account)).toBe(false);
  });

  it('returns false for past_due', () => {
    const account = makeAccount({ subscriptionStatus: 'past_due' });
    expect(isSubscriptionActive(account)).toBe(false);
  });

  it('returns false for canceled', () => {
    const account = makeAccount({ subscriptionStatus: 'canceled' });
    expect(isSubscriptionActive(account)).toBe(false);
  });

  it('returns false for unpaid', () => {
    const account = makeAccount({ subscriptionStatus: 'unpaid' });
    expect(isSubscriptionActive(account)).toBe(false);
  });

  it('returns a synchronous boolean (not a Promise)', () => {
    const account = makeAccount({ subscriptionStatus: 'active' });
    const result = isSubscriptionActive(account);
    expect(result).toBe(true);
    // Confirm it's a plain boolean, not a Promise
    expect(typeof result).toBe('boolean');
    expect(result).not.toBeInstanceOf(Promise);
  });
});

describe('generateSessionId', () => {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  it('generates a string of at least 16 characters', () => {
    const id = generateSessionId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThanOrEqual(16);
  });

  it('uses only the unambiguous 32-symbol alphabet', () => {
    const id = generateSessionId();
    for (const ch of id) {
      expect(ALPHABET).toContain(ch);
    }
  });

  it('excludes ambiguous characters (0, O, 1, I)', () => {
    const ambiguous = ['0', 'O', '1', 'I'];
    for (let i = 0; i < 50; i++) {
      const id = generateSessionId();
      for (const ch of ambiguous) {
        expect(id).not.toContain(ch);
      }
    }
  });

  it('generates unique IDs across many calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateSessionId());
    }
    expect(ids.size).toBe(1000);
  });
});
