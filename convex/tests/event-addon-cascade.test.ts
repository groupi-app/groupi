import { expect, it } from 'vitest';
import { api } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

it.each(['ordinary', 'account resolution'] as const)(
  '%s Event deletion composes add-on lifecycle cleanup with the generic cascade',
  async path => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'cascade-owner');
    const member = await createAuthAccount(t, 'cascade-member');
    const { eventId } = await owner.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'Delete with participant claims' }
    );
    const { eventId: retainedId } = await owner.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'Retain another Event' }
    );
    await t.run(ctx =>
      ctx.db.insert('memberships', {
        eventId,
        personId: member.personId,
        role: 'ATTENDEE',
        rsvpStatus: 'PENDING',
      })
    );
    for (const id of [eventId, retainedId])
      await owner.auth.mutation(api.addons.mutations.enableAddon, {
        eventId: id,
        addonType: 'bring-list',
        config: { items: [{ id: 'water', name: 'Water', quantity: 3 }] },
      });
    for (const actor of [owner, member])
      await actor.auth.mutation(api.addons.mutations.setAddonData, {
        eventId,
        addonType: 'bring-list',
        key: `claims:${actor.personId}`,
        data: { water: 1 },
      });
    const retainedClaim = await owner.auth.mutation(
      api.addons.mutations.setAddonData,
      {
        eventId: retainedId,
        addonType: 'bring-list',
        key: `claims:${owner.personId}`,
        data: { water: 1 },
      }
    );
    await owner.auth.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'reminders',
      config: { reminderOffset: '1_DAY' },
    });
    // Distinct add-on-owned table cleanup must still run, and generic cleanup
    // must remove residual data whose handler no longer exists.
    const retainedReminder = await t.run(async ctx => {
      for (const id of [eventId, retainedId]) {
        await ctx.db.insert('addonData', {
          eventId: id,
          addonType: 'retired-addon',
          key: 'legacy',
          data: { value: 'keep only on the other Event' },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      await ctx.db.insert('eventReminders', {
        eventId,
        scheduledTime: Date.now(),
        reminderOffset: '1_DAY',
        status: 'SENT',
      });
      return ctx.db.insert('eventReminders', {
        eventId: retainedId,
        scheduledTime: Date.now(),
        reminderOffset: '1_DAY',
        status: 'SENT',
      });
    });
    if (path === 'ordinary')
      await owner.auth.mutation(api.events.mutations.deleteEvent, { eventId });
    else
      await owner.auth.mutation(
        api.accountResolution.mutations.deleteOwnedEvent,
        { eventId }
      );

    await t.run(async ctx => {
      expect(await ctx.db.get(eventId)).toBeNull();
      expect(await ctx.db.get(retainedId)).not.toBeNull();
      expect(await ctx.db.get(retainedClaim.id)).toMatchObject({
        eventId: retainedId,
        data: { water: 1 },
      });
      expect(await ctx.db.get(retainedReminder)).not.toBeNull();
      expect(await ctx.db.query('addonData').collect()).toHaveLength(2);
      for (const table of [
        'addonData',
        'eventAddonConfigs',
        'eventReminders',
        'memberships',
      ] as const) {
        const rows = await ctx.db.query(table).collect();
        expect(rows.filter(row => row.eventId === eventId)).toEqual([]);
      }
    });
  }
);
