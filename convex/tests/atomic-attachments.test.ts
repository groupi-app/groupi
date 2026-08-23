import { describe, expect, test } from 'vitest';

import { api } from '../_generated/api';
import { createTestInstance, TestScenarios } from './test_helpers';

async function storeTextFile(
  t: ReturnType<typeof createTestInstance>,
  contents = 'attachment contents'
) {
  return await t.run(async ctx => {
    const file = new Blob([contents], { type: 'text/plain' });
    return {
      storageId: await ctx.storage.store(file),
      size: file.size,
    };
  });
}

describe('atomic parent and attachment creation', () => {
  test('creates a post and all attachment records in one mutation', async () => {
    const t = createTestInstance();
    const { organizerAuth, eventId } = await TestScenarios.multiUser(t);
    const upload = await storeTextFile(t);

    const result = await organizerAuth.mutation(
      api.posts.mutations.createPost,
      {
        eventId,
        title: 'Post with file',
        content: 'The attachment is part of this post.',
        attachments: [
          {
            ...upload,
            filename: 'notes.txt',
            mimeType: 'text/plain',
          },
        ],
      }
    );

    const state = await t.run(async ctx => ({
      post: await ctx.db.get(result.postId),
      attachments: await ctx.db
        .query('attachments')
        .withIndex('by_post', q => q.eq('postId', result.postId))
        .collect(),
    }));
    expect(state.post?.title).toBe('Post with file');
    expect(state.attachments).toHaveLength(1);
    expect(state.attachments[0]?.storageId).toBe(upload.storageId);
  });

  test('rolls back the post when any attachment is invalid', async () => {
    const t = createTestInstance();
    const { organizerAuth, eventId } = await TestScenarios.multiUser(t);
    const upload = await storeTextFile(t);

    await expect(
      organizerAuth.mutation(api.posts.mutations.createPost, {
        eventId,
        title: 'Must not persist',
        content: 'The attachment metadata is invalid.',
        attachments: [
          {
            ...upload,
            size: upload.size + 1,
            filename: 'notes.txt',
            mimeType: 'text/plain',
          },
        ],
      })
    ).rejects.toThrow('size does not match');

    const state = await t.run(async ctx => ({
      posts: await ctx.db
        .query('posts')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect(),
      attachments: await ctx.db.query('attachments').collect(),
    }));
    expect(state.posts).toHaveLength(0);
    expect(state.attachments).toHaveLength(0);
  });

  test('creates an attachment-only reply atomically', async () => {
    const t = createTestInstance();
    const { organizerAuth, eventId } = await TestScenarios.multiUser(t);
    const { postId } = await organizerAuth.mutation(
      api.posts.mutations.createPost,
      {
        eventId,
        title: 'Reply thread',
        content: 'Reply below.',
      }
    );
    const upload = await storeTextFile(t, 'reply attachment');

    const result = await organizerAuth.mutation(
      api.replies.mutations.createReply,
      {
        postId,
        text: '',
        attachments: [
          {
            ...upload,
            filename: 'reply.txt',
            mimeType: 'text/plain',
          },
        ],
      }
    );

    const state = await t.run(async ctx => ({
      reply: await ctx.db.get(result.replyId),
      attachments: await ctx.db
        .query('attachments')
        .withIndex('by_reply', q => q.eq('replyId', result.replyId))
        .collect(),
    }));
    expect(state.reply?.text).toBe('');
    expect(state.attachments).toHaveLength(1);
    expect(state.attachments[0]?.storageId).toBe(upload.storageId);
  });

  test('rejects an empty reply when it has no attachments', async () => {
    const t = createTestInstance();
    const { organizerAuth, eventId } = await TestScenarios.multiUser(t);
    const { postId } = await organizerAuth.mutation(
      api.posts.mutations.createPost,
      {
        eventId,
        title: 'Reply thread',
        content: 'Reply below.',
      }
    );

    await expect(
      organizerAuth.mutation(api.replies.mutations.createReply, {
        postId,
        text: '   ',
      })
    ).rejects.toThrow('Reply text or an attachment is required');
  });
});
