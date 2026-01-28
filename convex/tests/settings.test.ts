import { expect, test, describe } from 'vitest';
import { api } from './_generated/api';
import {
  createTestInstance,
  TestScenarios,
  createTestUser,
  createAuthenticatedUser,
} from './test_helpers';

/**
 * Settings Domain Tests
 *
 * NOTE: The getNotificationSettings query uses authComponent.getAuthUser()
 * which requires the Better Auth component to be registered. In the test
 * environment, we skip tests that directly query getNotificationSettings
 * and focus on testing the mutation behavior.
 */

describe('Settings Domain', () => {
  describe('saveNotificationSettings', () => {
    test('should create personSettings if not exists', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      await auth.mutation(api.settings.mutations.saveNotificationSettings, {
        notificationMethods: [
          {
            type: 'EMAIL',
            enabled: true,
            value: 'test@example.com',
            notifications: [
              { notificationType: 'NEW_POST', enabled: true },
              { notificationType: 'NEW_REPLY', enabled: true },
            ],
          },
        ],
      });

      // Verify personSettings was created
      const { settings } = await t.run(async ctx => {
        const allSettings = await ctx.db.query('personSettings').collect();
        const settings = allSettings.find(s => s.personId === personId);
        return { settings };
      });

      expect(settings).toBeTruthy();
    });

    test('should create notification methods', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      const result = await auth.mutation(
        api.settings.mutations.saveNotificationSettings,
        {
          notificationMethods: [
            {
              type: 'EMAIL',
              enabled: true,
              value: 'email@example.com',
              name: 'Work Email',
              notifications: [{ notificationType: 'NEW_POST', enabled: true }],
            },
            {
              type: 'WEBHOOK',
              enabled: true,
              value: 'https://webhook.example.com',
              webhookFormat: 'SLACK',
              notifications: [{ notificationType: 'NEW_POST', enabled: true }],
            },
          ],
        }
      );

      expect(result.success).toBe(true);

      // Verify methods created in database
      const { methods } = await t.run(async ctx => {
        const allSettings = await ctx.db.query('personSettings').collect();
        const settings = allSettings.find(s => s.personId === personId);
        if (!settings) return { methods: [] };

        const methods = await ctx.db.query('notificationMethods').collect();
        return { methods: methods.filter(m => m.settingsId === settings._id) };
      });

      expect(methods).toHaveLength(2);
    });

    test('should update existing notification methods', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Create initial method
      await auth.mutation(api.settings.mutations.saveNotificationSettings, {
        notificationMethods: [
          {
            type: 'EMAIL',
            enabled: true,
            value: 'old@example.com',
            notifications: [],
          },
        ],
      });

      // Get the method ID from database
      const { methodId } = await t.run(async ctx => {
        const allSettings = await ctx.db.query('personSettings').collect();
        const settings = allSettings.find(s => s.personId === personId);
        if (!settings) return { methodId: null };

        const methods = await ctx.db.query('notificationMethods').collect();
        const method = methods.find(m => m.settingsId === settings._id);
        return { methodId: method?._id };
      });

      expect(methodId).toBeTruthy();

      // Update the method
      await auth.mutation(api.settings.mutations.saveNotificationSettings, {
        notificationMethods: [
          {
            id: methodId!,
            type: 'EMAIL',
            enabled: false,
            value: 'new@example.com',
            notifications: [{ notificationType: 'NEW_POST', enabled: true }],
          },
        ],
      });

      // Verify update
      const { updatedMethod } = await t.run(async ctx => {
        const method = await ctx.db.get(methodId!);
        return { updatedMethod: method };
      });

      expect(updatedMethod).toBeTruthy();
      expect(updatedMethod!.value).toBe('new@example.com');
      expect(updatedMethod!.enabled).toBe(false);
    });

    test('should delete methods not in the list', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Create two methods
      await auth.mutation(api.settings.mutations.saveNotificationSettings, {
        notificationMethods: [
          {
            type: 'EMAIL',
            enabled: true,
            value: 'email1@example.com',
            notifications: [],
          },
          {
            type: 'EMAIL',
            enabled: true,
            value: 'email2@example.com',
            notifications: [],
          },
        ],
      });

      // Get all method IDs
      const { methods } = await t.run(async ctx => {
        const allSettings = await ctx.db.query('personSettings').collect();
        const settings = allSettings.find(s => s.personId === personId);
        if (!settings) return { methods: [] };

        const allMethods = await ctx.db.query('notificationMethods').collect();
        return {
          methods: allMethods.filter(m => m.settingsId === settings._id),
        };
      });

      expect(methods).toHaveLength(2);
      const firstMethodId = methods[0]._id;

      // Save with only one method (should delete the other)
      await auth.mutation(api.settings.mutations.saveNotificationSettings, {
        notificationMethods: [
          {
            id: firstMethodId,
            type: 'EMAIL',
            enabled: true,
            value: 'email1@example.com',
            notifications: [],
          },
        ],
      });

      // Verify only one method remains
      const { remainingMethods } = await t.run(async ctx => {
        const allSettings = await ctx.db.query('personSettings').collect();
        const settings = allSettings.find(s => s.personId === personId);
        if (!settings) return { remainingMethods: [] };

        const allMethods = await ctx.db.query('notificationMethods').collect();
        return {
          remainingMethods: allMethods.filter(
            m => m.settingsId === settings._id
          ),
        };
      });

      expect(remainingMethods).toHaveLength(1);
    });

    test('should handle webhook headers correctly', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      const webhookHeaders = JSON.stringify({
        Authorization: 'Bearer token123',
        'Content-Type': 'application/json',
      });

      await auth.mutation(api.settings.mutations.saveNotificationSettings, {
        notificationMethods: [
          {
            type: 'WEBHOOK',
            enabled: true,
            value: 'https://webhook.example.com',
            webhookFormat: 'GENERIC',
            webhookHeaders,
            notifications: [],
          },
        ],
      });

      const { method } = await t.run(async ctx => {
        const allSettings = await ctx.db.query('personSettings').collect();
        const settings = allSettings.find(s => s.personId === personId);
        if (!settings) return { method: null };

        const methods = await ctx.db.query('notificationMethods').collect();
        return { method: methods.find(m => m.settingsId === settings._id) };
      });

      expect(method).toBeTruthy();
      expect(method!.webhookHeaders).toBeTruthy();
    });
  });

  describe('deleteNotificationMethod', () => {
    test('should delete method and associated settings', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Create method with notification settings
      await auth.mutation(api.settings.mutations.saveNotificationSettings, {
        notificationMethods: [
          {
            type: 'EMAIL',
            enabled: true,
            value: 'test@example.com',
            notifications: [
              { notificationType: 'NEW_POST', enabled: true },
              { notificationType: 'NEW_REPLY', enabled: true },
            ],
          },
        ],
      });

      // Get the method ID
      const { methodId } = await t.run(async ctx => {
        const allSettings = await ctx.db.query('personSettings').collect();
        const settings = allSettings.find(s => s.personId === personId);
        if (!settings) return { methodId: null };

        const methods = await ctx.db.query('notificationMethods').collect();
        const method = methods.find(m => m.settingsId === settings._id);
        return { methodId: method?._id };
      });

      expect(methodId).toBeTruthy();

      // Delete the method
      const result = await auth.mutation(
        api.settings.mutations.deleteNotificationMethod,
        { methodId: methodId! }
      );

      expect(result.success).toBe(true);

      // Verify method is deleted
      const { deletedMethod, remainingSettings } = await t.run(async ctx => {
        const deletedMethod = await ctx.db.get(methodId!);
        const allNotifSettings = await ctx.db
          .query('notificationSettings')
          .collect();
        const remainingSettings = allNotifSettings.filter(
          s => s.methodId === methodId
        );
        return { deletedMethod, remainingSettings };
      });

      expect(deletedMethod).toBeNull();
      expect(remainingSettings).toHaveLength(0);
    });

    test('should require ownership of the method', async () => {
      const t = createTestInstance();
      const { personId: user1PersonId, auth: user1Auth } =
        await TestScenarios.simpleUser(t);
      const { userId: user2Id } = await createTestUser(t, {
        email: 'user2@example.com',
      });
      const user2Auth = createAuthenticatedUser(t, user2Id);

      // User1 creates a method
      await user1Auth.mutation(
        api.settings.mutations.saveNotificationSettings,
        {
          notificationMethods: [
            {
              type: 'EMAIL',
              enabled: true,
              value: 'user1@example.com',
              notifications: [],
            },
          ],
        }
      );

      const { methodId } = await t.run(async ctx => {
        const allSettings = await ctx.db.query('personSettings').collect();
        const settings = allSettings.find(s => s.personId === user1PersonId);
        if (!settings) return { methodId: null };

        const methods = await ctx.db.query('notificationMethods').collect();
        const method = methods.find(m => m.settingsId === settings._id);
        return { methodId: method?._id };
      });

      expect(methodId).toBeTruthy();

      // User2 tries to delete User1's method
      await expect(
        user2Auth.mutation(api.settings.mutations.deleteNotificationMethod, {
          methodId: methodId!,
        })
      ).rejects.toThrow('Not authorized to delete this notification method');
    });
  });
});
