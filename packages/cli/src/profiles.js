import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CliError } from './errors.js';

export const HOSTED_API = 'https://trustworthy-warthog-524.convex.site/api/v2';

function directory() {
  return process.env.GROUPI_CONFIG_DIR || join(homedir(), '.config', 'groupi');
}

/** @param {string} name */
function profileFile(name) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(name)) {
    throw new CliError(
      'INVALID_PROFILE',
      'Profile names must use 1–64 letters, numbers, hyphens or underscores.',
      2
    );
  }
  return join(directory(), `${name}.json`);
}

/** @param {string} value */
export function apiUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new CliError(
      'INVALID_ENDPOINT',
      'Provide an absolute REST v2 API URL.',
      2
    );
  }
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.replace(/\/$/, '').endsWith('/api/v2')
  ) {
    throw new CliError(
      'INVALID_ENDPOINT',
      'Use an HTTPS URL ending in /api/v2 without credentials, query or fragment. HTTP is allowed only for loopback development.',
      2
    );
  }
  return url.href.replace(/\/$/, '');
}

/** @param {string} name @param {string} value */
export async function addProfile(name, value) {
  const file = profileFile(name);
  if (name === 'default')
    throw new CliError(
      'INVALID_PROFILE',
      'The default hosted profile is reserved; choose another name.',
      2
    );
  const profile = { name, apiUrl: apiUrl(value) };
  await mkdir(directory(), { recursive: true, mode: 0o700 });
  try {
    await writeFile(file, JSON.stringify({ apiUrl: profile.apiUrl }) + '\n', {
      flag: 'wx',
      mode: 0o600,
    });
  } catch {
    throw new CliError(
      'PROFILE_WRITE_FAILED',
      'Could not create profile. Choose a new name or check config directory permissions.',
      2
    );
  }
  return profile;
}

/** @param {string} name */
export async function getProfile(name) {
  profileFile(name);
  if (name === 'default') return { name, apiUrl: HOSTED_API };
  let data;
  try {
    data = JSON.parse(await readFile(profileFile(name), 'utf8'));
  } catch {
    throw new CliError(
      'UNKNOWN_PROFILE',
      'Profile is missing or unreadable. Create it with groupi profile add <name> --api-url <url>.',
      2
    );
  }
  if (!data || typeof data.apiUrl !== 'string')
    throw new CliError(
      'INVALID_PROFILE',
      'Profile must contain an apiUrl string.',
      2
    );
  return { name, apiUrl: apiUrl(data.apiUrl) };
}

/** @param {string} profile */
export function environmentKey(profile) {
  const key = process.env.GROUPI_API_KEY?.trim();
  if (!key)
    throw new CliError(
      'AUTH_REQUIRED',
      'Supply GROUPI_API_KEY or use --api-key-stdin. Browser login is not available in this milestone.',
      3
    );
  if ((process.env.GROUPI_API_KEY_PROFILE || 'default') !== profile)
    throw new CliError(
      'KEY_PROFILE_MISMATCH',
      'Set GROUPI_API_KEY_PROFILE to the selected profile to explicitly bind the temporary key.',
      3
    );
  return key;
}

/** @param {string} profile @param {boolean} stdin */
export async function credential(profile, stdin) {
  if (!stdin) return environmentKey(profile);
  if (process.stdin.isTTY)
    throw new CliError(
      'AUTH_REQUIRED',
      'Pipe an API key to --api-key-stdin; interactive key entry is not supported.',
      3
    );
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk.toString();
    if (input.length > 8192)
      throw new CliError(
        'INVALID_CREDENTIAL',
        'API key input exceeds 8192 characters.',
        3
      );
  }
  const key = input.trim();
  // eslint-disable-next-line no-control-regex -- Credentials cannot contain HTTP header controls.
  if (!key || /[\s\x00-\x1f\x7f]/.test(key))
    throw new CliError(
      'INVALID_CREDENTIAL',
      'Provide exactly one API key on stdin.',
      3
    );
  return key;
}
