import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { useAction, useMutation, useQuery } from 'convex/react';
import { DiscordConnect } from './discord-connect';
vi.mock('convex/react', () => ({
  useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(),
}));
vi.mock('@/convex/_generated/api', () => ({
  api: {
    delegatedApps: { hosted: { getAppearance: 'appearance' } },
    groupDiscord: {
      delegated: { inspect: 'inspect', finish: 'finish' },
      connect: { connectHosted: 'connect' },
    },
  },
}));
vi.mock('@/lib/auth-client', () => ({ authClient: { linkSocial: vi.fn() } }));
function journey(mode: 'role' | 'membership' = 'role') {
  return {
    appName: 'Calendar',
    groupId: 'group',
    generation: 1,
    status: {
      guildName: 'Community',
      mode,
      linked: true,
      linkedDiscordUserId: 'discord-member',
      eligible: true,
      status: 'pending',
      openUrl: 'https://discord.com/channels/123',
    },
  };
}
it('explains both modes and requires explicit identity confirmation before hosted Connect', async () => {
  vi.mocked(useQuery).mockReturnValue(journey('membership'));
  const connect = vi.fn().mockResolvedValue({});
  vi.mocked(useAction).mockReturnValue(connect);
  vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
  render(<DiscordConnect state='opaque-state' />);
  expect(
    screen.getByText(/Confirm your linked Discord account ID/)
  ).toHaveTextContent('discord-member');
  expect(
    screen.getByText(/Ending Group access can remove you/)
  ).toHaveTextContent('ban you');
  expect(screen.getByRole('status')).toHaveTextContent('pending');
  expect(connect).not.toHaveBeenCalled();
  await userEvent.setup().click(
    screen.getByRole('button', {
      name: 'Confirm identity and Connect Discord',
    })
  );
  expect(connect).toHaveBeenCalledWith({
    state: 'opaque-state',
    consent: true,
  });
  expect(await screen.findByText(/Connection requested/)).toHaveAttribute(
    'role',
    'status'
  );
});
it('shows cleanup and external exceptions without allowing a blocked connection', () => {
  vi.mocked(useQuery).mockReturnValue({
    ...journey(),
    status: {
      ...journey().status,
      status: 'blocked',
      cleanupPending: true,
      externalException: 'Server owner',
      error: 'Cleanup needs attention',
    },
  });
  vi.mocked(useAction).mockReturnValue(vi.fn());
  vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
  render(<DiscordConnect state='opaque-state' />);
  expect(
    screen.getByRole('button', { name: 'Confirm identity and Connect Discord' })
  ).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Cleanup needs attention'
  );
  expect(screen.getByText(/Externally managed access/)).toHaveTextContent(
    'Server owner'
  );
});
it('keeps a return progress screen while consumption invalidates the live request', async () => {
  vi.mocked(useQuery).mockReturnValue(journey());
  vi.mocked(useAction).mockReturnValue(vi.fn());
  let fail!: (error: Error) => void;
  const finish = vi.fn(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      })
  );
  vi.mocked(useMutation).mockReturnValue(finish as never);
  const mounted = render(<DiscordConnect state='opaque-state' />);
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Return to application' }));
  vi.mocked(useQuery).mockReturnValue(null);
  mounted.rerender(<DiscordConnect state='opaque-state' />);
  expect(screen.getByRole('status')).toHaveTextContent(
    'Returning to your application'
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await act(async () => {
    fail(new Error('Return unavailable'));
  });
});

it.each(['connect', 'return'] as const)(
  'replaces a cached journey with restart guidance when %s rejects an expired request',
  async operation => {
    vi.mocked(useQuery).mockReturnValue({
      ...journey(),
      status: { ...journey().status, status: 'connected' },
    });
    const rejection = new Error(
      `[CONVEX ${operation === 'connect' ? 'A(groupDiscord/connect:connectHosted)' : 'M(groupDiscord/delegated:finish)'}] [Request ID: example] Server Error\nUncaught Error: Connection request unavailable or expired.\n    at handler (../convex/groupDiscord/connect.ts:286:24)`
    );
    vi.mocked(useAction).mockReturnValue(vi.fn().mockRejectedValue(rejection));
    vi.mocked(useMutation).mockReturnValue(
      vi.fn().mockRejectedValue(rejection) as never
    );
    render(<DiscordConnect state='opaque-state' />);
    expect(screen.getByRole('status')).toHaveTextContent('connected');
    await userEvent.setup().click(
      screen.getByRole('button', {
        name:
          operation === 'connect'
            ? 'Confirm identity and Connect Discord'
            : 'Return to application',
      })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This connection request is unavailable or expired. Return to your application to start again.'
    );
    expect(screen.getByRole('alert')).not.toHaveTextContent('CONVEX');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText(/Discord access:/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Open Discord' })
    ).not.toBeInTheDocument();
  }
);

it.each(['connect', 'return'] as const)(
  'keeps the journey recoverable after an ordinary %s failure',
  async operation => {
    vi.mocked(useQuery).mockReturnValue(journey());
    const rejection = new Error(
      'Discord is temporarily unavailable. Try again.'
    );
    vi.mocked(useAction).mockReturnValue(vi.fn().mockRejectedValue(rejection));
    vi.mocked(useMutation).mockReturnValue(
      vi.fn().mockRejectedValue(rejection) as never
    );
    render(<DiscordConnect state='opaque-state' />);
    await userEvent.setup().click(
      screen.getByRole('button', {
        name:
          operation === 'connect'
            ? 'Confirm identity and Connect Discord'
            : 'Return to application',
      })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      rejection.message
    );
    expect(
      screen.getByRole('button', {
        name: 'Confirm identity and Connect Discord',
      })
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Return to application' })
    ).toBeEnabled();
  }
);
