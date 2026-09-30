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
describe('Notification controls REST parity', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('paginates only this identity and unread mode while retaining legacy arrays', async () => {
    const owner = await setup();
    const other = await actor(owner.t, 'notification-stranger');
    await owner.t.run(async ctx => {
      for (let i = 0; i < 25; i++)
        await ctx.db.insert('notifications', {
          personId: owner.personId,
          type: 'EVENT_EDITED',
          read: i === 0,
        });
      await ctx.db.insert('notifications', {
        personId: other.personId,
        type: 'EVENT_EDITED',
        read: false,
      });
    });
    const first = await (
      await owner.request('/notifications?pagination=cursor&unread=true', 'GET')
    ).json();
    expect(first.items).toHaveLength(20);
    expect(first.items.every((item: { read: boolean }) => !item.read)).toBe(
      true
    );
    const second = await (
      await owner.request(
        `/notifications?pagination=cursor&unread=true&cursor=${encodeURIComponent(first.nextCursor)}`,
        'GET'
      )
    ).json();
    expect(second.items).toHaveLength(4);
    expect(second.nextCursor).toBeNull();
    expect(new Set([...first.items, ...second.items].map(n => n.id)).size).toBe(
      24
    );
    expect(
      (
        await other.request(
          `/notifications?pagination=cursor&unread=true&cursor=${encodeURIComponent(first.nextCursor)}`,
          'GET'
        )
      ).status
    ).toBe(400);
    expect(
      (
        await owner.request(
          `/notifications?pagination=cursor&cursor=${encodeURIComponent(first.nextCursor)}`,
          'GET'
        )
      ).status
    ).toBe(400);
    expect(
      await (await owner.request('/notifications', 'GET')).json()
    ).toHaveLength(25);
    expect(
      (
        await owner.request(
          '/notifications?pagination=cursor&limit=2junk',
          'GET'
        )
      ).status
    ).toBe(400);
  });
});

