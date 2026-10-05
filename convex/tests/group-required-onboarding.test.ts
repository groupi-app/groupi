import { expect, it, vi } from 'vitest';
import { api, components, internal } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

async function actor(
  t: ReturnType<typeof createTestInstance>,
  username: string,
  permissions?: Record<string, string[]>
) {
  const account = await createAuthAccount(t, username);
  const rawKey = `grp_groups_${username}`;
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawKey)
  );
  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: account.user._id,
        key: btoa(String.fromCharCode(...new Uint8Array(hash)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''),
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...(permissions ? { permissions: JSON.stringify(permissions) } : {}),
      },
    },
  });
  return {
    ...account,
    request: (path: string, method = 'GET', body?: unknown) =>
      t.fetch(`/api/v2${path}`, {
        method,
        headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
  };
}
async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return status === 204 ? null : response.json();
}

it('admits before required onboarding, gates ordinary roster, and preserves recovery and independent Events', async () => {
  vi.useFakeTimers();
  try {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'required-owner'),
      member = await actor(t, 'required-member'),
      mod = await actor(t, 'required-mod');
    const { groupId } = await body(
      await owner.request('/groups', 'POST', { name: 'Required' }),
      201
    );
    const base = `/groups/${groupId}/joining-questionnaire`;
    const questions = [
      { id: 'name', label: 'Name', type: 'SHORT_ANSWER', required: true },
    ];
    const configured = await body(
      await owner.request(base, 'PUT', {
        enabled: true,
        requiredCompletion: true,
        questions,
      })
    );
    expect(configured).toMatchObject({
      requiredCompletion: true,
      requiresCompletion: true,
      canAccessMemberContent: false,
    });
    for (const person of [member, mod]) {
      const invite = await owner.auth.mutation(
        api.groupInvites.mutations.sendGroupInvite,
        { groupId, inviteePersonId: person.personId }
      );
      expect(
        await person.auth.mutation(
          api.groupInvites.mutations.acceptGroupInvite,
          { inviteId: invite.inviteId }
        )
      ).toMatchObject({ joiningQuestionnaire: { requiresCompletion: true } });
    }
    expect(
      await body(await member.request('/groups/' + groupId))
    ).toMatchObject({
      viewerRole: 'MEMBER',
      joiningQuestionnaire: { requiresCompletion: true },
    });
    await body(await member.request('/groups/' + groupId + '/members'), 403);
    await expect(
      member.auth.query(api.groups.queries.listGroupMembers, {
        groupId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).rejects.toThrow('Complete');
    await owner.auth.mutation(
      api.groupModeration.mutations.setGroupMemberRole,
      { groupId, personId: mod.personId, role: 'MODERATOR' }
    );
    await body(await mod.request('/groups/' + groupId + '/members'));
    await body(await mod.request(base + '/responses'));
    const event = await member.auth.mutation(api.events.mutations.createEvent, {
      title: 'Independent',
      chosenDateTime: '2027-01-01T12:00:00Z',
    });
    expect(
      await member.auth.query(api.events.queries.getEventHeader, {
        eventId: event.eventId,
      })
    ).toMatchObject({ event: { title: 'Independent' } });
    const form = await body(await member.request(base));
    await body(
      await member.request(base + '/answers', 'PUT', {
        version: form.version,
        answers: { name: 'Saved' },
      })
    );
    expect(
      (await body(await member.request('/groups/' + groupId + '/members')))
        .items
    ).toHaveLength(3);
    await body(
      await owner.request(base, 'PUT', {
        enabled: true,
        questions: [{ ...questions[0], label: 'Cosmetic' }],
      })
    );
    expect(await body(await member.request(base))).toMatchObject({
      requiredCompletion: true,
      completed: true,
      requiresCompletion: false,
    });
    await body(
      await owner.request(base, 'PUT', {
        enabled: true,
        questions: [{ ...questions[0], type: 'LONG_ANSWER' }],
      })
    );
    expect(await body(await member.request(base))).toMatchObject({
      requiresCompletion: true,
    });
    await body(await member.request('/groups/' + groupId + '/members'), 403);
    const changed = await body(await member.request(base));
    await body(
      await member.request(base + '/answers', 'PUT', {
        version: changed.version,
        answers: { name: 'Current' },
      })
    );
    await member.auth.mutation(api.groupModeration.mutations.leaveGroup, {
      groupId,
    });
    const returnInvite = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: member.personId }
    );
    expect(
      await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: returnInvite.inviteId,
      })
    ).toMatchObject({
      joiningQuestionnaire: { completed: true, requiresCompletion: false },
    });
    const offer = await owner.auth.mutation(
      api.groupTransfers.mutations.offer,
      { groupId, recipientId: mod.personId }
    );
    expect(offer?.transferId).toBeTruthy();
    await mod.auth.mutation(api.groupTransfers.mutations.accept, {
      groupId,
      transferId: offer!.transferId!,
    });
    expect(await body(await mod.request(base))).toMatchObject({
      canConfigure: true,
      requiresCompletion: true,
    });
    await expect(
      owner.auth.mutation(
        api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
        { groupId, enabled: false, questions }
      )
    ).rejects.toThrow();
    await body(
      await mod.request(base, 'PUT', {
        enabled: false,
        questions: [{ ...questions[0], type: 'LONG_ANSWER' }],
      })
    );

    await body(await member.request('/groups/' + groupId + '/members'));
    await member.auth.mutation(api.groupModeration.mutations.leaveGroup, {
      groupId,
    });
    expect(await body(await member.request(base))).toMatchObject({
      canEdit: false,
      requiresCompletion: false,
    });
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  } finally {
    vi.useRealTimers();
  }
});

