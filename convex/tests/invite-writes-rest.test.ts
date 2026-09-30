import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
function newRequestId() {
  return `${Date.now()}.${crypto.randomUUID()}`;
}

describe('Authenticated invitation writes', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('replays link creation and uses app RSVP and permission rules', async () => {
    const organizer = await setup();
    const attendee = await actor(organizer.t, 'invited-attendee');
    const { eventId } = await (
      await organizer.request('/events', 'POST', { title: 'Invitations' })
    ).json();
    const requestId = newRequestId();
    const first = await organizer.request(
      `/events/${eventId}/invites`,
      'POST',
      { maxUses: 2 },
      requestId
    );
    expect(first.status).toBe(201);
    const invite = await first.json();
    const second = await organizer.request(
      `/events/${eventId}/invites`,
      'POST',
      { maxUses: 2 },
      requestId
    );
    expect(await second.json()).toEqual(invite);
    expect(
      await (
        await organizer.request(`/events/${eventId}/invites`, 'GET')
      ).json()
    ).toHaveLength(1);
    expect(
      (await attendee.request(`/invites/${invite.token}/accept`, 'POST')).status
    ).toBe(200);
    const header = await attendee.auth.query(
      api.events.queries.getEventHeader,
      { eventId }
    );
    expect(header.userMembership.rsvpStatus).toBe('PENDING');
    expect(
      (await attendee.request(`/events/${eventId}/invites`, 'POST', {})).status
    ).toBe(403);
  });
});

