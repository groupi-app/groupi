import { anonymizeAudienceActor } from '../groupEventAudiences/cleanup';
import { canShare } from '../groupEventAudiences/model';

import { removeToolsForPerson } from '../groupTools/cleanup';
import { removeApplicationsForPerson } from '../groupApplications/cleanup';
import { getJoiningQuestionnaireStatus } from '../groupQuestionnaires/model';
import { removeQuestionnairesForPerson } from '../groupQuestionnaires/cleanup';
import { cascadeDeleteGroupData } from './cleanup';
import { removeTransfersForPerson } from '../groupTransfers/cleanup';
import { removeModerationForPerson } from '../groupModeration/cleanup';
import { removeAnnouncementsForPerson } from '../groupAnnouncements/cleanup';
import { authComponent, type AuthUserId } from '../auth';
import { removeInvitationsForPerson } from '../groupInvites/cleanup';
import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

type ReadCtx = QueryCtx | MutationCtx;
function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
export function cleanIdentity(input: {
  name?: string;
  description?: string | null;
  image?: string | null;
}) {
  const output: { name?: string; description?: string; image?: string } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 1 || name.length > 100)
      fail('VALIDATION_ERROR', 'Group name must contain 1–100 characters.');
    output.name = name;
  }
  if (input.description !== undefined) {
    const description = input.description?.trim();
    if (description && description.length > 2000)
      fail(
        'VALIDATION_ERROR',
        'Group description must be at most 2000 characters.'
      );
    output.description = description || undefined;
  }
  if (input.image !== undefined) {
    const image = input.image?.trim();
    if (image) {
      let url: URL;
      try {
        url = new URL(image);
      } catch {
        fail('VALIDATION_ERROR', 'Group image must be an HTTPS URL.');
      }
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        image.length > 2048
      )
        fail(
          'VALIDATION_ERROR',
          'Group image must be an HTTPS URL without credentials.'
        );
    }
    output.image = image || undefined;
  }
  return output;
}
export async function livePerson(ctx: ReadCtx, personId: Id<'persons'>) {
  const person = await ctx.db.get(personId);
  if (!person) return null;
  const user = await authComponent.getAnyUserById(
    ctx,
    person.userId as AuthUserId
  );
  if (
    !user ||
    (user.banned && (user.banExpires == null || user.banExpires > Date.now()))
  )
    return null;
  return { person, user };
}
export async function requirePerson(ctx: ReadCtx, personId: Id<'persons'>) {
  const identity = await livePerson(ctx, personId);
  if (!identity) fail('UNAUTHORIZED', 'Account is unavailable.');
  return identity;
}
export async function requireOwner(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  await requirePerson(ctx, personId);
  const group = await ctx.db.get(groupId);
  if (!group) fail('NOT_FOUND', 'Group not found.');
  if (group.ownerId !== personId)
    fail('FORBIDDEN', 'Only the Group owner can change this Group.');
  return group;
}
export async function assertNoOwnedGroups(
  ctx: ReadCtx,
  personId: Id<'persons'>
) {
  if (
    await ctx.db
      .query('groups')
      .withIndex('by_ownerId', q => q.eq('ownerId', personId))
      .first()
  )
    fail(
      'CONFLICT',
      'Resolve owned Groups before deleting this account. Transfer ownership or explicitly delete each Group.'
    );
}
export async function create(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: { name: string; description?: string; image?: string }
) {
  await requirePerson(ctx, personId);
  const identity = cleanIdentity(input);
  const now = Date.now();
  const groupId = await ctx.db.insert('groups', {
    ...identity,
    name: identity.name!,
    ownerId: personId,
    memberCount: 1,
    createdAt: now,
    updatedAt: now,
  });
  await ctx.db.insert('groupMemberships', {
    groupId,
    personId,
    role: 'OWNER',
    joinedAt: now,
  });
  return groupId;
}
export async function update(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    groupId: Id<'groups'>;
    name?: string;
    description?: string | null;
    image?: string | null;
  }
) {
  await requireOwner(ctx, input.groupId, personId);
  await ctx.db.patch(input.groupId, {
    ...cleanIdentity(input),
    updatedAt: Date.now(),
  });
  return null;
}
export async function remove(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>
) {
  await requireOwner(ctx, groupId, personId);
  await cascadeDeleteGroupData(ctx, groupId);
  return null;
}
export async function detail(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>
) {
  const group = await ctx.db.get(groupId);
  if (!group) return null;
  const membership = await ctx.db
    .query('groupMemberships')
    .withIndex('by_groupId_and_personId', q =>
      q.eq('groupId', groupId).eq('personId', personId)
    )
    .unique();
  if (!membership) return null;
  return {
    ...group,
    joiningQuestionnaire: await getJoiningQuestionnaireStatus(
      ctx,
      groupId,
      personId
    ),
    role: membership.role,
    viewerRole: membership.role,
    canManageIdentity: group.ownerId === personId,
    memberCount: group.memberCount,
    eventSharingPolicy: group.eventSharingPolicy ?? 'MANAGERS',
    canShareEvents: await canShare(ctx, groupId, personId),
    invitationsEnabled: group.invitationsEnabled ?? true,
    applicationsEnabled: group.applicationsEnabled ?? false,
    applicationQuestions: group.applicationQuestions ?? [],
    canManageInvitations: membership.role !== 'MEMBER',
    canManageMembers: membership.role !== 'MEMBER',
    canManageRoles: group.ownerId === personId,
    canLeave: membership.role !== 'OWNER',
  };
}
export async function list(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  await requirePerson(ctx, personId);
  if (
    !Number.isInteger(paginationOpts.numItems) ||
    paginationOpts.numItems < 1 ||
    paginationOpts.numItems > 100
  )
    fail('VALIDATION_ERROR', 'Page size must be an integer from 1 to 100.');
  let memberships;
  try {
    memberships = await ctx.db
      .query('groupMemberships')
      .withIndex('by_personId', q => q.eq('personId', personId))
      .order('desc')
      .paginate(paginationOpts);
  } catch {
    fail('VALIDATION_ERROR', 'Invalid Group cursor.');
  }
  const groups = await Promise.all(
    memberships.page.map(m => detail(ctx, personId, m.groupId))
  );
  return {
    page: groups.filter(g => g !== null),
    isDone: memberships.isDone,
    continueCursor: memberships.continueCursor,
  };
}

/** Account deletion removes only this person's memberships, preserving Groups and Events. */
export async function removeGroupMembershipsForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  await assertNoOwnedGroups(ctx, personId);
  await removeToolsForPerson(ctx, personId);
  await removeTransfersForPerson(ctx, personId);
  await anonymizeAudienceActor(ctx, personId);
  await removeAnnouncementsForPerson(ctx, personId);
  await removeInvitationsForPerson(ctx, personId);
  await removeModerationForPerson(ctx, personId);
  await removeQuestionnairesForPerson(ctx, personId);
  await removeApplicationsForPerson(ctx, personId);
  for await (const membership of ctx.db
    .query('groupMemberships')
    .withIndex('by_personId', q => q.eq('personId', personId))) {
    const group = await ctx.db.get(membership.groupId);
    if (group)
      await ctx.db.patch(group._id, {
        memberCount: group.memberCount - 1,
        updatedAt: Date.now(),
      });
    await ctx.db.delete(membership._id);
  }
}
