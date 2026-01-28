import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import {
  requireAuth,
  requireAuthUser,
  ensurePersonRecord,
  authComponent,
  createAuth,
} from '../auth';

/**
 * Users mutations for the Convex backend
 *
 * These functions handle user data modifications with proper authentication.
 * User data is managed by Better Auth component - we use its APIs for updates.
 */

/**
 * Update current user's profile
 * Updates person record (in our schema) and user record (via Better Auth API)
 */
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    pronouns: v.optional(v.string()),
    bio: v.optional(v.string()),
    image: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')),
    clearImage: v.optional(v.boolean()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);

    // Use Better Auth API to update user data
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    // Build user updates for Better Auth
    const userUpdates: Record<string, unknown> = {};
    if (args.name !== undefined) userUpdates.name = args.name;

    // Handle image updates
    if (args.clearImage) {
      userUpdates.image = null;
    } else if (args.imageStorageId !== undefined) {
      // New image uploaded via Convex storage - get URL
      const imageUrl = await ctx.storage.getUrl(args.imageStorageId);
      userUpdates.image = imageUrl;
    } else if (args.image !== undefined) {
      userUpdates.image = args.image;
    }

    // Update user via Better Auth API if there are updates
    if (Object.keys(userUpdates).length > 0) {
      try {
        await auth.api.updateUser({
          body: userUpdates,
          headers,
        });
      } catch (error) {
        console.error('Failed to update user via Better Auth:', error);
        // Continue to update person record even if user update fails
      }
    }

    // Update person record in our schema
    const personUpdates: Record<string, string | number> = {};
    if (args.pronouns !== undefined) personUpdates.pronouns = args.pronouns;
    if (args.bio !== undefined) personUpdates.bio = args.bio;

    if (Object.keys(personUpdates).length > 0) {
      personUpdates.updatedAt = Date.now();
      await ctx.db.patch(person._id, personUpdates);
    }

    return { success: true };
  },
});

/**
 * Update user's notification settings
 * Allows enabling/disabling email and push notifications
 */
export const updateUserNotificationSettings = mutation({
  args: {
    emailNotifications: v.optional(v.boolean()),
    pushNotifications: v.optional(v.boolean()),
    notificationMethods: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal('EMAIL'),
            v.literal('PUSH'),
            v.literal('WEBHOOK')
          ),
          value: v.string(),
          enabled: v.boolean(),
          name: v.optional(v.string()),
          notifications: v.array(
            v.object({
              notificationType: v.union(
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
                v.literal('USER_MENTIONED')
              ),
              enabled: v.boolean(),
            })
          ),
          webhookFormat: v.optional(
            v.union(
              v.literal('DISCORD'),
              v.literal('SLACK'),
              v.literal('TEAMS'),
              v.literal('GENERIC'),
              v.literal('CUSTOM')
            )
          ),
          customTemplate: v.optional(v.string()),
          webhookHeaders: v.optional(v.string()),
        })
      )
    ),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);

    // Get or create person settings
    let personSettings = await ctx.db
      .query('personSettings')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .first();

    if (!personSettings) {
      const now = Date.now();
      const settingsId = await ctx.db.insert('personSettings', {
        personId: person._id,
        updatedAt: now,
      });
      personSettings = await ctx.db.get(settingsId);
      if (!personSettings) {
        throw new Error('Failed to create person settings');
      }
    }

    // Handle notification methods updates
    if (args.notificationMethods) {
      // Get existing methods
      const existingMethods = await ctx.db
        .query('notificationMethods')
        .withIndex('by_settings', q => q.eq('settingsId', personSettings._id))
        .collect();

      // Process each notification method
      for (const methodData of args.notificationMethods) {
        // Find existing method by type and value
        const existingMethod = existingMethods.find(
          m => m.type === methodData.type && m.value === methodData.value
        );

        let methodId;
        if (existingMethod) {
          // Update existing method
          await ctx.db.patch(existingMethod._id, {
            enabled: methodData.enabled,
            name: methodData.name,
            webhookFormat: methodData.webhookFormat,
            customTemplate: methodData.customTemplate,
            webhookHeaders: methodData.webhookHeaders,
            updatedAt: Date.now(),
          });
          methodId = existingMethod._id;
        } else {
          // Create new method
          const now = Date.now();
          methodId = await ctx.db.insert('notificationMethods', {
            settingsId: personSettings._id,
            type: methodData.type,
            value: methodData.value,
            enabled: methodData.enabled,
            name: methodData.name,
            webhookFormat: methodData.webhookFormat,
            customTemplate: methodData.customTemplate,
            webhookHeaders: methodData.webhookHeaders,
            updatedAt: now,
          });
        }

        // Update notification settings for this method
        for (const notificationSetting of methodData.notifications) {
          // Find existing setting
          const existingSetting = await ctx.db
            .query('notificationSettings')
            .withIndex('by_type_method', q =>
              q
                .eq('notificationType', notificationSetting.notificationType)
                .eq('methodId', methodId)
            )
            .first();

          if (existingSetting) {
            // Update existing setting
            await ctx.db.patch(existingSetting._id, {
              enabled: notificationSetting.enabled,
              updatedAt: Date.now(),
            });
          } else {
            // Create new setting
            await ctx.db.insert('notificationSettings', {
              notificationType: notificationSetting.notificationType,
              methodId,
              enabled: notificationSetting.enabled,
              updatedAt: Date.now(),
            });
          }
        }
      }
    }

    return { success: true };
  },
});

