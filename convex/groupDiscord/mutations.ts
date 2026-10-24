import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { requireManager } from '../groups/policy';
import { mode } from './contracts';
export const reserve = internalMutation({
  args: {
    groupId: v.id('groups'),
    guildId: v.string(),
    guildName: v.string(),
    mode,
    roleId: v.optional(v.string()),
    landingChannelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireManager(
      ctx,
      args.groupId,
      (await requireAuth(ctx)).person._id
    );
    const existing = await ctx.db
      .query('groupDiscordConnections')
      .withIndex('by_group', q => q.eq('groupId', args.groupId))
      .unique();
    if (existing)
      throw new Error(
        'This Group already has a Discord connection. Hand back the existing connection before reconfiguring.'
      );
    const bindings = await ctx.db
      .query('groupDiscordConnections')
      .withIndex('by_guild', q => q.eq('guildId', args.guildId))
      .collect();
    if (
      bindings.some(
        b =>
          args.mode === 'membership' ||
          b.mode === 'membership' ||
          (args.roleId &&
            (b.roleId === args.roleId || b.provisionedRoleId === args.roleId))
      )
    )
      throw new Error(
        'Discord server or dedicated role is already reserved by another Group.'
      );
    return ctx.db.insert('groupDiscordConnections', {
      ...args,
      generation: 1,
      status: 'pending',
      updatedAt: Date.now(),
    });
  },
});
export const complete = internalMutation({
  args: {
    connectionId: v.id('groupDiscordConnections'),
    roleId: v.optional(v.string()),
    roleName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.connectionId);
    if (!record) throw new Error('Discord connection was retired.');
    await requireManager(
      ctx,
      record.groupId,
      (await requireAuth(ctx)).person._id
    );
    if (record.status !== 'pending')
      throw new Error('Discord setup is no longer pending.');
    const bindings = await ctx.db
      .query('groupDiscordConnections')
      .withIndex('by_guild', q => q.eq('guildId', record.guildId))
      .collect();
    if (
      bindings.some(
        other =>
          other._id !== record._id &&
          (record.mode === 'membership' ||
            other.mode === 'membership' ||
            (args.roleId &&
              (other.roleId === args.roleId ||
                other.provisionedRoleId === args.roleId)))
      )
    )
      throw new Error(
        'Discord server or dedicated role is already reserved by another Group.'
      );
    await ctx.db.patch(record._id, {
      roleId: args.roleId,
      roleName: args.roleName,
      status: 'active',
      updatedAt: Date.now(),
    });
    return null;
  },
});
export const fail = internalMutation({
  args: {
    connectionId: v.id('groupDiscordConnections'),
    error: v.string(),
    provisionedRoleId: v.optional(v.string()),
  },
  handler: async (ctx, { connectionId, error, provisionedRoleId }) => {
    const record = await ctx.db.get(connectionId);
    if (record?.status === 'pending')
      await ctx.db.patch(connectionId, {
        status: 'blocked',
        error,
        provisionedRoleId,
        updatedAt: Date.now(),
      });
    return null;
  },
});
