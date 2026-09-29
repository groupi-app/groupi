import { Command, CommanderError, Option } from 'commander';
import { readFileSync } from 'node:fs';
import { addProfile, getProfile, credential } from './profiles.js';
import { listEvents, getEvent } from './events.js';
import { CliError } from './errors.js';

/** @param {unknown} value */
function plain(value) {
  // Remote strings must not execute terminal escape/control sequences.
  // eslint-disable-next-line no-control-regex -- Deliberately strip terminal controls.
  return String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
}

export async function run() {
  const argv = process.argv.slice(2);
  const json = argv.some(
    (arg, i) =>
      arg === '--format=json' || (arg === '--format' && argv[i + 1] === 'json')
  );
  const metadata = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );
  const program = new Command()
    .name('groupi')
    .description('Groupi event planning')
    .version(metadata.version)
    .option(
      '--profile <name>',
      'Named connection profile',
      process.env.GROUPI_PROFILE || 'default'
    )
    .option(
      '--api-key-stdin',
      'Read one temporary API key from stdin (overrides environment)'
    )
    .addOption(
      new Option('--format <format>', 'Output format')
        .choices(['human', 'json'])
        .default('human')
    )
    .exitOverride()
    .configureOutput({
      writeOut: text =>
        process.stdout.write(json ? JSON.stringify({ text }) + '\n' : text),
      writeErr: () => {},
    })
    .action(() => {
      if (json)
        throw new CliError(
          'USAGE',
          'Select a command; use --help to discover commands.',
          2
        );
      program.outputHelp();
    });
  const profiles = program
    .command('profile')
    .description('Manage connection profiles');
  profiles
    .command('add <name>')
    .requiredOption('--api-url <url>', 'REST v2 API URL')
    .action(async (name, options) => {
      const result = await addProfile(name, options.apiUrl);
      process.stdout.write(
        json
          ? JSON.stringify(result) + '\n'
          : `Created profile ${plain(result.name)}: ${plain(result.apiUrl)}\n`
      );
    });
  const events = program.command('events').description('Browse your events');
  events
    .command('list')
    .option('--limit <number>', 'Page size (1–100)', '20')
    .option('--cursor <cursor>', 'Continue a previous page')
    .option('--all', 'Explicitly retrieve every page')
    .action(async paging => {
      if (
        !/^[0-9]+$/.test(paging.limit) ||
        Number(paging.limit) < 1 ||
        Number(paging.limit) > 100
      )
        throw new CliError(
          'USAGE',
          '--limit must be an integer from 1 to 100.',
          2
        );
      const options = program.opts();
      const profile = await getProfile(options.profile);
      const result = await listEvents(
        profile,
        await credential(profile.name, !!options.apiKeyStdin),
        { limit: Number(paging.limit), cursor: paging.cursor, all: paging.all }
      );
      if (!result)
        throw new CliError('INVALID_RESPONSE', 'Incomplete event page.', 5);
      process.stdout.write(
        json
          ? JSON.stringify(result) + '\n'
          : (result.items.length
              ? result.items
                  .map(event => `${plain(event.id)}  ${plain(event.title)}`)
                  .join('\n')
              : 'No events on this page.') +
              '\n' +
              (result.nextCursor
                ? `More events: use --cursor ${plain(result.nextCursor)} or --all.\n`
                : '')
      );
    });
  events
    .command('get <event-id>')
    .description('Read one accessible event')
    .action(async id => {
      const options = program.opts();
      const profile = await getProfile(options.profile);
      const result = await getEvent(
        profile,
        await credential(profile.name, !!options.apiKeyStdin),
        id
      );
      process.stdout.write(
        json
          ? JSON.stringify(result) + '\n'
          : Object.entries(result)
              .map(
                ([name, value]) =>
                  `${plain(name)}: ${plain(typeof value === 'object' && value !== null ? JSON.stringify(value) : value)}`
              )
              .join('\n') + '\n'
      );
    });
  try {
    await program.parseAsync(argv, { from: 'user' });
  } catch (error) {
    if (error instanceof CommanderError && error.exitCode === 0) return;
    const failure =
      error instanceof CliError
        ? error
        : error instanceof CommanderError
          ? new CliError(
              'USAGE',
              'Invalid command, missing argument, or option. Use --help for usage.',
              2
            )
          : new CliError(
              'INTERNAL_ERROR',
              'The command could not complete. Check your connection and configuration.'
            );
    process.stderr.write(
      json
        ? JSON.stringify({
            error: { code: failure.code, message: failure.message },
          }) + '\n'
        : `${failure.code}: ${failure.message}\n`
    );
    process.exitCode = failure.exitCode;
  }
}
