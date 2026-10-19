import { membershipFor } from './policy';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { preferenceFor } from './announcementPreferenceModel';
import { internalMutation, mutation, query } from '../_generated/server';
import { v, type Infer } from 'convex/values';
import { requireAuth } from '../auth';
import { authorizeCommunity } from './community';
import { canAccessGroupMemberContent } from './contentAccess';
import { livePerson } from './model';
import { denied } from '../authorization/model';
import {
  priorReceipt,
  receiptBinding,
  saveReceipt,
  operationError,
} from './operationReceipts';
export const receipt = v.object({
  operationId: v.string(),
  outcome: v.literal('committed'),
  result: v.object({ subscribed: v.boolean() }),
  effects: v.object({
    email: v.literal('not-requested'),
    cleanup: v.literal('not-requested'),
  }),
});
async function set(
  ctx: MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>,
  subscribed: boolean,
  operationId: string,
  authority:
    | 'native'
    | {
        appId: Id<'delegatedApps'>;
        issuer?: string;
        grantId: Id<'authorizationGrants'>;
      }
) {
  if (
    !(await ctx.db.get(groupId)) ||
    !(await livePerson(ctx, personId)) ||
    (subscribed && !(await canAccessGroupMemberContent(ctx, groupId, personId)))
  )
    throw denied();
  const binding = await receiptBinding({
    groupId,
    personId,
    operation: 'announcement-preference',
    subscribed,
    authority:
      authority === 'native'
        ? authority
        : { appId: authority.appId, issuer: authority.issuer },
  });
  const now = Date.now();
  const prior = await priorReceipt(ctx, operationId, binding, now);
  if (prior) return JSON.parse(prior) as Infer<typeof receipt>;
  const row = await ctx.db
    .query('groupAnnouncementPreferences')
    .withIndex('by_groupId_and_personId', q =>
      q.eq('groupId', groupId).eq('personId', personId)
    )
    .unique();
  const membership = await membershipFor(ctx, groupId, personId);
  const source = {
    sourceMembershipId: membership?._id ?? row?.sourceMembershipId,
    sourceAppId: authority === 'native' ? undefined : authority.appId,
    sourceGrantId: authority === 'native' ? undefined : authority.grantId,
  };
  if (row)
    await ctx.db.patch(row._id, { subscribed, updatedAt: now, ...source });
  else
    await ctx.db.insert('groupAnnouncementPreferences', {
      groupId,
      personId,
      subscribed,
      updatedAt: now,
      ...source,
    });
  const result = {
    operationId,
    outcome: 'committed' as const,
    result: { subscribed },
    effects: {
      email: 'not-requested' as const,
      cleanup: 'not-requested' as const,
    },
  };
  await saveReceipt(ctx, operationId, binding, result, now);
  return result;
}
export const execute = internalMutation({
  args: {
    credentialId: v.id('authorizationCredentials'),
    groupId: v.string(),
    operationId: v.string(),
    bodyJson: v.string(),
  },
  returns: receipt,
  handler: async (ctx, args) => {
    const { grant, groupId, personId } = await authorizeCommunity(
      ctx,
      args,
      'groups.announcements.preferences.update'
    );
    let body;
    try {
      body = JSON.parse(args.bodyJson);
    } catch {
      operationError('VALIDATION_ERROR', 'Invalid JSON.');
    }
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      typeof body.subscribed !== 'boolean'
    )
      operationError('VALIDATION_ERROR', 'Expected subscribed boolean only.');
    return set(ctx, groupId, personId, body.subscribed, args.operationId, {
      appId: grant.appId!,
      issuer: grant.instanceId,
      grantId: grant._id,
    });
  },
});
export const updateOwn = mutation({
  args: {
    groupId: v.id('groups'),
    subscribed: v.boolean(),
    operationId: v.string(),
  },
  returns: receipt,
  handler: async (ctx, args) =>
    set(
      ctx,
      args.groupId,
      (await requireAuth(ctx)).person._id,
      args.subscribed,
      args.operationId,
      'native'
    ),
});
export const readOwn = query({
  args: { groupId: v.id('groups') },
  returns: v.object({ subscribed: v.boolean() }),
  handler: async (ctx, args) => {
    const personId = (await requireAuth(ctx)).person._id;
    if (!(await ctx.db.get(args.groupId)) || !(await livePerson(ctx, personId)))
      throw denied();
    return { subscribed: await preferenceFor(ctx, args.groupId, personId) };
  },
});
