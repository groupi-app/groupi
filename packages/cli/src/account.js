import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
import { webUrl } from './profiles.js';

/** @typedef {{name:string,apiUrl:string,webUrl?:string}} Profile */
/** @param {unknown} value @param {string[]} fields */
function result(value, fields) {
  if (value === null && fields.includes('selectedThemeType')) return null;
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    fields.some(field => field !== 'allowGroupInvitesFrom' && !(field in value))
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned incomplete account settings. Inspect the selected profile before retrying a write.',
      5
    );
  const record = /** @type {Record<string, unknown>} */ (value);
  return Object.fromEntries(
    fields.filter(field => field in record).map(field => [field, record[field]])
  );
}
export const profileFields = [
  'personId',
  'userId',
  'name',
  'email',
  'image',
  'username',
  'bio',
  'pronouns',
];
export const privacyFields = [
  'allowFriendRequestsFrom',
  'allowEventInvitesFrom',
  'allowGroupInvitesFrom',
];
export const themeFields = [
  'selectedThemeType',
  'selectedThemeId',
  'selectedCustomThemeId',
  'useSystemPreference',
  'systemLightThemeId',
  'systemDarkThemeId',
];
/** @param {string} input @param {string} label */
export function jsonObject(input, label) {
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      return parsed;
  } catch {
    /* Explain invalid JSON without echoing potentially secret content. */
  }
  throw new CliError('USAGE', `${label} must be a JSON object.`, 2);
}
/** @param {Record<string,unknown>} body @param {string[]} fields */
export function checkFields(body, fields) {
  if (
    !Object.keys(body).length ||
    Object.keys(body).some(field => !fields.includes(field))
  )
    throw new CliError(
      'USAGE',
      'Supply at least one supported setting. Use --help for allowed fields.',
      2
    );
}
/** @param {Profile} profile @param {string} key @param {string} path @param {string[]} fields */
export async function getSettings(profile, key, path, fields) {
  return result(await readApi(profile, key, path), fields);
}
/** @param {Profile} profile @param {string} key @param {string} path @param {unknown} body @param {string[]} fields @param {{yes?:boolean,json?:boolean,target?:string}} [confirmation] */
export async function setSettings(
  profile,
  key,
  path,
  body,
  fields,
  confirmation
) {
  const recovery = `Inspect the selected profile with ${path === '/profile' ? 'account get' : path === '/themes/preferences' ? 'settings theme get' : `settings ${path.split('/').pop()} get`} before deciding whether to repeat this update.`;
  const response = await mutateApi(profile, key, path, {
    method: 'PUT',
    body,
    recovery,
    ...(confirmation
      ? {
          confirmation: {
            ...confirmation,
            target:
              confirmation.target ??
              'replace notification methods and remove omitted methods',
          },
        }
      : {}),
  });
  try {
    if (response === null)
      throw new CliError('INVALID_RESPONSE', 'Missing saved preferences.', 5);
    return result(response, fields);
  } catch (error) {
    if (error instanceof CliError && error.code === 'INVALID_RESPONSE')
      throw new CliError(
        'UNCERTAIN_OUTCOME',
        `The server accepted the update but returned incomplete settings. ${recovery}`,
        5
      );
    throw error;
  }
}
/** @param {Profile} profile @param {'passkeys'|'linked-accounts'} operation @param {boolean} json */
export async function browserHandoff(profile, operation, json) {
  if (json || !process.stdin.isTTY || !process.stdout.isTTY)
    throw new CliError(
      'BROWSER_INTERACTION_REQUIRED',
      `Run groupi --profile ${profile.name} account ${operation} in an interactive terminal. Sign into the intended account on this profile's website and finish the action there.`,
      3
    );
  if (!profile.webUrl)
    throw new CliError(
      'WEB_URL_REQUIRED',
      'Create a connection profile with --web-url <origin> for this server. Browser exceptions never fall back to the hosted website.',
      2
    );
  const url = new URL('/settings/account', webUrl(profile.webUrl)).href;
  const step =
    operation === 'passkeys'
      ? 'Add a passkey in account settings and complete your device prompt.'
      : 'Choose the account provider in account settings and complete its authorization.';
  process.stderr.write(
    `Profile ${profile.name}: ${url}\nSign into the intended account on this server. ${step}\n`
  );
  const { openBrowser } = await import('./login.js');
  await openBrowser(url);
  return {
    profile: profile.name,
    url,
    operation,
    browserOpened: true,
    completed: false,
  };
}
