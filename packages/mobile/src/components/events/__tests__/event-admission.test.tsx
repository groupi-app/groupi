import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { getFunctionName } from 'convex/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire(import.meta.url);
interface NativeNode {
  type: unknown;
  props: Record<string, unknown>;
}
interface Mounted {
  root: { findAll: (test: (node: NativeNode) => boolean) => NativeNode[] };
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
const network = vi.hoisted(() => ({
  settingsAvailable: true,
  ownHistory: [] as Record<string, unknown>[],
  discoverEvents: [] as Record<string, unknown>[] | undefined,
  reviewPage: [] as Record<string, unknown>[],
  canApply: true,
  canReview: false,
  pending: null as null | Record<string, unknown>,
  pathname: '/event/event-123/preview',
  entryAction: 'JOIN',
  admissionPolicy: 'DIRECT',
  role: 'ORGANIZER',
  visibility: 'PUBLIC',
  applicationQueryError: null as Error | null,
  queryError: null as Error | null,
  mutation: vi.fn(),
  watches: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  subscribers: new Set<() => void>(),
}));
vi.mock('../../members/member-avatar', () => ({
  MemberAvatar: 'MemberAvatar',
}));
vi.mock('../../molecules', () => ({ LoadingState: 'LoadingState' }));
vi.mock(
  '../../templates',
  async () => await import('../../templates/list-screen-template')
);
vi.mock('uniwind', () => ({
  withUniwind: (component: unknown) => component,
  useCSSVariable: () => 'transparent',
}));
vi.unmock('react');
vi.unmock('convex/react');
vi.unmock('convex/_generated/api');
vi.unmock('@groupi/shared/hooks');
vi.unmock('@convex-dev/better-auth/react');
vi.unmock('../../../providers/convex-provider');
vi.mock('expo-router', () => ({
  router: {
    push: network.push,
    replace: network.replace,
    back: network.back,
    canGoBack: () => true,
  },
  useLocalSearchParams: () => ({ eventId: 'event-123' }),
  usePathname: () => network.pathname,
  Stack: 'Stack',
}));
vi.mock('../../../lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false }),
    convex: { token: async () => ({ data: null }) },
  },
}));
vi.mock('../../../lib/convex', () => ({
  convex: {
    watchQuery: (
      query: Parameters<typeof getFunctionName>[0],
      args: unknown
    ) => {
      const name = getFunctionName(query);
      network.watches(name, args);
      return {
        localQueryResult: () => {
          if (network.queryError && name === 'events/queries:getEventLogistics')
            throw network.queryError;
          if (
            network.applicationQueryError &&
            name.startsWith('eventApplications/')
          )
            throw network.applicationQueryError;
          if (name === 'eventApplications/queries:getForm')
            return {
              settings: network.settingsAvailable
                ? {
                    questions: [
                      {
                        id: 'why',
                        label: 'Why join?',
                        type: 'SHORT_ANSWER',
                        required: true,
                      },
                    ],
                    reviewerPolicy: 'ORGANIZERS_AND_MODERATORS',
                  }
                : null,
              pending: network.pending,
              canApply: network.canApply,
              canReview: network.canReview,
            };
          if (
            name === 'eventApplications/queries:history' ||
            name === 'eventApplications/queries:list'
          )
            return {
              page: name.endsWith(':list')
                ? network.reviewPage
                : network.ownHistory,
              isDone: false,
              continueCursor: 'page-two',
            };
          return name === 'events/queries:getEventLogistics'
            ? logistics()
            : name === 'events/queries:getEventHeader'
              ? { userMembership: { role: network.role } }
              : name === 'events/queries:getDiscoverableEvents'
                ? network.discoverEvents
                : undefined;
        },
        onUpdate: (listener: () => void) => {
          network.subscribers.add(listener);
          return () => network.subscribers.delete(listener);
        },
        journal: () => undefined,
      };
    },
    mutation: (
      reference: Parameters<typeof getFunctionName>[0],
      args: unknown
    ) => network.mutation(getFunctionName(reference), args),
    setAuth: vi.fn(),
    clearAuth: vi.fn(),
  },
}));
const logistics = () => ({
  event: {
    _id: 'event-123',
    title: 'Park picnic',
    description: 'Bring lunch',
    location: 'Riverside park',
    timezone: 'America/New_York',
    visibility: network.visibility,
    admissionPolicy: network.admissionPolicy,
    chosenDateTime: 1900000000000,
    chosenEndDateTime: 1900003600000,
    imageUrl: null,
    potentialDateTimeOptions: [],
  },
  organizer: {
    personId: 'person-123',
    name: 'Alex',
    username: 'alex',
    image: null,
  },
  entryAction: network.entryAction,
});
import { ConvexClientProvider } from '../../../providers/convex-provider';
import EventAdmissionSettingsScreen from '../../../../app/event/[eventId]/settings/admission';
import EventLayout from '../../../../app/event/[eventId]/_layout';
import DiscoverScreen from '../../../../app/(tabs)/discover';
import ApplicationScreen from '../../../../app/event/[eventId]/application';
import ApplicationsScreen from '../../../../app/event/[eventId]/applications';
import EventPreviewScreen from '../../../../app/event/[eventId]/preview';
function screen(component: () => ReactNode) {
  return createElement(ConvexClientProvider, null, createElement(component));
}
function pressable(mounted: Mounted, label: string) {
  return mounted.root.findAll(
    node => node.type === 'Pressable' && node.props.accessibilityLabel === label
  )[0];
}

