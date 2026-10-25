import { CliError } from './errors.js';
import { Option } from 'commander';
import { getProfile, credential } from './profiles.js';
import {
  getRsvp,
  setRsvp,
  setAvailability,
  listAttendance,
  dateInput,
  changeDate,
  clearAvailability,
} from './attendance.js';

/** @param {unknown} value */
function plain(value) {
  // eslint-disable-next-line no-control-regex -- Remote text cannot control the terminal.
  return String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
}
/** @param {import('commander').Command} program @param {import('commander').Command} events @param {boolean} json */
export function registerAttendanceCommands(program, events, json) {
  const rsvp = events
    .command('rsvp')
    .description('Read and update your own attendance response');
  rsvp.command('get <event-id>').action(async id => {
    const { profile, key } = await connection();
    output(await getRsvp(profile, key, id), 'Your RSVP');
  });
  rsvp
    .command('set <event-id>')
    .addOption(
      new Option('--status <status>', 'RSVP response')
        .choices(['YES', 'MAYBE', 'NO', 'PENDING'])
        .makeOptionMandatory()
    )
    .option(
      '--note <text>',
      'Note (up to 200 characters); omitted or empty clears it'
    )
    .action(async (id, input) => {
      const { profile, key } = await connection();
      output(
        await setRsvp(profile, key, id, {
          rsvpStatus: input.status,
          ...(input.note !== undefined ? { rsvpNote: input.note } : {}),
        }),
        'RSVP updated'
      );
    });

  const availability = events
    .command('availability')
    .description('Provide your availability and inspect permitted responses');
  availability
    .command('set <event-id>')
    .requiredOption(
      '--responses <json>',
      'Array of {potentialDateTimeId,status:YES|MAYBE|NO,note?}'
    )
    .action(async (id, input) => {
      let responses;
      try {
        responses = JSON.parse(input.responses);
      } catch {
        throw new CliError('USAGE', '--responses must be valid JSON.', 2);
      }
      const { profile, key } = await connection();
      output(
        await setAvailability(profile, key, id, responses),
        'Availability submitted'
      );
    });
  const dates = events
    .command('dates')
    .description('Inspect proposed dates and manage the chosen date');

  availability
    .command('clear <event-id>')
    .description(
      'Remove your availability responses and notes; RSVP is unchanged'
    )
    .option('--yes', 'Confirm clearing your responses')
    .action(async (id, input) => {
      const { profile, key } = await connection();
      output(
        await clearAvailability(profile, key, id, { yes: input.yes, json }),
        'Availability cleared'
      );
    });
  dates
    .command('choose <event-id>')
    .description(
      'Choose a proposed poll date or manually set a future date (organizer only)'
    )
    .option('--option <id>', 'Proposed date ID from dates list')
    .option('--start <iso>', 'Manual start with explicit offset or Z')
    .option('--end <iso>', 'Optional manual end with explicit offset or Z')
    .option(
      '--yes',
      'Confirm choosing the event date and applying its response transitions'
    )
    .action(async (id, input) => {
      const body = dateInput(input);
      const { profile, key } = await connection();
      output(
        await changeDate(profile, key, id, body, { yes: input.yes, json }),
        'Event date chosen'
      );
    });
  dates
    .command('reset <event-id>')
    .description(
      'Clear the chosen date while preserving responses (organizer only)'
    )
    .option('--yes', 'Confirm clearing the chosen date')
    .action(async (id, input) => {
      const { profile, key } = await connection();
      output(
        await changeDate(profile, key, id, null, { yes: input.yes, json }),
        'Event date reset'
      );
    });
  paged(
    events
      .command('members <event-id>')
      .description('List attendance when event permissions allow'),
    'members'
  );
  paged(
    dates
      .command('list <event-id>')
      .description('List proposed dates and their notes'),
    'dates'
  );
  paged(
    availability
      .command('get <event-id>')
      .description('List proposed dates with your own responses'),
    'mine'
  );
  paged(
    availability
      .command('responses <event-id>')
      .description('List member responses for one proposed date when permitted')
      .requiredOption('--option <id>', 'Proposed date ID'),
    'responses'
  );
  /** @param {import('commander').Command} command @param {'members'|'dates'|'mine'|'responses'} kind */
  function paged(command, kind) {
    command
      .option('--limit <number>', 'Page size (1–100)', '20')
      .option('--cursor <cursor>', 'Continue a prior page')
      .option('--all', 'Explicitly retrieve every page')
      .action(async (id, input) => {
        if (
          !/^\d+$/.test(input.limit) ||
          Number(input.limit) < 1 ||
          Number(input.limit) > 100
        )
          throw new CliError(
            'USAGE',
            '--limit must be an integer from 1 to 100.',
            2
          );
        const { profile, key } = await connection();
        output(
          await listAttendance(profile, key, id, kind, {
            ...input,
            limit: Number(input.limit),
          }),
          'Attendance data (use nextCursor with --cursor, or --all, to continue)'
        );
      });
  }
  async function connection() {
    const opts = program.opts();
    const profile = await getProfile(opts.profile);
    return { profile, key: await credential(profile, !!opts.apiKeyStdin) };
  }
  /** @param {Record<string,unknown>} value @param {string} title */
  function output(value, title) {
    process.stdout.write(
      json
        ? JSON.stringify(value) + '\n'
        : title +
            '\n' +
            Object.entries(value)
              .map(
                ([key, item]) =>
                  `${plain(key)}: ${plain(typeof item === 'object' ? JSON.stringify(item) : item)}`
              )
              .join('\n') +
            '\n'
    );
  }
}
