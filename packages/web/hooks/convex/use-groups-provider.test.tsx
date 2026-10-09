import { createRequire } from 'node:module';
import { renderHook } from '@testing-library/react';
import { ConvexProvider, ConvexReactClient, useMutation } from 'convex/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  useCreateGroup,
  useDeleteGroup,
  useGroup,
  useGroupLanding,
  useGroups,
  useUpdateGroup,
} from './use-groups';

vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');

// Resolve the SDK from the shared package, as a legacy runtime import would.
const sharedSdk = createRequire(import.meta.url)(
  '../../../shared/node_modules/convex/react'
);

describe('web Group hooks with the actual app Convex provider', () => {
  it('uses the app provider despite a distinct shared-package SDK instance', () => {
    expect(sharedSdk.useMutation).not.toBe(useMutation);
    const client = new ConvexReactClient('https://fixture.convex.cloud', {
      unsavedChangesWarning: false,
    });
    const result = { page: [], isDone: true, continueCursor: '' };
    const watch = vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
      onUpdate: () => () => {},
      localQueryResult: () => result,
      journal: () => undefined,
    }));
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexProvider client={client}>{children}</ConvexProvider>
    );
    const mounted = renderHook(
      () => ({
        groups: useGroups(),
        detail: useGroup('group-one' as Parameters<typeof useGroup>[0]),
        landing: useGroupLanding(
          'group-one' as Parameters<typeof useGroupLanding>[0]
        ),
        create: useCreateGroup(),
        update: useUpdateGroup(),
        remove: useDeleteGroup(),
      }),
      { wrapper }
    );
    expect(mounted.result.current.groups).toBe(result);
    expect(mounted.result.current.detail).toBe(result);
    expect(mounted.result.current.landing).toBe(result);
    expect(mounted.result.current.create).toBeTypeOf('function');
    expect(mounted.result.current.update).toBeTypeOf('function');
    expect(mounted.result.current.remove).toBeTypeOf('function');
    expect(watch).toHaveBeenCalled();
    mounted.unmount();
    void client.close();
  });
});
