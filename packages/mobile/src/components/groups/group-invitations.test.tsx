import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { setToastAdapter } from '@groupi/shared/platform';
import { Alert } from 'react-native';
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
const groupIdentity = {
  groupId: 'group-123',
  name: 'Book club',
  description: 'Read together',
  image: null,
};
function invite() {
  return {
    inviteId: 'invite-123',
    status: network.status,
    createdAt: 1900000000000,
    respondedAt: null,
    group: groupIdentity,
    inviter: {
      personId: 'person-owner',
      name: 'Alex',
      username: 'alex',
      image: null,
    },
    invitee: {
      personId: 'person-123',
      name: 'Robin',
      username: 'robin',
      image: null,
    },
    available: network.available,
    canBan: network.manager && !network.moderator,
  };
}
function result(name: string, args: Record<string, unknown>) {
  if (name === 'auth/queries:getCurrentUserAndPerson') return profile;
  if (name === 'users/queries:checkNeedsOnboarding') return false;
  if (name === 'groups/queries:getGroupLanding') return groupIdentity;
  if (name === 'groups/queries:getGroup')
    return network.member
      ? {
          _id: 'group-123',
          name: 'Book club',
          ownerId: 'person-owner',
          viewerRole: network.manager ? 'OWNER' : 'MEMBER',
          canManageIdentity: network.manager && !network.moderator,
          applicationsEnabled: false,
          applicationQuestions: [],
          canManageRoles: network.manager && !network.moderator,
          canManageMembers: network.manager,
          canLeave: !network.manager || network.moderator,
          canManageInvitations: network.manager,
          invitationsEnabled: network.enabled,
          memberCount: 1,
        }
      : null;
  if (name === 'groupInvites/queries:getMyGroupInviteForGroup')
    return network.ownInvite ? invite() : null;
  if (
    name === 'groupInvites/queries:listMyGroupInvites' ||
    name === 'groupInvites/queries:listGroupInvites'
  )
    return {
      page: [invite()],
      isDone:
        args.paginationOpts &&
        (args.paginationOpts as { cursor: string | null }).cursor !== null,
      continueCursor: 'next-invites',
    };
  if (name === 'groups/queries:listGroupMembers')
    return {
      page: [
        {
          personId: 'person-target',
          name: 'Alex',
          username: 'alex',
          image: null,
          role: network.targetRole,
          canChangeRole:
            network.manager &&
            !network.moderator &&
            network.targetRole !== 'OWNER',
          canRemove: network.manager && network.targetRole === 'MEMBER',
          canBan: network.manager && network.targetRole === 'MEMBER',
          joinedAt: 1900000000000,
        },
      ],
      isDone:
        (args.paginationOpts as { cursor: string | null }).cursor !== null,
      continueCursor: 'next-members',
    };
  if (name === 'groupModeration/queries:listGroupBans')
    return network.banState === 'loading'
      ? undefined
      : network.banState === 'empty'
        ? { page: [], isDone: true, continueCursor: '' }
        : {
            page: [
              {
                personId: 'person-banned',
                name: 'Banned person',
                username: 'banned',
                image: null,
                bannedAt: 1,
              },
            ],
            isDone: true,
            continueCursor: '',
          };
  if (name === 'settings/queries:getPrivacySettings')
    return {
      allowFriendRequestsFrom: 'EVENT_MEMBERS',
      allowEventInvitesFrom: 'FRIENDS',
      allowGroupInvitesFrom: undefined,
    };
  if (name === 'friends/queries:getBlockedUsers') return [];
  if (name === 'friends/queries:searchUsersByUsername')
    return [
      {
        personId: 'person-robin',
        name: 'Robin',
        username: 'robin',
        image: null,
      },
    ];
  return undefined;
}
import { ConvexClientProvider } from '../../providers/convex-provider';
import { GlobalUserProvider } from '../../context/global-user-context';
vi.mock('../members/member-avatar', () => ({ MemberAvatar: 'MemberAvatar' }));
vi.mock(
  '../templates',
  async () => await import('../templates/settings-screen-template')
);
vi.mock('../molecules', () => ({ LoadingState: 'LoadingState' }));
import PrivacySettingsScreen from '../../../app/settings/privacy';
import GroupInvitationsScreen from '../../../app/groups/[groupId]/invitations';
import GroupBansScreen from '../../../app/groups/[groupId]/bans';
import GroupMembersScreen from '../../../app/groups/[groupId]/members';
import { GroupsPanel } from './groups-panel';
import { GroupDetailScreen, GroupLandingScreen } from './group-screen';
import { GroupInviteInbox } from './group-invitation-panels';
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
function notify() {
  for (const listener of network.subscribers) listener();
}

