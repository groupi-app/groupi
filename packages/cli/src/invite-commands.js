import { Option } from 'commander';
import { CliError } from './errors.js';
import { getProfile, credential } from './profiles.js';
import {
  createLink,
  linkInput,
  emailInput,
  sendEmails,
  memberInput,
  sendMemberInvite,
  respondMemberInvite,
  listInvites,
  getInvite,
  manageLink,
} from './invites.js';

/** @param {unknown} value */
function plain(value) {
  // eslint-disable-next-line no-control-regex -- Invitation text cannot control the terminal.
  return String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
}
/** @param {import('commander').Command} program @param {boolean} json */
export function registerInviteCommands(program, json) {
  const invites = program
    .command('invites')
    .description(
      'Manage bearer link/email and recipient-bound username invitations'
    );
  const links = invites
    .command('links')
    .description('Create, inspect and manage link/email bearer invitations');
  links
    .command('create <event-id>')
    .description('Create a shareable bearer invitation')
    .option('--name <name>', 'Invitation label')
    .option('--uses <number>', 'Maximum uses (at least 1)')
    .option('--expires <iso>', 'Expiry with explicit UTC offset or Z')
    .option(
      '--request-id <id>',
      'Reuse the identifier and original inputs after an uncertain attempt'
    )
    .action(async (eventId, input) => {
      const body = linkInput(input);
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      const result = await createLink(
        profile,
        await credential(profile, !!opts.apiKeyStdin),
        eventId,
        body,
        input.requestId
      );
      process.stdout.write(
        json
          ? JSON.stringify(result) + '\n'
          : `Created invitation ${plain(result.id)}. Token: ${plain(result.token)}. Request ID: ${plain(result.requestId)}\n`
      );
    });

  links
    .command('edit <invite-id>')
    .description(
      'Change an invitation label, access limit, or expiry; requires confirmation'
    )
    .option('--name <name>', 'New invitation label')
    .option('--uses <number>', 'New maximum uses (1–10000)')
    .option('--unlimited', 'Remove the usage limit')
    .option('--expires <iso>', 'New future expiry with explicit offset or Z')
    .option('--no-expiry', 'Remove the expiry')
    .option('--yes', 'Confirm changing this invitation')
    .action(async (id, input) => {
      const body = linkInput(input, true);
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      output(
        await manageLink(
          profile,
          await credential(profile, !!opts.apiKeyStdin),
          id,
          'edit',
          body,
          { yes: input.yes, json }
        ),
        'Invitation updated'
      );
    });
  for (const action of /** @type {const} */ (['accept', 'revoke'])) {
    links
      .command(action === 'accept' ? 'accept <token>' : 'revoke <invite-id>')
      .option('--yes', 'Confirm revoking this invitation')
      .action(async (id, input) => {
        const opts = program.opts();
        const profile = await getProfile(opts.profile);
        output(
          await manageLink(
            profile,
            await credential(profile, !!opts.apiKeyStdin),
            id,
            action,
            {},
            { yes: input.yes, json }
          ),
          action === 'accept' ? 'Invitation accepted' : 'Invitation revoked'
        );
      });
  }
  const email = invites
    .command('email')
    .description('Create email bearer invitations and queue delivery');
  email
    .command('send <event-id>')
    .requiredOption(
      '--invites <json>',
      'Array of {email,recipientName?,plusOnes?}'
    )
    .option('--message <text>', 'Message included with email invitations')
    .option('--expires <iso>', 'Expiry with explicit offset or Z')
    .option(
      '--no-send',
      'Create the batch without queuing any new or existing pending email'
    )
    .option(
      '--request-id <id>',
      'Reuse a prior request ID with identical inputs'
    )
    .action(async (eventId, input) => {
      const body = emailInput(input);
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      const result = await sendEmails(
        profile,
        await credential(profile, !!opts.apiKeyStdin),
        eventId,
        body,
        input.requestId
      );
      output(
        result,
        'Email invitations created; queued does not mean delivered'
      );
    });
  email
    .command('send-pending <event-id>')
    .description('Queue unsent email invitations once per request ID')
    .option('--request-id <id>', 'Reuse a prior request ID')
    .action(async (eventId, input) => {
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      output(
        await sendEmails(
          profile,
          await credential(profile, !!opts.apiKeyStdin),
          eventId,
          {},
          input.requestId,
          true
        ),
        'Email invitations queued; this does not confirm delivery'
      );
    });

  const members = invites
    .command('members')
    .description('Send and respond to recipient-bound username invitations');
  members
    .command('send <event-id>')
    .requiredOption('--username <username>', 'Recipient username without @')
    .addOption(
      new Option('--role <role>', 'Granted event role').choices([
        'ATTENDEE',
        'MODERATOR',
      ])
    )
    .option('--message <text>', 'Invitation message')
    .option(
      '--request-id <id>',
      'Reuse a prior request ID with identical inputs'
    )
    .action(async (eventId, input) => {
      const body = memberInput(input);
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      output(
        await sendMemberInvite(
          profile,
          await credential(profile, !!opts.apiKeyStdin),
          eventId,
          body,
          input.requestId
        ),
        'Username invitation sent'
      );
    });
  for (const action of /** @type {const} */ (['accept', 'decline', 'revoke'])) {
    members
      .command(`${action} <invite-id>`)
      .option('--yes', 'Confirm declining or revoking this invitation')
      .action(async (id, input) => {
        const opts = program.opts();
        const profile = await getProfile(opts.profile);
        output(
          await respondMemberInvite(
            profile,
            await credential(profile, !!opts.apiKeyStdin),
            id,
            action,
            { yes: input.yes, json }
          ),
          `Invitation ${action}`
        );
      });
  }
  for (const [kind, group] of /** @type {const} */ ([
    ['links', links],
    ['members', members],
  ])) {
    group
      .command(kind === 'links' ? 'get <token>' : 'get <invite-id>')
      .description('Inspect the invitation using the selected identity')
      .action(async id => {
        const opts = program.opts();
        const profile = await getProfile(opts.profile);
        output(
          await getInvite(
            profile,
            await credential(profile, !!opts.apiKeyStdin),
            kind,
            id
          ),
          'Invitation details'
        );
      });
    const list = group
      .command(kind === 'links' ? 'list <event-id>' : 'list [event-id]')
      .description(
        kind === 'links'
          ? 'List all bearer invitations, including email invitations'
          : 'List received pending invitations, or invitations sent for an event'
      )
      .option('--limit <number>', 'Page size (1–100)', '20')
      .option('--cursor <cursor>', 'Continue a previous page')
      .option('--all', 'Retrieve all pages explicitly');
    if (kind === 'links')
      list.addOption(
        new Option('--kind <kind>', 'Filter bearer invitation kind').choices([
          'link',
          'email',
          'all',
        ])
      );
    else
      list.addOption(
        new Option(
          '--status <status>',
          'Status filter; received defaults to PENDING, event list to all'
        ).choices(['PENDING', 'ACCEPTED', 'DECLINED', 'all'])
      );
    list.action(async (eventId, input) => {
      if (
        !/^\d+$/.test(input.limit) ||
        Number(input.limit) < 1 ||
        Number(input.limit) > 100
      )
        throw new CliError(
          'USAGE',
          '--limit must be an integer from 1 to 100.',
          2
        );
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      output(
        await listInvites(
          profile,
          await credential(profile, !!opts.apiKeyStdin),
          kind,
          eventId,
          { ...input, limit: Number(input.limit) }
        ),
        'Invitations (use nextCursor with --cursor, or --all, to continue)'
      );
    });
  }
  /** @param {Record<string,unknown>} result @param {string} label */
  function output(result, label) {
    process.stdout.write(
      json
        ? JSON.stringify(result) + '\n'
        : label +
            '\n' +
            Object.entries(result)
              .map(
                ([key, value]) =>
                  `${plain(key)}: ${plain(typeof value === 'object' ? JSON.stringify(value) : value)}`
              )
              .join('\n') +
            '\n'
    );
  }
}
