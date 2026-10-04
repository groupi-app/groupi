import { expect, it } from 'vitest';
import { api, components, internal } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';
async function actor(
  t: ReturnType<typeof createTestInstance>,
  username: string,
  permissions?: Record<string, string[]>
) {
  const account = await createAuthAccount(t, username);
  const rawKey = `grp_groups_${username}`;
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
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...(permissions ? { permissions: JSON.stringify(permissions) } : {}),
      },
    },
  });
  return {
    ...account,
    request: (path: string, method = 'GET', body?: unknown) =>
      t.fetch(`/api/v2${path}`, {
        method,
        headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
  };
}
async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return status === 204 ? null : response.json();
}

it('REST scopes and recipient consent preserve truthful ownership until acceptance', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await actor(t, 'transfer-rest-owner', {
      groups: ['read', 'write'],
    }),
    recipient = await actor(t, 'transfer-rest-recipient', {
      groups: ['read', 'write'],
    }),
    reader = await actor(t, 'transfer-rest-reader', { groups: ['read'] });
  const { groupId } = await body(
    await owner.request('/groups', 'POST', { name: 'Readers' }),
    201
  );
  const invite = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: recipient.personId }
  );
  await recipient.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: invite.inviteId,
  });
  const offer = await body(
    await owner.request(`/groups/${groupId}/ownership-transfer`, 'POST', {
      recipientId: recipient.personId,
    })
  );
  expect(offer.status).toBe('PENDING');
  await body(
    await reader.request(
      `/groups/${groupId}/ownership-transfer/accept`,
      'POST',
      { transferId: offer.transferId }
    ),
    403
  );
  expect((await body(await owner.request(`/groups/${groupId}`))).ownerId).toBe(
    owner.personId
  );
  const accepted = await body(
    await recipient.request(
      `/groups/${groupId}/ownership-transfer/accept`,
      'POST',
      { transferId: offer.transferId }
    )
  );
  expect(accepted).toMatchObject({
    ownerId: recipient.personId,
    status: 'ACCEPTED',
  });
  expect(
    (await body(await recipient.request('/health'))).capabilities.groupTransfers
  ).toEqual({ version: 1, retirement: true });
});
it('REST admin deletion cancels private offers and stale resolved actor cannot accept', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await actor(t, 'transfer-clean-owner'),
    recipient = await actor(t, 'transfer-clean-recipient'),
    admin = await actor(t, 'transfer-clean-admin');
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: admin.user._id }],
      update: { role: 'admin' },
    },
  });
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Cleanup',
  });
  const invite = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: recipient.personId }
  );
  await recipient.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: invite.inviteId,
  });
  const offer = await body(
    await owner.request(`/groups/${groupId}/ownership-transfer`, 'POST', {
      recipientId: recipient.personId,
    })
  );
  await body(
    await admin.request(`/admin/users/${owner.user._id}`, 'DELETE'),
    409
  );
  expect(
    (await body(await owner.request(`/groups/${groupId}/ownership-transfer`)))
      .status
  ).toBe('PENDING');
  await body(
    await admin.request(`/admin/users/${recipient.user._id}`, 'DELETE'),
    204
  );
  await expect(
    t.mutation(internal.groupTransfers.rest.decide, {
      groupId,
      personId: recipient.personId,
      transferId: offer.transferId,
      decision: 'ACCEPTED',
    })
  ).rejects.toThrow();
  const rows = await t.run(ctx => ctx.db.query('groupTransfers').collect());
  expect(rows).toHaveLength(1);
  expect(rows[0].status).toBe('CANCELLED');
  expect(
    rows.some(
      r =>
        r.recipientId === recipient.personId ||
        r.offeredById === recipient.personId
    )
  ).toBe(false);
  expect((await body(await owner.request(`/groups/${groupId}`))).ownerId).toBe(
    owner.personId
  );
});
