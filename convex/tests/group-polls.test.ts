import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
const instances: ReturnType<typeof createTestInstance>[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  for (const t of instances.splice(0))
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  vi.useRealTimers();
});
it('creates independent polls, discloses visibility and saves one duplicate-safe vote under manager-default policy', async () => {
  const t = createTestInstance();
  instances.push(t);
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'poll-owner');
  const member = await createAuthAccount(t, 'poll-member');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Poll readers',
  });
  const invitation = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: member.personId }
  );
  await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: invitation.inviteId,
  });
  const input = {
    groupId,
    title: 'Next book',
    mode: 'SINGLE' as const,
    options: [
      { id: 'dune', label: 'Dune' },
      { id: 'earthsea', label: 'Earthsea' },
    ],
    resultsVisibility: 'MANAGERS' as const,
  };
  await expect(
    member.auth.mutation(api.groupPolls.mutations.createPoll, input)
  ).rejects.toThrow('creation');
  const before = await owner.auth.query(
    api.notifications.queries.fetchNotificationsForPerson,
    {}
  );
  const toolId = await owner.auth.mutation(
    api.groupPolls.mutations.createPoll,
    input
  );
  expect(
    await owner.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    )
  ).toEqual(before);
  expect(
    await member.auth.query(api.groupPolls.queries.getPoll, { toolId })
  ).toMatchObject({
    resultsVisibility: 'MANAGERS',
    selections: [],
    voteRevision: 0,
    mode: 'SINGLE',
  });
  const vote = {
    toolId,
    version: 1,
    expectedRevision: 0,
    selections: ['dune'],
  };
  expect(
    await Promise.all([
      member.auth.mutation(api.groupPolls.mutations.submitVote, vote),
      member.auth.mutation(api.groupPolls.mutations.submitVote, vote),
    ])
  ).toEqual([{ revision: 1 }, { revision: 1 }]);
  expect(
    (
      await member.auth.query(api.groupPolls.queries.getOwnHistory, {
        toolId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page
  ).toHaveLength(1);
  await expect(
    member.auth.query(api.groupPolls.queries.listResults, {
      toolId,
      paginationOpts: { numItems: 20, cursor: null },
    })
  ).rejects.toThrow();
  const results = await owner.auth.query(api.groupPolls.queries.listResults, {
    toolId,
    paginationOpts: { numItems: 20, cursor: null },
  });
  expect(results.page).toHaveLength(1);
  expect(results.page[0]).toMatchObject({
    selections: ['dune'],
    isCurrent: true,
  });
});
async function setup(
  suffix: string,
  visibility: 'MANAGERS' | 'MEMBERS' = 'MEMBERS'
) {
  const t = createTestInstance();
  instances.push(t);
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, `poll-owner-${suffix}`),
    member = await createAuthAccount(t, `poll-member-${suffix}`),
    outsider = await createAuthAccount(t, `poll-outsider-${suffix}`);
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Persistent polls',
  });
  const sent = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: member.personId }
  );
  await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: sent.inviteId,
  });
  const definition = {
    title: 'Book',
    mode: 'MULTIPLE' as const,
    options: [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
    ],
  };
  const toolId = await owner.auth.mutation(
    api.groupPolls.mutations.createPoll,
    { groupId, ...definition, resultsVisibility: visibility }
  );
  return { t, owner, member, outsider, groupId, toolId, definition };
}
it('validates single/multiple choices, edits once, rejects stale edits and removal, and removes own private history without stale resurrection', async () => {
  const { member, owner, toolId, definition } = await setup('vote-rules');
  for (const selections of [[], ['a', 'a'], ['unknown']])
    await expect(
      member.auth.mutation(api.groupPolls.mutations.submitVote, {
        toolId,
        version: 1,
        expectedRevision: 0,
        selections,
      })
    ).rejects.toThrow('Select');
  expect(
    await member.auth.mutation(api.groupPolls.mutations.submitVote, {
      toolId,
      version: 1,
      expectedRevision: 0,
      selections: ['b', 'a'],
    })
  ).toEqual({ revision: 1 });
  expect(
    await member.auth.mutation(api.groupPolls.mutations.submitVote, {
      toolId,
      version: 1,
      expectedRevision: 0,
      selections: ['a', 'b'],
    })
  ).toEqual({ revision: 1 });
  expect(
    await member.auth.mutation(api.groupPolls.mutations.submitVote, {
      toolId,
      version: 1,
      expectedRevision: 1,
      selections: ['b'],
    })
  ).toEqual({ revision: 2 });
  await expect(
    member.auth.mutation(api.groupPolls.mutations.submitVote, {
      toolId,
      version: 1,
      expectedRevision: 1,
      selections: ['a'],
    })
  ).rejects.toThrow('vote changed');
  await expect(
    member.auth.mutation(api.groupPolls.mutations.removeVote, {
      toolId,
      expectedRevision: 1,
    })
  ).rejects.toThrow('vote changed');
  await member.auth.mutation(api.groupPolls.mutations.removeVote, {
    toolId,
    expectedRevision: 2,
  });
  await member.auth.mutation(api.groupPolls.mutations.removeVote, {
    toolId,
    expectedRevision: 2,
  });
  expect(
    await member.auth.query(api.groupPolls.queries.getPoll, { toolId })
  ).toMatchObject({ voteRevision: 3, selections: [] });
  expect(
    (
      await member.auth.query(api.groupPolls.queries.getOwnHistory, {
        toolId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page
  ).toEqual([]);
  await expect(
    member.auth.mutation(api.groupPolls.mutations.submitVote, {
      toolId,
      version: 1,
      expectedRevision: 2,
      selections: ['a'],
    })
  ).rejects.toThrow('vote changed');
  await owner.auth.mutation(api.groupPolls.mutations.configurePoll, {
    toolId,
    version: 1,
    ...definition,
    mode: 'SINGLE',
  });
  await expect(
    member.auth.mutation(api.groupPolls.mutations.submitVote, {
      toolId,
      version: 2,
      expectedRevision: 3,
      selections: ['a', 'b'],
    })
  ).rejects.toThrow('Select');
});
it('preserves cosmetic vote validity, marks material changes historical and retains bounded definition snapshots', async () => {
  const { member, owner, toolId, definition } = await setup('versions');
  await member.auth.mutation(api.groupPolls.mutations.submitVote, {
    toolId,
    version: 1,
    expectedRevision: 0,
    selections: ['a'],
  });
  await owner.auth.mutation(api.groupPolls.mutations.configurePoll, {
    toolId,
    version: 1,
    ...definition,
    title: 'Renamed',
    options: [
      { id: 'b', label: 'B renamed' },
      { id: 'a', label: 'A renamed' },
    ],
  });
  expect(
    await member.auth.query(api.groupPolls.queries.getPoll, { toolId })
  ).toMatchObject({ version: 2, semanticVersion: 1, selections: ['a'] });
  await expect(
    member.auth.mutation(api.groupPolls.mutations.submitVote, {
      toolId,
      version: 1,
      expectedRevision: 1,
      selections: ['b'],
    })
  ).rejects.toThrow('configuration changed');
  await owner.auth.mutation(api.groupPolls.mutations.configurePoll, {
    toolId,
    version: 2,
    ...definition,
    options: [...definition.options, { id: 'c', label: 'Gamma' }],
  });
  expect(
    await member.auth.query(api.groupPolls.queries.getPoll, { toolId })
  ).toMatchObject({
    version: 3,
    semanticVersion: 2,
    selections: [],
    savedOptions: definition.options,
  });
  const old = await member.auth.query(api.groupPolls.queries.listResults, {
    toolId,
    paginationOpts: { numItems: 1, cursor: null },
  });
  expect(old.page[0]).toMatchObject({ selections: ['a'], isCurrent: false });
  expect(
    (
      await member.auth.query(api.groupPolls.queries.getOwnHistory, {
        toolId,
        paginationOpts: { numItems: 1, cursor: null },
      })
    ).page[0]
  ).toMatchObject({
    version: 1,
    options: definition.options,
    selections: ['a'],
  });
  await member.auth.mutation(api.groupPolls.mutations.submitVote, {
    toolId,
    version: 3,
    expectedRevision: 1,
    selections: ['c'],
  });
  const history = await member.auth.query(
    api.groupPolls.queries.getOwnHistory,
    { toolId, paginationOpts: { numItems: 1, cursor: null } }
  );
  expect(history.isDone).toBe(false);
  expect(
    (
      await member.auth.query(api.groupPolls.queries.getOwnHistory, {
        toolId,
        paginationOpts: { numItems: 1, cursor: history.continueCursor },
      })
    ).page[0].selections
  ).toEqual(['a']);
  await expect(
    owner.auth.mutation(api.groupPolls.mutations.configurePoll, {
      toolId,
      version: 2,
      ...definition,
    })
  ).rejects.toThrow('configuration changed');
});
it('retains disabled manager configuration without interaction/onboarding bypass and grants optional member creation without management', async () => {
  const { owner, member, outsider, toolId, groupId, definition } =
    await setup('availability');
  await owner.auth.mutation(api.groupTools.mutations.configurePollPolicy, {
    groupId,
    enabled: true,
    creation: 'MEMBERS',
  });
  const memberTool = await member.auth.mutation(
    api.groupPolls.mutations.createPoll,
    { groupId, ...definition, resultsVisibility: 'MEMBERS' }
  );
  await expect(
    member.auth.mutation(api.groupPolls.mutations.configurePoll, {
      toolId: memberTool,
      version: 1,
      ...definition,
    })
  ).rejects.toThrow();
  await expect(
    outsider.auth.query(api.groupPolls.queries.getPoll, { toolId })
  ).rejects.toThrow();
  await expect(
    member.auth.mutation(api.groupTools.mutations.configurePollPolicy, {
      groupId,
      enabled: false,
      creation: 'MEMBERS',
    })
  ).rejects.toThrow();
  await owner.auth.mutation(api.groupTools.mutations.configurePollPolicy, {
    groupId,
    enabled: false,
    creation: 'MANAGERS',
  });
  expect(
    (
      await owner.auth.query(api.groupPolls.queries.listPolls, {
        groupId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page
  ).toHaveLength(2);
  expect(
    await owner.auth.query(api.groupPolls.queries.getPollForManagement, {
      toolId,
    })
  ).toMatchObject({ canManage: true, options: definition.options });
  await owner.auth.mutation(api.groupPolls.mutations.configurePoll, {
    toolId,
    version: 1,
    ...definition,
    title: 'Managed disabled',
  });
  await expect(
    owner.auth.query(api.groupPolls.queries.getPoll, { toolId })
  ).rejects.toThrow('disabled');
  await expect(
    member.auth.query(api.groupPolls.queries.listPolls, {
      groupId,
      paginationOpts: { numItems: 20, cursor: null },
    })
  ).rejects.toThrow();
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: true,
      requiredCompletion: true,
      questions: [
        { id: 'intro', label: 'Intro', type: 'SHORT_ANSWER', required: true },
      ],
    }
  );
  await expect(
    owner.auth.query(api.groupPolls.queries.getPollForManagement, { toolId })
  ).rejects.toThrow('Complete');
});
it('preserves own snapshots after leave and disabled type without exposing new private config; former members cannot vote; independent Events stay unchanged', async () => {
  const { owner, member, toolId, groupId, definition } = await setup(
    'recovery',
    'MANAGERS'
  );
  await member.auth.mutation(api.groupPolls.mutations.submitVote, {
    toolId,
    version: 1,
    expectedRevision: 0,
    selections: ['a'],
  });
  const event = await member.auth.mutation(api.events.mutations.createEvent, {
    title: 'Independent',
    chosenDateTime: '2027-01-01T12:00:00Z',
  });
  await member.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId,
  });
  await owner.auth.mutation(api.groupPolls.mutations.configurePoll, {
    toolId,
    version: 1,
    ...definition,
    options: [
      { id: 'new', label: 'Private new option' },
      { id: 'other', label: 'Private other' },
    ],
  });
  await owner.auth.mutation(api.groupTools.mutations.configurePollPolicy, {
    groupId,
    enabled: false,
    creation: 'MANAGERS',
  });
  const history = await member.auth.query(
    api.groupPolls.queries.getOwnHistory,
    { toolId, paginationOpts: { numItems: 20, cursor: null } }
  );
  expect(history.page[0].options).toEqual(definition.options);
  expect(JSON.stringify(history)).not.toContain('Private new');
  await expect(
    member.auth.query(api.groupPolls.queries.getPoll, { toolId })
  ).rejects.toThrow();
  await expect(
    member.auth.mutation(api.groupPolls.mutations.submitVote, {
      toolId,
      version: 2,
      expectedRevision: 1,
      selections: ['new'],
    })
  ).rejects.toThrow();
  await member.auth.mutation(api.groupPolls.mutations.removeVote, {
    toolId,
    expectedRevision: 1,
  });
  expect(
    (
      await member.auth.query(api.events.queries.getEventHeader, {
        eventId: event.eventId,
      })
    ).userMembership
  ).toMatchObject({ role: 'ORGANIZER', rsvpStatus: 'YES' });
});
it('reuses compatible saved votes after rejoin, blocks current bans and lets managers moderate without granting creator authority', async () => {
  const { owner, member, groupId, toolId } = await setup('rejoin');
  await member.auth.mutation(api.groupPolls.mutations.submitVote, {
    toolId,
    version: 1,
    expectedRevision: 0,
    selections: ['a'],
  });
  await member.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId,
  });
  const sent = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: member.personId }
  );
  await member.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: sent.inviteId,
  });
  expect(
    await member.auth.query(api.groupPolls.queries.getPoll, { toolId })
  ).toMatchObject({ selections: ['a'], voteRevision: 1 });
  await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
    groupId,
    personId: member.personId,
  });
  await expect(
    member.auth.mutation(api.groupPolls.mutations.submitVote, {
      toolId,
      version: 1,
      expectedRevision: 1,
      selections: ['b'],
    })
  ).rejects.toThrow();
  const saved = await member.auth.query(api.groupPolls.queries.getOwnHistory, {
    toolId,
    paginationOpts: { numItems: 1, cursor: null },
  });
  expect(saved.voteRevision).toBe(1);
  expect(saved.page[0].selections).toEqual(['a']);
  const results = await owner.auth.query(api.groupPolls.queries.listResults, {
    toolId,
    paginationOpts: { numItems: 20, cursor: null },
  });
  await owner.auth.mutation(api.groupPolls.mutations.removeResult, {
    voteId: results.page[0]._id,
    expectedRevision: 1,
  });
  expect(
    (
      await owner.auth.query(api.groupPolls.queries.listResults, {
        toolId,
        paginationOpts: { numItems: 20, cursor: null },
      })
    ).page[0]
  ).toMatchObject({ removed: true, isCurrent: false, selections: [] });
  expect(
    await member.auth.query(api.groupPolls.queries.getOwnHistory, {
      toolId,
      paginationOpts: { numItems: 1, cursor: null },
    })
  ).toMatchObject({ voteRevision: 2, page: [] });
});
it('rechecks live moderator authority for disabled settings and protects immutable disclosed result visibility', async () => {
  const { owner, member, groupId, toolId, definition } = await setup(
    'moderator',
    'MANAGERS'
  );
  await owner.auth.mutation(api.groupModeration.mutations.setGroupMemberRole, {
    groupId,
    personId: member.personId,
    role: 'MODERATOR',
  });
  await owner.auth.mutation(api.groupTools.mutations.configurePollPolicy, {
    groupId,
    enabled: false,
    creation: 'MANAGERS',
  });
  expect(
    await member.auth.query(api.groupPolls.queries.getPollForManagement, {
      toolId,
    })
  ).toMatchObject({ canManage: true, resultsVisibility: 'MANAGERS' });
  await member.auth.mutation(api.groupPolls.mutations.configurePoll, {
    toolId,
    version: 1,
    ...definition,
    title: 'Disabled managed',
  });
  await owner.auth.mutation(api.groupModeration.mutations.setGroupMemberRole, {
    groupId,
    personId: member.personId,
    role: 'MEMBER',
  });
  await expect(
    member.auth.query(api.groupPolls.queries.getPollForManagement, { toolId })
  ).rejects.toThrow();
  await expect(
    member.auth.mutation(api.groupPolls.mutations.configurePoll, {
      toolId,
      version: 2,
      ...definition,
    })
  ).rejects.toThrow();
  await expect(
    member.auth.mutation(api.groupPolls.mutations.deletePoll, { toolId })
  ).rejects.toThrow();
});
