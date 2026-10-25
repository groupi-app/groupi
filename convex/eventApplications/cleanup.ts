import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
/** Bounded batches inside the deleting transaction: no private orphaned history. */
export async function deleteEventApplications(
  ctx: MutationCtx,
  eventId: Id<'events'>
) {
  for (;;) {
    const rows = await ctx.db
      .query('eventApplications')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .take(100);
    if (!rows.length) return;
    for (const row of rows) {
      const actors = await ctx.db
        .query('eventApplicationActors')
        .withIndex('by_application', q => q.eq('applicationId', row._id))
        .collect();
      for (const actor of actors) await ctx.db.delete(actor._id);
      await ctx.db.delete(row._id);
    }
  }
}
export async function deletePersonApplications(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  for (;;) {
    const rows = await ctx.db
      .query('eventApplications')
      .withIndex('by_person', q => q.eq('personId', personId))
      .take(100);
    if (!rows.length) break;
    for (const row of rows) {
      const actors = await ctx.db
        .query('eventApplicationActors')
        .withIndex('by_application', q => q.eq('applicationId', row._id))
        .collect();
      for (const actor of actors) await ctx.db.delete(actor._id);
      await ctx.db.delete(row._id);
    }
  }
  // Reviewer references are retained only while the referenced account exists.
  // Index reviewer IDs explicitly so deletion never scans unrelated submissions.
  for (;;) {
    const rows = await ctx.db
      .query('eventApplicationActors')
      .withIndex('by_person', q => q.eq('personId', personId))
      .take(100);
    if (!rows.length) break;
    for (const row of rows) {
      const application = await ctx.db.get(row.applicationId);
      if (application)
        await ctx.db.patch(application._id, {
          decisions: application.decisions.map(d =>
            d.actorId === personId ? { ...d, actorId: undefined } : d
          ),
        });
      await ctx.db.delete(row._id);
    }
  }
}
