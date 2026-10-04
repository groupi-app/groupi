import { CliError } from './errors.js';
import { getProfile, credential } from './profiles.js';
import {
  listGroupInvitationData,
  changeGroupInvitation,
} from './group-invitations.js';
/** @param {import('commander').Command} program @param {boolean} json */
export function registerGroupInvitationCommands(program, json) {
  const groups = program.commands.find(c => c.name() === 'groups');
  if (!groups) throw new Error('Groups commands must be registered first.');
  const incoming = program
    .command('group-invites')
    .description('Inspect and respond to your private Group invitations');
  page(
    groups
      .command('members <group-id>')
      .description('Read admitted Group roster'),
    'members'
  );
  page(
    groups
      .command('invites <group-id>')
      .description('Inspect Group invitations as manager'),
    'invites'
  );
  page(
    incoming
      .command('list')
      .description('List your own Group invitation states'),
    'incoming'
  );
  groups
    .command('invite <group-id> <person-id>')
    .description('Invite an existing user to your Group')
    .action(async (groupId, personId) => {
      const { profile, key } = await connection();
      output(
        await changeGroupInvitation(profile, key, 'send', groupId, { personId })
      );
    });
  groups
    .command('invitation-policy <group-id>')
    .description('Configure Group invitations as owner')
    .requiredOption('--enabled <boolean>', 'true or false')
    .action(async (groupId, input) => {
      if (!['true', 'false'].includes(input.enabled))
        throw new CliError('USAGE', '--enabled must be true or false.', 2);
      const { profile, key } = await connection();
      output(
        await changeGroupInvitation(profile, key, 'policy', groupId, {
          enabled: input.enabled === 'true',
        })
      );
    });
  for (const operation of /** @type {const} */ ([
    'accept',
    'decline',
    'cancel',
  ])) {
    const command = incoming
      .command(`${operation} <invite-id>`)
      .description(
        operation === 'cancel'
          ? 'Cancel a pending invitation as Group manager'
          : `${operation} your Group invitation`
      );
    if (operation !== 'accept')
      command.option('--yes', 'Confirm invitation resolution');
    command.action(async (inviteId, input) => {
      const { profile, key } = await connection();
      output(
        await changeGroupInvitation(profile, key, operation, inviteId, {
          yes: input.yes,
          json,
        })
      );
    });
  }
  /** @param {import('commander').Command} command @param {'members'|'invites'|'incoming'} kind */
  function page(command, kind) {
    command
      .option('--limit <number>', 'Page size (1–100)', '20')
      .option('--cursor <cursor>', 'Continue a page')
      .option('--all', 'Retrieve every page deliberately');
    if (kind !== 'members')
      command.option(
        '--status <status>',
        'PENDING, ACCEPTED, DECLINED or CANCELLED'
      );
    command.action(async (...args) => {
      const groupId = kind === 'incoming' ? undefined : args[0];
      const input = kind === 'incoming' ? args[0] : args[1];
      const { profile, key } = await connection();
      output(
        await listGroupInvitationData(profile, key, kind, groupId, {
          ...input,
          limit: Number(input.limit),
        })
      );
    });
  }
  async function connection() {
    const input = program.opts();
    const profile = await getProfile(input.profile);
    return { profile, key: await credential(profile, !!input.apiKeyStdin) };
  }
  /** @param {Record<string,unknown>} result */
  function output(result) {
    process.stdout.write(
      JSON.stringify(result, null, json ? undefined : 2) + '\n'
    );
  }
}
