import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, components, internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance, TestScenarios } from './test_helpers';

type Version = 'v1' | 'v2';
async function actor(
  t: ReturnType<typeof createTestInstance>,
  name: string,
  personId?: Id<'persons'>
) {
  const account = await createAuthAccount(t, name, personId);
  const rawKey = `grp_discussion_parity_${name}`;
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
      },
    },
  });
  const request = (
    version: Version,
    path: string,
    method: string,
    body?: unknown
  ) =>
    t.fetch(`/api/${version}${path}`, {
      method,
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  return { ...account, request };
}
async function setup() {
  const t = createTestInstance();
  const scenario = await TestScenarios.multiUser(t);
  registerBetterAuth(t);
  const organizer = await actor(t, 'organizer', scenario.organizer.personId);
  const attendee = await actor(t, 'attendee', scenario.attendee.personId);
  const moderator = await actor(t, 'moderator');
  await t.run(ctx =>
    ctx.db.insert('memberships', {
      eventId: scenario.eventId,
      personId: moderator.personId,
      role: 'MODERATOR',
      rsvpStatus: 'YES',
    })
  );
  return {
    t,
    organizer,
    attendee,
    moderator,
    eventId: scenario.eventId,
    attendeeMembershipId: scenario.attendee.membershipId,
  };
}
async function notifications(
  t: ReturnType<typeof createTestInstance>,
  postId: Id<'posts'>,
  type?: string
) {
  return t.run(async ctx =>
    (
      await ctx.db
        .query('notifications')
        .withIndex('by_post', q => q.eq('postId', postId))
        .collect()
    )
      .filter(n => !type || n.type === type)
      .map(n => ({ personId: n.personId, type: n.type }))
  );
}
async function resultData(response: Response, version: Version) {
  const body = await response.json();
  if (version === 'v1') {
    expect(body.success).toBe(true);
    return body.data;
  }
  expect(body).not.toHaveProperty('success');
  return body;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe.each(['v1', 'v2'] as const)(
  '%s authenticated discussion parity',
  version => {
    it('rejects unauthenticated writes without creating discussion data', async () => {
      const { t, eventId } = await setup();
      const response = await t.fetch(
        `/api/${version}/events/${eventId}/posts`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title: 'Denied', content: 'Denied' }),
        }
      );
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({
        error: { code: 'UNAUTHORIZED' },
        ...(version === 'v1' ? { success: false } : {}),
      });
      expect(await t.run(ctx => ctx.db.query('posts').collect())).toEqual([]);
    });

    it('enforces createPosts restrictions without inserting a post', async () => {
      const { t, attendee, eventId } = await setup();
      await t.run(ctx =>
        ctx.db.patch(eventId, { permissions: { createPosts: 'ORGANIZER' } })
      );
      await expect(
        attendee.auth.mutation(api.posts.mutations.createPost, {
          eventId,
          title: 'Denied',
          content: 'Denied',
        })
      ).rejects.toThrow();
      const response = await attendee.request(
        version,
        `/events/${eventId}/posts`,
        'POST',
        { title: 'Denied', content: 'Denied' }
      );
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        error: { code: 'FORBIDDEN' },
        ...(version === 'v1' ? { success: false } : {}),
      });
      expect(await t.run(ctx => ctx.db.query('posts').collect())).toEqual([]);
    });

    it('creates member and mention notifications with native-equivalent recipients', async () => {
      const { t, organizer, attendee, eventId } = await setup();
      const content = `<span data-type="mention" data-id="${attendee.personId}">@attendee</span>`;
      const native = await organizer.auth.mutation(
        api.posts.mutations.createPost,
        { eventId, title: 'Native', content }
      );
      const response = await organizer.request(
        version,
        `/events/${eventId}/posts`,
        'POST',
        { title: ' REST ', content }
      );
      expect(response.status).toBe(201);
      const { postId } = await resultData(response, version);
      expect(
        await t.run(ctx => ctx.db.get(postId as Id<'posts'>))
      ).toMatchObject({ title: 'REST', authorId: organizer.personId, eventId });
      const expected = await notifications(t, native.postId);
      expect(expected).toEqual(
        expect.arrayContaining([
          { personId: attendee.personId, type: 'NEW_POST' },
          { personId: attendee.personId, type: 'USER_MENTIONED' },
        ])
      );
      expect(await notifications(t, postId)).toEqual(expected);
    });

    it('notifies the author when a moderator edits a post', async () => {
      const { t, attendee, moderator, eventId } = await setup();
      const { postId } = await attendee.auth.mutation(
        api.posts.mutations.createPost,
        { eventId, title: 'Original', content: 'Original body' }
      );
      const response = await moderator.request(
        version,
        `/posts/${postId}`,
        'PATCH',
        { title: ' Edited ' }
      );
      expect(response.status).toBe(200);
      expect(await resultData(response, version)).toMatchObject({
        id: postId,
        title: 'Edited',
        author: { id: attendee.personId },
      });
      expect(await notifications(t, postId, 'EVENT_EDITED')).toEqual([
        { personId: attendee.personId, type: 'EVENT_EDITED' },
      ]);
    });

    it('notifies the post author, prior participants and mentioned members when replying', async () => {
      const { t, organizer, attendee, moderator, eventId } = await setup();
      const { postId } = await organizer.auth.mutation(
        api.posts.mutations.createPost,
        { eventId, title: 'Thread', content: 'Discuss' }
      );
      await attendee.auth.mutation(api.replies.mutations.createReply, {
        postId,
        text: 'Prior reply',
      });
      const before = (await notifications(t, postId, 'NEW_REPLY')).length;
      const response = await moderator.request(
        version,
        `/posts/${postId}/replies`,
        'POST',
        {
          text: `<span data-type="mention" data-id="${attendee.personId}">@attendee</span>`,
        }
      );
      expect(response.status).toBe(201);
      const { replyId } = await resultData(response, version);
      expect(
        await t.run(ctx => ctx.db.get(replyId as Id<'replies'>))
      ).toMatchObject({ authorId: moderator.personId, postId });
      expect(
        (await notifications(t, postId, 'NEW_REPLY')).slice(before)
      ).toEqual([
        { personId: organizer.personId, type: 'NEW_REPLY' },
        { personId: attendee.personId, type: 'NEW_REPLY' },
      ]);
      expect(await notifications(t, postId, 'USER_MENTIONED')).toEqual([
        { personId: attendee.personId, type: 'USER_MENTIONED' },
      ]);
    });

    it('rejects deleting a reply after its author leaves the event', async () => {
      const { t, organizer, attendee, eventId, attendeeMembershipId } =
        await setup();
      const { postId } = await organizer.auth.mutation(
        api.posts.mutations.createPost,
        { eventId, title: 'Thread', content: 'Discuss' }
      );
      const { replyId } = await attendee.auth.mutation(
        api.replies.mutations.createReply,
        { postId, text: 'Keep this reply' }
      );
      await t.run(ctx => ctx.db.delete(attendeeMembershipId));
      await expect(
        attendee.auth.mutation(api.replies.mutations.deleteReply, { replyId })
      ).rejects.toThrow();
      const response = await attendee.request(
        version,
        `/replies/${replyId}`,
        'DELETE'
      );
      expect(response.status).toBe(403);
      expect(await t.run(ctx => ctx.db.get(replyId))).not.toBeNull();
    });

    it('rejects former-author edits and deletion after membership removal', async () => {
      const { t, attendee, eventId, attendeeMembershipId } = await setup();
      const { postId } = await attendee.auth.mutation(
        api.posts.mutations.createPost,
        { eventId, title: 'Owned post', content: 'Owned content' }
      );
      const { replyId } = await attendee.auth.mutation(
        api.replies.mutations.createReply,
        { postId, text: 'Owned reply' }
      );
      await t.run(ctx => ctx.db.delete(attendeeMembershipId));
      await expect(
        attendee.auth.mutation(api.posts.mutations.updatePost, {
          postId,
          title: 'Native edit',
        })
      ).rejects.toThrow();
      await expect(
        attendee.auth.mutation(api.replies.mutations.updateReply, {
          replyId,
          text: 'Native edit',
        })
      ).rejects.toThrow();
      await expect(
        attendee.auth.mutation(api.posts.mutations.deletePost, {
          postId,
        })
      ).rejects.toThrow();
      for (const [path, method, body] of [
        [`/posts/${postId}`, 'PATCH', { title: 'REST edit' }],
        [`/replies/${replyId}`, 'PATCH', { text: 'REST edit' }],
        [`/posts/${postId}`, 'DELETE', undefined],
      ] as const) {
        expect(
          (await attendee.request(version, path, method, body)).status
        ).toBe(403);
      }
      expect(await t.run(ctx => ctx.db.get(postId))).toMatchObject({
        title: 'Owned post',
        content: 'Owned content',
      });
      expect(await t.run(ctx => ctx.db.get(replyId))).toMatchObject({
        text: 'Owned reply',
      });
    });

    it.each([
      'post-create',
      'post-update',
      'reply-create',
      'reply-update',
    ] as const)(
      'translates shared whitespace validation to HTTP400 for %s without changing data',
      async operation => {
        const { t, organizer, eventId } = await setup();
        const { postId } = await organizer.auth.mutation(
          api.posts.mutations.createPost,
          { eventId, title: 'Original post', content: 'Original content' }
        );
        const { replyId } = await organizer.auth.mutation(
          api.replies.mutations.createReply,
          { postId, text: 'Original reply' }
        );
        const response =
          operation === 'post-create'
            ? await organizer.request(
                version,
                `/events/${eventId}/posts`,
                'POST',
                { title: '   ', content: 'Body' }
              )
            : operation === 'post-update'
              ? await organizer.request(version, `/posts/${postId}`, 'PATCH', {
                  title: '   ',
                })
              : operation === 'reply-create'
                ? await organizer.request(
                    version,
                    `/posts/${postId}/replies`,
                    'POST',
                    { text: '   ' }
                  )
                : await organizer.request(
                    version,
                    `/replies/${replyId}`,
                    'PATCH',
                    { text: '   ' }
                  );
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({
          error: { code: 'VALIDATION_ERROR' },
          ...(version === 'v1' ? { success: false } : {}),
        });
        const stored = await t.run(async ctx => ({
          posts: await ctx.db.query('posts').collect(),
          replies: await ctx.db.query('replies').collect(),
        }));
        expect(stored.posts).toHaveLength(1);
        expect(stored.posts[0]).toMatchObject({
          title: 'Original post',
          content: 'Original content',
        });
        expect(stored.replies).toHaveLength(1);
        expect(stored.replies[0]).toMatchObject({ text: 'Original reply' });
      }
    );

    it('preserves versioned deletion responses and removes post replies', async () => {
      const { t, organizer, attendee, eventId } = await setup();
      const { postId } = await organizer.auth.mutation(
        api.posts.mutations.createPost,
        { eventId, title: 'Thread', content: 'Discuss' }
      );
      const { replyId } = await attendee.auth.mutation(
        api.replies.mutations.createReply,
        { postId, text: 'Reply' }
      );
      const response = await organizer.request(
        version,
        `/posts/${postId}`,
        'DELETE'
      );
      expect(response.status).toBe(version === 'v1' ? 200 : 204);
      if (version === 'v1')
        expect(await response.json()).toEqual({
          success: true,
          data: { message: 'Post deleted successfully' },
        });
      else expect(await response.text()).toBe('');
      expect(await t.run(ctx => ctx.db.get(postId))).toBeNull();
      expect(await t.run(ctx => ctx.db.get(replyId))).toBeNull();
      expect(await notifications(t, postId)).toEqual([]);
    });
  }
);

