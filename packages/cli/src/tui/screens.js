import { listEvents, getEvent, createEvent, editEvent } from '../events.js';
import { eventInput } from '../event-input.js';
import {
  getRsvp,
  setRsvp,
  listAttendance,
  setAvailability,
} from '../attendance.js';
import {
  listInvites,
  getInvite,
  sendMemberInvite,
  respondMemberInvite,
  memberInput,
} from '../invites.js';
import { listSocial, changeSocial } from '../social.js';
import {
  listNotifications,
  changeNotification,
  subscription,
} from '../notifications.js';
import { CliError } from '../errors.js';
import { safeText } from './session.js';
import {
  listDiscussion,
  getDiscussion,
  writeDiscussion,
  writeDiscussionWithFiles,
} from '../discussion.js';
import { textToHtml, readableContent, readContent } from '../content-input.js';

/** @typedef {import('./session.js').Screen} Screen */
/** @typedef {import('./session.js').Action} Action */
/** @typedef {import('./session.js').Field} Field */
/** @typedef {{items:Record<string,unknown>[],nextCursor:unknown}} Page */

/** Bind every screen to one explicit profile and credential; never rediscover
 * the default connection while navigating. Authorization remains in services.
 * @param {{name:string,apiUrl:string}} profile @param {string} key */
