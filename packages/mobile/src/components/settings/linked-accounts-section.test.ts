import { describe, expect, it } from 'vitest';

import { getProviderIcon } from './linked-account-providers';

describe('linked account provider icons', () => {
  it('uses branded icons for supported social providers', () => {
    expect(getProviderIcon('discord')).toBe('logo-discord');
    expect(getProviderIcon('google')).toBe('logo-google');
  });
});
