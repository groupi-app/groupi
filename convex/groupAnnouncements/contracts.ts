import { v } from 'convex/values';
export const input = {
  groupId: v.id('groups'),
  requestId: v.string(),
  title: v.string(),
  message: v.string(),
};
export const state = v.union(
  v.literal('PROCESSING'),
  v.literal('COMPLETED'),
  v.literal('CANCELLED')
);
export const result = v.object({
  announcementId: v.id('groupAnnouncements'),
  state,
  notified: v.number(),
  skipped: v.number(),
});
