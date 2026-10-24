import { components } from '../_generated/api';
import type { Doc as AuthDoc } from '../betterAuth/_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { membershipFor } from '../groups/policy';
import { canAccessGroupMemberContent } from '../groups/contentAccess';

/** Reusable actor-aware authority check for native and future transport adapters. */
export async function eligibleConnection(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  if (!(await canAccessGroupMemberContent(ctx, groupId, personId)))
    throw new Error(
      'Current membership and completed required Group onboarding are required.'
    );
  const connection = await ctx.db
    .query('groupDiscordConnections')
    .withIndex('by_group', q => q.eq('groupId', groupId))
    .unique();
  if (
    !connection ||
    connection.status !== 'active' ||
    (connection.mode === 'role' && !connection.roleId)
  )
    throw new Error('Active Discord access is required.');
  return connection;
}

/** Cleanup keeps an immutable provider target even when a later enrollment replaces it. */
export async function oweAccessCleanup(
  ctx: MutationCtx,
  row: {
    groupId: Id<'groups'>;
    guildId: string;
    discordUserId: string;
    roleId?: string;
    mode?: 'role' | 'membership';
    removal?: 'removed' | 'banned';
    generation: number;
    connectionGeneration?: number;
    personId?: Id<'persons'>;
  }
) {
  const existingObligation = await ctx.db
    .query('groupDiscordCleanup')
    .withIndex('by_target_group_enrollment', q =>
      q
        .eq('guildId', row.guildId)
        .eq('discordUserId', row.discordUserId)
        .eq('roleId', row.roleId)
        .eq('generation', row.connectionGeneration ?? row.generation)
        .eq('enrollmentGeneration', row.generation)
        .eq('groupId', String(row.groupId))
    )
    .first();
  if (existingObligation) {
    if (
      row.mode === 'membership' &&
      row.removal === 'banned' &&
      existingObligation.desired !== 'banned'
    )
      await ctx.db.patch(existingObligation._id, {
        desired: 'banned',
        status: 'pending',
        observed: 'unknown',
        nextAttemptAt: Date.now(),
      });
    if (existingObligation.status === 'completed')
      await ctx.db.patch(existingObligation._id, {
        status: 'pending',
        observed: 'unknown',
        error: undefined,
        nextAttemptAt: Date.now(),
        updatedAt: Date.now(),
      });
    return existingObligation._id;
  }
  return ctx.db.insert('groupDiscordCleanup', {
    guildId: row.guildId,
    discordUserId: row.discordUserId,
    roleId: row.roleId,
    generation: row.connectionGeneration ?? row.generation,
    enrollmentGeneration: row.generation,
    personId: row.personId ? String(row.personId) : undefined,
    groupId: String(row.groupId),
    mode: row.mode ?? 'role',
    desired:
      row.mode === 'membership' ? (row.removal ?? 'removed') : 'role_removed',
    observed: 'unknown',
    status: 'pending',
    attempts: 0,
    nextAttemptAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/** Keep retirement owed until an unfinished Node provider action can no longer write. */
export async function oweRetirementCleanup(
  ctx: MutationCtx,
  row: Doc<'groupDiscordEnrollments'>
) {
  const id = await oweAccessCleanup(ctx, row);
  if (
    row.desired === 'granted' &&
    row.grantAttemptedAt &&
    row.status !== 'connected'
  ) {
    await ctx.db.patch(id, {
      nextAttemptAt: Math.max(row.nextAttemptAt, Date.now() + 10 * 60 * 1000),
    });
  }
  return id;
}

export async function hasLinkedIdentity(
  ctx: QueryCtx | MutationCtx,
  personId: Id<'persons'>,
  discordUserId: string
) {
  const person = await ctx.db.get(personId);
  if (!person) return false;
  const selected = await ctx.db
    .query('groupDiscordManagedIdentities')
    .withIndex('by_person', q => q.eq('personId', personId))
    .unique();
  if (selected?.discordUserId && selected.discordUserId !== discordUserId)
    return false;
  if (
    await ctx.db
      .query('groupDiscordRetiredIdentities')
      .withIndex('by_person_identity', q =>
        q.eq('personId', personId).eq('discordUserId', discordUserId)
      )
      .unique()
  )
    return false;
  const accounts = await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model: 'account',
    where: [{ field: 'userId', operator: 'eq', value: person.userId }],
    paginationOpts: { cursor: null, numItems: 100 },
  });
  return (accounts.page as AuthDoc<'account'>[]).some(
    a => a.providerId === 'discord' && a.accountId === discordUserId
  );
}
export async function enrollmentAuthorized(
  ctx: QueryCtx | MutationCtx,
  row: Doc<'groupDiscordEnrollments'>
) {
  try {
    const connection = await eligibleConnection(ctx, row.groupId, row.personId);
    return (
      row.desired === 'granted' &&
      connection.generation === row.connectionGeneration &&
      (await hasLinkedIdentity(ctx, row.personId, row.discordUserId))
    );
  } catch {
    return false;
  }
}

/** Bound reads to the member and exact provider targets, excluding completed history. */
async function pendingCleanupFor(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>,
  guildId: string,
  discordUserId?: string,
  roleId?: string
) {
  for (const status of ['pending', 'blocked'] as const) {
    const retirement = await ctx.db
      .query('groupDiscordCleanup')
      .withIndex('by_person_status', q =>
        q.eq('personId', String(personId)).eq('status', status)
      )
      .first();
    if (retirement) return retirement;
    const obligation = await ctx.db
      .query('groupDiscordCleanup')
      .withIndex('by_group_person', q =>
        q
          .eq('groupId', String(groupId))
          .eq('personId', String(personId))
          .eq('status', status)
      )
      .first();
    if (obligation) return obligation;
  }
  if (discordUserId) {
    for (const targetRole of roleId ? [roleId, undefined] : [undefined]) {
      for (const status of ['pending', 'blocked'] as const) {
        const obligation = await ctx.db
          .query('groupDiscordCleanup')
          .withIndex('by_target_status', q =>
            q
              .eq('guildId', guildId)
              .eq('discordUserId', discordUserId)
              .eq('roleId', targetRole)
              .eq('status', status)
          )
          .first();
        if (obligation) return obligation;
      }
    }
  }
  return null;
}

/** A verified native or delegated actor can enroll only their own currently linked identity. */
export async function beginEnrollment(
  ctx: MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>,
  discordUserId: string,
  fresh = false
) {
  if (!(await hasLinkedIdentity(ctx, personId, discordUserId)))
    throw new Error('Confirm the linked Discord identity before connecting.');
  const connection = await eligibleConnection(ctx, groupId, personId);
  if (
    await pendingCleanupFor(
      ctx,
      groupId,
      personId,
      connection.guildId,
      discordUserId,
      connection.roleId!
    )
  )
    throw new Error(
      'Previous Discord access cleanup is still pending. Try Connect again after cleanup completes.'
    );
  const old = await ctx.db
    .query('groupDiscordEnrollments')
    .withIndex('by_group_person', q =>
      q.eq('groupId', groupId).eq('personId', personId)
    )
    .unique();
  if (
    !fresh &&
    old &&
    old.desired === 'granted' &&
    old.discordUserId === discordUserId &&
    old.connectionGeneration === connection.generation &&
    ['pending', 'connected', 'screening'].includes(old.status)
  )
    return old;
  if (
    old &&
    !old.handedBack &&
    !(old.mode === 'membership' && old.externalException) &&
    (old.discordUserId !== discordUserId ||
      old.connectionGeneration !== connection.generation)
  ) {
    const completed = await ctx.db
      .query('groupDiscordCleanup')
      .withIndex('by_target_group_status', q =>
        q
          .eq('guildId', old.guildId)
          .eq('discordUserId', old.discordUserId)
          .eq('roleId', old.roleId)
          .eq('generation', old.connectionGeneration)
          .eq('groupId', String(groupId))
          .eq('status', 'completed')
      )
      .first();
    if (!completed) {
      await oweAccessCleanup(ctx, old);
      await ctx.db.patch(old._id, {
        desired: 'removed',
        status: 'blocked',
        error:
          'Previous Discord access cleanup is still pending. Try Connect again after cleanup completes.',
        updatedAt: Date.now(),
        nextObservationAt: Date.now(),
      });
      return (await ctx.db.get(old._id))!;
    }
  }
  if (
    !old?.handedBack &&
    old?.grantAttemptedAt &&
    old.desired === 'removed' &&
    old.nextAttemptAt > Date.now()
  )
    throw new Error(
      'Previous Discord access cleanup is waiting for an in-flight grant. Try Connect again shortly.'
    );
  const data = {
    groupId,
    personId: personId,
    discordUserId,
    guildId: connection.guildId,
    mode: connection.mode,
    roleId: connection.roleId,
    connectionGeneration: connection.generation,
    generation: (old?.generation ?? 0) + 1,
    desired: 'granted' as const,
    status: 'pending' as const,
    startedAt: Date.now(),
    updatedAt: Date.now(),
    attempts: 0,
    nextAttemptAt: Date.now(),
    nextObservationAt: Date.now() + 300000,
  };
  const id = old?._id ?? (await ctx.db.insert('groupDiscordEnrollments', data));
  if (old) {
    await ctx.db.replace(id, data);
  }
  return (await ctx.db.get(id))!;
}

/** Status read shared by native clients and future scoped domain adapters. */
export async function getMemberStatus(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  if (!(await membershipFor(ctx, groupId, personId)))
    throw new Error('Current Group membership required.');
  const connection = await ctx.db
    .query('groupDiscordConnections')
    .withIndex('by_group', q => q.eq('groupId', groupId))
    .unique();
  if (!connection || connection.status !== 'active') return null;
  const enrollment = await ctx.db
    .query('groupDiscordEnrollments')
    .withIndex('by_group_person', q =>
      q.eq('groupId', groupId).eq('personId', personId)
    )
    .unique();
  const person = await ctx.db.get(personId);
  if (!person) throw new Error('Current person required.');
  const accounts = await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model: 'account',
    where: [{ field: 'userId', operator: 'eq', value: person.userId }],
    paginationOpts: { cursor: null, numItems: 100 },
  });
  const selected = await ctx.db
    .query('groupDiscordManagedIdentities')
    .withIndex('by_person', q => q.eq('personId', personId))
    .unique();
  let linkedAccount = (accounts.page as AuthDoc<'account'>[]).find(
    a =>
      a.providerId === 'discord' &&
      (!selected?.discordUserId || a.accountId === selected.discordUserId)
  );
  if (
    linkedAccount &&
    !(await hasLinkedIdentity(ctx, personId, linkedAccount.accountId))
  )
    linkedAccount = undefined;
  const eligible = await canAccessGroupMemberContent(ctx, groupId, personId);
  const pendingCleanup = await pendingCleanupFor(
    ctx,
    groupId,
    personId,
    connection.guildId,
    linkedAccount?.accountId,
    connection.roleId
  );
  const current =
    !enrollment ||
    (eligible &&
      connection.status === 'active' &&
      connection.generation === enrollment.connectionGeneration &&
      linkedAccount?.accountId === enrollment.discordUserId);
  return {
    mode: connection.mode,
    guildName: connection.guildName,
    openUrl: `https://discord.com/channels/${connection.guildId}${connection.landingChannelId ? `/${connection.landingChannelId}` : ''}`,
    linked: !!linkedAccount,
    linkedDiscordUserId: linkedAccount?.accountId,
    eligible,
    lastObservedAt: enrollment?.lastObservedAt,
    observationError: enrollment?.observationError,
    cleanupPending: !!pendingCleanup,
    status: enrollment?.observationError
      ? ('blocked' as const)
      : pendingCleanup
        ? ('blocked' as const)
        : !current
          ? ('blocked' as const)
          : (enrollment?.status ?? ('not_connected' as const)),
    error: pendingCleanup
      ? (pendingCleanup.error ??
        'Previous Discord access cleanup is still pending. Try Connect again after cleanup completes.')
      : !current
        ? 'Group eligibility, connection or linked identity changed. Connect again when eligible.'
        : (enrollment?.error ?? enrollment?.observationError),
    externalException: enrollment?.externalException,
  };
}
