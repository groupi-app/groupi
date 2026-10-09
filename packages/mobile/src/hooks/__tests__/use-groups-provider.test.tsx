import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { createElement, act, useEffect, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';

// Use the renderer already installed by the native testing-library dependency.
const require = createRequire(import.meta.url);
const renderer = require(
  require.resolve('react-test-renderer', {
    paths: [
      dirname(require.resolve('@testing-library/react-native/package.json')),
    ],
  })
) as { create: (element: ReactNode) => { unmount: () => void } };

const boundary = vi.hoisted(() => ({
  watchQuery: vi.fn(),
  mutation: vi.fn(),
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
  session: {
    data: { user: { id: 'user-123' }, session: { id: 'session-123' } },
    isPending: false,
  },
}));
vi.unmock('react');
vi.unmock('../../providers/convex-provider');
vi.unmock('convex/react');
vi.unmock('@groupi/shared/hooks');
vi.unmock('convex/_generated/api');
vi.unmock('@convex-dev/better-auth/react');
vi.mock('../../lib/convex', () => ({ convex: boundary }));
vi.mock('../../lib/auth-client', () => ({
  authClient: {
    useSession: () => boundary.session,
    convex: { token: async () => ({ data: null }) },
  },
}));

import { ConvexClientProvider } from '../../providers/convex-provider';
import { useCreateGroup, useGroups } from '../use-groups';

describe('production native Group provider binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    boundary.watchQuery.mockReturnValue({
      localQueryResult: () => ({
        page: [{ _id: 'group-123', name: 'Reading club' }],
        isDone: true,
        continueCursor: '',
      }),
      onUpdate: () => () => {},
      journal: () => undefined,
    });
    boundary.mutation.mockResolvedValue('group-456');
    boundary.setAuth.mockImplementation((_fetchToken, onChange) => {
      onChange(true);
    });
  });

  it('reads and creates Groups through the real native provider and app SDK', async () => {
    let result: ReturnType<typeof useGroups>;
    let createGroup: ReturnType<typeof useCreateGroup> | undefined;
    function Probe() {
      const groups = useGroups();
      const create = useCreateGroup();
      useEffect(() => {
        result = groups;
        createGroup = create;
      }, [groups, create]);
      return null;
    }
    let mounted: ReturnType<typeof renderer.create> | undefined;
    await act(async () => {
      mounted = renderer.create(
        createElement(ConvexClientProvider, null, createElement(Probe))
      );
    });
    expect(result!).toEqual({
      page: [{ _id: 'group-123', name: 'Reading club' }],
      isDone: true,
      continueCursor: '',
    });
    expect(
      boundary.watchQuery.mock.calls.some(
        ([query, args]) =>
          getFunctionName(query) === 'groups/queries:listGroups' &&
          args.paginationOpts.numItems === 20 &&
          args.paginationOpts.cursor === null
      )
    ).toBe(true);
    await expect(createGroup!({ name: 'New club' })).resolves.toBe('group-456');
    const [mutation, args] = boundary.mutation.mock.calls[0];
    expect(getFunctionName(mutation)).toBe('groups/mutations:createGroup');
    expect(args).toEqual({ name: 'New club' });
    await act(async () => mounted!.unmount());
  });

  it('detects missing provider rather than allowing a mocked SDK to hide it', async () => {
    function UnprovidedProbe() {
      useGroups();
      return null;
    }
    let failure: unknown;
    try {
      await act(async () => {
        renderer.create(createElement(UnprovidedProbe));
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain(
      'Could not find Convex client'
    );
  });
});
