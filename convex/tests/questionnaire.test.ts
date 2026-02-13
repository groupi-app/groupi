import { expect, test, describe } from 'vitest';
import {
  createTestInstance,
  createTestUser,
  createTestEventWithUser,
  createTestEventWithMultipleUsers,
} from './test_helpers';
import { api } from './_generated/api';

const VALID_CONFIG = {
  questions: [
    {
      id: 'q1',
      label: 'What is your dietary preference?',
      type: 'MULTIPLE_CHOICE',
      required: true,
      options: ['Vegetarian', 'Vegan', 'No restrictions'],
    },
    {
      id: 'q2',
      label: 'Any allergies?',
      type: 'SHORT_ANSWER',
      required: false,
    },
  ],
};

describe('Questionnaire Add-on', () => {
  describe('enableAddon', () => {
    test('should enable questionnaire with valid config', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const result = await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'questionnaire',
        config: VALID_CONFIG,
      });

      expect(result.success).toBe(true);

      const configs = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
      });

      const qConfig = configs.find(c => c.addonType === 'questionnaire');
      expect(qConfig).toBeTruthy();
      expect(qConfig!.enabled).toBe(true);
    });

    test('should reject config with no questions', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'questionnaire',
          config: { questions: [] },
        })
      ).rejects.toThrow('Invalid config');
    });

    test('should reject config with missing question fields', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'questionnaire',
          config: {
            questions: [
              { id: 'q1', label: '', type: 'SHORT_ANSWER', required: true },
            ],
          },
        })
      ).rejects.toThrow('Invalid config');
    });

    test('should reject config with invalid question type', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'questionnaire',
          config: {
            questions: [
              { id: 'q1', label: 'Test', type: 'INVALID_TYPE', required: true },
            ],
          },
        })
      ).rejects.toThrow('Invalid config');
    });

    test('should reject choice type without options', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'questionnaire',
          config: {
            questions: [
              {
                id: 'q1',
                label: 'Pick one',
                type: 'MULTIPLE_CHOICE',
                required: true,
              },
            ],
          },
        })
      ).rejects.toThrow('Invalid config');
    });
  });

  describe('submit and read responses', () => {
    test('should submit response via setAddonData', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithMultipleUsers(t);
      const organizerAuth = t.withIdentity({
        subject: setup.organizer.userId,
      });
      const attendeeAuth = t.withIdentity({ subject: setup.attendee.userId });

      // Enable questionnaire as organizer
      await organizerAuth.mutation(api.addons.mutations.enableAddon, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
        config: VALID_CONFIG,
      });

      // Submit response as attendee
      const result = await attendeeAuth.mutation(
        api.addons.mutations.setAddonData,
        {
          eventId: setup.eventId,
          addonType: 'questionnaire',
          key: `response:${setup.attendee.personId}`,
          data: { q1: 'Vegetarian', q2: 'Peanuts' },
        }
      );

      expect(result.created).toBe(true);

      // Read own response
      const myData = await attendeeAuth.query(
        api.addons.queries.getMyAddonData,
        {
          eventId: setup.eventId,
          addonType: 'questionnaire',
        }
      );

      expect(myData).toHaveLength(1);
      expect(myData[0].data).toEqual({ q1: 'Vegetarian', q2: 'Peanuts' });
    });

    test('should read all responses as any member', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithMultipleUsers(t);
      const organizerAuth = t.withIdentity({
        subject: setup.organizer.userId,
      });
      const attendeeAuth = t.withIdentity({ subject: setup.attendee.userId });

      // Enable questionnaire
      await organizerAuth.mutation(api.addons.mutations.enableAddon, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
        config: VALID_CONFIG,
      });

      // Submit responses from both users
      await organizerAuth.mutation(api.addons.mutations.setAddonData, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
        key: `response:${setup.organizer.personId}`,
        data: { q1: 'Vegan' },
      });
      await attendeeAuth.mutation(api.addons.mutations.setAddonData, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
        key: `response:${setup.attendee.personId}`,
        data: { q1: 'No restrictions' },
      });

      // Read all responses as organizer
      const allData = await organizerAuth.query(
        api.addons.queries.getAddonData,
        {
          eventId: setup.eventId,
          addonType: 'questionnaire',
        }
      );

      expect(allData).toHaveLength(2);
    });
  });

  describe('config update clears responses', () => {
    test('should clear all responses when config is updated', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithMultipleUsers(t);
      const organizerAuth = t.withIdentity({
        subject: setup.organizer.userId,
      });
      const attendeeAuth = t.withIdentity({ subject: setup.attendee.userId });

      // Enable questionnaire
      await organizerAuth.mutation(api.addons.mutations.enableAddon, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
        config: VALID_CONFIG,
      });

      // Submit a response
      await attendeeAuth.mutation(api.addons.mutations.setAddonData, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
        key: `response:${setup.attendee.personId}`,
        data: { q1: 'Vegetarian' },
      });

      // Verify response exists
      let data = await attendeeAuth.query(api.addons.queries.getAddonData, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
      });
      expect(data).toHaveLength(1);

      // Update config (changes questions)
      const newConfig = {
        questions: [
          {
            id: 'q3',
            label: 'New question',
            type: 'SHORT_ANSWER',
            required: true,
          },
        ],
      };
      await organizerAuth.mutation(api.addons.mutations.updateAddonConfig, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
        config: newConfig,
      });

      // Verify responses were cleared
      data = await attendeeAuth.query(api.addons.queries.getAddonData, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
      });
      expect(data).toHaveLength(0);

      // Verify notification was created for the attendee
      const { notifications } = await t.run(async ctx => {
        const notifications = await ctx.db.query('notifications').collect();
        return { notifications };
      });

      const resetNotifications = notifications.filter(
        n => n.type === 'ADDON_CONFIG_RESET'
      );
      expect(resetNotifications.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('disable addon clears data', () => {
    test('should clear all data when addon is disabled', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithMultipleUsers(t);
      const organizerAuth = t.withIdentity({
        subject: setup.organizer.userId,
      });
      const attendeeAuth = t.withIdentity({ subject: setup.attendee.userId });

      // Enable, submit, then disable
      await organizerAuth.mutation(api.addons.mutations.enableAddon, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
        config: VALID_CONFIG,
      });
      await attendeeAuth.mutation(api.addons.mutations.setAddonData, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
        key: `response:${setup.attendee.personId}`,
        data: { q1: 'Vegan' },
      });

      await organizerAuth.mutation(api.addons.mutations.disableAddon, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
      });

      // Verify data was cleared
      const data = await t.run(async ctx => {
        return await ctx.db
          .query('addonData')
          .withIndex('by_event_addon', q =>
            q.eq('eventId', setup.eventId).eq('addonType', 'questionnaire')
          )
          .collect();
      });
      expect(data).toHaveLength(0);
    });
  });

  describe('non-member access', () => {
    test('should prevent non-member from submitting', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const organizerAuth = t.withIdentity({ subject: userId });

      // Enable questionnaire
      await organizerAuth.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'questionnaire',
        config: VALID_CONFIG,
      });

      // Create outsider
      const { userId: outsiderUserId } = await createTestUser(t, {
        email: 'outsider@test.com',
        username: 'outsider',
      });
      const outsiderAuth = t.withIdentity({ subject: outsiderUserId });

      await expect(
        outsiderAuth.mutation(api.addons.mutations.setAddonData, {
          eventId,
          addonType: 'questionnaire',
          key: 'response:fake',
          data: { q1: 'hack' },
        })
      ).rejects.toThrow();
    });
  });

  describe('completion status', () => {
    test('should return correct completion status', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithMultipleUsers(t);
      const organizerAuth = t.withIdentity({
        subject: setup.organizer.userId,
      });
      const attendeeAuth = t.withIdentity({ subject: setup.attendee.userId });

      // Enable questionnaire
      await organizerAuth.mutation(api.addons.mutations.enableAddon, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
        config: VALID_CONFIG,
      });

      // Check status before submission
      let status = await attendeeAuth.query(
        api.addons.queries.getAddonCompletionStatus,
        { eventId: setup.eventId }
      );
      expect(status).not.toBeNull();
      expect(status!.isOrganizer).toBe(false);
      const qAddon = status!.addons.find(
        (a: { addonType: string }) => a.addonType === 'questionnaire'
      );
      expect(qAddon?.completed).toBe(false);

      // Submit response
      await attendeeAuth.mutation(api.addons.mutations.setAddonData, {
        eventId: setup.eventId,
        addonType: 'questionnaire',
        key: `response:${setup.attendee.personId}`,
        data: { q1: 'Vegan' },
      });

      // Check status after submission
      status = await attendeeAuth.query(
        api.addons.queries.getAddonCompletionStatus,
        { eventId: setup.eventId }
      );
      const qAddonAfter = status!.addons.find(
        (a: { addonType: string }) => a.addonType === 'questionnaire'
      );
      expect(qAddonAfter?.completed).toBe(true);
    });

    test('should mark organizer as organizer', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithMultipleUsers(t);
      const organizerAuth = t.withIdentity({
        subject: setup.organizer.userId,
      });

      const status = await organizerAuth.query(
        api.addons.queries.getAddonCompletionStatus,
        { eventId: setup.eventId }
      );

      expect(status).not.toBeNull();
      expect(status!.isOrganizer).toBe(true);
    });
  });

  describe('all question types in config', () => {
    test('should accept all valid question types', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const allTypesConfig = {
        questions: [
          { id: 'q1', label: 'Short', type: 'SHORT_ANSWER', required: true },
          { id: 'q2', label: 'Long', type: 'LONG_ANSWER', required: false },
          {
            id: 'q3',
            label: 'MC',
            type: 'MULTIPLE_CHOICE',
            required: true,
            options: ['A', 'B'],
          },
          {
            id: 'q4',
            label: 'Check',
            type: 'CHECKBOXES',
            required: false,
            options: ['X', 'Y'],
          },
          { id: 'q5', label: 'Num', type: 'NUMBER', required: false },
          {
            id: 'q6',
            label: 'Drop',
            type: 'DROPDOWN',
            required: true,
            options: ['One', 'Two'],
          },
          { id: 'q7', label: 'YN', type: 'YES_NO', required: true },
        ],
      };

      const result = await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'questionnaire',
        config: allTypesConfig,
      });

      expect(result.success).toBe(true);
    });
  });
});
