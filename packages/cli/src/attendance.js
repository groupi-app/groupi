import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
import { parseDateTime } from './event-input.js';

/** @typedef {{name:string,apiUrl:string}} Profile */
/** @typedef {{yes?:boolean,json?:boolean}} Confirmation */
const statuses = ['YES', 'MAYBE', 'NO', 'PENDING'];
/** @param {string} message @returns {never} */
function invalid(message) {
  throw new CliError('USAGE', message, 2);
}
/** @param {string} value @param {string} [label] */
function identifier(value, label = 'event ID') {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,512}$/.test(value))
    invalid(`Provide a valid ${label}.`);
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
      'The server returned incomplete attendance data. Update the server if needed.',
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
      'The server returned invalid attendance data.',
      5
    );
}
/** @param {unknown} value */
function nullableText(value) {
  return value === null || typeof value === 'string';
}
/** @param {unknown} value */
function rsvpResult(value) {
  const result = pick(value, ['membershipId', 'rsvpStatus', 'rsvpNote']);
  valid(
    typeof result.membershipId === 'string' &&
      statuses.includes(String(result.rsvpStatus)) &&
      nullableText(result.rsvpNote)
  );
  return result;
}
/** @param {unknown} note */
function checkNote(note) {
  if (note !== undefined && (typeof note !== 'string' || note.length > 200))
    invalid('Notes must be text of at most 200 characters.');
}
/** @param {Profile} profile @param {string} key */
async function requireAttendanceWrites(profile, key) {
  const value = await readApi(profile, key, '/health');
  const health =
    value && typeof value === 'object'
      ? /** @type {Record<string,unknown>} */ (value)
      : {};
  const capabilities =
    health.capabilities && typeof health.capabilities === 'object'
      ? /** @type {Record<string,unknown>} */ (health.capabilities)
      : {};
  const writes = capabilities.attendanceWrites;
  if (
    !writes ||
    typeof writes !== 'object' ||
    !('version' in writes) ||
    writes.version !== 1
  )
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'This server does not advertise attendanceWrites version 1. Update the server; no write was sent.',
      5
    );
}
/** @param {Profile} profile @param {string} key @param {string} eventId */
export async function getRsvp(profile, key, eventId) {
  identifier(eventId);
  return rsvpResult(await readApi(profile, key, `/events/${eventId}/rsvp`));
}
/** @param {Profile} profile @param {string} key @param {string} eventId @param {{rsvpStatus:string,rsvpNote?:string}} body */
export async function setRsvp(profile, key, eventId, body) {
  identifier(eventId);
  if (!statuses.includes(body.rsvpStatus))
    invalid('--status must be YES, MAYBE, NO, or PENDING.');
  checkNote(body.rsvpNote);
  const payload = {
    rsvpStatus: body.rsvpStatus,
    ...(body.rsvpNote !== undefined ? { rsvpNote: body.rsvpNote } : {}),
  };
  await requireAttendanceWrites(profile, key);
  const recovery = `Inspect events rsvp get ${eventId} --profile ${profile.name} before deciding whether another update is needed; this write was not retried.`;
  const value = await mutateApi(profile, key, `/events/${eventId}/rsvp`, {
    method: 'PATCH',
    body: payload,
    recovery,
  });
  try {
    return rsvpResult(value);
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The RSVP response was incomplete. ${recovery}`,
      5
    );
  }
}

/** @param {unknown} value */
function optionResult(value) {
  const result = pick(value, ['id', 'dateTime', 'endDateTime', 'note']);
  valid(
    typeof result.id === 'string' &&
      Number.isFinite(result.dateTime) &&
      (result.endDateTime === null || Number.isFinite(result.endDateTime)) &&
      nullableText(result.note)
  );
  return result;
}
/** @param {unknown} value */
function userResult(value) {
  if (value === null) return null;
  const result = pick(value, ['id', 'name', 'email', 'image', 'username']);
  valid(
    typeof result.id === 'string' &&
      ['name', 'email', 'image', 'username'].every(field =>
        nullableText(result[field])
      )
  );
  return result;
}
/** @param {unknown} value */
function ownAvailability(value) {
  const result = pick(value, [
    'potentialDateTime',
    'status',
    'note',
    'availabilityId',
  ]);
  valid(
    statuses.includes(String(result.status)) &&
      nullableText(result.note) &&
      nullableText(result.availabilityId)
  );
  return {
    ...result,
    potentialDateTime: optionResult(result.potentialDateTime),
  };
}
/** @param {unknown} value */
function memberAvailability(value) {
  const result = pick(value, [
    'membershipId',
    'personId',
    'user',
    'status',
    'note',
  ]);
  valid(
    typeof result.membershipId === 'string' &&
      typeof result.personId === 'string' &&
      statuses.includes(String(result.status)) &&
      nullableText(result.note)
  );
  return { ...result, user: userResult(result.user) };
}
/** @param {unknown} value */
function memberResult(value) {
  const result = pick(value, [
    'id',
    'personId',
    'role',
    'rsvpStatus',
    'rsvpNote',
    'joinedAt',
    'user',
  ]);
  valid(
    typeof result.id === 'string' &&
      typeof result.personId === 'string' &&
      ['ORGANIZER', 'MODERATOR', 'ATTENDEE'].includes(String(result.role)) &&
      statuses.includes(String(result.rsvpStatus)) &&
      nullableText(result.rsvpNote) &&
      Number.isFinite(result.joinedAt)
  );
  return { ...result, user: userResult(result.user) };
}
/** @param {unknown} value */
export function availabilityInput(value) {
  if (!Array.isArray(value) || value.length > 8192)
    invalid(
      '--responses must be a JSON array of {potentialDateTimeId,status,note?}.'
    );
  const seen = new Set();
  const responses = value.map(item => {
    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item) ||
      Object.keys(item).some(
        field => !['potentialDateTimeId', 'status', 'note'].includes(field)
      )
    )
      invalid(
        'Responses accept potentialDateTimeId, status, and optional note only.'
      );
    const input = /** @type {Record<string,unknown>} */ (item);
    const id = identifier(
      /** @type {string} */ (input.potentialDateTimeId),
      'proposed date ID'
    );
    if (seen.has(id))
      invalid('Each proposed date may appear only once per submission.');
    seen.add(id);
    if (!['YES', 'MAYBE', 'NO'].includes(String(input.status)))
      invalid(
        'Availability status must be YES, MAYBE, or NO; use clear to remove responses.'
      );
    checkNote(input.note);
    return {
      potentialDateTimeId: id,
      status: input.status,
      ...(input.note !== undefined ? { note: input.note } : {}),
    };
  });
  return { responses };
}
/** @param {Profile} profile @param {string} key @param {string} eventId @param {unknown} responses */
export async function setAvailability(profile, key, eventId, responses) {
  identifier(eventId);
  const body = availabilityInput(responses);
  await requireAttendanceWrites(profile, key);
  const recovery = `Inspect events availability get ${eventId} --all --profile ${profile.name} before repeating this submission; this write was not retried.`;
  const value = await mutateApi(
    profile,
    key,
    `/events/${eventId}/availability`,
    { method: 'POST', body, recovery }
  );
  try {
    const result = pick(value, ['created', 'updated']);
    valid(
      ['created', 'updated'].every(
        field =>
          Number.isSafeInteger(result[field]) && Number(result[field]) >= 0
      )
    );
    return result;
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The availability result was incomplete. ${recovery}`,
      5
    );
  }
}
/** @param {Profile} profile @param {string} key @param {string} eventId @param {'members'|'dates'|'mine'|'responses'} kind @param {{limit:number,cursor?:string,all?:boolean,option?:string}} options */
export async function listAttendance(profile, key, eventId, kind, options) {
  identifier(eventId);
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  )
    invalid('--limit must be an integer from 1 to 100.');
  const path = {
    members: 'members',
    dates: 'potential-dates',
    mine: 'availability/mine',
    responses: 'availability/responses',
  }[kind];
  const validate = {
    members: memberResult,
    dates: optionResult,
    mine: ownAvailability,
    responses: memberAvailability,
  }[kind];
  if (kind === 'responses')
    identifier(
      /** @type {string} */ (options.option),
      'proposed date ID (--option)'
    );
  let cursor = options.cursor;
  const seen = new Set(cursor ? [cursor] : []);
  const items = [];
  do {
    const query = new URLSearchParams({
      pagination: 'cursor',
      limit: String(options.limit),
    });
    if (cursor) query.set('cursor', cursor);
    if (kind === 'responses')
      query.set('potentialDateTimeId', /** @type {string} */ (options.option));
    const page = pick(
      await readApi(profile, key, `/events/${eventId}/${path}?${query}`),
      ['items', 'nextCursor']
    );
    valid(
      Array.isArray(page.items) &&
        (page.nextCursor === null ||
          (typeof page.nextCursor === 'string' && page.nextCursor.length > 0))
    );
    items.push(.../** @type {unknown[]} */ (page.items).map(validate));
    if (!options.all || page.nextCursor === null)
      return { items, nextCursor: page.nextCursor };
    if (seen.has(/** @type {string} */ (page.nextCursor)))
      throw new CliError(
        'INVALID_RESPONSE',
        'Server repeated a pagination cursor; retrieval stopped.',
        5
      );
    seen.add(/** @type {string} */ (page.nextCursor));
    cursor = /** @type {string} */ (page.nextCursor);
  } while (cursor);
  throw new CliError('INVALID_RESPONSE', 'Incomplete attendance page.', 5);
}

