import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
import { managementId } from './event-management.js';
/** @param {unknown} value @returns {Record<string,unknown>} */
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CliError('INVALID_RESPONSE', 'Invalid Group list response.', 5);
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {string} groupId @param {string} [toolId] */
function path(groupId, toolId) {
  managementId(groupId);
  if (toolId !== undefined) managementId(toolId);
  return `/groups/${encodeURIComponent(groupId)}/lists${toolId ? '/' + encodeURIComponent(toolId) : ''}`;
}
/** @param {{apiUrl:string}} profile @param {string} key @param {string} groupId @param {'list'|'get'|'settings'|'entries'|'own'|'policy'} operation @param {string} [toolId] @param {{limit?:number,cursor?:string}} [options] */
export async function readGroupLists(
  profile,
  key,
  groupId,
  operation,
  toolId,
  options = {}
) {
  let target = path(groupId, toolId);
  if (operation === 'policy')
    target = `/groups/${encodeURIComponent(groupId)}/list-policy`;
  if (['settings', 'entries', 'own'].includes(operation))
    target += '/' + operation;
  if (['list', 'entries', 'own'].includes(operation)) {
    const limit = options.limit ?? 20;
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      (options.cursor !== undefined &&
        (!options.cursor || options.cursor.length > 4096))
    )
      throw new CliError(
        'USAGE',
        'Provide limit1–100 and an optional server cursor of at most4096 characters.',
        2
      );
    const query = new URLSearchParams({ limit: String(limit) });
    if (options.cursor) query.set('cursor', options.cursor);
    target += '?' + query;
  }
  const result = object(await readApi(profile, key, target));
  if (
    ['list', 'entries', 'own'].includes(operation) &&
    (!Array.isArray(result.page) ||
      result.page.length > (options.limit ?? 20) ||
      typeof result.isDone !== 'boolean' ||
      typeof result.continueCursor !== 'string')
  )
    throw new CliError('INVALID_RESPONSE', 'Invalid Group list page.', 5);
  return result;
}
/** @param {{apiUrl:string,name:string}} profile @param {string} key @param {string} groupId @param {'create'|'configure'|'add'|'edit'|'remove'|'delete'|'policy'} operation @param {string|undefined} toolId @param {Record<string,unknown>} body @param {{yes?:boolean,json?:boolean,entryId?:string,requestId?:string}} [options] */
export async function writeGroupLists(
  profile,
  key,
  groupId,
  operation,
  toolId,
  body,
  options = {}
) {
  let target = path(groupId, toolId);
  if (
    ['create', 'configure'].includes(operation) &&
    (typeof body.title !== 'string' ||
      !body.title.trim() ||
      body.title.trim().length > 100 ||
      (body.description !== undefined &&
        (typeof body.description !== 'string' ||
          body.description.length > 2000)))
  )
    throw new CliError(
      'USAGE',
      'Provide title1–100 and optional description at most2000 characters.',
      2
    );
  if (
    ['configure', 'add', 'edit'].includes(operation) &&
    (!Number.isInteger(body.version) || Number(body.version) < 1)
  )
    throw new CliError(
      'USAGE',
      '--list-version must be a positive integer.',
      2
    );
  if (
    ['add', 'edit'].includes(operation) &&
    (typeof body.text !== 'string' ||
      !body.text.trim() ||
      body.text.trim().length > 2000)
  )
    throw new CliError('USAGE', 'Entry text must contain1–2000 characters.', 2);
  if (
    operation === 'remove' &&
    (!Number.isInteger(body.expectedRevision) ||
      Number(body.expectedRevision) < 1)
  )
    throw new CliError('USAGE', 'Provide positive --expected-revision.', 2);
  if (
    operation === 'edit' &&
    (!Number.isInteger(body.expectedRevision) ||
      Number(body.expectedRevision) < 1 ||
      typeof body.completed !== 'boolean')
  )
    throw new CliError(
      'USAGE',
      'Provide positive --expected-revision and --completed true|false.',
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
  if (
    operation === 'add' &&
    (!options.requestId ||
      !/^\d{13}\.[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        options.requestId
      ))
  )
    throw new CliError(
      'USAGE',
      '--request-id must be <unix-ms>.<uuid-v4>; preserve it for an exact retry.',
      2
    );
  if (operation === 'policy')
    target = `/groups/${encodeURIComponent(groupId)}/list-policy`;
  if (operation === 'add') target += '/entries';
  if (operation === 'edit' || operation === 'remove') {
    managementId(options.entryId ?? '');
    target += '/entries/' + encodeURIComponent(options.entryId ?? '');
  }
  const health = object(await readApi(profile, key, '/health'));
  if (object(object(health.capabilities ?? {}).groups ?? {}).lists !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Server must advertise groups.lists version1; no write sent.',
      5
    );
  const destructive = ['remove', 'delete'].includes(operation);
  const result = await mutateApi(profile, key, target, {
    method: destructive
      ? 'DELETE'
      : operation === 'create' || operation === 'add'
        ? 'POST'
        : operation === 'policy'
          ? 'PUT'
          : 'PATCH',
    body: operation === 'delete' ? undefined : body,
    ...(operation === 'remove' ? { deleteBody: true } : {}),
    ...(operation === 'add' ? { requestId: options.requestId } : {}),
    ...(destructive
      ? {
          confirmation: {
            target: `${operation} Group ${groupId} list ${toolId}${options.entryId ? ' entry ' + options.entryId : ''}`,
            ...options,
          },
        }
      : {}),
    recovery: `Inspect groups lists own ${groupId} ${toolId ?? ''}. Retry an add only with the same request ID and exact original body; REMOVED means the original entry is no longer present.`,
  });
  return result === null ? { success: true } : object(result);
}
