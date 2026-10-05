import { describe, expect, it } from 'vitest';
import { getAuthRouteDecision } from './auth-route-policy';
import { isEventGateExemptPath } from './event-access-policy';

describe('native safe logistics route', () => {
  it('allows exactly the preview to an anonymous reader', () => {
    expect(
      getAuthRouteDecision({
        isLoading: false,
        isAuthenticated: false,
        needsOnboarding: null,
        rootSegment: 'event',
        pathname: '/event/event-123/preview',
      })
    ).toEqual({ kind: 'allow' });
    for (const pathname of [
      '/event/event-123',
      '/event/event-123/attendees',
      '/event/event-123/preview/post',
      '/event/event-123/post/post-1',
      '/event/event-123/settings/admission',
    ]) {
      expect(
        getAuthRouteDecision({
          isLoading: false,
          isAuthenticated: false,
          needsOnboarding: null,
          rootSegment: 'event',
          pathname,
        })
      ).toEqual({ kind: 'sign-in', returnTo: pathname });
    }
  });
  it('exempts preview from member completion without exempting any private event route', () => {
    expect(isEventGateExemptPath('/event/event-123/preview', 'event-123')).toBe(
      true
    );
    expect(
      isEventGateExemptPath('/event/event-123/preview/post', 'event-123')
    ).toBe(false);
    expect(
      isEventGateExemptPath('/event/event-123/attendees', 'event-123')
    ).toBe(false);
    expect(isEventGateExemptPath('/event/event-123', 'event-123')).toBe(false);
  });
});
