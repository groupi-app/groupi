import { CliError } from './errors.js';
import { mutateApi } from './mutations.js';
import { readApi } from './transport.js';
import { randomUUID } from 'node:crypto';
import { validateRequestId } from './event-input.js';

/** @typedef {{apiUrl:string,name:string}} Profile */
/** @param {string} message @returns {never} */
function invalid(message) {
  throw new CliError('USAGE', message, 2);
}
/** @param {unknown} value @param {string} label */
function identifier(value, label) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,200}$/.test(value))
    invalid(`Provide a valid ${label}.`);
  return value;
}
/** @param {unknown} value @returns {Record<string,unknown>} */
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned invalid invite list data.',
      5
    );
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {unknown} value */
function person(value) {
  const data = record(value);
  if (
    typeof data.personId !== 'string' ||
    typeof data.available !== 'boolean' ||
    !['name', 'username', 'image'].every(
      field => data[field] === null || typeof data[field] === 'string'
    )
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned invalid selectable person data.',
      5
    );
  return {
    personId: data.personId,
    name: data.available ? data.name : null,
    username: data.available ? data.username : null,
    image: data.available ? data.image : null,
    available: data.available,
  };
}
/** @param {unknown} value @param {boolean} [includePeople] */
function listData(value, includePeople = false) {
  const data = record(value);
  if (
    typeof data.inviteListId !== 'string' ||
    typeof data.name !== 'string' ||
    !Number.isSafeInteger(data.personCount) ||
    Number(data.personCount) < 0 ||
    Number(data.personCount) > 100 ||
    !Number.isSafeInteger(data.availablePersonCount) ||
    Number(data.availablePersonCount) < 0 ||
    Number(data.availablePersonCount) > Number(data.personCount) ||
    typeof data.needsAttention !== 'boolean' ||
    data.needsAttention !== (data.availablePersonCount === 0) ||
    !Number.isFinite(data.createdAt) ||
    !Number.isFinite(data.updatedAt)
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned invalid invite list details.',
      5
    );
  const summary = {
    inviteListId: data.inviteListId,
    name: data.name,
    personCount: data.personCount,
    availablePersonCount: data.availablePersonCount,
    needsAttention: data.needsAttention,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
  if (!includePeople) return summary;
  if (!Array.isArray(data.people) || data.people.length !== data.personCount)
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned invalid invite list people.',
      5
    );
  const people = data.people.map(person);
  if (
    people.filter(row => row.available).length !== data.availablePersonCount ||
    new Set(people.map(row => row.personId)).size !== people.length
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned inconsistent invite list people and counts.',
      5
    );
  return { ...summary, people };
}
/** @param {Profile} profile @param {string} key @param {number} [minimumVersion] */
async function requireInviteLists(profile, key, minimumVersion = 1) {
  const health = record(await readApi(profile, key, '/health'));
  const capabilities =
    health.capabilities && typeof health.capabilities === 'object'
      ? record(health.capabilities)
      : {};
  const lists =
    capabilities.inviteLists && typeof capabilities.inviteLists === 'object'
      ? record(capabilities.inviteLists)
      : {};
  if (
    !Number.isSafeInteger(lists.version) ||
    Number(lists.version) < minimumVersion ||
    (minimumVersion >= 2 && lists.retentionMs !== 86400000)
  )
    throw new CliError(
      'UNSUPPORTED_SERVER',
      minimumVersion >= 2
        ? 'This server does not advertise supported invite list management and 24-hour invitation replay protection. Update the server; no write was sent.'
        : 'This server does not advertise supported private invite lists. Update the server.',
      5
    );
}
/** @param {unknown} value */
function listName(value) {
  if (
    typeof value !== 'string' ||
    value.trim().length < 1 ||
    value.trim().length > 100
  )
    invalid('--name must contain 1 to 100 characters after trimming.');
  return value.trim();
}
/** @param {unknown} value */
function selectedPeople(value) {
  let values;
  try {
    values = JSON.parse(String(value));
  } catch {
    invalid('--person-ids must be a JSON array of existing person IDs.');
  }
  if (!Array.isArray(values))
    invalid('--person-ids must be a JSON array of existing person IDs.');
  const personIds = [
    ...new Set(values.map(value => identifier(value, 'person ID'))),
  ];
  if (personIds.length < 1 || personIds.length > 100)
    invalid('Select 1 to 100 distinct existing people.');
  return personIds;
}
/** @param {Record<string,unknown>} input */
export function inviteListInput(input) {
  return {
    name: listName(input.name),
    personIds: selectedPeople(input.personIds),
  };
}
/** @param {Record<string,unknown>} input */
export function inviteListEditInput(input) {
  /** @type {{name?:string,personIds?:string[]}} */ const body = {};
  if (input.name !== undefined) body.name = listName(input.name);
  if (input.personIds !== undefined)
    body.personIds = selectedPeople(input.personIds);
  if (!Object.keys(body).length)
    invalid('Provide --name or --person-ids to edit this invite list.');
  return body;
}
/** @param {Profile} profile @param {string} key @param {{name:string,personIds:string[]}} body */
export async function createInviteList(profile, key, body) {
  await requireInviteLists(profile, key);
  const recovery = `Inspect invite-lists list --profile ${profile.name} before deciding whether another creation is needed; this write was not retried.`;
  const value = await mutateApi(profile, key, '/invite-lists', {
    method: 'POST',
    body,
    recovery,
    validationGuidance:
      'Check that the trimmed name has 1–100 characters and is unique ignoring case among your lists, you own fewer than 100 lists, and you selected 1–100 distinct existing people.',
  });
  try {
    return listData(value, true);
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The invite list response was incomplete. ${recovery}`,
      5
    );
  }
}

/** @param {Profile} profile @param {string} key */
export async function listInviteLists(profile, key) {
  await requireInviteLists(profile, key);
  const data = record(await readApi(profile, key, '/invite-lists'));
  if (!Array.isArray(data.items) || data.items.length > 100)
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned an invalid invite list collection.',
      5
    );
  return { items: data.items.map(value => listData(value)) };
}
/** @param {Profile} profile @param {string} key @param {string} id */
export async function getInviteList(profile, key, id) {
  identifier(id, 'invite list ID');
  await requireInviteLists(profile, key);
  return listData(await readApi(profile, key, `/invite-lists/${id}`), true);
}

/** @param {Profile} profile @param {string} key @param {string} id @param {{name?:string,personIds?:string[]}} body */
export async function editInviteList(profile, key, id, body) {
  identifier(id, 'invite list ID');
  await requireInviteLists(profile, key, 2);
  const recovery = `Inspect invite-lists get ${id} --profile ${profile.name} before deciding whether another edit is needed; this write was not retried.`;
  const value = await mutateApi(profile, key, `/invite-lists/${id}`, {
    method: 'PATCH',
    body,
    recovery,
    validationGuidance:
      'Check that the name has 1–100 trimmed characters and remains unique ignoring case, and the saved list contains 1–100 distinct existing people. No edit was applied.',
  });
  try {
    const result = listData(value, true);
    if (result.inviteListId !== id) throw Error();
    return result;
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The invite list response was incomplete. ${recovery}`,
      5
    );
  }
}

