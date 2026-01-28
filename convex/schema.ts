import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Convex Schema for Groupi Application
 *
 * This schema mirrors the Prisma schema but uses Convex's type system.
 * Key differences from Prisma:
 * - No foreign key constraints (relationships handled in code)
 * - All IDs are Convex generated Id<"tableName"> types
 * - Timestamps are numbers (Unix timestamps in milliseconds)
 * - Enums defined as v.union() with literal values
 */

export default defineSchema({
  // ===== AUTHENTICATION TABLES =====
  // NOTE: users, sessions, accounts, verifications are managed by Better Auth component
  // See convex.config.ts for betterAuth component registration

  // Email verification for additional emails (app-managed, not component)
  emailVerifications: defineTable({
    userId: v.string(), // Better Auth component user ID (stored as string)
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(), // Unix timestamp
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_token', ['token'])
    .index('by_user', ['userId'])
    .index('by_email', ['email']),

  // ===== APPLICATION TABLES =====

  persons: defineTable({
    // Link to Better Auth component user (stored as string since it's a component table)
    userId: v.string(), // Better Auth component user ID
    // Denormalized user fields for efficient querying
    bio: v.optional(v.string()),
    pronouns: v.optional(v.string()),
    // Presence tracking
    lastSeen: v.optional(v.number()), // Unix timestamp of last activity
    updatedAt: v.optional(v.number()), // Unix timestamp
  }).index('by_user_id', ['userId']),

  personSettings: defineTable({
    personId: v.id('persons'),
    updatedAt: v.optional(v.number()), // Unix timestamp
    // Future settings can be added here
  }).index('by_person', ['personId']),

  events: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')), // Optional cover image
    // Date/time range for the event (must be updated together to stay in sync)
    // INVARIANT: chosenEndDateTime can only be set if chosenDateTime is set
    // INVARIANT: chosenEndDateTime must be > chosenDateTime when both are set
    chosenDateTime: v.optional(v.number()), // Unix timestamp for start
    chosenEndDateTime: v.optional(v.number()), // Unix timestamp for end (optional)
    creatorId: v.id('persons'), // Person who created the event
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
    timezone: v.string(),
    potentialDateTimes: v.array(v.number()), // Array of Unix timestamps (deprecated, use potentialDateTimes table)
    // Reminder offset - how far before the event to remind attendees (undefined = never)
    reminderOffset: v.optional(
      v.union(
        v.literal('30_MINUTES'),
        v.literal('1_HOUR'),
        v.literal('2_HOURS'),
        v.literal('4_HOURS'),
        v.literal('1_DAY'),
        v.literal('2_DAYS'),
        v.literal('3_DAYS'),
        v.literal('1_WEEK'),
        v.literal('2_WEEKS'),
        v.literal('4_WEEKS')
      )
    ),
  }).index('by_creator', ['creatorId']),

  memberships: defineTable({
    personId: v.id('persons'),
    eventId: v.id('events'),
    role: v.union(
      v.literal('ORGANIZER'),
      v.literal('MODERATOR'),
      v.literal('ATTENDEE')
    ),
    rsvpStatus: v.union(
      v.literal('YES'),
      v.literal('MAYBE'),
      v.literal('NO'),
      v.literal('PENDING')
    ),
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_person', ['personId'])
    .index('by_event', ['eventId'])
    .index('by_person_event', ['personId', 'eventId']),

  potentialDateTimes: defineTable({
    eventId: v.id('events'),
    // Date/time range for a potential event option
    // INVARIANT: endDateTime must be > dateTime when set
    dateTime: v.number(), // Unix timestamp for start time
    endDateTime: v.optional(v.number()), // Unix timestamp for end time (optional)
    updatedAt: v.optional(v.number()), // Unix timestamp
  }).index('by_event', ['eventId']),

  availabilities: defineTable({
    membershipId: v.id('memberships'),
    potentialDateTimeId: v.id('potentialDateTimes'),
    status: v.union(
      v.literal('YES'),
      v.literal('MAYBE'),
      v.literal('NO'),
      v.literal('PENDING')
    ),
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_membership', ['membershipId'])
    .index('by_potential_date', ['potentialDateTimeId'])
    .index('by_membership_date', ['membershipId', 'potentialDateTimeId']),

  posts: defineTable({
    title: v.string(),
    content: v.string(),
    editedAt: v.optional(v.number()), // Unix timestamp for last edit (only set when edited)
    membershipId: v.optional(v.id('memberships')),
    // Denormalized fields for efficient querying
    authorId: v.id('persons'),
    eventId: v.id('events'),
    updatedAt: v.optional(v.number()), // Unix timestamp for tracking changes
  })
    .index('by_event', ['eventId'])
    .index('by_author', ['authorId'])
    .index('by_membership', ['membershipId']),

  replies: defineTable({
    text: v.string(),
    membershipId: v.optional(v.id('memberships')),
    updatedAt: v.optional(v.number()), // Unix timestamp for last edit
    // Denormalized fields
    authorId: v.id('persons'),
    postId: v.id('posts'),
  })
    .index('by_post', ['postId'])
    .index('by_author', ['authorId'])
    .index('by_membership', ['membershipId']),

  invites: defineTable({
    eventId: v.id('events'),
    createdById: v.id('memberships'), // Membership that created the invite
    expiresAt: v.optional(v.number()),
    usesRemaining: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    usesTotal: v.optional(v.number()), // Total number of uses
    name: v.optional(v.string()),
    token: v.string(), // Invite token for sharing
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_event', ['eventId'])
    .index('by_creator', ['createdById'])
    .index('by_token', ['token']),

  notifications: defineTable({
    personId: v.id('persons'),
    authorId: v.optional(v.id('persons')),
    type: v.union(
      v.literal('EVENT_EDITED'),
      v.literal('NEW_POST'),
      v.literal('NEW_REPLY'),
      v.literal('DATE_CHOSEN'),
      v.literal('DATE_CHANGED'),
      v.literal('DATE_RESET'),
      v.literal('USER_JOINED'),
      v.literal('USER_LEFT'),
      v.literal('USER_PROMOTED'),
      v.literal('USER_DEMOTED'),
      v.literal('USER_RSVP'),
      v.literal('USER_MENTIONED'),
      v.literal('EVENT_REMINDER')
    ),
    eventId: v.optional(v.id('events')),
    postId: v.optional(v.id('posts')),
    read: v.boolean(),
    datetime: v.optional(v.number()),
    rsvp: v.optional(
      v.union(
        v.literal('YES'),
        v.literal('MAYBE'),
        v.literal('NO'),
        v.literal('PENDING')
      )
    ),
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_person', ['personId'])
    .index('by_event', ['eventId'])
    .index('by_post', ['postId'])
    .index('by_person_read', ['personId', 'read']),

  notificationMethods: defineTable({
    settingsId: v.id('personSettings'),
    type: v.union(v.literal('EMAIL'), v.literal('PUSH'), v.literal('WEBHOOK')),
    enabled: v.boolean(),
    name: v.optional(v.string()), // "Work Email", "Personal Webhook"
    value: v.string(), // Email address, webhook URL, etc.
    // Webhook-specific configuration
    webhookHeaders: v.optional(v.any()), // JSON object
    customTemplate: v.optional(v.string()),
    webhookFormat: v.optional(
      v.union(
        v.literal('DISCORD'),
        v.literal('SLACK'),
        v.literal('TEAMS'),
        v.literal('GENERIC'),
        v.literal('CUSTOM')
      )
    ),
    updatedAt: v.optional(v.number()), // Unix timestamp
  }).index('by_settings', ['settingsId']),

  notificationSettings: defineTable({
    notificationType: v.union(
      v.literal('EVENT_EDITED'),
      v.literal('NEW_POST'),
      v.literal('NEW_REPLY'),
      v.literal('DATE_CHOSEN'),
      v.literal('DATE_CHANGED'),
      v.literal('DATE_RESET'),
      v.literal('USER_JOINED'),
      v.literal('USER_LEFT'),
      v.literal('USER_PROMOTED'),
      v.literal('USER_DEMOTED'),
      v.literal('USER_RSVP'),
      v.literal('USER_MENTIONED'),
      v.literal('EVENT_REMINDER')
    ),
    methodId: v.id('notificationMethods'),
    enabled: v.boolean(),
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_method', ['methodId'])
    .index('by_type_method', ['notificationType', 'methodId']),

  // ===== ATTACHMENT TABLES =====
  // Store file attachments for posts and replies (Discord-style)

  attachments: defineTable({
    storageId: v.id('_storage'), // Convex file storage reference
    type: v.union(
      v.literal('IMAGE'),
      v.literal('VIDEO'),
      v.literal('AUDIO'),
      v.literal('FILE')
    ),
    filename: v.string(), // Original filename
    size: v.number(), // File size in bytes
    mimeType: v.string(), // MIME type (e.g., "image/png")
    width: v.optional(v.number()), // Image/video width (for gallery layout)
    height: v.optional(v.number()), // Image/video height (for gallery layout)
    // Spoiler and description (Discord-style)
    isSpoiler: v.optional(v.boolean()), // Mark as spoiler (blur until clicked)
    altText: v.optional(v.string()), // Alt text / description for accessibility
    // Parent reference (exactly one should be set)
    postId: v.optional(v.id('posts')),
    replyId: v.optional(v.id('replies')),
    // Uploader reference
    uploaderId: v.id('persons'),
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_post', ['postId'])
    .index('by_reply', ['replyId'])
    .index('by_uploader', ['uploaderId']),

  // ===== MUTING TABLES =====
  // Track muted events and posts to suppress notifications

  mutedEvents: defineTable({
    personId: v.id('persons'),
    eventId: v.id('events'),
    mutedAt: v.number(), // Unix timestamp
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_person', ['personId'])
    .index('by_event', ['eventId'])
    .index('by_person_event', ['personId', 'eventId']),

  mutedPosts: defineTable({
    personId: v.id('persons'),
    postId: v.id('posts'),
    mutedAt: v.number(), // Unix timestamp
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_person', ['personId'])
    .index('by_post', ['postId'])
    .index('by_person_post', ['personId', 'postId']),

  // ===== BAN TABLES =====
  // Track banned users from events

  eventBans: defineTable({
    personId: v.id('persons'),
    eventId: v.id('events'),
    bannedAt: v.number(), // Unix timestamp
    bannedById: v.id('persons'),
    reason: v.optional(v.string()),
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_person', ['personId'])
    .index('by_event', ['eventId'])
    .index('by_person_event', ['personId', 'eventId']),

  // ===== REMINDER TABLES =====
  // Track scheduled event reminders

  eventReminders: defineTable({
    eventId: v.id('events'),
    scheduledTime: v.number(), // When reminder should fire (Unix ms)
    reminderOffset: v.union(
      v.literal('30_MINUTES'),
      v.literal('1_HOUR'),
      v.literal('2_HOURS'),
      v.literal('4_HOURS'),
      v.literal('1_DAY'),
      v.literal('2_DAYS'),
      v.literal('3_DAYS'),
      v.literal('1_WEEK'),
      v.literal('2_WEEKS'),
      v.literal('4_WEEKS')
    ),
    scheduledFunctionId: v.optional(v.id('_scheduled_functions')), // Convex scheduler ID
    status: v.union(
      v.literal('SCHEDULED'),
      v.literal('SENT'),
      v.literal('CANCELLED')
    ),
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_event', ['eventId'])
    .index('by_status', ['status']),
});
