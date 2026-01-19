import { Id } from '../_generated/dataModel';
import { MutationCtx, QueryCtx } from '../_generated/server';
import { presence } from '../presence';

/**
 * Check if a person has muted an event
 */
export async function isEventMutedByPerson(
  ctx: MutationCtx | QueryCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>
): Promise<boolean> {
  const mute = await ctx.db
    .query('mutedEvents')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();
  return !!mute;
}

/**
 * Check if a person has muted a post
 */
export async function isPostMutedByPerson(
  ctx: MutationCtx | QueryCtx,
  personId: Id<'persons'>,
  postId: Id<'posts'>
): Promise<boolean> {
  const mute = await ctx.db
    .query('mutedPosts')
    .withIndex('by_person_post', q =>
      q.eq('personId', personId).eq('postId', postId)
    )
    .first();
  return !!mute;
}

/**
 * Check if a notification should be skipped due to muting
 * Checks both event-level and post-level muting
 */
export async function shouldSkipNotificationDueToMute(
  ctx: MutationCtx | QueryCtx,
  personId: Id<'persons'>,
  eventId?: Id<'events'>,
  postId?: Id<'posts'>
): Promise<boolean> {
  // Check post mute first (more specific)
  if (postId) {
    const postMuted = await isPostMutedByPerson(ctx, personId, postId);
    if (postMuted) return true;
  }

  // Check event mute
  if (eventId) {
    const eventMuted = await isEventMutedByPerson(ctx, personId, eventId);
    if (eventMuted) return true;
  }

  return false;
}

/**
 * Notification types matching the schema
 */
export type NotificationType =
  | 'EVENT_EDITED'
  | 'NEW_POST'
  | 'NEW_REPLY'
  | 'DATE_CHOSEN'
  | 'DATE_CHANGED'
  | 'DATE_RESET'
  | 'USER_JOINED'
  | 'USER_LEFT'
  | 'USER_PROMOTED'
  | 'USER_DEMOTED'
  | 'USER_RSVP'
  | 'USER_MENTIONED'
  | 'EVENT_REMINDER';

export type RsvpStatus = 'YES' | 'MAYBE' | 'NO' | 'PENDING';

/**
 * Create a notification for a single recipient
 */
export async function createNotification(
  ctx: MutationCtx,
  data: {
    personId: Id<'persons'>;
    type: NotificationType;
    authorId?: Id<'persons'>;
    eventId?: Id<'events'>;
    postId?: Id<'posts'>;
    datetime?: number;
    rsvp?: RsvpStatus;
  }
) {
  return await ctx.db.insert('notifications', {
    personId: data.personId,
    type: data.type,
    authorId: data.authorId,
    eventId: data.eventId,
    postId: data.postId,
    datetime: data.datetime,
    rsvp: data.rsvp,
    read: false,
  });
}

/**
 * Create notifications for all members of an event (except the author)
 * Respects mute settings - skips users who have muted the event or post
 */
export async function notifyEventMembers(
  ctx: MutationCtx,
  data: {
    eventId: Id<'events'>;
    type: NotificationType;
    authorId: Id<'persons'>;
    postId?: Id<'posts'>;
    datetime?: number;
    rsvp?: RsvpStatus;
    excludePersonIds?: Id<'persons'>[];
  }
): Promise<{ sent: Id<'notifications'>[]; skippedMuted: number }> {
  // Get all memberships for this event
  const memberships = await ctx.db
    .query('memberships')
    .withIndex('by_event', q => q.eq('eventId', data.eventId))
    .collect();

  const excludeIds = new Set([data.authorId, ...(data.excludePersonIds || [])]);

  // Create notification for each member (except author, excluded, and muted)
  const notificationIds: Id<'notifications'>[] = [];
  let skippedMuted = 0;

  for (const membership of memberships) {
    if (!excludeIds.has(membership.personId)) {
      // Check if user has muted this event or post
      const shouldSkip = await shouldSkipNotificationDueToMute(
        ctx,
        membership.personId,
        data.eventId,
        data.postId
      );

      if (shouldSkip) {
        skippedMuted++;
        continue;
      }

      const id = await createNotification(ctx, {
        personId: membership.personId,
        type: data.type,
        authorId: data.authorId,
        eventId: data.eventId,
        postId: data.postId,
        datetime: data.datetime,
        rsvp: data.rsvp,
      });
      notificationIds.push(id);
    }
  }

  return { sent: notificationIds, skippedMuted };
}

/**
 * Create notifications for organizers and moderators of an event
 * Respects mute settings - skips users who have muted the event
 */
export async function notifyEventModerators(
  ctx: MutationCtx,
  data: {
    eventId: Id<'events'>;
    type: NotificationType;
    authorId: Id<'persons'>;
    postId?: Id<'posts'>;
    datetime?: number;
    rsvp?: RsvpStatus;
  }
): Promise<{ sent: Id<'notifications'>[]; skippedMuted: number }> {
  // Get all memberships for this event
  const memberships = await ctx.db
    .query('memberships')
    .withIndex('by_event', q => q.eq('eventId', data.eventId))
    .collect();

  // Filter to moderators and organizers (excluding author)
  const moderators = memberships.filter(
    m =>
      (m.role === 'ORGANIZER' || m.role === 'MODERATOR') &&
      m.personId !== data.authorId
  );

  // Create notification for each moderator (respecting mute settings)
  const notificationIds: Id<'notifications'>[] = [];
  let skippedMuted = 0;

  for (const membership of moderators) {
    // Check if user has muted this event
    const shouldSkip = await shouldSkipNotificationDueToMute(
      ctx,
      membership.personId,
      data.eventId,
      data.postId
    );

    if (shouldSkip) {
      skippedMuted++;
      continue;
    }

    const id = await createNotification(ctx, {
      personId: membership.personId,
      type: data.type,
      authorId: data.authorId,
      eventId: data.eventId,
      postId: data.postId,
      datetime: data.datetime,
      rsvp: data.rsvp,
    });
    notificationIds.push(id);
  }

  return { sent: notificationIds, skippedMuted };
}

