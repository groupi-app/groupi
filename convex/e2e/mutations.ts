import { v } from 'convex/values';
import { makeSignature } from 'better-auth/crypto';
import { mutation, query } from '../_generated/server';
import { components } from '../_generated/api';
import type { Id } from '../_generated/dataModel';

/**
 * E2E Test-Only Convex Functions
 *
 * These functions are ONLY for E2E testing. Fixture management requires both
 * an isolated deployment with E2E_TESTING enabled and a server-side fixture
 * key. They should NEVER be exposed in production.
 *
 * IMPORTANT: Set E2E_TESTING=true in your deployment environment variables
 * when running E2E tests.
 */

// Guard to prevent usage in non-test environments
const MIN_FIXTURE_KEY_LENGTH = 32;
const MOBILE_LOGIN_CODE_PREFIX = 'mobile_e2e_';

function assertE2EEnabled() {
  if (process.env.E2E_TESTING !== 'true') {
    throw new Error('E2E fixtures are unavailable');
  }
}

function fixtureKeysMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

function assertFixtureAccess(fixtureKey: string) {
  assertE2EEnabled();

  const configuredKey = process.env.E2E_FIXTURE_KEY;
  if (
    !configuredKey ||
    configuredKey.length < MIN_FIXTURE_KEY_LENGTH ||
    !fixtureKeysMatch(fixtureKey, configuredKey)
  ) {
    throw new Error('E2E fixtures are unavailable');
  }
}

function createOpaqueToken(prefix: string): string {
  return `${prefix}${crypto.randomUUID()}_${crypto.randomUUID()}`;
}

const mobileFixtureResult = v.object({
  loginCode: v.string(),
  userId: v.string(),
  personId: v.id('persons'),
  eventId: v.id('events'),
  membershipId: v.id('memberships'),
  postId: v.id('posts'),
  eventTitle: v.string(),
  postTitle: v.string(),
});

/**
 * Create the complete, isolated fixture used by the authenticated native E2E
 * flow. The reusable fixture key remains on the test runner; only a short-lived
 * one-time login code is returned to Maestro and opened by the app.
 */
export const createMobileFixture = mutation({
  args: { fixtureKey: v.string() },
  returns: mobileFixtureResult,
  handler: async (ctx, { fixtureKey }) => {
    assertFixtureAccess(fixtureKey);

    const now = Date.now();
    const uniqueSuffix = crypto.randomUUID().replaceAll('-', '');
    const email = `mobile-e2e-${uniqueSuffix}@example.invalid`;
    const username = `mobile_e2e_${uniqueSuffix.slice(0, 16)}`;
    const eventTitle = `Mobile E2E Event ${uniqueSuffix.slice(0, 8)}`;
    const postTitle = 'Welcome to the mobile E2E event';
    const sessionToken = createOpaqueToken('e2e_session_');
    const loginCode = createOpaqueToken(MOBILE_LOGIN_CODE_PREFIX);

    const user = await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: 'user',
        data: {
          email,
          name: 'Mobile E2E User',
          username,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      },
    });
    const userId = user._id as string;

    const personId = await ctx.db.insert('persons', {
      userId,
      bio: 'Isolated native E2E fixture',
      updatedAt: now,
    });
    await ctx.db.insert('personSettings', { personId, updatedAt: now });

    await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: 'session',
        data: {
          userId,
          token: sessionToken,
          expiresAt: now + 30 * 60 * 1000,
          createdAt: now,
          updatedAt: now,
          ipAddress: '127.0.0.1',
          userAgent: 'Maestro native E2E',
        },
      },
    });

    const eventId = await ctx.db.insert('events', {
      title: eventTitle,
      description: 'Created automatically for an isolated mobile E2E run.',
      location: 'Groupi Test Lab',
      creatorId: personId,
      potentialDateTimes: [],
      chosenDateTime: now + 7 * 24 * 60 * 60 * 1000,
      memberCount: 1,
      createdAt: now,
      updatedAt: now,
      timezone: 'UTC',
    });
    const membershipId = await ctx.db.insert('memberships', {
      personId,
      eventId,
      role: 'ORGANIZER',
      rsvpStatus: 'YES',
      updatedAt: now,
    });
    const postId = await ctx.db.insert('posts', {
      title: postTitle,
      content:
        '<p>This seeded post verifies authenticated event and discussion navigation.</p>',
      authorId: personId,
      eventId,
      membershipId,
      updatedAt: now,
    });

    await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: 'verification',
        data: {
          identifier: loginCode,
          value: JSON.stringify({
            kind: 'mobile-e2e-session',
            sessionToken,
            userId,
            eventId,
          }),
          expiresAt: now + 5 * 60 * 1000,
          createdAt: now,
          updatedAt: now,
        },
      },
    });

    return {
      loginCode,
      userId,
      personId,
      eventId,
      membershipId,
      postId,
      eventTitle,
      postTitle,
    };
  },
});

