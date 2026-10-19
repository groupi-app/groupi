import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { expect, it, vi } from 'vitest';
import { EventMail } from './event-mail';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
it('requires an explicit send and retries the exact Event intent after an unknown outcome', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(
    (...args: Parameters<typeof client.watchQuery>) => ({
      onUpdate: () => () => {},
      localQueryResult: () =>
        getFunctionName(args[0]) === 'groupAnnouncements/eventMail:staffEvents'
          ? [{ id: 'event-one', title: 'Reading' }]
          : null,
      journal: () => undefined,
    })
  );
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockRejectedValueOnce(new Error('Connection lost'))
    .mockResolvedValue({ result: { announcementId: 'announcement-one' } });
  const mounted = render(
    <ConvexProvider client={client}>
      <EventMail groupId={'group-one' as never} />
    </ConvexProvider>
  );
  expect(mutation).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Event you organize'), {
    target: { value: 'event-one' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Send Event announcement email' })
  );
  await screen.findByRole('alert');
  const args = mutation.mock.calls[0][1];
  expect(args).toMatchObject({
    groupId: 'group-one',
    eventId: 'event-one',
    operationId: expect.any(String),
  });
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupAnnouncements/eventMail:announce'
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Retry same Event announcement' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(mutation.mock.calls[1][1]).toEqual(args);
  mounted.unmount();
  await client.close();
});
