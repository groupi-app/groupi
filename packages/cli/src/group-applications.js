import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
/** @typedef {{name:string,apiUrl:string}} Profile */
const statuses = ['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED'];
/** @param {unknown} input @returns {Record<string,unknown>} */
function record(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid Group application response.',
      5
    );
  return /** @type {Record<string,unknown>} */ (input);
}
/** @param {string} input */
function id(input) {
  if (!/^[a-zA-Z0-9_;-]{1,512}$/.test(input))
    throw new CliError('USAGE', 'Provide a valid Group or application ID.', 2);
  return encodeURIComponent(input);
}
/** @param {boolean} condition */
function valid(condition) {
  if (!condition)
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid Group application response.',
      5
    );
}
/** @param {unknown} input */
function questions(input) {
  valid(Array.isArray(input) && input.length <= 50);
  return /** @type {unknown[]} */ (input).map(item => {
    const q = record(item);
    valid(
      typeof q.id === 'string' &&
        typeof q.label === 'string' &&
        typeof q.required === 'boolean' &&
        [
          'SHORT_ANSWER',
          'LONG_ANSWER',
          'MULTIPLE_CHOICE',
          'CHECKBOXES',
          'NUMBER',
          'DROPDOWN',
          'YES_NO',
        ].includes(String(q.type)) &&
        (q.options === undefined ||
          (Array.isArray(q.options) &&
            q.options.every(o => typeof o === 'string')))
    );
    return {
      id: q.id,
      label: q.label,
      required: q.required,
      type: q.type,
      ...(q.options !== undefined ? { options: q.options } : {}),
    };
  });
}
/** @param {unknown} input */
function answers(input) {
  const value = record(input);
  valid(
    Object.keys(value).length <= 50 &&
      Object.values(value).every(
        v =>
          typeof v === 'string' ||
          typeof v === 'boolean' ||
          (typeof v === 'number' && Number.isFinite(v)) ||
          (Array.isArray(v) && v.every(o => typeof o === 'string'))
      )
  );
  return value;
}
/** @param {unknown} input */
function application(input) {
  const row = record(input);
  valid(
    typeof row._id === 'string' &&
      typeof row.groupId === 'string' &&
      typeof row.personId === 'string' &&
      Number.isFinite(row.submittedAt) &&
      Number.isFinite(row.updatedAt) &&
      statuses.includes(String(row.status)) &&
      Array.isArray(row.decisions)
  );
  return {
    _id: row._id,
    groupId: row.groupId,
    personId: row.personId,
    questions: questions(row.questions),
    answers: answers(row.answers),
    status: row.status,
    submittedAt: row.submittedAt,
    updatedAt: row.updatedAt,
    decisions: /** @type {unknown[]} */ (row.decisions).map(item => {
      const d = record(item);
      valid(
        statuses.includes(String(d.status)) &&
          Number.isFinite(d.at) &&
          (d.actorId === undefined || typeof d.actorId === 'string')
      );
      return {
        status: d.status,
        at: d.at,
        ...(d.actorId !== undefined ? { actorId: d.actorId } : {}),
      };
    }),
    ...(row.applicant !== undefined
      ? { applicant: person(row.applicant) }
      : {}),
  };
}
/** @param {unknown} input */
function person(input) {
  const row = record(input);
  valid(
    typeof row.personId === 'string' &&
      ['name', 'username', 'image'].every(
        k => row[k] === null || typeof row[k] === 'string'
      )
  );
  return {
    personId: row.personId,
    name: row.name,
    username: row.username,
    image: row.image,
  };
}
/** @param {Profile} profile @param {string} key */
async function capability(profile, key) {
  const health = record(await readApi(profile, key, '/health'));
  const caps = record(health.capabilities ?? {});
  if (
    !caps.groupApplications ||
    typeof caps.groupApplications !== 'object' ||
    !('version' in caps.groupApplications) ||
    caps.groupApplications.version !== 1
  )
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Server must advertise groupApplications version 1; no write was sent.',
      5
    );
}
/** @param {Profile} profile @param {string} key @param {string} groupId @param {'form'|'get'|'history'|'queue'} kind @param {{applicationId?:string,limit?:number,cursor?:string,all?:boolean,status?:string}} [options] */
export async function readGroupApplications(
  profile,
  key,
  groupId,
  kind,
  options = {}
) {
  const base = `/groups/${id(groupId)}`;
  if (kind === 'form') {
    const data = record(
      await readApi(profile, key, `${base}/application-form`)
    );
    valid(
      typeof data.applicationsEnabled === 'boolean' &&
        typeof data.canApply === 'boolean' &&
        typeof data.canReview === 'boolean'
    );
    return {
      applicationsEnabled: data.applicationsEnabled,
      canApply: data.canApply,
      canReview: data.canReview,
      questions: questions(data.questions),
      pending: data.pending === null ? null : application(data.pending),
    };
  }
  if (kind === 'get')
    return application(
      await readApi(
        profile,
        key,
        `${base}/applications/${id(options.applicationId ?? '')}`
      )
    );
  const limit = options.limit ?? 20;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    throw new CliError('USAGE', '--limit must be an integer from 1 to 100.', 2);
  if (options.status && !statuses.includes(options.status))
    throw new CliError(
      'USAGE',
      '--status must be PENDING, WITHDRAWN, APPROVED or DECLINED.',
      2
    );
  if (
    options.cursor !== undefined &&
    (!options.cursor || options.cursor.length > 4096)
  )
    throw new CliError(
      'USAGE',
      'Provide a nonempty cursor of at most 4096 characters.',
      2
    );
  let cursor = options.cursor;
  const seen = new Set(cursor ? [cursor] : []);
  const items = [];
  while (true) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    if (kind === 'queue' && options.status)
      params.set('status', options.status);
    const value = record(
      await readApi(
        profile,
        key,
        `${base}/applications${kind === 'history' ? '/mine' : ''}?${params}`
      )
    );
    valid(
      Array.isArray(value.items) &&
        (value.nextCursor === null || typeof value.nextCursor === 'string')
    );
    items.push(.../** @type {unknown[]} */ (value.items).map(application));
    if (!options.all || value.nextCursor === null)
      return { items, nextCursor: value.nextCursor };
    if (!value.nextCursor || seen.has(String(value.nextCursor)))
      throw new CliError(
        'INVALID_RESPONSE',
        'Group application cursor repeated.',
        5
      );
    seen.add(String(value.nextCursor));
    cursor = String(value.nextCursor);
  }
}
/** @param {Profile} profile @param {string} key @param {string} groupId @param {'configure'|'submit'|'edit'|'withdraw'|'review'} operation @param {{applicationId?:string,applicationsEnabled?:boolean,questions?:unknown,answers?:unknown,decision?:string,yes?:boolean,json?:boolean}} options */
export async function writeGroupApplication(
  profile,
  key,
  groupId,
  operation,
  options
) {
  const base = `/groups/${id(groupId)}`;
  const applicationId = ['edit', 'withdraw', 'review'].includes(operation)
    ? id(options.applicationId ?? '')
    : null;
  if (
    operation === 'configure' &&
    (typeof options.applicationsEnabled !== 'boolean' ||
      !Array.isArray(options.questions) ||
      options.questions.length > 50)
  )
    throw new CliError(
      'USAGE',
      'Supply enabled boolean and at most 50 JSON questions.',
      2
    );
  if (
    ['submit', 'edit'].includes(operation) &&
    (!options.answers ||
      typeof options.answers !== 'object' ||
      Array.isArray(options.answers))
  )
    throw new CliError('USAGE', 'Supply answers as a JSON object.', 2);
  if (
    operation === 'review' &&
    !['APPROVED', 'DECLINED'].includes(options.decision ?? '')
  )
    throw new CliError('USAGE', '--decision must be APPROVED or DECLINED.', 2);
  await capability(profile, key);
  const recovery = `Inspect groups application-history ${groupId} --all or groups applications ${groupId} --all on profile ${profile.name} before repeating; this write was not retried.`;
  const body =
    operation === 'configure'
      ? {
          applicationsEnabled: options.applicationsEnabled,
          questions: options.questions,
        }
      : operation === 'submit' || operation === 'edit'
        ? { answers: options.answers }
        : operation === 'review'
          ? { decision: options.decision }
          : undefined;
  const raw = await mutateApi(
    profile,
    key,
    operation === 'configure'
      ? `${base}/application-settings`
      : operation === 'submit'
        ? `${base}/applications`
        : operation === 'edit'
          ? `${base}/applications/${applicationId}`
          : `${base}/applications/${applicationId}/${operation}`,
    {
      method:
        operation === 'configure'
          ? 'PUT'
          : operation === 'edit'
            ? 'PATCH'
            : 'POST',
      body,
      recovery,
      ...(['withdraw', 'review'].includes(operation)
        ? {
            confirmation: {
              target: `${operation} Group application ${options.applicationId}`,
              yes: options.yes,
              json: options.json,
            },
          }
        : {}),
    }
  );
  try {
    const value = record(raw);
    if (operation === 'configure') {
      valid(value.success === true);
      return { success: true };
    }
    const expected =
      operation === 'withdraw'
        ? 'WITHDRAWN'
        : operation === 'review'
          ? options.decision
          : 'PENDING';
    valid(typeof value.applicationId === 'string' && value.status === expected);
    if (value.joiningQuestionnaire !== undefined) {
      const status = record(value.joiningQuestionnaire);
      valid(
        typeof status.enabled === 'boolean' &&
          typeof status.completed === 'boolean' &&
          typeof status.shouldPrompt === 'boolean' &&
          Number.isInteger(status.version) &&
          Number(status.version) >= 0
      );
      const accessFlags = [
        'requiredCompletion',
        'requiresCompletion',
        'canAccessMemberContent',
      ];
      const hasAccess = accessFlags.some(flag => status[flag] !== undefined);
      valid(
        !hasAccess ||
          accessFlags.every(flag => typeof status[flag] === 'boolean')
      );
      return {
        applicationId: value.applicationId,
        status: value.status,
        joiningQuestionnaire: {
          ...(hasAccess
            ? {
                requiredCompletion: status.requiredCompletion,
                requiresCompletion: status.requiresCompletion,
                canAccessMemberContent: status.canAccessMemberContent,
              }
            : {}),
          enabled: status.enabled,
          completed: status.completed,
          shouldPrompt: status.shouldPrompt,
          version: status.version,
        },
      };
    }
    return { applicationId: value.applicationId, status: value.status };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `Group application response was incomplete. ${recovery}`,
      5
    );
  }
}
