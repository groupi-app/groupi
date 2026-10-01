import { getProfile, credential } from './profiles.js';
import {
  notificationPageOptions,
  notificationTarget,
  listNotifications,
  notificationCount,
  changeNotification,
  subscription,
} from './notifications.js';

/** @param {unknown} value */
function plain(value) {
  // eslint-disable-next-line no-control-regex -- Remote text must not control the terminal.
  return String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
}
/** @param {import('commander').Command} program @param {import('commander').Command} events @param {boolean} json */
export function registerNotificationCommands(program, events, json) {
  async function connection() {
    const opts = program.opts();
    const profile = await getProfile(opts.profile);
    return { profile, key: await credential(profile, !!opts.apiKeyStdin) };
  }
  /** @param {unknown} value @param {string} human */
  function output(value, human) {
    process.stdout.write(json ? JSON.stringify(value) + '\n' : human + '\n');
  }
  const notifications = program
    .command('notifications')
    .description('Read and clear your notifications');
  notifications
    .command('list')
    .description('List notifications (default 20, newest first)')
    .option('--unread', 'Only unread notifications')
    .option('--limit <number>', 'Page size (1–100)', '20')
    .option('--cursor <cursor>', 'Continue a previous page')
    .option('--all', 'Retrieve every page deliberately')
    .action(async input => {
      const options = notificationPageOptions(input);
      const { profile, key } = await connection();
      const result = await listNotifications(profile, key, options);
      output(
        result,
        result.items
          .map(
            item =>
              `${plain(item.id)}  ${item.read ? 'read' : 'unread'}  ${plain(item.type)}  ${plain(item.post?.title ?? item.event?.title)}`
          )
          .join('\n') +
          (result.nextCursor
            ? `\nNext cursor: ${plain(result.nextCursor)}`
            : result.items.length
              ? ''
              : 'No notifications.')
      );
    });
  notifications
    .command('count')
    .description('Show unread count')
    .action(async () => {
      const { profile, key } = await connection();
      const result = await notificationCount(profile, key);
      output(result, `${result.count} unread notifications`);
    });
  for (const action of /** @type {const} */ ([
    'read',
    'unread',
    'read-all',
    'read-event',
    'read-post',
    'clear',
    'clear-all',
  ])) {
    const all = action === 'read-all' || action === 'clear-all';
    const command = notifications.command(
      `${action}${all ? '' : ` <${action === 'read-event' ? 'event-id' : action === 'read-post' ? 'post-id' : 'notification-id'}>`}`
    );
    if (action.startsWith('clear'))
      command.option('--yes', 'Confirm permanently clearing notifications');
    command.action(async (...args) => {
      const id = all ? undefined : notificationTarget(args[0]);
      const options = args[all ? 0 : 1];
      const { profile, key } = await connection();
      output(
        await changeNotification(profile, key, action, id, {
          yes: options.yes,
          json,
        }),
        'Notification state updated.'
      );
    });
  }
  const posts =
    program.commands.find(command => command.name() === 'posts') ??
    program.command('posts').description('Manage event discussions');
  for (const [scope, group] of /** @type {const} */ ([
    ['events', events],
    ['posts', posts],
  ])) {
    for (const action of /** @type {const} */ ([
      'mute',
      'unmute',
      'mute-status',
    ])) {
      group
        .command(`${action} <${scope === 'events' ? 'event' : 'post'}-id>`)
        .description(
          `${action === 'mute-status' ? 'Inspect' : action === 'mute' ? 'Mute' : 'Unmute'} ${scope === 'events' ? 'event' : 'discussion'} notifications`
        )
        .action(async id => {
          notificationTarget(id);
          const { profile, key } = await connection();
          const result = await subscription(profile, key, scope, id, action);
          output(
            result,
            'effectiveMuted' in result
              ? `Notifications ${result.effectiveMuted ? 'muted' : 'enabled'}${result.eventMuted ? ' (parent event muted)' : ''}.`
              : `${scope === 'events' ? 'Event' : 'Discussion'} ${action === 'mute' ? 'muted' : 'unmuted'}.`
          );
        });
    }
  }
}
