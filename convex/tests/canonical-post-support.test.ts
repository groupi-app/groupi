import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import presenceTest from '@convex-dev/presence/test';
import { api, internal } from '../_generated/api';
import { presence } from '../presence';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  // These access tests do not advance component expiry jobs. Draining Presence's
  // self-cancelling job trips convex-test's scheduler invariant, unrelated to access.
  vi.clearAllTimers();
  vi.useRealTimers();
});
async function fixture(prefix: string) {
  const t = createTestInstance();
  registerBetterAuth(t);
  presenceTest.register(t);
  const owner = await createAuthAccount(t, `${prefix}-owner`);
  const member = await createAuthAccount(t, `${prefix}-member`);
  const outsider = await createAuthAccount(t, `${prefix}-outsider`);
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Canonical discussion',
  });
  const { membershipId, postId, replyId } = await t.run(async ctx => {
    const membershipId = await ctx.db.insert('groupMemberships', {
      groupId,
      personId: member.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    });
    const postId = await ctx.db.insert('posts', {
      groupId,
      authorId: owner.personId,
      title: 'Shared post',
      content: '<p>Details</p>',
    });
    const replyId = await ctx.db.insert('replies', {
      postId,
      authorId: member.personId,
      text: '<p>Reply</p>',
    });
    return { membershipId, postId, replyId };
  });
  return { t, owner, member, outsider, groupId, membershipId, postId, replyId };
}

