import { expect, test, describe } from 'vitest';
import { api } from './_generated/api';
import {
  createTestInstance,
  TestScenarios,
  TestAssertions,
  createTestUser,
  createAuthenticatedUser,
  createTestEventWithInvite,
} from './test_helpers';

// Helper to get auth from invite setup
async function setupEventWithInvite(
  t: ReturnType<typeof import('./test_helpers').createTestInstance>,
  options: Parameters<typeof createTestEventWithInvite>[1] = {}
) {
  const setup = await createTestEventWithInvite(t, options);
  const auth = createAuthenticatedUser(t, setup.userId);
  return { ...setup, auth };
}

describe('Invites Domain', () => {
  describe('createInvite', () => {
    test('should create invite with valid token', async () => {
      const t = createTestInstance();
      const { eventId, auth } = await TestScenarios.singleEvent(t);

      const result = await auth.mutation(api.invites.mutations.createInvite, {
        eventId,
        name: 'Test Invite',
        usesTotal: 10,
      });

      expect(result.invite).toBeTruthy();
      expect(result.invite.token).toBeTruthy();
      expect(result.invite.token.length).toBeGreaterThan(0);
      expect(result.invite.eventId).toBe(eventId);
      expect(result.invite.name).toBe('Test Invite');
      expect(result.invite.usesTotal).toBe(10);
      expect(result.invite.usesRemaining).toBe(10);
    });

    test('should require MODERATOR or higher role', async () => {
      const t = createTestInstance();
      const { eventId, attendeeAuth } = await TestScenarios.multiUser(t);

      await expect(
        attendeeAuth.mutation(api.invites.mutations.createInvite, {
          eventId,
          name: 'Unauthorized Invite',
        })
      ).rejects.toThrow();
    });

    test('should set usesRemaining equal to usesTotal', async () => {
      const t = createTestInstance();
      const { eventId, auth } = await TestScenarios.singleEvent(t);

      const result = await auth.mutation(api.invites.mutations.createInvite, {
        eventId,
        usesTotal: 5,
      });

      expect(result.invite.usesTotal).toBe(5);
      expect(result.invite.usesRemaining).toBe(5);
    });

    test('should handle optional fields correctly', async () => {
      const t = createTestInstance();
      const { eventId, auth } = await TestScenarios.singleEvent(t);

      const result = await auth.mutation(api.invites.mutations.createInvite, {
        eventId,
      });

      expect(result.invite.eventId).toBe(eventId);
      expect(result.invite.token).toBeTruthy();
      expect(result.invite.name).toBeUndefined();
      expect(result.invite.usesTotal).toBeUndefined();
      expect(result.invite.usesRemaining).toBeUndefined();
    });

    test('should set expiresAt when provided', async () => {
      const t = createTestInstance();
      const { eventId, auth } = await TestScenarios.singleEvent(t);

      const futureTime = Date.now() + 24 * 60 * 60 * 1000; // 1 day from now
      const result = await auth.mutation(api.invites.mutations.createInvite, {
        eventId,
        expiresAt: futureTime,
      });

      expect(result.invite.expiresAt).toBe(futureTime);
    });
  });

  describe('getEventInvites', () => {
    test('should return all invites for an event', async () => {
      const t = createTestInstance();
      const { eventId, auth } = await TestScenarios.singleEvent(t);

      // Create multiple invites
      await auth.mutation(api.invites.mutations.createInvite, {
        eventId,
        name: 'Invite 1',
      });
      await auth.mutation(api.invites.mutations.createInvite, {
        eventId,
        name: 'Invite 2',
      });

      const result = await auth.query(api.invites.queries.getEventInvites, {
        eventId,
      });

      expect(result.invites).toHaveLength(2);
    });

    test('should require MODERATOR or higher role', async () => {
      const t = createTestInstance();
      const { eventId, attendeeAuth } = await TestScenarios.multiUser(t);

      await expect(
        attendeeAuth.query(api.invites.queries.getEventInvites, {
          eventId,
        })
      ).rejects.toThrow();
    });
  });

  describe('getInviteByToken', () => {
    test('should return valid invite with event details', async () => {
      const t = createTestInstance();
      const { eventId, inviteToken } = await createTestEventWithInvite(t);

      const result = await t.query(api.invites.queries.getInviteByToken, {
        token: inviteToken,
      });

      expect(result).toBeTruthy();
      expect(result!.invite.token).toBe(inviteToken);
      expect(result!.event.id).toBe(eventId);
    });

    test('should return null for invalid token', async () => {
      const t = createTestInstance();

      const result = await t.query(api.invites.queries.getInviteByToken, {
        token: 'invalid_token_123',
      });

      expect(result).toBeNull();
    });

    test('should return null for expired invite', async () => {
      const t = createTestInstance();
      const pastTime = Date.now() - 1000; // 1 second ago
      const { inviteToken } = await createTestEventWithInvite(t, {
        expiresAt: pastTime,
      });

      const result = await t.query(api.invites.queries.getInviteByToken, {
        token: inviteToken,
      });

      expect(result).toBeNull();
    });

    test('should return null for used-up invite', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithInvite(t, { usesTotal: 1 });

      // Use up the invite
      await t.run(async ctx => {
        await ctx.db.patch(setup.inviteId, { usesRemaining: 0 });
      });

      const result = await t.query(api.invites.queries.getInviteByToken, {
        token: setup.inviteToken,
      });

      expect(result).toBeNull();
    });
  });

  describe('acceptInvite', () => {
    test('should create membership for new user', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithInvite(t);
      const { userId, personId } = await createTestUser(t, {
        email: 'newuser@example.com',
      });
      const newUserAuth = createAuthenticatedUser(t, userId);

      const result = await newUserAuth.mutation(
        api.invites.mutations.acceptInvite,
        {
          token: setup.inviteToken,
        }
      );

      expect(result.membership).toBeTruthy();
      expect(result.membership.eventId).toBe(setup.eventId);
      expect(result.membership.role).toBe('ATTENDEE');

      // Verify membership was created in database
      await TestAssertions.assertMembershipCreated(t, personId, setup.eventId);
    });

    test('should notify organizers when user joins', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithInvite(t);
      const { userId } = await createTestUser(t, {
        email: 'newuser@example.com',
      });
      const newUserAuth = createAuthenticatedUser(t, userId);

      await newUserAuth.mutation(api.invites.mutations.acceptInvite, {
        token: setup.inviteToken,
      });

      // Verify USER_JOINED notification was created for the organizer
      const { notifications } = await t.run(async ctx => {
        const notifications = await ctx.db
          .query('notifications')
          .withIndex('by_person', q => q.eq('personId', setup.personId))
          .collect();
        return { notifications };
      });

      const joinNotification = notifications.find(
        n => n.type === 'USER_JOINED'
      );
      expect(joinNotification).toBeTruthy();
      expect(joinNotification!.eventId).toBe(setup.eventId);
    });

    test('should decrement usesRemaining', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithInvite(t, { usesTotal: 5 });
      const { userId } = await createTestUser(t, { email: 'test@example.com' });
      const userAuth = createAuthenticatedUser(t, userId);

      await userAuth.mutation(api.invites.mutations.acceptInvite, {
        token: setup.inviteToken,
      });

      const { invite } = await t.run(async ctx => {
        const invite = await ctx.db.get(setup.inviteId);
        return { invite };
      });

      expect(invite!.usesRemaining).toBe(4);
    });

    test('should fail when invite is expired', async () => {
      const t = createTestInstance();
      const pastTime = Date.now() - 1000;
      const { inviteToken } = await createTestEventWithInvite(t, {
        expiresAt: pastTime,
      });
      const { userId } = await createTestUser(t, { email: 'test@example.com' });
      const userAuth = createAuthenticatedUser(t, userId);

      await expect(
        userAuth.mutation(api.invites.mutations.acceptInvite, {
          token: inviteToken,
        })
      ).rejects.toThrow('Invite has expired');
    });

    test('should fail when invite has no uses remaining', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithInvite(t, { usesTotal: 1 });

      // Consume the invite
      await t.run(async ctx => {
        await ctx.db.patch(setup.inviteId, { usesRemaining: 0 });
      });

      const { userId } = await createTestUser(t, { email: 'test@example.com' });
      const userAuth = createAuthenticatedUser(t, userId);

      await expect(
        userAuth.mutation(api.invites.mutations.acceptInvite, {
          token: setup.inviteToken,
        })
      ).rejects.toThrow('Invite has no uses remaining');
    });

    test('should fail when user is already a member', async () => {
      const t = createTestInstance();
      const { inviteToken, userId } = await createTestEventWithInvite(t);
      const auth = createAuthenticatedUser(t, userId);

      await expect(
        auth.mutation(api.invites.mutations.acceptInvite, {
          token: inviteToken,
        })
      ).rejects.toThrow('You are already a member of this event');
    });

    test('should fail when user is banned', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithInvite(t);
      const { userId, personId } = await createTestUser(t, {
        email: 'banned@example.com',
      });
      const userAuth = createAuthenticatedUser(t, userId);

      // Create ban
      await t.run(async ctx => {
        await ctx.db.insert('eventBans', {
          eventId: setup.eventId,
          personId: personId,
          bannedAt: Date.now(),
          bannedById: setup.personId,
        });
      });

      await expect(
        userAuth.mutation(api.invites.mutations.acceptInvite, {
          token: setup.inviteToken,
        })
      ).rejects.toThrow('You have been banned from this event');
    });
  });

  describe('updateInvite', () => {
    test('should update invite properties', async () => {
      const t = createTestInstance();
      const { inviteId, auth } = await setupEventWithInvite(t);

      const result = await auth.mutation(api.invites.mutations.updateInvite, {
        inviteId,
        name: 'Updated Name',
        usesTotal: 20,
      });

      expect(result.invite.name).toBe('Updated Name');
      expect(result.invite.usesTotal).toBe(20);
    });

    test('should recalculate usesRemaining correctly', async () => {
      const t = createTestInstance();
      const setup = await setupEventWithInvite(t, { usesTotal: 10 });

      // Simulate some uses
      await t.run(async ctx => {
        await ctx.db.patch(setup.inviteId, { usesRemaining: 7 }); // 3 uses consumed
      });

      const updateResult = await setup.auth.mutation(
        api.invites.mutations.updateInvite,
        {
          inviteId: setup.inviteId,
          usesTotal: 15, // Increase total to 15
        }
      );

      // New remaining = 15 - 3 (consumed) = 12
      expect(updateResult.invite.usesRemaining).toBe(12);
    });

    test('should require MODERATOR or higher role', async () => {
      const t = createTestInstance();
      const { eventId, organizerAuth, attendeeAuth } =
        await TestScenarios.multiUser(t);

      const createResult = await organizerAuth.mutation(
        api.invites.mutations.createInvite,
        {
          eventId,
          name: 'Test',
        }
      );

      await expect(
        attendeeAuth.mutation(api.invites.mutations.updateInvite, {
          inviteId: createResult.invite.id,
          name: 'Unauthorized Update',
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteInvites', () => {
    test('should delete multiple invites', async () => {
      const t = createTestInstance();
      const { eventId, auth } = await TestScenarios.singleEvent(t);

      const invite1 = await auth.mutation(api.invites.mutations.createInvite, {
        eventId,
        name: 'Invite 1',
      });
      const invite2 = await auth.mutation(api.invites.mutations.createInvite, {
        eventId,
        name: 'Invite 2',
      });

      const result = await auth.mutation(api.invites.mutations.deleteInvites, {
        inviteIds: [invite1.invite.id, invite2.invite.id],
      });

      expect(result.deletedCount).toBe(2);

      // Verify invites are deleted
      const { remainingInvites } = await t.run(async ctx => {
        const remainingInvites = await ctx.db
          .query('invites')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
        return { remainingInvites };
      });

      expect(remainingInvites).toHaveLength(0);
    });

    test('should require MODERATOR or higher role', async () => {
      const t = createTestInstance();
      const { eventId, organizerAuth, attendeeAuth } =
        await TestScenarios.multiUser(t);

      const createResult = await organizerAuth.mutation(
        api.invites.mutations.createInvite,
        { eventId }
      );

      await expect(
        attendeeAuth.mutation(api.invites.mutations.deleteInvites, {
          inviteIds: [createResult.invite.id],
        })
      ).rejects.toThrow();
    });
  });
});
