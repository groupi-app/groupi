import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
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
import { GroupDiscordSettings } from './group-discord-settings';
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
it('lets managers explicitly adopt a role and set a landing channel', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => null,
  }));
  const action = vi.spyOn(client, 'action').mockResolvedValue({});
  let mounted!: Mounted;
  await act(async () => {
    mounted = renderer.create(
      createElement(
        ConvexProvider,
        { client },
        createElement(GroupDiscordSettings, {
          groupId: 'group-one' as Id<'groups'>,
        })
      )
    );
  });
  function input(label: string) {
    return mounted.root.findAll(
      n => n.type === 'TextInput' && n.props.accessibilityLabel === label
    )[0];
  }
  await act(async () => {
    (input('Discord server ID').props.onChangeText as (value: string) => void)(
      '123'
    );
    (
      input('Existing role ID (optional)').props.onChangeText as (
        value: string
      ) => void
    )('456');
    (
      input('Landing channel ID (optional)').props.onChangeText as (
        value: string
      ) => void
    )('789');
  });
  await act(async () => {
    const save = mounted.root.findAll(
      n =>
        n.type === 'Pressable' &&
        n.props.accessibilityLabel === 'Save Discord connection'
    )[0];
    (save.props.onPress as () => void)();
  });
  expect(getFunctionName(action.mock.calls[0][0])).toBe(
    'groupDiscord/actions:configure'
  );
  expect(action.mock.calls[0][1]).toEqual({
    groupId: 'group-one',
    guildId: '123',
    mode: 'role',
    roleId: '456',
    landingChannelId: '789',
  });
  await act(async () => mounted.unmount());
  await client.close();
});