describe('native Group invitations with production providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setToastAdapter({
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    });
    network.authenticated = true;
    network.member = true;
    network.manager = true;
    network.moderator = false;
    network.targetRole = 'MEMBER';
    network.enabled = true;
    network.available = true;
    network.status = 'PENDING';
    network.ownInvite = true;
    network.mutation.mockResolvedValue({
      groupId: 'group-123',
      status: 'ACCEPTED',
      joiningQuestionnaire: { shouldPrompt: false },
    });
  });
  it('accepts an own private invitation explicitly without a friendship or Event action', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(GroupInviteInbox));
    });
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => {
      await (
        control(mounted!, 'Accept invitation to Book club').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
      'groupInvites/mutations:acceptGroupInvite',
      { inviteId: 'invite-123' }
    );
    expect(network.replace).toHaveBeenCalledWith('/groups/group-123');
    await act(async () => mounted!.unmount());
  });
  it('declines privately and immediately removes pending response controls', async () => {
    network.mutation.mockResolvedValue({ status: 'DECLINED' });
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(GroupInviteInbox));
    });
    await act(async () => {
      await (
        control(mounted!, 'Decline invitation to Book club').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
      'groupInvites/mutations:declineGroupInvite',
      { inviteId: 'invite-123' }
    );
    expect(control(mounted!, 'Accept invitation to Book club')).toBeUndefined();
    expect(network.replace).not.toHaveBeenCalled();
    await act(async () => mounted!.unmount());
  });
  it('paginates the private inbox through the actual query adapter', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(GroupInviteInbox));
    });
    await act(async () => {
      (
        control(mounted!, 'Next Group invitations').props.onPress as () => void
      )();
    });
    expect(network.watches).toHaveBeenCalledWith(
      'groupInvites/queries:listMyGroupInvites',
      { paginationOpts: { numItems: 20, cursor: 'next-invites' } }
    );
    await act(async () => mounted!.unmount());
  });
  it.each([false, true])(
    'keeps application landing joining flow for authenticated=%s without reading roster',
    async authenticated => {
      network.authenticated = authenticated;
      network.member = false;
      let mounted: Mounted;
      await act(async () => {
        mounted = renderer.create(screen(GroupLandingScreen));
      });
      await act(async () => {
        (
          control(mounted!, 'Apply to Group or view private status').props
            .onPress as () => void
        )();
      });
      expect(network.push).toHaveBeenCalledWith(
        authenticated
          ? '/groups/group-123/apply'
          : {
              pathname: '/(auth)/sign-in',
              params: { returnTo: '/groups/group-123/apply' },
            }
      );
      expect(network.watches.mock.calls.map(([name]) => name)).not.toContain(
        'groups/queries:listGroupMembers'
      );
      expect(network.mutation).not.toHaveBeenCalled();
      await act(async () => mounted!.unmount());
    }
  );
  it.each([false, true])(
    'keeps owner configuration distinct from moderator=%s review navigation',
    async moderator => {
      network.moderator = moderator;
      let mounted: Mounted;
      await act(async () => {
        mounted = renderer.create(screen(GroupDetailScreen));
      });
      expect(
        Boolean(control(mounted!, 'Save Group application settings'))
      ).toBe(!moderator);
      await act(async () => {
        (
          control(mounted!, 'Review Group applications').props
            .onPress as () => void
        )();
      });
      expect(network.push).toHaveBeenCalledWith(
        '/groups/group-123/applications'
      );
      await act(async () => mounted!.unmount());
    }
  );
  it('shows only the current caller invitation on a landing and sharing never admits the viewer', async () => {
    network.member = false;
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(GroupLandingScreen));
    });
    expect(network.watches).toHaveBeenCalledWith(
      'groupInvites/queries:getMyGroupInviteForGroup',
      { groupId: 'group-123' }
    );
    expect(control(mounted!, 'Accept invitation to Book club')).toBeDefined();
    expect(network.mutation).not.toHaveBeenCalled();
    expect(
      network.watches.mock.calls.some(
        ([name]) => name === 'groups/queries:listGroupMembers'
      )
    ).toBe(false);
    await act(async () => mounted!.unmount());
  });
  it('offers no invitation credential or private roster to an anonymous landing viewer', async () => {
    network.authenticated = false;
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(GroupLandingScreen));
    });
    expect(control(mounted!, 'Accept invitation to Book club')).toBeUndefined();
    expect(
      network.watches.mock.calls.some(
        ([name]) =>
          name.includes('groupInvites/') ||
          name === 'groups/queries:listGroupMembers'
      )
    ).toBe(false);
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => mounted!.unmount());
  });
  it('shows paginated member names, usernames and Group roles only to admitted members', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(GroupMembersScreen));
    });
    expect(network.watches).toHaveBeenCalledWith(
      'groups/queries:listGroupMembers',
      { groupId: 'group-123', paginationOpts: { numItems: 20, cursor: null } }
    );
    const text = mounted!.root
      .findAll(node => node.type === 'Text')
      .map(node => node.props.children);
    expect(text).toContain('Alex');
    expect(text).toContain('@alex');
    expect(text).toContain('Member');
    await act(async () => {
      (control(mounted!, 'Next Group members').props.onPress as () => void)();
    });
    expect(network.watches).toHaveBeenCalledWith(
      'groups/queries:listGroupMembers',
      {
        groupId: 'group-123',
        paginationOpts: { numItems: 20, cursor: 'next-members' },
      }
    );
    await act(async () => mounted!.unmount());
  });
  it('does not subscribe to a private roster or sender state for nonmembers', async () => {
    network.member = false;
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(GroupMembersScreen));
    });
    expect(
      network.watches.mock.calls.some(
        ([name]) => name === 'groups/queries:listGroupMembers'
      )
    ).toBe(false);
    await act(async () => {
      mounted!.update(screen(GroupInvitationsScreen));
    });
    expect(
      network.watches.mock.calls.some(
        ([name]) => name === 'groupInvites/queries:listGroupInvites'
      )
    ).toBe(false);
    await act(async () => mounted!.unmount());
  });
  it('lets the owner cancel sender invitations and disable Group invitations', async () => {
    network.mutation.mockResolvedValue({ status: 'CANCELLED' });
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(GroupInvitationsScreen));
    });
    await act(async () => {
      await (
        control(mounted!, 'Cancel invitation for Robin').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledWith(
      'groupInvites/mutations:cancelGroupInvite',
      { inviteId: 'invite-123' }
    );
    const policy = control(mounted!, 'Enable Group invitations', 'Switch');
    await act(async () => {
      await (policy.props.onValueChange as (value: boolean) => Promise<void>)(
        false
      );
    });
    expect(network.mutation).toHaveBeenCalledWith(
      'groups/mutations:updateGroupInvitationPolicy',
      { groupId: 'group-123', invitationsEnabled: false }
    );
    network.enabled = false;
    await act(async () => notify());
    expect(
      control(mounted!, 'Enable Group invitations', 'Switch').props.value
    ).toBe(false);
    expect(
      control(mounted!, 'Search existing Groupi users', 'TextInput').props
        .editable
    ).toBe(false);
    await act(async () => mounted!.unmount());
  });

  it('sends an invitation to an existing user through the production username selector', async () => {
    network.mutation.mockResolvedValue({
      inviteId: 'invite-new',
      status: 'PENDING',
    });
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(GroupInvitationsScreen));
    });
    await act(async () => {
      (
        control(mounted!, 'Search existing Groupi users', 'TextInput').props
          .onChangeText as (value: string) => void
      )('robin');
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
    });
    expect(network.watches).toHaveBeenCalledWith(
      'friends/queries:searchUsersByUsername',
      { searchTerm: 'robin' }
    );
    await act(async () => {
      await (
        control(mounted!, 'Invite Robin to Book club').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
      'groupInvites/mutations:sendGroupInvite',
      { groupId: 'group-123', inviteePersonId: 'person-robin' }
    );
    await act(async () => mounted!.unmount());
  });
  it('keeps unavailable recipient invitations unacceptible and keeps all manager controls private', async () => {
    network.available = false;
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(GroupInviteInbox));
    });
    expect(
      control(mounted!, 'Accept invitation to Book club').props.disabled
    ).toBe(true);
    network.manager = false;
    await act(async () => {
      mounted!.update(screen(GroupInvitationsScreen));
    });
    expect(
      control(mounted!, 'Enable Group invitations', 'Switch')
    ).toBeUndefined();
    expect(
      control(mounted!, 'Search existing Groupi users', 'TextInput')
    ).toBeUndefined();
    expect(
      network.watches.mock.calls.some(
        ([name]) => name === 'groupInvites/queries:listGroupInvites'
      )
    ).toBe(false);
    await act(async () => mounted!.unmount());
  });
  it('defaults Group invite privacy to Everyone and saves its independent preference without changing Friend or Event choices', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(PrivacySettingsScreen));
    });
    expect(
      control(mounted!, 'Group invitations from Everyone').props
        .accessibilityState
    ).toMatchObject({ checked: true });
    await act(async () => {
      await (
        control(mounted!, 'Group invitations from No one').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledWith(
      'settings/mutations:savePrivacySettings',
      {
        allowFriendRequestsFrom: 'EVENT_MEMBERS',
        allowEventInvitesFrom: 'FRIENDS',
        allowGroupInvitesFrom: 'NO_ONE',
      }
    );
    await act(async () => {
      await (
        control(mounted!, 'Friend requests from Everyone').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenLastCalledWith(
      'settings/mutations:savePrivacySettings',
      {
        allowFriendRequestsFrom: 'EVERYONE',
        allowEventInvitesFrom: 'FRIENDS',
        allowGroupInvitesFrom: 'NO_ONE',
      }
    );
    await act(async () => mounted!.unmount());
  });
  it('keeps failed acceptance on the invitation with a visible error', async () => {
    network.mutation.mockRejectedValue(new Error('Invitation is unavailable'));
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(GroupInviteInbox));
    });
    await act(async () => {
      await (
        control(mounted!, 'Accept invitation to Book club').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.replace).not.toHaveBeenCalled();
    expect(
      mounted!.root
        .findAll(node => node.type === 'Text')
        .map(node => node.props.children)
    ).toContain('Invitation is unavailable');
    await act(async () => mounted!.unmount());
  });
  it.each(['ACCEPTED', 'DECLINED', 'CANCELLED'])(
    'shows current %s state without response controls',
    async status => {
      network.status = status;
      let mounted: Mounted;
      await act(async () => {
        mounted = renderer.create(screen(GroupInviteInbox));
      });
      expect(
        control(mounted!, 'Accept invitation to Book club')
      ).toBeUndefined();
      expect(
        control(mounted!, 'Decline invitation to Book club')
      ).toBeUndefined();
      expect(network.mutation).not.toHaveBeenCalled();
      await act(async () => mounted!.unmount());
    }
  );
  it('connects Friends & Groups to the inbox and member detail to invitation management', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(GroupsPanel));
    });
    await act(async () => {
      (
        control(mounted!, 'View your Group invitations').props
          .onPress as () => void
      )();
    });
    expect(network.push).toHaveBeenCalledWith('/friends/group-invites');
    await act(async () => {
      mounted!.update(screen(GroupDetailScreen));
    });
    await act(async () => {
      (
        control(mounted!, 'Manage Group invitations').props
          .onPress as () => void
      )();
    });
    expect(network.push).toHaveBeenCalledWith('/groups/group-123/invitations');
    await act(async () => {
      (control(mounted!, 'View Group members').props.onPress as () => void)();
    });
    expect(network.push).toHaveBeenCalledWith('/groups/group-123/members');
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => mounted!.unmount());
  });
});