async function eventFixture() {
  const organizer = await setup();
  const invitee = await actor(organizer.t, 'invited-user');
  const stranger = await actor(organizer.t, 'stranger-user');
  const { eventId, membershipId } = await (
    await organizer.request('/events', 'POST', { title: 'Team invitation' })
  ).json();
  return { organizer, invitee, stranger, eventId, membershipId };
}
async function body(response: Response, status: number) {
  expect(response.status, await response.clone().text()).toBe(status);
  return response.json();
}
describe('Invitation management and recipient boundaries', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('advertises the invitation protocol in health', async () => {
    const { request } = await setup();
    const health = await body(await request('/health', 'GET'), 200);
    expect(health.capabilities.inviteWrites).toEqual({
      version: 1,
      retentionMs: 86400000,
    });
  });
  it('sends a username invitation once, exposes it only to participants, and accepts with app side effects', async () => {
    const { organizer, invitee, stranger, eventId } = await eventFixture();
    const requestId = newRequestId();
    const payload = {
      username: '@INVITED-USER',
      role: 'MODERATOR',
      message: 'Come join',
    };
    const [first, second] = await Promise.all([
      organizer.request(
        `/events/${eventId}/member-invites`,
        'POST',
        payload,
        requestId
      ),
      organizer.request(
        `/events/${eventId}/member-invites`,
        'POST',
        payload,
        requestId
      ),
    ]);
    const created = await body(first, 201);
    expect(await body(second, 201)).toEqual(created);
    const inbox = await body(
      await invitee.request('/member-invites?pagination=cursor', 'GET'),
      200
    );
    expect(inbox.items).toHaveLength(1);
    expect(inbox.items[0]).toMatchObject({
      inviteId: created.inviteId,
      eventId,
      role: 'MODERATOR',
      status: 'PENDING',
    });
    const received = await invitee.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      received.notifications.filter(n => n.type === 'EVENT_INVITE_RECEIVED')
    ).toHaveLength(1);
    expect(
      (await stranger.request(`/member-invites/${created.inviteId}`, 'GET'))
        .status
    ).toBe(403);
    for (const action of ['accept', 'decline'])
      expect(
        (
          await stranger.request(
            `/member-invites/${created.inviteId}/${action}`,
            'POST'
          )
        ).status
      ).toBe(403);
    const accepted = await body(
      await invitee.request(
        `/member-invites/${created.inviteId}/accept`,
        'POST'
      ),
      200
    );
    expect(accepted.eventId).toBe(eventId);
    const header = await invitee.auth.query(api.events.queries.getEventHeader, {
      eventId,
    });
    expect(header.userMembership).toMatchObject({
      role: 'MODERATOR',
      rsvpStatus: 'PENDING',
    });
    expect(header.event.memberCount).toBe(2);
    const sent = await body(
      await organizer.request(
        `/events/${eventId}/member-invites?pagination=cursor`,
        'GET'
      ),
      200
    );
    expect(sent.items[0].status).toBe('ACCEPTED');
    const notifications = await organizer.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notifications.notifications.filter(
        n => n.type === 'EVENT_INVITE_ACCEPTED'
      )
    ).toHaveLength(1);
    expect(
      (
        await invitee.request(
          `/member-invites/${created.inviteId}/accept`,
          'POST'
        )
      ).status
    ).toBe(409);
  });
  it('declines and cancels pending username invites without joining', async () => {
    const { organizer, invitee, stranger, eventId } = await eventFixture();
    const created = await body(
      await organizer.request(`/events/${eventId}/member-invites`, 'POST', {
        username: 'invited-user',
      }),
      201
    );
    await body(
      await invitee.request(
        `/member-invites/${created.inviteId}/decline`,
        'POST'
      ),
      200
    );
    expect(
      (
        await body(
          await organizer.request(`/member-invites/${created.inviteId}`, 'GET'),
          200
        )
      ).status
    ).toBe('DECLINED');
    const second = await body(
      await organizer.request(`/events/${eventId}/member-invites`, 'POST', {
        username: 'invited-user',
      }),
      201
    );
    expect(
      (await stranger.request(`/member-invites/${second.inviteId}`, 'DELETE'))
        .status
    ).toBe(403);
    expect(
      await body(
        await organizer.request(`/member-invites/${second.inviteId}`, 'DELETE'),
        200
      )
    ).toEqual({ success: true });
    expect(
      (
        await invitee.request(
          `/member-invites/${second.inviteId}/accept`,
          'POST'
        )
      ).status
    ).toBe(404);
    expect(await (await invitee.request('/events', 'GET')).json()).toEqual([]);
  });
  it('honors configurable invitation roles and organizer-only moderator invitations', async () => {
    const { organizer, invitee, stranger, eventId } = await eventFixture();
    const link = await body(
      await organizer.request(`/events/${eventId}/invites`, 'POST', {}),
      201
    );
    await body(
      await invitee.request(`/invites/${link.token}/accept`, 'POST'),
      200
    );
    for (const method of ['GET', 'POST'])
      expect(
        (
          await invitee.request(
            `/events/${eventId}/invites`,
            method,
            method === 'POST' ? {} : undefined
          )
        ).status
      ).toBe(403);
    await organizer.t.run(ctx =>
      ctx.db.patch(eventId, { permissions: { inviteMembers: 'EVERYONE' } })
    );
    await body(
      await invitee.request(`/events/${eventId}/invites`, 'POST', {}),
      201
    );
    expect(
      (
        await invitee.request(`/events/${eventId}/member-invites`, 'POST', {
          username: 'stranger-user',
          role: 'MODERATOR',
        })
      ).status
    ).toBe(403);
    await body(
      await invitee.request(`/events/${eventId}/member-invites`, 'POST', {
        username: 'stranger-user',
      }),
      201
    );
    expect(
      (await body(await stranger.request('/member-invites', 'GET'), 200)).items
    ).toHaveLength(1);
  });
  it.each(['block', 'privacy', 'ban'] as const)(
    'rejects username invites prohibited by %s',
    async reason => {
      const { organizer, invitee, eventId } = await eventFixture();
      await organizer.t.run(async ctx => {
        if (reason === 'block')
          await ctx.db.insert('userBlocks', {
            blockerId: invitee.personId,
            blockedId: organizer.personId,
            createdAt: Date.now(),
          });
        if (reason === 'privacy')
          await ctx.db.insert('personSettings', {
            personId: invitee.personId,
            allowEventInvitesFrom: 'NO_ONE',
          });
        if (reason === 'ban')
          await ctx.db.insert('eventBans', {
            personId: invitee.personId,
            eventId,
            bannedById: organizer.personId,
            bannedAt: Date.now(),
          });
      });
      expect(
        (
          await organizer.request(`/events/${eventId}/member-invites`, 'POST', {
            username: 'invited-user',
          })
        ).status
      ).toBe(403);
      expect(
        (await body(await invitee.request('/member-invites', 'GET'), 200)).items
      ).toEqual([]);
    }
  );
  it('checks bans at acceptance, and never consumes a forbidden bearer link', async () => {
    const { organizer, invitee, eventId } = await eventFixture();
    const link = await body(
      await organizer.request(`/events/${eventId}/invites`, 'POST', {
        maxUses: 1,
      }),
      201
    );
    const member = await body(
      await organizer.request(`/events/${eventId}/member-invites`, 'POST', {
        username: 'invited-user',
      }),
      201
    );
    await organizer.t.run(ctx =>
      ctx.db.insert('eventBans', {
        personId: invitee.personId,
        eventId,
        bannedById: organizer.personId,
        bannedAt: Date.now(),
      })
    );
    expect(
      (await invitee.request(`/invites/${link.token}/accept`, 'POST')).status
    ).toBe(403);
    expect(
      (
        await invitee.request(
          `/member-invites/${member.inviteId}/accept`,
          'POST'
        )
      ).status
    ).toBe(403);
    const links = await body(
      await organizer.request(`/events/${eventId}/invites`, 'GET'),
      200
    );
    expect(links[0].usesRemaining).toBe(1);
  });
  it('binds pagination to identity, event, filter and invite kind', async () => {
    const { organizer, invitee, eventId } = await eventFixture();
    for (let n = 0; n < 3; n++)
      await body(
        await organizer.request(`/events/${eventId}/invites`, 'POST', {
          name: `Link ${n}`,
        }),
        201
      );
    const first = await body(
      await organizer.request(
        `/events/${eventId}/invites?pagination=cursor&limit=1`,
        'GET'
      ),
      200
    );
    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).toBeTruthy();
    const next = `pagination=cursor&limit=1&cursor=${encodeURIComponent(first.nextCursor)}`;
    const second = await body(
      await organizer.request(`/events/${eventId}/invites?${next}`, 'GET'),
      200
    );
    expect(second.items[0].id).not.toBe(first.items[0].id);
    expect(
      (
        await organizer.request(
          `/events/${eventId}/invites?${next}&kind=email`,
          'GET'
        )
      ).status
    ).toBe(400);
    const other = await body(
      await organizer.request('/events', 'POST', { title: 'Other' }),
      201
    );
    expect(
      (
        await organizer.request(
          `/events/${other.eventId}/invites?${next}`,
          'GET'
        )
      ).status
    ).toBe(400);
    expect(
      (await invitee.request(`/events/${eventId}/invites?${next}`, 'GET'))
        .status
    ).toBe(403);
    expect(
      (await organizer.request(`/events/${eventId}/invites?limit=1`, 'GET'))
        .status
    ).toBe(400);
  });
  it('keeps email draft creation and queueing replay-safe and reports queued, not delivered', async () => {
    const { organizer, eventId } = await eventFixture();
    const requestId = newRequestId();
    const payload = {
      invites: [{ email: 'GUEST@example.com', plusOnes: 2 }],
      customMessage: 'Hello',
      send: false,
    };
    const first = await body(
      await organizer.request(
        `/events/${eventId}/invites/email`,
        'POST',
        payload,
        requestId
      ),
      201
    );
    expect(first).toMatchObject({ createdCount: 1, queuedCount: 0 });
    expect(
      await body(
        await organizer.request(
          `/events/${eventId}/invites/email`,
          'POST',
          payload,
          requestId
        ),
        201
      )
    ).toEqual(first);
    const pendingId = newRequestId();
    const sent = await body(
      await organizer.request(
        `/events/${eventId}/invites/send-pending`,
        'POST',
        undefined,
        pendingId
      ),
      200
    );
    expect(sent).toEqual({ queuedCount: 1 });
    expect(
      await body(
        await organizer.request(
          `/events/${eventId}/invites/send-pending`,
          'POST',
          undefined,
          pendingId
        ),
        200
      )
    ).toEqual(sent);
    expect(
      await body(
        await organizer.request(
          `/events/${eventId}/invites/send-pending`,
          'POST'
        ),
        200
      )
    ).toEqual({ queuedCount: 0 });
    const read = await organizer.auth.query(
      api.invites.queries.getEventInvites,
      { eventId }
    );
    expect(read.invites).toHaveLength(1);
    expect(read.invites[0]).toMatchObject({
      email: 'guest@example.com',
      usesTotal: 3,
      usesRemaining: 3,
    });
    const page = await body(
      await organizer.request(
        `/events/${eventId}/invites?pagination=cursor&kind=email`,
        'GET'
      ),
      200
    );
    expect(page.items[0].emailStatus).toBe('queued');
    const queued = await organizer.t.run(ctx =>
      ctx.db.system.query('_scheduled_functions').collect()
    );
    expect(
      queued.filter(job => job.name.includes('sendInviteEmails'))
    ).toHaveLength(1);
  });
  it('rejects changed, expired and invalid creation identifiers and replays after deletion without recreating', async () => {
    const { organizer, eventId } = await eventFixture();
    const id = newRequestId();
    const created = await body(
      await organizer.request(
        `/events/${eventId}/invites`,
        'POST',
        { name: 'Original' },
        id
      ),
      201
    );
    expect(
      (
        await organizer.request(
          `/events/${eventId}/invites`,
          'POST',
          { name: 'Changed' },
          id
        )
      ).status
    ).toBe(409);
    expect(
      (
        await organizer.request(
          `/events/${eventId}/invites`,
          'POST',
          {},
          'invalid'
        )
      ).status
    ).toBe(400);
    expect(
      (await organizer.request(`/invites/${created.id}`, 'DELETE')).status
    ).toBe(204);
    expect(
      await body(
        await organizer.request(
          `/events/${eventId}/invites`,
          'POST',
          { name: 'Original' },
          id
        ),
        201
      )
    ).toEqual(created);
    expect(
      await body(
        await organizer.request(`/events/${eventId}/invites`, 'GET'),
        200
      )
    ).toEqual([]);
    vi.setSystemTime(Date.now() + 86400001);
    const expired = await body(
      await organizer.request(
        `/events/${eventId}/invites`,
        'POST',
        { name: 'Original' },
        id
      ),
      409
    );
    expect(expired.error.code).toBe('IDEMPOTENCY_EXPIRED');
  });
  it('edits capacity without restoring consumed uses, clears limits, and rejects unknown input', async () => {
    const { organizer, invitee, eventId } = await eventFixture();
    const link = await body(
      await organizer.request(`/events/${eventId}/invites`, 'POST', {
        maxUses: 3,
      }),
      201
    );
    await body(
      await invitee.request(`/invites/${link.token}/accept`, 'POST'),
      200
    );
    const edited = await body(
      await organizer.request(`/invites/${link.id}`, 'PATCH', { maxUses: 2 }),
      200
    );
    expect(edited).toMatchObject({
      maxUses: 2,
      usesTotal: 1,
      usesRemaining: 1,
    });
    const unlimited = await body(
      await organizer.request(`/invites/${link.id}`, 'PATCH', {
        maxUses: null,
        expiresAt: null,
      }),
      200
    );
    expect(unlimited).toMatchObject({
      maxUses: null,
      usesRemaining: null,
      expiresAt: null,
    });
    for (const payload of [
      { role: 'MODERATOR' },
      { maxUses: 0 },
      { expiresAt: '2020-01-01T00:00:00Z' },
    ])
      expect(
        (await organizer.request(`/events/${eventId}/invites`, 'POST', payload))
          .status
      ).toBe(400);
    expect(
      (await organizer.request(`/invites/${link.id}`, 'PATCH', {})).status
    ).toBe(400);
  });
  it('preserves legacy v1 envelopes and consumes old REST limited links safely across both transports', async () => {
    const { organizer, invitee, stranger, eventId, membershipId } =
      await eventFixture();
    const id = await organizer.t.run(ctx =>
      ctx.db.insert('invites', {
        eventId,
        createdById: membershipId,
        token: 'legacy-token',
        maxUses: 2,
        usesTotal: 1,
        usesRemaining: 1,
      })
    );
    const accepted = await organizer.t.fetch(
      '/api/v1/invites/legacy-token/accept',
      { method: 'POST', headers: { 'x-api-key': invitee.rawKey } }
    );
    const acceptedBody = await body(accepted, 200);
    expect(acceptedBody.success).toBe(true);
    expect(acceptedBody.data.eventId).toBe(eventId);
    const header = await invitee.auth.query(api.events.queries.getEventHeader, {
      eventId,
    });
    expect(header.userMembership.rsvpStatus).toBe('PENDING');
    const denied = await organizer.t.fetch(
      '/api/v1/invites/legacy-token/accept',
      { method: 'POST', headers: { 'x-api-key': stranger.rawKey } }
    );
    expect(denied.status).toBe(400);
    expect(
      (await stranger.request('/invites/legacy-token/accept', 'POST')).status
    ).toBe(409);
    const links = await body(
      await organizer.request(`/events/${eventId}/invites`, 'GET'),
      200
    );
    expect(links.find((row: { id: string }) => row.id === id)).toMatchObject({
      maxUses: 2,
      usesTotal: 2,
      usesRemaining: 0,
    });
  });
});

