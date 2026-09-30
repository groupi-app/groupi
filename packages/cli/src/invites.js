import { randomUUID } from 'node:crypto';
import { CliError } from './errors.js';
import { validateRequestId, parseDateTime } from './event-input.js';
import { mutateApi } from './mutations.js';
import { readApi } from './transport.js';

/** @typedef {{apiUrl:string,name:string}} Profile */
/** @typedef {{yes?:boolean,json?:boolean,requestId?:string}} WriteOptions */
/** @param {string} message @returns {never} */
function invalid(message) {
  throw new CliError('USAGE', message, 2);
}
/** @param {string} value @param {string} kind */
export function inviteIdentifier(value, kind = 'invitation ID') {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,512}$/.test(value))
    invalid(
      `Provide a valid ${kind}; use an ID or token, not an invitation URL.`
    );
  return value;
}
/** @param {unknown} value @param {string} name @param {number} maximum @param {boolean} [required] */
function text(value, name, maximum, required = false) {
  if (
    typeof value !== 'string' ||
    value.length > maximum ||
    (required && !value.trim())
  )
    invalid(
      `${name} must be ${required ? 'nonempty text of ' : 'text of '}at most ${maximum} characters.`
    );
  return value;
}
/** @param {unknown} value @param {string} name @param {number} minimum @param {number} [maximum] */
function integer(value, name, minimum, maximum = Number.MAX_SAFE_INTEGER) {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    !/^\d+$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < minimum ||
    Number(value) > maximum
  )
    invalid(`${name} must be a safe integer from ${minimum} to ${maximum}.`);
  return Number(value);
}
/** @param {Record<string,unknown>} input @param {boolean} editing */
export function linkInput(input, editing = false) {
  /** @type {Record<string,unknown>} */ const body = {};
  if (input.name !== undefined) body.name = text(input.name, '--name', 200);
  if (input.uses !== undefined)
    body.maxUses = integer(input.uses, '--uses', 1, 10000);
  if (input.requestId !== undefined) validateRequestId(String(input.requestId));
  if (input.expires !== undefined) {
    if (
      parseDateTime(input.expires) <= Date.now() &&
      (editing || input.requestId === undefined)
    )
      invalid('--expires must be in the future.');
    body.expiresAt = input.expires;
  }
  if (editing && input.unlimited) {
    if (input.uses !== undefined)
      invalid('Use --uses or --unlimited, not both.');
    body.maxUses = null;
  }
  if (editing && input.expiry === false) {
    if (input.expires !== undefined)
      invalid('Use --expires or --no-expiry, not both.');
    body.expiresAt = null;
  }
  if (editing && !Object.keys(body).length)
    invalid(
      'Provide an invitation edit: --name, --uses, --unlimited, --expires, or --no-expiry.'
    );
  return body;
}

/** @param {Record<string,unknown>} body @param {string[]} allowed */
function fields(body, allowed) {
  if (Object.keys(body).some(key => !allowed.includes(key)))
    invalid(
      'Unsupported invitation input field. Use this command’s --help for supported inputs.'
    );
}
/** @param {Record<string,unknown>} body @param {boolean} editing @param {string} [requestId] */
function linkBody(body, editing, requestId) {
  fields(body, ['name', 'maxUses', 'expiresAt']);
  return linkInput(
    {
      name: body.name,
      uses: body.maxUses === null && editing ? undefined : body.maxUses,
      unlimited: body.maxUses === null && editing,
      expires: body.expiresAt === null && editing ? undefined : body.expiresAt,
      expiry: body.expiresAt === null && editing ? false : undefined,
      requestId,
    },
    editing
  );
}

