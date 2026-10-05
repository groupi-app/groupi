import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
/** @typedef {{name:string,apiUrl:string}} Profile */
/** @param {unknown} input @returns {Record<string,unknown>} */
function record(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid Group moderation response.',
      5
    );
  return /** @type {Record<string,unknown>} */ (input);
}
/** @param {string} input */
function id(input) {
  if (!/^[a-zA-Z0-9_;-]{1,512}$/.test(input))
    throw new CliError('USAGE', 'Provide a valid Group or person ID.', 2);
  return encodeURIComponent(input);
}
/** @param {Profile} profile @param {string} key */
async function capability(profile, key) {
  const health = record(await readApi(profile, key, '/health'));
  const caps = record(health.capabilities ?? {});
  if (
    !caps.groupModeration ||
    typeof caps.groupModeration !== 'object' ||
    !('version' in caps.groupModeration) ||
    caps.groupModeration.version !== 1
  )
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Server must advertise groupModeration version 1; no write was sent.',
      5
    );
}
/** @param {Profile} profile @param {string} key @param {'role'|'remove'|'ban'|'lift'|'leave'} operation @param {string} groupId @param {string|undefined} personId @param {{role?:string,yes?:boolean,json?:boolean}} options */
export async function changeGroupModeration(
  profile,
  key,
  operation,
  groupId,
  personId,
  options
) {
  const base = `/groups/${id(groupId)}`;
  const target = operation === 'leave' ? '' : id(personId ?? '');
  if (
    operation === 'role' &&
    !['MODERATOR', 'MEMBER'].includes(options.role ?? '')
  )
    throw new CliError('USAGE', '--role must be MODERATOR or MEMBER.', 2);
  await capability(profile, key);
  const recovery = `Inspect groups get ${groupId}, groups members ${groupId} --all and groups bans ${groupId} --all on profile ${profile.name} before repeating; this write was not retried.`;
  const result = await mutateApi(
    profile,
    key,
    operation === 'leave'
      ? `${base}/leave`
      : operation === 'role'
        ? `${base}/members/${target}/role`
        : operation === 'remove'
          ? `${base}/members/${target}`
          : `${base}/bans/${target}`,
    {
      method:
        operation === 'leave'
          ? 'POST'
          : operation === 'role'
            ? 'PATCH'
            : operation === 'ban'
              ? 'PUT'
              : 'DELETE',
      body: operation === 'role' ? { role: options.role } : undefined,
      confirmation: {
        target: `${operation} Group ${groupId}${personId ? ` person ${personId}` : ''}`,
        yes: options.yes,
        json: options.json,
      },
      recovery,
    }
  );
  try {
    const value = record(result);
    if (operation === 'role') {
      if (value.role !== options.role) throw Error();
      return { role: value.role };
    }
    const field =
      operation === 'remove'
        ? 'removed'
        : operation === 'leave'
          ? 'left'
          : 'banned';
    if (
      typeof value[field] !== 'boolean' ||
      (operation === 'ban' && value[field] !== true) ||
      (operation === 'lift' && value[field] !== false)
    )
      throw Error();
    return { [field]: value[field] };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `Group moderation response was incomplete. ${recovery}`,
      5
    );
  }
}
/** @param {Profile} profile @param {string} key @param {string} groupId @param {{limit:number,cursor?:string,all?:boolean}} options */
export async function listGroupBans(profile, key, groupId, options) {
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  )
    throw new CliError('USAGE', '--limit must be an integer from 1 to 100.', 2);
  if (
    options.cursor !== undefined &&
    (!options.cursor || options.cursor.length > 4096)
  )
    throw new CliError(
      'USAGE',
      'Provide a nonempty cursor of at most 4096 characters.',
      2
    );
  let cursor = options.cursor;
  const seen = new Set(cursor ? [cursor] : []);
  const items = [];
  while (true) {
    const params = new URLSearchParams({ limit: String(options.limit) });
    if (cursor) params.set('cursor', cursor);
    const result = record(
      await readApi(profile, key, `/groups/${id(groupId)}/bans?${params}`)
    );
    if (
      !Array.isArray(result.items) ||
      !(result.nextCursor === null || typeof result.nextCursor === 'string')
    )
      throw new CliError('INVALID_RESPONSE', 'Invalid Group ban page.', 5);
    for (const item of result.items) {
      const row = record(item);
      if (
        typeof row.personId !== 'string' ||
        !Number.isFinite(row.bannedAt) ||
        !['name', 'username', 'image'].every(
          f => row[f] === null || typeof row[f] === 'string'
        )
      )
        throw new CliError('INVALID_RESPONSE', 'Invalid Group ban summary.', 5);
      items.push({
        personId: row.personId,
        name: row.name,
        username: row.username,
        image: row.image,
        bannedAt: row.bannedAt,
      });
    }
    if (!options.all || result.nextCursor === null)
      return { items, nextCursor: result.nextCursor };
    if (!result.nextCursor || seen.has(result.nextCursor))
      throw new CliError('INVALID_RESPONSE', 'Group bans cursor repeated.', 5);
    seen.add(result.nextCursor);
    cursor = result.nextCursor;
  }
}
