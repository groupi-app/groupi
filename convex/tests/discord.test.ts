import { expect, test, describe } from 'vitest';
import {
  createTestInstance,
  createTestEventWithUser,
  createTestUser,
} from './test_helpers';
import { api } from './_generated/api';
import type { Id } from '../_generated/dataModel';

const VALID_CONFIG = {
  guildId: '123456789',
  guildName: 'Test Server',
};

async function authorizeGuild(
  t: ReturnType<typeof createTestInstance>,
  personId: Id<'persons'>,
  config: { guildId: string; guildName: string },
  options: { botInstalled?: boolean; authorizedAt?: number } = {}
) {
  await t.run(async ctx => {
    await ctx.db.insert('discordGuildAuthorizations', {
      personId,
      guildId: config.guildId,
      guildName: config.guildName,
      botInstalled: options.botInstalled ?? true,
      authorizedAt: options.authorizedAt ?? Date.now(),
    });
  });
}

describe('Discord Add-on', () => {
  describe('config validation', () => {
    test('should enable discord with valid config', async () => {
      const t = createTestInstance();
      const { userId, personId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });
      await authorizeGuild(t, personId, VALID_CONFIG);

      const result = await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'discord',
        config: VALID_CONFIG,
      });

      expect(result.success).toBe(true);

      const configs = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
      });

      const discordConfig = configs.find(c => c.addonType === 'discord');
      expect(discordConfig).toBeTruthy();
      expect(discordConfig!.enabled).toBe(true);
      expect(discordConfig!.config).toEqual(VALID_CONFIG);
    });

    test('should reject config with missing guildId', async () => {
      const t = createTestInstance();
      const { userId, personId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });
      await authorizeGuild(t, personId, VALID_CONFIG);

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'discord',
          config: { guildName: 'Test' },
        })
      ).rejects.toThrow('Invalid config');
    });

    test('should reject config with empty guildId', async () => {
      const t = createTestInstance();
      const { userId, personId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });
      await authorizeGuild(t, personId, VALID_CONFIG);

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'discord',
          config: { guildId: '', guildName: 'Test' },
        })
      ).rejects.toThrow('Invalid config');
    });

    test('should reject config with missing guildName', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'discord',
          config: { guildId: '123456789' },
        })
      ).rejects.toThrow('Invalid config');
    });

    test('should reject config with empty guildName', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'discord',
          config: { guildId: '123456789', guildName: '' },
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
          addonType: 'discord',
          config: 'not an object',
        })
      ).rejects.toThrow('Invalid config');
    });

    test('should reject null config', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'discord',
          config: null,
        })
      ).rejects.toThrow('Invalid config');
    });
  });

  describe('enable/disable lifecycle', () => {
    test('should disable addon and mark config as disabled', async () => {
      const t = createTestInstance();
      const { userId, personId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });
      await authorizeGuild(t, personId, VALID_CONFIG);

      // Enable
      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'discord',
        config: VALID_CONFIG,
      });

      // Disable
      await asUser.mutation(api.addons.mutations.disableAddon, {
        eventId,
        addonType: 'discord',
      });

      const configs = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
      });

      const discordConfig = configs.find(c => c.addonType === 'discord');
      expect(discordConfig).toBeTruthy();
      expect(discordConfig!.enabled).toBe(false);
    });

    test('should re-enable a previously disabled addon', async () => {
      const t = createTestInstance();
      const { userId, personId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });
      await authorizeGuild(t, personId, VALID_CONFIG);

      // Enable, disable, re-enable
      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'discord',
        config: VALID_CONFIG,
      });

      await asUser.mutation(api.addons.mutations.disableAddon, {
        eventId,
        addonType: 'discord',
      });

      const newConfig = { guildId: '987654321', guildName: 'New Server' };
      await authorizeGuild(t, personId, newConfig);
      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'discord',
        config: newConfig,
      });

      const configs = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
      });

      const discordConfig = configs.find(c => c.addonType === 'discord');
      expect(discordConfig!.enabled).toBe(true);
      expect(discordConfig!.config).toEqual(newConfig);
    });
  });

  describe('config update', () => {
    test('should update config for enabled addon', async () => {
      const t = createTestInstance();
      const { userId, personId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });
      await authorizeGuild(t, personId, VALID_CONFIG);

      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'discord',
        config: VALID_CONFIG,
      });

      const newConfig = { guildId: '111222333', guildName: 'Updated Server' };
      await authorizeGuild(t, personId, newConfig);
      await asUser.mutation(api.addons.mutations.updateAddonConfig, {
        eventId,
        addonType: 'discord',
        config: newConfig,
      });

      const configs = await t.run(async ctx => {
        return await ctx.db
          .query('eventAddonConfigs')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
      });

      const discordConfig = configs.find(c => c.addonType === 'discord');
      expect(discordConfig!.config).toEqual(newConfig);
    });

    test('should reject update with invalid config', async () => {
      const t = createTestInstance();
      const { userId, personId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });
      await authorizeGuild(t, personId, VALID_CONFIG);

      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'discord',
        config: VALID_CONFIG,
      });

      await expect(
        asUser.mutation(api.addons.mutations.updateAddonConfig, {
          eventId,
          addonType: 'discord',
          config: { guildId: '', guildName: '' },
        })
      ).rejects.toThrow('Invalid config');
    });
  });

  describe('guild authorization', () => {
    test('rejects enabling a guild without a recent server authorization', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'discord',
          config: VALID_CONFIG,
        })
      ).rejects.toThrow('Discord server authorization expired or missing');
    });

    test('rejects a manageable guild until the Discord bot is installed', async () => {
      const t = createTestInstance();
      const { userId, personId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });
      await authorizeGuild(t, personId, VALID_CONFIG, {
        botInstalled: false,
      });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'discord',
          config: VALID_CONFIG,
        })
      ).rejects.toThrow('Discord server authorization expired or missing');
    });

    test('rejects an expired guild authorization', async () => {
      const t = createTestInstance();
      const { userId, personId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });
      await authorizeGuild(t, personId, VALID_CONFIG, {
        authorizedAt: Date.now() - 16 * 60 * 1000,
      });

      await expect(
        asUser.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'discord',
          config: VALID_CONFIG,
        })
      ).rejects.toThrow('Discord server authorization expired or missing');
    });

    test('rejects updating to a guild that was not authorized', async () => {
      const t = createTestInstance();
      const { userId, personId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });
      await authorizeGuild(t, personId, VALID_CONFIG);
      await asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'discord',
        config: VALID_CONFIG,
      });

      await expect(
        asUser.mutation(api.addons.mutations.updateAddonConfig, {
          eventId,
          addonType: 'discord',
          config: { guildId: 'not-authorized', guildName: 'Other Server' },
        })
      ).rejects.toThrow('Discord server authorization expired or missing');
    });

    test('rejects Discord in the bulk add-on replacement path without authorization', async () => {
      const t = createTestInstance();
      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addons.mutations.replaceBuiltInAddonConfigs, {
          eventId,
          addons: [{ addonType: 'discord', config: VALID_CONFIG }],
        })
      ).rejects.toThrow('Discord server authorization expired or missing');
    });

    test('rejects Discord during initial event creation without authorization', async () => {
      const t = createTestInstance();
      const { userId } = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.events.mutations.createEvent, {
          title: 'Unauthorized Discord Event',
          addons: [{ addonType: 'discord', config: VALID_CONFIG }],
        })
      ).rejects.toThrow('Discord server authorization expired or missing');
    });
  });

  describe('access control', () => {
    test('should prevent non-organizer from enabling addon', async () => {
      const t = createTestInstance();
      const { eventId } = await createTestEventWithUser(t);

      // Create an attendee
      const { userId: attendeeUserId } = await createTestUser(t, {
        email: 'attendee@test.com',
        username: 'attendee',
      });

      // Add attendee to event
      const { personId: attendeePersonId } = await t.run(async ctx => {
        const person = await ctx.db
          .query('persons')
          .withIndex('by_user_id', q => q.eq('userId', attendeeUserId))
          .first();
        return { personId: person!._id };
      });

      await t.run(async ctx => {
        await ctx.db.insert('memberships', {
          personId: attendeePersonId,
          eventId,
          role: 'ATTENDEE',
          rsvpStatus: 'YES',
        });
      });

      const attendeeAuth = t.withIdentity({ subject: attendeeUserId });

      await expect(
        attendeeAuth.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'discord',
          config: VALID_CONFIG,
        })
      ).rejects.toThrow();
    });

    test('should prevent non-member from enabling addon', async () => {
      const t = createTestInstance();
      const { eventId } = await createTestEventWithUser(t);

      const { userId: outsiderUserId } = await createTestUser(t, {
        email: 'outsider@test.com',
        username: 'outsider',
      });

      const outsiderAuth = t.withIdentity({ subject: outsiderUserId });

      await expect(
        outsiderAuth.mutation(api.addons.mutations.enableAddon, {
          eventId,
          addonType: 'discord',
          config: VALID_CONFIG,
        })
      ).rejects.toThrow();
    });
  });
});
