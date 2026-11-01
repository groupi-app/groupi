import { expect, it } from 'vitest';
import { api, internal } from '../_generated/api';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { seedEventAnnouncement } from './announcement-history.helpers';
import { send } from '../groupAnnouncements/model';

async function fixture() {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'retired-announcement-owner');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Updates through posts',
  });
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Discussion remains' }
  );
  await owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId, eventId }
  );
  return { t, owner, groupId, eventId };
}
async function snapshot(t: ReturnType<typeof createTestInstance>) {
  return t.run(async ctx => ({
    broadcasts: await ctx.db.query('groupAnnouncements').collect(),
    campaigns: await ctx.db.query('groupEventAnnouncements').collect(),
    deliveries: await ctx.db.query('groupEventMail').collect(),
    receipts: await ctx.db.query('communityOperationReceipts').collect(),
    notifications: await ctx.db.query('notifications').collect(),
    jobs: await ctx.db.system.query('_scheduled_functions').collect(),
  }));
}
it('blocks native and shared REST/domain broadcast writes without creating dispatch work', async () => {
  const f = await fixture();
  const input = {
    groupId: f.groupId,
    requestId: `${Date.now()}.${crypto.randomUUID()}`,
    title: 'Retired send',
    message: 'Use a canonical post',
  };
  const before = await snapshot(f.t);
  await expect(
    f.owner.auth.mutation(
      api.groupAnnouncements.mutations.sendAnnouncement,
      input
    )
  ).rejects.toThrow('retired');
  await expect(
    f.t.mutation(internal.groupAnnouncements.rest.create, {
      personId: f.owner.personId,
      ...input,
    })
  ).rejects.toThrow('retired');
  await expect(
    f.t.run(ctx => send(ctx, f.owner.personId, input))
  ).rejects.toThrow('retired');
  expect(await snapshot(f.t)).toEqual(before);
});
it('blocks new and replayed Event mail intents without receipts, jobs or notifications', async () => {
  const f = await fixture();
  const args = {
    groupId: f.groupId,
    eventId: f.eventId,
    operationId: crypto.randomUUID(),
  };
  const before = await snapshot(f.t);
  await expect(
    f.owner.auth.mutation(api.groupAnnouncements.eventMail.announce, args)
  ).rejects.toThrow('retired');
  await expect(
    f.owner.auth.mutation(api.groupAnnouncements.eventMail.announce, args)
  ).rejects.toThrow('retired');
  expect(await snapshot(f.t)).toEqual(before);
});
it.each(['queued', 'sending', 'failed', 'delivered', 'suppressed'] as const)(
  'cannot publicly restart historical %s mail',
  async state => {
    const f = await fixture();
    const args = {
      groupId: f.groupId,
      eventId: f.eventId,
      operationId: crypto.randomUUID(),
    };
    const historical = await seedEventAnnouncement(
      f.t,
      f.owner.personId,
      args,
      false
    );
    const announcementId = historical.result.announcementId;
    await f.t.run(ctx =>
      ctx.db.insert('groupEventMail', {
        announcementId,
        personId: f.owner.personId,
        state,
        createdAt: Date.now(),
        attempt: 1,
        delivered: state === 'delivered' ? ['old-delivery'] : [],
      })
    );
    const before = await snapshot(f.t);
    await expect(
      f.owner.auth.mutation(api.groupAnnouncements.eventMail.retry, {
        announcementId,
      })
    ).rejects.toThrow('retired');
    await expect(
      f.owner.auth.mutation(api.groupAnnouncements.eventMail.announce, args)
    ).rejects.toThrow('retired');
    expect(await snapshot(f.t)).toEqual(before);
    expect(
      await f.owner.auth.query(api.groupAnnouncements.eventMail.status, {
        announcementId,
      })
    ).toBeTruthy();
  }
);
it('retains delivery workers as internal compatibility functions, never public actions', async () => {
  const group = await import('../groupAnnouncements/actions');
  const event = await import('../groupAnnouncements/eventMailActions');
  expect(Reflect.get(group.dispatch, 'isInternal')).toBe(true);
  expect(Reflect.get(event.send, 'isInternal')).toBe(true);
});
