import { CliError } from './errors.js';
import { getProfile, credential } from './profiles.js';
import {
  readGroupApplications,
  writeGroupApplication,
} from './group-applications.js';
/** @param {import('commander').Command} program @param {boolean} json */
export function registerGroupApplicationCommands(program, json) {
  const groups = program.commands.find(c => c.name() === 'groups');
  if (!groups) throw Error('Register Groups first.');
  for (const kind of /** @type {const} */ ([
    'form',
    'get',
    'history',
    'queue',
  ])) {
    const name = kind === 'queue' ? 'applications' : `application-${kind}`;
    const command = groups
      .command(`${name} <group-id>${kind === 'get' ? ' <application-id>' : ''}`)
      .description(
        kind === 'form'
          ? 'Read admission form and your private pending application'
          : kind === 'get'
            ? 'Read a private application as author or current manager'
            : kind === 'history'
              ? 'Read your retained private application history'
              : 'Review private Group applications as manager'
      );
    if (kind === 'history' || kind === 'queue') {
      command
        .option('--limit <number>', 'Page size (1–100)', '20')
        .option('--cursor <cursor>', 'Continue a page')
        .option('--all', 'Retrieve every page deliberately');
      if (kind === 'queue')
        command.option(
          '--status <status>',
          'PENDING, WITHDRAWN, APPROVED or DECLINED'
        );
    }
    command.action(async (...args) => {
      const input = kind === 'get' ? args[2] : args[1];
      const { profile, key } = await connection();
      output(
        await readGroupApplications(profile, key, args[0], kind, {
          ...input,
          ...(kind === 'get' ? { applicationId: args[1] } : {}),
          ...(input.limit !== undefined ? { limit: Number(input.limit) } : {}),
        })
      );
    });
  }
  for (const operation of /** @type {const} */ ([
    'configure',
    'submit',
    'edit',
    'withdraw',
    'review',
  ])) {
    const name =
      operation === 'configure'
        ? 'application-settings'
        : operation === 'submit'
          ? 'apply'
          : `application-${operation}`;
    const target = ['edit', 'withdraw', 'review'].includes(operation);
    const command = groups
      .command(`${name} <group-id>${target ? ' <application-id>' : ''}`)
      .description(
        operation === 'configure'
          ? 'Configure Group applications as owner'
          : operation === 'submit'
            ? 'Apply for Group membership'
            : operation === 'edit'
              ? 'Edit your pending saved answers'
              : operation === 'withdraw'
                ? 'Withdraw your pending application'
                : 'Record an application decision as current manager'
      );
    if (operation === 'configure')
      command
        .requiredOption('--enabled <boolean>', 'true or false')
        .requiredOption('--questions <json>', 'JSON admission question array');
    if (operation === 'submit' || operation === 'edit')
      command.requiredOption('--answers <json>', 'JSON answer object');
    if (operation === 'review')
      command.requiredOption('--decision <decision>', 'APPROVED or DECLINED');
    if (operation === 'withdraw' || operation === 'review')
      command.option('--yes', 'Confirm application resolution');
    command.action(async (...args) => {
      const input = target ? args[2] : args[1];
      if (
        operation === 'configure' &&
        !['true', 'false'].includes(input.enabled)
      )
        throw new CliError('USAGE', '--enabled must be true or false.', 2);
      const { profile, key } = await connection();
      output(
        await writeGroupApplication(profile, key, args[0], operation, {
          ...input,
          json,
          ...(target ? { applicationId: args[1] } : {}),
          ...(operation === 'configure'
            ? {
                applicationsEnabled: input.enabled === 'true',
                questions: parse(input.questions),
              }
            : {}),
          ...(input.answers !== undefined
            ? { answers: parse(input.answers) }
            : {}),
        })
      );
    });
  }
  /** @param {string} value @returns {unknown} */
  function parse(value) {
    try {
      return JSON.parse(value);
    } catch {
      throw new CliError(
        'USAGE',
        'Provide valid JSON questions or answers.',
        2
      );
    }
  }
  async function connection() {
    const options = program.opts();
    const profile = await getProfile(options.profile);
    return { profile, key: await credential(profile, !!options.apiKeyStdin) };
  }
  /** @param {Record<string,unknown>} value */
  function output(value) {
    process.stdout.write(
      JSON.stringify(value, null, json ? undefined : 2) + '\n'
    );
  }
}
