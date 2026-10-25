import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { expect, it, vi } from 'vitest';
import { OwnAnnouncementPreferences } from './preferences';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
it('changes only the signed-in person preference and preserves the same opt-out intent after an uncertain response', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    localQueryResult: () => ({
      groupName: 'Community',
      subscribed: true,
      url: 'https://app.example/preferences',
    }),
    journal: () => undefined,
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockRejectedValueOnce(new Error('Connection lost'))
    .mockResolvedValue({ result: { subscribed: false } });
  const mounted = render(
    <ConvexProvider client={client}>
      <OwnAnnouncementPreferences groupId={'group-one' as never} />
    </ConvexProvider>
  );
  expect(mutation).not.toHaveBeenCalled();
  expect(
    screen.getByRole('link', { name: 'Continue to community' })
  ).toHaveAttribute('href', 'https://app.example/preferences');
  fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }));
  await screen.findByRole('alert');
  const args = mutation.mock.calls[0][1];
  expect(args).toEqual({
    groupId: 'group-one',
    subscribed: false,
    operationId: expect.any(String),
  });
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groups/announcementPreferences:updateOwn'
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Retry same preference change' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(mutation.mock.calls[1][1]).toEqual(args);
  mounted.unmount();
  await client.close();
});
