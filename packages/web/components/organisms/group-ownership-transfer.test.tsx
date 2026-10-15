import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { expect, it, vi, beforeEach, afterEach } from 'vitest';
import { GroupOwnershipTransfer } from './group-ownership-transfer';
import { GroupDetail } from './group-detail';
import { ConvexClientProvider } from '@/providers/convex-provider';
import type { Id } from '@/convex/_generated/dataModel';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
vi.unmock('@convex-dev/better-auth/react');
vi.mock('@/lib/convex', () => ({ isDevelopment: false }));
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: { id: 'fixture-user' },
        session: { id: 'fixture-session' },
      },
      isPending: false,
    }),
    convex: { token: async () => ({ data: { token: 'fixture-token' } }) },
  },
}));
const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => navigation }));
const groupId = 'group' as Id<'groups'>;
let status: Record<string, unknown>,
  reject = false;
const observers = new Set<() => void>(),
  writes: { name: string; args: unknown }[] = [];
beforeEach(() => {
  observers.clear();
  writes.length = 0;
  reject = false;
  navigation.push.mockReset();
  status = {
    groupId,
    ownerId: 'owner',
    status: 'NONE',
    transferId: null,
    canOffer: true,
    canAccept: false,
    canDecline: false,
    canCancel: false,
    recipient: null,
    explanation:
      'The current owner remains responsible until acceptance. The former owner becomes a Moderator. Independent Events stay unchanged.',
  };
  vi.spyOn(ConvexReactClient.prototype, 'watchQuery').mockImplementation(
    (...call) => ({
      localQueryResult: () => {
        const name = getFunctionName(call[0]);
        if (name === 'groupTransfers/queries:status') return status;
        if (name === 'groupQuestionnaires/queries:getJoiningQuestionnaire')
          return {
            groupId: 'group',
            enabled: false,
            requiredCompletion: false,
            requiresCompletion: false,
            canAccessMemberContent: true,
            completed: false,
            shouldPrompt: false,
            version: 0,
            questions: [],
            savedQuestions: [],
            answers: {},
            canEdit: false,
            canConfigure: false,
            canReview: false,
          };
        if (
          name === 'groupQuestionnaires/queries:getJoiningQuestionnaireAccess'
        )
          return { canRead: true, hasRecord: false, isMember: true };
        if (name === 'groups/queries:getGroup')
          return {
            _id: groupId,
            name: 'Readers',
            viewerRole: 'OWNER',
            canManageIdentity: true,
            canLeave: false,
            canManageMembers: false,
            canManageInvitations: false,
            memberCount: 2,
          };
        if (name === 'groups/queries:listGroupMembers')
          return {
            page: [{ personId: 'recipient', role: 'MEMBER', name: 'Jordan' }],
            isDone: true,
            continueCursor: '',
          };
        return { page: [], isDone: true, continueCursor: '' };
      },
      onUpdate: callback => {
        observers.add(callback);
        return () => observers.delete(callback);
      },
      journal: () => undefined,
    })
  );
  vi.spyOn(ConvexReactClient.prototype, 'setAuth').mockImplementation(
    (_token, change) => change?.(true)
  );
  vi.spyOn(ConvexReactClient.prototype, 'clearAuth').mockImplementation(
    () => {}
  );
  vi.spyOn(ConvexReactClient.prototype, 'mutation').mockImplementation(
    async (...call) => {
      const name = getFunctionName(call[0]);
      writes.push({ name, args: call[1] });
      if (reject) throw new Error('Recipient no longer eligible');
      if (name.endsWith(':offer'))
        status = {
          ...status,
          status: 'PENDING',
          transferId: 'offer',
          recipientId: 'recipient',
          recipient: { name: 'Jordan' },
          canOffer: false,
          canCancel: true,
        };
      else if (name.endsWith(':accept'))
        status = {
          ...status,
          status: 'ACCEPTED',
          ownerId: 'recipient',
          canAccept: false,
          canDecline: false,
        };
      else if (name.endsWith(':decline') || name.endsWith(':cancel'))
        status = {
          ...status,
          status: name.endsWith(':decline') ? 'DECLINED' : 'CANCELLED',
          canAccept: false,
          canDecline: false,
          canCancel: false,
          canOffer: true,
        };
      observers.forEach(update => update());
      return status;
    }
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function mount(detail = false) {
  return render(
    <ConvexClientProvider>
      {detail ? (
        <GroupDetail groupId={groupId} />
      ) : (
        <GroupOwnershipTransfer groupId={groupId} />
      )}
    </ConvexClientProvider>
  );
}
it('offers a named admitted member and truthfully announces pending responsibility through the actual provider/SDK', async () => {
  mount();
  fireEvent.change(screen.getByLabelText('Offer ownership to'), {
    target: { value: 'recipient' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Offer ownership' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'current owner remains responsible'
    )
  );
  expect(writes).toEqual([
    {
      name: 'groupTransfers/mutations:offer',
      args: { groupId, recipientId: 'recipient' },
    },
  ]);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel offer' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('cancelled')
  );
});
it('recipient can accept or decline the observed transfer and rejected acceptance stays pending', async () => {
  status = {
    ...status,
    status: 'PENDING',
    transferId: 'offer',
    canOffer: false,
    canAccept: true,
    canDecline: true,
  };
  mount();
  reject = true;
  fireEvent.click(screen.getByRole('button', { name: 'Accept ownership' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'no longer eligible'
  );
  expect(screen.getByRole('status')).toHaveTextContent('pending');
  reject = false;
  fireEvent.click(screen.getByRole('button', { name: 'Decline ownership' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('declined')
  );
  expect(writes[1]).toEqual({
    name: 'groupTransfers/mutations:decline',
    args: { groupId, transferId: 'offer' },
  });
});
it('acceptance reports the terminal outcome and retirement requires explicit confirmation before stable landing return', async () => {
  status = {
    ...status,
    status: 'PENDING',
    transferId: 'offer',
    canOffer: false,
    canAccept: true,
    canDecline: true,
  };
  const mounted = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Accept ownership' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('accepted')
  );
  mounted.unmount();
  mount(true);
  expect(
    screen.getByText(/Independent Events, invitations/)
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Delete Group' }));
  const deletion = screen.getByRole('button', {
    name: 'Permanently delete Group',
  });
  expect(deletion).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), {
    target: { value: 'DELETE' },
  });
  fireEvent.click(deletion);
  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/g/group'));
  expect(writes.at(-1)).toEqual({
    name: 'groups/mutations:deleteGroup',
    args: { groupId },
  });
});