describe('Notification read and clear actions', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('shares read state with the app, isolates owners, and clears queued push work', async () => {
    const owner = await setup();
    const other = await actor(owner.t, 'other-owner');
    const { notificationId, deliveryId } = await owner.t.run(async ctx => {
      const notificationId = await ctx.db.insert('notifications', {
        personId: owner.personId,
        type: 'EVENT_EDITED',
        read: false,
      });
      const token = await ctx.db.insert('pushTokens', {
        personId: owner.personId,
        token: 'ExpoPushToken[test-notification-clear]',
        deviceId: 'notification-clear',
        platform: 'ios',
        active: true,
        lastRegisteredAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const deliveryId = await ctx.db.insert('pushDeliveries', {
        notificationId,
        pushTokenId: token,
        title: 'Test',
        body: 'Test',
        destination: 'notifications',
        status: 'SENDING',
        attempts: 1,
        receiptCheckAttempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { notificationId, deliveryId };
    });
    expect(
      (
        await owner.t.query(
          internal.pushNotifications.queries.resolveDeliveryJobs,
          { deliveryIds: [deliveryId], purpose: 'send' }
        )
      ).ready
    ).toHaveLength(1);
    expect(
      (await other.request(`/notifications/${notificationId}/read`, 'POST'))
        .status
    ).toBe(404);
    expect(
      (await other.request(`/notifications/${notificationId}`, 'DELETE')).status
    ).toBe(404);
    expect(
      (await owner.request(`/notifications/${notificationId}/read`, 'POST'))
        .status
    ).toBe(200);
    expect(
      await owner.auth.query(
        api.notifications.queries.getUnreadNotificationCount,
        {}
      )
    ).toEqual({ count: 0 });
    await owner.auth.mutation(
      api.notifications.mutations.markNotificationAsUnread,
      { notificationId }
    );
    expect(
      await (await owner.request('/notifications/count', 'GET')).json()
    ).toEqual({ count: 1 });
    expect(
      (await owner.request(`/notifications/${notificationId}`, 'DELETE')).status
    ).toBe(204);
    expect(
      (
        await owner.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toHaveLength(0);
    expect(
      await owner.t.query(
        internal.pushNotifications.queries.resolveDeliveryJobs,
        { deliveryIds: [deliveryId], purpose: 'send' }
      )
    ).toEqual({ ready: [], cancelled: [] });
  });
});

describe('Subscription visibility and delivery', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('shares event/post mute state with apps, suppresses delivery, and rejects nonmembers', async () => {
    const owner = await setup();
    const attendee = await actor(owner.t, 'mute-attendee');
    const outsider = await actor(owner.t, 'mute-outsider');
    const { eventId } = await (
      await owner.request('/events', 'POST', { title: 'Private event' })
    ).json();
    const membershipId = await owner.t.run(ctx =>
      ctx.db.insert('memberships', {
        eventId,
        personId: attendee.personId,
        role: 'ATTENDEE',
        rsvpStatus: 'YES',
      })
    );
    expect(
      (await outsider.request(`/muting/events/${eventId}`, 'GET')).status
    ).toBe(403);
    expect(
      (await outsider.request(`/muting/events/${eventId}`, 'POST')).status
    ).toBe(403);
    expect(
      (await attendee.request(`/muting/events/${eventId}`, 'POST')).status
    ).toBe(200);
    expect(
      await attendee.auth.query(api.muting.queries.isEventMuted, { eventId })
    ).toEqual({ isMuted: true });
    expect(
      await (await attendee.request(`/muting/events/${eventId}`, 'GET')).json()
    ).toEqual({ isMuted: true, effectiveMuted: true });
    await owner.auth.mutation(api.posts.mutations.createPost, {
      eventId,
      title: 'Silent',
      content: 'Muted post',
    });
    expect(
      await (await attendee.request('/notifications/count', 'GET')).json()
    ).toEqual({ count: 0 });
    await attendee.auth.mutation(api.muting.mutations.unmuteEvent, { eventId });
    await owner.auth.mutation(api.posts.mutations.createPost, {
      eventId,
      title: 'Delivered',
      content: 'New post',
    });
    expect(
      await (await attendee.request('/notifications/count', 'GET')).json()
    ).toEqual({ count: 1 });
    await attendee.request('/notifications', 'DELETE');
    const { postId } = await attendee.auth.mutation(
      api.posts.mutations.createPost,
      { eventId, title: 'My discussion', content: 'Replies' }
    );
    expect(
      (await attendee.request(`/muting/posts/${postId}`, 'POST')).status
    ).toBe(200);
    await owner.auth.mutation(api.replies.mutations.createReply, {
      postId,
      text: 'Quiet reply',
    });
    expect(
      await (await attendee.request('/notifications/count', 'GET')).json()
    ).toEqual({ count: 0 });
    expect(
      (await attendee.request(`/muting/posts/${postId}`, 'DELETE')).status
    ).toBe(204);
    await owner.auth.mutation(api.replies.mutations.createReply, {
      postId,
      text: 'Visible reply',
    });
    expect(
      await (await attendee.request('/notifications/count', 'GET')).json()
    ).toEqual({ count: 1 });
    await attendee.request(`/muting/events/${eventId}`, 'POST');
    expect(
      await (await attendee.request(`/muting/posts/${postId}`, 'GET')).json()
    ).toEqual({ isMuted: false, eventMuted: true, effectiveMuted: true });
    await owner.t.run(ctx => ctx.db.delete(membershipId));
    expect(
      (await attendee.request(`/muting/posts/${postId}`, 'GET')).status
    ).toBe(403);
    const muted = await (await attendee.request('/muting', 'GET')).json();
    expect(JSON.stringify(muted)).not.toContain('Private event');
  });
});

describe('Notification bulk scopes and compatibility', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('marks only own scoped notifications, preserves pending invitation history, and keeps v1 envelopes', async () => {
    const owner = await setup();
    const other = await actor(owner.t, 'scope-other');
    const { eventId } = await (
      await other.request('/events', 'POST', {
        title: 'Invitation before joining',
      })
    ).json();
    const { postId } = await other.auth.mutation(
      api.posts.mutations.createPost,
      { eventId, title: 'Thread', content: 'Content' }
    );
    await owner.t.run(async ctx => {
      await ctx.db.insert('notifications', {
        personId: owner.personId,
        type: 'EVENT_INVITE_RECEIVED',
        eventId,
        read: false,
      });
      await ctx.db.insert('notifications', {
        personId: owner.personId,
        type: 'NEW_REPLY',
        eventId,
        postId,
        read: false,
      });
      await ctx.db.insert('notifications', {
        personId: owner.personId,
        type: 'FRIEND_REQUEST_RECEIVED',
        read: false,
      });
      await ctx.db.insert('notifications', {
        personId: other.personId,
        type: 'NEW_REPLY',
        eventId,
        postId,
        read: false,
      });
    });
    const before = await (
      await owner.request('/notifications?pagination=cursor', 'GET')
    ).json();
    expect(
      before.items.find(
        (n: { type: string }) => n.type === 'EVENT_INVITE_RECEIVED'
      ).event.title
    ).toBe('Invitation before joining');
    expect(
      await (
        await owner.request(`/notifications/posts/${postId}/read`, 'POST')
      ).json()
    ).toEqual({ success: true, count: 1 });
    expect(
      await (
        await owner.request(`/notifications/events/${eventId}/read`, 'POST')
      ).json()
    ).toEqual({ success: true, count: 1 });
    expect(
      await other.auth.query(
        api.notifications.queries.getUnreadNotificationCount,
        {}
      )
    ).toEqual({ count: 1 });
    expect(
      await owner.auth.query(
        api.notifications.queries.getUnreadNotificationCount,
        {}
      )
    ).toEqual({ count: 1 });
    expect(
      (await owner.request('/notifications/read-all', 'POST')).status
    ).toBe(200);
    expect(
      await owner.auth.query(
        api.notifications.queries.getUnreadNotificationCount,
        {}
      )
    ).toEqual({ count: 0 });
    const legacy = await owner.t.fetch('/api/v1/notifications', {
      headers: { 'x-api-key': owner.rawKey },
    });
    expect(legacy.status).toBe(200);
    expect((await legacy.json()).data).toHaveLength(3);
    expect((await owner.request('/notifications', 'DELETE')).status).toBe(204);
    expect(
      (
        await owner.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toEqual([]);
    expect(
      (
        await other.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toHaveLength(1);
  });
  it('rejects unauthenticated and read-only-key writes before mutating', async () => {
    const owner = await setup();
    expect(
      (await owner.t.fetch('/api/v2/notifications?pagination=cursor')).status
    ).toBe(401);
    await owner.t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'apikey',
        where: [{ field: '_id', operator: 'eq', value: owner.keyId }],
        update: {
          permissions: JSON.stringify({
            notifications: ['read'],
            muting: ['read'],
          }),
        },
      },
    });
    expect(
      (await owner.request('/notifications?pagination=cursor', 'GET')).status
    ).toBe(200);
    expect((await owner.request('/notifications', 'DELETE')).status).toBe(403);
    expect(
      (await owner.request('/notifications/read-all', 'POST')).status
    ).toBe(403);
  });
});
