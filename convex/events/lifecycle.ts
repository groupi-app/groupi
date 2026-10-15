import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
/** Authoritative completion rule for selection and current/future expulsion cleanup. */
export function isEventComplete(event: Pick<Doc<'events'>, 'chosenEndDateTime' | 'completedAt'>, now: number) {
  return event.completedAt !== undefined || (event.chosenEndDateTime !== undefined && event.chosenEndDateTime <= now);
}
/** Every operation which can reactivate an Event or add an audience passes here.
 * G8 owns the exclusion reconciliation fence at this boundary, before any patch.
 * No exclusion records exist in G4. Explicitly completed Events require the
 * versioned lifecycle operation, preventing legacy scheduling from reopening them.
 */
export async function guardEventReactivation(ctx: MutationCtx, eventId: Id<'events'>, explicit = false) {
  const event = await ctx.db.get(eventId);
  if (!event) throw new ConvexError({ code: 'NOT_FOUND', message: 'Event not found.' });
  if (event.completedAt !== undefined && !explicit)
    throw new ConvexError({ code: 'CONFLICT', message: 'Use Reopen Event before changing its date or audiences.' });
  return event;
}
