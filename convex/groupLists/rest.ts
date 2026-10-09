import { internalMutation, internalQuery } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import {
  settings as listSettings,
  entryPage,
  toolPage,
  createInput,
  config,
  addResult,
} from './contracts';
import { creation } from '../groupTools/contracts';
import { readPolicy, setPolicy } from '../groupTools/policy';
import * as model from './model';
type ReadCtx = QueryCtx | MutationCtx;
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
  const row = id ? await ctx.db.get(id) : null;
  if (!row || row.kind !== 'LIST' || row.groupId !== group(ctx, groupId))
    throw new ConvexError({
      code: 'NOT_FOUND',
      message: 'Group list not found.',
    });
  return row._id;
}
async function entryId(
  ctx: ReadCtx,
  input: { groupId: string; toolId: string; entryId: string }
) {
  const toolId = await scoped(ctx, input.groupId, input.toolId);
  const id = ctx.db.normalizeId('groupListEntries', input.entryId);
  const row = id ? await ctx.db.get(id) : null;
  if (!row || row.toolId !== toolId)
    throw new ConvexError({
      code: 'NOT_FOUND',
      message: 'List entry not found.',
    });
  return row._id;
}
const actor = { personId: v.id('persons'), groupId: v.string() };
const target = { ...actor, toolId: v.string() };
export const create = internalMutation({
  args: { ...createInput, ...actor },
  returns: v.id('groupTools'),
  handler: (ctx, { personId, ...args }) =>
    model.create(ctx, personId, { ...args, groupId: group(ctx, args.groupId) }),
});
export const configure = internalMutation({
  args: { ...target, ...config, version: v.number() },
  returns: v.null(),
  handler: async (ctx, { personId, ...args }) =>
    model.configure(ctx, personId, {
      ...args,
      toolId: await scoped(ctx, args.groupId, args.toolId),
    }),
});
export const add = internalMutation({
  args: {
    ...target,
    version: v.number(),
    requestId: v.string(),
    text: v.string(),
  },
  returns: addResult,
  handler: async (ctx, { personId, ...args }) =>
    model.add(ctx, personId, {
      ...args,
      toolId: await scoped(ctx, args.groupId, args.toolId),
    }),
});
export const edit = internalMutation({
  args: {
    ...target,
    entryId: v.string(),
    version: v.number(),
    expectedRevision: v.number(),
    text: v.string(),
    completed: v.boolean(),
  },
  returns: v.object({ revision: v.number() }),
  handler: async (ctx, { personId, ...args }) =>
    model.edit(ctx, personId, { ...args, entryId: await entryId(ctx, args) }),
});
export const removeEntry = internalMutation({
  args: { ...target, entryId: v.string(), expectedRevision: v.number() },
  returns: v.null(),
  handler: async (ctx, args) =>
    model.removeEntry(
      ctx,
      args.personId,
      await entryId(ctx, args),
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
export const list = internalQuery({
  args: { ...actor, paginationOpts: paginationOptsValidator },
  returns: toolPage,
  handler: (ctx, args) =>
    model.list(
      ctx,
      args.personId,
      group(ctx, args.groupId),
      args.paginationOpts
    ),
});
export const get = internalQuery({
  args: target,
  returns: listSettings,
  handler: async (ctx, args) =>
    model.get(
      ctx,
      args.personId,
      await scoped(ctx, args.groupId, args.toolId),
      false
    ),
});
export const settings = internalQuery({
  args: target,
  returns: listSettings,
  handler: async (ctx, args) =>
    model.get(
      ctx,
      args.personId,
      await scoped(ctx, args.groupId, args.toolId),
      true
    ),
});
export const entries = internalQuery({
  args: { ...target, paginationOpts: paginationOptsValidator },
  returns: entryPage,
  handler: async (ctx, args) =>
    model.entries(
      ctx,
      args.personId,
      await scoped(ctx, args.groupId, args.toolId),
      args.paginationOpts,
      false
    ),
});
export const own = internalQuery({
  args: { ...target, paginationOpts: paginationOptsValidator },
  returns: entryPage,
  handler: async (ctx, args) =>
    model.entries(
      ctx,
      args.personId,
      await scoped(ctx, args.groupId, args.toolId),
      args.paginationOpts,
      true
    ),
});
export const policy = internalQuery({
  args: actor,
  returns: v.object({
    groupId: v.id('groups'),
    kind: v.literal('LIST'),
    enabled: v.boolean(),
    creation,
    canConfigure: v.boolean(),
  }),
  handler: async (ctx, args) => ({
    ...(await readPolicy(ctx, args.personId, group(ctx, args.groupId), 'LIST')),
    kind: 'LIST' as const,
  }),
});
export const configurePolicy = internalMutation({
  args: { ...actor, enabled: v.boolean(), creation },
  returns: v.null(),
  handler: (ctx, { personId, ...args }) =>
    setPolicy(
      ctx,
      personId,
      { ...args, groupId: group(ctx, args.groupId) },
      'LIST'
    ),
});
