import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { setToastAdapter } from '@groupi/shared/platform';
import { getFunctionName } from 'convex/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
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

function result(name: string, _args: Record<string, unknown>) {
  if (name === 'groups/queries:getGroup')
    return network.member
      ? {
          _id: 'group-123',
          canManageMembers: network.manager,
          joiningQuestionnaire: {
            canAccessMemberContent: !network.requiredOnboarding,
          },
        }
      : null;
  if (name === 'groupTools/queries:getListPolicy')
    return {
      enabled: network.enabled,
      creation: network.formEditable ? 'MEMBERS' : 'MANAGERS',
      canConfigure: network.manager && !network.moderator,
    };
  if (
    name === 'groupLists/queries:getList' ||
    name === 'groupLists/queries:getListForManagement'
  )
    return {
      _id: 'tool-123',
      groupId: 'group-123',
      kind: 'LIST',
      title: 'Reading suggestions',
      description: 'Books',
      resultsVisibility: network.ownInvite ? 'MANAGERS' : 'MEMBERS',
      version: 3,
      canManage: network.manager,
    };
  if (name === 'groupLists/queries:listLists')
    return {
      page: [{ _id: 'tool-123', title: 'Reading suggestions' }],
      isDone: false,
      continueCursor: 'next',
    };
  if (
    name === 'groupLists/queries:listEntries' ||
    name === 'groupLists/queries:getOwnEntries'
  )
    return {
      page: [
        {
          _id: 'entry-123',
          toolId: 'tool-123',
          groupId: 'group-123',
          personId: network.ownInvite ? 'person-123' : undefined,
          listTitle: 'Saved title',
          text: 'Dune',
          completed: false,
          revision: 4,
          canEdit:
            name === 'groupLists/queries:listEntries' &&
            (network.manager || network.ownInvite),
          canRemove:
            name === 'groupLists/queries:getOwnEntries' ||
            network.manager ||
            network.ownInvite,
        },
      ],
      isDone: false,
      continueCursor: 'next',
    };
  if (name === 'auth/queries:getCurrentUserAndPerson') return profile;
  if (name === 'users/queries:checkNeedsOnboarding') return false;
  return undefined;
}
import { ConvexClientProvider } from '../../providers/convex-provider';
import { GlobalUserProvider } from '../../context/global-user-context';
import ListScreen, {
  ErrorBoundary as ListErrorBoundary,
} from '../../../app/groups/[groupId]/lists/[toolId]';
import OwnScreen from '../../../app/groups/[groupId]/lists/[toolId]/own';
import ManageScreen from '../../../app/groups/[groupId]/lists/[toolId]/manage';
import CreateScreen from '../../../app/groups/[groupId]/lists/create';
import HubScreen from '../../../app/groups/[groupId]/lists';
import PolicyScreen from '../../../app/groups/[groupId]/lists/policy';
import { Alert } from 'react-native';
function screen(component: () => ReactNode) {
  return createElement(
    ConvexClientProvider,
    null,
    createElement(GlobalUserProvider, null, createElement(component))
  );
}
const mountedScreens: Mounted[] = [];
afterEach(async () => {
  await act(async () => {
    for (const mounted of mountedScreens.splice(0)) mounted.unmount();
  });
});
async function mount(component = ListScreen) {
  let mounted: Mounted;
  await act(async () => {
    mounted = renderer.create(screen(component));
  });
  mountedScreens.push(mounted!);
  return mounted!;
}
async function press(mounted: Mounted, label: string) {
  await act(async () => {
    await (control(mounted, label).props.onPress as () => unknown)();
  });
}
async function type(mounted: Mounted, label: string, value: string) {
  await act(async () => {
    (
      control(mounted, label, 'TextInput').props.onChangeText as (
        text: string
      ) => void
    )(value);
  });
}
function confirm() {
  vi.spyOn(Alert, 'alert').mockImplementation((_title, _message, actions) => {
    actions
      ?.find(
        action => action.style === 'destructive' || action.text === 'Confirm'
      )
      ?.onPress?.();
  });
}
function control(mounted: Mounted, label: string, type = 'Pressable') {
  return mounted.root.findAll(
    node => node.type === type && node.props.accessibilityLabel === label
  )[0];
}
beforeEach(() => {
  network.formEditable = true;
  network.member = true;
  network.manager = true;
  network.moderator = false;
  network.enabled = true;
  network.requiredOnboarding = false;
  network.ownInvite = true;
  vi.restoreAllMocks();
  network.mutation.mockReset();
  network.mutation.mockResolvedValue({
    entryId: 'entry-created',
    state: 'PRESENT',
  });
  network.watches.mockClear();
  setToastAdapter({
    show: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  });
});
it('adds a disclosed persistent contribution through the actual SDK provider', async () => {
  const mounted = await mount();
  const field = control(mounted, 'New list entry', 'TextInput');
  expect(field).toBeDefined();
  await act(async () => {
    (field.props.onChangeText as (value: string) => void)('Dune');
  });
  await act(async () => {
    await (control(mounted, 'Add list entry').props.onPress as () => unknown)();
  });
  expect(network.mutation).toHaveBeenCalledWith(
    'groupLists/mutations:addEntry',
    expect.objectContaining({
      toolId: 'tool-123',
      version: 3,
      text: 'Dune',
      requestId: expect.stringMatching(/^\d+\.[a-f0-9-]{36}$/i),
    })
  );
});