export function planningScreens(profile, key) {
  const confirmed = { yes: true, json: true };
  /** @param {unknown} value */
  const text = value => safeText(value);
  /** @param {string} id @param {string} title @param {()=>Promise<Record<string,unknown>>} load @param {Action[]} [actions] @param {import('./session.js').Entry[]} [entries] @returns {Screen} */
  const detail = (id, title, load, actions = [], entries = []) => ({
    id,
    load: async () => ({
      title,
      lines: describe(await load()),
      entries,
      actions,
    }),
  });
  /** @param {string} id @param {string} title @param {(cursor?:string)=>Promise<Page|undefined>} load @param {(item:Record<string,unknown>,refresh:()=>Promise<Record<string,unknown>>)=>Screen} select @param {Action[]} [actions] @param {string} [cursor] @returns {Screen} */
  function page(id, title, load, select, actions = [], cursor) {
    return {
      id: `${id}:${cursor ?? ''}`,
      load: async () => {
        const result = await load(cursor);
        if (!result) throw Error('Incomplete page');
        if (cursor && result.nextCursor === cursor)
          throw new CliError(
            'INVALID_RESPONSE',
            'The server repeated a pagination cursor. Return to the first page.',
            5
          );
        return {
          title,
          actions,
          entries: result.items.map((item, index) => ({
            id: String(item.id ?? item.inviteId ?? item.personId ?? index),
            label: label(item),
            screen: select(item, async () => {
              const updated = await load(cursor);
              const found = updated?.items.find(
                candidate => rowId(candidate) === rowId(item)
              );
              if (!found)
                throw new CliError(
                  'NOT_FOUND',
                  'This item is no longer on this page. Go back and refresh the list.',
                  4
                );
              return found;
            }),
          })),
          ...(typeof result.nextCursor === 'string'
            ? {
                next: page(id, title, load, select, actions, result.nextCursor),
              }
            : {}),
        };
      },
    };
  }
  /** @param {string} id @param {string} label @param {string} command @param {Field[]} fields @param {Action['run']} run @returns {Action} */
  const action = (id, label, command, fields, run) => ({
    id,
    label,
    command,
    fields,
    run,
  });
  /** @type {Field[]} */
  const eventFields = [
    { name: 'title', label: 'Title' },
    { name: 'description', label: 'Description (optional)' },
    { name: 'location', label: 'Location (optional)' },
    {
      name: 'start',
      label: 'Start ISO date with Z/offset (optional; leave blank for undated)',
    },
  ];
  const create = action(
    'create',
    'Create event',
    'events create',
    eventFields,
    values =>
      createEvent(
        profile,
        key,
        eventInput(
          Object.fromEntries(
            Object.entries(values).filter(([, v]) => v !== '')
          ),
          true
        )
      )
  );
  /** @returns {Screen} */
  const events = () =>
    page(
      'events',
      'Your events',
      cursor => listEvents(profile, key, { limit: 20, cursor }),
      item => event(String(item.id)),
      [create]
    );
  /** @param {string} id @returns {Screen} */
  function event(id) {
    return {
      id: `event:${id}`,
      load: async () => {
        const data = await getEvent(profile, key, id);
        return {
          title: text(data.title),
          lines: describe(data),
          entries: [
            { id: 'rsvp', label: 'Your RSVP', screen: rsvp(id) },
            { id: 'dates', label: 'Dates and availability', screen: dates(id) },
            {
              id: 'attendance',
              label: 'Attendance',
              screen: page(
                `attendance:${id}`,
                'Attendance',
                cursor =>
                  listAttendance(profile, key, id, 'members', {
                    limit: 20,
                    cursor,
                  }),
                (item, refresh) =>
                  detail(`member:${item.id}`, 'Member', refresh)
              ),
            },
            { id: 'invites', label: 'Sent invitations', screen: invites(id) },
            {
              id: 'posts',
              label: 'Discussion',
              screen: discussion('posts', id),
            },
          ],
          actions: [
            action(
              'edit',
              `Edit event ${id}`,
              'events edit',
              [
                {
                  name: 'field',
                  label: 'Field to update (other fields are preserved)',
                  choices: ['title', 'description', 'location'],
                },
                {
                  name: 'value',
                  label: 'New value (blank clears description/location)',
                },
              ],
              values =>
                editEvent(
                  profile,
                  key,
                  id,
                  eventInput({ [values.field]: values.value }, false),
                  confirmed
                )
            ),
            action(
              'invite',
              `Invite person to ${id}`,
              'invites members send',
              [{ name: 'username', label: 'Username' }],
              values => sendMemberInvite(profile, key, id, memberInput(values))
            ),
            ...['mute', 'unmute'].map(operation =>
              action(
                operation,
                `${operation} event ${id}`,
                `events ${operation}`,
                [],
                () =>
                  subscription(
                    profile,
                    key,
                    'events',
                    id,
                    /** @type {'mute'|'unmute'} */ (operation)
                  )
              )
            ),
          ],
        };
      },
    };
  }
  /** @param {'posts'|'replies'} kind @param {string} parentId @returns {Screen} */
  function discussion(kind, parentId) {
    return page(
      `${kind}:${parentId}`,
      kind === 'posts' ? 'Event discussion' : 'Replies',
      async cursor => {
        const result = await listDiscussion(profile, key, kind, parentId, {
          limit: 20,
          cursor,
        });
        return { ...result, items: result.items.map(discussionRecord) };
      },
      item => discussionDetail(kind, String(item.id)),
      [
        action(
          'create',
          `Create ${kind === 'posts' ? 'post' : 'reply'} in ${parentId}`,
          `${kind} create`,
          [
            ...(kind === 'posts' ? [{ name: 'title', label: 'Title' }] : []),
            {
              name: 'body',
              label: 'Plain text (use CLI --file for multiline or Markdown)',
            },
            { name: 'attachment', label: 'Local attachment path (optional)' },
          ],
          values =>
            writeDiscussionWithFiles(
              profile,
              key,
              kind,
              'create',
              parentId,
              {
                ...(kind === 'posts' ? { title: values.title } : {}),
                [kind === 'posts' ? 'content' : 'text']: textToHtml(
                  values.body
                ),
              },
              values.attachment ? [values.attachment] : [],
              confirmed
            )
        ),
      ]
    );
  }
  /** @param {'posts'|'replies'} kind @param {string} id @returns {Screen} */
  function discussionDetail(kind, id) {
    return {
      id: `${kind}:${id}`,
      load: async () => {
        const item = discussionRecord(
          await getDiscussion(profile, key, kind, id)
        );
        const body = String(item[kind === 'posts' ? 'content' : 'text'] ?? '');
        const plainBody = readableContent(body).replace(/\n$/, '');
        const canEditPlain =
          !plainBody.includes('\n') && textToHtml(plainBody) === body;
        const attachments = Array.isArray(item.attachments)
          ? item.attachments.filter(
              file =>
                file && typeof file === 'object' && typeof file.id === 'string'
            )
          : [];
        return {
          title: kind === 'posts' ? text(item.title) : 'Reply',
          lines: [
            ...readableContent(body).split('\n'),
            `ID: ${id}`,
            'For rich edits: export original HTML with the JSON get command, edit that source in your editor, then use Edit from HTML file. Never edit the readable terminal projection; formatting and mentions would be lost.',
            ...attachments.map(
              file =>
                `Attachment ${file.id}: ${text(file.filename)} (${text(file.mimeType)}, ${text(file.size)} bytes)`
            ),
          ],
          entries:
            kind === 'posts'
              ? [
                  {
                    id: 'replies',
                    label: 'Replies',
                    screen: discussion('replies', id),
                  },
                ]
              : [],
          actions: [
            ...(canEditPlain
              ? [
                  action(
                    'plain',
                    `Edit plain text of ${kind} ${id}`,
                    `${kind} edit`,
                    [{ name: 'body', label: 'Plain text', initial: plainBody }],
                    values =>
                      writeDiscussion(
                        profile,
                        key,
                        kind,
                        'edit',
                        id,
                        {
                          [kind === 'posts' ? 'content' : 'text']: textToHtml(
                            values.body
                          ),
                        },
                        confirmed
                      )
                  ),
                ]
              : []),
            action(
              'attach',
              `Attach file to ${kind} ${id}`,
              `${kind} edit`,
              [{ name: 'file', label: 'Local attachment path' }],
              values =>
                writeDiscussionWithFiles(
                  profile,
                  key,
                  kind,
                  'edit',
                  id,
                  {},
                  [values.file],
                  confirmed
                )
            ),
            ...attachments.map(file =>
              action(
                `remove:${file.id}`,
                `Remove attachment ${text(file.filename)} (${file.id}) from ${kind} ${id}`,
                `${kind} attachments remove`,
                [],
                () =>
                  writeDiscussion(
                    profile,
                    key,
                    kind,
                    'edit',
                    id,
                    { attachmentIdsToDelete: [file.id] },
                    confirmed
                  )
              )
            ),
            ...(kind === 'posts'
              ? [
                  action(
                    'title',
                    `Edit title of post ${id}`,
                    'posts edit',
                    [
                      {
                        name: 'title',
                        label: 'Title',
                        initial: text(item.title),
                      },
                    ],
                    values =>
                      writeDiscussion(
                        profile,
                        key,
                        kind,
                        'edit',
                        id,
                        { title: values.title },
                        confirmed
                      )
                  ),
                ]
              : []),
            action(
              'html',
              `Edit ${kind} ${id} from original HTML file`,
              `${kind} edit`,
              [
                {
                  name: 'file',
                  label:
                    'Local edited HTML file path (original formatting/mentions retained)',
                },
              ],
              async values =>
                writeDiscussion(
                  profile,
                  key,
                  kind,
                  'edit',
                  id,
                  {
                    [kind === 'posts' ? 'content' : 'text']: await readContent(
                      { file: values.file, contentFormat: 'html' },
                      false
                    ),
                  },
                  confirmed
                )
            ),
            action('delete', `Delete ${kind} ${id}`, `${kind} delete`, [], () =>
              writeDiscussion(profile, key, kind, 'delete', id, {}, confirmed)
            ),
            ...(kind === 'posts'
              ? ['mute', 'unmute'].map(operation =>
                  action(
                    operation,
                    `${operation} post ${id}`,
                    `posts ${operation}`,
                    [],
                    () =>
                      subscription(
                        profile,
                        key,
                        'posts',
                        id,
                        /** @type {'mute'|'unmute'} */ (operation)
                      )
                  )
                )
              : []),
          ],
        };
      },
    };
  }
  /** @param {string} id @returns {Screen} */
  function rsvp(id) {
    return detail(`rsvp:${id}`, 'Your RSVP', () => getRsvp(profile, key, id), [
      action(
        'set',
        `Submit RSVP for ${id}`,
        'events rsvp set',
        [
          {
            name: 'status',
            label: 'RSVP',
            choices: ['YES', 'MAYBE', 'NO', 'PENDING'],
          },
          { name: 'note', label: 'Note (blank clears)' },
        ],
        values =>
          setRsvp(profile, key, id, {
            rsvpStatus: values.status,
            rsvpNote: values.note,
          })
      ),
    ]);
  }
  /** @param {string} id @returns {Screen} */
  function dates(id) {
    return page(
      `dates:${id}`,
      'Your availability',
      cursor => listAttendance(profile, key, id, 'mine', { limit: 20, cursor }),
      (item, refresh) => {
        const option = /** @type {Record<string,unknown>} */ (
          item.potentialDateTime
        );
        return detail(`availability:${option.id}`, 'Proposed date', refresh, [
          action(
            'set',
            `Set availability for date ${option.id} in event ${id}`,
            'events availability set',
            [
              {
                name: 'status',
                label: 'Availability',
                choices: ['YES', 'MAYBE', 'NO'],
              },
              { name: 'note', label: 'Note (blank clears)' },
            ],
            values =>
              setAvailability(profile, key, id, [
                {
                  potentialDateTimeId: option.id,
                  status: values.status,
                  note: values.note,
                },
              ])
          ),
        ]);
      }
    );
  }
  /** @param {string} [eventId] @returns {Screen} */
  function invites(eventId) {
    return page(
      `invites:${eventId ?? 'mine'}`,
      eventId ? 'Sent invitations' : 'Your invitations',
      cursor =>
        listInvites(profile, key, 'members', eventId, {
          limit: 20,
          cursor,
          status: 'all',
        }),
      item => {
        const id = String(item.inviteId);
        return detail(
          `invite:${id}`,
          'Invitation',
          () => getInvite(profile, key, 'members', id),
          (eventId ? ['revoke'] : ['accept', 'decline']).map(operation =>
            action(
              operation,
              `${operation} invitation ${id}`,
              `invites members ${operation}`,
              [],
              () =>
                respondMemberInvite(
                  profile,
                  key,
                  id,
                  /** @type {'accept'|'decline'|'revoke'} */ (operation),
                  confirmed
                )
            )
          )
        );
      }
    );
  }
  /** @param {'friends'|'incoming'|'outgoing'|'blocks'} kind @returns {Screen} */
  function social(kind) {
    return page(
      kind,
      kind,
      cursor => listSocial(profile, key, kind, { limit: 20, cursor }),
      (item, refresh) => {
        const person = String(item.personId);
        /** @type {('accept'|'decline'|'cancel'|'remove'|'block'|'unblock')[]} */
        const operations =
          kind === 'incoming'
            ? ['accept', 'decline', 'block']
            : kind === 'outgoing'
              ? ['cancel', 'block']
              : kind === 'blocks'
                ? ['unblock']
                : ['remove', 'block'];
        return detail(
          `person:${person}`,
          text(item.name || item.username || person),
          refresh,
          operations.map(operation => {
            const id = ['accept', 'decline', 'cancel', 'remove'].includes(
              operation
            )
              ? String(item.friendshipId)
              : person;
            return action(
              operation,
              `${operation} ${text(item.name || item.username || person)} (${person})`,
              `${operation === 'block' || operation === 'unblock' ? 'blocks' : 'friends'} ${operation}`,
              [],
              () => changeSocial(profile, key, operation, id, confirmed)
            );
          })
        );
      },
      [
        action(
          'request',
          'Send friend request',
          'friends request',
          [{ name: 'personId', label: 'Person ID' }],
          values =>
            changeSocial(profile, key, 'request', values.personId, confirmed)
        ),
      ]
    );
  }
  /** @param {boolean} [unread] @returns {Screen} */
  function notifications(unread = false) {
    const screen = page(
      `notifications:${unread}`,
      unread ? 'Unread notifications' : 'Notifications',
      cursor => listNotifications(profile, key, { limit: 20, cursor, unread }),
      (item, refresh) => {
        const id = String(item.id);
        const target = /** @type {{id:string,title:string}|null} */ (
          item.event
        );
        const post = /** @type {{id:string,title:string}|null} */ (item.post);
        return detail(
          `notification:${id}`,
          'Notification',
          refresh,
          ['read', 'unread', 'clear'].map(operation =>
            action(
              operation,
              `${operation} notification ${id}`,
              `notifications ${operation}`,
              [],
              () =>
                changeNotification(
                  profile,
                  key,
                  /** @type {'read'|'unread'|'clear'} */ (operation),
                  id,
                  confirmed
                )
            )
          ),
          [
            ...(target
              ? [
                  {
                    id: 'event',
                    label: `Open ${text(target.title)}`,
                    screen: event(target.id),
                  },
                ]
              : []),
            ...(post
              ? [
                  {
                    id: 'post',
                    label: `Open post ${text(post.title)}`,
                    screen: discussionDetail('posts', post.id),
                  },
                ]
              : []),
          ]
        );
      },
      [
        action(
          'read-all',
          'Mark all notifications read',
          'notifications read-all',
          [],
          () =>
            changeNotification(profile, key, 'read-all', undefined, confirmed)
        ),
        action(
          'clear-all',
          'Clear all notifications',
          'notifications clear-all',
          [],
          () =>
            changeNotification(profile, key, 'clear-all', undefined, confirmed)
        ),
      ]
    );
    return screen;
  }
  /** @type {Screen} */
  const home = {
    id: 'home',
    load: async () => ({
      title: 'Groupi',
      lines: ['Plan together from your terminal. Choose a screen.'],
      entries: [
        { id: 'events', label: 'Events', screen: events() },
        { id: 'invites', label: 'Invitations', screen: invites() },
        {
          id: 'notifications',
          label: 'Notifications',
          screen: notifications(),
        },
        {
          id: 'unread',
          label: 'Unread notifications',
          screen: notifications(true),
        },
        ...['friends', 'incoming', 'outgoing', 'blocks'].map(kind => ({
          id: kind,
          label:
            kind === 'incoming'
              ? 'Incoming friend requests'
              : kind === 'outgoing'
                ? 'Outgoing friend requests'
                : kind === 'blocks'
                  ? 'Blocked people'
                  : 'Friends',
          screen: social(
            /** @type {'friends'|'incoming'|'outgoing'|'blocks'} */ (kind)
          ),
        })),
        {
          id: 'help',
          label: 'Advanced commands',
          screen: {
            id: 'help',
            load: async () => ({
              title: 'Advanced commands',
              entries: [],
              lines: [
                'Exit with q, then run groupi --profile ' +
                  text(profile.name) +
                  ' <command>.',
                'events dates choose/reset • events access • events members',
                'invites email • invites links • profile • addons • account',
                'Use --help on a command for its options. No browser opens automatically.',
              ],
            }),
          },
        },
      ],
    }),
  };
  return {
    home,
    events,
    event,
    invites,
    social,
    notifications,
    discussion,
    discussionDetail,
  };
}

