import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useQuery } from 'convex/react';
import { HostedBrand } from './hosted-brand';
vi.mock('@/convex/_generated/api', () => ({
  api: { delegatedApps: { hosted: { getAppearance: 'appearance' } } },
}));
it('uses only interaction-bound registered appearance and discloses the provider', () => {
  vi.mocked(useQuery).mockReturnValue({
    appName: 'Community',
    providerName: 'Groupi',
    instance: 'https://issuer.example',
    appearance: {
      brandName: 'Red Room',
      accent: '#991b1b',
      senderName: 'Red Room',
    },
    expiresAt: Date.now() + 60000,
  });
  render(<HostedBrand interactionId='bound-interaction' />);
  expect(screen.getByRole('heading', { name: 'Red Room' })).toBeInTheDocument();
  expect(screen.getByText('Sign-in provided by Groupi')).toBeInTheDocument();
  expect(screen.getByText('Developer app: Community')).toBeInTheDocument();
  expect(useQuery).toHaveBeenCalledWith('appearance', {
    interactionId: 'bound-interaction',
  });
});
it('gives safe restart guidance when a hosted request is unavailable', () => {
  vi.mocked(useQuery).mockReturnValue(null);
  render(<HostedBrand interactionId='expired-interaction' />);
  expect(screen.getByRole('alert')).toHaveTextContent('Return to the app');
});
