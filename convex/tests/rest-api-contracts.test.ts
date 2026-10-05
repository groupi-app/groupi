import { describe, expect, it, vi } from 'vitest';
import type { ActionCtx } from '../_generated/server';
import { components } from '../_generated/api';
import { createApiV1App } from '../api/v1';
import { createApiV2App } from '../api/v2';
import betterAuthSchema from '../betterAuth/schema';
import { createTestInstance } from './test_helpers';

const betterAuthModules = import.meta.glob('../betterAuth/**/*.ts');

const eventSummary = {
  id: 'event-1',
  title: 'Team Offsite',
  description: 'Annual event',
  location: 'Mountain View',
  imageUrl: null,
  chosenDateTime: null,
  chosenEndDateTime: null,
  createdAt: 1_704_067_200_000,
  updatedAt: 1_704_067_200_000,
  memberCount: 2,
  userRole: 'ORGANIZER',
  userRsvpStatus: 'YES',
};

function mockActionCtx(
  runQuery: ReturnType<typeof vi.fn>,
  runMutation = vi.fn()
): ActionCtx {
  return { runQuery, runMutation } as unknown as ActionCtx;
}

async function hashApiKey(rawApiKey: string) {
  const data = new TextEncoder().encode(rawApiKey);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createAuthenticatedRestTestInstance() {
  const t = createTestInstance();
  t.registerComponent('betterAuth', betterAuthSchema, betterAuthModules);

  const rawApiKey = 'grp_test_rest_api_key_123456789';
  const now = Date.now();

  const user = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: {
        name: 'REST user',
        email: 'rest@example.com',
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const userId = user._id;
  const personId = await t.run(ctx => ctx.db.insert('persons', { userId }));
  const key = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        createdAt: now,
        enabled: true,
        key: await hashApiKey(rawApiKey),
        updatedAt: now,
        userId,
      },
    },
  });

  return { t, rawApiKey, personId, userId, keyId: key._id };
}

