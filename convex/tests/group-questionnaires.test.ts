import { it, expect } from 'vitest';
import { api } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';
it('admits invited members immediately and retains private optional answers through edits, departure and return', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'form-owner'),
    member = await createAuthAccount(t, 'form-member'),
    outsider = await createAuthAccount(t, 'form-outsider');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Readers',
  });
  const questions = [
    {
      id: 'book',
      label: 'Favorite book',
      required: true,
      type: 'SHORT_ANSWER' as const,
    },
  ];
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    { groupId, enabled: true, questions }
  );
  const offer = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: member.personId }
  );
  expect(
    await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: offer.inviteId,
    })
  ).toMatchObject({
    joiningQuestionnaire: {
      enabled: true,
      completed: false,
      shouldPrompt: true,
    },
  });
  expect(
    await member.auth.query(api.groups.queries.getGroup, { groupId })
  ).toMatchObject({ viewerRole: 'MEMBER' });
  const form = await member.auth.query(
    api.groupQuestionnaires.queries.getJoiningQuestionnaire,
    { groupId }
  );
  await expect(
    outsider.auth.query(
      api.groupQuestionnaires.queries.getJoiningQuestionnaire,
      { groupId }
    )
  ).rejects.toThrow();
  expect(
    await outsider.auth.query(
      api.groupQuestionnaires.queries.getJoiningQuestionnaireAccess,
      { groupId }
    )
  ).toEqual({ canRead: false, hasRecord: false, isMember: false });
  await expect(
    member.auth.mutation(
      api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
      { groupId, version: form.version, answers: {} }
    )
  ).rejects.toThrow('Required');
  await member.auth.mutation(
    api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
    { groupId, version: form.version, answers: { book: 'Dune' } }
  );
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: true,
      questions: [{ ...questions[0], label: 'Your favorite book' }],
    }
  );
  expect(
    await member.auth.query(
      api.groupQuestionnaires.queries.getJoiningQuestionnaire,
      { groupId }
    )
  ).toMatchObject({
    completed: true,
    answers: { book: 'Dune' },
    savedQuestions: [{ label: 'Favorite book', version: 1 }],
  });
  await member.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId,
  });
  expect(
    await member.auth.query(
      api.groupQuestionnaires.queries.getJoiningQuestionnaire,
      { groupId }
    )
  ).toMatchObject({ canEdit: false, answers: { book: 'Dune' } });
  expect(
    await member.auth.query(
      api.groupQuestionnaires.queries.getJoiningQuestionnaireAccess,
      { groupId }
    )
  ).toEqual({ canRead: true, hasRecord: true, isMember: false });
  await expect(
    member.auth.mutation(
      api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
      { groupId, version: 2, answers: { book: 'Changed' } }
    )
  ).rejects.toThrow();
  const reoffer = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: member.personId }
  );
  expect(
    await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: reoffer.inviteId,
    })
  ).toMatchObject({
    joiningQuestionnaire: { completed: true, shouldPrompt: false },
  });
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: false,
      questions: [{ ...questions[0], type: 'LONG_ANSWER' }],
    }
  );
  expect(
    await member.auth.query(
      api.groupQuestionnaires.queries.getJoiningQuestionnaire,
      { groupId }
    )
  ).toMatchObject({
    enabled: false,
    shouldPrompt: false,
    savedQuestions: [{ label: 'Favorite book' }],
  });
});

it('versions only material changes, clears optional values, and preserves paginated private definitions', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'semantic-owner');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Semantic',
  });
  const questions = [
    {
      id: 'choice',
      label: 'Pick',
      type: 'CHECKBOXES' as const,
      required: true,
      options: ['A', 'B'],
    },
    {
      id: 'optional',
      label: 'Number',
      type: 'NUMBER' as const,
      required: false,
    },
  ];
  const first = await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    { groupId, enabled: true, questions }
  );
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
    {
      groupId,
      version: first.version,
      answers: { choice: ['A'], optional: 12 },
    }
  );
  const cosmetic = await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: true,
      questions: [
        questions[1],
        { ...questions[0], label: 'New label', options: ['B', 'A'] },
      ],
    }
  );
  expect(cosmetic).toMatchObject({
    completed: true,
    answers: { choice: ['A'], optional: 12 },
  });
  expect(cosmetic.questions.map(q => q.version)).toEqual([1, 1]);
  await expect(
    owner.auth.mutation(
      api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
      { groupId, version: first.version, answers: { choice: ['A'] } }
    )
  ).rejects.toThrow('reload');
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
    { groupId, version: cosmetic.version, answers: { choice: ['B'] } }
  );
  expect(
    (
      await owner.auth.query(
        api.groupQuestionnaires.queries.getJoiningQuestionnaire,
        { groupId }
      )
    ).answers
  ).toEqual({ choice: ['B'] });
  const material = await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    { groupId, enabled: true, questions: [{ ...questions[0], options: ['C'] }] }
  );
  expect(material).toMatchObject({
    completed: false,
    shouldPrompt: true,
    answers: {},
    questions: [{ version: 2 }],
  });
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    { groupId, enabled: true, questions: [] }
  );
  const restored = await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    { groupId, enabled: true, questions: [questions[0]] }
  );
  expect(restored.questions[0].version).toBe(3);
  expect(restored.answers).toEqual({});
  let cursor: string | null = null;
  const labels: string[] = [];
  do {
    const page = await owner.auth.query(
      api.groupQuestionnaires.queries.listJoiningQuestionnaireHistory,
      { groupId, paginationOpts: { numItems: 1, cursor } }
    );
    labels.push(...page.page.map(row => row.question.label));
    cursor = page.isDone ? null : page.continueCursor;
  } while (cursor);
  expect(labels).toEqual(['New label', 'Number', 'Number', 'Pick']);
});

