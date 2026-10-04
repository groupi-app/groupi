import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';

async function fixture() {
  const t = createTestInstance();
  registerBetterAuth(t);
  async function actor(name: string) {
    const account = await createAuthAccount(t, name);
    const rawKey = `grp_transfer_${name}`;
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
    return {
      ...account,
      keyId: key._id,
      request: (path: string, method = 'GET', body?: unknown) =>
        t.fetch(`/api/v2${path}`, {
          method,
          headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        }),
    };
  }
  const owner = await actor('owner');
  const recipient = await actor('recipient');
  const outsider = await actor('outsider');
  const event = await body(
    await owner.request('/events', 'POST', { title: 'Ownership' }),
    201
  );
  await body(
    await owner.request(`/events/${event.eventId}/settings`, 'PATCH', {
      visibility: 'FRIENDS',
    })
  );
  const invite = await (
    await owner.request(`/events/${event.eventId}/invites`, 'POST', {})
  ).json();
  const joined = await (
    await recipient.request(`/invites/${invite.token}/accept`, 'POST')
  ).json();
  await recipient.request(`/events/${event.eventId}/rsvp`, 'PATCH', {
    rsvpStatus: 'YES',
  });
  return {
    t,
    actor,
    owner,
    recipient,
    outsider,
    eventId: event.eventId,
    membershipId: joined.membershipId,
  };
}
async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return response.json();
}
describe('consensual Event ownership transfer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('keeps responsibility pending until real-session recipient acceptance and preserves participation', async () => {
    const { owner, recipient, eventId } = await fixture();
    const before = await recipient.auth.query(
      api.events.queries.getEventHeader,
      { eventId }
    );
    const pending = await owner.auth.mutation(
      api.eventTransfers.mutations.offer,
      { eventId, recipientId: recipient.personId }
    );
    expect(pending!.status).toBe('PENDING');
    expect(pending!.organizerId).toBe(owner.personId);
    expect(
      (await owner.auth.query(api.events.queries.getEventHeader, { eventId }))
        .userMembership.role
    ).toBe('ORGANIZER');
    await expect(
      owner.auth.mutation(api.eventTransfers.mutations.accept, {
        eventId,
        transferId: pending!.transferId!,
      })
    ).rejects.toThrow();
    const accepted = await recipient.auth.mutation(
      api.eventTransfers.mutations.accept,
      { eventId, transferId: pending!.transferId! }
    );
    expect(accepted!.status).toBe('ACCEPTED');
    expect(accepted!.organizerId).toBe(recipient.personId);
    expect(accepted!.createdById).toBe(owner.personId);
    const after = await recipient.auth.query(
      api.events.queries.getEventHeader,
      { eventId }
    );
    expect(after.userMembership._id).toBe(before.userMembership._id);
    expect(after.userMembership.rsvpStatus).toBe(
      before.userMembership.rsvpStatus
    );
    expect(after.userMembership.role).toBe('ORGANIZER');
    expect(
      (await owner.auth.query(api.events.queries.getEventHeader, { eventId }))
        .userMembership.role
    ).toBe('MODERATOR');
    await expect(
      owner.auth.mutation(api.eventTransfers.mutations.offer, {
        eventId,
        recipientId: recipient.personId,
      })
    ).rejects.toThrow();
    await expect(
      recipient.auth.mutation(api.eventTransfers.mutations.accept, {
        eventId,
        transferId: pending!.transferId!,
      })
    ).rejects.toThrow();
  });
  it('exposes truthful REST pending, declined, cancelled outcomes and rejects stale or duplicate actions', async () => {
    const { owner, recipient, outsider, eventId } = await fixture();
    const path = `/events/${eventId}/ownership-transfer`;
    await body(
      await outsider.request(path, 'POST', { recipientId: recipient.personId }),
      403
    );
    await body(
      await owner.request(path, 'POST', { recipientId: outsider.personId }),
      403
    );
    const pending = await body(
      await owner.request(path, 'POST', { recipientId: recipient.personId })
    );
    await body(
      await owner.request(path, 'POST', { recipientId: recipient.personId }),
      409
    );
    expect((await body(await recipient.request(path))).status).toBe('PENDING');
    expect(
      (
        await body(
          await recipient.request(`${path}/decline`, 'POST', {
            transferId: pending.transferId,
          })
        )
      ).status
    ).toBe('DECLINED');
    await body(
      await recipient.request(`${path}/accept`, 'POST', {
        transferId: pending.transferId,
      }),
      409
    );
    const next = await body(
      await owner.request(path, 'POST', { recipientId: recipient.personId })
    );
    expect(
      (
        await body(
          await owner.request(`${path}/cancel`, 'POST', {
            transferId: next.transferId,
          })
        )
      ).status
    ).toBe('CANCELLED');
    await body(
      await recipient.request(`${path}/accept`, 'POST', {
        transferId: next.transferId,
      }),
      409
    );
  });
  it('rejects ordinary Organizer promotion and rechecks recipient eligibility on acceptance', async () => {
    const { owner, recipient, eventId, membershipId } = await fixture();
    await expect(
      owner.auth.mutation(api.events.mutations.updateMemberRole, {
        membershipId,
        newRole: 'ORGANIZER',
      })
    ).rejects.toThrow('accepted ownership transfer');
    const offer = await owner.auth.mutation(
      api.eventTransfers.mutations.offer,
      { eventId, recipientId: recipient.personId }
    );
    await body(await recipient.request(`/events/${eventId}/leave`, 'POST'));
    await expect(
      recipient.auth.mutation(api.eventTransfers.mutations.accept, {
        eventId,
        transferId: offer!.transferId!,
      })
    ).rejects.toThrow();
    expect(
      (await owner.auth.query(api.eventTransfers.queries.status, { eventId }))!
        .status
    ).toBe('PENDING');
  });
  it('moves Friends audience only after acceptance and survives removal of the former creator identity', async () => {
    const { actor, owner, recipient, outsider, eventId } = await fixture();
    const nextFriend = await actor('new-friend');
    const oldRequest = await body(
      await owner.request('/friends/requests', 'POST', {
        personId: outsider.personId,
      })
    );
    await body(
      await outsider.request(
        `/friends/requests/${oldRequest.friendshipId}/accept`,
        'POST'
      )
    );
    const newRequest = await body(
      await recipient.request('/friends/requests', 'POST', {
        personId: nextFriend.personId,
      })
    );
    await body(
      await nextFriend.request(
        `/friends/requests/${newRequest.friendshipId}/accept`,
        'POST'
      )
    );
    const discover = async (a: typeof owner) =>
      (await a.auth.query(api.events.queries.getDiscoverableEvents, {})).some(
        e => e.eventId === eventId
      );
    expect(await discover(outsider)).toBe(true);
    expect(await discover(nextFriend)).toBe(false);
    const pending = await body(
      await owner.request(`/events/${eventId}/ownership-transfer`, 'POST', {
        recipientId: recipient.personId,
      })
    );
    expect(await discover(outsider)).toBe(true);
    expect(await discover(nextFriend)).toBe(false);
    await body(
      await recipient.request(
        `/events/${eventId}/ownership-transfer/accept`,
        'POST',
        { transferId: pending.transferId }
      )
    );
    expect(await discover(outsider)).toBe(false);
    expect(await discover(nextFriend)).toBe(true);
    await expect(
      owner.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'owner',
      })
    ).resolves.toEqual({ success: true });
    await expect(
      owner.auth.query(api.events.queries.getEventHeader, { eventId })
    ).rejects.toThrow();
    expect(await discover(nextFriend)).toBe(true);
    expect(
      (
        await recipient.auth.query(api.events.queries.getEventHeader, {
          eventId,
        })
      ).userMembership.role
    ).toBe('ORGANIZER');
  });
  it('rejects racing offers and admits exactly one recipient acceptance', async () => {
    const { owner, recipient, eventId } = await fixture();
    const path = `/events/${eventId}/ownership-transfer`;
    const offers = await Promise.all([
      owner.request(path, 'POST', { recipientId: recipient.personId }),
      owner.request(path, 'POST', { recipientId: recipient.personId }),
    ]);
    expect(offers.map(r => r.status).sort()).toEqual([200, 409]);
    const pending = await body(offers.find(r => r.status === 200)!);
    const decisions = await Promise.all([
      recipient.request(`${path}/accept`, 'POST', {
        transferId: pending.transferId,
      }),
      recipient.request(`${path}/accept`, 'POST', {
        transferId: pending.transferId,
      }),
    ]);
    expect(decisions.map(r => r.status).sort()).toEqual([200, 409]);
    expect((await body(await recipient.request(path))).organizerId).toBe(
      recipient.personId
    );
    const roster = await recipient.auth.query(
      api.events.queries.getEventAttendeesData,
      { eventId }
    );
    expect(
      roster.event.memberships
        .filter(m => m.role === 'ORGANIZER')
        .map(m => m.personId)
    ).toEqual([recipient.personId]);
  });
  it('enforces events read/write scopes and advertises the transfer capability', async () => {
    const { t, owner, recipient, eventId } = await fixture();
    expect(
      (await body(await owner.request('/health'))).capabilities.eventTransfers
    ).toEqual({ version: 1 });
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'apikey',
        where: [{ field: '_id', value: owner.keyId }],
        update: { permissions: JSON.stringify({ events: ['read'] }) },
      },
    });
    const path = `/events/${eventId}/ownership-transfer`;
    expect((await body(await owner.request(path))).status).toBe('NONE');
    await body(
      await owner.request(path, 'POST', { recipientId: recipient.personId }),
      403
    );
  });
  it.each(['ordinary', 'admin-event', 'admin-person', 'admin-rest'] as const)(
    'removes transfer references when authenticated %s deletion removes the Event',
    async boundary => {
      const { t, owner, recipient, outsider, eventId } = await fixture();
      const pending = await owner.auth.mutation(
        api.eventTransfers.mutations.offer,
        { eventId, recipientId: recipient.personId }
      );
      expect(pending!.status).toBe('PENDING');
      await t.mutation(components.betterAuth.adapter.updateOne, {
        input: {
          model: 'user',
          where: [{ field: '_id', value: outsider.user._id }],
          update: { role: 'admin' },
        },
      });
      if (boundary === 'admin-rest')
        await t.run(async ctx => {
          for (let index = 0; index < 151; index++)
            await ctx.db.insert('eventTransfers', {
              eventId,
              offeredById: owner.personId,
              recipientId: recipient.personId,
              status: 'CANCELLED',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
        });
      if (boundary === 'ordinary')
        await owner.auth.mutation(api.events.mutations.deleteEvent, {
          eventId,
        });
      if (boundary === 'admin-event')
        await outsider.auth.mutation(api.admin.mutations.deleteEvent, {
          eventId,
        });
      if (boundary === 'admin-person')
        await outsider.auth.mutation(api.admin.mutations.deletePerson, {
          personId: owner.personId,
        });
      if (boundary === 'admin-rest')
        expect(
          (await outsider.request(`/admin/events/${eventId}`, 'DELETE')).status
        ).toBe(204);
      await expect(
        recipient.auth.query(api.events.queries.getEventHeader, { eventId })
      ).rejects.toThrow();
      // Approved cleanup/privacy persistence seam: durable participant references must not survive public deletion.
      expect(
        await t.run(ctx =>
          ctx.db
            .query('eventTransfers')
            .withIndex('by_event', q => q.eq('eventId', eventId))
            .collect()
        )
      ).toEqual([]);
    }
  );
});
