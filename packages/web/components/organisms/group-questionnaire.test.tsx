import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ConvexProviderWithAuth,
  ConvexReactClient,
  useMutation,
} from 'convex/react';
import { getFunctionName } from 'convex/server';
import { afterAll, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import type { Id } from '@/convex/_generated/dataModel';
import { useEffect, useState, type ReactNode } from 'react';
import { GroupLanding } from './group-landing';
import GroupQuestionnairePage from '@/app/(groups)/groups/[groupId]/questionnaire/page';
import { GroupDetail } from './group-detail';

const navigation = vi.hoisted(() => ({
  navigate: undefined as ((path: string) => void) | undefined,
}));
vi.mock('next/navigation', () => ({
  useParams: () => ({ groupId: 'group-one' }),
  useRouter: () => ({
    push: (path: string) => navigation.navigate?.(path),
    replace: (path: string) => navigation.navigate?.(path),
  }),
}));
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
const aliasCleanup = await vi.hoisted(async () => {
  vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://fixture.convex.cloud');
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  const { default: Module } = await import('node:module');
  const { resolve } = await import('node:path');
  const resolver = Module as typeof Module & {
    _resolveFilename: (request: string, ...args: unknown[]) => string;
  };
  const original = resolver._resolveFilename;
  const apiPath = resolve(process.cwd(), '../../convex/_generated/api.js');
  resolver._resolveFilename = function (request, ...args) {
    return original.call(
      this,
      request === '@/convex/_generated/api' ? apiPath : request,
      ...args
    );
  };
  return () => {
    resolver._resolveFilename = original;
    vi.unstubAllGlobals();
  };
});

const invite = {
  inviteId: 'invite-one',
  status: 'PENDING',
  createdAt: 1,
  respondedAt: null,
  group: {
    groupId: 'group-one',
    name: 'Neighbors',
    description: 'Our block',
    image: null,
  },
  inviter: { personId: 'owner-one', name: 'Sam', username: 'sam', image: null },
  invitee: {
    personId: 'member-one',
    name: 'Alex',
    username: 'alex',
    image: null,
  },
  available: true,
  canBan: true,
};
const groupId = 'group-one' as Id<'groups'>;
const detail = {
  _id: groupId,
  name: 'Neighbors',
  viewerRole: 'MEMBER',
  canManageIdentity: true,
  canManageInvitations: true,
  invitationsEnabled: true,
  applicationsEnabled: false,
  applicationQuestions: [],
  canManageMembers: true,
  canManageRoles: true,
  canLeave: true,
};
const questionnaire = {
  groupId,
  enabled: true,
  version: 1,
  questions: [
    {
      id: 'intro',
      label: 'Introduce yourself',
      type: 'SHORT_ANSWER',
      required: false,
      version: 1,
    },
  ],
  answers: {},
  savedQuestions: [],
  completed: false,
  shouldPrompt: true,
  canEdit: true,
  canConfigure: false,
  canReview: false,
};
const emptyPage = { page: [], isDone: true, continueCursor: '' };
const authToken = async () => 'fixture-token';
function useFixtureAuth() {
  return {
    isLoading: false,
    isAuthenticated: true,
    fetchAccessToken: authToken,
  };
}
function AppProvider({
  client,
  children,
}: {
  client: ConvexReactClient;
  children: ReactNode;
}) {
  return (
    <ConvexProviderWithAuth client={client} useAuth={useFixtureAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
function fixtureClient(overrides: Record<string, unknown> = {}) {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  const data: Record<string, unknown> = {
    'groupApplications/queries:getGroupApplicationForm': {
      applicationsEnabled: false,
      questions: [],
      pending: null,
      canApply: false,
      canReview: true,
    },
    'groupApplications/queries:listMyGroupApplications': emptyPage,
    'groupApplications/queries:listGroupApplications': emptyPage,
    'groupTransfers/queries:status': null,
    'groupInvites/queries:listMyGroupInvites': {
      page: [invite],
      isDone: true,
      continueCursor: '',
    },
    'groupInvites/queries:listGroupInvites': {
      page: [invite],
      isDone: true,
      continueCursor: '',
    },
    'groupInvites/queries:getMyGroupInviteForGroup': invite,
    'groups/queries:getGroup': detail,
    'groups/queries:getGroupLanding': invite.group,
    'groups/queries:listGroupMembers': {
      page: [
        {
          ...invite.invitee,
          role: 'MEMBER',
          joinedAt: 1,
          canRemove: true,
          canBan: true,
          canChangeRole: true,
        },
      ],
      isDone: true,
      continueCursor: '',
    },
    'groupModeration/queries:listGroupBans': emptyPage,
    'groupQuestionnaires/queries:getJoiningQuestionnaire': questionnaire,
    'groupQuestionnaires/queries:getJoiningQuestionnaireAccess': {
      canRead: true,
      hasRecord: false,
      isMember: true,
    },
    'groupQuestionnaires/queries:listJoiningQuestionnaireHistory': emptyPage,
    'groupQuestionnaires/queries:listJoiningQuestionnaireAnswers': emptyPage,
    'friends/queries:searchUsersByUsername': [invite.invitee],
    'friends/queries:getBlockedUsers': [],
    'settings/queries:getPrivacySettings': {
      allowFriendRequestsFrom: 'EVENT_MEMBERS',
      allowEventInvitesFrom: 'FRIENDS',
      allowGroupInvitesFrom: 'EVERYONE',
    },
    ...overrides,
  };
  vi.spyOn(client, 'setAuth').mockImplementation((_fetch, onChange) => {
    onChange?.(true);
  });
  vi.spyOn(client, 'clearAuth').mockImplementation(() => {});
  const subscriptions = new Map<string, Set<() => void>>();
  const setData = (name: string, value: unknown) => {
    data[name] = value;
    subscriptions.get(name)?.forEach(callback => callback());
  };
  vi.spyOn(client, 'watchQuery').mockImplementation((...[query, args]) => ({
    onUpdate: callback => {
      const name = getFunctionName(query);
      const listeners = subscriptions.get(name) ?? new Set<() => void>();
      subscriptions.set(name, listeners);
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    localQueryResult: () => {
      const name = getFunctionName(query);
      if (!(name in data)) throw new Error(`Unexpected query ${name}`);
      const value = data[name];
      return typeof value === 'function' ? value(args) : value;
    },
    journal: () => undefined,
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockResolvedValue({ groupId: 'group-one', status: 'ACCEPTED' });
  return { client, mutation, setData };
}
afterAll(() => aliasCleanup());
it('prompts an admitted member for an optional questionnaire without a second admission mutation', async () => {
  const { client, mutation } = fixtureClient();
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  expect(await screen.findByText(/already a Group member/)).toBeInTheDocument();
  expect(screen.getByLabelText('Introduce yourself')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Leave Group' })
  ).toBeInTheDocument();
  expect(mutation).not.toHaveBeenCalled();
  mounted.unmount();
  await client.close();
});
it('submits and edits all seven supported answer types while keeping immediate membership', async () => {
  const questions = [
    {
      id: 'short',
      label: 'Name',
      type: 'SHORT_ANSWER',
      required: true,
      version: 1,
    },
    {
      id: 'long',
      label: 'Background',
      type: 'LONG_ANSWER',
      required: false,
      version: 1,
    },
    {
      id: 'choice',
      label: 'Favorite',
      type: 'MULTIPLE_CHOICE',
      options: ['Blue', 'Red'],
      required: false,
      version: 1,
    },
    {
      id: 'checks',
      label: 'Interests',
      type: 'CHECKBOXES',
      options: ['Music', 'Art'],
      required: true,
      version: 1,
    },
    {
      id: 'number',
      label: 'Years',
      type: 'NUMBER',
      required: false,
      version: 1,
    },
    {
      id: 'dropdown',
      label: 'Area',
      type: 'DROPDOWN',
      options: ['North', 'South'],
      required: false,
      version: 1,
    },
    {
      id: 'yes',
      label: 'Available',
      type: 'YES_NO',
      required: false,
      version: 1,
    },
  ];
  const { client, mutation, setData } = fixtureClient({
    'groupQuestionnaires/queries:getJoiningQuestionnaire': {
      ...questionnaire,
      questions,
    },
  });
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Name'), 'Alex');
  await user.type(screen.getByLabelText('Background'), 'Hello neighbors');
  await user.selectOptions(screen.getByLabelText('Favorite'), 'Blue');
  await user.click(screen.getByLabelText('Music'));
  await user.type(screen.getByLabelText('Years'), '3');
  await user.selectOptions(screen.getByLabelText('Area'), 'North');
  await user.selectOptions(screen.getByLabelText('Available'), 'false');
  await user.click(
    screen.getByRole('button', { name: 'Save questionnaire answers' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupQuestionnaires/mutations:submitJoiningQuestionnaire'
  );
  const answers = {
    short: 'Alex',
    long: 'Hello neighbors',
    choice: 'Blue',
    checks: ['Music'],
    number: 3,
    dropdown: 'North',
    yes: false,
  };
  expect(mutation.mock.calls[0][1]).toEqual({
    groupId: 'group-one',
    version: 1,
    answers,
  });
  act(() =>
    setData('groupQuestionnaires/queries:getJoiningQuestionnaire', {
      ...questionnaire,
      questions,
      answers,
      completed: true,
      shouldPrompt: false,
      savedQuestions: questions,
    })
  );
  expect(
    await screen.findByText(/Editing them does not reopen admission/)
  ).toBeInTheDocument();
  await user.clear(screen.getByLabelText('Name'));
  await user.type(screen.getByLabelText('Name'), 'Alexandra');
  await user.click(
    screen.getByRole('button', { name: 'Save questionnaire answers' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(mutation.mock.calls[1][1]).toMatchObject({
    answers: { short: 'Alexandra', yes: false },
  });
  expect(
    screen.getByRole('button', { name: 'Leave Group' })
  ).toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('lets only the owner configure the optional questionnaire and preserves question identity when disabled', async () => {
  const { client, mutation } = fixtureClient({
    'groupQuestionnaires/queries:getJoiningQuestionnaire': {
      ...questionnaire,
      canConfigure: true,
      canReview: true,
    },
  });
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  const user = userEvent.setup();
  await user.click(
    await screen.findByLabelText('Enable optional joining questionnaire')
  );
  await user.click(
    screen.getByRole('button', { name: 'Save questionnaire settings' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupQuestionnaires/mutations:configureJoiningQuestionnaire'
  );
  expect(mutation.mock.calls[0][1]).toEqual({
    groupId: 'group-one',
    enabled: false,
    questions: [
      {
        id: 'intro',
        label: 'Introduce yourself',
        type: 'SHORT_ANSWER',
        required: false,
      },
    ],
  });
  expect(
    screen.queryByLabelText('Require questionnaire before access')
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('preserves readable own answers and paginated original history when disabled after departure', async () => {
  const original = {
    id: 'intro',
    label: 'Original introduction',
    type: 'SHORT_ANSWER',
    required: false,
    version: 1,
  };
  const { client } = fixtureClient({
    'groupQuestionnaires/queries:getJoiningQuestionnaireAccess': {
      canRead: true,
      hasRecord: true,
      isMember: false,
    },
    'groups/queries:getGroup': null,
    'groupQuestionnaires/queries:getJoiningQuestionnaire': {
      ...questionnaire,
      enabled: false,
      questions: [original],
      canEdit: false,
      completed: true,
      shouldPrompt: false,
      answers: { intro: 'Original answer' },
      savedQuestions: [original],
    },
    'groupQuestionnaires/queries:listJoiningQuestionnaireHistory': {
      page: [
        {
          _id: 'history-one',
          _creationTime: 1,
          groupId,
          personId: 'member-one',
          question: original,
          answer: 'Original answer',
          answeredAt: 1,
        },
      ],
      isDone: true,
      continueCursor: '',
    },
  });
  const mounted = render(
    <AppProvider client={client}>
      <GroupQuestionnairePage />
    </AppProvider>
  );
  expect(
    await screen.findByText(/saved answers and history are preserved/)
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Save questionnaire answers' })
  ).not.toBeInTheDocument();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'View your answer history' }));
  expect(
    (await screen.findAllByText('Original introduction')).length
  ).toBeGreaterThan(0);
  expect(screen.queryByText('Introduce yourself')).not.toBeInTheDocument();
  expect(screen.getAllByText('Original answer').length).toBeGreaterThan(0);
  const historyCalls = vi
    .mocked(client.watchQuery)
    .mock.calls.filter(
      ([query]) =>
        getFunctionName(query) ===
        'groupQuestionnaires/queries:listJoiningQuestionnaireHistory'
    );
  expect(historyCalls.at(-1)?.[1]).toEqual({
    groupId: 'group-one',
    paginationOpts: { numItems: 20, cursor: null },
  });
  mounted.unmount();
  await client.close();
});
it('allows manager private answer review but exposes no admission approval action', async () => {
  const { client } = fixtureClient({
    'groupQuestionnaires/queries:getJoiningQuestionnaire': {
      ...questionnaire,
      canReview: true,
    },
    'groupQuestionnaires/queries:listJoiningQuestionnaireAnswers': {
      page: [
        {
          ...questionnaire,
          answers: { intro: 'Private introduction' },
          savedQuestions: questionnaire.questions,
          completed: true,
          shouldPrompt: false,
          canEdit: false,
          canConfigure: false,
          canReview: true,
          author: invite.invitee,
        },
      ],
      isDone: true,
      continueCursor: '',
    },
  });
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  await userEvent.setup().click(
    await screen.findByRole('button', {
      name: 'Review member questionnaire answers',
    })
  );
  expect(await screen.findByText('Private introduction')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /approve/i })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'View member answer history' })
  ).toBeInTheDocument();
  expect(
    screen.queryByLabelText('Enable optional joining questionnaire')
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('accepts an invitation into immediate membership and then prompts through the production landing and detail routes', async () => {
  const { client, mutation, setData } = fixtureClient({
    'groups/queries:getGroup': null,
    'groupQuestionnaires/queries:getJoiningQuestionnaireAccess': {
      canRead: false,
      hasRecord: false,
      isMember: false,
    },
  });
  mutation.mockImplementationOnce(async () => {
    act(() => {
      setData('groups/queries:getGroup', detail);
      setData('groupQuestionnaires/queries:getJoiningQuestionnaireAccess', {
        canRead: true,
        hasRecord: false,
        isMember: true,
      });
      setData('groupInvites/queries:getMyGroupInviteForGroup', {
        ...invite,
        status: 'ACCEPTED',
      });
    });
    return {
      groupId,
      membershipId: 'membership-one',
      status: 'ACCEPTED',
      joiningQuestionnaire: {
        enabled: true,
        version: 1,
        completed: false,
        shouldPrompt: true,
      },
    };
  });
  function Routes() {
    const [path, setPath] = useState('/g/group-one');
    useEffect(() => {
      navigation.navigate = setPath;
      return () => {
        navigation.navigate = undefined;
      };
    }, []);
    return path.startsWith('/groups/') ? (
      <GroupDetail groupId={groupId} />
    ) : (
      <GroupLanding groupId={groupId} />
    );
  }
  const mounted = render(
    <AppProvider client={client}>
      <Routes />
    </AppProvider>
  );
  expect(screen.queryByLabelText('Introduce yourself')).not.toBeInTheDocument();
  await userEvent.setup().click(
    await screen.findByRole('button', {
      name: 'Accept invitation to Neighbors',
    })
  );
  expect(
    await screen.findByRole('heading', { name: 'Neighbors', level: 1 })
  ).toBeInTheDocument();
  expect(await screen.findByText(/already a Group member/)).toBeInTheDocument();
  expect(screen.getByLabelText('Introduce yourself')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Leave Group' })
  ).toBeInTheDocument();
  expect(mutation).toHaveBeenCalledTimes(1);
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupInvites/mutations:acceptGroupInvite'
  );
  expect(
    screen.queryByRole('button', { name: /approve/i })
  ).not.toBeInTheDocument();
  mounted.unmount();
  navigation.navigate = undefined;
  await client.close();
});
it('does not query another person’s form or review records from a public Group landing', async () => {
  const { client } = fixtureClient({
    'groups/queries:getGroup': null,
    'groupInvites/queries:getMyGroupInviteForGroup': null,
    'groupQuestionnaires/queries:getJoiningQuestionnaireAccess': {
      canRead: false,
      hasRecord: false,
      isMember: false,
    },
  });
  const mounted = render(
    <AppProvider client={client}>
      <GroupLanding groupId={groupId} />
    </AppProvider>
  );
  expect(
    await screen.findByText(
      /manager invitation or an approved application is required/
    )
  ).toBeInTheDocument();
  const names = vi
    .mocked(client.watchQuery)
    .mock.calls.map(([query]) => getFunctionName(query));
  expect(names).not.toContain(
    'groupQuestionnaires/queries:getJoiningQuestionnaire'
  );
  expect(names).not.toContain(
    'groupQuestionnaires/queries:listJoiningQuestionnaireAnswers'
  );
  expect(names).not.toContain(
    'groupQuestionnaires/queries:listJoiningQuestionnaireHistory'
  );
  mounted.unmount();
  await client.close();
});
it('uses the real app provider despite a distinct shared SDK and lets members skip without a write', async () => {
  expect(
    createRequire(import.meta.url)('../../../shared/node_modules/convex/react')
      .useMutation
  ).not.toBe(useMutation);
  const { client, mutation } = fixtureClient();
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  await userEvent
    .setup()
    .click(await screen.findByRole('button', { name: 'Do this later' }));
  expect(screen.queryByLabelText('Introduce yourself')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Leave Group' })
  ).toBeInTheDocument();
  expect(mutation).not.toHaveBeenCalled();
  expect(
    screen.queryByRole('button', {
      name: 'Review member questionnaire answers',
    })
  ).not.toBeInTheDocument();
  const names = vi
    .mocked(client.watchQuery)
    .mock.calls.map(([query]) => getFunctionName(query));
  expect(names).not.toContain(
    'groupQuestionnaires/queries:listJoiningQuestionnaireAnswers'
  );
  mounted.unmount();
  await client.close();
});
it('validates required checkbox answers locally and handles an authoritative server conflict without reopening admission', async () => {
  const { client, mutation } = fixtureClient({
    'groupQuestionnaires/queries:getJoiningQuestionnaire': {
      ...questionnaire,
      questions: [
        {
          id: 'checks',
          label: 'Interests',
          type: 'CHECKBOXES',
          options: ['Music'],
          required: true,
          version: 1,
        },
      ],
    },
  });
  mutation.mockRejectedValueOnce(new Error('Private server details'));
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: 'Save questionnaire answers' })
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'complete the marked questions'
  );
  expect(mutation).not.toHaveBeenCalled();
  await user.click(screen.getByLabelText('Music'));
  await user.click(
    screen.getByRole('button', { name: 'Save questionnaire answers' })
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'questions or your access may have changed'
  );
  expect(screen.queryByText('Private server details')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Leave Group' })
  ).toBeInTheDocument();
  expect(mutation).toHaveBeenCalledTimes(1);
  mounted.unmount();
  await client.close();
});
it('pages own original answer history independently of the current question version', async () => {
  const first = {
    _id: 'history-first',
    _creationTime: 1,
    groupId,
    personId: 'member-one',
    question: {
      ...questionnaire.questions[0],
      label: 'Original question',
      version: 1,
    },
    answer: 'Original value',
    answeredAt: 1,
  };
  const second = {
    ...first,
    _id: 'history-second',
    answer: 'Earlier value',
    answeredAt: 0,
  };
  const { client } = fixtureClient({
    'groupQuestionnaires/queries:listJoiningQuestionnaireHistory': (args: {
      paginationOpts: { cursor: string | null };
    }) =>
      args.paginationOpts.cursor
        ? { page: [second], isDone: true, continueCursor: '' }
        : { page: [first], isDone: false, continueCursor: 'older' },
  });
  const mounted = render(
    <AppProvider client={client}>
      <GroupQuestionnairePage />
    </AppProvider>
  );
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: 'View your answer history' })
  );
  expect(await screen.findByText('Original value')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Next answer history' }));
  expect(await screen.findByText('Earlier value')).toBeInTheDocument();
  expect(screen.queryByText('Original value')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Next answer history' })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('pages manager review and scopes history to the selected public profile', async () => {
  const record = {
    ...questionnaire,
    canEdit: false,
    canConfigure: false,
    canReview: true,
    answers: { intro: 'First member answer' },
    author: invite.invitee,
  };
  const other = {
    ...record,
    answers: { intro: 'Second member answer' },
    author: { ...invite.invitee, personId: 'person-two', name: 'Taylor' },
  };
  const { client } = fixtureClient({
    'groupQuestionnaires/queries:getJoiningQuestionnaire': {
      ...questionnaire,
      canReview: true,
    },
    'groupQuestionnaires/queries:listJoiningQuestionnaireAnswers': (args: {
      paginationOpts: { cursor: string | null };
    }) =>
      args.paginationOpts.cursor
        ? { page: [other], isDone: true, continueCursor: '' }
        : { page: [record], isDone: false, continueCursor: 'next-member' },
  });
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', {
      name: 'Review member questionnaire answers',
    })
  );
  expect(await screen.findByText('First member answer')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Next member answers' }));
  expect(await screen.findByText('Second member answer')).toBeInTheDocument();
  expect(screen.queryByText('First member answer')).not.toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'View member answer history' })
  );
  expect(
    await screen.findByText('No saved answer history.')
  ).toBeInTheDocument();
  const calls = vi
    .mocked(client.watchQuery)
    .mock.calls.filter(
      ([query]) =>
        getFunctionName(query) ===
        'groupQuestionnaires/queries:listJoiningQuestionnaireHistory'
    );
  expect(calls.at(-1)?.[1]).toEqual({
    groupId: 'group-one',
    personId: 'person-two',
    paginationOpts: { numItems: 20, cursor: null },
  });
  expect(screen.queryByText(/member@example.com/)).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('reuses saved answers on return and reflects disable and re-enable without discarding records', async () => {
  const saved = {
    ...questionnaire,
    answers: { intro: 'Welcome back' },
    savedQuestions: questionnaire.questions,
    completed: true,
    shouldPrompt: false,
  };
  const { client, setData } = fixtureClient({
    'groupQuestionnaires/queries:getJoiningQuestionnaire': saved,
  });
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  expect(await screen.findByLabelText('Introduce yourself')).toHaveValue(
    'Welcome back'
  );
  expect(screen.queryByText(/already a Group member/)).not.toBeInTheDocument();
  act(() =>
    setData('groupQuestionnaires/queries:getJoiningQuestionnaire', {
      ...saved,
      enabled: false,
      canEdit: false,
      version: 2,
    })
  );
  expect(await screen.findByText('Welcome back')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Save questionnaire answers' })
  ).not.toBeInTheDocument();
  act(() =>
    setData('groupQuestionnaires/queries:getJoiningQuestionnaire', {
      ...saved,
      version: 3,
    })
  );
  expect(await screen.findByLabelText('Introduce yourself')).toHaveValue(
    'Welcome back'
  );
  mounted.unmount();
  await client.close();
});
it('does not request a private questionnaire when its own-record entitlement is unavailable', async () => {
  const { client } = fixtureClient({
    'groupQuestionnaires/queries:getJoiningQuestionnaireAccess': {
      canRead: false,
      hasRecord: false,
      isMember: false,
    },
  });
  const mounted = render(
    <AppProvider client={client}>
      <GroupQuestionnairePage />
    </AppProvider>
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No questionnaire records are available'
  );
  expect(
    vi
      .mocked(client.watchQuery)
      .mock.calls.map(([query]) => getFunctionName(query))
  ).not.toContain('groupQuestionnaires/queries:getJoiningQuestionnaire');
  mounted.unmount();
  await client.close();
});
