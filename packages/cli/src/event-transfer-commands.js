import { getProfile, credential } from './profiles.js';
import { eventTransfer } from './event-transfer.js';
/** @param {unknown} value */
function plain(value) {
  // eslint-disable-next-line no-control-regex -- Remote values must not control the terminal.
  return String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
}
/** @param {import('commander').Command} program @param {import('commander').Command} events @param {boolean} json */
export function registerEventTransferCommands(program, events, json) {
  const transfer = events
    .command('transfer')
    .description(
      'Consensual Event ownership; Friends audience follows accepted new Organizer'
    );
  for (const action of /** @type {const} */ ([
    'status',
    'offer',
    'accept',
    'decline',
    'cancel',
  ])) {
    const command = transfer
      .command(
        `${action} <event-id>${action === 'offer' ? ' <recipient-id>' : action === 'status' ? '' : ' <transfer-id>'}`
      )
      .description(
        action === 'status'
          ? 'Inspect pending/resolved ownership'
          : `${action} the named ownership offer`
      );
    if (action !== 'status')
      command.option(
        '--yes',
        'Confirm ownership action and Friends audience consequence'
      );
    command.action(async (eventId, target, input) => {
      const opts = program.opts();
      const profile = await getProfile(opts.profile);
      const key = await credential(profile, !!opts.apiKeyStdin);
      const outcome = await eventTransfer(profile, key, eventId, action, {
        recipientId: action === 'offer' ? target : undefined,
        transferId: action === 'status' ? undefined : target,
        yes: input?.yes,
        json,
      });
      process.stdout.write(
        json
          ? JSON.stringify(outcome) + '\n'
          : outcome
            ? `Ownership: ${plain(outcome.organizerId)}\nTransfer: ${outcome.status}${outcome.status === 'PENDING' ? ' (unresolved)' : ''}\nOffer: ${plain(outcome.transferId ?? 'none')}\n${plain(outcome.explanation)}\n`
            : 'No ownership transfer visible to this member.\n'
      );
    });
  }
}
