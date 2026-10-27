import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, internal } from '../_generated/api';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { writeIntegrationContent } from '../discussion/integrations';

const instances: ReturnType<typeof createTestInstance>[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  for (const t of instances.splice(0))
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  vi.useRealTimers();
});
async function fixture(context: 'event' | 'group') {
  const t = createTestInstance();
  instances.push(t);
  registerBetterAuth(t);
  const manager = await createAuthAccount(t, `${context}-manager`);
  const author = await createAuthAccount(t, `${context}-author`);
  const moderator = await createAuthAccount(t, `${context}-moderator`);
  const member = await createAuthAccount(t, `${context}-member`);
  const outsider = await createAuthAccount(t, `${context}-outsider`);
  const eventId =
    context === 'event'
      ? (
          await manager.auth.mutation(api.events.mutations.createEvent, {
            title: 'Discussion',
          })
        ).eventId
      : undefined;
  const groupId =
    context === 'group'
      ? await manager.auth.mutation(api.groups.mutations.createGroup, {
          name: 'Discussion',
        })
      : undefined;
  const authorMembership = await t.run(async ctx => {
    let authorMembership;
    for (const actor of [author, moderator, member]) {
      const id = eventId
        ? await ctx.db.insert('memberships', {
            eventId,
            personId: actor.personId,
            role: actor === moderator ? 'MODERATOR' : 'ATTENDEE',
            rsvpStatus: 'YES',
          })
        : await ctx.db.insert('groupMemberships', {
            groupId: groupId!,
            personId: actor.personId,
            role: actor === moderator ? 'MODERATOR' : 'MEMBER',
            joinedAt: Date.now(),
          });
      if (actor === author) authorMembership = id;
    }
    return authorMembership!;
  });
  const create = async (
    actor = author,
    repliesDisabled?: boolean,
    title = 'Post'
  ) =>
    eventId
      ? (
          await actor.auth.mutation(api.posts.mutations.createPost, {
            eventId,
            title,
            content: 'Discussion body',
            repliesDisabled,
          })
        ).postId
      : actor.auth.mutation(api.groupPosts.mutations.createPost, {
          groupId: groupId!,
          title,
          content: 'Discussion body',
          repliesDisabled,
        });
  const pins = () =>
    eventId
      ? member.auth.query(api.posts.queries.getPinnedEventPosts, { eventId })
      : member.auth.query(api.groupPosts.queries.listPinnedPosts, {
          groupId: groupId!,
        });
  return {
    t,
    context,
    eventId,
    groupId,
    manager,
    author,
    moderator,
    member,
    outsider,
    authorMembership,
    create,
    pins,
  };
}

