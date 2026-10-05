import { afterEach, describe, expect, it, vi } from 'vitest';

import { normalizeNativeIntentPath } from './native-linking';

describe('normalizeNativeIntentPath', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['https://www.groupi.gg/invite/invite-token', '/invite/invite-token'],
    ['https://groupi.gg/event/event-123', '/event/event-123'],
    [
      'https://www.groupi.gg/event/event-123/post/post-456?source=email',
      '/event/event-123/post/post-456',
    ],
    ['https://groupi.gg/event/event-123/apply', '/event/event-123/application'],
    [
      'https://groupi.gg/event/event-123/settings/applications',
      '/event/event-123/applications',
    ],
    [
      'https://groupi.gg/g/group-123#group-applications',
      '/groups/group-123/apply',
    ],
    [
      'https://groupi.gg/groups/group-123#group-applications',
      '/groups/group-123/applications',
    ],
    [
      'https://groupi.gg/groups/group-123/polls/new',
      '/groups/group-123/polls/create',
    ],
    [
      'https://groupi.gg/groups/group-123/polls/poll-123/settings',
      '/groups/group-123/polls/poll-123/manage',
    ],
    ['groupi:///settings/privacy', '/settings/privacy'],
    ['groupi://invite/invite-token', '/invite/invite-token'],
  ])('routes supported Groupi link %s', (path, expected) => {
    expect(normalizeNativeIntentPath(path)).toBe(expected);
  });

  it('maps web-only legacy paths to their native equivalents', () => {
    expect(
      normalizeNativeIntentPath('https://www.groupi.gg/user/person-123')
    ).toBe('/profile/person-123');
    expect(normalizeNativeIntentPath('https://www.groupi.gg/events')).toBe('/');
  });

  it('preserves the native Better Auth callback for validated completion', () => {
    expect(
      normalizeNativeIntentPath(
        'groupi:///callback?cookie=session%3Dsecret&returnTo=%2Finvite%2Ftoken'
      )
    ).toBe('/callback?cookie=session%3Dsecret&returnTo=%2Finvite%2Ftoken');
  });

  it('allows the fixture login link only in an isolated E2E build', () => {
    vi.stubEnv('EXPO_PUBLIC_E2E_TESTING', 'true');

    expect(normalizeNativeIntentPath('groupi://e2e?code=one-time-code')).toBe(
      '/e2e?code=one-time-code'
    );
  });

  it('rejects the fixture login link in ordinary builds', () => {
    expect(normalizeNativeIntentPath('groupi://e2e?code=one-time-code')).toBe(
      '/'
    );
  });

  it.each([
    'https://evil.test/invite/token',
    'http://www.groupi.gg/invite/token',
    'https://user:password@www.groupi.gg/event/event-123',
    'https://www.groupi.gg/docs/api',
    'groupi://evil.test/event/event-123',
    'not a url',
  ])('fails closed for unsupported intent %s', path => {
    expect(normalizeNativeIntentPath(path)).toBe('/');
  });
});
