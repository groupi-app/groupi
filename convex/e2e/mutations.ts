import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { components } from '../_generated/api';
import { Id } from '../_generated/dataModel';

/**
 * E2E Test-Only Convex Functions
 *
 * These functions are ONLY for E2E testing and are guarded by the E2E_TESTING
 * environment variable. They should NEVER be exposed in production.
 *
 * IMPORTANT: Set E2E_TESTING=true in your deployment environment variables
 * when running E2E tests.
 */

// Guard to prevent usage in non-test environments
function assertE2EEnabled() {
  if (process.env.E2E_TESTING !== 'true') {
    throw new Error(
      'E2E test functions are only available when E2E_TESTING=true'
    );
  }
}

/**
 * Create a test user session.
 * Creates a user, person record, and returns a session token.
 */
export const createTestSession = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    username: v.string(),
  },
  handler: async (ctx, _args) => {
    assertE2EEnabled();

    const now = Date.now();

    // Create a mock user ID (in production this would come from Better Auth)
    const userId = `e2e_user_${now}_${Math.random().toString(36).slice(2)}`;

    // Create person record
    const personId = await ctx.db.insert('persons', {
      userId,
      bio: 'E2E Test User',
      updatedAt: now,
    });

    // Create person settings
    await ctx.db.insert('personSettings', {
      personId,
      updatedAt: now,
    });

    // Generate a mock session token
    // In production, this would be a real Better Auth session token
    const sessionToken = `e2e_session_${now}_${Math.random().toString(36).slice(2)}`;

    return {
      userId,
      personId: personId.toString(),
      sessionToken,
    };
  },
});

/**
 * Get the last magic link sent to an email (for testing).
 * Queries the Better Auth verification table to find the most recent token.
 */
export const getLastMagicLink = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    assertE2EEnabled();

    // Query Better Auth component's verification table
    const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: 'verification' as const,
      where: [{ field: 'identifier', operator: 'eq' as const, value: email }],
      paginationOpts: {
        cursor: null,
        numItems: 10, // Get recent entries
      },
    });

    const verifications = Array.isArray(result) ? result : (result?.page ?? []);

    // Find most recent non-expired verification
    const now = Date.now();
    const valid = verifications
      .filter((v: { expiresAt: number }) => v.expiresAt > now)
      .sort(
        (a: { createdAt: number }, b: { createdAt: number }) =>
          b.createdAt - a.createdAt
      )[0] as { value: string } | undefined;

    if (!valid) {
      return null;
    }

    const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
    return {
      url: `${baseUrl}/api/auth/magic-link/verify?token=${valid.value}`,
    };
  },
});

/**
 * Seed a test event.
 */
export const seedEvent = mutation({
  args: {
    creatorPersonId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    chosenDateTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertE2EEnabled();

    const now = Date.now();
    const personId = args.creatorPersonId as Id<'persons'>;

    // Create event
    const eventId = await ctx.db.insert('events', {
      title: args.title,
      description: args.description || 'E2E Test Event',
      location: args.location || 'Test Location',
      creatorId: personId,
      potentialDateTimes: [],
      chosenDateTime: args.chosenDateTime,
      createdAt: now,
      updatedAt: now,
      timezone: 'UTC',
    });

    // Create organizer membership
    const membershipId = await ctx.db.insert('memberships', {
      personId,
      eventId,
      role: 'ORGANIZER',
      rsvpStatus: 'YES',
      updatedAt: now,
    });

    return {
      eventId: eventId.toString(),
      membershipId: membershipId.toString(),
    };
  },
});

/**
 * Seed a test post.
 */
export const seedPost = mutation({
  args: {
    eventId: v.string(),
    authorPersonId: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    assertE2EEnabled();

    const now = Date.now();
    const eventId = args.eventId as Id<'events'>;
    const authorId = args.authorPersonId as Id<'persons'>;

    // Find the author's membership
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', authorId).eq('eventId', eventId)
      )
      .first();

    // Create post
    const postId = await ctx.db.insert('posts', {
      title: args.title,
      content: args.content,
      authorId,
      eventId,
      membershipId: membership?._id,
      updatedAt: now,
    });

    return {
      postId: postId.toString(),
    };
  },
});

/**
 * Seed a test invite.
 */
