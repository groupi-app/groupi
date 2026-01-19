import { mutation, MutationCtx } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentPerson, isAdmin } from '../auth';
import { Id } from '../_generated/dataModel';
import { components } from '../_generated/api';
import { UserRole } from '../lib/constants';

/**
 * Admin mutations for the Convex backend
 *
 * These functions provide admin-level data modification capabilities.
 * All functions require admin privileges.
 */

/**
 * Check if current user has admin privileges
 */
async function requireAdmin(ctx: MutationCtx) {
  const currentPerson = await getCurrentPerson(ctx);
  if (!currentPerson) {
    throw new Error('Authentication required');
  }

  // Check admin status via auth utility
  const admin = await isAdmin(ctx);
  if (!admin) {
    throw new Error('Admin privileges required');
  }

  return currentPerson;
}

/**
 * Helper function to delete an event and all related data
 * This is shared between deleteEvent mutation and deletePerson mutation
 */
async function deleteEventAndRelatedData(
  ctx: MutationCtx,
  eventId: Id<'events'>
) {
  // Check if event exists
  const event = await ctx.db.get(eventId);
  if (!event) {
    return; // Event doesn't exist, nothing to delete
  }

  // Delete all related data in order (to handle dependencies)

  // 1. Delete all replies in posts in this event
  const posts = await ctx.db
    .query('posts')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .collect();

  for (const post of posts) {
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', post._id))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }
  }

  // 2. Delete all posts in this event
  for (const post of posts) {
    await ctx.db.delete(post._id);
  }

  // 3. Delete all memberships for this event
  const memberships = await ctx.db
    .query('memberships')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .collect();

  for (const membership of memberships) {
    await ctx.db.delete(membership._id);
  }

  // 4. Delete all invites for this event
  const invites = await ctx.db
    .query('invites')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .collect();

  for (const invite of invites) {
    await ctx.db.delete(invite._id);
  }

  // 5. Delete all availability records for this event (via memberships)
  for (const membership of memberships) {
    const availabilities = await ctx.db
      .query('availabilities')
      .withIndex('by_membership', q => q.eq('membershipId', membership._id))
      .collect();

    for (const availability of availabilities) {
      await ctx.db.delete(availability._id);
    }
  }

  // 6. Finally, delete the event itself
  await ctx.db.delete(eventId);
}

/**
 * Delete an event (admin only)
 * This will cascade delete all related data: memberships, posts, replies, etc.
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id('events'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { eventId }) => {
    // Require admin privileges
    await requireAdmin(ctx);

    // Check if event exists
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Delete the event and all related data using helper function
    await deleteEventAndRelatedData(ctx, eventId);

    return { success: true };
  },
});

/**
 * Delete a post (admin only)
 * This will cascade delete all related replies
 */
