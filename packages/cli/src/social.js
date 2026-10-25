import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { readPaginated } from './pagination.js';
import { mutateApi } from './mutations.js';
/** @typedef {{name:string,apiUrl:string}} Profile */
/** @param {string} value */
function identifier(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_;-]{1,512}$/.test(value))
    throw new CliError('USAGE', 'Provide a valid person or friendship ID.', 2);
  return value;
}
/** @param {unknown} value @param {string[]} fields @returns {Record<string,unknown>} */
function pick(value, fields) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    fields.some(field => !(field in value))
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned incomplete social data. Update the server if needed.',
      5
    );
  const source = /** @type {Record<string,unknown>} */ (value);
  return Object.fromEntries(fields.map(field => [field, source[field]]));
}
/** @param {boolean} condition */
function valid(condition) {
  if (!condition)
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned invalid social data.',
      5
    );
}
/** @param {unknown} value @param {'friends'|'incoming'|'outgoing'|'blocks'} kind */
function summary(value, kind) {
  const result = pick(value, [
    'personId',
    'userId',
    'name',
    'username',
    'image',
    ...(kind === 'blocks'
      ? ['blockedAt']
      : ['friendshipId', kind === 'friends' ? 'lastSeen' : 'createdAt']),
  ]);
  valid(
    typeof result.personId === 'string' &&
      typeof result.userId === 'string' &&
      (kind === 'blocks' || typeof result.friendshipId === 'string') &&
      ['name', 'username', 'image'].every(
        field => result[field] === null || typeof result[field] === 'string'
      )
  );
  valid(
    kind === 'friends'
      ? result.lastSeen === null || Number.isFinite(result.lastSeen)
      : Number.isFinite(result[kind === 'blocks' ? 'blockedAt' : 'createdAt'])
  );
  return result;
}
/** @param {Profile} profile @param {string} key @param {'friends'|'incoming'|'outgoing'|'blocks'} kind @param {{limit:number,cursor?:string,all?:boolean}} options */
export async function listSocial(profile, key, kind, options) {
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  )
    throw new CliError('USAGE', '--limit must be an integer from 1 to 100.', 2);
  const path = {
    friends: '/friends',
    incoming: '/friends/requests/incoming',
    outgoing: '/friends/requests/outgoing',
    blocks: '/blocks',
  }[kind];
  return readPaginated({
    ...options,
    fetchPage: ({ cursor, limit }) => {
      const query = new URLSearchParams({
        pagination: 'cursor',
        limit: String(limit),
      });
      if (cursor) query.set('cursor', cursor);
      return readApi(profile, key, `${path}?${query}`);
    },
    projectItem: (/** @type {unknown} */ item) => summary(item, kind),
  });
}
/** @param {Profile} profile @param {string} key @param {string} personId @param {boolean} [blocks] */
export async function getSocialStatus(profile, key, personId, blocks = false) {
  identifier(personId);
  const result = pick(
    await readApi(
      profile,
      key,
      blocks ? `/blocks/${personId}` : `/friends/status/${personId}`
    ),
    blocks ? ['blockedByMe', 'blockedByThem'] : ['status', 'friendshipId']
  );
  valid(
    blocks
      ? typeof result.blockedByMe === 'boolean' &&
          typeof result.blockedByThem === 'boolean'
      : [
          'none',
          'pending_sent',
          'pending_received',
          'friends',
          'declined',
          'self',
        ].includes(String(result.status)) &&
          (result.friendshipId === null ||
            typeof result.friendshipId === 'string')
  );
  return result;
}
/** @param {Profile} profile @param {string} key @param {'request'|'accept'|'decline'|'cancel'|'remove'|'block'|'unblock'} operation @param {string} id @param {{yes?:boolean,json?:boolean}} options */
export async function changeSocial(profile, key, operation, id, options) {
  identifier(id);
  const health = pick(await readApi(profile, key, '/health'), ['capabilities']);
  const capabilities = health.capabilities;
  if (
    !capabilities ||
    typeof capabilities !== 'object' ||
    !('socialWrites' in capabilities) ||
    !capabilities.socialWrites ||
    typeof capabilities.socialWrites !== 'object' ||
    !('version' in capabilities.socialWrites) ||
    capabilities.socialWrites.version !== 1
  )
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'This server does not advertise socialWrites version 1. Update the server; no write was sent.',
      5
    );
  const path = {
    request: '/friends/requests',
    accept: `/friends/requests/${id}/accept`,
    decline: `/friends/requests/${id}/decline`,
    cancel: `/friends/requests/${id}`,
    remove: `/friends/${id}`,
    block: `/blocks/${id}`,
    unblock: `/blocks/${id}`,
  }[operation];
  const method = ['cancel', 'remove', 'unblock'].includes(operation)
    ? 'DELETE'
    : 'POST';
  const recovery = `Inspect ${operation === 'block' || operation === 'unblock' ? `blocks status ${id}` : 'friends list --all and friends incoming --all / friends outgoing --all'} on profile ${profile.name} before repeating the action; this write was not retried.`;
  const value = await mutateApi(profile, key, path, {
    method,
    body: operation === 'request' ? { personId: id } : {},
    recovery,
    ...(operation === 'accept' || operation === 'request'
      ? {}
      : {
          confirmation: {
            target: `${operation} ${id}`,
            yes: options.yes,
            json: options.json,
          },
        }),
  });
  if (method === 'DELETE') return { success: true };
  try {
    const result = pick(
      value,
      operation === 'request'
        ? ['friendshipId', 'status', 'message']
        : ['message']
    );
    valid(
      typeof result.message === 'string' &&
        (operation !== 'request' ||
          (typeof result.friendshipId === 'string' &&
            ['PENDING', 'ACCEPTED'].includes(String(result.status))))
    );
    return result;
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The social write response was incomplete. ${recovery}`,
      5
    );
  }
}
