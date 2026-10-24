import { query, internalQuery } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { requireManager } from '../groups/policy';
import { connection } from './contracts';
export const getConnection = query({
  args: { groupId: v.id('groups') },
  returns: v.union(connection, v.null()),
  handler: async (ctx, { groupId }) => {
    await requireManager(ctx, groupId, (await requireAuth(ctx)).person._id);
    const record = await ctx.db
      .query('groupDiscordConnections')
      .withIndex('by_group', q => q.eq('groupId', groupId))
      .unique();
    if (!record) return null;
    const { _id, _creationTime, ...data } = record;
    void _id;
    void _creationTime;
    const cleanup = await Promise.all(
      (['blocked', 'pending'] as const).map(status =>
        ctx.db
          .query('groupDiscordCleanup')
          .withIndex('by_group_status', q =>
            q.eq('groupId', String(groupId)).eq('status', status)
          )
          .first()
      )
    );
    const obligation = cleanup.find(row => row !== null);
    const streams = await Promise.all(
      [20, 22, 25].map(action =>
        ctx.db
          .query('groupDiscordAuditStreams')
          .withIndex('by_guild_action', q =>
            q.eq('guildId', record.guildId).eq('action', action)
          )
          .unique()
      )
    );
    return {
      ...data,
      cleanupPending: !!obligation,
      synchronizationError:
        obligation?.error ??
        streams.find(stream => stream?.error)?.error ??
        (obligation
          ? 'Discord access cleanup is pending. Access removal has not yet been confirmed.'
          : undefined),
    };
  },
});
export const managerContext = internalQuery({
  args: { groupId: v.id('groups') },
  handler: async (ctx, { groupId }) => {
    const { person } = await requireAuth(ctx);
    const group = await requireManager(ctx, groupId, person._id);
    return { personId: person._id, groupName: group.name };
  },
});
