import { expect, test, describe } from 'vitest';
import {
  createTestInstance,
  createTestUser,
  createTestEventWithUser,
  createTestEventWithMultipleUsers,
} from './test_helpers';
import { api } from './_generated/api';

describe('Add-on Framework', () => {
  describe('enableAddon', () => {
    test('should enable a reminder add-on for an event', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const result = await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'reminders',
        config: { reminderOffset: '1_DAY' },
      });

      expect(result.success).toBe(true);

      // Verify the config was created
      const configs = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
      });

      expect(configs).toHaveLength(1);
      expect(configs[0].addonType).toBe('reminders');
      expect(configs[0].enabled).toBe(true);
      expect(configs[0].config).toEqual({ reminderOffset: '1_DAY' });
    });

    test('should reject unknown add-on types', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'nonexistent',
          config: {},
        })
      ).rejects.toThrow('Unknown add-on type');
    });

    test('should reject invalid config', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'reminders',
          config: { reminderOffset: 'INVALID' },
        })
      ).rejects.toThrow('Invalid config');
    });

    test('should require MODERATOR+ role', async () => {
      const t = createTestInstance();
      const { eventId } = await createTestEventWithUser(t);

      // Create a second user as ATTENDEE
      const { userId: attendeeUserId } = await createTestUser(t, {
        email: 'attendee@example.com',
        username: 'attendee',
        name: 'Attendee',
      });

      // Add as attendee
      await t.run(async ctx => {
        const person = await ctx.db
          .query('persons')
          .withIndex('by_user_id', q => q.eq('userId', attendeeUserId))
          .first();
        if (person) {
          await ctx.db.insert('memberships', {
            personId: person._id,
            eventId,
            role: 'ATTENDEE',
            rsvpStatus: 'YES',
          });
        }
      });

      const asAttendee = t.withIdentity({ subject: attendeeUserId });

      await expect(
        asAttendee.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'reminders',
          config: { reminderOffset: '1_DAY' },
        })
      ).rejects.toThrow();
    });
  });

  describe('disableAddon', () => {
    test('should disable an enabled add-on', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      // Enable first
      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'reminders',
        config: { reminderOffset: '1_DAY' },
      });

      // Disable
      const result = await asUser.mutation(api.addons.mutations.disableAddon, {
        eventId,
        addonType: 'reminders',
      });

      expect(result.success).toBe(true);

      // Verify it's disabled
      const configs = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event_addon', q =>
            q.eq('eventId', eventId).eq('addonType', 'reminders')
          )
          .first();
      });

      expect(configs?.enabled).toBe(false);
    });

    test('should be a no-op when addon is not enabled', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const result = await asUser.mutation(api.addons.mutations.disableAddon, {
        eventId,
        addonType: 'reminders',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('updateAddonConfig', () => {
    test('should update config for an enabled add-on', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      // Enable first
      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'reminders',
        config: { reminderOffset: '1_DAY' },
      });

      // Update config
      const result = await asUser.mutation(
        api.addons.mutations.updateAddonConfig,
        {
          eventId,
          addonType: 'reminders',
          config: { reminderOffset: '2_HOURS' },
        }
      );

      expect(result.success).toBe(true);

      // Verify updated
      const config = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event_addon', q =>
            q.eq('eventId', eventId).eq('addonType', 'reminders')
          )
          .first();
      });

      expect(config?.config).toEqual({ reminderOffset: '2_HOURS' });
    });

    test('should fail when addon is not enabled', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.updateAddonConfig, {
          eventId,
          addonType: 'reminders',
          config: { reminderOffset: '1_DAY' },
        })
      ).rejects.toThrow('not enabled');
    });
  });

  describe('replaceBuiltInAddonConfigs', () => {
    test('should apply the complete desired built-in set in one mutation', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'bring-list',
        config: {
          items: [{ id: 'ice', name: 'Ice', quantity: 2 }],
        },
      });

      const result = await asUser.mutation(
        api.addons.mutations.replaceBuiltInAddonConfigs,
        {
          eventId,
          addons: [
            {
              addonType: 'questionnaire',
              config: {
                questions: [
                  {
                    id: 'meal',
                    label: 'Meal preference',
                    type: 'SHORT_ANSWER',
                    required: false,
                  },
                ],
              },
            },
          ],
        }
      );

      expect(result).toEqual({
        enabled: 1,
        updated: 0,
        disabled: 1,
        unchanged: 0,
      });

      const configs = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
      });
      const enabledTypes = configs
        .filter(config => config.enabled)
        .map(config => config.addonType);

      expect(enabledTypes).toEqual(['questionnaire']);
    });

    test('should preserve responses when config is semantically unchanged', async () => {
      const t = createTestInstance();
      const { userId, personId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });
      const originalConfig = {
        questions: [
          {
            id: 'meal',
            label: 'Meal preference',
            type: 'MULTIPLE_CHOICE',
            required: true,
            options: ['Vegetarian', 'Anything'],
          },
        ],
      };

      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'questionnaire',
        config: originalConfig,
      });
      await asUser.mutation(api.addons.mutations.setAddonData, {
        eventId,
        addonType: 'questionnaire',
        key: `response:${personId}`,
        data: { meal: 'Vegetarian' },
      });

      const before = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event_addon', q =>
            q.eq('eventId', eventId).eq('addonType', 'questionnaire')
          )
          .first();
      });

      const result = await asUser.mutation(
        api.addons.mutations.replaceBuiltInAddonConfigs,
        {
          eventId,
          addons: [
            {
              addonType: 'questionnaire',
              config: {
                questions: [
                  {
                    options: ['Vegetarian', 'Anything'],
                    required: true,
                    type: 'MULTIPLE_CHOICE',
                    label: 'Meal preference',
                    id: 'meal',
                  },
                ],
              },
            },
          ],
        }
      );

      expect(result.unchanged).toBe(1);

      const after = await t.run(async ctx => {
        const config = await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event_addon', q =>
            q.eq('eventId', eventId).eq('addonType', 'questionnaire')
          )
          .first();
        const responses = await ctx.db
          .query('addonData')
          .withIndex('by_event_addon', q =>
            q.eq('eventId', eventId).eq('addonType', 'questionnaire')
          )
          .collect();
        return { config, responses };
      });

      expect(after.config?.updatedAt).toBe(before?.updatedAt);
      expect(after.responses).toHaveLength(1);
      expect(after.responses[0].data).toEqual({ meal: 'Vegetarian' });
    });

    test('should validate the full request before applying any changes', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'questionnaire',
        config: {
          questions: [
            {
              id: 'meal',
              label: 'Meal preference',
              type: 'SHORT_ANSWER',
              required: false,
            },
          ],
        },
      });

      await expect(
        asUser.mutation(api.addons.mutations.replaceBuiltInAddonConfigs, {
          eventId,
          addons: [
            {
              addonType: 'questionnaire',
              config: {
                questions: [
                  {
                    id: 'meal',
                    label: 'Updated meal preference',
                    type: 'SHORT_ANSWER',
                    required: false,
                  },
                ],
              },
            },
            {
              addonType: 'bring-list',
              config: { items: [] },
            },
          ],
        })
      ).rejects.toThrow('Invalid config for add-on: bring-list');

      const questionnaire = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event_addon', q =>
            q.eq('eventId', eventId).eq('addonType', 'questionnaire')
          )
          .first();
      });

      expect(questionnaire?.config).toEqual({
        questions: [
          {
            id: 'meal',
            label: 'Meal preference',
            type: 'SHORT_ANSWER',
            required: false,
          },
        ],
      });
    });

    test('should require MODERATOR+ role', async () => {
      const t = createTestInstance();
      const { attendee, eventId } = await createTestEventWithMultipleUsers(t);
      const asAttendee = t.withIdentity({ subject: attendee.userId });

      await expect(
        asAttendee.mutation(api.addons.mutations.replaceBuiltInAddonConfigs, {
          eventId,
          addons: [],
        })
      ).rejects.toThrow('MODERATOR role required');
    });
  });

  describe('toggleAddonOptOut', () => {
    test('should opt out and back in', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      // Opt out
      const optOutResult = await asUser.mutation(
        api.addons.mutations.toggleAddonOptOut,
        {
          eventId,
          addonType: 'reminders',
        }
      );

      expect(optOutResult.isOptedOut).toBe(true);

      // Verify in database
      const optOuts = await t.run(async ctx => {
        return await ctx.db
          .query('addonOptOuts')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
      });
      expect(optOuts).toHaveLength(1);
      expect(optOuts[0].addonType).toBe('reminders');

      // Opt back in
      const optInResult = await asUser.mutation(
        api.addons.mutations.toggleAddonOptOut,
        {
          eventId,
          addonType: 'reminders',
        }
      );

      expect(optInResult.isOptedOut).toBe(false);

      // Verify deleted
      const afterOptIn = await t.run(async ctx => {
        return await ctx.db
          .query('addonOptOuts')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
      });
      expect(afterOptIn).toHaveLength(0);
    });

    test('should require event membership', async () => {
      const t = createTestInstance();
      const { eventId } = await createTestEventWithUser(t);

      // Create a second user who is NOT a member
      const { userId: outsiderUserId } = await createTestUser(t, {
        email: 'outsider@example.com',
        username: 'outsider',
        name: 'Outsider',
      });

      const asOutsider = t.withIdentity({ subject: outsiderUserId });

      await expect(
        asOutsider.mutation(api.addons.mutations.toggleAddonOptOut, {
          eventId,
          addonType: 'reminders',
        })
      ).rejects.toThrow('not a member');
    });
  });

  describe('createEvent with addons', () => {
    test('should create addon configs when addons arg is provided', async () => {
      const t = createTestInstance();
      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });

      const result = await asUser.mutation(api.events.mutations.createEvent, {
        title: 'Event With Addons',
        chosenDateTime: new Date(Date.now() + 7 * 86400000).toISOString(),
        addons: [
          { addonType: 'reminders', config: { reminderOffset: '1_DAY' } },
        ],
      });

      expect(result.eventId).toBeDefined();

      // Verify addon config was created
      const configs = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event', q => q.eq('eventId', result.eventId))
          .collect();
      });

      expect(configs).toHaveLength(1);
      expect(configs[0].addonType).toBe('reminders');
      expect(configs[0].enabled).toBe(true);
    });

    test('should skip invalid addon configs silently', async () => {
      const t = createTestInstance();
      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });

      const result = await asUser.mutation(api.events.mutations.createEvent, {
        title: 'Event With Bad Addon',
        chosenDateTime: new Date(Date.now() + 7 * 86400000).toISOString(),
        addons: [
          {
            addonType: 'reminders',
            config: { reminderOffset: 'INVALID_VALUE' },
          },
        ],
      });

      expect(result.eventId).toBeDefined();

      // Invalid config should have been skipped
      const configs = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event', q => q.eq('eventId', result.eventId))
          .collect();
      });

      expect(configs).toHaveLength(0);
    });
  });

  describe('deleteEvent with addons', () => {
    test('should clean up addon configs and opt-outs on event delete', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      // Enable addon
      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'reminders',
        config: { reminderOffset: '1_DAY' },
      });

      // Create opt-out
      await asUser.mutation(api.addons.mutations.toggleAddonOptOut, {
        eventId,
        addonType: 'reminders',
      });

      // Delete event
      await asUser.mutation(api.events.mutations.deleteEvent, { eventId });

      // Verify addon configs are cleaned up
      const configs = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
      });
      expect(configs).toHaveLength(0);

      // Verify opt-outs are cleaned up
      const optOuts = await t.run(async ctx => {
        return await ctx.db
          .query('addonOptOuts')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
      });
      expect(optOuts).toHaveLength(0);
    });
  });

  describe('queries', () => {
    test('getEventAddons returns all addon configs for an event', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      // Enable addon
      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'reminders',
        config: { reminderOffset: '1_DAY' },
      });

      const result = await asUser.query(api.addons.queries.getEventAddons, {
        eventId,
      });

      expect(result).toHaveLength(1);
      expect(result[0].addonType).toBe('reminders');
      expect(result[0].enabled).toBe(true);
    });

    test('isAddonOptedOut returns correct status', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      // Initially not opted out
      const before = await asUser.query(api.addons.queries.isAddonOptedOut, {
        eventId,
        addonType: 'reminders',
      });
      expect(before.isOptedOut).toBe(false);

      // Opt out
      await asUser.mutation(api.addons.mutations.toggleAddonOptOut, {
        eventId,
        addonType: 'reminders',
      });

      // Now opted out
      const after = await asUser.query(api.addons.queries.isAddonOptedOut, {
        eventId,
        addonType: 'reminders',
      });
      expect(after.isOptedOut).toBe(true);
    });
  });
});
