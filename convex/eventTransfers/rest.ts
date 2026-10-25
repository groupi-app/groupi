import { internalQuery, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import {
  result,
  statusForPerson,
  offerForPerson,
  decideForPerson,
} from './model';
const actor = { eventId: v.id('events'), personId: v.id('persons') };
export const status = internalQuery({
  args: actor,
  returns: v.union(result, v.null()),
  handler: (ctx, { personId, eventId }) =>
    statusForPerson(ctx, personId, eventId),
});
export const offer = internalMutation({
  args: { ...actor, recipientId: v.id('persons') },
  returns: v.union(result, v.null()),
  handler: (ctx, { personId, eventId, recipientId }) =>
    offerForPerson(ctx, personId, eventId, recipientId),
});
export const decide = internalMutation({
  args: {
    ...actor,
    transferId: v.id('eventTransfers'),
    decision: v.union(
      v.literal('ACCEPTED'),
      v.literal('DECLINED'),
      v.literal('CANCELLED')
    ),
  },
  returns: v.union(result, v.null()),
  handler: (ctx, { personId, eventId, transferId, decision }) =>
    decideForPerson(ctx, personId, eventId, transferId, decision),
});
