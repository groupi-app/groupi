import { registerGroupPollCommands } from './group-poll-commands.js';
import { registerGroupListCommands } from './group-list-commands.js';
import { registerGroupEventAudienceCommands } from './group-event-audience-commands.js';

import { registerGroupFormCommands } from './group-form-commands.js';
import { registerGroupQuestionnaireCommands } from './group-questionnaire-commands.js';
import { registerGroupApplicationCommands } from './group-application-commands.js';
import { registerGroupModerationCommands } from './group-moderation-commands.js';
import { registerGroupInvitationCommands } from './group-invitation-commands.js';
import { registerGroupCommands } from './group-commands.js';
import { registerDiscussionCommands } from './discussion-commands.js';
import { registerDiscordCommands } from './discord-commands.js';
import { registerAddonCommands } from './addon-commands.js';
import { registerEventManagementCommands } from './event-management-commands.js';
import { registerSocialCommands } from './social-commands.js';
import { registerAccountCommands } from './account-commands.js';
import { registerNotificationCommands } from './notification-commands.js';
import { registerAttendanceCommands } from './attendance-commands.js';
import { registerInviteCommands } from './invite-commands.js';
import { registerInviteListCommands } from './invite-list-commands.js';
import { eventInput, validateRequestId } from './event-input.js';
import { Command, CommanderError, Option } from 'commander';
import { readFileSync } from 'node:fs';
import {
  addProfile,
  getProfile,
  credential,
  authentication,
} from './profiles.js';
import { readApi } from './transport.js';
import { listEvents, getEvent, createEvent, editEvent } from './events.js';
import { CliError } from './errors.js';

/** @param {unknown} value */
function plain(value) {
  // Remote strings must not execute terminal escape/control sequences.
  // eslint-disable-next-line no-control-regex -- Deliberately strip terminal controls.
  return String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
}

/** Build the public command tree without parsing or performing any operation.
 * @param {boolean} json */
