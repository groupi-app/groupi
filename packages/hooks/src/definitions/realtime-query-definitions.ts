// ============================================================================
// REALTIME QUERY DEFINITIONS FOR USER-CENTRIC UPDATES
// ============================================================================

/**
 * Message types that can be sent through the user's realtime channel
 * Each message tells the query client which specific queries to invalidate
 */
export interface InvalidationMessage {
  type: string;
  queryKeys: string[][]; // Array of query key arrays to invalidate
  data?: unknown; // Optional payload data
}

/**
 * Query definition that maps to invalidation messages rather than specific channels
 */
export interface UnifiedQueryDefinition {
  queryKeyPattern: string[]; // The query key pattern to match
  messageTypes: string[]; // The message types that should invalidate this query
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export const MessageTypes = {
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
// QUERY DEFINITIONS
// ============================================================================

/**
 * Maps tRPC query patterns to the message types that should invalidate them
 * Query keys follow the pattern: [routerName, procedureName, inputData]
 */
export const unifiedQueryDefinitions: UnifiedQueryDefinition[] = [
  // ============================================================================
  // EVENT QUERIES
  // ============================================================================
  {
    queryKeyPattern: ['event', 'getById'],
    messageTypes: [
      MessageTypes.EVENT_UPDATED,
      MessageTypes.EVENT_DELETED,
      MessageTypes.EVENT_DATE_CHANGED,
    ],
  },
  {
    queryKeyPattern: ['event', 'getPageData'],
    messageTypes: [
      MessageTypes.EVENT_UPDATED,
      MessageTypes.EVENT_DELETED,
      MessageTypes.EVENT_DATE_CHANGED,
      MessageTypes.EVENT_MEMBER_ADDED,
      MessageTypes.EVENT_MEMBER_REMOVED,
    ],
  },

  // ============================================================================
  // POST QUERIES
  // ============================================================================
  {
    queryKeyPattern: ['post', 'getByIdWithReplies'],
    messageTypes: [
      MessageTypes.POST_UPDATED,
      MessageTypes.POST_DELETED,
      MessageTypes.REPLY_CREATED,
      MessageTypes.REPLY_UPDATED,
      MessageTypes.REPLY_DELETED,
    ],
  },

  // ============================================================================
  // MEMBER QUERIES
  // ============================================================================
  {
    queryKeyPattern: ['member', 'getByEventId'],
    messageTypes: [
      MessageTypes.EVENT_MEMBER_ADDED,
      MessageTypes.EVENT_MEMBER_REMOVED,
      MessageTypes.MEMBERSHIP_UPDATED,
    ],
  },

  // ============================================================================
  // AVAILABILITY QUERIES
  // ============================================================================
  {
    queryKeyPattern: ['availability', 'getEventPotentialDateTimes'],
    messageTypes: [
      MessageTypes.AVAILABILITY_UPDATED,
      MessageTypes.PDT_CREATED,
      MessageTypes.PDT_UPDATED,
      MessageTypes.PDT_DELETED,
      MessageTypes.EVENT_DATE_CHANGED,
    ],
  },

  // ============================================================================
  // INVITE QUERIES
  // ============================================================================
  {
    queryKeyPattern: ['invite', 'getEventData'],
    messageTypes: [
      MessageTypes.INVITE_CREATED,
      MessageTypes.INVITE_UPDATED,
      MessageTypes.INVITE_DELETED,
    ],
  },
  {
    queryKeyPattern: ['invite', 'getById'],
    messageTypes: [
      MessageTypes.INVITE_UPDATED,
      MessageTypes.INVITE_DELETED,
      MessageTypes.INVITE_ACCEPTED,
    ],
  },

  // ============================================================================
  // NOTIFICATION QUERIES
  // ============================================================================
  {
    queryKeyPattern: ['notification', 'getForUser'],
    messageTypes: [
      MessageTypes.NOTIFICATION_CREATED,
      MessageTypes.NOTIFICATION_READ,
      MessageTypes.NOTIFICATION_DELETED,
    ],
  },

  // ============================================================================
  // PERSON QUERIES
  // ============================================================================
  {
    queryKeyPattern: ['person', 'getById'],
    messageTypes: [
      MessageTypes.PERSON_UPDATED,
      MessageTypes.MEMBERSHIP_UPDATED,
      MessageTypes.EVENT_MEMBER_ADDED,
      MessageTypes.EVENT_MEMBER_REMOVED,
    ],
  },
  {
    queryKeyPattern: ['person', 'getCurrent'],
    messageTypes: [MessageTypes.PERSON_UPDATED, MessageTypes.SETTINGS_UPDATED],
  },

  // ============================================================================
  // SETTINGS QUERIES
  // ============================================================================
  {
    queryKeyPattern: ['settings', 'getCurrent'],
    messageTypes: [MessageTypes.SETTINGS_UPDATED],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all query definitions that should be invalidated for a given message type
 */
export function getInvalidationQueriesForMessage(
  messageType: string
): UnifiedQueryDefinition[] {
  return unifiedQueryDefinitions.filter(def =>
    def.messageTypes.includes(messageType)
  );
}

/**
 * Check if a query key matches a pattern
 */
export function queryKeyMatchesPattern(
  queryKey: readonly unknown[],
  pattern: string[]
): boolean {
  if (queryKey.length < pattern.length) return false;

  return pattern.every((patternPart, index) => {
    return queryKey[index] === patternPart;
  });
}

/**
 * Create user channel name
 */
export function getUserChannel(userId: string): string {
  return `user__${userId}`;
}

/**
 * Create invalidation message
 */
export function createInvalidationMessage(
  type: string,
  queryKeys: string[][],
  data?: unknown
): InvalidationMessage {
  return {
    type,
    queryKeys,
    data,
  };
}