/** @param {Profile} profile @param {string} key @param {string} id @param {{yes?:boolean,json?:boolean}} options */
export async function deleteInviteList(profile, key, id, options) {
  identifier(id, 'invite list ID');
  await requireInviteLists(profile, key, 2);
  const recovery = `Inspect invite-lists list and invite-lists get ${id} --profile ${profile.name} before deciding whether another deletion is needed; this write was not retried.`;
  const value = await mutateApi(profile, key, `/invite-lists/${id}`, {
    method: 'DELETE',
    body: {},
    recovery,
    confirmation: {
      target: `deleting private invite list ${id} on profile ${profile.name} (${profile.apiUrl})`,
      ...options,
    },
  });
  try {
    const data = record(value);
    if (data.deleted !== true || data.inviteListId !== id) throw Error();
    return { deleted: true, inviteListId: id };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The deletion response was incomplete. ${recovery}`,
      5
    );
  }
}

/** @param {{search?:string,friends?:boolean}} input */
export function peopleInput(input) {
  if ((input.search !== undefined) === !!input.friends)
    invalid('Choose either --search <username> or --friends.');
  if (
    input.search !== undefined &&
    (input.search.trim().length < 2 || input.search.trim().length > 100)
  )
    invalid('--search must contain 2 to 100 characters after trimming.');
  return input.friends
    ? '/invite-lists/people/friends'
    : `/invite-lists/people/search?${new URLSearchParams({ q: String(input.search).trim() })}`;
}
/** @param {Profile} profile @param {string} key @param {string} path */
export async function selectablePeople(profile, key, path) {
  await requireInviteLists(profile, key);
  const data = record(await readApi(profile, key, path));
  if (!Array.isArray(data.items))
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned invalid selectable people.',
      5
    );
  const items = data.items.map(person);
  if (items.some(row => !row.available))
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned an unavailable selectable person.',
      5
    );
  return { items };
}

/** @param {Record<string,unknown>} input */
export function inviteListEventInput(input) {
  const eventId = identifier(input.event, 'event ID');
  const role = input.role ?? 'ATTENDEE';
  if (role !== 'ATTENDEE' && role !== 'MODERATOR')
    invalid('--role must be ATTENDEE or MODERATOR.');
  /** @type {{eventId:string,role:'ATTENDEE'|'MODERATOR',message?:string}} */ const body =
    { eventId, role };
  if (input.message !== undefined) {
    if (typeof input.message !== 'string' || input.message.length > 480)
      invalid('--message must be text of at most 480 characters.');
    body.message = input.message;
  }
  if (input.requestId !== undefined) validateRequestId(String(input.requestId));
  return body;
}
/** @param {unknown} value @param {string} eventId */
function invitationResult(value, eventId) {
  const data = record(value);
  if (
    data.eventId !== eventId ||
    !['totalCount', 'sentCount', 'skippedCount'].every(
      field =>
        Number.isSafeInteger(data[field]) &&
        Number(data[field]) >= 0 &&
        Number(data[field]) <= 100
    ) ||
    data.totalCount !== Number(data.sentCount) + Number(data.skippedCount) ||
    !Array.isArray(data.results) ||
    data.results.length !== data.totalCount
  )
    throw Error();
  const results = data.results.map(value => {
    const row = record(value);
    if (typeof row.personId !== 'string' || !row.personId) throw Error();
    if (
      row.status === 'sent' &&
      typeof row.inviteId === 'string' &&
      row.inviteId
    )
      return { personId: row.personId, status: 'sent', inviteId: row.inviteId };
    if (
      row.status === 'skipped' &&
      ['ALREADY_MEMBER', 'INVITATION_PENDING', 'UNAVAILABLE'].includes(
        String(row.reason)
      )
    )
      return { personId: row.personId, status: 'skipped', reason: row.reason };
    throw Error();
  });
  if (
    new Set(results.map(row => row.personId)).size !== results.length ||
    results.filter(row => row.status === 'sent').length !== data.sentCount ||
    results.filter(row => row.status === 'skipped').length !== data.skippedCount
  )
    throw Error();
  return {
    eventId,
    totalCount: data.totalCount,
    sentCount: data.sentCount,
    skippedCount: data.skippedCount,
    results,
  };
}
/** @param {Profile} profile @param {string} key @param {string} id @param {{eventId:string,role:'ATTENDEE'|'MODERATOR',message?:string}} body @param {string} [requestId] */
export async function inviteListToEvent(
  profile,
  key,
  id,
  body,
  requestId = `${Date.now()}.${randomUUID()}`
) {
  identifier(id, 'invite list ID');
  validateRequestId(requestId);
  await requireInviteLists(profile, key, 2);
  const recovery = `Inspect invites members list ${body.eventId} --profile ${profile.name}, or retry the identical original inputs with --request-id ${requestId} within 24 hours. Keep the original profile and request identifier; do not use a new identifier for an uncertain send.`;
  const value = await mutateApi(
    profile,
    key,
    `/invite-lists/${id}/invite-to-event`,
    {
      method: 'POST',
      body,
      requestId,
      recovery,
      expiredRecovery: `Inspect invites members list ${body.eventId} --profile ${profile.name} before deliberately sending the list's current people with a new request identifier.`,
      validationGuidance: `Check the event and owned list IDs, select ATTENDEE or MODERATOR (organizers only), and use a message of at most 480 characters. The list must have existing people and no more than 100 distinct recipients. If the list Needs attention, add at least one existing person with invite-lists edit ${id} --person-ids <json> on the original profile; no invitations were sent.`,
    }
  );
  try {
    return { ...invitationResult(value, body.eventId), requestId };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The invitation result was incomplete. ${recovery}`,
      5
    );
  }
}
