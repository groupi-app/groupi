import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation, useQuery } from 'convex/react';
import { DelegatedConsent } from './delegated-consent';
vi.mock('@/convex/_generated/api', () => ({
  api: {
    delegatedApps: {
      queries: { getConsentRequest: 'request' },
      mutations: { approveConsent: 'approve', denyConsent: 'deny' },
    },
  },
}));
it('requires explicit background consent and shows the instance, account, app and bounds', async () => {
  vi.mocked(useQuery).mockReturnValue({
    interactionId: 'i-1',
    instance: 'https://groupi.example',
    appId: 'app-1',
    appName: 'Calendar',
    purpose: 'Show events',
    requestedScopes: ['openid', 'events.read', 'offline_access'],
    requestedActions: ['events.read'],
    account: { displayName: 'Alice' },
    events: [{ _id: 'e-1', title: 'Dinner' }],
    expiresAt: Date.now() + 60000,
  });
  const approve = vi.fn().mockRejectedValue(new Error('Interaction expired'));
  vi.mocked(useMutation).mockReturnValue(approve as never);
  const user = userEvent.setup();
  render(<DelegatedConsent interactionId='i-1' />);
  expect(screen.getByText('https://groupi.example')).toBeInTheDocument();
  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'Connect Calendar' })
  ).toBeInTheDocument();
  expect(screen.getByLabelText('Allow background access')).not.toBeChecked();
  await user.click(screen.getByLabelText('Read events'));
  await user.click(screen.getByLabelText('Dinner'));
  await user.click(screen.getByRole('button', { name: 'Allow access' }));
  expect(approve).toHaveBeenCalledWith({
    interactionId: 'i-1',
    actions: ['events.read'],
    selector: { kind: 'selected', eventIds: ['e-1'] },
    background: false,
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Interaction expired'
  );
});
