import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { getFunctionName } from 'convex/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire(import.meta.url);
interface Node {
  type: unknown;
  props: Record<string, unknown>;
}
interface Mounted {
  root: { findAll: (test: (node: Node) => boolean) => Node[] };
  update: (element: ReactNode) => void;
  unmount: () => void;
}
const renderer = require(
  require.resolve('react-test-renderer', {
    paths: [
      dirname(require.resolve('@testing-library/react-native/package.json')),
    ],
  })
) as { create: (element: ReactNode) => Mounted };
const external = vi.hoisted(() => ({
  canManage: true,
  friends: false,
  audiences: [] as Record<string, unknown>[],
  groups: [] as Record<string, unknown>[],
  events: [] as Record<string, unknown>[],
  loading: false,
  error: false,
  watches: vi.fn(),
  mutation: vi.fn(),
  push: vi.fn(),
  subscribers: new Set<() => void>(),
}));
vi.unmock('react');
vi.unmock('convex/react');
vi.unmock('convex/_generated/api');
vi.unmock('@groupi/shared/hooks');
vi.unmock('@convex-dev/better-auth/react');
vi.unmock('../../providers/convex-provider');
vi.mock('uniwind', () => ({
  withUniwind: (component: unknown) => component,
  useCSSVariable: () => 'transparent',
}));
vi.mock('expo-router', () => ({
  router: { push: external.push, back: vi.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ groupId: 'group-123', eventId: 'event-123' }),
}));
vi.mock('../../lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: { user: { id: 'user-123' }, session: { id: 'session-123' } },
      isPending: false,
    }),
    convex: { token: async () => ({ data: null }) },
  },
}));
vi.mock('../../lib/convex', () => ({
  convex: {
    watchQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      const name = getFunctionName(ref);
      external.watches(name, args);
      return {
        localQueryResult: () => {
          if (external.error) throw new Error('Private denied reason');
          if (external.loading) return undefined;
          return name.endsWith(':getEventAudiences')
            ? {
                eventId: 'event-123',
                friendsShared: external.canManage ? external.friends : null,
                canManageEvent: external.canManage,
                groups: external.audiences,
              }
            : name.endsWith(':listGroupSharedEvents')
              ? { page: external.events, isDone: false, continueCursor: 'next' }
              : name.endsWith(':listGroups')
                ? {
                    page: external.groups,
                    isDone: false,
                    continueCursor: 'next',
                  }
                : undefined;
        },
        onUpdate: (listener: () => void) => {
          external.subscribers.add(listener);
          return () => external.subscribers.delete(listener);
        },
        journal: () => undefined,
      };
    },
    mutation: (ref: Parameters<typeof getFunctionName>[0], args: unknown) =>
      external.mutation(getFunctionName(ref), args),
    setAuth: (_fetch: unknown, changed: (value: boolean) => void) =>
      changed(true),
    clearAuth: vi.fn(),
  },
}));
import { ConvexClientProvider } from '../../providers/convex-provider';
import { EventAudienceSettingsScreen } from '../events/event-audience-settings';
import { GroupSharedEventsScreen } from './group-shared-events-screen';
import { GroupEventSharingPolicy } from './group-event-sharing-policy';
function screen(component: () => ReactNode) {
  return createElement(ConvexClientProvider, null, createElement(component));
}
function control(m: Mounted, label: string) {
  return m.root.findAll(
    n => n.type === 'Pressable' && n.props.accessibilityLabel === label
  )[0];
}
async function press(m: Mounted, label: string) {
  await act(async () => {
    await (control(m, label).props.onPress as () => Promise<void>)();
  });
}
function texts(m: Mounted) {
  return m.root.findAll(n => n.type === 'Text').map(n => n.props.children);
}
async function notify() {
  await act(async () => {
    for (const listener of external.subscribers) listener();
  });
}
const event = {
  _id: 'event-123',
  title: 'Park picnic',
  description: 'Bring lunch',
  location: 'Riverside park',
  timezone: 'America/New_York',
  chosenDateTime: null,
};
describe('native Group Event audiences via production SDK and provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    external.canManage = true;
    external.friends = false;
    external.audiences = [];
    external.groups = [
      { _id: 'group-123', name: 'Book club', canShareEvents: true },
      { _id: 'group-456', name: 'Onboarding needed', canShareEvents: false },
    ];
    external.events = [];
    external.loading = false;
    external.error = false;
    external.mutation.mockResolvedValue({ shared: true });
  });
  it('selects whole eligible Groups and Friends through typed Organizer actions without joining anyone', async () => {
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(EventAudienceSettingsScreen));
    });
    expect(control(m!, 'Share Event with Onboarding needed')).toBeUndefined();
    await press(m!, 'Share Event with Book club');
    expect(external.mutation).toHaveBeenCalledWith(
      'groupEventAudiences/mutations:shareEventWithGroup',
      { eventId: 'event-123', groupId: 'group-123' }
    );
    await press(m!, 'Share Event with Friends');
    expect(external.mutation).toHaveBeenCalledWith(
      'groupEventAudiences/mutations:setEventFriendsAudience',
      { eventId: 'event-123', enabled: true }
    );
    expect(
      external.mutation.mock.calls.every(([name]) =>
        name.startsWith('groupEventAudiences/')
      )
    ).toBe(true);
    await press(m!, 'Next audience Groups page');
    expect(external.watches).toHaveBeenCalledWith('groups/queries:listGroups', {
      paginationOpts: { cursor: 'next', numItems: 10 },
    });
    await act(async () => m!.unmount());
  });
  it('lets a Group manager withdraw only visible authorized grants without Organizer controls', async () => {
    external.canManage = false;
    external.audiences = [
      { groupId: 'group-123', name: 'Book club', canWithdraw: true },
      { groupId: 'group-456', name: 'Other audience', canWithdraw: false },
    ];
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(EventAudienceSettingsScreen));
    });
    expect(control(m!, 'Share Event with Friends')).toBeUndefined();
    expect(control(m!, 'Withdraw audience Other audience')).toBeUndefined();
    expect(external.watches.mock.calls.map(([name]) => name)).not.toContain(
      'groups/queries:listGroups'
    );
    await press(m!, 'Withdraw audience Book club');
    expect(external.mutation).toHaveBeenCalledWith(
      'groupEventAudiences/mutations:withdrawGroupEventAudience',
      { eventId: 'event-123', groupId: 'group-123' }
    );
    await act(async () => m!.unmount());
  });
  it('reflects current eligibility and sharing updates instead of local inferred permission', async () => {
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(EventAudienceSettingsScreen));
    });
    external.groups = [
      { _id: 'group-123', name: 'Book club', canShareEvents: false },
    ];
    await notify();
    expect(control(m!, 'Share Event with Book club')).toBeUndefined();
    external.audiences = [
      { groupId: 'group-123', name: 'Book club', canWithdraw: true },
    ];
    external.friends = true;
    await notify();
    expect(
      control(m!, 'Share Event with Friends').props.accessibilityState
    ).toMatchObject({ checked: true });
    expect(texts(m!)).toContain('Already shared');
    await act(async () => m!.unmount());
  });
  it('shows generic conflict recovery for rejected sharing without claiming success', async () => {
    external.mutation.mockRejectedValue(new Error('Private ban explanation'));
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(EventAudienceSettingsScreen));
    });
    await press(m!, 'Share Event with Book club');
    expect(texts(m!)).toContain(
      'Sharing unavailable. Check your Event authority, Group permission, and onboarding.'
    );
    expect(texts(m!)).not.toContain('Private ban explanation');
    expect(texts(m!)).not.toContain('Event shared with the whole Group.');
    expect(control(m!, 'Share Event with Book club').props.disabled).toBe(
      false
    );
    await act(async () => m!.unmount());
  });
  it('uses paginated safe logistics only and opens the existing preview without admission controls', async () => {
    external.events = [
      { event, canWithdraw: false },
      {
        event: {
          ...event,
          _id: 'event-456',
          title: 'Upcoming walk',
          chosenDateTime: 1900000000000,
        },
        canWithdraw: false,
      },
    ];
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(GroupSharedEventsScreen));
    });
    expect(texts(m!)).toContain('Date not yet chosen');
    expect(texts(m!)).toContain('Riverside park');
    await press(m!, 'View logistics for Park picnic');
    expect(external.push).toHaveBeenCalledWith('/event/event-123/preview');
    expect(external.mutation).not.toHaveBeenCalled();
    expect(
      m!.root
        .findAll(n => n.type === 'Pressable')
        .map(n => n.props.accessibilityLabel)
        .some(
          label => typeof label === 'string' && /join|apply|RSVP/i.test(label)
        )
    ).toBe(false);
    await press(m!, 'Next Group shared Events page');
    expect(external.watches).toHaveBeenCalledWith(
      'groupEventAudiences/queries:listGroupSharedEvents',
      { groupId: 'group-123', paginationOpts: { cursor: 'next', numItems: 10 } }
    );
    expect(
      external.watches.mock.calls.every(
        ([name]) => name === 'groupEventAudiences/queries:listGroupSharedEvents'
      )
    ).toBe(true);
    await act(async () => m!.unmount());
  });
  it('withdraws only this Group audience from the Group surface and preserves independent participation', async () => {
    external.events = [{ event, canWithdraw: true }];
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(GroupSharedEventsScreen));
    });
    await press(m!, 'Withdraw Group audience for Park picnic');
    expect(external.mutation).toHaveBeenCalledWith(
      'groupEventAudiences/mutations:withdrawGroupEventAudience',
      { eventId: 'event-123', groupId: 'group-123' }
    );
    external.events = [];
    await notify();
    expect(control(m!, 'View logistics for Park picnic')).toBeUndefined();
    expect(texts(m!)).toContain('No shared Events on this page.');
    await act(async () => m!.unmount());
  });
  it('recovers denied current onboarding/access through a mounted boundary without leaking cached logistics', async () => {
    external.error = true;
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(GroupSharedEventsScreen));
    });
    expect(texts(m!)).toContain(
      'Shared Events unavailable. Your access may have changed.'
    );
    expect(texts(m!)).not.toContain('Private denied reason');
    external.error = false;
    external.events = [{ event, canWithdraw: false }];
    await press(m!, 'Retry shared Event access');
    expect(control(m!, 'View logistics for Park picnic')).toBeDefined();
    await act(async () => m!.unmount());
  });
  it('removes cached logistics immediately when the current Group read grant is lost', async () => {
    external.events = [{ event, canWithdraw: false }];
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(GroupSharedEventsScreen));
    });
    expect(control(m!, 'View logistics for Park picnic')).toBeDefined();
    external.error = true;
    await notify();
    expect(control(m!, 'View logistics for Park picnic')).toBeUndefined();
    expect(texts(m!)).toContain(
      'Shared Events unavailable. Your access may have changed.'
    );
    await act(async () => m!.unmount());
  });
  it('configures manager-only versus eligible-member Group sharing through owner policy controls', async () => {
    let m: Mounted;
    await act(async () => {
      m = renderer.create(
        screen(() =>
          createElement(GroupEventSharingPolicy, {
            groupId: 'group-123' as never,
            policy: 'MANAGERS',
          })
        )
      );
    });
    expect(
      control(m!, 'Group managers share Events').props.accessibilityState
    ).toMatchObject({ checked: true, disabled: true });
    await press(m!, 'Eligible Group members share Events');
    expect(external.mutation).toHaveBeenCalledWith(
      'groupEventAudiences/mutations:configureGroupEventSharing',
      { groupId: 'group-123', policy: 'MEMBERS' }
    );
    await act(async () => m!.unmount());
  });
  it('renders loading without controls and keeps empty filtered pages pageable', async () => {
    external.loading = true;
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(GroupSharedEventsScreen));
    });
    expect(texts(m!)).toContain('Loading shared Events…');
    expect(control(m!, 'Next Group shared Events page')).toBeUndefined();
    external.loading = false;
    await notify();
    expect(texts(m!)).toContain('No shared Events on this page.');
    expect(control(m!, 'Next Group shared Events page')).toBeDefined();
    await act(async () => m!.unmount());
  });
});