/**
 * Exchange a short-lived login code for a signed Better Auth cookie exactly
 * once. This endpoint intentionally does not accept the reusable fixture key:
 * the native app only ever receives the one-time code.
 */
export const redeemMobileFixture = mutation({
  args: { loginCode: v.string() },
  returns: v.object({ cookieHeader: v.string(), eventId: v.id('events') }),
  handler: async (ctx, { loginCode }) => {
    assertE2EEnabled();
    if (
      !loginCode.startsWith(MOBILE_LOGIN_CODE_PREFIX) ||
      loginCode.length > 200
    ) {
      throw new Error('Invalid or expired E2E login code');
    }

    const verification = await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: 'verification',
        where: [{ field: 'identifier', operator: 'eq', value: loginCode }],
      }
    );
    if (!verification || Number(verification.expiresAt) <= Date.now()) {
      throw new Error('Invalid or expired E2E login code');
    }

    let payload: {
      kind?: unknown;
      sessionToken?: unknown;
      userId?: unknown;
      eventId?: unknown;
    };
    try {
      payload = JSON.parse(String(verification.value));
    } catch {
      throw new Error('Invalid or expired E2E login code');
    }

    if (
      payload.kind !== 'mobile-e2e-session' ||
      typeof payload.sessionToken !== 'string' ||
      typeof payload.userId !== 'string' ||
      typeof payload.eventId !== 'string'
    ) {
      throw new Error('Invalid or expired E2E login code');
    }

    const session = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: 'session',
      where: [{ field: 'token', operator: 'eq', value: payload.sessionToken }],
    });
    if (
      !session ||
      session.userId !== payload.userId ||
      Number(session.expiresAt) <= Date.now()
    ) {
      throw new Error('Invalid or expired E2E login code');
    }

    const eventId = ctx.db.normalizeId('events', payload.eventId);
    if (!eventId || !(await ctx.db.get(eventId))) {
      throw new Error('Invalid or expired E2E login code');
    }

    const authSecret = process.env.BETTER_AUTH_SECRET;
    if (!authSecret) throw new Error('E2E fixtures are unavailable');

    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: 'verification',
        where: [
          { field: '_id', operator: 'eq', value: verification._id as string },
        ],
      },
    });

    const signature = await makeSignature(payload.sessionToken, authSecret);
    const signedToken = encodeURIComponent(
      `${payload.sessionToken}.${signature}`
    );
    const secure = (process.env.SITE_URL ?? '').startsWith('https://');
    const cookieName = `${secure ? '__Secure-' : ''}better-auth.session_token`;

    return {
      cookieHeader: `${cookieName}=${signedToken}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`,
      eventId,
    };
  },
});

/**
 * Create a test user session.
 * Creates a real Better Auth user, session, and person record.
 * @param skipPerson - If true, skips creating person record (for onboarding tests)
 */
export const createTestSession = mutation({
  args: {
    fixtureKey: v.string(),
    email: v.string(),
    name: v.string(),
    username: v.string(),
    skipPerson: v.optional(v.boolean()),
  },
  returns: v.object({
    userId: v.string(),
    personId: v.union(v.null(), v.string()),
    sessionToken: v.string(),
  }),
  handler: async (ctx, args) => {
    assertFixtureAccess(args.fixtureKey);

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
 * Create a magic link token directly without sending email.
 * This bypasses the email sending entirely for E2E tests.
 */
export const createMagicLinkToken = mutation({
  args: {
    fixtureKey: v.string(),
    email: v.string(),
  },
  returns: v.object({ token: v.string(), url: v.string() }),
  handler: async (ctx, { fixtureKey, email }) => {
    assertFixtureAccess(fixtureKey);

    const now = Date.now();

    // Generate a random token (32 chars, alphanumeric)
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Create verification record in Better Auth format
    await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: 'verification',
        data: {
          identifier: token,
          value: JSON.stringify({ email }),
          expiresAt: now + 15 * 60 * 1000, // 15 minutes
          createdAt: now,
          updatedAt: now,
        },
      },
    });

    const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
    return {
      token,
      url: `${baseUrl}/api/auth/magic-link/verify?token=${token}`,
    };
  },
});

/**
 * Debug query to inspect verification records.
 */