export const deletePost = mutation({
  args: {
    postId: v.id('posts'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { postId }) => {
    // Require admin privileges
    await requireAdmin(ctx);

    // Check if post exists
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Delete all replies to this post first
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_post', q => q.eq('postId', postId))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    // Delete the post
    await ctx.db.delete(postId);

    return { success: true };
  },
});

/**
 * Delete a reply (admin only)
 */
export const deleteReply = mutation({
  args: {
    replyId: v.id('replies'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { replyId }) => {
    // Require admin privileges
    await requireAdmin(ctx);

    // Check if reply exists
    const reply = await ctx.db.get(replyId);
    if (!reply) {
      throw new Error('Reply not found');
    }

    // Delete the reply
    await ctx.db.delete(replyId);

    return { success: true };
  },
});

/**
 * Delete a person and all related data (admin only)
 * Note: This does NOT delete the Better Auth user - that must be done via Better Auth client
 */
export const deletePerson = mutation({
  args: {
    personId: v.id('persons'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { personId }) => {
    // Require admin privileges
    const adminPerson = await requireAdmin(ctx);

    // Prevent admins from deleting themselves
    if (adminPerson._id === personId) {
      throw new Error('Cannot delete your own account');
    }

    // Check if person exists
    const person = await ctx.db.get(personId);
    if (!person) {
      throw new Error('Person not found');
    }

    // Delete all related data in order

    // 1. Delete all replies by this person
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_author', q => q.eq('authorId', person._id))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    // 2. Delete all posts by this person (and their replies)
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_author', q => q.eq('authorId', person._id))
      .collect();

    for (const post of posts) {
      // Delete replies to this post
      const postReplies = await ctx.db
        .query('replies')
        .withIndex('by_post', q => q.eq('postId', post._id))
        .collect();

      for (const reply of postReplies) {
        await ctx.db.delete(reply._id);
      }

      // Delete the post
      await ctx.db.delete(post._id);
    }

    // 3. Delete all memberships for this person
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .collect();

    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // 4. Delete all availability records for this person (via their memberships)
    for (const membership of memberships) {
      const availabilities = await ctx.db
        .query('availabilities')
        .withIndex('by_membership', q => q.eq('membershipId', membership._id))
        .collect();

      for (const availability of availabilities) {
        await ctx.db.delete(availability._id);
      }
    }

    // 5. Delete all invites created by this person's memberships
    for (const membership of memberships) {
      const membershipInvites = await ctx.db
        .query('invites')
        .withIndex('by_creator', q => q.eq('createdById', membership._id))
        .collect();

      for (const invite of membershipInvites) {
        await ctx.db.delete(invite._id);
      }
    }

    // 6. Delete events created by this person (and all their data)
    const events = await ctx.db
      .query('events')
      .withIndex('by_creator', q => q.eq('creatorId', person._id))
      .collect();

    for (const event of events) {
      // Delete each event and all related data
      await deleteEventAndRelatedData(ctx, event._id);
    }

    // 7. Delete the person record
    await ctx.db.delete(person._id);

    return { success: true, deletedUserId: person.userId };
  },
});

/**
 * Update user role (promote/demote admin) by user ID
 * Uses the Better Auth component adapter to directly update the user's role
 */
export const updateUserRole = mutation({
  args: {
    userId: v.string(), // Better Auth user ID as string
    role: v.union(v.literal(UserRole.USER), v.literal(UserRole.ADMIN)),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, role }) => {
    // Require admin privileges
    const adminPerson = await requireAdmin(ctx);

    // Prevent admins from changing their own role
    if (adminPerson.userId === userId) {
      throw new Error('Cannot change your own role');
    }

    // Use the Better Auth component adapter to update the user's role
    const result = await ctx.runMutation(
      components.betterAuth.adapter.updateOne,
      {
        input: {
          model: 'user',
          where: [{ field: '_id', operator: 'eq', value: userId }],
          update: { role, updatedAt: Date.now() },
        },
      }
    );

    if (!result) {
      throw new Error('User not found');
    }

    return {
      success: true,
      message: `User role updated to ${role}`,
      targetUserId: userId,
      newRole: role,
    };
  },
});

/**
 * Update user role by username
 * Convenience mutation for setting admin role via username lookup
 */
export const setUserRoleByUsername = mutation({
  args: {
    username: v.string(),
    role: v.union(v.literal(UserRole.USER), v.literal(UserRole.ADMIN)),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { username, role }) => {
    // Require admin privileges
    const adminPerson = await requireAdmin(ctx);

    // Look up user by username using the adapter
    const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: 'user',
      where: [{ field: 'username', operator: 'eq', value: username }],
    });

    if (!user) {
      throw new Error(`User with username "${username}" not found`);
    }

    const userId = user._id as string;

    // Prevent admins from changing their own role
    if (adminPerson.userId === userId) {
      throw new Error('Cannot change your own role');
    }

    // Update the user's role
    const result = await ctx.runMutation(
      components.betterAuth.adapter.updateOne,
      {
        input: {
          model: 'user',
          where: [{ field: '_id', operator: 'eq', value: userId }],
          update: { role, updatedAt: Date.now() },
        },
      }
    );

    if (!result) {
      throw new Error('Failed to update user role');
    }

    return {
      success: true,
      message: `User "${username}" role updated to ${role}`,
      targetUserId: userId,
      username,
      newRole: role,
    };
  },
});

/**
 * Bootstrap first admin by username
 * This mutation can ONLY be used when there are no existing admins
 * Used for initial setup of the application
 */
export const bootstrapAdmin = mutation({
  args: {
    username: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { username }) => {
    // Check if any admins exist by querying all users
    const existingUsers = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: 'user',
        where: [{ field: 'role', operator: 'eq', value: UserRole.ADMIN }],
        paginationOpts: { cursor: null, numItems: 1 },
      }
    );

    if (existingUsers.page && existingUsers.page.length > 0) {
      throw new Error(
        'Cannot bootstrap admin: An admin already exists. Use setUserRoleByUsername instead.'
      );
    }

    // Look up user by username
    const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: 'user',
      where: [{ field: 'username', operator: 'eq', value: username }],
    });

    if (!user) {
      throw new Error(`User with username "${username}" not found`);
    }

    const userId = user._id as string;

    // Update the user's role to admin
    const result = await ctx.runMutation(
      components.betterAuth.adapter.updateOne,
      {
        input: {
          model: 'user',
          where: [{ field: '_id', operator: 'eq', value: userId }],
          update: { role: UserRole.ADMIN, updatedAt: Date.now() },
        },
      }
    );

    if (!result) {
      throw new Error('Failed to set admin role');
    }

    console.log(`✅ Bootstrapped "${username}" as first ${UserRole.ADMIN}`);

    return {
      success: true,
      message: `User "${username}" is now an admin`,
      userId,
      username,
    };
  },
});