describe('REST API version contracts', () => {
  it('registers both public API versions with the Convex HTTP router', async () => {
    const t = createTestInstance();

    const v1Response = await t.fetch('/api/v1/health');
    const v2Response = await t.fetch('/api/v2/health');

    expect(v1Response.status).toBe(200);
    await expect(v1Response.json()).resolves.toEqual({
      status: 'ok',
      version: '1.0.0',
    });
    expect(v2Response.status).toBe(200);
    await expect(v2Response.json()).resolves.toEqual({
      status: 'ok',
      version: '2.0.0',
      capabilities: {
        groups: { version: 1, announcements: 1 },
        groupInvites: { version: 1 },
        groupModeration: { version: 1 },
        groupQuestionnaire: { version: 2 },
        groupApplications: { version: 1 },
        groupTransfers: { version: 1, retirement: true },
        eventTransfers: { version: 1 },
        eventApplications: { version: 1 },
        discussion: { version: 1 },
        eventWrites: { version: 1 },
        eventManagement: { version: 1, pendingRsvpJoin: true },
        eventAdmission: { version: 1 },
        socialWrites: { version: 1 },
        addonConfiguration: { version: 1 },
        addonParticipation: { version: 1 },
        addonAuthoring: { version: 1 },
        imageWrites: { version: 1 },
        discordGuilds: { version: 1 },
        notificationControls: { version: 1 },
        attendanceWrites: { version: 1 },
        inviteWrites: { version: 1, retentionMs: 86400000 },
        inviteLists: { version: 2, retentionMs: 86400000 },
        eventCreationIdempotency: { version: 1, retentionMs: 86400000 },
      },
    });
  });

  it('preserves the v1 success envelope for collection responses', async () => {
    const ctx = mockActionCtx(
      vi.fn().mockResolvedValue({ events: [eventSummary] })
    );
    const app = createApiV1App(ctx, 'user-1', 'person-1');

    const response = await app.request('/events');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: [eventSummary],
    });
  });

  it('returns v2 collection data without a success envelope', async () => {
    const ctx = mockActionCtx(
      vi.fn().mockResolvedValue({ events: [eventSummary] })
    );
    const app = createApiV2App(ctx, 'user-1', 'person-1');

    const response = await app.request('/events');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([eventSummary]);
  });

  it.each([
    {
      name: 'missing',
      headers: undefined,
      message: 'Missing API key. Include x-api-key header with your request.',
    },
    {
      name: 'invalid',
      headers: { 'x-api-key': 'invalid' },
      message: 'Invalid API key format.',
    },
  ])(
    'returns the v2 error contract for a $name API key',
    async ({ headers, message }) => {
      const t = createTestInstance();

      const response = await t.fetch('/api/v2/events', { headers });

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message,
        },
      });
    }
  );

  it('mounts the Friends route through the Convex v2 HTTP handler', async () => {
    const { t, rawApiKey } = await createAuthenticatedRestTestInstance();

    const response = await t.fetch('/api/v2/friends', {
      headers: { 'x-api-key': rawApiKey },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
  });

  it('returns the v2 forbidden contract when event authorization fails', async () => {
    const runQuery = vi.fn().mockResolvedValue(null);
    const runMutation = vi.fn();
    const app = createApiV2App(
      mockActionCtx(runQuery, runMutation),
      'user-1',
      'person-1'
    );

    const response = await app.request('/events/event-1', {
      method: 'DELETE',
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'FORBIDDEN',
        message: 'You are not a member of this event.',
      },
    });
    expect(runMutation).not.toHaveBeenCalled();
  });

  it('returns a direct v2 response from the Friends route group', async () => {
    const friends = [
      {
        friendshipId: 'friendship-1',
        personId: 'person-2',
        userId: 'user-2',
        name: 'Friend Two',
        username: 'friend-two',
        image: null,
        lastSeen: null,
      },
    ];
    const runQuery = vi.fn().mockResolvedValue(friends);
    const app = createApiV2App(mockActionCtx(runQuery), 'user-1', 'person-1');

    const response = await app.request('/friends');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(friends);
    expect(runQuery).toHaveBeenCalledWith(expect.anything(), {
      personId: 'person-1',
    });
  });

  it('preserves the v1 JSON confirmation for deletes', async () => {
    const runQuery = vi.fn().mockResolvedValue({
      membershipId: 'membership-1',
      role: 'ORGANIZER',
    });
    const runMutation = vi.fn().mockResolvedValue({ success: true });
    const app = createApiV1App(
      mockActionCtx(runQuery, runMutation),
      'user-1',
      'person-1'
    );

    const response = await app.request('/events/event-1', {
      method: 'DELETE',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { message: 'Event deleted successfully' },
    });
    expect(runMutation).toHaveBeenCalledOnce();
  });

  it('returns an empty 204 response for v2 deletes', async () => {
    const runQuery = vi.fn().mockResolvedValue({
      membershipId: 'membership-1',
      role: 'ORGANIZER',
    });
    const runMutation = vi.fn().mockResolvedValue({ success: true });
    const app = createApiV2App(
      mockActionCtx(runQuery, runMutation),
      'user-1',
      'person-1'
    );

    const response = await app.request('/events/event-1', {
      method: 'DELETE',
    });

    expect(response.status).toBe(204);
    await expect(response.text()).resolves.toBe('');
    expect(runMutation).toHaveBeenCalledOnce();
  });

  it('normalizes malformed v2 request bodies', async () => {
    const runQuery = vi.fn();
    const runMutation = vi.fn();
    const app = createApiV2App(
      mockActionCtx(runQuery, runMutation),
      'user-1',
      'person-1'
    );

    const response = await app.request('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: expect.any(String),
      },
    });
    expect(runQuery).not.toHaveBeenCalled();
    expect(runMutation).not.toHaveBeenCalled();
  });

  it('rejects duplicate availability IDs before running the mutation', async () => {
    const runQuery = vi.fn();
    const runMutation = vi.fn();
    const app = createApiV2App(
      mockActionCtx(runQuery, runMutation),
      'user-1',
      'person-1'
    );

    const response = await app.request('/events/event-1/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responses: [
          { potentialDateTimeId: 'date-1', status: 'YES' },
          { potentialDateTimeId: 'date-1', status: 'NO' },
        ],
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message:
          'Each potential date time can only appear once per availability submission',
      },
    });
    expect(runQuery).not.toHaveBeenCalled();
    expect(runMutation).not.toHaveBeenCalled();
  });

  it.each(['/api/v2', '/api/v2/does-not-exist'])(
    'returns the standard v2 error for unmatched mounted route %s',
    async path => {
      const { t, rawApiKey } = await createAuthenticatedRestTestInstance();

      const response = await t.fetch(path, {
        headers: { 'x-api-key': rawApiKey },
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
        },
      });
    }
  );

  it('publishes the preserved v1 OpenAPI document', async () => {
    const response = await createApiV1App().request('/openapi.json');

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      servers: [{ url: '/api/v1', description: 'API v1' }],
      paths: {
        '/events/{eventId}': {
          delete: {
            responses: {
              200: { description: 'Event deleted' },
            },
          },
        },
      },
    });
  });

  it('publishes the v2 OpenAPI document with the new delete contract', async () => {
    const response = await createApiV2App().request('/openapi.json');

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      openapi: '3.1.0',
      info: { version: '2.0.0' },
      servers: [{ url: '/api/v2', description: 'API v2' }],
      paths: {
        '/events/{eventId}': {
          delete: {
            responses: {
              204: { description: 'Event deleted successfully' },
            },
          },
        },
      },
    });
  });
});