it('validates all seven core question types at the authenticated public boundary', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'types-owner');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Types',
  });
  const questions = [
    {
      id: 'short',
      label: 'Short',
      type: 'SHORT_ANSWER' as const,
      required: true,
    },
    { id: 'long', label: 'Long', type: 'LONG_ANSWER' as const, required: true },
    {
      id: 'multi',
      label: 'Multi',
      type: 'MULTIPLE_CHOICE' as const,
      required: true,
      options: ['A', 'B'],
    },
    {
      id: 'check',
      label: 'Check',
      type: 'CHECKBOXES' as const,
      required: true,
      options: ['A', 'B'],
    },
    { id: 'num', label: 'Number', type: 'NUMBER' as const, required: true },
    {
      id: 'drop',
      label: 'Drop',
      type: 'DROPDOWN' as const,
      required: true,
      options: ['A'],
    },
    { id: 'yes', label: 'Yes', type: 'YES_NO' as const, required: true },
  ];
  const form = await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    { groupId, enabled: true, questions }
  );
  const answers = {
    short: 'Hi',
    long: 'Longer',
    multi: 'B',
    check: ['A', 'B'],
    num: 0,
    drop: 'A',
    yes: false,
  };
  for (const [id, value] of Object.entries({
    short: 42,
    long: [],
    multi: 'Z',
    check: ['A', 'A'],
    num: '12',
    drop: false,
    yes: 'yes',
    unknown: 'hidden',
  }))
    await expect(
      owner.auth.mutation(
        api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
        { groupId, version: form.version, answers: { ...answers, [id]: value } }
      )
    ).rejects.toThrow();
  expect(
    await owner.auth.mutation(
      api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
      { groupId, version: form.version, answers }
    )
  ).toMatchObject({ completed: true, answers });
  await expect(
    owner.auth.mutation(
      api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
      { groupId, enabled: true, questions: [questions[0], questions[0]] }
    )
  ).rejects.toThrow('duplicate');
});

it('retained own records never grant new private definitions after departure or a Group ban', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'retained-owner'),
    former = await createAuthAccount(t, 'retained-former'),
    banned = await createAuthAccount(t, 'retained-banned');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Private forms',
  });
  const first = await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: true,
      questions: [
        {
          id: 'old',
          label: 'Original definition',
          type: 'SHORT_ANSWER',
          required: true,
        },
      ],
    }
  );
  for (const person of [former, banned]) {
    const invite = await owner.auth.mutation(
      api.groupInvites.mutations.sendGroupInvite,
      { groupId, inviteePersonId: person.personId }
    );
    await person.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
      inviteId: invite.inviteId,
    });
    await person.auth.mutation(
      api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
      {
        groupId,
        version: first.version,
        answers: { old: 'Retained own answer' },
      }
    );
  }
  await former.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId,
  });
  await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
    groupId,
    personId: banned.personId,
  });
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: true,
      questions: [
        {
          id: 'old',
          label: 'Private replacement',
          type: 'LONG_ANSWER',
          required: true,
        },
        {
          id: 'new',
          label: 'New private question',
          type: 'YES_NO',
          required: true,
        },
      ],
    }
  );
  for (const person of [former, banned]) {
    const view = await person.auth.query(
      api.groupQuestionnaires.queries.getJoiningQuestionnaire,
      { groupId }
    );
    expect(view).toMatchObject({
      version: first.version,
      questions: [{ id: 'old', label: 'Original definition', version: 1 }],
      answers: { old: 'Retained own answer' },
      canEdit: false,
      shouldPrompt: false,
    });
    expect(view.questions).toHaveLength(1);
    expect(
      (
        await person.auth.query(
          api.groupQuestionnaires.queries.listJoiningQuestionnaireHistory,
          { groupId, paginationOpts: { numItems: 20, cursor: null } }
        )
      ).page
    ).toHaveLength(1);
  }
});
