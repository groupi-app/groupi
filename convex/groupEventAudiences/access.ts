import { checkIfFriends, checkIsBlocked } from '../lib/privacy';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { canAccessGroupMemberContent } from '../groups/contentAccess';
type ReadCtx = QueryCtx | MutationCtx;
/** Every Group grant uses current membership, bans and required onboarding. */
export async function hasGroupAudience(
  ctx: ReadCtx,
  event: Doc<'events'>,
  personId?: Id<'persons'>
) {
  if (!personId) return false;
  for await (const grant of ctx.db
    .query('groupEventAudiences')
    .withIndex('by_eventId', q => q.eq('eventId', event._id)))
    if (await canAccessGroupMemberContent(ctx, grant.groupId, personId))
      return true;
  return false;
}

export async function eventDiscoveryReasons(
  ctx: ReadCtx,
  event: Doc<'events'>,
  personId: Id<'persons'>
) {
  const friends = Boolean(
    (event.friendsAudienceEnabled ?? event.visibility === 'FRIENDS') &&
      (await checkIfFriends(ctx, personId, event.creatorId)) &&
      !(await checkIsBlocked(ctx, personId, event.creatorId))
  );
  const groups: { groupId: Id<'groups'>; name: string }[] = [];
  for await (const grant of ctx.db
    .query('groupEventAudiences')
    .withIndex('by_eventId', q => q.eq('eventId', event._id))) {
    if (!(await canAccessGroupMemberContent(ctx, grant.groupId, personId)))
      continue;
    const group = await ctx.db.get(grant.groupId);
    if (group) groups.push({ groupId: group._id, name: group.name });
  }
  return { friends, groups };
}
