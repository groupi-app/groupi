import { getProfile, credential } from './profiles.js';
import { CliError } from './errors.js';
import { readApplications, writeApplication } from './event-applications.js';
/** @param {unknown} text */
function parse(text) {
  try {
    return JSON.parse(String(text));
  } catch {
    throw new CliError('USAGE', 'Provide valid JSON.', 2);
  }
}
/** @param {import('commander').Command} program @param {import('commander').Command} events @param {boolean} json */
export function registerEventApplicationCommands(program, events, json) {
  const command = events
    .command('applications')
    .description('Configure, submit, or review private Event applications');
  const connect = async () => {
    const options = program.opts();
    const profile = await getProfile(options.profile);
    return { profile, key: await credential(profile, !!options.apiKeyStdin) };
  };
  /** @param {unknown} value */
  const print = value =>
    process.stdout.write(
      json
        ? JSON.stringify(value) + '\n'
        : JSON.stringify(value, null, 2) + '\n'
    );
  command
    .command('form <event-id>')
    .description(
      'Read current questions, your pending request, and action flags'
    )
    .action(async id => {
      const { profile, key } = await connect();
      print(await readApplications(profile, key, id, 'form'));
    });
  for (const kind of ['history', 'list'])
    command
      .command(`${kind} <event-id>`)
      .description(
        kind === 'history'
          ? 'Read your private history'
          : 'Read current authorized reviewer queue and history'
      )
      .option('--limit <number>', 'Page size (1–100)', '20')
      .option('--cursor <cursor>', 'Continue page')
      .action(async (id, input) => {
        const { profile, key } = await connect();
        print(
          await readApplications(
            profile,
            key,
            id,
            /** @type {'history'|'list'} */ (kind),
            { limit: Number(input.limit), cursor: input.cursor }
          )
        );
      });
  command
    .command('configure <event-id>')
    .requiredOption(
      '--questions <json>',
      'Question array; [] means no questions'
    )
    .option(
      '--reviewer-policy <policy>',
      'ORGANIZERS_AND_MODERATORS or ORGANIZER_ONLY',
      'ORGANIZERS_AND_MODERATORS'
    )
    .description(
      'Set core admission form without changing add-ons or admission policy'
    )
    .action(async (id, input) => {
      const { profile, key } = await connect();
      print(
        await writeApplication(profile, key, id, 'configure', {
          questions: parse(input.questions),
          reviewerPolicy: input.reviewerPolicy,
        })
      );
    });
  command
    .command('submit <event-id>')
    .requiredOption(
      '--answers <json>',
      'Answers object; pending submissions edit retained questions'
    )
    .action(async (id, input) => {
      const { profile, key } = await connect();
      print(
        await writeApplication(profile, key, id, 'submit', {
          answers: parse(input.answers),
        })
      );
    });
  command.command('withdraw <application-id>').action(async id => {
    const { profile, key } = await connect();
    print(await writeApplication(profile, key, id, 'withdraw'));
  });
  for (const action of ['approve', 'decline'])
    command
      .command(`${action} <application-id>`)
      .option('--reason <reason>', 'Private decision reason')
      .description(
        action === 'approve'
          ? 'Admit immediately as Attendee/Pending, with no second acceptance'
          : 'Decline this application; eligible people can reapply'
      )
      .action(async (id, input) => {
        const { profile, key } = await connect();
        print(
          await writeApplication(
            profile,
            key,
            id,
            /** @type {'approve'|'decline'} */ (action),
            input.reason ? { reason: input.reason } : {}
          )
        );
      });
}
