import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';

/** Remove the Event's consent history at every Event-deletion boundary.
 * Indexed reads are bounded; all batches commit with the Event deletion.
 */
export async function deleteEventTransfers(
  ctx: MutationCtx,
  eventId: Id<'events'>
) {
  while (true) {
    const batch = await ctx.db
      .query('eventTransfers')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .take(100);
    for (const transfer of batch) await ctx.db.delete(transfer._id);
    if (batch.length < 100) return;
  }
}
