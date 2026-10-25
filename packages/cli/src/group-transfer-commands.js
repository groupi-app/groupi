import { getGroupTransfer, changeGroupTransfer } from './group-transfers.js';
import { getProfile, credential } from './profiles.js';
/** @param {import('commander').Command} program @param {import('commander').Command} groups @param {boolean} json */
export function registerGroupTransferCommands(program, groups, json) {
  const transfer = groups
    .command('transfer')
    .description(
      'Offer consensual Group responsibility; pending offers remain unresolved'
    );
  const connect = async () => {
    const options = program.opts();
    const profile = await getProfile(options.profile);
    return { profile, key: await credential(profile, !!options.apiKeyStdin) };
  };
  /** @param {unknown} result */
  const print = result =>
    process.stdout.write(
      JSON.stringify(result, null, json ? undefined : 2) + '\n'
    );
  transfer
    .command('status <group-id>')
    .description('Read the current participant-only transfer status')
    .action(async id => {
      const { profile, key } = await connect();
      print(await getGroupTransfer(profile, key, id));
    });
  transfer
    .command('offer <group-id> <person-id>')
    .description('Offer to an admitted member without changing ownership yet')
    .option('--yes', 'Confirm offering responsibility')
    .action(async (groupId, recipientId, input) => {
      const { profile, key } = await connect();
      print(
        await changeGroupTransfer(profile, key, groupId, 'offer', {
          recipientId,
          yes: input.yes,
          json,
        })
      );
    });
  for (const action of /** @type {const} */ (['accept', 'decline', 'cancel']))
    transfer
      .command(`${action} <group-id> <transfer-id>`)
      .description(
        action === 'accept'
          ? 'Accept responsibility as the single owner; former owner becomes Moderator'
          : action === 'decline'
            ? 'Decline the observed offer without changing ownership'
            : 'Cancel the observed pending offer as owner'
      )
      .option('--yes', 'Confirm acceptance')
      .action(async (groupId, transferId, input) => {
        const { profile, key } = await connect();
        print(
          await changeGroupTransfer(profile, key, groupId, action, {
            transferId,
            yes: input.yes,
            json,
          })
        );
      });
}
