import { v } from 'convex/values';

export const recipientSkipReason = v.union(
  v.literal('ALREADY_MEMBER'),
  v.literal('INVITATION_PENDING'),
  v.literal('UNAVAILABLE')
);
