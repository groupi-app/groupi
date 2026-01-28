/**
 * Migration mutations for importing data from Supabase.
 *
 * IMPORTANT: These mutations are meant to be called ONLY during migration.
 * They bypass normal authentication for bulk data import.
 *
 * After migration, these should be removed or disabled.
 */

import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { components } from '../_generated/api';

// Migration secret to prevent accidental use
const MIGRATION_SECRET =
  process.env.MIGRATION_SECRET || 'groupi-migration-2024';

// Validate migration secret (exported for use by migration scripts)
export function validateMigrationSecret(secret: string) {
  if (secret !== MIGRATION_SECRET) {
    throw new Error('Invalid migration secret');
  }
}

// Type for RSVP/Availability status
const statusValidator = v.union(
  v.literal('YES'),
  v.literal('MAYBE'),
  v.literal('NO'),
  v.literal('PENDING')
);

// Type for membership role
const roleValidator = v.union(
  v.literal('ORGANIZER'),
  v.literal('MODERATOR'),
  v.literal('ATTENDEE')
);

// Type for notification type
const notificationTypeValidator = v.union(
  v.literal('EVENT_EDITED'),
  v.literal('NEW_POST'),
  v.literal('NEW_REPLY'),
  v.literal('DATE_CHOSEN'),
  v.literal('DATE_CHANGED'),
  v.literal('DATE_RESET'),
  v.literal('USER_JOINED'),
  v.literal('USER_LEFT'),
  v.literal('USER_PROMOTED'),
  v.literal('USER_DEMOTED'),
  v.literal('USER_RSVP'),
  v.literal('USER_MENTIONED'),
  v.literal('EVENT_REMINDER')
);

// Type for notification method type
const notificationMethodTypeValidator = v.union(
  v.literal('EMAIL'),
  v.literal('PUSH'),
  v.literal('WEBHOOK')
);

// Type for webhook format
const webhookFormatValidator = v.union(
  v.literal('DISCORD'),
  v.literal('SLACK'),
  v.literal('TEAMS'),
  v.literal('GENERIC'),
  v.literal('CUSTOM')
);

/**
 * Create a Better Auth user via the component's adapter.
 * Returns the created user's ID.
 */
export const createAuthUser = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    username: v.string(),
    // imageUrl omitted - Clerk-hosted images will become inaccessible
  },
  handler: async (ctx, { email, name, username }) => {
    const now = Date.now();

    // Create user in Better Auth component via adapter
    const result = await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: 'user',
        data: {
          email,
          name,
          emailVerified: true, // Migrated users are already verified
          username: username.toLowerCase(),
          displayUsername: username,
          createdAt: now,
          updatedAt: now,
        },
      },
    });

    return result;
  },
});

/**
 * Create multiple Better Auth users in batch.
 * Returns mapping of old Clerk ID to new Better Auth user ID.
 */
export const createAuthUsers = internalMutation({
  args: {
    users: v.array(
      v.object({
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        username: v.string(),
        // imageUrl omitted - Clerk-hosted images will become inaccessible
      })
    ),
  },
  handler: async (ctx, { users }) => {
    const mapping: Record<string, string> = {};
    const now = Date.now();

    for (const user of users) {
      // Create user in Better Auth component via adapter
      // Note: image is omitted since Clerk URLs won't work after migration
      const result = await ctx.runMutation(
        components.betterAuth.adapter.create,
        {
          input: {
            model: 'user',
            data: {
              email: user.email,
              name: user.name,
              emailVerified: true, // Migrated users are already verified
              username: user.username.toLowerCase(),
              displayUsername: user.username,
              createdAt: now,
              updatedAt: now,
            },
          },
        }
      );

      // The adapter returns the created document with _id
      if (result && result._id) {
        mapping[user.clerkId] = result._id.toString();
      }
    }

    console.log(`Created ${Object.keys(mapping).length} Better Auth users`);
    return mapping;
  },
});

// Type for reminder offset
const reminderOffsetValidator = v.union(
  v.literal('30_MINUTES'),
  v.literal('1_HOUR'),
  v.literal('2_HOURS'),
  v.literal('4_HOURS'),
  v.literal('1_DAY'),
  v.literal('2_DAYS'),
  v.literal('3_DAYS'),
  v.literal('1_WEEK'),
  v.literal('2_WEEKS'),
  v.literal('4_WEEKS')
);

