import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { createElement, act, type ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
const require = createRequire(import.meta.url);
const renderer = require(
  require.resolve('react-test-renderer', {
    paths: [
      dirname(require.resolve('@testing-library/react-native/package.json')),
    ],
  })
) as {
  create: (element: ReactNode) => {
    toJSON: () => unknown;
    root: {
      findAll: (
        predicate: (node: {
          props: Record<string, unknown>;
          type: unknown;
          children: unknown[];
        }) => boolean
      ) => {
        props: {
          onPress: () => void;
          onChangeText: (value: string) => void;
          disabled?: boolean;
        };
      }[];
    };
    unmount: () => void;
  };
};
const boundary = vi.hoisted(() => ({
  issue: vi.fn().mockResolvedValue({ key: 'once-only-secret' }),
  revoke: vi.fn().mockResolvedValue({ revokedAt: 123 }),
  grants: vi.fn().mockReturnValue([]),
  confirm: vi.fn(),
  success: vi.fn(),
  events: vi.fn(() => [
    { _id: 'event-one', title: 'Dinner', role: 'ORGANIZER' },
  ]),
  catalog: vi.fn(() => [
    {
      action: 'events.read',
      supported: true,
      principalKinds: ['user', 'integration'],
    },
  ]),
}));
vi.unmock('react');
vi.unmock('@groupi/shared/hooks');
vi.mock('../ui/confirm-dialog', () => ({
  showConfirmDialog: boundary.confirm,
}));
vi.mock('@groupi/shared/platform', () => ({
  toast: { success: boundary.success, error: vi.fn() },
}));
vi.mock('expo-clipboard', () => ({ setStringAsync: vi.fn() }));
vi.mock('../../hooks/use-authorization', () => ({
  useAuthorizationGrants: () => boundary.grants(),
  useAuthorizationEvents: () => boundary.events(),
  useAuthorizationCatalog: () => boundary.catalog(),
  useAuthorizationAudit: () => undefined,
  useIssueAuthorization: () => boundary.issue,
  useRevokeAuthorization: () => boundary.revoke,
}));
import { AuthorizationSection } from './authorization-section';
function textOf(node: { children: unknown[] }): string {
  return node.children
    .map(child =>
      typeof child === 'string'
        ? child
        : child && typeof child === 'object' && 'children' in child
          ? textOf(child as { children: unknown[] })
          : ''
    )
    .join('');
}

it('explains bounded key access and offers creation when no grants exist', async () => {
  let screen: ReturnType<typeof renderer.create>;
  await act(async () => {
    screen = renderer.create(createElement(AuthorizationSection));
  });
  const rendered = JSON.stringify(screen!.toJSON());
  expect(rendered).toContain('Named keys and integrations');
  expect(rendered).toContain('Create bounded key');
  expect(rendered).toContain('No bounded keys yet');
  await act(async () => screen!.unmount());
});

it('creates only explicit selected event bounds and dismisses the once-only secret', async () => {
  let screen: ReturnType<typeof renderer.create>;
  await act(async () => {
    screen = renderer.create(createElement(AuthorizationSection));
  });
  async function press(label: string) {
    const button = screen!.root.findAll(
      node => node.type === 'Pressable' && textOf(node).includes(label)
    )[0];
    await act(async () => {
      button.props.onPress();
    });
  }
  await press('Create bounded key');
  const input = screen!.root.findAll(
    node =>
      node.props.accessibilityLabel === 'Key name' &&
      typeof node.props.onChangeText === 'function'
  )[0];
  await act(async () => input.props.onChangeText('Dinner reader'));
  await press('Read events');
  await press('Dinner');
  await press('Create key');
  expect(boundary.issue).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'Dinner reader',
      principalKind: 'user',
      actions: ['events.read'],
      selector: { kind: 'selected', eventIds: ['event-one'] },
    })
  );
  expect(JSON.stringify(screen!.toJSON())).toContain('once-only-secret');
  await press('I saved my key');
  expect(JSON.stringify(screen!.toJSON())).not.toContain('once-only-secret');
  await act(async () => screen!.unmount());
});