/** @param {unknown} value @returns {Record<string,unknown>} */
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned an invalid invitation result.',
      5
    );
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {unknown} value @param {string[]} required @param {string[]} [optional] */
function project(value, required, optional = []) {
  const result = record(value);
  for (const key of required)
    if (!(key in result))
      throw new CliError(
        'INVALID_RESPONSE',
        'The server returned an incomplete invitation result.',
        5
      );
  return Object.fromEntries(
    [...required, ...optional]
      .filter(key => key in result)
      .map(key => [key, result[key]])
  );
}
/** @param {unknown} value */
function createdLink(value) {
  const result = project(value, ['id', 'token']);
  if (typeof result.id !== 'string' || typeof result.token !== 'string')
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned an invalid invitation identity.',
      5
    );
  return { id: result.id, token: result.token };
}
/** @param {Profile} profile @param {string} key */
async function requireInviteWrites(profile, key) {
  const health = record(await readApi(profile, key, '/health'));
  const capabilities =
    health.capabilities && typeof health.capabilities === 'object'
      ? record(health.capabilities)
      : {};
  const writes =
    capabilities.inviteWrites && typeof capabilities.inviteWrites === 'object'
      ? record(capabilities.inviteWrites)
      : {};
  if (writes.version !== 1 || writes.retentionMs !== 86400000)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'This server does not advertise supported invitation writes and 24-hour replay protection. Update the server; no write was sent.',
      5
    );
}
/** @param {Profile} profile @param {string} key @param {string} eventId @param {Record<string,unknown>} body @param {string} [requestId] */
export async function createLink(
  profile,
  key,
  eventId,
  body,
  requestId = `${Date.now()}.${randomUUID()}`
) {
  inviteIdentifier(eventId, 'event ID');
  validateRequestId(requestId);
  body = linkBody(body, false, requestId);
  await requireInviteWrites(profile, key);
  const recovery = `Inspect invites links list ${eventId} --profile ${profile.name}, or retry the same inputs with --request-id ${requestId} within 24 hours. Do not generate a new identifier for an uncertain write.`;
  const result = await mutateApi(profile, key, `/events/${eventId}/invites`, {
    method: 'POST',
    body,
    requestId,
    recovery,
    expiredRecovery: `Inspect invites links list ${eventId} --profile ${profile.name} before deliberately repeating the operation with a new request identifier.`,
  });
  try {
    return { ...createdLink(result), requestId };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The creation response was incomplete. ${recovery}`,
      5
    );
  }
}

/** @param {Record<string,unknown>} input */
export function emailInput(input) {
  let recipients;
  try {
    recipients = JSON.parse(/** @type {string} */ (input.invites));
  } catch {
    invalid(
      '--invites must be a JSON array of {email,recipientName?,plusOnes?}.'
    );
  }
  if (
    !Array.isArray(recipients) ||
    recipients.length < 1 ||
    recipients.length > 100
  )
    invalid('--invites must contain between 1 and 100 recipients.');
  const invites = /** @type {unknown[]} */ (recipients).map(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      invalid('Every email invitation must be an object.');
    const recipient = /** @type {Record<string,unknown>} */ (value);
    if (
      Object.keys(recipient).some(
        key => !['email', 'recipientName', 'plusOnes'].includes(key)
      )
    )
      invalid(
        'Email invitations accept only email, recipientName, and plusOnes.'
      );
    const email = text(recipient.email, 'email', 254, true).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      invalid('Provide a valid recipient email address.');
    return {
      email,
      ...(recipient.recipientName !== undefined
        ? { recipientName: text(recipient.recipientName, 'recipientName', 200) }
        : {}),
      ...(recipient.plusOnes !== undefined
        ? { plusOnes: integer(recipient.plusOnes, 'plusOnes', 0, 99) }
        : {}),
    };
  });
  /** @type {Record<string,unknown>} */ const body = {
    invites,
    send: input.send !== false,
  };
  if (input.message !== undefined)
    body.customMessage = text(input.message, '--message', 480);
  if (input.requestId !== undefined) validateRequestId(String(input.requestId));
  if (input.expires !== undefined) {
    if (
      parseDateTime(input.expires) <= Date.now() &&
      input.requestId === undefined
    )
      invalid('--expires must be in the future.');
    body.expiresAt = input.expires;
  }
  return body;
}
/** @param {unknown} value @param {boolean} pending */
function emailResult(value, pending) {
  const data = project(
    value,
    pending ? ['queuedCount'] : ['createdCount', 'inviteIds', 'queuedCount']
  );
  if (
    !Number.isSafeInteger(data.queuedCount) ||
    Number(data.queuedCount) < 0 ||
    (!pending &&
      (!Number.isSafeInteger(data.createdCount) ||
        Number(data.createdCount) < 0 ||
        !Array.isArray(data.inviteIds) ||
        !data.inviteIds.every(id => typeof id === 'string')))
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned an invalid email queue result.',
      5
    );
  return data;
}
/** @param {Profile} profile @param {string} key @param {string} eventId @param {Record<string,unknown>} body @param {string} [requestId] @param {boolean} [pending] */
export async function sendEmails(
  profile,
  key,
  eventId,
  body,
  requestId = `${Date.now()}.${randomUUID()}`,
  pending = false
) {
  inviteIdentifier(eventId, 'event ID');
  validateRequestId(requestId);
  if (pending) fields(body, []);
  else {
    fields(body, ['invites', 'customMessage', 'expiresAt', 'send']);
    if (body.send !== undefined && typeof body.send !== 'boolean')
      invalid('send must be a boolean.');
    body = emailInput({
      invites: JSON.stringify(body.invites),
      message: body.customMessage,
      expires: body.expiresAt,
      send: body.send,
      requestId,
    });
  }
  await requireInviteWrites(profile, key);
  const recovery = `Inspect invites links list ${eventId} --kind email --profile ${profile.name}, or retry the same inputs with --request-id ${requestId} within 24 hours. Do not use a new identifier for an uncertain send.`;
  const value = await mutateApi(
    profile,
    key,
    `/events/${eventId}/invites/${pending ? 'send-pending' : 'email'}`,
    {
      method: 'POST',
      body,
      requestId,
      recovery,
      expiredRecovery: `Inspect invites links list ${eventId} --kind email --profile ${profile.name} before deliberately repeating the operation with a new request identifier.`,
    }
  );
  try {
    return { ...emailResult(value, pending), requestId };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The email queue response was incomplete. ${recovery}`,
      5
    );
  }
}

