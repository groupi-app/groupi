import { describe, expect, it, vi } from 'vitest';
import { api, components, internal } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { seedGroupAnnouncement } from './announcement-history.helpers';
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
        headers: {
          'x-api-key': rawKey,
          'content-type': 'application/json',
          'idempotency-key': `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
  };
}
async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return status === 204 ? null : response.json();
}

describe('Explicit announcements REST boundary', () => {
  it('requires Group write scope/current manager role and returns private aggregate recovery status', async () => {
    vi.useFakeTimers();
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'rest-ann-owner', {
      groups: ['read', 'write'],
    });
    const member = await actor(t, 'rest-ann-member');
    const readOnly = await actor(t, 'rest-ann-reader', { groups: ['read'] });
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'REST announcements' }
    );
    await t.run(async ctx => {
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      });
    });
    const endpoint = `/groups/${groupId}/announcements`;
    await body(
      await member.request(endpoint, 'POST', {
        title: 'Denied',
        message: 'No',
      }),
      403
    );
    await body(
      await readOnly.request(endpoint, 'POST', {
        title: 'Denied',
        message: 'No',
      }),
      403
    );
    await body(
      await owner.request(endpoint, 'POST', { title: '', message: 'No' }),
      400
    );
    const snapshot = () =>
      t.run(async ctx => ({
        receipts: await ctx.db.query('groupAnnouncements').collect(),
        notices: await ctx.db.query('notifications').collect(),
        jobs: await ctx.db.system.query('_scheduled_functions').collect(),
      }));
    const before = await snapshot();
    const retired = await body(
      await owner.request(endpoint, 'POST', {
        title: 'Reading',
        message: 'Bring a book',
      }),
      409
    );
    expect(JSON.stringify(retired)).toContain(
      'Announcements have been retired'
    );
    expect(await snapshot()).toEqual(before);
    const requestId = `${Date.now()}.12345678-1234-4123-8123-123456789abc`;
    const history = await seedGroupAnnouncement(
      t,
      owner.personId,
      { groupId, requestId, title: 'Reading', message: 'Bring a book' },
      false
    );
    const historicalSnapshot = await snapshot();
    await body(
      await owner.request(endpoint, 'POST', {
        title: 'Reading',
        message: 'Bring a book',
      }),
      409
    );
    await body(
      await owner.request(endpoint, 'POST', {
        title: 'Reading',
        message: 'Changed',
      }),
      409
    );
    expect(await snapshot()).toEqual(historicalSnapshot);
    const status = await body(
      await owner.request(
        `${endpoint}/status?requestId=${encodeURIComponent(requestId)}`
      )
    );
    expect(status).toMatchObject({
      announcementId: history.announcementId,
      state: 'PROCESSING',
      notified: 0,
    });
    vi.useRealTimers();
  });
});

it.each(['self', 'admin-session', 'admin-rest'] as const)(
  'purges sender announcement data immediately through %s account deletion',
  async mode => {
    vi.useFakeTimers();
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, `cleanup-owner-${mode}`);
    const sender = await actor(t, `cleanup-sender-${mode}`);
    const admin = await actor(t, `cleanup-admin-${mode}`);
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
    await t.run(async ctx => {
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: sender.personId,
        role: 'MODERATOR',
        joinedAt: Date.now(),
      });
    });
    const sent = await seedGroupAnnouncement(t, sender.personId, {
      groupId,
      requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      title: 'Hello',
      message: 'Remove on deletion',
    });
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    expect(
      (
        await owner.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.filter(n => n.type === 'GROUP_ANNOUNCEMENT')
    ).toHaveLength(1);
    if (mode === 'self')
      await sender.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: `cleanup-sender-${mode}`,
      });
    else if (mode === 'admin-session')
      await admin.auth.mutation(api.admin.mutations.deletePerson, {
        personId: sender.personId,
      });
    else
      await body(
        await admin.request(`/admin/users/${sender.user._id}`, 'DELETE'),
        204
      );
    expect(
      (
        await owner.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.filter(n => n.type === 'GROUP_ANNOUNCEMENT')
    ).toEqual([]);
    // Required cleanup seam verifies no private manager message/request record survives.
    expect(await t.run(ctx => ctx.db.get(sent.announcementId))).toBeNull();
    vi.useRealTimers();
  }
);

it('required onboarding gates prior announcement content, fanout, dispatch and already-claimed push while manager recovery remains reachable', async () => {
  vi.useFakeTimers();
  try {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'ann-required-owner'),
      member = await actor(t, 'ann-required-member'),
      mod = await actor(t, 'ann-required-mod');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Required recipients' }
    );
    for (const person of [member, mod]) {
      const invitation = await owner.auth.mutation(
        api.groupInvites.mutations.sendGroupInvite,
        { groupId, inviteePersonId: person.personId }
      );
      await person.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: invitation.inviteId,
      });
    }
    await owner.auth.mutation(
      api.groupModeration.mutations.setGroupMemberRole,
      { groupId, personId: mod.personId, role: 'MODERATOR' }
    );
    await member.auth.mutation(api.pushNotifications.mutations.registerDevice, {
      token: 'ExpoPushToken[announcement-required-test]',
      deviceId: 'ann-required-device',
      platform: 'ios',
      projectId: 'ann-required-project',
      appId: 'gg.groupi.mobile',
    });
    const first = await seedGroupAnnouncement(t, owner.personId, {
      groupId,
      requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      title: 'Prior private content',
      message: 'Private Group detail',
    });
    await t.mutation(internal.groupAnnouncements.mutations.processPage, {
      announcementId: first.announcementId,
    });
    const notices = () =>
      member.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      );
    const old = (await notices()).notifications.find(
      n => n.type === 'GROUP_ANNOUNCEMENT'
    )!;
    await t.mutation(internal.groupAnnouncements.dispatch.collect, {
      notificationId: old._id,
    });
    const pushes = await t.run(ctx =>
      ctx.db
        .query('pushDeliveries')
        .withIndex('by_notification', q => q.eq('notificationId', old._id))
        .collect()
    );
    expect(pushes).toHaveLength(1);
    await t.mutation(internal.pushNotifications.mutations.claimDeliveries, {
      deliveryIds: pushes.map(p => p._id),
    });
    vi.setSystemTime(Date.now() + 1);
    const second = await seedGroupAnnouncement(t, owner.personId, {
      groupId,
      requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      title: 'Queued private content',
      message: 'Do not leak after gate',
    });
    await t.mutation(internal.groupAnnouncements.mutations.processPage, {
      announcementId: second.announcementId,
    });
    const queued = (await notices()).notifications.find(
      n => n.groupAnnouncementId === second.announcementId
    )!;
    await owner.auth.mutation(
      api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
      {
        groupId,
        enabled: true,
        requiredCompletion: true,
        questions: [
          {
            id: 'required',
            label: 'Required',
            type: 'SHORT_ANSWER',
            required: true,
          },
        ],
      }
    );
    const independentGroup = await member.auth.mutation(
      api.groups.mutations.createGroup,
      {
        name: 'Independent Group grant',
      }
    );
    expect(
      (
        await member.auth.query(api.groups.queries.listGroupMembers, {
          groupId: independentGroup,
          paginationOpts: { numItems: 20, cursor: null },
        })
      ).page
    ).toHaveLength(1);
    const gated = (await notices()).notifications.find(n => n._id === old._id)!;
    expect(gated.groupAnnouncement).toBeNull();
    const rest = await body(await member.request('/notifications'));
    expect(JSON.stringify(rest)).not.toContain('Private Group detail');
    expect(
      await t.mutation(internal.groupAnnouncements.dispatch.collect, {
        notificationId: queued._id,
      })
    ).toEqual({ emails: [], webhooks: [] });
    expect(
      (
        await t.query(internal.pushNotifications.queries.resolveDeliveryJobs, {
          deliveryIds: pushes.map(p => p._id),
          purpose: 'send',
        })
      ).cancelled
    ).toHaveLength(1);
    await member.auth.mutation(
      api.pushNotifications.mutations.unregisterDevice,
      { deviceId: 'ann-required-device' }
    );
    vi.setSystemTime(Date.now() + 1);
    const skipped = await seedGroupAnnouncement(t, mod.personId, {
      groupId,
      requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      title: 'Still incomplete',
      message: 'Must not deliver',
    });
    await t.mutation(internal.groupAnnouncements.mutations.processPage, {
      announcementId: skipped.announcementId,
    });
    expect(
      await mod.auth.query(api.groupAnnouncements.queries.getAnnouncement, {
        groupId,
        requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      })
    ).toMatchObject({ notified: 0, skipped: 3 });
    const form = await member.auth.query(
      api.groupQuestionnaires.queries.getJoiningQuestionnaire,
      { groupId }
    );
    await member.auth.mutation(
      api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
      { groupId, version: form.version, answers: { required: 'Current' } }
    );
    expect(
      (await notices()).notifications.find(n => n._id === old._id)
        ?.groupAnnouncement
    ).toMatchObject({ message: 'Private Group detail' });
    vi.setSystemTime(Date.now() + 1);
    const restored = await seedGroupAnnouncement(t, mod.personId, {
      groupId,
      requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      title: 'Restored',
      message: 'Only completed recipients',
    });
    await t.mutation(internal.groupAnnouncements.mutations.processPage, {
      announcementId: restored.announcementId,
    });
    expect(
      await mod.auth.query(api.groupAnnouncements.queries.getAnnouncement, {
        groupId,
        requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      })
    ).toMatchObject({ notified: 1, skipped: 2 });
    const independent = await member.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'Independent Event', chosenDateTime: '2027-01-01T12:00:00Z' }
    );
    expect(
      await member.auth.query(api.events.queries.getEventHeader, {
        eventId: independent.eventId,
      })
    ).toMatchObject({ event: { title: 'Independent Event' } });
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  } finally {
    vi.useRealTimers();
  }
});
