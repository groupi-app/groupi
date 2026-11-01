import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { expect, it, vi } from 'vitest';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupDiscordConnect } from './group-discord-connect';
const auth = vi.hoisted(() => ({ linkSocial: vi.fn() }));
vi.mock('@/lib/auth-client', () => ({ authClient: auth }));
vi.mock('convex/react', async importOriginal => ({
  ...(await importOriginal<typeof import('convex/react')>()),
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));
vi.mock('@/hooks/convex/use-accounts', () => ({
  useLinkedAccounts: () => ({
    accounts: [
      {
        providerId: 'discord',
        accountId: '789012345678901234',
        username: 'river',
        displayName: 'River Reader',
        avatarUrl: 'https://cdn.discordapp.com/avatars/member/avatar.png',
      },
    ],
  }),
}));
vi.unmock('@/convex/_generated/api');

it('requires explicit Connect even when Discord identity is already linked', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => ({
      guildName: 'Community',
      mode: 'role',
      openUrl: 'https://discord.com/channels/123',
      linked: true,
      status: 'not_connected',
    }),
  }));
  const action = vi.spyOn(client, 'action').mockResolvedValue({});
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordConnect groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  expect(screen.getByText('Discord account linked')).toBeInTheDocument();
  expect(
    screen.getByText(/removes that role; you stay in the server/)
  ).toBeVisible();
  expect(action).not.toHaveBeenCalled();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Connect Discord' }));
  await waitFor(() => expect(action).toHaveBeenCalled());
  expect(getFunctionName(action.mock.calls[0][0])).toBe(
    'groupDiscord/connect:connect'
  );
  expect(action.mock.calls[0][1]).toEqual({
    groupId: 'group-one',
    consent: true,
  });
  expect(
    await screen.findByText(/Discord connection requested/)
  ).toHaveAttribute('role', 'status');
  mounted.unmount();
  await client.close();
});

it('keeps authorization failure visible and does not claim enrollment succeeded', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => ({
      guildName: 'Community',
      mode: 'role',
      openUrl: 'https://discord.com/channels/123',
      linked: false,
      status: 'not_connected',
    }),
  }));
  const action = vi
    .spyOn(client, 'action')
    .mockResolvedValue({ requiresConsent: true });
  auth.linkSocial.mockResolvedValue({
    error: { message: 'Discord authorization denied.' },
  });
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordConnect groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Connect Discord' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Discord authorization denied.'
  );
  expect(auth.linkSocial).toHaveBeenCalledWith({
    provider: 'discord',
    scopes: ['identify', 'guilds', 'guilds.join'],
    callbackURL: '/groups/group-one/settings/membership',
  });
  expect(action).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByText(/Discord connection requested/)
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});

it('shows connected access and opens the configured Discord destination', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => ({
      guildName: 'Community',
      mode: 'role',
      openUrl: 'https://discord.com/channels/123/456',
      linked: true,
      status: 'connected',
      externalException: 'Discord server owner',
    }),
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordConnect groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  expect(screen.getByRole('link', { name: 'Open Discord' })).toHaveAttribute(
    'href',
    'https://discord.com/channels/123/456'
  );
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.queryByText(/Connected to this Group/)).not.toBeInTheDocument();
  expect(
    screen.getByText('Server owner access is managed in Discord.')
  ).toBeVisible();
  expect(
    screen.queryByText(/Connect joins this server/)
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Linking your Discord account/)
  ).not.toBeInTheDocument();
  const user = userEvent.setup();
  const help = screen.getByRole('button', {
    name: 'About your Discord access',
  });
  help.focus();
  await user.keyboard('{Enter}');
  expect(
    await screen.findByText(/Externally managed access: Discord server owner/)
  ).toBeVisible();
  await user.keyboard('{Escape}');
  expect(help).toHaveFocus();
  expect(
    screen.queryByRole('button', { name: 'Connect Discord' })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});

it('identifies the linked account while required Group onboarding prevents Connect', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => ({
      guildName: 'Community',
      mode: 'role',
      openUrl: 'https://discord.com/channels/123',
      linked: true,
      linkedDiscordUserId: '789012345678901234',
      eligible: false,
      status: 'not_connected',
    }),
  }));
  const action = vi.spyOn(client, 'action').mockResolvedValue({});
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordConnect groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  expect(screen.getByText('River Reader')).toBeVisible();
  expect(screen.getByText('@river')).toBeVisible();
  expect(screen.queryByText(/789012345678901234/)).not.toBeInTheDocument();
  const connect = screen.getByRole('button', { name: 'Connect Discord' });
  expect(connect).toBeDisabled();
  expect(
    screen.getByText(/Complete required Group onboarding before connecting/)
  ).toBeInTheDocument();
  await userEvent.setup().click(connect);
  expect(action).not.toHaveBeenCalled();
  mounted.unmount();
  await client.close();
});

it('explains server removal and bans before explicitly enrolling in membership mode', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => ({
      guildName: 'Community',
      mode: 'membership',
      openUrl: 'https://discord.com/channels/123',
      linked: true,
      status: 'not_connected',
    }),
  }));
  const action = vi.spyOn(client, 'action').mockResolvedValue({});
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordConnect groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  expect(screen.getByText(/remove you from the server/)).toHaveTextContent(
    'ban'
  );
  expect(screen.queryByText(/you stay in the server/i)).not.toBeInTheDocument();
  expect(action).not.toHaveBeenCalled();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Connect Discord' }));
  await waitFor(() => expect(action).toHaveBeenCalled());
  expect(getFunctionName(action.mock.calls[0][0])).toBe(
    'groupDiscord/connect:connect'
  );
  expect(action.mock.calls[0][1]).toEqual({
    groupId: 'group-one',
    consent: true,
  });
  expect(
    await screen.findByText(/Discord connection requested/)
  ).toHaveAttribute('role', 'status');
  mounted.unmount();
  await client.close();
});
