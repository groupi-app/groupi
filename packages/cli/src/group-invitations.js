import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
/** @typedef {{name:string,apiUrl:string}} Profile */
/** @param {string} input */
function id(input) {
  if (typeof input !== 'string' || !/^[a-zA-Z0-9_;-]{1,512}$/.test(input))
    throw new CliError(
      'USAGE',
      'Provide a valid Group, person or invitation ID.',
      2
    );
  return encodeURIComponent(input);
}
/** @param {unknown} input @returns {Record<string,unknown>} */
function record(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid Group invitation response.',
      5
    );
  return /** @type {Record<string,unknown>} */ (input);
}
/** @param {boolean} condition */
function valid(condition) {
  if (!condition)
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid Group invitation response.',
      5
    );
}
/** @param {unknown} input */
function person(input) {
  const p = record(input);
  valid(
    typeof p.personId === 'string' &&
      ['name', 'username', 'image'].every(
        f => p[f] === null || typeof p[f] === 'string'
      )
  );
  return {
    personId: p.personId,
    name: p.name,
    username: p.username,
    image: p.image,
  };
}
/** @param {unknown} input @param {boolean} member */
function entry(input, member) {
  const v = record(input);
  if (member) {
    valid(
      ['OWNER', 'MODERATOR', 'MEMBER'].includes(String(v.role)) &&
        Number.isFinite(v.joinedAt)
    );
    return { ...person(v), role: v.role, joinedAt: v.joinedAt };
  }
  const g = record(v.group);
  valid(
    typeof v.inviteId === 'string' &&
      ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'].includes(
        String(v.status)
      ) &&
      Number.isFinite(v.createdAt) &&
      (v.respondedAt === null || Number.isFinite(v.respondedAt)) &&
      typeof v.available === 'boolean' &&
      typeof g.groupId === 'string' &&
      typeof g.name === 'string' &&
      ['description', 'image'].every(
        f => g[f] === null || typeof g[f] === 'string'
      )
  );
  return {
    inviteId: v.inviteId,
    status: v.status,
    createdAt: v.createdAt,
    respondedAt: v.respondedAt,
    available: v.available,
    group: {
      groupId: g.groupId,
      name: g.name,
      description: g.description,
      image: g.image,
    },
    inviter: person(v.inviter),
    invitee: person(v.invitee),
  };
}
/** @param {Profile} profile @param {string} key @param {'members'|'invites'|'incoming'} kind @param {string|undefined} groupId @param {{limit:number,cursor?:string,all?:boolean,status?:string}} options */
export async function listGroupInvitationData(
  profile,
  key,
  kind,
  groupId,
  options
) {
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  )
    throw new CliError('USAGE', '--limit must be an integer from 1 to 100.', 2);
  if (
    options.status &&
    !['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'].includes(options.status)
  )
    throw new CliError(
      'USAGE',
      '--status must be PENDING, ACCEPTED, DECLINED or CANCELLED.',
      2
    );
  const path =
    kind === 'incoming'
      ? '/group-invites'
      : `/groups/${id(groupId ?? '')}/${kind === 'members' ? 'members' : 'invitations'}`;
  let cursor = options.cursor;
  const seen = new Set(cursor ? [cursor] : []);
  const items = [];
  do {
    const q = new URLSearchParams({ limit: String(options.limit) });
    if (cursor) q.set('cursor', cursor);
    if (options.status) q.set('status', options.status);
    const page = record(await readApi(profile, key, `${path}?${q}`));
    valid(
      Array.isArray(page.items) &&
        page.items.length <= options.limit &&
        (page.nextCursor === null ||
          (typeof page.nextCursor === 'string' && page.nextCursor.length > 0))
    );
    items.push(
      .../** @type {unknown[]} */ (page.items).map(v =>
        entry(v, kind === 'members')
      )
    );
    if (!options.all || page.nextCursor === null)
      return { items, nextCursor: page.nextCursor };
    cursor = /** @type {string} */ (page.nextCursor);
    if (seen.has(cursor))
      throw new CliError(
        'INVALID_RESPONSE',
        'Server repeated an invitation cursor; retrieval stopped.',
        5
      );
    seen.add(cursor);
  } while (cursor);
  throw new CliError('INVALID_RESPONSE', 'Incomplete Group page.', 5);
}
/** @param {Profile} profile @param {string} key */
async function capability(profile, key) {
  const health = record(await readApi(profile, key, '/health'));
  const caps = health.capabilities;
  if (
    !caps ||
    typeof caps !== 'object' ||
    !('groupInvites' in caps) ||
    !caps.groupInvites ||
    typeof caps.groupInvites !== 'object' ||
    !('version' in caps.groupInvites) ||
    caps.groupInvites.version !== 1
  )
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Server must advertise groupInvites version 1; no write was sent.',
      5
    );
}
/** @param {Profile} profile @param {string} key @param {'send'|'accept'|'decline'|'cancel'|'policy'} operation @param {string} target @param {{personId?:string,enabled?:boolean,yes?:boolean,json?:boolean}} options */
export async function changeGroupInvitation(
  profile,
  key,
  operation,
  target,
  options = {}
) {
  id(target);
  if (operation === 'send') id(options.personId ?? '');
  if (operation === 'policy' && typeof options.enabled !== 'boolean')
    throw new CliError('USAGE', '--enabled must be true or false.', 2);
  await capability(profile, key);
  const inspection =
    operation === 'send' || operation === 'policy'
      ? `groups invites ${target} --all`
      : operation === 'cancel'
        ? 'groups list --all, then groups invites <group-id> --all'
        : 'group-invites list --all';
  const recovery = `Inspect ${inspection} on profile ${profile.name} before repeating; this write was not retried.`;
  const path =
    operation === 'send'
      ? `/groups/${id(target)}/invitations`
      : operation === 'policy'
        ? `/groups/${id(target)}/invitation-policy`
        : `/group-invites/${id(target)}/${operation}`;
  const value = await mutateApi(profile, key, path, {
    method: operation === 'policy' ? 'PATCH' : 'POST',
    body:
      operation === 'send'
        ? { inviteePersonId: options.personId }
        : operation === 'policy'
          ? { invitationsEnabled: options.enabled }
          : {},
    recovery,
    ...(['decline', 'cancel'].includes(operation)
      ? {
          confirmation: {
            target: `${operation} Group invitation ${target}`,
            yes: options.yes,
            json: options.json,
          },
        }
      : {}),
  });
  if (operation === 'policy')
    return {
      success: true,
      groupId: target,
      invitationsEnabled: options.enabled,
    };
  try {
    const result = record(value);
    if (operation === 'send') {
      valid(typeof result.inviteId === 'string' && result.status === 'PENDING');
      return { inviteId: result.inviteId, status: result.status };
    }
    if (operation === 'accept') {
      valid(
        typeof result.groupId === 'string' &&
          typeof result.membershipId === 'string' &&
          result.status === 'ACCEPTED'
      );
      return {
        groupId: result.groupId,
        membershipId: result.membershipId,
        status: result.status,
      };
    }
    valid(
      result.status === (operation === 'decline' ? 'DECLINED' : 'CANCELLED')
    );
    return { status: result.status };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `Group invitation response was incomplete. ${recovery}`,
      5
    );
  }
}
