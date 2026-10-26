const groupNavigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => groupNavigation }));
vi.mock('./group-discord-connect', () => ({ GroupDiscordConnect: () => null }));
vi.mock('./group-ban-management', () => ({ GroupBanManagement: () => null }));
vi.mock('./group-invitation-management', () => ({
  GroupInvitationManagement: () => null,
}));
vi.mock('./group-discord-settings', () => ({
  GroupDiscordRetiredStatus: () => null,
  GroupDiscordSettings: () => <div>Discord manager settings</div>,
}));
vi.mock('./community-expulsion-progress', () => ({
  CommunityExpulsionProgress: () => null,
}));
vi.mock('./community-expulsion-action', () => ({
  CommunityExpulsionAction: () => null,
}));
vi.mock('@/features/group-announcements/event-mail', () => ({
  EventMail: () => null,
}));
vi.mock('./group-announcement-composer', () => ({
  GroupAnnouncementComposer: () => null,
}));
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuery, useMutation } from 'convex/react';
import { GroupsPanel } from './groups-panel';

vi.mock('@/convex/_generated/api', () => ({
  api: {
    groupTools: {
      queries: {
        getFormPolicy: 'toolPolicy',
        getListPolicy: 'toolPolicy',
        getPollPolicy: 'toolPolicy',
      },
    },
    eventContent: { queries: { getContext: 'eventContext' } },
    groupTransfers: {
      queries: { status: 'transferStatus' },
      mutations: {
        offer: 'offerTransfer',
        accept: 'acceptTransfer',
        decline: 'declineTransfer',
        cancel: 'cancelTransfer',
      },
    },
    groupApplications: {
      queries: {
        getGroupApplicationForm: 'applicationForm',
        getGroupApplication: 'application',
        listMyGroupApplications: 'applicationHistory',
        listGroupApplications: 'applicationQueue',
      },
      mutations: {
        configureGroupApplications: 'configureApplications',
        submitGroupApplication: 'submitApplication',
        editGroupApplication: 'editApplication',
        withdrawGroupApplication: 'withdrawApplication',
        reviewGroupApplication: 'reviewApplication',
      },
    },
    groupEventAudiences: {
      queries: {
        getEventAudiences: 'eventAudiences',
        listGroupSharedEvents: 'sharedEvents',
      },
      mutations: {
        shareEventWithGroup: 'shareEvent',
        withdrawGroupEventAudience: 'withdrawAudience',
        configureGroupEventSharing: 'configureSharing',
        setEventFriendsAudience: 'friendsAudience',
      },
    },
    groupQuestionnaires: {
      queries: {
        getJoiningQuestionnaire: 'questionnaire',
        getJoiningQuestionnaireAccess: 'questionnaireAccess',
        listJoiningQuestionnaireAnswers: 'questionnaireReview',
        listJoiningQuestionnaireHistory: 'questionnaireHistory',
      },
      mutations: {
        configureJoiningQuestionnaire: 'configureQuestionnaire',
        submitJoiningQuestionnaire: 'submitQuestionnaire',
      },
    },
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
    if (String(query) === 'toolPolicy')
      return { enabled: true, creation: 'MANAGERS', canConfigure: false };
    if (String(query) === 'transferStatus') return null;
    if (String(query) === 'applicationForm')
      return {
        applicationsEnabled: false,
        questions: [],
        pending: null,
        canApply: false,
        canReview: false,
      };
    if (
      ['applicationHistory', 'applicationQueue', 'sharedEvents'].includes(
        String(query)
      )
    )
      return { page: [], isDone: true, continueCursor: '' };
    if (String(query) === 'ownInvite') return null;
    if (String(query) === 'questionnaireAccess')
      return { canRead: false, hasRecord: false, isMember: false };
    if (String(query) === 'questionnaire')
      return {
        enabled: false,
        version: 0,
        questions: [],
        answers: {},
        savedQuestions: [],
        completed: false,
        shouldPrompt: false,
        canEdit: false,
        canConfigure: false,
        canReview: false,
      };
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
import GroupsPage from '@/app/(groups)/groups/page';
import {
  GroupEdit,
  GroupDiscordManagement,
  GroupOwnershipSettings,
} from '@/features/groups';
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
    expect(
      screen.queryByRole('link', { name: 'Edit Group' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Group settings' })
    ).toHaveAttribute('href', '/groups/group-one/settings');
    render(<GroupEdit groupId={groupId} />);
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
    render(<GroupOwnershipSettings groupId={groupId} />);
    await user.click(screen.getByRole('button', { name: 'Delete Group' }));
    expect(
      screen.getByRole('button', { name: 'Permanently delete Group' })
    ).toBeDisabled();
    await user.type(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
    await user.click(
      screen.getByRole('button', { name: 'Permanently delete Group' })
    );
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        groupId,
        acknowledgeDiscordHandback: true,
      })
    );
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

it('shows Discord settings to Group moderators without owner role controls', () => {
  setQueryResult({
    ...group,
    viewerRole: 'MODERATOR',
    canManageIdentity: false,
    canManageMembers: true,
    canManageRoles: false,
  });
  render(<GroupDiscordManagement groupId={groupId} />);
  expect(screen.getByText('Discord manager settings')).toBeInTheDocument();
});

it('routes the stable deletion anchor to owner settings', async () => {
  setQueryResult(group);
  window.history.replaceState(null, '', '/groups/group-one#delete-group');
  render(<GroupDetail groupId={groupId} />);
  await waitFor(() =>
    expect(groupNavigation.replace).toHaveBeenCalledWith(
      '/groups/group-one/settings/ownership#delete-group'
    )
  );
  window.history.replaceState(null, '', '/');
});
it('routes application notification anchors to private review for managers', async () => {
  setQueryResult({ ...group, canManageMembers: true });
  window.history.replaceState(null, '', '/groups/group-one#group-applications');
  render(<GroupDetail groupId={groupId} />);
  await waitFor(() =>
    expect(groupNavigation.replace).toHaveBeenCalledWith(
      '/groups/group-one/settings/admissions#group-applications'
    )
  );
  window.history.replaceState(null, '', '/');
});
it('keeps management forms off the owner overview', () => {
  setQueryResult({
    ...group,
    canManageMembers: true,
    canManageInvitations: true,
    canManageRoles: true,
  });
  render(<GroupDetail groupId={groupId} />);
  expect(screen.getByRole('link', { name: 'Group settings' })).toHaveAttribute(
    'href',
    '/groups/group-one/settings'
  );
  expect(
    screen.queryByRole('button', { name: 'Delete Group' })
  ).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Group name')).not.toBeInTheDocument();
  expect(
    screen.queryByText('Discord manager settings')
  ).not.toBeInTheDocument();
});

it('does not redirect ordinary members into management from legacy anchors', () => {
  groupNavigation.replace.mockClear();
  setQueryResult({
    ...group,
    viewerRole: 'MEMBER',
    canManageIdentity: false,
    canManageMembers: false,
  });
  window.history.replaceState(null, '', '/groups/group-one#group-applications');
  render(<GroupDetail groupId={groupId} />);
  expect(groupNavigation.replace).not.toHaveBeenCalled();
  expect(
    screen.queryByRole('link', { name: 'Group settings' })
  ).not.toBeInTheDocument();
  window.history.replaceState(null, '', '/');
});

describe('Groups directory navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.isAuthenticated = true;
    auth.isLoading = false;
  });
  it('opens the authenticated directory with a single page heading and navigable Groups', async () => {
    setQueryResult({ page: [group], isDone: true, continueCursor: '' });
    render(<GroupsPage />);
    expect(
      screen.getByRole('heading', { name: 'Your Groups', level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { name: 'Your Groups' })
    ).toHaveLength(1);
    await userEvent
      .setup()
      .click(screen.getByRole('link', { name: 'Neighbors' }));
    expect(groupNavigation.push).toHaveBeenCalledWith('/groups/group-one');
  });
  it('keeps card destinations keyboard-operable and creation at the page heading level', async () => {
    setQueryResult({ page: [group], isDone: true, continueCursor: '' });
    const user = userEvent.setup();
    render(<GroupsPage />);
    const destination = screen.getByRole('link', { name: 'Neighbors' });
    destination.focus();
    expect(destination).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(groupNavigation.push).toHaveBeenCalledWith('/groups/group-one');
    expect(groupNavigation.push).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Create Group' }));
    expect(
      screen.getByRole('heading', { name: 'Create a Group', level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Your Groups' })
    ).not.toBeInTheDocument();
  });
  it('offers creation and the invitation inbox in the empty directory', () => {
    setQueryResult({ page: [], isDone: true, continueCursor: '' });
    render(<GroupsPage />);
    expect(screen.getByText('No Groups yet')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Group' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Your Group invitations' })
    ).toBeInTheDocument();
  });
  it('gates directory queries until sign-in and preserves its destination', () => {
    auth.isAuthenticated = false;
    render(<GroupsPage />);
    expect(
      screen.getByRole('link', { name: 'Sign in or sign up to view Groups' })
    ).toHaveAttribute('href', '/sign-in?redirect=%2Fgroups');
    expect(useQuery).not.toHaveBeenCalled();
    auth.isAuthenticated = true;
  });
  it('returns from Group overview to the real directory', () => {
    setQueryResult(group);
    render(<GroupDetail groupId={groupId} />);
    expect(screen.getByRole('link', { name: 'Your Groups' })).toHaveAttribute(
      'href',
      '/groups'
    );
    expect(
      screen.queryByRole('button', { name: 'Friends & Groups' })
    ).not.toBeInTheDocument();
  });
  it('returns unavailable Groups to the directory', () => {
    setQueryResult(null);
    render(<GroupDetail groupId={groupId} />);
    expect(screen.getByRole('link', { name: 'Your Groups' })).toHaveAttribute(
      'href',
      '/groups'
    );
  });
});

it('collects Group tools and sharing in keyboard-operable menus', async () => {
  setQueryResult(group);
  const user = userEvent.setup();
  render(<GroupDetail groupId={groupId} />);
  await user.click(screen.getByRole('button', { name: 'Group tools' }));
  expect(
    screen.getByRole('menuitem', { name: 'Forms and form settings' })
  ).toHaveAttribute('href', '/groups/group-one/forms');
  expect(
    screen.getByRole('menuitem', { name: 'Polls and poll settings' })
  ).toHaveAttribute('href', '/groups/group-one/polls');
  expect(
    screen.getByRole('menuitem', { name: 'Community lists and settings' })
  ).toHaveAttribute('href', '/groups/group-one/lists');
  await user.keyboard('{Escape}');
  expect(screen.getByRole('button', { name: 'Group tools' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Group actions' }));
  expect(
    screen.getByRole('menuitem', { name: 'Open unlisted Group page' })
  ).toHaveAttribute('href', '/g/group-one');
  expect(
    screen.getByRole('menuitem', { name: 'Your membership settings' })
  ).toHaveAttribute('href', '/groups/group-one/settings/membership');
});
