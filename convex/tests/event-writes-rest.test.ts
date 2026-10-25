import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GDL_CONFORMANCE_FIXTURES } from '../../packages/shared/src/gdl/fixtures';
import { api, components, internal } from '../_generated/api';
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
  await t.mutation(components.betterAuth.adapter.create, {
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
    requestId?: string,
    version: 'v1' | 'v2' = 'v2'
  ) =>
    t.fetch(`/api/${version}${path}`, {
      method,
      headers: {
        'x-api-key': rawKey,
        'content-type': 'application/json',
        ...(requestId ? { 'Idempotency-Key': requestId } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  return { t, ...account, request, rawKey };
}
function newRequestId() {
  return `${Date.now()}.${crypto.randomUUID()}`;
}
function dateAfter(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

describe('Authenticated event write parity and replay', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('replays creation without duplicating its event, membership, options or organizer votes', async () => {
    const { auth, request } = await setup();
    const requestId = newRequestId();
    const body = {
      title: ' Replayed event ',
      potentialDateTimeOptions: [{ start: dateAfter(2), end: dateAfter(3) }],
    };
    const first = await request('/events', 'POST', body, requestId);
    expect(first.status).toBe(201);
    const created = await first.json();
    const replay = await request('/events', 'POST', body, requestId);
    expect(replay.status).toBe(201);
    expect(await replay.json()).toEqual(created);
    expect(await (await request('/events', 'GET')).json()).toHaveLength(1);
    const header = await auth.query(api.events.queries.getEventHeader, {
      eventId: created.eventId,
    });
    expect(header.event.title).toBe('Replayed event');
    expect(header.event.memberCount).toBe(1);
    expect(header.userMembership._id).toBe(created.membershipId);
    expect(header.userMembership.role).toBe('ORGANIZER');
    expect(header.userMembership.rsvpStatus).toBe('YES');
    const availability = await auth.query(
      api.availability.queries.getEventAvailabilityData,
      { eventId: created.eventId }
    );
    expect(availability.potentialDateTimes).toHaveLength(1);
    expect(availability.potentialDateTimes[0].availabilities).toHaveLength(1);
    expect(availability.potentialDateTimes[0].availabilities[0].status).toBe(
      'YES'
    );
  });
  it('binds request identifiers to identity and original payload, ignoring object key order', async () => {
    const first = await setup();
    const second = await actor(first.t, 'second-organizer');
    const id = newRequestId();
    const created = await (
      await first.request(
        '/events',
        'POST',
        { title: 'First', location: 'Here' },
        id
      )
    ).json();
    expect(
      await (
        await first.request(
          '/events',
          'POST',
          { location: 'Here', title: 'First' },
          id
        )
      ).json()
    ).toEqual(created);
    const conflict = await first.request(
      '/events',
      'POST',
      { title: 'Different' },
      id
    );
    expect(conflict.status).toBe(409);
    expect((await conflict.json()).error.code).toBe('IDEMPOTENCY_CONFLICT');
    const other = await second.request(
      '/events',
      'POST',
      { title: 'Different' },
      id
    );
    expect(other.status).toBe(201);
    expect((await other.json()).eventId).not.toBe(created.eventId);
    expect(await (await first.request('/events', 'GET')).json()).toHaveLength(
      1
    );
  });

  it('rejects expired keys after scheduled retention cleanup instead of creating duplicates', async () => {
    vi.useFakeTimers();
    const { t, request } = await setup();
    const id = newRequestId();
    const body = { title: 'Only once' };
    expect((await request('/events', 'POST', body, id)).status).toBe(201);
    await t.finishAllScheduledFunctions(vi.runAllTimersAsync);
    const replay = await request('/events', 'POST', body, id);
    expect(replay.status).toBe(409);
    expect((await replay.json()).error.code).toBe('IDEMPOTENCY_EXPIRED');
    expect(await (await request('/events', 'GET')).json()).toHaveLength(1);
  });

  it('replays relative GDL from its original payload without reparsing dates', async () => {
    vi.setSystemTime(new Date('2035-02-19T12:00:00Z'));
    const { request } = await setup();
    const id = newRequestId();
    const body = {
      title: 'Relative',
      gdl: '[Tu,Th]@18-20',
      timezone: 'America/New_York',
    };
    const first = await request('/events', 'POST', body, id);
    expect(first.status).toBe(201);
    const ids = await first.json();
    vi.setSystemTime(Date.now() + 3600000);
    expect(await (await request('/events', 'POST', body, id)).json()).toEqual(
      ids
    );
    const changedZone = await request(
      '/events',
      'POST',
      { ...body, timezone: 'UTC' },
      id
    );
    expect(changedZone.status).toBe(409);
    expect((await changedZone.json()).error.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  describe.each(['v1', 'v2'] as const)('%s shared GDL adapter', version => {
    it.each(GDL_CONFORMANCE_FIXTURES)('matches $name', async fixture => {
      vi.setSystemTime(new Date(fixture.referenceDate));
      const { request, t } = await setup();
      const response = await request(
        '/events',
        'POST',
        {
          title: fixture.name,
          gdl: fixture.input,
          timezone: fixture.timeZone,
        },
        undefined,
        version
      );
      // GDL may resolve today before the reference instant; event creation
      // correctly retains its stricter future-only domain validation.
      if (
        fixture.expected.some(
          option =>
            new Date(option.start).getTime() <
            new Date(fixture.referenceDate).getTime()
        )
      ) {
        expect(response.status).toBe(400);
        expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
        return;
      }
      expect(response.status).toBe(201);
      const payload = await response.json();
      const eventId = version === 'v1' ? payload.data.eventId : payload.eventId;
      const options = await t.run(ctx =>
        ctx.db
          .query('potentialDateTimes')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect()
      );
      expect(
        options.map(option => ({
          start: new Date(option.dateTime).toISOString(),
          ...(option.endDateTime === undefined
            ? {}
            : { end: new Date(option.endDateTime).toISOString() }),
        }))
      ).toEqual(
        fixture.expected.map(({ start, end }) => ({
          start,
          ...(end ? { end } : {}),
        }))
      );
    });

    it('rejects a weekday used as a range step without creating an event', async () => {
      const { request, t } = await setup();
      const response = await request(
        '/events',
        'POST',
        { title: 'Invalid range step', gdl: '(1,2,Mo)@18' },
        undefined,
        version
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: {
          code: version === 'v1' ? 'GDL_PARSE_ERROR' : 'VALIDATION_ERROR',
          message: expect.stringMatching(/step/i),
        },
      });
      expect(await t.run(ctx => ctx.db.query('events').collect())).toEqual([]);
    });

    it('keeps legacy requests in UTC and reports invalid zones and DST occurrences', async () => {
      vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));
      const { request, t } = await setup();
      const response = await request(
        '/events',
        'POST',
        { title: 'Legacy', gdl: 'Fr@18' },
        undefined,
        version
      );
      expect(response.status).toBe(201);
      const payload = await response.json();
      const eventId = version === 'v1' ? payload.data.eventId : payload.eventId;
      const options = await t.run(ctx =>
        ctx.db
          .query('potentialDateTimes')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect()
      );
      expect(new Date(options[0].dateTime).toISOString()).toBe(
        '2026-03-06T18:00:00.000Z'
      );
      for (const body of [
        { gdl: 'Fr@18', timezone: 'Invalid/Zone' },
        { gdl: '03/08@2:30', timezone: 'America/New_York' },
        { gdl: '11/01@1:30', timezone: 'America/New_York' },
      ]) {
        const failed = await request(
          '/events',
          'POST',
          { title: 'Invalid', ...body },
          undefined,
          version
        );
        expect(failed.status).toBe(400);
        const failure = await failed.json();
        expect(failure.error.code).toBe(
          version === 'v1' ? 'GDL_PARSE_ERROR' : 'VALIDATION_ERROR'
        );
        expect(failure.error.message).toMatch(
          /timezone|time zone|nonexistent|ambiguous/i
        );
      }
    });
  });

  it.each([
    { chosenDateTime: '2035-02-30T18:00:00Z' },
    { chosenDateTime: '2035-02-20T18:00:00' },
    { chosenDateTime: 'invalid' },
    { chosenEndDateTime: '2035-02-20T18:00:00Z' },
    {
      chosenDateTime: '2035-02-20T18:00:00Z',
      chosenEndDateTime: '2035-02-20T17:00:00Z',
    },
    { chosenDateTime: '1970-01-01T00:00:00Z' },
    {
      potentialDateTimeOptions: [
        { start: '2035-02-20T18:00:00Z', end: '2035-02-20T17:00:00Z' },
      ],
    },
  ])(
    'rejects invalid schedules through both REST and app mutation: %j',
    async fields => {
      const { auth, request } = await setup();
      const body = { title: 'Invalid', ...fields };
      expect(
        (await request('/events', 'POST', body, newRequestId())).status
      ).toBe(400);
      await expect(
        auth.mutation(api.events.mutations.createEvent, body)
      ).rejects.toThrow();
      expect(await (await request('/events', 'GET')).json()).toHaveLength(0);
    }
  );

  it('stores explicit-offset instants identically through REST and app reads', async () => {
    const { auth, request } = await setup();
    const response = await request(
      '/events',
      'POST',
      {
        title: 'Offset',
        chosenDateTime: '2035-02-20T18:00:00-05:00',
        chosenEndDateTime: '2035-02-20T19:00:00-05:00',
      },
      newRequestId()
    );
    expect(response.status).toBe(201);
    const { eventId } = await response.json();
    const rest = await (await request(`/events/${eventId}`, 'GET')).json();
    const app = await auth.query(api.events.queries.getEventHeader, {
      eventId,
    });
    expect(rest.chosenDateTime).toBe(Date.parse('2035-02-20T23:00:00Z'));
    expect(rest.chosenDateTime).toBe(app.event.chosenDateTime);
    expect(rest.timezone).toBe('UTC');
  });

  it('applies basic edits with member notifications and checks each target role transactionally', async () => {
    const owner = await setup();
    const attendee = await actor(owner.t, 'attendee');
    const moderator = await actor(owner.t, 'moderator');
    const outsider = await actor(owner.t, 'outsider');
    const { eventId } = await (
      await owner.request(
        '/events',
        'POST',
        { title: 'Before' },
        newRequestId()
      )
    ).json();
    await owner.t.run(async ctx => {
      for (const entry of [
        { actor: attendee, role: 'ATTENDEE' as const },
        { actor: moderator, role: 'MODERATOR' as const },
      ])
        await ctx.db.insert('memberships', {
          eventId,
          personId: entry.actor.personId,
          role: entry.role,
          rsvpStatus: 'YES',
        });
    });
    for (const actor of [attendee, outsider])
      expect(
        (
          await actor.request(`/events/${eventId}`, 'PATCH', {
            title: 'Denied',
          })
        ).status
      ).toBe(403);
    const edited = await moderator.request(`/events/${eventId}`, 'PATCH', {
      title: ' After ',
      description: ' Details ',
      location: ' Place ',
    });
    expect(edited.status).toBe(200);
    const app = await owner.auth.query(api.events.queries.getEventHeader, {
      eventId,
    });
    expect(app.event).toMatchObject({
      title: 'After',
      description: 'Details',
      location: 'Place',
    });
    const notifications = await attendee.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notifications.notifications.filter(n => n.type === 'EVENT_EDITED')
    ).toHaveLength(1);
    const denied = await moderator.request(`/events/${eventId}`, 'PATCH', {
      title: 'Rolled back',
      potentialDateTimeOptions: [{ start: dateAfter(2) }],
    });
    expect(denied.status).toBe(403);
    expect(
      (await owner.auth.query(api.events.queries.getEventHeader, { eventId }))
        .event.title
    ).toBe('After');
    const other = await (
      await outsider.request(
        '/events',
        'POST',
        { title: 'Other' },
        newRequestId()
      )
    ).json();
    expect(
      (
        await owner.request(`/events/${other.eventId}`, 'PATCH', {
          title: 'Cross-event denied',
        })
      ).status
    ).toBe(403);
  });

  it('replaces poll options as organizer, resets votes, and exposes matching app/REST state', async () => {
    const owner = await setup();
    const attendee = await actor(owner.t, 'poll-attendee');
    const { eventId } = await (
      await owner.request(
        '/events',
        'POST',
        {
          title: 'Poll',
          potentialDateTimeOptions: [{ start: dateAfter(2), note: 'Original' }],
        },
        newRequestId()
      )
    ).json();
    await owner.t.run(ctx =>
      ctx.db.insert('memberships', {
        eventId,
        personId: attendee.personId,
        role: 'ATTENDEE',
        rsvpStatus: 'YES',
      })
    );
    const initial = await owner.auth.query(
      api.availability.queries.getEventAvailabilityData,
      { eventId }
    );
    const response = await owner.request(`/events/${eventId}`, 'PATCH', {
      potentialDateTimeOptions: [
        { start: dateAfter(4), end: dateAfter(5), note: 'Replacement' },
      ],
    });
    expect(response.status).toBe(200);
    const detail = await response.json();
    const app = await owner.auth.query(
      api.availability.queries.getEventAvailabilityData,
      { eventId }
    );
    expect(app.potentialDateTimes).toHaveLength(1);
    expect(app.potentialDateTimes[0]._id).not.toBe(
      initial.potentialDateTimes[0]._id
    );
    expect(app.potentialDateTimes[0].note).toBe('Replacement');
    expect(app.potentialDateTimes[0].availabilities).toHaveLength(1);
    expect(detail.potentialDateTimeOptions[0]).toMatchObject({
      id: app.potentialDateTimes[0]._id,
      start: app.potentialDateTimes[0].dateTime,
      note: 'Replacement',
    });
    expect(
      (await owner.auth.query(api.events.queries.getEventHeader, { eventId }))
        .event.potentialDateTimes
    ).toEqual([app.potentialDateTimes[0].dateTime]);
    const notifications = await attendee.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notifications.notifications.filter(n => n.type === 'DATE_CHANGED')
    ).toHaveLength(1);
  });

  it('rejects unsupported fields and never records failed creation as a replay', async () => {
    const { request } = await setup();
    const id = newRequestId();
    expect(
      (await request('/events', 'POST', { title: '   ' }, id)).status
    ).toBe(400);
    const created = await request('/events', 'POST', { title: 'Fixed' }, id);
    expect(created.status).toBe(201);
    const { eventId } = await created.json();
    for (const body of [
      { timezone: 'America/New_York' },
      { chosenDateTime: dateAfter(2) },
      { potentialDateTimeOptions: [{ start: dateAfter(2), unknown: true }] },
    ])
      expect((await request(`/events/${eventId}`, 'PATCH', body)).status).toBe(
        400
      );
    expect(
      (
        await request(
          '/events',
          'POST',
          { title: 'Unsupported', unknownField: 'UTC' },
          newRequestId()
        )
      ).status
    ).toBe(400);
  });

  it('creates the legacy reminder add-on once and keeps no-key requests compatible', async () => {
    const { auth, request } = await setup();
    const id = newRequestId();
    const body = {
      title: 'Reminder',
      chosenDateTime: dateAfter(3),
      reminderOffset: '1_DAY',
    };
    const created = await request('/events', 'POST', body, id);
    expect(created.status).toBe(201);
    const ids = await created.json();
    expect(await (await request('/events', 'POST', body, id)).json()).toEqual(
      ids
    );
    const addons = await auth.query(api.addons.queries.getEventAddons, {
      eventId: ids.eventId,
    });
    expect(addons).toHaveLength(1);
    expect(addons[0]).toMatchObject({
      addonType: 'reminders',
      enabled: true,
      config: { reminderOffset: '1_DAY' },
    });
    expect(
      (await request('/events', 'POST', { title: 'Legacy no-key' })).status
    ).toBe(201);
  });

  it.each([
    'invalid',
    `${Date.now() + 600000}.00000000-0000-4000-8000-000000000000`,
  ])('rejects malformed or future request key %s', async id => {
    const { request } = await setup();
    expect(
      (await request('/events', 'POST', { title: 'Invalid key' }, id)).status
    ).toBe(400);
    expect(await (await request('/events', 'GET')).json()).toHaveLength(0);
  });
  it('preserves legacy REST reminder updates through the actual add-on configuration and removal lifecycle', async () => {
    const { auth, request } = await setup();
    const { eventId } = await (
      await request(
        '/events',
        'POST',
        { title: 'Legacy reminder', chosenDateTime: dateAfter(5) },
        newRequestId()
      )
    ).json();
    for (const reminderOffset of ['1_DAY', '2_DAYS']) {
      const changed = await request(`/events/${eventId}`, 'PATCH', {
        reminderOffset,
      });
      expect(changed.status).toBe(200);
      expect((await changed.json()).reminderOffset).toBe(reminderOffset);
      const config = await auth.query(api.addons.queries.getAddonConfig, {
        eventId,
        addonType: 'reminders',
      });
      expect(config).toMatchObject({
        enabled: true,
        config: { reminderOffset },
      });
    }
    const disabled = await request(`/events/${eventId}`, 'PATCH', {
      reminderOffset: null,
    });
    expect(disabled.status).toBe(200);
    expect((await disabled.json()).reminderOffset).toBeNull();
    expect(
      await auth.query(api.addons.queries.getAddonConfig, {
        eventId,
        addonType: 'reminders',
      })
    ).toMatchObject({ enabled: false });
  });

  it('rejects proposed-date replacement on a confirmed event without changing its reminder or basic fields', async () => {
    const { auth, request } = await setup();
    const { eventId } = await (
      await request(
        '/events',
        'POST',
        {
          title: 'Confirmed',
          chosenDateTime: dateAfter(5),
          reminderOffset: '1_DAY',
        },
        newRequestId()
      )
    ).json();
    const before = await auth.query(api.addons.queries.getAddonConfig, {
      eventId,
      addonType: 'reminders',
    });
    const response = await request(`/events/${eventId}`, 'PATCH', {
      title: 'Should roll back',
      potentialDateTimeOptions: [{ start: dateAfter(6) }],
    });
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe('DATE_RESET_REQUIRED');
    const header = await auth.query(api.events.queries.getEventHeader, {
      eventId,
    });
    expect(header.event.title).toBe('Confirmed');
    expect(header.event.chosenDateTime).toBeDefined();
    expect(
      await auth.query(api.addons.queries.getAddonConfig, {
        eventId,
        addonType: 'reminders',
      })
    ).toEqual(before);
  });
  it.each([
    { title: '   ' },
    {
      title: 'Invalid dates',
      chosenDateTime: '2035-02-20T18:00:00Z',
      chosenEndDateTime: '2035-02-20T17:00:00Z',
    },
  ])(
    'preserves v1 validation envelope for shared creation failures: %j',
    async body => {
      const { t, rawKey } = await setup();
      const response = await t.fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
    }
  );

  it('applies v1 edits through domain notifications while preserving its response envelope', async () => {
    const owner = await setup();
    const attendee = await actor(owner.t, 'v1-attendee');
    const created = await owner.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'Before' }
    );
    await owner.t.run(ctx =>
      ctx.db.insert('memberships', {
        eventId: created.eventId,
        personId: attendee.personId,
        role: 'ATTENDEE',
        rsvpStatus: 'YES',
      })
    );
    const response = await owner.request(
      `/events/${created.eventId}`,
      'PATCH',
      { title: ' After ' },
      undefined,
      'v1'
    );
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result).toMatchObject({
      success: true,
      data: { id: created.eventId, title: 'After' },
    });
    expect(result.data).not.toHaveProperty('potentialDateTimeOptions');
    const notifications = await attendee.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notifications.notifications.filter(n => n.type === 'EVENT_EDITED')
    ).toHaveLength(1);
  });

  it('updates and removes v1 reminder configuration through the add-on lifecycle', async () => {
    const owner = await setup();
    const { eventId } = await owner.auth.mutation(
      api.events.mutations.createEvent,
      {
        title: 'Reminder parity',
        chosenDateTime: dateAfter(5),
      }
    );
    for (const reminderOffset of ['1_DAY', '2_DAYS']) {
      const response = await owner.request(
        `/events/${eventId}`,
        'PATCH',
        { reminderOffset },
        undefined,
        'v1'
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        success: true,
        data: { reminderOffset },
      });
      expect(
        await owner.auth.query(api.addons.queries.getAddonConfig, {
          eventId,
          addonType: 'reminders',
        })
      ).toMatchObject({ enabled: true, config: { reminderOffset } });
    }
    const response = await owner.request(
      `/events/${eventId}`,
      'PATCH',
      { reminderOffset: null },
      undefined,
      'v1'
    );
    expect(response.status).toBe(200);
    expect(
      await owner.auth.query(api.addons.queries.getAddonConfig, {
        eventId,
        addonType: 'reminders',
      })
    ).toMatchObject({ enabled: false });
  });

  it('rechecks write roles inside the shared mutation after a transport preflight', async () => {
    const owner = await setup();
    const { eventId, membershipId } = await owner.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'Protected' }
    );
    await owner.t.run(ctx => ctx.db.patch(membershipId, { role: 'ATTENDEE' }));
    await expect(
      owner.t.mutation(internal.events.rest.update, {
        personId: owner.personId,
        eventId,
        body: { title: 'Denied', reminderOffset: '1_DAY' },
      })
    ).rejects.toThrow('FORBIDDEN');
    expect(
      (await owner.auth.query(api.events.queries.getEventHeader, { eventId }))
        .event.title
    ).toBe('Protected');
  });

  it('dispatches the event-update lifecycle for v1 edits', async () => {
    const owner = await setup();
    const { eventId } = await owner.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'Linked event' }
    );
    await owner.t.run(async ctx => {
      await ctx.db.insert('eventAddonConfigs', {
        eventId,
        addonType: 'discord',
        enabled: true,
        config: { guildId: 'guild', guildName: 'Guild' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert('addonData', {
        eventId,
        addonType: 'discord',
        key: 'discord-event',
        data: { guildId: 'guild', discordEventId: 'remote-event' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
    expect(
      (
        await owner.request(
          `/events/${eventId}`,
          'PATCH',
          { location: 'New location' },
          undefined,
          'v1'
        )
      ).status
    ).toBe(200);
    const jobs = await owner.t.run(ctx =>
      ctx.db.system.query('_scheduled_functions').collect()
    );
    expect(jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'discord/actions:updateDiscordEvent',
          args: [{ guildId: 'guild', discordEventId: 'remote-event', eventId }],
        }),
      ])
    );
  });

  it('requires platform administrator authority inside administrative deletion', async () => {
    const owner = await setup();
    const { eventId } = await owner.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'Admin protected' }
    );
    await expect(
      owner.t.mutation(internal.events.rest.deleteEvent, {
        eventId,
        userId: owner.user._id,
      })
    ).rejects.toThrow('Admin privileges required');
    expect(await owner.t.run(ctx => ctx.db.get(eventId))).not.toBeNull();
    await owner.t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', operator: 'eq', value: owner.user._id }],
        update: { role: 'admin' },
      },
    });
    await expect(
      owner.t.mutation(internal.events.rest.deleteEvent, {
        eventId,
        userId: owner.user._id,
      })
    ).resolves.toEqual({ success: true });
    expect(await owner.t.run(ctx => ctx.db.get(eventId))).toBeNull();
  });

  it('rechecks read membership at the event resource boundary', async () => {
    const owner = await setup();
    const outsider = await actor(owner.t, 'read-outsider');
    const { eventId } = await owner.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'Private' }
    );
    await expect(
      owner.t.query(internal.events.restQueries.getEventDetail, {
        eventId,
        personId: outsider.personId,
      })
    ).rejects.toThrow('Event membership required');
  });

  it('deduplicates concurrent identical submissions in one transaction', async () => {
    const { auth, request } = await setup();
    const requestId = newRequestId();
    const body = {
      title: 'Concurrent',
      potentialDateTimeOptions: [{ start: dateAfter(3) }],
    };
    const responses = await Promise.all([
      request('/events', 'POST', body, requestId),
      request('/events', 'POST', body, requestId),
    ]);
    expect(responses.map(response => response.status)).toEqual([201, 201]);
    const [first, second] = await Promise.all(
      responses.map(response => response.json())
    );
    expect(first).toEqual(second);
    expect(await (await request('/events', 'GET')).json()).toHaveLength(1);
    const availability = await auth.query(
      api.availability.queries.getEventAvailabilityData,
      { eventId: first.eventId }
    );
    expect(availability.potentialDateTimes).toHaveLength(1);
    expect(availability.potentialDateTimes[0].availabilities).toHaveLength(1);
  });
});
