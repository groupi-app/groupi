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
  return {
    group: group ? { id: group._id, title: group.name } : null,
    groupInvite: permitted ? { id: invite._id, status: invite.status } : null,
  };
}
