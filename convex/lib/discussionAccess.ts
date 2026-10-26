import { requireGroupMemberContent } from '../groups/contentAccess';
import { membershipFor } from '../groups/policy';
import { requireNoEventExclusion } from '../groups/exclusions';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { ConvexError } from 'convex/values';
export async function requireDiscussionRole(
  ctx: MutationCtx | QueryCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>,
  role: 'ATTENDEE' | 'MODERATOR' | 'ORGANIZER'
) {
  await requireNoEventExclusion(ctx, eventId, personId);
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();
  const rank = { ATTENDEE: 1, MODERATOR: 2, ORGANIZER: 3 };
  if (!membership || rank[membership.role] < rank[role])
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'You do not have permission for this event content.',
    });
  return membership;
}

export type DiscussionParent = {
  eventId?: Id<'events'>;
  groupId?: Id<'groups'>;
};
/** Stored canonical posts have exactly one parent; legacy Event rows already satisfy this. */
export function discussionParent(parent: DiscussionParent) {
  if (Boolean(parent.eventId) === Boolean(parent.groupId))
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'A post must have exactly one Event or Group parent.',
    });
  return parent.eventId
    ? { eventId: parent.eventId }
    : { groupId: parent.groupId! };
}
export function requireEventPost<T extends DiscussionParent>(post: T) {
  if (!post.eventId || post.groupId)
    throw new ConvexError({
      code: 'NOT_FOUND',
      message: 'Event post not found.',
    });
  return { ...post, eventId: post.eventId };
}
export async function requireDiscussionParent(
  ctx: MutationCtx | QueryCtx,
  parent: DiscussionParent,
  personId: Id<'persons'>
) {
  const owner = discussionParent(parent);
  if (owner.eventId)
    return requireDiscussionRole(ctx, owner.eventId, personId, 'ATTENDEE');
  await requireGroupMemberContent(ctx, owner.groupId!, personId);
  return null;
}
export async function discussionPermissions(
  ctx: MutationCtx | QueryCtx,
  parent: DiscussionParent,
  personId: Id<'persons'>
) {
  const membership = await requireDiscussionParent(ctx, parent, personId);
  if (parent.eventId)
    return {
      membershipId: membership!._id,
      canManage: membership!.role !== 'ATTENDEE',
    };
  const member = await membershipFor(ctx, parent.groupId!, personId);
  return {
    membershipId: undefined,
    canManage: member?.role === 'OWNER' || member?.role === 'MODERATOR',
  };
}
