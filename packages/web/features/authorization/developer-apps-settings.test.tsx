import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
beforeEach(() => {
  vi.stubGlobal('innerWidth', 1200);
  Reflect.deleteProperty(window, 'ontouchstart');
});
afterEach(() => vi.unstubAllGlobals());
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
    await user.click(screen.getByRole('button', { name: 'Register app' }));
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
    await user.click(screen.getByRole('button', { name: 'Register' }));
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
  await user.click(screen.getByRole('button', { name: 'Register app' }));
  const purpose = screen.getByLabelText('Purpose');
  await user.click(purpose);
  await user.paste('a'.repeat(1001));
  expect(purpose).toHaveValue('a'.repeat(1000));
  await user.type(purpose, 'b');
  expect(purpose).toHaveValue('a'.repeat(1000));
});

it('lets a rejected app owner request another review while remaining in own-account testing', async () => {
  vi.mocked(useQuery).mockReturnValue([
    {
      _id: 'app-1',
      name: 'Calendar',
      purpose: 'Read my schedule',
      clientType: 'native',
      redirectUris: ['com.example.calendar:/callback'],
      status: 'testing',
      reviewStatus: 'rejected',
    },
  ]);
  const request = vi.fn().mockResolvedValue(null);
  vi.mocked(useMutation).mockReturnValue(request as never);
  const user = userEvent.setup();
  render(<DeveloperAppsSettings />);
  await user.click(
    screen.getByRole('button', { name: 'Actions for Calendar' })
  );
  await user.click(
    await screen.findByRole('menuitem', { name: 'Request another review' })
  );
  expect(request).toHaveBeenCalledWith({ appId: 'app-1' });
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Review requested'
  );
});

it('retains registration input and exposes a failed registration inside the dialog', async () => {
  vi.mocked(useQuery).mockReturnValue([]);
  const register = vi.fn().mockRejectedValue(Error('Registration rejected'));
  vi.mocked(useMutation).mockReturnValue(register as never);
  const user = userEvent.setup();
  render(<DeveloperAppsSettings />);
  await user.click(screen.getByRole('button', { name: 'Register app' }));
  await user.type(screen.getByLabelText('App name'), 'Retained draft');
  await user.type(screen.getByLabelText('Purpose'), 'Personal schedule');
  await user.click(screen.getByLabelText('Native app'));
  await user.type(
    screen.getByLabelText('Callback URIs'),
    'com.example.schedule:/callback'
  );
  await user.click(screen.getByRole('button', { name: 'Register' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Registration rejected'
  );
  expect(screen.getByLabelText('App name')).toHaveValue('Retained draft');
  expect(screen.getByLabelText('Callback URIs')).toHaveValue(
    'com.example.schedule:/callback'
  );
});
it('hides review requests for approved apps while retaining Details and Copy ID', async () => {
  vi.mocked(useQuery).mockReturnValue([
    {
      _id: 'app-approved',
      name: 'Approved app',
      purpose: 'Read schedule',
      status: 'approved',
      reviewStatus: 'approved',
      redirectUris: ['https://example.invalid/callback'],
    },
  ]);
  vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
  const user = userEvent.setup();
  render(<DeveloperAppsSettings />);
  await user.click(
    screen.getByRole('button', { name: 'Actions for Approved app' })
  );
  expect(
    await screen.findByRole('menuitem', { name: 'Copy ID' })
  ).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Details' })).toBeInTheDocument();
  expect(
    screen.queryByRole('menuitem', { name: /Request.*review/ })
  ).not.toBeInTheDocument();
});

it.each([1200, 320, 375, 390])(
  'restores keyboard focus after registration dismissal at %ipx without registering',
  async width => {
    vi.stubGlobal('innerWidth', width);
    vi.mocked(useQuery).mockReturnValue([]);
    const register = vi.fn();
    vi.mocked(useMutation).mockReturnValue(register as never);
    const user = userEvent.setup();
    render(<DeveloperAppsSettings />);
    const trigger = screen.getByRole('button', { name: 'Register app' });
    trigger.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('dialog', { name: 'Register app' });
    await user.type(screen.getByLabelText('App name'), 'Retained draft');
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.keyboard('{Enter}');
    expect(await screen.findByLabelText('App name')).toHaveValue(
      'Retained draft'
    );
    expect(register).not.toHaveBeenCalled();
  }
);