/** @param {Record<string,unknown>} item */
function label(item) {
  const user =
    item.user && typeof item.user === 'object'
      ? /** @type {Record<string,unknown>} */ (item.user)
      : {};
  const date =
    item.potentialDateTime && typeof item.potentialDateTime === 'object'
      ? /** @type {Record<string,unknown>} */ (item.potentialDateTime)
      : {};
  return safeText(
    [
      item.title ||
        item.eventTitle ||
        item.name ||
        item.username ||
        user.name ||
        (typeof date.dateTime === 'number'
          ? new Date(date.dateTime).toISOString()
          : null) ||
        item.type ||
        (typeof item.text === 'string'
          ? readableContent(item.text).slice(0, 100)
          : '') ||
        item.id ||
        item.personId,
      item.rsvpStatus || item.status,
      item.read === false ? 'unread' : null,
    ]
      .filter(Boolean)
      .join(' · ')
  );
}
/** @param {Record<string,unknown>} record */
function describe(record) {
  return Object.entries(record).map(([name, value]) =>
    safeText(
      `${name}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
    )
  );
}

/** @param {Record<string,unknown>} item */
function rowId(item) {
  const date =
    item.potentialDateTime && typeof item.potentialDateTime === 'object'
      ? /** @type {Record<string,unknown>} */ (item.potentialDateTime)
      : {};
  return String(item.id ?? item.inviteId ?? item.personId ?? date.id);
}

/** @param {unknown} value @returns {Record<string,unknown>} */
function discussionRecord(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    !('id' in value) ||
    typeof value.id !== 'string'
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'The server returned incomplete discussion data.',
      5
    );
  return /** @type {Record<string,unknown>} */ (value);
}
