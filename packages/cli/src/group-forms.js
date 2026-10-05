import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
import { managementId } from './event-management.js';
/** @param {unknown} value @returns {Record<string,unknown>} */
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CliError('INVALID_RESPONSE', 'Invalid Group forms response.', 5);
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {string} groupId @param {string} [toolId] */
function path(groupId, toolId) {
  managementId(groupId);
  if (toolId !== undefined) managementId(toolId);
  return `/groups/${encodeURIComponent(groupId)}/forms${toolId === undefined ? '' : '/' + encodeURIComponent(toolId)}`;
}
/** @param {{apiUrl:string}} profile @param {string} key @param {string} groupId @param {'list'|'get'|'history'|'results'|'policy'} operation @param {string} [toolId] @param {{limit?:number,cursor?:string}} [options] */
export async function readGroupForms(
  profile,
  key,
  groupId,
  operation,
  toolId,
  options = {}
) {
  let target = path(groupId, toolId);
  if (operation === 'policy')
    target = `/groups/${encodeURIComponent(groupId)}/form-policy`;
  if (operation === 'history' || operation === 'results')
    target += '/' + operation;
  if (['list', 'history', 'results'].includes(operation)) {
    const limit = options.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new CliError('USAGE', '--limit must be 1–100.', 2);
    if (
      options.cursor !== undefined &&
      (!options.cursor || options.cursor.length > 4096)
    )
      throw new CliError(
        'USAGE',
        'Provide a nonempty cursor of at most 4096 characters.',
        2
      );
    const query = new URLSearchParams({ limit: String(limit) });
    if (options.cursor) query.set('cursor', options.cursor);
    target += '?' + query;
  }
  const result = object(await readApi(profile, key, target));
  if (
    ['list', 'history', 'results'].includes(operation) &&
    (!Array.isArray(result.page) ||
      result.page.length > (options.limit ?? 20) ||
      typeof result.isDone !== 'boolean' ||
      typeof result.continueCursor !== 'string')
  )
    throw new CliError('INVALID_RESPONSE', 'Invalid Group forms page.', 5);
  return result;
}
/** @param {{name:string,apiUrl:string}} profile @param {string} key @param {string} groupId @param {'create'|'configure'|'submit'|'remove-own'|'delete'|'moderate'|'policy'} operation @param {string|undefined} toolId @param {Record<string,unknown>} body @param {{yes?:boolean,json?:boolean,responseId?:string}} [options] */
export async function writeGroupForms(
  profile,
  key,
  groupId,
  operation,
  toolId,
  body,
  options = {}
) {
  let target = path(groupId, toolId);
  if (operation === 'create' || operation === 'configure') {
    if (
      typeof body.title !== 'string' ||
      !body.title.trim() ||
      body.title.trim().length > 100 ||
      !Array.isArray(body.questions) ||
      body.questions.length > 50 ||
      (body.description !== undefined &&
        (typeof body.description !== 'string' ||
          body.description.length > 2000))
    )
      throw new CliError(
        'USAGE',
        'Provide a title, optional description and at most 50 questions.',
        2
      );
  }
  if (
    (operation === 'configure' || operation === 'submit') &&
    (!Number.isInteger(body.version) || Number(body.version) < 1)
  )
    throw new CliError(
      'USAGE',
      '--form-version must be a positive integer.',
      2
    );
  if (
    operation === 'submit' &&
    (!Number.isInteger(body.expectedRevision) ||
      Number(body.expectedRevision) < 0 ||
      !body.answers ||
      typeof body.answers !== 'object' ||
      Array.isArray(body.answers))
  )
    throw new CliError(
      'USAGE',
      'Provide nonnegative --expected-revision and an answers object.',
      2
    );
  if (
    operation === 'create' &&
    !['MANAGERS', 'MEMBERS'].includes(String(body.resultsVisibility))
  )
    throw new CliError(
      'USAGE',
      '--results-visibility must be MANAGERS or MEMBERS.',
      2
    );
  if (
    operation === 'policy' &&
    (typeof body.enabled !== 'boolean' ||
      !['MANAGERS', 'MEMBERS'].includes(String(body.creation)))
  )
    throw new CliError(
      'USAGE',
      'Provide enabled boolean and creation MANAGERS or MEMBERS.',
      2
    );
  if (operation === 'policy')
    target = `/groups/${encodeURIComponent(groupId)}/form-policy`;
  if (operation === 'submit' || operation === 'remove-own')
    target += '/response';
  if (operation === 'moderate') {
    managementId(options.responseId ?? '');
    target += '/results/' + encodeURIComponent(options.responseId ?? '');
  }
  const health = object(await readApi(profile, key, '/health'));
  if (object(object(health.capabilities ?? {}).groups ?? {}).forms !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Server must advertise groups.forms version 1; no write was sent.',
      5
    );
  const destructive = ['remove-own', 'delete', 'moderate'].includes(operation);
  const result = await mutateApi(profile, key, target, {
    method: destructive
      ? 'DELETE'
      : operation === 'create'
        ? 'POST'
        : operation === 'configure'
          ? 'PATCH'
          : 'PUT',
    body: destructive ? undefined : body,
    ...(destructive
      ? {
          confirmation: {
            target: `${operation} Group ${groupId} form ${toolId}`,
            ...options,
          },
        }
      : {}),
    recovery: `Inspect groups forms ${toolId ? 'get ' + groupId + ' ' + toolId : 'list ' + groupId} on profile ${profile.name} before retrying.`,
  });
  return result === null ? { success: true } : object(result);
}
