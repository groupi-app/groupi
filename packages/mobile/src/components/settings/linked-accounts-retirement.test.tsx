import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { expect, it, vi } from 'vitest';
vi.hoisted(() => {
  process.env.EXPO_PUBLIC_CONVEX_URL = 'https://fixture.convex.cloud';
});
vi.unmock('react');
vi.unmock('convex/react');
vi.unmock('convex/_generated/api');
vi.mock('@rn-primitives/separator', () => ({ Root: 'Separator' }));
vi.mock('uniwind', () => ({
  withUniwind: (component: unknown) => component,
  useCSSVariable: () => 'transparent',
}));
vi.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModal: 'BottomSheetModal',
  BottomSheetView: 'BottomSheetView',
  BottomSheetBackdrop: 'BottomSheetBackdrop',
}));
import { ActionMenuProvider } from '../ui/action-menu';
import { LinkedAccountsSection } from './linked-accounts-section';
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
    unmount: () => void;
  };
};
it('keeps retirement and recovery visible in native identity settings after unlink', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => ({
      pending: true,
      externallyManaged: true,
      error: 'Check bot permissions.',
    }),
  }));
  vi.spyOn(client, 'action').mockResolvedValue([]);
  let mounted!: ReturnType<typeof renderer.create>;
  await act(async () => {
    mounted = renderer.create(
      createElement(
        ConvexProvider,
        { client },
        createElement(
          ActionMenuProvider,
          null,
          createElement(LinkedAccountsSection)
        )
      )
    );
  });
  const displayed = JSON.stringify(mounted.toJSON());
  expect(displayed).toContain('Replacement access is blocked');
  expect(displayed).toContain('Check bot permissions.');
  expect(displayed).toContain('membership remains externally managed');
  await act(async () => mounted.unmount());
  await client.close();
});
