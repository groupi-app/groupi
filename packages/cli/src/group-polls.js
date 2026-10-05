import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
import { managementId } from './event-management.js';
/** @param {unknown} value @returns {Record<string,unknown>} */
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CliError('INVALID_RESPONSE', 'Invalid Group polls response.', 5);
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {boolean} condition */
function valid(condition) {
  if (!condition)
    throw new CliError('INVALID_RESPONSE', 'Invalid Group polls response.', 5);
}
/** @param {Record<string,unknown>} row @param {string[]} keys */
function pick(row, keys) {
  return Object.fromEntries(
    keys.filter(key => row[key] !== undefined).map(key => [key, row[key]])
  );
}
/** @param {unknown} value */
function options(value) {
  valid(Array.isArray(value) && value.length <= 50);
  return /** @type {unknown[]} */ (value).map(item => {
    const row = object(item);
    valid(typeof row.id === 'string' && typeof row.label === 'string');
    return pick(row, ['id', 'label']);
  });
}
/** @param {unknown} value */
function selections(value) {
  valid(
    Array.isArray(value) &&
      value.length <= 50 &&
      value.every(id => typeof id === 'string')
  );
  return value;
}
/** @param {unknown} value @param {'list'|'get'|'settings'|'history'|'results'|'policy'} operation */
function project(value, operation) {
  const row = object(value);
  if (operation === 'policy') {
    valid(
      row.kind === 'POLL' &&
        typeof row.groupId === 'string' &&
        typeof row.enabled === 'boolean' &&
        typeof row.canConfigure === 'boolean' &&
        ['MANAGERS', 'MEMBERS'].includes(String(row.creation))
    );
    return pick(row, [
      'groupId',
      'kind',
      'enabled',
      'creation',
      'canConfigure',
    ]);
  }
  if (operation === 'list' || operation === 'get' || operation === 'settings') {
    valid(
      row.kind === 'POLL' &&
        typeof row._id === 'string' &&
        typeof row.title === 'string' &&
        typeof row.description === 'string' &&
        typeof row.groupId === 'string' &&
        Number.isFinite(row._creationTime) &&
        Number.isFinite(row.createdAt) &&
        Number.isFinite(row.updatedAt) &&
        (row.creatorId === undefined || typeof row.creatorId === 'string') &&
        ['MANAGERS', 'MEMBERS'].includes(String(row.resultsVisibility))
    );
    const base = pick(row, [
      '_id',
      '_creationTime',
      'groupId',
      'kind',
      'title',
      'description',
      'resultsVisibility',
      'creatorId',
      'createdAt',
      'updatedAt',
    ]);
    if (operation === 'list') return base;
    valid(
      Number.isInteger(row.version) &&
        Number(row.version) > 0 &&
        Number.isInteger(row.semanticVersion) &&
        Number(row.semanticVersion) > 0 &&
        ['SINGLE', 'MULTIPLE'].includes(String(row.mode)) &&
        typeof row.canManage === 'boolean'
    );
    const config = {
      ...base,
      ...pick(row, ['version', 'semanticVersion', 'mode', 'canManage']),
      options: options(row.options),
    };
    if (operation === 'settings') return config;
    valid(
      typeof row.canReview === 'boolean' &&
        typeof row.enabled === 'boolean' &&
        Number.isInteger(row.voteRevision) &&
        Number(row.voteRevision) >= 0 &&
        (row.savedVersion === null ||
          (Number.isInteger(row.savedVersion) && Number(row.savedVersion) > 0))
    );
    return {
      ...config,
      ...pick(row, ['savedVersion', 'voteRevision', 'canReview', 'enabled']),
      selections: selections(row.selections),
      savedOptions: options(row.savedOptions),
    };
  }
  valid(
    typeof row._id === 'string' &&
      typeof row.toolId === 'string' &&
      typeof row.groupId === 'string' &&
      Number.isFinite(row._creationTime) &&
      Number.isFinite(row.createdAt) &&
      Number.isFinite(row.updatedAt) &&
      (row.personId === undefined || typeof row.personId === 'string') &&
      Number.isInteger(row.revision) &&
      Number(row.revision) > 0 &&
      Number.isInteger(row.version) &&
      Number(row.version) > 0 &&
      Number.isInteger(row.semanticVersion) &&
      Number(row.semanticVersion) > 0 &&
      typeof row.removed === 'boolean' &&
      ['SINGLE', 'MULTIPLE'].includes(String(row.mode))
  );
  if (operation === 'results') valid(typeof row.isCurrent === 'boolean');
  return {
    ...pick(row, [
      '_id',
      '_creationTime',
      'toolId',
      'groupId',
      'personId',
      'revision',
      'version',
      'semanticVersion',
      'mode',
      'removed',
      'createdAt',
      'updatedAt',
      ...(operation === 'results' ? ['isCurrent'] : []),
    ]),
    options: options(row.options),
    selections: selections(row.selections),
  };
}
/** @param {string} groupId @param {string} [toolId] */
function path(groupId, toolId) {
  managementId(groupId);
  if (toolId !== undefined) managementId(toolId);
  return `/groups/${encodeURIComponent(groupId)}/polls${toolId === undefined ? '' : '/' + encodeURIComponent(toolId)}`;
}
/** @param {{apiUrl:string}} profile @param {string} key @param {string} groupId @param {'list'|'get'|'settings'|'history'|'results'|'policy'} operation @param {string} [toolId] @param {{limit?:number,cursor?:string}} [options] */
export async function readGroupPolls(
  profile,
  key,
  groupId,
  operation,
  toolId,
  options = {}
) {
  let target = path(groupId, toolId);
  if (operation === 'policy')
    target = `/groups/${encodeURIComponent(groupId)}/poll-policy`;
  if (
    operation === 'settings' ||
    operation === 'history' ||
    operation === 'results'
  )
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
      typeof result.continueCursor !== 'string' ||
      result.continueCursor.length > 4096)
  )
    throw new CliError('INVALID_RESPONSE', 'Invalid Group polls page.', 5);
  if (operation === 'history')
    valid(
      Number.isInteger(result.voteRevision) && Number(result.voteRevision) >= 0
    );
  if (['list', 'history', 'results'].includes(operation))
    return {
      ...(operation === 'history' ? { voteRevision: result.voteRevision } : {}),
      page: /** @type {unknown[]} */ (result.page).map(row =>
        project(row, operation)
      ),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  return project(result, operation);
}
/** @param {{name:string,apiUrl:string}} profile @param {string} key @param {string} groupId @param {'create'|'configure'|'submit'|'remove-own'|'delete'|'moderate'|'policy'} operation @param {string|undefined} toolId @param {Record<string,unknown>} body @param {{yes?:boolean,json?:boolean,voteId?:string}} [options] */
export async function writeGroupPolls(
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
      !Array.isArray(body.options) ||
      body.options.length < 2 ||
      body.options.length > 50 ||
      !['SINGLE', 'MULTIPLE'].includes(String(body.mode)) ||
      (body.description !== undefined &&
        (typeof body.description !== 'string' ||
          body.description.length > 2000))
    )
      throw new CliError(
        'USAGE',
        'Provide a title, optional description and 2–50 options and SINGLE or MULTIPLE mode.',
        2
      );
  }
  if (
    (operation === 'configure' || operation === 'submit') &&
    (!Number.isInteger(body.version) || Number(body.version) < 1)
  )
    throw new CliError(
      'USAGE',
      '--poll-version must be a positive integer.',
      2
    );
  if (
    operation === 'submit' &&
    (!Number.isInteger(body.expectedRevision) ||
      Number(body.expectedRevision) < 0 ||
      !body.selections ||
      body.selections === null ||
      !Array.isArray(body.selections))
  )
    throw new CliError(
      'USAGE',
      'Provide nonnegative --expected-revision and an selections array.',
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
    target = `/groups/${encodeURIComponent(groupId)}/poll-policy`;
  if (operation === 'submit' || operation === 'remove-own') target += '/vote';
  if (operation === 'moderate') {
    managementId(options.voteId ?? '');
    target += '/results/' + encodeURIComponent(options.voteId ?? '');
  }
  if (
    ['remove-own', 'moderate'].includes(operation) &&
    (!Number.isInteger(body.expectedRevision) ||
      Number(body.expectedRevision) < 0)
  )
    throw new CliError('USAGE', 'Provide nonnegative --expected-revision.', 2);
  const health = object(await readApi(profile, key, '/health'));
  if (object(object(health.capabilities ?? {}).groups ?? {}).polls !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Server must advertise groups.polls version 1; no write was sent.',
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
    body: operation === 'delete' ? undefined : body,
    deleteBody: operation === 'remove-own' || operation === 'moderate',
    ...(destructive
      ? {
          confirmation: {
            target: `${operation} Group ${groupId} poll ${toolId}`,
            ...options,
          },
        }
      : {}),
    recovery: `Inspect groups polls ${toolId ? 'get ' + groupId + ' ' + toolId : 'list ' + groupId} on profile ${profile.name} before retrying.`,
  });
  try {
    if (['configure', 'remove-own', 'delete', 'moderate'].includes(operation)) {
      valid(result === null);
      return { success: true };
    }
    const row = object(result);
    if (operation === 'create') {
      valid(typeof row.toolId === 'string');
      return pick(row, ['toolId']);
    }
    if (operation === 'submit') {
      valid(Number.isInteger(row.revision) && Number(row.revision) > 0);
      return pick(row, ['revision']);
    }
    valid(row.success === true);
    return { success: true };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      'The write response was invalid. Inspect the poll and your saved vote before retrying.',
      5
    );
  }
}
