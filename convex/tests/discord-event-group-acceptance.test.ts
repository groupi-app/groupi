import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import { setupDiscordAcceptance } from './discord-acceptance.helpers';

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('authenticated Event lifecycle creates, updates and deletes Discord scheduled events independently of a coexisting Group connection', async () => {
  vi.useFakeTimers();
  const f = await setupDiscordAcceptance('role');
  const { eventId } = f.event;
  const groupBefore = await f.owner.auth.query(
    api.groupDiscord.queries.getConnection,
    { groupId: f.groupId }
  );
  expect(
    await f.owner.auth.query(api.discord.queries.getDiscordEventInfo, {
      eventId,
    })
  ).toBeNull();
  expect(f.remoteEvents.size).toBe(0);
  await f.owner.auth.action(api.discord.actions.getAvailableGuilds, {});
  await f.owner.auth.mutation(api.events.mutations.chooseEventDate, {
    eventId,
    chosenDateTime: Date.now() + 86400000,
    selectionSource: 'MANUAL',
  });
  await f.owner.auth.mutation(api.addons.mutations.enableAddon, {
    eventId,
    addonType: 'discord',
    config: { guildId: '100', guildName: 'Shared guild' },
  });
  await f.t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(f.remoteEvents.get('scheduled-event')).toMatchObject({
    privacy_level: 2,
    entity_type: 3,
  });
  expect(
    await f.owner.auth.query(api.discord.queries.getDiscordEventInfo, {
      eventId,
    })
  ).toMatchObject({
    discordEventId: 'scheduled-event',
    guildId: '100',
    error: null,
  });
  expect(
    await f.owner.auth.query(api.groupDiscord.queries.getConnection, {
      groupId: f.groupId,
    })
  ).toEqual(groupBefore);
  await f.owner.auth.mutation(api.groupDiscord.mutations.disable, {
    groupId: f.groupId,
    acknowledgeHandback: true,
  });
  const handedBackGroup = await f.owner.auth.query(
    api.groupDiscord.queries.getConnection,
    { groupId: f.groupId }
  );
  expect(handedBackGroup).toMatchObject({ status: 'disabled' });
  expect(f.remoteEvents.has('scheduled-event')).toBe(true);
  expect(
    await f.owner.auth.query(api.addons.queries.getAddonConfig, {
      eventId,
      addonType: 'discord',
    })
  ).toMatchObject({ enabled: true });
  await f.owner.auth.mutation(api.events.mutations.updateEvent, {
    eventId,
    title: 'Updated Event',
    location: 'Library',
  });
  await f.t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(f.remoteEvents.get('scheduled-event')).toMatchObject({
    name: 'Updated Event',
    entity_metadata: { location: 'Library' },
  });
  await f.owner.auth.mutation(api.addons.mutations.disableAddon, {
    eventId,
    addonType: 'discord',
  });
  await f.t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(f.remoteEvents.size).toBe(0);
  expect(
    await f.owner.auth.query(api.discord.queries.getDiscordEventInfo, {
      eventId,
    })
  ).toBeNull();
  expect(
    await f.owner.auth.query(api.groupDiscord.queries.getConnection, {
      groupId: f.groupId,
    })
  ).toEqual(handedBackGroup);
  expect(
    await f.owner.auth.query(api.groupDiscord.enrollment.getStatus, {
      groupId: f.groupId,
    })
  ).toBeNull();
  expect(
    f.effects
      .filter(e => e.path.includes('/scheduled-events'))
      .map(e => e.method)
  ).toEqual(['POST', 'PATCH', 'DELETE']);
  expect(f.effects.some(e => e.path.includes('/members/'))).toBe(false);
});
