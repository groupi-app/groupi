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
          type: unknown;
          props: Record<string, unknown>;
        }) => boolean
      ) => { props: { onPress: () => void } }[];
    };
    unmount: () => void;
  };
};
const boundary = vi.hoisted(() => ({
  disconnect: vi.fn().mockResolvedValue(null),
  confirm: vi.fn(),
  success: vi.fn(),
}));
vi.unmock('react');
vi.unmock('@groupi/shared/hooks');
vi.mock('@groupi/shared/platform', () => ({
  toast: { success: boundary.success, error: vi.fn() },
}));
vi.mock('../ui/confirm-dialog', () => ({
  showConfirmDialog: boundary.confirm,
}));
vi.mock('../../hooks/use-authorization', () => ({
  useConnectedApps: () => [
    {
      grantId: 'grant',
      appName: 'Calendar companion',
      actions: ['events.read'],
      selector: { kind: 'selected', eventIds: ['dinner'] },
      background: true,
      expiresAt: 2000000000000,
      status: 'active',
    },
  ],
  useAuthorizationEvents: () => [{ _id: 'dinner', title: 'Dinner' }],
  useDisconnectApp: () => boundary.disconnect,
}));
import { ConnectedAppsSection } from './connected-apps-section';
it('shows actual access bounds and explains disconnect limits before acknowledging completion', async () => {
  let screen: ReturnType<typeof renderer.create>;
  await act(async () => {
    screen = renderer.create(createElement(ConnectedAppsSection));
  });
  const rendered = JSON.stringify(screen!.toJSON());
  expect(rendered).toContain('Calendar companion');
  expect(rendered).toContain('Dinner');
  expect(rendered).toContain('Read events');
  expect(rendered).toContain('Background access allowed');
  await act(async () =>
    screen!.root.findAll(node => node.type === 'Pressable')[0].props.onPress()
  );
  expect(boundary.disconnect).not.toHaveBeenCalled();
  const confirmation = boundary.confirm.mock.calls[0][0];
  expect(confirmation.message).toContain('Previously copied data');
  expect(confirmation.message).toContain('app’s own sessions');
  await act(async () => confirmation.onConfirm());
  expect(boundary.disconnect).toHaveBeenCalledWith({ grantId: 'grant' });
  expect(boundary.success).toHaveBeenCalledWith('App disconnected');
  await act(async () => screen!.unmount());
});
