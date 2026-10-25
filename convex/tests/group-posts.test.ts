import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import { createTestInstance as baseTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { removeForPerson } from '../groupPosts/model';
const instances: ReturnType<typeof baseTestInstance>[] = [];
function createTestInstance() {
  const t = baseTestInstance();
  instances.push(t);
  return t;
}
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  for (const t of instances.splice(0))
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  vi.useRealTimers();
});
async function fixture(prefix: string) {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, `${prefix}-owner`);
  const member = await createAuthAccount(t, `${prefix}-member`);
  const outsider = await createAuthAccount(t, `${prefix}-outsider`);
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Discussion',
  });
  await t.run(ctx =>
    ctx.db.insert('groupMemberships', {
      groupId,
      personId: member.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    })
  );
  return { t, owner, member, outsider, groupId };
}
const paginationOpts = { numItems: 20, cursor: null };
describe('Group posts', () => {
  it('lets eligible members create persistent posts, and authors and managers edit them', async () => {
    const { owner, member, groupId } = await fixture('post-lifecycle');
    const postId = await member.auth.mutation(
      api.groupPosts.mutations.createPost,
      { groupId, title: '  Next gathering  ', content: 'Bring ideas' }
    );
    expect(
      await owner.auth.query(api.groupPosts.queries.getPost, { postId })
    ).toMatchObject({
      title: 'Next gathering',
      content: 'Bring ideas',
      canEdit: true,
      canDelete: true,
    });
    await owner.auth.mutation(api.groupPosts.mutations.updatePost, {
      postId,
      title: 'Updated by manager',
      content: 'Same discussion',
    });
    const posts = await member.auth.query(api.groupPosts.queries.listPosts, {
      groupId,
      paginationOpts,
    });
    expect(posts.page).toHaveLength(1);
    expect(posts.page[0]).toMatchObject({
      title: 'Updated by manager',
      authorId: member.personId,
      canEdit: true,
    });
    await member.auth.mutation(api.groupPosts.mutations.deletePost, { postId });
    expect(
      await member.auth.query(api.groupPosts.queries.getPost, { postId })
    ).toBeNull();
  });
  it('rejects outsider reads/writes and editing or deleting another member post', async () => {
    const { owner, member, outsider, groupId } =
      await fixture('post-permissions');
    const postId = await owner.auth.mutation(
      api.groupPosts.mutations.createPost,
      { groupId, title: 'Members', content: 'Private discussion' }
    );
    await expect(
      outsider.auth.query(api.groupPosts.queries.getPost, { postId })
    ).rejects.toThrow();
    await expect(
      outsider.auth.query(api.groupPosts.queries.listPosts, {
        groupId,
        paginationOpts,
      })
    ).rejects.toThrow();
    await expect(
      outsider.auth.mutation(api.groupPosts.mutations.createPost, {
        groupId,
        title: 'No',
        content: 'No',
      })
    ).rejects.toThrow();
    await expect(
      member.auth.mutation(api.groupPosts.mutations.updatePost, {
        postId,
        title: 'No',
        content: 'No',
      })
    ).rejects.toThrow();
    await expect(
      member.auth.mutation(api.groupPosts.mutations.deletePost, { postId })
    ).rejects.toThrow();
    expect(
      await member.auth.query(api.groupPosts.queries.getPost, { postId })
    ).toMatchObject({ canEdit: false, canDelete: false });
  });
  it('rechecks current membership and required onboarding for saved post access', async () => {
    const { t, owner, member, groupId } = await fixture('post-onboarding');
    const postId = await member.auth.mutation(
      api.groupPosts.mutations.createPost,
      { groupId, title: 'Saved', content: 'Saved content' }
    );
    await owner.auth.mutation(
      api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
      {
        groupId,
        enabled: true,
        requiredCompletion: true,
        questions: [
          {
            id: 'intro',
            label: 'Introduction',
            type: 'SHORT_ANSWER',
            required: true,
          },
        ],
      }
    );
    await expect(
      member.auth.query(api.groupPosts.queries.getPost, { postId })
    ).rejects.toThrow('onboarding');
    await expect(
      member.auth.mutation(api.groupPosts.mutations.updatePost, {
        postId,
        title: 'No',
        content: 'No',
      })
    ).rejects.toThrow('onboarding');
    await owner.auth.mutation(
      api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
      { groupId, enabled: false, questions: [] }
    );
    await t.run(async ctx => {
      const membership = await ctx.db
        .query('groupMemberships')
        .withIndex('by_groupId_and_personId', q =>
          q.eq('groupId', groupId).eq('personId', member.personId)
        )
        .unique();
      if (membership) await ctx.db.delete(membership._id);
    });
    await expect(
      member.auth.mutation(api.groupPosts.mutations.deletePost, { postId })
    ).rejects.toThrow();
  });
  it('validates text and keeps group discussion separate from existing event posts', async () => {
    const { t, owner, groupId } = await fixture('post-validation');
    await expect(
      owner.auth.mutation(api.groupPosts.mutations.createPost, {
        groupId,
        title: ' ',
        content: 'Text',
      })
    ).rejects.toThrow('title');
    await expect(
      owner.auth.mutation(api.groupPosts.mutations.createPost, {
        groupId,
        title: 'Title',
        content: 'x'.repeat(50001),
      })
    ).rejects.toThrow('post text');
    await owner.auth.mutation(api.groupPosts.mutations.createPost, {
      groupId,
      title: '<img src=x>',
      content: '<script>alert(1)</script>',
    });
    expect(await t.run(ctx => ctx.db.query('posts').collect())).toHaveLength(0);
    expect(
      (
        await owner.auth.query(api.groupPosts.queries.listPosts, {
          groupId,
          paginationOpts,
        })
      ).page[0].content
    ).toBe('<script>alert(1)</script>');
  });
  it('anonymizes deleted authors and removes posts during confirmed Group deletion', async () => {
    const { t, owner, member, groupId } = await fixture('post-cleanup');
    const postId = await member.auth.mutation(
      api.groupPosts.mutations.createPost,
      { groupId, title: 'Persistent', content: 'Former member' }
    );
    await t.run(ctx => removeForPerson(ctx, member.personId));
    expect(
      await owner.auth.query(api.groupPosts.queries.getPost, { postId })
    ).toMatchObject({ authorName: 'Former member', canEdit: true });
    await owner.auth.mutation(api.groups.mutations.deleteGroup, { groupId });
    expect(await t.run(ctx => ctx.db.get(postId))).toBeNull();
  });
  it('keeps replies under parent post access and manager moderation, and cascades post deletion', async () => {
    const { t, owner, member, outsider, groupId } =
      await fixture('post-replies');
    const postId = await owner.auth.mutation(
      api.groupPosts.mutations.createPost,
      { groupId, title: 'Discuss', content: 'Ideas' }
    );
    const replyId = await member.auth.mutation(
      api.groupPosts.mutations.createReply,
      { postId, content: 'My idea' }
    );
    expect(
      (
        await owner.auth.query(api.groupPosts.queries.listReplies, {
          postId,
          paginationOpts,
        })
      ).page[0]
    ).toMatchObject({
      content: 'My idea',
      authorId: member.personId,
      canEdit: true,
    });
    await expect(
      outsider.auth.query(api.groupPosts.queries.listReplies, {
        postId,
        paginationOpts,
      })
    ).rejects.toThrow();
    await expect(
      outsider.auth.mutation(api.groupPosts.mutations.createReply, {
        postId,
        content: 'Denied',
      })
    ).rejects.toThrow();
    await expect(
      outsider.auth.mutation(api.groupPosts.mutations.updateReply, {
        replyId,
        content: 'Denied',
      })
    ).rejects.toThrow();
    await owner.auth.mutation(api.groupPosts.mutations.updateReply, {
      replyId,
      content: 'Moderated',
    });
    await member.auth.mutation(api.groupPosts.mutations.deleteReply, {
      replyId,
    });
    expect(
      (
        await owner.auth.query(api.groupPosts.queries.listReplies, {
          postId,
          paginationOpts,
        })
      ).page
    ).toHaveLength(0);
    const second = await member.auth.mutation(
      api.groupPosts.mutations.createReply,
      { postId, content: 'Second reply' }
    );
    await owner.auth.mutation(api.groupPosts.mutations.deletePost, { postId });
    expect(await t.run(ctx => ctx.db.get(second))).toBeNull();
  });
});
