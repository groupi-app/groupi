import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { livePerson } from './model';
import { membershipFor, isGroupBanned } from './policy';
import { getJoiningQuestionnaireStatus } from '../groupQuestionnaires/model';
type ReadCtx = QueryCtx | MutationCtx;
/** This eligibility applies only to a grant from this Group, never independent Event access. */
export async function canAccessGroupMemberContent(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  const [group, person, member, banned] = await Promise.all([
    ctx.db.get(groupId),
    livePerson(ctx, personId),
    membershipFor(ctx, groupId, personId),
    isGroupBanned(ctx, groupId, personId),
  ]);
  if (!group || !person || !member || banned) return false;
  return (await getJoiningQuestionnaireStatus(ctx, groupId, personId))
    .canAccessMemberContent;
}
export async function requireGroupMemberContent(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  if (!(await canAccessGroupMemberContent(ctx, groupId, personId)))
    throw new ConvexError({
      code: 'ONBOARDING_REQUIRED',
      message:
        'Complete required Group onboarding before accessing member content.',
    });
}
/** The existing roster doubles as narrowly necessary member/ownership management for current managers. */
export async function requireGroupRosterAccess(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  const [person, member, banned] = await Promise.all([
    livePerson(ctx, personId),
    membershipFor(ctx, groupId, personId),
    isGroupBanned(ctx, groupId, personId),
  ]);
  if (person && member && member.role !== 'MEMBER' && !banned) return;
  await requireGroupMemberContent(ctx, groupId, personId);
}
