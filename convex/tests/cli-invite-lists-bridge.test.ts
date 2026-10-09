// @vitest-environment node
import { expect, it } from 'vitest';
import { api } from '../_generated/api';
import { cliRestBridge } from './cli-rest-bridge.helpers';

it('manages a private list and replays its invitations after deletion while participation awaits acceptance', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('cli-list-owner');
    const recipient = await bridge.actor('cli-list-recipient');
    async function success(key: string, args: string[]) {
      const result = await bridge.cli(key, args);
      expect(result.code, result.stderr).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).not.toContain(key);
      return JSON.parse(result.stdout);
    }
    const event = await success(owner.rawKey, [
      'events',
      'create',
      '--title',
      'List bridge picnic',
    ]);
    const recipientId = bridge.wireId(recipient.personId);
    const ownerId = bridge.wireId(owner.personId);
    const created = await success(owner.rawKey, [
      'invite-lists',
      'create',
      '--name',
      '  Picnic people  ',
      '--person-ids',
      JSON.stringify([recipientId, ownerId, recipientId]),
    ]);
    expect(created).toMatchObject({
      name: 'Picnic people',
      personCount: 2,
      availablePersonCount: 2,
      needsAttention: false,
    });
    const edited = await success(owner.rawKey, [
      'invite-lists',
      'edit',
      created.inviteListId,
      '--name',
      '  Weekend people  ',
    ]);
    expect(edited).toMatchObject({
      inviteListId: created.inviteListId,
      name: 'Weekend people',
      people: created.people,
    });
    expect(
      (await success(recipient.rawKey, ['invite-lists', 'list'])).items
    ).toEqual([]);
    const privateDetail = await bridge.cli(recipient.rawKey, [
      'invite-lists',
      'get',
      created.inviteListId,
    ]);
    expect(privateDetail.code).toBe(4);
    expect(privateDetail.stdout).toBe('');
    expect(JSON.parse(privateDetail.stderr).error.code).toBe('NOT_FOUND');
    expect(
      (
        await recipient.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toEqual([]);

    const requestId = `${Date.now()}.${crypto.randomUUID()}`;
    const sendArgs = [
      'invite-lists',
      'invite',
      created.inviteListId,
      '--event',
      event.eventId,
      '--message',
      'Bring snacks',
      '--request-id',
      requestId,
    ];
    const sent = await success(owner.rawKey, sendArgs);
    expect(sent).toMatchObject({
      eventId: event.eventId,
      totalCount: 2,
      sentCount: 1,
      skippedCount: 1,
      requestId,
    });
    expect(sent.results).toEqual(
      expect.arrayContaining([
        { personId: recipientId, status: 'sent', inviteId: expect.any(String) },
        { personId: ownerId, status: 'skipped', reason: 'UNAVAILABLE' },
      ])
    );
    expect(
      (
        await success(owner.rawKey, [
          'events',
          'members',
          event.eventId,
          '--all',
        ])
      ).items
    ).toHaveLength(1);
    const inbox = await success(recipient.rawKey, [
      'invites',
      'members',
      'list',
    ]);
    expect(inbox.items).toHaveLength(1);
    expect(inbox.items[0]).toMatchObject({
      eventId: event.eventId,
      status: 'PENDING',
      role: 'ATTENDEE',
      message: 'Bring snacks',
    });

    const unconfirmed = await bridge.cli(owner.rawKey, [
      'invite-lists',
      'delete',
      created.inviteListId,
    ]);
    expect(unconfirmed.code).toBe(2);
    expect(JSON.parse(unconfirmed.stderr).error.code).toBe(
      'CONFIRMATION_REQUIRED'
    );
    expect(
      await success(owner.rawKey, [
        'invite-lists',
        'delete',
        created.inviteListId,
        '--yes',
      ])
    ).toEqual({ deleted: true, inviteListId: created.inviteListId });
    expect(
      (await success(owner.rawKey, ['invite-lists', 'list'])).items
    ).toEqual([]);
    const replay = await success(owner.rawKey, sendArgs);
    expect(replay).toEqual(sent);
    expect(
      (await success(recipient.rawKey, ['invites', 'members', 'list'])).items
    ).toEqual(inbox.items);
    expect(
      (
        await recipient.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.filter(row => row.type === 'EVENT_INVITE_RECEIVED')
    ).toHaveLength(1);
    expect(
      (
        await success(owner.rawKey, [
          'events',
          'members',
          event.eventId,
          '--all',
        ])
      ).items
    ).toHaveLength(1);

    await success(recipient.rawKey, [
      'invites',
      'members',
      'accept',
      inbox.items[0].inviteId,
    ]);
    expect(
      (
        await success(owner.rawKey, [
          'events',
          'members',
          event.eventId,
          '--all',
        ])
      ).items
    ).toHaveLength(2);
    expect(
      await success(recipient.rawKey, ['events', 'rsvp', 'get', event.eventId])
    ).toMatchObject({ rsvpStatus: 'PENDING' });
  } finally {
    await bridge.close();
  }
}, 30_000);
