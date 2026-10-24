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
    return data;
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