describe('canonical Post support across parents', () => {
  it('uses existing attachment APIs and upload ownership for Group posts and replies', async () => {
    const f = await fixture('canonical-attachments');
    const uploads = await f.t.run(async ctx => {
      const result = [];
      for (const personId of [f.owner.personId, f.member.personId]) {
        const blob = new Blob(['notes'], { type: 'text/plain' });
        const storageId = await ctx.storage.store(blob);
        await ctx.db.insert('uploads', {
          storageId,
          personId,
          purpose: 'attachment',
          mimeType: 'text/plain',
          size: blob.size,
          createdAt: Date.now(),
          claimed: false,
        });
        result.push({
          storageId,
          filename: 'notes.txt',
          size: blob.size,
          mimeType: 'text/plain',
        });
      }
      return result;
    });
    const postAttachment = await f.owner.auth.mutation(
      api.attachments.mutations.createAttachment,
      {
        ...uploads[0],
        postId: f.postId,
      }
    );
    await f.member.auth.mutation(api.attachments.mutations.createAttachment, {
      ...uploads[1],
      replyId: f.replyId,
    });
    expect(
      await f.member.auth.query(api.attachments.queries.getPostAttachments, {
        postId: f.postId,
      })
    ).toHaveLength(1);
    expect(
      await f.owner.auth.query(api.attachments.queries.getReplyAttachments, {
        replyId: f.replyId,
      })
    ).toHaveLength(1);
    await expect(
      f.outsider.auth.query(
        api.attachments.queries.getAttachment,
        postAttachment
      )
    ).rejects.toThrow();
    await expect(
      f.member.auth.mutation(api.attachments.mutations.updateAttachment, {
        ...postAttachment,
        altText: 'Not my upload',
      })
    ).rejects.toThrow('own attachments');
    expect(
      await f.t.query(internal.files.uploads.readRegisteredUpload, {
        storageId: uploads[0].storageId,
        personId: f.member.personId,
      })
    ).toMatchObject({ filename: 'notes.txt' });
    await f.t.run(ctx => ctx.db.delete(f.membershipId));
    await expect(
      f.member.auth.query(api.attachments.queries.getPostAttachments, {
        postId: f.postId,
      })
    ).rejects.toThrow();
    await expect(
      f.t.query(internal.files.uploads.readRegisteredUpload, {
        storageId: uploads[0].storageId,
        personId: f.member.personId,
      })
    ).rejects.toThrow();
  });

  it('keeps canonical thread muting private and hides saved titles after Group access is lost', async () => {
    const f = await fixture('canonical-muting');
    expect(
      await f.member.auth.mutation(api.muting.mutations.togglePostMute, {
        postId: f.postId,
      })
    ).toEqual({ isMuted: true });
    expect(
      await f.member.auth.query(api.muting.queries.isPostMuted, {
        postId: f.postId,
      })
    ).toEqual({ isMuted: true });
    expect(
      await f.member.auth.query(api.muting.queries.getMutedPosts, {})
    ).toHaveLength(1);
    expect(
      await f.t.query(internal.muting.rest.postMuteStatus, {
        personId: f.member.personId,
        postId: f.postId,
      })
    ).toEqual({ isMuted: true, eventMuted: false, effectiveMuted: true });
    await expect(
      f.outsider.auth.mutation(api.muting.mutations.mutePost, {
        postId: f.postId,
      })
    ).rejects.toThrow();
    await f.t.run(ctx => ctx.db.delete(f.membershipId));
    expect(
      await f.member.auth.query(api.muting.queries.getMutedPosts, {})
    ).toEqual([]);
    await expect(
      f.member.auth.query(api.muting.queries.isPostMuted, { postId: f.postId })
    ).rejects.toThrow();
  });

  it('binds new Group presence tokens to current access for reads, typing and writes', async () => {
    const f = await fixture('canonical-presence');
    const roomId = `post:${f.postId}`;
    const tokens = await f.member.auth.mutation(api.presence.heartbeat, {
      roomId,
      sessionId: 'member-session',
      interval: 30_000,
    });
    await f.member.auth.mutation(api.presence.updatePresenceData, {
      roomId,
      data: { isTyping: true },
    });
    expect(
      await f.owner.auth.query(api.presence.list, {
        roomToken: tokens.roomToken,
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: f.member.personId }),
      ])
    );
    expect(
      await f.owner.auth.query(api.presence.getTypingUsers, {
        roomToken: tokens.roomToken,
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ personId: f.member.personId }),
      ])
    );
    await expect(
      f.outsider.auth.query(api.presence.list, { roomToken: tokens.roomToken })
    ).rejects.toThrow();
    await f.t.run(ctx => ctx.db.delete(f.membershipId));
    await expect(
      f.member.auth.query(api.presence.list, { roomToken: tokens.roomToken })
    ).rejects.toThrow();
    await expect(
      f.member.auth.query(api.presence.getTypingUsers, {
        roomToken: tokens.roomToken,
      })
    ).rejects.toThrow();
    await expect(
      f.member.auth.mutation(api.presence.updatePresenceData, {
        roomId,
        data: { isTyping: true },
      })
    ).rejects.toThrow();
  });

  it('retains legacy opaque presence tokens and actor-owned unread recovery', async () => {
    const f = await fixture('canonical-read');
    const tokens = await f.t.run(ctx =>
      presence.heartbeat(ctx, 'app', f.owner.personId, 'legacy-session', 30_000)
    );
    expect(
      await f.t.query(api.presence.list, { roomToken: tokens.roomToken })
    ).toHaveLength(1);
    const records = await f.t.run(async ctx => {
      const mine = await ctx.db.insert('notifications', {
        personId: f.member.personId,
        groupId: f.groupId,
        postId: f.postId,
        type: 'NEW_REPLY',
        read: false,
      });
      const other = await ctx.db.insert('notifications', {
        personId: f.owner.personId,
        groupId: f.groupId,
        postId: f.postId,
        type: 'NEW_REPLY',
        read: false,
      });
      return { mine, other };
    });
    expect(
      await f.member.auth.mutation(
        api.notifications.mutations.markPostNotificationsAsRead,
        { postId: f.postId }
      )
    ).toMatchObject({ count: 1 });
    expect(await f.t.run(ctx => ctx.db.get(records.mine))).toMatchObject({
      read: true,
    });
    expect(await f.t.run(ctx => ctx.db.get(records.other))).toMatchObject({
      read: false,
    });
  });
});
