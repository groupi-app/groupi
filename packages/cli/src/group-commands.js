import { registerGroupTransferCommands } from './group-transfer-commands.js';
import { sendAnnouncement, announcementStatus } from './group-announcements.js';
import { getProfile, credential } from './profiles.js';
import { getGroup, listGroups, changeGroup } from './groups.js';
/** @param {import('commander').Command} program @param {boolean} json */
export function registerGroupCommands(program, json) {
  const groups = program
    .command('groups')
    .description('Manage formal Group communities independently of events');
  registerGroupTransferCommands(program, groups, json);
  groups
    .command('list')
    .description('List your admitted Groups')
    .option('--limit <number>', 'Page size (1–100)', '20')
    .option('--cursor <cursor>', 'Continue a page')
    .option('--all', 'Retrieve every page deliberately')
    .action(async input => {
      const { profile, key } = await connection();
      output(
        await listGroups(profile, key, { ...input, limit: Number(input.limit) })
      );
    });
  groups
    .command('get <group-id>')
    .description('Read an admitted Group')
    .action(async id => {
      const { profile, key } = await connection();
      output(await getGroup(profile, key, id));
    });
  for (const operation of /** @type {const} */ (['create', 'edit'])) {
    const command = groups
      .command(operation === 'create' ? 'create' : 'edit <group-id>')
      .description(
        operation === 'create'
          ? 'Create an owner-only Group'
          : 'Update Group identity as owner'
      )
      .option('--name <name>', 'Trimmed Group name (1–100 characters)')
      .option('--description <text>', 'Description (at most 2000 characters)')
      .option('--image <url>', 'HTTPS image URL');
    if (operation === 'edit')
      command
        .option('--clear-description', 'Remove description')
        .option('--clear-image', 'Remove image');
    command.action(async (...args) => {
      const id = operation === 'edit' ? args[0] : undefined;
      const input = operation === 'edit' ? args[1] : args[0];
      const { profile, key } = await connection();
      output(
        await changeGroup(profile, key, operation, id, {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.clearDescription
            ? { description: null }
            : input.description !== undefined
              ? { description: input.description }
              : {}),
          ...(input.clearImage
            ? { image: null }
            : input.image !== undefined
              ? { image: input.image }
              : {}),
        })
      );
    });
  }
  groups
    .command('delete <group-id>')
    .description(
      'Explicitly retire an owned Group and its data; independent Events remain'
    )
    .option('--yes', 'Confirm Group deletion')
    .action(async (id, input) => {
      const { profile, key } = await connection();
      output(
        await changeGroup(
          profile,
          key,
          'delete',
          id,
          {},
          { yes: input.yes, json }
        )
      );
    });
  groups
    .command('announce <group-id>')
    .description(
      'Explicitly announce to permitted members; reports queued notifications'
    )
    .requiredOption('--title <title>', 'Announcement title (1–100 characters)')
    .requiredOption(
      '--message <message>',
      'Announcement message (1–2000 characters)'
    )
    .requiredOption(
      '--request-id <id>',
      'Stable <unix-ms>.<uuid-v4> key; preserve body on recovery'
    )
    .action(async (id, input) => {
      const { profile, key } = await connection();
      output(await sendAnnouncement(profile, key, id, input));
    });
  groups
    .command('announcement-status <group-id>')
    .description('Recover your aggregate announcement status')
    .requiredOption('--request-id <id>', 'Original announcement request key')
    .action(async (id, input) => {
      const { profile, key } = await connection();
      const result = await announcementStatus(
        profile,
        key,
        id,
        input.requestId
      );
      output(result ?? { state: 'NOT_FOUND' });
    });
  async function connection() {
    const options = program.opts();
    const profile = await getProfile(options.profile);
    return { profile, key: await credential(profile, !!options.apiKeyStdin) };
  }
  /** @param {Record<string,unknown>} value */
  function output(value) {
    const text = JSON.stringify(value, null, json ? undefined : 2).replace(
      // eslint-disable-next-line no-control-regex -- Remote identities must not control the terminal.
      /[\u0000-\u0009\u000b-\u001f\u007f-\u009f]/g,
      ' '
    );
    process.stdout.write(text + '\n');
  }
}
