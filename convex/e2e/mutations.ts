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
 * Creates a real Better Auth user, session, and person record.
 * @param skipPerson - If true, skips creating person record (for onboarding tests)
 */
export const createTestSession = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    username: v.string(),
    skipPerson: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    assertE2EEnabled();

    const now = Date.now();

    // Check if user already exists
    const existingUser = await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: 'user',
        where: [{ field: 'email', operator: 'eq', value: args.email }],
      }
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser._id as string;
    } else {
      // Create a real Better Auth user using the adapter
      const userResult = await ctx.runMutation(
        components.betterAuth.adapter.create,
        {
          input: {
            model: 'user',
            data: {
              email: args.email,
              name: args.name,
              username: args.username,
              emailVerified: true,
              createdAt: now,
              updatedAt: now,
            },
          },
        }
      );
      userId = userResult._id as string;
    }

    let personId: string | null = null;

    // Only create person record if not skipping (default behavior)
    if (!args.skipPerson) {
      // Check if person already exists for this user
      const existingPerson = await ctx.db
        .query('persons')
        .filter(q => q.eq(q.field('userId'), userId))
        .first();

      let personIdRaw: Id<'persons'>;

      if (existingPerson) {
        personIdRaw = existingPerson._id;
      } else {
        // Create person record
        personIdRaw = await ctx.db.insert('persons', {
          userId,
          bio: 'E2E Test User',
          updatedAt: now,
        });

        // Create person settings
        await ctx.db.insert('personSettings', {
          personId: personIdRaw,
          updatedAt: now,
        });
      }
      personId = personIdRaw.toString();
    }

    // Generate a real session token
    const sessionToken = `e2e_${now}_${Math.random().toString(36).slice(2, 11)}`;

    // Delete any existing sessions for this user (clean slate)
    const existingSessions = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: 'session',
        where: [{ field: 'userId', operator: 'eq', value: userId }],
        paginationOpts: { cursor: null, numItems: 100 },
      }
    );

    if (existingSessions.page) {
      for (const session of existingSessions.page) {
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model: 'session',
            where: [
              { field: '_id', operator: 'eq', value: session._id as string },
            ],
          },
        });
      }
    }

    // Create a real Better Auth session
    await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: 'session',
        data: {
          userId,
          token: sessionToken,
          expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days from now
          createdAt: now,
          updatedAt: now,
          ipAddress: '127.0.0.1',
          userAgent: 'Playwright E2E Test',
        },
      },
    });

    return {
      userId,
      personId,
      sessionToken,
    };
  },
});

/**
 * Debug query to inspect verification records.
 */
export const debugVerifications = query({
  args: {},
  handler: async ctx => {
    assertE2EEnabled();

    const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: 'verification' as const,
      where: [],
      paginationOpts: {
        cursor: null,
        numItems: 10,
      },
    });

    const verifications = Array.isArray(result) ? result : (result?.page ?? []);
    return verifications;
  },
});

/**
 * Get the last magic link sent to an email (for testing).
 * Queries the Better Auth verification table to find the most recent token.
 *
 * Structure of Better Auth verification records:
 * - identifier: Random token string used for lookup
 * - value: JSON string like '{"email":"user@example.com"}'
 * - expiresAt: Expiration timestamp
 * - createdAt: Creation timestamp
 */
export const getLastMagicLink = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    assertE2EEnabled();

    // Query all recent verifications
    const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: 'verification' as const,
      where: [],
      paginationOpts: {
        cursor: null,
        numItems: 50,
      },
    });

    const verifications = Array.isArray(result) ? result : (result?.page ?? []);

    // Find verification matching the email
    const now = Date.now();
    type VerificationRecord = {
      identifier: string;
      value: string;
      expiresAt: number;
      createdAt: number;
    };

    const matchingVerifications = verifications
      .filter((v: VerificationRecord) => {
        // Check if not expired
        if (v.expiresAt <= now) return false;

        // Parse the value field to extract email
        try {
          const parsed = JSON.parse(v.value);
          return parsed.email === email;
        } catch {
          return false;
        }
      })
      .sort(
        (a: VerificationRecord, b: VerificationRecord) =>
          b.createdAt - a.createdAt
      );

    if (matchingVerifications.length === 0) {
      console.log(`No valid verification found for ${email}`);
      return null;
    }

    const valid = matchingVerifications[0] as VerificationRecord;
    console.log(
      `Found verification for ${email} with identifier: ${valid.identifier}`
    );

    // The verification token is the 'identifier' field, not 'value'
    const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
    return {
      url: `${baseUrl}/api/auth/magic-link/verify?token=${valid.identifier}`,
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
