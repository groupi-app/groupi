import { describe, expect, it, vi } from 'vitest';
import { makeFunctionReference } from 'convex/server';
import { createTestInstance, TestScenarios } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
const issue = makeFunctionReference<'mutation'>(
  'authorization/mutations:issue'
);
const list = makeFunctionReference<'query'>('authorization/queries:list');
describe('bounded credential management', () => {
  it('uses only selected events through REST and rejects a guessed other event', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const first = await TestScenarios.singleEvent(t);
    const second = await TestScenarios.singleEvent(t);
    const account = await createAuthAccount(
      t,
      'selected-reader',
      first.personId
    );
    const created = await account.auth.mutation(issue, {
      name: 'Selected calendar',
      principalKind: 'user',
      actions: ['events.read'],
      selector: { kind: 'selected', eventIds: [first.eventId] },
    });
    const allowed = await t.fetch(`/api/v2/events/${first.eventId}`, {
      headers: { 'x-api-key': created.key },
    });
    expect(allowed.status).toBe(200);
    expect((await allowed.json()).id).toBe(first.eventId);
    const denied = await t.fetch(`/api/v2/events/${second.eventId}`, {
      headers: { 'x-api-key': created.key },
    });
    expect(denied.status).toBe(403);
  });

  it('updates within its bounds and stops writes after revocation', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const event = await TestScenarios.singleEvent(t);
    const account = await createAuthAccount(
      t,
      'bounded-writer',
      event.personId
    );
    const created = await account.auth.mutation(issue, {
      name: 'Writer',
      principalKind: 'user',
      actions: ['events.read', 'events.update'],
      selector: { kind: 'selected', eventIds: [event.eventId] },
    });
    const write = () =>
      t.fetch(`/api/v2/events/${event.eventId}`, {
        method: 'PATCH',
        headers: {
          'x-api-key': created.key,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ title: 'Bounded title' }),
      });
    expect((await write()).status).toBe(200);
    expect(
      (
        await (
          await t.fetch(`/api/v2/events/${event.eventId}`, {
            headers: { 'x-api-key': created.key },
          })
        ).json()
      ).title
    ).toBe('Bounded title');
    await account.auth.mutation(
      makeFunctionReference<'mutation'>('authorization/mutations:revoke'),
      { grantId: created.grantId }
    );
    expect((await write()).status).toBe(401);
  });
  it('attributes integration discussion to its own principal and preserves it during user recovery', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const scenario = await TestScenarios.singleEvent(t);
    const account = await createAuthAccount(
      t,
      'integration-sponsor',
      scenario.personId
    );
    const integration = await account.auth.mutation(issue, {
      name: 'Release bot',
      principalKind: 'integration',
      actions: ['discussion.create', 'discussion.read'],
      selector: { kind: 'selected', eventIds: [scenario.eventId] },
    });
    const response = await t.fetch(`/api/v2/events/${scenario.eventId}/posts`, {
      method: 'POST',
      headers: {
        'x-api-key': integration.key,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Release notice',
        content: '<p>Published</p>',
      }),
    });
    expect(response.status).toBe(201);
    const { postId } = await response.json();
    const read = await t.fetch(`/api/v2/posts/${postId}`, {
      headers: { 'x-api-key': integration.key },
    });
    const post = await read.json();
    expect(post.author).toMatchObject({
      id: integration.principalId,
      kind: 'integration',
      user: { name: 'Release bot', email: null },
    });
    expect(post.author.id).not.toBe(scenario.personId);
    await account.auth.mutation(
      makeFunctionReference<'mutation'>(
        'authorization/mutations:revokeUserCredentials'
      ),
      {}
    );
    expect(
      (
        await t.fetch(`/api/v2/posts/${postId}`, {
          headers: { 'x-api-key': integration.key },
        })
      ).status
    ).toBe(200);
  });
  it('denies write after current event authority is lost', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const scenario = await TestScenarios.singleEvent(t);
    const account = await createAuthAccount(
      t,
      'authority-owner',
      scenario.personId
    );
    const key = await account.auth.mutation(issue, {
      name: 'Organizer tool',
      principalKind: 'user',
      actions: ['events.update'],
      selector: { kind: 'selected', eventIds: [scenario.eventId] },
    });
    // Trusted fixture models a committed authority change before REST use.
    await t.run(ctx =>
      ctx.db.patch(scenario.membershipId, { role: 'ATTENDEE' })
    );
    const write = await t.fetch(`/api/v2/events/${scenario.eventId}`, {
      method: 'PATCH',
      headers: { 'x-api-key': key.key, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Denied' }),
    });
    expect(write.status).toBe(403);
  });
  it('binds integration uploads to the granted event and projects them only with file read permission', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const scenario = await TestScenarios.singleEvent(t);
    const account = await createAuthAccount(
      t,
      'upload-sponsor',
      scenario.personId
    );
    const created = await account.auth.mutation(issue, {
      name: 'File bot',
      principalKind: 'integration',
      actions: [
        'discussion.create',
        'discussion.read',
        'files.upload',
        'files.read',
      ],
      selector: { kind: 'selected', eventIds: [scenario.eventId] },
    });
    const uploaded = await t.fetch(
      `/api/v2/uploads?eventId=${scenario.eventId}`,
      {
        method: 'POST',
        headers: {
          'x-api-key': created.key,
          'content-type': 'text/plain',
          'X-Filename': 'notes.txt',
        },
        body: 'Event notes',
      }
    );
    expect(uploaded.status).toBe(201);
    const file = await uploaded.json();
    const response = await t.fetch(`/api/v2/events/${scenario.eventId}/posts`, {
      method: 'POST',
      headers: { 'x-api-key': created.key, 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Notes',
        content: '<p>Attached</p>',
        attachments: [file],
      }),
    });
    expect(response.status).toBe(201);
    const { postId } = await response.json();
    const details = await (
      await t.fetch(`/api/v2/posts/${postId}`, {
        headers: { 'x-api-key': created.key },
      })
    ).json();
    expect(details.attachments).toEqual([
      expect.objectContaining({
        filename: 'notes.txt',
        mimeType: 'text/plain',
        url: expect.any(String),
      }),
    ]);
    const reader = await account.auth.mutation(issue, {
      name: 'Discussion reader',
      principalKind: 'user',
      actions: ['discussion.read'],
      selector: { kind: 'selected', eventIds: [scenario.eventId] },
    });
    expect(
      (
        await (
          await t.fetch(`/api/v2/posts/${postId}`, {
            headers: { 'x-api-key': reader.key },
          })
        ).json()
      ).attachments
    ).toEqual([]);
  });
  it('returns only identifiers from update-only discussion credentials', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const scenario = await TestScenarios.singleEvent(t);
    const account = await createAuthAccount(
      t,
      'write-only-owner',
      scenario.personId
    );
    const post = await account.auth.mutation(
      makeFunctionReference<'mutation'>('posts/mutations:createPost'),
      {
        eventId: scenario.eventId,
        title: 'Private title',
        content: '<p>Existing content</p>',
      }
    );
    const key = await account.auth.mutation(issue, {
      name: 'Updater',
      principalKind: 'user',
      actions: ['discussion.update'],
      selector: { kind: 'selected', eventIds: [scenario.eventId] },
    });
    const response = await t.fetch(`/api/v2/posts/${post.postId}`, {
      method: 'PATCH',
      headers: { 'x-api-key': key.key, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ postId: post.postId });
  });
  it('projects email independently from display identity', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const account = await createAuthAccount(t, 'email-only-owner');
    const key = await account.auth.mutation(issue, {
      name: 'Email reader',
      principalKind: 'user',
      actions: ['identity.email'],
      selector: { kind: 'selected', eventIds: [] },
    });
    const response = await t.fetch('/api/v2/profile', {
      headers: { 'x-api-key': key.key },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      name: null,
      email: 'email-only-owner@example.com',
    });
  });
  it.each(['v1', 'v2'])(
    'supports browser preflight and bounded response headers in %s',
    async version => {
      const t = createTestInstance();
      registerBetterAuth(t);
      const scenario = await TestScenarios.singleEvent(t);
      const account = await createAuthAccount(
        t,
        'browser-owner',
        scenario.personId
      );
      const key = await account.auth.mutation(issue, {
        name: 'Browser reader',
        principalKind: 'user',
        actions: ['events.read'],
        selector: { kind: 'selected', eventIds: [scenario.eventId] },
      });
      const preflight = await t.fetch(
        `/api/${version}/events/${scenario.eventId}`,
        {
          method: 'OPTIONS',
          headers: {
            Origin: 'https://client.example',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Authorization',
          },
        }
      );
      expect(preflight.status).toBe(204);
      expect(preflight.headers.get('Access-Control-Allow-Headers')).toContain(
        'Authorization'
      );
      const response = await t.fetch(
        `/api/${version}/events/${scenario.eventId}`,
        {
          headers: { 'x-api-key': key.key, Origin: 'https://client.example' },
        }
      );
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    }
  );
  it('expands future events only after an explicit broad user selection', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const scenario = await TestScenarios.singleEvent(t);
    const account = await createAuthAccount(
      t,
      'future-events-owner',
      scenario.personId
    );
    const selected = await account.auth.mutation(issue, {
      name: 'Selected',
      principalKind: 'user',
      actions: ['events.read'],
      selector: { kind: 'selected', eventIds: [scenario.eventId] },
    });
    const broad = await account.auth.mutation(issue, {
      name: 'All current and future',
      principalKind: 'user',
      actions: ['events.read'],
      selector: { kind: 'all-current-and-future' },
    });
    const later = await account.auth.mutation(
      makeFunctionReference<'mutation'>('events/mutations:createEvent'),
      { title: 'Later event' }
    );
    expect(
      (
        await t.fetch(`/api/v2/events/${later.eventId}`, {
          headers: { 'x-api-key': selected.key },
        })
      ).status
    ).toBe(403);
    expect(
      (
        await t.fetch(`/api/v2/events/${later.eventId}`, {
          headers: { 'x-api-key': broad.key },
        })
      ).status
    ).toBe(200);
  });
  it('expires credentials without falling back to legacy account access', async () => {
    vi.useFakeTimers();
    try {
      const t = createTestInstance();
      registerBetterAuth(t);
      const scenario = await TestScenarios.singleEvent(t);
      const account = await createAuthAccount(
        t,
        'expiry-owner',
        scenario.personId
      );
      const expiresAt = Date.now() + 60000;
      const key = await account.auth.mutation(issue, {
        name: 'Short lived',
        principalKind: 'user',
        actions: ['events.read'],
        selector: { kind: 'selected', eventIds: [scenario.eventId] },
        expiresAt,
      });
      vi.setSystemTime(expiresAt + 1);
      expect(
        (
          await t.fetch(`/api/v2/events/${scenario.eventId}`, {
            headers: { 'x-api-key': key.key },
          })
        ).status
      ).toBe(401);
    } finally {
      vi.useRealTimers();
    }
  });
  it('projects only event-public profile fields and rejects global or unsupported access', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const scenario = await TestScenarios.singleEvent(t);
    const account = await createAuthAccount(
      t,
      'profile-event-owner',
      scenario.personId
    );
    const key = await account.auth.mutation(issue, {
      name: 'Event directory',
      principalKind: 'user',
      actions: ['members.read', 'profiles.read'],
      selector: { kind: 'selected', eventIds: [scenario.eventId] },
    });
    const members = await t.fetch(
      `/api/v2/events/${scenario.eventId}/members`,
      { headers: { 'x-api-key': key.key } }
    );
    expect(members.status).toBe(200);
    expect((await members.json())[0]).toMatchObject({
      user: { email: null },
      rsvpNote: null,
    });
    const profile = await t.fetch(
      `/api/v2/profile/profile-event-owner?eventId=${scenario.eventId}`,
      { headers: { 'x-api-key': key.key } }
    );
    expect(profile.status).toBe(200);
    expect(await profile.json()).toMatchObject({
      email: null,
      bio: null,
      pronouns: null,
    });
    expect(
      (
        await t.fetch('/api/v2/profile/profile-event-owner', {
          headers: { 'x-api-key': key.key },
        })
      ).status
    ).toBe(403);
    expect(
      (
        await t.fetch('/api/v2/notifications', {
          headers: { 'x-api-key': key.key },
        })
      ).status
    ).toBe(403);
  });
  it('issues a named selected-event key whose bounds are inspectable without its secret', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const scenario = await TestScenarios.singleEvent(t);
    const account = await createAuthAccount(
      t,
      'bounded-owner',
      scenario.personId
    );
    const created = await account.auth.mutation(issue, {
      name: 'Calendar sync',
      principalKind: 'user',
      actions: ['events.read'],
      selector: { kind: 'selected', eventIds: [scenario.eventId] },
    });
    expect(created.key).toMatch(/^grp_b_/);
    const grants = await account.auth.query(list, {});
    expect(grants).toEqual([
      expect.objectContaining({
        grantId: created.grantId,
        name: 'Calendar sync',
        actions: ['events.read'],
        selector: { kind: 'selected', eventIds: [scenario.eventId] },
      }),
    ]);
    expect(JSON.stringify(grants)).not.toContain(created.key);
  });
});
