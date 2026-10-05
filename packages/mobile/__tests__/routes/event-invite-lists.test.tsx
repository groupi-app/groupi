import { createRequire } from 'node:module';
import React, { act, type ReactElement } from 'react';
import { getFunctionName } from 'convex/server';
import { ConvexError } from 'convex/values';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const nativeRequire = createRequire(
  import.meta.resolve('@testing-library/react-native')
);
const { create } = nativeRequire('react-test-renderer');
interface NativeNode {
  type: unknown;
  props: {
    accessibilityLabel?: string;
    disabled?: boolean;
    editable?: boolean;
    value?: string;
    maxLength?: number;
    onFocus?: () => void;
    onPress?: () => unknown;
    onChangeText?: (value: string) => void;
  };
  children: Array<NativeNode | string>;
  findAll: (predicate: (node: NativeNode) => boolean) => NativeNode[];
}
interface NativeRender {
  root: NativeNode;
  unmount: () => void;
  update: (element: ReactElement) => void;
}
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  mutation: vi.fn(),
  send: vi.fn(),
  createList: vi.fn(),
  uuid: vi.fn(),
  announce: vi.fn(),
  focus: vi.fn(),
  inputFocus: vi.fn(),
  back: vi.fn(),
  listeners: new Map<string, (event: { preventDefault: () => void }) => void>(),
  hardware: undefined as undefined | (() => boolean),
  options: vi.fn(),
}));
vi.unmock('@groupi/shared/hooks');
vi.unmock('convex/_generated/api');
vi.mock('convex/react', () => ({
  useQuery: mocks.query,
  useMutation: mocks.mutation,
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  Modal: 'Modal',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: {
    OS: 'ios',
    select: (options: Record<string, unknown>) =>
      options.native ?? options.ios ?? options.default,
  },
  AccessibilityInfo: {
    announceForAccessibility: mocks.announce,
    setAccessibilityFocus: mocks.focus,
  },
  findNodeHandle: () => 9,
  Keyboard: { dismiss: vi.fn() },
  Alert: { alert: vi.fn() },
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: vi.fn() }),
  },
  Share: { share: vi.fn() },
  BackHandler: {
    addEventListener: (_name: string, handler: () => boolean) => {
      mocks.hardware = handler;
      return {
        remove: () => {
          mocks.hardware = undefined;
        },
      };
    },
  },
  StyleSheet: { flatten: (value: unknown) => value, absoluteFillObject: {} },
}));
vi.mock('@react-navigation/native', () => ({
  usePreventRemove: (
    enabled: boolean,
    callback: (event: { data: { action: { type: string } } }) => void
  ) =>
    React.useEffect(() => {
      if (!enabled) return;
      mocks.listeners.set(
        'beforeRemove',
        (event: {
          preventDefault: () => void;
          data?: { action: { type: string } };
        }) => {
          event.preventDefault();
          callback({ data: event.data ?? { action: { type: 'GO_BACK' } } });
        }
      );
      return () => mocks.listeners.delete('beforeRemove');
    }, [enabled, callback]),
}));
vi.mock('expo-router', () => ({
  router: { back: mocks.back, push: vi.fn() },
  Stack: Object.assign(() => null, {
    Screen: ({ options }: { options: unknown }) => {
      mocks.options(options);
      return null;
    },
  }),
  useNavigation: () => ({
    addListener: (
      name: string,
      callback: (event: { preventDefault: () => void }) => void
    ) => {
      mocks.listeners.set(name, callback);
      return () => mocks.listeners.delete(name);
    },
  }),
  useFocusEffect: (callback: () => void) =>
    React.useEffect(callback, [callback]),
  useLocalSearchParams: () => ({ eventId: 'event-one' }),
}));
vi.mock('uniwind', () => ({
  useCSSVariable: () => '#8000aa',
  withUniwind: (component: unknown) => component,
}));
vi.mock('expo-clipboard', () => ({ setStringAsync: vi.fn() }));
vi.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModal: () => null,
  BottomSheetBackdrop: 'View',
  BottomSheetView: 'View',
  BottomSheetScrollView: 'ScrollView',
}));
vi.mock('@rn-primitives/avatar', () => ({
  Root: 'View',
  Image: 'Image',
  Fallback: 'View',
}));
vi.mock('@rn-primitives/separator', () => ({ Root: 'View' }));
vi.mock('@rn-primitives/select', () => ({
  useRootContext: () => ({ value: undefined, open: false }),
  Viewport: 'View',
  Root: 'View',
  Trigger: 'Pressable',
  Value: 'Text',
  Portal: 'View',
  Overlay: 'View',
  Content: 'View',
  Item: 'View',
  ItemText: 'Text',
  ItemIndicator: 'View',
  Group: 'View',
  Label: 'Text',
  Separator: 'View',
  ScrollUpButton: 'View',
  ScrollDownButton: 'View',
}));
vi.mock('@rn-primitives/portal', () => ({
  Portal: 'View',
  PortalHost: 'View',
}));
vi.mock('@rn-primitives/switch', () => ({ Root: 'Pressable', Thumb: 'View' }));
vi.mock('lucide-react-native', () => ({
  Check: 'Icon',
  ChevronDown: 'Icon',
  ChevronDownIcon: 'Icon',
  ChevronUpIcon: 'Icon',
  X: 'Icon',
}));
vi.mock('react-native-screens', () => ({ FullWindowOverlay: 'View' }));
vi.mock('react-native-reanimated', () => ({
  default: { View: 'View' },
  FadeIn: {},
  FadeOut: {},
  useSharedValue: (value: number) => React.useRef({ value }).current,
  useAnimatedStyle: (callback: () => unknown) => callback(),
  withRepeat: (value: unknown) => value,
  withTiming: (value: unknown) => value,
}));
// The app's session context uses a Metro-only require alias. Supply the signed-in
// identity boundary here; invitation queries, shared hooks and controls stay real.
vi.mock('../../src/context/global-user-context', () => ({
  GlobalUserProvider: ({ children }: { children: React.ReactNode }) => children,
  useGlobalUser: () => ({ person: { _id: 'self' } }),
}));

