import { internalMutation, internalQuery } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { tool } from '../groupTools/contracts';
import {
  createInput,
  configInput,
  poll,
  managementPoll,
  votePage,
  historyPage,
} from './contracts';
import * as model from './model';
import { readPolicy, setPolicy } from '../groupTools/policy';
import { creation } from '../groupTools/contracts';
type ReadCtx = MutationCtx | QueryCtx;
function group(ctx: ReadCtx, value: string) {
  const id = ctx.db.normalizeId('groups', value);
  if (!id)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Group ID.',
    });
  return id;
}
async function scoped(ctx: ReadCtx, groupId: string, toolId: string) {
  const id = ctx.db.normalizeId('groupTools', toolId);
  const groupIdValue = group(ctx, groupId);
  const row = id ? await ctx.db.get(id) : null;
  if (!row || row.groupId !== groupIdValue || row.kind !== 'POLL')
    throw new ConvexError({
      code: 'NOT_FOUND',
      message: 'Group poll not found.',
    });
  return row._id;
}
const actor = { personId: v.id('persons'), groupId: v.string() };
const target = { ...actor, toolId: v.string() };
export const create = internalMutation({
  args: { ...createInput, ...actor },
  returns: v.id('groupTools'),
  handler: (ctx, { personId, ...input }) =>
    model.create(ctx, personId, {
      ...input,
      groupId: group(ctx, input.groupId),
    }),
});
export const configure = internalMutation({
  args: { ...target, ...configInput, version: v.number() },
  returns: v.null(),
  handler: async (ctx, { personId, ...input }) =>
    model.configure(ctx, personId, {
      ...input,
      toolId: await scoped(ctx, input.groupId, input.toolId),
    }),
});
export const get = internalQuery({
  args: target,
  returns: poll,
  handler: async (ctx, args) =>
    model.get(ctx, args.personId, await scoped(ctx, args.groupId, args.toolId)),
});
export const list = internalQuery({
  args: { ...actor, paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(tool),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: (ctx, args) =>
    model.list(
      ctx,
      args.personId,
      group(ctx, args.groupId),
      args.paginationOpts
    ),
});
export const history = internalQuery({
  args: { ...target, paginationOpts: paginationOptsValidator },
  returns: historyPage,
  handler: async (ctx, args) =>
    model.history(
      ctx,
      args.personId,
      await scoped(ctx, args.groupId, args.toolId),
      args.paginationOpts
    ),
});
export const results = internalQuery({
  args: { ...target, paginationOpts: paginationOptsValidator },
  returns: votePage,
  handler: async (ctx, args) =>
    model.results(
      ctx,
      args.personId,
      await scoped(ctx, args.groupId, args.toolId),
      args.paginationOpts
    ),
});
export const submit = internalMutation({
  args: {
    ...target,
    version: v.number(),
    expectedRevision: v.number(),
    selections: v.array(v.string()),
  },
  returns: v.object({ revision: v.number() }),
  handler: async (ctx, { personId, ...input }) =>
    model.submit(ctx, personId, {
      ...input,
      toolId: await scoped(ctx, input.groupId, input.toolId),
    }),
});
export const removeOwn = internalMutation({
  args: { ...target, expectedRevision: v.number() },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.removeVote(
      ctx,
      args.personId,
      await scoped(ctx, args.groupId, args.toolId),
      args.expectedRevision
    ),
});
export const remove = internalMutation({
  args: target,
  returns: v.null(),
  handler: async (ctx, args) =>
    model.remove(
      ctx,
      args.personId,
      await scoped(ctx, args.groupId, args.toolId)
    ),
});
export const moderate = internalMutation({
  args: { ...target, voteId: v.string(), expectedRevision: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const toolId = await scoped(ctx, args.groupId, args.toolId);
    const voteId = ctx.db.normalizeId('groupPollVotes', args.voteId);
    const row = voteId ? await ctx.db.get(voteId) : null;
    if (!row || row.toolId !== toolId)
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Poll vote not found.',
      });
    return model.moderate(ctx, args.personId, row._id, args.expectedRevision);
  },
});
const policy = v.object({
  groupId: v.id('groups'),
  kind: v.literal('POLL'),
  enabled: v.boolean(),
  creation,
  canConfigure: v.boolean(),
});
export const getPolicy = internalQuery({
  args: actor,
  returns: policy,
  handler: async (ctx, args) => ({
    ...(await readPolicy(ctx, args.personId, group(ctx, args.groupId), 'POLL')),
    kind: 'POLL' as const,
  }),
});
export const configurePolicy = internalMutation({
  args: { ...actor, enabled: v.boolean(), creation },
  returns: v.null(),
  handler: (ctx, { personId, ...input }) =>
    setPolicy(
      ctx,
      personId,
      { ...input, groupId: group(ctx, input.groupId) },
      'POLL'
    ),
});

export const settings = internalQuery({
  args: target,
  returns: managementPoll,
  handler: async (ctx, args) =>
    model.management(
      ctx,
      args.personId,
      await scoped(ctx, args.groupId, args.toolId)
    ),
});
