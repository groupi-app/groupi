import { makeFunctionReference } from 'convex/server';
import type { FunctionReference } from 'convex/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Id } from '../_generated/dataModel';
import { createTestInstance } from './test_helpers';

type MigrationArgs = { cursor?: string };

type MigrationResult = {
  membershipsScanned: number;
  availabilitiesScanned: number;
  deleted: number;
  isDone: boolean;
};

const migrationRef = makeFunctionReference<
  'mutation',
  MigrationArgs,
  MigrationResult
>(
  'migration/dedupeAvailabilities:dedupeAvailabilities'
) as unknown as FunctionReference<
  'mutation',
  'internal',
  MigrationArgs,
  MigrationResult
>;

describe('dedupeAvailabilities migration', () => {
  let t: ReturnType<typeof createTestInstance>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    t = createTestInstance();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function createMembershipAndDate() {
    return await t.run(async ctx => {
      const personId = await ctx.db.insert('persons', {
        userId: 'migration-test-user',
      });
      const eventId = await ctx.db.insert('events', {
        title: 'Migration Test Event',
        creatorId: personId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        timezone: 'UTC',
        potentialDateTimes: [],
      });
      const membershipId = await ctx.db.insert('memberships', {
        personId,
        eventId,
        role: 'ORGANIZER',
        rsvpStatus: 'YES',
      });
      const potentialDateTimeId = await ctx.db.insert('potentialDateTimes', {
        eventId,
        dateTime: Date.now() + 86_400_000,
      });

      return { personId, eventId, membershipId, potentialDateTimeId };
    });
  }

  async function getAvailabilities(membershipId: Id<'memberships'>) {
    return await t.run(async ctx =>
      ctx.db
        .query('availabilities')
        .withIndex('by_membership', q => q.eq('membershipId', membershipId))
        .collect()
    );
  }

  it('retains the availability with the most recent activity timestamp', async () => {
    const { membershipId, potentialDateTimeId } =
      await createMembershipAndDate();

    const expectedId = await t.run(async ctx => {
      await ctx.db.insert('availabilities', {
        membershipId,
        potentialDateTimeId,
        status: 'YES',
        updatedAt: 100,
      });
      const expectedId = await ctx.db.insert('availabilities', {
        membershipId,
        potentialDateTimeId,
        status: 'MAYBE',
        updatedAt: 300,
      });
      await ctx.db.insert('availabilities', {
        membershipId,
        potentialDateTimeId,
        status: 'NO',
        updatedAt: 200,
      });
      return expectedId;
    });

    const result = await t.mutation(migrationRef, {});
    const remaining = await getAvailabilities(membershipId);

    expect(result).toEqual({
      membershipsScanned: 1,
      availabilitiesScanned: 3,
      deleted: 2,
      isDone: true,
    });
    expect(remaining).toHaveLength(1);
    expect(remaining[0]._id).toBe(expectedId);
    expect(remaining[0].status).toBe('MAYBE');
  });

  it('breaks equal update-time ties by creation time and then id', async () => {
    const { membershipId, potentialDateTimeId } =
      await createMembershipAndDate();

    await t.run(async ctx => {
      await ctx.db.insert('availabilities', {
        membershipId,
        potentialDateTimeId,
        status: 'YES',
        updatedAt: 500,
      });
    });

    vi.advanceTimersByTime(1);

    const candidates = await t.run(async ctx => {
      await ctx.db.insert('availabilities', {
        membershipId,
        potentialDateTimeId,
        status: 'MAYBE',
        updatedAt: 500,
      });
      await ctx.db.insert('availabilities', {
        membershipId,
        potentialDateTimeId,
        status: 'NO',
        updatedAt: 500,
      });

      return await ctx.db
        .query('availabilities')
        .withIndex('by_membership', q => q.eq('membershipId', membershipId))
        .collect();
    });

    const expected = candidates.reduce((latest, candidate) => {
      if (candidate._creationTime !== latest._creationTime) {
        return candidate._creationTime > latest._creationTime
          ? candidate
          : latest;
      }
      return candidate._id.toString().localeCompare(latest._id.toString()) > 0
        ? candidate
        : latest;
    });

    await t.mutation(migrationRef, {});
    const remaining = await getAvailabilities(membershipId);

    expect(remaining).toHaveLength(1);
    expect(remaining[0]._id).toBe(expected._id);
  });

  it('processes duplicate rows across multiple scheduled membership batches', async () => {
    const { personId, eventId, membershipId, potentialDateTimeId } =
      await createMembershipAndDate();

    const membershipIds = await t.run(async ctx => {
      const ids: Array<Id<'memberships'>> = [membershipId];
      for (let index = 1; index < 51; index++) {
        ids.push(
          await ctx.db.insert('memberships', {
            personId,
            eventId,
            role: 'ATTENDEE',
            rsvpStatus: 'PENDING',
          })
        );
      }
      return ids;
    });

    const membershipsWithDuplicates = [membershipIds[0], membershipIds[50]];
    await t.run(async ctx => {
      for (const duplicateMembershipId of membershipsWithDuplicates) {
        await ctx.db.insert('availabilities', {
          membershipId: duplicateMembershipId,
          potentialDateTimeId,
          status: 'YES',
          updatedAt: 100,
        });
        await ctx.db.insert('availabilities', {
          membershipId: duplicateMembershipId,
          potentialDateTimeId,
          status: 'NO',
          updatedAt: 200,
        });
      }
    });

    const firstBatch = await t.mutation(migrationRef, {});
    expect(firstBatch.membershipsScanned).toBe(50);
    expect(firstBatch.isDone).toBe(false);

    await t.finishAllScheduledFunctions(() => vi.runAllTimers());

    for (const duplicateMembershipId of membershipsWithDuplicates) {
      const remaining = await getAvailabilities(duplicateMembershipId);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].status).toBe('NO');
    }
  });

  it('is idempotent after duplicates have been removed', async () => {
    const { membershipId, potentialDateTimeId } =
      await createMembershipAndDate();

    const expectedId = await t.run(async ctx => {
      await ctx.db.insert('availabilities', {
        membershipId,
        potentialDateTimeId,
        status: 'YES',
        updatedAt: 100,
      });
      return await ctx.db.insert('availabilities', {
        membershipId,
        potentialDateTimeId,
        status: 'NO',
        updatedAt: 200,
      });
    });

    const firstRun = await t.mutation(migrationRef, {});
    const secondRun = await t.mutation(migrationRef, {});
    const remaining = await getAvailabilities(membershipId);

    expect(firstRun.deleted).toBe(1);
    expect(secondRun.deleted).toBe(0);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]._id).toBe(expectedId);
  });

  it('leaves memberships without duplicate availability rows unchanged', async () => {
    const { membershipId, potentialDateTimeId } =
      await createMembershipAndDate();

    const expectedId = await t.run(async ctx =>
      ctx.db.insert('availabilities', {
        membershipId,
        potentialDateTimeId,
        status: 'MAYBE',
      })
    );

    const result = await t.mutation(migrationRef, {});
    const remaining = await getAvailabilities(membershipId);

    expect(result.deleted).toBe(0);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]._id).toBe(expectedId);
  });
});
