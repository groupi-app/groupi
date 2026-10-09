import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { readPaginated } from './pagination.js';
import { mutateApi } from './mutations.js';

/** @typedef {{apiUrl:string,name:string}} Profile */
/** @param {string} id */
export function notificationTarget(id) {
  if (!/^[a-zA-Z0-9_-]{1,512}$/.test(id))
    throw new CliError('USAGE', 'Provide a valid target ID, not a URL.', 2);
  return id;
}
/** @param {unknown} value @returns {Record<string,unknown>} */
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned invalid notification data.',
      5
    );
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {Profile} profile @param {string} key */
async function requireControls(profile, key) {
  const health = record(await readApi(profile, key, '/health'));
  const capabilities = record(health.capabilities ?? {});
  const controls = record(capabilities.notificationControls ?? {});
  if (controls.version !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'This server does not advertise notification controls version 1. Update the server; no operation was sent.',
      5
    );
}
/** @param {unknown} value */
function reference(value) {
  if (value === null) return null;
  const item = record(value);
  if (typeof item.id !== 'string' || typeof item.title !== 'string')
    throw new CliError(
      'INVALID_RESPONSE',
      'Invalid notification reference.',
      5
    );
  return { id: item.id, title: item.title };
}
/** @param {unknown} value */
function notification(value) {
  const item = record(value);
  if (
    typeof item.id !== 'string' ||
    typeof item.type !== 'string' ||
    typeof item.read !== 'boolean' ||
    !Number.isFinite(item.createdAt)
  )
    throw new CliError('INVALID_RESPONSE', 'Invalid notification summary.', 5);
  let author = null;
  if (item.author !== null) {
    const person = record(item.author);
    const user = record(person.user);
    if (
      typeof person.id !== 'string' ||
      typeof person.userId !== 'string' ||
      !(user.name === null || typeof user.name === 'string') ||
      !(user.email === null || typeof user.email === 'string')
    )
      throw new CliError('INVALID_RESPONSE', 'Invalid notification author.', 5);
    author = {
      id: person.id,
      userId: person.userId,
      user: { name: user.name, email: user.email },
    };
  }
  return {
    id: item.id,
    type: item.type,
    read: item.read,
    createdAt: item.createdAt,
    event: reference(item.event),
    post: reference(item.post),
    author,
  };
}
/** @param {{limit?:string,cursor?:string,all?:boolean,unread?:boolean}} options */
export function notificationPageOptions(options) {
  const limit = options.limit ?? '20';
  if (!/^[1-9]\d*$/.test(limit) || Number(limit) > 100)
    throw new CliError('USAGE', '--limit must be an integer from 1 to 100.', 2);
  if (
    options.cursor !== undefined &&
    (!options.cursor || options.cursor.length > 8192)
  )
    throw new CliError(
      'USAGE',
      'Provide a nonempty cursor of at most 8192 characters.',
      2
    );
  return { ...options, limit: Number(limit) };
}
/** @param {Profile} profile @param {string} key @param {ReturnType<typeof notificationPageOptions>} options */
export async function listNotifications(profile, key, options) {
  await requireControls(profile, key);
  return readPaginated({
    ...options,
    fetchPage: ({ cursor, limit }) => {
      const params = new URLSearchParams({
        pagination: 'cursor',
        limit: String(limit),
      });
      if (options.unread) params.set('unread', 'true');
      if (cursor) params.set('cursor', cursor);
      return readApi(profile, key, `/notifications?${params}`);
    },
    projectItem: notification,
  });
}
/** @param {Profile} profile @param {string} key */
export async function notificationCount(profile, key) {
  await requireControls(profile, key);
  const value = record(await readApi(profile, key, '/notifications/count'));
  if (!Number.isSafeInteger(value.count) || Number(value.count) < 0)
    throw new CliError('INVALID_RESPONSE', 'Invalid unread count.', 5);
  return { count: Number(value.count) };
}
/** @param {Profile} profile @param {string} key @param {'read'|'unread'|'read-all'|'read-event'|'read-post'|'clear'|'clear-all'} action @param {string|undefined} id @param {{yes?:boolean,json?:boolean}} options */
export async function changeNotification(profile, key, action, id, options) {
  if (id !== undefined) notificationTarget(id);
  await requireControls(profile, key);
  const clear = action === 'clear' || action === 'clear-all';
  const path =
    action === 'clear-all'
      ? '/notifications'
      : action === 'clear'
        ? `/notifications/${id}`
        : action === 'read-all'
          ? '/notifications/read-all'
          : action === 'read-event'
            ? `/notifications/events/${id}/read`
            : action === 'read-post'
              ? `/notifications/posts/${id}/read`
              : `/notifications/${id}/${action}`;
  const recovery = `Inspect notifications list --all --profile ${profile.name} before repeating this action; this write was not retried.`;
  const value = await mutateApi(profile, key, path, {
    method: clear ? 'DELETE' : 'POST',
    body: {},
    recovery,
    ...(clear
      ? {
          confirmation: {
            target: `clearing ${id ? `notification ${id}` : 'all notifications'} on profile ${profile.name} (${profile.apiUrl})`,
            ...options,
          },
        }
      : {}),
  });
  try {
    if (clear) {
      if (value !== null) throw Error();
      return { success: true };
    }
    const result = record(value);
    if (typeof result.message === 'string') return { success: true };
    if (
      result.success === true &&
      Number.isSafeInteger(result.count) &&
      Number(result.count) >= 0
    )
      return { success: true, count: Number(result.count) };
    throw Error();
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The write response was incomplete. ${recovery}`,
      5
    );
  }
}
/** @param {Profile} profile @param {string} key @param {'events'|'posts'} scope @param {string} id @param {'mute'|'unmute'|'mute-status'} action */
export async function subscription(profile, key, scope, id, action) {
  notificationTarget(id);
  await requireControls(profile, key);
  const path = `/muting/${scope}/${id}`;
  if (action === 'mute-status') {
    const result = record(await readApi(profile, key, path));
    if (
      typeof result.isMuted !== 'boolean' ||
      typeof result.effectiveMuted !== 'boolean' ||
      (scope === 'posts' && typeof result.eventMuted !== 'boolean')
    )
      throw new CliError('INVALID_RESPONSE', 'Invalid mute status.', 5);
    return {
      isMuted: result.isMuted,
      ...(scope === 'posts' ? { eventMuted: result.eventMuted } : {}),
      effectiveMuted: result.effectiveMuted,
    };
  }
  const recovery = `Inspect ${scope} mute-status ${id} --profile ${profile.name} before repeating this action; this write was not retried.`;
  const value = await mutateApi(profile, key, path, {
    method: action === 'mute' ? 'POST' : 'DELETE',
    body: {},
    recovery,
  });
  try {
    if (
      action === 'unmute'
        ? value !== null
        : typeof record(value).message !== 'string'
    )
      throw Error();
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The write response was incomplete. ${recovery}`,
      5
    );
  }
  return { success: true };
}
