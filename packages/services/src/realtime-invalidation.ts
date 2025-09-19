// ============================================================================
// REAL-TIME INVALIDATION UTILITIES
// ============================================================================

import { getPusherServer } from './pusher-server';

// Message types (duplicated here to avoid circular dependencies with @groupi/hooks)
const MessageTypes = {
  // Event-related updates
  EVENT_UPDATED: 'event.updated',
  EVENT_DELETED: 'event.deleted',
  EVENT_MEMBER_ADDED: 'event.member.added',
  EVENT_MEMBER_REMOVED: 'event.member.removed',
  EVENT_DATE_CHANGED: 'event.date.changed',

  // Post-related updates
  POST_CREATED: 'post.created',
  POST_UPDATED: 'post.updated',
  POST_DELETED: 'post.deleted',
  REPLY_CREATED: 'reply.created',
  REPLY_UPDATED: 'reply.updated',
  REPLY_DELETED: 'reply.deleted',

  // Availability updates
  AVAILABILITY_UPDATED: 'availability.updated',
  PDT_CREATED: 'pdt.created',
  PDT_UPDATED: 'pdt.updated',
  PDT_DELETED: 'pdt.deleted',

  // Invitation updates
  INVITE_CREATED: 'invite.created',
  INVITE_UPDATED: 'invite.updated',
  INVITE_DELETED: 'invite.deleted',
  INVITE_ACCEPTED: 'invite.accepted',

  // Notification updates
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',
  NOTIFICATION_DELETED: 'notification.deleted',

  // Person/Member updates
  PERSON_UPDATED: 'person.updated',
  MEMBERSHIP_UPDATED: 'membership.updated',

  // Settings updates
  SETTINGS_UPDATED: 'settings.updated',
} as const;

// ============================================================================
// INVALIDATION MESSAGE TYPES
// ============================================================================

interface InvalidationMessage {
  type: string;
  queryKeys: string[][];
  data?: any;
}

interface UserInvalidationOptions {
  userIds: string[];
  message: InvalidationMessage;
}

interface EventMemberInvalidationOptions {
  eventId: string;
  message: InvalidationMessage;
  excludeUserIds?: string[];
}

// ============================================================================
// CORE INVALIDATION FUNCTIONS
// ============================================================================

/**
 * Send invalidation message to specific users
 */
export async function invalidateQueriesForUsers({
  userIds,
  message,
}: UserInvalidationOptions): Promise<void> {
  try {
    const channels = userIds.map(userId => `user__${userId}`);

    // Send to multiple channels at once for efficiency
    await getPusherServer().trigger(channels, 'invalidate_queries', message);

    console.log(`Sent invalidation message to ${userIds.length} users:`, {
      type: message.type,
      queryKeys: message.queryKeys,
      userIds: userIds.slice(0, 5), // Log first 5 for debugging
    });
  } catch (error) {
    console.error('Error sending invalidation message:', error);
  }
}

/**
 * Send invalidation message to all members of an event
 * Simple, non-blocking approach - fire and forget
 */
export async function invalidateQueriesForEventMembers({
  eventId,
  message,
  excludeUserIds = [],
}: EventMemberInvalidationOptions): Promise<void> {
  try {
    // Import here to avoid circular dependencies
    const { db } = await import('./db');

    // Simple direct DB query - faster than going through service layer
    const memberships = await db.membership.findMany({
      where: { eventId },
      select: { personId: true },
    });

    // Get user IDs, excluding specified users
    const userIds = memberships
      .map(membership => membership.personId)
      .filter(userId => !excludeUserIds.includes(userId));

    if (userIds.length > 0) {
      // Fire and forget - don't await to avoid blocking
      invalidateQueriesForUsers({ userIds, message }).catch(error => {
        console.warn('Real-time invalidation failed (non-critical):', error);
      });
    }
  } catch (error) {
    // Log but don't throw - real-time updates are nice-to-have, not critical
    console.warn(
      'Could not send real-time invalidation (non-critical):',
      error
    );
  }
}

// ============================================================================
// DOMAIN-SPECIFIC INVALIDATION HELPERS
// ============================================================================

/**
 * Invalidate event-related queries for all event members
 */
export async function invalidateEventQueries(
  eventId: string,
  messageType: string = MessageTypes.EVENT_UPDATED,
  data?: any
): Promise<void> {
  const message: InvalidationMessage = {
    type: messageType,
    queryKeys: [
      ['event', 'getById'],
      ['member', 'getByEventId'],
    ],
    data: { eventId, ...data },
  };

  await invalidateQueriesForEventMembers({ eventId, message });
}

