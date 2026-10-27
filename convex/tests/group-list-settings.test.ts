import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import { createTestInstance as baseTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { cleanupPerson } from '../groupLists/model';
const instances: ReturnType<typeof baseTestInstance>[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  for (const t of instances.splice(0))
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  vi.useRealTimers();
});
const page = { numItems: 20, cursor: null };
let serial = 0;
const request = () =>
  `${Date.now()}.12345678-1234-4123-8123-${String(++serial).padStart(12, '0')}`;
async function fixture(prefix: string) {
  const t = baseTestInstance();
  instances.push(t);
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, `${prefix}-owner`);
  const creator = await createAuthAccount(t, `${prefix}-creator`);
  const member = await createAuthAccount(t, `${prefix}-member`);
  const outsider = await createAuthAccount(t, `${prefix}-outsider`);
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Typed lists',
  });
  const memberships = await t.run(async ctx =>
    Promise.all(
      [creator, member].map(person =>
        ctx.db.insert('groupMemberships', {
          groupId,
          personId: person.personId,
          role: 'MEMBER',
          joinedAt: Date.now(),
        })
      )
    )
  );
  await owner.auth.mutation(api.groupTools.mutations.configureListPolicy, {
    groupId,
    enabled: true,
    creation: 'MEMBERS',
  });
  const toolId = await creator.auth.mutation(
    api.groupLists.mutations.createList,
    { groupId, title: 'Checklist', resultsVisibility: 'MEMBERS' }
  );
  const entry = await member.auth.mutation(api.groupLists.mutations.addEntry, {
    toolId,
    version: 1,
    requestId: request(),
    text: 'A contribution',
  });
  return {
    t,
    owner,
    creator,
    member,
    outsider,
    groupId,
    toolId,
    entryId: entry.entryId,
    memberships,
  };
}
it('allows current creator settings without granting other-entry editing, deletion or other-list access', async () => {
  const f = await fixture('creator-settings');
  expect(
    await f.creator.auth.query(api.groupLists.queries.getListForManagement, {
      toolId: f.toolId,
    })
  ).toMatchObject({
    canConfigure: true,
    canManage: false,
    canDelete: false,
    listType: 'CHECKLIST',
    hasEntries: true,
  });
  await expect(
    f.member.auth.query(api.groupLists.queries.getListForManagement, {
      toolId: f.toolId,
    })
  ).rejects.toThrow('creator');
  await f.creator.auth.mutation(api.groupLists.mutations.configureList, {
    toolId: f.toolId,
    version: 1,
    title: 'Renamed',
    addPolicy: 'CREATOR_MANAGERS',
  });
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.editEntry, {
      entryId: f.entryId,
      version: 2,
      expectedRevision: 1,
      text: 'Hijacked',
      completed: false,
    })
  ).rejects.toThrow('author');
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.removeEntry, {
      entryId: f.entryId,
      expectedRevision: 1,
    })
  ).rejects.toThrow();
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.deleteList, {
      toolId: f.toolId,
    })
  ).rejects.toThrow();
  await expect(
    f.member.auth.mutation(api.groupLists.mutations.addEntry, {
      toolId: f.toolId,
      version: 2,
      requestId: request(),
      text: 'Denied',
    })
  ).rejects.toThrow('creator');
  await f.creator.auth.mutation(api.groupLists.mutations.addEntry, {
    toolId: f.toolId,
    version: 2,
    requestId: request(),
    text: 'Allowed',
  });
  await f.owner.auth.mutation(api.groupLists.mutations.configureList, {
    toolId: f.toolId,
    version: 2,
    title: 'Manager oversight',
  });
  await f.t.run(ctx => ctx.db.delete(f.memberships[0]));
  await expect(
    f.creator.auth.query(api.groupLists.queries.getListForManagement, {
      toolId: f.toolId,
    })
  ).rejects.toThrow();
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.configureList, {
      toolId: f.toolId,
      version: 3,
      title: 'Revoked',
    })
  ).rejects.toThrow();
  await expect(
    f.outsider.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
      entryId: f.entryId,
      version: 3,
      expectedRevision: 1,
      completed: true,
    })
  ).rejects.toThrow();
});
it('defaults legacy shared lists to collaborative completion and records only real transitions', async () => {
  const f = await fixture('legacy-completion');
  await f.t.run(async ctx => {
    const state = await ctx.db
      .query('groupLists')
      .withIndex('by_toolId', q => q.eq('toolId', f.toolId))
      .unique();
    await ctx.db.patch(state!._id, {
      listType: undefined,
      addPolicy: undefined,
      completionPolicy: undefined,
    });
  });
  const before = await f.creator.auth.query(
    api.groupLists.queries.listEntries,
    { toolId: f.toolId, paginationOpts: page }
  );
  expect(before.page[0]).toMatchObject({
    canComplete: true,
    canEdit: false,
    addedByName: 'legacy-completion-member',
  });
  expect(before.page[0].completedByName).toBeUndefined();
  await f.creator.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
    entryId: f.entryId,
    version: 1,
    expectedRevision: 1,
    completed: true,
  });
  const completed = await f.member.auth.query(
    api.groupLists.queries.listEntries,
    { toolId: f.toolId, paginationOpts: page }
  );
  expect(completed.page[0]).toMatchObject({
    completed: true,
    completedById: f.creator.personId,
    completedByName: 'legacy-completion-creator',
    revision: 2,
  });
  await f.owner.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
    entryId: f.entryId,
    version: 1,
    expectedRevision: 1,
    completed: true,
  });
  expect((await f.t.run(ctx => ctx.db.get(f.entryId)))?.completedById).toBe(
    f.creator.personId
  );
  await expect(
    f.member.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
      entryId: f.entryId,
      version: 1,
      expectedRevision: 1,
      completed: false,
    })
  ).rejects.toThrow('changed');
  await f.member.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
    entryId: f.entryId,
    version: 1,
    expectedRevision: 2,
    completed: false,
  });
  const reopened = await f.t.run(ctx => ctx.db.get(f.entryId));
  expect(reopened).toMatchObject({ completed: false, revision: 3 });
  expect(reopened?.completedById).toBeUndefined();
  expect(reopened?.completedAt).toBeUndefined();
});
it('enforces completion policies on dedicated writes and old edit payloads', async () => {
  const f = await fixture('completion-policy');
  await f.creator.auth.mutation(api.groupLists.mutations.configureList, {
    toolId: f.toolId,
    version: 1,
    title: 'Authors only',
    completionPolicy: 'AUTHORS',
  });
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
      entryId: f.entryId,
      version: 2,
      expectedRevision: 1,
      completed: true,
    })
  ).rejects.toThrow('policy');
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.editEntry, {
      entryId: f.entryId,
      version: 2,
      expectedRevision: 1,
      text: 'A contribution',
      completed: true,
    })
  ).rejects.toThrow('policy');
  await f.member.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
    entryId: f.entryId,
    version: 2,
    expectedRevision: 1,
    completed: true,
  });
  await f.creator.auth.mutation(api.groupLists.mutations.configureList, {
    toolId: f.toolId,
    version: 2,
    title: 'Creator only',
    completionPolicy: 'CREATOR_MANAGERS',
  });
  await expect(
    f.member.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
      entryId: f.entryId,
      version: 3,
      expectedRevision: 2,
      completed: false,
    })
  ).rejects.toThrow('policy');
  await f.creator.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
    entryId: f.entryId,
    version: 3,
    expectedRevision: 2,
    completed: false,
  });
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
      entryId: f.entryId,
      version: 2,
      expectedRevision: 3,
      completed: true,
    })
  ).rejects.toThrow('configuration changed');
});
it('switches Simple/Checklist without erasing completion and blocks hidden completion writes', async () => {
  const f = await fixture('simple-mode');
  await f.member.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
    entryId: f.entryId,
    version: 1,
    expectedRevision: 1,
    completed: true,
  });
  const saved = await f.t.run(ctx => ctx.db.get(f.entryId));
  await f.creator.auth.mutation(api.groupLists.mutations.configureList, {
    toolId: f.toolId,
    version: 1,
    title: 'Plain text',
    listType: 'SIMPLE',
  });
  expect(
    (
      await f.member.auth.query(api.groupLists.queries.listEntries, {
        toolId: f.toolId,
        paginationOpts: page,
      })
    ).page[0].canComplete
  ).toBe(false);
  await expect(
    f.member.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
      entryId: f.entryId,
      version: 2,
      expectedRevision: 2,
      completed: false,
    })
  ).rejects.toThrow('type');
  await expect(
    f.member.auth.mutation(api.groupLists.mutations.editEntry, {
      entryId: f.entryId,
      version: 2,
      expectedRevision: 2,
      text: 'A contribution',
      completed: false,
    })
  ).rejects.toThrow('type');
  await f.member.auth.mutation(api.groupLists.mutations.editEntry, {
    entryId: f.entryId,
    version: 2,
    expectedRevision: 2,
    text: 'Edited plain entry',
    completed: true,
  });
  await f.creator.auth.mutation(api.groupLists.mutations.configureList, {
    toolId: f.toolId,
    version: 2,
    title: 'Checklist again',
    listType: 'CHECKLIST',
  });
  const restored = await f.t.run(ctx => ctx.db.get(f.entryId));
  expect(restored).toMatchObject({
    completed: true,
    completedById: saved?.completedById,
    completedAt: saved?.completedAt,
    text: 'Edited plain entry',
  });
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.configureList, {
      toolId: f.toolId,
      version: 3,
      title: 'No destructive conversion',
      listType: 'BRING',
    })
  ).rejects.toThrow('separate list');
  expect((await f.t.run(ctx => ctx.db.get(f.entryId)))?.text).toBe(
    'Edited plain entry'
  );
});
it('keeps private entries author/manager-only even when creator or policy allows participants', async () => {
  const f = await fixture('private-completion');
  const privateId = await f.creator.auth.mutation(
    api.groupLists.mutations.createList,
    {
      groupId: f.groupId,
      title: 'Private',
      resultsVisibility: 'MANAGERS',
      completionPolicy: 'PARTICIPANTS',
    }
  );
  const row = await f.member.auth.mutation(api.groupLists.mutations.addEntry, {
    toolId: privateId,
    version: 1,
    requestId: request(),
    text: 'Private member contribution',
  });
  expect(
    (
      await f.creator.auth.query(api.groupLists.queries.listEntries, {
        toolId: privateId,
        paginationOpts: page,
      })
    ).page
  ).toHaveLength(0);
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
      entryId: row.entryId,
      version: 1,
      expectedRevision: 1,
      completed: true,
    })
  ).rejects.toThrow('policy');
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.editEntry, {
      entryId: row.entryId,
      version: 1,
      expectedRevision: 1,
      text: 'Private member contribution',
      completed: true,
    })
  ).rejects.toThrow('private');
  await f.member.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
    entryId: row.entryId,
    version: 1,
    expectedRevision: 1,
    completed: true,
  });
  await f.owner.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
    entryId: row.entryId,
    version: 1,
    expectedRevision: 2,
    completed: false,
  });
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.configureList, {
      toolId: privateId,
      version: 1,
      title: 'No personal Bring conversion',
      listType: 'BRING',
    })
  ).rejects.toThrow('shared visibility');
});
it('does not invent legacy completers and anonymizes deleted completion actors on other entries', async () => {
  const f = await fixture('completion-anonymity');
  await f.t.run(ctx =>
    ctx.db.patch(f.entryId, { completed: true, actorId: f.creator.personId })
  );
  expect(
    (
      await f.member.auth.query(api.groupLists.queries.listEntries, {
        toolId: f.toolId,
        paginationOpts: page,
      })
    ).page[0].completedByName
  ).toBeUndefined();
  await f.member.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
    entryId: f.entryId,
    version: 1,
    expectedRevision: 1,
    completed: false,
  });
  await f.creator.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
    entryId: f.entryId,
    version: 1,
    expectedRevision: 2,
    completed: true,
  });
  await f.t.run(ctx => cleanupPerson(ctx, f.creator.personId));
  const row = await f.t.run(ctx => ctx.db.get(f.entryId));
  expect(row).toMatchObject({ completed: true, personId: f.member.personId });
  expect(row?.completedById).toBeUndefined();
  const visible = (
    await f.member.auth.query(api.groupLists.queries.listEntries, {
      toolId: f.toolId,
      paginationOpts: page,
    })
  ).page[0];
  expect(visible.addedByName).toBe('completion-anonymity-member');
  expect(visible.completedByName).toBeUndefined();
});
it('grants no creator authority to legacy lists without creator metadata', async () => {
  const f = await fixture('legacy-owner');
  await f.t.run(ctx => ctx.db.patch(f.toolId, { creatorId: undefined }));
  await expect(
    f.creator.auth.query(api.groupLists.queries.getListForManagement, {
      toolId: f.toolId,
    })
  ).rejects.toThrow('creator');
  expect(
    await f.owner.auth.query(api.groupLists.queries.getListForManagement, {
      toolId: f.toolId,
    })
  ).toMatchObject({ canConfigure: true, canDelete: true });
});
it('uses the same creator, policy and cross-owner checks for Event lists', async () => {
  const f = await fixture('event-settings');
  const eventId = await f.t.run(async ctx => {
    const id = await ctx.db.insert('events', {
      title: 'Typed Event lists',
      description: '',
      location: '',
      potentialDateTimes: [],
      creatorId: f.owner.personId,
      timezone: 'UTC',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      permissions: { createPosts: 'EVERYONE' },
    });
    for (const [personId, role] of [
      [f.owner.personId, 'ORGANIZER'],
      [f.creator.personId, 'ATTENDEE'],
      [f.member.personId, 'ATTENDEE'],
    ] as const)
      await ctx.db.insert('memberships', {
        eventId: id,
        personId,
        role,
        rsvpStatus: 'YES',
      });
    return id;
  });
  const toolId = await f.creator.auth.mutation(
    api.eventContent.mutations.createList,
    { eventId, title: 'Event checklist', resultsVisibility: 'MEMBERS' }
  );
  await f.creator.auth.mutation(api.groupLists.mutations.configureList, {
    toolId,
    version: 1,
    title: 'Event config',
    addPolicy: 'CREATOR_MANAGERS',
  });
  await expect(
    f.member.auth.mutation(api.groupLists.mutations.addEntry, {
      toolId,
      version: 2,
      requestId: request(),
      text: 'Not allowed',
    })
  ).rejects.toThrow('creator');
  const entry = await f.creator.auth.mutation(
    api.groupLists.mutations.addEntry,
    { toolId, version: 2, requestId: request(), text: 'An Event contribution' }
  );
  await f.member.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
    entryId: entry.entryId,
    version: 2,
    expectedRevision: 1,
    completed: true,
  });
  expect(
    (
      await f.creator.auth.query(api.groupLists.queries.listEntries, {
        toolId,
        paginationOpts: page,
      })
    ).page[0]
  ).toMatchObject({
    completedById: f.member.personId,
    completedByName: 'event-settings-member',
  });
  await expect(
    f.outsider.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
      entryId: entry.entryId,
      version: 2,
      expectedRevision: 2,
      completed: false,
    })
  ).rejects.toThrow();
  await f.t.run(async ctx => {
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', f.creator.personId).eq('eventId', eventId)
      )
      .unique();
    if (membership) await ctx.db.delete(membership._id);
  });
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.configureList, {
      toolId,
      version: 2,
      title: 'Revoked Event creator',
    })
  ).rejects.toThrow();
  await expect(
    f.member.auth.query(api.groupLists.queries.getListForManagement, { toolId })
  ).rejects.toThrow('creator');
});
it('concurrent same-revision completion never fabricates a second actor and stale reopens cannot overwrite it', async () => {
  const f = await fixture('completion-concurrency');
  const result = await Promise.allSettled([
    f.creator.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
      entryId: f.entryId,
      version: 1,
      expectedRevision: 1,
      completed: true,
    }),
    f.owner.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
      entryId: f.entryId,
      version: 1,
      expectedRevision: 1,
      completed: true,
    }),
  ]);
  expect(result.some(value => value.status === 'fulfilled')).toBe(true);
  const row = await f.t.run(ctx => ctx.db.get(f.entryId));
  expect(row).toMatchObject({ completed: true, revision: 2 });
  expect([f.creator.personId, f.owner.personId]).toContain(row?.completedById);
  await expect(
    f.member.auth.mutation(api.groupLists.mutations.setEntryCompleted, {
      entryId: f.entryId,
      version: 1,
      expectedRevision: 1,
      completed: false,
    })
  ).rejects.toThrow('changed');
  expect((await f.t.run(ctx => ctx.db.get(f.entryId)))?.completedById).toBe(
    row?.completedById
  );
});
it('replays a removed add request without recreating it after a valid empty-list type change', async () => {
  const f = await fixture('type-replay');
  await f.member.auth.mutation(api.groupLists.mutations.removeEntry, {
    entryId: f.entryId,
    expectedRevision: 1,
  });
  const add = {
    toolId: f.toolId,
    version: 1,
    requestId: request(),
    text: 'Original request',
  };
  const created = await f.creator.auth.mutation(
    api.groupLists.mutations.addEntry,
    add
  );
  await f.creator.auth.mutation(api.groupLists.mutations.removeEntry, {
    entryId: created.entryId,
    expectedRevision: 1,
  });
  await f.creator.auth.mutation(api.groupLists.mutations.configureList, {
    toolId: f.toolId,
    version: 1,
    title: 'Empty Bring list',
    listType: 'BRING',
  });
  expect(
    await f.creator.auth.mutation(api.groupLists.mutations.addEntry, add)
  ).toMatchObject({ entryId: created.entryId, state: 'REMOVED' });
  expect(
    (
      await f.creator.auth.query(api.groupLists.queries.listEntries, {
        toolId: f.toolId,
        paginationOpts: page,
      })
    ).page
  ).toHaveLength(0);
});
it.each(['left', 'excluded'] as const)(
  'requires current Bring participation after author access is %s before deleting others’ claims',
  async restriction => {
    const f = await fixture(`bring-author-${restriction}`);
    const toolId = await f.creator.auth.mutation(
      api.groupLists.mutations.createList,
      {
        groupId: f.groupId,
        title: 'Shared Bring items',
        resultsVisibility: 'MEMBERS',
        listType: 'BRING',
      }
    );
    const first = await f.creator.auth.mutation(
      api.groupLists.mutations.addEntry,
      { toolId, version: 1, requestId: request(), text: 'Drinks', quantity: 3 }
    );
    const second = await f.creator.auth.mutation(
      api.groupLists.mutations.addEntry,
      { toolId, version: 1, requestId: request(), text: 'Cups', quantity: 4 }
    );
    for (const entryId of [first.entryId, second.entryId])
      await f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
        toolId,
        entryId,
        version: 1,
        expectedClaimRevision: 0,
        quantity: 2,
      });
    const before = await f.t.run(ctx =>
      ctx.db
        .query('groupListClaims')
        .withIndex('by_toolId', q => q.eq('toolId', toolId))
        .collect()
    );
    let exclusionId;
    if (restriction === 'left')
      await f.creator.auth.mutation(api.groupModeration.mutations.leaveGroup, {
        groupId: f.groupId,
      });
    else
      exclusionId = await f.t.run(ctx =>
        ctx.db.insert('communityExclusions', {
          groupId: f.groupId,
          personId: f.creator.personId,
          actorId: f.owner.personId,
          active: true,
          generation: 1,
          operationId: 'bring-author-exclusion',
          eventIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          cleanup: 'complete',
          conflicts: [],
        })
      );
    await expect(
      f.creator.auth.mutation(api.groupLists.mutations.removeEntry, {
        entryId: first.entryId,
        expectedRevision: 1,
      })
    ).rejects.toThrow();
    expect(
      await f.t.run(ctx =>
        ctx.db
          .query('groupListClaims')
          .withIndex('by_toolId', q => q.eq('toolId', toolId))
          .collect()
      )
    ).toEqual(before);
    expect(await f.t.run(ctx => ctx.db.get(first.entryId))).toMatchObject({
      claimedQuantity: 2,
      quantity: 3,
    });
    if (restriction === 'left')
      await f.t.run(ctx =>
        ctx.db.insert('groupMemberships', {
          groupId: f.groupId,
          personId: f.creator.personId,
          role: 'MEMBER',
          joinedAt: Date.now(),
        })
      );
    else await f.t.run(ctx => ctx.db.patch(exclusionId!, { active: false }));
    await f.creator.auth.mutation(api.groupLists.mutations.removeEntry, {
      entryId: first.entryId,
      expectedRevision: 1,
    });
    expect(await f.t.run(ctx => ctx.db.get(first.entryId))).toBeNull();
    expect(
      await f.t.run(ctx =>
        ctx.db
          .query('groupListClaims')
          .withIndex('by_entryId', q => q.eq('entryId', first.entryId))
          .collect()
      )
    ).toHaveLength(0);
    expect(
      await f.t.run(ctx =>
        ctx.db
          .query('groupListClaims')
          .withIndex('by_entryId', q => q.eq('entryId', second.entryId))
          .collect()
      )
    ).toHaveLength(1);
    await f.owner.auth.mutation(api.groupLists.mutations.removeEntry, {
      entryId: second.entryId,
      expectedRevision: 1,
    });
    expect(
      await f.t.run(ctx =>
        ctx.db
          .query('groupListClaims')
          .withIndex('by_toolId', q => q.eq('toolId', toolId))
          .collect()
      )
    ).toHaveLength(0);
  }
);
it('preserves orphaned ordinary own-entry recovery without allowing orphaned Bring claim deletion', async () => {
  const f = await fixture('orphaned-list-removal');
  await f.t.run(async ctx => {
    const state = await ctx.db
      .query('groupLists')
      .withIndex('by_toolId', q => q.eq('toolId', f.toolId))
      .unique();
    await ctx.db.delete(state!._id);
    await ctx.db.delete(f.toolId);
    await ctx.db.delete(f.memberships[1]);
  });
  await f.member.auth.mutation(api.groupLists.mutations.removeEntry, {
    entryId: f.entryId,
    expectedRevision: 1,
  });
  expect(await f.t.run(ctx => ctx.db.get(f.entryId))).toBeNull();
  const toolId = await f.creator.auth.mutation(
    api.groupLists.mutations.createList,
    {
      groupId: f.groupId,
      title: 'Orphaned Bring',
      resultsVisibility: 'MEMBERS',
      listType: 'BRING',
    }
  );
  const item = await f.creator.auth.mutation(
    api.groupLists.mutations.addEntry,
    { toolId, version: 1, requestId: request(), text: 'Food', quantity: 2 }
  );
  await f.owner.auth.mutation(api.groupLists.mutations.setBringClaim, {
    toolId,
    entryId: item.entryId,
    version: 1,
    expectedClaimRevision: 0,
    quantity: 1,
  });
  const before = await f.t.run(ctx =>
    ctx.db
      .query('groupListClaims')
      .withIndex('by_entryId', q => q.eq('entryId', item.entryId))
      .collect()
  );
  await f.t.run(async ctx => {
    const state = await ctx.db
      .query('groupLists')
      .withIndex('by_toolId', q => q.eq('toolId', toolId))
      .unique();
    await ctx.db.delete(state!._id);
    await ctx.db.delete(toolId);
  });
  await expect(
    f.creator.auth.mutation(api.groupLists.mutations.removeEntry, {
      entryId: item.entryId,
      expectedRevision: 1,
    })
  ).rejects.toThrow('Current Bring List access');
  expect(
    await f.t.run(ctx =>
      ctx.db
        .query('groupListClaims')
        .withIndex('by_entryId', q => q.eq('entryId', item.entryId))
        .collect()
    )
  ).toEqual(before);
  expect(await f.t.run(ctx => ctx.db.get(item.entryId))).toMatchObject({
    claimedQuantity: 1,
  });
});
it('does not disclose other authors’ private entry existence through creator settings', async () => {
  const f = await fixture('private-settings-projection');
  const toolId = await f.creator.auth.mutation(
    api.groupLists.mutations.createList,
    {
      groupId: f.groupId,
      title: 'Personal entries',
      resultsVisibility: 'MANAGERS',
    }
  );
  await f.member.auth.mutation(api.groupLists.mutations.addEntry, {
    toolId,
    version: 1,
    requestId: request(),
    text: 'Another author’s private contribution',
  });
  expect(
    await f.creator.auth.query(api.groupLists.queries.getListForManagement, {
      toolId,
    })
  ).toMatchObject({ canConfigure: true, canManage: false, hasEntries: false });
  expect(
    await f.owner.auth.query(api.groupLists.queries.getListForManagement, {
      toolId,
    })
  ).toMatchObject({ canConfigure: true, canManage: true, hasEntries: true });
  await f.creator.auth.mutation(api.groupLists.mutations.addEntry, {
    toolId,
    version: 1,
    requestId: request(),
    text: 'My own visible contribution',
  });
  expect(
    await f.creator.auth.query(api.groupLists.queries.getListForManagement, {
      toolId,
    })
  ).toMatchObject({ canConfigure: true, canManage: false, hasEntries: true });
});
