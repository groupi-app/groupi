import type { Id } from 'convex/_generated/dataModel';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { setToastAdapter } from '@groupi/shared/platform';
import { getFunctionName } from 'convex/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  applicationApproved: false,
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
  useLocalSearchParams: () => ({ groupId: 'group-123' }),
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
  if (name === 'groupApplications/queries:getGroupApplicationForm')
    return {
      applicationsEnabled: true,
      questions: [],
      pending: null,
      canApply: false,
      canReview: false,
    };
  if (name === 'groupApplications/queries:listMyGroupApplications')
    return {
      page: [
        {
          _id: 'approved-application',
          groupId: 'group-123',
          personId: 'person-123',
          status: network.applicationApproved ? 'APPROVED' : 'PENDING',
          questions: [],
          answers: {},
          decisions: [],
          submittedAt: 1,
          updatedAt: 2,
        },
      ],
      isDone: true,
      continueCursor: '',
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
import { GroupApplicationScreen } from './group-application-screen';
import QuestionnaireScreen from '../../../app/groups/[groupId]/questionnaire';
import {
  GroupJoiningQuestionnairePrompt,
  GroupQuestionnaireReview,
  GroupQuestionnaireHistory,
} from './group-questionnaire';
import { GroupQuestionnaireSettings } from './group-questionnaire-settings';
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
describe('joining questionnaire actual native SDK/provider interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setToastAdapter({
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    });
    network.authenticated = true;
    network.manager = true;
    network.moderator = false;
    network.formEditable = true;
    network.enabledQuestionnaire = true;
    network.answers = {};
    network.saved = false;
    network.requiredOnboarding = false;
    network.mutation.mockResolvedValue(form());
  });
  it('submits all seven ordinary input types at current configuration version without changing admission', async () => {
    const mounted = await mount(QuestionnaireScreen);
    for (const [label, value] of [
      ['Question 0', 'Short'],
      ['Question 1', 'Long'],
      ['Question 2', '12'],
    ])
      await act(async () => {
        (
          control(mounted, label, 'TextInput').props.onChangeText as (
            text: string
          ) => void
        )(value);
      });
    for (const label of [
      'Question 3: A',
      'Question 4: B',
      'Question 5: B',
      'Question 6: No',
    ])
      await press(mounted, label);
    expect(control(mounted, 'Question 4: B').props.accessibilityRole).toBe(
      'checkbox'
    );
    expect(control(mounted, 'Question 6: No').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true })
    );
    await press(mounted, 'Save joining questionnaire answers');
    expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
      'groupQuestionnaires/mutations:submitJoiningQuestionnaire',
      {
        groupId: 'group-123',
        version: 3,
        answers: {
          q0: 'Short',
          q1: 'Long',
          q2: 12,
          q3: 'A',
          q4: ['B'],
          q5: 'B',
          q6: false,
        },
      }
    );
    expect(network.replace).not.toHaveBeenCalled();
    await act(async () => mounted.unmount());
  });
  it('continues without answering and returning members reuse valid saved values', async () => {
    network.saved = true;
    network.answers = { q0: 'Saved' };
    const mounted = await mount(QuestionnaireScreen);
    expect(control(mounted, 'Question 0', 'TextInput').props.value).toBe(
      'Saved'
    );
    await press(mounted, 'Continue without questionnaire');
    expect(network.replace).toHaveBeenCalledWith('/groups/group-123');
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => mounted.unmount());
  });
  it('former members retain read-only records and paginated original answer history', async () => {
    network.formEditable = false;
    network.saved = true;
    const mounted = await mount(QuestionnaireScreen);
    expect(
      control(mounted, 'Save joining questionnaire answers')
    ).toBeUndefined();
    await press(mounted, 'View own questionnaire history');
    expect(network.push).toHaveBeenCalledWith(
      '/groups/group-123/questionnaire/history'
    );
    await act(async () => mounted.unmount());
    const history = await mount(() =>
      createElement(GroupQuestionnaireHistory, {
        groupId: 'group-123' as never,
      })
    );
    await press(history, 'Next Questionnaire history');
    expect(network.watches).toHaveBeenCalledWith(
      'groupQuestionnaires/queries:listJoiningQuestionnaireHistory',
      {
        groupId: 'group-123',
        paginationOpts: { numItems: 20, cursor: 'history-next' },
      }
    );
    await act(async () => history.unmount());
  });
  it('disabling keeps own records and provides no submit or admission gate', async () => {
    network.enabledQuestionnaire = false;
    network.saved = true;
    const mounted = await mount(QuestionnaireScreen);
    expect(
      control(mounted, 'Save joining questionnaire answers')
    ).toBeUndefined();
    expect(control(mounted, 'Continue without questionnaire')).toBeDefined();
    expect(control(mounted, 'View own questionnaire history')).toBeDefined();
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => mounted.unmount());
  });
  it('owner configuration preserves stable identities without sending server question versions', async () => {
    const mounted = await mount(() =>
      createElement(GroupQuestionnaireSettings, {
        groupId: 'group-123' as never,
      })
    );
    await act(async () => {
      (
        control(mounted, 'Joining question 1 label', 'TextInput').props
          .onChangeText as (text: string) => void
      )('Revised label');
    });
    await press(mounted, 'Enable joining questionnaire');
    await press(mounted, 'Save joining questionnaire settings');
    const payload = network.mutation.mock.calls[0][1];
    expect(payload.enabled).toBe(false);
    expect(payload.questions[0]).toEqual({
      id: 'q0',
      label: 'Revised label',
      type: 'SHORT_ANSWER',
      required: false,
    });
    expect(payload.questions).toHaveLength(7);
    expect(
      payload.questions.every(
        (q: Record<string, unknown>) => q.version === undefined
      )
    ).toBe(true);
    await act(async () => mounted.unmount());
  });
  it('moderators review private answers but cannot configure; members never subscribe to private review', async () => {
    network.moderator = true;
    let mounted = await mount(() =>
      createElement(GroupQuestionnaireSettings, {
        groupId: 'group-123' as never,
      })
    );
    expect(
      control(mounted, 'Save joining questionnaire settings')
    ).toBeUndefined();
    await act(async () => mounted.unmount());
    mounted = await mount(() =>
      createElement(GroupQuestionnaireReview, { groupId: 'group-123' as never })
    );
    await press(mounted, 'View answer history for Other member');
    expect(network.push).toHaveBeenCalledWith({
      pathname: '/groups/[groupId]/questionnaire/history',
      params: { groupId: 'group-123', personId: 'person-other' },
    });
    await act(async () => mounted.unmount());
    network.manager = false;
    network.watches.mockClear();
    mounted = await mount(() =>
      createElement(GroupQuestionnaireReview, { groupId: 'group-123' as never })
    );
    expect(
      network.watches.mock.calls.some(
        ([name]) =>
          name === 'groupQuestionnaires/queries:listJoiningQuestionnaireAnswers'
      )
    ).toBe(false);
    await act(async () => mounted.unmount());
  });
  it('stale-version errors remain on the form and keep membership navigation available', async () => {
    network.mutation.mockRejectedValue(
      new Error('Questionnaire changed; reload before answering.')
    );
    const mounted = await mount(QuestionnaireScreen);
    await press(mounted, 'Save joining questionnaire answers');
    expect(
      mounted.root.findAll(node => node.props.accessibilityRole === 'alert')
        .length
    ).toBeGreaterThan(0);
    expect(control(mounted, 'Continue without questionnaire')).toBeDefined();
    expect(network.replace).not.toHaveBeenCalled();
    await act(async () => mounted.unmount());
  });
});

