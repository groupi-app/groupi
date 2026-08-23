import { describe, expect, it } from 'vitest';

import {
  getAuthRouteDecision,
  getSafeAuthReturnPath,
} from './auth-route-policy';

describe('getSafeAuthReturnPath', () => {
  it.each([
    '/invite/invite-token',
    '/event/event-123/post/post-456',
    '/settings/privacy',
    '/profile/person-123',
    '/notifications',
    '/',
  ])('allows internal app destination %s', destination => {
    expect(getSafeAuthReturnPath(destination)).toBe(destination);
  });

  it.each([
    'https://evil.test',
    '//evil.test/path',
    '/invite/token?redirect=https://evil.test',
    '/(auth)/sign-in',
    '/onboarding',
    '/unknown',
    '/event\\evil',
  ])('rejects unsafe destination %s', destination => {
    expect(getSafeAuthReturnPath(destination)).toBeNull();
  });
});

describe('getAuthRouteDecision', () => {
  const authenticated = {
    isLoading: false,
    isAuthenticated: true,
    needsOnboarding: false,
    pathname: '/event/event-123',
  };

  it('holds navigation while authentication is loading', () => {
    expect(
      getAuthRouteDecision({
        ...authenticated,
        isLoading: true,
        rootSegment: 'event',
      })
    ).toEqual({ kind: 'loading' });
  });

  it('allows signed-out auth and public invite routes', () => {
    for (const rootSegment of ['(auth)', 'invite']) {
      expect(
        getAuthRouteDecision({
          ...authenticated,
          isAuthenticated: false,
          needsOnboarding: undefined,
          rootSegment,
        })
      ).toEqual({ kind: 'allow' });
    }
  });

  it('redirects a signed-out protected deep link and retains its destination', () => {
    expect(
      getAuthRouteDecision({
        ...authenticated,
        isAuthenticated: false,
        needsOnboarding: undefined,
        rootSegment: 'event',
      })
    ).toEqual({ kind: 'sign-in', returnTo: '/event/event-123' });
  });

  it('preserves a safe auth destination through onboarding', () => {
    expect(
      getAuthRouteDecision({
        ...authenticated,
        needsOnboarding: true,
        rootSegment: '(auth)',
        pathname: '/sign-in',
        returnTo: '/invite/invite-token',
      })
    ).toEqual({ kind: 'onboarding', returnTo: '/invite/invite-token' });
  });

  it('moves fully onboarded users away from auth routes', () => {
    expect(
      getAuthRouteDecision({
        ...authenticated,
        rootSegment: '(auth)',
        pathname: '/sign-in',
      })
    ).toEqual({ kind: 'home' });
  });

  it('returns fully onboarded users to their retained safe destination', () => {
    expect(
      getAuthRouteDecision({
        ...authenticated,
        rootSegment: '(auth)',
        pathname: '/sign-in',
        returnTo: '/invite/invite-token',
      })
    ).toEqual({
      kind: 'return-to',
      destination: '/invite/invite-token',
    });
  });
});
