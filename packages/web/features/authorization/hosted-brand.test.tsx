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
it('recognizes only a local bound Discord journey for existing hosted sign-in branding', async () => {
  const { hostedInteractionId } = await import('./hosted-brand');
  expect(hostedInteractionId('/oauth/discord?state=opaque')).toBe('opaque');
  expect(
    hostedInteractionId('https://evil.example/oauth/discord?state=opaque')
  ).toBeNull();
  expect(hostedInteractionId('/oauth/discord?state=one&state=two')).toBeNull();
});

it('uses compact identity without repeating the app name or adding a page heading', () => {
  vi.mocked(useQuery).mockReturnValue({
    appName: 'Community Calendar',
    providerName: 'Groupi',
    appearance: { brandName: 'Community Calendar' },
    expiresAt: Date.now() + 60000,
  });
  render(<HostedBrand interactionId='bound' compact />);
  expect(screen.getAllByText('Community Calendar')).toHaveLength(1);
  expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  expect(screen.getByText('Sign-in provided by Groupi')).toBeVisible();
  expect(screen.queryByText(/Developer app:/)).not.toBeInTheDocument();
});
it('retains distinct developer identity in compact branded journeys', () => {
  vi.mocked(useQuery).mockReturnValue({
    appName: 'Community Calendar',
    providerName: 'Groupi',
    appearance: { brandName: 'Reading Circle' },
    expiresAt: Date.now() + 60000,
  });
  render(<HostedBrand interactionId='bound' compact />);
  expect(screen.getByText('Reading Circle')).toBeVisible();
  expect(screen.getByText('Developer app: Community Calendar')).toBeVisible();
});
it('expires compact identity without a backend update', async () => {
  vi.useFakeTimers();
  try {
    vi.mocked(useQuery).mockReturnValue({
      appName: 'Community',
      providerName: 'Groupi',
      expiresAt: Date.now() + 1000,
    });
    render(<HostedBrand interactionId='expiring' compact />);
    await act(async () => {
      vi.advanceTimersByTime(1001);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Return to the app');
    expect(screen.queryByText('Community')).not.toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
