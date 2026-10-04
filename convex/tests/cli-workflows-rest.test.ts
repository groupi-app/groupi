// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '../_generated/api';
import { cliRestBridge } from './cli-rest-bridge.helpers';

describe('Public CLI workflows against authenticated Convex REST', () => {
  let bridge: Awaited<ReturnType<typeof cliRestBridge>>;
  beforeEach(async () => {
    bridge = await cliRestBridge();
  });
  afterEach(async () => {
    await bridge.close();
  });

  async function success(key: string, args: string[]) {
    const result = await bridge.cli(key, args);
    expect(result.code, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    return JSON.parse(result.stdout);
  }
  async function denied(key: string, args: string[], code: string) {
    const result = await bridge.cli(key, args);
    expect(result.code).not.toBe(0);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr)).toMatchObject({ error: { code } });
  }
  async function joinedEvent() {
    const organizer = await bridge.actor('cli-organizer');
    const attendee = await bridge.actor('cli-attendee');
    const event = await success(organizer.rawKey, [
      'events',
      'create',
      '--title',
      'CLI picnic',
    ]);
    const invite = await organizer.request(
      `/events/${bridge.id<'events'>(event.eventId)}/invites`,
      'POST',
      {}
    );
    expect(invite.status).toBe(201);
    const { token } = await invite.json();
    const joined = await attendee.request(`/invites/${token}/accept`, 'POST');
    expect(joined.status).toBe(200);
    const member = await joined.json();
    return {
      organizer,
      attendee,
      eventId: event.eventId,
      membershipId: bridge.wireId(member.membershipId),
    };
  }

  it('creates an event, discovers it as a friend, joins and leaves with app notifications', async () => {
    // Arrange real identities and friendship through the public executable.
    const organizer = await bridge.actor('discover-organizer');
    const attendee = await bridge.actor('discover-attendee');
    const request = await success(organizer.rawKey, [
      'friends',
      'request',
      bridge.wireId(attendee.personId),
    ]);
    await success(attendee.rawKey, ['friends', 'accept', request.friendshipId]);
    const event = await success(organizer.rawKey, [
      'events',
      'create',
      '--title',
      'Friends picnic',
      '--start',
      new Date(Date.now() + 86400000).toISOString(),
    ]);
    await success(organizer.rawKey, [
      'events',
      'settings',
      'set',
      event.eventId,
      '--visibility',
      'FRIENDS',
    ]);

    // Act and assert the CLI discovery/participation path and domain effects.
    const discover = await success(attendee.rawKey, [
      'events',
      'discover',
      '--limit',
      '1',
      '--all',
    ]);
    expect(discover.items).toMatchObject([
      { id: event.eventId, title: 'Friends picnic' },
    ]);
    expect(discover.nextCursor).toBeNull();
    expect(
      await success(attendee.rawKey, ['events', 'join', event.eventId])
    ).toMatchObject({ joined: true, role: 'ATTENDEE', rsvpStatus: 'PENDING' });
    const eventId = bridge.id<'events'>(event.eventId);
    expect(
      (
        await attendee.auth.query(api.events.queries.getEventHeader, {
          eventId,
        })
      ).userMembership
    ).toMatchObject({ role: 'ATTENDEE', rsvpStatus: 'PENDING' });
    expect(
      (await success(attendee.rawKey, ['events', 'discover', '--all'])).items
    ).toEqual([]);
    await denied(
      organizer.rawKey,
      ['events', 'leave', event.eventId, '--yes'],
      'FORBIDDEN'
    );
    await denied(
      attendee.rawKey,
      ['events', 'leave', event.eventId],
      'CONFIRMATION_REQUIRED'
    );
    await success(attendee.rawKey, ['events', 'leave', event.eventId, '--yes']);
    const members = await success(organizer.rawKey, [
      'events',
      'members',
      event.eventId,
      '--all',
    ]);
    expect(members.items).toHaveLength(1);
    const notices = await organizer.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(notices.notifications.map(n => n.type)).toEqual(
      expect.arrayContaining(['USER_JOINED', 'USER_LEFT'])
    );
  }, 30_000);

  it('reads logistics without membership and changes admission independently before joining', async () => {
    const organizer = await bridge.actor('admission-organizer');
    const viewer = await bridge.actor('admission-viewer');
    const event = await success(organizer.rawKey, [
      'events',
      'create',
      '--title',
      'Public picnic',
    ]);
    await success(organizer.rawKey, [
      'events',
      'settings',
      'set',
      event.eventId,
      '--visibility',
      'PUBLIC',
    ]);
    const preview = await success(viewer.rawKey, [
      'events',
      'preview',
      event.eventId,
    ]);
    expect(preview).toMatchObject({
      event: {
        title: 'Public picnic',
        visibility: 'PUBLIC',
        admissionPolicy: 'INVITATION_ONLY',
      },
      entryAction: 'INVITATION_ONLY',
    });
    expect(
      (await viewer.auth.query(api.events.queries.getUserEvents, {})).events
    ).toEqual([]);
    await denied(viewer.rawKey, ['events', 'join', event.eventId], 'FORBIDDEN');
    await success(organizer.rawKey, [
      'events',
      'settings',
      'set',
      event.eventId,
      '--admission-policy',
      'DIRECT',
    ]);
    expect(
      (await success(viewer.rawKey, ['events', 'preview', event.eventId]))
        .entryAction
    ).toBe('JOIN');
    expect(
      await success(viewer.rawKey, ['events', 'join', event.eventId])
    ).toMatchObject({ role: 'ATTENDEE', rsvpStatus: 'PENDING' });
    expect(
      (await success(viewer.rawKey, ['events', 'preview', event.eventId]))
        .entryAction
    ).toBe('MEMBER');
  });

  it('enforces event settings, role and deletion authority and removes public event resources', async () => {
    const { organizer, attendee, eventId, membershipId } = await joinedEvent();
    await denied(
      attendee.rawKey,
      ['events', 'settings', 'set', eventId, '--visibility', 'FRIENDS'],
      'FORBIDDEN'
    );
    await success(organizer.rawKey, [
      'events',
      'membership',
      'role',
      eventId,
      membershipId,
      '--role',
      'MODERATOR',
      '--yes',
    ]);
    expect(
      (
        await attendee.auth.query(api.events.queries.getEventHeader, {
          eventId: bridge.id<'events'>(eventId),
        })
      ).userMembership.role
    ).toBe('MODERATOR');
    expect(
      (
        await attendee.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.some(n => n.type === 'USER_PROMOTED')
    ).toBe(true);
    await denied(
      attendee.rawKey,
      ['events', 'delete', eventId, '--yes'],
      'FORBIDDEN'
    );
    await denied(
      organizer.rawKey,
      ['events', 'delete', eventId],
      'CONFIRMATION_REQUIRED'
    );
    await success(organizer.rawKey, ['events', 'delete', eventId, '--yes']);
    const list = await success(organizer.rawKey, ['events', 'list', '--all']);
    expect(list.items).toEqual([]);
    expect(
      (await organizer.request(`/events/${bridge.id<'events'>(eventId)}`))
        .status
    ).toBe(403);
    await expect(
      organizer.auth.query(api.events.queries.getEventHeader, {
        eventId: bridge.id<'events'>(eventId),
      })
    ).rejects.toThrow('Event not found');
    expect(
      (
        await attendee.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toEqual([]);
  }, 30_000);

  it('persists ordinary profile, privacy and theme preferences only for the selected identity', async () => {
    const owner = await bridge.actor('preferences-owner');
    const other = await bridge.actor('preferences-other');
    await success(owner.rawKey, [
      'account',
      'edit',
      '--name',
      'Picnic planner',
      '--bio',
      'Bring snacks',
    ]);
    await success(owner.rawKey, [
      'settings',
      'privacy',
      'set',
      '--friend-requests',
      'NO_ONE',
    ]);
    const theme = {
      selectedThemeType: 'base',
      selectedThemeId: 'groupi-dark',
      useSystemPreference: false,
      systemLightThemeId: 'groupi-light',
      systemDarkThemeId: 'groupi-dark',
    };
    await success(owner.rawKey, [
      'settings',
      'theme',
      'set',
      '--data',
      JSON.stringify(theme),
    ]);
    expect(await success(owner.rawKey, ['account', 'get'])).toMatchObject({
      name: 'Picnic planner',
      bio: 'Bring snacks',
    });
    expect(
      await success(owner.rawKey, ['settings', 'privacy', 'get'])
    ).toMatchObject({
      allowFriendRequestsFrom: 'NO_ONE',
      allowEventInvitesFrom: 'EVERYONE',
    });
    expect(
      await success(owner.rawKey, ['settings', 'theme', 'get'])
    ).toMatchObject(theme);
    expect(await success(other.rawKey, ['account', 'get'])).not.toMatchObject({
      bio: 'Bring snacks',
    });
    expect(
      await success(other.rawKey, ['settings', 'privacy', 'get'])
    ).toMatchObject({ allowFriendRequestsFrom: 'EVERYONE' });
    expect(
      await success(other.rawKey, ['settings', 'theme', 'get'])
    ).toBeNull();
    const injection = await other.request('/profile', 'PUT', {
      personId: owner.personId,
      bio: 'Forged',
    });
    expect(injection.status).toBe(400);
    expect(await success(owner.rawKey, ['account', 'get'])).toMatchObject({
      bio: 'Bring snacks',
    });
    const human = await bridge.cli(owner.rawKey, ['account', 'get'], 'human');
    expect(human.code, human.stderr).toBe(0);
    expect(human.stdout).toContain('Picnic planner');
    expect(human.stderr).toBe('');
  }, 30_000);

  it('round-trips questionnaire configuration and uses lifecycle resets and disable cleanup', async () => {
    const { organizer, attendee, eventId, membershipId } = await joinedEvent();
    const questions = [
      { id: 'meal', label: 'Meal?', type: 'SHORT_ANSWER', required: true },
    ];
    await denied(
      attendee.rawKey,
      [
        'addons',
        'enable',
        eventId,
        'questionnaire',
        '--questions',
        JSON.stringify(questions),
        '--yes',
      ],
      'FORBIDDEN'
    );
    await success(organizer.rawKey, [
      'addons',
      'enable',
      eventId,
      'questionnaire',
      '--questions',
      JSON.stringify(questions),
      '--yes',
    ]);
    const args = {
      eventId: bridge.id<'events'>(eventId),
      addonType: 'questionnaire',
    };
    const entry = {
      ...args,
      key: `response:${attendee.personId}`,
      data: { meal: 'Pasta' },
    };
    await attendee.auth.mutation(api.addons.mutations.setAddonData, entry);
    expect(
      await attendee.auth.query(api.addons.queries.getAddonDataByKey, {
        ...args,
        key: entry.key,
      })
    ).toMatchObject({ data: { meal: 'Pasta' } });
    await success(organizer.rawKey, [
      'events',
      'membership',
      'role',
      eventId,
      membershipId,
      '--role',
      'MODERATOR',
      '--yes',
    ]);
    const changed = [{ ...questions[0], label: 'Drink?' }];
    await success(attendee.rawKey, [
      'addons',
      'configure',
      eventId,
      'questionnaire',
      '--questions',
      JSON.stringify(changed),
      '--yes',
    ]);
    expect(
      await success(organizer.rawKey, [
        'addons',
        'get',
        eventId,
        'questionnaire',
      ])
    ).toMatchObject({ enabled: true, config: { questions: changed } });
    expect(
      await organizer.auth.query(api.addons.queries.getAddonData, args)
    ).toEqual([]);
    expect(
      (
        await organizer.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.some(n => n.type === 'ADDON_CONFIG_RESET')
    ).toBe(true);
    await attendee.auth.mutation(api.addons.mutations.setAddonData, entry);
    await success(attendee.rawKey, [
      'addons',
      'disable',
      eventId,
      'questionnaire',
      '--yes',
    ]);
    expect(
      await success(organizer.rawKey, [
        'addons',
        'get',
        eventId,
        'questionnaire',
      ])
    ).toMatchObject({ enabled: false });
    expect(
      await organizer.auth.query(api.addons.queries.getAddonData, args)
    ).toEqual([]);
  }, 30_000);
});
