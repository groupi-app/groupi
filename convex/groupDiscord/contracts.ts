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
export const memberStatus = v.object({
  mode,
  guildName: v.string(),
  openUrl: v.string(),
  linked: v.boolean(),
  linkedDiscordUserId: v.optional(v.string()),
  eligible: v.boolean(),
  status: v.union(
    v.literal('not_connected'),
    v.literal('pending'),
    v.literal('screening'),
    v.literal('connected'),
    v.literal('blocked')
  ),
  error: v.optional(v.string()),
  externalException: v.optional(v.string()),
  lastObservedAt: v.optional(v.number()),
});
