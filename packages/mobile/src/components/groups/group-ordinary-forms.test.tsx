import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { setToastAdapter } from '@groupi/shared/platform';
import { getFunctionName } from 'convex/server';
import { beforeEach, expect, it, vi } from 'vitest';
const require = createRequire(import.meta.url);
interface NativeNode {
  type: unknown;
  props: Record<string, unknown>;
}
interface Mounted {
  root: { findAll: (test: (node: NativeNode) => boolean) => NativeNode[] };
  update: (element: ReactNode) => void;
  unmount: () => void;
}
const renderer = require(
  require.resolve('react-test-renderer', {
    paths: [
      dirname(require.resolve('@testing-library/react-native/package.json')),
    ],
  })
) as { create: (element: ReactNode) => Mounted };
const network = vi.hoisted(() => ({
  authenticated: true,
  member: true,
  manager: true,
  moderator: false,
  targetRole: 'MEMBER',
  banState: 'populated',
  enabledQuestionnaire: true,
  formEditable: true,
  answers: {} as Record<string, string | number | boolean | string[]>,
  saved: false,
  requiredOnboarding: false,
  formVersion: 3,
  enabled: true,
  available: true,
  status: 'PENDING',
  ownInvite: true,
  mutation: vi.fn(),
  watches: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  subscribers: new Set<() => void>(),
}));
vi.unmock('react');
vi.unmock('convex/react');
vi.unmock('convex/_generated/api');
vi.unmock('@groupi/shared/hooks');
vi.unmock('@convex-dev/better-auth/react');
vi.unmock('../../providers/convex-provider');
vi.unmock('../../context/global-user-context');
vi.mock('uniwind', () => ({
  withUniwind: (component: unknown) => component,
  useCSSVariable: () => 'transparent',
}));
vi.mock('expo-router', () => ({
  router: {
    push: network.push,
    replace: network.replace,
    back: vi.fn(),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => ({ groupId: 'group-123', toolId: 'tool-123' }),
}));
const session = { user: { id: 'user-123' }, session: { id: 'session-123' } };
const profile = { user: session.user, person: { _id: 'person-123' } };
function authSession() {
  return { data: network.authenticated ? session : null, isPending: false };
}
vi.mock('../../lib/auth-client', () => ({
  useSession: authSession,
  authClient: {
    useSession: authSession,
    convex: { token: async () => ({ data: { token: 'test-token' } }) },
  },
}));
vi.mock('../../lib/convex', () => ({
  convex: {
    watchQuery: (
      query: Parameters<typeof getFunctionName>[0],
      args: Record<string, unknown>
    ) => {
      const name = getFunctionName(query);
      network.watches(name, args);
      return {
        localQueryResult: () => result(name, args),
        onUpdate: (listener: () => void) => {
          network.subscribers.add(listener);
          return () => network.subscribers.delete(listener);
        },
        journal: () => undefined,
      };
    },
    mutation: (
      reference: Parameters<typeof getFunctionName>[0],
      args: unknown
    ) => network.mutation(getFunctionName(reference), args),
    setAuth: (_fetch: unknown, onChange: (authenticated: boolean) => void) =>
      onChange(true),
    clearAuth: vi.fn(),
  },
}));

const questions = [
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'NUMBER',
  'MULTIPLE_CHOICE',
  'CHECKBOXES',
  'DROPDOWN',
  'YES_NO',
].map((type, index) => ({
  id: `q${index}`,
  label: `Question ${index}`,
  type,
  required: false,
  version: 1,
  ...(['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(type)
    ? { options: ['A', 'B'] }
    : {}),
}));
function form() {
  return {
    groupId: 'group-123',
    enabled: network.enabledQuestionnaire,
    requiredCompletion: network.requiredOnboarding,
    requiresCompletion: network.requiredOnboarding && !network.saved,
    canAccessMemberContent: !network.requiredOnboarding || network.saved,
    version: network.formVersion,
    questions,
    answers: network.answers,
    savedQuestions: network.saved ? questions : [],
    completed: network.saved,
    shouldPrompt: !network.saved,
    canEdit: network.formEditable && network.enabledQuestionnaire,
    canConfigure: network.manager && !network.moderator,
    canReview: network.manager,
  };
}
function result(name: string, args: Record<string, unknown>) {
  if (name === 'groups/queries:getGroup')
    return {
      _id: 'group-123',
      isOwner: network.manager && !network.moderator,
      canManageMembers: network.manager,
      joiningQuestionnaire: {
        canAccessMemberContent: !network.requiredOnboarding,
      },
    };
  if (name === 'groupTools/queries:getFormPolicy')
    return {
      enabled: network.enabled,
      creation: 'MANAGERS',
      canConfigure: network.manager && !network.moderator,
    };
  if (
    name === 'groupForms/queries:getForm' ||
    name === 'groupForms/queries:getFormForManagement'
  )
    return {
      ...form(),
      _id: 'tool-123',
      title: 'Feedback',
      description: 'Describe feedback',
      resultsVisibility: network.ownInvite ? 'MANAGERS' : 'MEMBERS',
      savedVersion: network.saved ? 2 : null,
      responseRevision: network.saved ? 4 : 0,
      canManage: network.manager,
      canReview: network.manager || !network.ownInvite,
    };
  if (name === 'groupForms/queries:listForms')
    return {
      page: [{ _id: 'tool-123', title: 'Feedback' }],
      isDone: true,
      continueCursor: '',
    };
  if (
    name === 'groupForms/queries:getOwnHistory' ||
    name === 'groupForms/queries:listResults'
  )
    return {
      page: [
        {
          _id: 'result-123',
          personId: network.ownInvite ? 'person-123' : undefined,
          questions: [{ ...questions[0], label: 'Original definition' }],
          answers: { q0: 'Previous answer' },
          updatedAt: 1,
          revision: 4,
          version: 2,
        },
      ],
      isDone: false,
      continueCursor: 'next',
    };
  if (name === 'auth/queries:getCurrentUserAndPerson') return profile;
  if (name === 'users/queries:checkNeedsOnboarding') return false;
  if (name === 'groupQuestionnaires/queries:getJoiningQuestionnaire')
    return form();
  if (name === 'groupQuestionnaires/queries:listJoiningQuestionnaireHistory')
    return {
      page: [
        {
          _id: 'history-1',
          question: {
            ...questions[0],
            label: 'Original removed definition',
            version: 1,
          },
          answer: 'Previous answer',
          answeredAt: 1,
        },
      ],
      isDone:
        (args.paginationOpts as { cursor: string | null }).cursor !== null,
      continueCursor: 'history-next',
    };
  if (name === 'groupQuestionnaires/queries:listJoiningQuestionnaireAnswers')
    return {
      page: [
        {
          ...form(),
          author: {
            personId: 'person-other',
            name: 'Other member',
            username: 'other',
            image: null,
          },
        },
      ],
      isDone: false,
      continueCursor: 'answers-next',
    };
  return undefined;
}
import { ConvexClientProvider } from '../../providers/convex-provider';
import { GlobalUserProvider } from '../../context/global-user-context';
import FormScreen from '../../../app/groups/[groupId]/forms/[toolId]';
import PolicyScreen from '../../../app/groups/[groupId]/forms/policy';
import HistoryScreen from '../../../app/groups/[groupId]/forms/[toolId]/history';
import ResultsScreen from '../../../app/groups/[groupId]/forms/[toolId]/results';
import CreateScreen from '../../../app/groups/[groupId]/forms/create';
import HubScreen from '../../../app/groups/[groupId]/forms';
import ManageScreen from '../../../app/groups/[groupId]/forms/[toolId]/manage';
import { Alert } from 'react-native';
function screen(component: () => ReactNode) {
  return createElement(
    ConvexClientProvider,
    null,
    createElement(GlobalUserProvider, null, createElement(component))
  );
}
function control(mounted: Mounted, label: string, type = 'Pressable') {
  return mounted.root.findAll(
    node => node.type === type && node.props.accessibilityLabel === label
  )[0];
}
async function mount(component: () => ReactNode) {
  let mounted: Mounted;
  await act(async () => {
    mounted = renderer.create(screen(component));
  });
  return mounted!;
}
async function press(mounted: Mounted, label: string) {
  await act(async () => {
    await (control(mounted, label).props.onPress as () => unknown)();
  });
}

beforeEach(() => {
  network.formVersion = 3;
  network.manager = true;
  network.moderator = false;
  network.saved = false;
  network.requiredOnboarding = false;
  network.enabled = true;
  network.ownInvite = true;
  network.answers = {};
  network.mutation.mockReset();
  network.mutation.mockResolvedValue('tool-created');
  network.watches.mockClear();
  setToastAdapter({
    show: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  });
});
it('submits all seven native answer types through the actual provider with revision protection', async () => {
  const mounted = await mount(FormScreen);
  for (const [label, value] of [
    ['Question 0', 'short'],
    ['Question 1', 'long'],
    ['Question 2', '12'],
  ])
    await act(async () => {
      (
        control(mounted, label, 'TextInput').props.onChangeText as (
          s: string
        ) => void
      )(value);
    });
  for (const label of [
    'Question 3: A',
    'Question 4: A',
    'Question 4: B',
    'Question 5: B',
    'Question 6: No',
  ])
    await press(mounted, label);
  await press(mounted, 'Save Group form answers');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupForms/mutations:submitResponse',
    {
      toolId: 'tool-123',
      version: 3,
      expectedRevision: 0,
      answers: {
        q0: 'short',
        q1: 'long',
        q2: 12,
        q3: 'A',
        q4: ['A', 'B'],
        q5: 'B',
        q6: false,
      },
    }
  );
});
it('never mounts current content queries while onboarding is required but permits policy recovery', async () => {
  network.requiredOnboarding = true;
  const mounted = await mount(FormScreen);
  expect(control(mounted, 'Save Group form answers')).toBeUndefined();
  expect(
    network.watches.mock.calls.some(
      ([name]) => name === 'groupForms/queries:getForm'
    )
  ).toBe(false);
  const policy = await mount(PolicyScreen);
  await press(policy, 'Enable Group forms');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupTools/mutations:configureFormPolicy',
    { groupId: 'group-123', enabled: false, creation: 'MANAGERS' }
  );
});
it('own history remains accessible without current form reads when forms are disabled and onboarding required', async () => {
  network.requiredOnboarding = true;
  network.enabled = false;
  const mounted = await mount(HistoryScreen);
  await press(mounted, 'Next Form history');
  expect(network.watches).toHaveBeenCalledWith(
    'groupForms/queries:getOwnHistory',
    { toolId: 'tool-123', paginationOpts: { numItems: 20, cursor: 'next' } }
  );
  expect(
    network.watches.mock.calls.some(
      ([name]) => name === 'groupForms/queries:getForm'
    )
  ).toBe(false);
});
it('creates a shared form from a reusable template with fixed visibility', async () => {
  const mounted = await mount(CreateScreen);
  await press(mounted, 'Use form template Feedback');
  await press(mounted, 'Form results MEMBERS');
  await press(mounted, 'Save Group form');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupForms/mutations:createForm',
    expect.objectContaining({
      groupId: 'group-123',
      title: 'Feedback',
      resultsVisibility: 'MEMBERS',
      questions: [expect.objectContaining({ type: 'LONG_ANSWER' })],
    })
  );
});
it('keeps private results unmounted for ordinary members', async () => {
  network.manager = false;
  const mounted = await mount(ResultsScreen);
  expect(control(mounted, 'Remove form result result-123')).toBeUndefined();
  expect(
    network.watches.mock.calls.some(
      ([name]) => name === 'groupForms/queries:listResults'
    )
  ).toBe(false);
});
it('manager removal addresses an anonymous result by response id after confirmation', async () => {
  network.ownInvite = false;
  const alert = vi.spyOn(Alert, 'alert');
  const mounted = await mount(ResultsScreen);
  await press(mounted, 'Remove form result result-123');
  expect(network.mutation).not.toHaveBeenCalled();
  const buttons = alert.mock.calls.at(-1)?.[2];
  await act(async () => {
    buttons?.[1].onPress?.();
  });
  expect(network.mutation).toHaveBeenCalledWith(
    'groupForms/mutations:removeResult',
    { responseId: 'result-123' }
  );
  alert.mockRestore();
});
it('drops drafts on a realtime form version change and displays conflicts accessibly', async () => {
  const mounted = await mount(FormScreen);
  await act(async () => {
    (
      control(mounted, 'Question 0', 'TextInput').props.onChangeText as (
        s: string
      ) => void
    )('old draft');
    network.formVersion = 8;
    network.subscribers.forEach(fn => fn());
  });
  expect(control(mounted, 'Question 0', 'TextInput').props.value).toBe('');
  network.mutation.mockRejectedValueOnce(new Error('Stale response revision'));
  await press(mounted, 'Save Group form answers');
  expect(
    mounted.root.findAll(n => n.props.accessibilityRole === 'alert').length
  ).toBeGreaterThan(0);
  network.formVersion = 3;
});
it('removes own history through narrow recovery without loading current content', async () => {
  network.requiredOnboarding = true;
  network.enabled = false;
  const alert = vi.spyOn(Alert, 'alert');
  const mounted = await mount(HistoryScreen);
  await press(mounted, 'Remove my saved form history');
  expect(network.mutation).not.toHaveBeenCalled();
  await act(async () => {
    alert.mock.calls.at(-1)?.[2]?.[1].onPress?.();
  });
  expect(network.mutation).toHaveBeenCalledWith(
    'groupForms/mutations:removeResponse',
    { toolId: 'tool-123' }
  );
  expect(
    network.watches.mock.calls.some(
      ([name]) => name === 'groupForms/queries:getForm'
    )
  ).toBe(false);
  alert.mockRestore();
});
it('unmounts answer controls when owner policy disables ordinary forms in realtime', async () => {
  const mounted = await mount(FormScreen);
  expect(control(mounted, 'Save Group form answers')).toBeDefined();
  await act(async () => {
    network.enabled = false;
    network.subscribers.forEach(fn => fn());
  });
  expect(control(mounted, 'Save Group form answers')).toBeUndefined();
  expect(control(mounted, 'My form response history')).toBeDefined();
});
it('keeps policy owner-only even when a moderator manages form content', async () => {
  network.moderator = true;
  const mounted = await mount(PolicyScreen);
  expect(control(mounted, 'Enable Group forms')).toBeUndefined();
});