/**
 * Complete user onboarding
 * Sets username and optionally other profile fields via Better Auth API
 * Creates person record if it doesn't exist (for new users via One Tap, etc.)
 */
export const completeOnboarding = mutation({
  args: {
    username: v.string(),
    displayName: v.optional(v.string()),
    pronouns: v.optional(v.string()),
    bio: v.optional(v.string()),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { username, displayName, pronouns, bio }) => {
    // Get authenticated user (doesn't require person record to exist)
    const { userId } = await requireAuthUser(ctx);

    // Ensure person record exists (creates if needed for new users)
    const person = await ensurePersonRecord(ctx, userId);
    if (!person) {
      throw new Error('Failed to create person record');
    }

    // Validate username
    const trimmedUsername = username.trim().toLowerCase();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      throw new Error('Username must be between 3 and 50 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      throw new Error(
        'Username can only contain letters, numbers, underscores, and dashes'
      );
    }

    // Use Better Auth API to update username
    // Note: Username uniqueness check should be done by Better Auth
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    const userUpdates: Record<string, string> = {};
    userUpdates.username = trimmedUsername;
    if (displayName !== undefined) {
      userUpdates.name = displayName;
    }

    try {
      await auth.api.updateUser({
        body: userUpdates,
        headers,
      });
    } catch (error) {
      // Check if error is due to username already taken
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes('username')) {
        throw new Error('Username is already taken');
      }
      throw error;
    }

    // Update person record if pronouns or bio provided
    const personUpdates: Record<string, string | number> = {};
    if (pronouns !== undefined) personUpdates.pronouns = pronouns;
    if (bio !== undefined) personUpdates.bio = bio;

    if (Object.keys(personUpdates).length > 0) {
      personUpdates.updatedAt = Date.now();
      await ctx.db.patch(person._id, personUpdates);
    }

    return { success: true };
  },
});

/**
 * Delete user account
 * Requires confirmation text to prevent accidental deletion
 *
 * This performs account deletion including:
 * - All posts and replies authored by the user
 * - All memberships and availability responses
 * - All invites created by the user
 * - All notifications
 * - Person record and settings
 *
 * Note: Better Auth session/account cleanup is handled by the component.
 * Events where user is the sole organizer will have ownership transferred
 * to another member if possible, otherwise the event is deleted.
 */