describe('discussion write transaction authorization', () => {
  it.each([
    'post-update',
    'post-delete',
    'reply-update',
    'reply-delete',
  ] as const)('requires an authorized actor inside %s', async operation => {
    const { t, organizer, attendee, moderator, eventId } = await setup();
    const { postId } = await organizer.auth.mutation(
      api.posts.mutations.createPost,
      { eventId, title: 'Protected', content: 'Protected' }
    );
    const { replyId } = await attendee.auth.mutation(
      api.replies.mutations.createReply,
      { postId, text: 'Protected reply' }
    );
    // A transport preflight may have observed MODERATOR before this change.
    await t.run(async ctx => {
      const membership = await ctx.db
        .query('memberships')
        .withIndex('by_person_event', q =>
          q.eq('personId', moderator.personId).eq('eventId', eventId)
        )
        .unique();
      await ctx.db.patch(membership!._id, { role: 'ATTENDEE' });
    });
    const personId = moderator.personId;
    const action =
      operation === 'post-update'
        ? t.mutation(internal.posts.rest.updatePost, {
            postId,
            personId,
            title: 'Denied',
          })
        : operation === 'post-delete'
          ? t.mutation(internal.posts.rest.deletePost, { postId, personId })
          : operation === 'reply-update'
            ? t.mutation(internal.replies.rest.updateReply, {
                replyId,
                personId,
                text: 'Denied',
              })
            : t.mutation(internal.replies.rest.deleteReply, {
                replyId,
                personId,
              });
    await expect(action).rejects.toThrow('FORBIDDEN');
    expect(await t.run(ctx => ctx.db.get(postId))).toMatchObject({
      title: 'Protected',
    });
    expect(await t.run(ctx => ctx.db.get(replyId))).toMatchObject({
      text: 'Protected reply',
    });
  });
});

