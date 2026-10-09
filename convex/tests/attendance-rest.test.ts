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
describe('Authenticated attendance and scheduling', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('records private RSVP note and emits the app RSVP notification', async () => {
    const { organizer, attendee, eventId } = await fixture();
    await body(
      await attendee.request(`/events/${eventId}/rsvp`, 'PATCH', {
        rsvpStatus: 'MAYBE',
        rsvpNote: 'Arriving late',
      })
    );
    const header = await attendee.auth.query(
      api.events.queries.getEventHeader,
      { eventId }
    );
    expect(header.userMembership.rsvpNote).toBe('Arriving late');
    const notifications = await organizer.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notifications.notifications.filter(n => n.type === 'USER_RSVP')
    ).toHaveLength(1);
  });
});

describe('Attendance privacy, validation and scheduling lifecycle', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('advertises protocol support and preserves RSVP note clearing semantics', async () => {
    const { attendee, eventId } = await fixture();
    expect(
      (await body(await attendee.request('/health', 'GET'))).capabilities
        .attendanceWrites
    ).toEqual({ version: 1 });
    const first = await body(
      await attendee.request(`/events/${eventId}/rsvp`, 'PATCH', {
        rsvpStatus: 'YES',
        rsvpNote: 'Private',
      })
    );
    expect(first).toMatchObject({ rsvpStatus: 'YES', rsvpNote: 'Private' });
    expect(
      await body(await attendee.request(`/events/${eventId}/rsvp`, 'GET'))
    ).toEqual(first);
    const cleared = await body(
      await attendee.request(`/events/${eventId}/rsvp`, 'PATCH', {
        rsvpStatus: 'PENDING',
      })
    );
    expect(cleared.rsvpNote).toBeNull();
    for (const input of [
      { rsvpStatus: 'YES', rsvpNote: 'x'.repeat(201) },
      { rsvpStatus: 'OTHER' },
      { rsvpStatus: 'YES', personId: 'someone' },
    ])
      expect(
        (await attendee.request(`/events/${eventId}/rsvp`, 'PATCH', input))
          .status
      ).toBe(400);
  });
  it('masks others notes in REST attendance/grid and both app availability readers', async () => {
    const { organizer, attendee, moderator, eventId, event } = await fixture();
    const option = event.potentialDateTimeOptions[0].id;
    for (const [person, note] of [
      [organizer, 'Organizer private'],
      [moderator, 'Moderator private'],
      [attendee, 'Attendee private'],
    ] as const) {
      await body(
        await person.request(`/events/${eventId}/rsvp`, 'PATCH', {
          rsvpStatus: 'YES',
          rsvpNote: note,
        })
      );
      await body(
        await person.request(`/events/${eventId}/availability`, 'POST', {
          responses: [{ potentialDateTimeId: option, status: 'MAYBE', note }],
        })
      );
    }
    const list = await body(
      await attendee.request(
        `/events/${eventId}/members?pagination=cursor`,
        'GET'
      )
    );
    expect(
      list.items.find(
        (row: { personId: string }) => row.personId === organizer.personId
      ).rsvpNote
    ).toBeNull();
    expect(
      list.items.find(
        (row: { personId: string }) => row.personId === attendee.personId
      ).rsvpNote
    ).toBe('Attendee private');
    const responses = await body(
      await attendee.request(
        `/events/${eventId}/availability/responses?pagination=cursor&potentialDateTimeId=${option}`,
        'GET'
      )
    );
    expect(
      responses.items.find(
        (row: { personId: string }) => row.personId === moderator.personId
      ).note
    ).toBeNull();
    const full = await body(
      await moderator.request(
        `/events/${eventId}/availability/responses?pagination=cursor&potentialDateTimeId=${option}`,
        'GET'
      )
    );
    expect(
      full.items.find(
        (row: { personId: string }) => row.personId === attendee.personId
      ).note
    ).toBe('Attendee private');
    const grid = await body(
      await attendee.request(`/events/${eventId}/availability`, 'GET')
    );
    expect(
      grid.potentialDates[0].availabilities.filter(
        (row: { note: string | null }) => row.note !== null
      )
    ).toHaveLength(1);
    const app = await attendee.auth.query(
      api.availability.queries.getEventAvailabilityData,
      { eventId }
    );
    const others = app.potentialDateTimes[0].availabilities.filter(
      row => row.member.personId !== attendee.personId
    );
    expect(
      others.every(
        row => row.note === undefined && row.member.rsvpNote === undefined
      )
    ).toBe(true);
    const legacyApp = await attendee.auth.query(
      api.events.queries.getEventAvailabilityData,
      { eventId }
    );
    expect(
      legacyApp.members
        .filter(m => m.personId !== attendee.personId)
        .every(m => m.rsvpNote === undefined)
    ).toBe(true);
    expect(
      legacyApp.potentialDates[0].availabilities
        .filter(row => row.member?.personId !== attendee.personId)
        .every(
          row => row.note === undefined && row.member?.rsvpNote === undefined
        )
    ).toBe(true);
    const attendance = await attendee.auth.query(
      api.events.queries.getEventAttendeesData,
      { eventId }
    );
    expect(
      attendance.event.memberships
        .filter(m => m.personId !== attendee.personId)
        .every(
          m =>
            m.rsvpNote === undefined &&
            m.availabilities.every(a => a.note === undefined)
        )
    ).toBe(true);
  });
  it.each(['MODERATOR', 'ORGANIZER'] as const)(
    'respects %s attendee visibility while keeping own responses available',
    async level => {
      const { organizer, attendee, moderator, eventId, event } =
        await fixture();
      await organizer.t.run(ctx =>
        ctx.db.patch(eventId, { permissions: { viewAttendeeList: level } })
      );
      for (const person of [
        attendee,
        ...(level === 'ORGANIZER' ? [moderator] : []),
      ]) {
        for (const path of [
          'members',
          'availability',
          `availability/responses?potentialDateTimeId=${event.potentialDateTimeOptions[0].id}`,
        ])
          expect(
            (await person.request(`/events/${eventId}/${path}`, 'GET')).status
          ).toBe(403);
        expect(
          (await person.request(`/events/${eventId}/rsvp`, 'GET')).status
        ).toBe(200);
        expect(
          (
            await person.request(
              `/events/${eventId}/availability/mine?pagination=cursor`,
              'GET'
            )
          ).status
        ).toBe(200);
        const app = await person.auth.query(
          api.events.queries.getEventAvailabilityData,
          { eventId }
        );
        expect(app.members).toHaveLength(1);
        expect(app.members[0].personId).toBe(person.personId);
        const modern = await person.auth.query(
          api.availability.queries.getEventAvailabilityData,
          { eventId }
        );
        expect(
          modern.potentialDateTimes
            .flatMap(d => d.availabilities)
            .every(a => a.member.personId === person.personId)
        ).toBe(true);
      }
      expect(
        (await organizer.request(`/events/${eventId}/members`, 'GET')).status
      ).toBe(200);
      if (level === 'MODERATOR')
        expect(
          (await moderator.request(`/events/${eventId}/members`, 'GET')).status
        ).toBe(200);
    }
  );
  it('supports notes, single/batch updates and clear without altering RSVP', async () => {
    const { attendee, eventId, event } = await fixture();
    const [one, two] = event.potentialDateTimeOptions;
    const submitted = await body(
      await attendee.request(`/events/${eventId}/availability`, 'POST', {
        responses: [
          { potentialDateTimeId: one.id, status: 'YES', note: 'Can attend' },
          { potentialDateTimeId: two.id, status: 'NO' },
        ],
      })
    );
    expect(submitted).toEqual({ created: 2, updated: 0 });
    await attendee.auth.mutation(
      api.availability.mutations.updateSingleAvailability,
      { potentialDateTimeId: one.id, status: 'MAYBE', note: 'Later' }
    );
    const own = await body(
      await attendee.request(
        `/events/${eventId}/availability/mine?pagination=cursor`,
        'GET'
      )
    );
    expect(own.items[0]).toMatchObject({
      status: 'MAYBE',
      note: 'Later',
      potentialDateTime: { note: 'Morning' },
    });
    await body(
      await attendee.request(`/events/${eventId}/rsvp`, 'PATCH', {
        rsvpStatus: 'NO',
        rsvpNote: 'RSVP note',
      })
    );
    expect(
      await body(
        await attendee.request(`/events/${eventId}/availability`, 'DELETE')
      )
    ).toMatchObject({ deletedCount: 2 });
    const cleared = await body(
      await attendee.request(
        `/events/${eventId}/availability/mine?pagination=cursor`,
        'GET'
      )
    );
    expect(
      cleared.items.every(
        (row: {
          status: string;
          note: string | null;
          availabilityId: string | null;
        }) =>
          row.status === 'PENDING' &&
          row.note === null &&
          row.availabilityId === null
      )
    ).toBe(true);
    expect(
      await body(await attendee.request(`/events/${eventId}/rsvp`, 'GET'))
    ).toMatchObject({ rsvpStatus: 'NO', rsvpNote: 'RSVP note' });
  });
  it('rejects invalid notes, duplicate options and cross-event batches atomically', async () => {
    const { organizer, attendee, eventId, event, start } = await fixture();
    const option = event.potentialDateTimeOptions[0].id;
    const other = await body(
      await organizer.request('/events', 'POST', {
        title: 'Other',
        potentialDateTimeOptions: [{ start: new Date(start).toISOString() }],
      }),
      201
    );
    const detail = await body(
      await organizer.request(`/events/${other.eventId}`, 'GET')
    );
    const foreign = detail.potentialDateTimeOptions[0].id;
    const bad = [
      {
        responses: [
          { potentialDateTimeId: option, status: 'YES', note: 'x'.repeat(201) },
        ],
      },
      { responses: [{ potentialDateTimeId: option, status: 'PENDING' }] },
      {
        responses: [
          { potentialDateTimeId: option, status: 'YES' },
          { potentialDateTimeId: option, status: 'NO' },
        ],
      },
      {
        responses: [
          { potentialDateTimeId: option, status: 'YES' },
          { potentialDateTimeId: foreign, status: 'NO' },
        ],
      },
      {
        responses: [
          {
            potentialDateTimeId: option,
            status: 'YES',
            personId: organizer.personId,
          },
        ],
      },
    ];
    for (const input of bad)
      expect(
        (
          await attendee.request(
            `/events/${eventId}/availability`,
            'POST',
            input
          )
        ).status
      ).toBe(400);
    const own = await body(
      await attendee.request(`/events/${eventId}/availability/mine`, 'GET')
    );
    expect(own.items[0].status).toBe('PENDING');
    await expect(
      attendee.auth.mutation(api.availability.mutations.submitAvailability, {
        eventId,
        responses: [
          { potentialDateTimeId: option, status: 'YES' },
          { potentialDateTimeId: foreign, status: 'NO' },
        ],
      })
    ).rejects.toThrow('does not belong');
    expect(
      (
        await body(
          await attendee.request(`/events/${eventId}/availability/mine`, 'GET')
        )
      ).items[0].status
    ).toBe('PENDING');
  });
  it('finalizes poll using latest responses, preserving notes and defaulting missing voters to pending', async () => {
    const { organizer, attendee, moderator, eventId, event } = await fixture();
    const option = event.potentialDateTimeOptions[0];
    await body(
      await attendee.request(`/events/${eventId}/rsvp`, 'PATCH', {
        rsvpStatus: 'NO',
        rsvpNote: 'Keep my RSVP note',
      })
    );
    await body(
      await attendee.request(`/events/${eventId}/availability`, 'POST', {
        responses: [
          {
            potentialDateTimeId: option.id,
            status: 'MAYBE',
            note: 'Availability only',
          },
        ],
      })
    );
    const self = await body(
      await attendee.request(`/events/${eventId}/rsvp`, 'GET')
    );
    await organizer.t.run(ctx =>
      ctx.db.insert('availabilities', {
        membershipId: self.membershipId,
        potentialDateTimeId: option.id,
        status: 'NO',
        updatedAt: Date.now() - 1000,
      })
    );
    const chosen = await body(
      await organizer.request(`/events/${eventId}/date`, 'POST', {
        selectionSource: 'POLL',
        potentialDateTimeId: option.id,
      })
    );
    expect(chosen).toMatchObject({
      chosenDateTime: option.start,
      chosenEndDateTime: option.end,
    });
    expect(
      await body(await attendee.request(`/events/${eventId}/rsvp`, 'GET'))
    ).toMatchObject({ rsvpStatus: 'MAYBE', rsvpNote: 'Keep my RSVP note' });
    expect(
      await body(await moderator.request(`/events/${eventId}/rsvp`, 'GET'))
    ).toMatchObject({ rsvpStatus: 'PENDING' });
    const app = await organizer.auth.query(
      api.availability.queries.getEventAvailabilityData,
      { eventId }
    );
    expect(
      app.potentialDateTimes[0].availabilities.filter(
        a => a.membershipId === self.membershipId
      )
    ).toHaveLength(1);
    const notices = await attendee.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notices.notifications.filter(n => n.type === 'DATE_CHOSEN')
    ).toHaveLength(1);
  });
  it('manual selection and reset preserve all responses while notifications and reminder lifecycle run', async () => {
    const { organizer, attendee, eventId, event, start } = await fixture();
    const option = event.potentialDateTimeOptions[0];
    await organizer.auth.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'reminders',
      config: { reminderOffset: '1_DAY' },
    });
    await body(
      await attendee.request(`/events/${eventId}/rsvp`, 'PATCH', {
        rsvpStatus: 'NO',
        rsvpNote: 'Keep',
      })
    );
    await body(
      await attendee.request(`/events/${eventId}/availability`, 'POST', {
        responses: [
          { potentialDateTimeId: option.id, status: 'YES', note: 'Also keep' },
        ],
      })
    );
    const selected = await body(
      await organizer.request(`/events/${eventId}/date`, 'POST', {
        selectionSource: 'MANUAL',
        chosenDateTime: new Date(start).toISOString(),
      })
    );
    expect(selected.chosenEndDateTime).toBeNull();
    expect(
      await body(await attendee.request(`/events/${eventId}/rsvp`, 'GET'))
    ).toMatchObject({ rsvpStatus: 'NO', rsvpNote: 'Keep' });
    const jobsBefore = await organizer.t.run(ctx =>
      ctx.db.system.query('_scheduled_functions').collect()
    );
    expect(
      jobsBefore.some(job => job.name.includes('scheduleEventReminder'))
    ).toBe(true);
    const reset = await body(
      await organizer.request(`/events/${eventId}/date`, 'DELETE')
    );
    expect(reset).toMatchObject({
      chosenDateTime: null,
      chosenEndDateTime: null,
    });
    expect(reset.potentialDateTimeOptions).toHaveLength(2);
    const jobs = await organizer.t.run(ctx =>
      ctx.db.system.query('_scheduled_functions').collect()
    );
    expect(jobs.some(job => job.name.includes('cancelEventReminders'))).toBe(
      true
    );
    expect(
      await body(await attendee.request(`/events/${eventId}/rsvp`, 'GET'))
    ).toMatchObject({ rsvpStatus: 'NO', rsvpNote: 'Keep' });
    expect(
      (
        await body(
          await attendee.request(`/events/${eventId}/availability/mine`, 'GET')
        )
      ).items[0]
    ).toMatchObject({ status: 'YES', note: 'Also keep' });
    const notices = await attendee.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notices.notifications.filter(n => n.type === 'DATE_CHOSEN')
    ).toHaveLength(1);
    expect(
      notices.notifications.filter(n => n.type === 'DATE_RESET')
    ).toHaveLength(1);
  });
  it('requires organizer for date lifecycle and rejects nonmembers from every response surface', async () => {
    const { attendee, moderator, outsider, eventId, event } = await fixture();
    for (const person of [attendee, moderator, outsider]) {
      expect(
        (
          await person.request(`/events/${eventId}/date`, 'POST', {
            selectionSource: 'POLL',
            potentialDateTimeId: event.potentialDateTimeOptions[0].id,
          })
        ).status
      ).toBe(403);
      expect(
        (await person.request(`/events/${eventId}/date`, 'DELETE')).status
      ).toBe(403);
    }
    for (const path of [
      'rsvp',
      'members',
      'availability',
      'potential-dates',
      'availability/mine',
      `availability/responses?potentialDateTimeId=${event.potentialDateTimeOptions[0].id}`,
    ])
      expect(
        (await outsider.request(`/events/${eventId}/${path}`, 'GET')).status
      ).toBe(403);
    expect(
      (
        await outsider.request(`/events/${eventId}/rsvp`, 'PATCH', {
          rsvpStatus: 'YES',
        })
      ).status
    ).toBe(403);
    expect(
      (
        await outsider.request(`/events/${eventId}/availability`, 'POST', {
          responses: [],
        })
      ).status
    ).toBe(403);
    expect(
      (await outsider.request(`/events/${eventId}/availability`, 'DELETE'))
        .status
    ).toBe(403);
  });
  it('validates offset/calendar/future/end and cross-event poll selection with unchanged event state', async () => {
    const { organizer, eventId, event, start } = await fixture();
    const option = event.potentialDateTimeOptions[0];
    const invalid = [
      { selectionSource: 'MANUAL', chosenDateTime: 'not-a-date' },
      { selectionSource: 'MANUAL', chosenDateTime: '2027-02-30T10:00:00Z' },
      { selectionSource: 'MANUAL', chosenDateTime: '2027-02-01T10:00:00' },
      { selectionSource: 'MANUAL', chosenDateTime: '2020-01-01T00:00:00Z' },
      {
        selectionSource: 'MANUAL',
        chosenDateTime: new Date(start).toISOString(),
        chosenEndDateTime: new Date(start).toISOString(),
      },
      {
        selectionSource: 'MANUAL',
        chosenDateTime: new Date(start).toISOString(),
        potentialDateTimeId: option.id,
      },
      { selectionSource: 'POLL' },
    ];
    for (const input of invalid)
      expect(
        (await organizer.request(`/events/${eventId}/date`, 'POST', input))
          .status
      ).toBe(400);
    const other = await body(
      await organizer.request('/events', 'POST', { title: 'Other' }),
      201
    );
    expect(
      (
        await organizer.request(`/events/${other.eventId}/date`, 'POST', {
          selectionSource: 'POLL',
          potentialDateTimeId: option.id,
        })
      ).status
    ).toBe(400);
    await expect(
      organizer.auth.mutation(api.events.mutations.chooseEventDate, {
        eventId,
        selectionSource: 'MANUAL',
        chosenDateTime: Infinity,
      })
    ).rejects.toThrow('future');
    await expect(
      organizer.auth.mutation(api.events.mutations.chooseEventDate, {
        eventId,
        selectionSource: 'MANUAL',
        chosenDateTime: start,
        chosenEndDateTime: NaN,
      })
    ).rejects.toThrow('End time');
    expect(
      (await body(await organizer.request(`/events/${eventId}`, 'GET')))
        .chosenDateTime
    ).toBeNull();
    const selected = await body(
      await organizer.request(`/events/${eventId}/date`, 'POST', {
        selectionSource: 'MANUAL',
        chosenDateTime: '2027-01-01T18:00:00-05:00',
        chosenEndDateTime: '2027-01-01T19:00:00-05:00',
      })
    );
    expect(selected.chosenDateTime).toBe(Date.parse('2027-01-01T23:00:00Z'));
  });
});

