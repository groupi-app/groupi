import { getProfile, credential } from './profiles.js';
import { Option } from 'commander';
import {
  createInviteList,
  inviteListInput,
  listInviteLists,
  getInviteList,
  peopleInput,
  selectablePeople,
  inviteListEditInput,
  editInviteList,
  deleteInviteList,
  inviteListEventInput,
  inviteListToEvent,
} from './invite-lists.js';

/** @param {unknown} value */
function plain(value) {
  // eslint-disable-next-line no-control-regex -- Remote list text cannot control the terminal.
  return String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
}
/** @param {import('commander').Command} program @param {boolean} json */
export function registerInviteListCommands(program, json) {
  const lists = program
    .command('invite-lists')
    .description(
      'Create and inspect private saved selections of existing people'
    );
  lists
    .command('create')
    .description('Save people privately; sends no invitations or notifications')
    .requiredOption(
      '--name <name>',
      'Creator-unique list name, 1–100 trimmed characters'
    )
    .requiredOption(
      '--person-ids <json>',
      'JSON array of 1–100 distinct existing person IDs'
    )
    .action(async input => {
      const body = inviteListInput(input);
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      const result = await createInviteList(
        profile,
        await credential(profile, !!opts.apiKeyStdin),
        body
      );
      output(result, 'Invite list saved privately');
    });
  lists
    .command('list')
    .description(
      'Browse all owned lists (up to 100), including Needs attention status'
    )
    .action(async () => {
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      output(
        await listInviteLists(
          profile,
          await credential(profile, !!opts.apiKeyStdin)
        ),
        'Private invite lists'
      );
    });
  lists
    .command('get <list-id>')
    .description(
      'Inspect current people; missing profiles are anonymous and all-missing lists Need attention'
    )
    .action(async id => {
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      output(
        await getInviteList(
          profile,
          await credential(profile, !!opts.apiKeyStdin),
          id
        ),
        'Private invite list details'
      );
    });
  lists
    .command('edit <list-id>')
    .description(
      'Rename a private list or replace its saved people without sending invitations'
    )
    .option(
      '--name <name>',
      'New creator-unique name, 1–100 trimmed characters'
    )
    .option(
      '--person-ids <json>',
      'Replace people with 1–100 distinct IDs; include an existing person to repair Needs attention'
    )
    .action(async (id, input) => {
      const body = inviteListEditInput(input);
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      output(
        await editInviteList(
          profile,
          await credential(profile, !!opts.apiKeyStdin),
          id,
          body
        ),
        'Invite list updated privately'
      );
    });
  lists
    .command('delete <list-id>')
    .description(
      'Delete a private list; requires confirmation and leaves prior invitations unchanged'
    )
    .option('--yes', 'Confirm deleting this private invite list')
    .action(async (id, input) => {
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      output(
        await deleteInviteList(
          profile,
          await credential(profile, !!opts.apiKeyStdin),
          id,
          { yes: input.yes, json }
        ),
        'Invite list deleted'
      );
    });
  lists
    .command('invite <list-id>')
    .description(
      'Explicitly invite current people with 24-hour recovery; repair Needs attention lists before a fresh send'
    )
    .requiredOption(
      '--event <event-id>',
      'Target event; requires existing event invitation permission'
    )
    .addOption(
      new Option(
        '--role <role>',
        'Common event role; MODERATOR is organizer-only'
      )
        .choices(['ATTENDEE', 'MODERATOR'])
        .default('ATTENDEE')
    )
    .option(
      '--message <text>',
      'Common invitation message, at most 480 characters'
    )
    .option(
      '--request-id <id>',
      'Retain and reuse this identifier with original inputs after an uncertain send'
    )
    .action(async (id, input) => {
      const body = inviteListEventInput(input);
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      const result = await inviteListToEvent(
        profile,
        await credential(profile, !!opts.apiKeyStdin),
        id,
        body,
        input.requestId
      );
      output(
        result,
        result.sentCount === 0
          ? 'No invitations were sent'
          : `${result.sentCount} invitations sent; ${result.skippedCount} people skipped`
      );
    });
  lists
    .command('people')
    .description(
      'Find existing selectable people without an event; friendship is optional'
    )
    .option(
      '--search <username>',
      'Username search, at least 2 trimmed characters'
    )
    .option('--friends', 'List accepted friends as convenient choices')
    .action(async input => {
      const path = peopleInput(input);
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      output(
        await selectablePeople(
          profile,
          await credential(profile, !!opts.apiKeyStdin),
          path
        ),
        'Selectable existing people'
      );
    });
  /** @param {Record<string,unknown>} result @param {string} label */
  function output(result, label) {
    const summaries = Array.isArray(result.items) ? result.items : [result];
    const attention = summaries.filter(
      value =>
        value && typeof value === 'object' && value.needsAttention === true
    );
    const guidance = attention
      .map(
        value =>
          `Needs attention: ${plain(value.name)}. Add at least one existing person with invite-lists edit ${plain(value.inviteListId)} --person-ids <json>, or delete the list.\n`
      )
      .join('');
    process.stdout.write(
      json
        ? JSON.stringify(result) + '\n'
        : label +
            '\n' +
            guidance +
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
