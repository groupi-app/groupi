import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { requirePerson, requireOwner, livePerson } from '../groups/model';
import { requireManager, membershipFor, canEnterGroup } from '../groups/policy';
import { admitGroupMember } from '../groups/admission';
import {
  validateQuestions,
  validateAnswers,
} from '../../packages/shared/src/utils/application-questions';
import { createNotification } from '../lib/notifications';
type ReadCtx = QueryCtx | MutationCtx;
function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
function validate(run: () => void) {
  try {
    run();
  } catch (error) {
    fail(
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'Invalid application input.'
    );
  }
}
async function pending(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  return ctx.db
    .query('groupApplications')
    .withIndex('by_groupId_and_personId_and_status', q =>
      q.eq('groupId', groupId).eq('personId', personId).eq('status', 'PENDING')
    )
    .unique();
}
export async function getForm(
  ctx: ReadCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'> | null
) {
  const group = await ctx.db.get(groupId);
  if (!group) fail('NOT_FOUND', 'Group not found.');
  const member = personId ? await membershipFor(ctx, groupId, personId) : null;
  const live = personId ? await livePerson(ctx, personId) : null;
  const ownPending =
    personId && live ? await pending(ctx, groupId, personId) : null;
  const canApply = Boolean(
    live &&
      !member &&
      group.applicationsEnabled &&
      personId &&
      (await canEnterGroup(ctx, groupId, personId))
  );
  const canReview = Boolean(live && member && member.role !== 'MEMBER');
  return {
    applicationsEnabled: group.applicationsEnabled ?? false,
    questions:
      canApply || canReview
        ? (group.applicationQuestions ?? [])
        : (ownPending?.questions ?? []),
    pending: ownPending,
    canApply,
    canReview,
  };
}
export async function configure(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>,
  applicationsEnabled: boolean,
  questions: Doc<'groupApplications'>['questions']
) {
  await requireOwner(ctx, groupId, actorId);
  validate(() => validateQuestions(questions));
  await ctx.db.patch(groupId, {
    applicationsEnabled,
    applicationQuestions: questions,
    updatedAt: Date.now(),
  });
  return null;
}
async function own(
  ctx: ReadCtx,
  actorId: Id<'persons'>,
  applicationId: Id<'groupApplications'>
) {
  await requirePerson(ctx, actorId);
  const application = await ctx.db.get(applicationId);
  if (!application || application.personId !== actorId)
    fail('FORBIDDEN', 'Application is unavailable.');
  if (!(await ctx.db.get(application.groupId)))
    fail('NOT_FOUND', 'Group not found.');
  return application;
}
export async function read(
  ctx: ReadCtx,
  actorId: Id<'persons'>,
  applicationId: Id<'groupApplications'>
) {
  await requirePerson(ctx, actorId);
  const application = await ctx.db.get(applicationId);
  if (!application) fail('NOT_FOUND', 'Application not found.');
  if (application.personId !== actorId)
    await requireManager(ctx, application.groupId, actorId);
  return application;
}
export async function submit(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>,
  answers: Doc<'groupApplications'>['answers']
) {
  await requirePerson(ctx, actorId);
  const form = await getForm(ctx, groupId, actorId);
  if (!form.canApply)
    fail('FORBIDDEN', 'You are not currently eligible to apply.');
  validate(() =>
    validateAnswers(form.pending?.questions ?? form.questions, answers)
  );
  const now = Date.now();
  if (form.pending) {
    await ctx.db.patch(form.pending._id, { answers, updatedAt: now });
    return { applicationId: form.pending._id, status: 'PENDING' as const };
  }
  const applicationId = await ctx.db.insert('groupApplications', {
    groupId,
    personId: actorId,
    questions: form.questions,
    answers,
    status: 'PENDING',
    submittedAt: now,
    updatedAt: now,
    decisions: [],
  });
  const group = await ctx.db.get(groupId);
  if (!group) fail('NOT_FOUND', 'Group not found.');
  for (const role of ['OWNER', 'MODERATOR'] as const)
    for await (const member of ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId_and_role', q =>
        q.eq('groupId', groupId).eq('role', role)
      ))
      if (await livePerson(ctx, member.personId))
        await notice(
          ctx,
          group,
          member.personId,
          actorId,
          applicationId,
          'GROUP_APPLICATION_RECEIVED'
        );
  return { applicationId, status: 'PENDING' as const };
}
export async function edit(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  applicationId: Id<'groupApplications'>,
  answers: Doc<'groupApplications'>['answers']
) {
  const application = await own(ctx, actorId, applicationId);
  if (application.status !== 'PENDING')
    fail('CONFLICT', 'Only pending applications can be edited.');
  const group = await ctx.db.get(application.groupId);
  if (
    !group?.applicationsEnabled ||
    !(await canEnterGroup(ctx, application.groupId, actorId)) ||
    (await membershipFor(ctx, application.groupId, actorId))
  )
    fail('FORBIDDEN', 'You are not currently eligible to apply.');
  validate(() => validateAnswers(application.questions, answers));
  await ctx.db.patch(applicationId, { answers, updatedAt: Date.now() });
  return { applicationId, status: 'PENDING' as const };
}
export async function withdraw(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  applicationId: Id<'groupApplications'>
) {
  const application = await own(ctx, actorId, applicationId);
  if (application.status === 'WITHDRAWN')
    return { applicationId, status: 'WITHDRAWN' as const };
  if (application.status !== 'PENDING')
    fail('CONFLICT', 'Only pending applications can be withdrawn.');
  const now = Date.now();
  await ctx.db.patch(applicationId, {
    status: 'WITHDRAWN',
    updatedAt: now,
    decisions: [{ status: 'WITHDRAWN', actorId, at: now }],
  });
  await ctx.db.insert('groupApplicationActors', {
    applicationId,
    personId: actorId,
  });
  return { applicationId, status: 'WITHDRAWN' as const };
}
async function notice(
  ctx: MutationCtx,
  group: Doc<'groups'>,
  personId: Id<'persons'>,
  authorId: Id<'persons'>,
  applicationId: Id<'groupApplications'>,
  type:
    | 'GROUP_APPLICATION_RECEIVED'
    | 'GROUP_APPLICATION_APPROVED'
    | 'GROUP_APPLICATION_DECLINED'
) {
  await createNotification(
    ctx,
    {
      personId,
      authorId,
      type,
      groupId: group._id,
      groupApplicationId: applicationId,
    },
    {
      messageContext: {
        groupTitle: group.name,
        authorName: (await requirePerson(ctx, authorId)).user.name,
        notificationUrl: `${process.env.SITE_URL || 'https://groupi.gg'}/${type === 'GROUP_APPLICATION_RECEIVED' ? 'groups' : 'g'}/${group._id}#group-applications`,
      },
    }
  );
}
export async function review(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  applicationId: Id<'groupApplications'>,
  decision: 'APPROVED' | 'DECLINED'
) {
  const application = await ctx.db.get(applicationId);
  if (!application) fail('NOT_FOUND', 'Application not found.');
  const group = await requireManager(ctx, application.groupId, actorId);
  if (application.status === decision)
    return { applicationId, status: decision };
  if (application.status !== 'PENDING')
    fail('CONFLICT', 'Application is no longer pending.');
  await requirePerson(ctx, application.personId);
  if (decision === 'APPROVED') {
    if (
      !group.applicationsEnabled ||
      !(await canEnterGroup(ctx, group._id, application.personId))
    )
      fail('FORBIDDEN', 'Applicant is no longer eligible.');
    await admitGroupMember(ctx, group._id, application.personId);
  }
  const now = Date.now();
  await ctx.db.patch(applicationId, {
    status: decision,
    updatedAt: now,
    decisions: [{ status: decision, actorId, at: now }],
  });
  await ctx.db.insert('groupApplicationActors', {
    applicationId,
    personId: actorId,
  });
  await notice(
    ctx,
    group,
    application.personId,
    actorId,
    applicationId,
    decision === 'APPROVED'
      ? 'GROUP_APPLICATION_APPROVED'
      : 'GROUP_APPLICATION_DECLINED'
  );
  return { applicationId, status: decision };
}
function validatePage(opts: { numItems: number; cursor: string | null }) {
  if (
    !Number.isInteger(opts.numItems) ||
    opts.numItems < 1 ||
    opts.numItems > 100
  )
    fail('VALIDATION_ERROR', 'Page size must be an integer from 1 to 100.');
}
export async function history(
  ctx: ReadCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>,
  paginationOpts: { numItems: number; cursor: string | null }
) {
  await requirePerson(ctx, actorId);
  if (!(await ctx.db.get(groupId))) fail('NOT_FOUND', 'Group not found.');
  validatePage(paginationOpts);
  try {
    const result = await ctx.db
      .query('groupApplications')
      .withIndex('by_groupId_and_personId', q =>
        q.eq('groupId', groupId).eq('personId', actorId)
      )
      .order('desc')
      .paginate(paginationOpts);
    return {
      page: result.page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  } catch {
    fail('VALIDATION_ERROR', 'Invalid application cursor.');
  }
}
export async function list(
  ctx: ReadCtx,
  actorId: Id<'persons'>,
  groupId: Id<'groups'>,
  paginationOpts: { numItems: number; cursor: string | null },
  status?: Doc<'groupApplications'>['status']
) {
  await requireManager(ctx, groupId, actorId);
  validatePage(paginationOpts);
  const query = ctx.db.query('groupApplications');
  const indexed = status
    ? query.withIndex('by_groupId_and_status', q =>
        q.eq('groupId', groupId).eq('status', status)
      )
    : query.withIndex('by_groupId', q => q.eq('groupId', groupId));
  let result;
  try {
    result = await indexed.order('desc').paginate(paginationOpts);
  } catch {
    fail('VALIDATION_ERROR', 'Invalid application cursor.');
  }
  return {
    page: await Promise.all(
      result.page.map(async row => {
        const identity = await livePerson(ctx, row.personId);
        return {
          ...row,
          applicant: {
            personId: row.personId,
            name: identity?.user.name ?? null,
            username: identity?.user.username ?? null,
            image: identity?.user.image ?? null,
          },
        };
      })
    ),
    isDone: result.isDone,
    continueCursor: result.continueCursor,
  };
}
