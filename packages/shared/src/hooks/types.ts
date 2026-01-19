/**
 * Type abstractions for Convex integration
 * Allows the shared package to work with any Convex schema
 *
 * These are intentionally typed as 'any' because:
 * 1. The shared package must work with any Convex schema without knowing the exact types
 * 2. The consuming app (web/mobile) provides the actual typed API at runtime
 * 3. Using 'unknown' would require extensive casting throughout the codebase
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Generic types that will be provided by the consuming app
export type ConvexApi = any;
export type ConvexDataModel = any;
export type ConvexId<T extends string> = string & { __tableName: T };

// Hook type helpers - simplified for cross-platform compatibility
export type ConvexQuery<T = unknown> = T;
export type ConvexMutation<T = unknown> = (...args: unknown[]) => Promise<T>;
/* eslint-enable @typescript-eslint/no-explicit-any */

// Status and role enums (duplicated to avoid dependencies)
export type Status = 'YES' | 'MAYBE' | 'NO' | 'PENDING';
export type Role = 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
export type NotificationType =
  | 'EVENT_INVITE'
  | 'POST_MENTION'
  | 'EVENT_UPDATE'
  | 'POST_REPLY'
  | 'AVAILABILITY_REMINDER';

export const ConvexEnums = {
  Status: {
    YES: 'YES' as const,
    MAYBE: 'MAYBE' as const,
    NO: 'NO' as const,
    PENDING: 'PENDING' as const,
  },
  Role: {
    ORGANIZER: 'ORGANIZER' as const,
    MODERATOR: 'MODERATOR' as const,
    ATTENDEE: 'ATTENDEE' as const,
  },
  NotificationType: {
    EVENT_INVITE: 'EVENT_INVITE' as const,
    POST_MENTION: 'POST_MENTION' as const,
    EVENT_UPDATE: 'EVENT_UPDATE' as const,
    POST_REPLY: 'POST_REPLY' as const,
    AVAILABILITY_REMINDER: 'AVAILABILITY_REMINDER' as const,
  },
} as const;
