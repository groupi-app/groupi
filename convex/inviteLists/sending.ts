import { ConvexError, type Infer } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { requireInvitePermission } from '../invites/permissions';
import { getEventInviteEligibility } from '../eventInvites/eligibility';
import { resolvePeople, requireOwnedList } from './model';
import {
  snapshotSendArgs,
  listSendArgs,
  sendBody,
  sendResult,
} from './contracts';
import { sendEventInviteForPerson } from '../eventInvites/writes';
import { hash, requestExpiry } from '../lib/requestId';
import { internal } from '../_generated/api';

function uniqueRecipients(personIds: Id<'persons'>[]) {
  const ids = [...new Set(personIds)];
  if (ids.length > 100)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'You can send to at most 100 distinct recipients',
    });
  return ids;
}

async function reviewPeople(
  ctx: QueryCtx | MutationCtx,
  personId: Id<'persons'>,
  eventId: Id<'events'>,
  personIds: Id<'persons'>[]
) {
  const people = await resolvePeople(ctx, personIds);
  return Promise.all(
    people.map(async person => {
      if (!person.available)
        return {
          ...person,
          status: 'skipped' as const,
          reason: 'UNAVAILABLE' as const,
        };
      const eligibility = await getEventInviteEligibility(
        ctx,
        personId,
        eventId,
        person.personId
      );
      return eligibility.allowed
        ? { ...person, status: 'eligible' as const }
        : { ...person, status: 'skipped' as const, reason: eligibility.reason };
    })
  );
}

export async function reviewRecipientsForPerson(
  ctx: QueryCtx,
  personId: Id<'persons'>,
  args: { eventId: Id<'events'>; personIds: Id<'persons'>[] }
) {
  await requireInvitePermission(ctx, args.eventId, personId);
  const ids = uniqueRecipients(args.personIds);
  const results = await reviewPeople(ctx, personId, args.eventId, ids);
  const eligibleCount = results.filter(
    result => result.status === 'eligible'
  ).length;
  return {
    eventId: args.eventId,
    totalCount: results.length,
    eligibleCount,
    skippedCount: results.length - eligibleCount,
    results,
  };
}

async function sendForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  args: Infer<typeof sendBody>,
  requestId?: string,
  authenticatedUserId?: string
): Promise<Infer<typeof sendResult>> {
  const membership = await requireInvitePermission(ctx, args.eventId, personId);
  const role = args.role ?? 'ATTENDEE';
  if (role === 'MODERATOR' && membership.role !== 'ORGANIZER')
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Only organizers can invite someone as a moderator',
    });
  if ((args.message?.length ?? 0) > 480)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Message must be 480 characters or less',
    });
  const person = await ctx.db.get(personId);
  if (
    !person ||
    (authenticatedUserId !== undefined && person.userId !== authenticatedUserId)
  )
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Invalid invitation identity',
    });
  const expiresAt =
    requestId === undefined ? undefined : requestExpiry(requestId);
  const operation = `inviteLists.${args.kind}`;
  const payloadHash = await hash(args);
  // Hash the original list invocation, not a later expansion. Permission checks
  // happen first; a protected replay remains valid after list edits/deletion.
  const previous =
    requestId === undefined
      ? null
      : await ctx.db
          .query('inviteCreationRequests')
          .withIndex('by_userId_and_operation_and_requestId', q =>
            q
              .eq('userId', person.userId)
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
    if (!('sentCount' in previous.result))
      throw new Error('Invalid recorded Invite list result');
    return previous.result;
  }
  const ids = uniqueRecipients(
    args.kind === 'snapshot'
      ? args.personIds
      : (await requireOwnedList(ctx, personId, args.inviteListId)).personIds
  );
  if (ids.length === 0)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Choose at least one recipient',
    });
  const reviewed = await reviewPeople(ctx, personId, args.eventId, ids);
  if (!reviewed.some(person => person.available))
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message:
        'Repair this selection by adding at least one existing user before sending',
    });
  const results: Infer<typeof sendResult>['results'] = [];
  for (const person of reviewed) {
    if (person.status === 'skipped') {
      results.push({
        personId: person.personId,
        status: 'skipped',
        reason: person.reason,
      });
      continue;
    }
    const sent = await sendEventInviteForPerson(ctx, personId, {
      eventId: args.eventId,
      inviteePersonId: person.personId,
      role,
      message: args.message,
    });
    results.push({
      personId: person.personId,
      status: 'sent',
      inviteId: sent.inviteId,
    });
  }
  const sentCount = results.filter(result => result.status === 'sent').length;
  const result = {
    eventId: args.eventId,
    totalCount: results.length,
    sentCount,
    skippedCount: results.length - sentCount,
    results,
  };
  if (requestId !== undefined && expiresAt !== undefined) {
    const requestRowId = await ctx.db.insert('inviteCreationRequests', {
      userId: person.userId,
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
}

export async function sendSnapshotForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  args: Infer<typeof snapshotSendArgs>
) {
  const { requestId, ...body } = args;
  return sendForPerson(ctx, personId, { kind: 'snapshot', ...body }, requestId);
}
export async function sendListForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  args: Infer<typeof listSendArgs>,
  authenticatedUserId?: string
) {
  const { requestId, ...body } = args;
  return sendForPerson(
    ctx,
    personId,
    { kind: 'list', ...body },
    requestId,
    authenticatedUserId
  );
}