it('prompts an admitted member on any Group entry and allows postponing without mutation', async () => {
  vi.clearAllMocks();
  network.saved = false;
  network.enabledQuestionnaire = true;
  const mounted = await mount(() =>
    createElement(GroupJoiningQuestionnairePrompt, {
      groupId: 'group-123' as never,
    })
  );
  expect(
    control(mounted, 'Answer optional joining questionnaire')
  ).toBeDefined();
  await press(mounted, 'Skip optional joining questionnaire for now');
  expect(
    control(mounted, 'Answer optional joining questionnaire')
  ).toBeUndefined();
  expect(network.mutation).not.toHaveBeenCalled();
  await act(async () => mounted.unmount());
});

it('drops an unsaved draft when realtime questionnaire version changes rather than submitting old answers as new definitions', async () => {
  vi.clearAllMocks();
  network.formEditable = true;
  network.enabledQuestionnaire = true;
  network.formVersion = 3;
  network.answers = {};
  const mounted = await mount(QuestionnaireScreen);
  await act(async () => {
    (
      control(mounted, 'Question 0', 'TextInput').props.onChangeText as (
        text: string
      ) => void
    )('Old definition draft');
  });
  network.formVersion = 4;
  await act(async () => {
    for (const listener of network.subscribers) listener();
  });
  expect(control(mounted, 'Question 0', 'TextInput').props.value).toBe('');
  await act(async () => mounted.unmount());
  network.formVersion = 3;
});

