import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import { createTestInstance as baseTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
const instances: ReturnType<typeof baseTestInstance>[] = [];
function createTestInstance() {
  const t = baseTestInstance();
  instances.push(t);
  return t;
}
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  for (const t of instances.splice(0))
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  vi.useRealTimers();
});
const page = { numItems: 20, cursor: null };
async function fixture(prefix: string) {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, `${prefix}-owner`);
  const member = await createAuthAccount(t, `${prefix}-member`);
  const other = await createAuthAccount(t, `${prefix}-other`);
  const mod = await createAuthAccount(t, `${prefix}-mod`);
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Lists',
  });
  await t.run(async ctx => {
    for (const [personId, role] of [
      [member.personId, 'MEMBER'],
      [other.personId, 'MEMBER'],
      [mod.personId, 'MODERATOR'],
    ] as const)
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId,
        role,
        joinedAt: Date.now(),
      });
  });
  return { t, owner, member, other, mod, groupId };
}
function request(suffix = 'abc') {
  return `${Date.now()}.12345678-1234-4123-8123-123456789${suffix}`;
}
it('eligible members contribute persistently with exact duplicate-safe requests and author-only edits', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'lists-owner');
  const member = await createAuthAccount(t, 'lists-member');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Community lists',
  });
  await t.run(ctx =>
    ctx.db.insert('groupMemberships', {
      groupId,
      personId: member.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    })
  );
  const toolId = await owner.auth.mutation(
    api.groupLists.mutations.createList,
    { groupId, title: 'Reading suggestions', resultsVisibility: 'MEMBERS' }
  );
  const requestId = `${Date.now()}.12345678-1234-4123-8123-123456789abc`;
  const input = { toolId, version: 1, requestId, text: 'Read Kindred' };
  const first = await member.auth.mutation(
    api.groupLists.mutations.addEntry,
    input
  );
  expect(
    await member.auth.mutation(api.groupLists.mutations.addEntry, input)
  ).toEqual(first);
  const entries = await owner.auth.query(api.groupLists.queries.listEntries, {
    toolId,
    paginationOpts: { numItems: 20, cursor: null },
  });
  expect(entries.page).toHaveLength(1);
  expect(entries.page[0].text).toBe('Read Kindred');
  await member.auth.mutation(api.groupLists.mutations.editEntry, {
    entryId: first.entryId,
    version: 1,
    expectedRevision: 1,
    text: 'Read Kindred together',
    completed: true,
  });
  expect(
    (
      await member.auth.query(api.groupLists.queries.listEntries, {
        toolId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page[0]
  ).toMatchObject({ completed: true, revision: 2 });
  await member.auth.mutation(api.groupLists.mutations.removeEntry, {
    entryId: first.entryId,
    expectedRevision: 2,
  });
  expect(
    await member.auth.mutation(api.groupLists.mutations.addEntry, input)
  ).toMatchObject({ entryId: first.entryId, state: 'REMOVED' });
});

it('enforces owner creation policy, own/private visibility, manager moderation and current required onboarding', async () => {
  const { owner, member, other, mod, groupId } = await fixture('list-privacy');
  await expect(
    member.auth.mutation(api.groupLists.mutations.createList, {
      groupId,
      title: 'Denied',
      resultsVisibility: 'MEMBERS',
    })
  ).rejects.toThrow('creation');
  await expect(
    mod.auth.mutation(api.groupTools.mutations.configureListPolicy, {
      groupId,
      enabled: true,
      creation: 'MEMBERS',
    })
  ).rejects.toThrow();
  await owner.auth.mutation(api.groupTools.mutations.configureListPolicy, {
    groupId,
    enabled: true,
    creation: 'MEMBERS',
  });
  const privateId = await member.auth.mutation(
    api.groupLists.mutations.createList,
    { groupId, title: 'Private ideas', resultsVisibility: 'MANAGERS' }
  );
  const mine = await member.auth.mutation(api.groupLists.mutations.addEntry, {
    toolId: privateId,
    version: 1,
    requestId: request(),
    text: 'My private idea',
  });
  await other.auth.mutation(api.groupLists.mutations.addEntry, {
    toolId: privateId,
    version: 1,
    requestId: request(),
    text: 'Other private idea',
  });
  expect(
    (
      await member.auth.query(api.groupLists.queries.listEntries, {
        toolId: privateId,
        paginationOpts: page,
      })
    ).page.map(row => row.text)
  ).toEqual(['My private idea']);
  expect(
    (
      await mod.auth.query(api.groupLists.queries.listEntries, {
        toolId: privateId,
        paginationOpts: page,
      })
    ).page
  ).toHaveLength(2);
  await expect(
    other.auth.mutation(api.groupLists.mutations.editEntry, {
      entryId: mine.entryId,
      version: 1,
      expectedRevision: 1,
      text: 'Hijack',
      completed: true,
    })
  ).rejects.toThrow();
  await expect(
    other.auth.mutation(api.groupLists.mutations.removeEntry, {
      entryId: mine.entryId,
      expectedRevision: 1,
    })
  ).rejects.toThrow();
  await mod.auth.mutation(api.groupLists.mutations.editEntry, {
    entryId: mine.entryId,
    version: 1,
    expectedRevision: 1,
    text: 'Moderated',
    completed: true,
  });
  await owner.auth.mutation(api.groupTools.mutations.configureListPolicy, {
    groupId,
    enabled: false,
    creation: 'MANAGERS',
  });
  expect(
    (
      await mod.auth.query(api.groupLists.queries.getListForManagement, {
        toolId: privateId,
      })
    ).title
  ).toBe('Private ideas');
  expect(
    (
      await mod.auth.query(api.groupLists.queries.listLists, {
        groupId,
        paginationOpts: page,
      })
    ).page
  ).toHaveLength(1);
  await expect(
    member.auth.query(api.groupLists.queries.getListForManagement, {
      toolId: privateId,
    })
  ).rejects.toThrow();
  await expect(
    mod.auth.query(api.groupLists.queries.listEntries, {
      toolId: privateId,
      paginationOpts: page,
    })
  ).rejects.toThrow('disabled');
  await mod.auth.mutation(api.groupLists.mutations.configureList, {
    toolId: privateId,
    version: 1,
    title: 'New private title',
    description: 'Later private information',
  });
  await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
    groupId,
    personId: member.personId,
  });
  const saved = await member.auth.query(api.groupLists.queries.getOwnEntries, {
    toolId: privateId,
    paginationOpts: page,
  });
  expect(saved.page[0]).toMatchObject({
    listTitle: 'Private ideas',
    text: 'Moderated',
  });
  expect(JSON.stringify(saved)).not.toContain('Later private information');
  await member.auth.mutation(api.groupLists.mutations.removeEntry, {
    entryId: mine.entryId,
    expectedRevision: 2,
  });
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: true,
      requiredCompletion: true,
      questions: [
        {
          id: 'intro',
          label: 'Introduce yourself',
          type: 'SHORT_ANSWER',
          required: true,
        },
      ],
    }
  );
  await expect(
    mod.auth.query(api.groupLists.queries.getListForManagement, {
      toolId: privateId,
    })
  ).rejects.toThrow('onboarding');
  await expect(
    mod.auth.mutation(api.groupLists.mutations.deleteList, {
      toolId: privateId,
    })
  ).rejects.toThrow('onboarding');
  await owner.auth.mutation(api.groupTools.mutations.configureListPolicy, {
    groupId,
    enabled: true,
    creation: 'MANAGERS',
  });
});
it('serializes duplicate add/concurrent edits, rejects changed requests and stale config, and preserves entries after configuration', async () => {
  const { owner, member, groupId } = await fixture('list-races');
  const toolId = await owner.auth.mutation(
    api.groupLists.mutations.createList,
    { groupId, title: 'Shared ideas', resultsVisibility: 'MEMBERS' }
  );
  const input = { toolId, version: 1, requestId: request(), text: 'Same' };
  const [first, second] = await Promise.all([
    member.auth.mutation(api.groupLists.mutations.addEntry, input),
    member.auth.mutation(api.groupLists.mutations.addEntry, input),
  ]);
  expect(first).toEqual(second);
  await expect(
    member.auth.mutation(api.groupLists.mutations.addEntry, {
      ...input,
      text: 'Changed',
    })
  ).rejects.toThrow('different content');
  const outcomes = await Promise.allSettled(
    ['One', 'Two'].map(text =>
      member.auth.mutation(api.groupLists.mutations.editEntry, {
        entryId: first.entryId,
        version: 1,
        expectedRevision: 1,
        text,
        completed: false,
      })
    )
  );
  expect(outcomes.filter(row => row.status === 'fulfilled')).toHaveLength(1);
  const latest = (
    await member.auth.query(api.groupLists.queries.listEntries, {
      toolId,
      paginationOpts: page,
    })
  ).page[0];
  expect(
    await member.auth.mutation(api.groupLists.mutations.editEntry, {
      entryId: first.entryId,
      version: 1,
      expectedRevision: 1,
      text: latest.text,
      completed: false,
    })
  ).toEqual({ revision: 2 });
  await owner.auth.mutation(api.groupLists.mutations.configureList, {
    toolId,
    version: 1,
    title: 'New title',
  });
  expect(
    await member.auth.mutation(api.groupLists.mutations.addEntry, input)
  ).toMatchObject({ entryId: first.entryId, state: 'PRESENT' });
  await expect(
    member.auth.mutation(api.groupLists.mutations.addEntry, {
      ...input,
      requestId: request('abd'),
    })
  ).rejects.toThrow('configuration changed');
  expect(
    (
      await member.auth.query(api.groupLists.queries.getOwnEntries, {
        toolId,
        paginationOpts: page,
      })
    ).page[0].listTitle
  ).toBe('Shared ideas');
  await expect(
    member.auth.mutation(api.groupLists.mutations.addEntry, {
      toolId,
      version: 2,
      requestId: request('abe'),
      text: ' ',
    })
  ).rejects.toThrow('characters');
});