describe('Invitation concurrency, historical data and scopes', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it.each([false, true])(
    'rejects acceptance after either party blocks (reverse=%s), including app mutation',
    async reverse => {
      const { organizer, invitee, eventId } = await eventFixture();
      const created = await body(
        await organizer.request(`/events/${eventId}/member-invites`, 'POST', {
          username: 'invited-user',
        }),
        201
      );
      await organizer.t.run(ctx =>
        ctx.db.insert('userBlocks', {
          blockerId: reverse ? invitee.personId : organizer.personId,
          blockedId: reverse ? organizer.personId : invitee.personId,
          createdAt: Date.now(),
        })
      );
      expect(
        (
          await invitee.request(
            `/member-invites/${created.inviteId}/accept`,
            'POST'
          )
        ).status
      ).toBe(403);
      await expect(
        invitee.auth.mutation(api.eventInvites.mutations.acceptEventInvite, {
          inviteId: created.inviteId,
        })
      ).rejects.toThrow('unavailable');
      expect(
        (
          await body(
            await organizer.request(
              `/member-invites/${created.inviteId}`,
              'GET'
            ),
            200
          )
        ).status
      ).toBe('PENDING');
    }
  );
  it('keeps historical unlimited REST consumed uses when a limit is applied', async () => {
    const { organizer, eventId, membershipId } = await eventFixture();
    const id = await organizer.t.run(ctx =>
      ctx.db.insert('invites', {
        eventId,
        createdById: membershipId,
        token: 'old-unlimited',
        usesTotal: 3,
      })
    );
    const edited = await body(
      await organizer.request(`/invites/${id}`, 'PATCH', { maxUses: 5 }),
      200
    );
    expect(edited).toMatchObject({
      maxUses: 5,
      usesTotal: 3,
      usesRemaining: 2,
    });
  });
  it('serializes final-use link acceptance and performs only one join notification', async () => {
    const { organizer, invitee, stranger, eventId } = await eventFixture();
    const link = await body(
      await organizer.request(`/events/${eventId}/invites`, 'POST', {
        maxUses: 1,
      }),
      201
    );
    const responses = await Promise.all([
      invitee.request(`/invites/${link.token}/accept`, 'POST'),
      stranger.request(`/invites/${link.token}/accept`, 'POST'),
    ]);
    expect(responses.map(r => r.status).sort()).toEqual([200, 409]);
    const links = await body(
      await organizer.request(`/events/${eventId}/invites`, 'GET'),
      200
    );
    expect(links[0].usesRemaining).toBe(0);
    const header = await organizer.auth.query(
      api.events.queries.getEventHeader,
      { eventId }
    );
    expect(header.event.memberCount).toBe(2);
    const notifications = await organizer.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notifications.notifications.filter(n => n.type === 'USER_JOINED')
    ).toHaveLength(1);
  });
  it('queues email once across concurrent creation and pending-send retries', async () => {
    const { organizer, eventId } = await eventFixture();
    const id = newRequestId();
    const payload = { invites: [{ email: 'test@example.com' }] };
    const responses = await Promise.all([
      organizer.request(
        `/events/${eventId}/invites/email`,
        'POST',
        payload,
        id
      ),
      organizer.request(
        `/events/${eventId}/invites/email`,
        'POST',
        payload,
        id
      ),
    ]);
    const first = await body(responses[0], 201);
    expect(first).toMatchObject({ createdCount: 1, queuedCount: 1 });
    expect(await body(responses[1], 201)).toEqual(first);
    await body(
      await organizer.request(`/events/${eventId}/invites/email`, 'POST', {
        invites: [{ email: 'second@example.com' }],
        send: false,
      }),
      201
    );
    const queued = await Promise.all([
      organizer.request(
        `/events/${eventId}/invites/send-pending`,
        'POST',
        undefined,
        newRequestId()
      ),
      organizer.request(
        `/events/${eventId}/invites/send-pending`,
        'POST',
        undefined,
        newRequestId()
      ),
    ]);
    const counts = await Promise.all(
      queued.map(async response => (await body(response, 200)).queuedCount)
    );
    expect(counts.sort()).toEqual([0, 1]);
    const jobs = await organizer.t.run(ctx =>
      ctx.db.system.query('_scheduled_functions').collect()
    );
    expect(
      jobs.filter(job => job.name.includes('sendInviteEmails'))
    ).toHaveLength(2);
  });
  it('enforces top-level key scope as well as event permission for invitation operations', async () => {
    const { organizer, invitee, eventId } = await eventFixture();
    const link = await body(
      await organizer.request(`/events/${eventId}/invites`, 'POST', {}),
      201
    );
    await organizer.t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'apikey',
        where: [{ field: '_id', value: organizer.keyId }],
        update: { permissions: JSON.stringify({ events: ['read'] }) },
      },
    });
    expect(
      (await organizer.request(`/events/${eventId}/invites`, 'GET')).status
    ).toBe(200);
    expect(
      (await organizer.request(`/events/${eventId}/invites`, 'POST', {})).status
    ).toBe(403);
    expect(
      (await organizer.request(`/invites/${link.id}`, 'DELETE')).status
    ).toBe(403);
    await organizer.t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'apikey',
        where: [{ field: '_id', value: invitee.keyId }],
        update: { permissions: JSON.stringify({ invites: ['read'] }) },
      },
    });
    expect(
      (await invitee.request(`/invites/${link.token}`, 'GET')).status
    ).toBe(200);
    expect(
      (await invitee.request(`/invites/${link.token}/accept`, 'POST')).status
    ).toBe(403);
  });
});

