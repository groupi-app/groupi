import { expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
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
      brandName: 'Reading Circle',
      accent: '#991b1b',
      senderName: 'Reading Circle',
    },
    expiresAt: Date.now() + 60000,
  });
  render(<HostedBrand interactionId='bound-interaction' />);
  expect(
    screen.getByRole('heading', { name: 'Reading Circle' })
  ).toBeInTheDocument();
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

it('stops showing an expired interaction even without a backend update', async () => {
  vi.useFakeTimers();
  try {
    vi.mocked(useQuery).mockReturnValue({
      appName: 'Reading Circle',
      providerName: 'Groupi',
      expiresAt: Date.now() + 1000,
    });
    render(<HostedBrand interactionId='expiring' />);
    await act(async () => {
      vi.advanceTimersByTime(1001);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Return to the app');
  } finally {
    vi.useRealTimers();
  }
});
