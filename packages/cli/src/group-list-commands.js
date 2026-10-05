import { CliError } from './errors.js';
import { getProfile, credential } from './profiles.js';
import { readGroupLists, writeGroupLists } from './group-lists.js';
/** @param {import('commander').Command} program @param {boolean} json */
export function registerGroupListCommands(program, json) {
  const groups = program.commands.find(c => c.name() === 'groups');
  if (!groups) throw Error('Register Groups first.');
  const lists = groups
    .command('lists')
    .description(
      'Persistent community lists, independent of Invite Lists and Event Bring Lists'
    );
  async function connection() {
    const options = program.opts();
    const profile = await getProfile(options.profile);
    return { profile, key: await credential(profile, !!options.apiKeyStdin) };
  }
  /** @param {unknown} value */
  const print = value =>
    process.stdout.write(
      JSON.stringify(value, null, json ? undefined : 2) + '\n'
    );
  for (const operation of /** @type {const} */ ([
    'list',
    'get',
    'settings',
    'entries',
    'own',
  ])) {
    const command = lists
      .command(
        `${operation} <group-id>${operation === 'list' ? '' : ' <tool-id>'}`
      )
      .description(
        operation === 'own'
          ? 'Read only your retained list contributions'
          : operation === 'settings'
            ? 'Current eligible managers read settings even while disabled'
            : `${operation} Group lists; stated visibility applies`
      );
    if (['list', 'entries', 'own'].includes(operation))
      command
        .option('--limit <number>', 'Page size 1–100', '20')
        .option('--cursor <cursor>', 'Continue page');
    command.action(async (...args) => {
      const input = args[operation === 'list' ? 1 : 2];
      const { profile, key } = await connection();
      print(
        await readGroupLists(
          profile,
          key,
          args[0],
          operation,
          operation === 'list' ? undefined : args[1],
          { limit: Number(input.limit ?? 20), cursor: input.cursor }
        )
      );
    });
  }
  for (const operation of /** @type {const} */ ([
    'create',
    'configure',
    'add',
    'edit',
    'remove',
    'delete',
  ])) {
    const command = lists
      .command(
        `${operation} <group-id>${operation === 'create' ? '' : ' <tool-id>'}${operation === 'edit' || operation === 'remove' ? ' <entry-id>' : ''}`
      )
      .description(
        `${operation} a persistent list${operation === 'add' ? ' entry: MANAGERS personal to author/managers; MEMBERS shared latest survives anonymously on account deletion' : ''}`
      );
    if (operation === 'create' || operation === 'configure')
      command
        .requiredOption('--title <text>', 'List title')
        .option('--description <text>', 'List description');
    if (operation === 'create')
      command.requiredOption(
        '--results-visibility <visibility>',
        'Fixed MANAGERS personal or MEMBERS shared visibility'
      );
    if (['configure', 'add', 'edit'].includes(operation))
      command.requiredOption(
        '--list-version <number>',
        'Current configuration version'
      );
    if (operation === 'add' || operation === 'edit')
      command.requiredOption('--text <text>', 'Entry text1–2000 characters');
    if (operation === 'add')
      command.requiredOption(
        '--request-id <id>',
        '<unix-ms>.<uuid-v4>, reuse only for exact original request'
      );
    if (operation === 'edit')
      command
        .requiredOption(
          '--expected-revision <number>',
          'Current entry revision'
        )
        .requiredOption(
          '--completed <boolean>',
          'true or false, a list status only'
        );
    if (operation === 'remove')
      command.requiredOption(
        '--expected-revision <number>',
        'Current entry revision, stale removals conflict'
      );
    if (operation === 'remove' || operation === 'delete')
      command.option('--yes', 'Confirm permanent removal');
    command.action(async (...args) => {
      const input =
        args[
          operation === 'create'
            ? 1
            : operation === 'edit' || operation === 'remove'
              ? 3
              : 2
        ];
      if (operation === 'edit' && !['true', 'false'].includes(input.completed))
        throw new CliError('USAGE', '--completed must be true or false.', 2);
      const body =
        operation === 'create' || operation === 'configure'
          ? {
              title: input.title,
              ...(input.description === undefined
                ? {}
                : { description: input.description }),
              ...(operation === 'create'
                ? { resultsVisibility: input.resultsVisibility }
                : { version: Number(input.listVersion) }),
            }
          : operation === 'add'
            ? { version: Number(input.listVersion), text: input.text }
            : operation === 'edit'
              ? {
                  version: Number(input.listVersion),
                  expectedRevision: Number(input.expectedRevision),
                  text: input.text,
                  completed: input.completed === 'true',
                }
              : operation === 'remove'
                ? { expectedRevision: Number(input.expectedRevision) }
                : {};
      const { profile, key } = await connection();
      print(
        await writeGroupLists(
          profile,
          key,
          args[0],
          operation,
          operation === 'create' ? undefined : args[1],
          body,
          {
            yes: input.yes,
            json,
            entryId:
              operation === 'edit' || operation === 'remove'
                ? args[2]
                : undefined,
            requestId: input.requestId,
          }
        )
      );
    });
  }
  const policy = lists
    .command('policy')
    .description('Owner controls list availability/creation');
  policy.command('get <group-id>').action(async id => {
    const { profile, key } = await connection();
    print(await readGroupLists(profile, key, id, 'policy'));
  });
  policy
    .command('set <group-id>')
    .requiredOption('--enabled <boolean>', 'true or false')
    .requiredOption('--creation <role>', 'MANAGERS or MEMBERS')
    .action(async (id, input) => {
      if (!['true', 'false'].includes(input.enabled))
        throw new CliError('USAGE', '--enabled must be true or false.', 2);
      const { profile, key } = await connection();
      print(
        await writeGroupLists(profile, key, id, 'policy', undefined, {
          enabled: input.enabled === 'true',
          creation: input.creation,
        })
      );
    });
}
