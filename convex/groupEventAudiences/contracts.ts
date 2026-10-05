import { v } from 'convex/values';
import { logisticsEventValidator } from '../events/admissionContracts';
export const sharingPolicy = v.union(
  v.literal('MANAGERS'),
  v.literal('MEMBERS')
);
export const target = { eventId: v.id('events'), groupId: v.id('groups') };
export const grant = v.object({
  groupId: v.id('groups'),
  name: v.string(),
  canWithdraw: v.boolean(),
});
export const audience = v.object({
  eventId: v.id('events'),
  friendsShared: v.union(v.boolean(), v.null()),
  canManageEvent: v.boolean(),
  groups: v.array(grant),
});
export const result = v.object({
  eventId: v.id('events'),
  groupId: v.id('groups'),
  shared: v.boolean(),
});
export const preview = v.object({
  event: logisticsEventValidator,
  canWithdraw: v.boolean(),
});
export const page = v.object({
  page: v.array(preview),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
