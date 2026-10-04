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
import type { ReactNode } from 'react';
import { GroupDetail } from './group-detail';
import NotificationSettings from '@/app/(settings)/settings/notifications/page';
import { NotificationSlate } from '@/components/notification-slate';

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
  viewerRole: 'OWNER',
  canManageIdentity: true,
  canManageInvitations: true,
  invitationsEnabled: true,
  canManageMembers: true,
  canManageRoles: true,
  canLeave: false,
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
it('requires explicit confirmation before removing a member through the production Group screen', async () => {
  const { client, mutation } = fixtureClient();
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Remove Alex' }));
  expect(mutation).not.toHaveBeenCalled();
  expect(
    screen.getByText(/Removal permits a later invitation/)
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Confirm removal of Alex' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupModeration/mutations:removeGroupMember'
  );
  expect(mutation.mock.calls[0][1]).toEqual({
    groupId: 'group-one',
    personId: 'member-one',
  });
  mounted.unmount();
  await client.close();
});
it.each(['MEMBER', 'MODERATOR'])(
  'lets a %s confirm leaving while preserving independent Events',
  async role => {
    const { client, mutation } = fixtureClient({
      'groups/queries:getGroup': {
        ...detail,
        viewerRole: role,
        canLeave: true,
        canManageMembers: role === 'MODERATOR',
        canManageRoles: false,
        canManageInvitations: role === 'MODERATOR',
        canManageIdentity: false,
      },
    });
    const mounted = render(
      <AppProvider client={client}>
        <GroupDetail groupId={groupId} />
      </AppProvider>
    );
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: 'Leave Group' })
    );
    expect(mutation).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'Confirm leaving Neighbors' })
    );
    await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
    expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
      'groupModeration/mutations:leaveGroup'
    );
    expect(mutation.mock.calls[0][1]).toEqual({ groupId: 'group-one' });
    mounted.unmount();
    await client.close();
  }
);
it('lets managers inspect the private bans page and confirm lifting a ban', async () => {
  const { client, mutation } = fixtureClient({
    'groupModeration/queries:listGroupBans': {
      page: [{ ...invite.invitee, bannedAt: 1 }],
      isDone: true,
      continueCursor: '',
    },
  });
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: 'Lift ban for Alex' })
  );
  expect(mutation).not.toHaveBeenCalled();
  await user.click(
    screen.getByRole('button', { name: 'Confirm lifting ban for Alex' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupModeration/mutations:liftGroupBan'
  );
  expect(mutation.mock.calls[0][1]).toEqual({
    groupId: 'group-one',
    personId: 'member-one',
  });
  mounted.unmount();
  await client.close();
});
it('allows moderator invitations while withholding owner policy and protected target controls', async () => {
  const { client, mutation } = fixtureClient({
    'groups/queries:getGroup': {
      ...detail,
      viewerRole: 'MODERATOR',
      canLeave: true,
      canManageRoles: false,
      canManageIdentity: false,
    },
    'groups/queries:listGroupMembers': {
      page: [
        {
          ...invite.invitee,
          role: 'MODERATOR',
          joinedAt: 1,
          canRemove: false,
          canBan: false,
          canChangeRole: false,
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
  expect(
    await screen.findByLabelText('Find an existing user by username')
  ).toBeInTheDocument();
  expect(
    screen.queryByLabelText('Allow manager invitations')
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Remove Alex' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Ban Alex' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Demote Alex' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Edit Group' })
  ).not.toBeInTheDocument();
  expect(mutation).not.toHaveBeenCalled();
  mounted.unmount();
  await client.close();
});
it('requires confirmation to ban a pending invitee and explains that re-entry stays blocked', async () => {
  const { client, mutation } = fixtureClient();
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: 'Ban invited user Alex' })
  );
  expect(mutation).not.toHaveBeenCalled();
  expect(
    screen.getByText(/pending invitation cannot be accepted/)
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Confirm ban of invited user Alex' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupModeration/mutations:banGroupPerson'
  );
  expect(mutation.mock.calls[0][1]).toEqual({
    groupId: 'group-one',
    personId: 'member-one',
  });
  mounted.unmount();
  await client.close();
});
it.each(['GROUP_MEMBER_REMOVED', 'GROUP_MEMBER_BANNED'] as const)(
  'shows an affected-person %s notice linked to the safe Group identity',
  async type => {
    const { client } = fixtureClient();
    const notification = {
      _id: 'notice-one' as Id<'notifications'>,
      _creationTime: 1,
      id: 'notice-one',
      createdAt: 1,
      personId: 'member-one' as Id<'persons'>,
      type,
      read: true,
      groupId,
      group: { id: groupId, title: 'Neighbors' },
      author: { user: { name: 'Sam', email: null } },
    };
    const mounted = render(
      <AppProvider client={client}>
        <NotificationSlate notification={notification} />
      </AppProvider>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/g/group-one');
    expect(link).toHaveTextContent(
      type === 'GROUP_MEMBER_REMOVED' ? 'removed you from' : 'banned you from'
    );
    expect(link).toHaveTextContent('Neighbors');
    mounted.unmount();
    await client.close();
  }
);
it('updates the live roster after the owner appoints and demotes a moderator', async () => {
  const { client, mutation, setData } = fixtureClient();
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: 'Make Alex a moderator' })
  );
  await user.click(
    screen.getByRole('button', { name: 'Confirm moderator role for Alex' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupModeration/mutations:setGroupMemberRole'
  );
  expect(mutation.mock.calls[0][1]).toEqual({
    groupId: 'group-one',
    personId: 'member-one',
    role: 'MODERATOR',
  });
  act(() =>
    setData('groups/queries:listGroupMembers', {
      page: [
        {
          ...invite.invitee,
          role: 'MODERATOR',
          joinedAt: 1,
          canRemove: false,
          canBan: false,
          canChangeRole: true,
        },
      ],
      isDone: true,
      continueCursor: '',
    })
  );
  expect(
    screen.queryByRole('button', { name: 'Remove Alex' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Ban Alex' })
  ).not.toBeInTheDocument();
  await user.click(await screen.findByRole('button', { name: 'Demote Alex' }));
  await user.click(
    screen.getByRole('button', { name: 'Confirm demotion of Alex' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(mutation.mock.calls[1][1]).toEqual({
    groupId: 'group-one',
    personId: 'member-one',
    role: 'MEMBER',
  });
  act(() =>
    setData('groups/queries:listGroupMembers', {
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
    })
  );
  expect(
    await screen.findByRole('button', { name: 'Remove Alex' })
  ).toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('shows a confidential error after a rejected ban and allows an explicit retry', async () => {
  const { client, mutation } = fixtureClient();
  mutation
    .mockRejectedValueOnce(new Error('private target information'))
    .mockResolvedValueOnce({ banned: true });
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Ban Alex' }));
  await user.click(screen.getByRole('button', { name: 'Confirm ban of Alex' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Your access or this person’s status may have changed'
  );
  expect(
    screen.queryByText('private target information')
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Confirm ban of Alex' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(getFunctionName(mutation.mock.calls[1][0])).toBe(
    'groupModeration/mutations:banGroupPerson'
  );
  expect(await screen.findByText('Ban Alex completed.')).toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('uses the app provider despite a distinct shared SDK and explains the owner cannot leave', async () => {
  const shared = createRequire(import.meta.url)(
    '../../../shared/node_modules/convex/react'
  );
  expect(shared.useMutation).not.toBe(useMutation);
  const { client } = fixtureClient();
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  expect(
    await screen.findByText(/owner cannot leave or delete their account/)
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Leave Group' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'delete the Group' })
  ).toHaveAttribute('href', '#delete-group');
  expect(
    screen.queryByRole('button', { name: /transfer/i })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('does not query private ban or invitation records for an ordinary member', async () => {
  const { client } = fixtureClient({
    'groups/queries:getGroup': {
      ...detail,
      viewerRole: 'MEMBER',
      canLeave: true,
      canManageRoles: false,
      canManageMembers: false,
      canManageInvitations: false,
      canManageIdentity: false,
    },
    'groups/queries:listGroupMembers': {
      page: [
        {
          ...invite.invitee,
          role: 'MEMBER',
          joinedAt: 1,
          canRemove: false,
          canBan: false,
          canChangeRole: false,
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
  expect(await screen.findByText('@alex')).toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: 'Group bans' })
  ).not.toBeInTheDocument();
  const names = vi
    .mocked(client.watchQuery)
    .mock.calls.map(([query]) => getFunctionName(query));
  expect(names).not.toContain('groupModeration/queries:listGroupBans');
  expect(names).not.toContain('groupInvites/queries:listGroupInvites');
  expect(
    screen.queryByRole('button', { name: 'Remove Alex' })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('saves removal and ban preferences independently of invitation and Event preferences', async () => {
  const { client, mutation } = fixtureClient({
    'settings/queries:getNotificationSettings': {
      notificationMethods: [
        {
          id: 'method-one',
          type: 'EMAIL',
          enabled: true,
          name: 'Email channel',
          value: 'member@example.com',
          notifications: [
            { notificationType: 'NEW_POST', enabled: false },
            { notificationType: 'GROUP_INVITE_RECEIVED', enabled: false },
            { notificationType: 'GROUP_MEMBER_REMOVED', enabled: false },
            { notificationType: 'GROUP_MEMBER_BANNED', enabled: false },
          ],
        },
      ],
    },
    'users/queries:getCurrentUserProfile': {
      email: 'member@example.com',
      additionalEmails: [],
    },
  });
  const mounted = render(
    <AppProvider client={client}>
      <NotificationSettings />
    </AppProvider>
  );
  const user = userEvent.setup();
  await user.click(await screen.findByText('Email channel'));
  const removal = await screen.findByRole('checkbox', {
    name: /Removed from Group/,
  });
  expect(removal).not.toBeChecked();
  expect(
    screen.getByRole('checkbox', { name: /Banned from Group/ })
  ).not.toBeChecked();
  await user.click(removal);
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(mutation).toHaveBeenCalled());
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'settings/mutations:saveNotificationSettings'
  );
  expect(mutation.mock.calls[0][1]).toMatchObject({
    notificationMethods: [
      {
        notifications: [
          { notificationType: 'NEW_POST', enabled: false },
          { notificationType: 'GROUP_INVITE_RECEIVED', enabled: false },
          { notificationType: 'GROUP_MEMBER_REMOVED', enabled: true },
          { notificationType: 'GROUP_MEMBER_BANNED', enabled: false },
        ],
      },
    ],
  });
  mounted.unmount();
  await client.close();
});
it('pages private bans without exposing contact metadata and shows an empty final page', async () => {
  const { client } = fixtureClient({
    'groupModeration/queries:listGroupBans': (args: {
      paginationOpts: { cursor: string | null };
    }) =>
      args.paginationOpts.cursor
        ? emptyPage
        : {
            page: [{ ...invite.invitee, bannedAt: 1 }],
            isDone: false,
            continueCursor: 'ban-next',
          },
  });
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  const user = userEvent.setup();
  expect(
    await screen.findByRole('button', { name: 'Lift ban for Alex' })
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Next bans' }));
  expect(await screen.findByText('No bans to display.')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Next bans' })
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/member@example.com/)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'First bans page' }));
  expect(
    await screen.findByRole('button', { name: 'Lift ban for Alex' })
  ).toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('withholds pending invitation ban controls when the server protects the target', async () => {
  const { client } = fixtureClient({
    'groupInvites/queries:listGroupInvites': {
      page: [{ ...invite, canBan: false }],
      isDone: true,
      continueCursor: '',
    },
  });
  const mounted = render(
    <AppProvider client={client}>
      <GroupDetail groupId={groupId} />
    </AppProvider>
  );
  expect(
    await screen.findByRole('button', { name: 'Cancel invitation to Alex' })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Ban invited user Alex' })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
