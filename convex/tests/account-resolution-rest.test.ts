import { describe, expect, it } from 'vitest';
import { api, components } from '../_generated/api';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
async function fixture() {
  const t = createTestInstance();
  registerBetterAuth(t);
  async function actor(name: string, permissions?: string) {
    const account = await createAuthAccount(t, name);
    const rawKey = `grp_resolution_${name}`;
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
          enabled: true,
          permissions,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    const request = (path: string, method = 'GET', body?: unknown) =>
      t.fetch(`/api/v2${path}`, {
        method,
        headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    return { ...account, request, rawKey };
  }
  return { t, actor };
}
async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return status === 204 ? null : response.json();
}
describe('REST account responsibility resolution and actual admin boundaries', () => {
  it('keeps pending, declined and cancelled offers unresolved; accepted Event transfer preserves RSVP and Friends principal after former-owner deletion', async () => {
    const { actor } = await fixture();
    const owner = await actor('rest-resolution-owner'),
      recipient = await actor('rest-resolution-recipient');
    const event = await body(
      await owner.request('/events', 'POST', { title: 'Friends event' }),
      201
    );
    await body(
      await owner.request(`/events/${event.eventId}/settings`, 'PATCH', {
        visibility: 'FRIENDS',
      })
    );
    const invite = await body(
      await owner.request(`/events/${event.eventId}/invites`, 'POST', {}),
      201
    );
    const membership = await body(
      await recipient.request(`/invites/${invite.token}/accept`, 'POST')
    );
    await body(
      await recipient.request(`/events/${event.eventId}/rsvp`, 'PATCH', {
        rsvpStatus: 'YES',
      })
    );
    const path = `/events/${event.eventId}/ownership-transfer`;
    for (const decision of ['decline', 'cancel']) {
      const offer = await body(
        await owner.request(path, 'POST', { recipientId: recipient.personId })
      );
      expect(
        (
          await body(
            await owner.request('/account/responsibilities?kind=EVENT&limit=1')
          )
        ).items[0]
      ).toMatchObject({ status: 'PENDING', resolved: false });
      await body(
        await owner.request('/account/delete', 'POST', {
          confirmation: 'rest-resolution-owner',
        }),
        409
      );
      await body(
        await (decision === 'decline' ? recipient : owner).request(
          `${path}/${decision}`,
          'POST',
          { transferId: offer.transferId }
        )
      );
      expect(
        (
          await body(
            await owner.request('/account/responsibilities?kind=EVENT&limit=1')
          )
        ).items[0].status
      ).toBe(decision === 'decline' ? 'DECLINED' : 'CANCELLED');
      expect(
        (await body(await owner.request('/account/readiness'))).canDelete
      ).toBe(false);
    }
    const offer = await body(
      await owner.request(path, 'POST', { recipientId: recipient.personId })
    );
    await body(
      await recipient.request(`${path}/accept`, 'POST', {
        transferId: offer.transferId,
      })
    );
    expect(
      (await body(await owner.request('/account/responsibilities?kind=EVENT')))
        .items
    ).toEqual([]);
    await body(
      await owner.request('/account/delete', 'POST', {
        confirmation: 'rest-resolution-owner',
        personId: recipient.personId,
      }),
      400
    );
    await body(
      await owner.request('/account/delete', 'POST', {
        confirmation: 'rest-resolution-owner',
      })
    );
    expect((await owner.request('/profile')).status).toBe(401);
    const header = await recipient.auth.query(
      api.events.queries.getEventHeader,
      { eventId: event.eventId }
    );
    expect(header.event.creatorId).toBe(recipient.personId);
    expect(header.userMembership).toMatchObject({
      _id: membership.membershipId,
      role: 'ORGANIZER',
      rsvpStatus: 'YES',
    });
  });
  it('rejects scoped/foreign writes and both v1/v2 admin bypasses, then deletes target Auth and private lists after explicit retirement', async () => {
    const { t, actor } = await fixture();
    const owner = await actor('rest-admin-target'),
      admin = await actor('rest-admin-actor'),
      scoped = await actor(
        'rest-account-scope',
        JSON.stringify({ account: ['read'] })
      );
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: admin.user._id }],
        update: { role: 'admin' },
      },
    });
    const group = await body(
      await owner.request('/groups', 'POST', { name: 'Independent Group' }),
      201
    );
    const event = await body(
      await owner.request('/events', 'POST', { title: 'Independent Event' }),
      201
    );
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Private selection', personIds: [admin.personId] }
    );
    for (const version of ['v1', 'v2']) {
      const response = await t.fetch(
        `/api/${version}/admin/users/${owner.user._id}`,
        { method: 'DELETE', headers: { 'x-api-key': admin.rawKey } }
      );
      expect(response.status).toBe(409);
    }
    expect(
      await owner.auth.query(api.inviteLists.queries.getInviteList, {
        inviteListId: list.inviteListId,
      })
    ).not.toBeNull();
    await body(
      await scoped.request('/account/delete', 'POST', {
        confirmation: 'rest-account-scope',
      }),
      403
    );
    await body(
      await admin.request(
        `/account/responsibilities/events/${event.eventId}`,
        'DELETE'
      ),
      403
    );
    await body(await owner.request(`/groups/${group.groupId}`, 'DELETE'), 204);
    expect(
      (await body(await owner.request('/account/responsibilities?kind=EVENT')))
        .items[0].id
    ).toBe(event.eventId);
    await body(
      await admin.request(`/admin/users/${owner.user._id}`, 'DELETE'),
      409
    );
    await body(
      await owner.request(
        `/account/responsibilities/events/${event.eventId}`,
        'DELETE'
      ),
      204
    );
    await body(
      await admin.request(`/admin/users/${owner.user._id}`, 'DELETE'),
      204
    );
    expect((await owner.request('/profile')).status).toBe(401);
    await expect(
      owner.auth.query(api.inviteLists.queries.listInviteLists, {})
    ).rejects.toThrow('Authentication required');
  });
});
