import { expect, it } from 'vitest';
import { api, components, internal } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';
async function fixture() {
  const t = createTestInstance();
  registerBetterAuth(t);
  async function actor(name: string, permissions?: Record<string, string[]>) {
    const account = await createAuthAccount(t, name),
      rawKey = `grp_applications_${name}`;
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(rawKey)
    );
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'apikey',
        data: {
          userId: account.user._id,
          key: Buffer.from(hash).toString('base64url'),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          enabled: true,
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
  const owner = await actor('rest-owner'),
    author = await actor('rest-author', { events: ['read', 'write'] }),
    readonly = await actor('rest-readonly', { events: ['read'] });
  const eventId = await t.run(async ctx => {
    const id = await ctx.db.insert('events', {
      title: 'Apply',
      creatorId: owner.personId,
      timezone: 'UTC',
      potentialDateTimes: [],
      visibility: 'PUBLIC',
      admissionPolicy: 'APPLY',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert('memberships', {
      eventId: id,
      personId: owner.personId,
      role: 'ORGANIZER',
      rsvpStatus: 'YES',
      updatedAt: Date.now(),
    });
    return id;
  });
  return { t, owner, author, readonly, eventId };
}
it('REST scopes permit ordinary events writes, privacy rejects unauthorized queue, and strict inputs validate', async () => {
  const f = await fixture();
  expect(
    (
      await f.owner.request(
        `/events/${f.eventId}/applications/settings`,
        'PUT',
        {
          questions: [
            {
              id: 'choice',
              label: 'Choose',
              required: true,
              type: 'MULTIPLE_CHOICE',
              options: ['A'],
            },
          ],
          reviewerPolicy: 'ORGANIZER_ONLY',
        }
      )
    ).status
  ).toBe(200);
  expect(
    (
      await f.author.request(`/events/${f.eventId}/applications`, 'POST', {
        answers: { choice: 'B' },
      })
    ).status
  ).toBe(400);
  const response = await f.author.request(
    `/events/${f.eventId}/applications`,
    'POST',
    { answers: { choice: 'A' } }
  );
  expect(response.status).toBe(200);
  const application = await response.json();
  expect(
    (await f.author.request(`/events/${f.eventId}/applications/list`)).status
  ).toBe(403);
  expect(
    (
      await f.readonly.request(
        `/event-applications/${application.applicationId}/withdraw`,
        'POST'
      )
    ).status
  ).toBe(403);
  expect(
    (
      await f.author.request(
        `/event-applications/${application.applicationId}/withdraw`,
        'POST'
      )
    ).status
  ).toBe(200);
  expect(
    (
      await f.author.request(`/events/${f.eventId}/applications`, 'POST', {
        answers: { choice: 'A' },
        personId: f.owner.personId,
      })
    ).status
  ).toBe(400);
  const health = await (await f.author.request('/health')).json();
  expect(health.capabilities.eventApplications).toEqual({ version: 1 });
});
it('pending applicants retain own REST history after audience loss and canonical deleted-account keys fail', async () => {
  const f = await fixture();
  await f.author.request(`/events/${f.eventId}/applications`, 'POST', {
    answers: {},
  });
  await f.t.run(ctx => ctx.db.patch(f.eventId, { visibility: 'PRIVATE' }));
  expect(
    (await f.author.request(`/events/${f.eventId}/applications/form`)).status
  ).toBe(200);
  const history = await f.author.request(
    `/events/${f.eventId}/applications/history?limit=1`
  );
  expect((await history.json()).page).toHaveLength(1);
  await f.author.auth.mutation(api.users.mutations.deleteUserAccount, {
    confirmation: 'rest-author',
  });
  expect(
    (await f.author.request(`/events/${f.eventId}/applications/history`)).status
  ).toBe(401);
});
it('the real REST Event delete cleans private request records', async () => {
  const f = await fixture();
  await f.author.request(`/events/${f.eventId}/applications`, 'POST', {
    answers: {},
  });
  expect((await f.owner.request(`/events/${f.eventId}`, 'DELETE')).status).toBe(
    204
  );
  expect(
    await f.t.run(ctx =>
      ctx.db
        .query('eventApplications')
        .withIndex('by_event', q => q.eq('eventId', f.eventId))
        .collect()
    )
  ).toEqual([]);
});

it('rejects actors deleted or actively banned after REST authentication, without orphan history or notifications', async () => {
  for (const condition of ['deleted', 'banned'] as const) {
    const f = await fixture();
    // Resolve the real API-key actor before interleaving the account lifecycle.
    expect(
      (await f.author.request(`/events/${f.eventId}/applications/form`)).status
    ).toBe(200);
    if (condition === 'deleted')
      await f.author.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'rest-author',
      });
    else
      await f.t.mutation(components.betterAuth.adapter.updateOne, {
        input: {
          model: 'user',
          where: [{ field: '_id', value: f.author.user._id }],
          update: { banned: true, banExpires: Date.now() + 60000 },
        },
      });
    await expect(
      f.t.mutation(internal.eventApplications.rest.submit, {
        personId: f.author.personId,
        eventId: f.eventId,
        answers: {},
      })
    ).rejects.toThrow();
    expect(
      await f.t.run(ctx =>
        ctx.db
          .query('eventApplications')
          .withIndex('by_person', q => q.eq('personId', f.author.personId))
          .collect()
      )
    ).toEqual([]);
    const notifications = await f.owner.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notifications.notifications.filter(
        n => n.type === 'EVENT_APPLICATION_RECEIVED'
      )
    ).toEqual([]);
  }
});
