import { preferenceFor } from './announcementPreferenceModel';
import { isGroupExcludedForPerson } from './exclusions';
import { v } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { internalQuery } from '../_generated/server';
import {
  type AuthorizationAction,
  liveGrant,
  denied,
  secretHash,
  delegatedAudience,
} from '../authorization/model';
import { membershipFor, isGroupBanned, canEnterGroup } from './policy';
import { canAccessGroupMemberContent } from './contentAccess';
import {
  questionValidator,
  answersValidator,
  applicationStatusValidator,
} from '../eventApplications/contracts';

export const context = v.object({
  contractVersion: v.literal('community.v1'),
  group: v.object({ id: v.id('groups'), name: v.string() }),
  form: v.object({
    enabled: v.boolean(),
    revision: v.string(),
    questions: v.array(questionValidator),
  }),
  membership: v.union(
    v.null(),
    v.object({
      membershipId: v.id('groupMemberships'),
      role: v.union(
        v.literal('OWNER'),
        v.literal('MODERATOR'),
        v.literal('MEMBER')
      ),
    })
  ),
  eligibility: v.object({
    canApply: v.boolean(),
    canAccessMemberContent: v.boolean(),
    banned: v.boolean(),
    excluded: v.boolean(),
  }),
  applications: v.array(
    v.object({
      id: v.id('groupApplications'),
      status: applicationStatusValidator,
      revision: v.number(),
      decisionDelivery: v.optional(
        v.union(
          v.literal('queued'),
          v.literal('sending'),
          v.literal('sent'),
          v.literal('failed'),
          v.literal('suppressed')
        )
      ),
      questions: v.array(questionValidator),
      answers: answersValidator,
      submittedAt: v.number(),
      decisions: v.array(
        v.object({ status: applicationStatusValidator, at: v.number() })
      ),
    })
  ),
  nextCursor: v.union(v.string(), v.null()),
  grantedActions: v.array(v.string()),
  allowedActions: v.array(v.string()),
  announcementPreference: v.object({
    supported: v.literal(true),
    subscribed: v.boolean(),
  }),
});
export async function authorizeCommunity(
  ctx: QueryCtx | MutationCtx,
  args: { credentialId: Id<'authorizationCredentials'>; groupId: string },
  requested: AuthorizationAction
) {
  const now = Date.now();
  const credential = await ctx.db.get(args.credentialId);
  if (
    !credential ||
    credential.kind !== 'delegated-access' ||
    credential.revokedAt !== undefined ||
    (credential.expiresAt !== undefined && credential.expiresAt <= now) ||
    credential.audience !== delegatedAudience() ||
    !credential.actions.includes(requested)
  )
    throw denied();
  const { grant, principal } = await liveGrant(ctx, credential.grantId, now);
  const groupId = ctx.db.normalizeId('groups', args.groupId);
  if (
    principal.kind !== 'user' ||
    !grant.appId ||
    !grant.actions.includes(requested) ||
    grant.selector.kind !== 'selected-group' ||
    grant.selector.groupId !== groupId ||
    !groupId
  )
    throw denied();
  const binding = await ctx.db
    .query('delegatedGrantBindings')
    .withIndex('by_grantId', q => q.eq('grantId', grant._id))
    .unique();
  if (
    !binding?.active ||
    binding.appId !== grant.appId ||
    binding.personId !== grant.grantorPersonId ||
    binding.instanceId !== grant.instanceId
  )
    throw denied();
  const group = await ctx.db.get(groupId);
  if (!group) throw denied();
  return { credential, grant, group, groupId, personId: grant.grantorPersonId };
}

/** Authorization and projection share one authoritative read snapshot. No reviewer projection. */
export const readContext = internalQuery({
  args: {
    credentialId: v.id('authorizationCredentials'),
    groupId: v.string(),
    cursor: v.optional(v.string()),
  },
  returns: context,
  handler: async (ctx, args) => {
    const { credential, grant, group, groupId, personId } =
      await authorizeCommunity(ctx, args, 'groups.context.read');
    const membership = await membershipFor(ctx, groupId, personId);
    const banned = await isGroupBanned(ctx, groupId, personId);
    const eligible = await canEnterGroup(ctx, groupId, personId);
    const excluded = await isGroupExcludedForPerson(ctx, groupId, personId);
    const canAccessMemberContent = await canAccessGroupMemberContent(
      ctx,
      groupId,
      personId
    );
    const page = await ctx.db
      .query('groupApplications')
      .withIndex('by_groupId_and_personId', q =>
        q.eq('groupId', groupId).eq('personId', personId)
      )
      .order('desc')
      .paginate({ cursor: args.cursor ?? null, numItems: 50 });
    const pending = await ctx.db
      .query('groupApplications')
      .withIndex('by_groupId_and_personId_and_status', q =>
        q
          .eq('groupId', groupId)
          .eq('personId', personId)
          .eq('status', 'PENDING')
      )
      .unique();
    const discordConnection = credential.actions.includes(
      'groups.discord.connect'
    )
      ? await ctx.db
          .query('groupDiscordConnections')
          .withIndex('by_group', q => q.eq('groupId', groupId))
          .unique()
      : null;
    const enabled = group.applicationsEnabled ?? false;
    const questions = eligible ? (group.applicationQuestions ?? []) : [];
    return {
      contractVersion: 'community.v1' as const,
      group: { id: group._id, name: group.name },
      form: {
        enabled,
        revision: await secretHash(JSON.stringify({ enabled, questions })),
        questions,
      },
      membership: membership
        ? { membershipId: membership._id, role: membership.role }
        : null,
      eligibility: {
        canApply: eligible && enabled && !membership && !pending,
        canAccessMemberContent,
        banned,
        excluded,
      },
      applications: page.page.map(a => ({
        id: a._id,
        status: a.status,
        revision: a.updatedAt,
        decisionDelivery: a.decisionDelivery,
        questions: a.questions,
        answers: a.answers,
        submittedAt: a.submittedAt,
        decisions: a.decisions.map(({ status, at }) => ({ status, at })),
      })),
      nextCursor: page.isDone ? null : page.continueCursor,
      grantedActions: credential.actions.filter(a => grant.actions.includes(a)),
      allowedActions: credential.actions.filter(
        a =>
          grant.actions.includes(a) &&
          (a === 'groups.context.read' ||
            (a === 'groups.discord.read' && Boolean(membership)) ||
            (a === 'groups.discord.connect' &&
              canAccessMemberContent &&
              discordConnection?.status === 'active') ||
            (a === 'groups.announcements.preferences.update' && eligible) ||
            (a === 'groups.leave' &&
              !excluded &&
              Boolean(membership) &&
              membership?.role !== 'OWNER') ||
            (a === 'groups.applications.submit' &&
              eligible &&
              enabled &&
              !membership &&
              !pending) ||
            (a === 'groups.applications.edit' &&
              eligible &&
              enabled &&
              !membership &&
              Boolean(pending)) ||
            (a === 'groups.applications.withdraw' &&
              eligible &&
              Boolean(pending)))
      ),
      announcementPreference: {
        supported: true as const,
        subscribed: await preferenceFor(ctx, groupId, personId),
      },
    };
  },
});
