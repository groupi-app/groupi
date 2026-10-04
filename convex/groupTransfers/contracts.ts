import { v } from 'convex/values';
export const transferStatus = v.union(
  v.literal('PENDING'),
  v.literal('ACCEPTED'),
  v.literal('DECLINED'),
  v.literal('CANCELLED')
);
const identity = v.object({
  personId: v.id('persons'),
  name: v.union(v.string(), v.null()),
  username: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
});
export const result = v.object({
  groupId: v.id('groups'),
  ownerId: v.id('persons'),
  transferId: v.union(v.id('groupTransfers'), v.null()),
  offeredById: v.union(v.id('persons'), v.null()),
  recipientId: v.union(v.id('persons'), v.null()),
  recipient: v.union(identity, v.null()),
  status: v.union(v.literal('NONE'), transferStatus),
  explanation: v.string(),
  canOffer: v.boolean(),
  canAccept: v.boolean(),
  canDecline: v.boolean(),
  canCancel: v.boolean(),
});
