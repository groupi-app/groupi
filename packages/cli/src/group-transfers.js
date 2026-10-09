import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
/** @typedef {{name:string,apiUrl:string}} Profile */
/** @param {unknown} value */
function identifier(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_;-]{1,512}$/.test(value))
    throw new CliError(
      'USAGE',
      'Provide a valid Group, person or transfer ID.',
      2
    );
  return encodeURIComponent(value);
}
/** @param {unknown} value @returns {Record<string,unknown>} */
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CliError('INVALID_RESPONSE', 'Invalid ownership response.', 5);
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {Profile} profile @param {string} key @param {boolean} [retirement] */
export async function requireGroupTransferCapability(
  profile,
  key,
  retirement = false
) {
  const health = object(await readApi(profile, key, '/health')),
    cap = object(object(health.capabilities ?? {}).groupTransfers ?? {});
  if (cap.version !== 1 || (retirement && cap.retirement !== true))
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Server must advertise groupTransfers version 1' +
        (retirement ? ' with retirement' : '') +
        '; no write was sent.',
      5
    );
}
/** @param {unknown} value */
function result(value) {
  if (value === null) return null;
  const row = object(value);
  if (
    typeof row.groupId !== 'string' ||
    typeof row.ownerId !== 'string' ||
    !['NONE', 'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'].includes(
      String(row.status)
    ) ||
    typeof row.explanation !== 'string' ||
    !['canOffer', 'canAccept', 'canDecline', 'canCancel'].every(
      key => typeof row[key] === 'boolean'
    )
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid Group ownership status.',
      5
    );
  return row;
}
/** @param {Profile} profile @param {string} key @param {string} groupId */
export async function getGroupTransfer(profile, key, groupId) {
  return result(
    await readApi(
      profile,
      key,
      `/groups/${identifier(groupId)}/ownership-transfer`
    )
  );
}
/** @param {Profile} profile @param {string} key @param {string} groupId @param {'offer'|'accept'|'decline'|'cancel'} action @param {{recipientId?:string,transferId?:string,yes?:boolean,json?:boolean}} [options] */
export async function changeGroupTransfer(
  profile,
  key,
  groupId,
  action,
  options = {}
) {
  const group = identifier(groupId);
  if (action === 'offer') identifier(options.recipientId);
  else identifier(options.transferId);
  await requireGroupTransferCapability(profile, key);
  return result(
    await mutateApi(
      profile,
      key,
      `/groups/${group}/ownership-transfer${action === 'offer' ? '' : '/' + action}`,
      {
        method: 'POST',
        body:
          action === 'offer'
            ? { recipientId: options.recipientId }
            : { transferId: options.transferId },
        recovery:
          'Read groups transfer status before repeating; pending offers do not resolve ownership.',
        ...(action === 'offer' || action === 'accept'
          ? {
              confirmation: {
                target:
                  action === 'offer'
                    ? 'offer Group responsibility; you remain owner until acceptance'
                    : 'accept Group responsibility; the former owner becomes Moderator and Events remain independent',
                yes: options.yes,
                json: options.json,
              },
            }
          : {}),
      }
    )
  );
}
