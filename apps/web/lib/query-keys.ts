/**
 * Centralized Query Keys Factory
 * Provides type-safe query keys for React Query
 * Pattern: qk.posts.feed(eventId), qk.events.header(eventId), etc.
 */

export const qk = {
  posts: {
    /**
     * Query key for post feed in an event
     * @param eventId - Event ID
     */
    feed: (eventId: string) => ['posts', 'feed', eventId] as const,

    /**
     * Query key for post detail with replies
     * @param postId - Post ID
     */
    detail: (postId: string) => ['posts', 'detail', postId] as const,
  },

  replies: {
    /**
     * Query key for replies in a post
     * Note: Replies are included in post detail, so we use post detail key
     * @param postId - Post ID
     */
    list: (postId: string) => ['replies', 'list', postId] as const,
  },

  events: {
    /**
     * Query key for event header data
     * @param eventId - Event ID
     */
    header: (eventId: string) => ['events', 'header', eventId] as const,

    /**
     * Query key for user's event list (dashboard)
     */
    list: () => ['events', 'list'] as const,

    /**
     * Query key for user's event list by user ID
     * @param userId - User ID
     */
    listByUser: (userId: string) => ['events', 'list', userId] as const,
  },

  memberships: {
    /**
     * Query key for member list in an event
     * @param eventId - Event ID
     */
    list: (eventId: string) => ['memberships', 'list', eventId] as const,
  },

  invites: {
    /**
     * Query key for invite management data in an event
     * @param eventId - Event ID
     */
    management: (eventId: string) =>
      ['invites', 'management', eventId] as const,
  },

  availability: {
    /**
     * Query key for availability data in an event
     * @param eventId - Event ID
     */
    data: (eventId: string) => ['availability', 'data', eventId] as const,
  },

  notifications: {
    /**
     * Query key for notification feed for a user
     * @param userId - User ID
     * @param cursor - Optional cursor for pagination
     */
    list: (userId: string, cursor?: string) =>
      ['notifications', 'list', userId, cursor || ''] as const,

    /**
     * Query key for unread notification count for a user
     * @param userId - User ID
     */
    count: (userId: string) => ['notifications', 'count', userId] as const,
  },

  users: {
    /**
     * Query key for user profile data
     * @param userId - User ID
     */
    profile: (userId: string) => ['users', 'profile', userId] as const,

    /**
     * Query key for mutual events between two users
     * @param currentUserId - Current user ID
     * @param otherUserId - Other user ID
     */
    mutualEvents: (currentUserId: string, otherUserId: string) =>
      ['users', 'mutualEvents', currentUserId, otherUserId] as const,
  },
} as const;
