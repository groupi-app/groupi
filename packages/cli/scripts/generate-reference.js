import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createProgram } from '../src/command.js';

// References describe the distributed default, independent of the caller's profile.
const selectedProfile = process.env.GROUPI_PROFILE;
delete process.env.GROUPI_PROFILE;
const program = createProgram();
if (selectedProfile !== undefined) process.env.GROUPI_PROFILE = selectedProfile;
const metadata = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8')
);

/** @param {import('commander').Command} command @param {string[]} parents
 * @returns {{path: string[], help: string}[]}
 */
function commands(command, parents = []) {
  command.configureHelp({ helpWidth: 100 });
  const path = [...parents, command.name()];
  return [
    { path, help: command.helpInformation() },
    ...command.commands.flatMap(child => commands(child, path)),
  ];
}
const entries = commands(program);
const reference =
  JSON.stringify(
    {
      package: metadata.name,
      version: metadata.version,
      commands: entries.map(entry => ({
        path: entry.path.join(' '),
        help: entry.help,
      })),
    },
    null,
    2
  ) + '\n';
const markdown = [
  '# Groupi command reference',
  '',
  `Generated from ${metadata.name} ${metadata.version}. Run \`groupi --version\` to verify the installed version.`,
  'Regenerate with `pnpm --filter @groupi/cli docs:generate`; CI checks for stale definitions.',
  '',
  'Global options are inherited by commands. Live defaults can reflect `GROUPI_PROFILE`; this reference shows the packaged default.',
  '',
  '## Table of Contents',
  '',
  ...entries.map(
    entry => `- [${entry.path.join(' ')}](#${entry.path.join('-')})`
  ),
  '',
  ...entries.flatMap(entry => [
    `## ${entry.path.join(' ')}`,
    '',
    '```text',
    entry.help.trimEnd(),
    '```',
    '',
  ]),
].join('\n');
const workflows = JSON.parse(
  await readFile(
    new URL('../docs/agent-workflows.json', import.meta.url),
    'utf8'
  )
);
/** @param {string} argument */
function shellArgument(argument) {
  if (/^\$[A-Z_]+$/.test(argument)) return `"${argument}"`;
  if (/^[a-zA-Z0-9_-]+$/.test(argument)) return argument;
  return "'" + argument.replaceAll("'", "'\\''") + "'";
}
const workflowMarkdown = [
  '# Groupi workflow examples',
  '',
  `Examples for ${metadata.name} ${metadata.version}. Generated from agent-workflows.json; exercised at the executable boundary.`,
  '',
  'These shell examples require trusted installed Groupi, configured profiles, and credentials injected from a secret manager.',
  'Set ORGANIZER_PROFILE and ATTENDEE_PROFILE for distinct identities on the same server, and ATTENDEE_USERNAME to the intended recipient.',
  'For each command, select the matching saved credential or environment key scoped by GROUPI_API_KEY_PROFILE. Verify identities with auth status first.',
  'Capture EVENT_ID from event creation and INVITE_ID from username invitation creation. The attendee must inspect the invitation before accepting it.',
  'For the invite-lists workflow, set INVITE_LIST_PERSON_IDS to a JSON array of intended personId values selected from username discovery; capture INVITE_LIST_ID from creation. Creating or editing a list sends no invitations. The invite command explicitly sends current people; inspect sent/skipped results, including zero-sent outcomes.',
  'Generate and retain EVENT_REQUEST_ID, INVITE_REQUEST_ID, and INVITE_LIST_REQUEST_ID as Unix-milliseconds.UUID identifiers before running the write jobs. List creation/edit/deletion are sent once; protected list invitation uses the retained request identifier.',
  '',
  '```sh',
  'EVENT_REQUEST_ID=$(node -e \'console.log(Date.now()+"."+require("node:crypto").randomUUID())\')',
  'INVITE_REQUEST_ID=$(node -e \'console.log(Date.now()+"."+require("node:crypto").randomUUID())\')',
  'INVITE_LIST_REQUEST_ID=$(node -e \'console.log(Date.now()+"."+require("node:crypto").randomUUID())\')',
  '```',
  '',
  '## Table of Contents',
  '',
  ...Object.keys(workflows).map(name => `- [${name}](#${name})`),
  '',
  ...Object.entries(workflows).flatMap(([name, steps]) => [
    `## ${name}`,
    '',
    '```sh',
    ...steps.map(
      /** @param {{identity: string, args: string[]}} step */ step =>
        `groupi --profile "$${step.identity.toUpperCase()}_PROFILE" ${step.args.map(shellArgument).join(' ')}`
    ),
    '```',
    '',
  ]),
  'Windows users can pass the same arguments from PowerShell or a process API; shell variable assignment and quoting follow the host shell.',
  '',
  'Fixture checks prove executable argument/output behavior with synthetic credentials. Real staging permissions, notification delivery, and OS credential stores require separate release evidence.',
  '',
].join('\n');
const artifacts = [
  ['command-reference.json', reference],
  ['command-reference.md', markdown],
  ['workflow-examples.md', workflowMarkdown],
];
if (process.argv.includes('--check')) {
  for (const [name, expected] of artifacts) {
    let current;
    try {
      current = await readFile(
        new URL(`../docs/${name}`, import.meta.url),
        'utf8'
      );
    } catch {
      current = '';
    }
    if (current !== expected) {
      process.stderr.write(
        `Stale CLI reference: ${name}. Run pnpm --filter @groupi/cli docs:generate.\n`
      );
      process.exitCode = 1;
    }
  }
} else {
  await mkdir(new URL('../docs/', import.meta.url), { recursive: true });
  for (const [name, value] of artifacts)
    await writeFile(new URL(`../docs/${name}`, import.meta.url), value);
}
