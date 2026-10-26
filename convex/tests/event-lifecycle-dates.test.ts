import { createEventForPerson } from '../events/writes';
import { classifyEventLifecycle } from '@groupi/shared/utils';
import { api, internal } from '../_generated/api';
import { expect, it } from 'vitest';
import {
  createAuthenticatedUser,
  createTestInstance,
  createTestEventWithDates,
} from './test_helpers';
import {
  clearAllAvailabilityForPerson,
  submitAvailabilityForPerson,
  updateSingleAvailabilityForPerson,
} from '../availability/writes';
import { isEventComplete } from '../events/lifecycle';

it('rejects stale batch and single date votes transactionally and retains old votes', async () => {
  const t = createTestInstance();
  const f = await createTestEventWithDates(t);
  const [passedId, futureId] = f.potentialDateTimeIds;
  const priorId = await t.run(async ctx => {
    await ctx.db.patch(passedId, { dateTime: Date.now() - 1 });
    await ctx.db.patch(futureId, { dateTime: Date.now() + 86400000 });
    return ctx.db.insert('availabilities', {
      membershipId: f.membershipId,
      potentialDateTimeId: passedId,
      status: 'YES',
      note: 'Original',
      updatedAt: 1,
    });
  });
  const before = await t.run(ctx => ctx.db.get(priorId));
  await expect(
    t.run(ctx =>
      submitAvailabilityForPerson(ctx, f.personId, {
        eventId: f.eventId,
        responses: [
          { potentialDateTimeId: futureId, status: 'YES' },
          { potentialDateTimeId: passedId, status: 'NO' },
        ],
      })
    )
  ).rejects.toThrow('passed');
  await expect(
    t.run(ctx =>
      updateSingleAvailabilityForPerson(ctx, f.personId, {
        potentialDateTimeId: passedId,
        status: 'NO',
      })
    )
  ).rejects.toThrow('passed');
  expect(await t.run(ctx => ctx.db.get(priorId))).toEqual(before);
  expect(
    await t.run(ctx => ctx.db.query('availabilities').collect())
  ).toHaveLength(1);
  await t.run(async ctx => {
    await submitAvailabilityForPerson(ctx, f.personId, {
      eventId: f.eventId,
      responses: [{ potentialDateTimeId: futureId, status: 'MAYBE' }],
    });
    const event = await ctx.db.get(f.eventId);
    expect(isEventComplete(event!, Date.now())).toBe(false);
    expect(await ctx.db.get(f.membershipId)).not.toBeNull();
    expect(
      (
        await clearAllAvailabilityForPerson(ctx, f.personId, {
          eventId: f.eventId,
        })
      ).deletedCount
    ).toBe(1);
    expect(await ctx.db.get(priorId)).toEqual(before);
  });
});

it('projects actual poll options and restores Upcoming after native date addition', async () => {
  const t = createTestInstance();
  const f = await createTestEventWithDates(t);
  const auth = createAuthenticatedUser(t, f.userId);
  await t.run(async ctx => {
    for (const id of f.potentialDateTimeIds)
      await ctx.db.patch(id, { dateTime: Date.now() - 1000 });
    await ctx.db.patch(f.eventId, {
      potentialDateTimes: [Date.now() + 99999999],
    });
  });
  let result = await auth.query(api.events.queries.getUserEvents, {});
  expect(classifyEventLifecycle(result.events[0].event, Date.now())).toBe(
    'NEEDS_NEW_DATES'
  );
  await auth.mutation(api.availability.mutations.addPotentialDateTimes, {
    eventId: f.eventId,
    dateTimes: [Date.now() + 86400000],
  });
  result = await auth.query(api.events.queries.getUserEvents, {});
  expect(classifyEventLifecycle(result.events[0].event, Date.now())).toBe(
    'UPCOMING'
  );
  expect(await t.run(ctx => ctx.db.get(f.membershipId))).not.toBeNull();
});

it('enforces expired date rejection through the legacy REST adapter too', async () => {
  const t = createTestInstance();
  const f = await createTestEventWithDates(t);
  const id = f.potentialDateTimeIds[0];
  await t.run(ctx => ctx.db.patch(id, { dateTime: Date.now() - 1 }));
  await expect(
    t.mutation(internal.availability.rest.submitAvailability, {
      membershipId: f.membershipId,
      responses: [{ potentialDateTimeId: id, status: 'YES' }],
    })
  ).rejects.toThrow('passed');
  expect(
    await t.run(ctx => ctx.db.query('availabilities').collect())
  ).toHaveLength(0);
});

it('persists validated creation timezone and keeps the old-client UTC default', async () => {
  const t = createTestInstance();
  const f = await createTestEventWithDates(t);
  const created = await t.run(ctx =>
    createEventForPerson(ctx, f.personId, {
      title: 'Local date',
      timezone: 'America/New_York',
    })
  );
  expect((await t.run(ctx => ctx.db.get(created.eventId)))?.timezone).toBe(
    'America/New_York'
  );
  const legacy = await t.run(ctx =>
    createEventForPerson(ctx, f.personId, { title: 'Legacy client' })
  );
  expect((await t.run(ctx => ctx.db.get(legacy.eventId)))?.timezone).toBe(
    'UTC'
  );
  await expect(
    t.run(ctx =>
      createEventForPerson(ctx, f.personId, {
        title: 'Bad timezone',
        timezone: 'Invalid/Zone',
      })
    )
  ).rejects.toThrow('timezone');
  const rest = await t.mutation(internal.events.rest.create, {
    personId: f.personId,
    userId: f.userId,
    body: { title: 'REST local date', timezone: 'Asia/Tokyo' },
  });
  expect((await t.run(ctx => ctx.db.get(rest.eventId)))?.timezone).toBe(
    'Asia/Tokyo'
  );
});
