import {
  seedEventAnnouncement,
  requeueHistoricalDispatch,
} from './announcement-history.helpers';
import { expect, it } from 'vitest';
import { applicant } from './community-applications.helpers';
it('starts own per-Group announcement subscription off', async () => {
  const f = await applicant();
  expect((await f.read()).announcementPreference).toEqual({
    supported: true,
    subscribed: false,
  });
});

it('commits own opt-in once and rejects intent reuse after opt-out', async () => {
  const f = await applicant([
    'groups.context.read',
    'groups.announcements.preferences.update',
  ]);
  await f.t.run(async ctx => {
    await ctx.db.insert('groupMemberships', {
      groupId: f.groupId,
      personId: f.owner.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    });
  });
  const operationId = crypto.randomUUID();
  const first = await f.request(
    'announcement-preference',
    'PUT',
    { subscribed: true },
    operationId
  );
  expect(first.status, await first.clone().text()).toBe(200);
  const receipt = await first.json();
  expect(receipt).toEqual({
    operationId,
    outcome: 'committed',
    result: { subscribed: true },
    effects: { email: 'not-requested', cleanup: 'not-requested' },
  });
  expect(
    await (
      await f.request(
        'announcement-preference',
        'PUT',
        { subscribed: true },
        operationId
      )
    ).json()
  ).toEqual(receipt);
  expect((await f.read()).announcementPreference.subscribed).toBe(true);
  expect(
    (
      await f.request(
        'announcement-preference',
        'PUT',
        { subscribed: false },
        operationId
      )
    ).status
  ).toBe(409);
  expect(
    (await f.request('announcement-preference', 'PUT', { subscribed: false }))
      .status
  ).toBe(200);
  expect((await f.read()).announcementPreference.subscribed).toBe(false);
});
import { api, internal } from '../_generated/api';
it('preserves authority checks and historical status while rejecting retired Event mail sends', async () => {
  const f = await applicant();
  await expect(
    f.staff.auth.mutation(api.groupAnnouncements.eventMail.announce, {
      groupId: f.groupId,
      eventId: f.event.eventId,
      operationId: crypto.randomUUID(),
    })
  ).rejects.toThrow();
  await f.t.run(async ctx => {
    await ctx.db.insert('memberships', {
      eventId: f.event.eventId,
      personId: f.staff.personId,
      role: 'ORGANIZER',
      rsvpStatus: 'YES',
    });
    await ctx.db.insert('groupEventAudiences', {
      eventId: f.event.eventId,
      groupId: f.groupId,
      sharedById: f.staff.personId,
      createdAt: Date.now(),
    });
    await ctx.db.insert('groupMemberships', {
      groupId: f.groupId,
      personId: f.owner.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    });
  });
  const operationId = crypto.randomUUID();
  const args = { groupId: f.groupId, eventId: f.event.eventId, operationId };
  await expect(
    f.staff.auth.mutation(api.groupAnnouncements.eventMail.announce, args)
  ).rejects.toThrow('retired');
  expect(
    await f.t.run(ctx => ctx.db.query('groupEventAnnouncements').collect())
  ).toEqual([]);
  const first = await seedEventAnnouncement(f.t, f.staff.personId, args, false);
  await expect(
    f.staff.auth.mutation(api.groupAnnouncements.eventMail.announce, args)
  ).rejects.toThrow('retired');
  const state = await f.staff.auth.query(
    api.groupAnnouncements.eventMail.status,
    { announcementId: first.result.announcementId }
  );
  expect(state).toMatchObject({ queued: 0, delivered: 0, failed: 0 });
});
import { vi, afterEach } from 'vitest';
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
async function mailFixture() {
  const f = await applicant([
    'groups.context.read',
    'groups.announcements.preferences.update',
  ]);
  await f.t.run(async ctx => {
    await ctx.db.insert('memberships', {
      eventId: f.event.eventId,
      personId: f.staff.personId,
      role: 'ORGANIZER',
      rsvpStatus: 'YES',
    });
    await ctx.db.insert('groupEventAudiences', {
      eventId: f.event.eventId,
      groupId: f.groupId,
      sharedById: f.staff.personId,
      createdAt: Date.now(),
    });
    await ctx.db.insert('groupMemberships', {
      groupId: f.groupId,
      personId: f.owner.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    });
  });
  await f.owner.auth.mutation(api.settings.mutations.saveNotificationSettings, {
    notificationMethods: [
      {
        type: 'EMAIL',
        enabled: true,
        value: 'member@example.test',
        notifications: [],
      },
    ],
  });
  await f.owner.auth.mutation(api.groups.announcementPreferences.updateOwn, {
    groupId: f.groupId,
    subscribed: true,
    operationId: crypto.randomUUID(),
  });
  await f.t.finishInProgressScheduledFunctions();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const receipt = await seedEventAnnouncement(f.t, f.staff.personId, {
    groupId: f.groupId,
    eventId: f.event.eventId,
    operationId: crypto.randomUUID(),
  });
  const announcementId = receipt.result.announcementId;
  await f.t.mutation(internal.groupAnnouncements.eventMail.processPage, {
    announcementId,
  });
  await f.t.mutation(internal.groupAnnouncements.eventMail.processPage, {
    announcementId,
  });
  const dispatchId = await f.t.run(
    async ctx =>
      (await ctx.db
        .query('groupEventMail')
        .withIndex('by_announcementId', q =>
          q.eq('announcementId', announcementId)
        )
        .unique())!._id
  );
  const status = () =>
    f.staff.auth.query(api.groupAnnouncements.eventMail.status, {
      announcementId,
    });
  return { ...f, announcementId, dispatchId, status };
}
it.each(['opt-out', 'departure', 'dnd', 'global-disabled'] as const)(
  'suppresses queued Event email after %s',
  async change => {
    const f = await mailFixture();
    expect(await f.status()).toMatchObject({ queued: 1 });
    if (change === 'opt-out')
      await f.owner.auth.mutation(
        api.groups.announcementPreferences.updateOwn,
        {
          groupId: f.groupId,
          subscribed: false,
          operationId: crypto.randomUUID(),
        }
      );
    if (change === 'departure')
      await f.owner.auth.mutation(api.groupModeration.mutations.leaveGroup, {
        groupId: f.groupId,
      });
    if (change === 'dnd')
      await f.t.run(async ctx => {
        const p = await ctx.db.get(f.owner.personId);
        await ctx.db.patch(p!._id, { status: 'DO_NOT_DISTURB' });
      });
    if (change === 'global-disabled')
      await f.owner.auth.mutation(
        api.settings.mutations.saveNotificationSettings,
        { notificationMethods: [] }
      );
    const provider = vi.fn();
    vi.stubGlobal('fetch', provider);
    await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
      dispatchId: f.dispatchId,
    });
    expect(provider).not.toHaveBeenCalled();
    expect(await f.status()).toMatchObject({ suppressed: 1, queued: 0 });
  }
);
it('retains historical internal delivery handling without allowing public retries', async () => {
  const f = await mailFixture();
  const provider = vi
    .fn()
    .mockResolvedValue(new Response('{}', { status: 503 }));
  vi.stubGlobal('fetch', provider);
  vi.stubEnv('RESEND_API_KEY', 'synthetic');
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId: f.dispatchId,
  });
  expect(await f.status()).toMatchObject({ failed: 1 });
  const first = provider.mock.calls[0][1];
  expect(JSON.parse(first.body).to).toBe('member@example.test');
  expect(first.headers['Idempotency-Key']).toContain(f.dispatchId);
  await requeueHistoricalDispatch(f.t, f.dispatchId);
  provider.mockResolvedValue(new Response('{}', { status: 200 }));
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId: f.dispatchId,
  });
  expect(provider.mock.calls[1][1]).toEqual(first);
  expect(await f.status()).toMatchObject({ delivered: 1 });
  await expect(
    f.staff.auth.mutation(api.groupAnnouncements.eventMail.retry, {
      announcementId: f.announcementId,
    })
  ).rejects.toThrow('retired');
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId: f.dispatchId,
  });
  expect(provider).toHaveBeenCalledTimes(2);
  expect(JSON.stringify(await f.read())).not.toContain('member@example.test');
});
it('does not let a nonmember subscribe but permits own opt-out', async () => {
  const f = await applicant([
    'groups.context.read',
    'groups.announcements.preferences.update',
  ]);
  expect(
    (await f.request('announcement-preference', 'PUT', { subscribed: true }))
      .status
  ).toBe(403);
  expect(
    (await f.request('announcement-preference', 'PUT', { subscribed: false }))
      .status
  ).toBe(200);
});
import { components } from '../_generated/api';
it('keeps Group preferences independent and refuses write scopes and unrelated Groups', async () => {
  const f = await applicant([
    'groups.context.read',
    'groups.announcements.preferences.update',
  ]);
  const other = await f.staff.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Other',
  });
  await f.owner.auth.mutation(api.groups.announcementPreferences.updateOwn, {
    groupId: other,
    subscribed: false,
    operationId: crypto.randomUUID(),
  });
  expect(
    await f.owner.auth.query(api.groups.announcementPreferences.readOwn, {
      groupId: other,
    })
  ).toEqual({ subscribed: false });
  const denied = await f.t.fetch(
    `/api/v2/groups/${other}/announcement-preference`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${f.accessToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({ subscribed: false }),
    }
  );
  expect(denied.status).toBe(403);
  const readOnly = await applicant();
  expect(
    (
      await readOnly.request('announcement-preference', 'PUT', {
        subscribed: false,
      })
    ).status
  ).toBe(403);
});
it('publishes a Group audience without automatically scheduling Event announcement mail', async () => {
  const f = await applicant();
  await f.t.run(async ctx => {
    await ctx.db.insert('groupMemberships', {
      groupId: f.groupId,
      personId: f.owner.personId,
      role: 'MODERATOR',
      joinedAt: Date.now(),
    });
  });
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId: f.groupId, eventId: f.event.eventId }
  );
  await f.t.finishInProgressScheduledFunctions();
  expect(
    await f.t.run(ctx => ctx.db.query('groupEventAnnouncements').collect())
  ).toEqual([]);
});
it('uses only administrator-linked approved branding and disables an unsafe or suspended return', async () => {
  const f = await mailFixture();
  await f.t.run(async ctx => {
    await ctx.db.patch(f.appId, {
      status: 'approved',
      appearance: {
        brandName: 'Community & friends',
        senderName: 'Community',
        accent: '#991b1b',
      },
    });
  });
  const config = {
    groupId: f.groupId,
    appId: f.appId,
    returnUrl: 'https://app.example/preferences',
  };
  await expect(
    f.staff.auth.mutation(
      api.groupAnnouncements.eventMail.configureBrand,
      config
    )
  ).rejects.toThrow();
  await f.t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', operator: 'eq', value: f.staff.user._id }],
      update: { role: 'admin' },
    },
  });
  await expect(
    f.staff.auth.mutation(api.groupAnnouncements.eventMail.configureBrand, {
      ...config,
      returnUrl: 'https://attacker.example/',
    })
  ).rejects.toThrow();
  await f.staff.auth.mutation(
    api.groupAnnouncements.eventMail.configureBrand,
    config
  );
  const receipt = await seedEventAnnouncement(f.t, f.staff.personId, {
    groupId: f.groupId,
    eventId: f.event.eventId,
    operationId: crypto.randomUUID(),
  });
  await f.t.mutation(internal.groupAnnouncements.eventMail.processPage, {
    announcementId: receipt.result.announcementId,
  });
  const dispatchId = await f.t.run(
    async ctx =>
      (await ctx.db
        .query('groupEventMail')
        .withIndex('by_announcementId', q =>
          q.eq('announcementId', receipt.result.announcementId)
        )
        .unique())!._id
  );
  const provider = vi
    .fn()
    .mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', provider);
  vi.stubEnv('RESEND_API_KEY', 'synthetic');
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId,
  });
  const body = JSON.parse(provider.mock.calls[0][1].body);
  expect(body.from).toBe('Community <notifications@groupi.gg>');
  expect(body.html).toContain('Community &amp; friends');
  expect(body.html).toContain(`/announcement-preferences/${f.groupId}`);
  expect(
    await f.owner.auth.query(
      api.groupAnnouncements.eventMail.preferenceReturn,
      { groupId: f.groupId }
    )
  ).toMatchObject({ url: config.returnUrl });
  const grantId = await f.t.run(
    async ctx =>
      (await ctx.db
        .query('delegatedGrantBindings')
        .withIndex('by_personId', q => q.eq('personId', f.owner.personId))
        .unique())!.grantId
  );
  await f.owner.auth.mutation(api.delegatedApps.mutations.disconnect, {
    grantId,
  });
  expect(
    await f.owner.auth.query(
      api.groupAnnouncements.eventMail.preferenceReturn,
      { groupId: f.groupId }
    )
  ).toMatchObject({ url: null });
  await f.t.run(async ctx => {
    await ctx.db.patch(f.appId, { status: 'suspended' });
  });
  expect(
    await f.owner.auth.query(
      api.groupAnnouncements.eventMail.preferenceReturn,
      { groupId: f.groupId }
    )
  ).toMatchObject({ url: null });
});
it('cleans private queued email and preferences on Group retirement', async () => {
  const f = await mailFixture();
  await f.staff.auth.mutation(api.groups.mutations.deleteGroup, {
    groupId: f.groupId,
  });
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId: f.dispatchId,
  });
  expect(
    await f.t.run(ctx => ctx.db.query('groupEventMail').collect())
  ).toEqual([]);
  expect(
    await f.t.run(ctx => ctx.db.query('groupAnnouncementPreferences').collect())
  ).toEqual([]);
});
it.each([
  'event-ban',
  'blocked',
  'group-ban',
  'audience-withdrawal',
  'brand-suspension',
] as const)('rechecks %s at delivery', async change => {
  const f = await mailFixture();
  await f.t.run(async ctx => {
    if (change === 'event-ban')
      await ctx.db.insert('eventBans', {
        personId: f.owner.personId,
        eventId: f.event.eventId,
        bannedAt: Date.now(),
        bannedById: f.staff.personId,
      });
    if (change === 'blocked')
      await ctx.db.insert('userBlocks', {
        blockerId: f.owner.personId,
        blockedId: f.staff.personId,
        createdAt: Date.now(),
      });
    if (change === 'group-ban')
      await ctx.db.insert('groupBans', {
        groupId: f.groupId,
        personId: f.owner.personId,
        active: true,
        bannedAt: Date.now(),
      });
    if (change === 'audience-withdrawal') {
      const row = await ctx.db
        .query('groupEventAudiences')
        .withIndex('by_groupId_and_eventId', q =>
          q.eq('groupId', f.groupId).eq('eventId', f.event.eventId)
        )
        .unique();
      await ctx.db.delete(row!._id);
    }
    if (change === 'brand-suspension') {
      await ctx.db.insert('groupAnnouncementBrands', {
        groupId: f.groupId,
        appId: f.appId,
        returnUrl: 'https://app.example/preferences',
      });
      await ctx.db.patch(f.appId, { status: 'suspended' });
    }
  });
  const provider = vi.fn();
  vi.stubGlobal('fetch', provider);
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId: f.dispatchId,
  });
  expect(provider).not.toHaveBeenCalled();
  // Audience withdrawal removes current send authority, so status is deliberately unavailable there.
  if (change !== 'audience-withdrawal')
    expect(await f.status()).toMatchObject({ suppressed: 1 });
});
it('stops uncertain provider retries before the provider idempotency retention expires', async () => {
  const f = await mailFixture();
  const provider = vi.fn().mockRejectedValue(new Error('Response lost'));
  vi.stubGlobal('fetch', provider);
  vi.stubEnv('RESEND_API_KEY', 'synthetic');
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId: f.dispatchId,
  });
  await f.t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'session',
      where: [{ field: '_id', operator: 'eq', value: f.staff.session._id }],
      update: { expiresAt: Date.now() + 48 * 3600000 },
    },
  });
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(Date.now() + 23 * 3600000 + 1);
  await expect(
    f.staff.auth.mutation(api.groupAnnouncements.eventMail.retry, {
      announcementId: f.announcementId,
    })
  ).rejects.toThrow('retired');
  expect(provider).toHaveBeenCalledTimes(1);
});
it('rechecks the delegated opt-in source grant and blocks a disconnected trusted return', async () => {
  const f = await mailFixture();
  expect(
    (await f.request('announcement-preference', 'PUT', { subscribed: true }))
      .status
  ).toBe(200);
  const grantId = await f.t.run(
    async ctx =>
      (await ctx.db
        .query('delegatedGrantBindings')
        .withIndex('by_personId', q => q.eq('personId', f.owner.personId))
        .unique())!.grantId
  );
  await f.owner.auth.mutation(api.delegatedApps.mutations.disconnect, {
    grantId,
  });
  const provider = vi.fn();
  vi.stubGlobal('fetch', provider);
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId: f.dispatchId,
  });
  expect(provider).not.toHaveBeenCalled();
  expect(await f.status()).toMatchObject({ suppressed: 1 });
});
it('removes private Event mail on Event retirement while retaining unrelated Group preferences', async () => {
  const f = await mailFixture();
  await f.owner.auth.mutation(api.events.mutations.deleteEvent, {
    eventId: f.event.eventId,
  });
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId: f.dispatchId,
  });
  expect(
    await f.t.run(ctx => ctx.db.query('groupEventMail').collect())
  ).toEqual([]);
  expect(
    await f.owner.auth.query(api.groups.announcementPreferences.readOwn, {
      groupId: f.groupId,
    })
  ).toEqual({ subscribed: true });
});
it('purges recipient preferences and frozen delivery payloads during account deletion', async () => {
  const f = await mailFixture();
  await f.t.run(async ctx => {
    await ctx.db.patch(f.event.eventId, { creatorId: f.staff.personId });
    const member = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', f.owner.personId).eq('eventId', f.event.eventId)
      )
      .unique();
    await ctx.db.patch(member!._id, { role: 'ATTENDEE' });
  });
  await f.owner.auth.mutation(api.users.mutations.deleteUserAccount, {
    confirmation: 'delegated-owner',
  });
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId: f.dispatchId,
  });
  expect(
    await f.t.run(ctx => ctx.db.query('groupEventMail').collect())
  ).toEqual([]);
  expect(
    await f.t.run(ctx => ctx.db.query('groupAnnouncementPreferences').collect())
  ).toEqual([]);
});
it('suppresses queued mail at the canonical exclusion fence before blocked expulsion cleanup completes', async () => {
  const f = await mailFixture();
  const expelled = await f.staff.auth.mutation(api.groups.expulsions.expel, {
    groupId: f.groupId,
    personId: f.owner.personId,
    operationId: crypto.randomUUID(),
  });
  expect(expelled).toMatchObject({ exclusion: 'active', cleanup: 'blocked' });
  const provider = vi.fn();
  vi.stubGlobal('fetch', provider);
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId: f.dispatchId,
  });
  expect(provider).not.toHaveBeenCalled();
  expect(await f.status()).toMatchObject({ suppressed: 1 });
});
it('suppresses a frozen retry when its private destination was removed instead of claiming provider delivery', async () => {
  const f = await mailFixture();
  const provider = vi
    .fn()
    .mockResolvedValue(new Response('{}', { status: 503 }));
  vi.stubGlobal('fetch', provider);
  vi.stubEnv('RESEND_API_KEY', 'synthetic');
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId: f.dispatchId,
  });
  await f.owner.auth.mutation(api.settings.mutations.saveNotificationSettings, {
    notificationMethods: [
      {
        type: 'EMAIL',
        enabled: true,
        value: 'new-address@example.test',
        notifications: [],
      },
    ],
  });
  await requeueHistoricalDispatch(f.t, f.dispatchId);
  await f.t.action(internal.groupAnnouncements.eventMailActions.send, {
    dispatchId: f.dispatchId,
  });
  expect(provider).toHaveBeenCalledTimes(1);
  expect(await f.status()).toMatchObject({ suppressed: 1, delivered: 0 });
});

