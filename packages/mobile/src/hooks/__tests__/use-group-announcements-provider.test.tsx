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
) as {
  create: (element: ReactNode) => {
    unmount: () => void;
    root: {
      findByProps: (props: Record<string, unknown>) => {
        props: Record<string, (...args: unknown[]) => unknown>;
      };
      findAllByType: (
        type: string
      ) => Array<{ props: Record<string, unknown> }>;
    };
  };
};

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

vi.mock('react-native', () => ({ View: 'View' }));
vi.mock('../../components/ui/text', () => ({ Text: 'Text' }));
vi.mock('../../components/ui/input', () => ({ Input: 'Input' }));
vi.mock('../../components/ui/button', () => ({ Button: 'Button' }));
import { GroupAnnouncementComposer } from '../../components/groups/group-announcement-composer';
import { ConvexClientProvider } from '../../providers/convex-provider';
import {
  useSendAnnouncement,
  useAnnouncement,
} from '../use-group-announcements';

describe('production native Group announcement provider binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    boundary.watchQuery.mockReturnValue({
      localQueryResult: () => ({
        announcementId: 'announcement-123',
        state: 'PROCESSING',
        notified: 0,
        skipped: 0,
      }),
      onUpdate: () => () => {},
      journal: () => undefined,
    });
    boundary.mutation.mockResolvedValue({
      announcementId: 'announcement-123',
      state: 'PROCESSING',
      notified: 0,
      skipped: 0,
    });
    boundary.setAuth.mockImplementation((_fetchToken, onChange) => {
      onChange(true);
    });
  });

  it('reads status and sends announcements through the real native provider and app SDK', async () => {
    let result: ReturnType<typeof useAnnouncement>;
    let createGroup: ReturnType<typeof useSendAnnouncement> | undefined;
    function Probe() {
      const groups = useAnnouncement('group-123' as never, 'request-123');
      const create = useSendAnnouncement();
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
      announcementId: 'announcement-123',
      state: 'PROCESSING',
      notified: 0,
      skipped: 0,
    });
    expect(
      boundary.watchQuery.mock.calls.some(
        ([query, args]) =>
          getFunctionName(query) ===
            'groupAnnouncements/queries:getAnnouncement' &&
          args.groupId === 'group-123' &&
          args.requestId === 'request-123'
      )
    ).toBe(true);
    await expect(
      createGroup!({
        groupId: 'group-123' as never,
        requestId: 'request-123',
        title: 'Reading',
        message: 'Bring a book',
      })
    ).resolves.toEqual({
      announcementId: 'announcement-123',
      state: 'PROCESSING',
      notified: 0,
      skipped: 0,
    });
    const [mutation, args] = boundary.mutation.mock.calls[0];
    expect(getFunctionName(mutation)).toBe(
      'groupAnnouncements/mutations:sendAnnouncement'
    );
    expect(args).toEqual({
      groupId: 'group-123',
      requestId: 'request-123',
      title: 'Reading',
      message: 'Bring a book',
    });
    await act(async () => mounted!.unmount());
  });

  it('detects missing provider rather than allowing a mocked SDK to hide it', async () => {
    function UnprovidedProbe() {
      useAnnouncement('group-123' as never, 'request-123');
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

it('native accessible composer explicitly sends through the production provider', async () => {
  boundary.watchQuery.mockReturnValue({
    localQueryResult: () => null,
    onUpdate: () => () => {},
    journal: () => undefined,
  });
  boundary.mutation.mockClear();
  let mounted: ReturnType<typeof renderer.create> | undefined;
  await act(async () => {
    mounted = renderer.create(
      createElement(
        ConvexClientProvider,
        null,
        createElement(GroupAnnouncementComposer, {
          groupId: 'group-123' as never,
        })
      )
    );
  });
  expect(boundary.mutation).not.toHaveBeenCalled();
  await act(async () => {
    mounted!.root
      .findByProps({ accessibilityLabel: 'Announcement title' })
      .props.onChangeText('Reading');
    mounted!.root
      .findByProps({ accessibilityLabel: 'Announcement message' })
      .props.onChangeText('Bring a book');
  });
  const send = mounted!.root
    .findAllByType('Button')
    .find(button => button.props.disabled === false);
  expect(send).toBeTruthy();
  await act(async () => {
    await (send!.props.onPress as () => Promise<void>)();
  });
  expect(getFunctionName(boundary.mutation.mock.calls[0][0])).toBe(
    'groupAnnouncements/mutations:sendAnnouncement'
  );
  expect(boundary.mutation.mock.calls[0][1]).toMatchObject({
    title: 'Reading',
    message: 'Bring a book',
    requestId: expect.stringMatching(/^\d{13}\./),
  });
  await act(async () => mounted!.unmount());
});
