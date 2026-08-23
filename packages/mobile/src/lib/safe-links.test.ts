import { describe, expect, it } from 'vitest';

import { getSafeExternalUrl } from './safe-links';

describe('getSafeExternalUrl', () => {
  it.each([
    ['https://groupi.gg/docs', 'https://groupi.gg/docs'],
    ['http://localhost:3000/path', 'http://localhost:3000/path'],
    ['  https://example.com/a?b=1  ', 'https://example.com/a?b=1'],
  ])('allows absolute web URL %s', (value, expected) => {
    expect(getSafeExternalUrl(value)).toBe(expected);
  });

  it.each([
    undefined,
    '',
    '   ',
    '/relative/path',
    'javascript:alert(1)',
    'data:text/plain,hello',
    'file:///private/data',
    'groupi://settings',
  ])('rejects unsafe or malformed URL %s', value => {
    expect(getSafeExternalUrl(value)).toBeNull();
  });
});
