import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { expect, it, vi } from 'vitest';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupDiscordSettings } from './group-discord-settings';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
it('configures a Group server with a newly created role by default', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => null,
  }));
  const action = vi.spyOn(client, 'action').mockResolvedValue({
    guildId: '123',
    guildName: 'Community',
    mode: 'role',
    generation: 1,
    status: 'active',
  });
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordSettings groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('textbox', { name: 'Discord server ID' }),
    '123'
  );
  await user.click(
    screen.getByRole('button', { name: 'Save Discord connection' })
  );
  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  expect(getFunctionName(action.mock.calls[0][0])).toBe(
    'groupDiscord/actions:configure'
  );
  expect(action.mock.calls[0][1]).toEqual({
    groupId: 'group-one',
    guildId: '123',
    mode: 'role',
  });
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Discord connection saved'
  );
  mounted.unmount();
  await client.close();
});
it('shows blocked setup guidance without offering a second configuration', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => ({
      guildId: '123',
      guildName: 'Community',
      mode: 'role',
      generation: 1,
      status: 'blocked',
      error: 'Move the bot role above the Group role.',
    }),
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordSettings groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  expect(screen.getByText(/Setup needs attention/)).toHaveTextContent(
    'Move the bot role above the Group role.'
  );
  expect(
    screen.queryByRole('button', { name: 'Save Discord connection' })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('announces pending setup accessibly while further configuration is unavailable', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => ({
      guildId: '123',
      guildName: 'Community',
      mode: 'role',
      generation: 1,
      status: 'pending',
    }),
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordSettings groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'Discord setup is in progress.'
  );
  expect(
    screen.queryByRole('button', { name: 'Save Discord connection' })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('explains membership consequences before explicitly saving a discovered server', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => null,
  }));
  const action = vi
    .spyOn(client, 'action')
    .mockImplementation(async (...args) =>
      getFunctionName(args[0]) === 'discord/actions:getAvailableGuilds'
        ? {
            available: [{ id: '123', name: 'Community', icon: null }],
            invitable: [],
          }
        : {}
    );
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordSettings groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('radio', { name: 'Server membership only' })
  );
  expect(
    screen.getByText(/may remove or ban enrolled server members/)
  ).toHaveTextContent('exclusive');
  await user.click(
    screen.getByRole('button', { name: 'Load my Discord servers' })
  );
  await user.click(
    await screen.findByRole('button', { name: 'Choose Community' })
  );
  expect(
    screen.getByRole('textbox', { name: 'Discord server ID' })
  ).toHaveValue('123');
  await user.click(
    screen.getByRole('button', { name: 'Save Discord connection' })
  );
  await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
  expect(action.mock.calls[1][1]).toEqual({
    groupId: 'group-one',
    guildId: '123',
    mode: 'membership',
  });
  mounted.unmount();
  await client.close();
});

it('shows membership permission guidance when setup is blocked', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => ({
      guildId: '123',
      guildName: 'Community',
      mode: 'membership',
      generation: 1,
      status: 'blocked',
      error: 'Missing moderation permissions.',
    }),
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordSettings groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  expect(screen.getByText(/Setup needs attention/)).toHaveTextContent(
    'Kick Members and Ban Members'
  );
  expect(
    screen.queryByRole('button', { name: 'Save Discord connection' })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
