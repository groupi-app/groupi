import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { createTestInstance as baseTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
const instances: ReturnType<typeof baseTestInstance>[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  for (const t of instances.splice(0))
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  vi.useRealTimers();
});
async function fixture(prefix: string) {
  const t = baseTestInstance();
  instances.push(t);
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, `${prefix}-owner`);
  const member = await createAuthAccount(t, `${prefix}-member`);
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Retirement tests',
  });
  await t.run(ctx =>
    ctx.db.insert('groupMemberships', {
      groupId,
      personId: member.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    })
  );
  return { t, owner, member, groupId };
}
async function upload(
  t: ReturnType<typeof baseTestInstance>,
  personId: Id<'persons'>,
  text: string
) {
  return t.run(async ctx => {
    const blob = new Blob([text], { type: 'text/plain' });
    const storageId = await ctx.storage.store(blob);
    await ctx.db.insert('uploads', {
      storageId,
      personId,
      purpose: 'attachment',
      mimeType: 'text/plain',
      size: blob.size,
      claimed: false,
      createdAt: Date.now(),
    });
    return {
      storageId,
      filename: 'private.txt',
      mimeType: 'text/plain',
      size: blob.size,
    };
  });
}
describe('canonical discussion privacy and retirement', () => {
  it('keeps legacy Event reply queries Event-only while Group adapters redact contact data', async () => {
    const { t, owner, member, groupId } = await fixture(
      'native-reply-boundary'
    );
    const postId = await owner.auth.mutation(
      api.groupPosts.mutations.createPost,
      { groupId, title: 'Private Group', content: 'Discussion' }
    );
    await owner.auth.mutation(api.groupPosts.mutations.createReply, {
      postId,
      content: 'Reply',
    });
    await expect(
      member.auth.query(api.replies.queries.getRepliesByPost, { postId })
    ).rejects.toThrow('Event post not found');
    const safe = await member.auth.query(api.groupPosts.queries.listReplies, {
      postId,
      paginationOpts: { numItems: 20, cursor: null },
    });
    expect(safe.page[0].author?.user.email).toBeNull();
    const eventId = await t.run(async ctx => {
      const eventId = await ctx.db.insert('events', {
        title: 'Legacy Event',
        creatorId: owner.personId,
        timezone: 'UTC',
        potentialDateTimes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      for (const personId of [owner.personId, member.personId])
        await ctx.db.insert('memberships', {
          eventId,
          personId,
          role: personId === owner.personId ? 'ORGANIZER' : 'ATTENDEE',
          rsvpStatus: 'YES',
        });
      return eventId;
    });
    const eventPost = await owner.auth.mutation(
      api.posts.mutations.createPost,
      { eventId, title: 'Legacy', content: 'Event post' }
    );
    await member.auth.mutation(api.replies.mutations.createReply, {
      postId: eventPost.postId,
      text: 'Legacy reply',
    });
    const legacy = await owner.auth.query(
      api.replies.queries.getRepliesByPost,
      { postId: eventPost.postId }
    );
    expect(legacy.post.eventId).toBe(eventId);
    expect(legacy.replies[0].text).toBe('Legacy reply');
  });
  it('deletes files attached to authored Group posts and replies when an account is deleted, preserving other content', async () => {
    const { t, owner, member, groupId } = await fixture('account-files');
    const ownedPostFile = await upload(t, member.personId, 'account post file');
    const ownedReplyFile = await upload(
      t,
      member.personId,
      'account reply file'
    );
    const otherReplyFile = await upload(
      t,
      owner.personId,
      'reply under deleted post'
    );
    const retainedFile = await upload(
      t,
      owner.personId,
      'preserved owner file'
    );
    const deletedPostId = await member.auth.mutation(
      api.groupPosts.mutations.createPost,
      {
        groupId,
        title: 'Delete with account',
        content: 'Post',
        attachments: [ownedPostFile],
      }
    );
    const cascadedReplyId = await owner.auth.mutation(
      api.groupPosts.mutations.createReply,
      {
        postId: deletedPostId,
        content: 'Dependent reply',
        attachments: [otherReplyFile],
      }
    );
    const retainedPostId = await owner.auth.mutation(
      api.groupPosts.mutations.createPost,
      {
        groupId,
        title: 'Retain owner post',
        content: 'Post',
        attachments: [retainedFile],
      }
    );
    const deletedReplyId = await member.auth.mutation(
      api.groupPosts.mutations.createReply,
      {
        postId: retainedPostId,
        content: 'Delete reply',
        attachments: [ownedReplyFile],
      }
    );
    await owner.auth.mutation(api.muting.mutations.mutePost, {
      postId: deletedPostId,
    });
    await member.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'account-files-member',
    });
    const state = await t.run(async ctx => ({
      deletedPost: await ctx.db.get(deletedPostId),
      cascadedReply: await ctx.db.get(cascadedReplyId),
      deletedReply: await ctx.db.get(deletedReplyId),
      retainedPost: await ctx.db.get(retainedPostId),
      attachments: await ctx.db.query('attachments').collect(),
      mutes: await ctx.db.query('mutedPosts').collect(),
      deletedFiles: await Promise.all(
        [ownedPostFile, ownedReplyFile, otherReplyFile].map(file =>
          ctx.storage.getUrl(file.storageId)
        )
      ),
      retainedFile: await ctx.storage.getUrl(retainedFile.storageId),
    }));
    expect(state.deletedPost).toBeNull();
    expect(state.cascadedReply).toBeNull();
    expect(state.deletedReply).toBeNull();
    expect(state.retainedPost?._id).toBe(retainedPostId);
    expect(state.attachments.map(row => row.storageId)).toEqual([
      retainedFile.storageId,
    ]);
    expect(state.deletedFiles).toEqual([null, null, null]);
    expect(state.retainedFile).not.toBeNull();
    expect(state.mutes).toHaveLength(0);
  });
  it('retires muted-thread and queued push-delivery records when a Group post is deleted', async () => {
    const { t, owner, member, groupId } = await fixture('post-artifacts');
    const postId = await member.auth.mutation(
      api.groupPosts.mutations.createPost,
      { groupId, title: 'Deleted thread', content: 'Content' }
    );
    const deliveryId = await t.run(async ctx => {
      const notificationId = await ctx.db.insert('notifications', {
        personId: owner.personId,
        authorId: member.personId,
        groupId,
        postId,
        type: 'NEW_POST',
        read: false,
      });
      const pushTokenId = await ctx.db.insert('pushTokens', {
        personId: owner.personId,
        token: 'ExponentPushToken[test]',
        deviceId: 'test',
        platform: 'ios',
        active: false,
        lastRegisteredAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return ctx.db.insert('pushDeliveries', {
        notificationId,
        pushTokenId,
        title: 'Thread',
        body: 'Content',
        destination: 'groupPost',
        groupId,
        postId,
        status: 'PENDING',
        attempts: 0,
        receiptCheckAttempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
    await owner.auth.mutation(api.muting.mutations.mutePost, { postId });
    await owner.auth.mutation(api.groupPosts.mutations.deletePost, { postId });
    expect(await t.run(ctx => ctx.db.get(deliveryId))).toBeNull();
    expect(
      await t.run(ctx => ctx.db.query('mutedPosts').collect())
    ).toHaveLength(0);
    expect(
      await t.run(ctx =>
        ctx.db
          .query('notifications')
          .withIndex('by_post', q => q.eq('postId', postId))
          .collect()
      )
    ).toHaveLength(0);
  });
});
