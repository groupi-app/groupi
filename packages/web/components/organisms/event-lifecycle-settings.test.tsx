import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { expect, it, vi } from 'vitest';
import type { Id } from '@/convex/_generated/dataModel';
import { EventLifecycleSettings } from './event-lifecycle-settings';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
const eventId = 'event-one' as Id<'events'>;
function fixture(completed = false) {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation((...args) => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => {
      expect(getFunctionName(args[0])).toBe(
        'events/lifecycleOperations:getLifecycle'
      );
      return {
        revision: 'revision-one',
        completed,
        completedAt: null,
        startsAt: null,
        endsAt: null,
      };
    },
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockResolvedValue({ result: { completed: true } });
  return { client, mutation };
}
it('does not show lifecycle management to Group managers without Event Organizer role', () => {
  render(<EventLifecycleSettings eventId={eventId} role='MODERATOR' />);
  expect(screen.queryByRole('button', { name: 'Complete Event' })).toBeNull();
});
it('completes through the Organizer public mutation and retries the exact unknown outcome', async () => {
  const { client, mutation } = fixture();
  mutation.mockRejectedValueOnce(new Error('Connection lost after commit'));
  render(
    <ConvexProvider client={client}>
      <EventLifecycleSettings eventId={eventId} role='ORGANIZER' />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Complete Event' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection lost');
  await user.click(screen.getByRole('button', { name: 'Retry same request' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'events/lifecycleOperations:setLifecycle'
  );
  expect(mutation.mock.calls[0][1]).toMatchObject({
    eventId,
    action: 'complete',
    expectedRevision: 'revision-one',
  });
  expect(mutation.mock.calls[1][1]).toEqual(mutation.mock.calls[0][1]);
  expect(await screen.findByText('Event completed.')).toBeInTheDocument();
});
it('offers guarded reopen and reschedule of completed Events in UTC', async () => {
  const { client, mutation } = fixture(true);
  render(
    <ConvexProvider client={client}>
      <EventLifecycleSettings eventId={eventId} role='ORGANIZER' />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  expect(screen.getByRole('button', { name: 'Reopen Event' })).toBeVisible();
  await user.type(screen.getByLabelText('New start (UTC)'), '2027-01-01T10:00');
  await user.click(screen.getByRole('button', { name: 'Reschedule Event' }));
  await waitFor(() => expect(mutation).toHaveBeenCalled());
  expect(mutation.mock.calls[0][1]).toMatchObject({
    action: 'reschedule',
    startsAt: Date.parse('2027-01-01T10:00Z'),
    endsAt: null,
  });
});