it('required semantic changes notify affected live members once while cosmetic edits preserve queued notices', async () => {
  vi.useFakeTimers();
  try {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'notice-owner'),
      member = await actor(t, 'notice-member');
    const { groupId } = await body(
      await owner.request('/groups', 'POST', { name: 'Notice' }),
      201
    );
    const base = `/groups/${groupId}/joining-questionnaire`;
    const q = { id: 'old', label: 'Old', type: 'SHORT_ANSWER', required: true };
    await body(
      await owner.request(base, 'PUT', { enabled: true, questions: [q] })
    );
    const invite = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: member.personId }
    );
    await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: invite.inviteId,
    });
    const form = await body(await member.request(base));
    await body(
      await member.request(base + '/answers', 'PUT', {
        version: form.version,
        answers: { old: 'Saved' },
      })
    );
    await body(
      await owner.request(base, 'PUT', {
        enabled: true,
        requiredCompletion: true,
        questions: [
          q,
          { id: 'new', label: 'Required new', type: 'YES_NO', required: true },
        ],
      })
    );
    await body(
      await owner.request(base, 'PUT', {
        enabled: true,
        questions: [
          {
            id: 'new',
            label: 'Cosmetic label',
            type: 'YES_NO',
            required: true,
          },
          q,
        ],
      })
    );
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    const read = () =>
      member.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      );
    expect(
      (await read()).notifications.filter(
        n => n.type === 'GROUP_ONBOARDING_REQUIRED'
      )
    ).toHaveLength(1);
    await body(
      await owner.request(base, 'PUT', {
        enabled: true,
        questions: [
          q,
          {
            id: 'new',
            label: 'Again cosmetic',
            type: 'YES_NO',
            required: true,
          },
        ],
      })
    );
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    expect(
      (await read()).notifications.filter(
        n => n.type === 'GROUP_ONBOARDING_REQUIRED'
      )
    ).toHaveLength(1);
    await body(
      await owner.request(base, 'PUT', { enabled: true, questions: [q] })
    );
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    expect(
      (await read()).notifications.filter(
        n => n.type === 'GROUP_ONBOARDING_REQUIRED'
      )
    ).toHaveLength(1);
    await body(
      await owner.request(base, 'PUT', {
        enabled: true,
        questions: [
          q,
          {
            id: 'new',
            label: 'Material',
            type: 'SHORT_ANSWER',
            required: true,
          },
        ],
      })
    );
    await body(
      await owner.request(base, 'PUT', { enabled: false, questions: [q] })
    );
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    expect(
      (await read()).notifications.filter(
        n => n.type === 'GROUP_ONBOARDING_REQUIRED'
      )
    ).toHaveLength(1);
  } finally {
    vi.useRealTimers();
  }
});