it('retires mixed ordinary tools and cancels list retry expiry without broadcasting', async () => {
  const { t, owner, member, groupId } = await fixture('lists-retire');
  const list = await owner.auth.mutation(api.groupLists.mutations.createList, {
    groupId,
    title: 'List',
    resultsVisibility: 'MEMBERS',
  });
  const form = await owner.auth.mutation(api.groupForms.mutations.createForm, {
    groupId,
    title: 'Form',
    resultsVisibility: 'MANAGERS',
    questions: [],
  });
  await member.auth.mutation(api.groupLists.mutations.addEntry, {
    toolId: list,
    version: 1,
    text: 'Saved',
    requestId: request(),
  });
  await member.auth.mutation(api.groupForms.mutations.submitResponse, {
    toolId: form,
    version: 1,
    expectedRevision: 0,
    answers: {},
  });
  const jobs = await t.run(ctx =>
    ctx.db.system.query('_scheduled_functions').collect()
  );
  expect(
    jobs.filter(j => j.name.includes('groupLists/internal:expireRequest'))
  ).toHaveLength(1);
  expect(await t.run(ctx => ctx.db.query('notifications').collect())).toEqual(
    []
  );
  await owner.auth.mutation(api.groups.mutations.deleteGroup, { groupId });
  for (const table of [
    'groupTools',
    'groupLists',
    'groupListEntries',
    'groupListRequests',
    'groupForms',
    'groupFormResponses',
  ] as const)
    expect(await t.run(ctx => ctx.db.query(table).collect())).toEqual([]);
  expect(
    (await t.run(ctx => ctx.db.system.query('_scheduled_functions').collect()))
      .filter(j => j.name.includes('groupLists/internal:expireRequest'))
      .every(j => j.state.kind === 'canceled')
  ).toBe(true);
});
it('expires retry state through the actual scheduled mutation while retaining the entry', async () => {
  const { t, owner, member, groupId } = await fixture('lists-expiry');
  const toolId = await owner.auth.mutation(
    api.groupLists.mutations.createList,
    { groupId, title: 'List', resultsVisibility: 'MEMBERS' }
  );
  const input = { toolId, version: 1, text: 'Keep', requestId: request() };
  await member.auth.mutation(api.groupLists.mutations.addEntry, input);
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(
    await t.run(ctx =>
      ctx.db
        .query('groupListRequests')
        .withIndex('by_toolId', q => q.eq('toolId', toolId))
        .collect()
    )
  ).toEqual([]);
  const refreshed = await createAuthAccount(
    t,
    'lists-expiry-refreshed',
    member.personId
  );
  expect(
    (
      await refreshed.auth.query(api.groupLists.queries.listEntries, {
        toolId,
        paginationOpts: page,
      })
    ).page
  ).toHaveLength(1);
  await expect(
    refreshed.auth.mutation(api.groupLists.mutations.addEntry, input)
  ).rejects.toThrow();
});
