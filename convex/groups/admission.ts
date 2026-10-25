import { ConvexError } from 'convex/values';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { canEnterGroup, membershipFor } from './policy';
/** Shared atomic admission; onboarding access is computed after membership exists. */
export async function admitGroupMember(
  ctx: MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  if (!(await canEnterGroup(ctx, groupId, personId)))
    throw new ConvexError({
      code: 'RECIPIENT_UNAVAILABLE',
      message: 'This person or Group is unavailable.',
    });
  const existing = await membershipFor(ctx, groupId, personId);
  if (existing) return { membershipId: existing._id, created: false };
  const group = await ctx.db.get(groupId);
  if (!group)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Group not found.' });
  const membershipId = await ctx.db.insert('groupMemberships', {
    groupId,
    personId,
    role: 'MEMBER',
    joinedAt: Date.now(),
  });
  await ctx.db.patch(groupId, {
    memberCount: group.memberCount + 1,
    updatedAt: Date.now(),
  });
  return { membershipId, created: true };
}
