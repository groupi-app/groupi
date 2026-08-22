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

  const userId = 'rest-api-user';
  const rawApiKey = 'grp_test_rest_api_key_123456789';
  const now = Date.now();

  await t.run(ctx => ctx.db.insert('persons', { userId }));
  await t.mutation(components.betterAuth.adapter.create, {
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

  return { t, rawApiKey };
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
