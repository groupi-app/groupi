import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
/** @typedef {{name:string,apiUrl:string}} Profile */
/** @param {string} value */
function identifier(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_;-]{1,512}$/.test(value))
    throw new CliError('USAGE', 'Provide a valid Group ID.', 2);
  return encodeURIComponent(value);
}
/** @param {unknown} value @returns {Record<string,unknown>} */
function summary(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    !('_id' in value) ||
    typeof value._id !== 'string' ||
    !('name' in value) ||
    typeof value.name !== 'string' ||
    !('role' in value) ||
    !['OWNER', 'MODERATOR', 'MEMBER'].includes(String(value.role))
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Server returned invalid Group identity.',
      5
    );
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {Profile} profile @param {string} key @param {string} id */
export async function getGroup(profile, key, id) {
  return summary(await readApi(profile, key, `/groups/${identifier(id)}`));
}
/** @param {Profile} profile @param {string} key @param {{limit:number,cursor?:string,all?:boolean}} options */
export async function listGroups(profile, key, options) {
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  )
    throw new CliError('USAGE', '--limit must be an integer from 1 to 100.', 2);
  let cursor = options.cursor;
  const seen = new Set(cursor ? [cursor] : []);
  const items = [];
  do {
    const query = new URLSearchParams({ limit: String(options.limit) });
    if (cursor) query.set('cursor', cursor);
    const value = await readApi(profile, key, `/groups?${query}`);
    if (
      !value ||
      typeof value !== 'object' ||
      !('items' in value) ||
      !Array.isArray(value.items) ||
      value.items.length > options.limit ||
      !('nextCursor' in value) ||
      !(
        value.nextCursor === null ||
        (typeof value.nextCursor === 'string' && value.nextCursor.length > 0)
      )
    )
      throw new CliError(
        'INVALID_RESPONSE',
        'Server returned invalid Group page.',
        5
      );
    items.push(...value.items.map(summary));
    if (!options.all || value.nextCursor === null)
      return { items, nextCursor: value.nextCursor };
    cursor = /** @type {string} */ (value.nextCursor);
    if (seen.has(cursor))
      throw new CliError(
        'INVALID_RESPONSE',
        'Server repeated a Group cursor; retrieval stopped.',
        5
      );
    seen.add(cursor);
  } while (cursor);
  throw new CliError('INVALID_RESPONSE', 'Incomplete Group page.', 5);
}
/** @param {Profile} profile @param {string} key @param {'create'|'edit'|'delete'} operation @param {string|undefined} id @param {{name?:string,description?:string|null,image?:string|null}} input @param {{yes?:boolean,json?:boolean}} options */
export async function changeGroup(
  profile,
  key,
  operation,
  id,
  input,
  options = {}
) {
  if (operation !== 'create') identifier(id ?? '');
  if (
    input.name !== undefined &&
    (input.name.trim().length < 1 || input.name.trim().length > 100)
  )
    throw new CliError('USAGE', 'Group name must contain 1–100 characters.', 2);
  if (operation === 'create' && input.name === undefined)
    throw new CliError('USAGE', 'Provide --name.', 2);
  const health = await readApi(profile, key, '/health');
  if (
    !health ||
    typeof health !== 'object' ||
    !('capabilities' in health) ||
    !health.capabilities ||
    typeof health.capabilities !== 'object' ||
    !('groups' in health.capabilities) ||
    !health.capabilities.groups ||
    typeof health.capabilities.groups !== 'object' ||
    !('version' in health.capabilities.groups) ||
    health.capabilities.groups.version !== 1
  )
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Server must advertise Groups version 1; no write was sent.',
      5
    );
  const recovery = `Inspect groups list --all on profile ${profile.name} before repeating; this write was not retried.`;
  const value = await mutateApi(
    profile,
    key,
    operation === 'create' ? '/groups' : `/groups/${identifier(id ?? '')}`,
    {
      method:
        operation === 'create'
          ? 'POST'
          : operation === 'edit'
            ? 'PATCH'
            : 'DELETE',
      body: input,
      recovery,
      ...(operation === 'delete'
        ? {
            confirmation: {
              target: `delete Group ${id}`,
              yes: options.yes,
              json: options.json,
            },
          }
        : {}),
    }
  );
  if (operation !== 'create') return { success: true, groupId: id };
  if (
    !value ||
    typeof value !== 'object' ||
    !('groupId' in value) ||
    typeof value.groupId !== 'string'
  )
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `Group creation response was incomplete. ${recovery}`,
      5
    );
  return { groupId: value.groupId };
}