for (const context of ['event', 'group'] as const)
  describe(`${context} post controls`, () => {
    it('allows current authors and moderators to change replies, rejects stale intentions and revoked authors', async () => {
      const f = await fixture(context);
      const postId = await f.create(f.author, true);
      const toggle = api.posts.mutations.setRepliesDisabled;
      await expect(
        f.member.auth.mutation(toggle, {
          postId,
          repliesDisabled: false,
          expectedRevision: 0,
        })
      ).rejects.toThrow('author');
      await expect(
        f.outsider.auth.mutation(toggle, {
          postId,
          repliesDisabled: false,
          expectedRevision: 0,
        })
      ).rejects.toThrow();
      expect(
        await f.moderator.auth.mutation(toggle, {
          postId,
          repliesDisabled: false,
          expectedRevision: 0,
        })
      ).toEqual({ repliesDisabled: false, revision: 1 });
      await expect(
        f.author.auth.mutation(toggle, {
          postId,
          repliesDisabled: true,
          expectedRevision: 0,
        })
      ).rejects.toThrow('changed');
      expect(
        await f.author.auth.mutation(toggle, {
          postId,
          repliesDisabled: true,
          expectedRevision: 1,
        })
      ).toEqual({ repliesDisabled: true, revision: 2 });
      // Moderator closure can be reopened by the eligible author, as approved.
      await f.moderator.auth.mutation(toggle, {
        postId,
        repliesDisabled: false,
        expectedRevision: 2,
      });
      await f.moderator.auth.mutation(toggle, {
        postId,
        repliesDisabled: true,
        expectedRevision: 3,
      });
      await f.author.auth.mutation(toggle, {
        postId,
        repliesDisabled: false,
        expectedRevision: 4,
      });
      await f.t.run(ctx => ctx.db.delete(f.authorMembership));
      await expect(
        f.author.auth.mutation(toggle, {
          postId,
          repliesDisabled: true,
          expectedRevision: 5,
        })
      ).rejects.toThrow();
      const dto = f.eventId
        ? (await f.member.auth.query(api.posts.queries.getPostDetail, {
            postId,
          }))!.post
        : await f.member.auth.query(api.groupPosts.queries.getPost, { postId });
      expect(dto).toMatchObject({
        repliesDisabled: false,
        repliesRevision: 5,
        canPin: false,
        canSetRepliesDisabled: false,
      });
    });

    it('locks every new reply including managers while preserving old reply reads, edit/delete and post content editing', async () => {
      const f = await fixture(context);
      const postId = await f.create();
      const replyId = f.eventId
        ? (
            await f.member.auth.mutation(api.replies.mutations.createReply, {
              postId,
              text: 'Existing reply',
            })
          ).replyId
        : await f.member.auth.mutation(api.groupPosts.mutations.createReply, {
            postId,
            content: 'Existing reply',
          });
      await f.manager.auth.mutation(api.posts.mutations.setRepliesDisabled, {
        postId,
        repliesDisabled: true,
        expectedRevision: 0,
      });
      if (f.eventId) {
        await expect(
          f.member.auth.mutation(api.replies.mutations.createReply, {
            postId,
            text: 'Stale client new reply',
          })
        ).rejects.toThrow('disabled');
        await expect(
          f.manager.auth.mutation(api.replies.mutations.createReply, {
            postId,
            text: 'Manager new reply',
          })
        ).rejects.toThrow('disabled');
        await expect(
          f.t.mutation(internal.replies.rest.createReply, {
            postId,
            personId: f.member.personId,
            text: 'Legacy REST new reply',
          })
        ).rejects.toThrow('disabled');
        await expect(
          f.t.mutation(internal.discussion.rest.write, {
            kind: 'replies',
            operation: 'create',
            id: postId,
            personId: f.member.personId,
            body: { text: 'REST v2 new reply' },
          })
        ).rejects.toThrow('disabled');
        expect(
          (
            await f.member.auth.query(api.posts.queries.getPostDetail, {
              postId,
            })
          )?.post.replies
        ).toHaveLength(1);
        await f.member.auth.mutation(api.replies.mutations.updateReply, {
          replyId,
          text: 'Edited existing reply',
        });
        await f.author.auth.mutation(api.posts.mutations.updatePost, {
          postId,
          content: 'Old edit client preserves lock',
        });
        await f.member.auth.mutation(api.replies.mutations.deleteReply, {
          replyId,
        });
      } else {
        await expect(
          f.member.auth.mutation(api.groupPosts.mutations.createReply, {
            postId,
            content: 'New reply',
          })
        ).rejects.toThrow('disabled');
        await expect(
          f.manager.auth.mutation(api.groupPosts.mutations.createReply, {
            postId,
            content: 'Manager new reply',
          })
        ).rejects.toThrow('disabled');
        expect(
          (
            await f.member.auth.query(api.groupPosts.queries.listReplies, {
              postId,
              paginationOpts: { numItems: 10, cursor: null },
            })
          ).page
        ).toHaveLength(1);
        await f.member.auth.mutation(api.groupPosts.mutations.updateReply, {
          replyId,
          content: 'Edited existing reply',
        });
        await f.author.auth.mutation(api.groupPosts.mutations.updatePost, {
          postId,
          content: 'Old edit client preserves lock',
        });
        await f.member.auth.mutation(api.groupPosts.mutations.deleteReply, {
          replyId,
        });
      }
      expect((await f.t.run(ctx => ctx.db.get(postId)))?.repliesDisabled).toBe(
        true
      );
      expect(await f.t.run(ctx => ctx.db.get(replyId))).toBeNull();
    });

    it('serializes four concurrent pins at three, orders same-instant pins and excludes them from ordinary pagination', async () => {
      const f = await fixture(context);
      const postIds = [];
      for (let i = 0; i < 4; i++)
        postIds.push(await f.create(f.author, false, `Post ${i}`));
      const before = await f.t.run(ctx =>
        ctx.db.query('notifications').collect()
      );
      await expect(
        f.author.auth.mutation(api.posts.mutations.setPinned, {
          postId: postIds[0],
          pinned: true,
          expectedRevision: 0,
        })
      ).rejects.toThrow('moderators');
      const results = await Promise.allSettled(
        postIds.map(postId =>
          f.manager.auth.mutation(api.posts.mutations.setPinned, {
            postId,
            pinned: true,
            expectedRevision: 0,
          })
        )
      );
      expect(
        results.filter(result => result.status === 'fulfilled')
      ).toHaveLength(3);
      expect(
        results.filter(result => result.status === 'rejected')
      ).toHaveLength(1);
      const pinned = await f.pins();
      expect(pinned).toHaveLength(3);
      const times = pinned.map(post => post.pinnedAt!);
      expect(new Set(times).size).toBe(3);
      expect(times).toEqual([...times].sort((a, b) => b - a));
      const normal = f.eventId
        ? await f.member.auth.query(api.posts.queries.getEventPostFeedPage, {
            eventId: f.eventId,
            excludePinned: true,
            paginationOpts: { numItems: 1, cursor: null },
          })
        : await f.member.auth.query(api.groupPosts.queries.listPosts, {
            groupId: f.groupId!,
            excludePinned: true,
            paginationOpts: { numItems: 1, cursor: null },
          });
      expect(normal.page).toHaveLength(1);
      expect(pinned.some(post => post._id === normal.page[0]._id)).toBe(false);
      expect(
        new Set([...pinned, ...normal.page].map(post => post._id)).size
      ).toBe(4);
      expect(
        await f.t.run(ctx => ctx.db.query('notifications').collect())
      ).toEqual(before);
      await f.moderator.auth.mutation(api.posts.mutations.setPinned, {
        postId: pinned[0]._id,
        pinned: false,
        expectedRevision: pinned[0].pinRevision,
      });
      await expect(
        f.manager.auth.mutation(api.posts.mutations.setPinned, {
          postId: pinned[0]._id,
          pinned: true,
          expectedRevision: pinned[0].pinRevision,
        })
      ).rejects.toThrow('changed');
      await f.manager.auth.mutation(api.posts.mutations.setPinned, {
        postId: pinned[0]._id,
        pinned: true,
        expectedRevision: pinned[0].pinRevision + 1,
      });
      expect((await f.pins())[0]._id).toBe(pinned[0]._id);
      // The cap and retrieval stay scoped to the exact parent, never a whole account.
      const otherParent = f.eventId
        ? (
            await f.manager.auth.mutation(api.events.mutations.createEvent, {
              title: 'Other parent',
            })
          ).eventId
        : await f.manager.auth.mutation(api.groups.mutations.createGroup, {
            name: 'Other parent',
          });
      const otherPostId = f.eventId
        ? (
            await f.manager.auth.mutation(api.posts.mutations.createPost, {
              eventId: otherParent as typeof f.eventId,
              title: 'Other',
              content: 'Other parent post',
            })
          ).postId
        : await f.manager.auth.mutation(api.groupPosts.mutations.createPost, {
            groupId: otherParent as NonNullable<typeof f.groupId>,
            title: 'Other',
            content: 'Other parent post',
          });
      await f.manager.auth.mutation(api.posts.mutations.setPinned, {
        postId: otherPostId,
        pinned: true,
        expectedRevision: 0,
      });
      expect((await f.pins()).map(post => post._id)).not.toContain(otherPostId);
      await f.t.run(async ctx => {
        const membership = f.eventId
          ? await ctx.db
              .query('memberships')
              .withIndex('by_person_event', q =>
                q.eq('personId', f.moderator.personId).eq('eventId', f.eventId!)
              )
              .first()
          : await ctx.db
              .query('groupMemberships')
              .withIndex('by_groupId_and_personId', q =>
                q.eq('groupId', f.groupId!).eq('personId', f.moderator.personId)
              )
              .first();
        if (!membership) throw new Error('Missing moderator membership');
        await ctx.db.delete(membership._id);
      });
      await expect(
        f.moderator.auth.mutation(api.posts.mutations.setPinned, {
          postId: pinned[1]._id,
          pinned: false,
          expectedRevision: pinned[1].pinRevision,
        })
      ).rejects.toThrow();
      await expect(
        f.outsider.auth.query(
          f.eventId
            ? api.posts.queries.getPinnedEventPosts
            : api.groupPosts.queries.listPinnedPosts,
          f.eventId ? { eventId: f.eventId } : { groupId: f.groupId! }
        )
      ).rejects.toThrow();
    });
  });

