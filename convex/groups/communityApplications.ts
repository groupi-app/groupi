import { v, type Infer } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { authorizeCommunity } from './community';
import { canEnterGroup } from './policy';
import { applicationStatusValidator } from '../eventApplications/contracts';
import * as applications from '../groupApplications/model';
import { secretHash, denied } from '../authorization/model';
import {
  priorReceipt,
  receiptBinding,
  saveReceipt,
  operationError,
} from './operationReceipts';
const result = v.object({
  applicationId: v.id('groupApplications'),
  status: applicationStatusValidator,
  revision: v.number(),
});
export const receipt = v.object({
  operationId: v.string(),
  outcome: v.literal('committed'),
  result,
  effects: v.object({
    email: v.literal('not-requested'),
    cleanup: v.literal('not-requested'),
  }),
});
export const execute = internalMutation({
  args: {
    credentialId: v.id('authorizationCredentials'),
    groupId: v.string(),
    applicationId: v.optional(v.string()),
    operationId: v.string(),
    operation: v.union(
      v.literal('submit'),
      v.literal('edit'),
      v.literal('withdraw')
    ),
    bodyJson: v.string(),
  },
  returns: receipt,
  handler: async (ctx, args) => {
    const { grant, group, groupId, personId } = await authorizeCommunity(
      ctx,
      args,
      `groups.applications.${args.operation}`
    );
    if (!(await canEnterGroup(ctx, groupId, personId))) throw denied();
    let body: unknown;
    try {
      body = JSON.parse(args.bodyJson);
    } catch {
      operationError('VALIDATION_ERROR', 'Invalid JSON.');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body))
      operationError('VALIDATION_ERROR', 'Invalid request.');
    const fields = body as Record<string, unknown>;
    const allowed =
      args.operation === 'submit'
        ? ['formRevision', 'answers']
        : args.operation === 'edit'
          ? ['expectedRevision', 'answers']
          : ['expectedRevision'];
    if (
      Object.keys(fields).some(k => !allowed.includes(k)) ||
      allowed.some(k => !(k in fields))
    )
      operationError('VALIDATION_ERROR', 'Invalid request fields.');
    if (
      args.operation !== 'withdraw' &&
      (!fields.answers ||
        typeof fields.answers !== 'object' ||
        Array.isArray(fields.answers))
    )
      operationError('VALIDATION_ERROR', 'Invalid answers.');
    if (
      args.operation !== 'submit' &&
      (typeof fields.expectedRevision !== 'number' ||
        !Number.isSafeInteger(fields.expectedRevision))
    )
      operationError(
        'VALIDATION_ERROR',
        'Expected application revision is required.'
      );
    if (args.operation === 'submit' && typeof fields.formRevision !== 'string')
      operationError('VALIDATION_ERROR', 'Form revision is required.');
    const binding = await receiptBinding({
      actorId: personId,
      appId: grant.appId,
      issuer: grant.instanceId,
      groupId,
      applicationId: args.applicationId,
      operation: args.operation,
      body: fields,
    });
    const now = Date.now();
    const prior = await priorReceipt(ctx, args.operationId, binding, now);
    if (prior) return JSON.parse(prior) as Infer<typeof receipt>;
    let changed;
    if (args.operation === 'submit') {
      const revision = await secretHash(
        JSON.stringify({
          enabled: group.applicationsEnabled ?? false,
          questions: group.applicationQuestions ?? [],
        })
      );
      if (fields.formRevision !== revision)
        operationError(
          'STALE_REVISION',
          'Application form has changed. Read the current form.'
        );
      const form = await applications.getForm(ctx, groupId, personId);
      if (form.pending)
        operationError('CONFLICT', 'An application is already pending.');
      changed = await applications.submit(
        ctx,
        personId,
        groupId,
        fields.answers as Parameters<typeof applications.submit>[3]
      );
    } else {
      const applicationId = ctx.db.normalizeId(
        'groupApplications',
        args.applicationId ?? ''
      );
      const application = applicationId && (await ctx.db.get(applicationId));
      if (
        !application ||
        application.groupId !== groupId ||
        application.personId !== personId
      )
        throw denied();
      changed =
        args.operation === 'edit'
          ? await applications.edit(
              ctx,
              personId,
              application._id,
              fields.answers as Parameters<typeof applications.edit>[3],
              fields.expectedRevision as number
            )
          : await applications.withdraw(
              ctx,
              personId,
              application._id,
              fields.expectedRevision as number
            );
    }
    const application = await ctx.db.get(changed.applicationId);
    const committed = {
      operationId: args.operationId,
      outcome: 'committed' as const,
      result: { ...changed, revision: application!.updatedAt },
      effects: {
        email: 'not-requested' as const,
        cleanup: 'not-requested' as const,
      },
    };
    await saveReceipt(ctx, args.operationId, binding, committed, now);
    return committed;
  },
});
