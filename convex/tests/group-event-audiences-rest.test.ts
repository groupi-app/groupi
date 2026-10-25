import { expect, it, vi, afterEach } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

afterEach(() => vi.useRealTimers());
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
    rawKey,
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

it('enforces real scopes and both authorities, and pages safe filtered previews without leaking other Groups', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await actor(t, 'aud-http-owner'),
    viewer = await actor(t, 'aud-http-viewer'),
    reader = await actor(t, 'aud-http-reader', { groups: ['read'] }),
    manager = await actor(t, 'aud-http-manager', { groups: ['read', 'write'] });
  expect(
    (await body(await owner.request('/health'))).capabilities
      .groupEventAudiences
  ).toEqual({ version: 1 });
  const { groupId } = await body(
    await owner.request('/groups', 'POST', { name: 'HTTP community' }),
    201
  );
  for (const person of [viewer, reader, manager]) {
    const invite = await body(
      await owner.request(`/groups/${groupId}/invitations`, 'POST', {
        inviteePersonId: person.personId,
      })
    );
    await person.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: invite.inviteId,
    });
  }
  await owner.auth.mutation(api.groupModeration.mutations.setGroupMemberRole, {
    groupId,
    personId: manager.personId,
    role: 'MODERATOR',
  });
  const { eventId } = await body(
    await owner.request('/events', 'POST', {
      title: 'Safe logistics',
      location: 'Library',
    }),
    201
  );
  await body(
    await owner.request(
      `/events/${eventId}/audiences/groups/${groupId}`,
      'POST'
    )
  );
  await body(
    await reader.request(`/groups/${groupId}/event-sharing`, 'PUT', {
      policy: 'MEMBERS',
    }),
    403
  );
  await body(
    await viewer.request(
      `/events/${eventId}/audiences/groups/${groupId}`,
      'POST'
    ),
    403
  );
  const read = await body(await viewer.request(`/events/${eventId}/logistics`));
  expect(read.event.title).toBe('Safe logistics');
  expect(read).not.toHaveProperty('memberships');
  await body(await viewer.request(`/events/${eventId}/members`), 403);
  await body(await manager.request(`/events/${eventId}/audiences`), 403);
  const { eventId: past } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Past', chosenDateTime: new Date(Date.now() + 1000).toISOString() }
  );
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { eventId: past, groupId }
  );
  vi.setSystemTime(Date.now() + 2000);
  const page1 = await body(
    await reader.request(`/groups/${groupId}/events?limit=1`)
  );
  expect(page1.items).toEqual([]);
  expect(page1.nextCursor).not.toBeNull();
  const page2 = await body(
    await reader.request(
      `/groups/${groupId}/events?limit=1&cursor=${encodeURIComponent(page1.nextCursor)}`
    )
  );
  expect(page2.items[0]).toMatchObject({
    event: { _id: eventId, title: 'Safe logistics' },
    canWithdraw: false,
  });
  expect(page2.items[0]).not.toHaveProperty('attendees');
  await body(
    await manager.request(`/groups/${groupId}/events/${eventId}`, 'DELETE')
  );
  await body(await viewer.request(`/events/${eventId}/logistics`), 403);
  expect(
    (await body(await owner.request(`/events/${eventId}/audiences`))).groups
  ).toHaveLength(0);
  await body(await owner.request(`/groups/${groupId}/events?limit=101`), 400);
});
it('cleans indexed grants on retirement/deletion and anonymizes sharing actors through all three account delete paths', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const keeper = await actor(t, 'aud-clean-keeper'),
    admin = await actor(t, 'aud-clean-admin');
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: admin.user._id }],
      update: { role: 'admin' },
    },
  });
  for (const path of ['self', 'app', 'rest'] as const) {
    const original = await actor(t, `aud-clean-${path}`);
    const groupId = await original.auth.mutation(
      api.groups.mutations.createGroup,
      { name: `Cleanup ${path}` }
    );
    const invite = await original.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: keeper.personId }
    );
    await keeper.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: invite.inviteId,
    });
    const { eventId } = await original.auth.mutation(
      api.events.mutations.createEvent,
      { title: `Retained ${path}`, visibility: 'PRIVATE' }
    );
    await original.auth.mutation(
      api.groupEventAudiences.mutations.shareEventWithGroup,
      { groupId, eventId }
    );
    const eventInvite = await original.auth.mutation(
      api.eventInvites.mutations.sendEventInvite,
      { eventId, inviteePersonId: keeper.personId, role: 'ATTENDEE' }
    );
    await keeper.auth.mutation(api.eventInvites.mutations.acceptEventInvite, {
      inviteId: eventInvite.inviteId,
    });
    const groupTransfer = await original.auth.mutation(
      api.groupTransfers.mutations.offer,
      { groupId, recipientId: keeper.personId }
    );
    await keeper.auth.mutation(api.groupTransfers.mutations.accept, {
      groupId,
      transferId: groupTransfer!.transferId!,
    });
    const eventTransfer = await original.auth.mutation(
      api.eventTransfers.mutations.offer,
      { eventId, recipientId: keeper.personId }
    );
    await keeper.auth.mutation(api.eventTransfers.mutations.accept, {
      eventId,
      transferId: eventTransfer!.transferId!,
    });
    if (path === 'self')
      await original.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: `aud-clean-${path}`,
      });
    else if (path === 'app')
      await admin.auth.mutation(api.admin.mutations.deletePerson, {
        personId: original.personId,
      });
    else
      await body(
        await admin.request(`/admin/users/${original.user._id}`, 'DELETE'),
        204
      );
    expect(
      await t.run(ctx =>
        ctx.db
          .query('groupEventAudiences')
          .withIndex('by_sharedById', q =>
            q.eq('sharedById', original.personId)
          )
          .collect()
      )
    ).toHaveLength(0);
    expect(
      (
        await keeper.auth.query(
          api.groupEventAudiences.queries.listGroupSharedEvents,
          { groupId, paginationOpts: { numItems: 20, cursor: null } }
        )
      ).page
    ).toHaveLength(1);
    await expect(
      original.auth.mutation(
        api.groupEventAudiences.mutations.shareEventWithGroup,
        { groupId, eventId }
      )
    ).rejects.toThrow();
    await keeper.auth.mutation(api.groups.mutations.deleteGroup, { groupId });
    expect(
      await t.run(ctx =>
        ctx.db
          .query('groupEventAudiences')
          .withIndex('by_groupId', q => q.eq('groupId', groupId))
          .collect()
      )
    ).toHaveLength(0);
    expect(
      (
        await keeper.auth.query(api.events.queries.getEventLogistics, {
          eventId,
        })
      ).entryAction
    ).toBe('MEMBER');
  }
  const groupId = await keeper.auth.mutation(api.groups.mutations.createGroup, {
      name: 'Event cleanup',
    }),
    { eventId } = await keeper.auth.mutation(api.events.mutations.createEvent, {
      title: 'Deleted independent Event',
    });
  await keeper.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId, eventId }
  );
  await keeper.auth.mutation(api.events.mutations.deleteEvent, { eventId });
  expect(
    await t.run(ctx =>
      ctx.db
        .query('groupEventAudiences')
        .withIndex('by_eventId', q => q.eq('eventId', eventId))
        .collect()
    )
  ).toHaveLength(0);
  expect(
    await keeper.auth.query(api.groups.queries.getGroup, { groupId })
  ).not.toBeNull();
});

it('cleans audience grants through both legacy REST and app-admin Event deletion paths', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await actor(t, 'aud-legacy-owner'),
    admin = await actor(t, 'aud-legacy-admin');
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: admin.user._id }],
      update: { role: 'admin' },
    },
  });
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Legacy cleanup',
  });
  for (const path of ['legacy', 'admin'] as const) {
    const { eventId } = await owner.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'Deleted via ' + path }
    );
    await owner.auth.mutation(
      api.groupEventAudiences.mutations.shareEventWithGroup,
      { eventId, groupId }
    );
    if (path === 'legacy')
      expect(
        (
          await t.fetch(`/api/v1/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'x-api-key': owner.rawKey },
          })
        ).status
      ).toBe(200);
    else
      await admin.auth.mutation(api.admin.mutations.deleteEvent, { eventId });
    expect(
      await t.run(ctx =>
        ctx.db
          .query('groupEventAudiences')
          .withIndex('by_eventId', q => q.eq('eventId', eventId))
          .collect()
      )
    ).toHaveLength(0);
  }
});
