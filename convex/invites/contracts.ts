import { v } from 'convex/values';
export const linkSummary = v.object({
  id: v.id('invites'),
  eventId: v.id('events'),
  token: v.string(),
  name: v.union(v.string(), v.null()),
  maxUses: v.union(v.number(), v.null()),
  usesTotal: v.union(v.number(), v.null()),
  usesRemaining: v.union(v.number(), v.null()),
  expiresAt: v.union(v.number(), v.null()),
  createdAt: v.number(),
  kind: v.union(v.literal('link'), v.literal('email')),
  email: v.union(v.string(), v.null()),
  recipientName: v.union(v.string(), v.null()),
  customMessage: v.union(v.string(), v.null()),
  emailStatus: v.union(v.literal('pending'), v.literal('queued'), v.null()),
});
export const memberStatus = v.union(
  v.literal('PENDING'),
  v.literal('ACCEPTED'),
  v.literal('DECLINED')
);
export const memberSummary = v.object({
  inviteId: v.id('eventInvites'),
  eventId: v.id('events'),
  eventTitle: v.string(),
  inviterId: v.id('persons'),
  inviteeId: v.id('persons'),
  role: v.union(v.literal('ATTENDEE'), v.literal('MODERATOR')),
  status: memberStatus,
  message: v.union(v.string(), v.null()),
  createdAt: v.number(),
  respondedAt: v.union(v.number(), v.null()),
});
export const creationResult = v.union(
  v.object({ id: v.id('invites'), token: v.string() }),
  v.object({
    createdCount: v.number(),
    inviteIds: v.array(v.id('invites')),
    queuedCount: v.number(),
  }),
  v.object({ queuedCount: v.number() }),
  v.object({ inviteId: v.id('eventInvites'), status: v.literal('PENDING') })
);
export const creationBody = v.union(
  v.object({
    kind: v.literal('link'),
    eventId: v.id('events'),
    name: v.optional(v.string()),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.string()),
  }),
  v.object({
    kind: v.literal('email'),
    eventId: v.id('events'),
    invites: v.array(
      v.object({
        email: v.string(),
        recipientName: v.optional(v.string()),
        plusOnes: v.optional(v.number()),
      })
    ),
    customMessage: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    send: v.optional(v.boolean()),
  }),
  v.object({ kind: v.literal('pending'), eventId: v.id('events') }),
  v.object({
    kind: v.literal('member'),
    eventId: v.id('events'),
    username: v.string(),
    role: v.optional(v.union(v.literal('ATTENDEE'), v.literal('MODERATOR'))),
    message: v.optional(v.string()),
  })
);
