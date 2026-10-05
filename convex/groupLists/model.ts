import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import { requirePerson } from '../groups/model';
import { membershipFor, requireManager } from '../groups/policy';
import { requireGroupMemberContent } from '../groups/contentAccess';
import {
  getPolicy,
  requireToolCreation,
  requireToolInteraction,
} from '../groupTools/policy';
import { hash, requestExpiry } from '../lib/requestId';
type ReadCtx = MutationCtx | QueryCtx;
function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
function text(value: string) {
  const result = value.trim();
  if (!result || result.length > 2000)
    fail('VALIDATION_ERROR', 'Entry text must contain 1–2000 characters.');
  return result;
}
function config(input: { title: string; description?: string }) {
  const title = input.title.trim(),
    description = input.description?.trim() ?? '';
  if (!title || title.length > 100 || description.length > 2000)
    fail(
      'VALIDATION_ERROR',
      'List title must contain 1–100 characters; description at most 2000.'
    );
  return { title, description };
}
async function instance(ctx: ReadCtx, toolId: Id<'groupTools'>) {
  const tool = await ctx.db.get(toolId);
  const state = await ctx.db
    .query('groupLists')
    .withIndex('by_toolId', q => q.eq('toolId', toolId))
    .unique();
  if (!tool || tool.kind !== 'LIST' || !state)
    fail('NOT_FOUND', 'Group list not found.');
  return { tool, state };
}
function version(current: number, expected: number) {
  if (!Number.isInteger(expected) || expected < 1)
    fail('VALIDATION_ERROR', 'List version must be a positive integer.');
  if (current !== expected)
    fail('CONFLICT', 'List configuration changed. Reload before saving.');
}
function page(input: { numItems: number; cursor: string | null }) {
  if (
    !Number.isInteger(input.numItems) ||
    input.numItems < 1 ||
    input.numItems > 100 ||
    (input.cursor !== null && (!input.cursor || input.cursor.length > 4096))
  )
    fail(
      'VALIDATION_ERROR',
      'Page size must be 1–100; use a nonempty server cursor of at most 4096 characters.'
    );
  return input;
}
export async function create(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    groupId: Id<'groups'>;
    title: string;
    description?: string;
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
  }
) {
  await requireToolCreation(ctx, personId, input.groupId, 'LIST');
  const data = config(input),
    now = Date.now();
  const toolId = await ctx.db.insert('groupTools', {
    groupId: input.groupId,
    kind: 'LIST',
    ...data,
    resultsVisibility: input.resultsVisibility,
    creatorId: personId,
    createdAt: now,
    updatedAt: now,
  });
  await ctx.db.insert('groupLists', {
    toolId,
    groupId: input.groupId,
    version: 1,
    updatedAt: now,
  });
  return toolId;
}
export async function get(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>,
  management = false
) {
  const { tool, state } = await instance(ctx, toolId);
  if (management) {
    await requireGroupMemberContent(ctx, tool.groupId, personId);
    await requireManager(ctx, tool.groupId, personId);
  } else await requireToolInteraction(ctx, personId, tool.groupId, 'LIST');
  const member = await membershipFor(ctx, tool.groupId, personId);
  return {
    ...tool,
    version: state.version,
    canManage: member?.role !== 'MEMBER',
  };
}
export async function list(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  await requireGroupMemberContent(ctx, groupId, personId);
  if (!(await getPolicy(ctx, groupId, 'LIST')).enabled)
    await requireManager(ctx, groupId, personId);
  try {
    return await ctx.db
      .query('groupTools')
      .withIndex('by_groupId_and_kind', q =>
        q.eq('groupId', groupId).eq('kind', 'LIST')
      )
      .order('desc')
      .paginate(page(paginationOpts));
  } catch {
    fail('VALIDATION_ERROR', 'Invalid list page or cursor.');
  }
}
export async function configure(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    toolId: Id<'groupTools'>;
    version: number;
    title: string;
    description?: string;
  }
) {
  const { tool, state } = await instance(ctx, input.toolId);
  await requireGroupMemberContent(ctx, tool.groupId, personId);
  await requireManager(ctx, tool.groupId, personId);
  version(state.version, input.version);
  await ctx.db.patch(tool._id, { ...config(input), updatedAt: Date.now() });
  await ctx.db.patch(state._id, {
    version: state.version + 1,
    updatedAt: Date.now(),
  });
  return null;
}
export async function entries(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>,
  paginationOpts: { numItems: number; cursor: string | null },
  ownRecovery = false
) {
  await requirePerson(ctx, personId);
  let ownOnly = ownRecovery;
  let manager = false;
  if (!ownRecovery) {
    const { tool } = await instance(ctx, toolId);
    await requireToolInteraction(ctx, personId, tool.groupId, 'LIST');
    const role = (await membershipFor(ctx, tool.groupId, personId))?.role;
    manager = role === 'OWNER' || role === 'MODERATOR';
    ownOnly = tool.resultsVisibility === 'MANAGERS' && !manager;
  }
  const query = ownOnly
    ? ctx.db
        .query('groupListEntries')
        .withIndex('by_toolId_and_personId', q =>
          q.eq('toolId', toolId).eq('personId', personId)
        )
    : ctx.db
        .query('groupListEntries')
        .withIndex('by_toolId', q => q.eq('toolId', toolId));
  try {
    const result = await query.order('desc').paginate(page(paginationOpts));
    return {
      ...result,
      page: result.page.map(row => ({
        ...row,
        canEdit: !ownRecovery && (row.personId === personId || manager),
        canRemove: row.personId === personId || (!ownRecovery && manager),
      })),
    };
  } catch {
    fail('VALIDATION_ERROR', 'Invalid list entry page or cursor.');
  }
}
export async function add(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    toolId: Id<'groupTools'>;
    version: number;
    requestId: string;
    text: string;
  }
) {
  const { tool, state } = await instance(ctx, input.toolId);
  await requireToolInteraction(ctx, personId, tool.groupId, 'LIST');
  const expiresAt = requestExpiry(
    input.requestId,
    'Inspect your list entries before starting a new request.'
  );
  const fingerprint = await hash({
    version: input.version,
    text: text(input.text),
  });
  const previous = await ctx.db
    .query('groupListRequests')
    .withIndex('by_toolId_and_personId_and_requestId', q =>
      q
        .eq('toolId', tool._id)
        .eq('personId', personId)
        .eq('requestId', input.requestId)
    )
    .unique();
  if (previous) {
    if (previous.fingerprint !== fingerprint)
      fail(
        'CONFLICT',
        'Request identifier was used with different content. Inspect entries before starting a new request.'
      );
    return {
      entryId: previous.entryId,
      state: (await ctx.db.get(previous.entryId))
        ? ('PRESENT' as const)
        : ('REMOVED' as const),
    };
  }
  version(state.version, input.version);
  const now = Date.now();
  const entryId = await ctx.db.insert('groupListEntries', {
    toolId: tool._id,
    groupId: tool.groupId,
    personId,
    actorId: personId,
    listTitle: tool.title,
    text: text(input.text),
    completed: false,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  });
  const id = await ctx.db.insert('groupListRequests', {
    toolId: tool._id,
    groupId: tool.groupId,
    personId,
    requestId: input.requestId,
    fingerprint,
    entryId,
    expiresAt,
  });
  const scheduledId = await ctx.scheduler.runAfter(
    expiresAt - now,
    internal.groupLists.internal.expireRequest,
    { id }
  );
  await ctx.db.patch(id, { scheduledId });
  return { entryId, state: 'PRESENT' as const };
}
export async function edit(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    entryId: Id<'groupListEntries'>;
    version: number;
    expectedRevision: number;
    text: string;
    completed: boolean;
  }
) {
  const row = await ctx.db.get(input.entryId);
  if (!row) fail('NOT_FOUND', 'List entry not found.');
  const { tool, state } = await instance(ctx, row.toolId);
  await requireToolInteraction(ctx, personId, tool.groupId, 'LIST');
  if (row.personId !== personId)
    await requireManager(ctx, tool.groupId, personId);
  version(state.version, input.version);
  if (!Number.isInteger(input.expectedRevision) || input.expectedRevision < 1)
    fail('VALIDATION_ERROR', 'Entry revision must be a positive integer.');
  const value = text(input.text);
  if (row.text === value && row.completed === input.completed)
    return { revision: row.revision };
  if (row.revision !== input.expectedRevision)
    fail('CONFLICT', 'Entry changed. Reload before editing.');
  await ctx.db.patch(row._id, {
    text: value,
    completed: input.completed,
    revision: row.revision + 1,
    actorId: personId,
    updatedAt: Date.now(),
  });
  return { revision: row.revision + 1 };
}
export async function removeEntry(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  entryId: Id<'groupListEntries'>,
  expectedRevision: number
) {
  await requirePerson(ctx, personId);
  const row = await ctx.db.get(entryId);
  if (!row) return null;
  if (row.personId !== personId) {
    await requireToolInteraction(ctx, personId, row.groupId, 'LIST');
    await requireManager(ctx, row.groupId, personId);
  }
  if (!Number.isInteger(expectedRevision) || expectedRevision < 1)
    fail('VALIDATION_ERROR', 'Entry revision must be a positive integer.');
  if (row.revision !== expectedRevision)
    fail('CONFLICT', 'Entry changed. Reload before removing.');
  await ctx.db.delete(entryId);
  return null;
}
export async function remove(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>
) {
  const { tool } = await instance(ctx, toolId);
  await requireGroupMemberContent(ctx, tool.groupId, personId);
  await requireManager(ctx, tool.groupId, personId);
  await purge(ctx, toolId);
  return null;
}
export async function removeRequest(
  ctx: MutationCtx,
  id: Id<'groupListRequests'>
) {
  const row = await ctx.db.get(id);
  if (!row) return;
  if (row.scheduledId) await ctx.scheduler.cancel(row.scheduledId);
  await ctx.db.delete(id);
}
export async function purge(ctx: MutationCtx, toolId: Id<'groupTools'>) {
  for await (const row of ctx.db
    .query('groupListEntries')
    .withIndex('by_toolId', q => q.eq('toolId', toolId)))
    await ctx.db.delete(row._id);
  for await (const row of ctx.db
    .query('groupListRequests')
    .withIndex('by_toolId', q => q.eq('toolId', toolId)))
    await removeRequest(ctx, row._id);
  const state = await ctx.db
    .query('groupLists')
    .withIndex('by_toolId', q => q.eq('toolId', toolId))
    .unique();
  if (state) await ctx.db.delete(state._id);
  await ctx.db.delete(toolId);
}
export async function cleanupPerson(ctx: MutationCtx, personId: Id<'persons'>) {
  for await (const row of ctx.db
    .query('groupListEntries')
    .withIndex('by_personId', q => q.eq('personId', personId))) {
    const tool = await ctx.db.get(row.toolId);
    if (tool?.resultsVisibility === 'MEMBERS')
      await ctx.db.patch(row._id, {
        personId: undefined,
        ...(row.actorId === personId ? { actorId: undefined } : {}),
      });
    else await ctx.db.delete(row._id);
  }
  for await (const row of ctx.db
    .query('groupListEntries')
    .withIndex('by_actorId', q => q.eq('actorId', personId)))
    await ctx.db.patch(row._id, { actorId: undefined });
  for await (const row of ctx.db
    .query('groupListRequests')
    .withIndex('by_personId', q => q.eq('personId', personId)))
    await removeRequest(ctx, row._id);
}