it('preserves the frozen request and body for an uncertain retry', async () => {
  const mounted = await mount();
  await type(mounted, 'New list entry', 'Dune');
  network.mutation.mockRejectedValueOnce(new Error('Connection lost'));
  await press(mounted, 'Add list entry');
  const first = network.mutation.mock.calls[0];
  expect(control(mounted, 'New list entry', 'TextInput').props.editable).toBe(
    false
  );
  await press(mounted, 'Retry saved list entry');
  expect(network.mutation.mock.calls[1]).toEqual(first);
});
it('edits text and completion with the current entry revision', async () => {
  network.manager = false;
  const mounted = await mount();
  await type(mounted, 'Edit entry Dune', 'Dune revised');
  expect(control(mounted, 'Completed: Dune').props.role).toBe('checkbox');
  expect(
    control(mounted, 'Completed: Dune').props.accessibilityState
  ).toMatchObject({ checked: false });
  await press(mounted, 'Completed: Dune');
  expect(
    control(mounted, 'Completed: Dune').props.accessibilityState
  ).toMatchObject({ checked: true });
  await press(mounted, 'Save entry Dune');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupLists/mutations:editEntry',
    {
      entryId: 'entry-123',
      version: 3,
      expectedRevision: 4,
      text: 'Dune revised',
      completed: true,
    }
  );
});
it('ordinary members cannot edit or remove another or anonymous contribution', async () => {
  network.manager = false;
  network.ownInvite = false;
  const mounted = await mount();
  expect(control(mounted, 'Save entry Dune')).toBeUndefined();
  expect(control(mounted, 'Remove entry Dune')).toBeUndefined();
});
it('eligible managers moderate an anonymous shared contribution without policy escalation', async () => {
  network.ownInvite = false;
  const mounted = await mount();
  confirm();
  await press(mounted, 'Remove entry Dune');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupLists/mutations:removeEntry',
    { entryId: 'entry-123', expectedRevision: 4 }
  );
});
it('retained own recovery removes saved entries after departure without current definitions', async () => {
  network.member = false;
  network.enabled = false;
  network.requiredOnboarding = true;
  const mounted = await mount(OwnScreen);
  expect(control(mounted, 'Save entry Dune')).toBeUndefined();
  confirm();
  await press(mounted, 'Remove entry Dune');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupLists/mutations:removeEntry',
    { entryId: 'entry-123', expectedRevision: 4 }
  );
  expect(
    network.watches.mock.calls.some(([name]) =>
      [
        'groups/queries:getGroup',
        'groupLists/queries:getList',
        'groupLists/queries:getListForManagement',
        'groupLists/queries:listEntries',
      ].includes(name)
    )
  ).toBe(false);
  await press(mounted, 'Next List entries');
  expect(network.watches).toHaveBeenCalledWith(
    'groupLists/queries:getOwnEntries',
    { toolId: 'tool-123', paginationOpts: { numItems: 20, cursor: 'next' } }
  );
});
it('disabled ordinary content stays unmounted while eligible managers can configure preserved lists', async () => {
  network.enabled = false;
  let mounted = await mount();
  expect(control(mounted, 'Add list entry')).toBeUndefined();
  expect(
    network.watches.mock.calls.some(
      ([name]) => name === 'groupLists/queries:getList'
    )
  ).toBe(false);
  mounted = await mount(ManageScreen);
  await type(mounted, 'List title', 'Renamed');
  await press(mounted, 'Save Group list');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupLists/mutations:configureList',
    { toolId: 'tool-123', version: 3, title: 'Renamed', description: 'Books' }
  );
});
it('required onboarding blocks manager content and configuration without blocking narrow owner policy', async () => {
  network.requiredOnboarding = true;
  const mounted = await mount(ManageScreen);
  expect(control(mounted, 'Save Group list')).toBeUndefined();
  expect(
    network.watches.mock.calls.some(
      ([name]) => name === 'groupLists/queries:getListForManagement'
    )
  ).toBe(false);
  const policy = await mount(PolicyScreen);
  await press(policy, 'Disable Group lists');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupTools/mutations:configureListPolicy',
    { groupId: 'group-123', enabled: false, creation: 'MEMBERS' }
  );
});
it('creates a templated list with disclosed immutable visibility', async () => {
  network.mutation.mockResolvedValue('tool-created');
  const mounted = await mount(CreateScreen);
  await press(mounted, 'Use list template Reading suggestions');
  await press(mounted, 'List visible to managers');
  await press(mounted, 'Save Group list');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupLists/mutations:createList',
    expect.objectContaining({
      groupId: 'group-123',
      title: 'Reading suggestions',
      resultsVisibility: 'MANAGERS',
    })
  );
  expect(network.replace).toHaveBeenCalledWith(
    '/groups/group-123/lists/tool-created'
  );
});
it('pages metadata and sends disabled managers to management instead of content', async () => {
  network.enabled = false;
  const mounted = await mount(HubScreen);
  await press(mounted, 'Manage list Reading suggestions');
  expect(network.push).toHaveBeenCalledWith(
    '/groups/group-123/lists/tool-123/manage'
  );
  await press(mounted, 'Next Lists');
  expect(network.watches).toHaveBeenCalledWith('groupLists/queries:listLists', {
    groupId: 'group-123',
    paginationOpts: { numItems: 20, cursor: 'next' },
  });
});
it('surfaces stale configuration and entry conflicts without changing revision or policy', async () => {
  network.mutation.mockRejectedValue(
    new Error('Entry changed. Reload before editing.')
  );
  const mounted = await mount();
  await press(mounted, 'Save entry Dune');
  expect(
    mounted.root.findAll(node => node.props.accessibilityRole === 'alert')
      .length
  ).toBeGreaterThan(0);
  expect(network.mutation).toHaveBeenCalledWith(
    'groupLists/mutations:editEntry',
    expect.objectContaining({ version: 3, expectedRevision: 4 })
  );
});

