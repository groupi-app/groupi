import { v, type Infer } from 'convex/values';
import { mutation, query, internalMutation } from '../_generated/server';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { requireAuth } from '../auth';
import { accountActive, secretHash } from '../authorization/model';
import { requireWriteRole } from './writes';
import { eventViewer } from './attendance';
import { guardEventReactivation, isEventComplete } from './lifecycle';
import { chooseEventDateForPerson, resetEventDateForPerson } from './scheduling';
import { operationError, priorReceipt, receiptBinding, saveReceipt } from '../groups/operationReceipts';
const action = v.union(v.literal('complete'), v.literal('reopen'), v.literal('reschedule'));
const argsValidator = v.object({ eventId: v.id('events'), operationId: v.string(), expectedRevision: v.string(), action, startsAt: v.optional(v.union(v.number(), v.null())), endsAt: v.optional(v.union(v.number(), v.null())) });
const resultValidator = v.object({ operationId: v.string(), outcome: v.literal('committed'), result: v.object({ eventId: v.id('events'), revision: v.string(), completed: v.boolean() }), effects: v.object({ email: v.literal('not-requested'), cleanup: v.literal('not-requested') }) });
export const getLifecycle = query({
  args: { eventId: v.id('events') },
  returns: v.object({ revision: v.string(), completed: v.boolean(), completedAt: v.union(v.number(), v.null()), startsAt: v.union(v.number(), v.null()), endsAt: v.union(v.number(), v.null()) }),
  handler: async (ctx, { eventId }) => {
    const { event, membership } = await eventViewer(ctx, eventId, (await requireAuth(ctx)).person._id);
    if (membership.role !== 'ORGANIZER') operationError('FORBIDDEN', 'ORGANIZER role required.');
    return { revision: await secretHash(JSON.stringify(event)), completed: isEventComplete(event, Date.now()), completedAt: event.completedAt ?? null, startsAt: event.chosenDateTime ?? null, endsAt: event.chosenEndDateTime ?? null };
  },
});
/** Organizer-only transaction shared by native and REST. Authorization precedes replay. */
export async function setLifecycleForPerson(ctx: MutationCtx, personId: Id<'persons'>, args: Infer<typeof argsValidator>) {
  const now = Date.now();
  await accountActive(ctx, personId, now);
  await requireWriteRole(ctx, args.eventId, personId, 'ORGANIZER');
  const event = await ctx.db.get(args.eventId);
  if (!event) operationError('NOT_FOUND', 'Event not found.');
  const binding = await receiptBinding({ operation: 'events.lifecycle', actor: personId, ...args });
  const prior = await priorReceipt(ctx, args.operationId, binding, now);
  if (prior) return JSON.parse(prior) as Infer<typeof resultValidator>;
  if (await secretHash(JSON.stringify(event)) !== args.expectedRevision)
    operationError('STALE_REVISION', 'Event changed. Refresh before creating a new intent.');
  if (args.action !== 'reschedule' && (args.startsAt !== undefined || args.endsAt !== undefined))
    operationError('VALIDATION_ERROR', 'Only reschedule accepts dates.');
  if (args.action === 'complete') {
    await ctx.db.patch(event._id, { completedAt: event.completedAt ?? now, updatedAt: Math.max(now, event.updatedAt + 1) });
  } else {
    await guardEventReactivation(ctx, event._id, true);
    if (args.action === 'reopen' && event.chosenEndDateTime !== undefined && event.chosenEndDateTime <= now)
      operationError('VALIDATION_ERROR', 'Reschedule the ended Event before reopening.');
    if (args.action === 'reschedule') {
      if (args.startsAt === undefined || args.endsAt === undefined)
        operationError('VALIDATION_ERROR', 'Provide both startsAt and endsAt, using null for undated/no-end.');
      if (args.startsAt === null && args.endsAt !== null)
        operationError('VALIDATION_ERROR', 'An end requires a start.');
      if (args.startsAt !== null && (!Number.isFinite(args.startsAt) || args.startsAt <= now || (args.endsAt !== null && (!Number.isFinite(args.endsAt) || args.endsAt <= args.startsAt))))
        operationError('VALIDATION_ERROR', 'A valid future start and later end are required.');
      await ctx.db.patch(event._id, { completedAt: undefined });
      if (args.startsAt === null) await resetEventDateForPerson(ctx, personId, { eventId: event._id });
      else await chooseEventDateForPerson(ctx, personId, { eventId: event._id, chosenDateTime: args.startsAt, chosenEndDateTime: args.endsAt ?? undefined });
    }
    await ctx.db.patch(event._id, { completedAt: undefined, updatedAt: Math.max(now, event.updatedAt + 1) });
  }
  const updated = await ctx.db.get(event._id);
  if (!updated) operationError('NOT_FOUND', 'Event not found.');
  const result: Infer<typeof resultValidator> = { operationId: args.operationId, outcome: 'committed', result: { eventId: event._id, revision: await secretHash(JSON.stringify(updated)), completed: isEventComplete(updated, now) }, effects: { email: 'not-requested', cleanup: 'not-requested' } };
  await saveReceipt(ctx, args.operationId, binding, result, now);
  return result;
}
export const setLifecycle = mutation({ args: argsValidator.fields, returns: resultValidator, handler: async (ctx, args) => setLifecycleForPerson(ctx, (await requireAuth(ctx)).person._id, args) });
export const setLifecycleRest = internalMutation({ args: { ...argsValidator.fields, personId: v.id('persons') }, returns: resultValidator, handler: async (ctx, {personId, ...args}) => setLifecycleForPerson(ctx, personId, args) });
