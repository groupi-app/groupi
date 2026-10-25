import { v } from 'convex/values';
export const ban = v.object({
  personId: v.id('persons'),
  name: v.union(v.string(), v.null()),
  username: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
  bannedAt: v.number(),
});
export const bansPage = v.object({
  page: v.array(ban),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
