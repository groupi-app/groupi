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

async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return status === 204 ? null : response.json();
}
describe('Authenticated social workflows', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('honors app privacy settings before sending requests', async () => {
    const sender = await setup();
    const recipient = await actor(sender.t, 'private-recipient');
    await recipient.auth.mutation(api.settings.mutations.savePrivacySettings, {
      allowFriendRequestsFrom: 'NO_ONE',
      allowEventInvitesFrom: 'EVERYONE',
    });
    await body(
      await sender.request('/friends/requests', 'POST', {
        personId: recipient.personId,
      }),
      400
    );
  });
  it('blocks requests and removes friendships through the authenticated API', async () => {
    const a = await setup();
    const b = await actor(a.t, 'social-b');
    const c = await actor(a.t, 'social-c');
    const request = await body(
      await a.request('/friends/requests', 'POST', { personId: b.personId })
    );
    await body(
      await c.request(
        `/friends/requests/${request.friendshipId}/accept`,
        'POST'
      ),
      403
    );
    await body(
      await b.request(
        `/friends/requests/${request.friendshipId}/accept`,
        'POST'
      )
    );
    await body(await a.request(`/blocks/${b.personId}`, 'POST'));
    expect(await body(await a.request('/friends', 'GET'))).toEqual([]);
    await body(
      await b.request('/friends/requests', 'POST', { personId: a.personId }),
      400
    );
    expect(await body(await a.request(`/blocks/${b.personId}`, 'GET'))).toEqual(
      { blockedByMe: true, blockedByThem: false }
    );
    await body(await a.request(`/blocks/${b.personId}`, 'DELETE'), 204);
    expect(await body(await a.request(`/blocks/${b.personId}`, 'GET'))).toEqual(
      { blockedByMe: false, blockedByThem: false }
    );
    await body(
      await a.request('/friends/requests', 'POST', { personId: a.personId }),
      400
    );
    const next = await body(
      await a.request('/friends/requests', 'POST', { personId: b.personId })
    );
    await body(
      await a.request('/friends/requests', 'POST', { personId: b.personId }),
      400
    );
    await body(
      await b.request(`/friends/requests/${next.friendshipId}/decline`, 'POST')
    );
    expect(
      (
        await body(
          await a.request(
            '/friends/requests/outgoing?pagination=cursor&limit=1',
            'GET'
          )
        )
      ).items
    ).toEqual([]);
    expect((await a.t.fetch('/api/v2/blocks')).status).toBe(401);
  });
  it('continues bounded friendship pages across both directions and binds cursors to identity and collection', async () => {
    const a = await setup();
    const b = await actor(a.t, 'page-b');
    const c = await actor(a.t, 'page-c');
    const first = await body(
      await a.request('/friends/requests', 'POST', { personId: b.personId })
    );
    await body(
      await b.request(`/friends/requests/${first.friendshipId}/accept`, 'POST')
    );
    const second = await body(
      await c.request('/friends/requests', 'POST', { personId: a.personId })
    );
    await body(
      await a.request(`/friends/requests/${second.friendshipId}/accept`, 'POST')
    );
    const page = await body(
      await a.request('/friends?pagination=cursor&limit=1', 'GET')
    );
    expect(page.items.map((x: { personId: string }) => x.personId)).toEqual([
      b.personId,
    ]);
    expect(page.nextCursor).toBeTypeOf('string');
    let continuation = page.nextCursor;
    const remaining: string[] = [];
    while (continuation) {
      const next = await body(
        await a.request(
          `/friends?pagination=cursor&limit=1&cursor=${encodeURIComponent(continuation)}`,
          'GET'
        )
      );
      expect(next.items.length).toBeLessThanOrEqual(1);
      remaining.push(
        ...next.items.map((x: { personId: string }) => x.personId)
      );
      continuation = next.nextCursor;
    }
    expect(remaining).toEqual([c.personId]);
    await body(
      await b.request(
        `/friends?pagination=cursor&cursor=${encodeURIComponent(page.nextCursor)}`,
        'GET'
      ),
      400
    );
    await body(
      await a.request(
        `/blocks?pagination=cursor&cursor=${encodeURIComponent(page.nextCursor)}`,
        'GET'
      ),
      400
    );
    await body(
      await a.request('/friends?pagination=cursor&limit=1garbage', 'GET'),
      400
    );
    await body(
      await a.request('/friends?pagination=cursor&cursor=invalid', 'GET'),
      400
    );
    expect((await body(await a.request('/friends', 'GET'))).length).toBe(2);
    const notifications = await b.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notifications.notifications.some(
        (n: { type: string }) => n.type === 'FRIEND_REQUEST_RECEIVED'
      )
    ).toBe(true);
    const senderNotifications = await a.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      senderNotifications.notifications.some(
        (n: { type: string }) => n.type === 'FRIEND_REQUEST_ACCEPTED'
      )
    ).toBe(true);
  });
  it('enforces owner-only cancellation and removal and does not resurrect declined duplicates', async () => {
    const a = await setup();
    const b = await actor(a.t, 'removal-b');
    const c = await actor(a.t, 'removal-c');
    const first = await body(
      await a.request('/friends/requests', 'POST', { personId: b.personId })
    );
    await body(
      await b.request(`/friends/requests/${first.friendshipId}`, 'DELETE'),
      403
    );
    await body(
      await c.request(
        `/friends/requests/${first.friendshipId}/decline`,
        'POST'
      ),
      403
    );
    await body(
      await a.request(`/friends/requests/${first.friendshipId}`, 'DELETE'),
      204
    );
    const next = await body(
      await a.request('/friends/requests', 'POST', { personId: b.personId })
    );
    await body(
      await b.request(`/friends/requests/${next.friendshipId}/decline`, 'POST')
    );
    const resent = await body(
      await a.request('/friends/requests', 'POST', { personId: b.personId })
    );
    await body(
      await b.request(`/friends/requests/${resent.friendshipId}/accept`, 'POST')
    );
    await body(
      await b.request('/friends/requests', 'POST', { personId: a.personId }),
      400
    );
    await body(
      await c.request(`/friends/${resent.friendshipId}`, 'DELETE'),
      403
    );
    await body(
      await a.request(`/friends/${resent.friendshipId}`, 'DELETE'),
      204
    );
    expect(
      await body(await a.request(`/friends/status/${b.personId}`, 'GET'))
    ).toEqual({ status: 'none', friendshipId: null });
    await body(
      await a.request('/friends/requests', 'POST', { personId: 'malformed' }),
      404
    );
    await body(await a.request('/blocks/malformed', 'POST'), 404);
    await body(await a.request('/blocks/malformed', 'GET'), 404);
  });
});
