import { CliError } from './errors.js';
import { getProfile, credential } from './profiles.js';
import { readGroupForms, writeGroupForms } from './group-forms.js';
/** @param {string} value */
function parse(value) {
  try {
    return JSON.parse(value);
  } catch {
    throw new CliError('USAGE', 'Provide valid JSON.', 2);
  }
}
/** @param {import('commander').Command} program @param {boolean} json */
export function registerGroupFormCommands(program, json) {
  const groups = program.commands.find(c => c.name() === 'groups');
  if (!groups) throw Error('Register Groups first.');
  const forms = groups
    .command('forms')
    .description(
      'Persistent ordinary forms, separate from the joining questionnaire'
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
    const command = forms
      .command(
        `${operation} <group-id>${operation === 'list' ? '' : ' <tool-id>'}`
      )
      .description(
        `${operation} persistent forms${operation === 'settings' ? ' (eligible managers; disabled forms remain manageable)' : operation === 'history' ? ' (your retained response snapshots)' : operation === 'results' ? ' (stated results visibility applies)' : ''}`
      );
    if (operation !== 'get' && operation !== 'settings')
      command
        .option('--limit <number>', 'Page size (1–100)', '20')
        .option('--cursor <cursor>', 'Continue page');
    command.action(async (...args) => {
      const input = operation === 'list' ? args[1] : args[2];
      const { profile, key } = await connection();
      print(
        await readGroupForms(
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
    const command = forms
      .command(
        `${operation} <group-id>${operation === 'create' ? '' : ' <tool-id>'}${operation === 'moderate' ? ' <response-id>' : ''}`
      )
      .description(
        `${operation} a persistent Group form${operation === 'remove-own' ? ' response and retained history' : ''}`
      );
    if (operation === 'create' || operation === 'configure')
      command
        .requiredOption('--title <text>', 'Form title')
        .option('--description <text>', 'Form description')
        .requiredOption(
          '--questions-json <json>',
          'Stable-ID core questions JSON (at most 50)'
        );
    if (operation === 'create')
      command.requiredOption(
        '--results-visibility <visibility>',
        'Immutable MANAGERS or MEMBERS results visibility'
      );
    if (operation === 'configure' || operation === 'submit')
      command.requiredOption(
        '--form-version <number>',
        'Current form version from get'
      );
    if (operation === 'submit')
      command
        .requiredOption(
          '--expected-revision <number>',
          'Current own response revision; 0 for first submission'
        )
        .requiredOption('--answers-json <json>', 'Answers JSON object');
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
              questions: parse(input.questionsJson),
              ...(operation === 'create'
                ? { resultsVisibility: input.resultsVisibility }
                : { version: Number(input.formVersion) }),
            }
          : operation === 'submit'
            ? {
                version: Number(input.formVersion),
                expectedRevision: Number(input.expectedRevision),
                answers: parse(input.answersJson),
              }
            : {};
      const { profile, key } = await connection();
      print(
        await writeGroupForms(
          profile,
          key,
          args[0],
          operation,
          operation === 'create' ? undefined : args[1],
          body,
          {
            yes: input.yes,
            json,
            responseId: operation === 'moderate' ? args[2] : undefined,
          }
        )
      );
    });
  }
  const policy = forms
    .command('policy')
    .description('Owner controls ordinary form availability and creation');
  policy
    .command('get <group-id>')
    .description('Read forms policy')
    .action(async id => {
      const { profile, key } = await connection();
      print(await readGroupForms(profile, key, id, 'policy'));
    });
  policy
    .command('set <group-id>')
    .description('Set forms policy as owner')
    .requiredOption('--enabled <boolean>', 'true or false')
    .requiredOption('--creation <role>', 'MANAGERS or MEMBERS')
    .action(async (id, input) => {
      if (!['true', 'false'].includes(input.enabled))
        throw new CliError('USAGE', '--enabled must be true or false.', 2);
      const { profile, key } = await connection();
      print(
        await writeGroupForms(profile, key, id, 'policy', undefined, {
          enabled: input.enabled === 'true',
          creation: input.creation,
        })
      );
    });
}
