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
    // Discord-style status system
    status: v.optional(
      v.union(
        v.literal('ONLINE'),
        v.literal('IDLE'),
        v.literal('DO_NOT_DISTURB'),
        v.literal('INVISIBLE')
      )
    ),
    statusExpiresAt: v.optional(v.number()), // Unix timestamp when status should revert to ONLINE
    statusSetAt: v.optional(v.number()), // When status was manually set
    autoIdleEnabled: v.optional(v.boolean()), // Default true - whether to auto-set IDLE on AFK
    statusVisibility: v.optional(
      v.union(v.literal('EVERYONE'), v.literal('FRIENDS'), v.literal('NONE'))
    ),
  }).index('by_user_id', ['userId']),

  personSettings: defineTable({
    personId: v.id('persons'),
    updatedAt: v.optional(v.number()), // Unix timestamp
    // Privacy settings
    allowFriendRequestsFrom: v.optional(
      v.union(
        v.literal('EVERYONE'),
        v.literal('EVENT_MEMBERS'),
        v.literal('NO_ONE')
      )
    ),
    allowEventInvitesFrom: v.optional(
      v.union(
        v.literal('EVERYONE'),
        v.literal('EVENT_MEMBERS'),
        v.literal('FRIENDS'),
        v.literal('NO_ONE')
      )
    ),
  }).index('by_person', ['personId']),

  events: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')), // Optional cover image
    imageFocalPoint: v.optional(
      v.object({
        x: v.number(), // 0-1 normalized (0.5 = center)
        y: v.number(), // 0-1 normalized (0.5 = center)
      })
    ), // Focal point for cropping cover image
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
    // Event visibility - who can discover this event (undefined = PRIVATE)
    visibility: v.optional(
      v.union(v.literal('PRIVATE'), v.literal('FRIENDS'), v.literal('PUBLIC'))
    ),
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
    rsvpNote: v.optional(v.string()), // Optional RSVP note (max 200 chars, visible to author + organizers/moderators)
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
    note: v.optional(v.string()), // Optional organizer note (max 200 chars, visible to all members)
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
    note: v.optional(v.string()), // Optional note (max 200 chars, visible to author + organizers/moderators)
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
    // Email invite fields
    email: v.optional(v.string()), // Recipient email address
    recipientName: v.optional(v.string()), // Recipient name (from CSV/manual)
    emailSentAt: v.optional(v.number()), // Unix timestamp when email was sent (null = pending)
    customMessage: v.optional(v.string()), // Custom message for email (max 480 chars)
  })
    .index('by_event', ['eventId'])
    .index('by_creator', ['createdById'])
    .index('by_token', ['token'])
    .index('by_event_email', ['eventId', 'email']),

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
      v.literal('EVENT_REMINDER'),
      v.literal('FRIEND_REQUEST_RECEIVED'),
      v.literal('FRIEND_REQUEST_ACCEPTED'),
      v.literal('EVENT_INVITE_RECEIVED'),
      v.literal('EVENT_INVITE_ACCEPTED'),
      v.literal('ADDON_CONFIG_RESET'),
      v.literal('ADDON_AUTOMATION')
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
      v.literal('EVENT_REMINDER'),
      v.literal('FRIEND_REQUEST_RECEIVED'),
      v.literal('FRIEND_REQUEST_ACCEPTED'),
      v.literal('EVENT_INVITE_RECEIVED'),
      v.literal('EVENT_INVITE_ACCEPTED'),
      v.literal('ADDON_CONFIG_RESET'),
      v.literal('ADDON_AUTOMATION')
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

  // ===== REMINDER OPT-OUT TABLES =====
  // Track users who opted out of event reminders

  reminderOptOuts: defineTable({
    personId: v.id('persons'),
    eventId: v.id('events'),
    optedOutAt: v.number(), // Unix timestamp
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_person', ['personId'])
    .index('by_event', ['eventId'])
    .index('by_person_event', ['personId', 'eventId']),

  // ===== ADD-ON TABLES =====
  // Generic add-on configuration for events (replaces per-feature fields like reminderOffset)

  eventAddonConfigs: defineTable({
    eventId: v.id('events'),
    addonType: v.string(), // e.g. 'reminders'
    enabled: v.boolean(),
    config: v.any(), // addon-specific JSON
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_event', ['eventId'])
    .index('by_event_addon', ['eventId', 'addonType']),

  addonData: defineTable({
    eventId: v.id('events'),
    addonType: v.string(),
    key: v.string(), // addon-defined key (e.g. 'vote:option1', 'expense:123')
    data: v.any(), // addon-defined payload
    createdBy: v.optional(v.id('persons')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_event_addon', ['eventId', 'addonType'])
    .index('by_event_addon_key', ['eventId', 'addonType', 'key'])
    .index('by_event_addon_creator', ['eventId', 'addonType', 'createdBy']),

  addonTemplates: defineTable({
    ownerId: v.id('persons'),
    name: v.string(),
    description: v.string(),
    iconName: v.string(),
    template: v.any(), // full CustomAddonTemplate (validated before save)
    version: v.number(),
    isPublished: v.boolean(), // draft vs ready to use
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_owner_published', ['ownerId', 'isPublished']),

  addonOptOuts: defineTable({
    personId: v.id('persons'),
    eventId: v.id('events'),
    addonType: v.string(),
    optedOutAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_person', ['personId'])
    .index('by_event', ['eventId'])
    .index('by_person_event_addon', ['personId', 'eventId', 'addonType']),

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

  // ===== THEME TABLES =====
  // Store custom themes and user theme preferences

  customThemes: defineTable({
    personId: v.id('persons'),
    name: v.string(),
    description: v.optional(v.string()),
    baseThemeId: v.string(), // Which base theme this extends (e.g., 'groupi-light')
    mode: v.union(v.literal('light'), v.literal('dark')), // Inherited from base theme
    // Token overrides - only stores values that differ from base theme
    tokenOverrides: v.object({
      brand: v.optional(
        v.object({
          primary: v.optional(v.string()),
          primaryHover: v.optional(v.string()),
          secondary: v.optional(v.string()),
          secondaryHover: v.optional(v.string()),
          accent: v.optional(v.string()),
          accentHover: v.optional(v.string()),
        })
      ),
      background: v.optional(
        v.object({
          page: v.optional(v.string()),
          surface: v.optional(v.string()),
          elevated: v.optional(v.string()),
          sunken: v.optional(v.string()),
        })
      ),
      text: v.optional(
        v.object({
          primary: v.optional(v.string()),
          secondary: v.optional(v.string()),
          heading: v.optional(v.string()),
          muted: v.optional(v.string()),
        })
      ),
      status: v.optional(
        v.object({
          success: v.optional(v.string()),
          warning: v.optional(v.string()),
          error: v.optional(v.string()),
          info: v.optional(v.string()),
        })
      ),
      shadow: v.optional(
        v.object({
          raised: v.optional(v.string()),
          floating: v.optional(v.string()),
        })
      ),
    }),
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  }).index('by_person', ['personId']),

  themePreferences: defineTable({
    personId: v.id('persons'),
    selectedThemeType: v.union(v.literal('base'), v.literal('custom')),
    selectedThemeId: v.string(), // Base theme ID (e.g., 'groupi-light')
    selectedCustomThemeId: v.optional(v.id('customThemes')), // If type is 'custom'
    useSystemPreference: v.boolean(), // Whether to auto-switch based on OS setting
    systemLightThemeId: v.string(), // Base theme for light mode
    systemDarkThemeId: v.string(), // Base theme for dark mode
    updatedAt: v.number(), // Unix timestamp
  }).index('by_person', ['personId']),

  // ===== FRIENDSHIP TABLES =====
  // Track friend relationships between users

  friendships: defineTable({
    requesterId: v.id('persons'), // Who sent the friend request
    addresseeId: v.id('persons'), // Who received the friend request
    status: v.union(
      v.literal('PENDING'),
      v.literal('ACCEPTED'),
      v.literal('DECLINED')
    ),
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_requester', ['requesterId'])
    .index('by_addressee', ['addresseeId'])
    .index('by_requester_addressee', ['requesterId', 'addresseeId'])
    .index('by_addressee_status', ['addresseeId', 'status']),

  // ===== USER BLOCK TABLES =====
  // Track blocked users - blocked users cannot send friend requests or event invites

  userBlocks: defineTable({
    blockerId: v.id('persons'), // Who blocked
    blockedId: v.id('persons'), // Who is blocked
    createdAt: v.number(), // Unix timestamp
  })
    .index('by_blocker', ['blockerId'])
    .index('by_blocked', ['blockedId'])
    .index('by_blocker_blocked', ['blockerId', 'blockedId']),

  // ===== EVENT INVITE TABLES =====
  // Track internal event invites sent between users

  eventInvites: defineTable({
    eventId: v.id('events'),
    inviterId: v.id('persons'), // Who sent the invite
    inviteeId: v.id('persons'), // Who receives the invite
    status: v.union(
      v.literal('PENDING'),
      v.literal('ACCEPTED'),
      v.literal('DECLINED')
    ),
    message: v.optional(v.string()), // Optional personal message
    role: v.union(v.literal('ATTENDEE'), v.literal('MODERATOR')),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index('by_event', ['eventId'])
    .index('by_invitee', ['inviteeId'])
    .index('by_invitee_status', ['inviteeId', 'status'])
    .index('by_event_invitee', ['eventId', 'inviteeId']),
});
