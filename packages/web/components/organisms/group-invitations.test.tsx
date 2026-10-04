import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ConvexProvider,
  ConvexProviderWithAuth,
  ConvexReactClient,
  useMutation,
} from 'convex/react';
import { getFunctionName } from 'convex/server';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import type { Id } from '@/convex/_generated/dataModel';
import type { ReactNode } from 'react';
import { GroupMemberRoster } from './group-member-roster';
import { GroupDetail } from './group-detail';
import { GroupLanding } from './group-landing';
import NotificationSettings from '@/app/(settings)/settings/notifications/page';
import PrivacySettings from '@/app/(settings)/settings/privacy/page';
import { NotificationSlate } from '@/components/notification-slate';
import { GroupInvitationInbox } from './group-invitation-inbox';

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
};
const groupId = 'group-one' as Id<'groups'>;
const detail = {
  _id: groupId,
  name: 'Neighbors',
  viewerRole: 'OWNER',
  canManageIdentity: true,
  canManageInvitations: true,
  invitationsEnabled: true,
  canManageRoles: true,
  canManageMembers: true,
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
      page: [{ ...invite.invitee, role: 'MEMBER', joinedAt: 1 }],
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
  vi.spyOn(client, 'watchQuery').mockImplementation((...[query]) => ({
    onUpdate: () => () => {},
    localQueryResult: () => {
      const name = getFunctionName(query);
      if (!(name in data)) throw new Error(`Unexpected query ${name}`);
      return data[name];
    },
    journal: () => undefined,
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockResolvedValue({ groupId: 'group-one', status: 'ACCEPTED' });
  return { client, mutation };
}
it('accepts an invitation explicitly from the private inbox using the app SDK', async () => {
  const { client, mutation } = fixtureClient();
  const opened = vi.fn();
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupInvitationInbox onOpenGroup={opened} />
    </ConvexProvider>
  );
  expect(mutation).not.toHaveBeenCalled();
  await userEvent
    .setup()
    .click(
      screen.getByRole('button', { name: 'Accept invitation to Neighbors' })
    );
  await waitFor(() => expect(opened).toHaveBeenCalledWith('group-one'));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupInvites/mutations:acceptGroupInvite'
  );
  expect(mutation.mock.calls[0][1]).toEqual({ inviteId: 'invite-one' });
  mounted.unmount();
  await client.close();
});

afterAll(() => aliasCleanup());
describe('Group invitations through production screens', () => {
  it('uses the app provider despite a distinct shared SDK', async () => {
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
      await screen.findByRole('heading', { name: 'Neighbors', level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Group members' })
    ).toBeInTheDocument();
    mounted.unmount();
    await client.close();
  });
  it('lets the owner invite an existing user without creating Event participation', async () => {
    const { client, mutation } = fixtureClient();
    const mounted = render(
      <AppProvider client={client}>
        <GroupDetail groupId={groupId} />
      </AppProvider>
    );
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText('Find an existing user by username'),
      'alex'
    );
    await user.click(screen.getByRole('button', { name: 'Search users' }));
    await user.click(
      await screen.findByRole('button', { name: 'Invite Alex to Group' })
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Invitation sent to Alex'
    );
    expect(mutation.mock.calls.map(([ref]) => getFunctionName(ref))).toEqual([
      'groupInvites/mutations:sendGroupInvite',
    ]);
    expect(mutation.mock.calls[0][1]).toEqual({
      groupId,
      inviteePersonId: 'member-one',
    });
    mounted.unmount();
    await client.close();
  });
  it('keeps recipient unavailability generic', async () => {
    const { client, mutation } = fixtureClient();
    mutation.mockRejectedValueOnce(new Error('confidential privacy reason'));
    const mounted = render(
      <AppProvider client={client}>
        <GroupDetail groupId={groupId} />
      </AppProvider>
    );
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText('Find an existing user by username'),
      'alex'
    );
    await user.click(screen.getByRole('button', { name: 'Search users' }));
    await user.click(
      await screen.findByRole('button', { name: 'Invite Alex to Group' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This user is unavailable for a Group invitation'
    );
    expect(
      screen.queryByText('confidential privacy reason')
    ).not.toBeInTheDocument();
    mounted.unmount();
    await client.close();
  });
  it('lets the owner disable invitations and cancel pending sender history', async () => {
    const { client, mutation } = fixtureClient();
    const mounted = render(
      <AppProvider client={client}>
        <GroupDetail groupId={groupId} />
      </AppProvider>
    );
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('checkbox', { name: 'Allow manager invitations' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Save invitation settings' })
    );
    await waitFor(() => expect(mutation).toHaveBeenCalled());
    expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
      'groups/mutations:updateGroupInvitationPolicy'
    );
    expect(mutation.mock.calls[0][1]).toEqual({
      groupId,
      invitationsEnabled: false,
    });
    await user.click(
      screen.getByRole('button', { name: 'Cancel invitation to Alex' })
    );
    await waitFor(() => expect(mutation.mock.calls).toHaveLength(2));
    expect(getFunctionName(mutation.mock.calls[1][0])).toBe(
      'groupInvites/mutations:cancelGroupInvite'
    );
    mounted.unmount();
    await client.close();
  });
  it('shows admitted members only the safe roster, withholding manager controls', async () => {
    const { client, mutation } = fixtureClient({
      'groups/queries:getGroup': {
        ...detail,
        viewerRole: 'MEMBER',
        canManageIdentity: false,
        canManageInvitations: false,
      },
    });
    const mounted = render(
      <AppProvider client={client}>
        <GroupDetail groupId={groupId} />
      </AppProvider>
    );
    expect(await screen.findByText('@alex')).toBeInTheDocument();
    expect(screen.getByText('Member', { exact: true })).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Find an existing user by username')
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(mutation).not.toHaveBeenCalled();
    expect(
      vi
        .mocked(client.watchQuery)
        .mock.calls.some(
          ([q]) =>
            getFunctionName(q) === 'groupInvites/queries:listGroupInvites'
        )
    ).toBe(false);
    mounted.unmount();
    await client.close();
  });
  it('shows only the viewer’s own invitation on the unlisted landing, without a roster or automatic admission', async () => {
    const { client, mutation } = fixtureClient({
      'groups/queries:getGroup': null,
    });
    const mounted = render(
      <AppProvider client={client}>
        <GroupLanding groupId={groupId} />
      </AppProvider>
    );
    expect(
      await screen.findByRole('button', {
        name: 'Accept invitation to Neighbors',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Group members' })
    ).not.toBeInTheDocument();
    expect(mutation).not.toHaveBeenCalled();
    const names = vi
      .mocked(client.watchQuery)
      .mock.calls.map(([q]) => getFunctionName(q));
    expect(names).not.toContain('groups/queries:listGroupMembers');
    expect(names).not.toContain('groupInvites/queries:listGroupInvites');
    mounted.unmount();
    await client.close();
  });
  it('does not turn an unlisted link into an invitation credential', async () => {
    const { client, mutation } = fixtureClient({
      'groups/queries:getGroup': null,
      'groupInvites/queries:getMyGroupInviteForGroup': null,
    });
    const mounted = render(
      <AppProvider client={client}>
        <GroupLanding groupId={groupId} />
      </AppProvider>
    );
    expect(
      await screen.findByText(/This page is not an invitation/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Accept invitation/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Open Group' })
    ).not.toBeInTheDocument();
    expect(mutation).not.toHaveBeenCalled();
    mounted.unmount();
    await client.close();
  });
  it('declines explicitly and reports action-time failure without navigating', async () => {
    const { client, mutation } = fixtureClient();
    mutation.mockRejectedValueOnce(new Error('Invitation unavailable'));
    const opened = vi.fn();
    const mounted = render(
      <AppProvider client={client}>
        <GroupInvitationInbox onOpenGroup={opened} />
      </AppProvider>
    );
    await userEvent.setup().click(
      await screen.findByRole('button', {
        name: 'Decline invitation to Neighbors',
      })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invitation unavailable'
    );
    expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
      'groupInvites/mutations:declineGroupInvite'
    );
    expect(opened).not.toHaveBeenCalled();
    mounted.unmount();
    await client.close();
  });
  it('preserves separate friend and Event preferences when saving Group invite privacy', async () => {
    const { client, mutation } = fixtureClient();
    const mounted = render(
      <AppProvider client={client}>
        <PrivacySettings />
      </AppProvider>
    );
    const user = userEvent.setup();
    const policy = await screen.findByRole('combobox', {
      name: 'Who can send Group invitations',
    });
    expect(policy).toHaveValue('EVERYONE');
    await user.selectOptions(policy, 'NO_ONE');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(mutation).toHaveBeenCalled());
    expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
      'settings/mutations:savePrivacySettings'
    );
    expect(mutation.mock.calls[0][1]).toEqual({
      allowFriendRequestsFrom: 'EVENT_MEMBERS',
      allowEventInvitesFrom: 'FRIENDS',
      allowGroupInvitesFrom: 'NO_ONE',
    });
    mounted.unmount();
    await client.close();
  });
});

describe('Private Group invitation states and pagination', () => {
  it.each(['ACCEPTED', 'DECLINED', 'CANCELLED'])(
    'renders current %s invitation state with no stale acceptance action',
    async status => {
      const { client, mutation } = fixtureClient({
        'groupInvites/queries:listMyGroupInvites': {
          ...emptyPage,
          page: [{ ...invite, status }],
        },
      });
      const mounted = render(
        <AppProvider client={client}>
          <GroupInvitationInbox onOpenGroup={vi.fn()} />
        </AppProvider>
      );
      expect(
        screen.getByText(status[0] + status.slice(1).toLowerCase(), {
          exact: true,
        })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Accept invitation/ })
      ).not.toBeInTheDocument();
      expect(mutation).not.toHaveBeenCalled();
      mounted.unmount();
      await client.close();
    }
  );
  it('withholds actions when an invitation is unavailable', async () => {
    const { client } = fixtureClient({
      'groupInvites/queries:listMyGroupInvites': {
        ...emptyPage,
        page: [{ ...invite, available: false }],
      },
    });
    const mounted = render(
      <AppProvider client={client}>
        <GroupInvitationInbox onOpenGroup={vi.fn()} />
      </AppProvider>
    );
    expect(
      screen.getByText('Pending — invitation unavailable')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Accept invitation/ })
    ).not.toBeInTheDocument();
    mounted.unmount();
    await client.close();
  });
  it('pages the safe member roster without loading contacts', async () => {
    const { client } = fixtureClient();
    const first = {
      page: [{ ...invite.inviter, role: 'OWNER', joinedAt: 1 }],
      isDone: false,
      continueCursor: 'next',
    };
    const second = {
      page: [{ ...invite.invitee, role: 'MEMBER', joinedAt: 1 }],
      isDone: true,
      continueCursor: '',
    };
    vi.mocked(client.watchQuery).mockImplementation((...[query, args]) => ({
      onUpdate: () => () => {},
      journal: () => undefined,
      localQueryResult: () => {
        expect(getFunctionName(query)).toBe('groups/queries:listGroupMembers');
        const page = args as { paginationOpts: { cursor: string | null } };
        return page.paginationOpts.cursor ? second : first;
      },
    }));
    const mounted = render(
      <AppProvider client={client}>
        <GroupMemberRoster groupId={groupId} />
      </AppProvider>
    );
    expect(screen.getByText('@sam')).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Next members' }));
    expect(screen.getByText('@alex')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next members' })
    ).not.toBeInTheDocument();
    mounted.unmount();
    await client.close();
  });
  it.each(['GROUP_INVITE_RECEIVED', 'GROUP_INVITE_ACCEPTED'] as const)(
    'routes %s notifications to the Group identity with no email metadata',
    async type => {
      const { client } = fixtureClient();
      const notification = {
        _id: 'notification-one' as Id<'notifications'>,
        _creationTime: 1,
        id: 'notification-one',
        createdAt: 1,
        personId: 'member-one' as Id<'persons'>,
        type,
        read: true,
        groupId,
        group: { id: groupId, title: 'Neighbors' },
        groupInvite: { id: 'invite-one', status: 'DECLINED' },
        author: { user: { name: 'Sam', email: null } },
      };
      const mounted = render(
        <AppProvider client={client}>
          <NotificationSlate notification={notification} />
        </AppProvider>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/g/group-one');
      expect(link).toHaveTextContent('Neighbors');
      if (type === 'GROUP_INVITE_RECEIVED')
        expect(link).toHaveTextContent('declined');
      else expect(link).toHaveTextContent('accepted your invitation');
      mounted.unmount();
      await client.close();
    }
  );
});

