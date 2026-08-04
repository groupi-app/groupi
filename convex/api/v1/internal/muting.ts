import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import { Id } from '../../../_generated/dataModel';

/**
 * Internal queries and mutations for muting routes
 */

export const listMuted = internalQuery({
  args: {
    personId: v.string(),
    type: v.optional(v.union(v.literal('events'), v.literal('posts'))),
  },
  handler: async (ctx, { personId, type }) => {
    let events: Array<{
      id: string;
      eventId: string;
      mutedAt: number;
      event: {
        id: string;
        title: string;
        description: string | null;
        location: string | null;
      } | null;
    }> = [];

    let posts: Array<{
      id: string;
      postId: string;
      mutedAt: number;
      post: { id: string; title: string } | null;
    }> = [];

    if (!type || type === 'events') {
      const mutedEvents = await ctx.db
        .query('mutedEvents')
        .withIndex('by_person', q =>
          q.eq('personId', personId as Id<'persons'>)
        )
        .collect();

      events = await Promise.all(
        mutedEvents.map(async mute => {
          const event = await ctx.db.get(mute.eventId);
          return {
            id: mute._id,
            eventId: mute.eventId,
            mutedAt: mute.mutedAt,
            event: event
              ? {
                  id: event._id,
                  title: event.title,
                  description: event.description ?? null,
                  location: event.location ?? null,
                }
              : null,
          };
        })
      );
    }

    if (!type || type === 'posts') {
      const mutedPosts = await ctx.db
        .query('mutedPosts')
        .withIndex('by_person', q =>
          q.eq('personId', personId as Id<'persons'>)
        )
        .collect();

      posts = await Promise.all(
        mutedPosts.map(async mute => {
          const post = await ctx.db.get(mute.postId);
          return {
            id: mute._id,
            postId: mute.postId,
            mutedAt: mute.mutedAt,
            post: post ? { id: post._id, title: post.title } : null,
          };
        })
      );
    }

    return { events, posts };
  },
});

export const muteEvent = internalMutation({
  args: {
    personId: v.string(),
    eventId: v.string(),
  },
  handler: async (ctx, { personId, eventId }) => {
    const event = await ctx.db.get(eventId as Id<'events'>);
    if (!event) {
      throw new Error('Event not found');
    }

    // Verify membership
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q
          .eq('personId', personId as Id<'persons'>)
          .eq('eventId', eventId as Id<'events'>)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    // Check if already muted
    const existing = await ctx.db
      .query('mutedEvents')
      .withIndex('by_person_event', q =>
        q
          .eq('personId', personId as Id<'persons'>)
          .eq('eventId', eventId as Id<'events'>)
      )
      .first();

    if (existing) {
      return { alreadyMuted: true };
    }

    const now = Date.now();
    await ctx.db.insert('mutedEvents', {
      personId: personId as Id<'persons'>,
      eventId: eventId as Id<'events'>,
      mutedAt: now,
      updatedAt: now,
    });

    return { alreadyMuted: false };
  },
});

export const unmuteEvent = internalMutation({
  args: {
    personId: v.string(),
    eventId: v.string(),
  },
  handler: async (ctx, { personId, eventId }) => {
    const existing = await ctx.db
      .query('mutedEvents')
      .withIndex('by_person_event', q =>
        q
          .eq('personId', personId as Id<'persons'>)
          .eq('eventId', eventId as Id<'events'>)
      )
      .first();

    if (!existing) {
      throw new Error('Event is not muted');
    }

    await ctx.db.delete(existing._id);

    return { success: true };
  },
});

export const mutePost = internalMutation({
  args: {
    personId: v.string(),
    postId: v.string(),
  },
  handler: async (ctx, { personId, postId }) => {
    const post = await ctx.db.get(postId as Id<'posts'>);
    if (!post) {
      throw new Error('Post not found');
    }

    // Verify membership via the post's event
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', personId as Id<'persons'>).eq('eventId', post.eventId)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    // Check if already muted
    const existing = await ctx.db
      .query('mutedPosts')
      .withIndex('by_person_post', q =>
        q
          .eq('personId', personId as Id<'persons'>)
          .eq('postId', postId as Id<'posts'>)
      )
      .first();

    if (existing) {
      return { alreadyMuted: true };
    }

    const now = Date.now();
    await ctx.db.insert('mutedPosts', {
      personId: personId as Id<'persons'>,
      postId: postId as Id<'posts'>,
      mutedAt: now,
      updatedAt: now,
    });

    return { alreadyMuted: false };
  },
});

export const unmutePost = internalMutation({
  args: {
    personId: v.string(),
    postId: v.string(),
  },
  handler: async (ctx, { personId, postId }) => {
    const existing = await ctx.db
      .query('mutedPosts')
      .withIndex('by_person_post', q =>
        q
          .eq('personId', personId as Id<'persons'>)
          .eq('postId', postId as Id<'posts'>)
      )
      .first();

    if (!existing) {
      throw new Error('Post is not muted');
    }

    await ctx.db.delete(existing._id);

    return { success: true };
  },
});
