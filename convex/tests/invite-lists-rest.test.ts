import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

async function actor(
  t: ReturnType<typeof createTestInstance>,
  name: string,
  permissions?: Record<string, string[]>
) {
  const account = await createAuthAccount(t, name);
  const rawKey = `grp_invite_lists_test_${name}`;
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
        ...(permissions ? { permissions: JSON.stringify(permissions) } : {}),
      },
    },
  });
  return {
    ...account,
    request: (
      path: string,
      method = 'GET',
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
      }),
  };
}

async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await actor(t, 'rest-list-owner');
  const recipient = await actor(t, 'rest-list-recipient');
  return { t, owner, recipient };
}

describe('Authenticated Invite list REST API', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('invites the current list in one scoped request and replays after deletion without a second notification', async () => {
    const { owner, recipient } = await setup();
    const { eventId } = await (
      await owner.request('/events', 'POST', { title: 'List invitation event' })
    ).json();
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Recipients', personIds: [recipient.personId] }
    );
    const path = `/invite-lists/${list.inviteListId}/invite-to-event`;
    const requestId = `${Date.now()}.${crypto.randomUUID()}`;
    const first = await owner.request(
      path,
      'POST',
      { eventId, message: 'Join us' },
      requestId
    );
    expect(first.status).toBe(200);
    const result = await first.json();
    expect(result).toMatchObject({
      eventId,
      totalCount: 1,
      sentCount: 1,
      skippedCount: 0,
      results: [{ personId: recipient.personId, status: 'sent' }],
    });
    await owner.request(`/invite-lists/${list.inviteListId}`, 'DELETE');
    const replay = await owner.request(
      path,
      'POST',
      { eventId, message: 'Join us' },
      requestId
    );
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual(result);
    expect(
      (
        await recipient.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toHaveLength(1);
    expect(
      (
        await recipient.auth.query(
          api.eventInvites.queries.getPendingEventInvites,
          {}
        )
      )[0]
    ).toMatchObject({ role: 'ATTENDEE', message: 'Join us' });
  });
  it('partially edits and deletes owned lists with truthful receipts and shared validation', async () => {
    const { owner, recipient } = await setup();
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Before', personIds: [recipient.personId] }
    );
    const path = `/invite-lists/${list.inviteListId}`;
    const edit = await owner.request(path, 'PATCH', { name: ' After ' });
    expect(edit.status).toBe(200);
    expect(await edit.json()).toMatchObject({
      name: 'After',
      people: list.people,
    });
    for (const body of [
      {},
      { name: ' ' },
      { personIds: [] },
      { creatorId: recipient.personId },
    ]) {
      expect((await owner.request(path, 'PATCH', body)).status).toBe(400);
    }
    expect(
      (await recipient.request(path, 'PATCH', { name: 'Forged' })).status
    ).toBe(404);
    const forged = await recipient.request(path, 'DELETE');
    const missing = await recipient.request(
      '/invite-lists/nonexistent',
      'DELETE'
    );
    expect(forged.status).toBe(404);
    expect(await forged.json()).toEqual(await missing.json());
    const deleted = await owner.request(path, 'DELETE');
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toEqual({
      deleted: true,
      inviteListId: list.inviteListId,
    });
    expect((await owner.request(path)).status).toBe(404);
  });
  it('uses the API key owner and returns indistinguishable missing/other-owner detail errors', async () => {
    const { t, owner, recipient } = await setup();
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Private', personIds: [recipient.personId] }
    );
    expect(await (await recipient.request('/invite-lists')).json()).toEqual({
      items: [],
    });
    const other = await recipient.request(`/invite-lists/${list.inviteListId}`);
    const missing = await recipient.request('/invite-lists/nonexistent');
    expect(other.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(await other.json()).toEqual(await missing.json());
    const forged = await recipient.request('/invite-lists', 'POST', {
      name: 'Forged',
      personIds: [owner.personId],
      creatorId: owner.personId,
    });
    expect(forged.status).toBe(400);
    for (const path of [
      '/invite-lists',
      `/invite-lists/${list.inviteListId}`,
      '/invite-lists/people/search?q=list',
      '/invite-lists/people/friends',
    ]) {
      expect((await t.fetch(`/api/v2${path}`)).status).toBe(401);
    }
    expect(
      (
        await t.fetch('/api/v2/invite-lists', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Unauthenticated',
            personIds: [owner.personId],
          }),
        })
      ).status
    ).toBe(401);
  });
  it('enforces invite-lists read/write scopes with real API keys for every entry point', async () => {
    const { t, owner, recipient } = await setup();
    const reader = await actor(t, 'list-reader', { 'invite-lists': ['read'] });
    const writer = await actor(t, 'list-writer', { 'invite-lists': ['write'] });
    const wrong = await actor(t, 'wrong-resource', {
      friends: ['read', 'write'],
    });
    const body = { name: 'Scoped', personIds: [recipient.personId] };
    expect((await reader.request('/invite-lists', 'POST', body)).status).toBe(
      403
    );
    const created = await writer.request('/invite-lists', 'POST', body);
    expect(created.status).toBe(201);
    const { inviteListId } = await created.json();
    for (const path of [
      '/invite-lists',
      `/invite-lists/${inviteListId}`,
      '/invite-lists/people/search?q=list',
      '/invite-lists/people/friends',
    ]) {
      expect((await reader.request(path)).status).toBe(
        path === `/invite-lists/${inviteListId}` ? 404 : 200
      );
      expect((await writer.request(path)).status).toBe(403);
      expect((await wrong.request(path)).status).toBe(403);
    }
    expect((await wrong.request('/invite-lists', 'POST', body)).status).toBe(
      403
    );
    expect(
      (await owner.auth.query(api.inviteLists.queries.listInviteLists, {}))
        .items
    ).toHaveLength(0);
    const { eventId } = await (
      await owner.request('/events', 'POST', { title: 'Scoped invitations' })
    ).json();
    await t.run(async ctx => {
      await ctx.db.insert('memberships', {
        personId: writer.personId,
        eventId,
        role: 'ORGANIZER',
        rsvpStatus: 'YES',
      });
    });
    const detailPath = `/invite-lists/${inviteListId}`;
    const sendPath = `${detailPath}/invite-to-event`;
    for (const blocked of [reader, wrong]) {
      expect(
        (await blocked.request(detailPath, 'PATCH', { name: 'Blocked' })).status
      ).toBe(403);
      expect((await blocked.request(detailPath, 'DELETE')).status).toBe(403);
      expect(
        (await blocked.request(sendPath, 'POST', { eventId })).status
      ).toBe(403);
    }
    for (const [path, method, input] of [
      [detailPath, 'PATCH', { name: 'Unauthenticated' }],
      [detailPath, 'DELETE', undefined],
      [sendPath, 'POST', { eventId }],
    ] as const) {
      expect(
        (
          await t.fetch(`/api/v2${path}`, {
            method,
            headers: { 'content-type': 'application/json' },
            ...(input ? { body: JSON.stringify(input) } : {}),
          })
        ).status
      ).toBe(401);
    }
    expect(
      (await writer.request(detailPath, 'PATCH', { name: 'Write only' })).status
    ).toBe(200);
    const sent = await writer.request(sendPath, 'POST', { eventId });
    expect(sent.status).toBe(200);
    expect(await sent.json()).toMatchObject({ sentCount: 1, skippedCount: 0 });
    expect((await writer.request(detailPath, 'DELETE')).status).toBe(200);
  });
  it('returns structured validation/conflict errors and preserves the existing collection', async () => {
    const { owner, recipient } = await setup();
    const created = await owner.request('/invite-lists', 'POST', {
      name: 'Saved',
      personIds: [recipient.personId],
    });
    expect(created.status).toBe(201);
    const duplicate = await owner.request('/invite-lists', 'POST', {
      name: ' SAVED ',
      personIds: [recipient.personId],
    });
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toMatchObject({
      error: { code: 'CONFLICT' },
    });
    for (const body of [
      { name: '  ', personIds: [recipient.personId] },
      { name: 'x'.repeat(101), personIds: [recipient.personId] },
      { name: 'Empty', personIds: [] },
      { name: 'Unknown', personIds: ['nonexistent'] },
      { name: 'Wrong table', personIds: [(await created.json()).inviteListId] },
    ]) {
      const response = await owner.request('/invite-lists', 'POST', body);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: 'VALIDATION_ERROR' },
      });
    }
    expect(
      (await (await owner.request('/invite-lists')).json()).items
    ).toHaveLength(1);
  });
  it('publishes the protected-send capability and authenticated OpenAPI contract', async () => {
    const { t } = await setup();
    const health = await t.fetch('/api/v2/health');
    expect((await health.json()).capabilities.inviteLists).toEqual({
      version: 2,
      retentionMs: 86400000,
    });
    const document = await (await t.fetch('/api/v2/openapi.json')).json();
    for (const [path, methods] of Object.entries({
      '/invite-lists': ['get', 'post'],
      '/invite-lists/{inviteListId}': ['get', 'patch', 'delete'],
      '/invite-lists/{inviteListId}/invite-to-event': ['post'],
      '/invite-lists/people/search': ['get'],
      '/invite-lists/people/friends': ['get'],
    }))
      for (const method of methods)
        expect(document.paths[path][method].security).toEqual([{ apiKey: [] }]);
  });
  it('offers event-independent username lookup and accepted friends through the same picker contract', async () => {
    const { owner, recipient } = await setup();
    const search = await owner.request('/invite-lists/people/search?q=RE');
    expect(search.status).toBe(200);
    expect(await search.json()).toEqual(
      await owner.auth.query(api.inviteLists.queries.searchPeople, {
        searchTerm: 'RE',
      })
    );
    const friends = await owner.request('/invite-lists/people/friends');
    expect(friends.status).toBe(200);
    expect(await friends.json()).toEqual({ items: [] });
    const { friendshipId } = await owner.auth.mutation(
      api.friends.mutations.sendFriendRequest,
      { addresseePersonId: recipient.personId }
    );
    await recipient.auth.mutation(api.friends.mutations.acceptFriendRequest, {
      friendshipId,
    });
    expect(
      await (await owner.request('/invite-lists/people/friends')).json()
    ).toEqual({
      items: [
        {
          personId: recipient.personId,
          name: 'rest-list-recipient',
          username: 'rest-list-recipient',
          image: null,
          available: true,
        },
      ],
    });
  });
  it('creates a list and exposes the same collection/detail through session and REST', async () => {
    const { owner, recipient } = await setup();
    const response = await owner.request('/invite-lists', 'POST', {
      name: '  Regulars  ',
      personIds: [recipient.personId, recipient.personId],
    });
    expect(response.status).toBe(201);
    const list = await response.json();
    expect(list).toMatchObject({
      name: 'Regulars',
      personCount: 1,
      availablePersonCount: 1,
      needsAttention: false,
    });
    expect(
      await (await owner.request(`/invite-lists/${list.inviteListId}`)).json()
    ).toEqual(list);
    expect(
      await owner.auth.query(api.inviteLists.queries.getInviteList, {
        inviteListId: list.inviteListId,
      })
    ).toEqual(list);
    expect(await (await owner.request('/invite-lists')).json()).toMatchObject({
      items: [{ inviteListId: list.inviteListId, name: 'Regulars' }],
    });
  });
});
