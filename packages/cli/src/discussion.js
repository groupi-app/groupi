import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
import { CliError } from './errors.js';
/** @typedef {{apiUrl:string,name:string}} Profile */
/** @param {string} value */
function id(value) {
  if (!/^[a-zA-Z0-9_;-]+$/.test(value))
    throw new CliError(
      'USAGE',
      'Provide a content/event ID from the selected profile.',
      2
    );
  return encodeURIComponent(value);
}
/** @param {Profile} profile @param {string} key @param {'posts'|'replies'} kind @param {string} contentId */
export async function getDiscussion(profile, key, kind, contentId) {
  return readApi(profile, key, `/${kind}/${id(contentId)}`);
}
/** @param {Profile} profile @param {string} key @param {'posts'|'replies'} kind @param {string} parentId @param {{limit:number,cursor?:string,all?:boolean}} options */
export async function listDiscussion(profile, key, kind, parentId, options) {
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  )
    throw new CliError('USAGE', '--limit must be 1–100.', 2);
  let cursor = options.cursor;
  const items = [],
    seen = new Set(cursor ? [cursor] : []);
  do {
    const query = new URLSearchParams({
      pagination: 'cursor',
      limit: String(options.limit),
    });
    if (cursor) query.set('cursor', cursor);
    const page = /** @type {{items?:unknown[],nextCursor?:unknown}} */ (
      await readApi(
        profile,
        key,
        `/${kind === 'posts' ? 'events' : 'posts'}/${id(parentId)}/${kind}?${query}`
      )
    );
    if (
      !Array.isArray(page.items) ||
      page.items.length > options.limit ||
      !(
        page.nextCursor === null ||
        (typeof page.nextCursor === 'string' && page.nextCursor)
      )
    )
      throw new CliError(
        'INVALID_RESPONSE',
        'Expected bounded discussion page.',
        5
      );
    items.push(...page.items);
    if (!options.all || page.nextCursor === null)
      return { items, nextCursor: page.nextCursor };
    if (seen.has(page.nextCursor))
      throw new CliError('INVALID_RESPONSE', 'Repeated content cursor.', 5);
    seen.add(page.nextCursor);
    cursor = page.nextCursor;
  } while (cursor);
  throw new CliError('INVALID_RESPONSE', 'Incomplete discussion page.', 5);
}
/** @param {Profile} profile @param {string} key @param {'posts'|'replies'} kind @param {'create'|'edit'|'delete'} operation @param {string} contentId @param {Record<string,unknown>} body @param {{yes?:boolean,json?:boolean}} [options] */
export async function writeDiscussion(
  profile,
  key,
  kind,
  operation,
  contentId,
  body,
  options = {}
) {
  const health =
    /** @type {{capabilities?:{discussion?:{version?:number}}}} */ (
      await readApi(profile, key, '/health')
    );
  if (health?.capabilities?.discussion?.version !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'This server does not support safe discussion writes. Update it before writing.',
      5
    );
  const path =
    operation === 'create'
      ? `/${kind === 'posts' ? 'events' : 'posts'}/${id(contentId)}/${kind}`
      : `/${kind}/${id(contentId)}`;
  const recovery = `Inspect ${kind} ${operation === 'create' ? 'list' : 'get'} ${contentId} on profile ${profile.name} before repeating; no automatic write retry was attempted.`;
  const result = await mutateApi(profile, key, path, {
    method:
      operation === 'create'
        ? 'POST'
        : operation === 'edit'
          ? 'PATCH'
          : 'DELETE',
    body,
    recovery,
    validationGuidance:
      'Check visible limits (title 100, post 3000, reply 5000), safe supported HTML, event-member mentions, attachment ownership, and posting permissions.',
    ...(operation === 'delete' ||
    (Array.isArray(body.attachmentIdsToDelete) &&
      body.attachmentIdsToDelete.length)
      ? {
          confirmation: {
            target: `${operation} ${kind} ${contentId} on ${profile.name}`,
            yes: options.yes,
            json: options.json,
          },
        }
      : {}),
  });
  if (operation === 'delete') return { id: contentId, deleted: true };
  const field =
    operation === 'create' ? (kind === 'posts' ? 'postId' : 'replyId') : 'id';
  if (
    !result ||
    typeof result !== 'object' ||
    !(field in result) ||
    typeof (/** @type {Record<string,unknown>} */ (result)[field]) !== 'string'
  )
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `Incomplete write response. ${recovery}`,
      5
    );
  return result;
}
/** Upload all local files before a single atomic content mutation. Never remove claimed media after an uncertain outcome.
 * @param {Profile} profile @param {string} key @param {'posts'|'replies'} kind @param {'create'|'edit'} operation @param {string} contentId @param {Record<string,unknown>} body @param {string[]} paths @param {{yes?:boolean,json?:boolean}} [options] */
export async function writeDiscussionWithFiles(
  profile,
  key,
  kind,
  operation,
  contentId,
  body,
  paths,
  options = {}
) {
  if (paths.length > 10 || new Set(paths).size !== paths.length)
    throw new CliError(
      'USAGE',
      'Use at most 10 distinct local attachment files.',
      2
    );
  const { uploadFile, cleanupUploads } = await import('./uploads.js');
  const uploaded = [];
  try {
    for (const path of paths)
      uploaded.push(await uploadFile(profile, key, path));
    return await writeDiscussion(
      profile,
      key,
      kind,
      operation,
      contentId,
      {
        ...body,
        ...(uploaded.length
          ? {
              [operation === 'create' ? 'attachments' : 'attachmentsToAdd']:
                uploaded,
            }
          : {}),
      },
      options
    );
  } catch (error) {
    await cleanupUploads(
      profile,
      key,
      uploaded.map(file => file.storageId)
    );
    throw error;
  }
}