import InviteScreen, { InviteContent } from '../../app/event/[eventId]/invite';
import { GlobalUserProvider } from '../../src/context/global-user-context';
import { ActionMenuProvider } from '../../src/components/ui/action-menu';
import { MemberDrawerProvider } from '../../src/components/events/member-drawer';

const alice = {
  personId: 'person-a',
  name: 'Alice',
  username: 'alice',
  image: null,
  available: true,
};
const blair = {
  personId: 'person-b',
  name: 'Blair',
  username: 'blair',
  image: null,
  available: true,
};
const casey = {
  personId: 'person-c',
  name: 'Casey',
  username: 'casey',
  image: null,
  available: true,
};
const firstList = {
  inviteListId: 'list-a',
  name: 'First',
  personCount: 2,
  availablePersonCount: 2,
  needsAttention: false,
  createdAt: 1,
  updatedAt: 1,
};
const secondList = { ...firstList, inviteListId: 'list-b', name: 'Second' };
const auth = { user: { id: 'user-one' }, person: { _id: 'self' } };
let listCollection: unknown;
let details: Record<string, unknown>;
let pendingInvites: unknown[];
let eventMembers: unknown[];
let reviewOverride: unknown;
let rendered: NativeRender;
let eventHeader: unknown;
let draftProfiles: unknown;
function tree(canModerate = true, route = false) {
  return (
    <GlobalUserProvider>
      <ActionMenuProvider>
        <MemberDrawerProvider>
          {route ? (
            <InviteScreen />
          ) : (
            <InviteContent
              eventId={'event-one' as never}
              eventTitle='Dinner'
              canInviteModerator={canModerate}
            />
          )}
        </MemberDrawerProvider>
      </ActionMenuProvider>
    </GlobalUserProvider>
  );
}
async function render(canModerate = true, route = false) {
  await act(async () => {
    rendered = create(tree(canModerate, route), {
      createNodeMock: () => ({ focus: mocks.inputFocus }),
    });
  });
}
function control(label: string) {
  const nodes = rendered.root.findAll(
    node =>
      typeof node.type === 'string' && node.props.accessibilityLabel === label
  );
  expect(nodes, label).toHaveLength(1);
  return nodes[0];
}
async function press(label: string) {
  await act(async () => {
    expect(control(label).props.onPress).toBeTypeOf('function');
    await control(label).props.onPress?.();
  });
}
async function type(label: string, value: string) {
  await act(async () => control(label).props.onChangeText?.(value));
}
function text(node: NativeNode | string): string {
  return typeof node === 'string' ? node : node.children.map(text).join('');
}
function visibleText() {
  return text(rendered.root);
}