it('shows named key bounds separately from apps and acknowledges revoke after confirmation', async () => {
  boundary.grants.mockReturnValue([
    {
      grantId: 'grant',
      appId: null,
      name: 'Dinner key',
      principalKind: 'user',
      actions: ['events.read'],
      selector: { kind: 'selected', eventIds: ['event-one'] },
      expiresAt: null,
      revokedAt: null,
    },
    {
      grantId: 'app-grant',
      appId: 'app',
      name: 'Connected app grant',
      principalKind: 'user',
      actions: ['events.read'],
      selector: { kind: 'selected', eventIds: ['event-one'] },
      expiresAt: null,
      revokedAt: null,
    },
  ]);
  let screen: ReturnType<typeof renderer.create>;
  await act(async () => {
    screen = renderer.create(createElement(AuthorizationSection));
  });
  const rendered = JSON.stringify(screen!.toJSON());
  expect(rendered).toContain('Dinner key');
  expect(rendered).toContain('Dinner');
  expect(rendered).not.toContain('Connected app grant');
  const button = screen!.root.findAll(
    node => node.type === 'Pressable' && textOf(node) === 'Revoke key'
  )[0];
  await act(async () => button.props.onPress());
  expect(boundary.revoke).not.toHaveBeenCalled();
  const confirmation = boundary.confirm.mock.calls[0][0];
  expect(confirmation.message).toContain('already completed are not undone');
  await act(async () => confirmation.onConfirm());
  expect(boundary.revoke).toHaveBeenCalledWith({ grantId: 'grant' });
  expect(boundary.success).toHaveBeenCalledWith('Key revoked');
  await act(async () => screen!.unmount());
  boundary.grants.mockReturnValue([]);
});

it('allows identity-only user keys without events and keeps event actions bounded', async () => {
  boundary.events.mockReturnValue([]);
  boundary.catalog.mockReturnValue([
    {
      action: 'identity.display-name',
      supported: true,
      principalKinds: ['user'],
    },
    {
      action: 'events.read',
      supported: true,
      principalKinds: ['user', 'integration'],
    },
  ]);
  let screen: ReturnType<typeof renderer.create>;
  await act(async () => {
    screen = renderer.create(createElement(AuthorizationSection));
  });
  const button = (label: string) =>
    screen!.root.findAll(
      node => node.type === 'Pressable' && textOf(node) === label
    )[0];
  try {
    await act(async () => button('Create bounded key').props.onPress());
    const input = screen!.root.findAll(
      node =>
        node.props.accessibilityLabel === 'Key name' &&
        typeof node.props.onChangeText === 'function'
    )[0];
    await act(async () => input.props.onChangeText('Identity reader'));
    await act(async () => button('Read events').props.onPress());
    expect(button('Create key').props.disabled).toBe(true);
    await act(async () => button('Integration').props.onPress());
    await act(async () => button('Read events').props.onPress());
    expect(button('Create key').props.disabled).toBe(true);
    await act(async () => button('My account').props.onPress());
    await act(async () => button('Read your display name').props.onPress());
    expect(button('Create key').props.disabled).toBe(false);
    await act(async () => button('Create key').props.onPress());
    expect(boundary.issue).toHaveBeenCalledWith(
      expect.objectContaining({
        principalKind: 'user',
        actions: ['identity.display-name'],
        selector: { kind: 'selected', eventIds: [] },
      })
    );
  } finally {
    await act(async () => screen!.unmount());
    boundary.events.mockReturnValue([
      { _id: 'event-one', title: 'Dinner', role: 'ORGANIZER' },
    ]);
    boundary.catalog.mockReturnValue([
      {
        action: 'events.read',
        supported: true,
        principalKinds: ['user', 'integration'],
      },
    ]);
  }
});
