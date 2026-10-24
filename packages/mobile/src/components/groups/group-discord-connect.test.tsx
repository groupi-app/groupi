import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { expect, it, vi } from 'vitest';
import type { Id } from 'convex/_generated/dataModel';
vi.unmock('react');
vi.unmock('convex/react');
vi.unmock('convex/_generated/api');
vi.unmock('@groupi/shared/hooks');
vi.mock('uniwind', () => ({
  withUniwind: (component: unknown) => component,
  useCSSVariable: () => 'transparent',
}));
const auth = vi.hoisted(() => ({ linkSocial: vi.fn() }));
vi.mock('../../lib/auth-client', () => ({ authClient: auth }));
import { GroupDiscordConnect } from './group-discord-connect';
const require = createRequire(import.meta.url);
interface Node {
  type: unknown;
  props: Record<string, unknown>;
}
interface Mounted {
  root: { findAll: (test: (node: Node) => boolean) => Node[] };
  unmount: () => void;
}
const renderer = require(
  require.resolve('react-test-renderer', {
    paths: [
      dirname(require.resolve('@testing-library/react-native/package.json')),
    ],
  })
) as { create: (element: ReactNode) => Mounted };
it('opens Discord screening without claiming connected access or enrolling automatically', async () => {
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
      status: 'screening',
    }),
  }));
  const action = vi.spyOn(client, 'action').mockResolvedValue({});
  let mounted!: Mounted;
  await act(async () => {
    mounted = renderer.create(
      createElement(
        ConvexProvider,
        { client },
        createElement(GroupDiscordConnect, {
          groupId: 'group-one' as Id<'groups'>,
        })
      )
    );
  });
  expect(
    mounted.root.findAll(
      n =>
        n.type === 'Pressable' && n.props.accessibilityLabel === 'Open Discord'
    )
  ).toHaveLength(1);
  expect(
    mounted.root.findAll(
      n =>
        n.type === 'Pressable' &&
        n.props.accessibilityLabel === 'Connect Discord'
    )
  ).toHaveLength(0);
  expect(
    mounted.root.findAll(
      n =>
        typeof n.props.children === 'string' &&
        n.props.children.includes('membership screening')
    ).length
  ).toBeGreaterThan(0);
  expect(action).not.toHaveBeenCalled();
  expect(
    mounted.root.findAll(
      n =>
        n.type === 'Pressable' &&
        n.props.accessibilityLabel === 'Check Discord access'
    )
  ).toHaveLength(1);
  await act(async () => mounted.unmount());
  await client.close();
});

it('requests targeted Discord consent and returns to the Group without automatically enrolling', async () => {
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
  auth.linkSocial.mockResolvedValue({});
  let mounted!: Mounted;
  await act(async () => {
    mounted = renderer.create(
      createElement(
        ConvexProvider,
        { client },
        createElement(GroupDiscordConnect, {
          groupId: 'group-one' as Id<'groups'>,
        })
      )
    );
  });
  await act(async () => {
    const connect = mounted.root.findAll(
      n =>
        n.type === 'Pressable' &&
        n.props.accessibilityLabel === 'Connect Discord'
    )[0];
    (connect.props.onPress as () => void)();
  });
  expect(action).toHaveBeenCalledTimes(1);
  expect(
    mounted.root
      .findAll(n => n.props.accessibilityRole === 'alert')
      .map(n => n.props.children)
  ).toEqual([]);
  expect(auth.linkSocial).toHaveBeenCalledWith({
    provider: 'discord',
    scopes: ['identify', 'guilds', 'guilds.join'],
    callbackURL: '/callback?returnTo=%2Fgroups%2Fgroup-one',
  });
  expect(action).toHaveBeenCalledTimes(1);
  expect(
    mounted.root.findAll(
      n =>
        typeof n.props.children === 'string' &&
        n.props.children.includes('return here and select Connect Discord')
    ).length
  ).toBeGreaterThan(0);
  await act(async () => mounted.unmount());
  await client.close();
});

it('identifies the linked account and disables Connect until required Group onboarding is complete', async () => {
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
  let mounted!: Mounted;
  await act(async () => {
    mounted = renderer.create(
      createElement(
        ConvexProvider,
        { client },
        createElement(GroupDiscordConnect, {
          groupId: 'group-one' as Id<'groups'>,
        })
      )
    );
  });
  expect(
    mounted.root.findAll(
      n =>
        n.type === 'Text' &&
        Array.isArray(n.props.children) &&
        n.props.children.join('') ===
          'Linked Discord account ID: 789012345678901234'
    ).length
  ).toBeGreaterThan(0);
  const connect = mounted.root.findAll(
    n =>
      n.type === 'Pressable' && n.props.accessibilityLabel === 'Connect Discord'
  )[0];
  expect(connect.props.disabled).toBe(true);
  expect(action).not.toHaveBeenCalled();
  await act(async () => mounted.unmount());
  await client.close();
});