it('refuses a guessed private Group preference return for an unrelated signed-in person', async () => {
  const f = await applicant();
  const { createAuthAccount } = await import('./auth.helpers');
  const stranger = await createAuthAccount(f.t, 'private-preference-stranger');
  await expect(
    stranger.auth.query(api.groupAnnouncements.eventMail.preferenceReturn, {
      groupId: f.groupId,
    })
  ).rejects.toThrow();
  await stranger.auth.mutation(api.groups.announcementPreferences.updateOwn, {
    groupId: f.groupId,
    subscribed: false,
    operationId: crypto.randomUUID(),
  });
  await expect(
    stranger.auth.query(api.groupAnnouncements.eventMail.preferenceReturn, {
      groupId: f.groupId,
    })
  ).rejects.toThrow();
});

it('requires fresh announcement opt-in after voluntary Leave and fresh invitation admission', async () => {
  const f = await applicant();
  const invite = await f.staff.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId: f.groupId, inviteePersonId: f.owner.personId }
  );
  await f.owner.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: invite.inviteId,
  });
  await f.owner.auth.mutation(api.groups.announcementPreferences.updateOwn, {
    groupId: f.groupId,
    subscribed: true,
    operationId: crypto.randomUUID(),
  });
  await f.owner.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId: f.groupId,
  });
  expect(
    await f.owner.auth.query(
      api.groupAnnouncements.eventMail.preferenceReturn,
      { groupId: f.groupId }
    )
  ).toMatchObject({ groupName: 'Community', subscribed: true, url: null });

  const fresh = await f.staff.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId: f.groupId, inviteePersonId: f.owner.personId }
  );
  await f.owner.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: fresh.inviteId,
  });
  expect(
    await f.owner.auth.query(api.groups.announcementPreferences.readOwn, {
      groupId: f.groupId,
    })
  ).toEqual({ subscribed: false });
});

it('retains the exact provider message for a historical internal queued retry', async () => {
  const f = await mailFixture();
  const claimed = await f.t.mutation(
    internal.groupAnnouncements.eventMail.claim,
    { dispatchId: f.dispatchId }
  );
  expect(claimed?.messages).toHaveLength(1);
  await expect(
    f.staff.auth.mutation(api.groupAnnouncements.eventMail.retry, {
      announcementId: f.announcementId,
    })
  ).rejects.toThrow('retired');
  vi.useFakeTimers();
  vi.setSystemTime(Date.now() + 300001);
  await requeueHistoricalDispatch(f.t, f.dispatchId);
  const retried = await f.t.mutation(
    internal.groupAnnouncements.eventMail.claim,
    { dispatchId: f.dispatchId }
  );
  expect(retried?.messages).toEqual(claimed?.messages);
});