/**
 * Clear a batch of app tables (split to avoid timeout).
 */
export const clearAppTablesBatch1 = internalMutation({
  args: {},
  handler: async ctx => {
    const clearTable = async (
      tableName:
        | 'availabilities'
        | 'notificationSettings'
        | 'notificationMethods'
        | 'notifications'
    ) => {
      const docs = await ctx.db.query(tableName).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      console.log(`Cleared ${docs.length} records from ${tableName}`);
      return docs.length;
    };

    let total = 0;
    total += await clearTable('availabilities');
    total += await clearTable('notificationSettings');
    total += await clearTable('notificationMethods');
    total += await clearTable('notifications');
    return { cleared: total };
  },
});

/**
 * Clear a batch of app tables (split to avoid timeout).
 */
export const clearAppTablesBatch2 = internalMutation({
  args: {},
  handler: async ctx => {
    const clearTable = async (
      tableName:
        | 'attachments'
        | 'replies'
        | 'posts'
        | 'invites'
        | 'potentialDateTimes'
    ) => {
      const docs = await ctx.db.query(tableName).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      console.log(`Cleared ${docs.length} records from ${tableName}`);
      return docs.length;
    };

    let total = 0;
    total += await clearTable('attachments');
    total += await clearTable('replies');
    total += await clearTable('posts');
    total += await clearTable('invites');
    total += await clearTable('potentialDateTimes');
    return { cleared: total };
  },
});

/**
 * Clear a batch of app tables (split to avoid timeout).
 */
export const clearAppTablesBatch3 = internalMutation({
  args: {},
  handler: async ctx => {
    const clearTable = async (
      tableName:
        | 'memberships'
        | 'personSettings'
        | 'events'
        | 'persons'
        | 'mutedEvents'
        | 'mutedPosts'
        | 'eventBans'
        | 'eventReminders'
        | 'emailVerifications'
    ) => {
      const docs = await ctx.db.query(tableName).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      console.log(`Cleared ${docs.length} records from ${tableName}`);
      return docs.length;
    };

    let total = 0;
    total += await clearTable('memberships');
    total += await clearTable('personSettings');
    total += await clearTable('events');
    total += await clearTable('persons');
    total += await clearTable('mutedEvents');
    total += await clearTable('mutedPosts');
    total += await clearTable('eventBans');
    total += await clearTable('eventReminders');
    total += await clearTable('emailVerifications');
    return { cleared: total };
  },
});

/**
 * Clear Better Auth users (batched to avoid timeout).
 */
export const clearBetterAuthUsers = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const allUsersResult = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: 'user' as const,
        where: [],
        paginationOpts: { cursor: null, numItems: limit },
      }
    );

    let deleted = 0;
    if (allUsersResult?.page && allUsersResult.page.length > 0) {
      for (const user of allUsersResult.page) {
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model: 'user' as const,
            where: [{ field: '_id', operator: 'eq' as const, value: user._id }],
          },
        });
        deleted++;
      }
      console.log(`Deleted ${deleted} Better Auth users`);
    }

    return { deleted, hasMore: deleted === limit };
  },
});

/**
 * Clear Better Auth sessions.
 */
export const clearBetterAuthSessions = internalMutation({
  args: {},
  handler: async ctx => {
    const allSessionsResult = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: 'session' as const,
        where: [],
        paginationOpts: { cursor: null, numItems: 1000 },
      }
    );

    let deleted = 0;
    if (allSessionsResult?.page && allSessionsResult.page.length > 0) {
      for (const session of allSessionsResult.page) {
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model: 'session' as const,
            where: [
              { field: '_id', operator: 'eq' as const, value: session._id },
            ],
          },
        });
        deleted++;
      }
      console.log(`Deleted ${deleted} Better Auth sessions`);
    }

    return { deleted };
  },
});

/**
 * Clear Better Auth accounts and verifications.
 */
