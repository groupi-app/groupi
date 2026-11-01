import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import { createTestInstance as baseTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { cleanupPersonClaims } from '../groupLists/bring';

const instances: ReturnType<typeof baseTestInstance>[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  for (const t of instances.splice(0))
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  vi.useRealTimers();
});
async function fixture(prefix: string, context: 'group' | 'event' = 'group') {
  const t = baseTestInstance();
  instances.push(t);
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, `${prefix}-owner`);
  const member = await createAuthAccount(t, `${prefix}-member`);
  const other = await createAuthAccount(t, `${prefix}-other`);
  const outsider = await createAuthAccount(t, `${prefix}-outsider`);
  const input = {
    title: 'Picnic supplies',
    listType: 'BRING' as const,
    addPolicy: 'CREATOR_MANAGERS' as const,
    resultsVisibility: 'MEMBERS' as const,
  };
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: `${prefix} Group`,
  });
  await t.run(async ctx => {
    for (const personId of [member.personId, other.personId])
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      });
  });
  const eventId = await t.run(async ctx => {
    const id = await ctx.db.insert('events', {
      potentialDateTimes: [],
      title: `${prefix} Event`,
      description: '',
      location: '',
      creatorId: owner.personId,
      timezone: 'UTC',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    for (const [personId, role] of [
      [owner.personId, 'ORGANIZER'],
      [member.personId, 'ATTENDEE'],
      [other.personId, 'ATTENDEE'],
    ] as const)
      await ctx.db.insert('memberships', {
        eventId: id,
        personId,
        role,
        rsvpStatus: 'YES',
      });
    return id;
  });
  const toolId =
    context === 'group'
      ? await owner.auth.mutation(api.groupLists.mutations.createList, {
          ...input,
          groupId,
        })
      : await owner.auth.mutation(api.eventContent.mutations.createList, {
          ...input,
          eventId,
        });
  const { entryId } = await owner.auth.mutation(
    api.groupLists.mutations.addEntry,
    {
      toolId,
      version: 1,
      requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      text: 'Picnic blankets',
      quantity: 3,
    }
  );
  return {
    t,
    owner,
    member,
    other,
    outsider,
    groupId,
    eventId,
    toolId,
    entryId,
  };
}

it.each(['group', 'event'] as const)(
  'keeps native %s quantities and authenticated claims separate from legacy Bring List state',
  async context => {
    const f = await fixture(`bring-${context}`, context);
    const legacy = await f.t.run(async ctx => {
      const configId = await ctx.db.insert('eventAddonConfigs', {
        eventId: f.eventId,
        addonType: 'bring-list',
        enabled: true,
        config: { items: [{ id: 'plates', name: 'Plates', quantity: 4 }] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const claimId = await ctx.db.insert('addonData', {
        eventId: f.eventId,
        addonType: 'bring-list',
        key: `claims:${f.member.personId}`,
        data: { plates: 2 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return {
        configId,
        claimId,
        config: await ctx.db.get(configId),
        claim: await ctx.db.get(claimId),
      };
    });
    const input = {
      toolId: f.toolId,
      entryId: f.entryId,
      version: 1,
      expectedClaimRevision: 0,
      quantity: 2,
    };
    expect(
      await f.member.auth.mutation(
        api.groupLists.mutations.setBringClaim,
        input
      )
    ).toEqual({ revision: 1, quantity: 2, totalClaimed: 2 });
    expect(
      await f.member.auth.mutation(
        api.groupLists.mutations.setBringClaim,
        input
      )
    ).toEqual({ revision: 1, quantity: 2, totalClaimed: 2 });
    const [summary] = await f.other.auth.query(
      api.groupLists.queries.listBringClaims,
      { toolId: f.toolId, entryIds: [f.entryId] }
    );
    expect(summary).toMatchObject({
      entryId: f.entryId,
      totalClaimed: 2,
      myQuantity: 0,
      myRevision: 0,
      claimants: [
        {
          personId: f.member.personId,
          name: `bring-${context}-member`,
          quantity: 2,
        },
      ],
    });
    expect(summary.claimants[0]).not.toHaveProperty('email');
    await expect(
      f.other.auth.mutation(api.groupLists.mutations.setBringClaim, {
        ...input,
        quantity: 2,
      })
    ).rejects.toThrow('Not enough');
    expect(
      await f.other.auth.mutation(api.groupLists.mutations.setBringClaim, {
        ...input,
        quantity: 1,
      })
    ).toMatchObject({ revision: 1, totalClaimed: 3 });
    expect(await f.t.run(ctx => ctx.db.get(f.entryId))).toMatchObject({
      claimedQuantity: 3,
      quantity: 3,
    });
    expect(await f.t.run(ctx => ctx.db.get(legacy.configId))).toEqual(
      legacy.config
    );
    expect(await f.t.run(ctx => ctx.db.get(legacy.claimId))).toEqual(
      legacy.claim
    );
  }
);

it('retains zero-quantity claim revisions so stale claims cannot be recreated after release', async () => {
  const f = await fixture('bring-tombstone');
  const base = { toolId: f.toolId, entryId: f.entryId, version: 1 };
  await f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
    ...base,
    expectedClaimRevision: 0,
    quantity: 2,
  });
  await f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
    ...base,
    expectedClaimRevision: 1,
    quantity: 0,
  });
  expect(
    (
      await f.member.auth.query(api.groupLists.queries.listBringClaims, {
        toolId: f.toolId,
        entryIds: [f.entryId],
      })
    )[0]
  ).toMatchObject({
    myQuantity: 0,
    myRevision: 2,
    totalClaimed: 0,
    claimants: [],
  });
  await expect(
    f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
      ...base,
      expectedClaimRevision: 0,
      quantity: 1,
    })
  ).rejects.toThrow('claim changed');
  expect(
    await f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
      ...base,
      expectedClaimRevision: 2,
      quantity: 1,
    })
  ).toMatchObject({ revision: 3, totalClaimed: 1 });
  const rows = await f.t.run(ctx => ctx.db.query('groupListClaims').collect());
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    personId: f.member.personId,
    quantity: 1,
    revision: 3,
  });
});

