import {
  muteEventForPerson,
  unmuteEventForPerson,
  mutePostForPerson,
  unmutePostForPerson,
  requireEventAccess,
  requirePostAccess,
  hasEventAccess,
} from '../../../muting/model';
import {
  isEventMutedByPerson,
  isPostMutedByPerson,
} from '../../../lib/notifications';
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
            event:
              event &&
              (await hasEventAccess(ctx, personId as Id<'persons'>, event._id))
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
            post:
              post &&
              (await hasEventAccess(
                ctx,
                personId as Id<'persons'>,
                post.eventId
              ))
                ? { id: post._id, title: post.title }
                : null,
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
  returns: v.object({ alreadyMuted: v.boolean() }),
  handler: async (ctx, { personId, eventId }) => {
    const result = await muteEventForPerson(
      ctx,
      personId as Id<'persons'>,
      eventId as Id<'events'>
    );
    return { alreadyMuted: result.alreadyMuted };
  },
});

export const unmuteEvent = internalMutation({
  args: {
    personId: v.string(),
    eventId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { personId, eventId }) => {
    const result = await unmuteEventForPerson(
      ctx,
      personId as Id<'persons'>,
      eventId as Id<'events'>
    );
    if (result.wasNotMuted) throw Error('Event is not muted');
    return { success: true };
  },
});

export const mutePost = internalMutation({
  args: {
    personId: v.string(),
    postId: v.string(),
  },
  returns: v.object({ alreadyMuted: v.boolean() }),
  handler: async (ctx, { personId, postId }) => {
    const result = await mutePostForPerson(
      ctx,
      personId as Id<'persons'>,
      postId as Id<'posts'>
    );
    return { alreadyMuted: result.alreadyMuted };
  },
});

export const unmutePost = internalMutation({
  args: {
    personId: v.string(),
    postId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { personId, postId }) => {
    const result = await unmutePostForPerson(
      ctx,
      personId as Id<'persons'>,
      postId as Id<'posts'>
    );
    if (result.wasNotMuted) throw Error('Post is not muted');
    return { success: true };
  },
});

export const eventMuteStatus = internalQuery({
  args: { personId: v.id('persons'), eventId: v.id('events') },
  returns: v.object({ isMuted: v.boolean(), effectiveMuted: v.boolean() }),
  handler: async (ctx, { personId, eventId }) => {
    await requireEventAccess(ctx, personId, eventId);
    const isMuted = await isEventMutedByPerson(ctx, personId, eventId);
    return { isMuted, effectiveMuted: isMuted };
  },
});
export const postMuteStatus = internalQuery({
  args: { personId: v.id('persons'), postId: v.id('posts') },
  returns: v.object({
    isMuted: v.boolean(),
    eventMuted: v.boolean(),
    effectiveMuted: v.boolean(),
  }),
  handler: async (ctx, { personId, postId }) => {
    const post = await requirePostAccess(ctx, personId, postId);
    const isMuted = await isPostMutedByPerson(ctx, personId, postId);
    const eventMuted = await isEventMutedByPerson(ctx, personId, post.eventId);
    return { isMuted, eventMuted, effectiveMuted: isMuted || eventMuted };
  },
});
