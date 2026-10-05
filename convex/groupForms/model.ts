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
import {
  validateQuestions,
  validateAnswers,
  type ApplicationQuestion,
  type ApplicationAnswers,
} from '../../packages/shared/src/utils/application-questions';
import { hash } from '../lib/requestId';
type ReadCtx = MutationCtx | QueryCtx;
function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
function clean(input: {
  title: string;
  description?: string;
  questions: ApplicationQuestion[];
}) {
  const title = input.title.trim(),
    description = input.description?.trim() ?? '';
  if (!title || title.length > 100 || description.length > 2000)
    fail(
      'VALIDATION_ERROR',
      'Form title must contain 1–100 characters; description at most 2000.'
    );
  try {
    validateQuestions(input.questions);
  } catch (error) {
    fail(
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'Invalid questions.'
    );
  }
  return { title, description, questions: input.questions };
}
async function instance(ctx: ReadCtx, toolId: Id<'groupTools'>) {
  const tool = await ctx.db.get(toolId);
  const config = await ctx.db
    .query('groupForms')
    .withIndex('by_toolId', q => q.eq('toolId', toolId))
    .unique();
  if (!tool || tool.kind !== 'FORM' || !config)
    fail('NOT_FOUND', 'Group form not found.');
  return { tool, config };
}
function own(ctx: ReadCtx, toolId: Id<'groupTools'>, personId: Id<'persons'>) {
  return ctx.db
    .query('groupFormResponses')
    .withIndex('by_toolId_and_personId', q =>
      q.eq('toolId', toolId).eq('personId', personId)
    )
    .unique();
}
export async function create(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    groupId: Id<'groups'>;
    title: string;
    description?: string;
    questions: ApplicationQuestion[];
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
  }
) {
  await requireToolCreation(ctx, personId, input.groupId, 'FORM');
  const data = clean(input);
  const now = Date.now();
  const toolId = await ctx.db.insert('groupTools', {
    groupId: input.groupId,
    kind: 'FORM',
    title: data.title,
    description: data.description,
    resultsVisibility: input.resultsVisibility,
    creatorId: personId,
    createdAt: now,
    updatedAt: now,
  });
  await ctx.db.insert('groupForms', {
    toolId,
    groupId: input.groupId,
    version: 1,
    questions: data.questions,
    updatedAt: now,
  });
  return toolId;
}
export async function configure(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    toolId: Id<'groupTools'>;
    version: number;
    title: string;
    description?: string;
    questions: ApplicationQuestion[];
  }
) {
  const { tool, config } = await instance(ctx, input.toolId);
  if (!Number.isInteger(input.version) || input.version < 1)
    fail('VALIDATION_ERROR', 'Form version must be a positive integer.');
  await requireGroupMemberContent(ctx, tool.groupId, personId);
  await requireManager(ctx, tool.groupId, personId);
  if (config.version !== input.version)
    fail('CONFLICT', 'Form configuration changed. Reload before saving.');
  const data = clean(input);
  const now = Date.now();
  await ctx.db.patch(tool._id, {
    title: data.title,
    description: data.description,
    updatedAt: now,
  });
  await ctx.db.patch(config._id, {
    version: config.version + 1,
    questions: data.questions,
    updatedAt: now,
  });
  return null;
}
export async function get(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>
) {
  const { tool, config } = await instance(ctx, toolId);
  await requireToolInteraction(ctx, personId, tool.groupId, 'FORM');
  const member = await membershipFor(ctx, tool.groupId, personId);
  const record = await own(ctx, toolId, personId);
  // Seed only responses whose question identity/type/options still match; saved snapshots remain in own history.
  const answers: ApplicationAnswers = {};
  if (record)
    for (const question of config.questions) {
      const previous = record.questions.find(q => q.id === question.id);
      if (
        previous &&
        previous.type === question.type &&
        JSON.stringify([...(previous.options ?? [])].sort()) ===
          JSON.stringify([...(question.options ?? [])].sort()) &&
        record.answers[question.id] !== undefined
      )
        answers[question.id] = record.answers[question.id];
    }
  return {
    ...tool,
    version: config.version,
    questions: config.questions,
    answers,
    savedQuestions: record?.questions ?? [],
    savedVersion: record?.version ?? null,
    responseRevision: record?.revision ?? 0,
    canManage: member?.role !== 'MEMBER',
    canReview:
      tool.resultsVisibility === 'MEMBERS' || member?.role !== 'MEMBER',
    enabled: (await getPolicy(ctx, tool.groupId, 'FORM')).enabled,
  };
}
export async function submit(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    toolId: Id<'groupTools'>;
    version: number;
    expectedRevision: number;
    answers: ApplicationAnswers;
  }
) {
  const { tool, config } = await instance(ctx, input.toolId);
  if (
    !Number.isInteger(input.version) ||
    input.version < 1 ||
    !Number.isInteger(input.expectedRevision) ||
    input.expectedRevision < 0
  )
    fail(
      'VALIDATION_ERROR',
      'Form version must be positive and response revision nonnegative integers.'
    );
  await requireToolInteraction(ctx, personId, tool.groupId, 'FORM');
  if (config.version !== input.version)
    fail(
      'CONFLICT',
      'Form configuration changed. Reload and review the current questions before submitting.'
    );
  try {
    validateAnswers(config.questions, input.answers);
  } catch (error) {
    fail(
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'Invalid answers.'
    );
  }
  const record = await own(ctx, tool._id, personId);
  if (
    record &&
    record.version === input.version &&
    (await hash(record.answers)) === (await hash(input.answers))
  )
    return { revision: record.revision };
  if ((record?.revision ?? 0) !== input.expectedRevision)
    fail('CONFLICT', 'Your response changed. Reload before editing.');
  const now = Date.now();
  const fields = {
    toolId: tool._id,
    groupId: tool.groupId,
    personId,
    revision: (record?.revision ?? 0) + 1,
    version: config.version,
    questions: config.questions,
    answers: input.answers,
    createdAt: record?.createdAt ?? now,
    updatedAt: now,
  };
  if (record) await ctx.db.replace(record._id, fields);
  else await ctx.db.insert('groupFormResponses', fields);
  await ctx.db.insert('groupFormRevisions', fields);
  return { revision: fields.revision };
}
export async function history(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  await requirePerson(ctx, personId); // Own snapshots only: no current private definition or Group membership grant.
  try {
    return await ctx.db
      .query('groupFormRevisions')
      .withIndex('by_toolId_and_personId', q =>
        q.eq('toolId', toolId).eq('personId', personId)
      )
      .order('desc')
      .paginate(page(paginationOpts));
  } catch {
    fail('VALIDATION_ERROR', 'Invalid Group form page size or cursor.');
  }
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
      'Page size must be 1–100 and cursor a nonempty server-issued string of at most 4096 characters.'
    );
  return input;
}
export async function results(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  const { tool } = await instance(ctx, toolId);
  await requireToolInteraction(ctx, personId, tool.groupId, 'FORM');
  if (tool.resultsVisibility === 'MANAGERS')
    await requireManager(ctx, tool.groupId, personId);
  try {
    return await ctx.db
      .query('groupFormResponses')
      .withIndex('by_toolId', q => q.eq('toolId', toolId))
      .order('desc')
      .paginate(page(paginationOpts));
  } catch {
    fail('VALIDATION_ERROR', 'Invalid Group form page size or cursor.');
  }
}
export async function list(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  groupId: Id<'groups'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  await requireToolInteraction(ctx, personId, groupId, 'FORM');
  try {
    return await ctx.db
      .query('groupTools')
      .withIndex('by_groupId_and_kind', q =>
        q.eq('groupId', groupId).eq('kind', 'FORM')
      )
      .order('desc')
      .paginate(page(paginationOpts));
  } catch {
    fail('VALIDATION_ERROR', 'Invalid Group form page size or cursor.');
  }
}
export async function removeResponse(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>,
  targetId?: Id<'persons'>
) {
  await requirePerson(ctx, personId);
  const target = targetId ?? personId;
  if (target !== personId) {
    const { tool } = await instance(ctx, toolId);
    await requireGroupMemberContent(ctx, tool.groupId, personId);
    await requireManager(ctx, tool.groupId, personId);
  }
  const record = await own(ctx, toolId, target);
  if (record) await ctx.db.delete(record._id);
  for await (const row of ctx.db
    .query('groupFormRevisions')
    .withIndex('by_toolId_and_personId', q =>
      q.eq('toolId', toolId).eq('personId', target)
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
  await purgeTool(ctx, toolId);
  return null;
}
export async function purgeTool(ctx: MutationCtx, toolId: Id<'groupTools'>) {
  for await (const row of ctx.db
    .query('groupFormResponses')
    .withIndex('by_toolId', q => q.eq('toolId', toolId)))
    await ctx.db.delete(row._id);
  for await (const row of ctx.db
    .query('groupFormRevisions')
    .withIndex('by_toolId', q => q.eq('toolId', toolId)))
    await ctx.db.delete(row._id);
  const config = await ctx.db
    .query('groupForms')
    .withIndex('by_toolId', q => q.eq('toolId', toolId))
    .unique();
  if (config) await ctx.db.delete(config._id);
  await ctx.db.delete(toolId);
}
export async function removeResult(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  responseId: Id<'groupFormResponses'>
) {
  const record = await ctx.db.get(responseId);
  if (!record) return null;
  await requireGroupMemberContent(ctx, record.groupId, personId);
  await requireManager(ctx, record.groupId, personId);
  if (record.personId)
    return removeResponse(ctx, personId, record.toolId, record.personId);
  await ctx.db.delete(record._id);
  return null;
}
