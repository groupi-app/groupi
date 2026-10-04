vi.unmock('@/convex/_generated/api');
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventOwnershipTransfer } from './event-ownership-transfer';
import type { Id } from '@/convex/_generated/dataModel';
const state = vi.hoisted(() => ({
  status: {} as Record<string, unknown>,
  offer: vi.fn(),
  accept: vi.fn(),
  decline: vi.fn(),
  cancel: vi.fn(),
}));
vi.mock('convex/react', async () => {
  const { getFunctionName } = await import('convex/server');
  return {
    useQuery: () => state.status,
    useMutation: (ref: Parameters<typeof getFunctionName>[0]) => {
      const name = getFunctionName(ref).split(':')[1] as
        | 'offer'
        | 'accept'
        | 'decline'
        | 'cancel';
      return state[name];
    },
  };
});
const eventId = 'event' as Id<'events'>,
  ownerId = 'owner' as Id<'persons'>,
  recipientId = 'recipient' as Id<'persons'>;
const members = [
  { personId: recipientId, role: 'ATTENDEE', user: { name: 'Recipient' } },
];
describe('accessible Event ownership controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.status = {
      organizerId: ownerId,
      status: 'NONE',
      explanation:
        'Friends visibility follows the new Organizer after acceptance.',
    };
  });
  it('explains the Friends change and offers ownership to the selected existing member', async () => {
    render(
      <EventOwnershipTransfer
        eventId={eventId}
        personId={ownerId}
        members={members}
      />
    );
    expect(screen.getByText(/Friends visibility follows/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Offer ownership to'), {
      target: { value: recipientId },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Offer ownership' }));
    await waitFor(() =>
      expect(state.offer).toHaveBeenCalledWith({ eventId, recipientId })
    );
  });
  it('labels pending responsibility and provides recipient accept/decline without cancelling', async () => {
    state.status = {
      ...state.status,
      status: 'PENDING',
      recipientId,
      transferId: 'offer',
    };
    render(
      <EventOwnershipTransfer
        eventId={eventId}
        personId={recipientId}
        members={members}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'current Organizer remains responsible'
    );
    expect(
      screen.queryByRole('button', { name: 'Cancel offer' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accept ownership' }));
    await waitFor(() =>
      expect(state.accept).toHaveBeenCalledWith({
        eventId,
        transferId: 'offer',
      })
    );
    expect(
      screen.getByRole('button', { name: 'Decline offer' })
    ).toBeInTheDocument();
  });
});