export const debugVerifications = query({
  args: { fixtureKey: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, { fixtureKey }) => {
    assertFixtureAccess(fixtureKey);

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
    fixtureKey: v.string(),
    email: v.string(),
  },
  returns: v.union(v.null(), v.object({ url: v.string() })),
  handler: async (ctx, { fixtureKey, email }) => {
    assertFixtureAccess(fixtureKey);

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
      return null;
    }

    const valid = matchingVerifications[0] as VerificationRecord;

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
    fixtureKey: v.string(),
    creatorPersonId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    chosenDateTime: v.optional(v.number()),
  },
  returns: v.object({ eventId: v.string(), membershipId: v.string() }),
  handler: async (ctx, args) => {
    assertFixtureAccess(args.fixtureKey);

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
      memberCount: 1,
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
    fixtureKey: v.string(),
    eventId: v.string(),
    authorPersonId: v.string(),
    title: v.string(),
    content: v.string(),
  },
  returns: v.object({ postId: v.string() }),
  handler: async (ctx, args) => {
    assertFixtureAccess(args.fixtureKey);

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
    fixtureKey: v.string(),
    eventId: v.string(),
    creatorMembershipId: v.string(),
    name: v.optional(v.string()),
    maxUses: v.optional(v.number()),
  },
  returns: v.object({ inviteId: v.string(), inviteToken: v.string() }),
  handler: async (ctx, args) => {
    assertFixtureAccess(args.fixtureKey);

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
    fixtureKey: v.string(),
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
  returns: v.object({ membershipId: v.string() }),
  handler: async (ctx, args) => {
    assertFixtureAccess(args.fixtureKey);

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

    const event = await ctx.db.get(eventId);
    if (event) {
      await ctx.db.patch(eventId, {
        memberCount: (event.memberCount ?? 0) + 1,
      });
    }

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
    fixtureKey: v.string(),
    userIds: v.array(v.string()),
    personIds: v.array(v.string()),
    eventIds: v.array(v.string()),
    postIds: v.array(v.string()),
    inviteIds: v.array(v.string()),
    membershipIds: v.array(v.string()),
    verificationIdentifiers: v.optional(v.array(v.string())),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    assertFixtureAccess(args.fixtureKey);

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

    for (const identifier of args.verificationIdentifiers ?? []) {
      const verification = await ctx.runQuery(
        components.betterAuth.adapter.findOne,
        {
          model: 'verification',
          where: [{ field: 'identifier', operator: 'eq', value: identifier }],
        }
      );
      if (verification) {
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model: 'verification',
            where: [
              {
                field: '_id',
                operator: 'eq',
                value: verification._id as string,
              },
            ],
          },
        });
      }
    }

    // Better Auth data lives in its component. Delete sessions before users so
    // completed and interrupted runs cannot leave reusable credentials.
    for (const userId of args.userIds) {
      const sessions = await ctx.runQuery(
        components.betterAuth.adapter.findMany,
        {
          model: 'session',
          where: [{ field: 'userId', operator: 'eq', value: userId }],
          paginationOpts: { cursor: null, numItems: 100 },
        }
      );
      for (const session of sessions.page ?? []) {
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model: 'session',
            where: [
              { field: '_id', operator: 'eq', value: session._id as string },
            ],
          },
        });
      }

      const accounts = await ctx.runQuery(
        components.betterAuth.adapter.findMany,
        {
          model: 'account',
          where: [{ field: 'userId', operator: 'eq', value: userId }],
          paginationOpts: { cursor: null, numItems: 100 },
        }
      );
      for (const account of accounts.page ?? []) {
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model: 'account',
            where: [
              { field: '_id', operator: 'eq', value: account._id as string },
            ],
          },
        });
      }

      const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: 'user',
        where: [{ field: '_id', operator: 'eq', value: userId }],
      });
      if (user) {
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model: 'user',
            where: [{ field: '_id', operator: 'eq', value: userId }],
          },
        });
      }
    }

    // Never report a successful cleanup while fixture records remain. The
    // deletion loops are idempotent for interrupted runs, while these
    // postconditions make leaks visible to Maestro and CI.
    for (const id of args.postIds) {
      if (await ctx.db.get(id as Id<'posts'>)) {
        throw new Error('E2E fixture cleanup was incomplete');
      }
    }
    for (const id of args.membershipIds) {
      if (await ctx.db.get(id as Id<'memberships'>)) {
        throw new Error('E2E fixture cleanup was incomplete');
      }
    }
    for (const id of args.eventIds) {
      if (await ctx.db.get(id as Id<'events'>)) {
        throw new Error('E2E fixture cleanup was incomplete');
      }
    }
    for (const id of args.personIds) {
      if (await ctx.db.get(id as Id<'persons'>)) {
        throw new Error('E2E fixture cleanup was incomplete');
      }
    }
    for (const identifier of args.verificationIdentifiers ?? []) {
      const verification = await ctx.runQuery(
        components.betterAuth.adapter.findOne,
        {
          model: 'verification',
          where: [{ field: 'identifier', operator: 'eq', value: identifier }],
        }
      );
      if (verification) throw new Error('E2E fixture cleanup was incomplete');
    }
    for (const userId of args.userIds) {
      const session = await ctx.runQuery(
        components.betterAuth.adapter.findOne,
        {
          model: 'session',
          where: [{ field: 'userId', operator: 'eq', value: userId }],
        }
      );
      const account = await ctx.runQuery(
        components.betterAuth.adapter.findOne,
        {
          model: 'account',
          where: [{ field: 'userId', operator: 'eq', value: userId }],
        }
      );
      const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: 'user',
        where: [{ field: '_id', operator: 'eq', value: userId }],
      });
      if (session || account || user) {
        throw new Error('E2E fixture cleanup was incomplete');
      }
    }

    return { success: true };
  },
});
