import { describe, expect, it } from 'vitest';
import type { Id } from 'convex/_generated/dataModel';
import {
  getNotificationDestination,
  getNotificationMessage,
  type NotificationPresentationInput,
} from './notification-presentation';
import { getPushNotificationDestination } from './push-notifications';

describe('native Group invitation notifications', () => {
  const invite: NotificationPresentationInput = {
    type: 'GROUP_INVITE_RECEIVED',
    groupId: 'group-123' as Id<'groups'>,
    group: { id: 'group-123' as Id<'groups'>, title: 'Book club' },
    groupInvite: { id: 'invite-123' as Id<'groupInvites'>, status: 'PENDING' },
  };
  it('describes a Group invitation and opens its identity landing', () => {
    expect(getNotificationMessage(invite)).toBe(
      'Someone invited you to Book club'
    );
    expect(getNotificationDestination(invite)).toBe('/g/group-123');
    expect(
      getPushNotificationDestination({
        destination: 'group',
        groupId: 'group-123',
      })
    ).toBe('/g/group-123');
  });
  it('reflects resolved invitations and refuses unsafe push destinations', () => {
    expect(
      getNotificationMessage({
        ...invite,
        groupInvite: {
          id: 'invite-123' as Id<'groupInvites'>,
          status: 'CANCELLED',
        },
      })
    ).toBe('Group invitation to Book club: cancelled');
    expect(
      getNotificationMessage({ ...invite, type: 'GROUP_INVITE_ACCEPTED' })
    ).toBe('Someone accepted your invitation to Book club');
    expect(
      getPushNotificationDestination({
        destination: 'group',
        groupId: '../event/secret',
      })
    ).toBeNull();
  });
});