it('serializes competing claims within the required quantity', async () => {
  const f = await fixture('bring-compete');
  const input = {
    toolId: f.toolId,
    entryId: f.entryId,
    version: 1,
    expectedClaimRevision: 0,
    quantity: 2,
  };
  const results = await Promise.allSettled([
    f.member.auth.mutation(api.groupLists.mutations.setBringClaim, input),
    f.other.auth.mutation(api.groupLists.mutations.setBringClaim, input),
  ]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(
    1
  );
  const [summary] = await f.owner.auth.query(
    api.groupLists.queries.listBringClaims,
    { toolId: f.toolId, entryIds: [f.entryId] }
  );
  expect(summary.totalClaimed).toBe(2);
  expect(await f.t.run(ctx => ctx.db.get(f.entryId))).toMatchObject({
    claimedQuantity: 2,
  });
});

it('rejects outsiders, revoked members, disabled lists and cross-tool items on each read and mutation', async () => {
  const f = await fixture('bring-access');
  const input = {
    toolId: f.toolId,
    entryId: f.entryId,
    version: 1,
    expectedClaimRevision: 0,
    quantity: 1,
  };
  await expect(
    f.outsider.auth.mutation(api.groupLists.mutations.setBringClaim, input)
  ).rejects.toThrow();
  await expect(
    f.outsider.auth.query(api.groupLists.queries.listBringClaims, {
      toolId: f.toolId,
      entryIds: [],
    })
  ).rejects.toThrow();
  const otherTool = await f.owner.auth.mutation(
    api.eventContent.mutations.createList,
    {
      eventId: f.eventId,
      title: 'Event items',
      listType: 'BRING',
      resultsVisibility: 'MEMBERS',
    }
  );
  await expect(
    f.owner.auth.mutation(api.groupLists.mutations.setBringClaim, {
      ...input,
      toolId: otherTool,
    })
  ).rejects.toThrow('unavailable in this list');
  await expect(
    f.owner.auth.query(api.groupLists.queries.listBringClaims, {
      toolId: otherTool,
      entryIds: [f.entryId],
    })
  ).rejects.toThrow('unavailable in this list');
  await f.member.auth.mutation(api.groupLists.mutations.setBringClaim, input);
  await f.t.run(async ctx => {
    const membership = await ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId_and_personId', q =>
        q.eq('groupId', f.groupId).eq('personId', f.member.personId)
      )
      .unique();
    if (membership) await ctx.db.delete(membership._id);
  });
  await expect(
    f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
      ...input,
      expectedClaimRevision: 1,
      quantity: 0,
    })
  ).rejects.toThrow();
  await expect(
    f.member.auth.query(api.groupLists.queries.listBringClaims, {
      toolId: f.toolId,
      entryIds: [f.entryId],
    })
  ).rejects.toThrow();
  await f.owner.auth.mutation(api.groupTools.mutations.configureListPolicy, {
    groupId: f.groupId,
    enabled: false,
    creation: 'MANAGERS',
  });
  await expect(
    f.other.auth.mutation(api.groupLists.mutations.setBringClaim, input)
  ).rejects.toThrow();
});

