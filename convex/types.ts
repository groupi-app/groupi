/**
 * Convex Type Definitions
 *
 * These types replace Prisma enums and provide the same type safety
 * while being compatible with Convex schema definitions.
 */

// RSVP and Availability Status
export type Status = 'YES' | 'MAYBE' | 'NO' | 'PENDING';

// Membership Roles
export type Role = 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';

// Notification Types
export type NotificationType =
  | 'EVENT_EDITED' // When the details of an event that the receiving user is a member of is edited
  | 'NEW_POST' // When a new post is created in an event that the receiving user is a member of
  | 'NEW_REPLY' // When a new reply is created in a post that the receiving user has interacted with
  | 'DATE_CHOSEN' // When the organizer of an event that the receiving user is a member of chooses a date
  | 'DATE_CHANGED' // When the organizer of an event that the receiving user is a member of changes the chosen date to a new single date
  | 'DATE_RESET' // When the organizer of an event that the receiving user is a member of starts a new poll for the date
  | 'USER_JOINED' // When another user joins an event that the receiving user owns or moderates
  | 'USER_LEFT' // When another user leaves an event that the receiving user owns or moderates
  | 'USER_PROMOTED' // When the receiving user is promoted to moderator of an event
  | 'USER_DEMOTED' // When the receiving user is demoted from moderator of an event
  | 'USER_RSVP' // When a user RSVPs to an event
  | 'USER_MENTIONED' // When a user is @mentioned in a post or reply
  | 'EVENT_REMINDER' // When an event is starting soon (scheduled reminder)
  | 'ADDON_CONFIG_RESET'; // When an addon's config changes and responses are cleared

// Reminder Offset Types (how far before the event to send reminder)
export type ReminderOffset =
  | '30_MINUTES'
  | '1_HOUR'
  | '2_HOURS'
  | '4_HOURS'
  | '1_DAY'
  | '2_DAYS'
  | '3_DAYS'
  | '1_WEEK'
  | '2_WEEKS'
  | '4_WEEKS';

// Reminder offset values in milliseconds
export const REMINDER_OFFSETS: Record<ReminderOffset, number> = {
  '30_MINUTES': 30 * 60 * 1000,
  '1_HOUR': 60 * 60 * 1000,
  '2_HOURS': 2 * 60 * 60 * 1000,
  '4_HOURS': 4 * 60 * 60 * 1000,
  '1_DAY': 24 * 60 * 60 * 1000,
  '2_DAYS': 2 * 24 * 60 * 60 * 1000,
  '3_DAYS': 3 * 24 * 60 * 60 * 1000,
  '1_WEEK': 7 * 24 * 60 * 60 * 1000,
  '2_WEEKS': 14 * 24 * 60 * 60 * 1000,
  '4_WEEKS': 28 * 24 * 60 * 60 * 1000,
};

// Notification Method Types
export type NotificationMethodType = 'EMAIL' | 'PUSH' | 'WEBHOOK';

// Webhook Formats
export type WebhookFormat =
  | 'DISCORD'
  | 'SLACK'
  | 'TEAMS'
  | 'GENERIC'
  | 'CUSTOM';

// Utility type to mimic Prisma's $Enums
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
    EVENT_EDITED: 'EVENT_EDITED' as const,
    NEW_POST: 'NEW_POST' as const,
    NEW_REPLY: 'NEW_REPLY' as const,
    DATE_CHOSEN: 'DATE_CHOSEN' as const,
    DATE_CHANGED: 'DATE_CHANGED' as const,
    DATE_RESET: 'DATE_RESET' as const,
    USER_JOINED: 'USER_JOINED' as const,
    USER_LEFT: 'USER_LEFT' as const,
    USER_PROMOTED: 'USER_PROMOTED' as const,
    USER_DEMOTED: 'USER_DEMOTED' as const,
    USER_RSVP: 'USER_RSVP' as const,
    USER_MENTIONED: 'USER_MENTIONED' as const,
    EVENT_REMINDER: 'EVENT_REMINDER' as const,
    ADDON_CONFIG_RESET: 'ADDON_CONFIG_RESET' as const,
  },
  ReminderOffset: {
    '15_MINUTES': '15_MINUTES' as const,
    '1_HOUR': '1_HOUR' as const,
    '1_DAY': '1_DAY' as const,
    '1_WEEK': '1_WEEK' as const,
  },
  NotificationMethodType: {
    EMAIL: 'EMAIL' as const,
    PUSH: 'PUSH' as const,
    WEBHOOK: 'WEBHOOK' as const,
  },
  WebhookFormat: {
    DISCORD: 'DISCORD' as const,
    SLACK: 'SLACK' as const,
    TEAMS: 'TEAMS' as const,
    GENERIC: 'GENERIC' as const,
    CUSTOM: 'CUSTOM' as const,
  },
} as const;

/**
 * User type representing a Better Auth component user
 * Better Auth manages users as a component, so "users" is not a valid TableName
 * Note: For user ID types, use AuthUserId exported from auth.ts
 */
export interface User {
  _id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string | null;
  role?: string | null;
}

/**
 * Account type for linked OAuth accounts
 */
export interface Account {
  id: string;
  providerId: string;
  accountId?: string;
  username?: string;
}