describe('Attendance pagination, legacy transports and API-key scopes', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('paginates all four list resources and binds cursor to identity, event, kind and option', async () => {
    const { organizer, attendee, eventId, event } = await fixture();
    const option = event.potentialDateTimeOptions[0].id;
    const otherOption = event.potentialDateTimeOptions[1].id;
    const paths = [
      'members',
      'potential-dates',
      'availability/mine',
      `availability/responses?potentialDateTimeId=${option}`,
    ];
    for (const path of paths) {
      const base = `/events/${eventId}/${path}`;
      const separator = path.includes('?') ? '&' : '?';
      const page = await body(
        await organizer.request(
          `${base}${separator}pagination=cursor&limit=1`,
          'GET'
        )
      );
      expect(page.items).toHaveLength(1);
      expect(page.nextCursor).toBeTruthy();
      let cursor = page.nextCursor;
      const seen = [JSON.stringify(page.items[0])];
      let loops = 0;
      while (cursor) {
        expect(loops++).toBeLessThan(6);
        const next = await body(
          await organizer.request(
            `${base}${separator}pagination=cursor&limit=1&cursor=${encodeURIComponent(cursor)}`,
            'GET'
          )
        );
        seen.push(...next.items.map((row: unknown) => JSON.stringify(row)));
        cursor = next.nextCursor;
      }
      expect(new Set(seen).size).toBe(
        path === 'members' || path.includes('responses') ? 3 : 2
      );
      expect(
        (
          await attendee.request(
            `${base}${separator}pagination=cursor&limit=1&cursor=${encodeURIComponent(page.nextCursor)}`,
            'GET'
          )
        ).status
      ).toBe(400);
    }
    const first = await body(
      await organizer.request(
        `/events/${eventId}/availability/responses?potentialDateTimeId=${option}&pagination=cursor&limit=1`,
        'GET'
      )
    );
    expect(
      (
        await organizer.request(
          `/events/${eventId}/availability/responses?potentialDateTimeId=${otherOption}&pagination=cursor&limit=1&cursor=${encodeURIComponent(first.nextCursor)}`,
          'GET'
        )
      ).status
    ).toBe(400);
    expect(
      (
        await organizer.request(
          `/events/${eventId}/members?pagination=cursor&cursor=${encodeURIComponent(first.nextCursor)}`,
          'GET'
        )
      ).status
    ).toBe(400);
    const other = await body(
      await organizer.request('/events', 'POST', { title: 'Another' }),
      201
    );
    expect(
      (
        await organizer.request(
          `/events/${other.eventId}/availability/responses?potentialDateTimeId=${option}&pagination=cursor&cursor=${encodeURIComponent(first.nextCursor)}`,
          'GET'
        )
      ).status
    ).toBe(400);
    const attendeePage = await body(
      await attendee.request(
        `/events/${eventId}/members?pagination=cursor&limit=1`,
        'GET'
      )
    );
    await organizer.t.run(ctx =>
      ctx.db.patch(eventId, { permissions: { viewAttendeeList: 'ORGANIZER' } })
    );
    expect(
      (
        await attendee.request(
          `/events/${eventId}/members?pagination=cursor&cursor=${encodeURIComponent(attendeePage.nextCursor)}`,
          'GET'
        )
      ).status
    ).toBe(403);
    expect(
      (await organizer.request(`/events/${eventId}/members?limit=1`, 'GET'))
        .status
    ).toBe(400);
  });
  it('keeps v1 envelopes and v2 legacy arrays while enforcing shared notes and view permissions', async () => {
    const { organizer, attendee, eventId, event } = await fixture();
    const headers = {
      'x-api-key': attendee.rawKey,
      'content-type': 'application/json',
    };
    const v1rsvp = await body(
      await organizer.t.fetch(`/api/v1/events/${eventId}/rsvp`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ rsvpStatus: 'YES', rsvpNote: 'V1 RSVP' }),
      })
    );
    expect(v1rsvp).toMatchObject({
      success: true,
      data: { rsvpStatus: 'YES' },
    });
    const v1vote = await body(
      await organizer.t.fetch(`/api/v1/events/${eventId}/availability`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          responses: [
            {
              potentialDateTimeId: event.potentialDateTimeOptions[0].id,
              status: 'NO',
              note: 'V1 availability',
            },
          ],
        }),
      })
    );
    expect(v1vote).toEqual({ success: true, data: { created: 1, updated: 0 } });
    expect(
      await body(await attendee.request(`/events/${eventId}/rsvp`, 'GET'))
    ).toMatchObject({ rsvpNote: 'V1 RSVP' });
    expect(
      (
        await body(
          await attendee.request(`/events/${eventId}/availability/mine`, 'GET')
        )
      ).items[0].note
    ).toBe('V1 availability');
    const members = await body(
      await organizer.t.fetch(`/api/v1/events/${eventId}/members`, { headers })
    );
    expect(members.success).toBe(true);
    expect(members.data).toHaveLength(3);
    expect(
      Array.isArray(
        await body(await attendee.request(`/events/${eventId}/members`, 'GET'))
      )
    ).toBe(true);
    expect(
      Array.isArray(
        await body(
          await attendee.request(`/events/${eventId}/potential-dates`, 'GET')
        )
      )
    ).toBe(true);
    await organizer.t.run(ctx =>
      ctx.db.patch(eventId, { permissions: { viewAttendeeList: 'ORGANIZER' } })
    );
    for (const path of ['members', 'availability']) {
      const denied = await body(
        await organizer.t.fetch(`/api/v1/events/${eventId}/${path}`, {
          headers,
        }),
        403
      );
      expect(denied).toMatchObject({
        success: false,
        error: { code: 'FORBIDDEN' },
      });
    }
  });
  it('requires events write scope without blocking permitted reads', async () => {
    const { organizer, attendee, eventId, event } = await fixture();
    await organizer.t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'apikey',
        where: [{ field: '_id', value: attendee.keyId }],
        update: { permissions: JSON.stringify({ events: ['read'] }) },
      },
    });
    expect(
      (await attendee.request(`/events/${eventId}/rsvp`, 'GET')).status
    ).toBe(200);
    expect(
      (
        await attendee.request(
          `/events/${eventId}/availability/mine?pagination=cursor`,
          'GET'
        )
      ).status
    ).toBe(200);
    expect(
      (
        await attendee.request(`/events/${eventId}/rsvp`, 'PATCH', {
          rsvpStatus: 'YES',
        })
      ).status
    ).toBe(403);
    expect(
      (
        await attendee.request(`/events/${eventId}/availability`, 'POST', {
          responses: [
            {
              potentialDateTimeId: event.potentialDateTimeOptions[0].id,
              status: 'YES',
            },
          ],
        })
      ).status
    ).toBe(403);
    expect(
      (await attendee.request(`/events/${eventId}/availability`, 'DELETE'))
        .status
    ).toBe(403);
  });
});

