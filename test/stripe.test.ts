import { describe, it, expect } from 'vitest';
import { safeEqual, isDuplicateEvent, recordEvent } from '../src/stripe';

describe('safeEqual', () => {
  it('returns true for identical strings', () => {
    expect(safeEqual('abc123', 'abc123')).toBe(true);
  });

  it('returns false for different strings of equal length', () => {
    expect(safeEqual('abc123', 'abc124')).toBe(false);
  });

  it('returns false for strings of different lengths', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(safeEqual('', '')).toBe(true);
    expect(safeEqual('', 'a')).toBe(false);
  });

  it('handles hex signatures', () => {
    const sig = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
    expect(safeEqual(sig, sig)).toBe(true);
    expect(safeEqual(sig, sig.slice(0, -1) + '0')).toBe(false);
  });
});

describe('isDuplicateEvent / recordEvent', () => {
  it('returns false for an unseen event id', () => {
    expect(isDuplicateEvent('evt_never_seen_xyz')).toBe(false);
  });

  it('returns true after an event id is recorded', () => {
    recordEvent('evt_dup_test_1');
    expect(isDuplicateEvent('evt_dup_test_1')).toBe(true);
  });

  it('recordEvent is idempotent for the same id', () => {
    recordEvent('evt_dup_test_2');
    recordEvent('evt_dup_test_2');
    expect(isDuplicateEvent('evt_dup_test_2')).toBe(true);
  });

  it('returns false for an unrelated id after recording another', () => {
    recordEvent('evt_dup_test_3');
    expect(isDuplicateEvent('evt_dup_test_4')).toBe(false);
  });
});
