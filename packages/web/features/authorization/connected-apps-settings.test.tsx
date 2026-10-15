import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery, useMutation } from 'convex/react';
import { ConnectedAppsSettings } from './connected-apps-settings';
vi.mock('@/convex/_generated/api', () => ({
  api: {
    authorization: { queries: { eligibleEvents: 'events' } },
    delegatedApps: {
      queries: { listConnections: 'connections' },
      mutations: { disconnect: 'disconnect' },
    },
  },
}));
it('shows granted access and acknowledges disconnect with file-link limits', async () => {
  vi.mocked(useQuery).mockReturnValue([
    {
      grantId: 'grant-1',
      appName: 'Calendar',
      actions: ['events.read'],
      selector: { kind: 'selected', eventIds: ['event-1'] },
      background: true,
      createdAt: 1,
      expiresAt: null,
      status: 'active',
    },
  ]);
  vi.mocked(useMutation).mockReturnValue(
    vi.fn().mockResolvedValue(null) as never
  );
  const user = userEvent.setup();
  render(<ConnectedAppsSettings />);
  expect(screen.getByText('Read events')).toBeInTheDocument();
  expect(screen.getByText(/Background access enabled/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Disconnect Calendar' }));
  expect(screen.getByText(/signed file links/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Confirm disconnect' }));
  expect(
    await screen.findByText('App disconnected. New requests will be denied.')
  ).toBeInTheDocument();
});