describe('native safe event admission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    network.settingsAvailable = true;
    network.ownHistory = [];
    network.discoverEvents = [];
    network.reviewPage = [];
    network.canApply = true;
    network.canReview = false;
    network.pending = null;
    network.queryError = null;
    network.applicationQueryError = null;
    network.visibility = 'PUBLIC';
    network.pathname = '/event/event-123/preview';
    network.entryAction = 'JOIN';
    network.admissionPolicy = 'DIRECT';
    network.role = 'ORGANIZER';
    network.mutation.mockResolvedValue({
      success: true,
      rsvpStatus: 'PENDING',
    });
  });
  it('opens the private application route from safe logistics without joining', async () => {
    network.entryAction = 'APPLY';
    network.visibility = 'PRIVATE';
    network.admissionPolicy = 'APPLY';
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(EventPreviewScreen));
    });
    const button = pressable(mounted!, 'Apply to Park picnic');
    expect(button).toBeDefined();
    await act(async () => {
      (button.props.onPress as () => void)();
    });
    expect(network.push).toHaveBeenCalledWith('/event/event-123/application');
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => mounted!.unmount());
  });
  it('submits and paginates private history through the actual provider', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(ApplicationScreen));
    });
    const input = mounted!.root.findAll(
      node =>
        node.type === 'TextInput' &&
        node.props.accessibilityLabel === 'Why join?'
    )[0];
    await act(async () => {
      (input.props.onChangeText as (text: string) => void)('Meet neighbors');
    });
    await act(async () => {
      await (
        pressable(mounted!, 'Submit application').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledWith(
      'eventApplications/mutations:submit',
      { eventId: 'event-123', answers: { why: 'Meet neighbors' } }
    );
    await act(async () => {
      (pressable(mounted!, 'Next history page').props.onPress as () => void)();
    });
    expect(network.watches).toHaveBeenCalledWith(
      'eventApplications/queries:history',
      {
        eventId: 'event-123',
        paginationOpts: { cursor: 'page-two', numItems: 10 },
      }
    );
    expect(
      network.watches.mock.calls.every(
        ([name]) =>
          !name.includes('getEventHeader') && !name.includes('Completion')
      )
    ).toBe(true);
    await act(async () => mounted!.unmount());
  });
  it('keeps retained questions and withdrawal available after eligibility loss', async () => {
    network.canApply = false;
    network.settingsAvailable = false;
    network.pending = {
      _id: 'application-1',
      applicant: {
        name: 'Jordan',
        username: 'jordan',
        image: null,
        personId: 'person-1',
      },
      questions: [
        {
          id: 'old',
          label: 'Original question',
          type: 'SHORT_ANSWER',
          required: true,
        },
      ],
      answers: { old: 'Original answer' },
    };
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(ApplicationScreen));
    });
    expect(
      mounted!.root.findAll(
        node =>
          node.type === 'TextInput' &&
          node.props.accessibilityLabel === 'Original question'
      )[0].props.value
    ).toBe('Original answer');
    expect(pressable(mounted!, 'Update application').props.disabled).toBe(true);
    expect(
      mounted!.root.findAll(
        node =>
          node.type === 'TextInput' &&
          node.props.accessibilityLabel === 'Original question'
      )[0].props.editable
    ).toBe(false);
    await act(async () => {
      await (
        pressable(mounted!, 'Withdraw application').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledWith(
      'eventApplications/mutations:withdraw',
      { applicationId: 'application-1' }
    );
    await act(async () => mounted!.unmount());
  });
  it('does not subscribe to private reviewer answers without review permission', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(ApplicationsScreen));
    });
    expect(network.watches.mock.calls.map(([name]) => name)).not.toContain(
      'eventApplications/queries:list'
    );
    expect(pressable(mounted!, 'Next review page')).toBeUndefined();
    await act(async () => mounted!.unmount());
  });
  it('reviews retained answers with an optional reason and pages the authorized queue', async () => {
    network.canReview = true;
    network.reviewPage = [
      {
        _id: 'application-1',
        applicant: {
          name: 'Jordan',
          username: 'jordan',
          image: null,
          personId: 'person-1',
        },
        status: 'PENDING',
        questions: [
          {
            id: 'why',
            label: 'Why join?',
            type: 'SHORT_ANSWER',
            required: true,
          },
        ],
        answers: { why: 'Meet neighbors' },
        decisions: [],
      },
    ];
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(ApplicationsScreen));
    });
    const reason = mounted!.root.findAll(
      node =>
        node.type === 'TextInput' &&
        node.props.accessibilityLabel === 'Decision reason Jordan'
    )[0];
    await act(async () => {
      (reason.props.onChangeText as (text: string) => void)('Welcome');
    });
    await act(async () => {
      await (
        pressable(mounted!, 'Approve Jordan').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledWith(
      'eventApplications/mutations:decide',
      {
        applicationId: 'application-1',
        decision: 'APPROVED',
        reason: 'Welcome',
      }
    );
    await act(async () => {
      (pressable(mounted!, 'Next review page').props.onPress as () => void)();
    });
    expect(network.watches).toHaveBeenCalledWith(
      'eventApplications/queries:list',
      {
        eventId: 'event-123',
        paginationOpts: { cursor: 'page-two', numItems: 10 },
      }
    );
    await act(async () => mounted!.unmount());
  });
  it.each(['/event/event-123/application', '/event/event-123/applications'])(
    'skips member queries only on exact %s route',
    async pathname => {
      network.pathname = pathname;
      let mounted: Mounted;
      await act(async () => {
        mounted = renderer.create(screen(EventLayout));
      });
      expect(network.watches).not.toHaveBeenCalled();
      network.pathname = pathname + '/private';
      await act(async () => {
        mounted!.update(screen(EventLayout));
      });
      expect(network.watches).toHaveBeenCalledWith(
        'addons/queries:getAddonCompletionStatus',
        { eventId: 'event-123' }
      );
      await act(async () => mounted!.unmount());
    }
  );
  it('lets an Organizer enable Apply and configure separate admission questions', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(EventAdmissionSettingsScreen));
    });
    await act(async () => {
      await (
        pressable(mounted!, 'Apply for approval').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledWith(
      'events/mutations:updateAdmissionPolicy',
      { eventId: 'event-123', admissionPolicy: 'APPLY' }
    );
    const label = mounted!.root.findAll(
      node =>
        node.type === 'TextInput' &&
        node.props.accessibilityLabel === 'Question 1 label'
    )[0];
    await act(async () => {
      (label.props.onChangeText as (text: string) => void)(
        'What brings you here?'
      );
    });
    await act(async () => {
      (
        pressable(mounted!, 'Organizer only reviews').props
          .onPress as () => void
      )();
    });
    await act(async () => {
      await (
        pressable(mounted!, 'Save application settings').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledWith(
      'eventApplications/mutations:configure',
      {
        eventId: 'event-123',
        questions: [
          {
            id: 'why',
            label: 'What brings you here?',
            type: 'SHORT_ANSWER',
            required: true,
          },
        ],
        reviewerPolicy: 'ORGANIZER_ONLY',
      }
    );
    await act(async () => mounted!.unmount());
  });
  it('shows a rejected approval without claiming admission', async () => {
    network.canReview = true;
    network.reviewPage = [
      {
        _id: 'application-1',
        applicant: {
          name: 'Jordan',
          username: 'jordan',
          image: null,
          personId: 'person-1',
        },
        status: 'PENDING',
        questions: [],
        answers: {},
        decisions: [],
      },
    ];
    network.mutation.mockRejectedValue(
      new Error('Applicant is no longer eligible')
    );
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(ApplicationsScreen));
    });
    await act(async () => {
      await (
        pressable(mounted!, 'Approve Jordan').props
          .onPress as () => Promise<void>
      )();
    });
    const text = mounted!.root
      .findAll(node => node.type === 'Text')
      .map(node => node.props.children);
    expect(text).toContain('Applicant is no longer eligible');
    expect(text).not.toContain('Applicant admitted with a Pending RSVP.');
    await act(async () => mounted!.unmount());
  });
  it('returns to current Discover when a previously eligible Group join is rejected', async () => {
    network.mutation.mockRejectedValue(
      new Error('Joining is no longer available')
    );
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(EventPreviewScreen));
    });
    await act(async () => {
      await (
        pressable(mounted!, 'Join Park picnic').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.replace).not.toHaveBeenCalled();
    expect(Boolean(pressable(mounted!, 'Return to Discover'))).toBe(true);
    await act(async () => {
      (pressable(mounted!, 'Return to Discover').props.onPress as () => void)();
    });
    expect(network.replace).toHaveBeenCalledWith('/discover');
    await act(async () => mounted!.unmount());
  });
  it('reads permitted logistics with the actual native provider without admitting the reader', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(EventPreviewScreen));
    });
    expect(network.watches).toHaveBeenCalledWith(
      'events/queries:getEventLogistics',
      { eventId: 'event-123' }
    );
    expect(network.mutation).not.toHaveBeenCalled();
    expect(pressable(mounted!, 'Join Park picnic')).toBeDefined();
    const text = mounted!.root
      .findAll(node => node.type === 'Text')
      .map(node => node.props.children);
    expect(text).toContain('Bring lunch');
    expect(text).toContain('Riverside park');
    await act(async () => mounted!.unmount());
  });
  it('joins explicitly with a Pending RSVP and opens the member route only after success', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(EventPreviewScreen));
    });
    await act(async () => {
      await (
        pressable(mounted!, 'Join Park picnic').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledWith(
      'events/mutations:joinDiscoverableEvent',
      { eventId: 'event-123' }
    );
    expect(network.replace).toHaveBeenCalledWith('/event/event-123');
    await act(async () => mounted!.unmount());
  });
  it.each(['INVITATION_ONLY', 'UNAVAILABLE', 'SIGN_IN', 'MEMBER'])(
    'offers truthful %s entry without a direct-join action',
    async action => {
      network.entryAction = action;
      if (action === 'INVITATION_ONLY')
        network.admissionPolicy = 'INVITATION_ONLY';
      let mounted: Mounted;
      await act(async () => {
        mounted = renderer.create(screen(EventPreviewScreen));
      });
      expect(pressable(mounted!, 'Join Park picnic')).toBeUndefined();
      expect(network.mutation).not.toHaveBeenCalled();
      if (action === 'SIGN_IN') {
        await act(async () => {
          (
            pressable(mounted!, 'Sign in to view entry options for Park picnic')
              .props.onPress as () => void
          )();
        });
        expect(network.push).toHaveBeenCalledWith({
          pathname: '/(auth)/sign-in',
          params: { returnTo: '/event/event-123/preview' },
        });
      }
      if (action === 'MEMBER') {
        await act(async () => {
          (
            pressable(mounted!, 'Open Park picnic').props.onPress as () => void
          )();
        });
        expect(network.push).toHaveBeenCalledWith('/event/event-123');
      }
      await act(async () => mounted!.unmount());
    }
  );
  it('keeps the reader on logistics when joining is rejected at action time', async () => {
    network.mutation.mockRejectedValue(
      new Error('Joining is no longer available')
    );
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(EventPreviewScreen));
    });
    await act(async () => {
      await (
        pressable(mounted!, 'Join Park picnic').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.replace).not.toHaveBeenCalled();
    expect(
      mounted!.root
        .findAll(node => node.type === 'Text')
        .map(node => node.props.children)
    ).toContain('Joining is no longer available');
    await act(async () => mounted!.unmount());
  });
  it('allows only the Organizer to change admission independently of visibility', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(EventAdmissionSettingsScreen));
    });
    await act(async () => {
      await (
        pressable(mounted!, 'Invitation only').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledWith(
      'events/mutations:updateAdmissionPolicy',
      { eventId: 'event-123', admissionPolicy: 'INVITATION_ONLY' }
    );
    await act(async () => mounted!.unmount());
  });
  it.each(['MODERATOR', 'ATTENDEE'])(
    'keeps admission controls unavailable to %s',
    async role => {
      network.role = role;
      let mounted: Mounted;
      await act(async () => {
        mounted = renderer.create(screen(EventAdmissionSettingsScreen));
      });
      expect(pressable(mounted!, 'Invitation only')).toBeUndefined();
      expect(pressable(mounted!, 'Join directly')).toBeUndefined();
      expect(network.mutation).not.toHaveBeenCalled();
      await act(async () => mounted!.unmount());
    }
  );

  it('shows private Group and Friends reasons once, then follows reactive reason removal', async () => {
    const item = {
      eventId: 'event-123',
      title: 'Park picnic',
      organizer: null,
      description: 'Bring lunch',
      memberCount: 0,
      location: 'Riverside park',
      chosenDateTime: null,
      accessReasons: {
        friends: true,
        groups: [
          { groupId: 'group-123', name: 'Book club' },
          { groupId: 'group-456', name: 'Walking club' },
        ],
      },
      entryAction: 'JOIN',
    };
    network.discoverEvents = [item];
    let mounted: Mounted;
    let card: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(DiscoverScreen));
    });
    function currentCard() {
      const list = mounted!.root.findAll(node => node.type === 'FlatList')[0];
      expect(list.props.data as unknown[]).toHaveLength(1);
      return (
        list.props.renderItem as (args: {
          item: Record<string, unknown>;
        }) => ReactNode
      )({ item: (list.props.data as Record<string, unknown>[])[0] });
    }
    await act(async () => {
      card = renderer.create(
        createElement(ConvexClientProvider, null, currentCard())
      );
    });
    const text = () =>
      card!.root
        .findAll(node => node.type === 'Text')
        .map(node => node.props.children);
    expect(text()).toContain('Shared by a friend');
    expect(text()).toContain('Shared with Book club');
    expect(text()).toContain('Shared with Walking club');
    expect(text()).toContain('Date not yet chosen');
    network.discoverEvents = [
      {
        ...item,
        accessReasons: {
          friends: false,
          groups: [{ groupId: 'group-123', name: 'Book club' }],
        },
      },
    ];
    await act(async () => {
      for (const listener of network.subscribers) listener();
    });
    await act(async () => {
      card!.update(createElement(ConvexClientProvider, null, currentCard()));
    });
    expect(text()).not.toContain('Shared by a friend');
    expect(text()).not.toContain('Shared with Walking club');
    expect(text()).toContain('Shared with Book club');
    expect(
      network.watches.mock.calls
        .map(([name]) => name)
        .every(name => name === 'events/queries:getDiscoverableEvents')
    ).toBe(true);
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => card!.unmount());
    network.discoverEvents = [];
    await act(async () => {
      for (const listener of network.subscribers) listener();
    });
    expect(
      mounted!.root.findAll(node => node.type === 'FlatList')[0].props.data
    ).toEqual([]);
    await act(async () => mounted!.unmount());
  });
  it('describes an empty no-friends Group-capable Discover and distinguishes loading', async () => {
    network.discoverEvents = undefined;
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(DiscoverScreen));
    });
    expect(
      mounted!.root.findAll(node => node.type === 'LoadingState')
    ).toHaveLength(1);
    network.discoverEvents = [];
    await act(async () => {
      for (const listener of network.subscribers) listener();
    });
    const list = mounted!.root.findAll(node => node.type === 'FlatList')[0];
    let empty: Mounted;
    await act(async () => {
      empty = renderer.create(
        createElement(
          ConvexClientProvider,
          null,
          list.props.ListEmptyComponent as ReactNode
        )
      );
    });
    const labels = empty!.root
      .findAll(node => node.type === 'View')
      .map(node => node.props.accessibilityLabel)
      .filter(Boolean);
    expect(
      labels.some(label => String(label).includes('eligible Groups or Friends'))
    ).toBe(true);
    expect(
      labels.some(label => String(label).includes('Add more friends'))
    ).toBe(false);
    await act(async () => {
      empty!.unmount();
      mounted!.unmount();
    });
  });
  it('uses the Group-only Discover card to preview before its explicit Pending join', async () => {
    const item = {
      eventId: 'event-123',
      title: 'Park picnic',
      organizer: null,
      description: 'Bring lunch',
      memberCount: 0,
      location: 'Riverside park',
      chosenDateTime: null,
      accessReasons: {
        friends: false,
        groups: [{ groupId: 'group-123', name: 'Book club' }],
      },
      entryAction: 'JOIN',
    };
    network.discoverEvents = [item];
    let mounted: Mounted;
    let card: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(DiscoverScreen));
    });
    const list = mounted!.root.findAll(node => node.type === 'FlatList')[0];
    await act(async () => {
      card = renderer.create(
        createElement(
          ConvexClientProvider,
          null,
          (list.props.renderItem as (args: { item: typeof item }) => ReactNode)(
            { item }
          )
        )
      );
    });
    expect(pressable(card!, 'Join Park picnic')).toBeUndefined();
    await act(async () => {
      (pressable(card!, 'View Park picnic').props.onPress as () => void)();
    });
    expect(network.push).toHaveBeenCalledWith('/event/event-123/preview');
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => {
      card!.update(screen(EventPreviewScreen));
    });
    await act(async () => {
      await (
        pressable(card!, 'Join Park picnic').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledExactlyOnceWith(
      'events/mutations:joinDiscoverableEvent',
      { eventId: 'event-123' }
    );
    expect(network.replace).toHaveBeenCalledWith('/event/event-123');
    network.entryAction = 'MEMBER';
    network.discoverEvents = [];
    await act(async () => {
      for (const listener of network.subscribers) listener();
    });
    expect(pressable(card!, 'Join Park picnic')).toBeUndefined();
    expect(pressable(card!, 'Open Park picnic')).toBeDefined();
    await act(async () => {
      card!.unmount();
      mounted!.unmount();
    });
  });
  it.each(['INVITATION_ONLY', 'UNAVAILABLE', 'APPLY'])(
    'shows truthful %s card copy and no write controls before preview',
    async entryAction => {
      const item = {
        eventId: 'event-123',
        title: 'Park picnic',
        organizer: null,
        description: 'Bring lunch',
        memberCount: 0,
        location: 'Riverside park',
        chosenDateTime: null,
        accessReasons: {
          friends: false,
          groups: [{ groupId: 'group-123', name: 'Book club' }],
        },
        entryAction,
      };
      network.discoverEvents = [item];
      let mounted: Mounted;
      let card: Mounted;
      await act(async () => {
        mounted = renderer.create(screen(DiscoverScreen));
      });
      const list = mounted!.root.findAll(node => node.type === 'FlatList')[0];
      await act(async () => {
        card = renderer.create(
          createElement(
            ConvexClientProvider,
            null,
            (
              list.props.renderItem as (args: {
                item: typeof item;
              }) => ReactNode
            )({ item })
          )
        );
      });
      expect(pressable(card!, 'Join Park picnic')).toBeUndefined();
      expect(pressable(card!, 'Apply to Park picnic')).toBeUndefined();
      const text = card!.root
        .findAll(node => node.type === 'Text')
        .map(node => node.props.children);
      expect(text).toContain(
        entryAction === 'INVITATION_ONLY'
          ? 'An invitation is required to join. Sharing gives you access to Event logistics.'
          : entryAction === 'APPLY'
            ? 'View the Event preview to apply for approval.'
            : 'Read Event logistics. Joining is currently unavailable.'
      );
      expect(network.mutation).not.toHaveBeenCalled();
      await act(async () => {
        card!.unmount();
        mounted!.unmount();
      });
    }
  );
  it('does not invent access reasons for a legacy summary or bypass current unavailable admission', async () => {
    const item = {
      eventId: 'event-123',
      title: 'Park picnic',
      organizer: null,
      description: 'Bring lunch',
      memberCount: 0,
      location: 'Riverside park',
      chosenDateTime: null,
      entryAction: 'UNAVAILABLE',
    };
    network.discoverEvents = [item];
    let mounted: Mounted;
    let card: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(DiscoverScreen));
    });
    const list = mounted!.root.findAll(node => node.type === 'FlatList')[0];
    await act(async () => {
      card = renderer.create(
        createElement(
          ConvexClientProvider,
          null,
          (list.props.renderItem as (args: { item: typeof item }) => ReactNode)(
            { item }
          )
        )
      );
    });
    const text = card!.root
      .findAll(node => node.type === 'Text')
      .map(node => node.props.children);
    expect(
      text.some(
        value => typeof value === 'string' && value.startsWith('Shared with')
      )
    ).toBe(false);
    expect(text).not.toContain('Shared by a friend');
    network.entryAction = 'UNAVAILABLE';
    network.admissionPolicy = 'APPLY';
    await act(async () => {
      card!.update(screen(EventPreviewScreen));
    });
    expect(pressable(card!, 'Join Park picnic')).toBeUndefined();
    expect(pressable(card!, 'Apply to Park picnic')).toBeUndefined();
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => {
      card!.unmount();
      mounted!.unmount();
    });
  });
  it('opens Discover logistics before offering any admission action', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(DiscoverScreen));
    });
    const list = mounted!.root.findAll(node => node.type === 'FlatList')[0];
    const item = {
      eventId: 'event-123',
      title: 'Park picnic',
      organizer: null,
      description: 'Bring lunch',
      memberCount: 0,
      accessReasons: {
        friends: false,
        groups: [{ groupId: 'group-123', name: 'Book club' }],
      },
      entryAction: 'JOIN',
      location: 'Riverside park',
    };
    const card = (
      list.props.renderItem as (props: { item: typeof item }) => ReactNode
    )({ item });
    await act(async () => {
      mounted!.update(createElement(ConvexClientProvider, null, card));
    });
    await act(async () => {
      (pressable(mounted!, 'View Park picnic').props.onPress as () => void)();
    });
    expect(network.push).toHaveBeenCalledWith('/event/event-123/preview');
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => mounted!.unmount());
  });

  it('skips all member completion queries on the mounted preview layout while preserving the member route gate', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(EventLayout));
    });
    expect(mounted!.root.findAll(node => node.type === 'Stack')).toHaveLength(
      1
    );
    expect(network.watches).not.toHaveBeenCalled();
    network.pathname = '/event/event-123';
    await act(async () => {
      mounted!.update(screen(EventLayout));
    });
    expect(network.watches).toHaveBeenCalledWith(
      'addons/queries:getAddonCompletionStatus',
      { eventId: 'event-123' }
    );
    expect(mounted!.root.findAll(node => node.type === 'Stack')).toHaveLength(
      0
    );
    await act(async () => mounted!.unmount());
  });

  it('renders a safe unavailable state when the viewer logistics query rejects access', async () => {
    network.queryError = new Error('FORBIDDEN');
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(EventPreviewScreen));
    });
    const text = mounted!.root
      .findAll(node => node.type === 'Text')
      .map(node => node.props.children);
    expect(text).toContain(
      'Event unavailable. You may not have access to this event.'
    );
    expect(text).not.toContain('Park picnic');
    expect(pressable(mounted!, 'Join Park picnic')).toBeUndefined();
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => mounted!.unmount());
  });
  it('restores retained pending editing when Group eligibility returns without private member queries', async () => {
    network.settingsAvailable = false;
    network.canApply = false;
    network.pending = {
      _id: 'application-1',
      questions: [
        {
          id: 'old',
          label: 'Original question',
          type: 'SHORT_ANSWER',
          required: true,
        },
      ],
      answers: { old: 'Retained answer' },
    };
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(ApplicationScreen));
    });
    let input = mounted!.root.findAll(
      node =>
        node.type === 'TextInput' &&
        node.props.accessibilityLabel === 'Original question'
    )[0];
    expect(input.props.editable).toBe(false);
    await act(async () => {
      network.settingsAvailable = true;
      network.canApply = true;
      network.subscribers.forEach(listener => listener());
    });
    input = mounted!.root.findAll(
      node =>
        node.type === 'TextInput' &&
        node.props.accessibilityLabel === 'Original question'
    )[0];
    expect(input.props.editable).toBe(true);
    await act(async () => {
      await (
        pressable(mounted!, 'Update application').props
          .onPress as () => Promise<void>
      )();
    });
    expect(network.mutation).toHaveBeenCalledWith(
      'eventApplications/mutations:submit',
      { eventId: 'event-123', answers: { old: 'Retained answer' } }
    );
    expect(
      network.watches.mock.calls.every(([name]) =>
        [
          'eventApplications/queries:getForm',
          'eventApplications/queries:history',
        ].includes(name)
      )
    ).toBe(true);
    await act(async () => mounted!.unmount());
  });
  it('opens independent admitted Event membership after Group eligibility is lost', async () => {
    network.canApply = false;
    network.settingsAvailable = false;
    network.ownHistory = [
      {
        _id: 'approved-one',
        status: 'APPROVED',
        questions: [{ id: 'why', label: 'Why join?' }],
        answers: { why: 'Retained answer' },
        decisions: [{ status: 'APPROVED', actorId: 'organizer', at: 1 }],
      },
    ];
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(ApplicationScreen));
    });
    expect(pressable(mounted!, 'Submit application')).toBeUndefined();
    await act(async () => {
      (
        pressable(mounted!, 'Open admitted Event').props.onPress as () => void
      )();
    });
    expect(network.push).toHaveBeenCalledWith('/event/event-123');
    expect(network.mutation).not.toHaveBeenCalled();
    await act(async () => mounted!.unmount());
  });
  it('recovers a revoked review query with current authority and no private queue subscription', async () => {
    network.applicationQueryError = new Error(
      'Current Event authority required'
    );
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(ApplicationsScreen));
    });
    expect(pressable(mounted!, 'Retry applications')).toBeDefined();
    network.applicationQueryError = null;
    network.settingsAvailable = false;
    network.canReview = false;
    await act(async () => {
      (pressable(mounted!, 'Retry applications').props.onPress as () => void)();
    });
    expect(pressable(mounted!, 'Next review page')).toBeUndefined();
    expect(network.watches.mock.calls.map(([name]) => name)).not.toContain(
      'eventApplications/queries:list'
    );
    await act(async () => mounted!.unmount());
    report.mockRestore();
  });
  it('permits a stale approval retry only through the Event decision mutation and removes controls on authority loss', async () => {
    network.canReview = true;
    network.reviewPage = [
      {
        _id: 'application-1',
        applicant: { name: 'Jordan' },
        status: 'PENDING',
        questions: [],
        answers: {},
        decisions: [],
      },
    ];
    network.mutation.mockRejectedValueOnce(
      new Error('Applicant no longer has a qualifying audience')
    );
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(ApplicationsScreen));
    });
    await act(async () => {
      await (
        pressable(mounted!, 'Approve Jordan').props
          .onPress as () => Promise<void>
      )();
    });
    expect(
      mounted!.root
        .findAll(node => node.type === 'Text')
        .map(node => node.props.children)
    ).toContain('Applicant no longer has a qualifying audience');
    expect(pressable(mounted!, 'Approve Jordan').props.disabled).toBe(false);
    await act(async () => {
      await (
        pressable(mounted!, 'Approve Jordan').props
          .onPress as () => Promise<void>
      )();
    });
    expect(
      network.mutation.mock.calls.every(
        ([name]) => name === 'eventApplications/mutations:decide'
      )
    ).toBe(true);
    await act(async () => {
      network.canReview = false;
      network.settingsAvailable = false;
      network.subscribers.forEach(listener => listener());
    });
    expect(pressable(mounted!, 'Approve Jordan')).toBeUndefined();
    await act(async () => mounted!.unmount());
  });

  it('does not invent a reviewer policy when current admission settings are unavailable', async () => {
    network.settingsAvailable = false;
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(EventAdmissionSettingsScreen));
    });
    expect(
      mounted!.root
        .findAll(node => node.type === 'Text')
        .map(node => node.props.children)
    ).toContain(
      'Application settings are unavailable under your current Event authority.'
    );
    expect(pressable(mounted!, 'Add admission question')).toBeUndefined();
    expect(pressable(mounted!, 'Organizer only reviews')).toBeUndefined();
    await act(async () => mounted!.unmount());
  });
});