describe('Invitation recovery after time and identity changes', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('replays before validating now-expired payload and rejects the same key after row cleanup', async () => {
    const { organizer, eventId } = await eventFixture();
    const id = newRequestId();
    const payload = { expiresAt: new Date(Date.now() + 60000).toISOString() };
    const first = await body(
      await organizer.request(
        `/events/${eventId}/invites`,
        'POST',
        payload,
        id
      ),
      201
    );
    vi.setSystemTime(Date.now() + 120000);
    expect(
      await body(
        await organizer.request(
          `/events/${eventId}/invites`,
          'POST',
          payload,
          id
        ),
        201
      )
    ).toEqual(first);
    const keyRow = await organizer.t.run(ctx =>
      ctx.db
        .query('inviteCreationRequests')
        .withIndex('by_userId_and_operation_and_requestId', q =>
          q
            .eq('userId', organizer.user._id)
            .eq('operation', 'invites.link')
            .eq('requestId', id)
        )
        .unique()
    );
    vi.setSystemTime(Date.now() + 86400000);
    await organizer.t.mutation(internal.invites.rest.expireRequest, {
      requestRowId: keyRow!._id,
    });
    expect(
      (
        await organizer.request(
          `/events/${eventId}/invites`,
          'POST',
          payload,
          id
        )
      ).status
    ).toBe(409);
    expect(await organizer.t.run(ctx => ctx.db.get(keyRow!._id))).toBeNull();
  });
  it('binds creation keys to identity while preserving current event permission on replay', async () => {
    const { organizer, invitee, eventId } = await eventFixture();
    const id = newRequestId();
    const joining = await body(
      await organizer.request(`/events/${eventId}/invites`, 'POST', {}),
      201
    );
    await body(
      await invitee.request(`/invites/${joining.token}/accept`, 'POST'),
      200
    );
    await organizer.t.run(ctx =>
      ctx.db.patch(eventId, { permissions: { inviteMembers: 'EVERYONE' } })
    );
    const first = await body(
      await organizer.request(
        `/events/${eventId}/invites`,
        'POST',
        { name: 'A' },
        id
      ),
      201
    );
    const other = await body(
      await invitee.request(
        `/events/${eventId}/invites`,
        'POST',
        { name: 'B' },
        id
      ),
      201
    );
    expect(other.id).not.toBe(first.id);
    await organizer.t.run(ctx =>
      ctx.db.patch(eventId, { permissions: { inviteMembers: 'ORGANIZER' } })
    );
    expect(
      (
        await invitee.request(
          `/events/${eventId}/invites`,
          'POST',
          { name: 'B' },
          id
        )
      ).status
    ).toBe(403);
  });
  it('revocation removes token metadata from app, both REST versions and OG', async () => {
    const { organizer, invitee, eventId } = await eventFixture();
    const link = await body(
      await organizer.request(`/events/${eventId}/invites`, 'POST', {}),
      201
    );
    expect(
      (await organizer.request(`/invites/${link.id}`, 'DELETE')).status
    ).toBe(204);
    expect(
      await invitee.auth.query(api.invites.queries.getInviteByToken, {
        token: link.token,
      })
    ).toBeNull();
    expect(
      await organizer.t.query(
        internal.api.v1.internal.invites.getInviteOgMeta,
        { token: link.token }
      )
    ).toBeNull();
    expect(
      (await invitee.request(`/invites/${link.token}`, 'GET')).status
    ).toBe(404);
    expect(
      (
        await organizer.t.fetch(`/api/v1/invites/${link.token}`, {
          headers: { 'x-api-key': invitee.rawKey },
        })
      ).status
    ).toBe(404);
  });
});

