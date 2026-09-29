import { CliError } from './errors.js';
import { readApi } from './transport.js';

/** @param {unknown} value */
function eventRecord(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !('title' in value) ||
    typeof value.title !== 'string'
  ) {
    throw new CliError(
      'INVALID_RESPONSE',
      'Expected an event with an id and title.',
      5
    );
  }
  return value;
}

/** @param {{apiUrl: string}} profile @param {string} key @param {string} id */
export async function getEvent(profile, key, id) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id))
    throw new CliError('USAGE', 'Provide an event id from events list.', 2);
  return eventRecord(
    await readApi(profile, key, `/events/${encodeURIComponent(id)}`)
  );
}

/** @param {{apiUrl: string}} profile @param {string} key @param {{limit: number, cursor?: string, all?: boolean}} options */
export async function listEvents(profile, key, options) {
  let cursor = options.cursor;
  const items = [];
  const seen = new Set();
  do {
    const query = new URLSearchParams({
      pagination: 'cursor',
      limit: String(options.limit),
    });
    if (cursor) query.set('cursor', cursor);
    const page = await readApi(profile, key, `/events?${query}`);
    if (
      !page ||
      typeof page !== 'object' ||
      !('items' in page) ||
      !Array.isArray(page.items) ||
      !('nextCursor' in page) ||
      !(
        page.nextCursor === null ||
        (typeof page.nextCursor === 'string' && page.nextCursor.length > 0)
      )
    ) {
      throw new CliError(
        'INVALID_RESPONSE',
        'Expected a cursor-paginated event page. The server may need an update.',
        5
      );
    }
    items.push(...page.items.map(eventRecord));
    if (!options.all || page.nextCursor === null)
      return { items, nextCursor: page.nextCursor };
    if (seen.has(page.nextCursor))
      throw new CliError(
        'INVALID_RESPONSE',
        'Server repeated a pagination cursor; retrieval stopped.',
        5
      );
    seen.add(page.nextCursor);
    cursor = page.nextCursor;
  } while (cursor);
}
