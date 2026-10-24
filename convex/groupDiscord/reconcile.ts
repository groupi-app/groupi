'use node';
import {
  memberCapabilities,
  hasPermissions,
  DISCORD_PERMISSIONS,
} from './permissions';
import { internalAction, type ActionCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import { roleAbove } from './permissions';
import { discordBot, ProviderFailure } from './provider';
/** Shared bounded audit ingestion for every Role binding on a guild; snapshots alone miss remove/re-add. */
export const observeGuildAccess = async (
  ctx: ActionCtx,
  { guildId }: { guildId: string }
) => {
  const bot = (path: string, method = 'GET', reason?: string) =>
    discordBot(ctx, path, {
      method,
      headers: reason ? { 'X-Audit-Log-Reason': reason } : {},
    });
  try {
    const meResponse = await bot('/users/@me');
    if (!meResponse.ok)
      throw new ProviderFailure(
        'Discord audit identity verification unavailable.'
      );
    const me: { id: string } = await meResponse.json();
    for (const action of [20, 22, 25]) {
      const stream = await ctx.runQuery(
        internal.groupDiscord.reconciliation.stream,
        { guildId, action }
      );
      // New streams inspect retained history; older entries are filtered against enrollment consent.
      const starts = [{ cursor: stream?.cursor ?? '0', overlap: false }];
      if (stream)
        starts.push({
          cursor:
            stream.overlapCursor ??
            String(
              BigInt(Math.max(0, Date.now() - 600000 - 1420070400000)) << 22n
            ),
          overlap: true,
        });
      for (const pass of starts) {
        const response = await bot(
          `/guilds/${guildId}/audit-logs?action_type=${action}&after=${pass.cursor}&limit=100`
        );
        if (!response.ok)
          throw new ProviderFailure(
            'Discord View Audit Log unavailable. Observation blocked; Connect again after permissions recover.'
          );
        const body: {
          audit_log_entries?: {
            id: string;
            target_id?: string;
            user_id?: string;
            reason?: string;
            changes?: { key: string; new_value?: unknown }[];
          }[];
        } = await response.json();
        if (!Array.isArray(body.audit_log_entries))
          throw new ProviderFailure(
            'Discord audit response incomplete. Observation blocked.'
          );
        const entries = body.audit_log_entries.sort((a, b) =>
          BigInt(a.id) < BigInt(b.id) ? -1 : 1
        );
        const cursor = entries[entries.length - 1]?.id ?? pass.cursor;
        await ctx.runMutation(internal.groupDiscord.reconciliation.auditPage, {
          guildId,
          action,
          entries: entries.map(
            ({ id, target_id, user_id, reason, changes }) => ({
              id,
              target_id,
              user_id,
              reason,
              removedRoleIds: changes
                ?.filter(change => change.key === '$remove')
                .flatMap(change =>
                  Array.isArray(change.new_value)
                    ? change.new_value
                        .filter(
                          (role): role is { id: string } =>
                            !!role &&
                            typeof role === 'object' &&
                            'id' in role &&
                            typeof role.id === 'string'
                        )
                        .map(role => role.id)
                    : []
                ),
              uncertainRoleChange:
                !changes ||
                changes.some(
                  change =>
                    change.key === '$remove' && !Array.isArray(change.new_value)
                ),
            })
          ),
          cursor,
          overlap: pass.overlap,
          complete: entries.length < 100,
          botId: me.id,
        });
        if (entries.length === 100)
          throw new ProviderFailure(
            'Discord moderation history is catching up. Connect again after synchronization.',
            1000
          );
      }
    }
  } catch (error) {
    await ctx.runMutation(internal.groupDiscord.reconciliation.auditFailure, {
      guildId,
      delay: error instanceof ProviderFailure ? error.delay : 5000,
      error:
        error instanceof Error
          ? error.message
          : 'Discord moderation observation failed.',
    });
    // Audit uncertainty freezes grant retries; dispatch uses the persisted retry window.
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Discord moderation observation failed.'
    );
  }
};
export const observeGuild = internalAction({
  args: { guildId: v.string() },
  returns: v.null(),
  handler: observeGuildAccess,
});
export const dispatchReconciliation = async (ctx: ActionCtx) => {
  const bot = (path: string, method = 'GET', reason?: string) =>
    discordBot(ctx, path, {
      method,
      headers: reason ? { 'X-Audit-Log-Reason': reason } : {},
    });
  const batch = await ctx.runMutation(
    internal.groupDiscord.reconciliation.due,
    {}
  );
  for (const row of batch.cleanup) {
    try {
      const path = `/guilds/${row.guildId}/members/${row.discordUserId}`;
      if (row.mode === 'membership') {
        const banPath = `/guilds/${row.guildId}/bans/${row.discordUserId}`;
        const ban = await bot(banPath);
        if (ban.ok) {
          await ctx.runMutation(
            internal.groupDiscord.reconciliation.cleanupOutcome,
            { id: row._id, expectedDesired: row.desired }
          );
          continue;
        }
        if (ban.status !== 404 || (await ban.json()).code !== 10026)
          throw new ProviderFailure(
            'Discord ban verification unavailable. Check bot permissions.'
          );
        const target = await bot(path);
        let member: { roles: string[] } | undefined;
        if (target.ok) member = await target.json();
        else if (target.status !== 404 || (await target.json()).code !== 10007)
          throw new ProviderFailure(
            'Discord membership removal blocked. Target could not be verified.'
          );
        if (!member && row.desired !== 'banned') {
          await ctx.runMutation(
            internal.groupDiscord.reconciliation.cleanupOutcome,
            { id: row._id, expectedDesired: row.desired }
          );
          continue;
        }
        const meResponse = await bot('/users/@me');
        const rolesResponse = await bot(`/guilds/${row.guildId}/roles`);
        const guildResponse = await bot(`/guilds/${row.guildId}`);
        if (!meResponse.ok || !rolesResponse.ok || !guildResponse.ok)
          throw new ProviderFailure(
            'Discord membership removal blocked. Bot capabilities unavailable.'
          );
        const me: { id: string } = await meResponse.json();
        const botResponse = await bot(
          `/guilds/${row.guildId}/members/${me.id}`
        );
        if (!botResponse.ok)
          throw new ProviderFailure('Discord bot membership unavailable.');
        const botMember: { roles: string[] } = await botResponse.json();
        const roles: { id: string; position: number; permissions: string }[] =
          await rolesResponse.json();
        const guild: { owner_id: string } = await guildResponse.json();
        const { roles: botRoles, permissions } = memberCapabilities(
          roles,
          botMember.roles,
          row.guildId
        );
        const needed =
          row.desired === 'banned'
            ? DISCORD_PERMISSIONS.ban
            : DISCORD_PERMISSIONS.kick;
        if (
          !hasPermissions(permissions, needed) ||
          guild.owner_id === row.discordUserId ||
          (member &&
            !botRoles.some(botRole =>
              roles
                .filter(
                  r => r.id === row.guildId || member!.roles.includes(r.id)
                )
                .every(targetRole =>
                  roleAbove(botRole, targetRole, row.guildId)
                )
            ))
        )
          throw new ProviderFailure(
            'Discord membership removal blocked. Check Kick Members, Ban Members and hierarchy.'
          );
        const result = await bot(
          row.desired === 'banned' ? banPath : path,
          row.desired === 'banned' ? 'PUT' : 'DELETE',
          `groupi-cleanup:${row._id}`
        );
        if (!result.ok)
          throw new ProviderFailure(
            'Discord membership removal denied. Retry pending.'
          );
        const observed = await bot(row.desired === 'banned' ? banPath : path);
        if (
          row.desired === 'banned'
            ? !observed.ok
            : !(
                observed.status === 404 &&
                (await observed.json()).code === 10007
              )
        )
          throw new ProviderFailure(
            'Discord membership removal not observed. Retry pending.',
            5000
          );
        await ctx.runMutation(
          internal.groupDiscord.reconciliation.cleanupOutcome,
          { id: row._id, expectedDesired: row.desired }
        );
        continue;
      }
      if (row.desired !== 'role_removed' || !row.roleId) continue;
      const before = await bot(path);
      if (before.ok) {
        const member: { roles: string[] } = await before.json();
        if (!member.roles.includes(row.roleId)) {
          await ctx.runMutation(
            internal.groupDiscord.reconciliation.cleanupOutcome,
            { id: row._id, expectedDesired: row.desired }
          );
          continue;
        }
      } else {
        const body = await before.json();
        if (before.status === 404 && body.code === 10007) {
          await ctx.runMutation(
            internal.groupDiscord.reconciliation.cleanupOutcome,
            { id: row._id, expectedDesired: row.desired }
          );
          continue;
        }
        throw new ProviderFailure(
          'Discord role removal blocked. Target membership could not be verified.'
        );
      }
      const meResponse = await bot('/users/@me');
      const rolesResponse = await bot(`/guilds/${row.guildId}/roles`);
      if (!meResponse.ok || !rolesResponse.ok)
        throw new ProviderFailure(
          'Discord role removal blocked. Check bot membership and Manage Roles.'
        );
      const me: { id: string } = await meResponse.json();
      const botResponse = await bot(`/guilds/${row.guildId}/members/${me.id}`);
      if (!botResponse.ok)
        throw new ProviderFailure(
          'Discord role removal blocked. Bot membership unavailable.'
        );
      const botMember: { roles: string[] } = await botResponse.json();
      const roles: { id: string; position: number; permissions: string }[] =
        await rolesResponse.json();
      const { roles: botRoles, permissions } = memberCapabilities(
        roles,
        botMember.roles,
        row.guildId
      );
      const role = roles.find(role => role.id === row.roleId);
      if (
        !hasPermissions(permissions, DISCORD_PERMISSIONS.manageRoles) ||
        (role &&
          !botRoles.some(botRole => roleAbove(botRole, role, row.guildId)))
      )
        throw new ProviderFailure(
          'Discord role removal blocked. Check Manage Roles and role hierarchy.'
        );
      const response = await bot(
        `${path}/roles/${row.roleId}`,
        'DELETE',
        `groupi-cleanup:${row._id}`
      );
      if (!response.ok) {
        // Unknown member is terminal absence; unknown guild/bot/role is not proof of removal.
        const body = await response.json();
        if (response.status !== 404 || body.code !== 10007)
          throw new ProviderFailure(
            'Discord role removal blocked. Check bot membership, Manage Roles and hierarchy.'
          );
      }
      const observed = await bot(path);
      if (observed.ok) {
        const member: { roles: string[] } = await observed.json();
        if (member.roles.includes(row.roleId))
          throw new ProviderFailure(
            'Discord role removal not yet observed; retry pending.',
            5000
          );
      } else {
        const body = await observed.json();
        if (observed.status !== 404 || body.code !== 10007)
          throw new ProviderFailure(
            'Discord role removal could not be verified. Check bot membership and permissions.'
          );
      }
      await ctx.runMutation(
        internal.groupDiscord.reconciliation.cleanupOutcome,
        { id: row._id, expectedDesired: row.desired }
      );
    } catch (error) {
      await ctx.runMutation(
        internal.groupDiscord.reconciliation.cleanupOutcome,
        {
          id: row._id,
          expectedDesired: row.desired,
          error:
            error instanceof Error ? error.message : 'Discord cleanup failed.',
          delay: error instanceof ProviderFailure ? error.delay : 5000,
        }
      );
    }
  }
  const guilds = new Map<string, ProviderFailure | undefined>();
  for (const row of batch.rows) {
    try {
      if (!guilds.has(row.guildId)) {
        try {
          await observeGuildAccess(ctx, {
            guildId: row.guildId,
          });
          guilds.set(row.guildId, undefined);
        } catch (error) {
          const stream = await ctx.runQuery(
            internal.groupDiscord.reconciliation.stream,
            { guildId: row.guildId, action: 20 }
          );
          guilds.set(
            row.guildId,
            new ProviderFailure(
              error instanceof Error
                ? error.message
                : 'Discord moderation observation failed.',
              Math.max(
                1000,
                (stream?.retryAt ?? Date.now() + 300000) - Date.now()
              )
            )
          );
        }
      }
      const auditError = guilds.get(row.guildId);
      if (auditError) throw auditError;
      const response = await bot(
        `/guilds/${row.guildId}/members/${row.discordUserId}`
      );
      let present: boolean;
      if (response.ok) {
        const member: { roles: string[] } = await response.json();
        present =
          row.mode === 'membership' || member.roles.includes(row.roleId!);
      } else {
        const body = await response.json();
        if (response.status !== 404 || body.code !== 10007)
          throw new ProviderFailure(
            'Discord member observation blocked. Check bot membership and permissions.'
          );
        present = false;
      }
      await ctx.runMutation(internal.groupDiscord.reconciliation.observe, {
        id: row._id,
        generation: row.generation,
        present,
      });
    } catch (error) {
      await ctx.runMutation(internal.groupDiscord.reconciliation.observe, {
        id: row._id,
        generation: row.generation,
        delay: error instanceof ProviderFailure ? error.delay : 5000,
        error:
          error instanceof Error
            ? error.message
            : 'Discord observation failed.',
      });
    }
  }
};
export const dispatch = internalAction({
  args: {},
  returns: v.null(),
  handler: dispatchReconciliation,
});
