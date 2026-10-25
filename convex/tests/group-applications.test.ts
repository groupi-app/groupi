import { describe, it, expect, vi } from 'vitest';
import { api } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';
const questions = [
  {
    id: 'why',
    label: 'Why join?',
    type: 'SHORT_ANSWER' as const,
    required: true,
  },
  { id: 'confirm', label: 'Confirm', type: 'YES_NO' as const, required: true },
];
const paginationOpts = { numItems: 20, cursor: null };
describe('authenticated Group applications', () => {
  it('retains reviewed answers, admits exactly once and preserves author history after leaving', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'app-owner');
    const person = await createAuthAccount(t, 'app-person');
    const stranger = await createAuthAccount(t, 'app-stranger');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Applications' }
    );
    await expect(
      person.auth.mutation(
        api.groupApplications.mutations.submitGroupApplication,
        { groupId, answers: { why: 'Reading', confirm: false } }
      )
    ).rejects.toThrow();
    await owner.auth.mutation(
      api.groupApplications.mutations.configureGroupApplications,
      { groupId, applicationsEnabled: true, questions }
    );
    await person.auth.mutation(api.settings.mutations.savePrivacySettings, {
      allowFriendRequestsFrom: 'EVERYONE',
      allowEventInvitesFrom: 'EVERYONE',
      allowGroupInvitesFrom: 'NO_ONE',
    });
    const submitted = await person.auth.mutation(
      api.groupApplications.mutations.submitGroupApplication,
      { groupId, answers: { why: 'Reading', confirm: false } }
    );
    expect(
      await person.auth.mutation(
        api.groupApplications.mutations.submitGroupApplication,
        { groupId, answers: { why: 'Reading', confirm: false } }
      )
    ).toEqual(submitted);
    await expect(
      stranger.auth.query(api.groupApplications.queries.getGroupApplication, {
        applicationId: submitted.applicationId,
      })
    ).rejects.toThrow();
    await expect(
      person.auth.query(api.groups.queries.listGroupMembers, {
        groupId,
        paginationOpts,
      })
    ).rejects.toThrow();
    await owner.auth.mutation(
      api.groupApplications.mutations.configureGroupApplications,
      {
        groupId,
        applicationsEnabled: true,
        questions: [
          { id: 'new', label: 'New', type: 'NUMBER', required: true },
        ],
      }
    );
    await person.auth.mutation(
      api.groupApplications.mutations.editGroupApplication,
      {
        applicationId: submitted.applicationId,
        answers: { why: 'Updated', confirm: false },
      }
    );
    await Promise.all([
      owner.auth.mutation(
        api.groupApplications.mutations.reviewGroupApplication,
        { applicationId: submitted.applicationId, decision: 'APPROVED' }
      ),
      owner.auth.mutation(
        api.groupApplications.mutations.reviewGroupApplication,
        { applicationId: submitted.applicationId, decision: 'APPROVED' }
      ),
    ]);
    expect(
      await person.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({ viewerRole: 'MEMBER', memberCount: 2 });
    await expect(
      person.auth.mutation(
        api.groupApplications.mutations.editGroupApplication,
        {
          applicationId: submitted.applicationId,
          answers: { why: 'Replaced', confirm: true },
        }
      )
    ).rejects.toThrow();
    await person.auth.mutation(api.groupModeration.mutations.leaveGroup, {
      groupId,
    });
    const history = await person.auth.query(
      api.groupApplications.queries.listMyGroupApplications,
      { groupId, paginationOpts }
    );
    expect(history.page[0]).toMatchObject({
      questions,
      answers: { why: 'Updated', confirm: false },
      status: 'APPROVED',
    });
    expect(history.page[0].decisions).toHaveLength(1);
    await owner.auth.mutation(
      api.groupApplications.mutations.reviewGroupApplication,
      { applicationId: submitted.applicationId, decision: 'APPROVED' }
    );
    expect(
      await person.auth.query(api.groups.queries.getGroup, { groupId })
    ).toBeNull();
    expect(
      await t.run(async ctx => ({
        events: await ctx.db.query('memberships').collect(),
        friends: await ctx.db.query('friendships').collect(),
      }))
    ).toEqual({ events: [], friends: [] });
  });
  it('withdraws private pending requests and rejects stale eligibility/review roles without altering retained history', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'elig-app-owner');
    const person = await createAuthAccount(t, 'elig-app-person');
    const mod = await createAuthAccount(t, 'elig-app-mod');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Eligibility' }
    );
    await owner.auth.mutation(
      api.groupApplications.mutations.configureGroupApplications,
      { groupId, applicationsEnabled: true, questions }
    );
    const offer = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: mod.personId }
    );
    await mod.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: offer.inviteId,
    });
    await owner.auth.mutation(
      api.groupModeration.mutations.setGroupMemberRole,
      { groupId, personId: mod.personId, role: 'MODERATOR' }
    );
    const first = await person.auth.mutation(
      api.groupApplications.mutations.submitGroupApplication,
      { groupId, answers: { why: 'First', confirm: true } }
    );
    await mod.auth.mutation(
      api.groupApplications.mutations.reviewGroupApplication,
      { applicationId: first.applicationId, decision: 'DECLINED' }
    );
    const second = await person.auth.mutation(
      api.groupApplications.mutations.submitGroupApplication,
      { groupId, answers: { why: 'Second', confirm: false } }
    );
    expect(second.applicationId).not.toEqual(first.applicationId);
    await owner.auth.mutation(
      api.groupModeration.mutations.setGroupMemberRole,
      { groupId, personId: mod.personId, role: 'MEMBER' }
    );
    await expect(
      mod.auth.mutation(
        api.groupApplications.mutations.reviewGroupApplication,
        { applicationId: second.applicationId, decision: 'APPROVED' }
      )
    ).rejects.toThrow('manager');
    await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
      groupId,
      personId: person.personId,
    });
    await expect(
      owner.auth.mutation(
        api.groupApplications.mutations.reviewGroupApplication,
        { applicationId: second.applicationId, decision: 'APPROVED' }
      )
    ).rejects.toThrow('eligible');
    await expect(
      person.auth.mutation(
        api.groupApplications.mutations.submitGroupApplication,
        { groupId, answers: { why: 'Third', confirm: true } }
      )
    ).rejects.toThrow('eligible');
    await owner.auth.mutation(
      api.groupApplications.mutations.configureGroupApplications,
      {
        groupId,
        applicationsEnabled: false,
        questions: [
          {
            id: 'hidden',
            label: 'Unpublished',
            required: true,
            type: 'NUMBER',
          },
        ],
      }
    );
    const form = await person.auth.query(
      api.groupApplications.queries.getGroupApplicationForm,
      { groupId }
    );
    expect(form).toMatchObject({
      questions,
      pending: { _id: second.applicationId },
      canApply: false,
    });
    await person.auth.mutation(
      api.groupApplications.mutations.withdrawGroupApplication,
      { applicationId: second.applicationId }
    );
    expect(
      (
        await person.auth.query(
          api.groupApplications.queries.listMyGroupApplications,
          { groupId, paginationOpts }
        )
      ).page.map(a => a.status)
    ).toEqual(['WITHDRAWN', 'DECLINED']);
    await owner.auth.mutation(
      api.groupApplications.mutations.configureGroupApplications,
      { groupId, applicationsEnabled: true, questions }
    );
    await owner.auth.mutation(api.groupModeration.mutations.liftGroupBan, {
      groupId,
      personId: person.personId,
    });
    const third = await person.auth.mutation(
      api.groupApplications.mutations.submitGroupApplication,
      { groupId, answers: { why: 'Third', confirm: true } }
    );
    await person.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'elig-app-person',
    });
    expect(
      (
        await owner.auth.query(
          api.groupApplications.queries.listGroupApplications,
          { groupId, paginationOpts }
        )
      ).page
    ).toEqual([]);
    expect(await t.run(ctx => ctx.db.get(third.applicationId))).toBeNull();
  });

  it('serializes application and invitation admission with one membership and validates form limits', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'race-app-owner');
    const person = await createAuthAccount(t, 'race-app-person');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Atomic applications' }
    );
    await expect(
      owner.auth.mutation(
        api.groupApplications.mutations.configureGroupApplications,
        {
          groupId,
          applicationsEnabled: true,
          questions: Array.from({ length: 51 }, (_, i) => ({
            id: String(i),
            label: 'Question',
            required: false,
            type: 'SHORT_ANSWER' as const,
          })),
        }
      )
    ).rejects.toThrow('50');
    await owner.auth.mutation(
      api.groupApplications.mutations.configureGroupApplications,
      { groupId, applicationsEnabled: true, questions }
    );
    await expect(
      person.auth.mutation(
        api.groupApplications.mutations.submitGroupApplication,
        {
          groupId,
          answers: { why: 'Reason', confirm: false, unknown: 'Rejected' },
        }
      )
    ).rejects.toThrow('Unknown');
    const [first, second] = await Promise.all([
      person.auth.mutation(
        api.groupApplications.mutations.submitGroupApplication,
        { groupId, answers: { why: 'Concurrent', confirm: false } }
      ),
      person.auth.mutation(
        api.groupApplications.mutations.submitGroupApplication,
        { groupId, answers: { why: 'Concurrent', confirm: false } }
      ),
    ]);
    expect(second).toEqual(first);
    const offer = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: person.personId }
    );
    await Promise.all([
      owner.auth.mutation(
        api.groupApplications.mutations.reviewGroupApplication,
        { applicationId: first.applicationId, decision: 'APPROVED' }
      ),
      person.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
        inviteId: offer.inviteId,
      }),
    ]);
    expect(
      await person.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({ memberCount: 2, viewerRole: 'MEMBER' });
    expect(
      (
        await owner.auth.query(api.groups.queries.listGroupMembers, {
          groupId,
          paginationOpts,
        })
      ).page
    ).toHaveLength(2);
    expect(
      (
        await person.auth.query(
          api.groupApplications.queries.listMyGroupApplications,
          { groupId, paginationOpts }
        )
      ).page
    ).toHaveLength(1);
    expect(
      (
        await owner.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.filter(n => n.type === 'GROUP_APPLICATION_RECEIVED')
    ).toHaveLength(1);
    expect(
      (
        await person.auth.query(
          api.notifications.queries.fetchNotificationsForPerson,
          {}
        )
      ).notifications.filter(n => n.type === 'GROUP_APPLICATION_APPROVED')
    ).toHaveLength(1);
  });

  it('uses actual existing push preference pipeline and cleans decision delivery metadata with the Group', async () => {
    vi.useFakeTimers();
    try {
      const t = createTestInstance();
      registerBetterAuth(t);
      const owner = await createAuthAccount(t, 'delivery-app-owner');
      const person = await createAuthAccount(t, 'delivery-app-person');
      await person.auth.mutation(
        api.pushNotifications.mutations.registerDevice,
        {
          token: 'ExpoPushToken[group-application-fixture]',
          deviceId: 'group-application-fixture',
          platform: 'ios',
          projectId: 'project-a',
          appId: 'gg.groupi.mobile',
        }
      );
      await person.auth.mutation(
        api.settings.mutations.saveNotificationSettings,
        {
          notificationMethods: [
            {
              type: 'PUSH',
              enabled: true,
              value: 'Native device',
              notifications: [
                {
                  notificationType: 'GROUP_APPLICATION_APPROVED',
                  enabled: false,
                },
              ],
            },
          ],
        }
      );
      const groupId = await owner.auth.mutation(
        api.groups.mutations.createGroup,
        { name: 'Application delivery' }
      );
      await owner.auth.mutation(
        api.groupApplications.mutations.configureGroupApplications,
        { groupId, applicationsEnabled: true, questions: [] }
      );
      const first = await person.auth.mutation(
        api.groupApplications.mutations.submitGroupApplication,
        { groupId, answers: {} }
      );
      await owner.auth.mutation(
        api.groupApplications.mutations.reviewGroupApplication,
        { applicationId: first.applicationId, decision: 'APPROVED' }
      );
      expect(
        await t.run(ctx => ctx.db.query('pushDeliveries').collect())
      ).toEqual([]);
      expect(
        (
          await person.auth.query(
            api.notifications.queries.fetchNotificationsForPerson,
            {}
          )
        ).notifications.filter(n => n.type === 'GROUP_APPLICATION_APPROVED')
      ).toHaveLength(1);
      await person.auth.mutation(api.groupModeration.mutations.leaveGroup, {
        groupId,
      });
      await person.auth.mutation(
        api.settings.mutations.saveNotificationSettings,
        {
          notificationMethods: [
            {
              type: 'PUSH',
              enabled: true,
              value: 'Native device',
              notifications: [
                {
                  notificationType: 'GROUP_APPLICATION_APPROVED',
                  enabled: true,
                },
              ],
            },
          ],
        }
      );
      const second = await person.auth.mutation(
        api.groupApplications.mutations.submitGroupApplication,
        { groupId, answers: {} }
      );
      await owner.auth.mutation(
        api.groupApplications.mutations.reviewGroupApplication,
        { applicationId: second.applicationId, decision: 'APPROVED' }
      );
      const deliveries = await t.run(ctx =>
        ctx.db.query('pushDeliveries').collect()
      );
      expect(deliveries).toHaveLength(1);
      expect(deliveries[0]).toMatchObject({
        destination: 'groupApplication',
        groupId,
        status: 'PENDING',
      });
      expect(deliveries[0].title).toContain('Application delivery');
      await owner.auth.mutation(api.groups.mutations.deleteGroup, { groupId });
      expect(
        await t.run(ctx => ctx.db.query('pushDeliveries').collect())
      ).toEqual([]);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