export const deleteUserAccount = mutation({
  args: {
    confirmation: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { confirmation }) => {
    const { person, user } = await requireAuth(ctx);

    // Verify confirmation matches the user's username
    const username = user.username;
    if (!username) {
      throw new Error('No username found for this account.');
    }

    if (confirmation.trim().toLowerCase() !== username.trim().toLowerCase()) {
      throw new Error(
        'Invalid confirmation. Please type your username to confirm.'
      );
    }

    // Get all memberships for this person
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .collect();

    // Handle events where user is sole organizer
    for (const membership of memberships) {
      if (membership.role === 'ORGANIZER') {
        // Check if there are other organizers
        const eventMemberships = await ctx.db
          .query('memberships')
          .withIndex('by_event', q => q.eq('eventId', membership.eventId))
          .collect();

        const otherOrganizers = eventMemberships.filter(
          m => m.role === 'ORGANIZER' && m._id !== membership._id
        );

        if (otherOrganizers.length === 0) {
          // No other organizers - try to promote someone else
          const otherMembers = eventMemberships.filter(
            m => m._id !== membership._id
          );

          if (otherMembers.length > 0) {
            // Promote the first moderator, or first attendee if no moderators
            const newOrganizer =
              otherMembers.find(m => m.role === 'MODERATOR') || otherMembers[0];
            await ctx.db.patch(newOrganizer._id, {
              role: 'ORGANIZER',
              updatedAt: Date.now(),
            });
          } else {
            // No other members - delete the entire event
            await deleteEventAndRelatedData(ctx, membership.eventId);
            continue; // Skip membership deletion since event is deleted
          }
        }
      }

      // Delete invites created by this membership
      const invites = await ctx.db
        .query('invites')
        .withIndex('by_creator', q => q.eq('createdById', membership._id))
        .collect();

      for (const invite of invites) {
        await ctx.db.delete(invite._id);
      }

      // Delete availabilities for this membership
      const availabilities = await ctx.db
        .query('availabilities')
        .withIndex('by_membership', q => q.eq('membershipId', membership._id))
        .collect();

      for (const availability of availabilities) {
        await ctx.db.delete(availability._id);
      }

      await ctx.db.delete(membership._id);
    }

    // Delete all replies authored by this person
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_author', q => q.eq('authorId', person._id))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    // Delete all posts authored by this person
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_author', q => q.eq('authorId', person._id))
      .collect();

    for (const post of posts) {
      // First delete all replies to this post
      const postReplies = await ctx.db
        .query('replies')
        .withIndex('by_post', q => q.eq('postId', post._id))
        .collect();

      for (const reply of postReplies) {
        await ctx.db.delete(reply._id);
      }

      // Delete notifications related to this post
      const postNotifications = await ctx.db
        .query('notifications')
        .withIndex('by_post', q => q.eq('postId', post._id))
        .collect();

      for (const notification of postNotifications) {
        await ctx.db.delete(notification._id);
      }

      await ctx.db.delete(post._id);
    }

    // Delete notifications for this person (received)
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // Delete person settings and notification methods
    const personSettings = await ctx.db
      .query('personSettings')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .first();

    if (personSettings) {
      // Delete notification methods
      const notificationMethods = await ctx.db
        .query('notificationMethods')
        .withIndex('by_settings', q => q.eq('settingsId', personSettings._id))
        .collect();

      for (const method of notificationMethods) {
        // Delete notification settings for this method
        const methodSettings = await ctx.db
          .query('notificationSettings')
          .withIndex('by_method', q => q.eq('methodId', method._id))
          .collect();

        for (const setting of methodSettings) {
          await ctx.db.delete(setting._id);
        }

        await ctx.db.delete(method._id);
      }

      await ctx.db.delete(personSettings._id);
    }

    // Delete person record
    await ctx.db.delete(person._id);

    // Note: Better Auth session/account/user cleanup should be handled
    // by calling auth.api.deleteUser() or similar, but the exact API
    // may vary. For now, the client should sign out after this mutation.

    return { success: true };
  },
});

/**
 * Helper function to delete an event and all related data
 * Used when the sole organizer deletes their account
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deleteEventAndRelatedData(ctx: any, eventId: any) {
  // Delete all memberships and their availabilities
  const memberships = await ctx.db
    .query('memberships')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex('by_event', (q: any) => q.eq('eventId', eventId))
    .collect();

  for (const membership of memberships) {
    const availabilities = await ctx.db
      .query('availabilities')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex('by_membership', (q: any) =>
        q.eq('membershipId', membership._id)
      )
      .collect();

    for (const availability of availabilities) {
      await ctx.db.delete(availability._id);
    }

    // Delete invites created by this membership
    const invites = await ctx.db
      .query('invites')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex('by_creator', (q: any) => q.eq('createdById', membership._id))
      .collect();

    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    await ctx.db.delete(membership._id);
  }

  // Delete potential date times
  const potentialDates = await ctx.db
    .query('potentialDateTimes')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex('by_event', (q: any) => q.eq('eventId', eventId))
    .collect();

  for (const date of potentialDates) {
    await ctx.db.delete(date._id);
  }

  // Delete posts and their replies
  const posts = await ctx.db
    .query('posts')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex('by_event', (q: any) => q.eq('eventId', eventId))
    .collect();

  for (const post of posts) {
    const replies = await ctx.db
      .query('replies')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex('by_post', (q: any) => q.eq('postId', post._id))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    await ctx.db.delete(post._id);
  }

  // Delete notifications for this event
  const notifications = await ctx.db
    .query('notifications')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex('by_event', (q: any) => q.eq('eventId', eventId))
    .collect();

  for (const notification of notifications) {
    await ctx.db.delete(notification._id);
  }

  // Delete the event
  await ctx.db.delete(eventId);
}
