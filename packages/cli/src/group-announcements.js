import { CliError } from './errors.js';
import { readApi } from './transport.js';
/** @param {string} id */
function path(id) {
  if (!/^[a-zA-Z0-9_;-]{1,512}$/.test(id))
    throw new CliError('USAGE', 'Provide a valid Group ID.', 2);
  return `/groups/${encodeURIComponent(id)}/announcements`;
}
/** @param {unknown} value */
function status(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    !('announcementId' in value) ||
    typeof value.announcementId !== 'string' ||
    !('state' in value) ||
    !['PROCESSING', 'COMPLETED', 'CANCELLED'].includes(String(value.state)) ||
    !('notified' in value) ||
    !Number.isInteger(value.notified) ||
    Number(value.notified) < 0 ||
    !('skipped' in value) ||
    !Number.isInteger(value.skipped) ||
    Number(value.skipped) < 0
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid announcement status; recover using the same request ID.',
      5
    );
  return value;
}
/** @param {{name:string,apiUrl:string}} profile @param {string} key @param {string} id @param {string} requestId */
export async function announcementStatus(profile, key, id, requestId) {
  const value = await readApi(
    profile,
    key,
    `${path(id)}/status?${new URLSearchParams({ requestId })}`
  );
  return value === null ? null : status(value);
}
/** Retain the old command/export as an explicit rejection without network requests. */
export function retiredAnnouncement() {
  throw new CliError(
    'CONFLICT',
    'Announcements are retired. Create a post instead. No write was sent.',
    5
  );
}
/** @param {{name:string,apiUrl:string}} _profile @param {string} _key @param {string} id @param {{title:string,message:string,requestId:string}} _input */
export async function sendAnnouncement(_profile, _key, id, _input) {
  void _input; // Keep the legacy call signature without accepting a send intent.
  path(id);
  return retiredAnnouncement();
}