it('clears a saved optional yes/no answer instead of coercing it to false', async () => {
  vi.clearAllMocks();
  network.formEditable = true;
  network.enabledQuestionnaire = true;
  network.formVersion = 3;
  network.answers = { q6: false };
  network.mutation.mockResolvedValue(form());
  const mounted = await mount(QuestionnaireScreen);
  await press(mounted, 'Clear Question 6');
  await press(mounted, 'Save joining questionnaire answers');
  expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
    'groupQuestionnaires/mutations:submitJoiningQuestionnaire',
    { groupId: 'group-123', version: 3, answers: {} }
  );
  await act(async () => mounted.unmount());
});

it('required onboarding keeps recovery reachable and removes the misleading skip action', async () => {
  vi.clearAllMocks();
  network.saved = false;
  network.requiredOnboarding = true;
  network.manager = false;
  const mounted = await mount(QuestionnaireScreen);
  expect(control(mounted, 'Continue without questionnaire')).toBeUndefined();
  expect(
    mounted.root.findAll(
      node =>
        node.props.children ===
        'Complete required onboarding before accessing Group member content.'
    ).length
  ).toBeGreaterThan(0);
  network.mutation.mockImplementation(async () => {
    network.saved = true;
    network.subscribers.forEach(callback => callback());
    return form();
  });
  await press(mounted, 'Save joining questionnaire answers');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupQuestionnaires/mutations:submitJoiningQuestionnaire',
    expect.any(Object)
  );
  expect(network.mutation).toHaveBeenCalledTimes(1);
  expect(control(mounted, 'Continue without questionnaire')).toBeDefined();
  await act(async () => mounted.unmount());
});

it('approved application opens required native completion through production provider screens without a second admission write', async () => {
  vi.clearAllMocks();
  network.manager = false;
  network.saved = false;
  network.requiredOnboarding = true;
  network.applicationApproved = true;
  const application = await mount(GroupApplicationScreen);
  await press(application, 'Open approved Group');
  expect(network.push).toHaveBeenCalledWith('/groups/group-123');
  await act(async () => application.unmount());
  const prompt = await mount(() =>
    createElement(GroupJoiningQuestionnairePrompt, {
      groupId: 'group-123' as Id<'groups'>,
    })
  );
  expect(
    control(prompt, 'Skip optional joining questionnaire for now')
  ).toBeUndefined();
  await press(prompt, 'Complete required joining questionnaire');
  expect(network.push).toHaveBeenCalledWith('/groups/group-123/questionnaire');
  await act(async () => prompt.unmount());
  network.mutation.mockImplementation(async () => {
    network.saved = true;
    network.subscribers.forEach(callback => callback());
    return form();
  });
  const questionnaire = await mount(QuestionnaireScreen);
  expect(
    control(questionnaire, 'Continue without questionnaire')
  ).toBeUndefined();
  await press(questionnaire, 'Save joining questionnaire answers');
  expect(
    control(questionnaire, 'Continue without questionnaire')
  ).toBeDefined();
  expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
    'groupQuestionnaires/mutations:submitJoiningQuestionnaire',
    expect.any(Object)
  );
  await act(async () => questionnaire.unmount());
});
