import { CliError } from './errors.js';

/**
 * Validate and collect the requested pages before returning any result.
 * @template T
 * @param {{
 *   limit: number,
 *   cursor?: string,
 *   all?: boolean,
 *   fetchPage: (request: {cursor: string|undefined, limit: number}) => Promise<unknown>,
 *   projectItem: (item: unknown) => T
 * }} options
 */
export async function readPaginated(options) {
  let cursor = options.cursor;
  const seen = new Set(cursor === undefined ? [] : [cursor]);
  const items = [];
  while (true) {
    const page = await options.fetchPage({ cursor, limit: options.limit });
    if (
      !page ||
      typeof page !== 'object' ||
      Array.isArray(page) ||
      !('items' in page) ||
      !Array.isArray(page.items) ||
      !('nextCursor' in page) ||
      !(
        page.nextCursor === null ||
        (typeof page.nextCursor === 'string' && page.nextCursor.length > 0)
      )
    )
      throw new CliError(
        'INVALID_RESPONSE',
        'Expected a cursor-paginated page. The server may need an update.',
        5
      );
    if (page.items.length > options.limit)
      throw new CliError(
        'INVALID_RESPONSE',
        'Server returned more items than the requested page size.',
        5
      );
    if (page.nextCursor !== null) {
      if (seen.has(page.nextCursor))
        throw new CliError(
          'INVALID_RESPONSE',
          'Server repeated a pagination cursor; retrieval stopped.',
          5
        );
      seen.add(page.nextCursor);
    }
    items.push(...page.items.map(options.projectItem));
    if (!options.all || page.nextCursor === null)
      return { items, nextCursor: page.nextCursor };
    cursor = page.nextCursor;
  }
}
