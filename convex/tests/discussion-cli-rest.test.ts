// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cliRestBridge } from './cli-rest-bridge.helpers';
import { api } from '../_generated/api';
// Allow real CLI process startup and serial authenticated HTTP/storage work.
describe('Discussion public CLI through authenticated REST and storage', () => {
  let b: Awaited<ReturnType<typeof cliRestBridge>>;
  let temp: string;
  beforeEach(async () => {
    b = await cliRestBridge();
    temp = await mkdtemp(join(tmpdir(), 'groupi-discussion-'));
  });
  afterEach(async () => {
    await b.close();
    await rm(temp, { recursive: true, force: true });
  });
  async function ok(key: string, args: string[]) {
    const r = await b.cli(key, args);
    expect(r.code, r.stderr).toBe(0);
    return JSON.parse(r.stdout);
  }
  async function setup() {
    const owner = await b.actor('discussion-owner'),
      member = await b.actor('discussion-member'),
      outsider = await b.actor('discussion-outsider');
    const { eventId } = await ok(owner.rawKey, [
      'events',
      'create',
      '--title',
      'Discussion',
    ]);
    const invite = await owner.request(
      `/events/${b.id<'events'>(eventId)}/invites`,
      'POST',
      {}
    );
    const { token } = await invite.json();
    expect(
      (await member.request(`/invites/${token}/accept`, 'POST')).status
    ).toBe(200);
    return { owner, member, outsider, eventId };
  }
  it('creates formatted posts/replies, preserves HTML on unrelated edits, pages, notifies, and enforces access', async () => {
    const { owner, member, outsider, eventId } = await setup();
    const post = await ok(owner.rawKey, [
      'posts',
      'create',
      eventId,
      '--title',
      'Notes',
      '--content',
      '**Hello** friends',
      '--content-format',
      'markdown',
    ]);
    const detail = await ok(member.rawKey, ['posts', 'get', post.postId]);
    expect(detail.content).toContain('<strong>Hello</strong>');
    await ok(owner.rawKey, [
      'posts',
      'edit',
      post.postId,
      '--title',
      'Renamed',
    ]);
    expect(
      (await ok(owner.rawKey, ['posts', 'get', post.postId])).content
    ).toBe(detail.content);
    const reply = await ok(member.rawKey, [
      'replies',
      'create',
      post.postId,
      '--content',
      'Thank you',
    ]);
    expect(
      (await ok(owner.rawKey, ['replies', 'list', post.postId, '--limit', '1']))
        .items
    ).toHaveLength(1);
    const denied = await b.cli(outsider.rawKey, ['posts', 'get', post.postId]);
    expect(denied.code).toBe(3);
    expect(
      (
        await b.cli(member.rawKey, [
          'posts',
          'edit',
          post.postId,
          '--title',
          'Unauthorized',
        ])
      ).code
    ).not.toBe(0);
    const notifications = await b.t.run(ctx =>
      ctx.db.query('notifications').collect()
    );
    expect(
      notifications.some(
        n => n.type === 'NEW_POST' && n.personId === member.personId
      )
    ).toBe(true);
    expect(
      notifications.some(
        n => n.type === 'NEW_REPLY' && n.personId === owner.personId
      )
    ).toBe(true);
    expect(
      (await b.cli(member.rawKey, ['replies', 'delete', reply.replyId])).code
    ).toBe(2);
    await ok(member.rawKey, ['replies', 'delete', reply.replyId, '--yes']);
  }, 30_000);
  it('preserves the historical post PATCH detail response with replies and attachment metadata', async () => {
    const { owner, member, eventId } = await setup();
    const post = await ok(owner.rawKey, [
      'posts',
      'create',
      eventId,
      '--title',
      'Original',
      '--content',
      'Body',
    ]);
    const file = join(temp, 'reply.txt');
    await writeFile(file, 'Reply attachment');
    const reply = await ok(member.rawKey, [
      'replies',
      'create',
      post.postId,
      '--content',
      'Reply',
      '--attach',
      file,
    ]);
    const before = await (
      await owner.request(`/posts/${b.id<'posts'>(post.postId)}`)
    ).json();
    expect(before.replies).toHaveLength(1);
    const response = await owner.request(
      `/posts/${b.id<'posts'>(post.postId)}`,
      'PATCH',
      {
        title: 'Updated',
      }
    );
    expect(response.status).toBe(200);
    const updated = await response.json();
    expect(updated.title).toBe('Updated');
    expect(updated.replyCount).toBe(1);
    expect(updated.replies).toEqual(before.replies);
    expect(updated.replies[0]).toMatchObject({
      id: b.id<'replies'>(reply.replyId),
      text: '<p>Reply</p>',
      author: { id: member.personId },
      attachments: [{ filename: 'reply.txt', mimeType: 'text/plain' }],
    });
    expect(updated.replies[0].attachments[0].url).toBeTruthy();
    await ok(member.rawKey, ['replies', 'delete', reply.replyId, '--yes']);
    const empty = await owner.request(
      `/posts/${b.id<'posts'>(post.postId)}`,
      'PATCH',
      {
        title: 'Without replies',
      }
    );
    expect(empty.status).toBe(200);
    expect(await empty.json()).toMatchObject({ replyCount: 0, replies: [] });
  }, 30_000);
  it('validates safe markup, mentions, exact visible limits, and legacy reductions across app and REST', async () => {
    const { owner, member, eventId } = await setup();
    const id = b.id<'events'>(eventId);
    for (const content of [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<a href="javascript:alert(1)">click</a>',
      '<span data-id="bad">@bad</span>',
      'x'.repeat(3001),
    ])
      expect(
        (
          await owner.request(`/events/${id}/posts`, 'POST', {
            title: 'bad',
            content,
          })
        ).status
      ).toBe(400);
    const res = await owner.request(`/events/${id}/posts`, 'POST', {
      title: 'x'.repeat(100),
      content: `<strong>${'x'.repeat(3000)}</strong>`,
    });
    expect(res.status).toBe(201);
    const { postId } = await res.json();
    await b.t.run(ctx => ctx.db.patch(postId, { content: 'z'.repeat(4000) }));
    expect(
      (await owner.request(`/posts/${postId}`, 'PATCH', { title: 'Updated' }))
        .status
    ).toBe(200);
    expect(
      (
        await owner.request(`/posts/${postId}`, 'PATCH', {
          content: 'z'.repeat(3900),
        })
      ).status
    ).toBe(200);
    expect(
      (
        await owner.request(`/posts/${postId}`, 'PATCH', {
          content: 'z'.repeat(3950),
        })
      ).status
    ).toBe(400);
    const mention = await owner.request(`/events/${id}/posts`, 'POST', {
      title: 'Mention',
      content: `<p>Hello <span class="mention" data-id="${member.personId}">@member</span></p>`,
    });
    expect(mention.status).toBe(201);
    expect(
      (await b.t.run(ctx => ctx.db.query('notifications').collect())).some(
        n => n.type === 'USER_MENTIONED' && n.personId === member.personId
      )
    ).toBe(true);
    const identity = { subject: owner.user._id };
    await expect(
      b.t.withIdentity(identity).mutation(api.posts.mutations.createPost, {
        eventId: id,
        title: 'native',
        content: 'x'.repeat(3001),
      })
    ).rejects.toThrow();
  }, 30_000);
  it('uploads local files atomically, binds ownership, handles attachment-only replies, removes and cleans abandoned uploads', async () => {
    const { owner, member, eventId } = await setup();
    const file = join(temp, 'notes.txt');
    await writeFile(file, 'uploaded discussion');
    const post = await ok(owner.rawKey, [
      'posts',
      'create',
      eventId,
      '--title',
      'File',
      '--attach',
      file,
    ]);
    const detail = await ok(owner.rawKey, ['posts', 'get', post.postId]);
    expect(detail.attachments).toHaveLength(1);
    const reply = await ok(member.rawKey, [
      'replies',
      'create',
      post.postId,
      '--attach',
      file,
    ]);
    expect(
      (await ok(member.rawKey, ['replies', 'get', reply.replyId])).text
    ).toBe('');
    const stolen = await member.request(
      `/posts/${b.id<'posts'>(post.postId)}`,
      'PATCH',
      {
        attachmentsToAdd: [
          {
            storageId: b.id<'_storage'>(detail.attachments[0].storageId),
            filename: 'stolen.txt',
            size: 19,
            mimeType: 'text/plain',
          },
        ],
      }
    );
    expect(stolen.status).not.toBe(200);
    const before = (await b.t.run(ctx => ctx.db.query('posts').collect()))
      .length;
    const invalid = await b.cli(owner.rawKey, [
      'posts',
      'create',
      eventId,
      '--title',
      'Failed',
      '--content',
      'x'.repeat(3001),
      '--attach',
      file,
    ]);
    expect(invalid.code).not.toBe(0);
    expect((await b.t.run(ctx => ctx.db.query('posts').collect())).length).toBe(
      before
    );
    const pending = await b.t.run(ctx => ctx.db.query('uploads').collect());
    expect(pending.every(u => u.claimed)).toBe(true);
    await ok(owner.rawKey, ['posts', 'edit', post.postId, '--content', 'Kept']);
    await ok(owner.rawKey, [
      'posts',
      'attachments',
      'remove',
      post.postId,
      detail.attachments[0].id,
      '--yes',
    ]);
    expect(
      (await ok(owner.rawKey, ['posts', 'attachments', 'list', post.postId]))
        .items
    ).toEqual([]);
  }, 30_000);
  it('rejects empty HTML and fake/blocked mentions, and proves ownership of unassociated uploads', async () => {
    const { owner, member, eventId } = await setup();
    const realEvent = b.id<'events'>(eventId);
    expect(
      (
        await b.cli(owner.rawKey, [
          'posts',
          'create',
          eventId,
          '--title',
          'Empty',
          '--content',
          '',
        ])
      ).code
    ).toBe(2);
    const raw = await b.t.fetch('/api/v2/uploads?purpose=attachment', {
      method: 'POST',
      headers: { 'x-api-key': owner.rawKey, 'content-type': 'text/plain' },
      body: 'owned',
    });
    expect(raw.status).toBe(201);
    const upload = await raw.json();
    const stolen = await member.request(`/events/${realEvent}/posts`, 'POST', {
      title: 'Stolen',
      content: 'claim',
      attachments: [upload],
    });
    expect(stolen.status).toBe(403);
    const created = await owner.request(`/events/${realEvent}/posts`, 'POST', {
      title: 'Own',
      content: '',
      attachments: [upload],
    });
    expect(created.status).toBe(201);
    const { postId } = await created.json();
    const detail = await (await owner.request(`/posts/${postId}`)).json();
    const removal = await owner.request(`/posts/${postId}`, 'PATCH', {
      content: '<p> &nbsp; </p>',
      attachmentIdsToDelete: [detail.attachments[0].id],
    });
    expect(removal.status).toBe(400);
    expect(
      (await (await owner.request(`/posts/${postId}`)).json()).attachments
    ).toHaveLength(1);
    await b.t.run(ctx =>
      ctx.db.insert('userBlocks', {
        blockerId: owner.personId,
        blockedId: member.personId,
        createdAt: Date.now(),
      })
    );
    const literal = await owner.request(`/events/${realEvent}/posts`, 'POST', {
      title: 'Example',
      content: `<p>Example data-id='${member.personId}' is just text</p>`,
    });
    expect(literal.status).toBe(201);
    const literalId = (await literal.json()).postId;
    expect(
      (await b.t.run(ctx => ctx.db.query('notifications').collect())).filter(
        n => n.postId === literalId && n.type === 'USER_MENTIONED'
      )
    ).toEqual([]);
    const blocked = await owner.request(`/events/${realEvent}/posts`, 'POST', {
      title: 'Blocked',
      content: `<span class="mention" data-id="${member.personId}">@member</span>`,
    });
    expect(blocked.status).toBe(400);
    const repeat = await owner.request(`/events/${realEvent}/posts`, 'POST', {
      title: 'Reuse',
      content: 'No',
      attachments: [upload],
    });
    expect(repeat.status).toBe(400);
    expect(await repeat.json()).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Uploaded file is already attached',
      },
    });
  }, 30_000);
});

