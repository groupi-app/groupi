import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
import { projectEventLogistics } from './event-management.js';
/** @typedef {{apiUrl:string,name:string}} Profile */
/** @param {unknown} value */
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CliError('INVALID_RESPONSE', 'Invalid audience response.', 5);
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {unknown} value */
function id(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,512}$/.test(value))
    throw new CliError('USAGE', 'Provide a valid Group/Event reference.', 2);
  return value;
}
/** @param {boolean} value */
function valid(value) {
  if (!value)
    throw new CliError('INVALID_RESPONSE', 'Invalid audience response.', 5);
}
/** @param {Profile} profile @param {string} key */
async function capability(profile, key) {
  const caps = record(
    record(await readApi(profile, key, '/health')).capabilities ?? {}
  );
  if (
    !caps.groupEventAudiences ||
    record(caps.groupEventAudiences).version !== 1
  )
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Server must advertise groupEventAudiences version 1; no write was sent.',
      5
    );
}
/** @param {Profile} profile @param {string} key @param {string} eventId */
export async function readEventAudiences(profile, key, eventId) {
  const raw = record(
    await readApi(profile, key, `/events/${id(eventId)}/audiences`)
  );
  valid(
    raw.eventId === eventId &&
      (raw.friendsShared === null || typeof raw.friendsShared === 'boolean') &&
      typeof raw.canManageEvent === 'boolean' &&
      Array.isArray(raw.groups)
  );
  return {
    eventId: raw.eventId,
    friendsShared: raw.friendsShared,
    canManageEvent: raw.canManageEvent,
    groups: /** @type {unknown[]} */ (raw.groups).map(value => {
      const g = record(value);
      valid(
        typeof g.groupId === 'string' &&
          typeof g.name === 'string' &&
          typeof g.canWithdraw === 'boolean'
      );
      return { groupId: g.groupId, name: g.name, canWithdraw: g.canWithdraw };
    }),
  };
}
/** @param {Profile} profile @param {string} key @param {string} groupId @param {{limit:number,cursor?:string,all?:boolean}} options */
export async function readGroupEvents(profile, key, groupId, options) {
  id(groupId);
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100 ||
    (options.cursor !== undefined &&
      (options.cursor.length === 0 || options.cursor.length > 4096))
  )
    throw new CliError(
      'USAGE',
      'Use limit 1–100 and a valid continuation cursor.',
      2
    );
  let cursor = options.cursor;
  const seen = new Set(cursor ? [cursor] : []),
    items = [];
  do {
    const query = new URLSearchParams({ limit: String(options.limit) });
    if (cursor) query.set('cursor', cursor);
    const raw = record(
      await readApi(profile, key, `/groups/${groupId}/events?${query}`)
    );
    valid(
      Array.isArray(raw.items) &&
        raw.items.length <= options.limit &&
        (raw.nextCursor === null ||
          (typeof raw.nextCursor === 'string' &&
            raw.nextCursor.length > 0 &&
            raw.nextCursor.length <= 4096))
    );
    items.push(
      .../** @type {unknown[]} */ (raw.items).map(value => {
        const row = record(value),
          event = record(row.event);
        valid(typeof row.canWithdraw === 'boolean');
        return {
          event: projectEventLogistics(
            { event, organizer: null, entryAction: 'UNAVAILABLE' },
            id(event._id)
          ).event,
          canWithdraw: row.canWithdraw,
        };
      })
    );
    if (!options.all || raw.nextCursor === null)
      return { items, nextCursor: raw.nextCursor };
    cursor = /** @type {string} */ (raw.nextCursor);
    if (seen.has(cursor))
      throw new CliError('INVALID_RESPONSE', 'Server repeated a cursor.', 5);
    seen.add(cursor);
  } while (cursor);
  throw new CliError('INVALID_RESPONSE', 'Incomplete Group Event page.', 5);
}
/** @param {Profile} profile @param {string} key @param {'share'|'withdraw'|'group-withdraw'|'friends'|'policy'} operation @param {{eventId?:string,groupId?:string,enabled?:boolean,policy?:string,yes?:boolean,json?:boolean}} input */
export async function writeEventAudience(profile, key, operation, input) {
  const eventId = operation === 'policy' ? undefined : id(input.eventId),
    groupId = operation === 'friends' ? undefined : id(input.groupId);
  if (
    operation === 'policy' &&
    !['MANAGERS', 'MEMBERS'].includes(String(input.policy))
  )
    throw new CliError('USAGE', 'Policy must be MANAGERS or MEMBERS.', 2);
  if (operation === 'friends' && typeof input.enabled !== 'boolean')
    throw new CliError('USAGE', 'Friends enabled must be true or false.', 2);
  await capability(profile, key);
  const path =
    operation === 'policy'
      ? `/groups/${groupId}/event-sharing`
      : operation === 'group-withdraw'
        ? `/groups/${groupId}/events/${eventId}`
        : operation === 'friends'
          ? `/events/${eventId}/audiences/friends`
          : `/events/${eventId}/audiences/groups/${groupId}`;
  const raw = await mutateApi(profile, key, path, {
    method:
      operation === 'share'
        ? 'POST'
        : operation === 'withdraw' || operation === 'group-withdraw'
          ? 'DELETE'
          : 'PUT',
    body:
      operation === 'policy'
        ? { policy: input.policy }
        : operation === 'friends'
          ? { enabled: input.enabled }
          : undefined,
    recovery:
      'Inspect current Event audiences and Group Events before retrying; this write was not retried.',
    ...(['withdraw', 'group-withdraw'].includes(operation)
      ? {
          confirmation: {
            target: `Withdraw Group ${groupId} audience from Event ${eventId}`,
            yes: input.yes,
            json: input.json,
          },
        }
      : {}),
  });
  try {
    const value = record(raw);
    if (operation === 'policy') {
      valid(value.success === true);
      return { success: true };
    }
    if (operation === 'friends') {
      valid(value.eventId === eventId && value.friendsShared === input.enabled);
      return { eventId, friendsShared: value.friendsShared };
    }
    valid(
      value.eventId === eventId &&
        value.groupId === groupId &&
        value.shared === (operation === 'share')
    );
    return { eventId, groupId, shared: value.shared };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      'Audience response was incomplete. Inspect current audiences before retrying; this write was not retried.',
      5
    );
  }
}
