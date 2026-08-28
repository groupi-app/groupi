import { describe, expect, it } from 'vitest';

import { createMemberDrawerTarget } from './member-avatar-target';

describe('createMemberDrawerTarget', () => {
  it('preserves the member identity shown by an avatar', () => {
    expect(
      createMemberDrawerTarget({
        personId: 'person-123' as never,
        name: 'Avery Morgan',
        image: 'https://example.com/avery.jpg',
      })
    ).toEqual({
      personId: 'person-123',
      name: 'Avery Morgan',
      image: 'https://example.com/avery.jpg',
      eventMembership: undefined,
    });
  });

  it('preserves event context used for RSVP and management actions', () => {
    const eventMembership = {
      membershipId: 'membership-123' as never,
      role: 'ATTENDEE' as const,
      rsvpStatus: 'YES' as const,
      viewerRole: 'ORGANIZER' as const,
      canManage: true,
    };

    expect(
      createMemberDrawerTarget({
        personId: 'person-123' as never,
        eventMembership,
      }).eventMembership
    ).toBe(eventMembership);
  });
});
