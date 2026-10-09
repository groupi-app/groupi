import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
async function remove(
  ctx: MutationCtx,
  applicationId: Id<'groupApplications'>
) {
  for await (const actor of ctx.db
    .query('groupApplicationActors')
    .withIndex('by_applicationId', q => q.eq('applicationId', applicationId)))
    await ctx.db.delete(actor._id);
  for await (const notification of ctx.db
    .query('notifications')
    .withIndex('by_groupApplicationId', q =>
      q.eq('groupApplicationId', applicationId)
    )) {
    for await (const delivery of ctx.db
      .query('pushDeliveries')
      .withIndex('by_notification', q =>
        q.eq('notificationId', notification._id)
      ))
      await ctx.db.delete(delivery._id);
    await ctx.db.delete(notification._id);
  }
  await ctx.db.delete(applicationId);
}
export async function removeApplicationsForGroup(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  for await (const row of ctx.db
    .query('groupApplications')
    .withIndex('by_groupId', q => q.eq('groupId', groupId)))
    await remove(ctx, row._id);
}
export async function removeApplicationsForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  for await (const row of ctx.db
    .query('groupApplications')
    .withIndex('by_personId', q => q.eq('personId', personId)))
    await remove(ctx, row._id);
  for await (const row of ctx.db
    .query('groupApplicationActors')
    .withIndex('by_personId', q => q.eq('personId', personId))) {
    const application = await ctx.db.get(row.applicationId);
    if (application)
      await ctx.db.patch(application._id, {
        decisions: application.decisions.map(decision =>
          decision.actorId === personId
            ? { ...decision, actorId: undefined }
            : decision
        ),
      });
    await ctx.db.delete(row._id);
  }
}