it('manager edits reuse the controlled question editor and preserve fixed results visibility', async () => {
  const mounted = await mount(ManageScreen);
  expect(control(mounted, 'Form results MEMBERS')).toBeUndefined();
  await press(mounted, 'Form question 1 type CHECKBOXES');
  await act(async () => {
    (
      control(mounted, 'Form question 1 options, one per line', 'TextInput')
        .props.onChangeText as (s: string) => void
    )('Red\nBlue');
  });
  await press(mounted, 'Form question 1 answer required when completing');
  await press(mounted, 'Save Group form');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupForms/mutations:configureForm',
    expect.objectContaining({
      toolId: 'tool-123',
      version: 3,
      questions: expect.arrayContaining([
        expect.objectContaining({
          id: 'q0',
          type: 'CHECKBOXES',
          options: ['Red', 'Blue'],
          required: true,
        }),
      ]),
    })
  );
  expect(network.mutation.mock.calls[0][1]).not.toHaveProperty(
    'resultsVisibility'
  );
});
it('deletion is confirmed before calling the production deletion mutation', async () => {
  const alert = vi.spyOn(Alert, 'alert');
  const mounted = await mount(ManageScreen);
  await press(mounted, 'Delete Group form');
  expect(network.mutation).not.toHaveBeenCalled();
  await act(async () => {
    alert.mock.calls.at(-1)?.[2]?.[1].onPress?.();
  });
  expect(network.mutation).toHaveBeenCalledWith(
    'groupForms/mutations:deleteForm',
    { toolId: 'tool-123' }
  );
  alert.mockRestore();
});

