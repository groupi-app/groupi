import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
import { managementId } from './event-management.js';
/** @typedef {{name:string,apiUrl:string}} Profile */
/** @param {unknown} value @returns {Record<string,unknown>} */
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid questionnaire response.',
      5
    );
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {unknown} value */
function form(value) {
  const result = object(value);
  if (
    typeof result.groupId !== 'string' ||
    typeof result.version !== 'number' ||
    !Array.isArray(result.questions) ||
    result.questions.length > 50 ||
    !Array.isArray(result.savedQuestions) ||
    result.savedQuestions.length > 50 ||
    typeof result.enabled !== 'boolean' ||
    typeof result.completed !== 'boolean' ||
    typeof result.shouldPrompt !== 'boolean' ||
    typeof result.canEdit !== 'boolean' ||
    typeof result.canConfigure !== 'boolean' ||
    typeof result.canReview !== 'boolean'
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid private questionnaire form.',
      5
    );
  object(result.answers);
  return result;
}
/** @param {Profile} profile @param {string} key @param {string} groupId @param {'get'|'status'|'history'|'responses'} operation @param {{limit?:number,cursor?:string,authorId?:string}} [options] */
export async function readGroupQuestionnaire(
  profile,
  key,
  groupId,
  operation,
  options = {}
) {
  managementId(groupId);
  const query = new URLSearchParams();
  if (operation === 'history' || operation === 'responses') {
    const limit = options.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new CliError('USAGE', 'Limit must be 1–100.', 2);
    query.set('limit', String(limit));
    if (options.cursor) query.set('cursor', options.cursor);
    if (options.authorId) {
      managementId(options.authorId);
      query.set('authorId', options.authorId);
    }
  }
  const value = await readApi(
    profile,
    key,
    `/groups/${encodeURIComponent(groupId)}/joining-questionnaire${operation === 'get' || operation === 'status' ? '' : '/' + operation}${query.size ? '?' + query : ''}`
  );
  if (operation === 'get' || operation === 'status') {
    const current = form(value);
    return operation === 'status'
      ? {
          groupId: current.groupId,
          enabled: current.enabled,
          version: current.version,
          completed: current.completed,
          shouldPrompt: current.shouldPrompt,
          canEdit: current.canEdit,
        }
      : current;
  }
  const page = object(value);
  if (
    !Array.isArray(page.items) ||
    page.items.length > (options.limit ?? 20) ||
    !(page.nextCursor === null || typeof page.nextCursor === 'string')
  )
    throw new CliError('INVALID_RESPONSE', 'Invalid questionnaire page.', 5);
  return page;
}
/** @param {Profile} profile @param {string} key @param {string} groupId @param {'configure'|'submit'} operation @param {Record<string,unknown>} body */
export async function writeGroupQuestionnaire(
  profile,
  key,
  groupId,
  operation,
  body
) {
  managementId(groupId);
  if (
    operation === 'configure' &&
    (typeof body.enabled !== 'boolean' ||
      !Array.isArray(body.questions) ||
      body.questions.length > 50)
  )
    throw new CliError(
      'USAGE',
      'Provide enabled boolean and at most 50 questions.',
      2
    );
  if (
    operation === 'submit' &&
    (!Number.isInteger(body.version) ||
      Number(body.version) < 1 ||
      !body.answers ||
      typeof body.answers !== 'object' ||
      Array.isArray(body.answers))
  )
    throw new CliError(
      'USAGE',
      'Provide current positive form version and answers object.',
      2
    );
  const health = object(await readApi(profile, key, '/health'));
  const capabilities = object(health.capabilities ?? {});
  if (object(capabilities.groupQuestionnaire ?? {}).version !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Server lacks groupQuestionnaire version 1; no write was sent.',
      5
    );
  return form(
    await mutateApi(
      profile,
      key,
      `/groups/${encodeURIComponent(groupId)}/joining-questionnaire${operation === 'submit' ? '/answers' : ''}`,
      {
        method: 'PUT',
        body,
        recovery: `Inspect groups questionnaire get ${groupId} before retrying.`,
      }
    )
  );
}
