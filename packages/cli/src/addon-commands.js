import { readFile, stat } from 'node:fs/promises';
import { CliError } from './errors.js';
import { getProfile, credential } from './profiles.js';
import { listAddons, getAddon, changeAddon } from './addons.js';

/** @param {unknown} value */
function plain(value) {
  // eslint-disable-next-line no-control-regex -- Prevent remote text controlling the terminal.
  return String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
}
/** @param {import('commander').Command} program @param {boolean} json */
export function registerAddonCommands(program, json) {
  const addons = program
    .command('addons')
    .description('Configure existing built-in and custom event add-ons');
  addons
    .command('get <event-id> <addon-type>')
    .description('Inspect enabled or disabled config')
    .action(async (id, type) => {
      const { profile, key } = await connection();
      output(await getAddon(profile, key, id, type));
    });
  for (const name of ['list', 'templates']) {
    const command = addons
      .command(name === 'list' ? 'list <event-id>' : 'templates')
      .description(
        name === 'list'
          ? 'List event add-on configs, including disabled ones'
          : 'List your existing published custom templates'
      )
      .option('--limit <number>', 'Page size (1–100)', '20')
      .option('--cursor <cursor>', 'Continue page')
      .option('--all', 'Deliberately retrieve all pages');
    const run = async (
      /** @type {string|null} */ id,
      /** @type {{limit:string,cursor?:string,all?:boolean}} */ input
    ) => {
      const { profile, key } = await connection();
      output(
        await listAddons(profile, key, id, {
          ...input,
          limit: Number(input.limit),
        })
      );
    };
    if (name === 'list') command.action(async (id, input) => run(id, input));
    else command.action(async input => run(null, input));
  }
  for (const operation of /** @type {const} */ ([
    'enable',
    'configure',
    'disable',
  ])) {
    const command = addons
      .command(`${operation} <event-id> <addon-type>`)
      .description(
        operation === 'configure'
          ? 'Replace config; may reset participant responses'
          : `${operation} an existing add-on`
      )
      .option(
        '--yes',
        'Confirm config replacement, response reset, or disable'
      );
    if (operation !== 'disable')
      command
        .option('--config <json>', 'Validated JSON config object')
        .option(
          '--config-file <path>',
          'Read JSON configuration from a local file'
        )
        .option('--reminder-offset <offset>', 'Reminders offset, e.g. 1_HOUR')
        .option('--questions <json>', 'Questionnaire questions array')
        .option('--items <json>', 'Bring-list items array')
        .option(
          '--guild-id <id>',
          'Discord guild ID (recent authorization required)'
        )
        .option('--guild-name <name>', 'Discord guild name')
        .option(
          '--template-id <id>',
          'Existing published custom template ID; use custom:<id>'
        );
    command.action(async (id, type, input) => {
      const config =
        operation === 'disable' ? null : await readConfiguration(type, input);
      const { profile, key } = await connection();
      output(
        await changeAddon(profile, key, id, type, operation, config, {
          yes: input.yes,
          json,
        })
      );
    });
  }
  async function connection() {
    const opts = program.opts();
    const profile = await getProfile(opts.profile);
    return { profile, key: await credential(profile, !!opts.apiKeyStdin) };
  }
  /** @param {unknown} value */
  function output(value) {
    if (json) {
      process.stdout.write(JSON.stringify(value) + '\n');
      return;
    }
    const result = /** @type {Record<string,unknown>} */ (value);
    const rows = Array.isArray(result.items) ? result.items : [result];
    process.stdout.write(
      rows.length
        ? rows
            .map(item =>
              Object.entries(item)
                .map(
                  ([name, entry]) =>
                    `${plain(name)}: ${plain(typeof entry === 'object' ? JSON.stringify(entry) : entry)}`
                )
                .join('\n')
            )
            .join('\n\n') + '\n'
        : 'No add-ons on this page.\n'
    );
    if (result.nextCursor)
      process.stdout.write(
        `More add-ons: use --cursor ${plain(result.nextCursor)} or --all.\n`
      );
  }
}
/** @param {string} type @param {{config?:string,configFile?:string,reminderOffset?:string,questions?:string,items?:string,guildId?:string,guildName?:string,templateId?:string}} input */
async function readConfiguration(type, input) {
  const selected = [
    input.config !== undefined,
    input.configFile !== undefined,
    input.reminderOffset !== undefined,
    input.questions !== undefined,
    input.items !== undefined,
    input.guildId !== undefined || input.guildName !== undefined,
    input.templateId !== undefined,
  ].filter(Boolean).length;
  if (selected !== 1)
    throw new CliError(
      'USAGE',
      'Choose exactly one config source: --config, --config-file, or the matching built-in/custom options.',
      2
    );
  if (input.configFile !== undefined) {
    try {
      const info = await stat(input.configFile);
      if (!info.isFile() || info.size > 64 * 1024) throw Error('Invalid file');
      return parse(await readFile(input.configFile, 'utf8'), '--config-file');
    } catch (error) {
      if (error instanceof CliError) throw error;
      throw new CliError(
        'USAGE',
        '--config-file must be a readable JSON file of at most 64 KiB.',
        2
      );
    }
  }
  if (input.config !== undefined) return parse(input.config, '--config');
  if (type === 'reminders' && input.reminderOffset !== undefined)
    return { reminderOffset: input.reminderOffset };
  if (type === 'questionnaire' && input.questions !== undefined)
    return { questions: parse(input.questions, '--questions') };
  if (type === 'bring-list' && input.items !== undefined)
    return { items: parse(input.items, '--items') };
  if (
    type === 'discord' &&
    input.guildId !== undefined &&
    input.guildName !== undefined
  )
    return { guildId: input.guildId, guildName: input.guildName };
  if (type === `custom:${input.templateId}`)
    return { templateId: input.templateId };
  throw new CliError(
    'USAGE',
    'Use the options matching the selected add-on type; Discord requires both --guild-id and --guild-name.',
    2
  );
}
/** @param {string} text @param {string} option */
function parse(text, option) {
  try {
    return JSON.parse(text);
  } catch {
    throw new CliError('USAGE', `${option} must contain valid JSON.`, 2);
  }
}
