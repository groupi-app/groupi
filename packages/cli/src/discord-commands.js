import { getProfile, credential } from './profiles.js';
import { listDiscordGuilds, refreshDiscordGuilds } from './discord.js';
/** @param {import('commander').Command} program @param {boolean} json */
export function registerDiscordCommands(program, json) {
  const guilds = program
    .command('discord')
    .description(
      'Discover authorized Discord servers using your linked account'
    )
    .command('guilds')
    .description(
      'Inspect and refresh guild eligibility; linking requires the app browser flow'
    );
  guilds
    .command('list')
    .description(
      'List cached available/invitable servers; expiresAt marks freshness'
    )
    .option('--limit <number>', 'Page size (1–100)', '20')
    .option('--cursor <cursor>', 'Continue a prior page')
    .option('--all', 'Retrieve all pages')
    .action(async input => {
      const { profile, key } = await connection();
      output(
        await listDiscordGuilds(profile, key, {
          ...input,
          limit: /^\d+$/.test(input.limit) ? Number(input.limit) : NaN,
        })
      );
    });
  guilds
    .command('refresh')
    .description(
      'Refresh your authorization cache from Discord (no event changes, no automatic retries)'
    )
    .action(async () => {
      const { profile, key } = await connection();
      output(await refreshDiscordGuilds(profile, key));
    });
  async function connection() {
    const options = program.opts();
    const profile = await getProfile(options.profile);
    return { profile, key: await credential(profile, !!options.apiKeyStdin) };
  }
  /** @param {unknown} value */
  function output(value) {
    process.stdout.write(
      (json
        ? JSON.stringify(value)
        : JSON.stringify(value, null, 2).replace(
            // eslint-disable-next-line no-control-regex -- Remote guild names cannot control the terminal.
            /[\x00-\x08\x0b-\x1f\x7f-\x9f]/g,
            ' '
          )) + '\n'
    );
  }
}