/** @param {Record<string,unknown>} input */
export function memberInput(input) {
  const username = text(input.username, '--username', 101, true)
    .trim()
    .replace(/^@/, '')
    .toLowerCase();
  if (username.length < 2 || username.length > 100 || /\s/.test(username))
    invalid('Provide a username of 2 to 100 characters without spaces.');
  /** @type {Record<string,unknown>} */ const body = { username };
  if (input.role !== undefined) {
    if (!['ATTENDEE', 'MODERATOR'].includes(String(input.role)))
      invalid('--role must be ATTENDEE or MODERATOR.');
    body.role = input.role;
  }
  if (input.message !== undefined)
    body.message = text(input.message, '--message', 480);
  return body;
}
/** @param {unknown} value */
function memberSummary(value) {
  const result = project(value, [
    'inviteId',
    'eventId',
    'eventTitle',
    'inviterId',
    'inviteeId',
    'role',
    'status',
    'message',
    'createdAt',
    'respondedAt',
  ]);
  for (const field of [
    'inviteId',
    'eventId',
    'eventTitle',
    'inviterId',
    'inviteeId',
  ])
    if (typeof result[field] !== 'string')
      throw new CliError(
        'INVALID_RESPONSE',
        'Invalid member invitation details.',
        5
      );
  if (
    !['ATTENDEE', 'MODERATOR'].includes(String(result.role)) ||
    !['PENDING', 'ACCEPTED', 'DECLINED'].includes(String(result.status)) ||
    !(result.message === null || typeof result.message === 'string') ||
    !Number.isFinite(result.createdAt) ||
    !(result.respondedAt === null || Number.isFinite(result.respondedAt))
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid member invitation details.',
      5
    );
  return result;
}
/** @param {unknown} value */
function membership(value) {
  const result = project(value, ['eventId', 'membershipId']);
  if (
    typeof result.eventId !== 'string' ||
    typeof result.membershipId !== 'string'
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid accepted invitation result.',
      5
    );
  return result;
}
/** @param {Profile} profile @param {string} key @param {string} eventId @param {Record<string,unknown>} body @param {string} [requestId] */
export async function sendMemberInvite(
  profile,
  key,
  eventId,
  body,
  requestId = `${Date.now()}.${randomUUID()}`
) {
  inviteIdentifier(eventId, 'event ID');
  validateRequestId(requestId);
  fields(body, ['username', 'role', 'message']);
  body = memberInput(body);
  await requireInviteWrites(profile, key);
  const recovery = `Inspect invites members list ${eventId} --profile ${profile.name}, or retry identical inputs with --request-id ${requestId} within 24 hours. Do not use a new identifier for an uncertain send.`;
  const value = await mutateApi(
    profile,
    key,
    `/events/${eventId}/member-invites`,
    {
      method: 'POST',
      body,
      requestId,
      recovery,
      expiredRecovery: `Inspect invites members list ${eventId} --profile ${profile.name} before deliberately repeating the operation with a new request identifier.`,
    }
  );
  try {
    const result = project(value, ['inviteId', 'status']);
    if (typeof result.inviteId !== 'string' || result.status !== 'PENDING')
      throw Error();
    return { inviteId: result.inviteId, status: result.status, requestId };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The invitation response was incomplete. ${recovery}`,
      5
    );
  }
}
/** @param {Profile} profile @param {string} key @param {string} id @param {'accept'|'decline'|'revoke'} action @param {WriteOptions} [options] */
export async function respondMemberInvite(
  profile,
  key,
  id,
  action,
  options = {}
) {
  inviteIdentifier(id);
  await requireInviteWrites(profile, key);
  const recovery = `Inspect invites members get ${id} --profile ${profile.name} and events list before repeating this action; this write was not retried.`;
  const value = await mutateApi(
    profile,
    key,
    `/member-invites/${id}${action === 'revoke' ? '' : `/${action}`}`,
    {
      method: action === 'revoke' ? 'DELETE' : 'POST',
      body: {},
      recovery,
      ...(action !== 'accept'
        ? {
            confirmation: {
              target: `${action === 'revoke' ? 'revoking' : 'declining'} member invitation ${id} on profile ${profile.name} (${profile.apiUrl})`,
              ...options,
            },
          }
        : {}),
    }
  );
  try {
    if (action === 'accept') return membership(value);
    const result = project(value, ['success']);
    if (result.success !== true) throw Error();
    return { success: true };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The response was incomplete. ${recovery}`,
      5
    );
  }
}
/** @param {unknown} value */
function linkSummary(value) {
  const result = project(value, [
    'id',
    'eventId',
    'token',
    'name',
    'maxUses',
    'usesTotal',
    'usesRemaining',
    'expiresAt',
    'createdAt',
    'kind',
    'email',
    'recipientName',
    'customMessage',
    'emailStatus',
  ]);
  for (const field of ['id', 'eventId', 'token'])
    if (typeof result[field] !== 'string')
      throw new CliError(
        'INVALID_RESPONSE',
        'Invalid bearer invitation details.',
        5
      );
  for (const field of ['name', 'email', 'recipientName', 'customMessage'])
    if (result[field] !== null && typeof result[field] !== 'string')
      throw new CliError(
        'INVALID_RESPONSE',
        'Invalid bearer invitation text.',
        5
      );
  for (const field of ['maxUses', 'usesTotal', 'usesRemaining', 'expiresAt'])
    if (result[field] !== null && !Number.isFinite(result[field]))
      throw new CliError(
        'INVALID_RESPONSE',
        'Invalid bearer invitation limits.',
        5
      );
  if (
    !['link', 'email'].includes(String(result.kind)) ||
    ![null, 'pending', 'queued'].includes(
      /** @type {null|string} */ (result.emailStatus)
    ) ||
    !Number.isFinite(result.createdAt)
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid bearer invitation status.',
      5
    );
  return result;
}
/** @param {unknown} value */
function publicLink(value) {
  const result = project(value, [
    'id',
    'eventId',
    'eventTitle',
    'eventDescription',
    'eventLocation',
    'name',
    'expired',
    'maxUsesReached',
  ]);
  for (const field of ['id', 'eventId', 'eventTitle'])
    if (typeof result[field] !== 'string')
      throw new CliError(
        'INVALID_RESPONSE',
        'Invalid invitation inspection result.',
        5
      );
  for (const field of ['eventDescription', 'eventLocation', 'name'])
    if (result[field] !== null && typeof result[field] !== 'string')
      throw new CliError(
        'INVALID_RESPONSE',
        'Invalid invitation inspection result.',
        5
      );
  if (
    typeof result.expired !== 'boolean' ||
    typeof result.maxUsesReached !== 'boolean'
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid invitation inspection status.',
      5
    );
  return result;
}
/** @param {Profile} profile @param {string} key @param {'links'|'members'} kind @param {string} id */
export async function getInvite(profile, key, kind, id) {
  inviteIdentifier(id, kind === 'links' ? 'invitation token' : 'invitation ID');
  const value = await readApi(
    profile,
    key,
    `/${kind === 'links' ? 'invites' : 'member-invites'}/${id}`
  );
  return kind === 'links' ? publicLink(value) : memberSummary(value);
}
/** @param {Profile} profile @param {string} key @param {'links'|'members'} kind @param {string|undefined} eventId @param {{limit:number,cursor?:string,all?:boolean,status?:string,kind?:string}} options */
export async function listInvites(profile, key, kind, eventId, options) {
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  )
    invalid('--limit must be an integer from 1 to 100.');
  if (
    options.status !== undefined &&
    !['PENDING', 'ACCEPTED', 'DECLINED', 'all'].includes(options.status)
  )
    invalid('Unsupported invitation status filter.');
  if (
    options.kind !== undefined &&
    !['link', 'email', 'all'].includes(options.kind)
  )
    invalid('Unsupported invitation kind filter.');
  if (kind === 'links' && eventId === undefined)
    invalid('Provide an event ID for bearer invitation listing.');
  if (eventId !== undefined) inviteIdentifier(eventId, 'event ID');
  const path = eventId
    ? `/events/${eventId}/${kind === 'links' ? 'invites' : 'member-invites'}`
    : '/member-invites';
  let cursor = options.cursor;
  const items = [];
  const seen = new Set(cursor ? [cursor] : []);
  do {
    const query = new URLSearchParams({
      pagination: 'cursor',
      limit: String(options.limit),
    });
    if (cursor) query.set('cursor', cursor);
    if (options.status) query.set('status', options.status);
    if (options.kind) query.set('kind', options.kind);
    const page = record(await readApi(profile, key, `${path}?${query}`));
    if (
      !Array.isArray(page.items) ||
      !(
        page.nextCursor === null ||
        (typeof page.nextCursor === 'string' && page.nextCursor.length > 0)
      )
    )
      throw new CliError(
        'INVALID_RESPONSE',
        'Expected a cursor-paginated invitation page; update the server if needed.',
        5
      );
    items.push(
      ...page.items.map(kind === 'links' ? linkSummary : memberSummary)
    );
    if (!options.all || page.nextCursor === null)
      return { items, nextCursor: page.nextCursor };
    if (seen.has(page.nextCursor))
      throw new CliError(
        'INVALID_RESPONSE',
        'Server repeated a pagination cursor; retrieval stopped.',
        5
      );
    seen.add(page.nextCursor);
    cursor = page.nextCursor;
  } while (cursor);
  throw new CliError('INVALID_RESPONSE', 'Incomplete invitation page.', 5);
}