describe('Attendance privacy in the legacy post feed', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('keeps post access while hiding private RSVP notes and restricted membership graphs', async () => {
    const { organizer, attendee, moderator, eventId } = await fixture();
    await body(
      await moderator.request(`/events/${eventId}/rsvp`, 'PATCH', {
        rsvpStatus: 'YES',
        rsvpNote: 'Private arrival details',
      })
    );
    await organizer.auth.mutation(api.posts.mutations.createPost, {
      eventId,
      title: 'Planning',
      content: 'Everyone can still read posts',
    });
    const feed = await attendee.auth.query(api.posts.queries.getEventPostFeed, {
      eventId,
    });
    expect(feed.event.posts).toHaveLength(1);
    expect(
      feed.event.memberships.find(m => m.personId === moderator.personId)
        ?.rsvpNote
    ).toBeUndefined();
    const managerFeed = await organizer.auth.query(
      api.posts.queries.getEventPostFeed,
      { eventId }
    );
    expect(
      managerFeed.event.memberships.find(m => m.personId === moderator.personId)
        ?.rsvpNote
    ).toBe('Private arrival details');
    await organizer.t.run(ctx =>
      ctx.db.patch(eventId, { permissions: { viewAttendeeList: 'ORGANIZER' } })
    );
    const restricted = await attendee.auth.query(
      api.posts.queries.getEventPostFeed,
      { eventId }
    );
    expect(restricted.event.memberships).toHaveLength(1);
    expect(restricted.event.memberships[0].personId).toBe(attendee.personId);
    expect(restricted.event.posts).toEqual(feed.event.posts);
  });
});
