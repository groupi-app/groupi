import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
export async function removeModerationForGroup(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  for await (const row of ctx.db
    .query('groupBans')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await ctx.db.delete(row._id);
}
export async function removeModerationForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  for await (const row of ctx.db
    .query('communityExclusionAudit')
    .withIndex('by_person', q => q.eq('personId', personId)))
    await ctx.db.delete(row._id);
  for await (const row of ctx.db
    .query('communityExclusionAudit')
    .withIndex('by_actor', q => q.eq('actorId', personId)))
    await ctx.db.patch(row._id, { actorId: undefined });
  for await (const row of ctx.db
    .query('communityExclusions')
    .withIndex('by_person', q => q.eq('personId', personId)))
    await ctx.db.delete(row._id);
  for await (const row of ctx.db
    .query('communityExclusions')
    .withIndex('by_actor', q => q.eq('actorId', personId)))
    await ctx.db.patch(row._id, { actorId: undefined });
  for await (const row of ctx.db
    .query('communityExclusions')
    .withIndex('by_reinstatedBy', q => q.eq('reinstatedBy', personId)))
    await ctx.db.patch(row._id, { reinstatedBy: undefined });
  for await (const row of ctx.db
    .query('groupBans')
    .withIndex('by_personId', q => q.eq('personId', personId)))
    await ctx.db.delete(row._id);
  for await (const row of ctx.db
    .query('groupBans')
    .withIndex('by_actorId', q => q.eq('actorId', personId)))
    await ctx.db.patch(row._id, { actorId: undefined });
  for await (const row of ctx.db
    .query('groupBans')
    .withIndex('by_liftedBy', q => q.eq('liftedBy', personId)))
    await ctx.db.patch(row._id, { liftedBy: undefined });
}
