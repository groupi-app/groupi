import { CliError } from './errors.js';
import { getProfile, credential } from './profiles.js';
import { readGroupPolls, writeGroupPolls } from './group-polls.js';
/** @param {string} value */
function parse(value) {
  try {
    return JSON.parse(value);
  } catch {
    throw new CliError('USAGE', 'Provide valid JSON.', 2);
  }
}
/** @param {import('commander').Command} program @param {boolean} json */
export function registerGroupPollCommands(program, json) {
  const groups = program.commands.find(c => c.name() === 'groups');
  if (!groups) throw Error('Register Groups first.');
  const polls = groups
    .command('polls')
    .description(
      'Persistent independent polls; never selects Event dates or RSVP'
    );
  async function connection() {
    const opts = program.opts();
    const profile = await getProfile(opts.profile);
    return { profile, key: await credential(profile, !!opts.apiKeyStdin) };
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
    'history',
    'results',
  ])) {
    const command = polls
      .command(
        `${operation} <group-id>${operation === 'list' ? '' : ' <tool-id>'}`
      )
      .description(
        `${operation} persistent polls${operation === 'settings' ? ' (eligible managers; disabled polls remain manageable)' : operation === 'history' ? ' (your retained vote snapshots)' : operation === 'results' ? ' (stated results visibility applies)' : ''}`
      );
    if (operation !== 'get' && operation !== 'settings')
      command
        .option('--limit <number>', 'Page size (1–100)', '20')
        .option('--cursor <cursor>', 'Continue page');
    command.action(async (...args) => {
      const input = operation === 'list' ? args[1] : args[2];
      const { profile, key } = await connection();
      print(
        await readGroupPolls(
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
    'submit',
    'remove-own',
    'delete',
    'moderate',
  ])) {
    const command = polls
      .command(
        `${operation} <group-id>${operation === 'create' ? '' : ' <tool-id>'}${operation === 'moderate' ? ' <vote-id>' : ''}`
      )
      .description(
        `${operation} a persistent Group poll${operation === 'remove-own' ? ' vote and retained history' : ''}`
      );
    if (operation === 'create' || operation === 'configure')
      command
        .requiredOption('--title <text>', 'Poll title')
        .requiredOption('--mode <mode>', 'SINGLE or MULTIPLE')
        .option('--description <text>', 'Poll description')
        .requiredOption(
          '--options-json <json>',
          'Stable-ID {id,label} options JSON (2–50)'
        );
    if (operation === 'create')
      command.requiredOption(
        '--results-visibility <visibility>',
        'Immutable MANAGERS or MEMBERS results visibility'
      );
    if (operation === 'configure' || operation === 'submit')
      command.requiredOption(
        '--poll-version <number>',
        'Current poll version from get'
      );
    if (operation === 'submit')
      command
        .requiredOption(
          '--expected-revision <number>',
          'Current own vote revision; 0 for first submission'
        )
        .requiredOption(
          '--selections-json <json>',
          'Selected option-ID JSON array'
        );
    if (['remove-own', 'moderate'].includes(operation))
      command.requiredOption(
        '--expected-revision <number>',
        'Current vote revision'
      );
    if (['remove-own', 'delete', 'moderate'].includes(operation))
      command.option('--yes', 'Confirm permanent removal');
    command.action(async (...args) => {
      const input =
        args[operation === 'create' ? 1 : operation === 'moderate' ? 3 : 2];
      const body =
        operation === 'create' || operation === 'configure'
          ? {
              title: input.title,
              ...(input.description === undefined
                ? {}
                : { description: input.description }),
              options: parse(input.optionsJson),
              mode: input.mode,
              ...(operation === 'create'
                ? { resultsVisibility: input.resultsVisibility }
                : { version: Number(input.pollVersion) }),
            }
          : operation === 'submit'
            ? {
                version: Number(input.pollVersion),
                expectedRevision: Number(input.expectedRevision),
                selections: parse(input.selectionsJson),
              }
            : operation === 'remove-own' || operation === 'moderate'
              ? { expectedRevision: Number(input.expectedRevision) }
              : {};
      const { profile, key } = await connection();
      print(
        await writeGroupPolls(
          profile,
          key,
          args[0],
          operation,
          operation === 'create' ? undefined : args[1],
          body,
          {
            yes: input.yes,
            json,
            voteId: operation === 'moderate' ? args[2] : undefined,
          }
        )
      );
    });
  }
  const policy = polls
    .command('policy')
    .description('Owner controls ordinary poll availability and creation');
  policy
    .command('get <group-id>')
    .description('Read polls policy')
    .action(async id => {
      const { profile, key } = await connection();
      print(await readGroupPolls(profile, key, id, 'policy'));
    });
  policy
    .command('set <group-id>')
    .description('Set polls policy as owner')
    .requiredOption('--enabled <boolean>', 'true or false')
    .requiredOption('--creation <role>', 'MANAGERS or MEMBERS')
    .action(async (id, input) => {
      if (!['true', 'false'].includes(input.enabled))
        throw new CliError('USAGE', '--enabled must be true or false.', 2);
      const { profile, key } = await connection();
      print(
        await writeGroupPolls(profile, key, id, 'policy', undefined, {
          enabled: input.enabled === 'true',
          creation: input.creation,
        })
      );
    });
}