it('uses current notification channel preferences and cancels external delivery after completion', async () => {
  vi.useFakeTimers();
  try {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'channel-owner'),
      member = await actor(t, 'channel-member');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Channels' }
    );
    const invite = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: member.personId }
    );
    await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: invite.inviteId,
    });
    await member.auth.mutation(api.pushNotifications.mutations.registerDevice, {
      token: 'ExpoPushToken[onboarding-test-token]',
      deviceId: 'onboarding-device',
      platform: 'ios',
      projectId: 'onboarding-test-project',
      appId: 'gg.groupi.mobile',
    });
    await member.auth.mutation(
      api.settings.mutations.saveNotificationSettings,
      {
        notificationMethods: [
          {
            type: 'PUSH',
            enabled: true,
            value: 'Native push',
            notifications: [
              { notificationType: 'GROUP_ONBOARDING_REQUIRED', enabled: true },
            ],
          },
          {
            type: 'EMAIL',
            enabled: true,
            value: 'member@example.test',
            notifications: [
              { notificationType: 'GROUP_ONBOARDING_REQUIRED', enabled: false },
            ],
          },
          {
            type: 'WEBHOOK',
            enabled: true,
            value: 'https://example.test/hook',
            webhookFormat: 'GENERIC',
            notifications: [
              { notificationType: 'GROUP_ONBOARDING_REQUIRED', enabled: true },
            ],
          },
        ],
      }
    );
    const configured = await owner.auth.mutation(
      api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
      {
        groupId,
        enabled: true,
        requiredCompletion: true,
        questions: [
          {
            id: 'private',
            label: 'Private detail',
            type: 'SHORT_ANSWER',
            required: true,
          },
        ],
      }
    );
    const job = await t.run(ctx =>
      ctx.db
        .query('groupOnboardingJobs')
        .withIndex('by_groupId', q => q.eq('groupId', groupId))
        .unique()
    );
    await t.mutation(
      internal.groupQuestionnaires.notifications.deliverRequiredChanges,
      { jobId: job!._id }
    );
    const notification = (
      await member.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      )
    ).notifications.find(n => n.type === 'GROUP_ONBOARDING_REQUIRED')!;
    const pushes = await t.run(ctx =>
      ctx.db
        .query('pushDeliveries')
        .withIndex('by_notification', q =>
          q.eq('notificationId', notification._id)
        )
        .collect()
    );
    expect(pushes).toHaveLength(1);
    await t.mutation(internal.pushNotifications.mutations.claimDeliveries, {
      deliveryIds: pushes.map(p => p._id),
    });
    expect(
      (
        await t.query(internal.pushNotifications.queries.resolveDeliveryJobs, {
          deliveryIds: pushes.map(p => p._id),
          purpose: 'send',
        })
      ).ready
    ).toHaveLength(1);
    await member.auth.mutation(
      api.settings.mutations.saveNotificationSettings,
      {
        notificationMethods: [
          {
            type: 'PUSH',
            enabled: false,
            value: 'Native push',
            notifications: [],
          },
          {
            type: 'EMAIL',
            enabled: true,
            value: 'member@example.test',
            notifications: [
              { notificationType: 'GROUP_ONBOARDING_REQUIRED', enabled: false },
            ],
          },
          {
            type: 'WEBHOOK',
            enabled: true,
            value: 'https://example.test/hook',
            webhookFormat: 'GENERIC',
            notifications: [
              { notificationType: 'GROUP_ONBOARDING_REQUIRED', enabled: true },
            ],
          },
        ],
      }
    );
    expect(
      (
        await t.query(internal.pushNotifications.queries.resolveDeliveryJobs, {
          deliveryIds: pushes.map(p => p._id),
          purpose: 'send',
        })
      ).cancelled
    ).toHaveLength(1);
    const payload = await t.mutation(
      internal.groupQuestionnaires.notifications.resolveExternal,
      { notificationId: notification._id }
    );
    expect(payload.emails).toEqual([]);
    expect(payload.webhooks).toHaveLength(1);
    expect(JSON.stringify(payload)).not.toContain('Private detail');
    expect(
      await t.mutation(
        internal.groupQuestionnaires.notifications.resolveExternal,
        { notificationId: notification._id }
      )
    ).toEqual({ emails: [], webhooks: [] });
    await member.auth.mutation(
      api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
      {
        groupId,
        version: configured.version,
        answers: { private: 'Sensitive' },
      }
    );
    await owner.auth.mutation(
      api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
      {
        groupId,
        enabled: true,
        questions: [
          {
            id: 'private',
            label: 'Changed',
            type: 'LONG_ANSWER',
            required: true,
          },
        ],
      }
    );
    const nextJob = await t.run(ctx =>
      ctx.db
        .query('groupOnboardingJobs')
        .withIndex('by_groupId', q => q.eq('groupId', groupId))
        .unique()
    );
    await t.mutation(
      internal.groupQuestionnaires.notifications.deliverRequiredChanges,
      { jobId: nextJob!._id }
    );
    const pending = (
      await member.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      )
    ).notifications
      .filter(n => n.type === 'GROUP_ONBOARDING_REQUIRED')
      .find(n => n._id !== notification._id)!;
    const current = await member.auth.query(
      api.groupQuestionnaires.queries.getJoiningQuestionnaire,
      { groupId }
    );
    await member.auth.mutation(
      api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
      { groupId, version: current.version, answers: { private: 'Current' } }
    );
    expect(
      await t.mutation(
        internal.groupQuestionnaires.notifications.resolveExternal,
        { notificationId: pending._id }
      )
    ).toEqual({ emails: [], webhooks: [] });
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  } finally {
    vi.useRealTimers();
  }
});

