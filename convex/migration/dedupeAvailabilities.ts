import { makeFunctionReference } from 'convex/server';
import type { FunctionReference } from 'convex/server';
import { v } from 'convex/values';
import type { Doc } from '../_generated/dataModel';
import { internalMutation } from '../_generated/server';

const BATCH_SIZE = 50;

type MigrationArgs = { cursor?: string };

type MigrationResult = {
  membershipsScanned: number;
  availabilitiesScanned: number;
  deleted: number;
  isDone: boolean;
};

const selfRef = makeFunctionReference<
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

function compareAvailabilityRecency(
  left: Doc<'availabilities'>,
  right: Doc<'availabilities'>
): number {
  const leftActivityTime = left.updatedAt ?? left._creationTime;
  const rightActivityTime = right.updatedAt ?? right._creationTime;

  if (leftActivityTime !== rightActivityTime) {
    return leftActivityTime - rightActivityTime;
  }

  if (left._creationTime !== right._creationTime) {
    return left._creationTime - right._creationTime;
  }

  return left._id.toString().localeCompare(right._id.toString());
}

export const dedupeAvailabilities = internalMutation({
  args: {
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    membershipsScanned: v.number(),
    availabilitiesScanned: v.number(),
    deleted: v.number(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, { cursor }): Promise<MigrationResult> => {
    const results = await ctx.db
      .query('memberships')
      .paginate({ cursor: cursor ?? null, numItems: BATCH_SIZE });

    let availabilitiesScanned = 0;
    let deleted = 0;

    for (const membership of results.page) {
      const availabilities = await ctx.db
        .query('availabilities')
        .withIndex('by_membership', q => q.eq('membershipId', membership._id))
        .collect();

      availabilitiesScanned += availabilities.length;

      const byPotentialDateTime = new Map<
        string,
        Array<Doc<'availabilities'>>
      >();

      for (const availability of availabilities) {
        const key = availability.potentialDateTimeId.toString();
        const group = byPotentialDateTime.get(key) ?? [];
        group.push(availability);
        byPotentialDateTime.set(key, group);
      }

      for (const group of byPotentialDateTime.values()) {
        if (group.length < 2) continue;

        const canonical = group.reduce((latest, candidate) =>
          compareAvailabilityRecency(candidate, latest) > 0 ? candidate : latest
        );

        for (const availability of group) {
          if (availability._id === canonical._id) continue;

          await ctx.db.delete('availabilities', availability._id);
          deleted++;
        }
      }
    }

    const migrationResult: MigrationResult = {
      membershipsScanned: results.page.length,
      availabilitiesScanned,
      deleted,
      isDone: results.isDone,
    };

    console.log(
      `Deduplicated availabilities: ${deleted} deleted (${availabilitiesScanned} availabilities across ${results.page.length} memberships scanned)`
    );

    if (!results.isDone) {
      await ctx.scheduler.runAfter(0, selfRef, {
        cursor: results.continueCursor,
      });
    }

    return migrationResult;
  },
});
