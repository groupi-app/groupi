import {
  classifyEventLifecycle,
  isScheduledEventComplete,
} from '@groupi/shared/utils';
import { reconcileEventExclusions } from '../groups/exclusions';
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
/** Authoritative completion rule; expired open date polls are deliberately excluded. */
export { isScheduledEventComplete as isEventComplete } from '@groupi/shared/utils';
/** Display/selection eligibility only. Never use this for cleanup or access revocation.
 * Saved Event routes and participation remain governed by their existing permissions.
 */
export async function isEventCurrentCandidate(
  ctx: QueryCtx | MutationCtx,
  event: Doc<'events'>,
  now: number
) {
  if (isScheduledEventComplete(event, now)) return false;
  if (event.chosenDateTime !== undefined) return true;
  const options = await ctx.db
    .query('potentialDateTimes')
    .withIndex('by_event', q => q.eq('eventId', event._id))
    .collect();
  return (
    classifyEventLifecycle({ ...event, potentialDateTimes: options }, now) !==
    'NEEDS_NEW_DATES'
  );
}

/** Every operation which can reactivate an Event or add an audience passes here.
 * G8 owns the exclusion reconciliation fence at this boundary, before any patch.
 * Explicitly completed Events require the
 * versioned lifecycle operation, preventing legacy scheduling from reopening them.
 */
export async function guardEventReactivation(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  explicit = false
) {
  const event = await ctx.db.get(eventId);
  if (!event)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Event not found.' });
  if (event.completedAt !== undefined && !explicit)
    throw new ConvexError({
      code: 'CONFLICT',
      message: 'Use Reopen Event before changing its date or audiences.',
    });
  await reconcileEventExclusions(ctx, eventId);
  return event;
}