it('purges pending onboarding recipient data through all three account deletion paths and Group deletion', async () => {
  vi.useFakeTimers();
  try {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'producer-owner'),
      admin = await actor(t, 'producer-admin');
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: admin.user._id }],
        update: { role: 'admin' },
      },
    });
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Cleanup' }
    );
    for (const path of ['self', 'app', 'rest'] as const) {
      const target = await actor(t, 'producer-' + path);
      const invite = await owner.auth.mutation(
        api.groupInvites.mutations.sendGroupInvite,
        { groupId, inviteePersonId: target.personId }
      );
      await target.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: invite.inviteId,
      });
      await owner.auth.mutation(
        api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
        {
          groupId,
          enabled: true,
          requiredCompletion: true,
          questions: [
            { id: path, label: path, type: 'SHORT_ANSWER', required: true },
          ],
        }
      );
      const job = await t.run(ctx =>
        ctx.db
          .query('groupOnboardingJobs')
          .withIndex('by_groupId', q => q.eq('groupId', groupId))
          .unique()
      );
      await t.mutation(
        internal.groupQuestionnaires.notifications.deliverRequiredChanges,
        { jobId: job!._id }
      );
      expect(
        await t.run(ctx =>
          ctx.db
            .query('groupOnboardingDispatches')
            .withIndex('by_personId', q => q.eq('personId', target.personId))
            .collect()
        )
      ).toHaveLength(1);
      if (path === 'self')
        await target.auth.mutation(api.users.mutations.deleteUserAccount, {
          confirmation: 'producer-' + path,
        });
      else if (path === 'app')
        await admin.auth.mutation(api.admin.mutations.deletePerson, {
          personId: target.personId,
        });
      else
        await body(
          await admin.request('/admin/users/' + target.user._id, 'DELETE'),
          204
        );
      expect(
        await t.run(ctx =>
          ctx.db
            .query('groupOnboardingDispatches')
            .withIndex('by_personId', q => q.eq('personId', target.personId))
            .collect()
        )
      ).toEqual([]);
    }
    const successorInvite = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: admin.personId }
    );
    await admin.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: successorInvite.inviteId,
    });
    await owner.auth.mutation(
      api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
      {
        groupId,
        enabled: true,
        questions: [
          {
            id: 'successor',
            label: 'Successor',
            type: 'SHORT_ANSWER',
            required: true,
          },
        ],
      }
    );
    const producerJob = await t.run(ctx =>
      ctx.db
        .query('groupOnboardingJobs')
        .withIndex('by_groupId', q => q.eq('groupId', groupId))
        .unique()
    );
    await t.mutation(
      internal.groupQuestionnaires.notifications.deliverRequiredChanges,
      { jobId: producerJob!._id }
    );
    const survivingNotice = (
      await admin.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      )
    ).notifications.find(n => n.type === 'GROUP_ONBOARDING_REQUIRED')!;
    await owner.auth.mutation(
      api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
      {
        groupId,
        enabled: true,
        questions: [
          {
            id: 'successor',
            label: 'Successor',
            type: 'LONG_ANSWER',
            required: true,
          },
        ],
      }
    );
    const offer = await owner.auth.mutation(
      api.groupTransfers.mutations.offer,
      { groupId, recipientId: admin.personId }
    );
    await admin.auth.mutation(api.groupTransfers.mutations.accept, {
      groupId,
      transferId: offer!.transferId!,
    });
    await owner.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'producer-owner',
    });
    expect(
      await t.run(ctx =>
        ctx.db
          .query('groupOnboardingJobs')
          .withIndex('by_actorId', q => q.eq('actorId', owner.personId))
          .collect()
      )
    ).toEqual([]);
    expect(
      (await t.run(ctx => ctx.db.get(survivingNotice._id)))?.authorId
    ).toBeUndefined();
    await body(await admin.request('/groups/' + groupId, 'DELETE'), 204);
    for (const table of [
      'groupOnboardingJobs',
      'groupOnboardingDispatches',
    ] as const)
      expect(await t.run(ctx => ctx.db.query(table).collect())).toEqual([]);
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  } finally {
    vi.useRealTimers();
  }
});
