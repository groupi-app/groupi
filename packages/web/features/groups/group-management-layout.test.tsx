import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupManagementLayout } from './group-management-layout';
import { useGroup } from '@/hooks/convex/use-groups';

const state = vi.hoisted(() => ({
  authenticated: true,
  role: 'OWNER',
  pathname: '/groups/group-one/settings/invitations',
}));
vi.mock('next/navigation', () => ({
  useParams: () => ({ groupId: 'group-one' }),
  usePathname: () => state.pathname,
}));
vi.mock('convex/react', () => ({
  useConvexAuth: () => ({
    isAuthenticated: state.authenticated,
    isLoading: false,
  }),
}));
vi.mock('@/hooks/convex/use-groups', () => ({
  useGroup: vi.fn(() => ({
    name: 'Neighbors',
    viewerRole: state.role,
    canManageIdentity: state.role === 'OWNER',
    canManageRoles: state.role === 'OWNER',
    canManageMembers: state.role !== 'MEMBER',
    canManageInvitations: state.role !== 'MEMBER',
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  state.authenticated = true;
  state.role = 'OWNER';
  state.pathname = '/groups/group-one/settings/invitations';
});
describe('Group management navigation', () => {
  it('provides visible settings links and identifies the current screen', () => {
    render(
      <GroupManagementLayout>
        <p>Invitation controls</p>
      </GroupManagementLayout>
    );
    const nav = screen.getByRole('navigation', { name: 'Group settings' });
    expect(nav).toBeVisible();
    expect(screen.getByRole('link', { name: 'Invitations' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Edit Group' })).toHaveAttribute(
      'href',
      '/groups/group-one/edit'
    );
    expect(
      screen.getByRole('link', { name: 'Ownership & safety' })
    ).toHaveAttribute('href', '/groups/group-one/settings/ownership');
  });
  it('keeps owner editing out of moderator navigation', () => {
    state.role = 'MODERATOR';
    render(
      <GroupManagementLayout>
        <p>Manager controls</p>
      </GroupManagementLayout>
    );
    expect(
      screen.queryByRole('link', { name: 'Edit Group' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Discord' })).toBeVisible();
  });
  it('withholds management content from ordinary members', () => {
    state.role = 'MEMBER';
    render(
      <GroupManagementLayout>
        <p>Private manager controls</p>
      </GroupManagementLayout>
    );
    expect(
      screen.queryByText('Private manager controls')
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Return to Group' })
    ).toHaveAttribute('href', '/groups/group-one');
  });
  it('withholds editing from moderators even on a direct edit route', () => {
    state.role = 'MODERATOR';
    render(
      <GroupManagementLayout editing>
        <p>Identity form</p>
      </GroupManagementLayout>
    );
    expect(screen.queryByText('Identity form')).not.toBeInTheDocument();
  });
  it('preserves the destination through sign-in', () => {
    state.authenticated = false;
    render(
      <GroupManagementLayout>
        <p>Private manager controls</p>
      </GroupManagementLayout>
    );
    expect(useGroup).not.toHaveBeenCalled();
    expect(
      screen.getByRole('link', { name: 'Sign in or sign up to open Group' })
    ).toHaveAttribute(
      'href',
      '/sign-in?redirect=%2Fgroups%2Fgroup-one%2Fsettings%2Finvitations'
    );
    expect(
      screen.queryByText('Private manager controls')
    ).not.toBeInTheDocument();
  });
});

it('allows members to open only their personal membership settings', () => {
  state.role = 'MEMBER';
  state.pathname = '/groups/group-one/settings/membership';
  render(
    <GroupManagementLayout>
      <p>Personal controls</p>
    </GroupManagementLayout>
  );
  expect(screen.getByText('Personal controls')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Your membership' })).toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(
    screen.queryByRole('link', { name: 'Admissions' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Ownership & safety' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Invitations' })
  ).not.toBeInTheDocument();
});

it.each([
  'admissions',
  'invitations',
  'questionnaire',
  'discord',
  'announcements',
  'ownership',
])(
  'keeps ordinary members out of %s management after adding personal settings',
  path => {
    state.role = 'MEMBER';
    state.pathname = `/groups/group-one/settings/${path}`;
    render(
      <GroupManagementLayout>
        <p>Private manager controls</p>
      </GroupManagementLayout>
    );
    expect(
      screen.queryByText('Private manager controls')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Group settings unavailable')).toBeInTheDocument();
  }
);
