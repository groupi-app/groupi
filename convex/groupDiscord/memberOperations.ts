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
    connection.mode !== 'role' ||
    !connection.roleId
  )
    throw new Error('Active Discord Role access is required.');
  return connection;
}

/** Cleanup keeps an immutable provider target even when a later enrollment replaces it. */
export async function oweRoleCleanup(
  ctx: MutationCtx,
  row: {
    groupId: Id<'groups'>;
    guildId: string;
    discordUserId: string;
    roleId: string;
    generation: number;
    connectionGeneration?: number;
    personId?: Id<'persons'>;
  }
) {
  const existing = await ctx.db
    .query('groupDiscordCleanup')
    .withIndex('by_group', q => q.eq('groupId', String(row.groupId)))
    .collect();
  const existingObligation = existing.find(
    o =>
      o.generation === (row.connectionGeneration ?? row.generation) &&
      o.enrollmentGeneration === row.generation &&
      o.discordUserId === row.discordUserId &&
      o.roleId === row.roleId &&
      o.status !== 'completed'
  );
  if (existingObligation) return existingObligation._id;
  return ctx.db.insert('groupDiscordCleanup', {
    guildId: row.guildId,
    discordUserId: row.discordUserId,
    roleId: row.roleId,
    generation: row.connectionGeneration ?? row.generation,
    enrollmentGeneration: row.generation,
    personId: row.personId ? String(row.personId) : undefined,
    groupId: String(row.groupId),
    mode: 'role',
    desired: 'role_removed',
    observed: 'unknown',
    status: 'pending',
    attempts: 0,
    nextAttemptAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export async function hasLinkedIdentity(
  ctx: QueryCtx | MutationCtx,
  personId: Id<'persons'>,
  discordUserId: string
) {
  const person = await ctx.db.get(personId);
  if (!person) return false;
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
  const old = await ctx.db
    .query('groupDiscordEnrollments')
    .withIndex('by_group_person', q =>
      q.eq('groupId', groupId).eq('personId', personId)
    )
    .unique();
  if (
    !fresh &&
    old &&
    old.discordUserId === discordUserId &&
    old.connectionGeneration === connection.generation &&
    ['pending', 'connected', 'screening'].includes(old.status)
  )
    return old;
  const data = {
    groupId,
    personId: personId,
    discordUserId,
    guildId: connection.guildId,
    roleId: connection.roleId!,
    connectionGeneration: connection.generation,
    generation: (old?.generation ?? 0) + 1,
    desired: 'granted' as const,
    status: 'pending' as const,
    startedAt: Date.now(),
    updatedAt: Date.now(),
    attempts: 0,
    nextAttemptAt: Date.now(),
  };
  const id = old?._id ?? (await ctx.db.insert('groupDiscordEnrollments', data));
  if (old) {
    if (
      old.discordUserId !== discordUserId ||
      old.connectionGeneration !== connection.generation
    )
      await oweRoleCleanup(ctx, old);
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
  if (!connection) return null;
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
  const linkedAccount = (accounts.page as AuthDoc<'account'>[]).find(
    a => a.providerId === 'discord'
  );
  const eligible = await canAccessGroupMemberContent(ctx, groupId, personId);
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
    status: !current
      ? ('blocked' as const)
      : (enrollment?.status ?? ('not_connected' as const)),
    error: !current
      ? 'Group eligibility, connection or linked identity changed. Connect again when eligible.'
      : enrollment?.error,
    externalException: enrollment?.externalException,
  };
}