describe('native invitation recipient review from lists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listeners.clear();
    mocks.hardware = undefined;
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('expo', { uuidv4: mocks.uuid });
    mocks.uuid.mockReturnValue('550e8400-e29b-41d4-a716-446655440000');
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
      callback();
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    listCollection = { items: [firstList, secondList] };
    details = {
      'list-a': { ...firstList, people: [alice, blair] },
      'list-b': { ...secondList, people: [blair, casey] },
    };
    pendingInvites = [];
    eventMembers = [];
    reviewOverride = null;
    draftProfiles = null;
    eventHeader = {
      event: { title: 'Dinner' },
      userMembership: { role: 'ORGANIZER' },
      permissions: { inviteMembers: 'MODERATOR' },
    };
    mocks.query.mockImplementation((query, args) => {
      if (args === 'skip') return undefined;
      const name = getFunctionName(query);
      if (name === 'auth/queries:getCurrentUserAndPerson') return auth;
      if (name === 'users/queries:checkNeedsOnboarding') return false;
      if (name === 'events/queries:getEventHeader') {
        if (eventHeader instanceof Error) throw eventHeader;
        return eventHeader;
      }
      if (name === 'invites/queries:getEventInvites')
        return { invites: [], pendingEmailCount: 0 };
      if (name === 'friends/queries:getFriends') return [alice, blair, casey];
      if (name === 'events/queries:getEventAttendeesData')
        return { event: { memberships: eventMembers } };
      if (name === 'eventInvites/queries:getSentEventInvites')
        return pendingInvites;
      if (
        name === 'eventInvites/queries:searchUserByExactUsernameForEventInvite'
      )
        return args.searchTerm === 'casey'
          ? { ...casey, isFriend: true, hasPendingInvite: false }
          : null;
      if (name === 'eventInvites/queries:searchUsersForEventInvite') return [];
      if (name === 'inviteLists/queries:getPeopleByIds')
        return draftProfiles === null
          ? {
              items: [alice, blair, casey].filter(person =>
                args.personIds.includes(person.personId)
              ),
            }
          : draftProfiles;
      if (name === 'inviteLists/queries:getFriendChoices')
        return { items: [alice, blair, casey] };
      if (name === 'inviteLists/queries:searchPeople')
        return { items: args.searchTerm === 'casey' ? [casey] : [] };
      if (name === 'inviteLists/queries:listInviteLists') return listCollection;
      if (name === 'inviteLists/queries:getInviteList') {
        const result = details[args.inviteListId];
        if (result instanceof Error) throw result;
        return result;
      }
      if (name === 'inviteLists/queries:reviewInviteListRecipients') {
        if (reviewOverride instanceof Error) throw reviewOverride;
        if (reviewOverride !== null) return reviewOverride;
        return {
          eventId: 'event-one',
          totalCount: args.personIds.length,
          eligibleCount: args.personIds.length,
          skippedCount: 0,
          results: args.personIds.map((personId: string) => ({
            ...([alice, blair, casey].find(
              person => person.personId === personId
            ) ?? {
              personId,
              name: personId,
              username: null,
              image: null,
              available: true,
            }),
            status: 'eligible',
          })),
        };
      }
      return undefined;
    });
    mocks.mutation.mockImplementation(query =>
      getFunctionName(query) ===
      'inviteLists/mutations:sendInviteListRecipients'
        ? mocks.send
        : getFunctionName(query) === 'inviteLists/mutations:createInviteList'
          ? mocks.createList
          : vi.fn()
    );
    mocks.createList.mockImplementation(async args => ({
      ...firstList,
      inviteListId: 'new-list',
      name: args.name,
      people: args.personIds.map((id: string) =>
        [alice, blair, casey].find(person => person.personId === id)
      ),
      personCount: args.personIds.length,
      availablePersonCount: args.personIds.length,
    }));
    mocks.send.mockImplementation(async args => ({
      eventId: 'event-one',
      totalCount: args.personIds.length,
      sentCount: args.personIds.length,
      skippedCount: 0,
      results: args.personIds.map((personId: string) => ({
        personId,
        status: 'sent',
        inviteId: `invite-${personId}`,
      })),
    }));
  });
  afterEach(async () => {
    if (rendered) await act(async () => rendered.unmount());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows loading and unavailable route states without reading unauthorized invite options', async () => {
    eventHeader = undefined;
    await render(true, true);
    expect(control('Loading invite options')).toBeDefined();
    expect(
      mocks.query.mock.calls.some(
        ([query]) =>
          getFunctionName(query) === 'invites/queries:getEventInvites'
      )
    ).toBe(false);
    eventHeader = {
      event: { title: 'Dinner' },
      userMembership: { role: 'ATTENDEE' },
      permissions: { inviteMembers: 'MODERATOR' },
    };
    await act(async () => rendered.update(tree(true, true)));
    expect(visibleText()).toContain('Inviting unavailable');
    expect(
      rendered.root.findAll(
        node => node.props.accessibilityLabel === 'From list'
      )
    ).toHaveLength(0);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('preserves link, individual people, and email methods for an authorized event route', async () => {
    await render(true, true);
    expect(visibleText()).toContain('Dinner');
    for (const label of ['Link', 'People', 'From list', 'Email'])
      expect(control(label)).toBeDefined();
    await press('People');
    await press('Invite Alice');
    await press('Send Invite');
    expect(
      mocks.mutation.mock.calls.some(
        ([query]) =>
          getFunctionName(query) === 'eventInvites/mutations:sendEventInvite'
      )
    ).toBe(true);
    expect(mocks.send).not.toHaveBeenCalled();
    await press('Email');
    expect(visibleText()).toContain('email');
  });

  it('copies overlapping lists into editable recipients, retains the draft through tabs, and sends only explicitly', async () => {
    await render();
    await press('From list');
    await press('Select First');
    await press('Select Second');
    await press('Review selected lists');
    expect(visibleText()).toContain('3 recipients');
    expect(mocks.send).not.toHaveBeenCalled();
    await press('Remove Blair');
    await press('People');
    await press('From list');
    expect(visibleText()).toContain('2 recipients');
    expect(visibleText()).not.toContain('Remove Blair');
    await press('Send invitations');
    expect(mocks.send.mock.calls[0][0].personIds).toEqual([
      'person-a',
      'person-c',
    ]);
  });

  it('combines manual selection with list people, keeps the reviewed snapshot after list changes, and forwards organizer role and the bounded message', async () => {
    await render();
    await press('People');
    await press('Invite Casey');
    await type('Personal message (optional)', 'See you there');
    await press('Moderator');
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    expect(visibleText()).toContain('3 recipients');
    expect(mocks.send).not.toHaveBeenCalled();
    details['list-a'] = { ...firstList, people: [casey] };
    await press('Link');
    await press('From list');
    expect(control('Remove Alice')).toBeDefined();
    expect(control('Remove Blair')).toBeDefined();
    expect(control('Personal message (optional)').props.maxLength).toBe(280);
    await press('Send invitations');
    expect(mocks.send.mock.calls[0][0]).toMatchObject({
      eventId: 'event-one',
      personIds: ['person-c', 'person-a', 'person-b'],
      role: 'MODERATOR',
      message: 'See you there',
    });
    expect(visibleText()).toContain('3 invitations sent.');
  });

  it('captures current list members when reselected without changing already reviewed recipients', async () => {
    await render();
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    await press('Select First');
    details['list-a'] = { ...firstList, people: [casey] };
    await press('Select First');
    expect(visibleText()).toContain('2 recipients');
    expect(control('Remove Alice')).toBeDefined();
    await press('Review selected lists');
    expect(visibleText()).toContain('3 recipients');
    expect(control('Remove Casey')).toBeDefined();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('retains protected recovery through permission loading or revocation and blocks header, hardware, navigation, and gestures', async () => {
    await render(true, true);
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    mocks.send.mockRejectedValueOnce(new Error('lost response'));
    await press('Send invitations');
    const original = mocks.send.mock.calls[0][0];
    await press('Go back');
    expect(mocks.back).not.toHaveBeenCalled();
    await act(async () => {
      expect(mocks.hardware?.()).toBe(true);
    });
    const preventDefault = vi.fn();
    await act(async () =>
      mocks.listeners.get('beforeRemove')?.({ preventDefault })
    );
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(mocks.options).toHaveBeenLastCalledWith(
      expect.objectContaining({ gestureEnabled: false })
    );
    eventHeader = undefined;
    await act(async () => rendered.update(tree(true, true)));
    expect(control('Retry original invitations')).toBeDefined();
    eventHeader = {
      event: { title: 'Dinner' },
      userMembership: { role: 'ATTENDEE' },
      permissions: { inviteMembers: 'MODERATOR' },
    };
    reviewOverride = new ConvexError({
      code: 'FORBIDDEN',
      message: 'Permission changed',
    });
    await act(async () => rendered.update(tree(true, true)));
    expect(visibleText()).toContain('Inviting unavailable');
    expect(control('Retry original invitations')).toBeDefined();
    mocks.send.mockRejectedValueOnce(
      new ConvexError({ code: 'FORBIDDEN', message: 'Permission changed' })
    );
    await press('Retry original invitations');
    expect(mocks.send.mock.calls[1][0]).toEqual(original);
    expect(mocks.uuid).toHaveBeenCalledOnce();
    expect(control('Retry original invitations')).toBeDefined();
    expect(mocks.back).not.toHaveBeenCalled();
    eventHeader = new Error('You are not a member of this event');
    await act(async () => rendered.update(tree(true, true)));
    expect(visibleText()).toContain('Unable to load event permissions');
    expect(control('Retry original invitations')).toBeDefined();
    expect(mocks.uuid).toHaveBeenCalledOnce();
  });

  it('protects an in-flight send from concurrent presses and navigation until its outcome is known', async () => {
    let resolveSend!: (value: unknown) => void;
    mocks.send.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveSend = resolve;
        })
    );
    await render();
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    await press('Send invitations');
    expect(control('People').props.disabled).toBe(true);
    expect(control('Personal message (optional)').props.editable).toBe(false);
    await press('Send invitations');
    expect(mocks.send).toHaveBeenCalledOnce();
    await press('Go back');
    expect(mocks.back).not.toHaveBeenCalled();
    const preventDefault = vi.fn();
    await act(async () =>
      mocks.listeners.get('beforeRemove')?.({ preventDefault })
    );
    expect(preventDefault).toHaveBeenCalledOnce();
    await act(async () =>
      resolveSend({
        eventId: 'event-one',
        totalCount: 2,
        sentCount: 2,
        skippedCount: 0,
        results: [
          { personId: 'person-a', status: 'sent', inviteId: 'invite-a' },
          { personId: 'person-b', status: 'sent', inviteId: 'invite-b' },
        ],
      })
    );
    expect(visibleText()).toContain('2 invitations sent.');
    await press('Go back');
    expect(mocks.back).toHaveBeenCalledOnce();
    expect(mocks.options).toHaveBeenLastCalledWith(
      expect.objectContaining({ gestureEnabled: true })
    );
  });

  it('keeps recovery reachable when unrelated legacy invite data fails', async () => {
    await render();
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    mocks.send.mockRejectedValueOnce(new Error('lost response'));
    await press('Send invitations');
    const previousQuery = mocks.query.getMockImplementation()!;
    mocks.query.mockImplementation((query, args) => {
      if (getFunctionName(query) === 'invites/queries:getEventInvites')
        throw new Error('unavailable legacy data');
      return previousQuery(query, args);
    });
    await act(async () => rendered.update(tree()));
    expect(visibleText()).toContain('Unable to load invite options');
    expect(control('Retry original invitations')).toBeDefined();
    await press('Retry original invitations');
    expect(mocks.send.mock.calls[1][0]).toEqual(mocks.send.mock.calls[0][0]);
    expect(mocks.uuid).toHaveBeenCalledOnce();
  });

  it('retains the original protected Moderator role wording after permission revocation', async () => {
    await render(true, true);
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    await press('Moderator');
    mocks.send.mockRejectedValueOnce(new Error('lost response'));
    await press('Send invitations');
    eventHeader = {
      event: { title: 'Dinner' },
      userMembership: { role: 'ATTENDEE' },
      permissions: { inviteMembers: 'MODERATOR' },
    };
    await act(async () => rendered.update(tree(true, true)));
    expect(control('Moderator').props.disabled).toBe(true);
    expect(visibleText()).not.toContain('Invite as Attendee');
    await press('Retry original invitations');
    expect(mocks.send.mock.calls[1][0].role).toBe('MODERATOR');
  });

  it('creates silently in the same invitation flow and adds saved people only for Save and use', async () => {
    await render();
    await press('People');
    await type('Search people by username', 'casey');
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    await press('Remove Blair');
    await press('Moderator');
    await type('Personal message (optional)', 'Prior invitation draft');
    await press('Create invite list');
    await press('Cancel');
    expect(visibleText()).toContain('1 recipients');
    expect(control('Personal message (optional)').props.value).toBe(
      'Prior invitation draft'
    );
    await press('Create invite list');
    await type('List name', 'Weekend');
    await press('Select Casey');
    await press('Save');
    expect(visibleText()).toContain('1 recipients');
    expect(mocks.createList).toHaveBeenCalledWith({
      name: 'Weekend',
      personIds: ['person-c'],
    });
    await press('Create invite list');
    await type('List name', 'Weekend two');
    await press('Select Alice');
    await press('Select Casey');
    await press('Save and use');
    expect(visibleText()).toContain('2 recipients');
    expect(control('Remove Casey')).toBeDefined();
    expect(control('Personal message (optional)').props.value).toBe(
      'Prior invitation draft'
    );
    await press('People');
    expect(control('Search people by username').props.value).toBe('casey');
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it.each(['Cancel', 'header Back', 'hardware Back', 'navigation dismissal'])(
    'guards dirty inline %s and restores the prior invitation context after Discard',
    async path => {
      await render();
      await press('People');
      await type('Search people by username', 'casey');
      await press('From list');
      await press('Select First');
      await press('Review selected lists');
      await type('Personal message (optional)', 'Prior message');
      await press('Create invite list');
      await type('List name', 'Unsaved');
      await type('Search by username', 'casey');
      await act(async () => control('Search by username').props.onFocus?.());
      await press('Select Casey');
      async function dismiss() {
        if (path === 'Cancel') await press('Cancel');
        else if (path === 'header Back') await press('Go back');
        else if (path === 'hardware Back')
          await act(async () => {
            expect(mocks.hardware?.()).toBe(true);
          });
        else {
          const preventDefault = vi.fn();
          await act(async () =>
            mocks.listeners.get('beforeRemove')?.({ preventDefault })
          );
          expect(preventDefault).toHaveBeenCalledOnce();
        }
      }
      await dismiss();
      expect(visibleText()).toContain('Discard changes?');
      expect(mocks.back).not.toHaveBeenCalled();
      await press('Keep Editing');
      expect(control('List name').props.value).toBe('Unsaved');
      expect(control('Search by username').props.value).toBe('casey');
      expect(control('Remove Casey')).toBeDefined();
      expect(mocks.inputFocus).toHaveBeenCalled();
      expect(mocks.options).toHaveBeenLastCalledWith(
        expect.objectContaining({
          gestureEnabled: false,
          headerBackButtonMenuEnabled: false,
        })
      );
      await dismiss();
      await press('Discard');
      expect(visibleText()).toContain('2 recipients');
      expect(control('Personal message (optional)').props.value).toBe(
        'Prior message'
      );
      await press('People');
      expect(control('Search people by username').props.value).toBe('casey');
      expect(mocks.createList).not.toHaveBeenCalled();
      expect(mocks.send).not.toHaveBeenCalled();
      expect(mocks.back).not.toHaveBeenCalled();
      expect(mocks.announce).toHaveBeenCalledWith('Discard changes?');
      expect(mocks.announce).toHaveBeenCalledWith(
        'From list. Review recipients before sending.'
      );
    }
  );

  it('keeps the inline list draft after a failed silent save and validates trimmed names and required people', async () => {
    await render();
    await press('From list');
    await press('Create invite list');
    await press('Save');
    expect(visibleText()).toContain('1–100 characters');
    expect(mocks.createList).not.toHaveBeenCalled();
    await type('List name', 'Weekend');
    await press('Save');
    expect(visibleText()).toContain('1–100 existing');
    await press('Select Alice');
    mocks.createList.mockRejectedValueOnce(new Error('connection failed'));
    await press('Save');
    expect(visibleText()).toContain('Your draft has been kept');
    expect(control('List name').props.value).toBe('Weekend');
    expect(control('Remove Alice')).toBeDefined();
    await press('Save');
    expect(visibleText()).toContain('No recipients selected.');
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('keeps Needs attention lists visible while preventing use and blocks reviewed-source expansion after all its people disappear', async () => {
    listCollection = {
      items: [{ ...firstList, availablePersonCount: 0, needsAttention: true }],
    };
    await render();
    await press('From list');
    expect(visibleText()).toContain('Needs attention');
    expect(control('Select First').props.disabled).toBe(true);
    expect(control('Review selected lists').props.disabled).toBe(true);
    expect(mocks.send).not.toHaveBeenCalled();
    listCollection = { items: [firstList] };
    await act(async () => rendered.update(tree()));
    await press('Select First');
    listCollection = {
      items: [{ ...firstList, availablePersonCount: 0, needsAttention: true }],
    };
    await act(async () => rendered.update(tree()));
    expect(control('Review selected lists').props.disabled).toBe(true);
    expect(visibleText()).toContain('Update it in Settings');
    await press('Select First');
    expect(control('Review selected lists').props.disabled).toBe(true);
  });

  it('anonymizes deleted selected profiles in both the inline creator and the preserved manual selection', async () => {
    await render();
    await press('People');
    await press('Invite Casey');
    await press('From list');
    await press('Create invite list');
    await type('List name', 'Weekend');
    await press('Select Casey');
    draftProfiles = {
      items: [
        {
          ...casey,
          available: false,
          name: 'Deleted secret',
          username: 'deleted-secret',
          image: 'old-avatar',
        },
      ],
    };
    const previousQuery = mocks.query.getMockImplementation()!;
    mocks.query.mockImplementation((query, args) =>
      getFunctionName(query) === 'inviteLists/queries:getFriendChoices'
        ? { items: [] }
        : getFunctionName(query) === 'friends/queries:getFriends'
          ? []
          : previousQuery(query, args)
    );
    await act(async () => rendered.update(tree()));
    expect(control('Remove Unavailable person')).toBeDefined();
    expect(visibleText()).not.toContain('Deleted secret');
    await press('Cancel');
    await press('Discard');
    await press('People');
    expect(visibleText()).toContain('Unavailable person');
    expect(visibleText()).not.toContain('Casey');
    expect(visibleText()).not.toContain('deleted-secret');
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.createList).not.toHaveBeenCalled();
  });

  it('reports that an inline list was saved when Save and use would exceed the recipient cap, preserving the previous draft', async () => {
    details['list-a'] = {
      ...firstList,
      personCount: 100,
      availablePersonCount: 100,
      people: Array.from({ length: 100 }, (_, index) => ({
        ...alice,
        personId: `person-${index}`,
        name: `Person ${index}`,
      })),
    };
    await render();
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    await press('Create invite list');
    await type('List name', 'Weekend');
    await press('Select Casey');
    await press('Save and use');
    expect(mocks.createList).toHaveBeenCalledOnce();
    expect(visibleText()).toContain('Invite list saved.');
    expect(visibleText()).toContain('100 recipients');
    expect(visibleText()).toContain('previous selection has been kept');
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('clears an earlier known result when a new send has an uncertain outcome', async () => {
    await render();
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    mocks.send.mockResolvedValueOnce({
      eventId: 'event-one',
      totalCount: 2,
      sentCount: 0,
      skippedCount: 2,
      results: [
        {
          personId: 'person-a',
          status: 'skipped',
          reason: 'INVITATION_PENDING',
        },
        {
          personId: 'person-b',
          status: 'skipped',
          reason: 'INVITATION_PENDING',
        },
      ],
    });
    await press('Send invitations');
    expect(visibleText()).toContain('No invitations were sent.');
    mocks.send.mockRejectedValueOnce(new Error('lost response'));
    await press('Send invitations');
    expect(visibleText()).toContain('outcome is unknown');
    expect(visibleText()).not.toContain('No invitations were sent.');
    expect(control('Retry original invitations')).toBeDefined();
  });

  it('shows the frozen Attendee role when organizer authority is lost before a protected send', async () => {
    await render(true, true);
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    await press('Moderator');
    eventHeader = {
      event: { title: 'Dinner' },
      userMembership: { role: 'MODERATOR' },
      permissions: { inviteMembers: 'MODERATOR' },
    };
    await act(async () => rendered.update(tree(true, true)));
    mocks.send.mockRejectedValueOnce(new Error('lost response'));
    await press('Send invitations');
    expect(mocks.send.mock.calls[0][0].role).toBe('ATTENDEE');
    expect(visibleText()).toContain('Invite as Attendee');
    expect(
      rendered.root.findAll(
        node => node.props.accessibilityLabel === 'Moderator'
      )
    ).toHaveLength(0);
    await press('Retry original invitations');
    expect(mocks.send.mock.calls[1][0]).toEqual(mocks.send.mock.calls[0][0]);
  });

  it('keeps common list-send role and message when changing the manually selected person', async () => {
    await render();
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    await press('Moderator');
    await type('Personal message (optional)', 'For the reviewed recipients');
    await press('People');
    await press('Invite Casey');
    await press('Choose someone else');
    await press('From list');
    expect(control('Personal message (optional)').props.value).toBe(
      'For the reviewed recipients'
    );
    expect(control('Moderator').props).toMatchObject({
      accessibilityState: { checked: true },
    });
    expect(visibleText()).toContain('2 recipients');
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('preserves an expired uncertain request until explicit acknowledgement, then starts a new review without sending', async () => {
    await render();
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    await press('Moderator');
    await type('Personal message (optional)', 'Original message');
    mocks.uuid
      .mockReturnValueOnce('550e8400-e29b-41d4-a716-446655440000')
      .mockReturnValueOnce('550e8400-e29b-41d4-a716-446655440001');
    mocks.send
      .mockRejectedValueOnce(new Error('lost response'))
      .mockRejectedValueOnce(
        new ConvexError({
          code: 'IDEMPOTENCY_EXPIRED',
          message: 'Expired request',
        })
      );
    await press('Send invitations');
    const original = mocks.send.mock.calls[0][0];
    pendingInvites = [
      { inviteId: 'pending-alice', status: 'PENDING', invitee: alice },
    ];
    await press('Retry original invitations');
    expect(mocks.send.mock.calls[1][0]).toEqual(original);
    expect(visibleText()).toContain('Alice: Invitation pending');
    expect(mocks.announce).toHaveBeenCalledWith(
      'Original invitation request expired. It may have sent. Check pending invitations before sending again.'
    );
    expect(visibleText()).toContain('may have sent');
    expect(visibleText()).toContain('cannot be retried');
    expect(visibleText()).toContain(original.requestId);
    expect(
      rendered.root.findAll(
        node => node.props.accessibilityLabel === 'Retry original invitations'
      )
    ).toHaveLength(0);
    expect(control('Personal message (optional)').props.editable).toBe(false);
    await press('Go back');
    expect(mocks.back).not.toHaveBeenCalled();
    await press('Start a new review');
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.uuid).toHaveBeenCalledOnce();
    expect(mocks.announce).toHaveBeenCalledWith(
      'Invitation draft restored. Check pending invitations before sending again.'
    );
    expect(control('Personal message (optional)').props.value).toBe(
      'Original message'
    );
    expect(control('Personal message (optional)').props.editable).toBe(true);
    expect(control('Moderator').props).toMatchObject({
      accessibilityState: { checked: true },
    });
    expect(visibleText()).toContain('2 recipients');
    expect(mocks.options).toHaveBeenLastCalledWith(
      expect.objectContaining({ gestureEnabled: true })
    );
    await press('Send invitations');
    const replacement = mocks.send.mock.calls[2][0];
    expect(replacement.requestId).not.toBe(original.requestId);
    expect(replacement).toMatchObject({
      eventId: original.eventId,
      personIds: original.personIds,
      role: original.role,
      message: original.message,
    });
    expect(mocks.uuid).toHaveBeenCalledTimes(2);
  });

  it.each(['revoked permission', 'deleted event'])(
    'recovers an uncertain request after the device-clock deadline with %s, preserving its original inputs until acknowledgement',
    async authorityFailure => {
      const issuedAt = 1_750_000_000_000;
      const now = vi.spyOn(Date, 'now').mockReturnValue(issuedAt);
      await render(true, true);
      await press('From list');
      await press('Select First');
      await press('Review selected lists');
      await press('Moderator');
      await type('Personal message (optional)', 'Original message');
      mocks.uuid
        .mockReturnValueOnce('550e8400-e29b-41d4-a716-446655440000')
        .mockReturnValueOnce('550e8400-e29b-41d4-a716-446655440001');
      mocks.send
        .mockRejectedValueOnce(new Error('lost response'))
        .mockRejectedValueOnce(
          new ConvexError({ code: 'FORBIDDEN', message: 'Access unavailable' })
        )
        .mockRejectedValueOnce(
          new ConvexError({ code: 'FORBIDDEN', message: 'Access unavailable' })
        );
      await press('Send invitations');
      const original = mocks.send.mock.calls[0][0];
      const allowedHeader = eventHeader;
      eventHeader =
        authorityFailure === 'deleted event'
          ? new Error('Event no longer exists')
          : {
              event: { title: 'Dinner' },
              userMembership: { role: 'ATTENDEE' },
              permissions: { inviteMembers: 'MODERATOR' },
            };
      await act(async () => rendered.update(tree(true, true)));
      now.mockReturnValue(issuedAt + 24 * 60 * 60 * 1000 - 1);
      await press('Retry original invitations');
      expect(mocks.send.mock.calls[1][0]).toEqual(original);
      expect(visibleText()).toContain('outcome is unknown');
      expect(control('Moderator').props).toMatchObject({
        disabled: true,
        accessibilityState: { checked: true },
      });
      expect(control('Personal message (optional)').props.editable).toBe(false);
      expect(
        rendered.root.findAll(
          node => node.props.accessibilityLabel === 'Start a new review'
        )
      ).toHaveLength(0);
      now.mockReturnValue(issuedAt + 24 * 60 * 60 * 1000);
      await press('Retry original invitations');
      expect(mocks.send.mock.calls[2][0]).toEqual(original);
      expect(visibleText()).toContain('Protection may have expired');
      expect(visibleText()).toContain('device clock');
      expect(visibleText()).toContain('original invitations may exist');
      expect(visibleText()).toContain(original.requestId);
      expect(visibleText()).not.toContain('No invitations were sent.');
      expect(visibleText()).not.toContain('cannot be retried');
      expect(mocks.announce).toHaveBeenCalledWith(
        'Based on your device clock, protection for the original invitation request may have expired. Original invitations may exist. Check pending invitations before sending again.'
      );
      expect(
        rendered.root.findAll(
          node => node.props.accessibilityLabel === 'Retry original invitations'
        )
      ).toHaveLength(0);
      expect(control('Personal message (optional)').props.editable).toBe(false);
      await press('Go back');
      expect(mocks.back).not.toHaveBeenCalled();
      expect(mocks.send).toHaveBeenCalledTimes(3);
      expect(mocks.uuid).toHaveBeenCalledOnce();
      eventHeader = allowedHeader;
      await act(async () => rendered.update(tree(true, true)));
      if (authorityFailure === 'deleted event')
        await press('Retry event permissions');
      await press('Start a new review');
      expect(mocks.send).toHaveBeenCalledTimes(3);
      expect(mocks.uuid).toHaveBeenCalledOnce();
      expect(control('Personal message (optional)').props).toMatchObject({
        editable: true,
        value: 'Original message',
      });
      expect(control('Moderator').props).toMatchObject({
        accessibilityState: { checked: true },
      });
      expect(visibleText()).toContain('2 recipients');
      expect(mocks.options).toHaveBeenLastCalledWith(
        expect.objectContaining({ gestureEnabled: true })
      );
      await press('Send invitations');
      const replacement = mocks.send.mock.calls[3][0];
      expect(replacement.requestId).not.toBe(original.requestId);
      expect(replacement).toMatchObject({
        eventId: original.eventId,
        personIds: original.personIds,
        role: original.role,
        message: original.message,
      });
      expect(mocks.uuid).toHaveBeenCalledTimes(2);
    }
  );

  it('uses Attendee for non-organizers and rejects a message over the existing 280-character limit before sending', async () => {
    await render(false);
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    expect(visibleText()).toContain('Invite as Attendee');
    expect(
      rendered.root.findAll(
        node => node.props.accessibilityLabel === 'Moderator'
      )
    ).toHaveLength(0);
    await type('Personal message (optional)', 'x'.repeat(281));
    await press('Send invitations');
    expect(visibleText()).toContain('280 characters');
    expect(mocks.send).not.toHaveBeenCalled();
    await type('Personal message (optional)', 'Hello');
    await press('Send invitations');
    expect(mocks.send.mock.calls[0][0].role).toBe('ATTENDEE');
  });

  it('keeps the original inputs and request ID across lost responses, including a later authorization rejection', async () => {
    await render();
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    await type('Personal message (optional)', 'Hello');
    mocks.send.mockRejectedValueOnce(new Error('lost response'));
    mocks.send.mockRejectedValueOnce(
      new ConvexError({ code: 'FORBIDDEN', message: 'Permission changed' })
    );
    await press('Send invitations');
    expect(visibleText()).toContain('outcome is unknown');
    expect(control('Personal message (optional)').props.editable).toBe(false);
    expect(control('Remove Alice').props.disabled).toBe(true);
    await press('Retry original invitations');
    expect(visibleText()).toContain('outcome is unknown');
    await press('Email');
    await press('From list');
    await press('Retry original invitations');
    expect(mocks.send.mock.calls[1][0]).toEqual(mocks.send.mock.calls[0][0]);
    expect(mocks.send.mock.calls[2][0]).toEqual(mocks.send.mock.calls[0][0]);
    expect(mocks.uuid).toHaveBeenCalledOnce();
    expect(visibleText()).toContain('2 invitations sent.');
  });

  it('waits for recipient eligibility review before enabling explicit Send, and preserves recipients on review failure', async () => {
    reviewOverride = undefined;
    await render();
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    expect(control('Loading recipient review')).toBeDefined();
    expect(control('Send invitations').props.disabled).toBe(true);
    reviewOverride = new Error('internal review failure');
    await type('Personal message (optional)', 'Hello');
    expect(visibleText()).toContain('Unable to load recipient review');
    expect(visibleText()).toContain('2 recipients');
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('explains visible skips and a zero-sent outcome without exposing unavailable identities or private reasons', async () => {
    reviewOverride = {
      eventId: 'event-one',
      totalCount: 3,
      eligibleCount: 0,
      skippedCount: 3,
      results: [
        { ...alice, status: 'skipped', reason: 'ALREADY_MEMBER' },
        { ...blair, status: 'skipped', reason: 'INVITATION_PENDING' },
        {
          ...casey,
          available: false,
          name: null,
          username: null,
          image: null,
          status: 'skipped',
          reason: 'UNAVAILABLE',
        },
      ],
    };
    await render();
    await press('From list');
    await press('Select First');
    await press('Select Second');
    await press('Review selected lists');
    expect(visibleText()).toContain('Already a member');
    expect(visibleText()).toContain('Invitation already pending');
    expect(control('Remove Unavailable person')).toBeDefined();
    mocks.send.mockResolvedValueOnce({
      eventId: 'event-one',
      totalCount: 3,
      sentCount: 0,
      skippedCount: 3,
      results: [
        { personId: 'person-a', status: 'skipped', reason: 'ALREADY_MEMBER' },
        {
          personId: 'person-b',
          status: 'skipped',
          reason: 'INVITATION_PENDING',
        },
        { personId: 'person-c', status: 'skipped', reason: 'UNAVAILABLE' },
      ],
    });
    await press('Send invitations');
    expect(visibleText()).toContain('No invitations were sent.');
    expect(visibleText()).toContain('3 people skipped.');
    expect(visibleText()).toContain('Alice: Already a member');
    expect(visibleText()).not.toContain('Casey');
    expect(visibleText()).not.toContain('@casey');
    expect(visibleText()).not.toContain('blocked');
  });

  it('adds a manual person to a list review and keeps manual search and message across tab unmounts', async () => {
    await render();
    await press('People');
    await type('Search people by username', 'casey');
    await press('Link');
    await press('People');
    expect(control('Search people by username').props.value).toBe('casey');
    await press('Invite Casey');
    await type('Personal message (optional)', 'Hello Casey');
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    await press('Remove Casey');
    await press('People');
    await press('Add to recipient review');
    expect(visibleText()).toContain('3 recipients');
    expect(control('Personal message (optional)').props.value).toBe(
      'Hello Casey'
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('rejects an oversized merge before sending and keeps the previous 100-recipient draft without truncation', async () => {
    details['list-a'] = {
      ...firstList,
      personCount: 100,
      availablePersonCount: 100,
      people: Array.from({ length: 100 }, (_, index) => ({
        ...alice,
        personId: `person-${index}`,
        name: `Person ${index}`,
      })),
    };
    await render();
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    expect(visibleText()).toContain('100 recipients');
    await press('Select Second');
    await press('Review selected lists');
    expect(visibleText()).toContain('Choose at most 100 recipients');
    expect(visibleText()).toContain('100 recipients');
    expect(mocks.send).not.toHaveBeenCalled();
    await press('Send invitations');
    expect(mocks.send.mock.calls[0][0].personIds).toHaveLength(100);
    expect(mocks.send.mock.calls[0][0].personIds).not.toContain('person-c');
  });

  it('unlocks the unchanged draft after a definite rejection of the first fresh send so it can be corrected', async () => {
    await render();
    await press('From list');
    await press('Select First');
    await press('Review selected lists');
    mocks.send.mockRejectedValueOnce(
      new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid recipient',
      })
    );
    await press('Send invitations');
    expect(visibleText()).toContain('No invitations were sent.');
    expect(control('Personal message (optional)').props.editable).toBe(true);
    expect(control('Remove Alice').props.disabled).toBe(false);
    await type('Personal message (optional)', 'Corrected');
    await press('Send invitations');
    expect(mocks.send.mock.calls[1][0].message).toBe('Corrected');
    expect(mocks.uuid).toHaveBeenCalledTimes(2);
  });
});
