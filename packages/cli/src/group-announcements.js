import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
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
/** @param {{name:string,apiUrl:string}} profile @param {string} key @param {string} id @param {{title:string,message:string,requestId:string}} input */
export async function sendAnnouncement(profile, key, id, input) {
  const target = path(id);
  if (
    !input.title.trim() ||
    input.title.trim().length > 100 ||
    !input.message.trim() ||
    input.message.trim().length > 2000
  )
    throw new CliError(
      'USAGE',
      'Provide title (1–100) and message (1–2000 characters).',
      2
    );
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
    !('announcements' in health.capabilities.groups) ||
    health.capabilities.groups.announcements !== 1
  )
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Server must advertise Groups announcements version 1; no write was sent.',
      5
    );
  return status(
    await mutateApi(profile, key, target, {
      method: 'POST',
      requestId: input.requestId,
      body: { title: input.title, message: input.message },
      recovery: `Check groups announcement-status ${id} --request-id ${input.requestId}, or resend exactly the same body and request ID. Notifications are created/queued, not confirmed delivered.`,
    })
  );
}