it('current moderator reaches preserved form settings and deletion while forms are disabled', async () => {
  network.moderator = true;
  network.enabled = false;
  const mounted = await mount(ManageScreen);
  expect(control(mounted, 'Save Group form')).toBeDefined();
  await press(mounted, 'Save Group form');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupForms/mutations:configureForm',
    expect.objectContaining({ toolId: 'tool-123' })
  );
});

it('disabled moderator list links directly to preserved settings without enabling interactions', async () => {
  network.moderator = true;
  network.enabled = false;
  const mounted = await mount(HubScreen);
  expect(control(mounted, 'Create Group form')).toBeUndefined();
  await press(mounted, 'Manage form Feedback');
  expect(network.push).toHaveBeenCalledWith(
    '/groups/group-123/forms/tool-123/manage'
  );
});
it.each([
  { manager: false, required: false },
  { manager: true, required: true },
])(
  'disabled settings deny member/required-incomplete manager $manager $required',
  async ({ manager, required }) => {
    network.manager = manager;
    network.requiredOnboarding = required;
    network.enabled = false;
    const mounted = await mount(ManageScreen);
    expect(control(mounted, 'Save Group form')).toBeUndefined();
    expect(control(mounted, 'Delete Group form')).toBeUndefined();
    expect(network.watches.mock.calls.map(([name]) => name)).not.toContain(
      'groupForms/queries:getFormForManagement'
    );
  }
);
it('disabled moderator confirms deletion directly from preserved settings', async () => {
  network.moderator = true;
  network.enabled = false;
  const alert = vi.spyOn(Alert, 'alert');
  const mounted = await mount(ManageScreen);
  await press(mounted, 'Delete Group form');
  expect(network.mutation).not.toHaveBeenCalled();
  await act(async () => {
    alert.mock.calls.at(-1)?.[2]?.[1].onPress?.();
  });
  expect(network.mutation).toHaveBeenCalledWith(
    'groupForms/mutations:deleteForm',
    { toolId: 'tool-123' }
  );
  expect(network.enabled).toBe(false);
  expect(network.mutation.mock.calls.map(([name]) => name)).not.toContain(
    'groupTools/mutations:configureFormPolicy'
  );
  alert.mockRestore();
});
