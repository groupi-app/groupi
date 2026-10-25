import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
/** @param {string} id @param {string} type */
function path(id, type) {
  if (
    !/^[a-zA-Z0-9_-]+$/.test(id) ||
    !/^(reminders|questionnaire|bring-list|discord|custom:[a-zA-Z0-9_-]+)$/.test(
      type
    )
  )
    throw new CliError('USAGE', 'Provide a valid event ID and add-on type.', 2);
  return `/events/${id}/addons/${encodeURIComponent(type)}`;
}
/** @param {{name:string,apiUrl:string}} profile @param {string} key @param {string} id @param {string} type @param {string} action @param {unknown} data @param {{fieldId?:string,yes?:boolean,json?:boolean}} options */
export async function participate(
  profile,
  key,
  id,
  type,
  action,
  data,
  options
) {
  const endpoint = path(id, type);
  if (
    ['respond', 'claim', 'vote', 'toggle'].includes(action) &&
    (!data || typeof data !== 'object' || Array.isArray(data))
  )
    throw new CliError(
      'USAGE',
      'Provide a submission object with --data or --data-file.',
      2
    );
  if (['vote', 'toggle', 'execute'].includes(action) && !options.fieldId)
    throw new CliError('USAGE', 'Provide --field for this custom action.', 2);
  if (JSON.stringify(data).length > 65536)
    throw new CliError('USAGE', 'Submission exceeds 64 KiB.', 2);
  const health =
    /** @type {{capabilities?:{addonParticipation?:{version?:number}}}} */ (
      await readApi(profile, key, '/health')
    );
  if (health.capabilities?.addonParticipation?.version !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Server must advertise addonParticipation version 1; no write sent.',
      5
    );
  const recovery = `Inspect addons data ${id} ${type} and addons get ${id} ${type} --profile ${profile.name} before repeating. Action buttons can send notifications or webhooks; no write was retried.`;
  const result = await mutateApi(profile, key, `${endpoint}/participation`, {
    method: 'POST',
    validationGuidance:
      'Inspect addons get for enabled state and configured IDs. Answers must match required fields and allowed options; claims are positive integer quantities within availability; votes use {options:[]}, toggles {enabled:boolean}. Only reminders supports opt-out.',
    body: {
      action,
      data,
      ...(options.fieldId ? { fieldId: options.fieldId } : {}),
    },
    recovery,
    ...(action.startsWith('clear-') || action === 'execute'
      ? {
          confirmation: {
            target: `${action} for ${type} on event ${id} in ${profile.name} (${profile.apiUrl})`,
            ...options,
          },
        }
      : {}),
  });
  const value = /** @type {Record<string,unknown>|null} */ (result);
  if (value && typeof value === 'object') {
    if (
      (action === 'opt-in' || action === 'opt-out') &&
      value.isOptedOut === (action === 'opt-out')
    )
      return { isOptedOut: value.isOptedOut };
    if (
      (action.startsWith('clear-') || action === 'execute') &&
      value.success === true
    )
      return { success: true };
    if (
      ['respond', 'claim', 'vote', 'toggle'].includes(action) &&
      typeof value.id === 'string' &&
      value.id &&
      typeof value.created === 'boolean'
    )
      return { id: value.id, created: value.created };
  }
  throw new CliError(
    'UNCERTAIN_OUTCOME',
    `Incomplete participation result. ${recovery}`,
    5
  );
}
/** @param {{name:string,apiUrl:string}} profile @param {string} key @param {string} id @param {string} type @param {{limit?:string,cursor?:string,all?:boolean}} input */
export async function participationData(profile, key, id, type, input) {
  const limit = Number(input.limit ?? 20);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    throw new CliError('USAGE', '--limit must be from 1 to 100.', 2);
  let cursor = input.cursor;
  const items = [],
    seen = new Set();
  do {
    const query = new URLSearchParams({
      pagination: 'cursor',
      limit: String(limit),
      ...(cursor ? { cursor } : {}),
    });
    const result =
      /** @type {{items?:unknown[],nextCursor?:string|null,isOptedOut?:boolean}} */ (
        await readApi(profile, key, `${path(id, type)}/data?${query}`)
      );
    if (
      !Array.isArray(result.items) ||
      !(
        result.nextCursor === null ||
        (typeof result.nextCursor === 'string' && result.nextCursor.length > 0)
      ) ||
      typeof result.isOptedOut !== 'boolean'
    )
      throw new CliError(
        'INVALID_RESPONSE',
        'Expected cursor-paginated participant data; update server.',
        5
      );
    for (const entry of result.items) {
      const item = /** @type {Record<string,unknown>|null} */ (entry);
      if (
        !item ||
        typeof item !== 'object' ||
        typeof item.id !== 'string' ||
        typeof item.key !== 'string' ||
        !('data' in item) ||
        !(item.createdBy === null || typeof item.createdBy === 'string') ||
        !Number.isFinite(item.createdAt) ||
        !Number.isFinite(item.updatedAt)
      )
        throw new CliError(
          'INVALID_RESPONSE',
          'Incomplete participant data entry.',
          5
        );
      items.push({
        id: item.id,
        key: item.key,
        data: item.data,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    }
    if (!input.all || result.nextCursor === null)
      return {
        items,
        nextCursor: result.nextCursor,
        isOptedOut: result.isOptedOut,
      };
    if (!result.nextCursor || seen.has(result.nextCursor))
      throw new CliError('INVALID_RESPONSE', 'Repeated participant cursor.', 5);
    seen.add(result.nextCursor);
    cursor = result.nextCursor;
  } while (cursor);
  throw new CliError('INVALID_RESPONSE', 'Incomplete participant page.', 5);
}
