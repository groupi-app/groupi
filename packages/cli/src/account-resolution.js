import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
/** @param {{apiUrl:string}} profile @param {string} key */
async function requireResolutionCapability(profile, key) {
  const health =
    /** @type {{capabilities?:{accountResolution?:{version?:number}}}} */ (
      await readApi(profile, key, '/health')
    );
  if (health?.capabilities?.accountResolution?.version !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'This server does not advertise accountResolution version 1; no write was sent.',
      5
    );
}
/** @param {{apiUrl:string}} profile @param {string} key @param {{kind:string,limit:number,cursor?:string,all?:boolean}} input */
export async function responsibilities(profile, key, input) {
  if (
    !['GROUP', 'EVENT'].includes(input.kind) ||
    !Number.isInteger(input.limit) ||
    input.limit < 1 ||
    input.limit > 100
  )
    throw new CliError(
      'USAGE',
      'Use --kind GROUP or EVENT and --limit 1–100.',
      2
    );
  const items = [];
  let cursor = input.cursor;
  const seen = new Set(cursor ? [cursor] : []);
  do {
    const query = new URLSearchParams({
      kind: input.kind,
      limit: String(input.limit),
    });
    if (cursor) query.set('cursor', cursor);
    const page = await readApi(
      profile,
      key,
      `/account/responsibilities?${query}`
    );
    if (
      !page ||
      typeof page !== 'object' ||
      !('items' in page) ||
      !Array.isArray(page.items) ||
      page.items.length > input.limit ||
      !('nextCursor' in page) ||
      !(
        page.nextCursor === null ||
        (typeof page.nextCursor === 'string' && page.nextCursor.length)
      )
    )
      throw new CliError('INVALID_RESPONSE', 'Invalid responsibility page.', 5);
    for (const item of page.items) {
      if (
        !item ||
        typeof item !== 'object' ||
        item.kind !== input.kind ||
        typeof item.id !== 'string' ||
        typeof item.title !== 'string' ||
        item.resolved !== false ||
        !['NONE', 'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'].includes(
          item.status
        )
      )
        throw new CliError(
          'INVALID_RESPONSE',
          'Invalid unresolved responsibility.',
          5
        );
      items.push(item);
    }
    if (!input.all || page.nextCursor === null)
      return { items, nextCursor: page.nextCursor };
    cursor = /** @type {string} */ (page.nextCursor);
    if (seen.has(cursor))
      throw new CliError(
        'INVALID_RESPONSE',
        'Repeated responsibility cursor; enumeration stopped.',
        5
      );
    seen.add(cursor);
  } while (cursor);
  throw new CliError(
    'INVALID_RESPONSE',
    'Incomplete responsibility enumeration.',
    5
  );
}
/** @param {{apiUrl:string}} profile @param {string} key */
export async function readiness(profile, key) {
  const result = await readApi(profile, key, '/account/readiness');
  if (
    !result ||
    typeof result !== 'object' ||
    !('canDelete' in result) ||
    typeof result.canDelete !== 'boolean' ||
    !('hasOwnedGroups' in result) ||
    typeof result.hasOwnedGroups !== 'boolean' ||
    !('hasOwnedEvents' in result) ||
    typeof result.hasOwnedEvents !== 'boolean' ||
    result.canDelete !== (!result.hasOwnedGroups && !result.hasOwnedEvents)
  )
    throw new CliError('INVALID_RESPONSE', 'Invalid account readiness.', 5);
  return result;
}
/** @param {{apiUrl:string,name?:string}} profile @param {string} key @param {string} confirmation @param {{yes?:boolean,json?:boolean}} options */
export async function deleteAccount(profile, key, confirmation, options) {
  if (!confirmation?.trim())
    throw new CliError(
      'USAGE',
      'Provide --confirm-username with your current username.',
      2
    );
  await requireResolutionCapability(profile, key);
  const result = await mutateApi(profile, key, '/account/delete', {
    method: 'POST',
    body: { confirmation },
    confirmation: {
      target: `permanent deletion of account ${confirmation.trim()} on profile ${profile.name ?? profile.apiUrl}, including credentials and private records`,
      ...options,
    },
    conflictGuidance:
      'Resolve owned Groups and Events with account responsibilities --kind GROUP/EVENT --all. Pending offers need recipient acceptance; use groups/events transfer, groups delete, or account delete-event before retrying final deletion.',
    recovery:
      'Account deletion may have completed; check authentication before repeating. No automatic retry is performed.',
  });
  if (
    !result ||
    typeof result !== 'object' ||
    !('success' in result) ||
    result.success !== true
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Account deletion was not confirmed.',
      5
    );
  return result;
}
/** @param {{apiUrl:string}} profile @param {string} key @param {string} id @param {{yes?:boolean,json?:boolean}} options */
export async function deleteOwnedEvent(profile, key, id, options) {
  if (!/^[a-zA-Z0-9_;-]{1,512}$/.test(id))
    throw new CliError('USAGE', 'Provide a valid owned Event ID.', 2);
  await requireResolutionCapability(profile, key);
  await mutateApi(
    profile,
    key,
    `/account/responsibilities/events/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      body: {},
      confirmation: {
        target: `permanent deletion of owned Event ${id} and its data`,
        ...options,
      },
      recovery:
        'Read account responsibilities before repeating; the Event may have been deleted.',
    }
  );
  return { eventId: id, deleted: true };
}
