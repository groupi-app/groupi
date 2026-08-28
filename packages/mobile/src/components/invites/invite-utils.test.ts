import { describe, expect, it, vi } from 'vitest';

import {
  describeInviteExpiry,
  getInviteExpiryTimestamp,
  parseEmailRecipients,
  validateMaxUses,
} from './invite-utils';

describe('invite utilities', () => {
  it('converts an expiry choice to an absolute timestamp', () => {
    expect(getInviteExpiryTimestamp('1h', 1_000)).toBe(3_601_000);
    expect(getInviteExpiryTimestamp('never', 1_000)).toBeUndefined();
  });

  it('validates optional usage limits', () => {
    expect(validateMaxUses('')).toEqual({ value: undefined, error: null });
    expect(validateMaxUses('25')).toEqual({ value: 25, error: null });
    expect(validateMaxUses('1.5').error).toBeTruthy();
    expect(validateMaxUses('1000000').error).toBeTruthy();
  });

  it('parses, normalizes, and deduplicates pasted email recipients', () => {
    expect(
      parseEmailRecipients(
        'ALICE@example.com, bob@example.com\nalice@example.com'
      )
    ).toEqual({
      valid: ['alice@example.com', 'bob@example.com'],
      invalid: [],
    });
  });

  it('returns invalid recipient entries separately', () => {
    expect(parseEmailRecipients('valid@example.com; missing-at')).toEqual({
      valid: ['valid@example.com'],
      invalid: ['missing-at'],
    });
  });

  it('describes expired and future links', () => {
    vi.spyOn(Date, 'now').mockReturnValue(10_000);
    expect(describeInviteExpiry()).toBe('Never expires');
    expect(describeInviteExpiry(9_999)).toBe('Expired');
    expect(describeInviteExpiry(20_000)).toMatch(/^Expires /);
  });
});
