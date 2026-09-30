import { v, ConvexError, type Infer } from 'convex/values';
import {
  internalMutation,
  internalQuery,
  type QueryCtx,
} from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { components, internal } from '../_generated/api';
import { hash, requestExpiry } from '../lib/requestId';
import { requireInvitePermission, inviteError } from './permissions';
import * as writes from './writes';
import * as members from '../eventInvites/writes';
import {
  creationBody,
  creationResult,
  linkSummary,
  memberSummary,
  memberStatus,
} from './contracts';
import { parseEventDate } from '../events/writes';

export const create = internalMutation({
  args: {
    personId: v.id('persons'),
    userId: v.string(),
    requestId: v.optional(v.string()),
    body: creationBody,
  },
  returns: creationResult,
  handler: async (
    ctx,
    { personId, userId, requestId, body }
  ): Promise<Infer<typeof creationResult>> => {
    const person = await ctx.db.get(personId);
    if (!person || person.userId !== userId)
      inviteError('FORBIDDEN', 'Invalid invitation identity');
    await requireInvitePermission(ctx, body.eventId, personId);
    const operation = `invites.${body.kind}`;
    const expiresAt =
      requestId === undefined ? undefined : requestExpiry(requestId);
    const payloadHash = await hash(body);
    if (requestId !== undefined) {
      const previous = await ctx.db
        .query('inviteCreationRequests')
        .withIndex('by_userId_and_operation_and_requestId', q =>
          q
            .eq('userId', userId)
            .eq('operation', operation)
            .eq('requestId', requestId)
        )
        .unique();
      if (previous) {
        if (previous.payloadHash !== payloadHash)
          throw new ConvexError({
            code: 'IDEMPOTENCY_CONFLICT',
            message:
              'Request identifier was already used for different invitation input.',
          });
        return previous.result;
      }
    }
    const result = await (async () => {
      if (body.kind === 'link') {
        const created = await writes.createInviteForPerson(ctx, personId, {
          eventId: body.eventId,
          name: body.name,
          usesTotal: body.maxUses,
          expiresAt:
            body.expiresAt === undefined
              ? undefined
              : parseEventDate(body.expiresAt),
        });
        return { id: created.invite.id, token: created.invite.token };
      }
      if (body.kind === 'pending') {
        const sent = await writes.sendPendingEmailInvitesForPerson(
          ctx,
          personId,
          { eventId: body.eventId }
        );
        return { queuedCount: sent.sentCount };
      }
      if (body.kind === 'email') {
        const created = await writes.createEmailInvitesForPerson(
          ctx,
          personId,
          {
            eventId: body.eventId,
            invites: body.invites,
            customMessage: body.customMessage,
            expiresAt:
              body.expiresAt === undefined
                ? undefined
                : parseEventDate(body.expiresAt),
          }
        );
        const sent =
          body.send === false
            ? { sentCount: 0 }
            : await writes.sendPendingEmailInvitesForPerson(ctx, personId, {
                eventId: body.eventId,
              });
        return { ...created, queuedCount: sent.sentCount };
      }
      const username = body.username.trim().replace(/^@/, '').toLowerCase();
      const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: 'user',
        where: [{ field: 'username', operator: 'eq', value: username }],
      });
      if (!user) inviteError('NOT_FOUND', 'User not found');
      const target = await ctx.db
        .query('persons')
        .withIndex('by_user_id', q => q.eq('userId', String(user._id)))
        .unique();
      if (!target) inviteError('NOT_FOUND', 'User not found');
      const sent = await members.sendEventInviteForPerson(ctx, personId, {
        eventId: body.eventId,
        inviteePersonId: target._id,
        role: body.role ?? 'ATTENDEE',
        message: body.message,
      });
      return { inviteId: sent.inviteId, status: sent.status };
    })();
    if (requestId !== undefined && expiresAt !== undefined) {
      const requestRowId = await ctx.db.insert('inviteCreationRequests', {
        userId,
        operation,
        requestId,
        payloadHash,
        expiresAt,
        result,
      });
      await ctx.scheduler.runAfter(
        Math.max(0, expiresAt - Date.now()),
        internal.invites.rest.expireRequest,
        { requestRowId }
      );
    }
    return result;
  },
});
export const expireRequest = internalMutation({
  args: { requestRowId: v.id('inviteCreationRequests') },
  returns: v.null(),
  handler: async (ctx, { requestRowId }) => {
    const row = await ctx.db.get(requestRowId);
    if (row && row.expiresAt <= Date.now()) await ctx.db.delete(requestRowId);
    return null;
  },
});
export function summarizeLink(invite: Doc<'invites'>) {
  const capacity = writes.inviteCapacity(invite);
  return {
    id: invite._id,
    eventId: invite.eventId,
    token: invite.token,
    name: invite.name ?? null,
    maxUses: capacity ?? null,
    usesTotal: writes.inviteConsumed(invite),
    usesRemaining: invite.usesRemaining ?? null,
    expiresAt: invite.expiresAt ?? null,
    createdAt: invite._creationTime,
    kind: invite.email ? ('email' as const) : ('link' as const),
    email: invite.email ?? null,
    recipientName: invite.recipientName ?? null,
    customMessage: invite.customMessage ?? null,
    emailStatus: invite.email
      ? invite.emailSentAt === undefined
        ? ('pending' as const)
        : ('queued' as const)
      : null,
  };
}
function decodeCursor(cursor: string | undefined, binding: string) {
  if (!cursor) return null;
  try {
    const parsed: unknown = JSON.parse(atob(cursor));
    if (
      parsed &&
      typeof parsed === 'object' &&
      'binding' in parsed &&
      parsed.binding === binding &&
      'cursor' in parsed &&
      typeof parsed.cursor === 'string'
    )
      return parsed.cursor;
  } catch {
    /* Invalid client input */
  }
  inviteError(
    'VALIDATION_ERROR',
    'Invalid invitation cursor. Start again without a cursor.'
  );
}
function encodeCursor(cursor: string, binding: string) {
  return btoa(JSON.stringify({ binding, cursor }));
}
export const listLinks = internalQuery({
  args: {
    personId: v.id('persons'),
    eventId: v.id('events'),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    kind: v.union(v.literal('link'), v.literal('email'), v.literal('all')),
  },
  returns: v.union(
    v.array(linkSummary),
    v.object({
      items: v.array(linkSummary),
      nextCursor: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx, { personId, eventId, limit, cursor, kind }) => {
    await requireInvitePermission(ctx, eventId, personId);
    const query = ctx.db
      .query('invites')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .order('desc');
    const matches = (row: Doc<'invites'>) =>
      kind === 'all' || (kind === 'email' ? !!row.email : !row.email);
    if (limit === undefined)
      return (await query.collect()).filter(matches).map(summarizeLink);
    const binding = JSON.stringify([personId, eventId, kind]);
    let page;
    try {
      page = await query.paginate({
        numItems: limit,
        cursor: decodeCursor(cursor, binding),
      });
    } catch {
      inviteError(
        'VALIDATION_ERROR',
        'Invalid invitation cursor. Start again without a cursor.'
      );
    }
    return {
      items: page.page.filter(matches).map(summarizeLink),
      nextCursor: page.isDone
        ? null
        : encodeCursor(page.continueCursor, binding),
    };
  },
});
export const editLink = internalMutation({
  args: {
    personId: v.id('persons'),
    inviteId: v.id('invites'),
    name: v.optional(v.string()),
    maxUses: v.optional(v.union(v.number(), v.null())),
    expiresAt: v.optional(v.union(v.string(), v.null())),
  },
  returns: linkSummary,
  handler: async (ctx, { personId, inviteId, name, maxUses, expiresAt }) => {
    await writes.updateInviteForPerson(ctx, personId, {
      inviteId,
      name,
      usesTotal: maxUses,
      expiresAt:
        typeof expiresAt === 'string' ? parseEventDate(expiresAt) : expiresAt,
    });
    const row = await ctx.db.get(inviteId);
    if (!row) inviteError('NOT_FOUND', 'Invite not found');
    return summarizeLink(row);
  },
});
export const deleteLink = internalMutation({
  args: { personId: v.id('persons'), inviteId: v.id('invites') },
  returns: v.null(),
  handler: async (ctx, { personId, inviteId }) => {
    await writes.deleteInvitesForPerson(ctx, personId, {
      inviteIds: [inviteId],
    });
    return null;
  },
});
export const inspectLink = internalQuery({
  args: { token: v.string(), now: v.number() },
  returns: v.object({
    id: v.id('invites'),
    eventId: v.id('events'),
    eventTitle: v.string(),
    eventDescription: v.union(v.string(), v.null()),
    eventLocation: v.union(v.string(), v.null()),
    name: v.union(v.string(), v.null()),
    expired: v.boolean(),
    maxUsesReached: v.boolean(),
  }),
  handler: async (ctx, { token, now }) => {
    const row = await ctx.db
      .query('invites')
      .withIndex('by_token', q => q.eq('token', token))
      .unique();
    if (!row) inviteError('NOT_FOUND', 'Invite not found');
    const event = await ctx.db.get(row.eventId);
    if (!event) inviteError('NOT_FOUND', 'Event not found');
    return {
      id: row._id,
      eventId: event._id,
      eventTitle: event.title,
      eventDescription: event.description ?? null,
      eventLocation: event.location ?? null,
      name: row.name ?? null,
      expired: row.expiresAt !== undefined && row.expiresAt <= now,
      maxUsesReached: row.usesRemaining !== undefined && row.usesRemaining <= 0,
    };
  },
});
export const acceptLink = internalMutation({
  args: { personId: v.id('persons'), token: v.string() },
  returns: v.object({
    eventId: v.id('events'),
    membershipId: v.id('memberships'),
  }),
  handler: async (ctx, { personId, token }) => {
    const result = await writes.acceptInviteForPerson(ctx, personId, { token });
    return { eventId: result.event.id, membershipId: result.membership.id };
  },
});
async function summarizeMember(ctx: QueryCtx, row: Doc<'eventInvites'>) {
  const event = await ctx.db.get(row.eventId);
  return {
    inviteId: row._id,
    eventId: row.eventId,
    eventTitle: event?.title ?? 'Deleted event',
    inviterId: row.inviterId,
    inviteeId: row.inviteeId,
    role: row.role,
    status: row.status,
    message: row.message ?? null,
    createdAt: row.createdAt,
    respondedAt: row.respondedAt ?? null,
  };
}
async function readableMember(
  ctx: QueryCtx,
  personId: Id<'persons'>,
  inviteId: Id<'eventInvites'>
) {
  const row = await ctx.db.get(inviteId);
  if (!row) inviteError('NOT_FOUND', 'Invite not found');
  if (row.inviteeId !== personId && row.inviterId !== personId)
    await requireInvitePermission(ctx, row.eventId, personId);
  return row;
}
export const getMember = internalQuery({
  args: { personId: v.id('persons'), inviteId: v.id('eventInvites') },
  returns: memberSummary,
  handler: async (ctx, { personId, inviteId }) =>
    summarizeMember(ctx, await readableMember(ctx, personId, inviteId)),
});
export const listMembers = internalQuery({
  args: {
    personId: v.id('persons'),
    eventId: v.optional(v.id('events')),
    status: v.union(memberStatus, v.literal('all')),
    limit: v.number(),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    items: v.array(memberSummary),
    nextCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, { personId, eventId, status, limit, cursor }) => {
    if (eventId) await requireInvitePermission(ctx, eventId, personId);
    const query = eventId
      ? ctx.db
          .query('eventInvites')
          .withIndex('by_event', q => q.eq('eventId', eventId))
      : status === 'all'
        ? ctx.db
            .query('eventInvites')
            .withIndex('by_invitee', q => q.eq('inviteeId', personId))
        : ctx.db
            .query('eventInvites')
            .withIndex('by_invitee_status', q =>
              q.eq('inviteeId', personId).eq('status', status)
            );
    const binding = JSON.stringify([personId, eventId ?? null, status]);
    let page;
    try {
      page = await query
        .order('desc')
        .paginate({ numItems: limit, cursor: decodeCursor(cursor, binding) });
    } catch {
      inviteError(
        'VALIDATION_ERROR',
        'Invalid invitation cursor. Start again without a cursor.'
      );
    }
    const rows = page.page.filter(
      row => status === 'all' || row.status === status
    );
    return {
      items: await Promise.all(rows.map(row => summarizeMember(ctx, row))),
      nextCursor: page.isDone
        ? null
        : encodeCursor(page.continueCursor, binding),
    };
  },
});
export const respondMember = internalMutation({
  args: {
    personId: v.id('persons'),
    inviteId: v.id('eventInvites'),
    action: v.union(
      v.literal('accept'),
      v.literal('decline'),
      v.literal('cancel')
    ),
  },
  returns: v.union(
    v.object({ eventId: v.id('events'), membershipId: v.id('memberships') }),
    v.object({ success: v.literal(true) })
  ),
  handler: async (ctx, { personId, inviteId, action }) => {
    if (action === 'accept') {
      const row = await ctx.db.get(inviteId);
      if (!row) inviteError('NOT_FOUND', 'Invite not found');
      const result = await members.acceptEventInviteForPerson(ctx, personId, {
        inviteId,
      });
      return { eventId: row.eventId, membershipId: result.membershipId };
    }
    if (action === 'decline')
      await members.declineEventInviteForPerson(ctx, personId, { inviteId });
    else await members.cancelEventInviteForPerson(ctx, personId, { inviteId });
    return { success: true as const };
  },
});
