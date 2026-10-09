import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { requirePerson } from '../groups/model';
import { requireManager, membershipFor } from '../groups/policy';
import { requireGroupMemberContent } from '../groups/contentAccess';
import {
  requireToolCreation,
  requireToolInteraction,
  getPolicy,
} from '../groupTools/policy';
type ReadCtx = MutationCtx | QueryCtx;
type Definition = {
  title: string;
  description?: string;
  mode: 'SINGLE' | 'MULTIPLE';
  options: { id: string; label: string }[];
};
function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
function clean(input: Definition) {
  const title = input.title.trim(),
    description = input.description?.trim() ?? '';
  if (!title || title.length > 100 || description.length > 2000)
    fail(
      'VALIDATION_ERROR',
      'Poll title must contain 1–100 characters; description at most 2000.'
    );
  if (input.options.length < 2 || input.options.length > 50)
    fail('VALIDATION_ERROR', 'Polls require 2–50 options.');
  const ids = new Set<string>(),
    labels = new Set<string>();
  const options = input.options.map(option => {
    const label = option.label.trim();
    if (
      !/^[a-zA-Z0-9_-]{1,64}$/.test(option.id) ||
      ids.has(option.id) ||
      !label ||
      label.length > 200 ||
      labels.has(label)
    )
      fail(
        'VALIDATION_ERROR',
        'Use unique stable printable option IDs and unique labels of 1–200 characters.'
      );
    ids.add(option.id);
    labels.add(label);
    return { id: option.id, label };
  });
  return { title, description, mode: input.mode, options };
}
function semantic(input: { mode: string; options: { id: string }[] }) {
  return JSON.stringify([input.mode, input.options.map(o => o.id).sort()]);
}
function positive(value: number) {
  if (!Number.isInteger(value) || value < 1)
    fail('VALIDATION_ERROR', 'Poll version must be a positive integer.');
}
function revision(value: number) {
  if (!Number.isInteger(value) || value < 0)
    fail('VALIDATION_ERROR', 'Vote revision must be a nonnegative integer.');
}
async function instance(ctx: ReadCtx, toolId: Id<'groupTools'>) {
  const tool = await ctx.db.get(toolId);
  const config = await ctx.db
    .query('groupPolls')
    .withIndex('by_toolId', q => q.eq('toolId', toolId))
    .unique();
  if (!tool || tool.kind !== 'POLL' || !config)
    fail('NOT_FOUND', 'Group poll not found.');
  return { tool, config };
}
function own(ctx: ReadCtx, toolId: Id<'groupTools'>, personId: Id<'persons'>) {
  return ctx.db
    .query('groupPollVotes')
    .withIndex('by_toolId_and_personId', q =>
      q.eq('toolId', toolId).eq('personId', personId)
    )
    .unique();
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
      'Page size must be 1–100 and cursor a bounded server-issued string.'
    );
  return input;
}
export async function create(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: Definition & {
    groupId: Id<'groups'>;
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
  }
) {
  await requireToolCreation(ctx, personId, input.groupId, 'POLL');
  const data = clean(input),
    now = Date.now();
  const toolId = await ctx.db.insert('groupTools', {
    groupId: input.groupId,
    kind: 'POLL',
    title: data.title,
    description: data.description,
    resultsVisibility: input.resultsVisibility,
    creatorId: personId,
    createdAt: now,
    updatedAt: now,
  });
  await ctx.db.insert('groupPolls', {
    toolId,
    groupId: input.groupId,
    version: 1,
    semanticVersion: 1,
    mode: data.mode,
    options: data.options,
    updatedAt: now,
  });
  return toolId;
}
export async function configure(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: Definition & { toolId: Id<'groupTools'>; version: number }
) {
  const { tool, config } = await instance(ctx, input.toolId);
  positive(input.version);
  await requireGroupMemberContent(ctx, tool.groupId, personId);
  await requireManager(ctx, tool.groupId, personId);
  if (config.version !== input.version)
    fail('CONFLICT', 'Poll configuration changed. Reload before saving.');
  const data = clean(input),
    now = Date.now();
  await ctx.db.patch(tool._id, {
    title: data.title,
    description: data.description,
    updatedAt: now,
  });
  await ctx.db.patch(config._id, {
    version: config.version + 1,
    semanticVersion:
      config.semanticVersion + (semantic(config) === semantic(data) ? 0 : 1),
    mode: data.mode,
    options: data.options,
    updatedAt: now,
  });
  return null;
}
export async function management(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>
) {
  const { tool, config } = await instance(ctx, toolId);
  await requireGroupMemberContent(ctx, tool.groupId, personId);
  await requireManager(ctx, tool.groupId, personId);
  return {
    ...tool,
    version: config.version,
    semanticVersion: config.semanticVersion,
    mode: config.mode,
    options: config.options,
    canManage: true as const,
  };
}
export async function get(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>
) {
  const { tool, config } = await instance(ctx, toolId);
  await requireToolInteraction(ctx, personId, tool.groupId, 'POLL');
  const member = await membershipFor(ctx, tool.groupId, personId),
    record = await own(ctx, toolId, personId);
  return {
    ...tool,
    version: config.version,
    semanticVersion: config.semanticVersion,
    mode: config.mode,
    options: config.options,
    selections:
      record &&
      !record.removed &&
      record.semanticVersion === config.semanticVersion
        ? record.selections
        : [],
    savedOptions: record?.options ?? [],
    savedVersion: record?.version ?? null,
    voteRevision: record?.revision ?? 0,
    canManage: member?.role !== 'MEMBER',
    canReview:
      tool.resultsVisibility === 'MEMBERS' || member?.role !== 'MEMBER',
    enabled: (await getPolicy(ctx, tool.groupId, 'POLL')).enabled,
  };
}
export async function submit(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    toolId: Id<'groupTools'>;
    version: number;
    expectedRevision: number;
    selections: string[];
  }
) {
  const { tool, config } = await instance(ctx, input.toolId);
  positive(input.version);
  revision(input.expectedRevision);
  await requireToolInteraction(ctx, personId, tool.groupId, 'POLL');
  if (config.version !== input.version)
    fail(
      'CONFLICT',
      'Poll configuration changed. Reload and review current options before voting.'
    );
  const selections = [...input.selections].sort();
  if (
    !selections.length ||
    selections.length > config.options.length ||
    new Set(selections).size !== selections.length ||
    (config.mode === 'SINGLE' && selections.length !== 1) ||
    selections.some(id => !config.options.some(o => o.id === id))
  )
    fail(
      'VALIDATION_ERROR',
      'Select one current option for SINGLE or unique current options for MULTIPLE.'
    );
  const record = await own(ctx, tool._id, personId);
  if (
    record &&
    !record.removed &&
    record.semanticVersion === config.semanticVersion &&
    JSON.stringify(record.selections) === JSON.stringify(selections)
  )
    return { revision: record.revision };
  if ((record?.revision ?? 0) !== input.expectedRevision)
    fail('CONFLICT', 'Your vote changed. Reload before editing.');
  const now = Date.now(),
    fields = {
      toolId: tool._id,
      groupId: tool.groupId,
      personId,
      revision: (record?.revision ?? 0) + 1,
      version: config.version,
      semanticVersion: config.semanticVersion,
      mode: config.mode,
      options: config.options,
      selections,
      removed: false,
      createdAt: record?.createdAt ?? now,
      updatedAt: now,
    };
  if (record) await ctx.db.replace(record._id, fields);
  else await ctx.db.insert('groupPollVotes', fields);
  await ctx.db.insert('groupPollRevisions', fields);
  return { revision: fields.revision };
}
export async function history(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  await requirePerson(ctx, personId);
  try {
    const result = await ctx.db
      .query('groupPollRevisions')
      .withIndex('by_toolId_and_personId', q =>
        q.eq('toolId', toolId).eq('personId', personId)
      )
      .order('desc')
      .paginate(page(paginationOpts));
    return {
      ...result,
      voteRevision: (await own(ctx, toolId, personId))?.revision ?? 0,
    };
  } catch {
    fail('VALIDATION_ERROR', 'Invalid Group poll page size or cursor.');
  }
}
export async function results(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  const { tool, config } = await instance(ctx, toolId);
  await requireToolInteraction(ctx, personId, tool.groupId, 'POLL');
  if (tool.resultsVisibility === 'MANAGERS')
    await requireManager(ctx, tool.groupId, personId);
  try {
    const result = await ctx.db
      .query('groupPollVotes')
      .withIndex('by_toolId', q => q.eq('toolId', toolId))
      .order('desc')
      .paginate(page(paginationOpts));
    return {
      ...result,
      page: result.page.map(row => ({
        ...row,
        isCurrent:
          !row.removed && row.semanticVersion === config.semanticVersion,
      })),
    };
  } catch {
    fail('VALIDATION_ERROR', 'Invalid Group poll page size or cursor.');
  }
}
export async function list(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  await requireGroupMemberContent(ctx, groupId, personId);
  if (!(await getPolicy(ctx, groupId, 'POLL')).enabled)
    await requireManager(ctx, groupId, personId);
  try {
    return await ctx.db
      .query('groupTools')
      .withIndex('by_groupId_and_kind', q =>
        q.eq('groupId', groupId).eq('kind', 'POLL')
      )
      .order('desc')
      .paginate(page(paginationOpts));
  } catch {
    fail('VALIDATION_ERROR', 'Invalid Group poll page size or cursor.');
  }
}
/** Narrow private recovery removes own vote/history without granting current Group content. */
export async function removeVote(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>,
  expectedRevision: number
) {
  await requirePerson(ctx, personId);
  revision(expectedRevision);
  const record = await own(ctx, toolId, personId);
  if (!record) {
    if (expectedRevision !== 0)
      fail('CONFLICT', 'Your vote changed. Reload before removing.');
    return null;
  }
  if (record.removed && record.revision === expectedRevision + 1) return null;
  if (record.revision !== expectedRevision)
    fail('CONFLICT', 'Your vote changed. Reload before removing.');
  await ctx.db.patch(record._id, {
    revision: record.revision + 1,
    selections: [],
    options: [],
    removed: true,
    updatedAt: Date.now(),
  });
  for await (const row of ctx.db
    .query('groupPollRevisions')
    .withIndex('by_toolId_and_personId', q =>
      q.eq('toolId', toolId).eq('personId', personId)
    ))
    await ctx.db.delete(row._id);
  return null;
}
export async function moderate(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  voteId: Id<'groupPollVotes'>,
  expectedRevision: number
) {
  const record = await ctx.db.get(voteId);
  revision(expectedRevision);
  if (!record) return null;
  await requireGroupMemberContent(ctx, record.groupId, personId);
  await requireManager(ctx, record.groupId, personId);
  if (record.removed && record.revision === expectedRevision + 1) return null;
  if (record.revision !== expectedRevision)
    fail('CONFLICT', 'Vote changed. Reload before moderating.');
  await ctx.db.patch(record._id, {
    revision: record.revision + 1,
    selections: [],
    options: [],
    removed: true,
    updatedAt: Date.now(),
  });
  if (record.personId)
    for await (const row of ctx.db
      .query('groupPollRevisions')
      .withIndex('by_toolId_and_personId', q =>
        q.eq('toolId', record.toolId).eq('personId', record.personId)
      ))
      await ctx.db.delete(row._id);
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
  await purgePoll(ctx, toolId);
  return null;
}
export async function purgePoll(ctx: MutationCtx, toolId: Id<'groupTools'>) {
  for await (const row of ctx.db
    .query('groupPollVotes')
    .withIndex('by_toolId', q => q.eq('toolId', toolId)))
    await ctx.db.delete(row._id);
  for await (const row of ctx.db
    .query('groupPollRevisions')
    .withIndex('by_toolId', q => q.eq('toolId', toolId)))
    await ctx.db.delete(row._id);
  const config = await ctx.db
    .query('groupPolls')
    .withIndex('by_toolId', q => q.eq('toolId', toolId))
    .unique();
  if (config) await ctx.db.delete(config._id);
  await ctx.db.delete(toolId);
}
