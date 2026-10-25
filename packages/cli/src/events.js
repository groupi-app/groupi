import { validateEventInput, validateRequestId } from './event-input.js';
import { randomUUID } from 'node:crypto';
import { mutateApi } from './mutations.js';
import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { readPaginated } from './pagination.js';

/** @param {unknown} value */
function eventRecord(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !('title' in value) ||
    typeof value.title !== 'string'
  ) {
    throw new CliError(
      'INVALID_RESPONSE',
      'Expected an event with an id and title.',
      5
    );
  }
  return value;
}

/** @param {{apiUrl: string}} profile @param {string} key @param {string} id */
export async function getEvent(profile, key, id) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id))
    throw new CliError('USAGE', 'Provide an event id from events list.', 2);
  return eventRecord(
    await readApi(profile, key, `/events/${encodeURIComponent(id)}`)
  );
}

/** @param {{apiUrl: string}} profile @param {string} key @param {{limit: number, cursor?: string, all?: boolean}} options */
export async function listEvents(profile, key, options) {
  return readPaginated({
    ...options,
    fetchPage: ({ cursor, limit }) => {
      const query = new URLSearchParams({
        pagination: 'cursor',
        limit: String(limit),
      });
      if (cursor) query.set('cursor', cursor);
      return readApi(profile, key, `/events?${query}`);
    },
    projectItem: eventRecord,
  });
}

/** @param {{apiUrl:string,name:string}} profile @param {string} key @param {Record<string,unknown>} body @param {string} [requestId] */
export async function createEvent(
  profile,
  key,
  body,
  requestId = `${Date.now()}.${randomUUID()}`
) {
  validateEventInput(body, true);
  validateRequestId(requestId);
  await requireEventWrites(profile, key, true);
  const recovery = `Inspect events list on profile ${profile.name}, or retry the same inputs with --request-id ${requestId} within 24 hours. Do not generate a new identifier for an uncertain write.`;
  const result = await mutateApi(profile, key, '/events', {
    method: 'POST',
    body,
    requestId,
    recovery,
    expiredRecovery: `Inspect events list on profile ${profile.name} before deliberately creating again with a new request identifier.`,
  });
  if (
    !result ||
    typeof result !== 'object' ||
    !('eventId' in result) ||
    typeof result.eventId !== 'string' ||
    !('membershipId' in result) ||
    typeof result.membershipId !== 'string'
  )
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The server returned an incomplete creation result. ${recovery}`,
      5
    );
  return {
    eventId: result.eventId,
    membershipId: result.membershipId,
    requestId,
  };
}

/** @param {{apiUrl:string,name:string}} profile @param {string} key @param {string} id @param {Record<string,unknown>} body @param {{yes?:boolean,json?:boolean}} [options] */
export async function editEvent(profile, key, id, body, options = {}) {
  validateEventInput(body, false);
  if (!/^[a-zA-Z0-9_-]+$/.test(id))
    throw new CliError('USAGE', 'Provide an event id from events list.', 2);
  await requireEventWrites(profile, key, false);
  const recovery = `Inspect events get ${id} --profile ${profile.name} before deciding whether another edit is needed; this write was not retried.`;
  const result = await mutateApi(
    profile,
    key,
    `/events/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body,
      recovery,
      ...(body.potentialDateTimeOptions !== undefined
        ? {
            confirmation: {
              target: `replacing proposed dates and clearing existing availability for event ${id} on profile ${profile.name} (${profile.apiUrl})`,
              ...options,
            },
          }
        : {}),
    }
  );
  try {
    const event = eventRecord(result);
    if (event.id !== id) throw new Error('Mismatched event');
    return event;
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The edit response was incomplete. ${recovery}`,
      5
    );
  }
}

/** @param {{apiUrl:string}} profile @param {string} key @param {boolean} creating */
async function requireEventWrites(profile, key, creating) {
  const health = await readApi(profile, key, '/health');
  const capabilities =
    health &&
    typeof health === 'object' &&
    'capabilities' in health &&
    health.capabilities &&
    typeof health.capabilities === 'object'
      ? health.capabilities
      : {};
  const writes =
    'eventWrites' in capabilities ? capabilities.eventWrites : null;
  const replay =
    'eventCreationIdempotency' in capabilities
      ? capabilities.eventCreationIdempotency
      : null;
  if (
    !writes ||
    typeof writes !== 'object' ||
    !('version' in writes) ||
    writes.version !== 1 ||
    (creating &&
      (!replay ||
        typeof replay !== 'object' ||
        !('version' in replay) ||
        replay.version !== 1 ||
        !('retentionMs' in replay) ||
        replay.retentionMs !== 86400000))
  )
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'This server does not advertise supported event writes and replay protection. Update the server before creating or editing events; no write was sent.',
      5
    );
}
