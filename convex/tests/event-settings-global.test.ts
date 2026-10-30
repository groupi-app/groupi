import { describe, it, expect } from 'vitest';
import { api } from '../_generated/api';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
const TestScenarios = {
  async singleEvent(t: ReturnType<typeof createTestInstance>) {
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'settings-owner');
    const event = await owner.auth.mutation(api.events.mutations.createEvent, {
      title: 'Synthetic settings Event',
    });
    return { ...owner, ...event };
  },
  async multiUser(t: ReturnType<typeof createTestInstance>) {
    const organizer = await this.singleEvent(t);
    const attendee = await createAuthAccount(t, 'settings-attendee');
    const membershipId = await t.run(ctx =>
      ctx.db.insert('memberships', {
        eventId: organizer.eventId,
        personId: attendee.personId,
        role: 'ATTENDEE',
        rsvpStatus: 'PENDING',
        updatedAt: Date.now(),
      })
    );
    return {
      organizer,
      attendee: { ...attendee, membershipId },
      eventId: organizer.eventId,
      organizerAuth: organizer.auth,
      attendeeAuth: attendee.auth,
    };
  },
};

describe('atomic Event settings', () => {
  it('saves independent sections together and returns a new acknowledged baseline', async () => {
    const t = createTestInstance();
    const { auth, eventId } = await TestScenarios.singleEvent(t);
    const before = await auth.query(api.events.queries.getSettings, {
      eventId,
    });
    const after = await auth.mutation(api.events.mutations.saveSettings, {
      eventId,
      expectedRevision: before.revision,
      patch: {
        details: { title: 'Updated together' },
        admissionPolicy: 'DIRECT',
        applications: {
          questions: [
            {
              id: 'q',
              label: 'What can you bring?',
              required: true,
              type: 'SHORT_ANSWER',
            },
          ],
          reviewerPolicy: 'ORGANIZER_ONLY',
        },
        permissions: { ...before.permissions, createPosts: 'MODERATOR' },
      },
    });
    expect(after.details.title).toBe('Updated together');
    expect(after.admissionPolicy).toBe('DIRECT');
    expect(after.applications.questions).toHaveLength(1);
    expect(after.permissions.createPosts).toBe('MODERATOR');
    expect(after.revision).not.toBe(before.revision);
    expect(after.revision).toMatch(/^[a-f0-9]{64}$/);
  });
  it('rolls back earlier sections if a later section fails, retaining the original revision', async () => {
    const t = createTestInstance();
    const { auth, eventId } = await TestScenarios.singleEvent(t);
    const before = await auth.query(api.events.queries.getSettings, {
      eventId,
    });
    await expect(
      auth.mutation(api.events.mutations.saveSettings, {
        eventId,
        expectedRevision: before.revision,
        patch: {
          details: { title: 'Must roll back' },
          addons: [
            {
              addonType: 'reminders',
              enabled: true,
              config: { reminderOffset: 'INVALID' },
            },
          ],
        },
      })
    ).rejects.toThrow();
    const after = await auth.query(api.events.queries.getSettings, { eventId });
    expect(after.details.title).toBe(before.details.title);
    expect(after.revision).toBe(before.revision);
  });
  it('rejects stale saves without overwriting another editor', async () => {
    const t = createTestInstance();
    const { auth, eventId } = await TestScenarios.singleEvent(t);
    const before = await auth.query(api.events.queries.getSettings, {
      eventId,
    });
    await auth.mutation(api.events.mutations.saveSettings, {
      eventId,
      expectedRevision: before.revision,
      patch: { details: { title: 'Other editor' } },
    });
    await expect(
      auth.mutation(api.events.mutations.saveSettings, {
        eventId,
        expectedRevision: before.revision,
        patch: { details: { title: 'Stale editor' } },
      })
    ).rejects.toThrow('changed');
    expect(
      (await auth.query(api.events.queries.getSettings, { eventId })).details
        .title
    ).toBe('Other editor');
  });
  it('denies members and rechecks moderator authority for restricted sections atomically', async () => {
    const t = createTestInstance();
    const s = await TestScenarios.multiUser(t);
    await expect(
      s.attendeeAuth.query(api.events.queries.getSettings, {
        eventId: s.eventId,
      })
    ).rejects.toThrow();
    await t.run(async ctx =>
      ctx.db.patch(s.attendee.membershipId, { role: 'MODERATOR' })
    );
    const before = await s.attendeeAuth.query(api.events.queries.getSettings, {
      eventId: s.eventId,
    });
    await expect(
      s.attendeeAuth.mutation(api.events.mutations.saveSettings, {
        eventId: s.eventId,
        expectedRevision: before.revision,
        patch: {
          details: { title: 'No partial moderator write' },
          admissionPolicy: 'DIRECT',
        },
      })
    ).rejects.toThrow();
    expect(
      (
        await s.organizerAuth.query(api.events.queries.getSettings, {
          eventId: s.eventId,
        })
      ).details.title
    ).toBe(before.details.title);
    await t.run(async ctx =>
      ctx.db.patch(s.attendee.membershipId, { role: 'ATTENDEE' })
    );
    await expect(
      s.attendeeAuth.mutation(api.events.mutations.saveSettings, {
        eventId: s.eventId,
        expectedRevision: before.revision,
        patch: { details: { title: 'Revoked' } },
      })
    ).rejects.toThrow();
  });
  it('allows Moderator content edits with unchanged visibility and denies actual visibility changes', async () => {
    const t = createTestInstance();
    const s = await TestScenarios.multiUser(t);
    await t.run(ctx =>
      ctx.db.patch(s.attendee.membershipId, { role: 'MODERATOR' })
    );
    const before = await s.attendeeAuth.query(api.events.queries.getSettings, {
      eventId: s.eventId,
    });
    const after = await s.attendeeAuth.mutation(
      api.events.mutations.saveSettings,
      {
        eventId: s.eventId,
        expectedRevision: before.revision,
        patch: {
          details: {
            title: 'Moderator title',
            visibility: before.details.visibility,
          },
        },
      }
    );
    expect(after.details.title).toBe('Moderator title');
    await expect(
      s.attendeeAuth.mutation(api.events.mutations.saveSettings, {
        eventId: s.eventId,
        expectedRevision: after.revision,
        patch: { details: { title: 'Rollback', visibility: 'PUBLIC' } },
      })
    ).rejects.toThrow('organizers');
    expect(
      (
        await s.attendeeAuth.query(api.events.queries.getSettings, {
          eventId: s.eventId,
        })
      ).details.title
    ).toBe('Moderator title');
  });
  it('can reschedule a legacy completed Event and share it in one transaction', async () => {
    const t = createTestInstance();
    const s = await TestScenarios.singleEvent(t);
    await t.run(ctx =>
      ctx.db.patch(s.eventId, {
        completedAt: Date.now() - 1000,
        chosenDateTime: Date.now() - 86400000,
      })
    );
    const before = await s.auth.query(api.events.queries.getSettings, {
      eventId: s.eventId,
    });
    const after = await s.auth.mutation(api.events.mutations.saveSettings, {
      eventId: s.eventId,
      expectedRevision: before.revision,
      patch: {
        date: {
          mode: 'SINGLE',
          start: Date.now() + 86400000,
          confirmedReset: true,
        },
        audiences: { friendsShared: true, groupIds: [] },
      },
    });
    expect(after.date.completedAt).toBeUndefined();
    expect(after.audiences.friendsShared).toBe(true);
  });
  it('retains old date IDs and votes when future options are added to an expired poll', async () => {
    const t = createTestInstance();
    const { auth, eventId, membershipId } = await TestScenarios.singleEvent(t);
    const old = await t.run(async ctx => {
      await ctx.db.patch(eventId, {
        chosenDateTime: undefined,
        chosenEndDateTime: undefined,
      });
      const id = await ctx.db.insert('potentialDateTimes', {
        eventId,
        dateTime: Date.now() - 86400000,
        updatedAt: Date.now(),
      });
      const vote = await ctx.db.insert('availabilities', {
        membershipId,
        potentialDateTimeId: id,
        status: 'NO',
        updatedAt: Date.now(),
      });
      return { id, vote };
    });
    const before = await auth.query(api.events.queries.getSettings, {
      eventId,
    });
    const after = await auth.mutation(api.events.mutations.saveSettings, {
      eventId,
      expectedRevision: before.revision,
      patch: {
        date: {
          mode: 'POLL',
          options: [...before.date.options, { start: Date.now() + 86400000 }],
        },
      },
    });
    expect(after.date.options.some(o => o.id === old.id)).toBe(true);
    expect(after.date.options).toHaveLength(2);
    expect(await t.run(ctx => ctx.db.get(old.vote))).toMatchObject({
      status: 'NO',
      potentialDateTimeId: old.id,
    });
  });
  it('requires separate confirmation before resetting persisted date votes', async () => {
    const t = createTestInstance();
    const { auth, eventId } = await TestScenarios.singleEvent(t);
    await t.run(async ctx => {
      await ctx.db.patch(eventId, {
        chosenDateTime: undefined,
        chosenEndDateTime: undefined,
      });
      await ctx.db.insert('potentialDateTimes', {
        eventId,
        dateTime: Date.now() + 86400000,
        updatedAt: Date.now(),
      });
    });
    const before = await auth.query(api.events.queries.getSettings, {
      eventId,
    });
    await expect(
      auth.mutation(api.events.mutations.saveSettings, {
        eventId,
        expectedRevision: before.revision,
        patch: { date: { mode: 'POLL', options: [] } },
      })
    ).rejects.toThrow('Confirm');
    expect(
      (await auth.query(api.events.queries.getSettings, { eventId })).revision
    ).toBe(before.revision);
  });
  it('requires separate confirmation before an add-on disable', async () => {
    const t = createTestInstance();
    const { auth, eventId } = await TestScenarios.singleEvent(t);
    let before = await auth.query(api.events.queries.getSettings, { eventId });
    await auth.mutation(api.events.mutations.saveSettings, {
      eventId,
      expectedRevision: before.revision,
      patch: {
        addons: [
          {
            addonType: 'reminders',
            enabled: true,
            config: { reminderOffset: '1_DAY' },
          },
        ],
      },
    });
    before = await auth.query(api.events.queries.getSettings, { eventId });
    await expect(
      auth.mutation(api.events.mutations.saveSettings, {
        eventId,
        expectedRevision: before.revision,
        patch: {
          addons: [
            {
              addonType: 'reminders',
              enabled: false,
              config: { reminderOffset: '1_DAY' },
            },
          ],
        },
      })
    ).rejects.toThrow('Confirm');
    expect(
      (await auth.query(api.events.queries.getSettings, { eventId })).addons[0]
        .enabled
    ).toBe(true);
  });
  it('preserves inaccessible Group grants without exposing IDs in the revision', async () => {
    const t = createTestInstance();
    const s = await TestScenarios.singleEvent(t);
    const hiddenOwner = await createAuthAccount(t, 'hidden-group-owner');
    const groupId = await hiddenOwner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Hidden community' }
    );
    const grantId = await t.run(ctx =>
      ctx.db.insert('groupEventAudiences', {
        groupId,
        eventId: s.eventId,
        createdAt: Date.now(),
        sharedById: hiddenOwner.personId,
      })
    );
    const before = await s.auth.query(api.events.queries.getSettings, {
      eventId: s.eventId,
    });
    expect(before.audiences.groups).toEqual([]);
    expect(before.revision).not.toContain(groupId);
    await s.auth.mutation(api.events.mutations.saveSettings, {
      eventId: s.eventId,
      expectedRevision: before.revision,
      patch: {
        details: { title: 'Retains hidden grants' },
        audiences: { friendsShared: false, groupIds: [] },
      },
    });
    expect(await t.run(ctx => ctx.db.get(grantId))).not.toBeNull();
  });
  it('keeps the legacy Friends admission default when unrelated settings change', async () => {
    const t = createTestInstance();
    const s = await TestScenarios.singleEvent(t);
    await t.run(ctx =>
      ctx.db.patch(s.eventId, {
        visibility: 'FRIENDS',
        admissionPolicy: undefined,
      })
    );
    const before = await s.auth.query(api.events.queries.getSettings, {
      eventId: s.eventId,
    });
    expect(before.admissionPolicy).toBe('DIRECT');
    await s.auth.mutation(api.events.mutations.saveSettings, {
      eventId: s.eventId,
      expectedRevision: before.revision,
      patch: { details: { title: 'Still direct' } },
    });
    expect(
      (
        await s.auth.query(api.events.queries.getSettings, {
          eventId: s.eventId,
        })
      ).admissionPolicy
    ).toBe('DIRECT');
  });
  it('disables Discord with Event authority and confirmation without fresh guild authorization', async () => {
    const t = createTestInstance();
    const s = await TestScenarios.singleEvent(t);
    await t.run(ctx =>
      ctx.db.insert('eventAddonConfigs', {
        eventId: s.eventId,
        addonType: 'discord',
        enabled: true,
        config: {
          guildId: '123456789012345678',
          guildName: 'Synthetic server',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    const before = await s.auth.query(api.events.queries.getSettings, {
      eventId: s.eventId,
    });
    const after = await s.auth.mutation(api.events.mutations.saveSettings, {
      eventId: s.eventId,
      expectedRevision: before.revision,
      patch: {
        addons: [
          { ...before.addons[0], enabled: false, confirmedDestructive: true },
        ],
      },
    });
    expect(after.addons[0].enabled).toBe(false);
  });
  it('preserves uneditable legacy add-ons in a full controlled config draft', async () => {
    const t = createTestInstance();
    const s = await TestScenarios.singleEvent(t);
    const legacy = await t.run(ctx =>
      ctx.db.insert('eventAddonConfigs', {
        eventId: s.eventId,
        addonType: 'retired-tool',
        enabled: false,
        config: { reminderOffset: '1_DAY' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    const before = await s.auth.query(api.events.queries.getSettings, {
      eventId: s.eventId,
    });
    const after = await s.auth.mutation(api.events.mutations.saveSettings, {
      eventId: s.eventId,
      expectedRevision: before.revision,
      patch: {
        addons: [
          ...before.addons,
          {
            addonType: 'reminders',
            enabled: true,
            config: { reminderOffset: '1_DAY' },
          },
        ],
      },
    });
    expect(after.addons).toHaveLength(2);
    expect(await t.run(ctx => ctx.db.get(legacy))).not.toBeNull();
  });
});
