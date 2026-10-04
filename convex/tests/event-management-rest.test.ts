import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  return actor(t, 'event-organizer');
}
async function actor(t: ReturnType<typeof createTestInstance>, name: string) {
  const account = await createAuthAccount(t, name);
  const rawKey = `grp_event_writes_test_key_${name}`;
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawKey)
  );
  const key = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: account.user._id,
        key: btoa(String.fromCharCode(...new Uint8Array(hash)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enabled: true,
      },
    },
  });
  const request = (
    path: string,
    method: string,
    body?: unknown,
    requestId?: string
  ) =>
    t.fetch(`/api/v2${path}`, {
      method,
      headers: {
        'x-api-key': rawKey,
        'content-type': 'application/json',
        ...(requestId ? { 'Idempotency-Key': requestId } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  return { t, ...account, request, rawKey, keyId: key._id };
}

async function fixture() {
  const organizer = await setup();
  const attendee = await actor(organizer.t, 'attendance-user');
  const moderator = await actor(organizer.t, 'attendance-moderator');
  const outsider = await actor(organizer.t, 'attendance-outsider');
  const start = Date.now() + 7 * 86400000;
  const created = await (
    await organizer.request('/events', 'POST', {
      title: 'Attendance',
      potentialDateTimeOptions: [
        {
          start: new Date(start).toISOString(),
          end: new Date(start + 3600000).toISOString(),
          note: 'Morning',
        },
        { start: new Date(start + 86400000).toISOString() },
      ],
    })
  ).json();
  const link = await (
    await organizer.request(`/events/${created.eventId}/invites`, 'POST', {})
  ).json();
  for (const person of [attendee, moderator]) {
    const joined = await (
      await person.request(`/invites/${link.token}/accept`, 'POST')
    ).json();
    if (person === moderator)
      await organizer.t.run(ctx =>
        ctx.db.patch(joined.membershipId, { role: 'MODERATOR' })
      );
  }
  const event = await (
    await organizer.request(`/events/${created.eventId}`, 'GET')
  ).json();
  return {
    organizer,
    attendee,
    moderator,
    outsider,
    eventId: created.eventId,
    event,
    start,
  };
}
async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return response.json();
}
describe('Event membership management authorization', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('rejects role and removal requests for a membership from another event', async () => {
    const { organizer, attendee, eventId } = await fixture();
    const other = await body(
      await attendee.request('/events', 'POST', { title: 'Other event' }),
      201
    );
    await body(
      await organizer.request(
        `/events/${eventId}/members/${other.membershipId}`,
        'PATCH',
        { role: 'ATTENDEE' }
      ),
      404
    );
    expect(
      (
        await attendee.auth.query(api.events.queries.getEventHeader, {
          eventId: other.eventId,
        })
      ).userMembership.role
    ).toBe('ORGANIZER');
    expect(
      (
        await organizer.request(
          `/events/${eventId}/members/${other.membershipId}`,
          'DELETE'
        )
      ).status
    ).toBe(404);
  });
});

describe('Event management side effects and safeguards', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('matches app organizer authority and delivers role/removal notifications', async () => {
    const { organizer, attendee, moderator, outsider, eventId } =
      await fixture();
    const members = await body(
      await organizer.request(`/events/${eventId}/members`, 'GET')
    );
    const target = members.find(
      (m: { personId: string }) => m.personId === attendee.personId
    );
    await body(
      await moderator.request(
        `/events/${eventId}/members/${target.id}`,
        'PATCH',
        { role: 'ORGANIZER' }
      ),
      403
    );
    await body(
      await outsider.request(
        `/events/${eventId}/members/${target.id}`,
        'PATCH',
        { role: 'MODERATOR' }
      ),
      403
    );
    await body(
      await organizer.request(
        `/events/${eventId}/members/${target.id}`,
        'PATCH',
        { role: 'MODERATOR' }
      )
    );
    const notifications = await attendee.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notifications.notifications.some(n => n.type === 'USER_PROMOTED')
    ).toBe(true);
    expect(
      (
        await organizer.request(
          `/events/${eventId}/members/${target.id}`,
          'DELETE'
        )
      ).status
    ).toBe(204);
    const removed = await attendee.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(removed.notifications.some(n => n.type === 'USER_LEFT')).toBe(true);
    expect((await attendee.request(`/events/${eventId}`, 'GET')).status).toBe(
      403
    );
  });
});

