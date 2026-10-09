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

it('pages deduplicated private Group reasons through authenticated read scopes and rechecks write eligibility', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await actor(t, 'discovery-http-owner'),
    viewer = await actor(t, 'discovery-http-viewer'),
    reader = await actor(t, 'discovery-http-reader', { events: ['read'] });
  expect(
    (await body(await viewer.request('/health'))).capabilities.groupDiscovery
  ).toEqual({ version: 1 });
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'HTTP Readers',
  });
  for (const target of [viewer, reader]) {
    const offer = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: target.personId }
    );
    await target.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: offer.inviteId,
    });
  }
  const secret = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Secret',
  });
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Shared HTTP', visibility: 'PRIVATE' }
  );
  await owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId,
    admissionPolicy: 'DIRECT',
  });
  for (const id of [groupId, secret])
    await owner.auth.mutation(
      api.groupEventAudiences.mutations.shareEventWithGroup,
      { eventId, groupId: id }
    );
  const page = await body(
    await reader.request('/events/discover?pagination=cursor&limit=1')
  );
  expect(page.items).toEqual([
    expect.objectContaining({
      id: eventId,
      entryAction: 'JOIN',
      accessReasons: {
        friends: false,
        groups: [{ groupId, name: 'HTTP Readers' }],
      },
    }),
  ]);
  expect(JSON.stringify(page)).not.toContain('Secret');
  expect(page.items[0]).not.toHaveProperty('members');
  await body(await reader.request(`/events/${eventId}/join`, 'POST'), 403);
  await owner.auth.mutation(api.groupModeration.mutations.removeGroupMember, {
    groupId,
    personId: viewer.personId,
  });
  await body(await viewer.request(`/events/${eventId}/join`, 'POST'), 403);
  expect((await body(await viewer.request('/events/discover'))).items).toEqual(
    []
  );
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.withdrawGroupEventAudience,
    { eventId, groupId }
  );
  await body(await reader.request(`/events/${eventId}/logistics`), 403);
});
