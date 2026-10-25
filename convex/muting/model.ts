import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
export async function muteEventForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  // Check if event exists
  const event = await ctx.db.get(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  // Check if user is a member of the event
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();

  if (!membership) {
    throw new Error('You are not a member of this event');
  }

  // Check if already muted
  const existingMute = await ctx.db
    .query('mutedEvents')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();

  if (existingMute) {
    // Already muted, return existing
    return { mutedEventId: existingMute._id, alreadyMuted: true };
  }

  // Create mute record
  const now = Date.now();
  const mutedEventId = await ctx.db.insert('mutedEvents', {
    personId: personId,
    eventId,
    mutedAt: now,
    updatedAt: now,
  });

  return { mutedEventId, alreadyMuted: false };
}
export async function unmuteEventForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  await requireEventAccess(ctx, personId, eventId);

  // Find and delete the mute record
  const existingMute = await ctx.db
    .query('mutedEvents')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();

  if (!existingMute) {
    return { unmuted: false, wasNotMuted: true };
  }

  await ctx.db.delete(existingMute._id);
  return { unmuted: true, wasNotMuted: false };
}
export async function toggleEventMuteForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  // Check if event exists
  const event = await ctx.db.get(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  // Check if user is a member of the event
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();

  if (!membership) {
    throw new Error('You are not a member of this event');
  }

  // Check current mute status
  const existingMute = await ctx.db
    .query('mutedEvents')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();

  if (existingMute) {
    // Currently muted - unmute
    await ctx.db.delete(existingMute._id);
    return { isMuted: false };
  } else {
    // Currently not muted - mute
    const now = Date.now();
    await ctx.db.insert('mutedEvents', {
      personId: personId,
      eventId,
      mutedAt: now,
      updatedAt: now,
    });
    return { isMuted: true };
  }
}
export async function mutePostForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  postId: Id<'posts'>
) {
  // Check if post exists
  const post = await ctx.db.get(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  // Check if user is a member of the event
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', post.eventId)
    )
    .first();

  if (!membership) {
    throw new Error('You are not a member of this event');
  }

  // Check if already muted
  const existingMute = await ctx.db
    .query('mutedPosts')
    .withIndex('by_person_post', q =>
      q.eq('personId', personId).eq('postId', postId)
    )
    .first();

  if (existingMute) {
    // Already muted, return existing
    return { mutedPostId: existingMute._id, alreadyMuted: true };
  }

  // Create mute record
  const now = Date.now();
  const mutedPostId = await ctx.db.insert('mutedPosts', {
    personId: personId,
    postId,
    mutedAt: now,
    updatedAt: now,
  });

  return { mutedPostId, alreadyMuted: false };
}
export async function unmutePostForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  postId: Id<'posts'>
) {
  await requirePostAccess(ctx, personId, postId);

  // Find and delete the mute record
  const existingMute = await ctx.db
    .query('mutedPosts')
    .withIndex('by_person_post', q =>
      q.eq('personId', personId).eq('postId', postId)
    )
    .first();

  if (!existingMute) {
    return { unmuted: false, wasNotMuted: true };
  }

  await ctx.db.delete(existingMute._id);
  return { unmuted: true, wasNotMuted: false };
}
export async function togglePostMuteForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  postId: Id<'posts'>
) {
  // Check if post exists
  const post = await ctx.db.get(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  // Check if user is a member of the event
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', post.eventId)
    )
    .first();

  if (!membership) {
    throw new Error('You are not a member of this event');
  }

  // Check current mute status
  const existingMute = await ctx.db
    .query('mutedPosts')
    .withIndex('by_person_post', q =>
      q.eq('personId', personId).eq('postId', postId)
    )
    .first();

  if (existingMute) {
    // Currently muted - unmute
    await ctx.db.delete(existingMute._id);
    return { isMuted: false };
  } else {
    // Currently not muted - mute
    const now = Date.now();
    await ctx.db.insert('mutedPosts', {
      personId: personId,
      postId,
      mutedAt: now,
      updatedAt: now,
    });
    return { isMuted: true };
  }
}

export async function hasEventAccess(
  ctx: QueryCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  return !!(await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first());
}
export async function requireEventAccess(
  ctx: QueryCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
) {
  const event = await ctx.db.get(eventId);
  if (!event) throw Error('Event not found');
  if (!(await hasEventAccess(ctx, personId, eventId)))
    throw Error('You are not a member of this event');
  return event;
}
export async function requirePostAccess(
  ctx: QueryCtx,
  personId: Id<'persons'>,
  postId: Id<'posts'>
) {
  const post = await ctx.db.get(postId);
  if (!post) throw Error('Post not found');
  await requireEventAccess(ctx, personId, post.eventId);
  return post;
}
