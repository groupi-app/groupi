import {
  act,
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventOwnershipTransfer } from './event-ownership-transfer';
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
const eventId = 'event' as Id<'events'>,
  ownerId = 'owner' as Id<'persons'>,
  recipientId = 'recipient' as Id<'persons'>;
const members = [
  { personId: recipientId, role: 'ATTENDEE', user: { name: 'Recipient' } },
];
let result: Record<string, unknown>;
const observers = new Set<() => void>();
let writes: { name: string; args: unknown }[];
beforeEach(() => {
  observers.clear();
  writes = [];
  result = {
    eventId,
    organizerId: ownerId,
    status: 'NONE',
    transferId: null,
    explanation:
      'Friends visibility follows the new Organizer after acceptance.',
  };
  vi.spyOn(ConvexReactClient.prototype, 'watchQuery').mockImplementation(
    () => ({
      localQueryResult: () => result,
      onUpdate: callback => {
        observers.add(callback);
        return () => observers.delete(callback);
      },
      journal: () => undefined,
    })
  );
  vi.spyOn(ConvexReactClient.prototype, 'setAuth').mockImplementation(
    (_token, onChange) => {
      onChange?.(true);
    }
  );
  vi.spyOn(ConvexReactClient.prototype, 'clearAuth').mockImplementation(
    () => {}
  );
  vi.spyOn(ConvexReactClient.prototype, 'mutation').mockImplementation(
    async (...call) => {
      const [reference, args] = call;
      const name = getFunctionName(reference);
      writes.push({ name, args });
      result = name.endsWith(':offer')
        ? { ...result, recipientId, transferId: 'offer', status: 'PENDING' }
        : { ...result, organizerId: recipientId, status: 'ACCEPTED' };
      for (const update of observers) update();
      return result;
    }
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function mount(personId: Id<'persons'>) {
  return render(
    <ConvexClientProvider>
      <EventOwnershipTransfer
        eventId={eventId}
        personId={personId}
        members={members}
      />
    </ConvexClientProvider>
  );
}
describe('mounted ownership controls through the production authenticated provider and SDK', () => {
  it('explains Friends visibility and submits the selected recipient through the production transfer hook', async () => {
    const mounted = mount(ownerId);
    expect(screen.getByText(/Friends visibility follows/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Offer ownership to'), {
      target: { value: recipientId },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Offer ownership' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'current Organizer remains responsible'
      )
    );
    expect(writes).toEqual([
      {
        name: 'eventTransfers/mutations:offer',
        args: { eventId, recipientId },
      },
    ]);
    expect(
      screen.getByRole('button', { name: 'Cancel offer' })
    ).toBeInTheDocument();
    mounted.unmount();
  });
  it('mounts accessible recipient controls and reacts to accepted ownership without replacing React state or SDK hooks', async () => {
    result = { ...result, status: 'PENDING', recipientId, transferId: 'offer' };
    const mounted = mount(recipientId);
    expect(screen.getByRole('status')).toHaveTextContent(
      'current Organizer remains responsible'
    );
    expect(
      screen.queryByRole('button', { name: 'Cancel offer' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accept ownership' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('accepted')
    );
    expect(writes).toEqual([
      {
        name: 'eventTransfers/mutations:accept',
        args: { eventId, transferId: 'offer' },
      },
    ]);
    expect(
      screen.queryByRole('button', { name: 'Accept ownership' })
    ).not.toBeInTheDocument();
    await act(async () => mounted.unmount());
  });
  it('fails without the SDK provider instead of hiding a broken binding behind hook mocks', () => {
    expect(() =>
      render(
        <EventOwnershipTransfer
          eventId={eventId}
          personId={ownerId}
          members={members}
        />
      )
    ).toThrow('Could not find Convex client');
  });
});
