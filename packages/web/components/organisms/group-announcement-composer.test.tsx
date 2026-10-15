import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { expect, it, vi } from 'vitest';
import { GroupAnnouncementComposer } from './group-announcement-composer';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
vi.unmock('@groupi/shared/hooks');
it('uses accessible explicit composer through actual provider and preserves same body/key after unknown outcome', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    localQueryResult: () => null,
    journal: () => undefined,
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockRejectedValueOnce(new Error('Connection lost'))
    .mockResolvedValue({
      announcementId: 'a',
      state: 'PROCESSING',
      notified: 0,
      skipped: 0,
    });
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupAnnouncementComposer groupId={'group-one' as never} />
    </ConvexProvider>
  );
  expect(mutation).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Announcement title'), {
    target: { value: 'Reading' },
  });
  fireEvent.change(screen.getByLabelText('Announcement message'), {
    target: { value: 'Bring a book' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send announcement' }));
  await screen.findByRole('alert');
  const args = mutation.mock.calls[0][1];
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupAnnouncements/mutations:sendAnnouncement'
  );
  expect(args).toMatchObject({
    groupId: 'group-one',
    title: 'Reading',
    message: 'Bring a book',
    requestId: expect.stringMatching(/^\d{13}\./),
  });
  expect(screen.getByLabelText('Announcement title')).toBeDisabled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Retry same announcement' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(mutation.mock.calls[1][1]).toEqual(args);
  mounted.unmount();
  await client.close();
});
