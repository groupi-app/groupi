import { describe, expect, it } from 'vitest';

import {
  canCreatePosts,
  canInviteMembers,
  canViewAttendeeList,
  hasPermission,
  type EventPermissions,
} from './event-permissions';

const permissions: EventPermissions = {
  createPosts: 'EVERYONE',
  inviteMembers: 'MODERATOR',
  viewAttendeeList: 'ORGANIZER',
};

describe('event permissions', () => {
  it('applies the event role hierarchy consistently', () => {
    expect(hasPermission('ATTENDEE', 'EVERYONE')).toBe(true);
    expect(hasPermission('ATTENDEE', 'MODERATOR')).toBe(false);
    expect(hasPermission('MODERATOR', 'MODERATOR')).toBe(true);
    expect(hasPermission('MODERATOR', 'ORGANIZER')).toBe(false);
    expect(hasPermission('ORGANIZER', 'ORGANIZER')).toBe(true);
    expect(hasPermission(undefined, 'EVERYONE')).toBe(false);
  });

  it('checks each configurable event action', () => {
    expect(canCreatePosts('ATTENDEE', permissions)).toBe(true);
    expect(canInviteMembers('ATTENDEE', permissions)).toBe(false);
    expect(canInviteMembers('MODERATOR', permissions)).toBe(true);
    expect(canViewAttendeeList('MODERATOR', permissions)).toBe(false);
    expect(canViewAttendeeList('ORGANIZER', permissions)).toBe(true);
  });

  it('denies actions while permission data is unavailable', () => {
    expect(canCreatePosts('ORGANIZER', undefined)).toBe(false);
    expect(canInviteMembers(undefined, permissions)).toBe(false);
  });
});