describe.each(['v1', 'v2'] as const)('%s reply lock parity', version => {
  it('supports creation locks, denies stale new replies and preserves normal edits without extra setting notifications', async () => {
    const { t, organizer, attendee, moderator, eventId } = await setup();
    const response = await attendee.request(
      version,
      `/events/${eventId}/posts`,
      'POST',
      {
        title: 'Closed replies',
        content: 'Readable content',
        repliesDisabled: true,
      }
    );
    expect(response.status).toBe(201);
    const { postId } = await resultData(response, version);
    expect(
      (
        await organizer.request(version, `/posts/${postId}/replies`, 'POST', {
          text: 'Old client reply',
        })
      ).status
    ).toBe(403);
    const before = await notifications(t, postId);
    const open = await moderator.request(version, `/posts/${postId}`, 'PATCH', {
      repliesDisabled: false,
      expectedRepliesRevision: 0,
    });
    expect(open.status).toBe(200);
    expect(await notifications(t, postId)).toEqual(before);
    expect((await t.run(ctx => ctx.db.get(postId)))?.editedAt).toBeUndefined();
    const reply = await organizer.request(
      version,
      `/posts/${postId}/replies`,
      'POST',
      { text: 'Allowed after reopening' }
    );
    expect(reply.status).toBe(201);
    const close = await attendee.request(version, `/posts/${postId}`, 'PATCH', {
      repliesDisabled: true,
      expectedRepliesRevision: 1,
    });
    expect(close.status).toBe(200);
    const stale = await moderator.request(
      version,
      `/posts/${postId}`,
      'PATCH',
      { repliesDisabled: false, expectedRepliesRevision: 0 }
    );
    expect(stale.status).toBe(409);
    expect(
      (
        await attendee.request(version, `/posts/${postId}`, 'PATCH', {
          content: 'Legacy content edit',
        })
      ).status
    ).toBe(200);
    expect(await t.run(ctx => ctx.db.get(postId))).toMatchObject({
      repliesDisabled: true,
      repliesRevision: 2,
    });
    expect(
      (await organizer.request(version, `/posts/${postId}/replies`, 'GET'))
        .status
    ).toBe(200);
  });
});
