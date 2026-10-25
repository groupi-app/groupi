import { readDefinition } from './addon-authoring-input.js';
import {
  createDefinition,
  getDefinition,
  portableDefinition,
  listDefinitions,
  changeDefinition,
} from './addon-authoring.js';
import { getProfile, credential } from './profiles.js';
/** @param {import('commander').Command} addons @param {import('commander').Command} program @param {boolean} json */
export function registerAuthoringCommands(addons, program, json) {
  const definitions = addons
    .command('definitions')
    .description('Author your custom add-on definitions');
  for (const operation of ['create', 'import'])
    definitions
      .command(operation)
      .description('Import a portable definition as a new draft')
      .option(
        '--file <path>',
        'Read a portable definition JSON file (64 KiB maximum)'
      )
      .option('--stdin', 'Read a portable definition from piped standard input')
      .action(async input => {
        const document = await readDefinition(
          input,
          !!program.opts().apiKeyStdin
        );
        const { profile, key } = await connection();
        output(await createDefinition(profile, key, document));
      });
  for (const operation of ['get', 'export'])
    definitions
      .command(`${operation} <template-id>`)
      .description(
        operation === 'get'
          ? 'Inspect your definition and its current version'
          : 'Write portable definition JSON to stdout; excludes owner and lifecycle metadata'
      )
      .action(async id => {
        const { profile, key } = await connection();
        const saved = await getDefinition(profile, key, id);
        if (operation === 'export')
          process.stdout.write(
            JSON.stringify(portableDefinition(saved), null, 2) + '\n'
          );
        else output(saved);
      });
  definitions
    .command('list')
    .description('List all your draft and published definitions')
    .option('--limit <number>', 'Page size (1–100)', '20')
    .option('--cursor <cursor>', 'Continue a page')
    .option('--all', 'Deliberately retrieve all pages')
    .action(async input => {
      const { profile, key } = await connection();
      output(await listDefinitions(profile, key, input));
    });
  for (const operation of /** @type {const} */ ([
    'edit',
    'publish',
    'unpublish',
    'delete',
  ])) {
    const command = definitions
      .command(`${operation} <template-id>`)
      .description(
        operation === 'edit'
          ? 'Replace your definition using its inspected version; existing event copies are unchanged'
          : `${operation} your definition using its inspected version`
      )
      .requiredOption(
        '--expected-version <number>',
        'Version returned by definitions get; rejects concurrent changes'
      )
      .option('--yes', 'Confirm definition replacement or lifecycle change');
    if (operation === 'edit')
      command
        .option(
          '--file <path>',
          'Read replacement portable JSON (64 KiB maximum)'
        )
        .option(
          '--stdin',
          'Read replacement portable JSON from piped standard input'
        );
    command.action(async (id, input) => {
      const document =
        operation === 'edit'
          ? await readDefinition(input, !!program.opts().apiKeyStdin)
          : undefined;
      const { profile, key } = await connection();
      output(
        await changeDefinition(profile, key, id, operation, document, {
          expectedVersion: input.expectedVersion,
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
    // JSON escapes terminal controls in user-provided definition strings.
    process.stdout.write(
      JSON.stringify(value, null, json ? undefined : 2) + '\n'
    );
  }
}
