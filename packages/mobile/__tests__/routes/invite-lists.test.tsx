import { createRequire } from 'node:module';
import React, { act, type ReactElement } from 'react';
import { ConvexError } from 'convex/values';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Use the renderer already installed for native testing; no extra dependency.
const nativeRequire = createRequire(
  import.meta.resolve('@testing-library/react-native')
);
const { create } = nativeRequire('react-test-renderer');
interface NativeNode {
  type: unknown;
  props: {
    accessibilityLabel?: string;
    onPress?: () => unknown;
    onChangeText?: (value: string) => void;
    onFocus?: () => void;
    value?: string;
    disabled?: boolean;
  };
  children: Array<NativeNode | string>;
  findAll: (predicate: (node: NativeNode) => boolean) => NativeNode[];
}
interface NativeRender {
  root: NativeNode;
  update: (element: ReactElement) => void;
  unmount: () => void;
}
interface NavigationEvent {
  preventDefault: () => void;
  data: { action: unknown };
}

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  dispatch: vi.fn(),
  navigationListeners: new Map<string, (event: NavigationEvent) => void>(),
  hardwareBack: undefined as (() => boolean) | undefined,
  announce: vi.fn(),
  focus: vi.fn(),
  inputFocus: vi.fn(),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueries: vi.fn(),
  createList: vi.fn(),
  updateList: vi.fn(),
  deleteList: vi.fn(),
}));
vi.unmock('@groupi/shared/hooks');

vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  ActivityIndicator: 'ActivityIndicator',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: {
    OS: 'android',
    select: (choices: Record<string, unknown>) =>
      choices.native ?? choices.default,
  },
  BackHandler: {
    addEventListener: (_: string, callback: () => boolean) => {
      mocks.hardwareBack = callback;
      return {
        remove: () => {
          mocks.hardwareBack = undefined;
        },
      };
    },
  },
  AccessibilityInfo: {
    announceForAccessibility: mocks.announce,
    setAccessibilityFocus: mocks.focus,
  },
  findNodeHandle: () => 7,
  Keyboard: { dismiss: vi.fn() },
}));
vi.mock('@react-navigation/native', () => ({
  usePreventRemove: (
    enabled: boolean,
    callback: (event: { data: { action: { type: string } } }) => void
  ) =>
    React.useEffect(() => {
      if (!enabled) return;
      mocks.navigationListeners.set(
        'beforeRemove',
        (event: {
          preventDefault: () => void;
          data?: { action: { type: string } };
        }) => {
          event.preventDefault();
          callback({ data: event.data ?? { action: { type: 'GO_BACK' } } });
        }
      );
      return () => mocks.navigationListeners.delete('beforeRemove');
    }, [enabled, callback]),
}));
vi.mock('expo-router', async () => {
  const React = await import('react');
  return {
    router: { push: mocks.push, back: mocks.back },
    Stack: Object.assign(() => null, { Screen: () => null }),
    useNavigation: () => ({
      addListener: (
        name: string,
        callback: (event: NavigationEvent) => void
      ) => {
        mocks.navigationListeners.set(name, callback);
        return () => mocks.navigationListeners.delete(name);
      },
      dispatch: mocks.dispatch,
    }),
    useFocusEffect: (callback: () => void | (() => void)) =>
      React.useEffect(callback, [callback]),
  };
});
vi.mock('uniwind', () => ({
  useCSSVariable: () => '#8000aa',
  withUniwind: (component: unknown) => component,
}));
vi.mock('convex/react', () => ({
  useQuery: mocks.useQuery,
  useQueries: mocks.useQueries,
  useMutation: mocks.useMutation,
}));
vi.mock('convex/_generated/api', () => ({
  api: {
    inviteLists: {
      queries: {
        listInviteLists: 'list',
        getInviteList: 'detail',
        searchPeople: 'search',
        getFriendChoices: 'friends',
        getPeopleByIds: 'draftPeople',
      },
      mutations: {
        createInviteList: 'create',
        updateInviteList: 'update',
        deleteInviteList: 'delete',
      },
    },
  },
}));