it('rejects stale Integration reply creation while preserving Integration old-reply editing/deletion', async () => {
  const f = await fixture('event');
  const principalId = await f.t.run(ctx =>
    ctx.db.insert('authorizationPrincipals', {
      kind: 'integration',
      ownerPersonId: f.manager.personId,
      name: 'Calendar helper',
      createdAt: Date.now(),
    })
  );
  const postId = await f.create();
  const input = {
    principalId,
    sponsorPersonId: f.manager.personId,
    eventId: f.eventId!,
    kind: 'replies' as const,
    postId,
  };
  const created = await f.t.run(ctx =>
    writeIntegrationContent(ctx, {
      ...input,
      operation: 'create',
      text: 'Existing integration reply',
    })
  );
  if (!('replyId' in created)) throw new Error('Expected integration reply');
  await f.author.auth.mutation(api.posts.mutations.setRepliesDisabled, {
    postId,
    repliesDisabled: true,
    expectedRevision: 0,
  });
  await expect(
    f.t.run(ctx =>
      writeIntegrationContent(ctx, {
        ...input,
        operation: 'create',
        text: 'Stale integration reply',
      })
    )
  ).rejects.toThrow('disabled');
  await f.t.run(ctx =>
    writeIntegrationContent(ctx, {
      ...input,
      replyId: created.replyId,
      operation: 'edit',
      text: 'Edited existing integration reply',
    })
  );
  expect((await f.t.run(ctx => ctx.db.get(created.replyId)))?.text).toBe(
    'Edited existing integration reply'
  );
  await f.t.run(ctx =>
    writeIntegrationContent(ctx, {
      ...input,
      replyId: created.replyId,
      operation: 'delete',
    })
  );
  expect(await f.t.run(ctx => ctx.db.get(created.replyId))).toBeNull();
});

