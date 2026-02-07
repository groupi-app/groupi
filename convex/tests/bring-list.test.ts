import { expect, test, describe } from 'vitest';
import {
  createTestInstance,
  createTestUser,
  createTestEventWithUser,
  createTestEventWithMultipleUsers,
} from './test_helpers';
import { api } from './_generated/api';

const VALID_CONFIG = {
  items: [
    { id: 'item1', name: 'Chips', quantity: 2 },
    { id: 'item2', name: 'Drinks', quantity: 3 },
    { id: 'item3', name: 'Napkins', quantity: 1 },
  ],
};

describe('Bring List Add-on', () => {
  describe('enableAddon', () => {
    test('should enable bring list with valid config', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const result = await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'bring-list',
        config: VALID_CONFIG,
      });

      expect(result.success).toBe(true);

      const configs = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
      });

      const blConfig = configs.find(c => c.addonType === 'bring-list');
      expect(blConfig).toBeTruthy();
      expect(blConfig!.enabled).toBe(true);
    });

    test('should reject config with empty items', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'bring-list',
          config: { items: [] },
        })
      ).rejects.toThrow('Invalid config');
    });

    test('should reject config with missing item name', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'bring-list',
          config: {
            items: [{ id: 'item1', name: '', quantity: 1 }],
          },
        })
      ).rejects.toThrow('Invalid config');
    });

    test('should reject config with quantity less than 1', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'bring-list',
          config: {
            items: [{ id: 'item1', name: 'Chips', quantity: 0 }],
          },
        })
      ).rejects.toThrow('Invalid config');
    });

    test('should reject config with missing id', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'bring-list',
          config: {
            items: [{ name: 'Chips', quantity: 1 }],
          },
        })
      ).rejects.toThrow('Invalid config');
    });

    test('should reject non-object config', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'bring-list',
          config: 'not an object',
        })
      ).rejects.toThrow('Invalid config');
    });
  });

  describe('claiming items', () => {
    test('should allow attendee to claim items', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithMultipleUsers(t);
      const organizerAuth = t.withIdentity({
        subject: setup.organizer.userId,
      });
      const attendeeAuth = t.withIdentity({ subject: setup.attendee.userId });

      // Enable bring list
      await organizerAuth.mutation(api.addons.mutations.enableAddon, {
        eventId: setup.eventId,
        addonType: 'bring-list',
        config: VALID_CONFIG,
      });

      // Attendee claims items
      const result = await attendeeAuth.mutation(
        api.addons.mutations.setAddonData,
        {
          eventId: setup.eventId,
          addonType: 'bring-list',
          key: `claims:${setup.attendee.personId}`,
          data: { item1: 1, item2: 2 },
        }
      );

      expect(result.created).toBe(true);

      // Read all data
      const allData = await attendeeAuth.query(
        api.addons.queries.getAddonData,
        {
          eventId: setup.eventId,
          addonType: 'bring-list',
        }
      );

      expect(allData).toHaveLength(1);
      expect(allData[0].data).toEqual({ item1: 1, item2: 2 });
    });

    test('should allow multiple users to claim same item', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithMultipleUsers(t);
      const organizerAuth = t.withIdentity({
        subject: setup.organizer.userId,
      });
      const attendeeAuth = t.withIdentity({ subject: setup.attendee.userId });

      // Enable bring list
      await organizerAuth.mutation(api.addons.mutations.enableAddon, {
        eventId: setup.eventId,
        addonType: 'bring-list',
        config: VALID_CONFIG,
      });

      // Both users claim item2 (quantity: 3)
      await organizerAuth.mutation(api.addons.mutations.setAddonData, {
        eventId: setup.eventId,
        addonType: 'bring-list',
        key: `claims:${setup.organizer.personId}`,
        data: { item2: 1 },
      });
      await attendeeAuth.mutation(api.addons.mutations.setAddonData, {
        eventId: setup.eventId,
        addonType: 'bring-list',
        key: `claims:${setup.attendee.personId}`,
        data: { item2: 2 },
      });

      // Read all data
      const allData = await organizerAuth.query(
        api.addons.queries.getAddonData,
        {
          eventId: setup.eventId,
          addonType: 'bring-list',
        }
      );

      expect(allData).toHaveLength(2);
    });

    test('should allow attendee to update their claims', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithMultipleUsers(t);
      const organizerAuth = t.withIdentity({
        subject: setup.organizer.userId,
      });
      const attendeeAuth = t.withIdentity({ subject: setup.attendee.userId });

      // Enable bring list
      await organizerAuth.mutation(api.addons.mutations.enableAddon, {
        eventId: setup.eventId,
        addonType: 'bring-list',
        config: VALID_CONFIG,
      });

      // Initial claim
      await attendeeAuth.mutation(api.addons.mutations.setAddonData, {
        eventId: setup.eventId,
        addonType: 'bring-list',
        key: `claims:${setup.attendee.personId}`,
        data: { item1: 1 },
      });

      // Update claim
      const updateResult = await attendeeAuth.mutation(
        api.addons.mutations.setAddonData,
        {
          eventId: setup.eventId,
          addonType: 'bring-list',
          key: `claims:${setup.attendee.personId}`,
          data: { item1: 2, item3: 1 },
        }
      );

      expect(updateResult.created).toBe(false);

      // Verify updated data
      const allData = await attendeeAuth.query(
        api.addons.queries.getAddonData,
        {
          eventId: setup.eventId,
          addonType: 'bring-list',
        }
      );

      expect(allData).toHaveLength(1);
      expect(allData[0].data).toEqual({ item1: 2, item3: 1 });
    });
  });

  describe('config update clears claims', () => {
    test('should clear all claims when config is updated', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithMultipleUsers(t);
      const organizerAuth = t.withIdentity({
        subject: setup.organizer.userId,
      });
      const attendeeAuth = t.withIdentity({ subject: setup.attendee.userId });

      // Enable bring list
      await organizerAuth.mutation(api.addons.mutations.enableAddon, {
        eventId: setup.eventId,
        addonType: 'bring-list',
        config: VALID_CONFIG,
      });

      // Attendee claims an item
      await attendeeAuth.mutation(api.addons.mutations.setAddonData, {
        eventId: setup.eventId,
        addonType: 'bring-list',
        key: `claims:${setup.attendee.personId}`,
        data: { item1: 1 },
      });

      // Verify claim exists
      let data = await attendeeAuth.query(api.addons.queries.getAddonData, {
        eventId: setup.eventId,
        addonType: 'bring-list',
      });
      expect(data).toHaveLength(1);

      // Update config
      const newConfig = {
        items: [{ id: 'item4', name: 'New Item', quantity: 5 }],
      };
      await organizerAuth.mutation(api.addons.mutations.updateAddonConfig, {
        eventId: setup.eventId,
        addonType: 'bring-list',
        config: newConfig,
      });

      // Verify claims were cleared
      data = await attendeeAuth.query(api.addons.queries.getAddonData, {
        eventId: setup.eventId,
        addonType: 'bring-list',
      });
      expect(data).toHaveLength(0);

      // Verify notification was created
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

      // Enable, claim, then disable
      await organizerAuth.mutation(api.addons.mutations.enableAddon, {
        eventId: setup.eventId,
        addonType: 'bring-list',
        config: VALID_CONFIG,
      });
      await attendeeAuth.mutation(api.addons.mutations.setAddonData, {
        eventId: setup.eventId,
        addonType: 'bring-list',
        key: `claims:${setup.attendee.personId}`,
        data: { item1: 1, item2: 2 },
      });

      await organizerAuth.mutation(api.addons.mutations.disableAddon, {
        eventId: setup.eventId,
        addonType: 'bring-list',
      });

      // Verify data was cleared
      const data = await t.run(async ctx => {
        return await ctx.db
          .query('addonData')
          .withIndex('by_event_addon', q =>
            q.eq('eventId', setup.eventId).eq('addonType', 'bring-list')
          )
          .collect();
      });
      expect(data).toHaveLength(0);
    });
  });

  describe('non-member access', () => {
    test('should prevent non-member from claiming', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const organizerAuth = t.withIdentity({ subject: userId });

      // Enable bring list
      await organizerAuth.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'bring-list',
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
          addonType: 'bring-list',
          key: 'claims:fake',
          data: { item1: 1 },
        })
      ).rejects.toThrow();
    });
  });
});
