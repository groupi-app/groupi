import { registerImageCommands } from './image-commands.js';
import { getProfile, credential } from './profiles.js';
import { CliError } from './errors.js';
import {
  profileFields,
  privacyFields,
  themeFields,
  getSettings,
  setSettings,
  checkFields,
  jsonObject,
  browserHandoff,
} from './account.js';

/** @param {unknown} value */
function plain(value) {
  // eslint-disable-next-line no-control-regex -- Remote text must not control the terminal.
  return String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
}
/** @param {import('commander').Command} program @param {boolean} json */
export function registerAccountCommands(program, json) {
  /** @param {unknown} value */
  const output = value =>
    process.stdout.write(
      json
        ? JSON.stringify(value) + '\n'
        : value === null
          ? 'No saved preferences.\n'
          : Object.entries(/** @type {Record<string,unknown>} */ (value))
              .map(
                ([key, item]) =>
                  `${key}: ${plain(typeof item === 'object' ? JSON.stringify(item) : item)}`
              )
              .join('\n') + '\n'
    );
  async function connection() {
    const options = program.opts();
    const profile = await getProfile(options.profile);
    return { profile, key: await credential(profile, !!options.apiKeyStdin) };
  }
  const account = program
    .command('account')
    .description(
      'Read/update your account and open explicit browser exceptions'
    );
  registerImageCommands(program, account, 'avatar', json);
  account
    .command('get')
    .description('Read your selected identity’s profile')
    .action(async () => {
      const { profile, key } = await connection();
      output(await getSettings(profile, key, '/profile', profileFields));
    });
  account
    .command('edit')
    .description('Update ordinary profile fields without browser interaction')
    .option('--name <text>', 'Display name')
    .option('--username <text>', 'Unique username')
    .option('--bio <text>', 'Bio; empty text clears it')
    .option('--pronouns <text>', 'Pronouns; empty text clears them')
    .action(async input => {
      checkFields(input, ['name', 'username', 'bio', 'pronouns']);
      const { profile, key } = await connection();
      output(await setSettings(profile, key, '/profile', input, profileFields));
    });
  for (const operation of /** @type {const} */ ([
    'passkeys',
    'linked-accounts',
    'delete',
  ]))
    account
      .command(operation)
      .description(
        'Explicitly open account settings; complete this action in the browser/device'
      )
      .action(async () => {
        const profile = await getProfile(program.opts().profile);
        if (program.opts().apiKeyStdin)
          throw new CliError(
            'USAGE',
            'Browser exceptions do not consume API keys from stdin.',
            2
          );
        const handoff = await browserHandoff(profile, operation, json);
        process.stdout.write(
          `Opened account settings for profile ${plain(handoff.profile)}. Complete ${operation} in the browser; this CLI action has not completed it.\n`
        );
      });
  const settings = program
    .command('settings')
    .description('Manage ordinary preferences without a browser');
  const privacy = settings
    .command('privacy')
    .description('Who may send friend requests and event invitations');
  privacy.command('get').action(async () => {
    const { profile, key } = await connection();
    output(await getSettings(profile, key, '/settings/privacy', privacyFields));
  });
  privacy
    .command('set')
    .option(
      '--friend-requests <permission>',
      'EVERYONE, EVENT_MEMBERS, or NO_ONE'
    )
    .option('--group-invites <permission>', 'EVERYONE, FRIENDS, or NO_ONE')
    .option(
      '--event-invites <permission>',
      'EVERYONE, EVENT_MEMBERS, FRIENDS, or NO_ONE'
    )
    .action(async input => {
      const body = {
        ...(input.friendRequests !== undefined
          ? { allowFriendRequestsFrom: input.friendRequests }
          : {}),
        ...(input.groupInvites
          ? { allowGroupInvitesFrom: input.groupInvites }
          : {}),
        ...(input.eventInvites !== undefined
          ? { allowEventInvitesFrom: input.eventInvites }
          : {}),
      };
      checkFields(body, privacyFields);
      const { profile, key } = await connection();
      output(
        await setSettings(
          profile,
          key,
          '/settings/privacy',
          body,
          privacyFields
        )
      );
    });
  const notifications = settings
    .command('notifications')
    .description('Notification delivery methods and per-type settings');
  notifications.command('get').action(async () => {
    const { profile, key } = await connection();
    output(
      await getSettings(profile, key, '/settings/notifications', [
        'methods',
        'typeSettings',
      ])
    );
  });
  notifications
    .command('set')
    .requiredOption(
      '--data <json>',
      'JSON object with notificationMethods array; omitted methods are deleted'
    )
    .option('--yes', 'Confirm replacing methods and removing omitted methods')
    .action(async input => {
      const body = jsonObject(input.data, '--data');
      checkFields(body, ['notificationMethods']);
      const { profile, key } = await connection();
      output(
        await setSettings(
          profile,
          key,
          '/settings/notifications',
          body,
          ['methods', 'typeSettings'],
          { yes: input.yes, json }
        )
      );
    });
  const theme = settings
    .command('theme')
    .description('Saved theme and system light/dark preferences');
  theme.command('get').action(async () => {
    const { profile, key } = await connection();
    output(await getSettings(profile, key, '/themes/preferences', themeFields));
  });
  theme
    .command('set')
    .requiredOption(
      '--data <json>',
      'JSON with selectedThemeType, selectedThemeId, useSystemPreference, systemLightThemeId, systemDarkThemeId; selectedCustomThemeId optional'
    )
    .action(async input => {
      const body = jsonObject(input.data, '--data');
      checkFields(body, themeFields);
      const { profile, key } = await connection();
      output(
        await setSettings(
          profile,
          key,
          '/themes/preferences',
          body,
          themeFields
        )
      );
    });
}
