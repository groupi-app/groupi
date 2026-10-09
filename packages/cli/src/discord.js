import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { readPaginated } from './pagination.js';
import { mutateApi } from './mutations.js';
/** @typedef {{name:string,apiUrl:string}} Profile */
/** @param {Profile} profile @param {string} key */
async function support(profile, key) {
  const health =
    /** @type {{capabilities?:{discordGuilds?:{version?:number}}}} */ (
      await readApi(profile, key, '/health')
    );
  if (health?.capabilities?.discordGuilds?.version !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Update the server to support Discord guild discovery.',
      5
    );
}
/** @param {Profile} profile @param {string} key @param {{limit:number,cursor?:string,all?:boolean}} options */
export async function listDiscordGuilds(profile, key, options) {
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  )
    throw new CliError('USAGE', '--limit must be an integer from 1 to 100.', 2);
  await support(profile, key);
  return readPaginated({
    ...options,
    fetchPage: ({ cursor, limit }) => {
      const query = new URLSearchParams({ limit: String(limit) });
      if (cursor) query.set('cursor', cursor);
      return readApi(profile, key, `/discord/guilds?${query}`);
    },
    projectItem: item => {
      const row =
        /** @type {{id?:unknown,name?:unknown,status?:unknown,authorizedAt?:unknown,expiresAt?:unknown}} */ (
          item
        );
      if (
        !row ||
        typeof row.id !== 'string' ||
        typeof row.name !== 'string' ||
        !['available', 'invitable'].includes(String(row.status)) ||
        typeof row.authorizedAt !== 'number' ||
        !Number.isFinite(row.authorizedAt) ||
        typeof row.expiresAt !== 'number' ||
        !Number.isFinite(row.expiresAt)
      )
        throw new CliError(
          'INVALID_RESPONSE',
          'Expected Discord guild authorization metadata.',
          5
        );
      return {
        id: row.id,
        name: row.name,
        status: row.status,
        authorizedAt: row.authorizedAt,
        expiresAt: row.expiresAt,
      };
    },
  });
}
/** Refresh only a replaceable authorization cache, with one request and no event effects.
 * @param {Profile} profile @param {string} key */
export async function refreshDiscordGuilds(profile, key) {
  await support(profile, key);
  let result;
  try {
    result =
      /** @type {{count?:unknown,authorizedAt?:unknown,expiresAt?:unknown}} */ (
        await mutateApi(profile, key, '/discord/guilds/refresh', {
          method: 'POST',
          body: {},
          recovery:
            'Inspect discord guilds list; guild cache refresh was not retried. Linking Discord requires the app browser flow. If authorization remains unavailable, check the linked account and ask the server operator to check Discord bot configuration.',
          validationGuidance:
            'Link Discord to the selected identity in the app, then run discord guilds refresh.',
        })
      );
  } catch (error) {
    if (error instanceof CliError && error.code === 'CONFLICT')
      throw new CliError(
        'DISCORD_NOT_LINKED',
        'Link Discord to the selected identity in the app, then run discord guilds refresh.',
        2
      );
    throw error;
  }
  if (
    !result ||
    typeof result.count !== 'number' ||
    !Number.isInteger(result.count) ||
    typeof result.authorizedAt !== 'number' ||
    typeof result.expiresAt !== 'number'
  )
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      'Expected refreshed Discord authorization metadata. Inspect discord guilds list.',
      5
    );
  return {
    count: result.count,
    authorizedAt: result.authorizedAt,
    expiresAt: result.expiresAt,
  };
}