it('saves independent Group notification preferences without changing Event preferences', async () => {
  const { client, mutation } = fixtureClient({
    'settings/queries:getNotificationSettings': {
      personSettings: { id: 'settings-one' },
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
            { notificationType: 'GROUP_INVITE_ACCEPTED', enabled: false },
          ],
        },
      ],
    },
    'users/queries:getCurrentUserProfile': {
      user: { email: 'member@example.com', additionalEmails: [] },
    },
  });
  const mounted = render(
    <AppProvider client={client}>
      <NotificationSettings />
    </AppProvider>
  );
  const user = userEvent.setup();
  await user.click(await screen.findByText('Email channel'));
  const received = await screen.findByRole('checkbox', {
    name: /Group Invitation Received/,
  });
  const accepted = screen.getByRole('checkbox', {
    name: /Group Invitation Accepted/,
  });
  expect(received).not.toBeChecked();
  expect(accepted).not.toBeChecked();
  await user.click(received);
  await user.click(await screen.findByRole('button', { name: 'Save' }));
  await waitFor(() => expect(mutation).toHaveBeenCalled());
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'settings/mutations:saveNotificationSettings'
  );
  const payload = mutation.mock.calls[0][1] as {
    notificationMethods: Array<{
      notifications: Array<{ notificationType: string; enabled: boolean }>;
    }>;
  };
  expect(payload.notificationMethods[0].notifications).toEqual([
    { notificationType: 'NEW_POST', enabled: false },
    { notificationType: 'GROUP_INVITE_RECEIVED', enabled: true },
    { notificationType: 'GROUP_INVITE_ACCEPTED', enabled: false },
  ]);
  mounted.unmount();
  await client.close();
});
