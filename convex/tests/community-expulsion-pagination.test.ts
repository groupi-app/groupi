import { convexTest } from 'convex-test';
import { defineSchema, defineTable } from 'convex/server';
import { expect, it, vi } from 'vitest';
import schema from '../schema';
import { api } from '../_generated/api';
import { progressPage } from '../groups/expulsions';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';

it('accepts production pagination metadata through the actual staff query return validator', async () => {
  // convex-test omits production page metadata and does not enforce returns.
  // Reuse the exact exported returns validator as a test-only schema boundary.
  const t = convexTest(
    defineSchema({
      ...schema.tables,
      checkedReturn: defineTable(progressPage),
    }),
    import.meta.glob('../**/*.{ts,js}')
  );
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'pagination-owner');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'New community',
  });
  const system = (
    globalThis as unknown as {
      Convex: { asyncSyscall: (op: string, args: string) => Promise<string> };
    }
  ).Convex;
  const original = system.asyncSyscall.bind(system);
  const syscall = vi
    .spyOn(system, 'asyncSyscall')
    .mockImplementation(async (op, args) => {
      const result = await original(op, args);
      return op === '1.0/queryPage'
        ? JSON.stringify({
            ...JSON.parse(result),
            pageStatus: null,
            splitCursor: null,
          })
        : result;
    });
  try {
    const result = await owner.auth.query(api.groups.expulsions.listProgress, {
      groupId,
    });
    expect(result.page).toEqual([]);
    expect(result.isDone).toBe(true);
    await t.run(ctx => ctx.db.insert('checkedReturn', result));
  } finally {
    syscall.mockRestore();
  }
});
