import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { canAccessGroupMemberContent } from '../groups/contentAccess';
type ReadCtx = QueryCtx | MutationCtx;
/** Read grant only in T11. Group direct-entry/application actions are later slices. */
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
