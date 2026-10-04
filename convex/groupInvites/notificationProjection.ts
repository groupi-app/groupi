import { membershipFor } from '../groups/policy';
import type { QueryCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';
export async function groupNotificationReferences(
  ctx: QueryCtx,
  notification: Doc<'notifications'>
) {
  if (!notification.groupId) return {};
  const group = await ctx.db.get(notification.groupId);
  const invite = notification.groupInviteId
    ? await ctx.db.get(notification.groupInviteId)
    : null;
  const permitted =
    invite &&
    (invite.inviteeId === notification.personId ||
      invite.inviterId === notification.personId);
  const application = notification.groupApplicationId
    ? await ctx.db.get(notification.groupApplicationId)
    : null;
  const membership = application
    ? await membershipFor(ctx, application.groupId, notification.personId)
    : null;
  const canSeeApplication =
    application &&
    (application.personId === notification.personId ||
      (membership && membership.role !== 'MEMBER'));
  return {
    groupApplication: canSeeApplication
      ? { id: application._id, status: application.status }
      : null,
    group: group ? { id: group._id, title: group.name } : null,
    groupInvite: permitted ? { id: invite._id, status: invite.status } : null,
  };
}
