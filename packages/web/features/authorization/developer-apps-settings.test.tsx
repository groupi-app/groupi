import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation, useQuery } from 'convex/react';
import { DeveloperAppsSettings } from './developer-apps-settings';
vi.mock('@/convex/_generated/api', () => ({
  api: {
    delegatedApps: {
      queries: { listOwnedApps: 'apps' },
      mutations: { registerApp: 'register', requestReview: 'review' },
    },
  },
}));
describe('developer app registration', () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockReturnValue([]);
    vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
  });
  it('shows native own-account testing and submits exact callback URIs', async () => {
    const register = vi.fn().mockResolvedValue('app-1');
    vi.mocked(useMutation).mockReturnValue(register as never);
    const user = userEvent.setup();
    render(<DeveloperAppsSettings />);
    await user.type(screen.getByLabelText('App name'), 'Calendar');
    await user.type(screen.getByLabelText('Purpose'), 'Show my event schedule');
    await user.click(screen.getByLabelText('Native app'));
    await user.type(
      screen.getByLabelText('Callback URIs'),
      'com.example.calendar:/callback'
    );
    expect(
      screen.getByText(/Only your own account can connect during testing/)
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Register app' }));
    expect(register).toHaveBeenCalledWith({
      name: 'Calendar',
      purpose: 'Show my event schedule',
      clientType: 'native',
      redirectUris: ['com.example.calendar:/callback'],
    });
    expect(
      await screen.findByText('App registered for own-account testing.')
    ).toBeInTheDocument();
  });
});

it('limits the app purpose to the registration contract of one thousand characters', async () => {
  vi.mocked(useQuery).mockReturnValue([]);
  vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
  const user = userEvent.setup();
  render(<DeveloperAppsSettings />);
  await user.type(screen.getByLabelText('Purpose'), 'a'.repeat(1001));
  expect(screen.getByLabelText('Purpose')).toHaveValue('a'.repeat(1000));
});