describe('discussion response transaction boundary', () => {
  it('returns edit confirmation from the committed mutation without a subsequent permission-sensitive query', async () => {
    const { createDiscussionRoutes } = await import(
      '../api/v2/routes/discussion'
    );
    const app = createDiscussionRoutes('posts');
    let queries = 0,
      writes = 0;
    app.use('*', async (c, next) => {
      c.set('personId', 'person1');
      c.set('ctx', {
        runMutation: async () => {
          writes++;
          return { id: 'post1', title: 'Updated', content: 'Kept' };
        },
        runQuery: async () => {
          queries++;
          throw new Error('Access revoked after commit');
        },
      } as never);
      await next();
    });
    // Routes are registered before app.use; inject context with the Fetch env equivalent by using a parent router.
    const { OpenAPIHono } = await import('@hono/zod-openapi');
    const root = new OpenAPIHono();
    root.use('*', async (c, next) => {
      c.set('personId' as never, 'person1' as never);
      c.set(
        'ctx' as never,
        {
          runMutation: async () => {
            writes++;
            return { id: 'post1', title: 'Updated', content: 'Kept' };
          },
          runQuery: async () => {
            queries++;
            throw new Error('Access revoked after commit');
          },
        } as never
      );
      await next();
    });
    root.route('/', app);
    const response = await root.request('/posts/post1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });
    expect(response.status).toBe(200);
    expect(writes).toBe(1);
    expect(queries).toBe(0);
  });
});
