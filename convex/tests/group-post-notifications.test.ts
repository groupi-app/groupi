import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeFunctionReference } from 'convex/server';
import { api, internal } from '../_generated/api';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import {
  notifyDiscussionMembers,
  notifyMentionedUsers,
  notifyThreadParticipants,
  canDeliverGroupDiscussion,
} from '../lib/notifications';
const instances: ReturnType<typeof createTestInstance>[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  for (const t of instances.splice(0))
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  vi.useRealTimers();
});
async function fixture() {
  const t = createTestInstance();
  instances.push(t);
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'group-notify-owner');
  const member = await createAuthAccount(t, 'group-notify-member');
  const outsider = await createAuthAccount(t, 'group-notify-outsider');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Private group',
  });
  const membershipId = await t.run(ctx =>
    ctx.db.insert('groupMemberships', {
      groupId,
      personId: member.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    })
  );
  const postId = await t.run(ctx =>
    ctx.db.insert('posts', {
      groupId,
      authorId: owner.personId,
      title: 'Private post',
      content: '<p>Text</p>',
    })
  );
  return { t, owner, member, outsider, groupId, postId, membershipId };
}
describe('canonical Group discussion notifications', () => {
  it('fans out canonical post notifications only to eligible members and projects Group context without email', async () => {
    const { t, owner, member, outsider, groupId, postId } = await fixture();
    const result = await t.run(ctx =>
      notifyDiscussionMembers(ctx, {
        groupId,
        postId,
        type: 'NEW_POST',
        authorId: owner.personId,
      })
    );
    expect(result.sent).toHaveLength(1);
    const saved = await t.run(ctx => ctx.db.query('notifications').collect());
    expect(saved.map(row => row.personId)).toEqual([member.personId]);
    const projected = await member.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(projected.notifications[0]).toMatchObject({
      groupId,
      postId,
      group: { title: 'Private group' },
      post: { title: 'Private post' },
      author: { user: { email: null } },
    });
    expect(
      await outsider.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      )
    ).toMatchObject({ notifications: [] });
    await t.run(ctx =>
      ctx.db.insert('userBlocks', {
        blockerId: member.personId,
        blockedId: owner.personId,
        createdAt: Date.now(),
      })
    );
    const blockedProjection = await member.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(blockedProjection.notifications[0]).toMatchObject({
      group: null,
      post: null,
      author: null,
    });
  });
  it('builds Group channel content using current preferences without scheduling raw content', async () => {
    const { t, owner, member, groupId, postId } = await fixture();
    await t.run(async ctx => {
      const existing = await ctx.db
        .query('personSettings')
        .withIndex('by_person', q => q.eq('personId', member.personId))
        .first();
      const settingsId =
        existing?._id ??
        (await ctx.db.insert('personSettings', { personId: member.personId }));
      await ctx.db.insert('notificationMethods', {
        settingsId,
        type: 'EMAIL',
        enabled: true,
        value: 'fixture@example.invalid',
        name: 'Fixture only',
      });
      await ctx.db.patch(postId, { title: '<private & title>' });
    });
    const result = await t.run(ctx =>
      notifyDiscussionMembers(ctx, {
        groupId,
        postId,
        type: 'NEW_POST',
        authorId: owner.personId,
      })
    );
    const response = await t.mutation(
      makeFunctionReference<
        'mutation',
        { notificationId: (typeof result.sent)[number] },
        {
          emails: { to: string; subject: string; html: string }[];
          webhooks: unknown[];
        }
      >('notifications/discussionDispatch:collect'),
      { notificationId: result.sent[0] }
    );
    expect(response.emails).toHaveLength(1);
    expect(response.emails[0].html).toContain(
      `/groups/${groupId}/posts/${postId}`
    );
    expect(response.emails[0].html).toContain('&lt;private &amp; title&gt;');
    expect(response.emails[0].html).not.toContain('<private & title>');
    expect(response.emails[0].subject).toContain('Private group');
    const repeated = await t.mutation(
      makeFunctionReference('notifications/discussionDispatch:collect'),
      { notificationId: result.sent[0] }
    );
    expect(repeated).toEqual({ emails: [], webhooks: [] });
  });
  it('routes Group push deliveries to canonical posts and cancels them after membership loss', async () => {
    const { t, owner, member, groupId, postId, membershipId } = await fixture();
    await member.auth.mutation(api.pushNotifications.mutations.registerDevice, {
      token: 'ExpoPushToken[group-fixture-token]',
      deviceId: 'group-fixture',
      platform: 'ios',
      projectId: 'project-a',
      appId: 'gg.groupi.mobile',
    });
    const result = await t.run(ctx =>
      notifyDiscussionMembers(ctx, {
        groupId,
        postId,
        type: 'NEW_POST',
        authorId: owner.personId,
      })
    );
    await t.mutation(
      makeFunctionReference('notifications/discussionDispatch:collect'),
      { notificationId: result.sent[0] }
    );
    const push = (
      await t.run(ctx => ctx.db.query('pushDeliveries').collect())
    )[0];
    expect(push).toMatchObject({ destination: 'groupPost', groupId, postId });
    expect(push.eventId).toBeUndefined();
    await t.run(async ctx => {
      await ctx.db.delete(membershipId);
      await ctx.db.patch(push._id, { status: 'SENDING' });
    });
    const jobs = await t.query(
      internal.pushNotifications.queries.resolveDeliveryJobs,
      { deliveryIds: [push._id], purpose: 'send' }
    );
    expect(jobs.ready).toEqual([]);
    expect(jobs.cancelled.map(row => row.deliveryId)).toEqual([push._id]);
  });
  it('continues Group fanout in bounded pages without duplicate recipients', async () => {
    const { t, owner, groupId, postId } = await fixture();
    for (let index = 0; index < 50; index++) {
      const person = await createAuthAccount(t, `fanout-${index}`);
      await t.run(ctx =>
        ctx.db.insert('groupMemberships', {
          groupId,
          personId: person.personId,
          role: 'MEMBER',
          joinedAt: Date.now(),
        })
      );
    }
    await t.run(ctx =>
      notifyDiscussionMembers(ctx, {
        groupId,
        postId,
        type: 'NEW_POST',
        authorId: owner.personId,
      })
    );
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    const notifications = await t.run(ctx =>
      ctx.db.query('notifications').collect()
    );
    expect(notifications).toHaveLength(51);
    expect(new Set(notifications.map(row => row.personId)).size).toBe(51);
  });
  it('withholds previously queued Group discussion when required onboarding changes', async () => {
    const { t, owner, member, groupId, postId } = await fixture();
    const result = await t.run(ctx =>
      notifyDiscussionMembers(ctx, {
        groupId,
        postId,
        type: 'NEW_POST',
        authorId: owner.personId,
      })
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
    const notification = await t.run(ctx => ctx.db.get(result.sent[0]));
    expect(
      notification &&
        (await t.run(ctx => canDeliverGroupDiscussion(ctx, notification)))
    ).toBe(false);
    const projected = await member.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    const postNotice = projected.notifications.find(
      row => row.postId === postId
    );
    expect(postNotice).toMatchObject({ group: null, post: null, author: null });
  });
  it('respects canonical thread muting and replies only notify current participants', async () => {
    const { t, owner, member, groupId, postId } = await fixture();
    await t.run(ctx =>
      ctx.db.insert('replies', {
        postId,
        authorId: member.personId,
        text: '<p>Reply</p>',
      })
    );
    await t.run(ctx =>
      ctx.db.insert('mutedPosts', {
        postId,
        personId: member.personId,
        mutedAt: Date.now(),
      })
    );
    const result = await t.run(ctx =>
      notifyThreadParticipants(ctx, {
        groupId,
        postId,
        replyAuthorId: owner.personId,
        postAuthorId: owner.personId,
      })
    );
    expect(result).toMatchObject({ sent: 0, skippedMuted: 1 });
    expect(
      await t.run(ctx => ctx.db.query('notifications').collect())
    ).toHaveLength(0);
  });
  it('rejects outsider mentions and prevents queued delivery and private projection after access is revoked', async () => {
    const { t, owner, member, outsider, groupId, postId, membershipId } =
      await fixture();
    const mentions = await t.run(ctx =>
      notifyMentionedUsers(ctx, {
        groupId,
        postId,
        authorId: owner.personId,
        content: `<p><span class="mention" data-id="${member.personId}">Member</span> <span class="mention" data-id="${outsider.personId}">Outsider</span></p>`,
      })
    );
    expect(mentions).toMatchObject({ sent: 1, skipped: 1 });
    const notification = (
      await t.run(ctx => ctx.db.query('notifications').collect())
    )[0];
    await t.run(ctx => ctx.db.delete(membershipId));
    expect(
      await t.run(ctx => canDeliverGroupDiscussion(ctx, notification))
    ).toBe(false);
    const response = await t.mutation(
      makeFunctionReference('notifications/discussionDispatch:collect'),
      { notificationId: notification._id }
    );
    expect(response).toEqual({ emails: [], webhooks: [] });
    const projected = await member.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(projected.notifications[0]).toMatchObject({
      post: null,
      author: null,
      group: null,
    });
    await member.auth.mutation(
      api.notifications.mutations.markNotificationAsRead,
      { notificationId: notification._id }
    );
    expect(await t.run(ctx => ctx.db.get(notification._id))).toMatchObject({
      read: true,
    });
  });
});
