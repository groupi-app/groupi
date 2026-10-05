import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('Persistent ordinary Group forms through authenticated sessions', () => {
  it('keeps multiple ordinary forms independent and enforces manager-default creation', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'forms-owner');
    const member = await createAuthAccount(t, 'forms-member');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Readers' }
    );
    await t.run(async ctx => {
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      });
    });
    const input = {
      groupId,
      title: 'Feedback',
      resultsVisibility: 'MANAGERS' as const,
      questions: [
        {
          id: 'book',
          label: 'Favorite book',
          type: 'SHORT_ANSWER' as const,
          required: true,
        },
      ],
    };
    await expect(
      member.auth.mutation(api.groupForms.mutations.createForm, input)
    ).rejects.toThrow('creation');
    const first = await owner.auth.mutation(
      api.groupForms.mutations.createForm,
      input
    );
    const second = await owner.auth.mutation(
      api.groupForms.mutations.createForm,
      { ...input, title: 'Other' }
    );
    expect(first).not.toBe(second);
    await member.auth.mutation(api.groupForms.mutations.submitResponse, {
      toolId: first,
      version: 1,
      expectedRevision: 0,
      answers: { book: 'Dune' },
    });
    expect(
      await member.auth.query(api.groupForms.queries.getForm, { toolId: first })
    ).toMatchObject({
      title: 'Feedback',
      answers: { book: 'Dune' },
      resultsVisibility: 'MANAGERS',
    });
    expect(
      await member.auth.query(
        api.groupQuestionnaires.queries.getJoiningQuestionnaire,
        { groupId }
      )
    ).toMatchObject({ requiredCompletion: false });
  });
});