export function createProgram(json = false) {
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
    .option('--non-interactive', 'Never open the terminal interface')
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
    .action(async () => {
      if (json)
        throw new CliError(
          'USAGE',
          'Select a command; use --help to discover commands.',
          2
        );
      if (
        process.stdin.isTTY &&
        process.stdout.isTTY &&
        !program.opts().nonInteractive &&
        !program.opts().apiKeyStdin
      ) {
        const { launchTerminal } = await import('./tui/app.js');
        await launchTerminal(program.opts());
      } else program.outputHelp();
    });
  program
    .command('tui')
    .description('Open the keyboard-driven terminal interface')
    .action(async () => {
      const { launchTerminal } = await import('./tui/app.js');
      await launchTerminal(program.opts());
    });
  const auth = program.command('auth').description('Manage authentication');
  auth
    .command('login')
    .description('Explicitly authorize this profile in your browser')
    .option('--no-browser', 'Show the authorization URL for manual opening')
    .option(
      '--timeout <seconds>',
      'Authorization timeout (10–300 seconds)',
      '300'
    )
    .option(
      '--web-url <origin>',
      'Explicit authorization website for this login'
    )
    .action(async loginOptions => {
      if (json || !process.stdin.isTTY || !process.stdout.isTTY)
        throw new CliError(
          'BROWSER_INTERACTION_REQUIRED',
          'Run groupi auth login in an interactive terminal, or supply an existing key through GROUPI_API_KEY or --api-key-stdin.',
          3
        );
      if (
        !/^[0-9]+$/.test(loginOptions.timeout) ||
        Number(loginOptions.timeout) < 10 ||
        Number(loginOptions.timeout) > 300
      )
        throw new CliError(
          'USAGE',
          '--timeout must be an integer from 10 to 300 seconds.',
          2
        );
      if (program.opts().apiKeyStdin)
        throw new CliError(
          'USAGE',
          'Browser login cannot consume an API key from stdin.',
          2
        );
      const { login } = await import('./login.js');
      const profile = await getProfile(program.opts().profile);
      const account = await login(profile, {
        ...loginOptions,
        timeout: Number(loginOptions.timeout),
      });
      process.stdout.write(
        `Connected ${plain(account.name)} (${plain(account.email)}) to profile ${plain(profile.name)}.\n`
      );
    });
  auth
    .command('status')
    .description(
      'Verify the selected profile and account without revealing credentials'
    )
    .action(async () => {
      const options = program.opts();
      const profile = await getProfile(options.profile);
      const selected = await authentication(profile, !!options.apiKeyStdin);
      const data = await readApi(profile, selected.apiKey, '/profile');
      if (
        !data ||
        typeof data !== 'object' ||
        !('userId' in data) ||
        typeof data.userId !== 'string' ||
        !('name' in data) ||
        !(typeof data.name === 'string' || data.name === null) ||
        !('email' in data) ||
        !(typeof data.email === 'string' || data.email === null)
      )
        throw new CliError(
          'INVALID_RESPONSE',
          'The server returned an invalid account profile.',
          5
        );
      if ('account' in selected && selected.account?.id !== data.userId)
        throw new CliError(
          'ACCOUNT_MISMATCH',
          'The saved credential belongs to a different account. Log out and explicitly authorize this profile again.',
          3
        );
      const result = {
        profile: profile.name,
        apiUrl: profile.apiUrl,
        source: selected.source,
        account: { id: data.userId, name: data.name, email: data.email },
        ...('expiresAt' in selected ? { expiresAt: selected.expiresAt } : {}),
      };
      process.stdout.write(
        json
          ? JSON.stringify(result) + '\n'
          : `Profile ${plain(profile.name)}: ${plain(data.name)} (${plain(data.email)}), using ${selected.source}.\n`
      );
    });
  auth
    .command('logout')
    .description(
      'Remove this profile’s saved credential; temporary keys are unchanged'
    )
    .option(
      '--revoke',
      'Also revoke this saved key on the server before removing it'
    )
    .action(async logoutOptions => {
      if (program.opts().apiKeyStdin)
        throw new CliError(
          'USAGE',
          'Logout manages the saved credential only; omit --api-key-stdin.',
          2
        );
      const profile = await getProfile(program.opts().profile);
      const { readCredential, deleteCredential } = await import(
        './credential-store.js'
      );
      const saved = await readCredential(profile);
      if (saved && logoutOptions.revoke) {
        const { authRequest } = await import('./login.js');
        await authRequest(profile, '/auth/cli/revoke', {}, saved.apiKey);
      }
      await deleteCredential(profile);
      const result = {
        profile: profile.name,
        removed: !!saved,
        revoked: !!saved && !!logoutOptions.revoke,
      };
      process.stdout.write(
        json
          ? JSON.stringify(result) + '\n'
          : `Profile ${plain(profile.name)}: ${saved ? 'saved credential removed' : 'no saved credential'}. ${result.revoked ? 'Server key revoked.' : 'Server key was not revoked.'} Environment/stdin keys are unchanged.\n`
      );
    });
  const profiles = program
    .command('profile')
    .description('Manage connection profiles');
  profiles
    .command('add <name>')
    .requiredOption('--api-url <url>', 'REST v2 API URL')
    .option('--web-url <url>', 'Authorization website origin for browser login')
    .action(async (name, options) => {
      const result = await addProfile(name, options.apiUrl, options.webUrl);
      process.stdout.write(
        json
          ? JSON.stringify(result) + '\n'
          : `Created profile ${plain(result.name)}: ${plain(result.apiUrl)}\n`
      );
    });
  const events = program
    .command('events')
    .description('Browse and manage your events');
  events
    .command('create')
    .description('Create an event with replay-safe request identification')
    .requiredOption('--title <title>', 'Event title')
    .option('--description <text>', 'Event description')
    .option('--location <text>', 'Event location')
    .option('--start <iso>', 'Fixed start with explicit UTC offset or Z')
    .option('--end <iso>', 'Fixed end with explicit UTC offset or Z')
    .option(
      '--date-options <json>',
      'Proposed dates as [{start,end?,note?}] with explicit offsets'
    )
    .option(
      '--request-id <id>',
      'Reuse the identifier from a previous attempt with the same inputs'
    )
    .action(async input => {
      const body = eventInput(input, true);
      if (input.requestId !== undefined) validateRequestId(input.requestId);
      const options = program.opts();
      const profile = await getProfile(options.profile);
      const result = await createEvent(
        profile,
        await credential(profile, !!options.apiKeyStdin),
        body,
        input.requestId
      );
      process.stdout.write(
        json
          ? JSON.stringify(result) + '\n'
          : `Created event ${plain(result.eventId)}. Request ID: ${plain(result.requestId)}\n`
      );
    });
  events
    .command('edit <event-id>')
    .description(
      'Edit event details; uncertain writes are never retried automatically'
    )
    .option('--title <title>', 'New event title')
    .option('--description <text>', 'New description; empty string clears it')
    .option('--location <text>', 'New location; empty string clears it')
    .option(
      '--date-options <json>',
      'Replace proposed dates and clear availability; requires confirmation'
    )
    .option(
      '--yes',
      'Confirm replacing proposed dates and clearing availability'
    )
    .action(async (id, input) => {
      const body = eventInput(input, false);
      const options = program.opts();
      const profile = await getProfile(options.profile);
      const result = await editEvent(
        profile,
        await credential(profile, !!options.apiKeyStdin),
        id,
        body,
        { yes: input.yes, json }
      );
      process.stdout.write(
        json
          ? JSON.stringify(result) + '\n'
          : `Updated event ${plain(result.id)}: ${plain(result.title)}\n`
      );
    });
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
        await credential(profile, !!options.apiKeyStdin),
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
        await credential(profile, !!options.apiKeyStdin),
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
  registerDiscordCommands(program, json);
  registerAddonCommands(program, json);
  registerSocialCommands(program, json);
  registerGroupCommands(program, json);
  registerGroupInvitationCommands(program, json);
  registerGroupModerationCommands(program, json);
  registerGroupQuestionnaireCommands(program, json);
  registerGroupFormCommands(program, json);
  registerGroupPollCommands(program, json);
  registerGroupListCommands(program, json);
  registerGroupApplicationCommands(program, json);
  registerGroupEventAudienceCommands(program, json);
  registerAccountCommands(program, json);
  registerDiscussionCommands(program, json);
  registerInviteCommands(program, json);
  registerInviteListCommands(program, json);
  registerNotificationCommands(program, events, json);
  registerAttendanceCommands(program, events, json);
  registerEventManagementCommands(program, events, json);
  return program;
}

export async function run() {
  const argv = process.argv.slice(2);
  const json = argv.some(
    (arg, i) =>
      arg === '--format=json' || (arg === '--format' && argv[i + 1] === 'json')
  );
  const program = createProgram(json);
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
