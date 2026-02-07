import { expect, test, describe } from 'vitest';
import { api } from './_generated/api';
import {
  createTestInstance,
  createTestUser,
  createAuthenticatedUser,
  createTestEventWithUser,
} from './test_helpers';

describe('Event Invites', () => {
  describe('sendEventInvite', () => {
    test('should send an event invite', async () => {
      const t = createTestInstance();

      const { userId: organizerId, eventId } = await createTestEventWithUser(
        t,
        {
          username: 'organizer',
        }
      );
      const { personId: inviteePersonId } = await createTestUser(t, {
        email: 'invitee@example.com',
        username: 'invitee',
      });

      const organizerAuth = createAuthenticatedUser(t, organizerId);

      const result = await organizerAuth.mutation(
        api.eventInvites.mutations.sendEventInvite,
        {
          eventId,
          inviteePersonId,
          role: 'ATTENDEE',
          message: 'Join my event!',
        }
      );

      expect(result.inviteId).toBeDefined();
      expect(result.status).toBe('PENDING');

      // Verify invite exists in database
      const { invite } = await t.run(async ctx => {
        const invite = await ctx.db.get(result.inviteId);
        return { invite };
      });

      expect(invite).toBeTruthy();
      expect(invite!.inviteeId).toBe(inviteePersonId);
      expect(invite!.role).toBe('ATTENDEE');
      expect(invite!.message).toBe('Join my event!');
    });

    test('should create notification for invitee', async () => {
      const t = createTestInstance();

      const { userId: organizerId, eventId } = await createTestEventWithUser(
        t,
        {
          username: 'organizer',
        }
      );
      const { personId: inviteePersonId } = await createTestUser(t, {
        email: 'invitee@example.com',
        username: 'invitee',
      });

      const organizerAuth = createAuthenticatedUser(t, organizerId);

      await organizerAuth.mutation(api.eventInvites.mutations.sendEventInvite, {
        eventId,
        inviteePersonId,
        role: 'ATTENDEE',
      });

      const { notifications } = await t.run(async ctx => {
        const notifications = await ctx.db.query('notifications').collect();
        return { notifications };
      });

      const inviteNotification = notifications.find(
        n =>
          n.type === 'EVENT_INVITE_RECEIVED' && n.personId === inviteePersonId
      );
      expect(inviteNotification).toBeTruthy();
    });

    test('should not allow inviting yourself', async () => {
      const t = createTestInstance();

      const {
        userId: organizerId,
        personId: organizerPersonId,
        eventId,
      } = await createTestEventWithUser(t, { username: 'organizer' });

      const organizerAuth = createAuthenticatedUser(t, organizerId);

      await expect(
        organizerAuth.mutation(api.eventInvites.mutations.sendEventInvite, {
          eventId,
          inviteePersonId: organizerPersonId,
          role: 'ATTENDEE',
        })
      ).rejects.toThrow('invite yourself');
    });

    test('should not allow non-member to send invite', async () => {
      const t = createTestInstance();

      const { eventId } = await createTestEventWithUser(t, {
        username: 'organizer',
      });
      const { userId: outsiderId } = await createTestUser(t, {
        email: 'outsider@example.com',
        username: 'outsider',
      });
      const { personId: inviteePersonId } = await createTestUser(t, {
        email: 'invitee@example.com',
        username: 'invitee',
      });

      const outsiderAuth = createAuthenticatedUser(t, outsiderId);

      await expect(
        outsiderAuth.mutation(api.eventInvites.mutations.sendEventInvite, {
          eventId,
          inviteePersonId,
          role: 'ATTENDEE',
        })
      ).rejects.toThrow('must be a member');
    });

    test('should not allow duplicate pending invites', async () => {
      const t = createTestInstance();

      const { userId: organizerId, eventId } = await createTestEventWithUser(
        t,
        {
          username: 'organizer',
        }
      );
      const { personId: inviteePersonId } = await createTestUser(t, {
        email: 'invitee@example.com',
        username: 'invitee',
      });

      const organizerAuth = createAuthenticatedUser(t, organizerId);

      await organizerAuth.mutation(api.eventInvites.mutations.sendEventInvite, {
        eventId,
        inviteePersonId,
        role: 'ATTENDEE',
      });

      await expect(
        organizerAuth.mutation(api.eventInvites.mutations.sendEventInvite, {
          eventId,
          inviteePersonId,
          role: 'ATTENDEE',
        })
      ).rejects.toThrow('already been sent');
    });

    test('should not allow inviting existing member', async () => {
      const t = createTestInstance();

      const { userId: organizerId, eventId } = await createTestEventWithUser(
        t,
        {
          username: 'organizer',
        }
      );
      const { personId: attendeePersonId } = await createTestUser(t, {
        email: 'attendee@example.com',
        username: 'attendee',
      });

      // Add attendee as member
      await t.run(async ctx => {
        await ctx.db.insert('memberships', {
          personId: attendeePersonId,
          eventId,
          role: 'ATTENDEE',
          rsvpStatus: 'YES',
        });
      });

      const organizerAuth = createAuthenticatedUser(t, organizerId);

      await expect(
        organizerAuth.mutation(api.eventInvites.mutations.sendEventInvite, {
          eventId,
          inviteePersonId: attendeePersonId,
          role: 'ATTENDEE',
        })
      ).rejects.toThrow('already a member');
    });
  });

  describe('acceptEventInvite', () => {
    test('should accept an invite and create membership', async () => {
      const t = createTestInstance();

      const { userId: organizerId, eventId } = await createTestEventWithUser(
        t,
        {
          username: 'organizer',
        }
      );
      const { userId: inviteeId, personId: inviteePersonId } =
        await createTestUser(t, {
          email: 'invitee@example.com',
          username: 'invitee',
        });

      const organizerAuth = createAuthenticatedUser(t, organizerId);
      const inviteeAuth = createAuthenticatedUser(t, inviteeId);

      const sendResult = await organizerAuth.mutation(
        api.eventInvites.mutations.sendEventInvite,
        {
          eventId,
          inviteePersonId,
          role: 'ATTENDEE',
        }
      );

      const result = await inviteeAuth.mutation(
        api.eventInvites.mutations.acceptEventInvite,
        { inviteId: sendResult.inviteId }
      );

      expect(result.success).toBe(true);
      expect(result.membershipId).toBeDefined();

      // Verify membership was created
      const { membership } = await t.run(async ctx => {
        const membership = await ctx.db
          .query('memberships')
          .withIndex('by_person_event', q =>
            q.eq('personId', inviteePersonId).eq('eventId', eventId)
          )
          .first();
        return { membership };
      });

      expect(membership).toBeTruthy();
      expect(membership!.role).toBe('ATTENDEE');
    });

    test('should not allow non-invitee to accept', async () => {
      const t = createTestInstance();

      const { userId: organizerId, eventId } = await createTestEventWithUser(
        t,
        {
          username: 'organizer',
        }
      );
      const { personId: inviteePersonId } = await createTestUser(t, {
        email: 'invitee@example.com',
        username: 'invitee',
      });
      const { userId: thirdUserId } = await createTestUser(t, {
        email: 'third@example.com',
        username: 'thirduser',
      });

      const organizerAuth = createAuthenticatedUser(t, organizerId);
      const thirdUserAuth = createAuthenticatedUser(t, thirdUserId);

      const sendResult = await organizerAuth.mutation(
        api.eventInvites.mutations.sendEventInvite,
        {
          eventId,
          inviteePersonId,
          role: 'ATTENDEE',
        }
      );

      await expect(
        thirdUserAuth.mutation(api.eventInvites.mutations.acceptEventInvite, {
          inviteId: sendResult.inviteId,
        })
      ).rejects.toThrow("can't accept");
    });
  });

  describe('declineEventInvite', () => {
    test('should decline an invite', async () => {
      const t = createTestInstance();

      const { userId: organizerId, eventId } = await createTestEventWithUser(
        t,
        {
          username: 'organizer',
        }
      );
      const { userId: inviteeId, personId: inviteePersonId } =
        await createTestUser(t, {
          email: 'invitee@example.com',
          username: 'invitee',
        });

      const organizerAuth = createAuthenticatedUser(t, organizerId);
      const inviteeAuth = createAuthenticatedUser(t, inviteeId);

      const sendResult = await organizerAuth.mutation(
        api.eventInvites.mutations.sendEventInvite,
        {
          eventId,
          inviteePersonId,
          role: 'ATTENDEE',
        }
      );

      const result = await inviteeAuth.mutation(
        api.eventInvites.mutations.declineEventInvite,
        { inviteId: sendResult.inviteId }
      );

      expect(result.success).toBe(true);

      // Verify invite status
      const { invite } = await t.run(async ctx => {
        const invite = await ctx.db.get(sendResult.inviteId);
        return { invite };
      });

      expect(invite!.status).toBe('DECLINED');
    });
  });

  describe('cancelEventInvite', () => {
    test('should allow inviter to cancel', async () => {
      const t = createTestInstance();

      const { userId: organizerId, eventId } = await createTestEventWithUser(
        t,
        {
          username: 'organizer',
        }
      );
      const { personId: inviteePersonId } = await createTestUser(t, {
        email: 'invitee@example.com',
        username: 'invitee',
      });

      const organizerAuth = createAuthenticatedUser(t, organizerId);

      const sendResult = await organizerAuth.mutation(
        api.eventInvites.mutations.sendEventInvite,
        {
          eventId,
          inviteePersonId,
          role: 'ATTENDEE',
        }
      );

      const result = await organizerAuth.mutation(
        api.eventInvites.mutations.cancelEventInvite,
        { inviteId: sendResult.inviteId }
      );

      expect(result.success).toBe(true);

      // Verify invite was deleted
      const { invite } = await t.run(async ctx => {
        const invite = await ctx.db.get(sendResult.inviteId);
        return { invite };
      });

      expect(invite).toBeNull();
    });

    test('should not allow random user to cancel', async () => {
      const t = createTestInstance();

      const { userId: organizerId, eventId } = await createTestEventWithUser(
        t,
        {
          username: 'organizer',
        }
      );
      const { personId: inviteePersonId } = await createTestUser(t, {
        email: 'invitee@example.com',
        username: 'invitee',
      });
      const { userId: randomId } = await createTestUser(t, {
        email: 'random@example.com',
        username: 'random',
      });

      const organizerAuth = createAuthenticatedUser(t, organizerId);
      const randomAuth = createAuthenticatedUser(t, randomId);

      const sendResult = await organizerAuth.mutation(
        api.eventInvites.mutations.sendEventInvite,
        {
          eventId,
          inviteePersonId,
          role: 'ATTENDEE',
        }
      );

      await expect(
        randomAuth.mutation(api.eventInvites.mutations.cancelEventInvite, {
          inviteId: sendResult.inviteId,
        })
      ).rejects.toThrow("can't cancel");
    });
  });
});
