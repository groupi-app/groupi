'use node';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
const BASE = 'https://discord.com/api/v10';
class ProviderFailure extends Error {
  constructor(
    message: string,
    public delay = 300000
  ) {
    super(message);
  }
}
async function bot(path: string, method = 'GET', reason?: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token)
    throw new ProviderFailure(
      'Discord bot unavailable. Contact the Groupi administrator.'
    );
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      ...(reason ? { 'X-Audit-Log-Reason': reason } : {}),
    },
  });
  if (response.status === 429) {
    const body = await response.json();
    throw new ProviderFailure(
      'Discord synchronization rate limited; retry pending.',
      Math.max(
        1000,
        Number(response.headers.get('Retry-After') ?? body.retry_after ?? 1) *
          1000
      )
    );
  }
  if (response.status >= 500)
    throw new ProviderFailure(
      'Discord temporarily unavailable; retry pending.',
      5000
    );
  return response;
}
/** Shared bounded audit ingestion for every Role binding on a guild; snapshots alone miss remove/re-add. */
export const observeGuild = internalAction({
  args: { guildId: v.string() },
  handler: async (ctx, { guildId }) => {
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
          await ctx.runMutation(
            internal.groupDiscord.reconciliation.auditPage,
            {
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
                        change.key === '$remove' &&
                        !Array.isArray(change.new_value)
                    ),
                })
              ),
              cursor,
              overlap: pass.overlap,
              complete: entries.length < 100,
              botId: me.id,
            }
          );
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
        error:
          error instanceof Error
            ? error.message
            : 'Discord moderation observation failed.',
      });
      throw error;
    }
  },
});
export const dispatch = internalAction({
  args: {},
  handler: async ctx => {
    const batch = await ctx.runMutation(
      internal.groupDiscord.reconciliation.due,
      {}
    );
    for (const row of batch.cleanup) {
      if (row.mode !== 'role' || row.desired !== 'role_removed' || !row.roleId)
        continue;
      try {
        const path = `/guilds/${row.guildId}/members/${row.discordUserId}`;
        const before = await bot(path);
        if (before.ok) {
          const member: { roles: string[] } = await before.json();
          if (!member.roles.includes(row.roleId)) {
            await ctx.runMutation(
              internal.groupDiscord.reconciliation.cleanupOutcome,
              { id: row._id }
            );
            continue;
          }
        } else {
          const body = await before.json();
          if (before.status === 404 && body.code === 10007) {
            await ctx.runMutation(
              internal.groupDiscord.reconciliation.cleanupOutcome,
              { id: row._id }
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
        const botResponse = await bot(
          `/guilds/${row.guildId}/members/${me.id}`
        );
        if (!botResponse.ok)
          throw new ProviderFailure(
            'Discord role removal blocked. Bot membership unavailable.'
          );
        const botMember: { roles: string[] } = await botResponse.json();
        const roles: { id: string; position: number; permissions: string }[] =
          await rolesResponse.json();
        const botRoles = roles.filter(
          role => role.id === row.guildId || botMember.roles.includes(role.id)
        );
        const permissions = botRoles.reduce(
          (bits, role) => bits | BigInt(role.permissions),
          0n
        );
        const role = roles.find(role => role.id === row.roleId);
        if (
          ((permissions & 8n) === 0n && (permissions & 268435456n) === 0n) ||
          (role &&
            role.position >= Math.max(...botRoles.map(role => role.position)))
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
          { id: row._id }
        );
      } catch (error) {
        await ctx.runMutation(
          internal.groupDiscord.reconciliation.cleanupOutcome,
          {
            id: row._id,
            error:
              error instanceof Error
                ? error.message
                : 'Discord cleanup failed.',
            delay: error instanceof ProviderFailure ? error.delay : 5000,
          }
        );
      }
    }
    const guilds = new Map<string, string | undefined>();
    for (const row of batch.rows) {
      try {
        if (!guilds.has(row.guildId)) {
          try {
            await ctx.runAction(internal.groupDiscord.reconcile.observeGuild, {
              guildId: row.guildId,
            });
            guilds.set(row.guildId, undefined);
          } catch (error) {
            guilds.set(
              row.guildId,
              error instanceof Error
                ? error.message
                : 'Discord moderation observation failed.'
            );
          }
        }
        const auditError = guilds.get(row.guildId);
        if (auditError) throw new ProviderFailure(auditError);
        const response = await bot(
          `/guilds/${row.guildId}/members/${row.discordUserId}`
        );
        let present: boolean;
        if (response.ok) {
          const member: { roles: string[] } = await response.json();
          present = member.roles.includes(row.roleId);
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
          error:
            error instanceof Error
              ? error.message
              : 'Discord observation failed.',
        });
      }
    }
  },
});
