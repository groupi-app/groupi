import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
import { managementId } from './event-management.js';
/** @param {unknown} value */
function result(value) {
  if (value === null) return null;
  const row = /** @type {Record<string,unknown>} */ (value);
  if (
    !row ||
    typeof row !== 'object' ||
    !['NONE', 'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'].includes(
      String(row.status)
    ) ||
    typeof row.organizerId !== 'string' ||
    typeof row.eventId !== 'string' ||
    typeof row.explanation !== 'string' ||
    typeof row.createdById !== 'string' ||
    ![row.transferId, row.recipientId, row.offeredById].every(
      v => v === null || typeof v === 'string'
    )
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid ownership transfer status.',
      5
    );
  return row;
}
/** @param {{apiUrl:string,name:string}} profile @param {string} key @param {string} eventId @param {'status'|'offer'|'accept'|'decline'|'cancel'} action @param {{recipientId?:string,transferId?:string,yes?:boolean,json?:boolean}} [options] */
export async function eventTransfer(
  profile,
  key,
  eventId,
  action,
  options = {}
) {
  managementId(eventId);
  const path = `/events/${eventId}/ownership-transfer`;
  if (action === 'status') return result(await readApi(profile, key, path));
  managementId(action === 'offer' ? options.recipientId : options.transferId);
  const health =
    /** @type {{capabilities?:{eventTransfers?:{version?:number}}}} */ (
      await readApi(profile, key, '/health')
    );
  if (health?.capabilities?.eventTransfers?.version !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'This server does not advertise eventTransfers version 1; no write was sent.',
      5
    );
  return result(
    await mutateApi(
      profile,
      key,
      path + (action === 'offer' ? '' : `/${action}`),
      {
        method: 'POST',
        body:
          action === 'offer'
            ? { recipientId: options.recipientId }
            : { transferId: options.transferId },
        confirmation: {
          target: `${action} ownership transfer for Event ${eventId}. After acceptance Friends visibility follows the new Organizer; the former Organizer becomes Moderator`,
          yes: options.yes,
          json: options.json,
        },
        recovery: `Inspect events transfer status ${eventId} before taking another action. Pending ownership remains unresolved.`,
      }
    )
  );
}
