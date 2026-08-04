import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../../../_generated/dataModel';
import { components } from '../../../_generated/api';
import { authComponent, AuthUserId } from '../../../auth';

/**
 * Internal queries and mutations for profile routes
 */

export const getCurrentProfile = internalQuery({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    const person = await ctx.db.get(personId as Id<'persons'>);
    if (!person) return null;

    const user = await authComponent.getAnyUserById(
      ctx,
      person.userId as AuthUserId
    );
    if (!user) return null;

    return {
      personId: person._id as string,
      userId: person.userId,
      name: user.name ?? null,
      email: user.email ?? null,
      image: user.image ?? null,
      username: user.username ?? null,
      bio: person.bio ?? null,
      pronouns: person.pronouns ?? null,
    };
  },
});

export const getProfileByUsername = internalQuery({
  args: {
    username: v.string(),
  },
  handler: async (ctx, { username }) => {
    const normalizedUsername = username.trim().toLowerCase();

    // Scan persons and match by username via Better Auth
    const allPersons = await ctx.db.query('persons').collect();

    for (const person of allPersons) {
      const user = await authComponent.getAnyUserById(
        ctx,
        person.userId as AuthUserId
      );
      if (!user) continue;

      if (user.username?.toLowerCase() === normalizedUsername) {
        return {
          personId: person._id as string,
          userId: person.userId,
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
          username: user.username ?? null,
          bio: person.bio ?? null,
          pronouns: person.pronouns ?? null,
        };
      }
    }

    return null;
  },
});

export const updateProfile = internalMutation({
  args: {
    personId: v.string(),
    userId: v.string(),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    pronouns: v.optional(v.string()),
  },
  handler: async (ctx, { personId, userId, name, username, bio, pronouns }) => {
    const pId = personId as Id<'persons'>;

    // Update user-level fields via Better Auth component adapter
    const userUpdates: Record<string, unknown> = {};
    if (name !== undefined) userUpdates.name = name;
    if (username !== undefined) {
      const trimmed = username.trim().toLowerCase();
      if (trimmed.length < 3 || trimmed.length > 50) {
        throw new Error('Username must be between 3 and 50 characters');
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        throw new Error(
          'Username can only contain letters, numbers, underscores, and dashes'
        );
      }
      userUpdates.username = trimmed;
    }

    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updatedAt = Date.now();
      await ctx.runMutation(components.betterAuth.adapter.updateOne, {
        input: {
          model: 'user',
          where: [{ field: '_id', operator: 'eq', value: userId }],
          update: userUpdates,
        },
      });
    }

    // Update person-level fields
    const personUpdates: Record<string, string | number> = {};
    if (bio !== undefined) personUpdates.bio = bio;
    if (pronouns !== undefined) personUpdates.pronouns = pronouns;

    if (Object.keys(personUpdates).length > 0) {
      personUpdates.updatedAt = Date.now();
      await ctx.db.patch(pId, personUpdates);
    }

    // Return updated profile
    const person = await ctx.db.get(pId);
    if (!person) throw new Error('Person not found');

    const user = await authComponent.getAnyUserById(
      ctx,
      person.userId as AuthUserId
    );

    return {
      personId: person._id as string,
      userId: person.userId,
      name: user?.name ?? null,
      email: user?.email ?? null,
      image: user?.image ?? null,
      username: user?.username ?? null,
      bio: person.bio ?? null,
      pronouns: person.pronouns ?? null,
    };
  },
});
