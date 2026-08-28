import { describe, expect, it } from 'vitest';

import {
  getPublicEventAddonUrl,
  getPublicBaseUrl,
  getPublicGdlUrl,
  getPublicInviteUrl,
  PUBLIC_APP_LINK_HOST,
} from './public-urls';

describe('public URLs', () => {
  it('uses the canonical Groupi host by default', () => {
    expect(getPublicBaseUrl()).toBe('https://www.groupi.gg');
    expect(getPublicInviteUrl('invite-token')).toBe(
      'https://www.groupi.gg/invite/invite-token'
    );
    expect(getPublicGdlUrl()).toBe('https://www.groupi.gg/gdl');
    expect(getPublicEventAddonUrl('event 1', 'custom:meal poll')).toBe(
      'https://www.groupi.gg/event/event%201/addon/custom%3Ameal%20poll'
    );
    expect(PUBLIC_APP_LINK_HOST).toBe('www.groupi.gg');
  });

  it('normalizes a configured web origin', () => {
    expect(getPublicBaseUrl('https://staging.groupi.gg/some/path')).toBe(
      'https://staging.groupi.gg'
    );
    expect(getPublicBaseUrl('https://groupi.gg/invite/old')).toBe(
      'https://www.groupi.gg'
    );
  });

  it.each([
    'javascript:alert(1)',
    'file:///tmp/groupi',
    'https://user:password@example.com',
    'not a URL',
  ])('falls back for invalid base URL %s', value => {
    expect(getPublicBaseUrl(value)).toBe('https://www.groupi.gg');
  });
});