export const clearBetterAuthOther = internalMutation({
  args: {},
  handler: async ctx => {
    let deleted = 0;

    const allAccountsResult = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: 'account' as const,
        where: [],
        paginationOpts: { cursor: null, numItems: 1000 },
      }
    );
    if (allAccountsResult?.page && allAccountsResult.page.length > 0) {
      for (const account of allAccountsResult.page) {
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model: 'account' as const,
            where: [
              { field: '_id', operator: 'eq' as const, value: account._id },
            ],
          },
        });
        deleted++;
      }
      console.log(
        `Deleted ${allAccountsResult.page.length} Better Auth accounts`
      );
    }

    const allVerificationsResult = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: 'verification' as const,
        where: [],
        paginationOpts: { cursor: null, numItems: 1000 },
      }
    );
    if (
      allVerificationsResult?.page &&
      allVerificationsResult.page.length > 0
    ) {
      for (const verification of allVerificationsResult.page) {
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model: 'verification' as const,
            where: [
              {
                field: '_id',
                operator: 'eq' as const,
                value: verification._id,
              },
            ],
          },
        });
        deleted++;
      }
      console.log(
        `Deleted ${allVerificationsResult.page.length} Better Auth verifications`
      );
    }

    return { deleted };
  },
});

/**
 * Clear all existing data from tables (kept for backwards compatibility).
 * Note: This may timeout with large datasets. Use the batched versions instead.
 */
export const clearAllData = internalMutation({
  args: {},
  handler: async () => {
    // This is now a no-op - use the action that calls batched mutations instead
    console.log(
      'clearAllData called - use clearAllDataForMigration action instead'
    );
    return { success: true };
  },
});

/**
 * Migrate persons - creates person records linked to Better Auth users.
 * The Better Auth users must be created first via createAuthUsers.
 * Returns mapping of old Clerk user ID to new Convex person ID.
 */
export const migratePersons = internalMutation({
  args: {
    persons: v.array(
      v.object({
        clerkUserId: v.string(),
        betterAuthUserId: v.string(), // The Better Auth user ID from createAuthUsers
        bio: v.optional(v.string()), // Name stored in bio
      })
    ),
  },
  handler: async (ctx, { persons }) => {
    const mapping: Record<string, string> = {};

    for (const person of persons) {
      // Create person linked to Better Auth user
      const personId = await ctx.db.insert('persons', {
        userId: person.betterAuthUserId,
        bio: person.bio,
        updatedAt: Date.now(),
      });

      mapping[person.clerkUserId] = personId;
    }

    console.log(`Migrated ${persons.length} persons`);
    return mapping;
  },
});

/**
 * Create person settings for migrated persons.
 */
export const migratePersonSettings = internalMutation({
  args: {
    settings: v.array(
      v.object({
        oldPersonId: v.string(), // Old Clerk user ID
        newPersonId: v.string(), // New Convex person ID
      })
    ),
  },
  handler: async (ctx, { settings }) => {
    const mapping: Record<string, string> = {};

    for (const setting of settings) {
      const settingsId = await ctx.db.insert('personSettings', {
        personId: setting.newPersonId as Id<'persons'>,
        updatedAt: Date.now(),
      });
      mapping[setting.oldPersonId] = settingsId;
    }

    console.log(`Migrated ${settings.length} person settings`);
    return mapping;
  },
});

/**
 * Migrate events.
 * Returns mapping of old event ID to new Convex event ID.
 */
export const migrateEvents = internalMutation({
  args: {
    events: v.array(
      v.object({
        oldId: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        location: v.optional(v.string()),
        chosenDateTime: v.optional(v.number()),
        chosenEndDateTime: v.optional(v.number()),
        creatorId: v.string(), // New Convex person ID
        createdAt: v.number(),
        updatedAt: v.number(),
        timezone: v.string(),
        reminderOffset: v.optional(reminderOffsetValidator),
      })
    ),
  },
  handler: async (ctx, { events }) => {
    const mapping: Record<string, string> = {};

    for (const event of events) {
      const eventId = await ctx.db.insert('events', {
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        chosenDateTime: event.chosenDateTime,
        chosenEndDateTime: event.chosenEndDateTime,
        creatorId: event.creatorId as Id<'persons'>,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        timezone: event.timezone,
        potentialDateTimes: [], // Will be populated from potentialDateTimes table
        reminderOffset: event.reminderOffset,
      });

      mapping[event.oldId] = eventId;
    }

    console.log(`Migrated ${events.length} events`);
    return mapping;
  },
});

/**
 * Migrate memberships.
 * Returns mapping of old membership ID to new Convex membership ID.
 */
