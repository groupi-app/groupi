import { describe, expect, it } from 'vitest';
import {
  getAuthRouteDecision,
  getSafeAuthReturnPath,
} from './auth-route-policy';
import { normalizeNativeIntentPath } from './native-linking';
import { getPublicGroupUrl } from './public-urls';

describe('Group navigation and sign-in handoff', () => {
  it('opens a stable shared landing link without requiring sign-in', () => {
    expect(normalizeNativeIntentPath('https://www.groupi.gg/g/group-123')).toBe(
      '/g/group-123'
    );
    expect(
      getAuthRouteDecision({
        isLoading: false,
        isAuthenticated: false,
        needsOnboarding: null,
        rootSegment: 'g',
        pathname: '/g/group-123',
      })
    ).toEqual({ kind: 'allow' });
    expect(getPublicGroupUrl('group-123')).toBe(
      'https://www.groupi.gg/g/group-123'
    );
  });
  it('preserves Group detail and landing destinations through sign-in', () => {
    expect(getSafeAuthReturnPath('/groups/group-123')).toBe(
      '/groups/group-123'
    );
    expect(getSafeAuthReturnPath('/groups/group-123/members')).toBe(
      '/groups/group-123/members'
    );
    expect(getSafeAuthReturnPath('/groups/group-123/invitations')).toBe(
      '/groups/group-123/invitations'
    );
    expect(
      getAuthRouteDecision({
        isLoading: false,
        isAuthenticated: true,
        needsOnboarding: false,
        rootSegment: '(auth)',
        pathname: '/sign-in',
        returnTo: '/g/group-123',
      })
    ).toEqual({ kind: 'return-to', destination: '/g/group-123' });
    expect(getSafeAuthReturnPath('/groups/group-123/bans')).toBe(
      '/groups/group-123/bans'
    );
    expect(getSafeAuthReturnPath('/groups/group-123/bans/extra')).toBeNull();
    for (const suffix of ['', '/settings', '/answers', '/history'])
      expect(
        getSafeAuthReturnPath(`/groups/group-123/questionnaire${suffix}`)
      ).toBe(`/groups/group-123/questionnaire${suffix}`);
    expect(
      getSafeAuthReturnPath('/groups/group-123/questionnaire/unknown')
    ).toBeNull();
    expect(getSafeAuthReturnPath('//evil.example/g/group-123')).toBeNull();
  });
});
