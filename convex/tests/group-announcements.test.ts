import { describe, expect, it, vi } from 'vitest';
import { api, internal, components } from '../_generated/api';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';

describe('Explicit Group announcements through authenticated sessions', () => {
  it('requires current manager authority and recovers the same explicit send without duplicate notifications', async () => {
    vi.useFakeTimers();
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'announce-owner');
    const member = await createAuthAccount(t, 'announce-member');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Readers' }
    );
    await t.run(async ctx => {
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      });
      await ctx.db.patch(groupId, { memberCount: 2 });
    });
    const input = {
      groupId,
      requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      title: 'Friday reading',
      message: 'Bring your book.',
    };
    await expect(
      member.auth.mutation(
        api.groupAnnouncements.mutations.sendAnnouncement,
        input
      )
    ).rejects.toThrow('manager');
    const first = await owner.auth.mutation(
      api.groupAnnouncements.mutations.sendAnnouncement,
      input
    );
    expect(first).toMatchObject({ state: 'PROCESSING', notified: 0 });
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    const recovered = await owner.auth.mutation(
      api.groupAnnouncements.mutations.sendAnnouncement,
      input
    );
    expect(recovered).toMatchObject({
      announcementId: first.announcementId,
      state: 'COMPLETED',
      notified: 1,
    });
    vi.useRealTimers();
    const notifications = await member.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notifications.notifications.filter(n => n.type === 'GROUP_ANNOUNCEMENT')
    ).toHaveLength(1);
    await expect(
      owner.auth.mutation(api.groupAnnouncements.mutations.sendAnnouncement, {
        ...input,
        message: 'Different',
      })
    ).rejects.toThrow('different');
  });
});

describe('Announcement audience and concurrency', () => {
  it('checks current privacy and DND, concurrent same-key sends create one notification, and deletion cancels pending data', async () => {
    vi.useFakeTimers();
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'announce-current-owner');
    const recipient = await createAuthAccount(t, 'announce-recipient');
    const dnd = await createAuthAccount(t, 'announce-dnd');
    const blocked = await createAuthAccount(t, 'announce-blocked');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Current' }
    );
    await t.run(async ctx => {
      for (const person of [recipient, dnd, blocked])
        await ctx.db.insert('groupMemberships', {
          groupId,
          personId: person.personId,
          role: 'MEMBER',
          joinedAt: Date.now(),
        });
      await ctx.db.patch(dnd.personId, { status: 'DO_NOT_DISTURB' });
    });
    await blocked.auth.mutation(api.friends.mutations.blockUser, {
      personId: owner.personId,
    });
    const input = {
      groupId,
      requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      title: 'Hello',
      message: 'Only permitted members',
    };
    const [a, b] = await Promise.all([
      owner.auth.mutation(
        api.groupAnnouncements.mutations.sendAnnouncement,
        input
      ),
      owner.auth.mutation(
        api.groupAnnouncements.mutations.sendAnnouncement,
        input
      ),
    ]);
    expect(a.announcementId).toBe(b.announcementId);
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    expect(
      await owner.auth.query(api.groupAnnouncements.queries.getAnnouncement, {
        groupId,
        requestId: input.requestId,
      })
    ).toMatchObject({ state: 'COMPLETED', notified: 1, skipped: 3 });
    const list = await recipient.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      list.notifications.filter(n => n.type === 'GROUP_ANNOUNCEMENT')
    ).toHaveLength(1);
    expect(
      list.notifications.find(n => n.type === 'GROUP_ANNOUNCEMENT')
        ?.groupAnnouncement
    ).toEqual({ title: 'Hello', message: 'Only permitted members' });
    expect(
      (
        await dnd.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.filter(n => n.type === 'GROUP_ANNOUNCEMENT')
    ).toEqual([]);
    await owner.auth.mutation(api.groups.mutations.deleteGroup, { groupId });
    expect(
      (
        await recipient.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.filter(n => n.type === 'GROUP_ANNOUNCEMENT')
    ).toEqual([]);
    vi.useRealTimers();
  });
});

