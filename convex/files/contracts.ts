import { v } from 'convex/values';
export const uploadDetails = v.object({
  storageId: v.id('_storage'),
  filename: v.string(),
  mimeType: v.string(),
  size: v.number(),
  url: v.union(v.string(), v.null()),
});