it('preserves question snapshots on edits, rejects stale submissions, and moderates anonymous shared responses', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'forms-snapshot-owner');
  const member = await createAuthAccount(t, 'forms-snapshot-member');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Snapshots',
  });
  await t.run(ctx =>
    ctx.db.insert('groupMemberships', {
      groupId,
      personId: member.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    })
  );
  const questions = [
    {
      id: 'book',
      label: 'Book',
      type: 'SHORT_ANSWER' as const,
      required: true,
    },
  ];
  const toolId = await owner.auth.mutation(
    api.groupForms.mutations.createForm,
    { groupId, title: 'Shared', resultsVisibility: 'MEMBERS', questions }
  );
  await member.auth.mutation(api.groupForms.mutations.submitResponse, {
    toolId,
    version: 1,
    expectedRevision: 0,
    answers: { book: 'Dune' },
  });
  await owner.auth.mutation(api.groupForms.mutations.configureForm, {
    toolId,
    version: 1,
    title: 'Renamed',
    questions: [
      { id: 'rating', label: 'Rating', type: 'NUMBER', required: true },
    ],
  });
  await expect(
    member.auth.mutation(api.groupForms.mutations.submitResponse, {
      toolId,
      version: 1,
      expectedRevision: 1,
      answers: { book: 'Other' },
    })
  ).rejects.toThrow('configuration changed');
  expect(
    (
      await member.auth.query(api.groupForms.queries.getOwnHistory, {
        toolId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page[0]
  ).toMatchObject({ questions, answers: { book: 'Dune' } });
  await member.auth.mutation(api.users.mutations.deleteUserAccount, {
    confirmation: 'forms-snapshot-member',
  });
  const results = await owner.auth.query(api.groupForms.queries.listResults, {
    toolId,
    paginationOpts: { numItems: 20, cursor: null },
  });
  expect(results.page).toHaveLength(1);
  expect(results.page[0].personId).toBeUndefined();
  await owner.auth.mutation(api.groupForms.mutations.removeResult, {
    responseId: results.page[0]._id,
  });
  expect(
    (
      await owner.auth.query(api.groupForms.queries.listResults, {
        toolId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page
  ).toEqual([]);
});

it('lets only the owner change creation policy and preserves recovery when disabled or onboarding becomes required', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'forms-policy-owner');
  const member = await createAuthAccount(t, 'forms-policy-member');
  const manager = await createAuthAccount(t, 'forms-policy-manager');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Policies',
  });
  await t.run(async ctx => {
    for (const [personId, role] of [
      [member.personId, 'MEMBER'],
      [manager.personId, 'MODERATOR'],
    ] as const)
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId,
        role,
        joinedAt: Date.now(),
      });
  });
  await expect(
    manager.auth.mutation(api.groupTools.mutations.configureFormPolicy, {
      groupId,
      enabled: true,
      creation: 'MEMBERS',
    })
  ).rejects.toThrow();
  await owner.auth.mutation(api.groupTools.mutations.configureFormPolicy, {
    groupId,
    enabled: true,
    creation: 'MEMBERS',
  });
  const toolId = await member.auth.mutation(
    api.groupForms.mutations.createForm,
    {
      groupId,
      title: 'Member created',
      resultsVisibility: 'MANAGERS',
      questions: [
        { id: 'name', label: 'Name', type: 'SHORT_ANSWER', required: true },
      ],
    }
  );
  await member.auth.mutation(api.groupForms.mutations.submitResponse, {
    toolId,
    version: 1,
    expectedRevision: 0,
    answers: { name: 'Before' },
  });
  await expect(
    member.auth.query(api.groupForms.queries.listResults, {
      toolId,
      paginationOpts: { numItems: 20, cursor: null },
    })
  ).rejects.toThrow();
  await owner.auth.mutation(api.groupTools.mutations.configureFormPolicy, {
    groupId,
    enabled: false,
    creation: 'MEMBERS',
  });
  await expect(
    member.auth.query(api.groupForms.queries.getForm, { toolId })
  ).rejects.toThrow('disabled');
  expect(
    (
      await member.auth.query(api.groupForms.queries.getOwnHistory, {
        toolId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page
  ).toHaveLength(1);
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: true,
      requiredCompletion: true,
      questions: [
        {
          id: 'intro',
          label: 'Introduction',
          type: 'SHORT_ANSWER',
          required: true,
        },
      ],
    }
  );
  await expect(
    manager.auth.mutation(api.groupForms.mutations.configureForm, {
      toolId,
      version: 1,
      title: 'Denied',
      questions: [],
    })
  ).rejects.toThrow('onboarding');
  await expect(
    owner.auth.mutation(api.groupForms.mutations.deleteForm, { toolId })
  ).rejects.toThrow('onboarding');
  // Owner policy is the narrow core recovery path, not a manager content exemption.
  await owner.auth.mutation(api.groupTools.mutations.configureFormPolicy, {
    groupId,
    enabled: true,
    creation: 'MANAGERS',
  });
  await member.auth.mutation(api.groupForms.mutations.removeResponse, {
    toolId,
  });
  expect(
    (
      await member.auth.query(api.groupForms.queries.getOwnHistory, {
        toolId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page
  ).toEqual([]);
});
it('recovers exact submissions without duplicate history and rejects concurrent changed bodies against stale response revisions', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'forms-replay-owner');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Replay',
  });
  const toolId = await owner.auth.mutation(
    api.groupForms.mutations.createForm,
    {
      groupId,
      title: 'Replay',
      resultsVisibility: 'MANAGERS',
      questions: [
        { id: 'answer', label: 'Answer', type: 'SHORT_ANSWER', required: true },
      ],
    }
  );
  const input = {
    toolId,
    version: 1,
    expectedRevision: 0,
    answers: { answer: 'Same' },
  };
  expect(
    await Promise.all([
      owner.auth.mutation(api.groupForms.mutations.submitResponse, input),
      owner.auth.mutation(api.groupForms.mutations.submitResponse, input),
    ])
  ).toEqual([{ revision: 1 }, { revision: 1 }]);
  expect(
    (
      await owner.auth.query(api.groupForms.queries.getOwnHistory, {
        toolId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page
  ).toHaveLength(1);
  const outcomes = await Promise.allSettled(
    ['One', 'Two'].map(answer =>
      owner.auth.mutation(api.groupForms.mutations.submitResponse, {
        toolId,
        version: 1,
        expectedRevision: 1,
        answers: { answer },
      })
    )
  );
  expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(
    1
  );
  expect(outcomes.filter(result => result.status === 'rejected')).toHaveLength(
    1
  );
  expect(
    (
      await owner.auth.query(api.groupForms.queries.getOwnHistory, {
        toolId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page
  ).toHaveLength(2);
});
it('retains only original own snapshots for former or banned authors and purges all form instances on Group retirement', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'forms-history-owner');
  const member = await createAuthAccount(t, 'forms-history-member');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'History',
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
    api.groupForms.mutations.createForm,
    {
      groupId,
      title: 'Private',
      resultsVisibility: 'MANAGERS',
      questions: [
        { id: 'old', label: 'Original', type: 'SHORT_ANSWER', required: true },
      ],
    }
  );
  await member.auth.mutation(api.groupForms.mutations.submitResponse, {
    toolId,
    version: 1,
    expectedRevision: 0,
    answers: { old: 'Mine' },
  });
  await owner.auth.mutation(api.groupForms.mutations.configureForm, {
    toolId,
    version: 1,
    title: 'Private now',
    questions: [
      {
        id: 'later',
        label: 'Later private question',
        type: 'SHORT_ANSWER',
        required: true,
      },
    ],
  });
  await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
    groupId,
    personId: member.personId,
  });
  await expect(
    member.auth.query(api.groupForms.queries.getForm, { toolId })
  ).rejects.toThrow();
  const history = await member.auth.query(
    api.groupForms.queries.getOwnHistory,
    { toolId, paginationOpts: { numItems: 20, cursor: null } }
  );
  expect(history.page[0].questions.map(question => question.label)).toEqual([
    'Original',
  ]);
  expect(JSON.stringify(history)).not.toContain('Later private question');
  await owner.auth.mutation(api.groups.mutations.deleteGroup, { groupId });
  expect(await t.run(ctx => ctx.db.get(toolId))).toBeNull();
  expect(
    (
      await member.auth.query(api.groupForms.queries.getOwnHistory, {
        toolId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page
  ).toEqual([]);
  expect(
    await t.run(async ctx =>
      Promise.all(
        [
          'groupForms',
          'groupFormResponses',
          'groupFormRevisions',
          'groupToolPolicies',
        ].map(table => ctx.db.query(table as 'groupForms').collect())
      )
    )
  ).toEqual([[], [], [], []]);
});

it('preserves compatible choice answers on cosmetic edits/reordering but requires review after option or type changes', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'forms-compatible-owner');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Compatibility',
  });
  const toolId = await owner.auth.mutation(
    api.groupForms.mutations.createForm,
    {
      groupId,
      title: 'Choice',
      resultsVisibility: 'MANAGERS',
      questions: [
        {
          id: 'choice',
          label: 'Choice',
          type: 'MULTIPLE_CHOICE',
          options: ['Blue', 'Red'],
          required: true,
        },
      ],
    }
  );
  await owner.auth.mutation(api.groupForms.mutations.submitResponse, {
    toolId,
    version: 1,
    expectedRevision: 0,
    answers: { choice: 'Blue' },
  });
  await owner.auth.mutation(api.groupForms.mutations.configureForm, {
    toolId,
    version: 1,
    title: 'Choice',
    questions: [
      {
        id: 'choice',
        label: 'Renamed',
        type: 'MULTIPLE_CHOICE',
        options: ['Red', 'Blue'],
        required: true,
      },
    ],
  });
  expect(
    (await owner.auth.query(api.groupForms.queries.getForm, { toolId })).answers
  ).toEqual({ choice: 'Blue' });
  await owner.auth.mutation(api.groupForms.mutations.configureForm, {
    toolId,
    version: 2,
    title: 'Choice',
    questions: [
      {
        id: 'choice',
        label: 'Different choices',
        type: 'MULTIPLE_CHOICE',
        options: ['Green', 'Red'],
        required: true,
      },
    ],
  });
  expect(
    (await owner.auth.query(api.groupForms.queries.getForm, { toolId })).answers
  ).toEqual({});
  expect(
    (
      await owner.auth.query(api.groupForms.queries.getOwnHistory, {
        toolId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page[0]
  ).toMatchObject({
    questions: [{ label: 'Choice', options: ['Blue', 'Red'] }],
    answers: { choice: 'Blue' },
  });
  await expect(
    owner.auth.mutation(api.groupForms.mutations.submitResponse, {
      toolId,
      version: 3,
      expectedRevision: 1,
      answers: { choice: 'Blue' },
    })
  ).rejects.toThrow();
});

it('rechecks current manager authority after authentication and prevents stale-author resurrection during deletion', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'forms-write-owner');
  const author = await createAuthAccount(t, 'forms-write-author');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Write races',
  });
  const membershipId = await t.run(ctx =>
    ctx.db.insert('groupMemberships', {
      groupId,
      personId: author.personId,
      role: 'MODERATOR',
      joinedAt: Date.now(),
    })
  );
  const toolId = await author.auth.mutation(
    api.groupForms.mutations.createForm,
    {
      groupId,
      title: 'Private',
      resultsVisibility: 'MANAGERS',
      questions: [
        { id: 'answer', label: 'Answer', type: 'SHORT_ANSWER', required: true },
      ],
    }
  );
  // This captures the same principal REST authentication passed to an internal write.
  const stalePrincipal = author.personId;
  await t.run(ctx => ctx.db.patch(membershipId, { role: 'MEMBER' }));
  const { internal } = await import('../_generated/api');
  await expect(
    t.mutation(internal.groupForms.rest.configure, {
      personId: stalePrincipal,
      groupId,
      toolId,
      version: 1,
      title: 'Denied stale manager',
      questions: [],
    })
  ).rejects.toThrow();
  const outcomes = await Promise.allSettled([
    t.mutation(internal.groupForms.rest.submit, {
      personId: stalePrincipal,
      groupId,
      toolId,
      version: 1,
      expectedRevision: 0,
      answers: { answer: 'Racing' },
    }),
    author.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'forms-write-author',
    }),
  ]);
  expect(outcomes[1].status).toBe('fulfilled');
  expect(
    await t.run(ctx =>
      ctx.db
        .query('groupFormResponses')
        .withIndex('by_personId', q => q.eq('personId', stalePrincipal))
        .collect()
    )
  ).toEqual([]);
  expect(
    await t.run(ctx =>
      ctx.db
        .query('groupFormRevisions')
        .withIndex('by_personId', q => q.eq('personId', stalePrincipal))
        .collect()
    )
  ).toEqual([]);
  await expect(
    t.mutation(internal.groupForms.rest.submit, {
      personId: stalePrincipal,
      groupId,
      toolId,
      version: 1,
      expectedRevision: 0,
      answers: { answer: 'After deletion' },
    })
  ).rejects.toThrow();
});
it('serializes competing configuration versions and validates bounded page cursors', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'forms-config-owner');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Configuration races',
  });
  const toolId = await owner.auth.mutation(
    api.groupForms.mutations.createForm,
    {
      groupId,
      title: 'Versioned',
      resultsVisibility: 'MANAGERS',
      questions: [],
    }
  );
  const outcomes = await Promise.allSettled(
    ['One', 'Two'].map(title =>
      owner.auth.mutation(api.groupForms.mutations.configureForm, {
        toolId,
        version: 1,
        title,
        questions: [],
      })
    )
  );
  expect(
    outcomes.filter(outcome => outcome.status === 'fulfilled')
  ).toHaveLength(1);
  expect(
    outcomes.filter(outcome => outcome.status === 'rejected')
  ).toHaveLength(1);
  expect(
    (await owner.auth.query(api.groupForms.queries.getForm, { toolId })).version
  ).toBe(2);
  await expect(
    owner.auth.query(api.groupForms.queries.listForms, {
      groupId,
      paginationOpts: { numItems: 101, cursor: null },
    })
  ).rejects.toThrow('page size');
  await expect(
    owner.auth.query(api.groupForms.queries.listForms, {
      groupId,
      paginationOpts: { numItems: 20, cursor: 'x'.repeat(4097) },
    })
  ).rejects.toThrow('cursor');
});
