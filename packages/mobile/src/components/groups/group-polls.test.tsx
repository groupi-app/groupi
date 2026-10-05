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
  mode: 'SINGLE',
  selections: [] as string[],
  revision: 0,
  authenticated: true,
  visibility: 'MANAGERS' as 'MANAGERS' | 'MEMBERS',
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

function result(name: string, _args: Record<string, unknown>) {
  if (name === 'groups/queries:getGroup')
    return {
      _id: 'group-123',
      canManageMembers: network.manager,
      joiningQuestionnaire: {
        canAccessMemberContent: !network.requiredOnboarding,
      },
    };
  if (name === 'groupTools/queries:getPollPolicy')
    return {
      enabled: network.enabled,
      creation: 'MANAGERS',
      canConfigure: network.manager,
    };
  if (
    name === 'groupPolls/queries:getPoll' ||
    name === 'groupPolls/queries:getPollForManagement'
  )
    return {
      _id: 'tool-123',
      groupId: 'group-123',
      title: 'Topic choice',
      version: 3,
      semanticVersion: 1,
      mode: network.mode,
      options: [
        { id: 'book', label: 'Books' },
        { id: 'film', label: 'Films' },
      ],
      selections: network.selections,
      savedOptions: [],
      savedVersion: network.saved ? 1 : null,
      voteRevision: network.revision,
      canManage: network.manager,
      canReview: network.manager,
      resultsVisibility: network.visibility,
    };
  if (name === 'groupPolls/queries:listPolls')
    return {
      page: [{ _id: 'tool-123', title: 'Topic choice' }],
      isDone: true,
      continueCursor: '',
    };
  if (
    name === 'groupPolls/queries:getOwnHistory' ||
    name === 'groupPolls/queries:listResults'
  )
    return {
      page: [
        {
          _id: 'vote-123',
          personId: 'person-123',
          mode: 'SINGLE',
          options: [{ id: 'old', label: 'Original option' }],
          selections: ['old'],
          version: 1,
          revision: 2,
          updatedAt: 1,
          isCurrent: false,
          removed: false,
        },
      ],
      isDone: false,
      continueCursor: 'next',
      voteRevision: network.revision,
    };
  if (name === 'auth/queries:getCurrentUserAndPerson') return profile;
  if (name === 'users/queries:checkNeedsOnboarding') return false;
  return undefined;
}
import { ConvexClientProvider } from '../../providers/convex-provider';
import { GlobalUserProvider } from '../../context/global-user-context';
import PollScreen from '../../../app/groups/[groupId]/polls/[toolId]';
import HistoryScreen from '../../../app/groups/[groupId]/polls/[toolId]/history';
import ResultsScreen from '../../../app/groups/[groupId]/polls/[toolId]/results';
import CreateScreen from '../../../app/groups/[groupId]/polls/create';
import HubScreen from '../../../app/groups/[groupId]/polls';
import ManageScreen from '../../../app/groups/[groupId]/polls/[toolId]/manage';
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
  network.mode = 'SINGLE';
  network.visibility = 'MANAGERS';
  network.selections = [];
  network.revision = 0;
  network.saved = false;
  network.manager = true;
  network.requiredOnboarding = false;
  network.enabled = true;
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
it('submits single stable choice through native production radio and actual provider', async () => {
  const m = await mount(PollScreen);
  expect(control(m, 'Vote Books').props.role).toBe('radio');
  await press(m, 'Vote Books');
  await press(m, 'Vote Films');
  await press(m, 'Save Group poll votes');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupPolls/mutations:submitVote',
    {
      toolId: 'tool-123',
      version: 3,
      expectedRevision: 0,
      selections: ['film'],
    }
  );
  await act(async () => m.unmount());
});
it('supports native checkbox multi selection', async () => {
  network.mode = 'MULTIPLE';
  const m = await mount(PollScreen);
  await press(m, 'Vote Books');
  await press(m, 'Vote Films');
  await press(m, 'Save Group poll votes');
  expect(control(m, 'Vote Books').props.accessibilityRole).toBe('checkbox');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupPolls/mutations:submitVote',
    expect.objectContaining({ selections: ['book', 'film'] })
  );
  await act(async () => m.unmount());
});
it('surfaces stale vote failure and recovers current revision through subscription', async () => {
  network.mutation.mockRejectedValueOnce(new Error('Vote changed'));
  const m = await mount(PollScreen);
  await press(m, 'Save Group poll votes');
  expect(
    m.root.findAll(n => n.type === 'Text').map(n => n.props.children)
  ).toContain('Vote changed');
  await act(async () => {
    network.revision = 4;
    network.selections = ['film'];
    network.subscribers.forEach(f => f());
  });
  await press(m, 'Save Group poll votes');
  expect(network.mutation).toHaveBeenLastCalledWith(
    'groupPolls/mutations:submitVote',
    expect.objectContaining({ expectedRevision: 4, selections: ['film'] })
  );
  await act(async () => m.unmount());
});
it('required onboarding hides poll controls and skips protected query for managers', async () => {
  network.requiredOnboarding = true;
  const m = await mount(PollScreen);
  expect(control(m, 'Vote Books')).toBeUndefined();
  expect(network.watches.mock.calls.map(([n]) => n)).not.toContain(
    'groupPolls/queries:getPoll'
  );
  await act(async () => m.unmount());
});
it('disabled hub keeps manager settings separate and hides new poll', async () => {
  network.enabled = false;
  const m = await mount(HubScreen);
  expect(control(m, 'Manage poll Topic choice')).toBeDefined();
  expect(control(m, 'Create Group poll')).toBeUndefined();
  await act(async () => m.unmount());
});
it('disabled management still configures stable options without visibility changes', async () => {
  network.enabled = false;
  const m = await mount(ManageScreen);
  expect(control(m, 'Option 1 stable ID', 'TextInput')).toBeDefined();
  expect(control(m, 'Poll results MEMBERS')).toBeUndefined();
  await press(m, 'Save Group poll');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupPolls/mutations:configurePoll',
    expect.objectContaining({ toolId: 'tool-123', version: 3, mode: 'SINGLE' })
  );
  await act(async () => m.unmount());
});
it('creates shared reusable poll template through ordinary native controls', async () => {
  const m = await mount(CreateScreen);
  await press(m, 'Use poll template Topics');
  await press(m, 'Save Group poll');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupPolls/mutations:createPoll',
    expect.objectContaining({
      mode: 'MULTIPLE',
      options: expect.arrayContaining([
        { id: 'discussion', label: 'Discussion' },
      ]),
    })
  );
  await act(async () => m.unmount());
});
it('history after access loss uses only private snapshot query and paging', async () => {
  network.requiredOnboarding = true;
  const m = await mount(HistoryScreen);
  expect(
    m.root.findAll(n => n.type === 'Text').map(n => n.props.children)
  ).toContain('Original option');
  expect(network.watches.mock.calls.map(([n]) => n)).not.toContain(
    'groupPolls/queries:getPoll'
  );
  await act(async () => m.unmount());
});
it('results distinguish historical votes without fabricating a Group total', async () => {
  const m = await mount(ResultsScreen);
  expect(
    m.root.findAll(n => n.type === 'Text').map(n => n.props.children)
  ).toContain('Historical vote: no longer counts under the current rule');
  await act(async () => m.unmount());
});
it('removes retained history under access loss using server revision with explicit confirmation', async () => {
  network.requiredOnboarding = true;
  network.revision = 7;
  const m = await mount(HistoryScreen);
  await press(m, 'Remove my saved poll history');
  const { Alert } = await import('react-native');
  const buttons = vi.mocked(Alert.alert).mock.calls.at(-1)![2]!;
  await act(async () => {
    await buttons[1].onPress?.();
  });
  expect(network.mutation).toHaveBeenCalledWith(
    'groupPolls/mutations:removeVote',
    { toolId: 'tool-123', expectedRevision: 7 }
  );
  await act(async () => m.unmount());
});
it('current onboarding revocation reactively removes native voting and protected subscription', async () => {
  const m = await mount(PollScreen);
  expect(control(m, 'Vote Books')).toBeDefined();
  await act(async () => {
    network.requiredOnboarding = true;
    network.subscribers.forEach(f => f());
  });
  expect(control(m, 'Vote Books')).toBeUndefined();
  expect(control(m, 'My poll vote history')).toBeDefined();
  await act(async () => m.unmount());
});
it('native moderation confirms and sends the exact latest result revision', async () => {
  const m = await mount(ResultsScreen);
  await press(m, 'Remove poll result vote-123');
  const { Alert } = await import('react-native');
  const buttons = vi.mocked(Alert.alert).mock.calls.at(-1)![2]!;
  await act(async () => {
    await buttons[1].onPress?.();
  });
  expect(network.mutation).toHaveBeenCalledWith(
    'groupPolls/mutations:removeResult',
    { voteId: 'vote-123', expectedRevision: 2 }
  );
  await act(async () => m.unmount());
});
it('failed removal retains history and retries only after explicit current-revision confirmation', async () => {
  network.revision = 7;
  network.mutation.mockRejectedValueOnce(new Error('Vote changed'));
  const m = await mount(HistoryScreen);
  const { Alert } = await import('react-native');
  await press(m, 'Remove my saved poll history');
  await act(async () => {
    vi.mocked(Alert.alert).mock.calls.at(-1)![2]![1].onPress?.();
  });
  expect(network.mutation).toHaveBeenCalledTimes(1);
  expect(
    m.root.findAll(n => n.type === 'Text').map(n => n.props.children)
  ).toContain('Vote changed');
  await act(async () => {
    network.revision = 8;
    network.subscribers.forEach(f => f());
  });
  await press(m, 'Remove my saved poll history');
  await act(async () => {
    vi.mocked(Alert.alert).mock.calls.at(-1)![2]![1].onPress?.();
  });
  expect(network.mutation).toHaveBeenLastCalledWith(
    'groupPolls/mutations:removeVote',
    { toolId: 'tool-123', expectedRevision: 8 }
  );
  await act(async () => m.unmount());
});

it.each(['MANAGERS', 'MEMBERS'] as const)(
  'discloses %s vote retention before saving without promising departure erasure',
  async visibility => {
    network.visibility = visibility;
    const m = await mount(PollScreen);
    const text = m.root
      .findAll(n => n.type === 'Text')
      .map(n => n.props.children)
      .filter(value => typeof value === 'string')
      .join(' ');
    expect(text).toContain(
      'Leaving or being removed from the Group retains your saved vote with your author identity and private snapshots.'
    );
    expect(text).toContain(
      'Explicitly removing your vote clears its selections and private history.'
    );
    expect(text).toContain(
      visibility === 'MANAGERS'
        ? 'Account deletion purges your private votes and history.'
        : 'Account deletion preserves shared latest votes anonymously and purges private history.'
    );
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => m.unmount());
  }
);