/**
 * Invalidate post-related queries for all event members
 */
export async function invalidatePostQueries(
  eventId: string,
  postId: string,
  messageType: string = MessageTypes.POST_CREATED,
  data?: any
): Promise<void> {
  const message: InvalidationMessage = {
    type: messageType,
    queryKeys: [
      ['post', 'getByEventId'],
      ['post', 'getById'],
      ['post', 'getWithReplies'],
    ],
    data: { eventId, postId, ...data },
  };

  await invalidateQueriesForEventMembers({ eventId, message });
}

/**
 * Invalidate availability-related queries for all event members
 */
export async function invalidateAvailabilityQueries(
  eventId: string,
  messageType: string = MessageTypes.AVAILABILITY_UPDATED,
  data?: any
): Promise<void> {
  const message: InvalidationMessage = {
    type: messageType,
    queryKeys: [['availability', 'getPDTsByEventId']],
    data: { eventId, ...data },
  };

  await invalidateQueriesForEventMembers({ eventId, message });
}

/**
 * Invalidate invitation-related queries for all event members
 */
export async function invalidateInviteQueries(
  eventId: string,
  messageType: string = MessageTypes.INVITE_CREATED,
  data?: any
): Promise<void> {
  const message: InvalidationMessage = {
    type: messageType,
    queryKeys: [['invite', 'getByEventId']],
    data: { eventId, ...data },
  };

  await invalidateQueriesForEventMembers({ eventId, message });
}

/**
 * Invalidate notification queries for specific users
 */
export async function invalidateNotificationQueries(
  userIds: string[],
  messageType: string = MessageTypes.NOTIFICATION_CREATED,
  data?: any
): Promise<void> {
  const message: InvalidationMessage = {
    type: messageType,
    queryKeys: [['notification', 'getByUserId']],
    data,
  };

  await invalidateQueriesForUsers({ userIds, message });
}

/**
 * Invalidate person/membership queries for specific users
 */
export async function invalidatePersonQueries(
  userIds: string[],
  messageType: string = MessageTypes.PERSON_UPDATED,
  data?: any
): Promise<void> {
  const message: InvalidationMessage = {
    type: messageType,
    queryKeys: [
      ['person', 'getById'],
      ['person', 'getCurrent'],
    ],
    data,
  };

  await invalidateQueriesForUsers({ userIds, message });
}

// ============================================================================
// COMPLEX INVALIDATION SCENARIOS
// ============================================================================

/**
 * Handle member joining an event - multiple invalidations needed
 */
export async function handleMemberJoinedEvent(
  eventId: string,
  newMemberUserId: string,
  data?: any
): Promise<void> {
  // Invalidate event queries for existing members + new member
  await invalidateEventQueries(eventId, MessageTypes.EVENT_MEMBER_ADDED, data);

  // Also invalidate the new member's personal data
  await invalidatePersonQueries(
    [newMemberUserId],
    MessageTypes.MEMBERSHIP_UPDATED,
    data
  );
}

/**
 * Handle member leaving an event - multiple invalidations needed
 */
export async function handleMemberLeftEvent(
  eventId: string,
  leftMemberUserId: string,
  data?: any
): Promise<void> {
  // Invalidate event queries for remaining members
  await invalidateEventQueries(
    eventId,
    MessageTypes.EVENT_MEMBER_REMOVED,
    data
  );

  // Invalidate the leaving member's personal data
  await invalidatePersonQueries(
    [leftMemberUserId],
    MessageTypes.MEMBERSHIP_UPDATED,
    data
  );
}

/**
 * Handle post with replies being updated
 */
export async function handlePostWithRepliesUpdated(
  eventId: string,
  postId: string,
  messageType: string = MessageTypes.REPLY_CREATED,
  data?: any
): Promise<void> {
  const message: InvalidationMessage = {
    type: messageType,
    queryKeys: [
      ['post', 'getWithReplies'], // This specific post with replies
      ['post', 'getByEventId'], // Event's post list
    ],
    data: { eventId, postId, ...data },
  };

  await invalidateQueriesForEventMembers({ eventId, message });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a custom invalidation message
 */
export function createInvalidationMessage(
  type: string,
  queryKeys: string[][],
  data?: any
): InvalidationMessage {
  return { type, queryKeys, data };
}

/**
 * Batch multiple invalidations efficiently
 */
export async function batchInvalidateQueries(
  invalidations: Array<() => Promise<void>>
): Promise<void> {
  try {
    await Promise.allSettled(invalidations.map(fn => fn()));
  } catch (error) {
    console.error('Error in batch invalidation:', error);
  }
}
