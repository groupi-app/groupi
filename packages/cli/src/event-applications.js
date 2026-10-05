import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
import { managementId } from './event-management.js';
/** @typedef {{apiUrl:string,name:string}} Profile */
/** @param {unknown} value */
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CliError('INVALID_RESPONSE', 'Invalid application response.', 5);
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {Profile} profile @param {string} key */
export async function requireApplicationCapability(profile, key) {
  const health = object(await readApi(profile, key, '/health'));
  const capability = object(
    object(health.capabilities ?? {}).eventApplications ?? {}
  );
  if (capability.version !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'This server does not advertise eventApplications version 1; no write was sent.',
      5
    );
}
/** @param {Profile} profile @param {string} key @param {string} eventId @param {'form'|'history'|'list'} kind @param {{limit?:number,cursor?:string}} [options] */
export async function readApplications(
  profile,
  key,
  eventId,
  kind,
  options = {}
) {
  managementId(eventId);
  const query = new URLSearchParams();
  if (kind !== 'form') {
    const limit = options.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new CliError('USAGE', 'Limit must be 1–100.', 2);
    query.set('limit', String(limit));
    if (options.cursor) query.set('cursor', options.cursor);
  }
  const result = object(
    await readApi(
      profile,
      key,
      `/events/${eventId}/applications/${kind}${query.size ? '?' + query : ''}`
    )
  );
  if (kind === 'form') {
    if (
      typeof result.canApply !== 'boolean' ||
      typeof result.canReview !== 'boolean' ||
      (result.settings !== null &&
        (!result.settings ||
          typeof result.settings !== 'object' ||
          Array.isArray(result.settings))) ||
      !('pending' in result)
    )
      throw new CliError('INVALID_RESPONSE', 'Invalid application form.', 5);
  } else if (
    !Array.isArray(result.page) ||
    typeof result.isDone !== 'boolean' ||
    typeof result.continueCursor !== 'string'
  )
    throw new CliError('INVALID_RESPONSE', 'Invalid application page.', 5);
  return result;
}
/** @param {Profile} profile @param {string} key @param {string} id @param {'configure'|'submit'|'withdraw'|'approve'|'decline'} action @param {Record<string,unknown>} [body] */
export async function writeApplication(profile, key, id, action, body = {}) {
  managementId(id);
  if (
    action === 'configure' &&
    (!Array.isArray(body.questions) ||
      !['ORGANIZERS_AND_MODERATORS', 'ORGANIZER_ONLY'].includes(
        String(body.reviewerPolicy)
      ))
  )
    throw new CliError(
      'USAGE',
      'Configuration needs questions and reviewerPolicy.',
      2
    );
  if (
    action === 'submit' &&
    (!body.answers ||
      typeof body.answers !== 'object' ||
      Array.isArray(body.answers))
  )
    throw new CliError('USAGE', 'Supply answers as a JSON object.', 2);
  if (
    body.reason !== undefined &&
    (typeof body.reason !== 'string' || body.reason.length > 2000)
  )
    throw new CliError('USAGE', 'Reason must be at most 2000 characters.', 2);
  await requireApplicationCapability(profile, key);
  const path =
    action === 'configure'
      ? `/events/${id}/applications/settings`
      : action === 'submit'
        ? `/events/${id}/applications`
        : `/event-applications/${id}/${action === 'withdraw' ? 'withdraw' : 'decision'}`;
  const payload =
    action === 'approve' || action === 'decline'
      ? {
          decision: action === 'approve' ? 'APPROVED' : 'DECLINED',
          ...(body.reason ? { reason: body.reason } : {}),
        }
      : body;
  const result = object(
    await mutateApi(profile, key, path, {
      method: action === 'configure' ? 'PUT' : 'POST',
      body: payload,
      forbiddenGuidance:
        'Check the selected profile, API key, current Event reviewer authority and current audience eligibility. Refresh the application form/history or review queue before retrying; a manager invitation is a separate operation.',
      recovery:
        'Read the application form/history or review queue before retrying.',
    })
  );
  if (
    action !== 'configure' &&
    (typeof result.applicationId !== 'string' ||
      !['PENDING', 'WITHDRAWN', 'APPROVED', 'DECLINED'].includes(
        String(result.status)
      ))
  )
    throw new CliError('INVALID_RESPONSE', 'Invalid application result.', 5);
  return result;
}