it('replayed scheduler page/dispatch creates one set of channel work and honors recipient preferences', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'channels-ann-owner');
  const recipient = await createAuthAccount(t, 'channels-ann-recipient');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Channels',
  });
  await t.run(async ctx => {
    await ctx.db.insert('groupMemberships', {
      groupId,
      personId: recipient.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    });
  });
  await recipient.auth.mutation(
    api.settings.mutations.saveNotificationSettings,
    {
      notificationMethods: [
        {
          type: 'EMAIL',
          enabled: true,
          value: 'private@example.test',
          notifications: [
            { notificationType: 'GROUP_ANNOUNCEMENT', enabled: false },
          ],
        },
        {
          type: 'WEBHOOK',
          enabled: true,
          value: 'https://example.test/private',
          webhookFormat: 'GENERIC',
          notifications: [
            { notificationType: 'GROUP_ANNOUNCEMENT', enabled: false },
          ],
        },
      ],
    }
  );
  const input = {
    groupId,
    requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
    title: 'Reading',
    message: 'Private destination stays private',
  };
  const first = await owner.auth.mutation(
    api.groupAnnouncements.mutations.sendAnnouncement,
    input
  );
  await t.mutation(internal.groupAnnouncements.mutations.processPage, {
    announcementId: first.announcementId,
  });
  await t.mutation(internal.groupAnnouncements.mutations.processPage, {
    announcementId: first.announcementId,
  });
  const notifications = (
    await recipient.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    )
  ).notifications.filter(n => n.type === 'GROUP_ANNOUNCEMENT');
  expect(notifications).toHaveLength(1);
  const collected = await t.mutation(
    internal.groupAnnouncements.dispatch.collect,
    { notificationId: notifications[0]._id }
  );
  expect(collected).toEqual({ emails: [], webhooks: [] });
  expect(
    await t.mutation(internal.groupAnnouncements.dispatch.collect, {
      notificationId: notifications[0]._id,
    })
  ).toEqual({ emails: [], webhooks: [] });
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(
    await owner.auth.query(api.groupAnnouncements.queries.getAnnouncement, {
      groupId,
      requestId: input.requestId,
    })
  ).toMatchObject({ state: 'COMPLETED', notified: 1 });
  vi.useRealTimers();
});

it('cancels processing after stale sender authority and never dispatches after recipient deletion', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'stale-ann-owner');
  const moderator = await createAuthAccount(t, 'stale-ann-mod');
  const recipient = await createAuthAccount(t, 'stale-ann-recipient');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Stale authority',
  });
  await t.run(async ctx => {
    for (const [person, role] of [
      [moderator, 'MODERATOR'],
      [recipient, 'MEMBER'],
    ] as const)
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: person.personId,
        role,
        joinedAt: Date.now(),
      });
  });
  const requestId = `${Date.now()}.12345678-1234-4123-8123-123456789abc`;
  const first = await moderator.auth.mutation(
    api.groupAnnouncements.mutations.sendAnnouncement,
    { groupId, requestId, title: 'Reading', message: 'Manager only' }
  );
  await owner.auth.mutation(api.groupModeration.mutations.setGroupMemberRole, {
    groupId,
    personId: moderator.personId,
    role: 'MEMBER',
  });
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  await owner.auth.mutation(api.groupModeration.mutations.setGroupMemberRole, {
    groupId,
    personId: moderator.personId,
    role: 'MODERATOR',
  });
  expect(
    await moderator.auth.query(api.groupAnnouncements.queries.getAnnouncement, {
      groupId,
      requestId,
    })
  ).toMatchObject({
    announcementId: first.announcementId,
    state: 'CANCELLED',
    notified: 0,
  });
  const next = await owner.auth.mutation(
    api.groupAnnouncements.mutations.sendAnnouncement,
    {
      groupId,
      requestId: `${Date.now()}.22345678-1234-4123-8123-123456789abc`,
      title: 'Reading',
      message: 'Current only',
    }
  );
  await recipient.auth.mutation(api.users.mutations.deleteUserAccount, {
    confirmation: 'stale-ann-recipient',
  });
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(
    await owner.auth.query(api.groupAnnouncements.queries.getAnnouncement, {
      groupId,
      requestId: `${Date.now()}.22345678-1234-4123-8123-123456789abc`,
    })
  ).toMatchObject({
    announcementId: next.announcementId,
    state: 'COMPLETED',
    notified: 1,
  });
  vi.useRealTimers();
});

