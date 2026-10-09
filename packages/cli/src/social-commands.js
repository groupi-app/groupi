import { CliError } from './errors.js';
import { getProfile, credential } from './profiles.js';
import { listSocial, getSocialStatus, changeSocial } from './social.js';
/** @param {import('commander').Command} program @param {boolean} json */
export function registerSocialCommands(program, json) {
  const friends = program
    .command('friends')
    .description('Manage friendships and friend requests');
  const blocks = program.command('blocks').description('Manage blocked users');
  paged(
    friends.command('list').description('List accepted friendships'),
    'friends'
  );
  paged(
    friends
      .command('incoming')
      .description('Inspect received pending requests'),
    'incoming'
  );
  paged(
    friends.command('outgoing').description('Inspect sent pending requests'),
    'outgoing'
  );
  paged(blocks.command('list').description('List users you blocked'), 'blocks');
  for (const [
    command,
    isBlock,
  ] of /** @type {[import('commander').Command,boolean][]} */ ([
    [friends, false],
    [blocks, true],
  ]))
    command
      .command('status <person-id>')
      .description('Inspect your relationship with a person')
      .action(async id => {
        const { profile, key } = await connection();
        output(await getSocialStatus(profile, key, id, isBlock));
      });
  for (const operation of /** @type {const} */ ([
    'request',
    'accept',
    'decline',
    'cancel',
    'remove',
    'block',
    'unblock',
  ])) {
    const parent =
      operation === 'block' || operation === 'unblock' ? blocks : friends;
    const command = parent
      .command(
        `${operation} <${['request', 'block', 'unblock'].includes(operation) ? 'person' : 'friendship'}-id>`
      )
      .description(`${operation} social relationship`);
    if (!['request', 'accept'].includes(operation))
      command.option('--yes', 'Confirm this social change');
    command.action(async (id, input) => {
      const { profile, key } = await connection();
      output(
        await changeSocial(profile, key, operation, id, {
          yes: input.yes,
          json,
        })
      );
    });
  }
  /** @param {import('commander').Command} command @param {'friends'|'incoming'|'outgoing'|'blocks'} kind */
  function paged(command, kind) {
    command
      .option('--limit <number>', 'Page size (1–100)', '20')
      .option('--cursor <cursor>', 'Continue a prior page')
      .option('--all', 'Retrieve every page deliberately')
      .action(async input => {
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
          await listSocial(profile, key, kind, {
            ...input,
            limit: Number(input.limit),
          })
        );
      });
  }
  async function connection() {
    const options = program.opts();
    const profile = await getProfile(options.profile);
    return { profile, key: await credential(profile, !!options.apiKeyStdin) };
  }
  /** @param {Record<string,unknown>} value */
  function output(value) {
    const plain = JSON.stringify(value, null, 2).replace(
      // eslint-disable-next-line no-control-regex -- Remote text cannot control the terminal.
      /[\x00-\x09\x0b-\x1f\x7f-\x9f]/g,
      ' '
    );
    process.stdout.write((json ? JSON.stringify(value) : plain) + '\n');
  }
}
