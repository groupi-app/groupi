import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../../../_generated/dataModel';
import { getPersonWithUser } from '../../../auth';
import * as writes from '../../../invites/writes';
import {
  requireInvitePermission,
  inviteError,
} from '../../../invites/permissions';
const legacySummary = v.object({
  id: v.id('invites'),
  eventId: v.id('events'),
  token: v.string(),
  name: v.union(v.string(), v.null()),
  maxUses: v.union(v.number(), v.null()),
  usesTotal: v.union(v.number(), v.null()),
  usesRemaining: v.union(v.number(), v.null()),
  expiresAt: v.union(v.number(), v.null()),
  createdAt: v.number(),
});
export const listEventInvites = internalQuery({
  args: { eventId: v.string(), personId: v.id('persons') },
  returns: v.object({ invites: v.array(legacySummary) }),
  handler: async (ctx, { eventId, personId }) => {
    const id = eventId as Id<'events'>;
    await requireInvitePermission(ctx, id, personId);
    const rows = await ctx.db
      .query('invites')
      .withIndex('by_event', q => q.eq('eventId', id))
      .collect();
    return {
      invites: rows.map(row => {
        const capacity = writes.inviteCapacity(row);
        return {
          id: row._id,
          eventId: row.eventId,
          token: row.token,
          name: row.name ?? null,
          maxUses: capacity ?? null,
          usesTotal: writes.inviteConsumed(row),
          usesRemaining: row.usesRemaining ?? null,
          expiresAt: row.expiresAt ?? null,
          createdAt: row._creationTime,
        };
      }),
    };
  },
});
export const createInvite = internalMutation({
  args: {
    eventId: v.string(),
    creatorMembershipId: v.string(),
    maxUses: v.optional(v.number()),
    name: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({ id: v.id('invites'), token: v.string() }),
  handler: async (
    ctx,
    { eventId, creatorMembershipId, maxUses, name, expiresAt }
  ) => {
    const membership = await ctx.db.get(
      creatorMembershipId as Id<'memberships'>
    );
    if (!membership || membership.eventId !== eventId)
      inviteError('FORBIDDEN', 'Event membership required');
    const result = await writes.createInviteForPerson(
      ctx,
      membership.personId,
      { eventId: membership.eventId, usesTotal: maxUses, name, expiresAt }
    );
    return { id: result.invite.id, token: result.invite.token };
  },
});
export const deleteInvite = internalMutation({
  args: { inviteId: v.string(), personId: v.string() },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, { inviteId, personId }) => {
    await writes.deleteInvitesForPerson(ctx, personId as Id<'persons'>, {
      inviteIds: [inviteId as Id<'invites'>],
    });
    return { success: true as const };
  },
});
export const getInviteByToken = internalQuery({
  args: { token: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      id: v.id('invites'),
      eventId: v.id('events'),
      eventTitle: v.string(),
      eventDescription: v.union(v.string(), v.null()),
      eventLocation: v.union(v.string(), v.null()),
      name: v.union(v.string(), v.null()),
      expired: v.boolean(),
      maxUsesReached: v.boolean(),
    })
  ),
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query('invites')
      .withIndex('by_token', q => q.eq('token', token))
      .unique();
    if (!row) return null;
    const event = await ctx.db.get(row.eventId);
    if (!event) return null;
    return {
      id: row._id,
      eventId: event._id,
      eventTitle: event.title,
      eventDescription: event.description ?? null,
      eventLocation: event.location ?? null,
      name: row.name ?? null,
      expired: row.expiresAt !== undefined && row.expiresAt <= Date.now(),
      maxUsesReached: row.usesRemaining !== undefined && row.usesRemaining <= 0,
    };
  },
});
/**
 * Get minimal invite metadata for OpenGraph previews.
 * Returns only non-sensitive event info (title, location, date, creator name).
 * No authentication required since invite links are meant to be shared.
 */
export const getInviteOgMeta = internalQuery({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      title: v.string(),
      location: v.union(v.string(), v.null()),
      chosenDateTime: v.union(v.number(), v.null()),
      chosenEndDateTime: v.union(v.number(), v.null()),
      creatorName: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx, { token }) => {
    const invite = await ctx.db
      .query('invites')
      .withIndex('by_token', q => q.eq('token', token))
      .first();

    if (!invite) return null;

    // Check validity
    if (invite.expiresAt && invite.expiresAt <= Date.now()) return null;
    if (invite.usesRemaining !== undefined && invite.usesRemaining <= 0)
      return null;

    const event = await ctx.db.get(invite.eventId);
    if (!event) return null;

    // Get creator name
    let creatorName: string | null = null;
    const creatorData = await getPersonWithUser(ctx, event.creatorId);
    if (creatorData?.user) {
      creatorName = creatorData.user.name ?? creatorData.user.username ?? null;
    }

    return {
      title: event.title,
      location: event.location ?? null,
      chosenDateTime: event.chosenDateTime ?? null,
      chosenEndDateTime: event.chosenEndDateTime ?? null,
      creatorName,
    };
  },
});

export const acceptInvite = internalMutation({
  args: { token: v.string(), personId: v.string() },
  returns: v.object({
    eventId: v.id('events'),
    membershipId: v.id('memberships'),
  }),
  handler: async (ctx, { token, personId }) => {
    const result = await writes.acceptInviteForPerson(
      ctx,
      personId as Id<'persons'>,
      { token }
    );
    return { eventId: result.event.id, membershipId: result.membership.id };
  },
});
