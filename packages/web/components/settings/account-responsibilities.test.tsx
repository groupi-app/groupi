import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { ConvexClientProvider } from '@/providers/convex-provider';
import { DeleteAccountModal } from '@/app/(settings)/settings/components/delete-account-modal';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
vi.unmock('@groupi/shared/hooks');
vi.unmock('@convex-dev/better-auth/react');
vi.mock('@/lib/convex', () => ({ isDevelopment: false }));
vi.mock('@/lib/auth-client', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
  authClient: {
    useSession: () => ({
      data: { user: { id: 'owner' }, session: { id: 'session' } },
      isPending: false,
    }),
    convex: { token: async () => ({ data: { token: 'token' } }) },
  },
}));
let queryFailure = false;
let event = true,
  pending = false,
  fail = false;
const observers = new Set<() => void>();
const writes: string[] = [];
beforeEach(() => {
  queryFailure = false;
  event = true;
  pending = false;
  fail = false;
  observers.clear();
  writes.length = 0;
  vi.spyOn(ConvexReactClient.prototype, 'watchQuery').mockImplementation(
    (...call) => {
      const [reference, args] = call;
      if (queryFailure) throw new Error('Ownership unavailable');
      return {
        localQueryResult: () =>
          getFunctionName(reference).endsWith(':recipients')
            ? {
                page: [{ personId: 'recipient', label: 'Recipient' }],
                isDone: true,
                continueCursor: '',
              }
            : getFunctionName(reference).endsWith(':readiness')
              ? {
                  hasOwnedGroups: false,
                  hasOwnedEvents: event,
                  canDelete: !event,
                }
              : {
                  page:
                    args.kind === 'EVENT' && event
                      ? [
                          {
                            kind: 'EVENT',
                            id: 'event',
                            title: 'Owned gathering',
                            status: pending ? 'PENDING' : 'NONE',
                            transferId: pending ? 'offer' : null,
                            recipientId: pending ? 'recipient' : null,
                            resolved: false,
                          },
                        ]
                      : [],
                  isDone: true,
                  continueCursor: '',
                },
        onUpdate: callback => {
          observers.add(callback);
          return () => observers.delete(callback);
        },
        journal: () => undefined,
      };
    }
  );
  vi.spyOn(ConvexReactClient.prototype, 'setAuth').mockImplementation(
    (_token, onChange) => onChange?.(true)
  );
  vi.spyOn(ConvexReactClient.prototype, 'clearAuth').mockImplementation(
    () => {}
  );
  vi.spyOn(ConvexReactClient.prototype, 'mutation').mockImplementation(
    async (...call) => {
      const [reference] = call;
      const name = getFunctionName(reference);
      writes.push(name);
      if (fail) throw new Error('Try again after rechecking ownership');
      if (name.endsWith(':offer')) pending = true;
      if (name.endsWith(':deleteOwnedEvent')) event = false;
      for (const update of observers) update();
      return { success: true };
    }
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('mounted authenticated app SDK announces unresolved transfer, recovers an action failure, and reaches final deletion only after explicit resolution', async () => {
  render(
    <ConvexClientProvider>
      <DeleteAccountModal open onOpenChange={() => {}} username='owner' />
    </ConvexClientProvider>
  );
  fireEvent.change(screen.getByLabelText(/To confirm, type your username/), {
    target: { value: 'owner' },
  });
  expect(screen.getByRole('button', { name: 'Delete Account' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Transfer ownership to'), {
    target: { value: 'recipient' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Offer transfer' }));
  await waitFor(() =>
    expect(screen.getByText(/Pending acceptance/)).toBeInTheDocument()
  );
  expect(screen.getByRole('button', { name: 'Delete Account' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Delete Event' }));
  fail = true;
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirm resource deletion' })
  );
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Try again')
  );
  fail = false;
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirm resource deletion' })
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Delete Account' })).toBeEnabled()
  );
  expect(screen.getByText('No unresolved Events.')).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Delete Account' }))
  );
  expect(writes).toEqual([
    'eventTransfers/mutations:offer',
    'accountResolution/mutations:deleteOwnedEvent',
    'accountResolution/mutations:deleteOwnedEvent',
    'users/mutations:deleteUserAccount',
  ]);
});

it('keeps query failures recoverable without presenting account deletion as complete', async () => {
  queryFailure = true;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <ConvexClientProvider>
      <DeleteAccountModal open onOpenChange={() => {}} username='owner' />
    </ConvexClientProvider>
  );
  expect(screen.getByRole('alert')).toHaveTextContent('ownership');
  expect(
    screen.queryByRole('button', { name: 'Delete Account' })
  ).not.toBeInTheDocument();
  queryFailure = false;
  fireEvent.click(
    screen.getByRole('button', { name: 'Retry ownership check' })
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Delete Account' })
    ).toBeDisabled()
  );
});