it('rejects invalid quantities, revisions, unsupported modes and private claim visibility', async () => {
  const f = await fixture('bring-validation');
  const input = {
    toolId: f.toolId,
    entryId: f.entryId,
    version: 1,
    expectedClaimRevision: 0,
    quantity: 1,
  };
  for (const quantity of [-1, 0.5, 1000])
    await expect(
      f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
        ...input,
        quantity,
      })
    ).rejects.toThrow('integer');
  for (const expectedClaimRevision of [-1, 0.5])
    await expect(
      f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
        ...input,
        expectedClaimRevision,
      })
    ).rejects.toThrow('revision');
  await expect(
    f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
      ...input,
      version: 2,
    })
  ).rejects.toThrow('settings changed');
  await expect(
    f.member.auth.query(api.groupLists.queries.listBringClaims, {
      toolId: f.toolId,
      entryIds: [f.entryId, f.entryId],
    })
  ).rejects.toThrow('distinct');
  await f.t.run(ctx =>
    ctx.db.patch(f.toolId, { resultsVisibility: 'MANAGERS' })
  );
  await expect(
    f.owner.auth.mutation(api.groupLists.mutations.setBringClaim, input)
  ).rejects.toThrow('shared');
  await f.t.run(async ctx => {
    await ctx.db.patch(f.toolId, { resultsVisibility: 'MEMBERS' });
    const state = await ctx.db
      .query('groupLists')
      .withIndex('by_toolId', q => q.eq('toolId', f.toolId))
      .unique();
    if (state) await ctx.db.patch(state._id, { listType: 'SIMPLE' });
  });
  await expect(
    f.owner.auth.mutation(api.groupLists.mutations.setBringClaim, input)
  ).rejects.toThrow('quantity claims');
});

it('preserves claims during item edits and prevents lowering quantities below the claimed amount', async () => {
  const f = await fixture('bring-quantity-edit');
  await f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
    toolId: f.toolId,
    entryId: f.entryId,
    version: 1,
    expectedClaimRevision: 0,
    quantity: 2,
  });
  const edit = {
    entryId: f.entryId,
    version: 1,
    expectedRevision: 1,
    text: 'Large blankets',
    completed: false,
  };
  await expect(
    f.owner.auth.mutation(api.groupLists.mutations.editEntry, {
      ...edit,
      quantity: 1,
    })
  ).rejects.toThrow();
  await f.owner.auth.mutation(api.groupLists.mutations.editEntry, {
    ...edit,
    quantity: 4,
  });
  expect(await f.t.run(ctx => ctx.db.get(f.entryId))).toMatchObject({
    text: 'Large blankets',
    quantity: 4,
    claimedQuantity: 2,
  });
  expect(
    (
      await f.member.auth.query(api.groupLists.queries.listBringClaims, {
        toolId: f.toolId,
        entryIds: [f.entryId],
      })
    )[0]
  ).toMatchObject({ myQuantity: 2, myRevision: 1 });
});

