import { describe, expect, it } from 'vitest';
import { api, components } from '../_generated/api';
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

describe('Group moderation REST authority', () => {
  it('enforces owner appointments, manager ordinary targets, private bans, scopes and reentry', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'rest-mod-owner');
    const mod = await actor(t, 'rest-mod-moderator');
    const peer = await actor(t, 'rest-mod-peer');
    const member = await actor(t, 'rest-mod-member');
    const outsider = await actor(t, 'rest-mod-outsider');
    const readOnly = await actor(t, 'rest-mod-readonly', { groups: ['read'] });
    const { groupId } = await body(
      await owner.request('/groups', 'POST', { name: 'REST moderators' }),
      201
    );
    for (const person of [mod, peer, member]) {
      const offer = await body(
        await owner.request(`/groups/${groupId}/invitations`, 'POST', {
          inviteePersonId: person.personId,
        })
      );
      await body(
        await person.request(`/group-invites/${offer.inviteId}/accept`, 'POST')
      );
    }
    const rolePath = (id: string) => `/groups/${groupId}/members/${id}/role`;
    await body(
      await owner.request(rolePath(mod.personId), 'PATCH', {
        role: 'MODERATOR',
      })
    );
    await body(
      await owner.request(rolePath(peer.personId), 'PATCH', {
        role: 'MODERATOR',
      })
    );
    await body(
      await mod.request(rolePath(member.personId), 'PATCH', {
        role: 'MODERATOR',
      }),
      403
    );
    await body(
      await mod.request(`/groups/${groupId}/invitation-policy`, 'PATCH', {
        invitationsEnabled: false,
      }),
      403
    );
    await body(
      await mod.request(
        `/groups/${groupId}/members/${peer.personId}`,
        'DELETE'
      ),
      403
    );
    await body(
      await mod.request(`/groups/${groupId}/bans/${owner.personId}`, 'PUT'),
      403
    );
    await body(
      await readOnly.request(
        `/groups/${groupId}/bans/${member.personId}`,
        'PUT'
      ),
      403
    );
    expect(
      await body(await owner.request(`/groups/${groupId}/leave`, 'POST'), 403)
    ).toMatchObject({ error: { code: 'FORBIDDEN' } });
    const bansPath = `/groups/${groupId}/bans`;
    const banPath = `${bansPath}/${member.personId}`;
    await body(await mod.request(banPath, 'PUT'));
    await body(await mod.request(banPath, 'PUT'));
    await body(await outsider.request(bansPath), 403);
    const bans = await body(await mod.request(bansPath + '?limit=1'));
    expect(bans.items).toHaveLength(1);
    expect(JSON.stringify(bans)).not.toContain('@');
    expect(bans.items[0]).toMatchObject({
      personId: member.personId,
      username: 'rest-mod-member',
    });
    await body(
      await owner.request(`/groups/${groupId}/invitations`, 'POST', {
        inviteePersonId: member.personId,
      }),
      409
    );
    await body(await mod.request(banPath, 'DELETE'));
    const offer = await body(
      await mod.request(`/groups/${groupId}/invitations`, 'POST', {
        inviteePersonId: member.personId,
      })
    );
    await body(
      await member.request(`/group-invites/${offer.inviteId}/accept`, 'POST')
    );
    expect(
      await body(await member.request(`/groups/${groupId}/leave`, 'POST'))
    ).toEqual({ left: true });
    expect(
      await body(await member.request(`/groups/${groupId}/leave`, 'POST'))
    ).toEqual({ left: false });
    await body(
      await member.request(`/group-invites/${offer.inviteId}/accept`, 'POST'),
      409
    );
    expect(await body(await owner.request(`/groups/${groupId}`))).toMatchObject(
      { memberCount: 3, viewerRole: 'OWNER' }
    );
    await body(
      await mod.request(rolePath(mod.personId), 'PATCH', { role: 'OWNER' }),
      400
    );
    await body(
      await owner.request(rolePath(member.personId), 'PATCH', {
        role: 'MEMBER',
        actorId: owner.personId,
      }),
      400
    );
  });
  it('cleans banned targets through all three account paths and anonymizes surviving ban actors', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'ban-clean-owner');
    const admin = await actor(t, 'ban-clean-admin');
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: admin.user._id }],
        update: { role: 'admin' },
      },
    });
    const { groupId } = await body(
      await owner.request('/groups', 'POST', { name: 'Cleanup' }),
      201
    );
    for (const path of ['self', 'app', 'rest'] as const) {
      const target = await actor(t, `ban-clean-${path}`);
      await body(
        await owner.request(`/groups/${groupId}/bans/${target.personId}`, 'PUT')
      );
      if (path === 'self')
        await target.auth.mutation(api.users.mutations.deleteUserAccount, {
          confirmation: `ban-clean-${path}`,
        });
      else if (path === 'app')
        await admin.auth.mutation(api.admin.mutations.deletePerson, {
          personId: target.personId,
        });
      else
        await body(
          await admin.request(`/admin/users/${target.user._id}`, 'DELETE'),
          204
        );
      expect(
        (await body(await owner.request(`/groups/${groupId}/bans`))).items
      ).toEqual([]);
    }
    const mod = await actor(t, 'ban-clean-manager');
    const target = await actor(t, 'ban-clean-retained');
    const offer = await body(
      await owner.request(`/groups/${groupId}/invitations`, 'POST', {
        inviteePersonId: mod.personId,
      })
    );
    await body(
      await mod.request(`/group-invites/${offer.inviteId}/accept`, 'POST')
    );
    await body(
      await owner.request(
        `/groups/${groupId}/members/${mod.personId}/role`,
        'PATCH',
        { role: 'MODERATOR' }
      )
    );
    await body(
      await mod.request(`/groups/${groupId}/bans/${target.personId}`, 'PUT')
    );
    await mod.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'ban-clean-manager',
    });
    const retained = await t.run(ctx => ctx.db.query('groupBans').collect());
    expect(retained).toHaveLength(1);
    expect(retained[0]).toMatchObject({
      personId: target.personId,
      active: true,
    });
    expect(retained[0]).not.toHaveProperty('actorId');
    await body(await owner.request(`/groups/${groupId}`, 'DELETE'), 204);
    expect(await t.run(ctx => ctx.db.query('groupBans').collect())).toEqual([]);
  });
});
