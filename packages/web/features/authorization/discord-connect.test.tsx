import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { useAction, useMutation, useQuery } from 'convex/react';
import { DiscordConnect } from './discord-connect';
const auth = vi.hoisted(() => ({ isLoading: false, isAuthenticated: true }));
vi.mock('convex/react', () => ({
  useConvexAuth: () => auth,
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
vi.mock('@/hooks/convex/use-accounts', () => ({
  useLinkedAccounts: () => ({
    accounts: [
      {
        providerId: 'discord',
        accountId: 'discord-member',
        username: 'river',
        displayName: 'River Reader',
        avatarUrl: 'https://cdn.discordapp.com/avatars/member/avatar.png',
      },
    ],
  }),
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
function mockJourney(value: unknown) {
  vi.mocked(useQuery).mockImplementation((...[query]) =>
    String(query) === 'appearance'
      ? {
          appName: 'Calendar',
          providerName: 'Groupi',
          expiresAt: Date.now() + 60000,
        }
      : value
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  auth.isAuthenticated = true;
  auth.isLoading = false;
});
it('explains both modes and requires explicit identity confirmation before hosted Connect', async () => {
  mockJourney(journey('membership'));
  const connect = vi.fn().mockResolvedValue({});
  vi.mocked(useAction).mockReturnValue(connect);
  vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
  render(<DiscordConnect state='opaque-state' />);
  expect(screen.getByText('River Reader')).toBeVisible();
  expect(screen.getByText('@river')).toBeVisible();
  expect(screen.queryByText('discord-member')).not.toBeInTheDocument();
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
  mockJourney({
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
  expect(
    screen.getByText('Server owner access is managed in Discord.')
  ).toBeVisible();
});
it('keeps a return progress screen while consumption invalidates the live request', async () => {
  mockJourney(journey());
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
  mockJourney(null);
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
    mockJourney({
      ...journey(),
      status: {
        ...journey().status,
        status: operation === 'connect' ? 'pending' : 'connected',
      },
    });
    const rejection = new Error(
      `[CONVEX ${operation === 'connect' ? 'A(groupDiscord/connect:connectHosted)' : 'M(groupDiscord/delegated:finish)'}] [Request ID: example] Server Error\nUncaught Error: Connection request unavailable or expired.\n    at handler (../convex/groupDiscord/connect.ts:286:24)`
    );
    vi.mocked(useAction).mockReturnValue(vi.fn().mockRejectedValue(rejection));
    vi.mocked(useMutation).mockReturnValue(
      vi.fn().mockRejectedValue(rejection) as never
    );
    render(<DiscordConnect state='opaque-state' />);
    if (operation === 'connect')
      expect(screen.getByRole('status')).toHaveTextContent(/pending/i);
    else expect(screen.queryByRole('status')).not.toBeInTheDocument();
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
    expect(
      screen.getByRole('heading', { level: 1, name: 'Connection unavailable' })
    ).toBeVisible();
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
    mockJourney(journey());
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

it('keeps a single page title and compact app identity when connected, with accessible optional detail', async () => {
  mockJourney({
    ...journey(),
    status: { ...journey().status, status: 'connected' },
  });
  vi.mocked(useAction).mockReturnValue(vi.fn());
  vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
  render(<DiscordConnect state='opaque-state' />);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Connect Discord'
  );
  expect(screen.getAllByText('Calendar')).toHaveLength(1);
  expect(screen.getByText('Sign-in provided by Groupi')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Open Discord' })).toHaveAttribute(
    'href',
    'https://discord.com/channels/123'
  );
  expect(
    screen.queryByRole('button', {
      name: 'Confirm identity and Connect Discord',
    })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Return to application' })
  ).toBeVisible();
  expect(screen.queryByText('Connected')).not.toBeInTheDocument();
  expect(screen.getByText('@river')).toBeVisible();
  expect(screen.queryByText(/Ending Group access/)).not.toBeInTheDocument();
  expect(
    screen.queryByText(/never your Discord credentials/)
  ).not.toBeInTheDocument();
  const user = userEvent.setup();
  const help = screen.getByRole('button', { name: 'About connecting Discord' });
  help.focus();
  await user.keyboard('{Enter}');
  expect(
    await screen.findByText(/never your Discord credentials/)
  ).toBeVisible();
  await user.keyboard('{Escape}');
  expect(help).toHaveFocus();
});
it('keeps role-removal consent visible before an explicit connection', () => {
  mockJourney(journey());
  const connect = vi.fn();
  vi.mocked(useAction).mockReturnValue(connect);
  vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
  render(<DiscordConnect state='opaque-state' />);
  expect(
    screen.getByText(/removes that role; you stay in the server/)
  ).toBeVisible();
  expect(connect).not.toHaveBeenCalled();
});
it('preserves the bound journey through sign-in without inspecting private access', () => {
  auth.isAuthenticated = false;
  mockJourney(null);
  vi.mocked(useAction).mockReturnValue(vi.fn());
  vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
  render(<DiscordConnect state='opaque-state' />);
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
    'href',
    '/sign-in?redirect=%2Foauth%2Fdiscord%3Fstate%3Dopaque-state'
  );
  expect(useQuery).toHaveBeenCalledWith('inspect', 'skip');
});

it.each([
  ['not_connected', 'Not connected'],
  ['pending', 'Connection pending'],
  ['screening', 'Membership screening'],
  ['connected', 'Connected'],
  ['blocked', 'Access needs attention'],
])(
  'presents %s access accurately with consent for every available Connect action',
  (status, label) => {
    mockJourney({ ...journey(), status: { ...journey().status, status } });
    vi.mocked(useAction).mockReturnValue(vi.fn());
    vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
    render(<DiscordConnect state='opaque-state' />);
    if (status === 'connected')
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    else expect(screen.getByRole('status')).toHaveTextContent(label);
    if (status !== 'connected') {
      expect(
        screen.getByRole('button', {
          name: 'Confirm identity and Connect Discord',
        })
      ).toBeVisible();
      expect(
        screen.getByText(/removes that role; you stay in the server/)
      ).toBeVisible();
    }
  }
);

it('presents loading within the Discord connection layout without enabling actions', () => {
  mockJourney(undefined);
  vi.mocked(useAction).mockReturnValue(vi.fn());
  vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
  render(<DiscordConnect state='opaque-state' />);
  expect(
    screen.getByRole('heading', { level: 1, name: 'Connect Discord' })
  ).toBeVisible();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Loading Discord connection…'
  );
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