it('releases deleted-account claims and cleans claims when items or lists are removed', async () => {
  const f = await fixture('bring-cleanup');
  const input = {
    toolId: f.toolId,
    entryId: f.entryId,
    version: 1,
    expectedClaimRevision: 0,
    quantity: 1,
  };
  await f.member.auth.mutation(api.groupLists.mutations.setBringClaim, input);
  await f.other.auth.mutation(api.groupLists.mutations.setBringClaim, input);
  await f.t.run(ctx => cleanupPersonClaims(ctx, f.member.personId));
  expect(await f.t.run(ctx => ctx.db.get(f.entryId))).toMatchObject({
    claimedQuantity: 1,
  });
  expect(
    await f.t.run(ctx =>
      ctx.db
        .query('groupListClaims')
        .withIndex('by_personId', q => q.eq('personId', f.member.personId))
        .collect()
    )
  ).toEqual([]);
  await f.owner.auth.mutation(api.groupLists.mutations.removeEntry, {
    entryId: f.entryId,
    expectedRevision: 1,
  });
  expect(
    await f.t.run(ctx => ctx.db.query('groupListClaims').collect())
  ).toEqual([]);
  const next = await f.owner.auth.mutation(api.groupLists.mutations.addEntry, {
    toolId: f.toolId,
    version: 1,
    requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abd`,
    text: 'Cups',
    quantity: 3,
  });
  await f.other.auth.mutation(api.groupLists.mutations.setBringClaim, {
    ...input,
    entryId: next.entryId,
  });
  await f.owner.auth.mutation(api.groupLists.mutations.deleteList, {
    toolId: f.toolId,
  });
  expect(
    await f.t.run(ctx => ctx.db.query('groupListClaims').collect())
  ).toEqual([]);
});

it('rechecks Event membership and keeps unrelated item identifiers out of claim queries', async () => {
  const f = await fixture('bring-event-revocation', 'event');
  const input = {
    toolId: f.toolId,
    entryId: f.entryId,
    version: 1,
    expectedClaimRevision: 0,
    quantity: 1,
  };
  await expect(
    f.outsider.auth.query(api.groupLists.queries.listBringClaims, {
      toolId: f.toolId,
      entryIds: [f.entryId],
    })
  ).rejects.toThrow();
  await expect(
    f.outsider.auth.mutation(api.groupLists.mutations.setBringClaim, input)
  ).rejects.toThrow();
  await f.member.auth.mutation(api.groupLists.mutations.setBringClaim, input);
  await f.t.run(async ctx => {
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', f.eventId))
      .filter(q => q.eq(q.field('personId'), f.member.personId))
      .unique();
    if (membership) await ctx.db.delete(membership._id);
  });
  await expect(
    f.member.auth.query(api.groupLists.queries.listBringClaims, {
      toolId: f.toolId,
      entryIds: [f.entryId],
    })
  ).rejects.toThrow();
  await expect(
    f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
      ...input,
      expectedClaimRevision: 1,
      quantity: 0,
    })
  ).rejects.toThrow();
  expect(
    (
      await f.owner.auth.query(api.groupLists.queries.listBringClaims, {
        toolId: f.toolId,
        entryIds: [f.entryId],
      })
    )[0].myQuantity
  ).toBe(0);
});

it('ignores accumulated zero tombstones when projecting active claims and checking capacity', async () => {
  const f = await fixture('bring-zero-ledger');
  await f.t.run(async ctx => {
    for (let i = 0; i < 200; i++) {
      const personId = await ctx.db.insert('persons', {
        userId: `retained-zero-${i}`,
      });
      await ctx.db.insert('groupListClaims', {
        toolId: f.toolId,
        groupId: f.groupId,
        entryId: f.entryId,
        personId,
        quantity: 0,
        revision: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  });
  const input = {
    toolId: f.toolId,
    entryId: f.entryId,
    version: 1,
    expectedClaimRevision: 0,
    quantity: 2,
  };
  await f.member.auth.mutation(api.groupLists.mutations.setBringClaim, input);
  await f.other.auth.mutation(api.groupLists.mutations.setBringClaim, {
    ...input,
    quantity: 1,
  });
  const [summary] = await f.member.auth.query(
    api.groupLists.queries.listBringClaims,
    { toolId: f.toolId, entryIds: [f.entryId] }
  );
  expect(summary).toMatchObject({
    totalClaimed: 3,
    myQuantity: 2,
    myRevision: 1,
    hasMoreClaimants: false,
  });
  expect(summary.claimants).toHaveLength(2);
  await expect(
    f.owner.auth.mutation(api.groupLists.mutations.setBringClaim, {
      ...input,
      quantity: 1,
    })
  ).rejects.toThrow('Not enough');
  expect(await f.t.run(ctx => ctx.db.get(f.entryId))).toMatchObject({
    claimedQuantity: 3,
  });
});

it('cannot overbook when a quantity reduction races a new claim', async () => {
  const f = await fixture('bring-capacity-race');
  const outcomes = await Promise.allSettled([
    f.owner.auth.mutation(api.groupLists.mutations.editEntry, {
      entryId: f.entryId,
      version: 1,
      expectedRevision: 1,
      text: 'Picnic blankets',
      completed: false,
      quantity: 1,
    }),
    f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
      toolId: f.toolId,
      entryId: f.entryId,
      version: 1,
      expectedClaimRevision: 0,
      quantity: 2,
    }),
  ]);
  expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(
    1
  );
  const entry = await f.t.run(ctx => ctx.db.get(f.entryId));
  expect(entry).not.toBeNull();
  expect(entry?.claimedQuantity ?? 0).toBeLessThanOrEqual(entry?.quantity ?? 0);
});

it('bounds claimant-name previews without losing totals or the viewer’s own claim', async () => {
  const f = await fixture('bring-preview');
  await f.owner.auth.mutation(api.groupLists.mutations.editEntry, {
    entryId: f.entryId,
    version: 1,
    expectedRevision: 1,
    text: 'Picnic blankets',
    completed: false,
    quantity: 10,
  });
  for (let i = 0; i < 7; i++) {
    const claimant = await createAuthAccount(f.t, `bring-preview-person-${i}`);
    await f.t.run(ctx =>
      ctx.db.insert('groupMemberships', {
        groupId: f.groupId,
        personId: claimant.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      })
    );
    await claimant.auth.mutation(api.groupLists.mutations.setBringClaim, {
      toolId: f.toolId,
      entryId: f.entryId,
      version: 1,
      expectedClaimRevision: 0,
      quantity: 1,
    });
  }
  await f.member.auth.mutation(api.groupLists.mutations.setBringClaim, {
    toolId: f.toolId,
    entryId: f.entryId,
    version: 1,
    expectedClaimRevision: 0,
    quantity: 2,
  });
  const [summary] = await f.member.auth.query(
    api.groupLists.queries.listBringClaims,
    { toolId: f.toolId, entryIds: [f.entryId] }
  );
  expect(summary).toMatchObject({
    totalClaimed: 9,
    myQuantity: 2,
    myRevision: 1,
    hasMoreClaimants: true,
  });
  expect(summary.claimants).toHaveLength(5);
});