it('claims existing enabled email/webhook/push work once without persisting contacts in scheduler arguments', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'enabled-ann-owner');
  const recipient = await createAuthAccount(t, 'enabled-ann-recipient');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Channels',
  });
  await t.run(async ctx => {
    await ctx.db.insert('groupMemberships', {
      groupId,
      personId: recipient.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    });
    await ctx.db.insert('pushTokens', {
      personId: recipient.personId,
      token: 'ExpoPushToken[offline-fixture]',
      deviceId: 'offline',
      platform: 'ios',
      active: true,
      lastRegisteredAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
  await recipient.auth.mutation(
    api.settings.mutations.saveNotificationSettings,
    {
      notificationMethods: [
        {
          type: 'EMAIL',
          enabled: true,
          value: 'private@example.test',
          notifications: [
            { notificationType: 'GROUP_ANNOUNCEMENT', enabled: true },
          ],
        },
        {
          type: 'WEBHOOK',
          enabled: true,
          value: 'https://example.test/private',
          webhookFormat: 'GENERIC',
          notifications: [
            { notificationType: 'GROUP_ANNOUNCEMENT', enabled: true },
          ],
        },
        {
          type: 'PUSH',
          enabled: true,
          value: 'Native push notifications',
          notifications: [
            { notificationType: 'GROUP_ANNOUNCEMENT', enabled: true },
          ],
        },
      ],
    }
  );
  const first = await owner.auth.mutation(
    api.groupAnnouncements.mutations.sendAnnouncement,
    {
      groupId,
      requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      title: 'Reading',
      message: 'Bring <a book>',
    }
  );
  await t.mutation(internal.groupAnnouncements.mutations.processPage, {
    announcementId: first.announcementId,
  });
  const notification = (
    await recipient.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    )
  ).notifications.find(n => n.type === 'GROUP_ANNOUNCEMENT')!;
  const collected = await t.mutation(
    internal.groupAnnouncements.dispatch.collect,
    { notificationId: notification._id }
  );
  expect(collected.emails).toHaveLength(1);
  expect(collected.emails[0].to).toBe('private@example.test');
  expect(collected.emails[0].html).toContain('Bring &lt;a book&gt;');
  expect(collected.webhooks).toHaveLength(1);
  expect(
    await t.mutation(internal.groupAnnouncements.dispatch.collect, {
      notificationId: notification._id,
    })
  ).toEqual({ emails: [], webhooks: [] });
  const deliveries = await t.run(ctx =>
    ctx.db
      .query('pushDeliveries')
      .withIndex('by_notification', q =>
        q.eq('notificationId', notification._id)
      )
      .collect()
  );
  expect(deliveries).toHaveLength(1);
  expect(deliveries[0]).toMatchObject({
    title: 'Reading',
    body: 'Reading: Bring <a book>',
  });
  const scheduled = await t.run(ctx =>
    ctx.db.system.query('_scheduledFunctions').collect()
  );
  expect(JSON.stringify(scheduled.map(job => job.args))).not.toContain(
    'private@example.test'
  );
  expect(JSON.stringify(scheduled.map(job => job.args))).not.toContain(
    'Bring <a book>'
  );
  // Delete before executing scheduler; no provider call is possible with removed notification/delivery IDs.
  await owner.auth.mutation(api.groups.mutations.deleteGroup, { groupId });
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  vi.useRealTimers();
});

it('bounds fanout across pages and excludes later joins, active bans and unavailable Auth accounts', async () => {
  vi.useFakeTimers();
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'pages-ann-owner');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Paged',
  });
  const members = [];
  for (let index = 0; index < 27; index++)
    members.push(await createAuthAccount(t, `pages-ann-member-${index}`));
  await t.run(async ctx => {
    for (const member of members)
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      });
    await ctx.db.insert('groupBans', {
      groupId,
      personId: members[0].personId,
      active: true,
      bannedAt: Date.now(),
    });
  });
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: members[1].user._id }],
      update: { banned: true, banExpires: Date.now() + 100000 },
    },
  });
  const input = {
    groupId,
    requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
    title: 'Reading',
    message: 'Current permitted people',
  };
  const first = await owner.auth.mutation(
    api.groupAnnouncements.mutations.sendAnnouncement,
    input
  );
  const late = await createAuthAccount(t, 'pages-ann-late');
  await t.run(ctx =>
    ctx.db.insert('groupMemberships', {
      groupId,
      personId: late.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    })
  );
  await t.mutation(internal.groupAnnouncements.mutations.processPage, {
    announcementId: first.announcementId,
  });
  const partial = await owner.auth.query(
    api.groupAnnouncements.queries.getAnnouncement,
    { groupId, requestId: input.requestId }
  );
  expect(partial?.state).toBe('PROCESSING');
  expect(partial!.notified).toBeLessThanOrEqual(25);
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(
    await owner.auth.query(api.groupAnnouncements.queries.getAnnouncement, {
      groupId,
      requestId: input.requestId,
    })
  ).toMatchObject({ state: 'COMPLETED', notified: 25, skipped: 3 });
  expect(
    (
      await late.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      )
    ).notifications
  ).toEqual([]);
  expect(
    (
      await members[0].auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      )
    ).notifications
  ).toEqual([]);
  vi.useRealTimers();
});
