import { expect, it } from 'vitest';
import type { MutationCtx } from '../_generated/server';
import { api } from '../_generated/api';
import { listOwned } from '../accountResolution/queries';
import { listForPerson } from '../accountResolution/model';
import { listForms } from '../groupForms/queries';
import { list } from '../groupForms/model';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

// convex-test omits the optional metadata emitted by hosted Convex and does not
// validate function returns. Keep its real data/auth/queries, but reproduce the
// hosted pagination envelope before checking the actual exported contract.
function hostedPagination(ctx: MutationCtx): MutationCtx {
  function query<T extends object>(target: T): T {
    return new Proxy(target, {
      get(target, key) {
        const value = Reflect.get(target, key);
        if (typeof value !== 'function') return value;
        return (...args: unknown[]) => {
          const result = Reflect.apply(value, target, args);
          if (key === 'paginate')
            return Promise.resolve(result).then(page => ({
              ...page,
              pageStatus: null,
              splitCursor: null,
            }));
          if (key === 'query' || key === 'withIndex' || key === 'order')
            return query(result);
          return result;
        };
      },
    });
  }
  return { ...ctx, db: query(ctx.db) };
}

function expectContract(
  result: { page: unknown[]; isDone: boolean; continueCursor: string },
  registered: { exportReturns(): string }
) {
  const contract = JSON.parse(registered.exportReturns());
  expect(Object.keys(result).filter(key => !(key in contract.value))).toEqual(
    []
  );
  expect(result).toMatchObject({
    page: expect.any(Array),
    isDone: expect.any(Boolean),
    continueCursor: expect.any(String),
  });
}

it.each(['GROUP', 'EVENT'] as const)(
  'keeps hosted %s ownership pagination within its public return contract',
  async kind => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, `page-${kind.toLowerCase()}`);
    for (const title of ['First', 'Second']) {
      if (kind === 'GROUP')
        await owner.auth.mutation(api.groups.mutations.createGroup, {
          name: title,
        });
      else
        await owner.auth.mutation(api.events.mutations.createEvent, {
          title,
          chosenDateTime: '2027-01-01T12:00:00Z',
        });
    }
    const first = await t.run(ctx =>
      listForPerson(hostedPagination(ctx), owner.personId, kind, {
        cursor: null,
        numItems: 1,
      })
    );
    expect(first.page.map(item => item.title)).toEqual(['First']);
    expect(first.isDone).toBe(false);
    expectContract(first, listOwned);
    const last = await t.run(ctx =>
      listForPerson(hostedPagination(ctx), owner.personId, kind, {
        cursor: first.continueCursor,
        numItems: 2,
      })
    );
    expect(last.page.map(item => item.title)).toEqual(['Second']);
    expect(last.isDone).toBe(true);
    expectContract(last, listOwned);
  }
);

it('keeps hosted Group form collection pagination within its public return contract', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'page-forms');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Forms pagination',
  });
  const toolId = await owner.auth.mutation(
    api.groupForms.mutations.createForm,
    {
      groupId,
      title: 'Feedback',
      resultsVisibility: 'MANAGERS',
      questions: [],
    }
  );
  const result = await t.run(ctx =>
    list(hostedPagination(ctx), owner.personId, groupId, {
      cursor: null,
      numItems: 10,
    })
  );
  expect(result.page.map(item => item._id)).toEqual([toolId]);
  expectContract(result, listForms);
});
