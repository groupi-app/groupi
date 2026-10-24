import { v } from 'convex/values';
export const mode = v.union(v.literal('role'), v.literal('membership'));
export const connectionFields = {
  groupId: v.id('groups'),
  guildId: v.string(),
  guildName: v.string(),
  guildIconUrl: v.optional(v.string()),
  mode,
  // Provider-created identity is retained even if activation is rejected.
  provisionedRoleId: v.optional(v.string()),
  handedBackRoleIds: v.optional(v.array(v.string())),
  roleId: v.optional(v.string()),
  roleName: v.optional(v.string()),
  landingChannelId: v.optional(v.string()),
  generation: v.number(),
  cleanupViewerIds: v.optional(v.array(v.id('persons'))),
  groupDeleted: v.optional(v.boolean()),
  status: v.union(
    v.literal('disabled'),
    v.literal('active'),
    v.literal('pending'),
    v.literal('blocked')
  ),
  error: v.optional(v.string()),
  updatedAt: v.number(),
};
export const connection = v.object({
  ...connectionFields,
  synchronizationError: v.optional(v.string()),
  cleanupPending: v.optional(v.boolean()),
});
export const memberStatus = v.object({
  mode,
  guildName: v.string(),
  guildIconUrl: v.optional(v.string()),
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
  observationError: v.optional(v.string()),
  cleanupPending: v.optional(v.boolean()),
});
