import { makeFunctionReference } from 'convex/server';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { livePerson } from '../groups/model';
import { membershipFor, isGroupBanned } from '../groups/policy';
import { getJoiningQuestionnaireStatus } from './model';
import { isPersonInDndMode } from '../lib/notifications';
/** Compare only the effective required question semantics, never cosmetic config.version. */
export function requiredNotificationKey(
  config: {
    enabled: boolean;
    requiredCompletion?: boolean;
    questions: { id: string; required: boolean; version: number }[];
  } | null
) {
  return config?.enabled && config.requiredCompletion
    ? JSON.stringify(
        config.questions
          .filter(q => q.required)
          .map(q => [q.id, q.version])
          .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      )
    : null;
}
export async function scheduleRequiredChanges(
  ctx: MutationCtx,
  groupId: Id<'groups'>,
  actorId: Id<'persons'>,
  previous: Doc<'groupQuestionnaires'> | null,
  current: Parameters<typeof requiredNotificationKey>[0]
) {
  const key = requiredNotificationKey(current),
    oldKey = requiredNotificationKey(previous);
  if (key === oldKey) return;
  const previousRequired = new Set(
    previous?.questions.filter(q => q.required).map(q => `${q.id}:${q.version}`)
  );
  const removalOnly =
    key !== null &&
    oldKey !== null &&
    !current?.questions.some(
      q => q.required && !previousRequired.has(`${q.id}:${q.version}`)
    );
  for await (const job of ctx.db
    .query('groupOnboardingJobs')
    .withIndex('by_groupId', q => q.eq('groupId', groupId))) {
    // Preserve an existing truthful notice through relaxed requirements, without
    // restarting recipients already processed or creating a fresh broadcast.
    if (removalOnly) await ctx.db.patch(job._id, { semanticKey: key! });
    else await ctx.db.delete(job._id);
  }
  if (key === null || removalOnly) return;
  const jobId = await ctx.db.insert('groupOnboardingJobs', {
    groupId,
    actorId,
    semanticKey: key,
    cursor: null,
  });
  await ctx.scheduler.runAfter(
    0,
    makeFunctionReference<
      'mutation',
      { jobId: Id<'groupOnboardingJobs'> },
      null
    >('groupQuestionnaires/notifications:deliverRequiredChanges'),
    { jobId }
  );
}
export async function needsCurrentOnboarding(
  ctx: MutationCtx | QueryCtx,
  groupId: Id<'groups'>,
  personId: Id<'persons'>
) {
  const [group, person, member, banned] = await Promise.all([
    ctx.db.get(groupId),
    livePerson(ctx, personId),
    membershipFor(ctx, groupId, personId),
    isGroupBanned(ctx, groupId, personId),
  ]);
  return Boolean(
    group &&
      person &&
      member &&
      !banned &&
      (await getJoiningQuestionnaireStatus(ctx, groupId, personId))
        .requiresCompletion
  );
}

/** Recheck the current push preference at delivery, just like email/webhook dispatch. */
export async function allowsCurrentOnboardingPush(
  ctx: QueryCtx,
  personId: Id<'persons'>
) {
  if (await isPersonInDndMode(ctx, personId)) return false;
  const settings = await ctx.db
    .query('personSettings')
    .withIndex('by_person', q => q.eq('personId', personId))
    .first();
  if (!settings) return false;
  for await (const method of ctx.db
    .query('notificationMethods')
    .withIndex('by_settings', q => q.eq('settingsId', settings._id))) {
    if (method.type !== 'PUSH' || !method.enabled) continue;
    const setting = await ctx.db
      .query('notificationSettings')
      .withIndex('by_type_method', q =>
        q
          .eq('notificationType', 'GROUP_ONBOARDING_REQUIRED')
          .eq('methodId', method._id)
      )
      .first();
    if (setting?.enabled ?? true) return true;
  }
  return false;
}