describe('Username invitation pagination', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('continues sent and received pages while binding recipient, event and status', async () => {
    const { organizer, invitee, stranger, eventId } = await eventFixture();
    const secondEvent = await body(
      await organizer.request('/events', 'POST', { title: 'Second' }),
      201
    );
    for (const targetEvent of [eventId, secondEvent.eventId]) {
      await body(
        await organizer.request(
          `/events/${targetEvent}/member-invites`,
          'POST',
          { username: 'invited-user' }
        ),
        201
      );
    }
    await body(
      await organizer.request(`/events/${eventId}/member-invites`, 'POST', {
        username: 'stranger-user',
      }),
      201
    );
    const received = await body(
      await invitee.request('/member-invites?pagination=cursor&limit=1', 'GET'),
      200
    );
    expect(received.items).toHaveLength(1);
    expect(received.nextCursor).toBeTruthy();
    const receivedCursor = encodeURIComponent(received.nextCursor);
    const receivedNext = await body(
      await invitee.request(
        `/member-invites?pagination=cursor&limit=1&cursor=${receivedCursor}`,
        'GET'
      ),
      200
    );
    expect(receivedNext.items).toHaveLength(1);
    // A full final page may advertise an empty terminal page (Convex cursor contract).
    if (receivedNext.nextCursor) {
      const terminal = await body(
        await invitee.request(
          `/member-invites?pagination=cursor&limit=1&cursor=${encodeURIComponent(receivedNext.nextCursor)}`,
          'GET'
        ),
        200
      );
      expect(terminal).toEqual({ items: [], nextCursor: null });
    }
    expect(receivedNext.items[0].inviteId).not.toBe(received.items[0].inviteId);
    expect(
      (
        await stranger.request(
          `/member-invites?pagination=cursor&limit=1&cursor=${receivedCursor}`,
          'GET'
        )
      ).status
    ).toBe(400);
    expect(
      (
        await invitee.request(
          `/member-invites?pagination=cursor&limit=1&status=all&cursor=${receivedCursor}`,
          'GET'
        )
      ).status
    ).toBe(400);
    const sent = await body(
      await organizer.request(
        `/events/${eventId}/member-invites?pagination=cursor&limit=1`,
        'GET'
      ),
      200
    );
    expect(sent.items).toHaveLength(1);
    expect(sent.nextCursor).toBeTruthy();
    const sentCursor = encodeURIComponent(sent.nextCursor);
    const sentNext = await body(
      await organizer.request(
        `/events/${eventId}/member-invites?pagination=cursor&limit=1&cursor=${sentCursor}`,
        'GET'
      ),
      200
    );
    expect(sentNext.items).toHaveLength(1);
    if (sentNext.nextCursor) {
      const terminal = await body(
        await organizer.request(
          `/events/${eventId}/member-invites?pagination=cursor&limit=1&cursor=${encodeURIComponent(sentNext.nextCursor)}`,
          'GET'
        ),
        200
      );
      expect(terminal).toEqual({ items: [], nextCursor: null });
    }
    expect(sentNext.items[0].inviteId).not.toBe(sent.items[0].inviteId);
    expect(
      (
        await organizer.request(
          `/events/${secondEvent.eventId}/member-invites?pagination=cursor&limit=1&cursor=${sentCursor}`,
          'GET'
        )
      ).status
    ).toBe(400);
    expect(
      (
        await organizer.request(
          `/events/${eventId}/member-invites?pagination=cursor&limit=1&status=PENDING&cursor=${sentCursor}`,
          'GET'
        )
      ).status
    ).toBe(400);
    expect(
      (
        await invitee.request(
          `/events/${eventId}/member-invites?pagination=cursor&limit=1&cursor=${sentCursor}`,
          'GET'
        )
      ).status
    ).toBe(403);
  });
});
