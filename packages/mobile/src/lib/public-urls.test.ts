import { describe, expect, it } from 'vitest';

import { getPublicBaseUrl, getPublicInviteUrl } from './public-urls';

describe('public URLs', () => {
  it('uses the canonical Groupi host by default', () => {
    expect(getPublicBaseUrl()).toBe('https://groupi.gg');
    expect(getPublicInviteUrl('invite-token')).toBe(
      'https://groupi.gg/invite/invite-token'
    );
  });

  it('normalizes a configured web origin', () => {
    expect(getPublicBaseUrl('https://staging.groupi.gg/some/path')).toBe(
      'https://staging.groupi.gg'
    );
  });

  it.each([
    'javascript:alert(1)',
    'file:///tmp/groupi',
    'https://user:password@example.com',
    'not a URL',
  ])('falls back for invalid base URL %s', value => {
    expect(getPublicBaseUrl(value)).toBe('https://groupi.gg');
  });
});