describe('authenticated event browsing', () => {
  it('pages only the caller’s events and preserves the legacy array response', async () => {
    const { t, rawApiKey, personId } =
      await createAuthenticatedRestTestInstance();
    await t.run(async ctx => {
      const otherPerson = await ctx.db.insert('persons', {
        userId: 'another-user',
      });
      for (let i = 0; i < 24; i++) {
        const owner = i < 23 ? personId : otherPerson;
        const eventId = await ctx.db.insert('events', {
          title: `Event ${i}`,
          creatorId: owner,
          createdAt: i,
          updatedAt: i,
          timezone: 'UTC',
          potentialDateTimes: [],
        });
        await ctx.db.insert('memberships', {
          personId: owner,
          eventId,
          role: 'ORGANIZER',
          rsvpStatus: 'YES',
        });
      }
    });
    const headers = { 'x-api-key': rawApiKey };
    const first = await t.fetch('/api/v2/events?pagination=cursor', {
      headers,
    });
    expect(first.status).toBe(200);
    const page = await first.json();
    expect(page.items).toHaveLength(20);
    expect(page.nextCursor).toEqual(expect.any(String));
    const second = await t.fetch(
      `/api/v2/events?pagination=cursor&cursor=${encodeURIComponent(page.nextCursor)}`,
      { headers }
    );
    const last = await second.json();
    expect(last.items).toHaveLength(3);
    expect(last.nextCursor).toBeNull();
    expect(
      new Set([...page.items, ...last.items].map(event => event.id)).size
    ).toBe(23);
    expect(
      [...page.items, ...last.items].map(event => event.title)
    ).not.toContain('Event 23');
    const legacy = await t.fetch('/api/v2/events', { headers });
    expect(await legacy.json()).toHaveLength(23);
  });
});

describe('REST API key restrictions', () => {
  it('rejects a banned account even when its API key and person still exist', async () => {
    const { t, rawApiKey, userId } =
      await createAuthenticatedRestTestInstance();
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: userId }],
        update: { banned: true },
      },
    });
    const response = await t.fetch('/api/v2/events?pagination=cursor', {
      headers: { 'x-api-key': rawApiKey },
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });
});