export const seedInvite = mutation({
  args: {
    eventId: v.string(),
    creatorMembershipId: v.string(),
    name: v.optional(v.string()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertE2EEnabled();

    const now = Date.now();
    const eventId = args.eventId as Id<'events'>;
    const createdById = args.creatorMembershipId as Id<'memberships'>;

    // Generate invite token
    const token = `e2e_invite_${now}_${Math.random().toString(36).slice(2)}`;

    const inviteId = await ctx.db.insert('invites', {
      eventId,
      createdById,
      token,
      name: args.name,
      maxUses: args.maxUses,
      usesRemaining: args.maxUses,
      usesTotal: 0,
      updatedAt: now,
    });

    return {
      inviteId: inviteId.toString(),
      inviteToken: token,
    };
  },
});

/**
 * Seed a test membership.
 */
export const seedMembership = mutation({
  args: {
    personId: v.string(),
    eventId: v.string(),
    role: v.union(
      v.literal('ORGANIZER'),
      v.literal('MODERATOR'),
      v.literal('ATTENDEE')
    ),
    rsvpStatus: v.union(
      v.literal('YES'),
      v.literal('MAYBE'),
      v.literal('NO'),
      v.literal('PENDING')
    ),
  },
  handler: async (ctx, args) => {
    assertE2EEnabled();

    const now = Date.now();
    const personId = args.personId as Id<'persons'>;
    const eventId = args.eventId as Id<'events'>;

    // Check if membership already exists
    const existing = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId).eq('eventId', eventId)
      )
      .first();

    if (existing) {
      return {
        membershipId: existing._id.toString(),
      };
    }

    const membershipId = await ctx.db.insert('memberships', {
      personId,
      eventId,
      role: args.role,
      rsvpStatus: args.rsvpStatus,
      updatedAt: now,
    });

    return {
      membershipId: membershipId.toString(),
    };
  },
});

/**
 * Clean up test data.
 */
export const cleanupTestData = mutation({
  args: {
    userIds: v.array(v.string()),
    personIds: v.array(v.string()),
    eventIds: v.array(v.string()),
    postIds: v.array(v.string()),
    inviteIds: v.array(v.string()),
    membershipIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    assertE2EEnabled();

    // Delete in reverse order of dependencies

    // Delete invites
    for (const id of args.inviteIds) {
      try {
        await ctx.db.delete(id as Id<'invites'>);
      } catch {
        // Ignore if already deleted
      }
    }

    // Delete posts and their replies
    for (const id of args.postIds) {
      try {
        // Delete replies first
        const replies = await ctx.db
          .query('replies')
          .withIndex('by_post', q => q.eq('postId', id as Id<'posts'>))
          .collect();

        for (const reply of replies) {
          await ctx.db.delete(reply._id);
        }

        await ctx.db.delete(id as Id<'posts'>);
      } catch {
        // Ignore if already deleted
      }
    }

    // Delete memberships
    for (const id of args.membershipIds) {
      try {
        // Delete availabilities first
        const availabilities = await ctx.db
          .query('availabilities')
          .withIndex('by_membership', q =>
            q.eq('membershipId', id as Id<'memberships'>)
          )
          .collect();

        for (const availability of availabilities) {
          await ctx.db.delete(availability._id);
        }

        await ctx.db.delete(id as Id<'memberships'>);
      } catch {
        // Ignore if already deleted
      }
    }

    // Delete events
    for (const id of args.eventIds) {
      try {
        const eventId = id as Id<'events'>;

        // Delete potential date times
        const potentialDates = await ctx.db
          .query('potentialDateTimes')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();

        for (const date of potentialDates) {
          await ctx.db.delete(date._id);
        }

        // Delete notifications
        const notifications = await ctx.db
          .query('notifications')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();

        for (const notification of notifications) {
          await ctx.db.delete(notification._id);
        }

        // Delete event reminders
        const reminders = await ctx.db
          .query('eventReminders')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();

        for (const reminder of reminders) {
          await ctx.db.delete(reminder._id);
        }

        await ctx.db.delete(eventId);
      } catch {
        // Ignore if already deleted
      }
    }

    // Delete person settings and persons
    for (const id of args.personIds) {
      try {
        const personId = id as Id<'persons'>;

        // Delete person settings
        const settings = await ctx.db
          .query('personSettings')
          .withIndex('by_person', q => q.eq('personId', personId))
          .first();

        if (settings) {
          // Delete notification methods
          const methods = await ctx.db
            .query('notificationMethods')
            .withIndex('by_settings', q => q.eq('settingsId', settings._id))
            .collect();

          for (const method of methods) {
            // Delete notification settings
            const notifSettings = await ctx.db
              .query('notificationSettings')
              .withIndex('by_method', q => q.eq('methodId', method._id))
              .collect();

            for (const ns of notifSettings) {
              await ctx.db.delete(ns._id);
            }

            await ctx.db.delete(method._id);
          }

          await ctx.db.delete(settings._id);
        }

        // Delete notifications for this person
        const personNotifications = await ctx.db
          .query('notifications')
          .withIndex('by_person', q => q.eq('personId', personId))
          .collect();

        for (const notification of personNotifications) {
          await ctx.db.delete(notification._id);
        }

        await ctx.db.delete(personId);
      } catch {
        // Ignore if already deleted
      }
    }

    return { success: true };
  },
});
