import { getProfile, credential } from './profiles.js';
import { changeGroupModeration, listGroupBans } from './group-moderation.js';
/** @param {import('commander').Command} program @param {boolean} json */
export function registerGroupModerationCommands(program, json) {
  const groups = program.commands.find(c => c.name() === 'groups');
  if (!groups) throw Error('Register Groups first.');
  for (const operation of /** @type {const} */ ([
    'role',
    'remove',
    'ban',
    'lift',
    'leave',
  ])) {
    const name =
      operation === 'role'
        ? 'member-role'
        : operation === 'remove'
          ? 'remove-member'
          : operation === 'lift'
            ? 'lift-ban'
            : operation;
    const command = groups
      .command(
        `${name} <group-id>${operation === 'leave' ? '' : ' <person-id>'}`
      )
      .description(
        operation === 'role'
          ? 'Appoint or demote a moderator as owner'
          : operation === 'remove'
            ? 'Remove an ordinary member without banning'
            : operation === 'ban'
              ? 'Ban an ordinary member or nonmember'
              : operation === 'lift'
                ? 'Lift a Group ban without admitting membership'
                : 'Leave your own Group membership'
      )
      .option('--yes', 'Confirm Group membership or moderation change');
    if (operation === 'role')
      command.requiredOption('--role <role>', 'MODERATOR or MEMBER');
    command.action(async (...args) => {
      const input = operation === 'leave' ? args[1] : args[2];
      const { profile, key } = await connection();
      output(
        await changeGroupModeration(
          profile,
          key,
          operation,
          args[0],
          operation === 'leave' ? undefined : args[1],
          { ...input, json }
        )
      );
    });
  }
  groups
    .command('bans <group-id>')
    .description('List private active Group bans as manager')
    .option('--limit <number>', 'Page size (1–100)', '20')
    .option('--cursor <cursor>', 'Continue a page')
    .option('--all', 'Retrieve every page deliberately')
    .action(async (groupId, input) => {
      const { profile, key } = await connection();
      output(
        await listGroupBans(profile, key, groupId, {
          ...input,
          limit: Number(input.limit),
        })
      );
    });
  async function connection() {
    const opts = program.opts();
    const profile = await getProfile(opts.profile);
    return { profile, key: await credential(profile, !!opts.apiKeyStdin) };
  }
  /** @param {Record<string,unknown>} result */
  function output(result) {
    process.stdout.write(
      JSON.stringify(result, null, json ? undefined : 2) + '\n'
    );
  }
}
