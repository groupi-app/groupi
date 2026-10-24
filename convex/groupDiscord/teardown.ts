import { ConvexError } from 'convex/values';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { oweAccessCleanup } from './memberOperations';

/** Shared transactional retirement policy for settings and every Group deletion adapter. */
export async function handBackConnection(
  ctx: MutationCtx,
  groupId: Id<'groups'>,
  actorId: Id<'persons'>,
  acknowledged = false,
  deleting = false
) {
  const connection = await ctx.db
    .query('groupDiscordConnections')
    .withIndex('by_group', q => q.eq('groupId', groupId))
    .unique();
  if (!connection) return;
  if (connection.status !== 'disabled' && !acknowledged)
    throw new ConvexError({
      code: 'CONFLICT',
      message:
        'Confirm Discord handback first in Group Discord settings (disable the connection), or explicitly acknowledge handback when deleting: retained roles and server membership pass to Discord staff; pending removals still run. Re-enabling requires fresh Connect.',
    });
  const managers = await ctx.db
    .query('groupMemberships')
    .withIndex('by_groupId', q => q.eq('groupId', groupId))
    .collect();
  if (connection.status !== 'disabled') {
    for await (const row of ctx.db
      .query('groupDiscordEnrollments')
      .withIndex('by_group', q => q.eq('groupId', groupId))) {
      if (row.connectionGeneration !== connection.generation) continue;
      // A provider write may still complete after retirement. Persist compensation before invalidating it.
      const inFlight =
        row.desired === 'granted' &&
        !!row.grantAttemptedAt &&
        row.status !== 'connected';
      if (inFlight) await oweAccessCleanup(ctx, row);
      await ctx.db.patch(row._id, {
        handedBack: row.desired === 'granted' && !inFlight,
        desired: 'removed',
        generation: row.generation,
        status: 'blocked',
        error:
          row.desired === 'removed'
            ? (row.error ??
              'Previously requested Discord removal remains independently tracked.')
            : inFlight
              ? 'Discord grant retired; cleanup remains pending.'
              : 'Discord management ended. Retained access is managed by Discord staff; fresh Connect is required.',
        nextObservationAt: Number.MAX_SAFE_INTEGER,
        updatedAt: Date.now(),
      });
    }
  }
  await ctx.db.patch(connection._id, {
    status: 'disabled',
    handedBackRoleIds: [
      ...new Set([
        ...(connection.handedBackRoleIds ?? []),
        ...(connection.provisionedRoleId ? [connection.provisionedRoleId] : []),
      ]),
    ],
    generation:
      connection.generation + (connection.status === 'disabled' ? 0 : 1),
    groupDeleted: deleting || connection.groupDeleted,
    cleanupViewerIds: [
      ...new Set([
        ...(connection.cleanupViewerIds ?? []),
        actorId,
        ...managers.filter(m => m.role !== 'MEMBER').map(m => m.personId),
      ]),
    ],
    updatedAt: Date.now(),
  });
}
