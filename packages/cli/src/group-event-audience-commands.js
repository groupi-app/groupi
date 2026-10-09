import { CliError } from './errors.js';
import { getProfile, credential } from './profiles.js';
import {
  readEventAudiences,
  readGroupEvents,
  writeEventAudience,
} from './group-event-audiences.js';
/** @param {import('commander').Command} program @param {boolean} json */
export function registerGroupEventAudienceCommands(program, json) {
  const groups = program.commands.find(c => c.name() === 'groups'),
    events = program.commands.find(c => c.name() === 'events');
  if (!groups || !events) throw new Error('Register Groups and Events first.');
  const connection = async () => {
    const o = program.opts(),
      profile = await getProfile(o.profile);
    return { profile, key: await credential(profile, !!o.apiKeyStdin) };
  };
  /** @param {unknown} value */ const print = value =>
    process.stdout.write(
      JSON.stringify(value, null, json ? undefined : 2) + '\n'
    );
  groups
    .command('events <group-id>')
    .description(
      'Page safe upcoming/undated shared Events; no participation effects'
    )
    .option('--limit <number>', 'Association scan page size (1–100)', '20')
    .option('--cursor <cursor>', 'Continue even an empty page')
    .option('--all', 'Retrieve every page deliberately')
    .action(async (groupId, input) => {
      const { profile, key } = await connection();
      print(
        await readGroupEvents(profile, key, groupId, {
          ...input,
          limit: Number(input.limit),
        })
      );
    });
  events
    .command('audiences <event-id>')
    .description(
      'Read only currently visible Group audiences and authorized Friends state'
    )
    .action(async eventId => {
      const { profile, key } = await connection();
      print(await readEventAudiences(profile, key, eventId));
    });
  events
    .command('share-group <event-id> <group-id>')
    .description(
      'Share logistics with a whole Group; requires Organizer and Group permission'
    )
    .action(async (eventId, groupId) => {
      const { profile, key } = await connection();
      print(
        await writeEventAudience(profile, key, 'share', {
          eventId,
          groupId,
          json,
        })
      );
    });
  events
    .command('unshare-group <event-id> <group-id>')
    .description('Withdraw one Group grant, preserving all independent grants')
    .option('--yes', 'Confirm withdrawal')
    .action(async (eventId, groupId, input) => {
      const { profile, key } = await connection();
      print(
        await writeEventAudience(profile, key, 'withdraw', {
          eventId,
          groupId,
          yes: input.yes,
          json,
        })
      );
    });
  groups
    .command('withdraw-event <group-id> <event-id>')
    .description('Withdraw only this Group audience as current Group manager')
    .option('--yes', 'Confirm withdrawal')
    .action(async (groupId, eventId, input) => {
      const { profile, key } = await connection();
      print(
        await writeEventAudience(profile, key, 'group-withdraw', {
          eventId,
          groupId,
          yes: input.yes,
          json,
        })
      );
    });
  groups
    .command('event-sharing <group-id>')
    .description(
      'Owner sets managers-only (default) or all eligible members sharing'
    )
    .requiredOption('--policy <policy>', 'MANAGERS or MEMBERS')
    .action(async (groupId, input) => {
      const { profile, key } = await connection();
      print(
        await writeEventAudience(profile, key, 'policy', {
          groupId,
          policy: input.policy,
          json,
        })
      );
    });
  events
    .command('friends-audience <event-id>')
    .description(
      'Set independent Friends audience as Organizer; Public basic details stay public'
    )
    .requiredOption('--enabled <boolean>', 'true or false')
    .action(async (eventId, input) => {
      if (!['true', 'false'].includes(input.enabled))
        throw new CliError('USAGE', 'Enabled must be true or false.', 2);
      const { profile, key } = await connection();
      print(
        await writeEventAudience(profile, key, 'friends', {
          eventId,
          enabled: input.enabled === 'true',
          json,
        })
      );
    });
}