describe('native moderation with production SDK and providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    network.authenticated = true;
    network.member = true;
    network.manager = true;
    network.moderator = false;
    network.targetRole = 'MEMBER';
    network.mutation.mockResolvedValue({ left: true });
  });
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
  async function confirm() {
    const buttons = vi.mocked(Alert.alert).mock.calls.at(-1)![2]!;
    expect(buttons[1].style).toBe('destructive');
    await act(async () => {
      await buttons[1].onPress!();
    });
  }
  it('owner promotes only an eligible member through the actual injected mutation', async () => {
    const mounted = await mount(GroupMembersScreen);
    await press(mounted, 'Promote Alex');
    expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
      'groupModeration/mutations:setGroupMemberRole',
      { groupId: 'group-123', personId: 'person-target', role: 'MODERATOR' }
    );
    await act(async () => mounted.unmount());
  });
  it('confirms removal before mutation and displays server failures', async () => {
    const mounted = await mount(GroupMembersScreen);
    network.mutation.mockRejectedValue(new Error('Permission changed'));
    await press(mounted, 'Remove Alex');
    expect(network.mutation).not.toHaveBeenCalled();
    await confirm();
    expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
      'groupModeration/mutations:removeGroupMember',
      { groupId: 'group-123', personId: 'person-target' }
    );
    expect(
      mounted.root.findAll(node => node.props.accessibilityRole === 'alert')
        .length
    ).toBeGreaterThan(0);
    await act(async () => mounted.unmount());
  });
  it('confirms ban and uses only Group mutation', async () => {
    const mounted = await mount(GroupMembersScreen);
    await press(mounted, 'Ban Alex');
    expect(network.mutation).not.toHaveBeenCalled();
    await confirm();
    expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
      'groupModeration/mutations:banGroupPerson',
      { groupId: 'group-123', personId: 'person-target' }
    );
    await act(async () => mounted.unmount());
  });
  it('moderators cannot promote or act on peer moderators', async () => {
    network.moderator = true;
    network.targetRole = 'MODERATOR';
    const mounted = await mount(GroupMembersScreen);
    expect(control(mounted, 'Demote Alex')).toBeUndefined();
    expect(control(mounted, 'Remove Alex')).toBeUndefined();
    expect(control(mounted, 'Ban Alex')).toBeUndefined();
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => mounted.unmount());
  });
  it('owner cannot leave, while moderator can confirm voluntary leave', async () => {
    let mounted = await mount(GroupDetailScreen);
    expect(control(mounted, 'Leave Group')).toBeUndefined();
    await act(async () => mounted.unmount());
    network.moderator = true;
    mounted = await mount(GroupDetailScreen);
    await press(mounted, 'Leave Group');
    expect(network.mutation).not.toHaveBeenCalled();
    await confirm();
    expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
      'groupModeration/mutations:leaveGroup',
      { groupId: 'group-123' }
    );
    expect(network.replace).toHaveBeenCalledWith('/friends');
    await act(async () => mounted.unmount());
  });
  it('member cannot query private bans; manager lifts one without restoring membership', async () => {
    network.manager = false;
    let mounted = await mount(GroupBansScreen);
    expect(
      network.watches.mock.calls.some(
        ([name]) => name === 'groupModeration/queries:listGroupBans'
      )
    ).toBe(false);
    await act(async () => mounted.unmount());
    network.manager = true;
    mounted = await mount(GroupBansScreen);
    await press(mounted, 'Lift ban for Banned person');
    expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
      'groupModeration/mutations:liftGroupBan',
      { groupId: 'group-123', personId: 'person-banned' }
    );
    await act(async () => mounted.unmount());
  });
});

