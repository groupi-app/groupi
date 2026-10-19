import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
/** Optional legacy fallback is below new microsecond-space revisions. The durable
 * per-person/Event allocator survives membership deletion and never reuses a revision. */
export function participationRevision(member: Doc<'memberships'>) {
  return (
    member.participationRevision ??
    Math.floor(member.updatedAt ?? member._creationTime)
  );
}
export async function nextParticipationRevision(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>,
  floor = 0
) {
  const previous = await ctx.db
    .query('participationRevisions')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .unique();
  const revision = Math.max(
    Date.now() * 1000,
    (previous?.revision ?? 0) + 1,
    Math.floor(floor) + 1
  );
  if (!Number.isSafeInteger(revision))
    throw new Error('Participation revision exhausted');
  if (previous) await ctx.db.patch(previous._id, { revision });
  else
    await ctx.db.insert('participationRevisions', {
      personId,
      eventId,
      revision,
    });
  return revision;
}

export async function deleteEventParticipationRevisions(
  ctx: MutationCtx,
  eventId: Id<'events'>
) {
  for await (const row of ctx.db
    .query('participationRevisions')
    .withIndex('by_event', q => q.eq('eventId', eventId)))
    await ctx.db.delete(row._id);
}
export async function deletePersonParticipationRevisions(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  for await (const row of ctx.db
    .query('participationRevisions')
    .withIndex('by_person_event', q => q.eq('personId', personId)))
    await ctx.db.delete(row._id);
}
