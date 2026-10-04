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
  reviewPage: [] as Record<string, unknown>[],
  canApply: true,
  canReview: false,
  pending: null as null | Record<string, unknown>,
  pathname: '/event/event-123/preview',
  entryAction: 'JOIN',
  admissionPolicy: 'DIRECT',
  role: 'ORGANIZER',
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
          if (name === 'eventApplications/queries:getForm')
            return {
              settings: {
                questions: [
                  {
                    id: 'why',
                    label: 'Why join?',
                    type: 'SHORT_ANSWER',
                    required: true,
                  },
                ],
                reviewerPolicy: 'ORGANIZERS_AND_MODERATORS',
              },
              pending: network.pending,
              canApply: network.canApply,
              canReview: network.canReview,
            };
          if (
            name === 'eventApplications/queries:history' ||
            name === 'eventApplications/queries:list'
          )
            return {
              page: name.endsWith(':list') ? network.reviewPage : [],
              isDone: false,
              continueCursor: 'page-two',
            };
          return name === 'events/queries:getEventLogistics'
            ? logistics()
            : name === 'events/queries:getEventHeader'
              ? { userMembership: { role: network.role } }
              : name === 'events/queries:getDiscoverableEvents'
                ? []
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
    visibility: 'PUBLIC',
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
    network.reviewPage = [];
    network.canApply = true;
    network.canReview = false;
    network.pending = null;
    network.queryError = null;
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
});
