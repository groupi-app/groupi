import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';

const base = '/addon-template-definitions';
/** @typedef {{name:string,apiUrl:string}} Profile */
/** @param {unknown} value @returns {value is Record<string,unknown>} */
function object(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
/** @param {string} id */
function path(id) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id))
    throw new CliError('USAGE', 'Provide a valid template ID.', 2);
  return `${base}/${id}`;
}
/** Validate the portable envelope; the server validates the complete field/action schema.
 * @param {unknown} value */
export function definitionInput(value) {
  if (
    !object(value) ||
    value.schemaVersion !== 1 ||
    Object.keys(value).some(
      key =>
        ![
          'schemaVersion',
          'name',
          'description',
          'iconName',
          'template',
        ].includes(key)
    ) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    value.name.length > 60 ||
    typeof value.description !== 'string' ||
    value.description.length > 200 ||
    typeof value.iconName !== 'string' ||
    !value.iconName.trim() ||
    !object(value.template)
  )
    throw new CliError(
      'USAGE',
      'Definition requires schemaVersion:1, name (1–60 characters), description (at most 200), iconName and template. IDs, owner, publication state and unknown fields are not importable.',
      2
    );
  if (Buffer.byteLength(JSON.stringify(value)) > 65536)
    throw new CliError('USAGE', 'Definition exceeds 64 KiB.', 2);
  return value;
}
/** @param {unknown} value */
function result(value) {
  if (
    !object(value) ||
    typeof value.id !== 'string' ||
    !value.id ||
    typeof value.name !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.iconName !== 'string' ||
    !object(value.template) ||
    !Number.isSafeInteger(value.version) ||
    Number(value.version) < 1 ||
    typeof value.isPublished !== 'boolean' ||
    !Number.isFinite(value.createdAt) ||
    !Number.isFinite(value.updatedAt)
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Expected a complete custom definition; update the server and inspect the target.',
      5
    );
  return {
    id: value.id,
    name: value.name,
    description: value.description,
    iconName: value.iconName,
    template: value.template,
    version: /** @type {number} */ (value.version),
    isPublished: value.isPublished,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}
/** @param {Profile} profile @param {string} key */
async function support(profile, key) {
  const health =
    /** @type {{capabilities?:{addonAuthoring?:{version?:number}}}|null} */ (
      await readApi(profile, key, '/health')
    );
  if (health?.capabilities?.addonAuthoring?.version !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'The server must advertise addonAuthoring version 1; no write was sent.',
      5
    );
}
/** @param {ReturnType<typeof result>} value */
export function portableDefinition(value) {
  return {
    schemaVersion: 1,
    name: value.name,
    description: value.description,
    iconName: value.iconName,
    template: value.template,
  };
}
/** @param {Profile} profile @param {string} key @param {string} id */
export async function getDefinition(profile, key, id) {
  const value = result(await readApi(profile, key, path(id)));
  if (value.id !== id)
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned a different template ID.',
      5
    );
  return value;
}
/** @param {Profile} profile @param {string} key @param {unknown} document */
export async function createDefinition(profile, key, document) {
  const body = definitionInput(document);
  await support(profile, key);
  const recovery =
    'Inspect addons definitions list --all on this profile before creating another copy; this write was not retried.';
  const value = await mutateApi(profile, key, base, {
    method: 'POST',
    body,
    recovery,
    validationIssues: true,
    validationGuidance:
      'Use schemaVersion:1 and supported complete template sections/fields. IDs must be unique, field types/options/actions must match the schema, and webhook actions are unsupported. See docs/addon-authoring.md.',
  });
  try {
    const saved = result(value);
    if (saved.isPublished) throw Error();
    return saved;
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The creation response was incomplete. ${recovery}`,
      5
    );
  }
}
/** @param {Profile} profile @param {string} key @param {{limit?:string,cursor?:string,all?:boolean}} input */
export async function listDefinitions(profile, key, input) {
  const limit = Number(input.limit ?? 20);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    throw new CliError('USAGE', '--limit must be an integer from 1 to 100.', 2);
  let cursor = input.cursor;
  const items = [];
  const seen = new Set(cursor ? [cursor] : []);
  do {
    const query = new URLSearchParams({
      limit: String(limit),
      ...(cursor ? { cursor } : {}),
    });
    const page = await readApi(profile, key, `${base}?${query}`);
    if (
      !object(page) ||
      !Array.isArray(page.items) ||
      !(
        page.nextCursor === null ||
        (typeof page.nextCursor === 'string' && page.nextCursor.length > 0)
      )
    )
      throw new CliError(
        'INVALID_RESPONSE',
        'Expected a cursor-paginated definition page.',
        5
      );
    items.push(...page.items.map(result));
    if (!input.all || page.nextCursor === null)
      return { items, nextCursor: page.nextCursor };
    if (seen.has(page.nextCursor))
      throw new CliError(
        'INVALID_RESPONSE',
        'Server repeated a definition cursor; retrieval stopped.',
        5
      );
    seen.add(page.nextCursor);
    cursor = page.nextCursor;
  } while (cursor);
  throw new CliError('INVALID_RESPONSE', 'Incomplete definition page.', 5);
}
/** @param {Profile} profile @param {string} key @param {string} id @param {'edit'|'publish'|'unpublish'|'delete'} operation
 * @param {unknown} document @param {{expectedVersion:string,yes?:boolean,json?:boolean}} options */
export async function changeDefinition(
  profile,
  key,
  id,
  operation,
  document,
  options
) {
  const endpoint = path(id);
  const expectedVersion = Number(options.expectedVersion);
  if (
    !/^\d+$/.test(options.expectedVersion) ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1
  )
    throw new CliError(
      'USAGE',
      '--expected-version must be the positive integer returned by definitions get; inspect before writing.',
      2
    );
  const body =
    operation === 'edit'
      ? { ...definitionInput(document), expectedVersion }
      : { expectedVersion };
  await support(profile, key);
  const recovery = `Inspect addons definitions get ${id} --profile ${profile.name} before any further write; the operation was not retried. A missing definition after delete may mean it succeeded.`;
  const url =
    operation === 'edit'
      ? endpoint
      : operation === 'delete'
        ? `${endpoint}?expectedVersion=${expectedVersion}`
        : `${endpoint}/${operation}`;
  const value = await mutateApi(profile, key, url, {
    method:
      operation === 'edit'
        ? 'PATCH'
        : operation === 'delete'
          ? 'DELETE'
          : 'POST',
    body,
    recovery,
    validationIssues: true,
    validationGuidance:
      'Use a complete supported portable definition and the version returned by definitions get. Sections/fields need unique IDs and valid type-specific configuration; webhook actions are unsupported. Existing data was preserved. See docs/addon-authoring.md.',
    confirmation: {
      target: `${operation} definition ${id} at version ${expectedVersion} on profile ${profile.name} (${profile.apiUrl}); existing event copies are unchanged`,
      ...options,
    },
  });
  try {
    if (operation === 'delete') {
      if (!object(value) || value.id !== id || value.deleted !== true)
        throw Error();
      return { id, deleted: true };
    }
    const saved = result(value);
    if (
      saved.id !== id ||
      saved.version !== expectedVersion + 1 ||
      (operation === 'publish' && !saved.isPublished) ||
      (operation === 'unpublish' && saved.isPublished)
    )
      throw Error();
    return saved;
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The authoring response was incomplete. ${recovery}`,
      5
    );
  }
}
