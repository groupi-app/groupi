import { registerEventTransferCommands } from './event-transfer-commands.js';
import { registerImageCommands } from './image-commands.js';
import { Option } from 'commander';
import { getProfile, credential } from './profiles.js';
import { CliError } from './errors.js';
import {
  discoverEvents,
  getEventSettings,
  manageEvent,
} from './event-management.js';
/** @param {unknown} value */
function plain(value) {
  // eslint-disable-next-line no-control-regex -- Prevent remote terminal controls.
  return String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
}
/** @param {import('commander').Command} program @param {import('commander').Command} events @param {boolean} json */
export function registerEventManagementCommands(program, events, json) {
  registerImageCommands(program, events, 'cover', json);
  registerEventTransferCommands(program, events, json);
  const connect = async () => {
    const options = program.opts();
    const profile = await getProfile(options.profile);
    return { profile, key: await credential(profile, !!options.apiKeyStdin) };
  };
  /** @param {unknown} result */
  const print = result =>
    process.stdout.write(
      json
        ? JSON.stringify(result) + '\n'
        : Object.entries(/** @type {Record<string,unknown>} */ (result))
            .map(
              ([name, value]) =>
                `${name}: ${plain(typeof value === 'object' ? JSON.stringify(value) : value)}`
            )
            .join('\n') + '\n'
    );
  events
    .command('discover')
    .description('Browse upcoming friends events you can join')
    .option('--limit <number>', 'Page size (1–100)', '20')
    .option('--cursor <cursor>', 'Continue a previous page')
    .option('--all', 'Retrieve every page explicitly')
    .action(async input => {
      if (
        !/^[0-9]+$/.test(input.limit) ||
        Number(input.limit) < 1 ||
        Number(input.limit) > 100
      )
        throw new CliError(
          'USAGE',
          '--limit must be an integer from 1 to 100.',
          2
        );
      const { profile, key } = await connect();
      const result = await discoverEvents(profile, key, {
        limit: Number(input.limit),
        cursor: input.cursor,
        all: input.all,
      });
      process.stdout.write(
        json
          ? JSON.stringify(result) + '\n'
          : (result.items.length
              ? result.items
                  .map(item => `${plain(item.id)}  ${plain(item.title)}`)
                  .join('\n')
              : 'No discoverable events on this page.') +
              '\n' +
              (result.nextCursor
                ? `More events: use --cursor ${plain(result.nextCursor)} or --all.\n`
                : '')
      );
    });
  for (const action of /** @type {const} */ (['join', 'leave', 'delete'])) {
    const command = events
      .command(`${action} <event-id>`)
      .description(
        action === 'join'
          ? 'Join as an Attendee with Pending RSVP; confirm attendance separately'
          : `${action} an event`
      );
    if (action !== 'join')
      command.option('--yes', `Confirm ${action} for the named event`);
    command.action(async (eventId, input) => {
      const { profile, key } = await connect();
      print(
        await manageEvent(profile, key, eventId, action, {
          yes: input.yes,
          json,
        })
      );
    });
  }
  const membership = events
    .command('membership')
    .description(
      'Manage event member roles and removal; inspect using events members'
    );
  membership
    .command('role <event-id> <member-id>')
    .addOption(
      new Option('--role <role>', 'New event role')
        .choices(['MODERATOR', 'ATTENDEE'])
        .makeOptionMandatory()
    )
    .option('--yes', 'Confirm role change for the named member')
    .action(async (eventId, memberId, input) => {
      const { profile, key } = await connect();
      print(
        await manageEvent(profile, key, eventId, 'role', {
          memberId,
          role: input.role,
          yes: input.yes,
          json,
        })
      );
    });
  membership
    .command('remove <event-id> <member-id>')
    .option('--yes', 'Confirm removal of the named member')
    .action(async (eventId, memberId, input) => {
      const { profile, key } = await connect();
      print(
        await manageEvent(profile, key, eventId, 'remove', {
          memberId,
          yes: input.yes,
          json,
        })
      );
    });
  const settings = events
    .command('settings')
    .description(
      'Inspect and update event visibility and supported permissions'
    );
  settings.command('get <event-id>').action(async eventId => {
    const { profile, key } = await connect();
    print(await getEventSettings(profile, key, eventId));
  });
  const update = settings
    .command('set <event-id>')
    .addOption(
      new Option('--visibility <visibility>', 'Event visibility').choices([
        'PRIVATE',
        'FRIENDS',
        'PUBLIC',
      ])
    );
  for (const name of ['create-posts', 'invite-members', 'view-attendee-list'])
    update.addOption(
      new Option(`--${name} <level>`, `${name} permission`).choices([
        'EVERYONE',
        'MODERATOR',
        'ORGANIZER',
      ])
    );
  update.action(async (eventId, input) => {
    const permissions = Object.fromEntries(
      ['createPosts', 'inviteMembers', 'viewAttendeeList']
        .filter(name => input[name] !== undefined)
        .map(name => [name, input[name]])
    );
    const body = {
      ...(input.visibility !== undefined
        ? { visibility: input.visibility }
        : {}),
      ...(Object.keys(permissions).length ? { permissions } : {}),
    };
    if (!Object.keys(body).length)
      throw new CliError(
        'USAGE',
        'Specify visibility or at least one permission.',
        2
      );
    const { profile, key } = await connect();
    print(await manageEvent(profile, key, eventId, 'settings', { body, json }));
  });
}
