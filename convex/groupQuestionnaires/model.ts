import { ConvexError } from 'convex/values';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { requireOwner, requirePerson, livePerson } from '../groups/model';
import { membershipFor, requireManager, isGroupBanned } from '../groups/policy';
import {
  validateQuestions,
  validateAnswers,
  type ApplicationQuestion,
  type ApplicationAnswers,
} from '../../packages/shared/src/utils/application-questions';
type ReadCtx = QueryCtx | MutationCtx;
function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
function configuration(ctx: ReadCtx, groupId: Id<'groups'>) {
  return ctx.db
    .query('groupQuestionnaires')
    .withIndex('by_groupId', q => q.eq('groupId', groupId))
    .unique();
}
function recordFor(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  return ctx.db
    .query('groupQuestionnaireRecords')
    .withIndex('by_groupId_and_personId', q =>
      q.eq('groupId', groupId).eq('personId', personId)
    )
    .unique();
}
function answerFor(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>,
  questionId: string,
  version: number
) {
  return ctx.db
    .query('groupQuestionnaireAnswers')
    .withIndex('by_group_person_question_version', q =>
      q
        .eq('groupId', groupId)
        .eq('personId', personId)
        .eq('questionId', questionId)
        .eq('semanticVersion', version)
    )
    .unique();
}
/** Labels and order are cosmetic; type, required semantics and option value sets are material. */
function fingerprint(q: ApplicationQuestion) {
  return JSON.stringify([q.type, q.required, [...(q.options ?? [])].sort()]);
}
export async function getJoiningQuestionnaire(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  await requirePerson(ctx, personId);
  return projectJoiningQuestionnaire(ctx, groupId, personId);
}
async function projectJoiningQuestionnaire(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  const group = await ctx.db.get(groupId);
  if (!group) fail('NOT_FOUND', 'Group not found.');
  const [member, config, record, banned] = await Promise.all([
    membershipFor(ctx, groupId, personId),
    configuration(ctx, groupId),
    recordFor(ctx, groupId, personId),
    isGroupBanned(ctx, groupId, personId),
  ]);
  const currentMember = Boolean(member && !banned);
  if (!currentMember && !record)
    fail(
      'FORBIDDEN',
      'Private questionnaire records require membership or a retained own record.'
    );
  const questions = currentMember
    ? (config?.questions ?? [])
    : (record?.savedQuestions ?? []);
  const answers: ApplicationAnswers = {};
  await Promise.all(
    questions.map(async q => {
      const answer = await answerFor(ctx, groupId, personId, q.id, q.version);
      if (answer?.answer !== undefined) answers[q.id] = answer.answer;
    })
  );
  let completed = Boolean(record);
  try {
    validateAnswers(questions, answers);
  } catch {
    completed = false;
  }
  const enabled = config?.enabled ?? false;
  return {
    groupId,
    enabled,
    version: currentMember ? (config?.version ?? 0) : (record?.version ?? 0),
    questions,
    answers,
    savedQuestions: record?.savedQuestions ?? [],
    completed,
    shouldPrompt: Boolean(enabled && currentMember && !completed),
    canEdit: Boolean(enabled && member && !banned),
    canConfigure: Boolean(
      group.ownerId === personId && member?.role === 'OWNER' && !banned
    ),
    canReview: Boolean(member && member.role !== 'MEMBER' && !banned),
  };
}
/** Post-admission prompt only: optional completion never changes eligibility. */
export async function getJoiningQuestionnaireStatus(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  const form = await getJoiningQuestionnaire(ctx, groupId, personId);
  return {
    enabled: form.enabled,
    version: form.version,
    completed: form.completed,
    shouldPrompt: form.shouldPrompt,
  };
}
export async function configureJoiningQuestionnaire(
  ctx: MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>,
  enabled: boolean,
  questions: ApplicationQuestion[]
) {
  await requireOwner(ctx, groupId, personId);
  const ownerMembership = await membershipFor(ctx, groupId, personId);
  if (ownerMembership?.role !== 'OWNER')
    fail('FORBIDDEN', 'Current Group owner membership is required.');
  if (await isGroupBanned(ctx, groupId, personId))
    fail('FORBIDDEN', 'Group access unavailable.');
  try {
    validateQuestions(questions);
  } catch (error) {
    fail('VALIDATION_ERROR', (error as Error).message);
  }
  const existing = await configuration(ctx, groupId);
  const version = (existing?.version ?? 0) + 1;
  const versioned = [];
  for (const q of questions) {
    const identity = await ctx.db
      .query('groupQuestionnaireIdentities')
      .withIndex('by_groupId_and_questionId', x =>
        x.eq('groupId', groupId).eq('questionId', q.id)
      )
      .unique();
    const material = fingerprint(q);
    const semanticVersion = identity
      ? identity.fingerprint === material
        ? identity.version
        : identity.version + 1
      : 1;
    const value = {
      groupId,
      questionId: q.id,
      version: semanticVersion,
      fingerprint: material,
    };
    if (identity) await ctx.db.patch(identity._id, value);
    else await ctx.db.insert('groupQuestionnaireIdentities', value);
    versioned.push({ ...q, version: semanticVersion });
  }
  const value = {
    groupId,
    enabled,
    version,
    questions: versioned,
    updatedAt: Date.now(),
  };
  if (existing) await ctx.db.patch(existing._id, value);
  else await ctx.db.insert('groupQuestionnaires', value);
  return getJoiningQuestionnaire(ctx, groupId, personId);
}
export async function submitJoiningQuestionnaire(
  ctx: MutationCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>,
  version: number,
  answers: ApplicationAnswers
) {
  await requirePerson(ctx, personId);
  const form = await getJoiningQuestionnaire(ctx, groupId, personId);
  if (!form.canEdit)
    fail(
      'FORBIDDEN',
      'An admitted, eligible member is required to edit answers.'
    );
  if (form.version !== version)
    fail('CONFLICT', 'Questionnaire changed; reload before answering.');
  try {
    validateAnswers(form.questions, answers);
  } catch (error) {
    fail('VALIDATION_ERROR', (error as Error).message);
  }
  const now = Date.now();
  for (const question of form.questions) {
    const existing = await answerFor(
      ctx,
      groupId,
      personId,
      question.id,
      question.version
    );
    const value = {
      groupId,
      personId,
      question,
      answer: answers[question.id],
      answeredAt: now,
    };
    if (existing) await ctx.db.patch(existing._id, value);
    else
      await ctx.db.insert('groupQuestionnaireAnswers', {
        ...value,
        questionId: question.id,
        semanticVersion: question.version,
      });
    await ctx.db.insert('groupQuestionnaireHistory', value);
  }
  const record = await recordFor(ctx, groupId, personId);
  const value = {
    groupId,
    personId,
    savedQuestions: form.questions,
    version: form.version,
    updatedAt: now,
  };
  if (record) await ctx.db.patch(record._id, value);
  else await ctx.db.insert('groupQuestionnaireRecords', value);
  return getJoiningQuestionnaire(ctx, groupId, personId);
}
function checkPage(opts: { numItems: number; cursor: string | null }) {
  if (
    !Number.isInteger(opts.numItems) ||
    opts.numItems < 1 ||
    opts.numItems > 100
  )
    fail('VALIDATION_ERROR', 'Invalid page size.');
}
export async function listJoiningQuestionnaireAnswers(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  await requireManager(ctx, groupId, personId);
  if (await isGroupBanned(ctx, groupId, personId))
    fail('FORBIDDEN', 'Group access unavailable.');
  checkPage(paginationOpts);
  let rows;
  try {
    rows = await ctx.db
      .query('groupQuestionnaireRecords')
      .withIndex('by_groupId', q => q.eq('groupId', groupId))
      .paginate(paginationOpts);
  } catch {
    fail('VALIDATION_ERROR', 'Invalid questionnaire cursor.');
  }
  const page = await Promise.all(
    rows.page.map(async record => {
      const author = await livePerson(ctx, record.personId);
      const own = await projectJoiningQuestionnaire(
        ctx,
        groupId,
        record.personId
      );
      return {
        ...own,
        canEdit: false,
        canConfigure: false,
        canReview: true,
        author: {
          personId: record.personId,
          name: author?.user.name ?? null,
          username: author?.user.username ?? null,
          image: author?.user.image ?? null,
        },
      };
    })
  );
  return {
    page: page.filter(row => row !== null),
    isDone: rows.isDone,
    continueCursor: rows.continueCursor,
  };
}
export async function listJoiningQuestionnaireHistory(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  actorId: Id<'persons'>,
  paginationOpts: { numItems: number; cursor: string | null },
  personId = actorId
) {
  await requirePerson(ctx, actorId);
  if (personId !== actorId) {
    await requireManager(ctx, groupId, actorId);
    if (await isGroupBanned(ctx, groupId, actorId))
      fail('FORBIDDEN', 'Group access unavailable.');
  }
  await projectJoiningQuestionnaire(ctx, groupId, personId);
  checkPage(paginationOpts);
  try {
    const page = await ctx.db
      .query('groupQuestionnaireHistory')
      .withIndex('by_groupId_and_personId', q =>
        q.eq('groupId', groupId).eq('personId', personId)
      )
      .order('desc')
      .paginate(paginationOpts);
    return {
      page: page.page,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  } catch {
    fail('VALIDATION_ERROR', 'Invalid questionnaire cursor.');
  }
}
/** Safe own entitlement for public landing navigation; exposes no questions or answers. */
export async function getJoiningQuestionnaireAccess(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  await requirePerson(ctx, personId);
  if (!(await ctx.db.get(groupId)))
    return { canRead: false, hasRecord: false, isMember: false };
  const [member, record, banned] = await Promise.all([
    membershipFor(ctx, groupId, personId),
    recordFor(ctx, groupId, personId),
    isGroupBanned(ctx, groupId, personId),
  ]);
  return {
    canRead: Boolean((member && !banned) || record),
    hasRecord: Boolean(record),
    isMember: Boolean(member),
  };
}