it('ordinary members cannot create when managers-only creation is current', async () => {
  network.manager = false;
  network.formEditable = false;
  const mounted = await mount(CreateScreen);
  expect(control(mounted, 'Save Group list')).toBeUndefined();
  expect(network.mutation).not.toHaveBeenCalled();
});
it('reactive eligibility loss unmounts ordinary list content while preserving the recovery link', async () => {
  const mounted = await mount();
  expect(control(mounted, 'Add list entry')).toBeDefined();
  await act(async () => {
    network.requiredOnboarding = true;
    for (const listener of network.subscribers) listener();
  });
  expect(control(mounted, 'Add list entry')).toBeUndefined();
  expect(control(mounted, 'My saved list entries')).toBeDefined();
});
it('moderators cannot change owner list policy', async () => {
  network.moderator = true;
  const mounted = await mount(PolicyScreen);
  expect(control(mounted, 'Disable Group lists')).toBeUndefined();
  expect(network.mutation).not.toHaveBeenCalled();
});

it('the production access-error boundary offers a usable retry control', async () => {
  const retry = vi.fn(async () => {});
  const mounted = await mount(() =>
    createElement(ListErrorBoundary, {
      error: new Error('Current access unavailable'),
      retry,
    })
  );
  const button = mounted.root.findAll(
    node => node.type === 'Pressable' && node.props.onPress === retry
  )[0];
  expect(button).toBeDefined();
  await act(async () => {
    await (button.props.onPress as () => unknown)();
  });
  expect(retry).toHaveBeenCalledOnce();
});
it('keeps configuration visibility immutable and reports a stale-version conflict on its separate manager screen', async () => {
  network.mutation.mockRejectedValueOnce(
    new Error('List configuration changed. Reload before saving.')
  );
  const mounted = await mount(ManageScreen);
  expect(control(mounted, 'List visible to members')).toBeUndefined();
  expect(control(mounted, 'List visible to managers')).toBeUndefined();
  await type(mounted, 'List title', 'Renamed');
  await press(mounted, 'Save Group list');
  expect(network.mutation).toHaveBeenCalledWith(
    'groupLists/mutations:configureList',
    { toolId: 'tool-123', version: 3, title: 'Renamed', description: 'Books' }
  );
  expect(
    mounted.root.findAll(node => node.props.accessibilityRole === 'alert')
      .length
  ).toBeGreaterThan(0);
});