describe('scoped API keys', () => {
  it('limits a key to explicit resource actions without replacing membership checks', async () => {
    const { t, rawApiKey, keyId } = await createAuthenticatedRestTestInstance();
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'apikey',
        where: [{ field: '_id', value: keyId }],
        update: { permissions: JSON.stringify({ events: ['read'] }) },
      },
    });
    const headers = {
      'x-api-key': rawApiKey,
      'Content-Type': 'application/json',
    };
    expect(
      (await t.fetch('/api/v2/events?pagination=cursor', { headers })).status
    ).toBe(200);
    expect((await t.fetch('/api/v2/friends', { headers })).status).toBe(403);
    expect(
      (
        await t.fetch('/api/v2/events', {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: 'Disallowed write' }),
        })
      ).status
    ).toBe(403);
  });
});

describe('API key usage limits', () => {
  it('consumes a limited-use key and rejects further requests', async () => {
    const { t, rawApiKey, keyId } = await createAuthenticatedRestTestInstance();
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'apikey',
        where: [{ field: '_id', value: keyId }],
        update: { remaining: 1 },
      },
    });
    const headers = { 'x-api-key': rawApiKey };
    expect(
      (await t.fetch('/api/v2/events?pagination=cursor', { headers })).status
    ).toBe(200);
    const exhausted = await t.fetch('/api/v2/events?pagination=cursor', {
      headers,
    });
    expect(exhausted.status).toBe(429);
    expect(await exhausted.json()).toMatchObject({
      error: { code: 'RATE_LIMITED' },
    });
  });
});

describe('API key rate limits', () => {
  it('enforces a key’s request window and returns an actionable retry delay', async () => {
    const { t, rawApiKey, keyId } = await createAuthenticatedRestTestInstance();
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'apikey',
        where: [{ field: '_id', value: keyId }],
        update: {
          rateLimitEnabled: true,
          rateLimitMax: 1,
          rateLimitTimeWindow: 60000,
        },
      },
    });
    const headers = { 'x-api-key': rawApiKey };
    expect(
      (await t.fetch('/api/v2/events?pagination=cursor', { headers })).status
    ).toBe(200);
    const limited = await t.fetch('/api/v2/events?pagination=cursor', {
      headers,
    });
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('Retry-After'))).toBeGreaterThan(0);
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'apikey',
        where: [{ field: '_id', value: keyId }],
        update: { lastRequest: Date.now() - 60001 },
      },
    });
    expect(
      (await t.fetch('/api/v2/events?pagination=cursor', { headers })).status
    ).toBe(200);
  });
});

