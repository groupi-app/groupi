import { expect, test, describe } from 'vitest';
import { createTestInstance, createTestUser } from './test_helpers';
import {
  getCurrentUserAndPerson,
  requireAuth,
  requirePerson,
  requireUser,
  getEventMembership,
  requireEventMembership,
  hasEventRole,
  requireEventRole,
  ensurePersonRecord,
  isAdmin,
  ExtendedIdentity,
} from '../auth';

describe('Authentication System', () => {
  describe('getCurrentUserAndPerson', () => {
    test('should return null when not authenticated', async () => {
      const t = createTestInstance();

      const result = await t.run(async ctx => {
        return await getCurrentUserAndPerson(ctx);
      });

      expect(result).toBeNull();
    });

    test('should return user and person when authenticated', async () => {
      const t = createTestInstance();

      const { userId, personId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.run(async ctx => {
        return await getCurrentUserAndPerson(ctx);
      });

      expect(result).not.toBeNull();
      expect(result!.user._id).toBe(userId);
      expect(result!.person._id).toBe(personId);
    });
  });

  describe('requireAuth', () => {
    test('should throw when not authenticated', async () => {
      const t = createTestInstance();

      await expect(
        t.run(async ctx => {
          return await requireAuth(ctx);
        })
      ).rejects.toThrow('Authentication required');
    });

    test('should return user and person when authenticated', async () => {
      const t = createTestInstance();

      const { userId, personId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.run(async ctx => {
        return await requireAuth(ctx);
      });

      expect(result.user._id).toBe(userId);
      expect(result.person._id).toBe(personId);
    });
  });

  describe('requirePerson', () => {
    test('should throw when not authenticated', async () => {
      const t = createTestInstance();

      await expect(
        t.run(async ctx => {
          return await requirePerson(ctx);
        })
      ).rejects.toThrow('Authentication required');
    });

    test('should return person when authenticated', async () => {
      const t = createTestInstance();

      const { userId, personId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.run(async ctx => {
        return await requirePerson(ctx);
      });

      expect(result._id).toBe(personId);
    });
  });

  describe('requireUser', () => {
    test('should throw when not authenticated', async () => {
      const t = createTestInstance();

      await expect(
        t.run(async ctx => {
          return await requireUser(ctx);
        })
      ).rejects.toThrow('Authentication required');
    });

    test('should return user when authenticated', async () => {
      const t = createTestInstance();

      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.run(async ctx => {
        return await requireUser(ctx);
      });

      expect(result._id).toBe(userId);
    });
  });

  describe('ensurePersonRecord', () => {
    test("should create person record if it doesn't exist", async () => {
      const t = createTestInstance();

      // Use a mock userId (in production this would be from Better Auth)
      const mockUserId = 'test_user_newuser';

      const result = await t.run(async ctx => {
        return await ensurePersonRecord(ctx, mockUserId);
      });

      expect(result).not.toBeNull();
      expect(result!.userId).toBe(mockUserId);

      // Should also create person settings
      const settings = await t.run(async ctx => {
        return await ctx.db
          .query('personSettings')
          .withIndex('by_person', q => q.eq('personId', result!._id))
          .first();
      });

      expect(settings).not.toBeNull();
    });

    test('should return existing person record if it exists', async () => {
      const t = createTestInstance();

      const { userId, personId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const result = await t.run(async ctx => {
        return await ensurePersonRecord(ctx, userId);
      });

      expect(result!._id).toBe(personId);
    });
  });

  describe('isAdmin', () => {
    test('should return false when not authenticated', async () => {
      const t = createTestInstance();

      const result = await t.run(async ctx => {
        return await isAdmin(ctx);
      });

      expect(result).toBe(false);
    });

    test('should return false for regular user', async () => {
      const t = createTestInstance();

      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.run(async ctx => {
        return await isAdmin(ctx);
      });

      expect(result).toBe(false);
    });

    test('should return true for admin user', async () => {
      const t = createTestInstance();

      const { userId } = await createTestUser(t, {
        email: 'admin@example.com',
        username: 'admin',
        name: 'Admin User',
        role: 'admin',
      });

      // Pass role in identity for test fallback to detect
      const asUser = t.withIdentity({
        subject: userId,
        role: 'admin',
      } as ExtendedIdentity);
      const result = await asUser.run(async ctx => {
        return await isAdmin(ctx);
      });

      expect(result).toBe(true);
    });
  });

  describe('Event Permissions', () => {
    test('getEventMembership should return membership when user is member', async () => {
      const t = createTestInstance();

      // Create user and event
      const { userId, personId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const { eventId, membershipId } = await t.run(async ctx => {
        const eventId = await ctx.db.insert('events', {
          title: 'Test Event',
          description: 'Test Description',
          creatorId: personId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          timezone: 'UTC',
          potentialDateTimes: [],
        });

        const membershipId = await ctx.db.insert('memberships', {
          personId,
          eventId,
          role: 'ATTENDEE',
          rsvpStatus: 'YES',
        });

        return { eventId, membershipId };
      });

      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.run(async ctx => {
        return await getEventMembership(ctx, eventId);
      });

      expect(result!._id).toBe(membershipId);
      expect(result!.personId).toBe(personId);
      expect(result!.eventId).toBe(eventId);
    });

    test('requireEventMembership should throw when user is not member', async () => {
      const t = createTestInstance();

      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      // Create another user and event
      const { userId: _otherUserId, personId: otherPersonId } =
        await createTestUser(t, {
          email: 'other@example.com',
          username: 'otheruser',
          name: 'Other User',
        });

      const eventId = await t.run(async ctx => {
        return await ctx.db.insert('events', {
          title: "Other's Event",
          description: 'Test Description',
          creatorId: otherPersonId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          timezone: 'UTC',
          potentialDateTimes: [],
        });
      });

      const asUser = t.withIdentity({ subject: userId });
      await expect(
        asUser.run(async ctx => {
          return await requireEventMembership(ctx, eventId);
        })
      ).rejects.toThrow('Event membership required');
    });

    test('hasEventRole should work correctly for different roles', async () => {
      const t = createTestInstance();

      const { userId, personId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const { eventId } = await t.run(async ctx => {
        const eventId = await ctx.db.insert('events', {
          title: 'Test Event',
          description: 'Test Description',
          creatorId: personId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          timezone: 'UTC',
          potentialDateTimes: [],
        });

        await ctx.db.insert('memberships', {
          personId,
          eventId,
          role: 'ORGANIZER',
          rsvpStatus: 'YES',
        });

        return { eventId };
      });

      const asUser = t.withIdentity({ subject: userId });

      // Organizer should have all permissions
      const attendeeAccess = await asUser.run(async ctx => {
        return await hasEventRole(ctx, eventId, 'ATTENDEE');
      });
      expect(attendeeAccess).toBe(true);

      const moderatorAccess = await asUser.run(async ctx => {
        return await hasEventRole(ctx, eventId, 'MODERATOR');
      });
      expect(moderatorAccess).toBe(true);

      const organizerAccess = await asUser.run(async ctx => {
        return await hasEventRole(ctx, eventId, 'ORGANIZER');
      });
      expect(organizerAccess).toBe(true);
    });

    test('requireEventRole should enforce role requirements', async () => {
      const t = createTestInstance();

      const { userId, personId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const { eventId } = await t.run(async ctx => {
        const eventId = await ctx.db.insert('events', {
          title: 'Test Event',
          description: 'Test Description',
          creatorId: personId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          timezone: 'UTC',
          potentialDateTimes: [],
        });

        await ctx.db.insert('memberships', {
          personId,
          eventId,
          role: 'ATTENDEE', // Just an attendee
          rsvpStatus: 'YES',
        });

        return { eventId };
      });

      const asUser = t.withIdentity({ subject: userId });

      // Should work for attendee role
      const result = await asUser.run(async ctx => {
        return await requireEventRole(ctx, eventId, 'ATTENDEE');
      });
      expect(result.role).toBe('ATTENDEE');

      // Should fail for organizer role
      await expect(
        asUser.run(async ctx => {
          return await requireEventRole(ctx, eventId, 'ORGANIZER');
        })
      ).rejects.toThrow('ORGANIZER role required for this event');
    });
  });
});
