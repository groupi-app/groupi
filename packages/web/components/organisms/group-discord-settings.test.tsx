import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { beforeEach, expect, it, vi } from 'vitest';
import type { Id } from '@/convex/_generated/dataModel';
import {
  GroupDiscordSettings,
  GroupDiscordRetiredStatus,
} from './group-discord-settings';
const accountState = vi.hoisted(() => ({
  linked: undefined as boolean | undefined,
}));
vi.mock('@/hooks/convex/use-accounts', () => ({
  useHasLinkedProviders: () =>
    accountState.linked === undefined
      ? undefined
      : { discord: accountState.linked },
}));
beforeEach(() => {
  accountState.linked = undefined;
});
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
  expect(
    screen.queryByText(/Setup does not change channel permissions/)
  ).not.toBeInTheDocument();
  const help = screen.getByRole('button', {
    name: 'About Discord permissions',
  });
  help.focus();
  await user.keyboard('{Enter}');
  expect(
    await screen.findByText(/Setup does not change channel permissions/)
  ).toBeVisible();
  await user.keyboard('{Escape}');
  expect(help).toHaveFocus();
  await user.click(screen.getByText('Advanced setup'));
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
  await user.click(await screen.findByRole('button', { name: 'Community' }));
  expect(screen.getByRole('button', { name: 'Community' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
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
it('requires an explicit handback acknowledgement before disabling', async () => {
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
      status: 'active',
    }),
  }));
  const mutation = vi.spyOn(client, 'mutation').mockResolvedValue(null);
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordSettings groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  const disable = screen.getByRole('button', {
    name: 'Disable Discord connection',
  });
  await user.click(disable);
  expect(
    screen.getByRole('button', { name: 'Confirm disable' })
  ).toBeDisabled();
  await user.click(
    screen.getByRole('checkbox', { name: 'I understand Discord handback' })
  );
  await user.click(screen.getByRole('button', { name: 'Confirm disable' }));
  await waitFor(() => expect(mutation).toHaveBeenCalled());
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupDiscord/mutations:disable'
  );
  expect(mutation.mock.calls[0][1]).toEqual({
    groupId: 'group-one',
    acknowledgeHandback: true,
  });
  mounted.unmount();
  await client.close();
});

it('shows retired cleanup on the old Group link and hides unauthorized summaries', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  let visible = true;
  const watch = vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () =>
      visible
        ? {
            status: 'disabled',
            groupDeleted: true,
            cleanupPending: true,
            synchronizationError:
              'Discord bot permissions lost; cleanup pending.',
          }
        : null,
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordRetiredStatus groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'Discord bot permissions lost'
  );
  expect(watch.mock.calls[0][1]).toEqual({
    groupId: 'group-one',
    retiredOnly: true,
  });
  mounted.unmount();
  visible = false;
  const hidden = render(
    <ConvexProvider client={client}>
      <GroupDiscordRetiredStatus groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  expect(screen.queryByText('Discord handback')).not.toBeInTheDocument();
  hidden.unmount();
  await client.close();
});

it.each([false, true])(
  'refreshes metadata once for linked managers, without a Refresh control (failure: %s)',
  async failure => {
    accountState.linked = true;
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
        generation: 4,
        status: 'active',
      }),
    }));
    const action = vi.spyOn(client, 'action');
    if (failure)
      action.mockRejectedValue(new Error('Server permission changed.'));
    else action.mockResolvedValue(null);
    const mutation = vi.spyOn(client, 'mutation');
    const element = (
      <ConvexProvider client={client}>
        <GroupDiscordSettings groupId={'group-one' as Id<'groups'>} />
      </ConvexProvider>
    );
    const mounted = render(element);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    mounted.rerender(element);
    expect(getFunctionName(action.mock.calls[0][0])).toBe(
      'groupDiscord/actions:refreshMetadata'
    );
    expect(action.mock.calls[0][1]).toEqual({ groupId: 'group-one' });
    expect(mutation).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: /Refresh/ })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeVisible();
    expect(screen.queryByText(/123/)).not.toBeInTheDocument();
    if (failure)
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Server permission changed.'
      );
    mounted.unmount();
    await client.close();
  }
);
it('keeps linking in Account settings and does not auto-write when unlinked', async () => {
  accountState.linked = false;
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => null,
  }));
  const action = vi.spyOn(client, 'action');
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordSettings groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  expect(screen.getByRole('link', { name: 'Link Discord' })).toHaveAttribute(
    'href',
    '/settings/account'
  );
  expect(
    screen.getByRole('textbox', { name: 'Landing channel ID (optional)' })
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Load my Discord servers' })
  ).not.toBeInTheDocument();
  expect(action).not.toHaveBeenCalled();
  mounted.unmount();
  await client.close();
});
it('cancels handback using the keyboard and restores focus without a mutation', async () => {
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
      status: 'active',
    }),
  }));
  const mutation = vi.spyOn(client, 'mutation');
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordSettings groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  const trigger = screen.getByRole('button', {
    name: 'Disable Discord connection',
  });
  trigger.focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('alertdialog')).toBeVisible();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(mutation).not.toHaveBeenCalled();
  mounted.unmount();
  await client.close();
});

it('requests only the selected Group mode capabilities through the existing bot install flow', async () => {
  vi.stubEnv('NEXT_PUBLIC_DISCORD_CLIENT_ID', 'fixture-client');
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => null,
  }));
  const action = vi.spyOn(client, 'action');
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupDiscordSettings groupId={'group-one' as Id<'groups'>} />
    </ConvexProvider>
  );
  expect(
    new URL(
      screen.getByRole('link', { name: 'Install Bot' }).getAttribute('href')!
    ).searchParams.get('permissions')
  ).toBe('268435585');
  await userEvent
    .setup()
    .click(screen.getByRole('radio', { name: 'Server membership only' }));
  expect(
    new URL(
      screen.getByRole('link', { name: 'Install Bot' }).getAttribute('href')!
    ).searchParams.get('permissions')
  ).toBe('135');
  expect(action).not.toHaveBeenCalled();
  mounted.unmount();
  await client.close();
  vi.unstubAllEnvs();
});