it('confirms banning a pending invitee without inventing cancellation', async () => {
  vi.clearAllMocks();
  network.authenticated = true;
  network.member = true;
  network.manager = true;
  network.moderator = false;
  network.status = 'PENDING';
  network.mutation.mockResolvedValue({ banned: true });
  let mounted: Mounted;
  await act(async () => {
    mounted = renderer.create(screen(GroupInvitationsScreen));
  });
  await act(async () => {
    (control(mounted!, 'Ban invitee Robin').props.onPress as () => void)();
  });
  expect(network.mutation).not.toHaveBeenCalled();
  await act(async () => {
    await vi.mocked(Alert.alert).mock.calls.at(-1)![2]![1].onPress!();
  });
  expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
    'groupModeration/mutations:banGroupPerson',
    { groupId: 'group-123', personId: 'person-123' }
  );
  expect(control(mounted!, 'Ban invitee Robin')).toBeUndefined();
  expect(control(mounted!, 'Cancel invitation for Robin')).toBeDefined();
  await act(async () => mounted!.unmount());
});

it('owner must demote a moderator before removal or ban; owner target has no actions', async () => {
  vi.clearAllMocks();
  network.manager = true;
  network.moderator = false;
  network.targetRole = 'MODERATOR';
  network.mutation.mockResolvedValue({ role: 'MEMBER' });
  let mounted: Mounted;
  await act(async () => {
    mounted = renderer.create(screen(GroupMembersScreen));
  });
  expect(control(mounted!, 'Remove Alex')).toBeUndefined();
  expect(control(mounted!, 'Ban Alex')).toBeUndefined();
  await act(async () => {
    (control(mounted!, 'Demote Alex').props.onPress as () => void)();
  });
  expect(network.mutation).not.toHaveBeenCalled();
  await act(async () => {
    await vi.mocked(Alert.alert).mock.calls.at(-1)![2]![1].onPress!();
  });
  expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
    'groupModeration/mutations:setGroupMemberRole',
    { groupId: 'group-123', personId: 'person-target', role: 'MEMBER' }
  );
  await act(async () => mounted!.unmount());
  network.targetRole = 'OWNER';
  await act(async () => {
    mounted = renderer.create(screen(GroupMembersScreen));
  });
  expect(control(mounted!, 'Promote Alex')).toBeUndefined();
  expect(control(mounted!, 'Remove Alex')).toBeUndefined();
  expect(control(mounted!, 'Ban Alex')).toBeUndefined();
  await act(async () => mounted!.unmount());
});
it('keeps moderator invitation policy owner-only and disables controls while a mutation is pending', async () => {
  vi.clearAllMocks();
  network.manager = true;
  network.moderator = true;
  network.targetRole = 'MEMBER';
  let mounted: Mounted;
  await act(async () => {
    mounted = renderer.create(screen(GroupInvitationsScreen));
  });
  expect(
    control(mounted!, 'Enable Group invitations', 'Switch')
  ).toBeUndefined();
  await act(async () => mounted!.unmount());
  let resolve: (value: unknown) => void = () => {};
  network.mutation.mockImplementation(
    () =>
      new Promise(done => {
        resolve = done;
      })
  );
  await act(async () => {
    mounted = renderer.create(screen(GroupMembersScreen));
  });
  await act(async () => {
    (control(mounted!, 'Ban Alex').props.onPress as () => void)();
  });
  await act(async () => {
    void vi.mocked(Alert.alert).mock.calls.at(-1)![2]![1].onPress!();
  });
  expect(control(mounted!, 'Remove Alex').props.accessibilityState).toEqual(
    expect.objectContaining({ disabled: true })
  );
  await act(async () => resolve({ banned: true }));
  await act(async () => mounted!.unmount());
});

