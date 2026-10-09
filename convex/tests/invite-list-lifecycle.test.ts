import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance, TestScenarios } from './test_helpers';

async function apiKey(
  t: ReturnType<typeof createTestInstance>,
  account: Awaited<ReturnType<typeof createAuthAccount>>
) {
  const raw = `grp_list_lifecycle_${account.user._id}`;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(raw)
  );
  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: account.user._id,
        key: btoa(String.fromCharCode(...new Uint8Array(digest)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''),
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  });
  return (path: string, method = 'GET', body?: unknown, requestId?: string) =>
    t.fetch(`/api/v2${path}`, {
      method,
      headers: {
        'x-api-key': raw,
        'content-type': 'application/json',
        ...(requestId ? { 'Idempotency-Key': requestId } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
}

async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  const event = await TestScenarios.singleEvent(t);
  const owner = await createAuthAccount(t, 'lifecycle-owner', event.personId);
  const recipient = await createAuthAccount(t, 'lifecycle-recipient');
  const replacement = await createAuthAccount(t, 'lifecycle-replacement');
  const request = await apiKey(t, owner);
  return { t, owner, recipient, replacement, request, eventId: event.eventId };
}
/** Account deletion now requires recipient-accepted responsibility resolution. */
async function resolveFixtureEvent(f: Awaited<ReturnType<typeof setup>>) {
  await f.t.run(ctx =>
    ctx.db.insert('memberships', {
      eventId: f.eventId,
      personId: f.replacement.personId,
      role: 'ATTENDEE',
      rsvpStatus: 'MAYBE',
    })
  );
  const offered = await f.owner.auth.mutation(
    api.eventTransfers.mutations.offer,
    { eventId: f.eventId, recipientId: f.replacement.personId }
  );
  await f.replacement.auth.mutation(api.eventTransfers.mutations.accept, {
    eventId: f.eventId,
    transferId: offered!.transferId!,
  });
}
const requestId = () => `${Date.now()}.${crypto.randomUUID()}`;
const anonymous = (personId: string) => ({
  personId,
  name: null,
  username: null,
  image: null,
  available: false,
});

describe('Invite list account lifecycle', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('reactively resolves draft identities with bounded deduplication and anonymizes deleted profiles', async () => {
    const { t, owner, recipient } = await setup();
    const args = { personIds: [recipient.personId, recipient.personId] };
    await expect(
      t.query(api.inviteLists.queries.getPeopleByIds, args)
    ).rejects.toThrow('Authentication required');
    expect(
      await owner.auth.query(api.inviteLists.queries.getPeopleByIds, {
        personIds: [],
      })
    ).toEqual({ items: [] });
    expect(
      await owner.auth.query(api.inviteLists.queries.getPeopleByIds, args)
    ).toEqual({
      items: [
        {
          personId: recipient.personId,
          name: 'lifecycle-recipient',
          username: 'lifecycle-recipient',
          image: null,
          available: true,
        },
      ],
    });
    await recipient.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'lifecycle-recipient',
    });
    expect(
      await owner.auth.query(api.inviteLists.queries.getPeopleByIds, args)
    ).toEqual({ items: [anonymous(recipient.personId)] });
    const tooMany = await t.run(async ctx =>
      Promise.all(
        Array.from({ length: 101 }, (_, i) =>
          ctx.db.insert('persons', { userId: `missing-${i}` })
        )
      )
    );
    await expect(
      owner.auth.query(api.inviteLists.queries.getPeopleByIds, {
        personIds: tooMany,
      })
    ).rejects.toThrow('at most 100');
  });

  it.each(['self', 'admin'] as const)(
    'removes only the deleted %s account’s lists and denies its previous session and API identity',
    async mode => {
      const f = await setup();
      const { t, owner, recipient, request } = f;
      const list = await owner.auth.mutation(
        api.inviteLists.mutations.createInviteList,
        {
          name: 'Owned private list',
          personIds: [recipient.personId],
        }
      );
      const otherList = await recipient.auth.mutation(
        api.inviteLists.mutations.createInviteList,
        {
          name: 'Surviving private list',
          personIds: [recipient.personId],
        }
      );
      const secondOwned = await owner.auth.mutation(
        api.inviteLists.mutations.createInviteList,
        {
          name: 'Another owned list',
          personIds: [recipient.personId],
        }
      );
      await expect(
        owner.auth.mutation(api.users.mutations.deleteUserAccount, {
          confirmation: 'lifecycle-owner',
        })
      ).rejects.toThrow('Resolve owned Events');
      await resolveFixtureEvent(f);
      if (mode === 'self') {
        await owner.auth.mutation(api.users.mutations.deleteUserAccount, {
          confirmation: 'lifecycle-owner',
        });
      } else {
        const admin = await createAuthAccount(t, 'lifecycle-admin');
        await t.mutation(components.betterAuth.adapter.updateOne, {
          input: {
            model: 'user',
            where: [{ field: '_id', value: admin.user._id }],
            update: { role: 'admin' },
          },
        });
        const adminRequest = await apiKey(t, admin);
        expect(
          (await adminRequest(`/admin/users/${owner.user._id}`, 'DELETE'))
            .status
        ).toBe(204);
      }
      await expect(
        owner.auth.query(api.inviteLists.queries.listInviteLists, {})
      ).rejects.toThrow('Authentication required');
      await expect(
        owner.auth.query(api.inviteLists.queries.getInviteList, {
          inviteListId: list.inviteListId,
        })
      ).rejects.toThrow('Authentication required');
      expect((await request('/invite-lists')).status).toBe(401);
      expect(
        (await request(`/invite-lists/${list.inviteListId}`, 'DELETE')).status
      ).toBe(401);
      expect(
        await recipient.auth.query(api.inviteLists.queries.getInviteList, {
          inviteListId: otherList.inviteListId,
        })
      ).toMatchObject({ name: 'Surviving private list' });
      // The deleted identity can no longer inspect its lists. Audit removal as well
      // as access denial, so inaccessible private records cannot survive cleanup.
      expect(await t.run(ctx => ctx.db.get(list.inviteListId))).toBeNull();
      expect(
        await t.run(ctx => ctx.db.get(secondOwned.inviteListId))
      ).toBeNull();
    }
  );

  it('keeps saved anonymous entries during repair but never counts them as existing people or accepts forged missing IDs', async () => {
    const { t, owner, recipient, replacement, request, eventId } =
      await setup();
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      {
        name: 'Repair me',
        personIds: [recipient.personId],
      }
    );
    await recipient.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'lifecycle-recipient',
    });
    const path = `/invite-lists/${list.inviteListId}`;
    expect(await (await request(path)).json()).toMatchObject({
      name: 'Repair me',
      personCount: 1,
      availablePersonCount: 0,
      needsAttention: true,
      people: [anonymous(recipient.personId)],
    });
    const pendingRequestId = requestId();
    const unavailable = await request(
      `${path}/invite-to-event`,
      'POST',
      {
        eventId,
      },
      pendingRequestId
    );
    expect(unavailable.status).toBe(400);
    expect(await unavailable.json()).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: expect.stringMatching(/existing.*repair|repair.*existing/i),
      },
    });
    expect(
      (await request(path, 'PATCH', { name: 'Only a rename' })).status
    ).toBe(400);
    await expect(
      owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
        name: 'New missing',
        personIds: [recipient.personId],
      })
    ).rejects.toThrow('existing users');
    const repaired = await request(path, 'PATCH', {
      personIds: [recipient.personId, replacement.personId],
    });
    expect(repaired.status).toBe(200);
    expect(await repaired.json()).toMatchObject({
      personCount: 2,
      availablePersonCount: 1,
      needsAttention: false,
      people: [
        anonymous(recipient.personId),
        { personId: replacement.personId, available: true },
      ],
    });
    expect(
      (await request(path, 'PATCH', { name: 'Renamed after repair' })).status
    ).toBe(200);
    const forged = await createAuthAccount(t, 'forged-deleted-person');
    await forged.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'forged-deleted-person',
    });
    expect(
      (
        await request(path, 'PATCH', {
          personIds: [
            recipient.personId,
            forged.personId,
            replacement.personId,
          ],
        })
      ).status
    ).toBe(400);
    const send = await request(
      `${path}/invite-to-event`,
      'POST',
      { eventId },
      pendingRequestId
    );
    expect(send.status).toBe(200);
    expect(await send.json()).toMatchObject({
      totalCount: 2,
      sentCount: 1,
      skippedCount: 1,
      results: [
        {
          personId: recipient.personId,
          status: 'skipped',
          reason: 'UNAVAILABLE',
        },
        { personId: replacement.personId, status: 'sent' },
      ],
    });
    expect(
      await replacement.auth.query(
        api.eventInvites.queries.getPendingEventInvites,
        {}
      )
    ).toHaveLength(1);
    expect(
      (
        await replacement.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toHaveLength(1);
  });

  it('anonymizes a recipient removed by the authenticated admin route and sends only to surviving reviewed IDs', async () => {
    const { t, owner, recipient, replacement, request, eventId } =
      await setup();
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: recipient.user._id }],
        update: { image: 'https://example.com/deleted-avatar.png' },
      },
    });
    const { friendshipId } = await owner.auth.mutation(
      api.friends.mutations.sendFriendRequest,
      { addresseePersonId: recipient.personId }
    );
    await recipient.auth.mutation(api.friends.mutations.acceptFriendRequest, {
      friendshipId,
    });
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      {
        name: 'Partially available',
        personIds: [recipient.personId, replacement.personId],
      }
    );
    const personIds = list.people.map(person => person.personId);
    expect(
      (
        await owner.auth.query(
          api.inviteLists.queries.reviewInviteListRecipients,
          { eventId, personIds }
        )
      ).eligibleCount
    ).toBe(2);
    const admin = await createAuthAccount(t, 'recipient-deletion-admin');
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: admin.user._id }],
        update: { role: 'admin' },
      },
    });
    expect(
      (
        await (
          await apiKey(t, admin)
        )(`/admin/users/${recipient.user._id}`, 'DELETE')
      ).status
    ).toBe(204);
    expect(
      await (await request(`/invite-lists/${list.inviteListId}`)).json()
    ).toMatchObject({
      personCount: 2,
      availablePersonCount: 1,
      needsAttention: false,
      people: [
        anonymous(recipient.personId),
        { personId: replacement.personId, available: true },
      ],
    });
    expect(
      await owner.auth.query(api.inviteLists.queries.getFriendChoices, {})
    ).toEqual({ items: [] });
    expect(
      await owner.auth.query(api.inviteLists.queries.searchPeople, {
        searchTerm: 'lifecycle-recipient',
      })
    ).toEqual({ items: [] });
    const reviewed = await owner.auth.query(
      api.inviteLists.queries.reviewInviteListRecipients,
      { eventId, personIds }
    );
    expect(reviewed.results[0]).toEqual({
      ...anonymous(recipient.personId),
      status: 'skipped',
      reason: 'UNAVAILABLE',
    });
    const sent = await owner.auth.mutation(
      api.inviteLists.mutations.sendInviteListRecipients,
      { eventId, personIds, requestId: requestId() }
    );
    expect(sent).toMatchObject({
      totalCount: 2,
      sentCount: 1,
      skippedCount: 1,
      results: [
        {
          personId: recipient.personId,
          status: 'skipped',
          reason: 'UNAVAILABLE',
        },
        { personId: replacement.personId, status: 'sent' },
      ],
    });
    expect(
      (await replacement.auth.query(api.events.queries.getUserEvents, {}))
        .events
    ).toEqual([]);
    const pending = await replacement.auth.query(
      api.eventInvites.queries.getPendingEventInvites,
      {}
    );
    expect(pending).toHaveLength(1);
    await owner.auth.mutation(api.inviteLists.mutations.deleteInviteList, {
      inviteListId: list.inviteListId,
    });
    expect(
      await replacement.auth.query(
        api.eventInvites.queries.getPendingEventInvites,
        {}
      )
    ).toEqual(pending);
    await replacement.auth.mutation(
      api.eventInvites.mutations.acceptEventInvite,
      { inviteId: pending[0]!.inviteId }
    );
    expect(
      (await replacement.auth.query(api.events.queries.getUserEvents, {}))
        .events
    ).toHaveLength(1);
  });

  it('preserves a completed result after all recipients disappear and the list is deleted, while blocking fresh list and stale-draft sends', async () => {
    const { owner, recipient, request, eventId } = await setup();
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Protected original', personIds: [recipient.personId] }
    );
    const path = `/invite-lists/${list.inviteListId}`;
    const id = requestId();
    const result = await (
      await request(`${path}/invite-to-event`, 'POST', { eventId }, id)
    ).json();
    expect(result.sentCount).toBe(1);
    await recipient.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'lifecycle-recipient',
    });
    expect(
      await owner.auth.query(api.inviteLists.queries.getInviteList, {
        inviteListId: list.inviteListId,
      })
    ).toMatchObject({
      name: 'Protected original',
      needsAttention: true,
      people: [anonymous(recipient.personId)],
    });
    expect(
      (
        await request(
          `${path}/invite-to-event`,
          'POST',
          { eventId },
          requestId()
        )
      ).status
    ).toBe(400);
    await expect(
      owner.auth.mutation(api.inviteLists.mutations.inviteListToEvent, {
        eventId,
        inviteListId: list.inviteListId,
        requestId: requestId(),
      })
    ).rejects.toThrow('Repair');
    await expect(
      owner.auth.mutation(api.inviteLists.mutations.sendInviteListRecipients, {
        eventId,
        personIds: [recipient.personId],
        requestId: requestId(),
      })
    ).rejects.toThrow('Repair');
    expect(
      await (
        await request(`${path}/invite-to-event`, 'POST', { eventId }, id)
      ).json()
    ).toEqual(result);
    expect((await request(path, 'DELETE')).status).toBe(200);
    expect(
      await (
        await request(`${path}/invite-to-event`, 'POST', { eventId }, id)
      ).json()
    ).toEqual(result);
    expect(
      await owner.auth.query(api.eventInvites.queries.getSentEventInvites, {
        eventId,
      })
    ).toEqual([]);
  });

  it('serializes owner deletion against new list creation without orphaning the winning private write', async () => {
    const f = await setup();
    const { t, owner, recipient } = f;
    await resolveFixtureEvent(f);
    const outcomes = await Promise.allSettled([
      owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
        name: 'Concurrent selection',
        personIds: [recipient.personId],
      }),
      owner.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'lifecycle-owner',
      }),
    ]);
    expect(outcomes[1].status).toBe('fulfilled');
    await expect(
      owner.auth.query(api.inviteLists.queries.listInviteLists, {})
    ).rejects.toThrow('Authentication required');
    expect(
      await t.run(ctx =>
        ctx.db
          .query('inviteLists')
          .withIndex('by_creator', q => q.eq('creatorId', owner.personId))
          .collect()
      )
    ).toEqual([]);
  });

  it('does not retain a list from an API-key creation racing with owner account deletion', async () => {
    const f = await setup();
    const { t, owner, recipient, request } = f;
    await resolveFixtureEvent(f);
    const [created, deleted] = await Promise.all([
      request('/invite-lists', 'POST', {
        name: 'Concurrent REST selection',
        personIds: [recipient.personId],
      }),
      owner.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'lifecycle-owner',
      }),
    ]);
    expect(deleted).toEqual({ success: true });
    expect([201, 401]).toContain(created.status);
    expect((await request('/invite-lists')).status).toBe(401);
    expect(
      await t.run(ctx =>
        ctx.db
          .query('inviteLists')
          .withIndex('by_creator', q => q.eq('creatorId', owner.personId))
          .collect()
      )
    ).toEqual([]);
  });

  it('serializes recipient deletion against a reviewed send and never invites that missing identity on a subsequent attempt', async () => {
    const { owner, recipient, replacement, eventId } = await setup();
    const personIds = [recipient.personId, replacement.personId];
    const reviewed = await owner.auth.query(
      api.inviteLists.queries.reviewInviteListRecipients,
      { eventId, personIds }
    );
    expect(reviewed.eligibleCount).toBe(2);
    const [deleted, sent] = await Promise.all([
      recipient.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'lifecycle-recipient',
      }),
      owner.auth.mutation(api.inviteLists.mutations.sendInviteListRecipients, {
        eventId,
        personIds,
        requestId: requestId(),
      }),
    ]);
    expect(deleted).toEqual({ success: true });
    // A send may commit before the deletion. If deletion commits first, its
    // profile read is unavailable and that recipient is skipped atomically.
    expect(sent.results[0]).toEqual(
      expect.objectContaining({
        personId: recipient.personId,
        status: expect.stringMatching(/^(sent|skipped)$/),
      })
    );
    if (sent.results[0].status === 'skipped')
      expect(sent.results[0].reason).toBe('UNAVAILABLE');
    expect(sent.results[1]).toEqual(
      expect.objectContaining({
        personId: replacement.personId,
        status: 'sent',
      })
    );
    const later = await owner.auth.mutation(
      api.inviteLists.mutations.sendInviteListRecipients,
      { eventId, personIds, requestId: requestId() }
    );
    expect(later).toMatchObject({
      sentCount: 0,
      skippedCount: 2,
      results: [
        {
          personId: recipient.personId,
          status: 'skipped',
          reason: 'UNAVAILABLE',
        },
        {
          personId: replacement.personId,
          status: 'skipped',
          reason: 'INVITATION_PENDING',
        },
      ],
    });
    expect(
      (
        await replacement.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications
    ).toHaveLength(1);
    expect(
      await replacement.auth.query(
        api.eventInvites.queries.getPendingEventInvites,
        {}
      )
    ).toHaveLength(1);
  });
});
