import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useQuery } from 'convex/react';
import { HostedError } from './hosted-error';
vi.mock('@/convex/_generated/api', () => ({
  api: { delegatedApps: { hosted: { getAppearance: 'appearance' } } },
}));
it('a browser-bound failure explains safe recovery without offering an untrusted continuation', () => {
  vi.mocked(useQuery).mockReturnValue({
    appName: 'Reading Circle',
    providerName: 'Groupi',
    expiresAt: Date.now() + 60000,
  });
  render(<HostedError interactionId='trusted' />);
  expect(
    screen.getByRole('heading', { name: 'Sign-in could not be completed' })
  ).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('original browser');
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