export const migrateMemberships = internalMutation({
  args: {
    memberships: v.array(
      v.object({
        oldId: v.string(),
        personId: v.string(), // New Convex person ID
        eventId: v.string(), // New Convex event ID
        role: roleValidator,
        rsvpStatus: statusValidator,
      })
    ),
  },
  handler: async (ctx, { memberships }) => {
    const mapping: Record<string, string> = {};

    for (const membership of memberships) {
      const membershipId = await ctx.db.insert('memberships', {
        personId: membership.personId as Id<'persons'>,
        eventId: membership.eventId as Id<'events'>,
        role: membership.role,
        rsvpStatus: membership.rsvpStatus,
        updatedAt: Date.now(),
      });

      mapping[membership.oldId] = membershipId;
    }

    console.log(`Migrated ${memberships.length} memberships`);
    return mapping;
  },
});

/**
 * Migrate potential date times.
 * Returns mapping of old ID to new Convex ID.
 */
export const migratePotentialDateTimes = internalMutation({
  args: {
    potentialDateTimes: v.array(
      v.object({
        oldId: v.string(),
        eventId: v.string(), // New Convex event ID
        dateTime: v.number(),
        endDateTime: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { potentialDateTimes }) => {
    const mapping: Record<string, string> = {};

    for (const pdt of potentialDateTimes) {
      const pdtId = await ctx.db.insert('potentialDateTimes', {
        eventId: pdt.eventId as Id<'events'>,
        dateTime: pdt.dateTime,
        endDateTime: pdt.endDateTime,
        updatedAt: Date.now(),
      });

      mapping[pdt.oldId] = pdtId;
    }

    console.log(`Migrated ${potentialDateTimes.length} potential date times`);
    return mapping;
  },
});

/**
 * Migrate availabilities.
 */
export const migrateAvailabilities = internalMutation({
  args: {
    availabilities: v.array(
      v.object({
        membershipId: v.string(), // New Convex membership ID
        potentialDateTimeId: v.string(), // New Convex PDT ID
        status: statusValidator,
      })
    ),
  },
  handler: async (ctx, { availabilities }) => {
    for (const availability of availabilities) {
      await ctx.db.insert('availabilities', {
        membershipId: availability.membershipId as Id<'memberships'>,
        potentialDateTimeId:
          availability.potentialDateTimeId as Id<'potentialDateTimes'>,
        status: availability.status,
        updatedAt: Date.now(),
      });
    }

    console.log(`Migrated ${availabilities.length} availabilities`);
    return { count: availabilities.length };
  },
});

/**
 * Migrate posts.
 * Returns mapping of old post ID to new Convex post ID.
 */
export const migratePosts = internalMutation({
  args: {
    posts: v.array(
      v.object({
        oldId: v.string(),
        title: v.string(),
        content: v.string(),
        editedAt: v.number(),
        authorId: v.string(), // New Convex person ID
        eventId: v.string(), // New Convex event ID
        membershipId: v.optional(v.string()), // New Convex membership ID
      })
    ),
  },
  handler: async (ctx, { posts }) => {
    const mapping: Record<string, string> = {};

    for (const post of posts) {
      const postId = await ctx.db.insert('posts', {
        title: post.title,
        content: post.content,
        editedAt: post.editedAt,
        authorId: post.authorId as Id<'persons'>,
        eventId: post.eventId as Id<'events'>,
        membershipId: post.membershipId
          ? (post.membershipId as Id<'memberships'>)
          : undefined,
        updatedAt: post.editedAt,
      });

      mapping[post.oldId] = postId;
    }

    console.log(`Migrated ${posts.length} posts`);
    return mapping;
  },
});

/**
 * Migrate replies.
 */
export const migrateReplies = internalMutation({
  args: {
    replies: v.array(
      v.object({
        text: v.string(),
        authorId: v.string(), // New Convex person ID
        postId: v.string(), // New Convex post ID
        membershipId: v.optional(v.string()), // New Convex membership ID
      })
    ),
  },
  handler: async (ctx, { replies }) => {
    for (const reply of replies) {
      await ctx.db.insert('replies', {
        text: reply.text,
        authorId: reply.authorId as Id<'persons'>,
        postId: reply.postId as Id<'posts'>,
        membershipId: reply.membershipId
          ? (reply.membershipId as Id<'memberships'>)
          : undefined,
        updatedAt: Date.now(),
      });
    }

    console.log(`Migrated ${replies.length} replies`);
    return { count: replies.length };
  },
});

/**
 * Migrate invites.
 */
export const migrateInvites = internalMutation({
  args: {
    invites: v.array(
      v.object({
        eventId: v.string(), // New Convex event ID
        createdById: v.string(), // New Convex membership ID
        token: v.string(),
        expiresAt: v.optional(v.number()),
        usesRemaining: v.optional(v.number()),
        maxUses: v.optional(v.number()),
        usesTotal: v.optional(v.number()),
        name: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { invites }) => {
    for (const invite of invites) {
      await ctx.db.insert('invites', {
        eventId: invite.eventId as Id<'events'>,
        createdById: invite.createdById as Id<'memberships'>,
        token: invite.token,
        expiresAt: invite.expiresAt,
        usesRemaining: invite.usesRemaining,
        maxUses: invite.maxUses,
        usesTotal: invite.usesTotal,
        name: invite.name,
        updatedAt: Date.now(),
      });
    }

    console.log(`Migrated ${invites.length} invites`);
    return { count: invites.length };
  },
});

/**
 * Migrate notifications.
 */
export const migrateNotifications = internalMutation({
  args: {
    notifications: v.array(
      v.object({
        personId: v.string(), // New Convex person ID
        type: notificationTypeValidator,
        read: v.boolean(),
        eventId: v.optional(v.string()), // New Convex event ID
        postId: v.optional(v.string()), // New Convex post ID
        authorId: v.optional(v.string()), // New Convex person ID
        datetime: v.optional(v.number()),
        rsvp: v.optional(statusValidator),
      })
    ),
  },
  handler: async (ctx, { notifications }) => {
    for (const notification of notifications) {
      await ctx.db.insert('notifications', {
        personId: notification.personId as Id<'persons'>,
        type: notification.type,
        read: notification.read,
        eventId: notification.eventId
          ? (notification.eventId as Id<'events'>)
          : undefined,
        postId: notification.postId
          ? (notification.postId as Id<'posts'>)
          : undefined,
        authorId: notification.authorId
          ? (notification.authorId as Id<'persons'>)
          : undefined,
        datetime: notification.datetime,
        rsvp: notification.rsvp,
        updatedAt: Date.now(),
      });
    }

    console.log(`Migrated ${notifications.length} notifications`);
    return { count: notifications.length };
  },
});

/**
 * Migrate notification methods.
 * Returns mapping of old ID to new Convex ID.
 */
export const migrateNotificationMethods = internalMutation({
  args: {
    methods: v.array(
      v.object({
        oldId: v.string(),
        settingsId: v.string(), // New Convex person settings ID
        type: notificationMethodTypeValidator,
        enabled: v.boolean(),
        name: v.optional(v.string()),
        value: v.string(),
        customTemplate: v.optional(v.string()),
        webhookFormat: v.optional(webhookFormatValidator),
        webhookHeaders: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, { methods }) => {
    const mapping: Record<string, string> = {};

    for (const method of methods) {
      const methodId = await ctx.db.insert('notificationMethods', {
        settingsId: method.settingsId as Id<'personSettings'>,
        type: method.type,
        enabled: method.enabled,
        name: method.name,
        value: method.value,
        customTemplate: method.customTemplate,
        webhookFormat: method.webhookFormat,
        webhookHeaders: method.webhookHeaders,
        updatedAt: Date.now(),
      });

      mapping[method.oldId] = methodId;
    }

    console.log(`Migrated ${methods.length} notification methods`);
    return mapping;
  },
});

/**
 * Migrate notification settings.
 */
export const migrateNotificationSettings = internalMutation({
  args: {
    settings: v.array(
      v.object({
        notificationType: notificationTypeValidator,
        methodId: v.string(), // New Convex method ID
        enabled: v.boolean(),
      })
    ),
  },
  handler: async (ctx, { settings }) => {
    for (const setting of settings) {
      await ctx.db.insert('notificationSettings', {
        notificationType: setting.notificationType,
        methodId: setting.methodId as Id<'notificationMethods'>,
        enabled: setting.enabled,
        updatedAt: Date.now(),
      });
    }

    console.log(`Migrated ${settings.length} notification settings`);
    return { count: settings.length };
  },
});
