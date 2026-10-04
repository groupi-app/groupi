import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation } from 'convex/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { DiscoverTab } from '../app/(myEvents)/events/components/discover-tab';
import type { Id } from '@/convex/_generated/dataModel';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));

beforeEach(() => vi.clearAllMocks());
it('joins from Discover and explains the separate RSVP step', async () => {
  const join = vi
    .fn()
    .mockResolvedValue({ membershipId: 'member-1', success: true });
  const joinMutation: ReturnType<typeof useMutation> = Object.assign(join, {
    withOptimisticUpdate: () => joinMutation,
  });
  vi.mocked(useMutation).mockReturnValue(joinMutation);
  render(
    <DiscoverTab
      events={[
        {
          eventId: 'event-1' as Id<'events'>,
          title: 'Friends picnic',
          description: null,
          location: null,
          chosenDateTime: null,
          chosenEndDateTime: null,
          imageUrl: null,
          memberCount: 1,
          createdAt: 1,
          organizer: null,
        },
      ]}
    />
  );
  expect(
    screen.getByText('Joining leaves your RSVP Pending.')
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Join Event' }));
  expect(join).toHaveBeenCalledExactlyOnceWith({ eventId: 'event-1' });
  expect(mocks.push).toHaveBeenCalledWith('/event/event-1');
});
