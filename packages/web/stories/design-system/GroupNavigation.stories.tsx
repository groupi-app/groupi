import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState, type ReactNode } from 'react';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { getFunctionName, type FunctionReference } from 'convex/server';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupDetail } from '@/components/organisms/group-detail';
import { GroupMembershipSettings } from '@/features/groups/group-membership-settings';

const meta = {
  title: 'Design system/Group navigation',
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const groupId = 'fixture-group' as Id<'groups'>;
const emptyPage = { page: [], isDone: true, continueCursor: '' };

/** Instance-scoped, read-only transport. The production hooks and components run
 * against local query snapshots; no authentication or write reaches a backend. */
function createFixtureClient(owner: boolean) {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  const data: Record<string, unknown> = {
    'groups/queries:getGroup': {
      _id: groupId,
      name: 'Neighborhood Explorers',
      description:
        'Good company, shared plans, and a new place to explore each month.',
      viewerRole: owner ? 'OWNER' : 'MEMBER',
      canManageIdentity: owner,
      canManageMembers: owner,
      canManageRoles: owner,
      canManageInvitations: owner,
      canLeave: !owner,
      joiningQuestionnaire: { canAccessMemberContent: true },
    },
    'groups/queries:listGroupMembers': {
      ...emptyPage,
      page: [
        {
          personId: 'fixture-owner',
          name: 'Sam Rivera',
          username: 'sam',
          image: null,
          role: 'OWNER',
          joinedAt: 1,
          canRemove: false,
          canBan: false,
          canChangeRole: false,
        },
        {
          personId: 'fixture-member',
          name: 'Alex Chen',
          username: 'alex',
          image: null,
          role: 'MEMBER',
          joinedAt: 1,
          canRemove: owner,
          canBan: owner,
          canChangeRole: owner,
        },
      ],
    },
    'groupEventAudiences/queries:listGroupSharedEvents': {
      ...emptyPage,
      page: [
        {
          event: {
            _id: 'fixture-event',
            title: 'Saturday at the botanical gardens',
            description:
              'Meet by the conservatory for a relaxed afternoon together.',
            location: 'Botanical gardens, north entrance',
            chosenDateTime: Date.UTC(2026, 10, 14, 14),
            timezone: 'UTC',
          },
          canWithdraw: false,
        },
      ],
    },
    'groupQuestionnaires/queries:getJoiningQuestionnaire': {
      groupId,
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
    },
    'groupTransfers/queries:status': null,
    'groupDiscord/enrollment:getStatus': null,
    'groupDiscord/queries:getConnection': null,
  };
  const rejectRemoteCall = async () => {
    throw new Error(
      'This isolated Storybook fixture does not permit remote reads or writes.'
    );
  };
  Object.defineProperties(client, {
    setAuth: {
      value: (_fetch: unknown, onChange?: (authenticated: boolean) => void) =>
        onChange?.(true),
    },
    clearAuth: { value: () => {} },
    watchQuery: {
      value: (query: FunctionReference<'query'>) => ({
        onUpdate: () => () => {},
        localQueryResult: () => {
          const name = getFunctionName(query);
          if (!(name in data))
            throw new Error(`Missing isolated Group fixture query: ${name}`);
          return data[name];
        },
        journal: () => undefined,
      }),
    },
    query: { value: rejectRemoteCall },
    mutation: { value: rejectRemoteCall },
    action: { value: rejectRemoteCall },
  });
  return client;
}
const fetchAccessToken = async () => null;
function useFixtureAuth() {
  return { isLoading: false, isAuthenticated: true, fetchAccessToken };
}
function GroupFixture({
  owner = true,
  children,
}: {
  owner?: boolean;
  children: ReactNode;
}) {
  const [client] = useState(() => createFixtureClient(owner));
  useEffect(
    () => () => {
      void client.close();
    },
    [client]
  );
  return (
    <ConvexProviderWithAuth client={client} useAuth={useFixtureAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
export const OwnerOverview: Story = {
  render: () => (
    <GroupFixture>
      <GroupDetail groupId={groupId} />
    </GroupFixture>
  ),
};
export const MemberOverview: Story = {
  render: () => (
    <GroupFixture owner={false}>
      <GroupDetail groupId={groupId} />
    </GroupFixture>
  ),
};
export const MembershipSettings: Story = {
  render: () => (
    <GroupFixture owner={false}>
      <main className='mx-auto max-w-4xl p-6'>
        <GroupMembershipSettings groupId={groupId} />
      </main>
    </GroupFixture>
  ),
};