/** @param {Profile} profile @param {string} key @param {string} id @param {'edit'|'revoke'|'accept'} action @param {Record<string,unknown>} [body] @param {WriteOptions} [options] */
export async function manageLink(
  profile,
  key,
  id,
  action,
  body = {},
  options = {}
) {
  inviteIdentifier(
    id,
    action === 'accept' ? 'invitation token' : 'invitation ID'
  );
  if (action === 'edit') body = linkBody(body, true);
  else fields(body, []);
  await requireInviteWrites(profile, key);
  // Tokens are bearer secrets. Recovery errors must never echo them.
  const recovery = `Inspect invites links list for the event on profile ${profile.name}, and events list after acceptance, before deciding whether another write is needed; this write was not retried.`;
  const result = await mutateApi(
    profile,
    key,
    `/invites/${id}${action === 'accept' ? '/accept' : ''}`,
    {
      method:
        action === 'edit' ? 'PATCH' : action === 'revoke' ? 'DELETE' : 'POST',
      body,
      recovery,
      ...(action !== 'accept'
        ? {
            confirmation: {
              target: `${action === 'edit' ? 'changing access through' : 'revoking'} bearer invitation ${id} on profile ${profile.name} (${profile.apiUrl})`,
              ...options,
            },
          }
        : {}),
    }
  );
  try {
    if (action === 'accept') return membership(result);
    if (action === 'revoke') {
      if (result !== null) throw Error();
      return { id, revoked: true };
    }
    const updated = linkSummary(result);
    if (updated.id !== id) throw Error();
    return updated;
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The invitation response was incomplete. ${recovery}`,
      5
    );
  }
}
