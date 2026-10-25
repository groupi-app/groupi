import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
export async function removeTransfersForGroup(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  for await (const row of ctx.db
    .query('groupTransfers')
    .withIndex('by_group', q => q.eq('groupId', groupId)))
    await ctx.db.delete(row._id);
}
/** Surviving shared consent history keeps outcomes while removing personal references. */
export async function removeTransfersForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  for await (const row of ctx.db
    .query('groupTransfers')
    .withIndex('by_offeredBy', q => q.eq('offeredById', personId)))
    await ctx.db.patch(row._id, {
      offeredById: undefined,
      ...(row.status === 'PENDING'
        ? { status: 'CANCELLED' as const, resolvedAt: Date.now() }
        : {}),
    });
  for await (const row of ctx.db
    .query('groupTransfers')
    .withIndex('by_recipient', q => q.eq('recipientId', personId)))
    await ctx.db.patch(row._id, {
      recipientId: undefined,
      ...(row.status === 'PENDING'
        ? { status: 'CANCELLED' as const, resolvedAt: Date.now() }
        : {}),
    });
}
