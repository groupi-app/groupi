import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuery, useMutation } from 'convex/react';
import { GroupsPanel } from './groups-panel';

vi.mock('@/convex/_generated/api', () => ({
  api: {
    groupModeration: {
      queries: { listGroupBans: 'bans' },
      mutations: {
        leaveGroup: 'leave',
        setGroupMemberRole: 'role',
        removeGroupMember: 'removeMember',
        banGroupPerson: 'ban',
        liftGroupBan: 'lift',
      },
    },
    groupInvites: {
      queries: {
        listMyGroupInvites: 'inbox',
        listGroupInvites: 'sent',
        getMyGroupInviteForGroup: 'ownInvite',
      },
      mutations: {
        sendGroupInvite: 'send',
        acceptGroupInvite: 'accept',
        declineGroupInvite: 'decline',
        cancelGroupInvite: 'cancel',
      },
    },
    groups: {
      queries: {
        listGroups: 'list',
        getGroup: 'detail',
        getGroupLanding: 'landing',
        listGroupMembers: 'members',
      },
      mutations: {
        createGroup: 'create',
        updateGroup: 'update',
        deleteGroup: 'delete',
        updateGroupInvitationPolicy: 'policy',
      },
    },
  },
}));

function setQueryResult(result: unknown) {
  vi.mocked(useQuery).mockImplementation((...[query]) => {
    if (String(query) === 'members' || String(query) === 'inbox')
      return { page: [], isDone: true, continueCursor: '' };
    if (String(query) === 'ownInvite') return null;
    return result;
  });
}
const create = vi.fn();
const auth = vi.hoisted(() => ({ isAuthenticated: true, isLoading: false }));
vi.mock('convex/react', async importOriginal => ({
  ...(await importOriginal<typeof import('convex/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useConvexAuth: () => auth,
}));
describe('Friends & Groups creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setQueryResult({
      page: [],
      isDone: true,
      continueCursor: '',
    });
    vi.mocked(useMutation).mockReturnValue(
      create as unknown as ReturnType<typeof useMutation>
    );
    create.mockResolvedValue('group-one');
  });
  it('keeps the editor open and reports a failed creation', async () => {
    create.mockRejectedValueOnce(new Error('Group limit reached'));
    const user = userEvent.setup();
    const opened = vi.fn();
    render(<GroupsPanel onOpenGroup={opened} />);
    await user.click(screen.getByRole('button', { name: 'Create Group' }));
    await user.type(screen.getByLabelText('Group name'), 'Neighbors');
    await user.click(screen.getByRole('button', { name: 'Create Group' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Group limit reached'
    );
    expect(opened).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Group name')).toHaveValue('Neighbors');
  });
  it('browses the next page of Groups', async () => {
    vi.mocked(useQuery).mockImplementation((_query, args?) => {
      if (String(_query) === 'members' || String(_query) === 'inbox')
        return { page: [], isDone: true, continueCursor: '' };
      if (String(_query) === 'ownInvite') return null;
      const cursor = typeof args === 'object' && args.paginationOpts.cursor;
      return cursor
        ? {
            page: [{ _id: 'second', name: 'Garden Club' }],
            isDone: true,
            continueCursor: '',
          }
        : {
            page: [{ _id: 'first', name: 'Neighbors' }],
            isDone: false,
            continueCursor: 'next',
          };
    });
    const user = userEvent.setup();
    render(<GroupsPanel onOpenGroup={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Neighbors' })).toHaveAttribute(
      'href',
      '/groups/first'
    );
    await user.click(screen.getByRole('button', { name: 'Next Groups' }));
    expect(screen.getByRole('link', { name: 'Garden Club' })).toHaveAttribute(
      'href',
      '/groups/second'
    );
    expect(
      screen.queryByRole('button', { name: 'Next Groups' })
    ).not.toBeInTheDocument();
  });
  it('creates an owner-only Group and opens its stable detail page', async () => {
    const user = userEvent.setup();
    const opened = vi.fn();
    render(<GroupsPanel onOpenGroup={opened} />);
    await user.click(screen.getByRole('button', { name: 'Create Group' }));
    await user.type(screen.getByLabelText('Group name'), '  Neighbors  ');
    await user.click(screen.getByRole('button', { name: 'Create Group' }));
    await waitFor(() => expect(opened).toHaveBeenCalledWith('group-one'));
    expect(create).toHaveBeenCalledWith({ name: 'Neighbors' });
  });
});

import { GroupDetail } from './group-detail';
import { GroupLanding } from './group-landing';
import { Id } from '@/convex/_generated/dataModel';

const groupId = 'group-one' as Id<'groups'>;
const group = {
  _id: groupId,
  name: 'Neighbors',
  description: 'Our block',
  viewerRole: 'OWNER',
  canManageIdentity: true,
};
describe('Group identity and authority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMutation).mockReturnValue(
      create as unknown as ReturnType<typeof useMutation>
    );
    create.mockResolvedValue(null);
  });
  it('lets the owner rename and clear optional identity while retaining the stable link', async () => {
    setQueryResult(group);
    const user = userEvent.setup();
    render(<GroupDetail groupId={groupId} />);
    expect(screen.getByRole('link', { name: '/g/group-one' })).toHaveAttribute(
      'href',
      '/g/group-one'
    );
    await user.click(screen.getByRole('button', { name: 'Edit Group' }));
    await user.clear(screen.getByLabelText('Group name'));
    await user.type(screen.getByLabelText('Group name'), 'Garden Club');
    await user.clear(screen.getByLabelText('Description (optional)'));
    await user.click(screen.getByRole('button', { name: 'Save Group' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        groupId,
        name: 'Garden Club',
        description: null,
        image: null,
      })
    );
  });
  it('withholds identity and deletion controls from a member', () => {
    setQueryResult({
      ...group,
      viewerRole: 'MEMBER',
      canManageIdentity: false,
    });
    render(<GroupDetail groupId={groupId} />);
    expect(
      screen.queryByRole('button', { name: 'Edit Group' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete Group' })
    ).not.toBeInTheDocument();
  });
  it('requires explicit deletion confirmation before deleting a Group', async () => {
    setQueryResult(group);
    const user = userEvent.setup();
    render(<GroupDetail groupId={groupId} />);
    await user.click(screen.getByRole('button', { name: 'Delete Group' }));
    expect(
      screen.getByRole('button', { name: 'Permanently delete Group' })
    ).toBeDisabled();
    await user.type(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
    await user.click(
      screen.getByRole('button', { name: 'Permanently delete Group' })
    );
    await waitFor(() => expect(create).toHaveBeenCalledWith({ groupId }));
  });
  it('preserves the landing path through sign-in and signup', () => {
    auth.isAuthenticated = false;
    setQueryResult({
      groupId,
      name: 'Neighbors',
      description: 'Our block',
      image: null,
    });
    render(<GroupLanding groupId={groupId} />);
    expect(
      screen.getByRole('link', { name: 'Sign in or sign up' })
    ).toHaveAttribute('href', '/sign-in?redirect=%2Fg%2Fgroup-one');
    auth.isAuthenticated = true;
  });
  it('shows the unlisted identity without exposing a roster', () => {
    setQueryResult({
      groupId,
      name: 'Neighbors',
      description: 'Our block',
      image: null,
    });
    render(<GroupLanding groupId={groupId} />);
    expect(
      screen.getByRole('heading', { name: 'Neighbors' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Group' })).toHaveAttribute(
      'href',
      '/groups/group-one'
    );
    expect(
      screen.queryByRole('button', { name: 'Edit Group' })
    ).not.toBeInTheDocument();
  });
});