describe('Discovery, settings, leave and event deletion parity', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('allows only organizers to change visibility and permissions and notifies members about visibility', async () => {
    const { organizer, attendee, moderator, outsider, eventId } =
      await fixture();
    const path = `/events/${eventId}/settings`;
    const initial = await body(await attendee.request(path, 'GET'));
    expect(initial.visibility).toBe('PRIVATE');
    for (const actor of [attendee, moderator, outsider])
      await body(
        await actor.request(path, 'PATCH', { visibility: 'FRIENDS' }),
        403
      );
    const changed = await body(
      await organizer.request(path, 'PATCH', {
        visibility: 'FRIENDS',
        permissions: {
          inviteMembers: 'ORGANIZER',
          viewAttendeeList: 'ORGANIZER',
        },
      })
    );
    expect(changed).toMatchObject({
      visibility: 'FRIENDS',
      permissions: {
        inviteMembers: 'ORGANIZER',
        viewAttendeeList: 'ORGANIZER',
      },
    });
    expect(
      (await attendee.request(`/events/${eventId}/members`, 'GET')).status
    ).toBe(403);
    expect(
      (
        await attendee.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.some(n => n.type === 'EVENT_EDITED')
    ).toBe(true);
    await body(
      await organizer.request(path, 'PATCH', {
        permissions: { createPosts: 'ORGANIZER' },
      })
    );
    expect(
      (await body(await organizer.request(path, 'GET'))).permissions
    ).toEqual({
      createPosts: 'ORGANIZER',
      inviteMembers: 'ORGANIZER',
      viewAttendeeList: 'ORGANIZER',
    });
    await body(await organizer.request(path, 'PATCH', {}), 400);
    await body(
      await organizer.request(path, 'PATCH', {
        visibility: 'FRIENDS',
        unexpected: true,
      }),
      400
    );
  });
  it('pages eligible friends events and joining emits app notifications and hides the joined event', async () => {
    const { organizer, outsider, eventId, event } = await fixture();
    await body(
      await organizer.request(`/events/${eventId}/settings`, 'PATCH', {
        visibility: 'FRIENDS',
      })
    );
    await organizer.t.run(ctx =>
      ctx.db.insert('friendships', {
        requesterId: organizer.personId,
        addresseeId: outsider.personId,
        status: 'ACCEPTED',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    const page = await body(
      await outsider.request(
        '/events/discover?pagination=cursor&limit=1',
        'GET'
      )
    );
    expect(page.items).toMatchObject([{ id: eventId, title: 'Attendance' }]);
    if (page.nextCursor) {
      const final = await body(
        await outsider.request(
          `/events/discover?pagination=cursor&limit=1&cursor=${encodeURIComponent(page.nextCursor)}`,
          'GET'
        )
      );
      expect(final).toEqual({ items: [], nextCursor: null });
    }
    const definition = await body(
      await organizer.request('/addon-template-definitions', 'POST', {
        schemaVersion: 1,
        name: 'Welcome',
        description: 'Welcome new members',
        iconName: 'listChecks',
        template: {
          name: 'Welcome',
          description: 'Welcome new members',
          iconName: 'listChecks',
          sections: [
            {
              id: 's',
              title: 'Welcome',
              fields: [
                { id: 'note', type: 'text', label: 'Note', required: false },
              ],
            },
          ],
          automations: [
            {
              id: 'welcome',
              name: 'Welcome member',
              enabled: true,
              trigger: { type: 'member_joined' },
              conditions: [],
              actions: [
                {
                  type: 'create_post',
                  title: 'Welcome member',
                  message: 'Welcome to the event',
                },
              ],
            },
          ],
        },
      }),
      201
    );
    await body(
      await organizer.request(
        `/addon-template-definitions/${definition.id}/publish`,
        'POST',
        { expectedVersion: 1 }
      )
    );
    await body(
      await organizer.request(
        `/events/${eventId}/addons/custom:${definition.id}/enable`,
        'POST',
        { config: { templateId: definition.id } }
      )
    );
    const joined = await body(
      await outsider.request(`/events/${eventId}/join`, 'POST')
    );
    expect(joined.success).toBe(true);
    expect(
      (
        await outsider.auth.query(api.events.queries.getEventHeader, {
          eventId,
        })
      ).event.memberCount
    ).toBe(4);
    expect(
      (
        await outsider.auth.query(api.events.queries.getEventHeader, {
          eventId,
        })
      ).userMembership
    ).toMatchObject({ role: 'ATTENDEE', rsvpStatus: 'PENDING' });
    expect(
      (
        await organizer.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.some(n => n.type === 'USER_JOINED')
    ).toBe(true);
    expect(
      (await body(await outsider.request('/events/discover', 'GET'))).items
    ).toEqual([]);
    await body(await outsider.request(`/events/${eventId}/join`, 'POST'), 403);
    const notices = await organizer.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notices.notifications.filter(
        n => n.type === 'USER_JOINED' && n.author?.id === outsider.personId
      )
    ).toHaveLength(1);
    expect(
      notices.notifications.filter(n => n.type === 'USER_RSVP')
    ).toHaveLength(0);
    const members = await body(
      await organizer.request(`/events/${eventId}/members`, 'GET')
    );
    expect(
      members.filter(
        (m: { personId: string }) => m.personId === outsider.personId
      )
    ).toHaveLength(1);
    const posts = await outsider.auth.query(
      api.posts.queries.getEventPostFeed,
      { eventId }
    );
    expect(
      posts.event.posts.filter(post => post.title === 'Welcome member')
    ).toHaveLength(1);
    // Undated participants vote availability; selecting a poll date derives RSVP.
    const option = event.potentialDateTimeOptions[0];
    await body(
      await outsider.request(`/events/${eventId}/availability`, 'POST', {
        responses: [{ potentialDateTimeId: option.id, status: 'MAYBE' }],
      })
    );
    await body(
      await organizer.request(`/events/${eventId}/date`, 'POST', {
        selectionSource: 'POLL',
        potentialDateTimeId: option.id,
      })
    );
    expect(
      await body(await outsider.request(`/events/${eventId}/rsvp`, 'GET'))
    ).toMatchObject({ rsvpStatus: 'MAYBE' });
    await body(
      await outsider.request(`/events/${eventId}/rsvp`, 'PATCH', {
        rsvpStatus: 'YES',
      })
    );
    await body(
      await organizer.request(`/events/${eventId}/date`, 'POST', {
        selectionSource: 'MANUAL',
        chosenDateTime: new Date(Date.now() + 14 * 86400000).toISOString(),
      })
    );
    expect(
      await body(await outsider.request(`/events/${eventId}/rsvp`, 'GET'))
    ).toMatchObject({ rsvpStatus: 'YES' });
  });
  it('filters blocks, bans, private/public events, existing memberships and past friends events', async () => {
    const { organizer, attendee, outsider, eventId } = await fixture();
    expect(
      (await body(await outsider.request('/events/discover', 'GET'))).items
    ).toEqual([]);
    await body(await outsider.request(`/events/${eventId}/join`, 'POST'), 403);
    await body(
      await organizer.request(`/events/${eventId}/settings`, 'PATCH', {
        visibility: 'FRIENDS',
      })
    );
    await body(await outsider.request(`/events/${eventId}/join`, 'POST'), 403);
    await organizer.t.run(ctx =>
      ctx.db.insert('friendships', {
        requesterId: organizer.personId,
        addresseeId: outsider.personId,
        status: 'ACCEPTED',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    const banId = await organizer.t.run(ctx =>
      ctx.db.insert('eventBans', {
        eventId,
        personId: outsider.personId,
        bannedById: organizer.personId,
        bannedAt: Date.now(),
      })
    );
    expect(
      (await body(await outsider.request('/events/discover', 'GET'))).items
    ).toEqual([]);
    await body(await outsider.request(`/events/${eventId}/join`, 'POST'), 403);
    expect(
      await outsider.auth.query(api.events.queries.getDiscoverableEvents, {})
    ).toEqual([]);
    await organizer.t.run(ctx => ctx.db.delete(banId));
    const blockId = await organizer.t.run(ctx =>
      ctx.db.insert('userBlocks', {
        blockerId: outsider.personId,
        blockedId: organizer.personId,
        createdAt: Date.now(),
      })
    );
    expect(
      (await body(await outsider.request('/events/discover', 'GET'))).items
    ).toEqual([]);
    await body(await outsider.request(`/events/${eventId}/join`, 'POST'), 403);
    expect(
      await outsider.auth.query(api.events.queries.getDiscoverableEvents, {})
    ).toEqual([]);
    await organizer.t.run(ctx => ctx.db.delete(blockId));
    await organizer.t.run(ctx =>
      ctx.db.patch(eventId, { chosenDateTime: Date.now() - 1 })
    );
    expect(
      (await body(await outsider.request('/events/discover', 'GET'))).items
    ).toEqual([]);
    expect(
      (await body(await attendee.request('/events/discover', 'GET'))).items
    ).toEqual([]);
    await body(
      await outsider.request(
        '/events/discover?pagination=cursor&limit=101',
        'GET'
      ),
      400
    );
    await body(
      await outsider.request('/events/discover?cursor=invalid', 'GET'),
      400
    );
  });
  it('allows empty bounded discovery pages with continuation until an eligible event', async () => {
    const { organizer, outsider, eventId } = await fixture();
    await body(
      await organizer.request(`/events/${eventId}/settings`, 'PATCH', {
        visibility: 'FRIENDS',
      })
    );
    await organizer.t.run(ctx =>
      ctx.db.insert('friendships', {
        requesterId: organizer.personId,
        addresseeId: outsider.personId,
        status: 'ACCEPTED',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    await body(
      await organizer.request('/events', 'POST', { title: 'Private newest' }),
      201
    );
    const first = await body(
      await outsider.request(
        '/events/discover?pagination=cursor&limit=1',
        'GET'
      )
    );
    expect(first.items).toEqual([]);
    expect(first.nextCursor).toEqual(expect.any(String));
    const next = await body(
      await outsider.request(
        `/events/discover?pagination=cursor&limit=1&cursor=${encodeURIComponent(first.nextCursor)}`,
        'GET'
      )
    );
    expect(next.items.map((item: { id: string }) => item.id)).toEqual([
      eventId,
    ]);
    if (next.nextCursor) {
      const final = await body(
        await outsider.request(
          `/events/discover?pagination=cursor&limit=1&cursor=${encodeURIComponent(next.nextCursor)}`,
          'GET'
        )
      );
      expect(final).toEqual({ items: [], nextCursor: null });
    }
  });
  it('preserves last-organizer safeguards, removes availability on leave and notifies organizers', async () => {
    const { organizer, attendee, eventId, event } = await fixture();
    await body(
      await organizer.request(`/events/${eventId}/leave`, 'POST'),
      403
    );
    const members = await body(
      await organizer.request(`/events/${eventId}/members`, 'GET')
    );
    const own = members.find(
      (member: { personId: string }) => member.personId === organizer.personId
    );
    await body(
      await organizer.request(`/events/${eventId}/members/${own.id}`, 'PATCH', {
        role: 'ATTENDEE',
      }),
      403
    );
    expect(
      (
        await organizer.request(
          `/events/${eventId}/members/${own.id}`,
          'DELETE'
        )
      ).status
    ).toBe(403);
    await body(
      await attendee.request(`/events/${eventId}/availability`, 'POST', {
        responses: [
          {
            potentialDateTimeId: event.potentialDateTimeOptions[0].id,
            status: 'YES',
          },
        ],
      })
    );
    await body(await attendee.request(`/events/${eventId}/leave`, 'POST'));
    const rows = await organizer.t.run(async ctx => ({
      members: await ctx.db.query('memberships').collect(),
      availability: await ctx.db.query('availabilities').collect(),
      event: await ctx.db.get(eventId),
    }));
    expect(
      rows.members.filter(
        member =>
          member.personId === attendee.personId && member.eventId === eventId
      )
    ).toHaveLength(0);
    const attendeeId = members.find(
      (member: { personId: string }) => member.personId === attendee.personId
    ).id;
    expect(
      rows.availability.filter(row => row.membershipId === attendeeId)
    ).toHaveLength(0);
    expect(rows.event?.memberCount).toBe(2);
    expect(
      (
        await organizer.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.some(n => n.type === 'USER_LEFT')
    ).toBe(true);
  });
  it('restricts deletion to organizers and cascades event data, including invites, dates, addons and notifications', async () => {
    const { organizer, attendee, moderator, outsider, eventId, event } =
      await fixture();
    for (const actor of [attendee, moderator, outsider])
      expect((await actor.request(`/events/${eventId}`, 'DELETE')).status).toBe(
        403
      );
    await body(
      await attendee.request(`/events/${eventId}/availability`, 'POST', {
        responses: [
          {
            potentialDateTimeId: event.potentialDateTimeOptions[0].id,
            status: 'YES',
          },
        ],
      })
    );
    expect(
      (await organizer.request(`/events/${eventId}`, 'DELETE')).status
    ).toBe(204);
    const remaining = await organizer.t.run(async ctx => ({
      event: await ctx.db.get(eventId),
      memberships: await ctx.db.query('memberships').collect(),
      dates: await ctx.db.query('potentialDateTimes').collect(),
      availability: await ctx.db.query('availabilities').collect(),
      invites: await ctx.db.query('invites').collect(),
      notifications: await ctx.db.query('notifications').collect(),
      addons: await ctx.db.query('eventAddonConfigs').collect(),
    }));
    expect(remaining.event).toBeNull();
    for (const rows of [
      remaining.memberships,
      remaining.dates,
      remaining.availability,
      remaining.invites,
      remaining.notifications,
      remaining.addons,
    ])
      expect(rows).toHaveLength(0);
  });
});

describe('Organizer transfer and moderator safeguards', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('allows organizer transfer but prevents moderator edits/removal of organizers', async () => {
    const { organizer, attendee, moderator, eventId } = await fixture();
    const members = await body(
      await organizer.request(`/events/${eventId}/members`, 'GET')
    );
    const own = members.find(
      (member: { personId: string }) => member.personId === organizer.personId
    );
    const target = members.find(
      (member: { personId: string }) => member.personId === attendee.personId
    );
    await body(
      await organizer.request(
        `/events/${eventId}/members/${target.id}`,
        'PATCH',
        { role: 'ORGANIZER' }
      )
    );
    await body(
      await moderator.request(
        `/events/${eventId}/members/${target.id}`,
        'PATCH',
        { role: 'ATTENDEE' }
      ),
      403
    );
    expect(
      (
        await moderator.request(
          `/events/${eventId}/members/${target.id}`,
          'DELETE'
        )
      ).status
    ).toBe(403);
    await body(
      await organizer.request(`/events/${eventId}/members/${own.id}`, 'PATCH', {
        role: 'ATTENDEE',
      })
    );
    await body(await organizer.request(`/events/${eventId}/leave`, 'POST'));
    expect(
      (
        await attendee.auth.query(api.events.queries.getEventHeader, {
          eventId,
        })
      ).userMembership.role
    ).toBe('ORGANIZER');
  });
});