import SettingsScreen from '../../app/settings';

const friend = {
  personId: 'person-friend',
  name: 'Alice',
  username: 'alice',
  image: null,
  available: true,
};
const stranger = {
  personId: 'person-other',
  name: 'Blair',
  username: 'blair',
  image: null,
  available: true,
};
const summary = {
  inviteListId: 'list-one',
  name: 'Weekend people',
  personCount: 2,
  availablePersonCount: 2,
  needsAttention: false,
  createdAt: 1,
  updatedAt: 1,
};
let lists: unknown = { items: [] };
let detail: unknown = { ...summary, people: [friend, stranger] };
let friends: unknown = { items: [friend] };
let people: unknown = { items: [stranger] };
let draftPeople: unknown;

async function inviteListsScreen() {
  const { default: InviteListsScreen } = await import(
    '../../app/settings/invite-lists'
  );
  await render(<InviteListsScreen />);
}
async function type(label: string, value: string) {
  await act(async () => {
    expect(control(label).props.onChangeText).toBeTypeOf('function');
    control(label).props.onChangeText?.(value);
  });
}
function textContents(node: NativeNode | string): string {
  return typeof node === 'string'
    ? node
    : node.children.map(textContents).join('');
}
function visibleText() {
  return textContents(rendered.root);
}

let rendered: NativeRender;
async function render(element: ReactElement) {
  await act(async () => {
    rendered = create(element, {
      createNodeMock: () => ({ focus: mocks.inputFocus }),
    });
  });
}
function control(label: string) {
  const nodes = rendered.root.findAll(
    node =>
      typeof node.type === 'string' && node.props.accessibilityLabel === label
  );
  expect(nodes, `accessible control: ${label}`).toHaveLength(1);
  return nodes[0];
}
async function press(label: string) {
  await act(async () => {
    expect(control(label).props.onPress).toBeTypeOf('function');
    await control(label).props.onPress?.();
  });
}

