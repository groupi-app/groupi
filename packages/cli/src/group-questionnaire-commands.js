import { CliError } from './errors.js';
import { getProfile, credential } from './profiles.js';
import {
  readGroupQuestionnaire,
  writeGroupQuestionnaire,
} from './group-questionnaires.js';
/** @param {string} value */
function parse(value) {
  try {
    return JSON.parse(value);
  } catch {
    throw new CliError('USAGE', 'Provide valid JSON.', 2);
  }
}
/** @param {import('commander').Command} program @param {boolean} json */
export function registerGroupQuestionnaireCommands(program, json) {
  const groups = program.commands.find(c => c.name() === 'groups');
  if (!groups) throw new Error('Register Groups first.');
  const commands = groups
    .command('questionnaire')
    .description(
      'Optional post-admission questionnaire and private retained records'
    );
  const connection = async () => {
    const options = program.opts();
    const profile = await getProfile(options.profile);
    return { profile, key: await credential(profile, !!options.apiKeyStdin) };
  };
  /** @param {unknown} value */
  const print = value =>
    process.stdout.write(
      JSON.stringify(value, null, json ? undefined : 2) + '\n'
    );
  for (const operation of /** @type {const} */ (['get', 'status']))
    commands
      .command(`${operation} <group-id>`)
      .description(
        operation === 'get'
          ? 'Read your private current form and saved definitions'
          : 'Read optional completion status without changing access'
      )
      .action(async id => {
        const { profile, key } = await connection();
        print(await readGroupQuestionnaire(profile, key, id, operation));
      });
  for (const operation of /** @type {const} */ (['history', 'responses'])) {
    const command = commands
      .command(`${operation} <group-id>`)
      .description(
        operation === 'history'
          ? 'Read paginated retained own answered definitions'
          : 'Review private responses as current owner or moderator'
      )
      .option('--limit <number>', 'Page size (1–100)', '20')
      .option('--cursor <cursor>', 'Continue page');
    if (operation === 'history')
      command.option(
        '--author-id <person-id>',
        'Review this author as current manager'
      );
    command.action(async (id, input) => {
      const { profile, key } = await connection();
      print(
        await readGroupQuestionnaire(profile, key, id, operation, {
          limit: Number(input.limit),
          cursor: input.cursor,
          authorId: input.authorId,
        })
      );
    });
  }
  commands
    .command('configure <group-id>')
    .description(
      'Configure exactly one optional joining form as owner; preserves retained answers'
    )
    .requiredOption(
      '--enabled <boolean>',
      'true or false; disabling preserves records'
    )
    .requiredOption('--questions <json>', 'At most 50 stable-ID core questions')
    .action(async (id, input) => {
      if (!['true', 'false'].includes(input.enabled))
        throw new CliError('USAGE', '--enabled must be true or false.', 2);
      const { profile, key } = await connection();
      print(
        await writeGroupQuestionnaire(profile, key, id, 'configure', {
          enabled: input.enabled === 'true',
          questions: parse(input.questions),
        })
      );
    });
  commands
    .command('submit <group-id>')
    .description(
      'Submit or edit private answers as a currently admitted member'
    )
    .requiredOption(
      '--form-version <number>',
      'Current questionnaire version from get'
    )
    .requiredOption(
      '--answers <json>',
      'Current answer object, replacing optional values'
    )
    .action(async (id, input) => {
      const { profile, key } = await connection();
      print(
        await writeGroupQuestionnaire(profile, key, id, 'submit', {
          version: Number(input.formVersion),
          answers: parse(input.answers),
        })
      );
    });
}
