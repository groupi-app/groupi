import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
/** @typedef {{apiUrl:string,name:string}} Profile */
/** @param {unknown} id */
export function managementId(id) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id))
    throw new CliError(
      'USAGE',
      'Provide an event or membership ID from events list/members.',
      2
    );
  return id;
}
/** @param {unknown} value */
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CliError(
      'INVALID_RESPONSE',
      'Expected event management data.',
      5
    );
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {unknown} value */
function settingsResult(value) {
  const row = record(value),
    permissions = record(row.permissions);
  if (
    typeof row.eventId !== 'string' ||
    !['PRIVATE', 'FRIENDS', 'PUBLIC'].includes(String(row.visibility)) ||
    !['createPosts', 'inviteMembers', 'viewAttendeeList'].every(name =>
      ['EVERYONE', 'MODERATOR', 'ORGANIZER'].includes(String(permissions[name]))
    )
  )
    throw new CliError('INVALID_RESPONSE', 'Invalid event settings.', 5);
  return {
    eventId: row.eventId,
    visibility: row.visibility,
    permissions: {
      createPosts: permissions.createPosts,
      inviteMembers: permissions.inviteMembers,
      viewAttendeeList: permissions.viewAttendeeList,
    },
  };
}
/** @param {Profile} profile @param {string} key */
async function supported(profile, key) {
  const health = record(await readApi(profile, key, '/health'));
  const capabilities = record(health.capabilities ?? {});
  const version = capabilities.eventManagement;
  if (
    !version ||
    typeof version !== 'object' ||
    !('version' in version) ||
    version.version !== 1
  )
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'This server does not advertise eventManagement version 1. Update the server; no write was sent.',
      5
    );
}
/** @param {Profile} profile @param {string} key @param {string} eventId */
export async function getEventSettings(profile, key, eventId) {
  managementId(eventId);
  return settingsResult(
    await readApi(profile, key, `/events/${eventId}/settings`)
  );
}
/** @param {Profile} profile @param {string} key @param {string} eventId @param {'delete'|'leave'|'join'|'role'|'remove'|'settings'} action @param {{memberId?:string,role?:string,body?:Record<string,unknown>,yes?:boolean,json?:boolean}} [options] */
export async function manageEvent(profile, key, eventId, action, options = {}) {
  managementId(eventId);
  if (action === 'role' || action === 'remove') managementId(options.memberId);
  if (
    action === 'role' &&
    !['ORGANIZER', 'MODERATOR', 'ATTENDEE'].includes(String(options.role))
  )
    throw new CliError(
      'USAGE',
      '--role must be ORGANIZER, MODERATOR, or ATTENDEE.',
      2
    );
  if (action === 'settings') {
    const body = options.body ?? {};
    if (
      Object.keys(body).some(
        name => !['visibility', 'permissions'].includes(name)
      ) ||
      !Object.keys(body).length
    )
      throw new CliError(
        'USAGE',
        'Specify event visibility or at least one permission.',
        2
      );
    if (
      body.visibility !== undefined &&
      !['PRIVATE', 'FRIENDS', 'PUBLIC'].includes(String(body.visibility))
    )
      throw new CliError('USAGE', 'Invalid event visibility.', 2);
    if (body.permissions !== undefined) {
      const permissions = record(body.permissions);
      if (
        !Object.keys(permissions).length ||
        Object.entries(permissions).some(
          ([name, level]) =>
            !['createPosts', 'inviteMembers', 'viewAttendeeList'].includes(
              name
            ) || !['EVERYONE', 'MODERATOR', 'ORGANIZER'].includes(String(level))
        )
      )
        throw new CliError('USAGE', 'Invalid event permissions.', 2);
    }
  }
  await supported(profile, key);
  const suffix =
    action === 'role' || action === 'remove'
      ? `/members/${options.memberId}`
      : action === 'delete'
        ? ''
        : `/${action}`;
  const method =
    action === 'delete' || action === 'remove'
      ? 'DELETE'
      : action === 'settings' || action === 'role'
        ? 'PATCH'
        : 'POST';
  const recovery = `Inspect events list, events get ${eventId}, and events members ${eventId} --profile ${profile.name} before another operation; this write was not retried.`;
  const value = await mutateApi(profile, key, `/events/${eventId}${suffix}`, {
    method,
    body: action === 'role' ? { role: options.role } : (options.body ?? {}),
    recovery,
    ...(['delete', 'leave', 'remove', 'role'].includes(action)
      ? {
          confirmation: {
            target: `${action === 'role' ? `changing membership ${options.memberId} to ${options.role} in` : action === 'remove' ? `removing membership ${options.memberId} from` : action === 'delete' ? 'deleting' : 'leaving'} event ${eventId} on profile ${profile.name} (${profile.apiUrl})`,
            yes: options.yes,
            json: options.json,
          },
        }
      : {}),
  });
  try {
    if (action === 'delete' || action === 'remove') {
      if (value !== null) throw Error('Expected no content');
      return action === 'delete'
        ? { eventId, deleted: true }
        : { eventId, membershipId: options.memberId, removed: true };
    }
    const result = record(value);
    if (action === 'leave') {
      if (typeof result.message !== 'string')
        throw Error('Invalid leave result');
      return { eventId, left: true };
    }
    if (action === 'join') {
      if (
        typeof result.membershipId !== 'string' ||
        result.success !== true ||
        result.role !== 'ATTENDEE' ||
        result.rsvpStatus !== 'PENDING'
      )
        throw Error('Invalid join result');
      return {
        eventId,
        membershipId: result.membershipId,
        joined: true,
        role: result.role,
        rsvpStatus: result.rsvpStatus,
      };
    }
    if (action === 'role') {
      if (result.id !== options.memberId || result.role !== options.role)
        throw Error('Invalid role result');
      return { eventId, membershipId: result.id, role: result.role };
    }
    const settings = settingsResult(result);
    if (settings.eventId !== eventId) throw Error('Invalid settings target');
    return settings;
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The operation response was incomplete. ${recovery}`,
      5
    );
  }
}
/** @param {Profile} profile @param {string} key @param {{limit:number,cursor?:string,all?:boolean}} options */
export async function discoverEvents(profile, key, options) {
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  )
    throw new CliError('USAGE', '--limit must be an integer from 1 to 100.', 2);
  let cursor = options.cursor;
  const seen = new Set(cursor ? [cursor] : []),
    items = [];
  do {
    const query = new URLSearchParams({
      pagination: 'cursor',
      limit: String(options.limit),
    });
    if (cursor) query.set('cursor', cursor);
    const page = record(
      await readApi(profile, key, `/events/discover?${query}`)
    );
    if (
      !Array.isArray(page.items) ||
      !(
        page.nextCursor === null ||
        (typeof page.nextCursor === 'string' && page.nextCursor.length)
      )
    )
      throw new CliError('INVALID_RESPONSE', 'Invalid discovery page.', 5);
    for (const item of page.items) {
      const row = record(item);
      if (typeof row.id !== 'string' || typeof row.title !== 'string')
        throw new CliError('INVALID_RESPONSE', 'Invalid discovered event.', 5);
      items.push({
        id: row.id,
        title: row.title,
        description: row.description,
        location: row.location,
        chosenDateTime: row.chosenDateTime,
        imageUrl: row.imageUrl,
        organizer:
          row.organizer && typeof row.organizer === 'object'
            ? {
                personId: record(row.organizer).personId,
                name: record(row.organizer).name,
                username: record(row.organizer).username,
              }
            : null,
      });
    }
    if (!options.all || page.nextCursor === null)
      return { items, nextCursor: page.nextCursor };
    if (seen.has(page.nextCursor))
      throw new CliError(
        'INVALID_RESPONSE',
        'Repeated discovery cursor; retrieval stopped.',
        5
      );
    seen.add(page.nextCursor);
    cursor = page.nextCursor;
  } while (cursor);
  throw new CliError('INVALID_RESPONSE', 'Incomplete discovery page.', 5);
}