describe('authenticated browsing failures', () => {
  it.each([
    '?pagination=cursor&limit=0',
    '?pagination=cursor&limit=101',
    '?pagination=cursor&limit=1.5',
    '?pagination=cursor&limit=oops',
    '?pagination=cursor&cursor=bad-cursor',
    '?pagination=cursor&cursor=',
    '?pagination=offset',
    '?limit=2',
    '?cursor=unexpected',
  ])(
    'rejects invalid pagination %s without exposing server errors',
    async query => {
      const { t, rawApiKey } = await createAuthenticatedRestTestInstance();
      const response = await t.fetch(`/api/v2/events${query}`, {
        headers: { 'x-api-key': rawApiKey },
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: 'VALIDATION_ERROR' },
      });
    }
  );

  it('returns empty pages and accepts the maximum page size', async () => {
    const { t, rawApiKey } = await createAuthenticatedRestTestInstance();
    const response = await t.fetch(
      '/api/v2/events?pagination=cursor&limit=100',
      { headers: { 'x-api-key': rawApiKey } }
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [], nextCursor: null });
  });

  it('enforces event membership and minimum roles with real authenticated requests', async () => {
    const { t, rawApiKey, personId } =
      await createAuthenticatedRestTestInstance();
    const { accessible, inaccessible } = await t.run(async ctx => {
      const other = await ctx.db.insert('persons', { userId: 'outsider' });
      const data = {
        title: 'Private event',
        creatorId: other,
        createdAt: 0,
        updatedAt: 0,
        timezone: 'UTC',
        potentialDateTimes: [],
      };
      const accessible = await ctx.db.insert('events', data);
      const inaccessible = await ctx.db.insert('events', data);
      await ctx.db.insert('memberships', {
        personId,
        eventId: accessible,
        role: 'ATTENDEE',
        rsvpStatus: 'PENDING',
      });
      return { accessible, inaccessible };
    });
    const headers = { 'x-api-key': rawApiKey };
    const details = await t.fetch(`/api/v2/events/${accessible}`, { headers });
    expect(details.status).toBe(200);
    expect(await details.json()).toMatchObject({
      id: accessible,
      title: 'Private event',
    });
    expect(
      (await t.fetch(`/api/v2/events/${inaccessible}`, { headers })).status
    ).toBe(403);
    expect(
      (
        await t.fetch(`/api/v2/events/${accessible}`, {
          method: 'DELETE',
          headers,
        })
      ).status
    ).toBe(403);
    expect(
      (await t.fetch(`/api/v2/events/${accessible}`, { headers })).status
    ).toBe(200);
  });

  it.each([
    ['disabled', { enabled: false }],
    ['expired', { expiresAt: 1 }],
    ['zero expiration', { expiresAt: 0 }],
  ])('rejects a %s key', async (_name, update) => {
    const { t, rawApiKey, keyId } = await createAuthenticatedRestTestInstance();
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'apikey',
        where: [{ field: '_id', value: keyId }],
        update,
      },
    });
    const response = await t.fetch('/api/v2/events?pagination=cursor', {
      headers: { 'x-api-key': rawApiKey },
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it.each(['apikey', 'user', 'person'] as const)(
    'rejects a deleted %s',
    async model => {
      const { t, rawApiKey, keyId, userId, personId } =
        await createAuthenticatedRestTestInstance();
      if (model === 'person') await t.run(ctx => ctx.db.delete(personId));
      else
        await t.mutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model,
            where: [
              { field: '_id', value: model === 'apikey' ? keyId : userId },
            ],
          },
        });
      const response = await t.fetch('/api/v2/events?pagination=cursor', {
        headers: { 'x-api-key': rawApiKey },
      });
      expect(response.status).toBe(401);
    }
  );

  it.each(['{}', '{', 'null', '[]', '{"events":"read"}', '{"events":[42]}'])(
    'fails closed for invalid or non-granting scope %s',
    async permissions => {
      const { t, rawApiKey, keyId } =
        await createAuthenticatedRestTestInstance();
      await t.mutation(components.betterAuth.adapter.updateOne, {
        input: {
          model: 'apikey',
          where: [{ field: '_id', value: keyId }],
          update: { permissions },
        },
      });
      const response = await t.fetch('/api/v2/events?pagination=cursor', {
        headers: { 'x-api-key': rawApiKey },
      });
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        error: { code: 'FORBIDDEN' },
      });
    }
  );

  it('allows an expired ban and replenishes a refillable key once the interval passes', async () => {
    const { t, rawApiKey, keyId, userId } =
      await createAuthenticatedRestTestInstance();
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: userId }],
        update: { banned: true, banExpires: Date.now() - 1000 },
      },
    });
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'apikey',
        where: [{ field: '_id', value: keyId }],
        update: {
          remaining: 0,
          refillInterval: 60000,
          refillAmount: 1,
          lastRefillAt: Date.now() - 60001,
        },
      },
    });
    const headers = { 'x-api-key': rawApiKey };
    expect(
      (await t.fetch('/api/v2/events?pagination=cursor', { headers })).status
    ).toBe(200);
    expect(
      (await t.fetch('/api/v2/events?pagination=cursor', { headers })).status
    ).toBe(429);
  });
});