describe('native Invite lists Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.navigationListeners.clear();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
      callback();
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    lists = { items: [] };
    detail = { ...summary, people: [friend, stranger] };
    friends = { items: [friend] };
    people = { items: [stranger] };
    draftPeople = null;
    mocks.useQuery.mockImplementation((query: string, args: unknown) => {
      if (args === 'skip') return undefined;
      if (query === 'draftPeople')
        return draftPeople === null
          ? {
              items: [
                ...((friends as { items?: (typeof friend)[] }).items ?? []),
                ...((people as { items?: (typeof friend)[] }).items ?? []),
              ].filter(person =>
                (args as { personIds: string[] }).personIds.includes(
                  person.personId
                )
              ),
            }
          : draftPeople;
      const value = { list: lists, detail, friends, search: people }[
        query as 'list'
      ];
      if (value instanceof Error) throw value;
      return value;
    });
    mocks.useQueries.mockImplementation(
      (queries: Record<string, { query: string; args: unknown }>) =>
        Object.fromEntries(
          Object.entries(queries).map(([key, request]) => [
            key,
            mocks.useQuery(request.query, request.args),
          ])
        )
    );
    mocks.useMutation.mockImplementation((mutation: string) =>
      mutation === 'update'
        ? mocks.updateList
        : mutation === 'delete'
          ? mocks.deleteList
          : mocks.createList
    );
    mocks.createList.mockResolvedValue({
      ...summary,
      people: [friend, stranger],
    });
    mocks.updateList.mockResolvedValue({
      ...summary,
      name: 'Dinner',
      people: [stranger],
    });
    mocks.deleteList.mockResolvedValue({
      inviteListId: summary.inviteListId,
      deleted: true,
    });
  });
  afterEach(async () => {
    if (rendered) await act(async () => rendered.unmount());
    vi.unstubAllGlobals();
  });

  it('opens the dedicated Invite lists destination through a labeled Settings control', async () => {
    await render(<SettingsScreen />);
    await press('Invite lists');
    expect(mocks.push).toHaveBeenCalledWith('/settings/invite-lists');
  });

  it('anonymizes selected draft profiles immediately after deletion without changing identity selection', async () => {
    await inviteListsScreen();
    await press('Create invite list');
    await type('List name', 'Weekend');
    await press('Select Alice');
    expect(control('Remove Alice')).toBeDefined();
    draftPeople = {
      items: [
        {
          ...friend,
          available: false,
          name: 'Stale deleted name',
          username: 'stale-deleted',
          image: 'stale-avatar',
        },
      ],
    };
    friends = { items: [] };
    await type('List name', 'Weekend updated');
    expect(visibleText()).not.toContain('Alice');
    expect(visibleText()).not.toContain('Stale deleted name');
    expect(visibleText()).not.toContain('stale-deleted');
    expect(control('Remove Unavailable person')).toBeDefined();
    expect(visibleText()).toContain('Selected people (1/100)');
    await press('Remove Unavailable person');
    expect(visibleText()).toContain('Selected people (0/100)');
    expect(mocks.createList).not.toHaveBeenCalled();
  });

  it('retains an all-unavailable named list and permits repairing or deleting it silently', async () => {
    const affected = {
      ...summary,
      availablePersonCount: 0,
      needsAttention: true,
    };
    lists = { items: [affected] };
    detail = {
      ...affected,
      people: [
        {
          ...stranger,
          available: false,
          name: 'Deleted secret',
          username: 'deleted-secret',
          image: 'old-avatar',
        },
      ],
    };
    await inviteListsScreen();
    expect(visibleText()).toContain('Needs attention');
    await press('Open Weekend people');
    expect(visibleText()).toContain('Unavailable person');
    expect(visibleText()).not.toContain('Deleted secret');
    expect(visibleText()).not.toContain('deleted-secret');
    await press('Edit invite list');
    await press('Save invite list');
    expect(visibleText()).toContain('at least one existing');
    expect(mocks.updateList).not.toHaveBeenCalled();
    await press('Select Alice');
    mocks.updateList.mockImplementationOnce(async args => {
      detail = {
        ...summary,
        name: args.name,
        people: [
          {
            ...stranger,
            available: false,
            name: null,
            username: null,
            image: null,
          },
          friend,
        ],
        personCount: 2,
        availablePersonCount: 1,
        needsAttention: false,
      };
      return detail;
    });
    await press('Save invite list');
    expect(mocks.updateList).toHaveBeenCalledWith({
      inviteListId: 'list-one',
      name: 'Weekend people',
      personIds: ['person-other', 'person-friend'],
    });
    expect(visibleText()).toContain('1 available people');
    expect(visibleText()).not.toContain('Needs attention');
    await press('Delete invite list');
    await press('Confirm delete invite list');
    expect(mocks.deleteList).toHaveBeenCalledWith({ inviteListId: 'list-one' });
    expect(mocks.createList).not.toHaveBeenCalled();
  });

  it('saves a named selection of a friend and a username search result, then opens its detail', async () => {
    await inviteListsScreen();
    expect(visibleText()).toContain('No invite lists yet');
    await press('Create invite list');
    await type('List name', '  Weekend people  ');
    await press('Select Alice');
    await type('Search by username', 'blair');
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
    });
    await press('Select Blair');
    await press('Save invite list');
    expect(mocks.createList).toHaveBeenCalledWith({
      name: 'Weekend people',
      personIds: ['person-friend', 'person-other'],
    });
    expect(visibleText()).toContain('Weekend people');
    expect(visibleText()).toContain('@blair');
  });

  it('validates trimmed names and people without erasing the draft, and permits whitespace around 100 characters', async () => {
    await inviteListsScreen();
    await press('Create invite list');
    await type('List name', '  ');
    await press('Save invite list');
    expect(visibleText()).toContain('1–100 characters');
    await type('List name', 'a'.repeat(101));
    await press('Save invite list');
    expect(control('List name').props.value).toBe('a'.repeat(101));
    expect(mocks.createList).not.toHaveBeenCalled();
    await type('List name', '  ' + 'a'.repeat(100) + '  ');
    await press('Save invite list');
    expect(visibleText()).toContain('Choose at least one');
    await press('Select Alice');
    await press('Save invite list');
    expect(mocks.createList).toHaveBeenCalledWith({
      name: 'a'.repeat(100),
      personIds: ['person-friend'],
    });
  });

  it.each(['renamed', 'deleted'])(
    'saves a name that became available after another client %s its list while the editor was open',
    async change => {
      const dinner = { ...summary, name: 'Dinner' };
      lists = { items: [dinner] };
      await inviteListsScreen();
      await press('Create invite list');
      await type('List name', ' dinner ');
      await press('Select Alice');
      lists = {
        items:
          change === 'renamed'
            ? [{ ...dinner, name: 'Renamed elsewhere' }]
            : [],
      };
      mocks.createList.mockResolvedValueOnce({
        ...summary,
        inviteListId: 'list-new',
        name: 'dinner',
        people: [friend],
      });
      await press('Save invite list');
      expect(mocks.createList).toHaveBeenCalledWith({
        name: 'dinner',
        personIds: ['person-friend'],
      });
      expect(visibleText()).not.toContain('already have an invite list');
      expect(visibleText()).toContain('dinner');
    }
  );

  it('retains backend conflict feedback from a serialized Convex error while editing', async () => {
    lists = { items: [summary] };
    await inviteListsScreen();
    await press('Open Weekend people');
    await press('Edit invite list');
    await type('List name', 'Dinner');
    mocks.updateList.mockRejectedValueOnce(
      new ConvexError(
        JSON.stringify({ code: 'CONFLICT', message: 'Name already exists' })
      )
    );
    await press('Save invite list');
    expect(visibleText()).toContain('already have an invite list');
    expect(control('List name').props.value).toBe('Dinner');
    expect(control('Remove Alice')).toBeDefined();
    expect(control('Remove Blair')).toBeDefined();
  });

  it('retains saved unavailable identities on a rename-only edit until the owner explicitly removes them', async () => {
    const unavailable = {
      ...stranger,
      available: false,
      name: null,
      username: null,
      image: null,
    };
    lists = { items: [{ ...summary, availablePersonCount: 1 }] };
    detail = {
      ...summary,
      availablePersonCount: 1,
      people: [friend, unavailable],
    };
    draftPeople = { items: [friend, unavailable] };
    mocks.updateList.mockImplementation(async args => {
      detail = {
        ...summary,
        name: args.name,
        availablePersonCount: 1,
        people: args.personIds.map((id: string) =>
          id === friend.personId ? friend : unavailable
        ),
      };
      return detail;
    });
    await inviteListsScreen();
    await press('Open Weekend people');
    await press('Edit invite list');
    expect(control('Remove Unavailable person')).toBeDefined();
    expect(visibleText()).toContain('Selected people (2/100)');
    await type('List name', 'Renamed');
    await press('Save invite list');
    expect(mocks.updateList).toHaveBeenCalledWith({
      inviteListId: 'list-one',
      name: 'Renamed',
      personIds: ['person-friend', 'person-other'],
    });
    await press('Edit invite list');
    await press('Remove Unavailable person');
    await press('Save invite list');
    expect(mocks.updateList).toHaveBeenLastCalledWith({
      inviteListId: 'list-one',
      name: 'Renamed',
      personIds: ['person-friend'],
    });
  });

  it('preserves backend duplicate conflicts and failed saves without erasing the draft', async () => {
    lists = { items: [summary] };
    await inviteListsScreen();
    await press('Create invite list');
    await type('List name', ' WEEKEND PEOPLE ');
    await press('Select Alice');
    mocks.createList.mockRejectedValueOnce(
      new ConvexError({
        code: 'CONFLICT',
        message: 'Invite list name already exists',
      })
    );
    await press('Save invite list');
    expect(visibleText()).toContain('already have an invite list');
    expect(mocks.createList).toHaveBeenCalledWith({
      name: 'WEEKEND PEOPLE',
      personIds: ['person-friend'],
    });
    expect(control('List name').props.value).toBe(' WEEKEND PEOPLE ');
    expect(control('Remove Alice')).toBeDefined();
    await type('List name', 'Dinner');
    mocks.createList.mockRejectedValueOnce(new Error('Network unavailable'));
    await press('Save invite list');
    expect(visibleText()).toContain('Unable to save');
    expect(control('List name').props.value).toBe('Dinner');
    expect(visibleText()).toContain('Remove Alice');
    await press('Save invite list');
    expect(visibleText()).toContain('Weekend people');
  });

  it('keeps the unchanged draft when Cancel is followed by Keep Editing, and discards only after confirmation', async () => {
    await inviteListsScreen();
    await press('Create invite list');
    await type('List name', 'Dinner');
    await press('Select Alice');
    await type('Search by username', 'blair');
    await act(async () => control('Search by username').props.onFocus?.());
    await press('Cancel');
    expect(visibleText()).toContain('Discard changes?');
    expect(rendered.root.findAll(node => node.type === 'Modal')).toHaveLength(
      0
    );
    await press('Keep Editing');
    expect(control('List name').props.value).toBe('Dinner');
    expect(control('Search by username').props.value).toBe('blair');
    expect(visibleText()).toContain('Remove Alice');
    expect(mocks.inputFocus).toHaveBeenCalled();
    await press('Cancel');
    await press('Discard');
    expect(visibleText()).toContain('No invite lists yet');
    expect(mocks.createList).not.toHaveBeenCalled();
  });

  it.each(['header', 'hardware', 'navigation'])(
    'protects a dirty editor on %s Back and applies the intended destination only after Discard',
    async path => {
      await inviteListsScreen();
      await press('Create invite list');
      await type('List name', 'Dinner');
      const action = { type: 'POP', payload: { count: 1 } };
      const prevented = vi.fn();
      async function back() {
        if (path === 'header') await press('Go back');
        else
          await act(async () => {
            if (path === 'hardware') expect(mocks.hardwareBack?.()).toBe(true);
            else
              mocks.navigationListeners.get('beforeRemove')?.({
                preventDefault: prevented,
                data: { action },
              });
          });
      }
      await back();
      expect(visibleText()).toContain('Discard changes?');
      expect(mocks.dispatch).not.toHaveBeenCalled();
      expect(mocks.back).not.toHaveBeenCalled();
      await press('Keep Editing');
      expect(control('List name').props.value).toBe('Dinner');
      await back();
      await press('Discard');
      if (path === 'navigation') {
        expect(prevented).toHaveBeenCalled();
        expect(mocks.dispatch).toHaveBeenCalledWith(action);
      } else expect(visibleText()).toContain('No invite lists yet');
    }
  );

  it('shows collection failure and retries through an accessible control', async () => {
    lists = new Error('private internal error');
    await inviteListsScreen();
    expect(visibleText()).toContain('Unable to load invite lists');
    expect(visibleText()).not.toContain('private internal error');
    lists = { items: [summary] };
    await press('Retry invite lists');
    await press('Open Weekend people');
    expect(visibleText()).toContain('@alice');
  });

  it('explains the 100-list limit and disables new creation while saved lists remain inspectable', async () => {
    lists = {
      items: Array.from({ length: 100 }, (_, index) => ({
        ...summary,
        inviteListId: `list-${index}`,
        name: `List ${index}`,
      })),
    };
    await inviteListsScreen();
    expect(control('Create invite list').props.disabled).toBe(true);
    expect(visibleText()).toContain('at most 100 invite lists');
    await press('Open List 0');
    expect(visibleText()).toContain('@alice');
  });

  it('caps the selected people at 100, permits removing a person, and submits each identity once', async () => {
    friends = {
      items: Array.from({ length: 101 }, (_, index) => ({
        ...friend,
        personId: `person-${index}`,
        name: `Person ${index}`,
      })),
    };
    await inviteListsScreen();
    await press('Create invite list');
    await type('List name', 'Everyone');
    for (let index = 0; index < 100; index++)
      await press(`Select Person ${index}`);
    expect(control('Select Person 100').props.disabled).toBe(true);
    expect(visibleText()).toContain('at most 100 people');
    await press('Remove Person 0');
    await press('Select Person 100');
    await press('Save invite list');
    expect(mocks.createList.mock.calls[0][0].personIds).toHaveLength(100);
    expect(mocks.createList.mock.calls[0][0].personIds).not.toContain(
      'person-0'
    );
    expect(mocks.createList.mock.calls[0][0].personIds).toContain('person-100');
  });

  it('retains the editor draft and selected people when lookup fails and can retry', async () => {
    await inviteListsScreen();
    await press('Create invite list');
    await type('List name', 'Dinner');
    await press('Select Alice');
    people = new Error('lookup failed');
    await type('Search by username', 'blair');
    expect(visibleText()).toContain('Unable to load people');
    expect(control('List name').props.value).toBe('Dinner');
    expect(visibleText()).toContain('Remove Alice');
    people = { items: [stranger] };
    draftPeople = null;
    await press('Retry people');
    await press('Select Blair');
    await press('Save invite list');
    expect(mocks.createList.mock.calls[0][0].personIds).toEqual([
      'person-friend',
      'person-other',
    ]);
  });

  it('announces screen transitions and requests native accessibility focus', async () => {
    await inviteListsScreen();
    await press('Create invite list');
    expect(mocks.announce).toHaveBeenCalledWith('Create invite list');
    expect(mocks.focus).toHaveBeenCalledWith(7);
    await type('List name', 'Dinner');
    await press('Cancel');
    expect(mocks.announce).toHaveBeenCalledWith('Discard changes?');
    await press('Go back');
    expect(control('List name').props.value).toBe('Dinner');
  });

  it('presents labeled loading states and keeps empty friend choices usable through username search', async () => {
    lists = undefined;
    await inviteListsScreen();
    expect(control('Loading invite lists')).toBeDefined();
    lists = { items: [summary] };
    const { default: Screen } = await import('../../app/settings/invite-lists');
    await act(async () => rendered.update(<Screen />));
    detail = undefined;
    await press('Open Weekend people');
    expect(control('Loading invite list')).toBeDefined();
    await press('Go back');
    friends = undefined;
    await press('Create invite list');
    expect(control('Loading people')).toBeDefined();
    friends = { items: [] };
    await type('List name', 'Dinner');
    expect(visibleText()).toContain('No accepted friends yet');
    people = { items: [] };
    await type('Search by username', 'missing');
    expect(visibleText()).toContain('No people found');
  });

  it('reports detail failure and anonymizes unavailable people in Needs attention lists', async () => {
    lists = { items: [summary] };
    detail = new Error('not found');
    await inviteListsScreen();
    await press('Open Weekend people');
    expect(visibleText()).toContain('Unable to load invite list');
    detail = {
      ...summary,
      availablePersonCount: 0,
      needsAttention: true,
      people: [{ ...friend, available: false }],
    };
    await press('Retry invite list');
    expect(visibleText()).toContain('Needs attention');
    expect(visibleText()).toContain('Unavailable person');
    expect(visibleText()).not.toContain('Alice');
    expect(visibleText()).not.toContain('@alice');
  });

  it('can search existing non-friends even if loading accepted friends fails', async () => {
    await inviteListsScreen();
    friends = new Error('friends unavailable');
    await press('Create invite list');
    expect(visibleText()).toContain('Unable to load people');
    await type('Search by username', 'blair');
    await press('Select Blair');
    expect(visibleText()).toContain('Remove Blair');
  });

  it('edits a saved list through rename and removal, retains a failed draft, and saves only after explicit confirmation', async () => {
    lists = { items: [summary] };
    await inviteListsScreen();
    await press('Open Weekend people');
    await press('Edit invite list');
    await type('List name', '  Dinner  ');
    await press('Remove Alice');
    mocks.updateList.mockRejectedValueOnce(new Error('offline'));
    await press('Save invite list');
    expect(control('List name').props.value).toBe('  Dinner  ');
    expect(visibleText()).toContain('Remove Blair');
    expect(visibleText()).toContain('Unable to save');
    await press('Cancel');
    await press('Keep Editing');
    expect(control('List name').props.value).toBe('  Dinner  ');
    await press('Save invite list');
    expect(mocks.updateList).toHaveBeenCalledWith({
      inviteListId: 'list-one',
      name: 'Dinner',
      personIds: ['person-other'],
    });
    expect(mocks.createList).not.toHaveBeenCalled();
  });

  it('confirms deletion in the same flow, retains a failed deletion, and cancels without removing the saved list', async () => {
    lists = { items: [summary] };
    await inviteListsScreen();
    await press('Open Weekend people');
    await press('Delete invite list');
    expect(mocks.deleteList).not.toHaveBeenCalled();
    expect(rendered.root.findAll(node => node.type === 'Modal')).toHaveLength(
      0
    );
    await press('Keep invite list');
    expect(visibleText()).toContain('@alice');
    await press('Delete invite list');
    mocks.deleteList.mockRejectedValueOnce(new Error('offline'));
    await press('Confirm delete invite list');
    expect(visibleText()).toContain('Unable to delete');
    lists = { items: [] };
    await press('Confirm delete invite list');
    expect(mocks.deleteList).toHaveBeenCalledWith({ inviteListId: 'list-one' });
    expect(visibleText()).toContain('No invite lists yet');
  });

  it('cancels an unchanged edit without a discard prompt, and refuses to save after removing every person', async () => {
    lists = { items: [summary] };
    await inviteListsScreen();
    await press('Open Weekend people');
    await press('Edit invite list');
    await press('Cancel');
    expect(visibleText()).toContain('@alice');
    expect(visibleText()).not.toContain('Discard changes?');
    await press('Edit invite list');
    await press('Remove Alice');
    await press('Remove Blair');
    await press('Save invite list');
    expect(visibleText()).toContain('Choose at least one');
    expect(mocks.updateList).not.toHaveBeenCalled();
    await press('Select Alice');
    await press('Save invite list');
    expect(mocks.updateList).toHaveBeenCalledWith({
      inviteListId: 'list-one',
      name: 'Weekend people',
      personIds: ['person-friend'],
    });
  });

  it.each(['header', 'hardware', 'navigation'])(
    'protects edits on %s Back and restores the original saved detail on Discard',
    async path => {
      lists = { items: [summary] };
      await inviteListsScreen();
      await press('Open Weekend people');
      await press('Edit invite list');
      await type('List name', 'Changed');
      const action = { type: 'POP' };
      if (path === 'header') await press('Go back');
      else
        await act(async () => {
          if (path === 'hardware') expect(mocks.hardwareBack?.()).toBe(true);
          else
            mocks.navigationListeners.get('beforeRemove')?.({
              preventDefault: vi.fn(),
              data: { action },
            });
        });
      await press('Keep Editing');
      expect(control('List name').props.value).toBe('Changed');
      await press('Cancel');
      await press('Discard');
      expect(visibleText()).toContain('Weekend people');
      expect(visibleText()).toContain('@alice');
      expect(mocks.updateList).not.toHaveBeenCalled();
      expect(mocks.dispatch).not.toHaveBeenCalled();
    }
  );
});