/** @param {unknown} value */
function eventResult(value) {
  const result = pick(value, [
    'id',
    'title',
    'description',
    'location',
    'imageUrl',
    'timezone',
    'potentialDateTimeOptions',
    'chosenDateTime',
    'chosenEndDateTime',
    'reminderOffset',
    'createdAt',
    'updatedAt',
    'creator',
  ]);
  valid(
    typeof result.id === 'string' &&
      typeof result.title === 'string' &&
      typeof result.timezone === 'string'
  );
  valid(
    ['description', 'location', 'imageUrl'].every(field =>
      nullableText(result[field])
    )
  );
  valid(
    ['chosenDateTime', 'chosenEndDateTime'].every(
      field => result[field] === null || Number.isFinite(result[field])
    )
  );
  valid(
    Number.isFinite(result.createdAt) &&
      Number.isFinite(result.updatedAt) &&
      Array.isArray(result.potentialDateTimeOptions)
  );
  const potentialDateTimeOptions = /** @type {unknown[]} */ (
    result.potentialDateTimeOptions
  ).map(value => {
    const item = pick(value, ['id', 'start', 'end', 'note']);
    valid(
      typeof item.id === 'string' &&
        Number.isFinite(item.start) &&
        (item.end === null || Number.isFinite(item.end)) &&
        nullableText(item.note)
    );
    return item;
  });
  valid(
    result.reminderOffset === null ||
      [
        '30_MINUTES',
        '1_HOUR',
        '2_HOURS',
        '4_HOURS',
        '1_DAY',
        '2_DAYS',
        '3_DAYS',
        '1_WEEK',
        '2_WEEKS',
        '4_WEEKS',
      ].includes(String(result.reminderOffset))
  );
  let creator = null;
  if (result.creator !== null) {
    const value = pick(result.creator, ['id', 'user']);
    valid(typeof value.id === 'string');
    creator = { id: value.id, user: userResult(value.user) };
  }
  return { ...result, id: result.id, potentialDateTimeOptions, creator };
}
/** @param {Record<string,unknown>} body */
function validateDateSelection(body) {
  if (body.selectionSource === 'POLL') {
    if (
      Object.keys(body).some(
        field => !['selectionSource', 'potentialDateTimeId'].includes(field)
      )
    )
      invalid('Poll selection accepts only the proposed date ID.');
    identifier(
      /** @type {string} */ (body.potentialDateTimeId),
      'proposed date ID'
    );
  } else if (body.selectionSource === 'MANUAL') {
    if (
      Object.keys(body).some(
        field =>
          !['selectionSource', 'chosenDateTime', 'chosenEndDateTime'].includes(
            field
          )
      )
    )
      invalid('Manual selection accepts only start and optional end dates.');
    const start = parseDateTime(body.chosenDateTime);
    if (start <= Date.now())
      invalid('The chosen start time must be in the future.');
    if (
      body.chosenEndDateTime !== undefined &&
      parseDateTime(body.chosenEndDateTime) <= start
    )
      invalid('The chosen end time must be after its start.');
  } else
    invalid(
      'Choose a proposed date with --option, or provide --start and optional --end.'
    );
  return body;
}
/** @param {{option?:string,start?:string,end?:string}} input */
export function dateInput(input) {
  if (
    input.option !== undefined &&
    (input.start !== undefined || input.end !== undefined)
  )
    invalid('Use --option or --start/--end, not both.');
  return validateDateSelection(
    input.option !== undefined
      ? { selectionSource: 'POLL', potentialDateTimeId: input.option }
      : {
          selectionSource: 'MANUAL',
          chosenDateTime: input.start,
          ...(input.end !== undefined ? { chosenEndDateTime: input.end } : {}),
        }
  );
}
/** @param {Profile} profile @param {string} key @param {string} eventId @param {Record<string,unknown>|null} selection @param {Confirmation} [options] */
export async function changeDate(
  profile,
  key,
  eventId,
  selection,
  options = {}
) {
  identifier(eventId);
  if (selection !== null) validateDateSelection(selection);
  await requireAttendanceWrites(profile, key);
  const recovery = `Inspect events get ${eventId} --profile ${profile.name} and events members ${eventId} before deciding whether another date change is needed; this write was not retried.`;
  const value = await mutateApi(profile, key, `/events/${eventId}/date`, {
    method: selection === null ? 'DELETE' : 'POST',
    body: selection ?? {},
    recovery,
    confirmation: {
      target: `${selection === null ? 'clearing the chosen date for' : selection.selectionSource === 'POLL' ? `choosing proposed date ${selection.potentialDateTimeId} for` : `choosing ${selection.chosenDateTime} for`} event ${eventId} on profile ${profile.name} (${profile.apiUrl})`,
      ...options,
    },
  });
  try {
    const result = eventResult(value);
    valid(result.id === eventId);
    return result;
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The date change response was incomplete. ${recovery}`,
      5
    );
  }
}
/** @param {Profile} profile @param {string} key @param {string} eventId @param {Confirmation} [options] */
export async function clearAvailability(profile, key, eventId, options = {}) {
  identifier(eventId);
  await requireAttendanceWrites(profile, key);
  const recovery = `Inspect events availability get ${eventId} --all --profile ${profile.name} and events rsvp get ${eventId} before clearing again; this write was not retried.`;
  const value = await mutateApi(
    profile,
    key,
    `/events/${eventId}/availability`,
    {
      method: 'DELETE',
      body: {},
      recovery,
      confirmation: {
        target: `clearing your availability for event ${eventId} on profile ${profile.name} (${profile.apiUrl})`,
        ...options,
      },
    }
  );
  try {
    const result = pick(value, ['deletedCount', 'membershipId']);
    valid(
      typeof result.membershipId === 'string' &&
        Number.isSafeInteger(result.deletedCount) &&
        Number(result.deletedCount) >= 0
    );
    return result;
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The clear response was incomplete. ${recovery}`,
      5
    );
  }
}