it('shows truthful loading and empty private ban pages', async () => {
  vi.clearAllMocks();
  network.manager = true;
  network.banState = 'loading';
  let mounted: Mounted;
  await act(async () => {
    mounted = renderer.create(screen(GroupBansScreen));
  });
  expect(
    mounted!.root.findAll(
      node => node.type === 'Text' && node.props.children === 'Loading bans…'
    ).length
  ).toBeGreaterThan(0);
  await act(async () => mounted!.unmount());
  network.banState = 'empty';
  await act(async () => {
    mounted = renderer.create(screen(GroupBansScreen));
  });
  expect(
    mounted!.root.findAll(
      node =>
        node.type === 'Text' &&
        node.props.children === 'No banned people on this page.'
    ).length
  ).toBeGreaterThan(0);
  expect(network.mutation).not.toHaveBeenCalled();
  await act(async () => mounted!.unmount());
  network.banState = 'populated';
});

it('accepted membership opens an optional questionnaire prompt without second admission', async () => {
  vi.clearAllMocks();
  network.authenticated = true;
  network.member = true;
  network.manager = false;
  network.status = 'PENDING';
  network.available = true;
  network.mutation.mockResolvedValue({
    groupId: 'group-123',
    status: 'ACCEPTED',
    joiningQuestionnaire: {
      enabled: true,
      completed: false,
      shouldPrompt: true,
      version: 1,
    },
  });
  let mounted: Mounted;
  await act(async () => {
    mounted = renderer.create(screen(GroupInviteInbox));
  });
  await act(async () => {
    await (
      control(mounted!, 'Accept invitation to Book club').props
        .onPress as () => Promise<void>
    )();
  });
  expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
    'groupInvites/mutations:acceptGroupInvite',
    { inviteId: 'invite-123' }
  );
  expect(network.replace).toHaveBeenCalledWith(
    '/groups/group-123/questionnaire'
  );
  await act(async () => mounted!.unmount());
});
