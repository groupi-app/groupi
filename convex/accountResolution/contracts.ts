import { v } from 'convex/values';
export const kind = v.union(v.literal('GROUP'), v.literal('EVENT'));
export const item = v.object({
  kind,
  id: v.union(v.id('groups'), v.id('events')),
  title: v.string(),
  status: v.union(
    v.literal('NONE'),
    v.literal('PENDING'),
    v.literal('ACCEPTED'),
    v.literal('DECLINED'),
    v.literal('CANCELLED')
  ),
  transferId: v.union(v.id('groupTransfers'), v.id('eventTransfers'), v.null()),
  recipientId: v.union(v.id('persons'), v.null()),
  resolved: v.literal(false),
});
export const page = v.object({
  page: v.array(item),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
export const readiness = v.object({
  hasOwnedGroups: v.boolean(),
  hasOwnedEvents: v.boolean(),
  canDelete: v.boolean(),
});
export const recipients = v.object({
  page: v.array(v.object({ personId: v.id('persons'), label: v.string() })),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
