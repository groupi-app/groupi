import { v } from 'convex/values';
export const mode = v.union(v.literal('role'), v.literal('membership'));
export const connectionFields = {
  groupId: v.id('groups'),
  guildId: v.string(),
  guildName: v.string(),
  mode,
  // Provider-created identity is retained even if activation is rejected.
  provisionedRoleId: v.optional(v.string()),
  roleId: v.optional(v.string()),
  roleName: v.optional(v.string()),
  landingChannelId: v.optional(v.string()),
  generation: v.number(),
  status: v.union(
    v.literal('active'),
    v.literal('pending'),
    v.literal('blocked')
  ),
  error: v.optional(v.string()),
  updatedAt: v.number(),
};
export const connection = v.object(connectionFields);