/**
 * Create a notification for a single person
 * Respects mute settings - returns null if user has muted the event/post
 */
export async function notifyPerson(
  ctx: MutationCtx,
  data: {
    personId: Id<'persons'>;
    type: NotificationType;
    authorId?: Id<'persons'>;
    eventId?: Id<'events'>;
    postId?: Id<'posts'>;
    datetime?: number;
    rsvp?: RsvpStatus;
  }
): Promise<{
  notificationId: Id<'notifications'> | null;
  skippedMuted: boolean;
}> {
  // Don't notify someone about their own action
  if (data.authorId && data.personId === data.authorId) {
    return { notificationId: null, skippedMuted: false };
  }

  // Check if user has muted this event or post
  const shouldSkip = await shouldSkipNotificationDueToMute(
    ctx,
    data.personId,
    data.eventId,
    data.postId
  );

  if (shouldSkip) {
    return { notificationId: null, skippedMuted: true };
  }

  const notificationId = await createNotification(ctx, data);
  return { notificationId, skippedMuted: false };
}

/**
 * Check if a user is currently present in a post room
 * Used to skip notifications for users actively viewing the thread
 */
export async function isUserPresentInPost(
  ctx: MutationCtx,
  postId: Id<'posts'>,
  personId: Id<'persons'>
): Promise<boolean> {
  try {
    const roomId = `post:${postId}`;
    const roomData = await presence.listRoom(ctx, roomId, true); // onlineOnly = true
    return roomData.some(user => user.userId === (personId as string));
  } catch {
    // If presence check fails, assume user is not present
    // This ensures notifications are sent even if presence is down
    return false;
  }
}

/**
 * Notify thread participants about a new reply, skipping users who are actively viewing
 * Respects mute settings - skips users who have muted the event or post
 *
 * @param ctx - Mutation context
 * @param data - Notification data including post and author info
 * @returns Object with counts of notifications sent, skipped due to presence, and skipped due to muting
 */
export async function notifyThreadParticipants(
  ctx: MutationCtx,
  data: {
    postId: Id<'posts'>;
    eventId: Id<'events'>;
    postAuthorId: Id<'persons'>;
    replyAuthorId: Id<'persons'>;
  }
): Promise<{ sent: number; skippedPresent: number; skippedMuted: number }> {
  let sent = 0;
  let skippedPresent = 0;
  let skippedMuted = 0;

  // Get users currently present in the post room
  let presentUsers: string[] = [];
  try {
    const roomId = `post:${data.postId}`;
    const roomData = await presence.listRoom(ctx, roomId, true); // onlineOnly = true
    presentUsers = roomData.map(user => user.userId);
  } catch {
    // If presence check fails, continue without it
    presentUsers = [];
  }

  const presentUserSet = new Set(presentUsers);

  // Notify the post author (if not the reply author and not present)
  if (data.postAuthorId !== data.replyAuthorId) {
    if (presentUserSet.has(data.postAuthorId as string)) {
      skippedPresent++;
    } else {
      // Check if user has muted this event or post
      const shouldSkip = await shouldSkipNotificationDueToMute(
        ctx,
        data.postAuthorId,
        data.eventId,
        data.postId
      );

      if (shouldSkip) {
        skippedMuted++;
      } else {
        await createNotification(ctx, {
          personId: data.postAuthorId,
          type: 'NEW_REPLY',
          authorId: data.replyAuthorId,
          eventId: data.eventId,
          postId: data.postId,
        });
        sent++;
      }
    }
  }

  // Get all existing replies to find other participants
  const existingReplies = await ctx.db
    .query('replies')
    .withIndex('by_post', q => q.eq('postId', data.postId))
    .collect();

  // Track who we've already notified (or skipped)
  const processedAuthors = new Set<string>([
    data.replyAuthorId as string,
    data.postAuthorId as string,
  ]);

  // Notify each unique reply author
  for (const reply of existingReplies) {
    if (!processedAuthors.has(reply.authorId as string)) {
      processedAuthors.add(reply.authorId as string);

      if (presentUserSet.has(reply.authorId as string)) {
        skippedPresent++;
      } else {
        // Check if user has muted this event or post
        const shouldSkip = await shouldSkipNotificationDueToMute(
          ctx,
          reply.authorId,
          data.eventId,
          data.postId
        );

        if (shouldSkip) {
          skippedMuted++;
        } else {
          await createNotification(ctx, {
            personId: reply.authorId,
            type: 'NEW_REPLY',
            authorId: data.replyAuthorId,
            eventId: data.eventId,
            postId: data.postId,
          });
          sent++;
        }
      }
    }
  }

  return { sent, skippedPresent, skippedMuted };
}
