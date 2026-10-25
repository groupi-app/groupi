import { removeGroupMembershipsForPerson } from '../groups/model';
import { deletePersonApplications } from '../eventApplications/cleanup';
import { claimUpload } from '../files/uploads';
import { validateImageMetadata } from '../files/imageRules';
import { saveAvatarForUser } from '../files/images';
import { mutation } from '../_generated/server';
import { components } from '../_generated/api';
import type { PaginationOptions, PaginationResult } from 'convex/server';
import type { Doc as AuthDoc } from '../betterAuth/_generated/dataModel';
import { v } from 'convex/values';
import {
  requireAuth,
  requireAuthUser,
  ensurePersonRecord,
  authComponent,
  createAuth,
  type ExtendedAuthUser,
} from '../auth';
import { dispatchAddonLifecycle } from '../addons/lifecycle';
import { getOrComputeMemberCount } from '../lib/memberCount';
import { assertNoOwnedResources } from '../accountResolution/model';
import type { MutationCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';
import { deleteListsForPerson } from '../inviteLists/model';

/** Match the verification formats emitted by the installed auth plugins. */
function isAccountVerification(
  verification: AuthDoc<'verification'>,
  user: ExtendedAuthUser
): boolean {
  const email = user.email.toLowerCase();
  if (
    ['sign-in', 'email-verification', 'forget-password'].some(
      type => verification.identifier === `${type}-otp-${email}`
    )
  ) {
    return true;
  }
  if (
    (verification.identifier.startsWith('reset-password:') ||
      verification.identifier.startsWith('delete-account-')) &&
    verification.value === user._id
  ) {
    return true;
  }

  let value: unknown;
  try {
    value = JSON.parse(verification.value);
  } catch {
    return false;
  }
  if (!value || typeof value !== 'object') return false;

  // Magic-link tokens store { email, name? } under a random identifier.
  if (
    'email' in value &&
    typeof value.email === 'string' &&
    value.email.toLowerCase() === email
  ) {
    return true;
  }
  // Passkey challenges bind the challenge to a user ID when authenticated.
  return (
    'expectedChallenge' in value &&
    typeof value.expectedChallenge === 'string' &&
    'userData' in value &&
    value.userData !== null &&
    typeof value.userData === 'object' &&
    'id' in value.userData &&
    value.userData.id === user._id
  );
}

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

    // Storage avatars share REST ownership and lifecycle checks. Never swallow
    // failures: the mutation must leave the previous avatar intact.
    if (args.clearImage) {
      await saveAvatarForUser(ctx, person.userId, null, null);
    } else if (args.imageStorageId !== undefined) {
      const metadata = await ctx.db.system.get(args.imageStorageId);
      if (!metadata) throw new Error('Uploaded avatar not found');
      const upload = await claimUpload(
        ctx,
        person._id,
        args.imageStorageId,
        'avatar'
      );
      validateImageMetadata('avatar', upload.mimeType, metadata.size);
      if (
        metadata.size !== upload.size ||
        (metadata.contentType && metadata.contentType !== upload.mimeType)
      )
        throw new Error('Avatar metadata does not match the uploaded image');
      await saveAvatarForUser(
        ctx,
        person.userId,
        args.imageStorageId,
        await ctx.storage.getUrl(args.imageStorageId)
      );
    } else if (args.image !== undefined) {
      // Existing external avatar URL support remains separate from owned uploads.
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
                v.literal('EVENT_APPLICATION_RECEIVED'),
                v.literal('EVENT_APPLICATION_APPROVED'),
                v.literal('EVENT_APPLICATION_DECLINED'),
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
 * Better Auth identity and linked credentials are deleted in this transaction.
 * Every owned Group and Event must already be explicitly resolved.
 */
export const deleteUserAccount = mutation({
  args: {
    confirmation: v.string(),
    _traceId: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
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

    return deleteResolvedAccount(ctx, person, user);
  },
});

/** All deletion boundaries share one transaction and the final live ownership guard. */
export async function deleteResolvedAccount(
  ctx: MutationCtx,
  person: Doc<'persons'>,
  user: ExtendedAuthUser | null
) {
  await assertNoOwnedResources(ctx, person._id);
  await removeGroupMembershipsForPerson(ctx, person._id);
  const membershipsToRemove = await ctx.db
    .query('memberships')
    .withIndex('by_person', q => q.eq('personId', person._id))
    .collect();

  // Phase 3: Remove user from remaining events
  for (const membership of membershipsToRemove) {
    await dispatchAddonLifecycle(ctx, membership.eventId, 'onMemberLeft', {
      personId: person._id,
    });
  }

  // Batch-read related data for all memberships to remove
  const [invitesByMembership, availabilitiesByMembership, eventDocs] =
    await Promise.all([
      Promise.all(
        membershipsToRemove.map(m =>
          ctx.db
            .query('invites')
            .withIndex('by_creator', q => q.eq('createdById', m._id))
            .collect()
        )
      ),
      Promise.all(
        membershipsToRemove.map(m =>
          ctx.db
            .query('availabilities')
            .withIndex('by_membership', q => q.eq('membershipId', m._id))
            .collect()
        )
      ),
      Promise.all(membershipsToRemove.map(m => ctx.db.get(m.eventId))),
    ]);

  const memberCounts = await Promise.all(
    membershipsToRemove.map((m, i) => {
      const event = eventDocs[i];
      return event
        ? getOrComputeMemberCount(ctx, m.eventId, event)
        : Promise.resolve(0);
    })
  );

  for (const invites of invitesByMembership) {
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }
  }

  for (const avails of availabilitiesByMembership) {
    for (const a of avails) {
      await ctx.db.delete(a._id);
    }
  }

  for (let i = 0; i < membershipsToRemove.length; i++) {
    await ctx.db.delete(membershipsToRemove[i]._id);
    const event = eventDocs[i];
    if (event) {
      await ctx.db.patch(membershipsToRemove[i].eventId, {
        memberCount: Math.max(0, memberCounts[i] - 1),
      });
    }
  }

  // Phase 4: Delete user's authored content
  // Batch-read all user content and sub-entities
  const [
    authoredReplies,
    authoredPosts,
    receivedNotifications,
    personSettings,
    pushTokens,
  ] = await Promise.all([
    ctx.db
      .query('replies')
      .withIndex('by_author', q => q.eq('authorId', person._id))
      .collect(),
    ctx.db
      .query('posts')
      .withIndex('by_author', q => q.eq('authorId', person._id))
      .collect(),
    ctx.db
      .query('notifications')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .collect(),
    ctx.db
      .query('personSettings')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .first(),
    ctx.db
      .query('pushTokens')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .collect(),
  ]);

  // Delete delivery history before tokens/notifications so queued actions
  // resolve to no work after account deletion.
  const pushDeliveriesByToken = await Promise.all(
    pushTokens.map(token =>
      ctx.db
        .query('pushDeliveries')
        .withIndex('by_push_token', q => q.eq('pushTokenId', token._id))
        .collect()
    )
  );
  for (const deliveries of pushDeliveriesByToken) {
    for (const delivery of deliveries) {
      await ctx.db.delete(delivery._id);
    }
  }
  for (const token of pushTokens) {
    await ctx.db.delete(token._id);
  }

  // Batch-read replies and notifications for each authored post
  const [repliesByPost, notificationsByPost] = await Promise.all([
    Promise.all(
      authoredPosts.map(p =>
        ctx.db
          .query('replies')
          .withIndex('by_post', q => q.eq('postId', p._id))
          .collect()
      )
    ),
    Promise.all(
      authoredPosts.map(p =>
        ctx.db
          .query('notifications')
          .withIndex('by_post', q => q.eq('postId', p._id))
          .collect()
      )
    ),
  ]);

  // Deduplicate reply IDs (user may have replied to their own posts)
  const replyIdsToDelete = new Set<(typeof authoredReplies)[0]['_id']>();
  for (const reply of authoredReplies) replyIdsToDelete.add(reply._id);
  for (const postReplies of repliesByPost) {
    for (const reply of postReplies) replyIdsToDelete.add(reply._id);
  }

  for (const id of replyIdsToDelete) {
    await ctx.db.delete(id);
  }

  // Deduplicate notification IDs
  const notificationIdsToDelete = new Set<
    (typeof receivedNotifications)[0]['_id']
  >();
  for (const n of receivedNotifications) notificationIdsToDelete.add(n._id);
  for (const postNotifications of notificationsByPost) {
    for (const n of postNotifications) notificationIdsToDelete.add(n._id);
  }

  // Authored posts can have notifications (and therefore deliveries) owned
  // by other people. Delete by notification as well as by this account's
  // tokens so no orphaned delivery survives the post deletion.
  const pushDeliveriesByNotification = await Promise.all(
    [...notificationIdsToDelete].map(notificationId =>
      ctx.db
        .query('pushDeliveries')
        .withIndex('by_notification', q =>
          q.eq('notificationId', notificationId)
        )
        .collect()
    )
  );
  for (const deliveries of pushDeliveriesByNotification) {
    for (const delivery of deliveries) {
      await ctx.db.delete(delivery._id);
    }
  }

  for (const id of notificationIdsToDelete) {
    await ctx.db.delete(id);
  }

  for (const post of authoredPosts) {
    await ctx.db.delete(post._id);
  }

  // Phase 5: Delete person settings and notification methods
  if (personSettings) {
    const notificationMethods = await ctx.db
      .query('notificationMethods')
      .withIndex('by_settings', q => q.eq('settingsId', personSettings._id))
      .collect();

    const settingsByMethod = await Promise.all(
      notificationMethods.map(method =>
        ctx.db
          .query('notificationSettings')
          .withIndex('by_method', q => q.eq('methodId', method._id))
          .collect()
      )
    );

    for (const settings of settingsByMethod) {
      for (const setting of settings) {
        await ctx.db.delete(setting._id);
      }
    }

    for (const method of notificationMethods) {
      await ctx.db.delete(method._id);
    }

    await ctx.db.delete(personSettings._id);
  }

  // Private account preferences/authorizations must not outlive the Person.
  for (const table of [
    'personPresence',
    'themePreferences',
    'customThemes',
    'mutedEvents',
    'mutedPosts',
    'reminderOptOuts',
    'addonOptOuts',
    'discordGuildAuthorizations',
  ] as const) {
    for await (const record of ctx.db
      .query(table)
      .withIndex('by_person', q => q.eq('personId', person._id))) {
      await ctx.db.delete(record._id);
    }
  }
  await deletePersonApplications(ctx, person._id);
  await deleteListsForPerson(ctx, person._id);
  await ctx.db.delete(person._id);

  if (user) {
    // Magic-link identifiers are random and their email lives inside JSON;
    // the component has no ownership index for verification records. Inspect
    // every page and delete only exact account matches. This remains inside
    // the transaction, so exceeding Convex limits fails without partial deletion.
    const verificationPagination: PaginationOptions = {
      cursor: null,
      numItems: 100,
    };
    let verificationsDone = false;
    while (!verificationsDone) {
      const result: PaginationResult<AuthDoc<'verification'>> =
        await ctx.runQuery(components.betterAuth.adapter.findMany, {
          model: 'verification',
          paginationOpts: verificationPagination,
        });
      for (const verification of result.page) {
        if (isAccountVerification(verification, user)) {
          await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
            input: {
              model: 'verification',
              where: [{ field: '_id', value: verification._id }],
            },
          });
        }
      }
      verificationPagination.cursor = result.continueCursor;
      verificationsDone = result.isDone;
    }
  }

  // The component adapter does not cascade user deletion. Remove every
  // user-linked credential explicitly, including plugin tables. Keep these
  // calls in this mutation and let errors propagate so app data and auth
  // data roll back together if any cleanup fails.
  for (const model of ['account', 'session', 'passkey', 'apikey'] as const) {
    const paginationOpts: PaginationOptions = { cursor: null, numItems: 100 };
    let isDone = false;
    while (!isDone) {
      const result = await ctx.runMutation(
        components.betterAuth.adapter.deleteMany,
        {
          input: {
            model,
            where: [{ field: 'userId', value: person.userId }],
          },
          paginationOpts,
        }
      );
      paginationOpts.cursor = result.continueCursor;
      isDone = result.isDone;
    }
  }

  if (user) {
    const deletedUser = await ctx.runMutation(
      components.betterAuth.adapter.deleteOne,
      {
        input: {
          model: 'user',
          where: [{ field: '_id', value: person.userId }],
        },
      }
    );
    if (!deletedUser) {
      throw new Error('Failed to delete authentication account.');
    }
  }
  return { success: true };
}
