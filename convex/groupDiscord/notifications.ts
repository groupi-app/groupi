import type { MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { createNotification } from '../lib/notifications';

/** The existing dispatcher drains at most one 20-recipient alert page per tick. */
export async function deliverSynchronizationAlertPage(
  ctx: MutationCtx,
  alert: Doc<'groupDiscordSyncAlerts'>
) {
  const group = await ctx.db.get(alert.groupId);
  const connection = await ctx.db
    .query('groupDiscordConnections')
    .withIndex('by_group', q => q.eq('groupId', alert.groupId))
    .unique();
  if (!group && !connection?.groupDeleted) {
    await ctx.db.patch(alert._id, { pending: false });
    return;
  }
  const page = group
    ? await ctx.db
        .query('groupMemberships')
        .withIndex('by_groupId_and_role', q =>
          q.eq('groupId', alert.groupId).gt('role', 'MEMBER')
        )
        .paginate({ numItems: 20, cursor: alert.cursor ?? null })
    : null;
  const offset = alert.viewerOffset ?? 0;
  // Deleted Groups retain a private, immutable cleanup audience captured at teardown.
  const viewers = connection?.cleanupViewerIds ?? [];
  const recipients = page
    ? page.page.map(manager => manager.personId)
    : viewers.slice(offset, offset + 20);
  for (const personId of recipients) {
    if (!(await ctx.db.get(personId))) continue;
    const delivered = await ctx.db
      .query('notifications')
      .withIndex('by_person_type_group', q =>
        q
          .eq('personId', personId)
          .eq('type', 'GROUP_DISCORD_SYNC_BLOCKED')
          .eq('groupId', alert.groupId)
          .gte('_creationTime', alert.notifiedAt)
      )
      .first();
    if (delivered) continue;
    await createNotification(
      ctx,
      { personId, groupId: alert.groupId, type: 'GROUP_DISCORD_SYNC_BLOCKED' },
      {
        messageContext: {
          groupTitle: group?.name ?? 'Deleted Group',
          notificationUrl: `${process.env.SITE_URL || 'https://groupi.gg'}/groups/${alert.groupId}#group-discord-heading`,
        },
      }
    );
  }
  await ctx.db.patch(alert._id, {
    pending: page ? !page.isDone : offset + 20 < viewers.length,
    cursor: page?.isDone ? undefined : page?.continueCursor,
    viewerOffset: page ? undefined : offset + 20,
    nextDeliveryAt: Date.now() + 60000,
  });
}

/** One manager alert per Group per day; retries never generate success notices. */
export async function notifySynchronizationBlocked(
  ctx: MutationCtx,
  groupId: Id<'groups'>
) {
  const previous = await ctx.db
    .query('groupDiscordSyncAlerts')
    .withIndex('by_group', q => q.eq('groupId', groupId))
    .unique();
  const now = Date.now();
  if (previous && (previous.pending || previous.notifiedAt > now - 86400000))
    return;
  const data = { groupId, notifiedAt: now, pending: true, nextDeliveryAt: now };
  const id =
    previous?._id ?? (await ctx.db.insert('groupDiscordSyncAlerts', data));
  if (previous) await ctx.db.replace(id, data);
  await deliverSynchronizationAlertPage(ctx, (await ctx.db.get(id))!);
}

/** A guild can back many independent Role connections; fan-out must remain bounded too. */
export async function deliverGuildSynchronizationAlertPage(
  ctx: MutationCtx,
  stream: Doc<'groupDiscordAuditStreams'>
) {
  if (!stream.error) {
    await ctx.db.patch(stream._id, { notificationPending: false });
    return;
  }
  const page = await ctx.db
    .query('groupDiscordConnections')
    .withIndex('by_guild_status', q =>
      q.eq('guildId', stream.guildId).eq('status', 'active')
    )
    .paginate({ numItems: 20, cursor: stream.notificationCursor ?? null });
  for (const connection of page.page)
    await notifySynchronizationBlocked(ctx, connection.groupId);
  await ctx.db.patch(stream._id, {
    notificationPending: !page.isDone,
    notificationCursor: page.isDone ? undefined : page.continueCursor,
    nextNotificationAt: Date.now() + 60000,
  });
}