it('honors reply settings and current scope through bounded Integration HTTP', async () => {
  const f = await fixture('event');
  const issued = await f.manager.auth.mutation(
    api.authorization.mutations.issue,
    {
      name: 'Scoped helper',
      principalKind: 'integration',
      actions: [
        'discussion.create',
        'discussion.read',
        'discussion.update',
        'discussion.delete',
      ],
      selector: { kind: 'selected', eventIds: [f.eventId!] },
    }
  );
  const request = (path: string, method: string, body?: unknown) =>
    f.t.fetch(`/api/v2${path}`, {
      method,
      headers: { 'x-api-key': issued.key, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const created = await request(`/events/${f.eventId}/posts`, 'POST', {
    title: 'Scoped update',
    content: 'Integration authored content',
    repliesDisabled: true,
  });
  expect(created.status).toBe(201);
  const { postId } = await created.json();
  expect(
    (
      await request(`/posts/${postId}/replies`, 'POST', {
        text: 'Blocked new reply',
      })
    ).status
  ).toBe(403);
  expect(
    (
      await request(`/posts/${postId}`, 'PATCH', {
        repliesDisabled: false,
        expectedRepliesRevision: 0,
      })
    ).status
  ).toBe(200);
  const reply = await request(`/posts/${postId}/replies`, 'POST', {
    text: 'Saved integration reply',
  });
  expect(reply.status).toBe(201);
  const { replyId } = await reply.json();
  await f.moderator.auth.mutation(api.posts.mutations.setRepliesDisabled, {
    postId,
    repliesDisabled: true,
    expectedRevision: 1,
  });
  expect(
    (
      await request(`/posts/${postId}/replies`, 'POST', {
        text: 'Stale new reply',
      })
    ).status
  ).toBe(403);
  expect(
    (
      await request(`/replies/${replyId}`, 'PATCH', {
        text: 'Existing reply edited',
      })
    ).status
  ).toBe(200);
  expect((await request(`/replies/${replyId}`, 'DELETE')).status).toBe(204);
  expect(
    (
      await request(`/posts/${postId}`, 'PATCH', {
        repliesDisabled: false,
        expectedRepliesRevision: 2,
      })
    ).status
  ).toBe(200);
  expect(
    (
      await request(`/posts/${postId}`, 'PATCH', {
        repliesDisabled: true,
        expectedRepliesRevision: 0,
      })
    ).status
  ).toBe(403); // Bounded discussion preserves its existing masked error response.
  // Existing update scope never grants the separate manager-only pin capability.
  expect(
    (await request(`/posts/${postId}`, 'PATCH', { pinned: true })).status
  ).toBe(403);
  await f.manager.auth.mutation(api.authorization.mutations.revoke, {
    grantId: issued.grantId,
  });
  expect(
    (
      await request(`/posts/${postId}`, 'PATCH', {
        repliesDisabled: true,
        expectedRepliesRevision: 3,
      })
    ).status
  ).toBe(401);
});
