import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { resolveEventPermissions } from '../auth';
import { requireDiscussionRole } from '../lib/discussionAccess';
import { requireGroupMemberContent } from '../groups/contentAccess';
import { membershipFor, requireManager } from '../groups/policy';
import {
  getPolicy,
  requireToolCreation,
  requireToolInteraction,
} from './policy';

export type ContentContext = {
  groupId?: Id<'groups'>;
  eventId?: Id<'events'>;
};
type ReadCtx = QueryCtx | MutationCtx;
type Kind = 'FORM' | 'LIST' | 'POLL';
/** Old Group rows remain valid; no synthetic Group or data migration is needed. */
export function contentContext(context: ContentContext) {
  if (Boolean(context.groupId) === Boolean(context.eventId))
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Content must belong to exactly one Group or Event.',
    });
  return context.eventId
    ? { eventId: context.eventId }
    : { groupId: context.groupId! };
}
export async function requireContentAccess(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  context: ContentContext
) {
  const owner = contentContext(context);
  if (owner.eventId)
    await requireDiscussionRole(ctx, owner.eventId, personId, 'ATTENDEE');
  else await requireGroupMemberContent(ctx, owner.groupId!, personId);
}
export async function requireContentManager(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  context: ContentContext
) {
  const owner = contentContext(context);
  if (owner.eventId)
    await requireDiscussionRole(ctx, owner.eventId, personId, 'MODERATOR');
  else {
    await requireGroupMemberContent(ctx, owner.groupId!, personId);
    await requireManager(ctx, owner.groupId!, personId);
  }
}
export async function contentCapabilities(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  context: ContentContext
) {
  const owner = contentContext(context);
  await requireContentAccess(ctx, personId, owner);
  if (owner.eventId) {
    const member = await requireDiscussionRole(
      ctx,
      owner.eventId,
      personId,
      'ATTENDEE'
    );
    const event = await ctx.db.get(owner.eventId);
    if (!event)
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Event not found.' });
    const level = resolveEventPermissions(event).createPosts;
    const rank = { ATTENDEE: 1, MODERATOR: 2, ORGANIZER: 3 };
    return {
      canManage: member.role !== 'ATTENDEE',
      canCreate: level === 'EVERYONE' || rank[member.role] >= rank[level],
    };
  }
  const member = await membershipFor(ctx, owner.groupId!, personId);
  return {
    canManage: member?.role === 'OWNER' || member?.role === 'MODERATOR',
    canCreate: member?.role === 'OWNER' || member?.role === 'MODERATOR',
  };
}
export async function requireContentCreation(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  context: ContentContext,
  kind: Kind
) {
  const owner = contentContext(context);
  if (owner.eventId) {
    const permissions = await contentCapabilities(ctx, personId, owner);
    if (!permissions.canCreate)
      throw new ConvexError({
        code: 'FORBIDDEN',
        message:
          'Event content creation is unavailable under current organizer policy.',
      });
  } else await requireToolCreation(ctx, personId, owner.groupId!, kind);
}
export async function requireContentInteraction(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  context: ContentContext,
  kind: Kind
) {
  const owner = contentContext(context);
  if (owner.eventId) await requireContentAccess(ctx, personId, owner);
  else await requireToolInteraction(ctx, personId, owner.groupId!, kind);
}
export async function contentEnabled(
  ctx: ReadCtx,
  context: ContentContext,
  kind: Kind
) {
  const owner = contentContext(context);
  return owner.eventId
    ? true
    : (await getPolicy(ctx, owner.groupId!, kind)).enabled;
}
